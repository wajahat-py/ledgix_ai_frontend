"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Building2, Loader2, Shield, CheckCircle2, ArrowRight, Star } from "lucide-react";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import AppHeader from "@/components/AppHeader";
import { api } from "@/services/api";
import { useOrg } from "@/lib/org-context";

const PLAN_LABELS: Record<string, string> = {
    free:     "Free",
    pro:      "Pro",
    business: "Business",
};

const PLAN_COLORS: Record<string, string> = {
    free:     "bg-slate-100 text-slate-600",
    pro:      "bg-blue-50 text-blue-700",
    business: "bg-purple-50 text-purple-700",
};

export default function WorkspacePage() {
    const { org, membership, isLoading: orgLoading, refresh } = useOrg();
    const [name, setName]           = useState("");
    const [saving, setSaving]       = useState(false);
    const [nameError, setNameError] = useState("");
    const [billingLoading, setBillingLoading] = useState(false);

    useEffect(() => {
        if (org) setName(org.name);
    }, [org]);

    const canEdit = membership?.role === "owner" || membership?.role === "admin";
    const isOwner = membership?.role === "owner";
    const isPro   = org?.plan === "pro" || org?.plan === "business";
    const cancellationScheduled = isPro && org?.intended_plan === "free";
    const paymentPending = org?.intended_plan === "pro" && org?.plan === "free";

    useEffect(() => {
        if (!org || !isOwner) return;
        api.get("/api/billing/status/")
            .then(() => refresh())
            .catch(() => {});
    }, [isOwner, org?.id, refresh]);

    async function handleBillingPortal() {
        setBillingLoading(true);
        try {
            const res = await api.post<{ url: string }>("/api/billing/portal/");
            window.location.href = res.data.url;
        } catch (err: unknown) {
            const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
            toast.error(detail ?? "Could not open billing portal.");
        } finally {
            setBillingLoading(false);
        }
    }

    async function handleUpgrade() {
        setBillingLoading(true);
        try {
            const res = await api.post<{ url: string }>("/api/billing/create-checkout-session/");
            window.location.href = res.data.url;
        } catch (err: unknown) {
            const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
            toast.error(detail ?? "Could not start checkout.");
        } finally {
            setBillingLoading(false);
        }
    }

    const handleSave = async () => {
        const trimmed = name.trim();
        if (!trimmed) { setNameError("Name cannot be empty."); return; }
        if (!org) return;

        setSaving(true);
        try {
            await api.patch(`/api/orgs/${org.id}/`, { name: trimmed });
            toast.success("Workspace name updated.");
            setNameError("");
        } catch (err: unknown) {
            const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
            toast.error(detail ?? "Failed to save. Please try again.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex">
            <Sidebar />
            <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
                <AppHeader title="Workspace" />

                <div className="flex-1 overflow-auto p-4 pb-24 md:p-6 md:pb-6 lg:p-8 space-y-6 max-w-2xl">

                    {/* Workspace identity */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white border border-slate-200 rounded-xl p-6"
                    >
                        <h2 className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                            <Building2 size={13} /> Workspace Identity
                        </h2>

                        {orgLoading ? (
                            <div className="flex items-center gap-2 text-slate-400 text-sm">
                                <Loader2 size={14} className="animate-spin" /> Loading…
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="bg-slate-50 rounded-lg px-4 py-3">
                                    <div className="text-[10px] uppercase tracking-wide text-slate-400 mb-1">Workspace Name</div>
                                    <input
                                        value={name}
                                        onChange={(e) => { setName(e.target.value); setNameError(""); }}
                                        disabled={!canEdit}
                                        className="bg-transparent text-sm text-slate-900 w-full focus:outline-none focus:text-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        aria-describedby={nameError ? "name-error" : undefined}
                                    />
                                    {nameError && (
                                        <p id="name-error" className="text-xs text-red-600 mt-1">{nameError}</p>
                                    )}
                                </div>

                                <div className="bg-slate-50 rounded-lg px-4 py-3">
                                    <div className="text-[10px] uppercase tracking-wide text-slate-400 mb-1">Slug</div>
                                    <p className="text-sm text-slate-400 font-mono">{org?.slug ?? "—"}</p>
                                </div>

                                {canEdit && (
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="mt-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-all flex items-center gap-2"
                                    >
                                        {saving && <Loader2 size={14} className="animate-spin" />}
                                        {saving ? "Saving…" : "Save Changes"}
                                    </button>
                                )}
                            </div>
                        )}
                    </motion.div>

                    {/* Plan */}
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.06 }}
                        className="bg-white border border-slate-200 rounded-xl p-6"
                    >
                        <h2 className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                            <Shield size={13} /> Plan
                        </h2>

                        <div className="flex items-center gap-3 mb-5">
                            <span className="text-slate-900 font-semibold text-lg">
                                {PLAN_LABELS[org?.plan ?? "free"] ?? "Free"}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${PLAN_COLORS[org?.plan ?? "free"]}`}>
                                {org?.plan ?? "free"}
                            </span>
                        </div>

                        {paymentPending && (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
                                <p className="text-sm font-semibold text-amber-900">Payment pending</p>
                                <p className="text-xs text-amber-700 mt-1">
                                    Your workspace is set to Pro, but payment has not been completed yet.
                                </p>
                            </div>
                        )}

                        {cancellationScheduled && (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
                                <p className="text-sm font-semibold text-amber-900">Cancellation scheduled</p>
                                <p className="text-xs text-amber-700 mt-1">
                                    Your workspace stays on Pro until the current billing period ends, then it downgrades to Free.
                                </p>
                            </div>
                        )}

                        {!isPro && (
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-5">
                                <div className="flex items-start gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-primary-50 border border-primary-200 flex items-center justify-center shrink-0">
                                        <Star size={16} className="text-primary-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-slate-900 mb-1">Upgrade to Pro — $50/month</p>
                                        <div className="space-y-1">
                                            {[
                                                "500 invoices/month (vs 50 on Free)",
                                                "Up to 5 workspace seats",
                                                "Excel, PDF, QuickBooks & Xero export",
                                                "Priority support",
                                            ].map((f) => (
                                                <div key={f} className="flex items-center gap-2 text-xs text-slate-500">
                                                    <CheckCircle2 size={11} className="text-primary-600 shrink-0" /> {f}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                {isOwner && (
                                    <button
                                        onClick={handleUpgrade}
                                        disabled={billingLoading}
                                        className="mt-4 w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-all"
                                    >
                                        {billingLoading
                                            ? <><Loader2 size={14} className="animate-spin" /> Redirecting…</>
                                            : <>Upgrade to Pro <ArrowRight size={14} /></>}
                                    </button>
                                )}
                                {!isOwner && (
                                    <p className="mt-3 text-xs text-slate-400">Ask your workspace owner to upgrade.</p>
                                )}
                            </div>
                        )}

                        {isPro && isOwner && (
                            <div className="mt-2">
                                <button
                                    onClick={handleBillingPortal}
                                    disabled={billingLoading}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-all disabled:opacity-60"
                                >
                                    {billingLoading
                                        ? <><Loader2 size={14} className="animate-spin" /> Loading…</>
                                        : cancellationScheduled ? "Manage Cancellation" : "Manage Subscription"}
                                </button>
                                <p className="text-xs text-slate-400 mt-2">
                                    Cancel or update your payment method via the Stripe portal. Canceling keeps Pro until the current billing period ends, then downgrades the workspace to Free.
                                </p>
                            </div>
                        )}
                    </motion.div>

                </div>
            </main>
        </div>
    );
}
