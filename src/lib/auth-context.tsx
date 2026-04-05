"use client";

import { useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { tokenStore } from "./token-store";

/**
 * Keeps the in-memory token store in sync with the NextAuth session.
 *
 * On every session change:
 *  - Valid session   → write access token to memory store
 *  - Unauthenticated → clear memory store
 *  - Refresh failure → force sign-out so the user lands on /login cleanly
 *
 * This component has no visible output; it only manages side-effects.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();

    useEffect(() => {
        if (session?.error === "RefreshAccessTokenError") {
            // Refresh token is invalid or expired — session is unrecoverable.
            // Sign out to clear stale cookies and send user back to login.
            signOut({ callbackUrl: "/login" });
            return;
        }

        if (session?.accessToken) {
            tokenStore.set(session.accessToken);
        } else if (status === "unauthenticated") {
            tokenStore.set(null);
        }
    }, [session, status]);

    return <>{children}</>;
}
