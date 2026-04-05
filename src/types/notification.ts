export type NotificationKind = "INVOICE_PROCESSED" | "INVOICE_FAILED" | "SYNC_ERROR";

export interface AppNotification {
    id: number;
    kind: NotificationKind;
    title: string;
    body: string;
    invoice_id: number | null;
    is_read: boolean;
    created_at: string;
}

export interface NotificationsResponse {
    results: AppNotification[];
    unread_count: number;
}
