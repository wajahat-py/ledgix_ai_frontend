/**
 * Invoice export utilities — CSV, Excel, PDF, QuickBooks IIF, Xero CSV.
 * All exports are purely client-side and trigger a file download.
 */

import type { Invoice } from "@/types/invoice";

// ── helpers ───────────────────────────────────────────────────────────────────

function extractField(data: Invoice["extracted_data"], ...keys: string[]): string {
    if (!data) return "";
    for (const key of keys) {
        const entry = data[key];
        if (entry && entry.value != null && entry.value !== "") return String(entry.value);
    }
    return "";
}

interface InvoiceRow {
    vendor: string;
    invoiceNumber: string;
    invoiceDate: string;
    dueDate: string;
    amount: string;
    currency: string;
    status: string;
    filename: string;
    description: string;
}

function toRow(inv: Invoice): InvoiceRow {
    const data = inv.extracted_data;
    return {
        vendor:        extractField(data, "supplier_name", "vendor_name", "seller_name"),
        invoiceNumber: extractField(data, "invoice_number", "invoice_id", "reference_number"),
        invoiceDate:   extractField(data, "date", "invoice_date", "issue_date"),
        dueDate:       extractField(data, "due_date", "payment_due_date"),
        amount:        extractField(data, "total_amount", "total_net", "amount_due", "grand_total"),
        currency:      extractField(data, "currency", "currency_code") || "USD",
        status:        inv.status,
        filename:      inv.original_filename,
        description:   extractField(data, "description", "invoice_description", "reference"),
    };
}

function triggerDownload(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

// ── CSV ───────────────────────────────────────────────────────────────────────

function csvCell(value: string): string {
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
        return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
}

export function exportCSV(invoices: Invoice[]) {
    const headers = ["Vendor", "Invoice #", "Invoice Date", "Due Date", "Amount", "Currency", "Status", "Filename"];
    const rows = invoices.map((inv) => {
        const r = toRow(inv);
        return [r.vendor, r.invoiceNumber, r.invoiceDate, r.dueDate, r.amount, r.currency, r.status, r.filename];
    });

    const csv = [headers, ...rows]
        .map((row) => row.map(csvCell).join(","))
        .join("\r\n");

    triggerDownload(new Blob([csv], { type: "text/csv;charset=utf-8;" }), "invoices.csv");
}

// ── Excel ─────────────────────────────────────────────────────────────────────

export async function exportExcel(invoices: Invoice[]) {
    const { utils, write } = await import("xlsx");

    const rows = invoices.map((inv) => {
        const r = toRow(inv);
        return {
            Vendor:          r.vendor,
            "Invoice #":     r.invoiceNumber,
            "Invoice Date":  r.invoiceDate,
            "Due Date":      r.dueDate,
            Amount:          r.amount,
            Currency:        r.currency,
            Status:          r.status,
            Filename:        r.filename,
        };
    });

    const ws = utils.json_to_sheet(rows);

    // Column widths
    ws["!cols"] = [
        { wch: 28 }, // Vendor
        { wch: 18 }, // Invoice #
        { wch: 14 }, // Invoice Date
        { wch: 14 }, // Due Date
        { wch: 14 }, // Amount
        { wch: 10 }, // Currency
        { wch: 16 }, // Status
        { wch: 36 }, // Filename
    ];

    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Invoices");

    const buf = write(wb, { bookType: "xlsx", type: "array" });
    triggerDownload(
        new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
        "invoices.xlsx",
    );
}

// ── PDF ───────────────────────────────────────────────────────────────────────

export async function exportPDF(invoices: Invoice[]) {
    const { jsPDF } = await import("jspdf");
    const { autoTable } = await import("jspdf-autotable");

    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text("Ledgix Invoice.ai — Invoice Export", 40, 40);

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, 40, 56);

    const rows = invoices.map((inv) => {
        const r = toRow(inv);
        return [r.vendor || inv.original_filename, r.invoiceNumber, r.invoiceDate, r.dueDate, r.amount, r.currency, r.status];
    });

    autoTable(doc, {
        startY: 72,
        head: [["Vendor", "Invoice #", "Invoice Date", "Due Date", "Amount", "Currency", "Status"]],
        body: rows,
        styles: { fontSize: 9, cellPadding: 6, textColor: [30, 41, 59] },
        headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: "bold", fontSize: 9 },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
            0: { cellWidth: 130 },
            1: { cellWidth: 90 },
            2: { cellWidth: 80 },
            3: { cellWidth: 80 },
            4: { cellWidth: 70 },
            5: { cellWidth: 55 },
            6: { cellWidth: 80 },
        },
        margin: { left: 40, right: 40 },
    });

    doc.save("invoices.pdf");
}

// ── QuickBooks IIF ────────────────────────────────────────────────────────────
//
// IIF (Intuit Interchange Format) — a tab-delimited text format that QuickBooks
// Desktop can import via File → Utilities → Import → IIF Files.
// Each bill is represented as a TRNS (transaction) + SPL (split) + ENDTRNS block.

export function exportQuickBooks(invoices: Invoice[]) {
    const TAB = "\t";
    const NL  = "\r\n";

    // Header definitions
    const lines: string[] = [
        ["!TRNS", "TRNSID", "TRNSTYPE", "DATE",    "ACCNT",             "NAME", "AMOUNT",  "DOCNUM", "MEMO"].join(TAB),
        ["!SPL",  "SPLID",  "TRNSTYPE", "DATE",    "ACCNT",             "NAME", "AMOUNT",  "DOCNUM", "MEMO"].join(TAB),
        "!ENDTRNS",
    ];

    invoices.forEach((inv, idx) => {
        const r     = toRow(inv);
        const id    = String(idx + 1);
        const date  = r.invoiceDate || new Date(inv.created_at).toLocaleDateString("en-US");
        const amt   = parseFloat(r.amount.replace(/[^0-9.-]/g, "")) || 0;
        const neg   = (-amt).toFixed(2);
        const pos   = amt.toFixed(2);
        const name  = r.vendor || "Unknown Vendor";
        const docnum = r.invoiceNumber;
        const memo  = inv.original_filename;

        lines.push(
            [
                "TRNS", id, "BILL", date,
                "Accounts Payable", name, neg, docnum, memo,
            ].join(TAB),
            [
                "SPL", id, "BILL", date,
                "Expenses", name, pos, docnum, memo,
            ].join(TAB),
            "ENDTRNS",
        );
    });

    triggerDownload(
        new Blob([lines.join(NL)], { type: "text/plain;charset=utf-8;" }),
        "invoices-quickbooks.iif",
    );
}

// ── Xero CSV ──────────────────────────────────────────────────────────────────
//
// Xero accepts a specific CSV layout for importing bills (Accounts Payable).
// Docs: https://central.xero.com/s/article/Import-bills-or-invoices-using-a-CSV-file
//
// Required columns: ContactName, InvoiceNumber, InvoiceDate, DueDate,
//                   Description, Quantity, UnitAmount, AccountCode, TaxType, Currency

export function exportXero(invoices: Invoice[]) {
    const headers = [
        "ContactName", "EmailAddress", "InvoiceNumber", "InvoiceDate",
        "DueDate", "Description", "Quantity", "UnitAmount",
        "AccountCode", "TaxType", "Currency", "Reference",
    ];

    const rows = invoices.map((inv) => {
        const r = toRow(inv);
        const amt = parseFloat(r.amount.replace(/[^0-9.-]/g, "")) || 0;
        return [
            r.vendor || "Unknown Vendor",   // ContactName
            "",                              // EmailAddress
            r.invoiceNumber,                 // InvoiceNumber
            r.invoiceDate,                   // InvoiceDate
            r.dueDate,                       // DueDate
            r.description || inv.original_filename, // Description
            "1",                             // Quantity
            amt.toFixed(2),                  // UnitAmount
            "200",                           // AccountCode (Xero default: Sales)
            "NONE",                          // TaxType
            r.currency,                      // Currency
            inv.original_filename,           // Reference
        ];
    });

    const csv = [headers, ...rows]
        .map((row) => row.map(csvCell).join(","))
        .join("\r\n");

    triggerDownload(new Blob([csv], { type: "text/csv;charset=utf-8;" }), "invoices-xero.csv");
}
