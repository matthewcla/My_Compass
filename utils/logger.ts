// utils/logger.ts

/**
 * PII Protection Logger
 * Intercepts logs to strip Sensitive Personally Identifiable Information (SPII).
 *
 * Target Patterns:
 * - SSN: XXX-XX-XXXX
 * - DoD ID: 10-digit identifier
 * - Email: Standard email format
 */

export class SecureLogger {
  // Regex patterns
  private static SSN_REGEX = /\b\d{3}-\d{2}-\d{4}\b/g;
  private static DOD_ID_REGEX = /\b\d{10}\b/g;
  private static EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

  private static REDACTED_TEXT = '[REDACTED]';

  /**
   * Sanitizes a string by replacing PII with [REDACTED].
   */
  static sanitize(message: string): string {
    if (!message) return message;

    return message
      .replace(SecureLogger.SSN_REGEX, SecureLogger.REDACTED_TEXT)
      .replace(SecureLogger.DOD_ID_REGEX, SecureLogger.REDACTED_TEXT)
      .replace(SecureLogger.EMAIL_REGEX, SecureLogger.REDACTED_TEXT);
  }

  /**
   * Sanitizes arguments recursively.
   */
  private static sanitizeArgs(args: any[]): any[] {
    return args.map(arg => {
      if (typeof arg === 'string') {
        return SecureLogger.sanitize(arg);
      } else if (typeof arg === 'object' && arg !== null) {
        try {
            // Simple JSON serialization/deserialization to handle objects
            // This is expensive but ensures deep cleaning for the assignment context.
            // For production, a more optimized deep traversal would be better.
            const str = JSON.stringify(arg);
            const sanitized = SecureLogger.sanitize(str);
            return JSON.parse(sanitized);
        } catch (e) {
            return arg;
        }
      }
      return arg;
    });
  }

  static log(message?: any, ...optionalParams: any[]) {
    console.log(...SecureLogger.sanitizeArgs([message, ...optionalParams]));
  }

  static info(message?: any, ...optionalParams: any[]) {
    console.info(...SecureLogger.sanitizeArgs([message, ...optionalParams]));
  }

  static warn(message?: any, ...optionalParams: any[]) {
    console.warn(...SecureLogger.sanitizeArgs([message, ...optionalParams]));
  }

  static error(message?: any, ...optionalParams: any[]) {
    console.error(...SecureLogger.sanitizeArgs([message, ...optionalParams]));
  }

  /**
   * Patches the global console object to intercept all logs.
   * Call this at the entry point of the application.
   */
  static patchGlobalConsole() {
    const originalLog = console.log;
    const originalInfo = console.info;
    const originalWarn = console.warn;
    const originalError = console.error;

    console.log = (message?: any, ...optionalParams: any[]) => {
      originalLog(...SecureLogger.sanitizeArgs([message, ...optionalParams]));
    };

    console.info = (message?: any, ...optionalParams: any[]) => {
      originalInfo(...SecureLogger.sanitizeArgs([message, ...optionalParams]));
    };

    console.warn = (message?: any, ...optionalParams: any[]) => {
      originalWarn(...SecureLogger.sanitizeArgs([message, ...optionalParams]));
    };

    console.error = (message?: any, ...optionalParams: any[]) => {
      originalError(...SecureLogger.sanitizeArgs([message, ...optionalParams]));
    };
  }
}

export const logger = SecureLogger;
