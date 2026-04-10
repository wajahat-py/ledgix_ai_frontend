"use client";

import { Suspense } from "react";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
    Search, ChevronDown, CheckCircle2, AlertCircle,
    Loader2, FileText, UploadCloud, Eye, Play, Trash2, AlertTriangle,
    Download, FileSpreadsheet, FileType2, BookOpen, RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import Sidebar from "@/components/Sidebar";
import AppHeader from "@/components/AppHeader";
import { useInvoiceSocket } from "@/hooks/useInvoiceSocket";
import { useOrg } from "@/lib/org-context";
import type { Invoice, InvoiceStatus } from "@/types/invoice";
import { exportCSV, exportExcel, exportPDF, exportQuickBooks, exportXero } from "@/lib/invoice-export";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

// ── helpers ───────────────────────────────────────────────────────────────────

function extractField(data: Invoice["extracted_data"], ...keys: string[]): string {
    if (!data) return "—";
    for (const key of keys) {
        const entry = data[key];
        if (entry && entry.value != null && entry.value !== "") return String(entry.value);
    }
    return "—";
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ── status config ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<InvoiceStatus, { label: string; className: string; icon: React.ReactNode }> = {
    UPLOADED:          { label: "Uploaded",       className: "bg-slate-100 text-slate-600 border-slate-200",        icon: <FileText size={12} /> },
    PROCESSING:        { label: "Processing",     className: "bg-blue-50 text-blue-600 border-blue-200",            icon: <Loader2 size={12} className="animate-spin" /> },
    PROCESSED:         { label: "Processed",      className: "bg-cyan-50 text-cyan-700 border-cyan-200",            icon: <CheckCircle2 size={12} /> },
    PROCESSING_FAILED: { label: "Failed",         className: "bg-red-50 text-red-600 border-red-200",               icon: <AlertCircle size={12} /> },
    PENDING_REVIEW:    { label: "Pending Review", className: "bg-purple-50 text-purple-700 border-purple-200",      icon: <Eye size={12} /> },
    APPROVED:          { label: "Approved",       className: "bg-green-50 text-green-700 border-green-200",         icon: <CheckCircle2 size={12} /> },
    REJECTED:          { label: "Rejected",       className: "bg-slate-100 text-slate-500 border-slate-200",        icon: <AlertCircle size={12} /> },
};

const STATUS_FILTER_OPTIONS: Array<"All" | InvoiceStatus> = [
    "All", "UPLOADED", "PROCESSING", "PROCESSED", "PROCESSING_FAILED", "PENDING_REVIEW", "APPROVED", "REJECTED",
];

const STATUS_LABELS: Record<"All" | InvoiceStatus, string> = {
    All: "All statuses",
    UPLOADED: "Uploaded", PROCESSING: "Processing", PROCESSED: "Processed",
    PROCESSING_FAILED: "Failed", PENDING_REVIEW: "Pending Review",
    APPROVED: "Approved", REJECTED: "Rejected",
};

// ── delete confirm modal ──────────────────────────────────────────────────────

function DeleteConfirmModal({
    invoice,
    isDeleting,
    onConfirm,
    onCancel,
}: {
    invoice: Invoice | null;
    isDeleting: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    const overlayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!invoice) return;
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [invoice, onCancel]);

    return (
        <AnimatePresence>
            {invoice && (
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
                        initial={{ opacity: 0, scale: 0.96, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 8 }}
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
                            <span className="text-slate-900 font-medium break-all">{invoice.original_filename}</span>?
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

// ── component ─────────────────────────────────────────────────────────────────

export default function InvoicesPage() {
    return (
        <Suspense>
            <InvoicesPageInner />
        </Suspense>
    );
}

function InvoicesPageInner() {
    const { data: session } = useSession();
    const { canUpload, canDeleteAny, role } = useOrg();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>(() => {
        const s = searchParams.get("status");
        return (s && STATUS_FILTER_OPTIONS.includes(s as "All")) ? s : "All";
    });
    const [processingIds, setProcessingIds] = useState<Set<number>>(new Set());
    const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDuplicatesOnly, setShowDuplicatesOnly] = useState<boolean>(() => searchParams.get("duplicates") === "true");
    const [exportOpen, setExportOpen] = useState(false);
    const [exporting, setExporting] = useState(false);
    const exportMenuRef = useRef<HTMLDivElement>(null);

    const invoicesRef = useRef<Invoice[]>([]);
    invoicesRef.current = invoices;

    useInvoiceSocket((updated) => {
        const prev = invoicesRef.current.find((inv) => inv.id === updated.id);

        if (!prev) {
            toast.info(`New invoice detected from email: "${updated.original_filename}"`, {
                description: "It's been queued for AI extraction.",
            });
            setInvoices((list) => [updated, ...list]);
            return;
        }

        if (prev.status !== updated.status) {
            if (updated.status === "PROCESSED") {
                toast.success(`"${updated.original_filename}" processed successfully.`);
            } else if (updated.status === "PROCESSING_FAILED") {
                toast.error(`"${updated.original_filename}" processing failed.`);
            }
        }
        const prevDup = prev.duplicate_check;
        const newDup  = updated.duplicate_check;
        if (!prevDup && newDup && !newDup.dismissed) {
            if (newDup.decision === "DUPLICATE") {
                toast.error(`Duplicate detected: "${updated.original_filename}"`, {
                    description: `${Math.round((newDup.best_match_score ?? 0) * 100)}% match with another invoice.`,
                });
            } else if (newDup.decision === "POSSIBLE_DUPLICATE") {
                toast.warning(`Possible duplicate: "${updated.original_filename}"`, {
                    description: `${Math.round((newDup.best_match_score ?? 0) * 100)}% similarity detected.`,
                });
            }
        }

        setInvoices((list) =>
            list.map((inv) => inv.id === updated.id ? updated : inv)
        );
    });

    // Close export dropdown when clicking outside
    useEffect(() => {
        if (!exportOpen) return;
        function onClickOutside(e: MouseEvent) {
            if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
                setExportOpen(false);
            }
        }
        document.addEventListener("mousedown", onClickOutside);
        return () => document.removeEventListener("mousedown", onClickOutside);
    }, [exportOpen]);

    async function handleExport(format: "csv" | "excel" | "pdf" | "quickbooks" | "xero") {
        if (filtered.length === 0) {
            toast.error("No invoices to export. Adjust your filters.");
            return;
        }
        setExportOpen(false);
        setExporting(true);
        try {
            if (format === "csv") {
                exportCSV(filtered);
                toast.success(`Exported ${filtered.length} invoice${filtered.length > 1 ? "s" : ""} as CSV.`);
            } else if (format === "excel") {
                await exportExcel(filtered);
                toast.success(`Exported ${filtered.length} invoice${filtered.length > 1 ? "s" : ""} as Excel.`);
            } else if (format === "pdf") {
                await exportPDF(filtered);
                toast.success(`Exported ${filtered.length} invoice${filtered.length > 1 ? "s" : ""} as PDF.`);
            } else if (format === "quickbooks") {
                exportQuickBooks(filtered);
                toast.success(`QuickBooks IIF file downloaded (${filtered.length} invoice${filtered.length > 1 ? "s" : ""}).`);
            } else if (format === "xero") {
                exportXero(filtered);
                toast.success(`Xero import CSV downloaded (${filtered.length} invoice${filtered.length > 1 ? "s" : ""}).`);
            }
        } catch {
            toast.error("Export failed. Please try again.");
        } finally {
            setExporting(false);
        }
    }

    async function handleProcess(invoice: Invoice) {
        if (!session?.accessToken) return;
        setProcessingIds((prev) => new Set(prev).add(invoice.id));
        try {
            const res = await fetch(`${BACKEND_URL}/api/invoices/${invoice.id}/process/`, {
                method: "POST",
                headers: { Authorization: `Bearer ${session.accessToken}` },
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                toast.error((err as { detail?: string }).detail ?? "Could not start processing.");
                return;
            }
            setInvoices((prev) =>
                prev.map((inv) => inv.id === invoice.id ? { ...inv, status: "PROCESSING" } : inv)
            );
            toast.success(`"${invoice.original_filename}" sent for AI extraction.`);
        } catch {
            toast.error("Network error. Please try again.");
        } finally {
            setProcessingIds((prev) => { const s = new Set(prev); s.delete(invoice.id); return s; });
        }
    }

    async function confirmDelete() {
        if (!session?.accessToken || !deleteTarget) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/invoices/${deleteTarget.id}/`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${session.accessToken}` },
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                toast.error((err as { detail?: string }).detail ?? "Could not delete invoice.");
                return;
            }
            const name = deleteTarget.original_filename;
            setInvoices((prev) => prev.filter((inv) => inv.id !== deleteTarget.id));
            setDeleteTarget(null);
            toast.success(`"${name}" deleted.`);
        } catch {
            toast.error("Network error. Please try again.");
        } finally {
            setIsDeleting(false);
        }
    }

    useEffect(() => {
        if (!session?.accessToken) return;
        setLoading(true);
        fetch(`${BACKEND_URL}/api/invoices/`, {
            headers: { Authorization: `Bearer ${session.accessToken}` },
        })
            .then((res) => {
                if (!res.ok) throw new Error(`Server error ${res.status}`);
                return res.json() as Promise<Invoice[]>;
            })
            .then(setInvoices)
            .catch(() => setError("Could not load invoices. Please refresh the page."))
            .finally(() => setLoading(false));
    }, [session?.accessToken]);

    const filtered = invoices.filter((inv) => {
        const vendor = extractField(inv.extracted_data, "supplier_name", "vendor_name", "seller_name");
        const matchSearch =
            inv.original_filename.toLowerCase().includes(search.toLowerCase()) ||
            vendor.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === "All" || inv.status === statusFilter;
        const matchDuplicate = !showDuplicatesOnly || (
            inv.duplicate_check !== null &&
            inv.duplicate_check.decision !== "UNIQUE" &&
            !inv.duplicate_check.dismissed
        );
        return matchSearch && matchStatus && matchDuplicate;
    });

    const duplicateCount = invoices.filter(
        (inv) => inv.duplicate_check && inv.duplicate_check.decision !== "UNIQUE" && !inv.duplicate_check.dismissed
    ).length;

    return (
        <>
            <DeleteConfirmModal
                invoice={deleteTarget}
                isDeleting={isDeleting}
                onConfirm={confirmDelete}
                onCancel={() => !isDeleting && setDeleteTarget(null)}
            />

            <div className="min-h-screen bg-slate-50 flex">
                <Sidebar />

                <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
                    <AppHeader title="Invoices" />

                    <div className="flex-1 overflow-auto p-4 pb-24 md:p-6 md:pb-6">
                        <div className="bg-white border border-slate-200 rounded-xl flex flex-col">

                            {/* Controls */}
                            <div className="px-4 py-3 border-b border-slate-200 flex flex-col sm:flex-row gap-2 justify-between items-center">
                                <div className="flex gap-2 w-full sm:w-auto">
                                    <div className="relative flex-1 sm:w-60">
                                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Search filename or vendor…"
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-400"
                                        />
                                    </div>
                                    <div className="relative">
                                        <select
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                            className="appearance-none pl-3 pr-7 py-1.5 bg-white border border-slate-200 rounded-lg text-[13px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer"
                                        >
                                            {STATUS_FILTER_OPTIONS.map((s) => (
                                                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setShowDuplicatesOnly((v) => !v)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12px] font-medium transition-colors whitespace-nowrap ${
                                            showDuplicatesOnly
                                                ? "bg-red-50 border-red-200 text-red-600"
                                                : "bg-white border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300"
                                        }`}
                                    >
                                        <AlertTriangle size={12} />
                                        Duplicates
                                        {duplicateCount > 0 && (
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-600">
                                                {duplicateCount}
                                            </span>
                                        )}
                                    </button>

                                    {/* Export dropdown */}
                                    <div className="relative" ref={exportMenuRef}>
                                        <button
                                            onClick={() => setExportOpen((v) => !v)}
                                            disabled={exporting}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-[12px] text-slate-600 hover:text-slate-800 font-medium transition-colors whitespace-nowrap disabled:opacity-50"
                                        >
                                            {exporting
                                                ? <Loader2 size={12} className="animate-spin" />
                                                : <Download size={12} />}
                                            Export
                                            <ChevronDown size={10} className={`transition-transform ${exportOpen ? "rotate-180" : ""}`} />
                                        </button>

                                        <AnimatePresence>
                                            {exportOpen && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.96, y: -4 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.96, y: -4 }}
                                                    transition={{ duration: 0.12 }}
                                                    className="absolute right-0 top-full mt-1.5 w-52 bg-white border border-slate-200 rounded-xl shadow-lg z-50"
                                                >
                                                    <div className="px-3 py-2 border-b border-slate-100">
                                                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                                            Export {filtered.length} invoice{filtered.length !== 1 ? "s" : ""}
                                                        </p>
                                                    </div>

                                                    <div className="py-1">
                                                        <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Standard</p>
                                                        <button
                                                            onClick={() => handleExport("csv")}
                                                            className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] text-slate-700 hover:bg-slate-50 transition-colors"
                                                        >
                                                            <FileText size={13} className="text-slate-400 shrink-0" />
                                                            CSV (.csv)
                                                        </button>
                                                        <button
                                                            onClick={() => handleExport("excel")}
                                                            className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] text-slate-700 hover:bg-slate-50 transition-colors"
                                                        >
                                                            <FileSpreadsheet size={13} className="text-green-600 shrink-0" />
                                                            Excel (.xlsx)
                                                        </button>
                                                        <button
                                                            onClick={() => handleExport("pdf")}
                                                            className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] text-slate-700 hover:bg-slate-50 transition-colors"
                                                        >
                                                            <FileType2 size={13} className="text-red-500 shrink-0" />
                                                            PDF (.pdf)
                                                        </button>
                                                    </div>

                                                    <div className="py-1 border-t border-slate-100">
                                                        <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Accounting Import</p>
                                                        <button
                                                            onClick={() => handleExport("quickbooks")}
                                                            className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] text-slate-700 hover:bg-slate-50 transition-colors"
                                                        >
                                                            <BookOpen size={13} className="text-blue-500 shrink-0" />
                                                            QuickBooks (.iif)
                                                        </button>
                                                        <button
                                                            onClick={() => handleExport("xero")}
                                                            className="w-full flex items-center gap-2.5 px-3 py-2 text-[12px] text-slate-700 hover:bg-slate-50 transition-colors"
                                                        >
                                                            <RefreshCw size={13} className="text-sky-500 shrink-0" />
                                                            Xero CSV (.csv)
                                                        </button>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {canUpload && (
                                        <Link
                                            href="/upload"
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 rounded-lg text-[12px] text-white font-medium transition-colors whitespace-nowrap"
                                        >
                                            <UploadCloud size={13} /> Upload
                                        </Link>
                                    )}
                                </div>
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-slate-200">
                                            <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Vendor / File</th>
                                            <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Invoice #</th>
                                            <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Date</th>
                                            <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-right">Amount</th>
                                            <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Status</th>
                                            <th className="px-5 py-3" />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr>
                                                <td colSpan={6} className="px-5 py-16 text-center">
                                                    <Loader2 size={18} className="animate-spin text-slate-400 mx-auto" />
                                                </td>
                                            </tr>
                                        ) : error ? (
                                            <tr>
                                                <td colSpan={6} className="px-5 py-16 text-center text-red-600 text-sm">{error}</td>
                                            </tr>
                                        ) : filtered.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-5 py-16 text-center">
                                                    <FileText size={28} className="text-slate-400 mx-auto mb-3" />
                                                    <p className="text-slate-400 text-[13px]">
                                                        {invoices.length === 0
                                                            ? "No invoices yet. Upload one to get started."
                                                            : "No invoices match your filters."}
                                                    </p>
                                                </td>
                                            </tr>
                                        ) : (
                                            <AnimatePresence initial={false}>
                                                {filtered.map((inv, i) => {
                                                    const vendor = extractField(inv.extracted_data, "supplier_name", "vendor_name", "seller_name");
                                                    const invoiceNum = extractField(inv.extracted_data, "invoice_number", "invoice_id", "reference_number");
                                                    const amount = extractField(inv.extracted_data, "total_amount", "total_net", "amount_due", "grand_total");
                                                    const invDate = extractField(inv.extracted_data, "date", "invoice_date", "issue_date");
                                                    const cfg = STATUS_CONFIG[inv.status] ?? STATUS_CONFIG["UPLOADED"];
                                                    const dup = inv.duplicate_check;
                                                    const isDup = (dup?.decision === "DUPLICATE" || dup?.decision === "POSSIBLE_DUPLICATE") && !dup?.dismissed;

                                                    return (
                                                        <motion.tr
                                                            key={inv.id}
                                                            layout
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                            exit={{ opacity: 0, transition: { duration: 0.15 } }}
                                                            transition={{ delay: i * 0.02, duration: 0.18 }}
                                                            onClick={() => router.push(`/invoices/${inv.id}`)}
                                                            className="border-b border-slate-100 hover:bg-slate-50 transition-colors group cursor-pointer"
                                                        >
                                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-[11px] font-bold text-slate-500 shrink-0">
                                                                        {vendor !== "—" ? vendor.charAt(0).toUpperCase() : <FileText size={13} className="text-slate-400" />}
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <div className="flex items-center gap-2">
                                                                            <p className="font-medium text-slate-900 text-[13px] truncate max-w-[200px]">
                                                                                {vendor !== "—" ? vendor : inv.original_filename}
                                                                            </p>
                                                                            {isDup && (
                                                                                <span
                                                                                    title={`${dup.decision === "DUPLICATE" ? "Duplicate" : "Possible Duplicate"} (${Math.round((dup.best_match_score || 0) * 100)}% match)`}
                                                                                    className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                                                                                        dup.decision === "DUPLICATE"
                                                                                        ? "bg-red-50 text-red-600 border-red-200"
                                                                                        : "bg-amber-50 text-amber-600 border-amber-200"
                                                                                    }`}
                                                                                >
                                                                                    <AlertTriangle size={8} /> DUP
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        {vendor !== "—" && (
                                                                            <p className="text-[11px] text-slate-400 truncate max-w-[200px] mt-0.5">{inv.original_filename}</p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-3.5 whitespace-nowrap font-mono text-[12px] text-slate-400">{invoiceNum}</td>
                                                            <td className="px-5 py-3.5 whitespace-nowrap text-[12px] text-slate-400">
                                                                {invDate !== "—" ? invDate : formatDate(inv.created_at)}
                                                            </td>
                                                            <td className="px-5 py-3.5 whitespace-nowrap text-[13px] font-mono font-semibold text-slate-900 text-right">{amount}</td>
                                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${cfg.className}`}>
                                                                    {cfg.icon} {cfg.label}
                                                                </span>
                                                            </td>
                                                            <td className="px-5 py-3.5 whitespace-nowrap text-right">
                                                                <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                    {canUpload && (inv.status === "UPLOADED" || inv.status === "PROCESSING_FAILED") && (
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); handleProcess(inv); }}
                                                                            disabled={processingIds.has(inv.id)}
                                                                            className="inline-flex items-center gap-1 text-[11px] text-primary-600 hover:text-primary-700 disabled:opacity-50 transition-colors"
                                                                        >
                                                                            {processingIds.has(inv.id)
                                                                                ? <Loader2 size={10} className="animate-spin" />
                                                                                : <Play size={10} />}
                                                                            Process
                                                                        </button>
                                                                    )}
                                                                    {(canDeleteAny || role === "member") && (
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); setDeleteTarget(inv); }}
                                                                            className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-red-600 transition-colors"
                                                                        >
                                                                            <Trash2 size={10} /> Delete
                                                                        </button>
                                                                    )}
                                                                    <span className="text-[11px] text-slate-400 group-hover:text-slate-600 transition-colors">
                                                                        Open →
                                                                    </span>
                                                                </div>
                                                            </td>
                                                        </motion.tr>
                                                    );
                                                })}
                                            </AnimatePresence>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Footer */}
                            {!loading && !error && (
                                <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between">
                                    <span className="text-[12px] text-slate-400">
                                        <span className="text-slate-700 font-medium">{filtered.length}</span> of{" "}
                                        <span className="text-slate-700 font-medium">{invoices.length}</span> invoices
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}
