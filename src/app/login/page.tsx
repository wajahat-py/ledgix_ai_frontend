"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight, Loader2, RefreshCw, CheckCircle2 } from "lucide-react";

interface FieldErrors {
    email?:    string;
    password?: string;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

// ── Google logo SVG ───────────────────────────────────────────────────────────
function GoogleLogo() {
    return (
        <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
    );
}

export default function LoginPage() {
    return (
        <Suspense>
            <LoginPageInner />
        </Suspense>
    );
}

function LoginPageInner() {
    const searchParams = useSearchParams();

    const [email, setEmail]       = useState("");
    const [password, setPassword] = useState("");
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [isLoading, setIsLoading]     = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    // Success banner after password reset
    const [resetSuccess, setResetSuccess] = useState(false);
    // Resend verification hint
    const [showResend, setShowResend]       = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [resendMessage, setResendMessage] = useState("");
    // Google-only account hint
    const [showGoogleHint, setShowGoogleHint] = useState(false);

    useEffect(() => {
        if (searchParams.get("reset") === "success") setResetSuccess(true);

        // NextAuth error codes (e.g. ?error=AccessDenied when user cancels Google)
        const oauthError = searchParams.get("error");
        if (oauthError) {
            const msg =
                oauthError === "AccessDenied"
                    ? "Google sign-in was cancelled."
                    : oauthError === "OAuthAccountNotLinked"
                        ? "This email is already registered. Sign in with your password."
                        : "Google sign-in failed. Please try again.";
            setFieldErrors({ password: msg });
        }
    }, [searchParams]);

    const validate = (): FieldErrors => {
        const errors: FieldErrors = {};
        if (!email.trim())    errors.email    = "Email is required.";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
            errors.email = "Please enter a valid email address.";
        if (!password)        errors.password = "Password is required.";
        return errors;
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        const errors = validate();
        if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }

        setFieldErrors({});
        setShowResend(false);
        setShowGoogleHint(false);
        setResendMessage("");
        setIsLoading(true);

        try {
            const res = await signIn("credentials", { redirect: false, email, password });

            if (res?.error) {
                // Re-check the backend for a specific error code
                try {
                    const check = await fetch(`${BACKEND_URL}/api/auth/login/`, {
                        method:  "POST",
                        headers: { "Content-Type": "application/json" },
                        body:    JSON.stringify({ email, password }),
                    });
                    const data = await check.json();

                    if (data.code === "email_unverified") {
                        setFieldErrors({ password: "Email not verified. Check your inbox for the verification link." });
                        setShowResend(true);
                        return;
                    }
                    if (data.code === "google_only") {
                        setFieldErrors({ email: "This account uses Google sign-in." });
                        setShowGoogleHint(true);
                        return;
                    }
                } catch { /* ignore */ }
                setFieldErrors({ password: "Invalid email or password." });
            } else {
                window.location.href = "/dashboard";
            }
        } catch {
            setFieldErrors({ password: "An error occurred. Please try again." });
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        setResendLoading(true);
        setResendMessage("");
        try {
            const res  = await fetch(`${BACKEND_URL}/api/auth/resend-verification/`, {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({ email }),
            });
            const data = await res.json();
            setResendMessage(data.detail ?? "Verification email sent.");
        } catch {
            setResendMessage("Could not send email. Please try again.");
        } finally {
            setResendLoading(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setGoogleLoading(true);
        await signIn("google", { callbackUrl: "/dashboard" });
        // Page navigates away; loading state clears automatically.
    };

    const inputClass = (field: keyof FieldErrors) =>
        `block w-full pl-10 pr-3 py-2.5 border rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all text-sm ${
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
                <div className="flex justify-center mb-6">
                    <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <rect x="1" y="1" width="6" height="8" rx="1.5" fill="white" fillOpacity="0.9"/>
                            <rect x="9" y="1" width="6" height="4" rx="1.5" fill="white" fillOpacity="0.9"/>
                            <rect x="9" y="7" width="6" height="4" rx="1.5" fill="white" fillOpacity="0.9"/>
                            <rect x="1" y="11" width="14" height="2.5" rx="1.25" fill="white" fillOpacity="0.5"/>
                        </svg>
                    </div>
                </div>
                <h2 className="text-center text-2xl font-heading font-bold text-slate-900 tracking-tight">
                    Welcome back
                </h2>
                <p className="mt-2 text-center text-[13px] text-slate-500">
                    Enter your details to access your dashboard.
                </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.06 }}
                className="mt-6 sm:mx-auto sm:w-full sm:max-w-sm"
            >
                <div className="bg-white border border-slate-200 py-8 px-6 rounded-2xl shadow-sm">

                    {/* Password-reset success banner */}
                    {resetSuccess && (
                        <div className="mb-5 flex items-start gap-3 px-4 py-3 rounded-lg bg-green-50 border border-green-200">
                            <CheckCircle2 size={15} className="text-green-600 shrink-0 mt-0.5" />
                            <p className="text-[13px] text-green-700">
                                Password reset successfully. Sign in with your new password.
                            </p>
                        </div>
                    )}

                    {/* ── Google sign-in ── */}
                    <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        disabled={googleLoading || isLoading}
                        className="w-full inline-flex justify-center items-center gap-3 py-2.5 px-4 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-sm font-medium text-slate-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
                    >
                        {googleLoading
                            ? <Loader2 size={16} className="animate-spin text-slate-400" />
                            : <GoogleLogo />}
                        {googleLoading ? "Redirecting to Google…" : "Continue with Google"}
                    </button>

                    <div className="my-5 relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200" />
                        </div>
                        <div className="relative flex justify-center text-[12px]">
                            <span className="px-3 bg-white text-slate-400">or continue with email</span>
                        </div>
                    </div>

                    {/* ── Email / password form ── */}
                    <form className="space-y-4" onSubmit={handleLogin} noValidate>
                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-[13px] font-medium text-slate-700 mb-1.5">Email address</label>
                            <div className="mt-2 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className={`h-4 w-4 ${fieldErrors.email ? "text-red-500" : "text-slate-400"}`} />
                                </div>
                                <input
                                    id="email" name="email" type="email" autoComplete="email"
                                    value={email}
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        setFieldErrors((p) => ({ ...p, email: undefined }));
                                        setShowResend(false);
                                        setShowGoogleHint(false);
                                    }}
                                    className={inputClass("email")}
                                />
                            </div>
                            {fieldErrors.email && (
                                <div>
                                    <p className="mt-1.5 text-[11px] text-red-600">{fieldErrors.email}</p>
                                    {showGoogleHint && (
                                        <button
                                            type="button"
                                            onClick={handleGoogleSignIn}
                                            disabled={googleLoading}
                                            className="mt-2 inline-flex items-center gap-1.5 text-[12px] text-primary-600 hover:text-primary-700 transition-colors disabled:opacity-50"
                                        >
                                            <GoogleLogo />
                                            Continue with Google instead
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="block text-[13px] font-medium text-slate-700 mb-1.5">Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className={`h-4 w-4 ${fieldErrors.password ? "text-red-500" : "text-slate-400"}`} />
                                </div>
                                <input
                                    id="password" name="password" type="password" autoComplete="current-password"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        setFieldErrors((p) => ({ ...p, password: undefined }));
                                    }}
                                    className={inputClass("password")}
                                />
                            </div>
                            {fieldErrors.password && (
                                <div>
                                    <p className="mt-1.5 text-[11px] text-red-600">{fieldErrors.password}</p>
                                    {showResend && (
                                        <div className="mt-2">
                                            <button
                                                type="button" onClick={handleResend} disabled={resendLoading}
                                                className="inline-flex items-center gap-1.5 text-[12px] text-primary-600 hover:text-primary-700 transition-colors disabled:opacity-50"
                                            >
                                                {resendLoading ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                                                {resendLoading ? "Sending…" : "Resend verification email"}
                                            </button>
                                            {resendMessage && <p className="mt-1 text-[11px] text-slate-500">{resendMessage}</p>}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-end">
                            <Link href="/forgot-password" className="text-[12px] font-medium text-slate-500 hover:text-slate-700 transition-colors">
                                Forgot password?
                            </Link>
                        </div>

                        <button
                            type="submit" disabled={isLoading || googleLoading}
                            className="w-full flex justify-center py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed items-center gap-2"
                        >
                            {isLoading
                                ? <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                : "Sign in"}
                        </button>
                    </form>
                </div>

                <p className="mt-5 text-center text-[13px] text-slate-500">
                    Don&apos;t have an account?{" "}
                    <Link href="/register" className="font-medium text-slate-900 hover:text-slate-700 transition-colors">
                        Sign up free
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}
