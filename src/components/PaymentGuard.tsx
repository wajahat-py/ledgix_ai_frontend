"use client";

import React, { useCallback, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useOrg } from "@/lib/org-context";
import { api } from "@/services/api";

interface PaymentGuardProps {
    children: React.ReactNode;
}

export default function PaymentGuard({ children }: PaymentGuardProps) {
    const { org, membership, isLoading: orgLoading } = useOrg();
    const [upgrading, setUpgrading] = useState(false);
    const isOwner = membership?.role === "owner";

    const handleUpgrade = useCallback(async () => {
        if (upgrading) return;
        setUpgrading(true);
        toast.info("Starting Pro upgrade...", { description: "Redirecting to Stripe..." });
        try {
            const res = await api.post<{ url: string }>("/api/billing/create-checkout-session/");
            window.location.href = res.data.url;
        } catch (err: unknown) {
            const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
            toast.error(detail ?? "Could not start checkout.");
            setUpgrading(false);
        }
    }, [upgrading]);

    if (orgLoading) {
        return (
            <div className="flex-1 flex items-center justify-center p-6 bg-slate-50 min-h-screen">
                <Loader2 size={24} className="text-slate-400 animate-spin" />
            </div>
        );
    }

    if (org?.intended_plan === "pro" && org?.plan === "free") {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50 min-h-screen">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center mb-6 shadow-lg">
                    <Loader2 size={24} className="text-white animate-spin" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Complete your subscription</h1>
                <p className="text-slate-500 text-center max-w-sm">
                    {isOwner
                        ? "You've signed up for the Pro plan. Please complete your payment to access your workspace."
                        : "This workspace is waiting for the owner to complete the Pro subscription payment."}
                </p>
                {isOwner ? (
                    <button
                       onClick={handleUpgrade}
                       disabled={upgrading}
                       className="mt-8 px-6 py-2.5 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {upgrading ? <Loader2 size={16} className="animate-spin" /> : null}
                        {upgrading ? "Redirecting..." : "Complete Payment"}
                    </button>
                ) : null}
            </div>
        );
    }

    return <>{children}</>;
}
