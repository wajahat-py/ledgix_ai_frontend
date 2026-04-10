import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import type { JWT } from "next-auth/jwt";

const backendUrl =
    process.env.BACKEND_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    "http://127.0.0.1:8000";

const ACCESS_TOKEN_LIFETIME_MS = 23 * 60 * 60 * 1000; // 23 h
const REFRESH_BUFFER_MS        = 5  * 60 * 1000;      // 5 min

async function refreshAccessToken(token: JWT): Promise<JWT> {
    try {
        const res = await fetch(`${backendUrl}/api/auth/token/refresh/`, {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ refresh: token.refreshToken }),
        });
        if (!res.ok) throw new Error("Refresh request failed");
        const data = await res.json();
        return {
            ...token,
            accessToken:       data.access,
            accessTokenExpiry: Date.now() + ACCESS_TOKEN_LIFETIME_MS,
            error:             undefined,
        };
    } catch {
        return { ...token, error: "RefreshAccessTokenError" };
    }
}

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId:     process.env.GOOGLE_CLIENT_ID_AUTH!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET_AUTH!,
            authorization: {
                params: {
                    prompt: "select_account",
                    access_type: "online",
                    response_type: "code",
                },
            },
        }),

        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email:    { label: "Email",    type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;
                try {
                    const tokenRes = await fetch(`${backendUrl}/api/auth/login/`, {
                        method:  "POST",
                        headers: { "Content-Type": "application/json" },
                        body:    JSON.stringify({
                            email:    credentials.email,
                            password: credentials.password,
                        }),
                    });
                    if (!tokenRes.ok) return null;

                    const tokenData = await tokenRes.json();
                    if (!tokenData?.access || !tokenData?.refresh) return null;

                    const userRes = await fetch(`${backendUrl}/api/auth/me/`, {
                        headers: { Authorization: `Bearer ${tokenData.access}` },
                    });
                    if (!userRes.ok) return null;

                    const user = await userRes.json();
                    return {
                        id:           String(user.id),
                        name:         user.full_name || user.first_name || user.email,
                        email:        user.email,
                        accessToken:  tokenData.access,
                        refreshToken: tokenData.refresh,
                    };
                } catch {
                    return null;
                }
            },
        }),
    ],

    callbacks: {
        async jwt({ token, user, account }) {
            // ── Google OAuth sign-in ──────────────────────────────────────────
            if (account?.provider === "google") {
                const idToken = account.id_token;
                if (!idToken) {
                    return { ...token, error: "GoogleAuthError" };
                }
                try {
                    const res = await fetch(`${backendUrl}/api/auth/google/`, {
                        method:  "POST",
                        headers: { "Content-Type": "application/json" },
                        body:    JSON.stringify({ id_token: idToken }),
                    });
                    if (!res.ok) {
                        const err = await res.json().catch(() => ({}));
                        return { ...token, error: (err as { detail?: string }).detail || "GoogleAuthError" };
                    }
                    const data = await res.json();
                    return {
                        ...token,
                        accessToken:       data.access,
                        refreshToken:      data.refresh,
                        accessTokenExpiry: Date.now() + ACCESS_TOKEN_LIFETIME_MS,
                        error:             undefined,
                    };
                } catch {
                    return { ...token, error: "GoogleAuthError" };
                }
            }

            // ── Credentials sign-in ───────────────────────────────────────────
            if (user) {
                return {
                    ...token,
                    accessToken:       (user as { accessToken?: string }).accessToken,
                    refreshToken:      (user as { refreshToken?: string }).refreshToken,
                    accessTokenExpiry: Date.now() + ACCESS_TOKEN_LIFETIME_MS,
                };
            }

            // ── Access token still valid ──────────────────────────────────────
            if (Date.now() < (token.accessTokenExpiry as number) - REFRESH_BUFFER_MS) {
                return token;
            }

            // ── Refresh ───────────────────────────────────────────────────────
            return refreshAccessToken(token);
        },

        async session({ session, token }) {
            session.accessToken = token.accessToken as string;
            session.error       = token.error as string | undefined;
            return session;
        },
    },

    pages: {
        signIn: "/login",
        error:  "/login",
    },

    session: { strategy: "jwt" },
    secret:  process.env.NEXTAUTH_SECRET,
};
