"use client";

import { createContext, useContext, useEffect, useRef } from "react";

type SocketCallback = (data: Record<string, unknown>) => void;

export interface SocketContextValue {
    subscribe: (type: string, cb: SocketCallback) => () => void;
}

export const SocketContext = createContext<SocketContextValue>({
    subscribe: () => () => {},
});

/**
 * Subscribe to WebSocket messages of a specific `_type`.
 * The callback is captured in a ref so inline lambdas don't cause re-subscribes.
 */
export function useAppSocket(type: string, cb: SocketCallback): void {
    const ctx = useContext(SocketContext);
    const cbRef = useRef(cb);
    cbRef.current = cb;

    useEffect(() => {
        return ctx.subscribe(type, (data) => cbRef.current(data));
    }, [ctx, type]);
}
