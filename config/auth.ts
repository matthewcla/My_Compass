/**
 * Okta OIDC Configuration
 * 
 * This file contains the configuration constants for Okta OpenID Connect authentication.
 * Replace placeholder values with actual Okta tenant information before production deployment.
 */

// Okta Issuer URL - The base URL for your Okta authorization server
export const OKTA_ISSUER = 'https://dev-navy-mock.okta.com';

// Client ID - The OAuth 2.0 client ID registered in Okta
export const CLIENT_ID = 'my-compass-client';

// Redirect URI - The deep link URI that Okta will redirect back to after authentication
export const REDIRECT_URI = 'mycompass://auth';
