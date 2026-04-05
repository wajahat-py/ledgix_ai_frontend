"use client";

import { useAppSocket } from "./useAppSocket";
import type { Invoice } from "@/types/invoice";

/**
 * Subscribe to real-time invoice status updates pushed by Celery via
 * Django Channels. Backed by the shared SocketProvider connection.
 */
export function useInvoiceSocket(onUpdate: (invoice: Invoice) => void): void {
    useAppSocket("invoice", (data) => {
        // Strip the _type discriminator before passing to the caller.
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { _type, ...invoice } = data;
        onUpdate(invoice as unknown as Invoice);
    });
}
