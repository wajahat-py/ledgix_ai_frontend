"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, CheckCircle2, XCircle, AlertTriangle, MailOpen } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/services/api";
import { useNotifications } from "@/hooks/useNotifications";
import type { AppNotification, NotificationKind } from "@/types/notification";

function timeAgo(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1)  return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

const KIND_META: Record<NotificationKind, { icon: React.ReactNode; bg: string }> = {
    INVOICE_PROCESSED: {
        icon: <CheckCircle2 size={14} className="text-green-600" />,
        bg: "bg-green-50 border-green-200",
    },
    INVOICE_FAILED: {
        icon: <XCircle size={14} className="text-red-600" />,
        bg: "bg-red-50 border-red-200",
    },
    SYNC_ERROR: {
        icon: <AlertTriangle size={14} className="text-amber-600" />,
        bg: "bg-amber-50 border-amber-200",
    },
};

function NotificationRow({ notif }: { notif: AppNotification }) {
    const [retrying, setRetrying] = useState(false);
    const meta = KIND_META[notif.kind];

    async function handleRetry() {
        if (!notif.invoice_id) return;
        setRetrying(true);
        try {
            await api.post(`/api/invoices/${notif.invoice_id}/process/`);
            toast.success("Reprocessing started.");
        } catch {
            toast.error("Could not start reprocessing.");
        } finally {
            setRetrying(false);
        }
    }

    return (
        <div className={`px-4 py-3 border-b border-slate-100 last:border-0 ${!notif.is_read ? "bg-primary-50/40" : ""}`}>
            <div className="flex items-start gap-3">
                <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 border ${meta.bg}`}>
                    {meta.icon}
                </div>
                <div className="flex-1 min-w-0">
                    <p className={`text-[13px] leading-snug ${notif.is_read ? "text-slate-600" : "text-slate-900 font-medium"}`}>
                        {notif.title}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{timeAgo(notif.created_at)}</p>
                    {(notif.invoice_id) && (
                        <div className="flex items-center gap-2 mt-1.5">
                            {notif.kind === "INVOICE_FAILED" && (
                                <button
                                    onClick={handleRetry}
                                    disabled={retrying}
                                    className="text-[11px] px-2 py-0.5 rounded bg-red-50 hover:bg-red-100 text-red-600 font-medium transition-colors disabled:opacity-50 border border-red-200"
                                >
                                    {retrying ? "Retrying…" : "Retry"}
                                </button>
                            )}
                            <Link
                                href={`/invoices/${notif.invoice_id}`}
                                className="text-[11px] px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium transition-colors border border-slate-200"
                            >
                                View
                            </Link>
                        </div>
                    )}
                </div>
                {!notif.is_read && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-500 shrink-0 mt-2" />
                )}
            </div>
        </div>
    );
}

export function NotificationBell() {
    const [open, setOpen] = useState(false);
    const { notifications, unreadCount, markAllRead } = useNotifications();
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function onClickOutside(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        if (open) document.addEventListener("mousedown", onClickOutside);
        return () => document.removeEventListener("mousedown", onClickOutside);
    }, [open]);

    function handleOpen() {
        setOpen((v) => !v);
        if (!open && unreadCount > 0) {
            markAllRead();
        }
    }

    return (
        <div ref={containerRef} className="relative">
            <button
                onClick={handleOpen}
                className="relative text-slate-400 hover:text-slate-700 transition-colors p-1.5 rounded-lg hover:bg-slate-100"
                aria-label="Notifications"
            >
                <Bell size={17} />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[15px] h-[15px] flex items-center justify-center bg-primary-600 text-white text-[9px] font-bold rounded-full px-0.5 leading-none">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.97 }}
                        transition={{ duration: 0.12 }}
                        className="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                            <span className="text-[13px] font-semibold text-slate-900">Notifications</span>
                            {notifications.some((n) => !n.is_read) && (
                                <button
                                    onClick={markAllRead}
                                    className="text-[12px] text-slate-400 hover:text-slate-700 transition-colors"
                                >
                                    Mark all read
                                </button>
                            )}
                        </div>

                        {/* List */}
                        <div className="max-h-[360px] overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-10 gap-3 text-slate-400">
                                    <MailOpen size={24} className="opacity-40" />
                                    <p className="text-[13px]">No notifications yet</p>
                                </div>
                            ) : (
                                notifications.map((n) => (
                                    <NotificationRow key={n.id} notif={n} />
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
