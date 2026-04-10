"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
    CheckCircle2, XCircle, FileText, Loader2,
    Clock, User, AlertTriangle, CheckSquare,
} from "lucide-react";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import AppHeader from "@/components/AppHeader";
import { api } from "@/services/api";
import { useOrg } from "@/lib/org-context";
import { useInvoiceSocket } from "@/hooks/useInvoiceSocket";
import type { Invoice } from "@/types/invoice";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

function extractField(data: Invoice["extracted_data"], ...keys: string[]): string {
    if (!data) return "—";
    for (const key of keys) {
        const e = data[key];
        if (e && e.value != null && e.value !== "") return String(e.value);
    }
    return "—";
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ── Reject modal ──────────────────────────────────────────────────────────────

function RejectModal({
    invoice,
    onConfirm,
    onCancel,
    loading,
}: {
    invoice: Invoice | null;
    onConfirm: (reason: string) => void;
    onCancel: () => void;
    loading: boolean;
}) {
    const [reason, setReason] = useState("");
    const overlayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!invoice) return;
        setReason("");
        const h = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
        window.addEventListener("keydown", h);
        return () => window.removeEventListener("keydown", h);
    }, [invoice, onCancel]);

    return (
        <AnimatePresence>
            {invoice && (
                <motion.div
                    ref={overlayRef}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
                    onClick={(e) => { if (e.target === overlayRef.current) onCancel(); }}
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 8 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 8 }}
                        transition={{ duration: 0.18 }}
                        className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-sm shadow-xl"
                    >
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-red-50 border border-red-200 flex items-center justify-center shrink-0">
                                <XCircle size={18} className="text-red-600" />
                            </div>
                            <div>
                                <p className="text-slate-900 font-semibold text-sm">Reject Invoice</p>
                                <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[180px]">{invoice.original_filename}</p>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label htmlFor="reason" className="block text-[12px] font-medium text-slate-700 mb-1.5">
                                Reason <span className="text-slate-400 font-normal">(optional)</span>
                            </label>
                            <textarea
                                id="reason"
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                rows={3}
                                placeholder="Why is this invoice being rejected?"
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none transition-all"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={onCancel}
                                disabled={loading}
                                className="flex-1 py-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-sm text-slate-700 transition-colors disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => onConfirm(reason)}
                                disabled={loading}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-sm text-white font-semibold transition-colors disabled:opacity-50"
                            >
                                {loading
                                    ? <><Loader2 size={14} className="animate-spin" /> Rejecting…</>
                                    : <><XCircle size={14} /> Reject</>}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// ── main component ────────────────────────────────────────────────────────────

export default function ApprovalQueuePage() {
    const router = useRouter();
    const { canApprove } = useOrg();

    const [invoices,   setInvoices]   = useState<Invoice[]>([]);
    const [loading,    setLoading]    = useState(true);
    const [error,      setError]      = useState("");
    const [approving,  setApproving]  = useState<Set<number>>(new Set());
    const [rejectTarget, setRejectTarget] = useState<Invoice | null>(null);
    const [rejecting,    setRejecting]    = useState(false);

    const invoicesRef = useRef<Invoice[]>([]);
    invoicesRef.current = invoices;

    // Live updates via WebSocket
    useInvoiceSocket((updated) => {
        if (updated.status === "PENDING_REVIEW") {
            setInvoices((prev) => {
                const exists = prev.find((i) => i.id === updated.id);
                return exists ? prev.map((i) => i.id === updated.id ? updated : i) : [updated, ...prev];
            });
        } else {
            // Moved out of pending — remove from queue
            setInvoices((prev) => prev.filter((i) => i.id !== updated.id));
        }
    });

    const load = () => {
        setLoading(true);
        api.get<Invoice[]>("/api/invoices/", { params: { status: "PENDING_REVIEW" } })
            .then((res) => {
                const pending = res.data.filter((i) => i.status === "PENDING_REVIEW");
                setInvoices(pending);
            })
            .catch(() => setError("Could not load the approval queue. Please refresh."))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const handleApprove = async (invoice: Invoice) => {
        setApproving((prev) => new Set(prev).add(invoice.id));
        try {
            await api.patch(`/api/invoices/${invoice.id}/`, { status: "APPROVED" });
            setInvoices((prev) => prev.filter((i) => i.id !== invoice.id));
            toast.success(`"${invoice.original_filename}" approved.`);
        } catch (err: unknown) {
            const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
            toast.error(detail ?? "Failed to approve invoice.");
        } finally {
            setApproving((prev) => { const s = new Set(prev); s.delete(invoice.id); return s; });
        }
    };

    const handleReject = async (reason: string) => {
        if (!rejectTarget) return;
        setRejecting(true);
        try {
            await api.patch(`/api/invoices/${rejectTarget.id}/`, {
                status: "REJECTED",
                rejection_reason: reason,
            });
            setInvoices((prev) => prev.filter((i) => i.id !== rejectTarget.id));
            toast.success(`"${rejectTarget.original_filename}" rejected.`);
            setRejectTarget(null);
        } catch (err: unknown) {
            const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
            toast.error(detail ?? "Failed to reject invoice.");
        } finally {
            setRejecting(false);
        }
    };

    return (
        <>
            <RejectModal
                invoice={rejectTarget}
                onConfirm={handleReject}
                onCancel={() => !rejecting && setRejectTarget(null)}
                loading={rejecting}
            />

            <div className="min-h-screen bg-slate-50 flex">
                <Sidebar />
                <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
                    <AppHeader title="Approval Queue" />

                    <div className="flex-1 overflow-auto p-4 pb-24 md:p-6 md:pb-6">
                        <div className="bg-white border border-slate-200 rounded-xl flex flex-col">

                            {/* Header */}
                            <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <CheckSquare size={15} className="text-slate-400" />
                                    <span className="text-[13px] font-semibold text-slate-700">Pending Review</span>
                                    {!loading && (
                                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-semibold">
                                            {invoices.length}
                                        </span>
                                    )}
                                </div>
                                {!canApprove && (
                                    <span className="text-[11px] text-slate-400">View only — you don&apos;t have approval permission</span>
                                )}
                            </div>

                            {/* Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="border-b border-slate-200">
                                            <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Vendor / File</th>
                                            <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Amount</th>
                                            <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Uploaded by</th>
                                            <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Date</th>
                                            {canApprove && <th className="px-5 py-3" />}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr>
                                                <td colSpan={5} className="px-5 py-16 text-center">
                                                    <Loader2 size={18} className="animate-spin text-slate-400 mx-auto" />
                                                </td>
                                            </tr>
                                        ) : error ? (
                                            <tr>
                                                <td colSpan={5} className="px-5 py-16 text-center text-red-600 text-sm">{error}</td>
                                            </tr>
                                        ) : invoices.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="px-5 py-16 text-center">
                                                    <CheckCircle2 size={28} className="text-green-400 mx-auto mb-3" />
                                                    <p className="text-slate-400 text-[13px]">No invoices pending review.</p>
                                                </td>
                                            </tr>
                                        ) : (
                                            <AnimatePresence initial={false}>
                                                {invoices.map((inv, i) => {
                                                    const vendor  = extractField(inv.extracted_data, "supplier_name", "vendor_name", "seller_name");
                                                    const amount  = extractField(inv.extracted_data, "total_amount", "total_net", "amount_due", "grand_total");
                                                    const invDate = extractField(inv.extracted_data, "date", "invoice_date", "issue_date");
                                                    const isApproving = approving.has(inv.id);

                                                    return (
                                                        <motion.tr
                                                            key={inv.id}
                                                            layout
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                            exit={{ opacity: 0, transition: { duration: 0.15 } }}
                                                            transition={{ delay: i * 0.02, duration: 0.18 }}
                                                            onClick={() => router.push(`/invoices/${inv.id}`)}
                                                            className="border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer group"
                                                        >
                                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                                                                        <Clock size={13} className="text-amber-600" />
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <p className="font-medium text-slate-900 text-[13px] truncate max-w-[200px]">
                                                                            {vendor !== "—" ? vendor : inv.original_filename}
                                                                        </p>
                                                                        {vendor !== "—" && (
                                                                            <p className="text-[11px] text-slate-400 truncate max-w-[200px]">{inv.original_filename}</p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-3.5 whitespace-nowrap font-mono text-[13px] font-semibold text-slate-900">{amount}</td>
                                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                                <div className="flex items-center gap-1.5">
                                                                    <User size={11} className="text-slate-400" />
                                                                    <span className="text-[12px] text-slate-600">{inv.uploaded_by_name}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-3.5 whitespace-nowrap text-[12px] text-slate-400">
                                                                {invDate !== "—" ? invDate : formatDate(inv.created_at)}
                                                            </td>
                                                            {canApprove && (
                                                                <td className="px-5 py-3.5 whitespace-nowrap text-right">
                                                                    <div
                                                                        className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    >
                                                                        <button
                                                                            onClick={() => handleApprove(inv)}
                                                                            disabled={isApproving}
                                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-500 text-white text-[11px] font-semibold transition-colors disabled:opacity-50"
                                                                        >
                                                                            {isApproving
                                                                                ? <Loader2 size={11} className="animate-spin" />
                                                                                : <CheckCircle2 size={11} />}
                                                                            Approve
                                                                        </button>
                                                                        <button
                                                                            onClick={() => setRejectTarget(inv)}
                                                                            disabled={isApproving}
                                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 text-[11px] font-semibold transition-colors disabled:opacity-50"
                                                                        >
                                                                            <XCircle size={11} />
                                                                            Reject
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            )}
                                                        </motion.tr>
                                                    );
                                                })}
                                            </AnimatePresence>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {!loading && !error && (
                                <div className="px-5 py-3 border-t border-slate-100">
                                    <span className="text-[12px] text-slate-400">
                                        <span className="text-slate-700 font-medium">{invoices.length}</span> invoice{invoices.length !== 1 ? "s" : ""} pending review
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
