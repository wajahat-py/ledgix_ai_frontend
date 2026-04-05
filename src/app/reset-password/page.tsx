"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, ArrowRight, Loader2, Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

export default function ResetPasswordPage() {
    return (
        <Suspense>
            <ResetPasswordInner />
        </Suspense>
    );
}

type PageState = "form" | "success" | "invalid";

interface FieldErrors {
    password?: string;
    password2?: string;
}

function ResetPasswordInner() {
    const router       = useRouter();
    const searchParams = useSearchParams();
    const token        = searchParams.get("token") ?? "";

    const [pageState, setPageState] = useState<PageState>("form");
    const [password, setPassword]   = useState("");
    const [password2, setPassword2] = useState("");
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [isLoading, setIsLoading] = useState(false);
    const [showPw, setShowPw]   = useState(false);
    const [showPw2, setShowPw2] = useState(false);

    // If there's no token at all, surface the invalid state immediately.
    useEffect(() => {
        if (!token) setPageState("invalid");
    }, [token]);

    function validate(): boolean {
        const errors: FieldErrors = {};
        if (!password) {
            errors.password = "Password is required.";
        } else if (password.length < 8) {
            errors.password = "Password must be at least 8 characters.";
        }
        if (!password2) {
            errors.password2 = "Please confirm your password.";
        } else if (password !== password2) {
            errors.password2 = "Passwords do not match.";
        }
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!validate()) return;

        setIsLoading(true);
        try {
            const res = await fetch(`${BACKEND_URL}/api/auth/reset-password/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, password, password2 }),
            });
            const data = await res.json();

            if (res.ok) {
                setPageState("success");
                // Redirect to login after 3 s so the user can read the success message.
                setTimeout(() => router.push("/login?reset=success"), 3000);
            } else {
                const detail: string = data.detail ?? "";
                if (res.status === 400 && (detail.includes("invalid") || detail.includes("expired"))) {
                    setPageState("invalid");
                } else if (data.password) {
                    setFieldErrors({ password: Array.isArray(data.password) ? data.password[0] : data.password });
                } else {
                    setFieldErrors({ password: detail || "Something went wrong. Please try again." });
                }
            }
        } catch {
            setFieldErrors({ password: "Network error. Please check your connection." });
        } finally {
            setIsLoading(false);
        }
    }

    const inputClass = (field: keyof FieldErrors) =>
        `block w-full pl-10 pr-10 py-2.5 border rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all text-sm ${
            fieldErrors[field] ? "border-red-400 focus:ring-red-500" : "border-slate-300 focus:ring-primary-500"
        }`;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="sm:mx-auto sm:w-full sm:max-w-sm"
            >
                <h2 className="text-center text-2xl font-heading font-bold text-slate-900 tracking-tight">
                    {pageState === "success" ? "Password updated" :
                     pageState === "invalid" ? "Link expired" :
                     "Set new password"}
                </h2>
                <p className="mt-2 text-center text-[13px] text-slate-500">
                    {pageState === "success" ? "Redirecting you to sign in…" :
                     pageState === "invalid" ? "This reset link is no longer valid." :
                     "Choose a strong password for your account."}
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

                        {/* ── Success ── */}
                        {pageState === "success" && (
                            <motion.div
                                key="success"
                                initial={{ opacity: 0, scale: 0.97 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center text-center gap-4 py-2"
                            >
                                <div className="w-12 h-12 rounded-full bg-green-50 border border-green-200 flex items-center justify-center">
                                    <CheckCircle2 size={24} className="text-green-600" />
                                </div>
                                <div>
                                    <p className="text-slate-900 font-semibold">Password reset successfully</p>
                                    <p className="text-slate-500 text-[13px] mt-1">
                                        You&apos;ll be redirected to sign in automatically.
                                    </p>
                                </div>
                                <Link
                                    href="/login"
                                    className="inline-flex items-center gap-2 px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg transition-colors"
                                >
                                    Sign in now <ArrowRight size={14} />
                                </Link>
                            </motion.div>
                        )}

                        {/* ── Invalid / expired ── */}
                        {pageState === "invalid" && (
                            <motion.div
                                key="invalid"
                                initial={{ opacity: 0, scale: 0.97 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center text-center gap-4 py-2"
                            >
                                <div className="w-12 h-12 rounded-full bg-red-50 border border-red-200 flex items-center justify-center">
                                    <XCircle size={24} className="text-red-600" />
                                </div>
                                <div>
                                    <p className="text-slate-900 font-semibold">Link invalid or expired</p>
                                    <p className="text-slate-500 text-[13px] mt-1 leading-relaxed">
                                        Reset links expire after 1 hour and can only be used once.
                                        Request a new one to continue.
                                    </p>
                                </div>
                                <Link
                                    href="/forgot-password"
                                    className="inline-flex items-center gap-2 px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg transition-colors"
                                >
                                    Request new link <ArrowRight size={14} />
                                </Link>
                            </motion.div>
                        )}

                        {/* ── Form ── */}
                        {pageState === "form" && (
                            <motion.form
                                key="form"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                onSubmit={handleSubmit}
                                noValidate
                                className="space-y-4"
                            >
                                {/* New password */}
                                <div>
                                    <label htmlFor="password" className="block text-[13px] font-medium text-slate-700 mb-1.5">
                                        New password
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Lock className={`h-4 w-4 ${fieldErrors.password ? "text-red-500" : "text-slate-400"}`} />
                                        </div>
                                        <input
                                            id="password"
                                            type={showPw ? "text" : "password"}
                                            autoComplete="new-password"
                                            value={password}
                                            onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: undefined })); }}
                                            className={inputClass("password")}
                                            placeholder="Min. 8 characters"
                                            aria-describedby={fieldErrors.password ? "pw-error" : undefined}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPw((v) => !v)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                                            aria-label={showPw ? "Hide password" : "Show password"}
                                        >
                                            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                    {fieldErrors.password && (
                                        <p id="pw-error" className="mt-1 text-[11px] text-red-600">{fieldErrors.password}</p>
                                    )}
                                </div>

                                {/* Confirm password */}
                                <div>
                                    <label htmlFor="password2" className="block text-[13px] font-medium text-slate-700 mb-1.5">
                                        Confirm password
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Lock className={`h-4 w-4 ${fieldErrors.password2 ? "text-red-500" : "text-slate-400"}`} />
                                        </div>
                                        <input
                                            id="password2"
                                            type={showPw2 ? "text" : "password"}
                                            autoComplete="new-password"
                                            value={password2}
                                            onChange={(e) => { setPassword2(e.target.value); setFieldErrors((p) => ({ ...p, password2: undefined })); }}
                                            className={inputClass("password2")}
                                            placeholder="Repeat your password"
                                            aria-describedby={fieldErrors.password2 ? "pw2-error" : undefined}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPw2((v) => !v)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                                            aria-label={showPw2 ? "Hide password" : "Show password"}
                                        >
                                            {showPw2 ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                    {fieldErrors.password2 && (
                                        <p id="pw2-error" className="mt-1 text-[11px] text-red-600">{fieldErrors.password2}</p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoading
                                        ? <><Loader2 size={14} className="animate-spin" /> Resetting…</>
                                        : <>Reset password <ArrowRight size={14} /></>}
                                </button>
                            </motion.form>
                        )}

                    </AnimatePresence>
                </div>

                {pageState === "form" && (
                    <p className="mt-5 text-center text-[13px] text-slate-500">
                        Remember it?{" "}
                        <Link href="/login" className="font-medium text-slate-700 hover:text-slate-900 transition-colors">
                            Sign in
                        </Link>
                    </p>
                )}
            </motion.div>
        </div>
    );
}
