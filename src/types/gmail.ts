export interface GmailSyncedMessage {
    id: number;
    message_id: string;
    attachment_id: string;
    subject: string;
    sender: string;
    received_at: string | null;
    attachment_filename: string;
    invoice_id: number | null;
    invoice_detected: boolean;
    synced_at: string;
}

export interface GmailStatus {
    connected: boolean;
    gmail_address?: string;
    is_active?: boolean;
    last_synced_at?: string | null;
    created_at?: string;
    recent_imports?: GmailSyncedMessage[];
}
