"use client";

import { useEffect, useMemo, useRef } from "react";
import { useSession } from "next-auth/react";
import { SocketContext } from "@/hooks/useAppSocket";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";
const ENABLE_WS = process.env.NEXT_PUBLIC_ENABLE_WS !== "false";

/**
 * Opens a single WebSocket connection for the authenticated user and
 * dispatches incoming messages to subscribers by `_type` field.
 * All hooks (useInvoiceSocket, useNotifications) subscribe through this
 * shared connection instead of each opening their own socket.
 */
export function SocketProvider({ children }: { children: React.ReactNode }) {
    const { data: session } = useSession();
    const listenersRef = useRef<Map<string, Set<(d: Record<string, unknown>) => void>>>(new Map());

    const value = useMemo(() => ({
        subscribe: (type: string, cb: (d: Record<string, unknown>) => void) => {
            let set = listenersRef.current.get(type);
            if (!set) {
                set = new Set();
                listenersRef.current.set(type, set);
            }
            set.add(cb);
            return () => { set!.delete(cb); };
        },
    }), []);

    useEffect(() => {
        if (!ENABLE_WS) return;
        const token = session?.accessToken;
        if (!token) return;
        const accessToken: string = token;

        let dead = false;
        let ws: WebSocket | null = null;
        let retryTimer: ReturnType<typeof setTimeout> | null = null;
        let attempt = 0;

        function open() {
            if (dead) return;
            const url = `${BACKEND_URL.replace(/^http/, "ws")}/ws/invoices/?token=${encodeURIComponent(accessToken)}`;
            ws = new WebSocket(url);

            ws.onopen = () => { attempt = 0; };

            ws.onmessage = ({ data: raw }) => {
                try {
                    const msg = JSON.parse(raw) as Record<string, unknown>;
                    const type = (msg._type as string) ?? "invoice";
                    listenersRef.current.get(type)?.forEach((cb) => cb(msg));
                } catch { /* ignore malformed frames */ }
            };

            ws.onerror = () => {};

            ws.onclose = ({ code }) => {
                if (dead || code === 4001) return;
                const delay = Math.min(1_000 * 2 ** attempt, 30_000);
                attempt++;
                retryTimer = setTimeout(open, delay);
            };
        }

        open();

        return () => {
            dead = true;
            if (retryTimer) clearTimeout(retryTimer);
            ws?.close();
        };
    }, [session?.accessToken]);

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
}
