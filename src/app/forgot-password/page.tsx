"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowRight, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

export default function ForgotPasswordPage() {
    const [email, setEmail]       = useState("");
    const [emailError, setEmailError] = useState("");
    const [isLoading, setIsLoading]   = useState(false);
    const [sent, setSent]             = useState(false);

    function validate(): boolean {
        if (!email.trim()) { setEmailError("Email is required."); return false; }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setEmailError("Please enter a valid email address.");
            return false;
        }
        return true;
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!validate()) return;

        setIsLoading(true);
        try {
            await fetch(`${BACKEND_URL}/api/auth/forgot-password/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.trim().toLowerCase() }),
            });
            // Always show success — never reveal whether the email exists.
            setSent(true);
        } catch {
            // Network failure — still show success to avoid enumeration,
            // but log it so developers notice.
            setSent(true);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="sm:mx-auto sm:w-full sm:max-w-sm"
            >
                <h2 className="text-center text-2xl font-heading font-bold text-slate-900 tracking-tight">
                    {sent ? "Check your inbox" : "Reset your password"}
                </h2>
                <p className="mt-2 text-center text-[13px] text-slate-500">
                    {sent
                        ? `If ${email} has an account, a reset link is on its way.`
                        : "Enter your email and we'll send you a reset link."}
                </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.06 }}
                className="mt-6 sm:mx-auto sm:w-full sm:max-w-sm"
            >
                <div className="bg-white border border-slate-200 py-8 px-6 rounded-2xl shadow-sm">
                    <AnimatePresence mode="wait">
                        {sent ? (
                            <motion.div
                                key="sent"
                                initial={{ opacity: 0, scale: 0.97 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center text-center gap-4 py-2"
                            >
                                <div className="w-12 h-12 rounded-full bg-green-50 border border-green-200 flex items-center justify-center">
                                    <CheckCircle2 size={24} className="text-green-600" />
                                </div>
                                <div>
                                    <p className="text-slate-900 font-semibold">Reset link sent</p>
                                    <p className="text-slate-500 text-[13px] mt-1 leading-relaxed">
                                        Click the link in the email to set a new password. The link expires in{" "}
                                        <span className="text-slate-700 font-medium">1 hour</span>.
                                    </p>
                                </div>
                                <p className="text-[12px] text-slate-400">
                                    Didn&apos;t get it? Check your spam folder or{" "}
                                    <button
                                        onClick={() => setSent(false)}
                                        className="text-primary-600 hover:text-primary-700 transition-colors font-medium"
                                    >
                                        try again
                                    </button>.
                                </p>
                            </motion.div>
                        ) : (
                            <motion.form
                                key="form"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                onSubmit={handleSubmit}
                                noValidate
                                className="space-y-4"
                            >
                                <div>
                                    <label htmlFor="email" className="block text-[13px] font-medium text-slate-700 mb-1.5">
                                        Email address
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Mail className={`h-4 w-4 ${emailError ? "text-red-500" : "text-slate-400"}`} />
                                        </div>
                                        <input
                                            id="email"
                                            type="email"
                                            autoComplete="email"
                                            value={email}
                                            onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
                                            className={`block w-full pl-10 pr-3 py-2.5 border rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all text-sm ${
                                                emailError
                                                    ? "border-red-400 focus:ring-red-500"
                                                    : "border-slate-300 focus:ring-primary-500"
                                            }`}
                                            placeholder="you@company.com"
                                            aria-describedby={emailError ? "email-error" : undefined}
                                        />
                                    </div>
                                    {emailError && (
                                        <p id="email-error" className="mt-1 text-[11px] text-red-600">{emailError}</p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading
                                        ? <><Loader2 size={14} className="animate-spin" /> Sending…</>
                                        : <>Send reset link <ArrowRight size={14} /></>}
                                </button>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </div>

                <p className="mt-5 text-center text-[13px] text-slate-500">
                    <Link
                        href="/login"
                        className="inline-flex items-center gap-1.5 font-medium text-slate-700 hover:text-slate-900 transition-colors"
                    >
                        <ArrowLeft size={13} /> Back to sign in
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}
