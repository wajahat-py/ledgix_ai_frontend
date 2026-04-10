"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Check, ArrowRight, Zap, Building2, Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import ContactSalesModal from "@/components/ContactSalesModal";
import { api } from "@/services/api";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

export default function PricingPage() {
    const [salesOpen, setSalesOpen] = useState(false);
    const [upgrading, setUpgrading] = useState(false);
    const { data: session } = useSession();
    const router = useRouter();

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0 },
    };

    async function handleUpgrade() {
        if (!session) {
            router.push("/register?plan=pro");
            return;
        }
        setUpgrading(true);
        try {
            const res = await api.post<{ url: string }>("/api/billing/create-checkout-session/");
            window.location.href = res.data.url;
        } catch (err: unknown) {
            const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
            toast.error(detail ?? "Could not start checkout. Please try again.");
            setUpgrading(false);
        }
    }

    return (
        <div className="min-h-screen bg-white pt-24 pb-32">
            <div className="container mx-auto px-4 relative z-10">

                {/* Header */}
                <div className="text-center max-w-2xl mx-auto mb-20">
                    <h1 className="text-4xl md:text-5xl font-heading font-bold text-slate-900 mb-5">
                        Simple, transparent pricing
                    </h1>
                    <p className="text-lg text-slate-500">
                        Start for free. Upgrade when you need more.
                    </p>
                </div>

                {/* Pricing Cards */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto"
                >
                    {/* Free Plan */}
                    <motion.div
                        variants={itemVariants}
                        className="bg-white border border-slate-200 rounded-3xl p-8 flex flex-col"
                    >
                        <div className="mb-8">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                                    <Zap size={20} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900">Free</h3>
                            </div>
                            <div className="mb-3">
                                <span className="text-4xl font-bold text-slate-900">$0</span>
                                <span className="text-slate-400 text-sm ml-1">/ month</span>
                            </div>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                Get started with automated invoice processing.
                            </p>
                        </div>

                        <ul className="space-y-3 mb-10 flex-1">
                            {[
                                "Up to 50 invoices / month",
                                "AI data + line-item extraction",
                                "Duplicate detection",
                                "Gmail import",
                                "CSV export",
                                "Approve / reject workflow",
                                "1 workspace seat",
                            ].map((f, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                                    <Check size={16} className="text-primary-600 shrink-0 mt-0.5" />
                                    {f}
                                </li>
                            ))}
                        </ul>

                        <Link
                            href="/register?plan=free"
                            className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white text-center font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                            Get Started Free <ArrowRight size={16} />
                        </Link>
                    </motion.div>

                    {/* Pro Plan */}
                    <motion.div
                        variants={itemVariants}
                        className="bg-slate-900 border border-slate-700 rounded-3xl p-8 flex flex-col relative overflow-hidden"
                    >
                        {/* Most popular badge */}
                        <div className="absolute top-5 right-5">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-primary-500 text-white">
                                <Star size={9} /> Most Popular
                            </span>
                        </div>

                        <div className="mb-8">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-xl bg-primary-500/20 text-primary-400 flex items-center justify-center">
                                    <Star size={20} />
                                </div>
                                <h3 className="text-xl font-bold text-white">Pro</h3>
                            </div>
                            <div className="mb-3">
                                <span className="text-4xl font-bold text-white">$50</span>
                                <span className="text-slate-400 text-sm ml-1">/ month</span>
                            </div>
                            <p className="text-sm text-slate-400 leading-relaxed">
                                For growing teams that process invoices daily.
                            </p>
                        </div>

                        <ul className="space-y-3 mb-10 flex-1">
                            {[
                                "Up to 500 invoices / month",
                                "Everything in Free",
                                "Up to 5 workspace seats",
                                "Excel, PDF, QuickBooks & Xero export",
                                "Priority email support",
                            ].map((f, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                                    <Check size={16} className="text-primary-400 shrink-0 mt-0.5" />
                                    {f}
                                </li>
                            ))}
                        </ul>

                        <button
                            onClick={handleUpgrade}
                            disabled={upgrading}
                            className="w-full py-3 px-4 bg-primary-500 hover:bg-primary-400 disabled:opacity-60 text-white text-center font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                            {upgrading
                                ? <><Loader2 size={16} className="animate-spin" /> Redirecting…</>
                                : <>{session ? "Upgrade to Pro" : "Get Started"} <ArrowRight size={16} /></>}
                        </button>
                    </motion.div>

                    {/* Enterprise Plan */}
                    <motion.div
                        variants={itemVariants}
                        className="bg-slate-50 border border-slate-200 rounded-3xl p-8 flex flex-col"
                    >
                        <div className="mb-8">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-600 flex items-center justify-center">
                                    <Building2 size={20} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900">Enterprise</h3>
                            </div>
                            <div className="mb-3">
                                <span className="text-4xl font-bold text-slate-900">Custom</span>
                            </div>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                For teams with high volumes or custom requirements.
                            </p>
                        </div>

                        <ul className="space-y-3 mb-10 flex-1">
                            {[
                                "Unlimited invoices",
                                "Unlimited seats",
                                "Custom integrations",
                                "Dedicated support",
                                "SLA & compliance docs",
                            ].map((f, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                                    <Check size={16} className="text-slate-400 shrink-0 mt-0.5" />
                                    {f}
                                </li>
                            ))}
                        </ul>

                        <button
                            onClick={() => setSalesOpen(true)}
                            className="w-full py-3 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 text-center font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                            Contact Sales <ArrowRight size={16} />
                        </button>
                    </motion.div>
                </motion.div>

            </div>

            <ContactSalesModal open={salesOpen} onClose={() => setSalesOpen(false)} />
        </div>
    );
}
