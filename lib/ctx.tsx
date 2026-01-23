import { CLIENT_ID, OKTA_ISSUER, REDIRECT_URI } from '@/config/auth';
import { useUserStore } from '@/store/useUserStore';
import React, { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { useStorageState } from './useStorageState';

const AuthContext = createContext<{
    signInWithOkta: () => Promise<void>;
    signOut: () => void;
    session?: string | null;
    isLoading: boolean;
    isSigningIn: boolean;
}>({
    signInWithOkta: async () => { },
    signOut: () => null,
    session: null,
    isLoading: false,
    isSigningIn: false,
});

// This hook can be used to access the user info.
export function useSession() {
    const value = useContext(AuthContext);
    if (process.env.NODE_ENV !== 'production') {
        if (!value) {
            throw new Error('useSession must be wrapped in a <SessionProvider />');
        }
    }

    return value;
}

export function SessionProvider({ children }: PropsWithChildren) {
    const [[isLoading, session], setSession] = useStorageState('session');
    const [isSigningIn, setIsSigningIn] = useState(false);

    useEffect(() => {
        if (session && !isLoading) {
            useUserStore.getState().hydrateUserFromToken(session).catch(console.error);
        }
    }, [session, isLoading]);

    /**
     * Simulates an Okta OIDC authentication flow.
     * In production, this would use expo-auth-session or similar to perform
     * the OAuth 2.0 Authorization Code flow with PKCE.
     */
    const signInWithOkta = async (): Promise<void> => {
        setIsSigningIn(true);

        try {
            // Simulate network call to Okta authorization server
            // In production: would call Okta's /authorize endpoint
            console.log(`[Auth] Initiating Okta OIDC flow...`);
            console.log(`[Auth] Issuer: ${OKTA_ISSUER}`);
            console.log(`[Auth] Client ID: ${CLIENT_ID}`);
            console.log(`[Auth] Redirect URI: ${REDIRECT_URI}`);

            // Simulate 1.5s network delay for token exchange
            await new Promise((resolve) => setTimeout(resolve, 1500));

            // On success, set mock JWT session token
            // In production: would receive actual access_token from Okta
            const mockAccessToken = 'mock-okta-access-token';
            setSession(mockAccessToken);

            console.log('[Auth] Successfully authenticated with Okta');
        } catch (error) {
            console.error('[Auth] Okta authentication failed:', error);
            throw error;
        } finally {
            setIsSigningIn(false);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                signInWithOkta,
                signOut: () => {
                    setSession(null);
                },
                session,
                isLoading,
                isSigningIn,
            }}>
            {children}
        </AuthContext.Provider>
    );
}
