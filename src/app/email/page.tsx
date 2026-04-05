"use client";

import { Suspense } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
    Mail, CheckCircle2, AlertTriangle, Inbox,
    FileText, RefreshCw, LogOut, Loader2, Clock, Lock,
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import Sidebar from "@/components/Sidebar";
import AppHeader from "@/components/AppHeader";
import { useUsage } from "@/hooks/useUsage";
import type { GmailStatus } from "@/types/gmail";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

function formatRelative(iso: string | null | undefined): string {
    if (!iso) return "Never";
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1)  return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

function GmailLogo({ size = 20 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
            <path fill="#EA4335" d="M34 42H14a6 6 0 0 1-6-6V12l10 7.5L24 24l6-4.5L40 12v24a6 6 0 0 1-6 6z" />
            <path fill="#FBBC05" d="M8 12l10 7.5V42H8V12z" />
            <path fill="#34A853" d="M40 12v30H30V19.5L40 12z" />
            <path fill="#4285F4" d="M8 12l16 12L40 12 24 6 8 12z" />
        </svg>
    );
}

export default function EmailPage() {
    return (
        <Suspense>
            <EmailPageInner />
        </Suspense>
    );
}

function EmailPageInner() {
    const { data: session } = useSession();
    const { usage, atLimit } = useUsage();
    const searchParams = useSearchParams();
    const router = useRouter();

    const [gmailStatus, setGmailStatus] = useState<GmailStatus | null>(null);
    const [loading, setLoading]         = useState(true);
    const [syncing, setSyncing]         = useState(false);
    const [connecting, setConnecting]   = useState(false);
    const [disconnecting, setDisconnecting] = useState(false);

    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const fetchStatus = useCallback(async () => {
        if (!session?.accessToken) return;
        try {
            const res = await fetch(`${BACKEND_URL}/api/gmail/status/`, {
                headers: { Authorization: `Bearer ${session.accessToken}` },
            });
            if (!res.ok) throw new Error(`${res.status}`);
            const data: GmailStatus = await res.json();
            setGmailStatus(data);
            return data;
        } catch {
            // Non-fatal
        }
    }, [session?.accessToken]);

    useEffect(() => {
        if (!session?.accessToken) return;
        setLoading(true);
        fetchStatus().finally(() => setLoading(false));
    }, [session?.accessToken, fetchStatus]);

    useEffect(() => {
        const gmailParam = searchParams.get("gmail");
        const reason     = searchParams.get("reason");
        if (!gmailParam) return;

        if (gmailParam === "connected") {
            toast.success("Gmail connected! Scanning your inbox…");
            fetchStatus();
            setSyncing(true);
            let ticks = 0;
            pollRef.current = setInterval(async () => {
                ticks++;
                const data = await fetchStatus();
                if (data?.last_synced_at || ticks >= 24) {
                    clearInterval(pollRef.current!);
                    setSyncing(false);
                }
            }, 5_000);
        } else if (gmailParam === "error") {
            const msg =
                reason === "access_denied" ? "You declined Gmail access." :
                reason === "invalid_state" ? "OAuth session expired. Please try again." :
                reason === "server_error"  ? "A server error occurred. Please try again." :
                                             "Gmail connection failed. Please try again.";
            toast.error(msg);
        }
        router.replace("/email");
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

    async function handleConnect() {
        if (!session?.accessToken) return;
        setConnecting(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/gmail/auth/`, {
                headers: { Authorization: `Bearer ${session.accessToken}` },
            });
            if (!res.ok) throw new Error(`${res.status}`);
            const { auth_url } = await res.json() as { auth_url: string };
            window.location.href = auth_url;
        } catch {
            toast.error("Could not start Gmail connection. Please try again.");
            setConnecting(false);
        }
    }

    async function handleSync() {
        if (!session?.accessToken) return;
        setSyncing(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/gmail/sync/`, {
                method: "POST",
                headers: { Authorization: `Bearer ${session.accessToken}` },
            });
            if (!res.ok) throw new Error(`${res.status}`);
            toast.success("Inbox scan started — new invoices will appear in your Invoices page.");

            let ticks = 0;
            pollRef.current = setInterval(async () => {
                ticks++;
                const data = await fetchStatus();
                const prevSynced = gmailStatus?.last_synced_at;
                if ((data?.last_synced_at && data.last_synced_at !== prevSynced) || ticks >= 24) {
                    clearInterval(pollRef.current!);
                    setSyncing(false);
                }
            }, 5_000);
        } catch {
            toast.error("Could not start sync. Please try again.");
            setSyncing(false);
        }
    }

    async function handleDisconnect() {
        if (!session?.accessToken) return;
        setDisconnecting(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/gmail/disconnect/`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${session.accessToken}` },
            });
            if (!res.ok) throw new Error(`${res.status}`);
            setGmailStatus({ connected: false });
            toast.success("Gmail disconnected.");
        } catch {
            toast.error("Could not disconnect. Please try again.");
        } finally {
            setDisconnecting(false);
        }
    }

    const connected     = gmailStatus?.connected ?? false;
    const recentImports = gmailStatus?.recent_imports ?? [];

    return (
        <div className="min-h-screen bg-slate-50 flex">
            <Sidebar />

            <main className="flex-1 flex flex-col overflow-hidden">
                <AppHeader title="Email Integration" />

                <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 space-y-5">

                    {/* ── Plan limit banner ── */}
                    {atLimit && (
                        <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-start gap-3 px-5 py-4 rounded-xl border border-red-200 bg-red-50"
                        >
                            <Lock size={16} className="text-red-600 shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-red-700 font-medium">Monthly limit reached</p>
                                <p className="text-xs text-red-600 mt-0.5">
                                    You&apos;ve used all {usage?.invoice_limit} invoices for this month. Gmail sync is paused until you upgrade.
                                </p>
                            </div>
                            <a
                                href="mailto:hello@ledgix.app"
                                className="shrink-0 text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors"
                            >
                                Upgrade →
                            </a>
                        </motion.div>
                    )}

                    {/* ── Connection card ── */}
                    <motion.div
                        layout
                        className={`rounded-xl border p-6 transition-colors ${
                            connected
                                ? "border-green-200 bg-green-50"
                                : "border-slate-200 bg-white"
                        }`}
                    >
                        <div className="flex flex-col sm:flex-row items-start gap-5">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${connected ? "bg-green-100" : "bg-slate-100"}`}>
                                {loading
                                    ? <Loader2 size={22} className="text-slate-400 animate-spin" />
                                    : connected
                                        ? <GmailLogo size={24} />
                                        : <Mail size={22} className="text-slate-400" />}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                    <h2 className="text-base font-semibold text-slate-900">
                                        {loading ? "Loading…" : connected ? "Gmail Connected" : "Connect Your Gmail"}
                                    </h2>
                                    {connected && (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                                            <CheckCircle2 size={11} /> Active
                                        </span>
                                    )}
                                </div>

                                {connected && gmailStatus?.gmail_address && (
                                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 mb-3">
                                        <GmailLogo size={14} />
                                        <span className="text-sm font-medium text-slate-900">{gmailStatus.gmail_address}</span>
                                    </div>
                                )}

                                <p className="text-sm text-slate-500 mb-4 leading-relaxed">
                                    {connected
                                        ? "Ledgix monitors your inbox and auto-uploads detected invoices for AI extraction. New emails are checked every 2 minutes."
                                        : "Connect your inbox to automatically detect and import invoices from your emails."}
                                </p>

                                {!loading && !connected && (
                                    <button
                                        onClick={handleConnect}
                                        disabled={connecting || atLimit}
                                        title={atLimit ? "Upgrade your plan to connect Gmail" : undefined}
                                        className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-sm font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                    >
                                        {connecting
                                            ? <><Loader2 size={16} className="animate-spin text-slate-400" /> Connecting…</>
                                            : atLimit
                                                ? <><Lock size={16} className="text-slate-400" /> Upgrade to Connect</>
                                                : <><GmailLogo size={18} /> Connect Gmail</>}
                                    </button>
                                )}

                                {connected && (
                                    <span className="text-xs text-slate-400 flex items-center gap-1">
                                        <Clock size={12} /> Last synced: {formatRelative(gmailStatus?.last_synced_at)}
                                    </span>
                                )}
                            </div>

                            {connected && (
                                <div className="flex items-center gap-2 shrink-0 self-start">
                                    <button
                                        onClick={handleSync}
                                        disabled={syncing || atLimit}
                                        title={atLimit ? "Upgrade your plan to sync more invoices" : undefined}
                                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs text-slate-600 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {atLimit
                                            ? <><Lock size={13} /> Limit Reached</>
                                            : <><RefreshCw size={13} className={syncing ? "animate-spin" : ""} />{syncing ? "Syncing…" : "Sync Now"}</>}
                                    </button>
                                    <button
                                        onClick={handleDisconnect}
                                        disabled={disconnecting}
                                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-xs text-red-600 font-medium transition-colors disabled:opacity-50"
                                    >
                                        {disconnecting ? <Loader2 size={13} className="animate-spin" /> : <LogOut size={13} />}
                                        Disconnect
                                    </button>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* ── Syncing banner ── */}
                    <AnimatePresence>
                        {syncing && (
                            <motion.div
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center gap-3 px-5 py-3.5 rounded-xl border border-blue-200 bg-blue-50"
                            >
                                <Loader2 size={16} className="text-blue-600 shrink-0 animate-spin" />
                                <p className="text-sm text-blue-700">
                                    Scanning your inbox for invoice attachments… Detected invoices will appear on the Invoices page.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ── Stats ── */}
                    <AnimatePresence>
                        {connected && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="grid grid-cols-2 sm:grid-cols-3 gap-4"
                            >
                                {[
                                    {
                                        label: "Invoices detected",
                                        value: recentImports.length,
                                        icon:  <FileText size={16} className="text-primary-600" />,
                                        text:  false,
                                    },
                                    {
                                        label: "Last synced",
                                        value: formatRelative(gmailStatus?.last_synced_at),
                                        icon:  <Inbox size={16} className="text-slate-400" />,
                                        text:  true,
                                    },
                                    {
                                        label: "Connected since",
                                        value: formatRelative(gmailStatus?.created_at),
                                        icon:  <Clock size={16} className="text-slate-400" />,
                                        text:  true,
                                    },
                                ].map(({ label, value, icon, text }) => (
                                    <div key={label} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
                                        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                                            {icon}
                                        </div>
                                        <div>
                                            <p className={`font-semibold ${text ? "text-sm text-slate-700" : "text-xl text-slate-900"}`}>
                                                {value}
                                            </p>
                                            <p className="text-xs text-slate-400">{label}</p>
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ── Setup guide (disconnected) ── */}
                    {!loading && !connected && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-white border border-slate-200 rounded-xl p-6"
                        >
                            <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                <AlertTriangle size={15} className="text-amber-500" /> How it works
                            </h3>
                            <ol className="space-y-3">
                                {[
                                    "Click \"Connect Gmail\" and authorise read-only inbox access.",
                                    "Ledgix scans emails with PDF or image attachments from the past 6 months.",
                                    "Attachments that look like invoices (by filename, subject, or sender) are auto-uploaded.",
                                    "Each invoice is immediately queued for AI extraction — no manual steps needed.",
                                    "Your inbox is re-scanned every 2 minutes for new invoices.",
                                ].map((step, i) => (
                                    <li key={i} className="flex items-start gap-3 text-sm text-slate-500">
                                        <span className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                                            {i + 1}
                                        </span>
                                        {step}
                                    </li>
                                ))}
                            </ol>
                        </motion.div>
                    )}
                </div>
            </main>
        </div>
    );
}
