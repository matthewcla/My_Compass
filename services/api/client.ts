import type { ApiErrorCode, ApiErrorResponse, ApiResult } from '@/types/api';
import { API_CONFIG } from '@/config/api';

// =============================================================================
// TYPES
// =============================================================================

type RequestInterceptor = (config: RequestInit & { url: string }) => RequestInit & { url: string };
type ResponseInterceptor = (response: Response) => Response;

interface HttpClientConfig {
    baseUrl: string;
    timeout: number;
    maxRetries: number;
    retryBaseDelay: number;
    getAuthToken?: () => Promise<string | null>;
}

interface RequestOptions {
    signal?: AbortSignal;
    headers?: Record<string, string>;
    params?: Record<string, string>;
}

// =============================================================================
// HELPERS
// =============================================================================

const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);

function mapStatusToErrorCode(status: number): ApiErrorCode {
    switch (status) {
        case 401: return 'UNAUTHORIZED';
        case 403: return 'FORBIDDEN';
        case 404: return 'NOT_FOUND';
        case 409: return 'CONFLICT';
        case 422: return 'VALIDATION_ERROR';
        case 429: return 'RATE_LIMITED';
        case 503: return 'SERVICE_UNAVAILABLE';
        default:
            if (status >= 500) return 'INTERNAL_ERROR';
            return 'INTERNAL_ERROR';
    }
}

function isRetryable(status: number): boolean {
    return RETRYABLE_STATUS_CODES.has(status);
}

function jitteredDelay(baseDelay: number, attempt: number): number {
    const exponential = baseDelay * Math.pow(2, attempt);
    const jitter = exponential * (0.5 + Math.random() * 0.5);
    return Math.min(jitter, 30_000); // Cap at 30s
}

function combineAbortSignals(...signals: (AbortSignal | undefined)[]): AbortSignal {
    const controller = new AbortController();
    for (const signal of signals) {
        if (!signal) continue;
        if (signal.aborted) {
            controller.abort(signal.reason);
            return controller.signal;
        }
        signal.addEventListener('abort', () => controller.abort(signal.reason), { once: true });
    }
    return controller.signal;
}

// =============================================================================
// HTTP CLIENT
// =============================================================================

export class HttpClient {
    private config: HttpClientConfig;
    private requestInterceptors: RequestInterceptor[] = [];
    private responseInterceptors: ResponseInterceptor[] = [];

    constructor(config?: Partial<HttpClientConfig>) {
        this.config = {
            baseUrl: config?.baseUrl ?? API_CONFIG.baseUrl,
            timeout: config?.timeout ?? API_CONFIG.timeout,
            maxRetries: config?.maxRetries ?? API_CONFIG.maxRetries,
            retryBaseDelay: config?.retryBaseDelay ?? API_CONFIG.retryBaseDelay,
            getAuthToken: config?.getAuthToken,
        };
    }

    addRequestInterceptor(interceptor: RequestInterceptor): void {
        this.requestInterceptors.push(interceptor);
    }

    addResponseInterceptor(interceptor: ResponseInterceptor): void {
        this.responseInterceptors.push(interceptor);
    }

    async get<T>(path: string, options?: RequestOptions): Promise<ApiResult<T>> {
        return this.request<T>('GET', path, undefined, options);
    }

    async post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<ApiResult<T>> {
        return this.request<T>('POST', path, body, options);
    }

    async put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<ApiResult<T>> {
        return this.request<T>('PUT', path, body, options);
    }

    async delete<T>(path: string, options?: RequestOptions): Promise<ApiResult<T>> {
        return this.request<T>('DELETE', path, undefined, options);
    }

    private async request<T>(
        method: string,
        path: string,
        body?: unknown,
        options?: RequestOptions,
    ): Promise<ApiResult<T>> {
        let lastError: ApiErrorResponse | null = null;

        for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
            if (attempt > 0) {
                const delay = jitteredDelay(this.config.retryBaseDelay, attempt - 1);
                await new Promise((r) => setTimeout(r, delay));
            }

            const result = await this.executeRequest<T>(method, path, body, options);

            if (result.success) return result;

            lastError = result;

            // Don't retry non-retryable errors
            if (!result.error.retryable) return result;
        }

        return lastError!;
    }

    private async executeRequest<T>(
        method: string,
        path: string,
        body?: unknown,
        options?: RequestOptions,
    ): Promise<ApiResult<T>> {
        // Build URL with query params
        let url = `${this.config.baseUrl}${path}`;
        if (options?.params) {
            const qs = new URLSearchParams(options.params).toString();
            url += `?${qs}`;
        }

        // Build headers
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...options?.headers,
        };

        // Inject auth token
        if (this.config.getAuthToken) {
            const token = await this.config.getAuthToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }

        // Build request config
        let config: RequestInit & { url: string } = {
            url,
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        };

        // Apply request interceptors
        for (const interceptor of this.requestInterceptors) {
            config = interceptor(config);
        }

        // Set up abort: combine timeout + external signal
        const timeoutController = new AbortController();
        const timeoutId = setTimeout(() => timeoutController.abort('timeout'), this.config.timeout);

        const combinedSignal = combineAbortSignals(timeoutController.signal, options?.signal);

        try {
            let response = await fetch(config.url, {
                ...config,
                signal: combinedSignal,
            });

            clearTimeout(timeoutId);

            // Apply response interceptors
            for (const interceptor of this.responseInterceptors) {
                response = interceptor(response);
            }

            // Parse response
            if (response.ok) {
                const data = await response.json();
                return data as ApiResult<T>;
            }

            // Error response
            const retryAfterHeader = response.headers.get('Retry-After');
            const retryAfterMs = retryAfterHeader ? parseInt(retryAfterHeader, 10) * 1000 : undefined;

            try {
                const errorBody = await response.json();
                if (errorBody?.error) {
                    return {
                        success: false,
                        error: {
                            ...errorBody.error,
                            retryable: errorBody.error.retryable ?? isRetryable(response.status),
                            retryAfterMs: errorBody.error.retryAfterMs ?? retryAfterMs,
                        },
                        meta: errorBody.meta,
                    };
                }
            } catch {
                // JSON parse failed, fall through
            }

            return {
                success: false,
                error: {
                    code: mapStatusToErrorCode(response.status),
                    message: `HTTP ${response.status}: ${response.statusText}`,
                    retryable: isRetryable(response.status),
                    retryAfterMs,
                },
            };
        } catch (err) {
            clearTimeout(timeoutId);

            if (err instanceof DOMException && err.name === 'AbortError') {
                const isTimeout = timeoutController.signal.aborted;
                return {
                    success: false,
                    error: {
                        code: isTimeout ? 'TIMEOUT' : 'NETWORK_ERROR',
                        message: isTimeout ? 'Request timed out' : 'Request was aborted',
                        retryable: isTimeout,
                    },
                };
            }

            return {
                success: false,
                error: {
                    code: 'NETWORK_ERROR',
                    message: err instanceof Error ? err.message : 'Network request failed',
                    retryable: true,
                },
            };
        }
    }
}

// =============================================================================
// DEFAULT INSTANCE
// =============================================================================

export const httpClient = new HttpClient();
