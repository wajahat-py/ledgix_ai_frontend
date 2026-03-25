export interface Invoice {
    id: string;
    vendor_name: string;
    invoice_number: string;
    total_amount: number;
    status: "pending" | "approved" | "rejected";
}