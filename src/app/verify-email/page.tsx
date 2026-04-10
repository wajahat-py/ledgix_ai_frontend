"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

export default function VerifyEmailPage() {
    return (
        <Suspense>
            <VerifyEmailInner />
        </Suspense>
    );
}

function VerifyEmailInner() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [state, setState] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("");
    const [verifiedPlan, setVerifiedPlan] = useState("free");

    useEffect(() => {
        if (!token) {
            setState("error");
            setMessage("No verification token found in this link.");
            return;
        }

        fetch(`${BACKEND_URL}/api/auth/verify-email/?token=${encodeURIComponent(token)}`)
            .then(async (res) => {
                const data = await res.json();
                if (res.ok) {
                    setState("success");
                    setMessage(data.detail);
                    if (data.plan) setVerifiedPlan(data.plan);
                } else {
                    setState("error");
                    setMessage(data.detail ?? "Verification failed.");
                }
            })
            .catch(() => {
                setState("error");
                setMessage("Something went wrong. Please try again.");
            });
    }, [token]);

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="bg-white border border-slate-200 rounded-2xl p-10 max-w-md w-full text-center shadow-sm"
            >
                {state === "loading" && (
                    <>
                        <Loader2 size={40} className="text-primary-600 animate-spin mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-slate-900">Verifying your email…</h2>
                    </>
                )}

                {state === "success" && (
                    <>
                        <div className="w-14 h-14 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 size={28} className="text-green-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-slate-900 mb-2">Email verified!</h2>
                        <p className="text-slate-500 text-sm mb-6">{message}</p>
                        <Link
                            href={`/login${verifiedPlan === "pro" ? "?plan=pro" : ""}`}
                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold transition-colors"
                        >
                            Sign in to your account
                        </Link>
                    </>
                )}

                {state === "error" && (
                    <>
                        <div className="w-14 h-14 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-4">
                            <XCircle size={28} className="text-red-600" />
                        </div>
                        <h2 className="text-xl font-semibold text-slate-900 mb-2">Verification failed</h2>
                        <p className="text-slate-500 text-sm mb-6">{message}</p>
                        <div className="flex flex-col gap-3">
                            <Link
                                href="/register"
                                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold transition-colors"
                            >
                                Back to sign up
                            </Link>
                            <Link href="/login" className="text-sm text-slate-500 hover:text-slate-700 transition-colors">
                                Already have an account? Sign in
                            </Link>
                        </div>
                    </>
                )}
            </motion.div>
        </div>
    );
}
