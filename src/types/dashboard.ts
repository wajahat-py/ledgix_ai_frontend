export interface DashboardSummary {
    total_invoices: number;
    total_amount: number;
    approved_count: number;
    approved_amount: number;
    pending_review_count: number;
    failed_count: number;
    duplicates_flagged: number;
    prev_total_invoices: number;
    prev_total_amount: number;
    pct_change_invoices: number | null;
    pct_change_amount: number | null;
    pct_change_approved: number | null;
    all_time_total: number;
}

export interface MonthlyTrendPoint {
    year: number;
    month: number;
    label: string;
    total_amount: number;
    approved_amount: number;
    count: number;
    approved_count: number;
}

export interface StatusBreakdownItem {
    status: string;
    label: string;
    count: number;
    color: string;
}

export interface ActionInvoiceStub {
    id: number;
    original_filename: string;
    vendor: string;
    amount: number;
    status: string;
    created_at: string;
}

export interface ActionCenter {
    pending_review: ActionInvoiceStub[];
    failed: ActionInvoiceStub[];
    missing_data: ActionInvoiceStub[];
}

export type InsightSeverity = "info" | "warning" | "error" | "success";

export interface AiInsight {
    type: string;
    severity: InsightSeverity;
    title: string;
    body: string;
}

export interface DashboardData {
    range: string;
    summary: DashboardSummary;
    monthly_trend: MonthlyTrendPoint[];
    status_breakdown: StatusBreakdownItem[];
    action_center: ActionCenter;
    recent_invoices: ActionInvoiceStub[];
    ai_insights: AiInsight[];
}
