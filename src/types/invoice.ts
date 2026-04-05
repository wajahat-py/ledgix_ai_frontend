export type InvoiceStatus =
    | "UPLOADED"
    | "PROCESSING"
    | "PROCESSED"
    | "PROCESSING_FAILED"
    | "PENDING_REVIEW"
    | "APPROVED"
    | "REJECTED";

export interface DuplicateCheck {
    decision: "DUPLICATE" | "POSSIBLE_DUPLICATE" | "UNIQUE";
    best_match: number | null;
    best_match_filename: string | null;
    best_match_score: number | null;
    score_details: {
        final_score: number;
        rule_score: number;
        fuzzy_score: number;
        embedding_score: number | null;
        llm_verification?: {
            is_duplicate: boolean;
            confidence: number;
            reason: string;
        } | null;
        candidates_checked: number;
        candidates_embedded: number;
    };
    dismissed: boolean;
    checked_at: string;
}

export interface Invoice {
    id: number;
    original_filename: string;
    file_url: string | null;
    status: InvoiceStatus;
    extracted_data: Record<string, { value: unknown; confidence?: string | number }> | null;
    duplicate_check: DuplicateCheck | null;
    error_message: string;
    created_at: string;
    updated_at: string;
}

/** Shape pushed over the WebSocket by the Celery task */
export type InvoiceSocketMessage = Invoice;
