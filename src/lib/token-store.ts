/**
 * Module-level in-memory store for the access token.
 *
 * Why module-level and not React state?
 * - Axios interceptors run outside of React's render cycle and cannot use hooks.
 * - This is intentionally volatile: the token is lost on page refresh, which is
 *   correct — the AuthContext re-hydrates it from the NextAuth session on mount.
 * - Nothing in here is persisted to localStorage or any cookie accessible by JS.
 */

let _accessToken: string | null = null;

export const tokenStore = {
    get: (): string | null => _accessToken,
    set: (token: string | null): void => {
        _accessToken = token;
    },
};
