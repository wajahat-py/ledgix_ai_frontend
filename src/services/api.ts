import axios from "axios";
import { getSession } from "next-auth/react";
import { tokenStore } from "@/lib/token-store";

export const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
});

// Attach the in-memory access token to every outgoing request
api.interceptors.request.use((config) => {
    const token = tokenStore.get();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// On 401: ask NextAuth for a refreshed session (triggers the jwt callback
// which auto-refreshes the access token), update memory, then retry once.
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const original = error.config;
        if (error.response?.status === 401 && !original._retry) {
            original._retry = true;
            const session = await getSession();
            if (session?.accessToken && !session.error) {
                tokenStore.set(session.accessToken);
                original.headers.Authorization = `Bearer ${session.accessToken}`;
                return api(original);
            }
        }
        return Promise.reject(error);
    }
);
