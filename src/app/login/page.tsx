"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight, Loader2, CheckCircle2, Sparkles, MessageSquare, Building2, Send } from "lucide-react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";
const DEMO_EMAIL = process.env.NEXT_PUBLIC_DEMO_EMAIL ?? "demo@ledgix.ai";
const DEMO_PASSWORD = process.env.NEXT_PUBLIC_DEMO_PASSWORD ?? "demo123";

export default function LoginPage() {
    return (
        <Suspense>
            <LoginPageInner />
        </Suspense>
    );
}

function LoginPageInner() {
    const searchParams = useSearchParams();
    const [demoLoading, setDemoLoading] = useState(false);

    useEffect(() => {
        if (searchParams.get("demo") === "1") {
            void handleDemoLogin();
        }
    }, [searchParams]);

    const handleDemoLogin = async () => {
        setDemoLoading(true);

        try {
            const res = await signIn("credentials", {
                redirect: false,
                email: DEMO_EMAIL,
                password: DEMO_PASSWORD,
                callbackUrl: "/dashboard?demo=1",
            });

            if (res?.error) {
                setDemoLoading(false);
                return;
            }

            window.location.href = "/dashboard?demo=1";
        } catch {
            setDemoLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="sm:mx-auto sm:w-full sm:max-w-md"
            >
                <div className="flex justify-center mb-6">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                        <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                            <rect x="1" y="1" width="6" height="8" rx="1.5" fill="white" fillOpacity="0.9"/>
                            <rect x="9" y="1" width="6" height="4" rx="1.5" fill="white" fillOpacity="0.9"/>
                            <rect x="9" y="7" width="6" height="4" rx="1.5" fill="white" fillOpacity="0.9"/>
                            <rect x="1" y="11" width="14" height="2.5" rx="1.25" fill="white" fillOpacity="0.5"/>
                        </svg>
                    </div>
                </div>
                <h1 className="text-center text-3xl font-heading font-bold text-slate-900 tracking-tight">
                    Welcome to Ledgix
                </h1>
                <p className="mt-3 text-center text-sm text-slate-600 max-w-sm mx-auto">
                    AI-powered invoice processing for modern businesses. Experience the full platform with our interactive demo.
                </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.06 }}
                className="mt-8 sm:mx-auto sm:w-full sm:max-w-md space-y-4"
            >
                {/* Demo Login Card */}
                <div className="bg-white border border-slate-200 py-8 px-6 rounded-2xl shadow-sm">
                    <div className="text-center mb-6">
                        <div className="w-12 h-12 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center mx-auto mb-4">
                            <Sparkles size={24} className="text-primary-600" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 mb-2">Try the Demo</h2>
                        <p className="text-sm text-slate-600">
                            Explore the full dashboard with sample data — no signup required.
                        </p>
                    </div>

                    <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 mb-5">
                        <p className="text-xs text-slate-600 mb-2 font-medium">Demo Credentials:</p>
                        <p className="text-sm text-slate-900"><span className="font-medium">Email:</span> {DEMO_EMAIL}</p>
                        <p className="text-sm text-slate-900"><span className="font-medium">Password:</span> {DEMO_PASSWORD}</p>
                    </div>

                    <button
                        onClick={handleDemoLogin}
                        disabled={demoLoading}
                        className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-lg text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {demoLoading ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Opening Demo...
                            </>
                        ) : (
                            <>
                                <ArrowRight size={16} />
                                Launch Demo Workspace
                            </>
                        )}
                    </button>
                </div>

                {/* Enterprise Contact Card */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 py-8 px-6 rounded-2xl shadow-lg text-white">
                    <div className="flex items-start gap-4 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                            <Building2 size={24} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold mb-1">Get Your Own Workspace</h2>
                            <p className="text-sm text-slate-300">
                                Ready to automate your invoice processing? Contact us to set up your own instance.
                            </p>
                        </div>
                    </div>

                    <ul className="space-y-2 mb-6">
                        <li className="flex items-start gap-2 text-sm text-slate-300">
                            <CheckCircle2 size={16} className="text-green-400 shrink-0 mt-0.5" />
                            <span>Custom branding and domain</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm text-slate-300">
                            <CheckCircle2 size={16} className="text-green-400 shrink-0 mt-0.5" />
                            <span>Dedicated support and onboarding</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm text-slate-300">
                            <CheckCircle2 size={16} className="text-green-400 shrink-0 mt-0.5" />
                            <span>Enterprise integrations (Gmail, Outlook, ERP)</span>
                        </li>
                    </ul>

                    <Link
                        href="/contact"
                        className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-lg text-sm font-semibold bg-white hover:bg-slate-50 text-slate-900 transition-colors"
                    >
                        <MessageSquare size={16} />
                        Contact Sales
                    </Link>
                </div>
            </motion.div>

            <p className="mt-8 text-center text-xs text-slate-500">
                By using the demo, you agree to our{" "}
                <a href="#" className="text-slate-700 hover:text-slate-900 underline">Terms of Service</a>
                {" "}and{" "}
                <a href="#" className="text-slate-700 hover:text-slate-900 underline">Privacy Policy</a>.
            </p>
        </div>
    );
}
