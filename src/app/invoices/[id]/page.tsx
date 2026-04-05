"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
    ArrowLeft, CheckCircle2, AlertCircle, Clock,
    Loader2, FileText, AlertTriangle, Eye, XCircle, Play,
    Pencil, Save, X, Trash2, Download, ExternalLink,
    RefreshCw, ShieldCheck, ShieldAlert, ShieldQuestion,
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import Sidebar from "@/components/Sidebar";
import AppHeader from "@/components/AppHeader";
import { useInvoiceSocket } from "@/hooks/useInvoiceSocket";
import type { Invoice, InvoiceStatus } from "@/types/invoice";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

// ── helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
    return new Date(iso).toLocaleString("en-US", {
        month: "short", day: "numeric", year: "numeric",
        hour: "numeric", minute: "2-digit",
    });
}

function fieldLabel(key: string) {
    return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function getFileType(filename: string): "pdf" | "image" | "other" {
    const ext = filename.split(".").pop()?.toLowerCase() ?? "";
    if (ext === "pdf") return "pdf";
    if (["jpg", "jpeg", "png", "webp"].includes(ext)) return "image";
    return "other";
}

// ── confidence ────────────────────────────────────────────────────────────────

const CONFIDENCE_STYLES: Record<string, { className: string; label: string }> = {
    CERTAIN:   { className: "text-green-700 bg-green-50 border-green-200",   label: "Certain" },
    VERY_HIGH: { className: "text-emerald-700 bg-emerald-50 border-emerald-200", label: "Very High" },
    HIGH:      { className: "text-cyan-700 bg-cyan-50 border-cyan-200",       label: "High" },
    MEDIUM:    { className: "text-yellow-700 bg-yellow-50 border-yellow-200", label: "Medium" },
    LOW:       { className: "text-orange-700 bg-orange-50 border-orange-200", label: "Low" },
    VERY_LOW:  { className: "text-red-600 bg-red-50 border-red-200",          label: "Very Low" },
    UNKNOWN:   { className: "text-slate-500 bg-slate-100 border-slate-200",   label: "Unknown" },
};

function ConfidenceBadge({ confidence }: { confidence: string | number | undefined }) {
    if (confidence === undefined || confidence === null) return null;
    const key = String(confidence).toUpperCase().replace(/\s+/g, "_");
    const style = CONFIDENCE_STYLES[key] ?? CONFIDENCE_STYLES["UNKNOWN"];
    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border shrink-0 ${style.className}`}>
            {style.label}
        </span>
    );
}

// ── status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; className: string; icon: React.ReactNode }> = {
    UPLOADED:          { label: "Uploaded",       className: "bg-slate-100 text-slate-600 border-slate-200",        icon: <Clock size={13} /> },
    PROCESSING:        { label: "Processing",     className: "bg-blue-50 text-blue-600 border-blue-200",            icon: <Loader2 size={13} className="animate-spin" /> },
    PROCESSED:         { label: "Processed",      className: "bg-cyan-50 text-cyan-700 border-cyan-200",            icon: <CheckCircle2 size={13} /> },
    PROCESSING_FAILED: { label: "Failed",         className: "bg-red-50 text-red-600 border-red-200",               icon: <AlertCircle size={13} /> },
    PENDING_REVIEW:    { label: "Pending Review", className: "bg-purple-50 text-purple-700 border-purple-200",      icon: <Eye size={13} /> },
    APPROVED:          { label: "Approved",       className: "bg-green-50 text-green-700 border-green-200",         icon: <CheckCircle2 size={13} /> },
    REJECTED:          { label: "Rejected",       className: "bg-slate-100 text-slate-500 border-slate-200",        icon: <AlertCircle size={13} /> },
};

// ── field renderers ───────────────────────────────────────────────────────────

type FieldEntry = { value: unknown; confidence?: string | number } | unknown[] | null;

// Known monetary field keys — used to apply currency formatting.
const MONETARY_KEYS = new Set([
    "total_amount", "total_net", "total_tax", "amount_due", "grand_total",
    "subtotal", "discount_amount", "tip", "shipping_amount",
]);

/** Extract a currency code from the locale entry in extracted_data (e.g. "USD"). */
function extractCurrency(data: Invoice["extracted_data"]): string | null {
    if (!data) return null;
    const locale = data["locale"];
    if (!locale || typeof locale !== "object" || Array.isArray(locale)) return null;
    const localeObj = locale as Record<string, unknown>;
    // locale may be { value: { currency: "USD" } } or { currency: "USD" } or { currency: { value: "USD" } }
    const container = ("value" in localeObj && localeObj["value"] && typeof localeObj["value"] === "object" && !Array.isArray(localeObj["value"]))
        ? localeObj["value"] as Record<string, unknown>
        : localeObj;
    const curr = container["currency"];
    if (typeof curr === "string" && curr) return curr;
    // Wrapped: { value: "USD", confidence: ... }
    if (curr && typeof curr === "object" && !Array.isArray(curr)) {
        const inner = (curr as Record<string, unknown>)["value"];
        if (typeof inner === "string" && inner) return inner;
    }
    return null;
}

/** Format a number as currency when we have a currency code, or as a decimal otherwise. */
function formatMonetary(raw: string, currency: string | null): string {
    const num = parseFloat(raw);
    if (isNaN(num)) return raw;
    if (currency) {
        try {
            return new Intl.NumberFormat("en-US", {
                style: "currency", currency, minimumFractionDigits: 2,
            }).format(num);
        } catch {
            return `${currency} ${num.toFixed(2)}`;
        }
    }
    return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Unwrap a potential Mindee field wrapper { value: X, confidence: Y } to its
 * primitive string, or convert a plain primitive to string.
 * Returns null if the value is absent, empty, or a non-unwrappable object.
 */
function unwrap(v: unknown): string | null {
    if (v === null || v === undefined || v === "") return null;
    if (typeof v !== "object" || Array.isArray(v)) return String(v);
    const o = v as Record<string, unknown>;
    if ("value" in o) {
        const inner = o["value"];
        if (inner === null || inner === undefined || inner === "") return null;
        if (typeof inner !== "object") return String(inner);
        // Doubly-nested: { value: { raw: "..." } }
        const innerObj = inner as Record<string, unknown>;
        for (const k of ["raw", "raw_value", "text"]) {
            if (typeof innerObj[k] === "string" && innerObj[k]) return innerObj[k] as string;
        }
    }
    return null;
}

/**
 * Render a nested value object (e.g. address, locale, company registration).
 * Tries common Mindee field patterns before falling back to joining primitives.
 */
function renderNestedObject(obj: Record<string, unknown>): string {
    // Raw OCR text
    for (const k of ["raw", "raw_value", "text", "description"]) {
        if (typeof obj[k] === "string" && obj[k]) return obj[k] as string;
    }
    // Locale — { language: "en", currency: "USD" } or { language: {value:"en"}, currency: {value:"USD"} }
    if ("language" in obj || "currency" in obj) {
        const lang = unwrap(obj["language"]);
        const curr = unwrap(obj["currency"]);
        return [lang, curr].filter(Boolean).join(" · ") || "BLANK";
    }
    // Company / VAT registration — { type: "EIN", value: "12-345" } (values may be wrapped)
    if ("type" in obj && ("value" in obj || "number" in obj)) {
        const type = unwrap(obj["type"]) ?? String(obj["type"]);
        const val = unwrap(obj["value"] ?? obj["number"]);
        return val ? `${type}: ${val}` : type;
    }
    // Payment details — IBAN / BIC (values may be wrapped)
    const payParts: string[] = [];
    const iban = unwrap(obj["iban"]);
    const bic = unwrap(obj["bic"] ?? obj["swift"]);
    const acct = unwrap(obj["account_number"]);
    if (iban) payParts.push(`IBAN: ${iban}`);
    if (bic) payParts.push(`BIC: ${bic}`);
    if (acct) payParts.push(`Acct: ${acct}`);
    if (payParts.length) return payParts.join("  ·  ");
    // Address — join known address component keys (values may be wrapped)
    const addrParts = (["street_number", "street_name", "city", "state", "postal_code", "country", "country_code"] as const)
        .map(k => unwrap(obj[k]) ?? (obj[k] != null && obj[k] !== "" && typeof obj[k] !== "object" ? String(obj[k]) : null))
        .filter((v): v is string => v !== null && v !== "");
    if (addrParts.length) return addrParts.join(", ");
    // Fallback — unwrap or join all primitive values
    const primitives = Object.values(obj)
        .map(v => unwrap(v) ?? (v != null && v !== "" && typeof v !== "object" ? String(v) : null))
        .filter((v): v is string => v !== null && v !== "");
    return primitives.length ? primitives.join(", ") : "BLANK";
}

/**
 * Render a Mindee nested-fields-dict entry — entries where each sub-key is itself
 * a { value, confidence } object (no top-level "value" key on the parent).
 * E.g. { city: { value: "SF" }, state: { value: "CA" }, confidence: "CERTAIN" }
 */
const FIELD_SKIP = new Set(["confidence", "polygon", "bounding_box", "raw_value", "page_id"]);

function renderNestedFieldDict(obj: Record<string, unknown>): string {
    const extracted: Record<string, string> = {};
    for (const [k, v] of Object.entries(obj)) {
        if (FIELD_SKIP.has(k)) continue;
        if (v && typeof v === "object" && !Array.isArray(v) && "value" in (v as object)) {
            const sv = (v as { value: unknown }).value;
            // "[object Object]" is a Mindee API serialization artifact — skip it.
            if (sv !== null && sv !== undefined && sv !== "" && sv !== "[object Object]" && typeof sv !== "object") {
                extracted[k] = String(sv);
            }
        } else if (v !== null && v !== undefined && typeof v !== "object" && String(v) !== "[object Object]") {
            extracted[k] = String(v);
        }
    }
    if (!Object.keys(extracted).length) return "BLANK";
    // Locale
    if ("language" in extracted || "currency" in extracted) {
        return [extracted["language"], extracted["currency"]].filter(Boolean).join(" · ") || "BLANK";
    }
    // Company / VAT registration
    if ("type" in extracted && ("value" in extracted || "number" in extracted)) {
        const val = extracted["value"] ?? extracted["number"];
        return `${extracted["type"]}: ${val}`;
    }
    // Payment details
    const payParts: string[] = [];
    if (extracted["iban"]) payParts.push(`IBAN: ${extracted["iban"]}`);
    if (extracted["bic"] || extracted["swift"]) payParts.push(`BIC: ${extracted["bic"] ?? extracted["swift"]}`);
    if (extracted["account_number"]) payParts.push(`Acct: ${extracted["account_number"]}`);
    if (payParts.length) return payParts.join("  ·  ");
    // Address
    const addrParts = (["street_number", "street_name", "city", "state", "postal_code", "country", "country_code"] as const)
        .filter(k => extracted[k])
        .map(k => extracted[k]);
    if (addrParts.length) return addrParts.join(", ");
    return Object.values(extracted).join(", ") || "BLANK";
}

/**
 * Render a scalar FieldEntry to a display string.
 * Returns "BLANK" when the value is absent or empty.
 */
function renderValue(entry: FieldEntry, fieldKey = "", currency: string | null = null): string {
    if (entry === null || entry === undefined) return "BLANK";
    if (Array.isArray(entry)) return `${entry.length} item${entry.length !== 1 ? "s" : ""}`;
    if (typeof entry === "object" && "value" in (entry as object)) {
        const v = (entry as { value: unknown }).value;
        if (v === null || v === undefined || v === "") return "BLANK";
        if (Array.isArray(v)) return `${v.length} item${v.length !== 1 ? "s" : ""}`;
        if (typeof v === "object") return renderNestedObject(v as Record<string, unknown>);
        // "[object Object]" is a Mindee API serialization artifact stored verbatim.
        // Fall through to sibling sub-fields in the entry instead of displaying it.
        if (v === "[object Object]") return renderNestedFieldDict(entry as Record<string, unknown>);
        const str = String(v);
        if (!str) return "BLANK";
        if (currency && MONETARY_KEYS.has(fieldKey)) return formatMonetary(str, currency);
        return str;
    }
    // Mindee nested-fields-dict: no top-level "value" key, sub-keys are field objects
    if (typeof entry === "object" && entry !== null) {
        return renderNestedFieldDict(entry as Record<string, unknown>);
    }
    return String(entry) || "BLANK";
}

type LineItem = Record<string, { value: unknown; confidence?: string | number }>;

function LineItemsTable({ items }: { items: LineItem[] }) {
    if (!items.length) return <p className="text-xs text-slate-500">No line items extracted.</p>;
    const keys = Object.keys(items[0]);
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-xs">
                <thead>
                    <tr className="text-slate-400 uppercase tracking-wide text-[10px] border-b border-slate-200">
                        {keys.map((k) => (
                            <th key={k} className="pb-2 text-left pr-4 last:text-right">{fieldLabel(k)}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {items.map((row, i) => (
                        <tr key={i}>
                            {keys.map((k, j) => (
                                <td key={k} className={`py-2.5 pr-4 text-slate-700 ${j === keys.length - 1 ? "text-right font-medium" : ""}`}>
                                    {renderValue(row[k] as FieldEntry)}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ── file preview ──────────────────────────────────────────────────────────────

// ── delete confirm modal ──────────────────────────────────────────────────────

function DeleteConfirmModal({
    isOpen,
    filename,
    isDeleting,
    onConfirm,
    onCancel,
}: {
    isOpen: boolean;
    filename: string;
    isDeleting: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    const overlayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [isOpen, onCancel]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    ref={overlayRef}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
                    onClick={(e) => { if (e.target === overlayRef.current) onCancel(); }}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 8 }}
                        transition={{ duration: 0.18, ease: "easeOut" }}
                        className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-sm shadow-xl"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-50 border border-red-200 flex items-center justify-center shrink-0">
                                <AlertTriangle size={18} className="text-red-600" />
                            </div>
                            <div>
                                <p className="text-slate-900 font-semibold text-sm">Delete Invoice</p>
                                <p className="text-xs text-slate-500 mt-0.5">This action cannot be undone.</p>
                            </div>
                        </div>

                        <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                            Are you sure you want to permanently delete{" "}
                            <span className="text-slate-900 font-medium break-all">{filename}</span>?
                            The file and all extracted data will be removed.
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={onCancel}
                                disabled={isDeleting}
                                className="flex-1 py-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 text-sm text-slate-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={onConfirm}
                                disabled={isDeleting}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 text-sm text-white font-semibold transition-colors"
                            >
                                {isDeleting
                                    ? <><Loader2 size={14} className="animate-spin" /> Deleting…</>
                                    : <><Trash2 size={14} /> Delete</>}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// ── file preview ──────────────────────────────────────────────────────────────

// Proxy PDFs through the Next.js server so the iframe is same-origin.
// Chrome blocks cross-origin PDFs in iframes at the browser level regardless
// of any server headers — serving from the same port (3000) is the only fix.
function proxyUrl(fileUrl: string) {
    return `/api/media-proxy?url=${encodeURIComponent(fileUrl)}`;
}

function FilePreview({ fileUrl, filename }: { fileUrl: string; filename: string }) {
    const type = getFileType(filename);

    return (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col h-full min-h-[400px]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 shrink-0">
                <span className="text-xs font-medium text-slate-400">Original File</span>
                <div className="flex items-center gap-3">
                    <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 transition-colors"
                    >
                        <ExternalLink size={13} /> Open
                    </a>
                    <a
                        href={fileUrl}
                        download={filename}
                        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 transition-colors"
                    >
                        <Download size={13} /> Download
                    </a>
                </div>
            </div>

            <div className="flex-1 relative min-h-0">
                {type === "pdf" && (
                    <iframe
                        src={proxyUrl(fileUrl)}
                        title={filename}
                        className="absolute inset-0 w-full h-full border-0"
                    />
                )}

                {type === "image" && (
                    <div className="absolute inset-0 flex items-center justify-center p-4 overflow-auto">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={fileUrl}
                            alt={filename}
                            className="max-w-full max-h-full object-contain rounded"
                        />
                    </div>
                )}

                {type === "other" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-slate-400">
                        <FileText size={40} className="text-slate-400" />
                        <p className="text-sm">Preview not available for this file type.</p>
                        <a
                            href={fileUrl}
                            download={filename}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-sm text-white rounded-lg transition-colors"
                        >
                            <Download size={14} /> Download File
                        </a>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── duplicate check card ──────────────────────────────────────────────────────

function ScoreBar({ label, value, color }: { label: string; value: number | null; color: string }) {
    const pct = value != null ? Math.round(value * 100) : null;
    return (
        <div>
            <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] text-slate-500">{label}</span>
                <span className="text-[11px] font-mono text-slate-400">{pct != null ? `${pct}%` : "—"}</span>
            </div>
            <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                {pct != null && (
                    <div
                        className={`h-full rounded-full transition-all duration-500 ${color}`}
                        style={{ width: `${pct}%` }}
                    />
                )}
            </div>
        </div>
    );
}

function DuplicateCheckCard({
    invoice,
    onDismiss,
    onRecheck,
    dismissLoading,
    recheckLoading,
}: {
    invoice: Invoice;
    onDismiss: (dismissed: boolean) => void;
    onRecheck: () => void;
    dismissLoading: boolean;
    recheckLoading: boolean;
}) {
    const dup = invoice.duplicate_check;
    if (!dup) return null;

    const { decision, best_match, best_match_filename, best_match_score, score_details, dismissed } = dup;
    const isActive = decision !== "UNIQUE" && !dismissed;

    const decisionConfig = {
        DUPLICATE: {
            icon: <ShieldAlert size={16} className="text-red-600" />,
            label: "Duplicate Detected",
            description: "This invoice matches an existing record with high confidence.",
            headerClass: "border-red-200 bg-red-50",
            badgeClass: "bg-red-100 text-red-700 border-red-200",
            barColor: "bg-red-500",
        },
        POSSIBLE_DUPLICATE: {
            icon: <ShieldQuestion size={16} className="text-amber-600" />,
            label: "Possible Duplicate",
            description: "This invoice is similar to an existing record. Review before approving.",
            headerClass: "border-amber-200 bg-amber-50",
            badgeClass: "bg-amber-100 text-amber-700 border-amber-200",
            barColor: "bg-amber-500",
        },
        UNIQUE: {
            icon: <ShieldCheck size={16} className="text-emerald-600" />,
            label: "Unique Invoice",
            description: "No matching invoices found.",
            headerClass: "border-green-200 bg-green-50",
            badgeClass: "bg-green-100 text-green-700 border-green-200",
            barColor: "bg-emerald-500",
        },
    };

    const cfg = decisionConfig[decision];

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className={`border rounded-xl overflow-hidden ${dismissed ? "border-slate-200 bg-slate-50" : cfg.headerClass}`}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-inherit">
                <div className="flex items-center gap-2.5">
                    {dismissed ? <ShieldCheck size={16} className="text-slate-400" /> : cfg.icon}
                    <span className={`text-sm font-semibold ${dismissed ? "text-slate-500" : decision === "DUPLICATE" ? "text-red-700" : decision === "POSSIBLE_DUPLICATE" ? "text-amber-700" : "text-emerald-700"}`}>
                        {dismissed ? "Duplicate Dismissed" : cfg.label}
                    </span>
                    {!dismissed && (
                        <span className={`text-[11px] px-2 py-0.5 rounded-full border font-medium ${cfg.badgeClass}`}>
                            {Math.round((score_details.final_score) * 100)}% confidence
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={onRecheck}
                        disabled={recheckLoading}
                        title="Re-run duplicate check"
                        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-700 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw size={12} className={recheckLoading ? "animate-spin" : ""} />
                        {recheckLoading ? "Checking…" : "Recheck"}
                    </button>
                    {decision !== "UNIQUE" && (
                        <button
                            onClick={() => onDismiss(!dismissed)}
                            disabled={dismissLoading}
                            className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-colors disabled:opacity-50"
                        >
                            {dismissLoading ? <Loader2 size={11} className="animate-spin inline" /> : dismissed ? "Undo Dismiss" : "Dismiss"}
                        </button>
                    )}
                </div>
            </div>

            {/* Body */}
            <div className="px-5 py-4 space-y-4">
                {!dismissed && (
                    <p className="text-xs text-slate-500">{cfg.description}</p>
                )}

                {/* Best match */}
                {best_match && !dismissed && (
                    <div className="bg-white border border-slate-200 rounded-lg px-4 py-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                            <p className="text-[10px] uppercase tracking-wide text-slate-400 mb-0.5">Best Match</p>
                            <p className="text-sm text-slate-900 font-medium truncate">
                                {best_match_filename ?? `Invoice #${best_match}`}
                            </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                            <span className={`text-sm font-mono font-bold ${decision === "DUPLICATE" ? "text-red-600" : "text-amber-600"}`}>
                                {Math.round((best_match_score ?? 0) * 100)}%
                            </span>
                            <a
                                href={`/invoices/${best_match}`}
                                className="text-xs text-primary-600 hover:text-primary-700 transition-colors whitespace-nowrap"
                            >
                                View →
                            </a>
                        </div>
                    </div>
                )}

                {/* Score breakdown */}
                {!dismissed && (
                    <div className="space-y-2.5">
                        <p className="text-[10px] uppercase tracking-wide text-slate-500">Score Breakdown</p>
                        <ScoreBar label="Rule-based" value={score_details.rule_score} color={cfg.barColor} />
                        <ScoreBar label="Fuzzy match" value={score_details.fuzzy_score} color={cfg.barColor} />
                        <ScoreBar label="Embedding similarity" value={score_details.embedding_score} color={cfg.barColor} />
                        <div className="pt-1 border-t border-slate-200">
                            <ScoreBar label="Final score" value={score_details.final_score} color={decision === "DUPLICATE" ? "bg-red-500" : decision === "POSSIBLE_DUPLICATE" ? "bg-amber-500" : "bg-emerald-500"} />
                        </div>
                    </div>
                )}

                {/* LLM verification */}
                {!dismissed && score_details.llm_verification && (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
                        <p className="text-[10px] uppercase tracking-wide text-slate-400 mb-1.5">AI Verification</p>
                        <div className="flex items-start gap-2">
                            {score_details.llm_verification.is_duplicate
                                ? <AlertTriangle size={13} className="text-amber-600 shrink-0 mt-0.5" />
                                : <CheckCircle2 size={13} className="text-emerald-600 shrink-0 mt-0.5" />}
                            <div>
                                <p className="text-xs text-slate-700">
                                    {score_details.llm_verification.is_duplicate ? "AI confirmed duplicate" : "AI says unique"}{" "}
                                    <span className="text-slate-400">({Math.round(score_details.llm_verification.confidence * 100)}% confidence)</span>
                                </p>
                                {score_details.llm_verification.reason && (
                                    <p className="text-[11px] text-slate-500 mt-0.5">{score_details.llm_verification.reason}</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Stats footer */}
                {!dismissed && (
                    <p className="text-[10px] text-slate-400">
                        Checked {score_details.candidates_checked} invoice{score_details.candidates_checked !== 1 ? "s" : ""}
                        {score_details.candidates_embedded > 0 && `, ${score_details.candidates_embedded} with embedding`}
                        {" · "}checked {new Date(dup.checked_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    </p>
                )}
            </div>
        </motion.div>
    );
}

// ── main component ────────────────────────────────────────────────────────────

export default function InvoiceDetailPage() {
    const params = useParams();
    const invoiceId = params?.id as string;
    const { data: session } = useSession();
    const router = useRouter();

    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [loading, setLoading] = useState(true);
    const [fetchError, setFetchError] = useState("");
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [processLoading, setProcessLoading] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Duplicate check actions
    const [dismissLoading, setDismissLoading] = useState(false);
    const [recheckLoading, setRecheckLoading] = useState(false);

    // Edit mode state
    const [editMode, setEditMode] = useState(false);
    const [editValues, setEditValues] = useState<Record<string, string>>({});
    const [saveLoading, setSaveLoading] = useState(false);

    // Derived from invoice data — safe to compute here since invoice is state.
    const currency = extractCurrency(invoice?.extracted_data ?? null);

    // Keep a ref to the current invoice so the WS callback reads the latest
    // status without a stale closure.
    const invoiceRef = useRef<Invoice | null>(null);
    invoiceRef.current = invoice;

    useInvoiceSocket((updated) => {
        if (String(updated.id) !== invoiceId) return;
        const prev = invoiceRef.current;
        if (prev && prev.status !== updated.status) {
            if (updated.status === "PROCESSED") {
                toast.success("Invoice processed successfully.");
            } else if (updated.status === "PROCESSING_FAILED") {
                toast.error(updated.error_message || "Invoice processing failed.");
            }
        }
        // Toast when duplicate check result arrives
        if (updated.duplicate_check && prev) {
            const prevDup = prev.duplicate_check;
            const newDup = updated.duplicate_check;
            if (!prevDup && newDup) {
                if (newDup.decision === "DUPLICATE") {
                    toast.error("Duplicate detected", {
                        description: `${Math.round((newDup.best_match_score ?? 0) * 100)}% match with "${newDup.best_match_filename ?? "another invoice"}".`,
                    });
                } else if (newDup.decision === "POSSIBLE_DUPLICATE") {
                    toast.warning("Possible duplicate", {
                        description: `${Math.round((newDup.best_match_score ?? 0) * 100)}% similarity with "${newDup.best_match_filename ?? "another invoice"}".`,
                    });
                }
            }
        }
        setInvoice(updated);
    });

    useEffect(() => {
        if (!session?.accessToken || !invoiceId) return;
        fetch(`${BACKEND_URL}/api/invoices/${invoiceId}/`, {
            headers: { Authorization: `Bearer ${session.accessToken}` },
        })
            .then((res) => {
                if (res.status === 404) throw new Error("not_found");
                if (!res.ok) throw new Error("server_error");
                return res.json() as Promise<Invoice>;
            })
            .then(setInvoice)
            .catch((e) =>
                setFetchError(
                    e.message === "not_found"
                        ? "Invoice not found."
                        : "Could not load invoice. Please try again."
                )
            )
            .finally(() => setLoading(false));
    }, [session?.accessToken, invoiceId]);

    async function handleDismissDuplicate(dismissed: boolean) {
        if (!session?.accessToken || !invoice) return;
        setDismissLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/invoices/${invoiceId}/dismiss-duplicate/`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ dismissed }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                toast.error((err as { detail?: string }).detail ?? "Could not update duplicate flag.");
                return;
            }
            const updated = await res.json() as Invoice;
            setInvoice(updated);
            toast.success(dismissed ? "Duplicate flag dismissed." : "Duplicate flag restored.");
        } catch {
            toast.error("Network error. Please try again.");
        } finally {
            setDismissLoading(false);
        }
    }

    async function handleRecheckDuplicate() {
        if (!session?.accessToken || !invoice) return;
        setRecheckLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/invoices/${invoiceId}/recheck-duplicates/`, {
                method: "POST",
                headers: { Authorization: `Bearer ${session.accessToken}` },
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                toast.error((err as { detail?: string }).detail ?? "Could not start duplicate check.");
                return;
            }
            toast.success("Duplicate re-check queued. Results will update automatically.");
        } catch {
            toast.error("Network error. Please try again.");
        } finally {
            setRecheckLoading(false);
        }
    }

    function enterEditMode() {
        if (!invoice?.extracted_data) return;
        const initial: Record<string, string> = {};
        for (const [key, entry] of Object.entries(invoice.extracted_data)) {
            // Skip list fields — they're not editable as plain text
            const isListEntry =
                Array.isArray(entry) ||
                (entry !== null && typeof entry === "object" && "value" in (entry as object) &&
                    Array.isArray((entry as { value: unknown }).value));
            if (!isListEntry) {
                const rendered = renderValue(entry as FieldEntry, key, currency);
                initial[key] = rendered === "BLANK" ? "" : rendered;
            }
        }
        setEditValues(initial);
        setEditMode(true);
    }

    function cancelEdit() {
        setEditMode(false);
        setEditValues({});
    }

    async function saveEdits() {
        if (!session?.accessToken || !invoice?.extracted_data) return;
        setSaveLoading(true);
        try {
            // Merge edited values back into the full extracted_data structure.
            const updated = { ...invoice.extracted_data };
            for (const [key, val] of Object.entries(editValues)) {
                const existing = updated[key];
                if (existing && !Array.isArray(existing) && typeof existing === "object") {
                    updated[key] = { ...existing, value: val };
                }
            }
            const res = await fetch(`${BACKEND_URL}/api/invoices/${invoiceId}/`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ extracted_data: updated }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                toast.error((err as { detail?: string }).detail ?? "Could not save changes.");
                return;
            }
            const saved = await res.json() as Invoice;
            setInvoice(saved);
            setEditMode(false);
            setEditValues({});
            toast.success("Invoice details saved.");
        } catch {
            toast.error("Network error. Please try again.");
        } finally {
            setSaveLoading(false);
        }
    }

    async function updateStatus(newStatus: InvoiceStatus) {
        if (!session?.accessToken || !invoice) return;
        setActionLoading(newStatus);
        try {
            const res = await fetch(`${BACKEND_URL}/api/invoices/${invoiceId}/`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${session.accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                toast.error((err as { detail?: string }).detail ?? "Action failed.");
                return;
            }
            const updated = await res.json() as Invoice;
            setInvoice(updated);
            const labels: Partial<Record<InvoiceStatus, string>> = {
                APPROVED: "Invoice approved.",
                REJECTED: "Invoice rejected.",
                PENDING_REVIEW: "Marked as pending review.",
            };
            toast.success(labels[newStatus] ?? "Status updated.");
        } catch {
            toast.error("Network error. Please try again.");
        } finally {
            setActionLoading(null);
        }
    }

    async function handleProcess() {
        if (!session?.accessToken || !invoice) return;
        setProcessLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/invoices/${invoiceId}/process/`, {
                method: "POST",
                headers: { Authorization: `Bearer ${session.accessToken}` },
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                toast.error((err as { detail?: string }).detail ?? "Could not start processing.");
                return;
            }
            setInvoice((prev) => prev ? { ...prev, status: "PROCESSING" } : prev);
            toast.success("AI extraction started.");
        } catch {
            toast.error("Network error. Please try again.");
        } finally {
            setProcessLoading(false);
        }
    }

    async function confirmDelete() {
        if (!session?.accessToken || !invoice) return;
        setDeleteLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/invoices/${invoiceId}/`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${session.accessToken}` },
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                toast.error((err as { detail?: string }).detail ?? "Could not delete invoice.");
                return;
            }
            setShowDeleteModal(false);
            toast.success("Invoice deleted.");
            router.push("/invoices");
        } catch {
            toast.error("Network error. Please try again.");
        } finally {
            setDeleteLoading(false);
        }
    }

    // Separate scalar fields from list fields.
    // Mindee sometimes wraps arrays as { value: [...], confidence: "..." } so we
    // detect that case too and pull the array out of the wrapper.
    const scalarFields: [string, FieldEntry][] = [];
    const listFields: [string, unknown[]][] = [];

    if (invoice?.extracted_data) {
        for (const [key, entry] of Object.entries(invoice.extracted_data)) {
            if (Array.isArray(entry)) {
                listFields.push([key, entry as unknown[]]);
            } else if (
                entry !== null &&
                typeof entry === "object" &&
                "value" in (entry as object) &&
                Array.isArray((entry as { value: unknown }).value)
            ) {
                listFields.push([key, (entry as { value: unknown[] }).value]);
            } else if (
                // Fixed backend emits { items: [...], confidence: "..." } for list fields.
                entry !== null &&
                typeof entry === "object" &&
                "items" in (entry as object) &&
                Array.isArray((entry as unknown as { items: unknown }).items)
            ) {
                listFields.push([key, (entry as unknown as { items: unknown[] }).items]);
            } else {
                scalarFields.push([key, entry as FieldEntry]);
            }
        }
    }

    const statusCfg = invoice ? (STATUS_CONFIG[invoice.status] ?? STATUS_CONFIG["UPLOADED"]) : null;
    const canApproveReject = invoice?.status === "PROCESSED" || invoice?.status === "PENDING_REVIEW";
    const canFlagReview = invoice?.status === "PROCESSED";
    const canEdit = invoice?.status === "PROCESSED" || invoice?.status === "PENDING_REVIEW";
    const hasExtractedData = scalarFields.length > 0 || listFields.length > 0;

    return (
        <>
        <DeleteConfirmModal
            isOpen={showDeleteModal}
            filename={invoice?.original_filename ?? ""}
            isDeleting={deleteLoading}
            onConfirm={confirmDelete}
            onCancel={() => !deleteLoading && setShowDeleteModal(false)}
        />
        <div className="min-h-screen bg-slate-50 flex">
            <Sidebar />
            <main className="flex-1 flex flex-col overflow-hidden">
                <AppHeader title="Invoice Detail" />

                <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
                    <Link href="/invoices" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors mb-6">
                        <ArrowLeft size={16} /> Back to Invoices
                    </Link>

                    {loading ? (
                        <div className="flex items-center justify-center py-24">
                            <Loader2 size={24} className="animate-spin text-slate-500" />
                        </div>
                    ) : fetchError ? (
                        <div className="flex items-center justify-center py-24">
                            <p className="text-red-400 text-sm">{fetchError}</p>
                        </div>
                    ) : invoice ? (
                        <div className="space-y-5">

                            {/* ── Top card: file info + controls ── */}
                            <div className="bg-white border border-slate-200 rounded-xl p-5">
                                <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                                        <FileText size={22} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-slate-900 font-semibold text-sm truncate">{invoice.original_filename}</p>
                                        <p className="text-xs text-slate-500 mt-1">Uploaded {formatDate(invoice.created_at)}</p>
                                        {invoice.updated_at !== invoice.created_at && (
                                            <p className="text-xs text-slate-400 mt-0.5">Updated {formatDate(invoice.updated_at)}</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        {statusCfg && (
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusCfg.className}`}>
                                                {statusCfg.icon} {statusCfg.label}
                                            </span>
                                        )}
                                        <button
                                            onClick={() => setShowDeleteModal(true)}
                                            title="Delete invoice"
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-medium transition-colors"
                                        >
                                            <Trash2 size={13} /> Delete
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* ── Duplicate check result ── */}
                            {invoice.duplicate_check && (
                                <DuplicateCheckCard
                                    invoice={invoice}
                                    onDismiss={handleDismissDuplicate}
                                    onRecheck={handleRecheckDuplicate}
                                    dismissLoading={dismissLoading}
                                    recheckLoading={recheckLoading}
                                />
                            )}

                            {/* ── Status cards for non-extracted states ── */}
                            {invoice.status === "UPLOADED" && (
                                <div className="bg-white border border-slate-200 rounded-xl p-5">
                                    <p className="text-slate-900 font-semibold text-sm mb-1">Not yet processed</p>
                                    <p className="text-xs text-slate-500 mb-4">
                                        This invoice hasn&apos;t been sent for AI extraction yet. Process it when you&apos;re ready.
                                    </p>
                                    <button
                                        onClick={handleProcess}
                                        disabled={processLoading}
                                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
                                    >
                                        {processLoading ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
                                        Process Now
                                    </button>
                                </div>
                            )}

                            {invoice.status === "PROCESSING" && (
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 flex gap-3">
                                    <Loader2 size={18} className="text-blue-600 shrink-0 mt-0.5 animate-spin" />
                                    <div>
                                        <p className="text-blue-700 font-semibold text-sm mb-1">AI Extraction In Progress</p>
                                        <p className="text-xs text-blue-600">Extracted data will appear here once complete.</p>
                                    </div>
                                </div>
                            )}

                            {invoice.status === "PROCESSING_FAILED" && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-5">
                                    <div className="flex gap-3 mb-4">
                                        <AlertTriangle size={18} className="text-red-600 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-red-700 font-semibold text-sm mb-1">Extraction Failed</p>
                                            <p className="text-xs text-red-600">{invoice.error_message || "An error occurred during AI extraction."}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleProcess}
                                        disabled={processLoading}
                                        className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-200 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
                                    >
                                        {processLoading ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
                                        Retry Processing
                                    </button>
                                </div>
                            )}

                            {/* ── File preview (full-width) when there's no extracted data yet ── */}
                            {invoice.file_url && !hasExtractedData && (
                                <div style={{ height: "520px" }}>
                                    <FilePreview fileUrl={invoice.file_url} filename={invoice.original_filename} />
                                </div>
                            )}

                            {/* ── Compare view: file preview + extracted data side-by-side ── */}
                            {hasExtractedData && (
                                <div className="grid lg:grid-cols-[3fr_2fr] gap-5 items-start">

                                    {/* LEFT: file preview */}
                                    {invoice.file_url ? (
                                        <div className="lg:sticky lg:top-4" style={{ minHeight: "500px" }}>
                                            <FilePreview fileUrl={invoice.file_url} filename={invoice.original_filename} />
                                        </div>
                                    ) : (
                                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-slate-400 min-h-[200px]">
                                            <FileText size={32} className="mb-2 text-slate-400" />
                                            <p className="text-sm">File preview unavailable.</p>
                                        </div>
                                    )}

                                    {/* RIGHT: extracted fields + review */}
                                    <div className="space-y-4">

                                        {/* Extracted scalar fields */}
                                        {scalarFields.length > 0 && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className="bg-white border border-slate-200 rounded-xl p-5"
                                            >
                                                <div className="flex items-center justify-between mb-4">
                                                    <h3 className="text-sm font-semibold text-slate-900">Extracted Fields</h3>
                                                    {canEdit && !editMode && (
                                                        <button
                                                            onClick={enterEditMode}
                                                            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700 border border-slate-200 hover:border-slate-300 px-2.5 py-1.5 rounded-lg transition-colors"
                                                        >
                                                            <Pencil size={12} /> Edit
                                                        </button>
                                                    )}
                                                    {editMode && (
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={cancelEdit}
                                                                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 px-2 py-1.5 rounded-lg transition-colors"
                                                            >
                                                                <X size={12} /> Cancel
                                                            </button>
                                                            <button
                                                                onClick={saveEdits}
                                                                disabled={saveLoading}
                                                                className="inline-flex items-center gap-1.5 text-xs text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 px-2.5 py-1.5 rounded-lg transition-colors font-medium"
                                                            >
                                                                {saveLoading ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                                                                Save
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="space-y-2">
                                                    {scalarFields.map(([key, entry]) => {
                                                        const conf = (entry as { confidence?: string | number } | null)?.confidence;
                                                        return (
                                                            <div key={key} className="bg-slate-50 rounded-lg px-4 py-3">
                                                                <div className="flex items-start justify-between gap-3">
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="text-[10px] uppercase tracking-wide text-slate-400 mb-1">{fieldLabel(key)}</div>
                                                                        {editMode ? (
                                                                            <input
                                                                                type="text"
                                                                                value={editValues[key] ?? ""}
                                                                                onChange={(e) => setEditValues((prev) => ({ ...prev, [key]: e.target.value }))}
                                                                                className="w-full bg-white border border-slate-200 focus:border-primary-500 focus:outline-none rounded px-2 py-1 text-sm text-slate-900 placeholder-slate-400"
                                                                            />
                                                                        ) : (
                                                                            <div className="text-sm text-slate-900 font-medium truncate">{renderValue(entry, key, currency)}</div>
                                                                        )}
                                                                    </div>
                                                                    <ConfidenceBadge confidence={conf} />
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </motion.div>
                                        )}

                                        {/* Line items */}
                                        {listFields.map(([key, items]) => (
                                            <div key={key} className="bg-white border border-slate-200 rounded-xl p-5">
                                                <h3 className="text-sm font-semibold text-slate-900 mb-4">{fieldLabel(key)}</h3>
                                                <LineItemsTable items={items as LineItem[]} />
                                            </div>
                                        ))}

                                        {/* Review actions */}
                                        {(canApproveReject || invoice.status === "APPROVED" || invoice.status === "REJECTED") && (
                                            <div className="bg-white border border-slate-200 rounded-xl p-5">
                                                <h3 className="text-sm font-semibold text-slate-900 mb-4">Review</h3>

                                                {canApproveReject && (
                                                    <div className="space-y-3">
                                                        {canFlagReview && (
                                                            <button
                                                                onClick={() => updateStatus("PENDING_REVIEW")}
                                                                disabled={!!actionLoading || editMode}
                                                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 text-sm text-slate-700 transition-all"
                                                            >
                                                                {actionLoading === "PENDING_REVIEW"
                                                                    ? <Loader2 size={15} className="animate-spin" />
                                                                    : <Eye size={15} className="text-purple-600" />}
                                                                Flag for Review
                                                            </button>
                                                        )}
                                                        <div className="flex gap-3">
                                                            <button
                                                                onClick={() => updateStatus("REJECTED")}
                                                                disabled={!!actionLoading || editMode}
                                                                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 text-sm text-slate-700 transition-all"
                                                            >
                                                                {actionLoading === "REJECTED"
                                                                    ? <Loader2 size={15} className="animate-spin" />
                                                                    : <XCircle size={15} className="text-red-600" />}
                                                                Reject
                                                            </button>
                                                            <button
                                                                onClick={() => updateStatus("APPROVED")}
                                                                disabled={!!actionLoading || editMode}
                                                                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-sm text-white font-medium transition-all"
                                                            >
                                                                {actionLoading === "APPROVED"
                                                                    ? <Loader2 size={15} className="animate-spin" />
                                                                    : <CheckCircle2 size={15} />}
                                                                Approve
                                                            </button>
                                                        </div>
                                                        {editMode && (
                                                            <p className="text-[11px] text-yellow-500/80 text-center">Save your edits before reviewing.</p>
                                                        )}
                                                    </div>
                                                )}

                                                {(invoice.status === "APPROVED" || invoice.status === "REJECTED") && (
                                                    <p className="text-xs text-slate-500 text-center">
                                                        This invoice has been{" "}
                                                        <span className={invoice.status === "APPROVED" ? "text-green-600" : "text-red-600"}>
                                                            {invoice.status.toLowerCase()}
                                                        </span>.
                                                    </p>
                                                )}
                                            </div>
                                        )}

                                    </div>
                                </div>
                            )}

                        </div>
                    ) : null}
                </div>
            </main>
        </div>
        </>
    );
}
