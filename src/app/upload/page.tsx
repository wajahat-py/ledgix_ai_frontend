"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    UploadCloud, X, CheckCircle2, File,
    Loader2, AlertCircle, ArrowRight, Mail, Lock,
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import Sidebar from "@/components/Sidebar";
import AppHeader from "@/components/AppHeader";
import { useUsage } from "@/hooks/useUsage";
import type { Invoice } from "@/types/invoice";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";
const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/tiff"];
const MAX_SIZE_MB = 10;

interface QueuedFile {
    file: File;
    error: string;
}

export default function UploadPage() {
    const { data: session } = useSession();
    const { usage, loading: usageLoading, atLimit } = useUsage();

    const [isDragging, setIsDragging] = useState(false);
    const [files, setFiles] = useState<QueuedFile[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploaded, setUploaded] = useState<Invoice[]>([]);
    const usageNearLimit =
        usage?.invoice_limit !== null &&
        usage?.invoice_limit !== undefined &&
        usage.invoice_limit > 0 &&
        usage.invoice_count / usage.invoice_limit >= 0.8;

    // ── file selection ────────────────────────────────────────────────────────

    function addFiles(fileList: FileList | File[]) {
        const valid: QueuedFile[] = [];
        for (const f of Array.from(fileList)) {
            if (!ACCEPTED_TYPES.includes(f.type)) {
                toast.error(`"${f.name}": unsupported type. Use PDF, PNG, JPG, WebP, or TIFF.`);
                continue;
            }
            if (f.size > MAX_SIZE_MB * 1024 * 1024) {
                toast.error(`"${f.name}" exceeds ${MAX_SIZE_MB} MB.`);
                continue;
            }
            valid.push({ file: f, error: "" });
        }
        if (valid.length) setFiles((prev) => [...prev, ...valid]);
    }

    function removeFile(index: number) {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    }

    // ── drag & drop ───────────────────────────────────────────────────────────

    function onDragOver(e: React.DragEvent) { e.preventDefault(); setIsDragging(true); }
    function onDragLeave(e: React.DragEvent) { e.preventDefault(); setIsDragging(false); }
    function onDrop(e: React.DragEvent) {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
    }

    // ── submit ────────────────────────────────────────────────────────────────

    async function handleUpload() {
        if (!files.length || isSubmitting) return;

        setIsSubmitting(true);
        const formData = new FormData();
        files.forEach(({ file }) => formData.append("files", file));

        try {
            const res = await fetch(`${BACKEND_URL}/api/invoices/upload/`, {
                method: "POST",
                headers: { Authorization: `Bearer ${session?.accessToken}` },
                body: formData,
            });

            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                toast.error((err as { detail?: string }).detail ?? "Upload failed. Please try again.");
                return;
            }

            const invoices = await res.json() as Invoice[];
            setUploaded(invoices);
            setFiles([]);
        } catch {
            toast.error("Network error. Please check your connection and try again.");
        } finally {
            setIsSubmitting(false);
        }
    }

    // ── success state ─────────────────────────────────────────────────────────

    if (uploaded.length > 0) {
        return (
            <div className="flex-1 flex min-h-0">
                <Sidebar />
                <div className="flex-1 flex flex-col min-w-0">
                    <AppHeader title="Upload Invoice" />
                    <div className="flex-1 overflow-auto p-4 pb-24 md:p-6 md:pb-6 lg:p-8">
                        <div className="max-w-3xl mx-auto w-full space-y-6">
                            <motion.div
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-6 bg-green-50 border border-green-200 rounded-2xl"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                                        <CheckCircle2 size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-green-800 font-semibold text-base">
                                            {uploaded.length} invoice{uploaded.length > 1 ? "s" : ""} saved
                                        </p>
                                        <p className="text-green-700 text-sm mt-1">
                                            Your files are stored and ready. Go to the Invoices page to process them whenever you&apos;re ready.
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4 space-y-2">
                                    {uploaded.map((inv) => (
                                        <div key={inv.id} className="flex items-center gap-3 bg-white border border-green-200 rounded-lg px-3 py-2">
                                            <File size={14} className="text-green-500 shrink-0" />
                                            <span className="text-sm text-green-800 truncate">{inv.original_filename}</span>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-5 flex flex-col sm:flex-row gap-3">
                                    <Link
                                        href="/invoices"
                                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg transition-colors"
                                    >
                                        Go to Invoices <ArrowRight size={15} />
                                    </Link>
                                    <button
                                        onClick={() => setUploaded([])}
                                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg transition-colors"
                                    >
                                        Upload More
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── upload form ───────────────────────────────────────────────────────────

    return (
        <div className="flex-1 flex min-h-0">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <AppHeader title="Upload Invoice" />

                <div className="flex-1 overflow-auto p-4 pb-24 md:p-6 md:pb-6 lg:p-8">
                    <div className="max-w-3xl mx-auto w-full space-y-6">

                        <div className="flex items-start justify-between gap-4 flex-wrap">
                            <div>
                                <h1 className="text-xl font-bold text-slate-900 mb-1 font-heading">Upload Invoices</h1>
                                <p className="text-slate-500 text-[13px]">
                                    PDF or image files — up to 10 files, max {MAX_SIZE_MB} MB each.
                                </p>
                            </div>

                            {/* Usage pill */}
                            {!usageLoading && usage && (
                                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[12px] font-medium shrink-0 ${
                                    atLimit
                                        ? "border-red-200 bg-red-50 text-red-600"
                                        : usageNearLimit
                                            ? "border-amber-200 bg-amber-50 text-amber-700"
                                            : "border-slate-200 bg-white text-slate-500"
                                }`}>
                                    {atLimit && <Lock size={10} />}
                                    {usage.invoice_count} / {usage.invoice_limit ?? "Unlimited"} this month
                                </div>
                            )}
                        </div>

                        {/* Limit reached — locked state */}
                        {atLimit ? (
                            <motion.div
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="border border-red-200 rounded-2xl p-10 flex flex-col items-center justify-center text-center bg-red-50"
                            >
                                <div className="w-12 h-12 rounded-xl bg-red-100 border border-red-200 flex items-center justify-center text-red-600 mb-4">
                                    <Lock size={20} />
                                </div>
                                <p className="text-slate-900 font-semibold text-[15px] mb-1">Monthly limit reached</p>
                                <p className="text-[13px] text-slate-500 mb-5 max-w-xs">
                                    You&apos;ve used all {usage?.invoice_limit ?? "your available"} invoices for this month. Upgrade to keep uploading.
                                </p>
                                <a
                                    href="mailto:hello@ledgix.app"
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-semibold rounded-lg transition-colors"
                                >
                                    Contact Sales <ArrowRight size={13} />
                                </a>
                            </motion.div>
                        ) : (
                            <>
                                {/* Drop zone */}
                                <motion.div
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    onDragOver={onDragOver}
                                    onDragLeave={onDragLeave}
                                    onDrop={onDrop}
                                    onClick={() => document.getElementById("file-input")?.click()}
                                    className={`relative border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center text-center transition-all duration-150 cursor-pointer ${
                                        isDragging
                                            ? "border-primary-400 bg-primary-50"
                                            : "border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-white"
                                    }`}
                                >
                                    <input
                                        id="file-input"
                                        type="file"
                                        multiple
                                        accept=".pdf,image/png,image/jpeg,image/webp,image/tiff"
                                        className="hidden"
                                        onChange={(e) => e.target.files && addFiles(e.target.files)}
                                    />
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${isDragging ? "bg-primary-100 text-primary-600" : "bg-slate-100 text-slate-400"}`}>
                                        <UploadCloud size={22} />
                                    </div>
                                    <p className="text-[14px] font-semibold text-slate-900 mb-1">Drag &amp; drop files here</p>
                                    <p className="text-[12px] text-slate-400">PDF, PNG, JPG, WebP, TIFF — max {MAX_SIZE_MB} MB each</p>
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); document.getElementById("file-input")?.click(); }}
                                        className="mt-5 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-[13px] font-medium rounded-lg transition-colors"
                                    >
                                        Browse Files
                                    </button>
                                </motion.div>

                                {/* File list */}
                                <AnimatePresence initial={false}>
                                    {files.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="space-y-3"
                                        >
                                            <h2 className="text-sm font-semibold text-slate-700">
                                                {files.length} file{files.length > 1 ? "s" : ""} selected
                                            </h2>
                                            {files.map((item, i) => (
                                                <motion.div
                                                    key={`${item.file.name}-${i}`}
                                                    initial={{ opacity: 0, y: 6 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.97 }}
                                                    transition={{ duration: 0.15 }}
                                                    className="flex items-center gap-4 bg-white border border-slate-200 rounded-xl px-4 py-3"
                                                >
                                                    <div className="w-9 h-9 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                                                        <File size={18} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm text-slate-900 font-medium truncate">{item.file.name}</p>
                                                        <p className="text-xs text-slate-400 mt-0.5">
                                                            {(item.file.size / 1024 / 1024).toFixed(2)} MB
                                                            {item.error && <span className="text-red-600 ml-2">— {item.error}</span>}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => removeFile(i)}
                                                        className="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors shrink-0"
                                                        aria-label="Remove file"
                                                    >
                                                        <X size={15} />
                                                    </button>
                                                </motion.div>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Upload button */}
                                {files.length > 0 && (
                                    <button
                                        onClick={handleUpload}
                                        disabled={isSubmitting}
                                        className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[14px] font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                                    >
                                        {isSubmitting ? (
                                            <><Loader2 size={15} className="animate-spin" /> Uploading…</>
                                        ) : (
                                            <><UploadCloud size={15} /> Save {files.length} Invoice{files.length > 1 ? "s" : ""}</>
                                        )}
                                    </button>
                                )}
                            </>
                        )}

                        {/* Tip cards */}
                        <div className="grid md:grid-cols-2 gap-3">
                            <div className="p-4 bg-white border border-slate-200 rounded-xl flex gap-3">
                                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                                    <Mail size={15} />
                                </div>
                                <div>
                                    <h3 className="text-slate-700 font-semibold text-[12px] mb-0.5">Email Intake</h3>
                                    <p className="text-[11px] text-slate-400 leading-relaxed">
                                        Connect Gmail to auto-import invoices from your inbox.
                                    </p>
                                </div>
                            </div>
                            <div className="p-4 bg-white border border-slate-200 rounded-xl flex gap-3">
                                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                                    <AlertCircle size={15} />
                                </div>
                                <div>
                                    <h3 className="text-slate-700 font-semibold text-[12px] mb-0.5">Process Later</h3>
                                    <p className="text-[11px] text-slate-400 leading-relaxed">
                                        Files stay saved. Trigger AI extraction whenever you&apos;re ready.
                                    </p>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
