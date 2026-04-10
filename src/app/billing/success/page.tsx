"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useOrg } from "@/lib/org-context";
import { api } from "@/services/api";

export default function BillingSuccessPage() {
    return (
        <Suspense>
            <BillingSuccessInner />
        </Suspense>
    );
}

function BillingSuccessInner() {
    const router = useRouter();
    const params = useSearchParams();
    const { status } = useSession();
    const { org, refresh } = useOrg();
    const ran = useRef(false);

    useEffect(() => {
        const sessionId = params.get("session_id");

        if (status === "loading") return;
        if (status !== "authenticated") {
            const callbackUrl = sessionId
                ? `/billing/success?session_id=${encodeURIComponent(sessionId)}`
                : "/billing/success";
            router.replace(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
            return;
        }

        if (ran.current) return;
        ran.current = true;

        async function confirm() {
            if (sessionId) {
                for (let attempt = 0; attempt < 3; attempt += 1) {
                    try {
                        const res = await api.post<{ plan: string }>("/api/billing/verify-checkout/", { session_id: sessionId });
                        if (res.data.plan === "pro") break;
                    } catch {
                        // Non-fatal. Webhook delivery may still catch up.
                    }
                    await new Promise((resolve) => setTimeout(resolve, 800));
                }
            }

            await refresh();
            setTimeout(() => router.push("/settings/workspace"), 2500);
        }

        void confirm();
    }, [params, refresh, router, status]);

    const isUpgraded = org?.plan === "pro" || org?.plan === "business";

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white border border-slate-200 rounded-2xl p-10 text-center max-w-sm w-full shadow-sm"
            >
                <div className="w-16 h-16 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-5">
                    <CheckCircle2 size={32} className="text-green-600" />
                </div>
                <h1 className="text-slate-900 font-bold text-xl mb-2">You&apos;re on Pro!</h1>
                <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                    {isUpgraded
                        ? "Your subscription is active. Redirecting to your workspace settings..."
                        : "Finalizing your subscription. Redirecting to your workspace settings..."}
                </p>
                <Loader2 size={18} className="animate-spin text-slate-400 mx-auto" />
            </motion.div>
        </div>
    );
}
