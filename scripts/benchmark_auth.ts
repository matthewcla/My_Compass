
async function signInWithOktaBenchmark() {
    console.log('Starting benchmark...');
    const start = performance.now();

    // Mock constants
    const OKTA_ISSUER = 'https://dev-123456.okta.com';
    const CLIENT_ID = '0oa123456789';
    const REDIRECT_URI = 'com.example.app:/callback';

    // Logic from lib/ctx.tsx
    console.log(`[Auth] Initiating Okta OIDC flow...`);
    console.log(`[Auth] Issuer: ${OKTA_ISSUER}`);
    console.log(`[Auth] Client ID: ${CLIENT_ID}`);
    console.log(`[Auth] Redirect URI: ${REDIRECT_URI}`);

    // On success, set mock JWT session token
    const mockAccessToken = 'mock-okta-access-token';
    // setSession(mockAccessToken) -> Mocked operation
    console.log('[Auth] Successfully authenticated with Okta');

    const end = performance.now();
    console.log(`Total Execution Time: ${(end - start).toFixed(2)}ms`);
}

signInWithOktaBenchmark();
