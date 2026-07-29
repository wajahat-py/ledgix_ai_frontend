"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, ArrowRight, Zap, Building2, Star, Sparkles, MessageSquare } from "lucide-react";
import ContactSalesModal from "@/components/ContactSalesModal";

export default function PricingPage() {
    const [salesOpen, setSalesOpen] = useState(false);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0 },
    };

    return (
        <div className="min-h-screen bg-white pt-24 pb-32">
            <div className="container mx-auto px-4 relative z-10">

                {/* Header */}
                <div className="text-center max-w-2xl mx-auto mb-20">
                    <div className="inline-flex items-center gap-2 bg-primary-50 border border-primary-100 text-primary-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                        <Sparkles size={14} />
                        Enterprise Solution
                    </div>
                    <h1 className="text-4xl md:text-5xl font-heading font-bold text-slate-900 mb-5">
                        Simple, transparent pricing
                    </h1>
                    <p className="text-lg text-slate-500">
                        Start with our interactive demo. Contact us for custom enterprise solutions.
                    </p>
                </div>

                {/* Pricing Cards */}
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto"
                >
                    {/* Demo/Free Plan */}
                    <motion.div
                        variants={itemVariants}
                        className="bg-white border border-slate-200 rounded-3xl p-8 flex flex-col"
                    >
                        <div className="mb-8">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-xl bg-primary-50 border border-primary-100 text-primary-600 flex items-center justify-center">
                                    <Sparkles size={20} />
                                </div>
                                <h3 className="text-xl font-bold text-slate-900">Interactive Demo</h3>
                            </div>
                            <div className="mb-3">
                                <span className="text-4xl font-bold text-slate-900">Free</span>
                            </div>
                            <p className="text-sm text-slate-500 leading-relaxed">
                                Explore the full platform with sample data — no signup required.
                            </p>
                        </div>

                        <ul className="space-y-3 mb-10 flex-1">
                            {[
                                "Full dashboard experience",
                                "AI data + line-item extraction",
                                "Duplicate detection",
                                "Approve / reject workflow",
                                "Multiple invoice samples",
                                "No credit card required",
                            ].map((f, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
                                    <Check size={16} className="text-primary-600 shrink-0 mt-0.5" />
                                    {f}
                                </li>
                            ))}
                        </ul>

                        <Link
                            href="/login"
                            className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white text-center font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                            Try Demo <ArrowRight size={16} />
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
                                "Everything in Demo",
                                "Up to 5 workspace seats",
                                "Excel, PDF, QuickBooks & Xero export",
                                "Priority email support",
                                "Custom domain",
                            ].map((f, i) => (
                                <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                                    <Check size={16} className="text-primary-400 shrink-0 mt-0.5" />
                                    {f}
                                </li>
                            ))}
                        </ul>

                        <button
                            onClick={() => setSalesOpen(true)}
                            className="w-full py-3 px-4 bg-primary-500 hover:bg-primary-400 text-white text-center font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                        >
                            <MessageSquare size={16} />
                            Get Started
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
                                "On-premise deployment option",
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
                            <Building2 size={16} />
                            Contact Sales
                        </button>
                    </motion.div>
                </motion.div>

                {/* CTA Section */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mt-20 text-center"
                >
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-12 max-w-4xl mx-auto">
                        <h2 className="text-3xl font-bold text-white mb-4">Ready to automate your invoices?</h2>
                        <p className="text-slate-300 mb-8 max-w-2xl mx-auto">
                            Try our interactive demo to see the full platform in action, or contact us to discuss your specific needs.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/login"
                                className="inline-flex items-center justify-center gap-2 py-3 px-6 bg-white hover:bg-slate-50 text-slate-900 font-semibold rounded-xl transition-colors"
                            >
                                <Sparkles size={18} />
                                Try Demo
                            </Link>
                            <button
                                onClick={() => setSalesOpen(true)}
                                className="inline-flex items-center justify-center gap-2 py-3 px-6 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition-colors"
                            >
                                <MessageSquare size={18} />
                                Contact Us
                            </button>
                        </div>
                    </div>
                </motion.div>

            </div>

            <ContactSalesModal open={salesOpen} onClose={() => setSalesOpen(false)} />
        </div>
    );
}
