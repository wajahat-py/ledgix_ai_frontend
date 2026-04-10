"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { useSession } from "next-auth/react";
import { api } from "@/services/api";

export default function BillingCheckoutPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [error, setError] = useState("");

    useEffect(() => {
        if (status === "loading") return;

        if (!session) {
            router.replace("/login?callbackUrl=/billing/checkout");
            return;
        }

        api.post<{ url: string }>("/api/billing/create-checkout-session/")
            .then((res) => {
                window.location.href = res.data.url;
            })
            .catch((err: unknown) => {
                const detail = (err as { response?: { data?: { detail?: string } } })
                    ?.response?.data?.detail;
                setError(detail ?? "Could not start checkout. Please try again.");
            });
    }, [session, status, router]);

    if (error) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-sm w-full text-center shadow-sm">
                    <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                        <AlertCircle size={22} className="text-red-500" />
                    </div>
                    <p className="text-slate-900 font-semibold text-lg mb-1">Checkout failed</p>
                    <p className="text-sm text-slate-500 mb-6">{error}</p>
                    <button
                        onClick={() => router.push("/pricing")}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-xl transition-colors"
                    >
                        <ArrowLeft size={14} /> Back to Pricing
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="text-center">
                <Loader2 size={36} className="animate-spin text-primary-600 mx-auto mb-4" />
                <p className="text-slate-700 font-medium text-lg">Redirecting to payment…</p>
                <p className="text-slate-400 text-sm mt-1">You will be taken to Stripe to complete your purchase.</p>
            </div>
        </div>
    );
}
