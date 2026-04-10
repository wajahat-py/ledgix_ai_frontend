"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, User, Building2, ArrowRight, Loader2, CheckCircle2, RefreshCw } from "lucide-react";

interface FieldErrors {
    name?:     string;
    email?:    string;
    company?:  string;
    password?: string;
}

type PageState = "form" | "email_sent" | "unverified" | "google_account" | "email_exists";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

async function resendVerification(email: string): Promise<{ ok: boolean; message: string }> {
    try {
        const res  = await fetch(`${BACKEND_URL}/api/auth/resend-verification/`, {
            method:  "POST",
            headers: { "Content-Type": "application/json" },
            body:    JSON.stringify({ email }),
        });
        const data = await res.json();
        return { ok: res.ok, message: data.detail ?? "Email sent." };
    } catch {
        return { ok: false, message: "Could not send email. Please try again." };
    }
}

// ── Google logo SVG ───────────────────────────────────────────────────────────
function GoogleLogo({ size = 18 }: { size?: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
    );
}

export default function RegisterPage() {
    return (
        <Suspense>
            <RegisterPageInner />
        </Suspense>
    );
}

function RegisterPageInner() {
    const searchParams = useSearchParams();
    const plan = searchParams.get("plan") ?? "free";

    const [pageState, setPageState]       = useState<PageState>("form");
    const [submittedEmail, setSubmittedEmail] = useState("");

    const [name, setName]       = useState("");
    const [email, setEmail]     = useState("");
    const [company, setCompany] = useState("");
    const [password, setPassword]   = useState("");
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [isLoading, setIsLoading]     = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    const [resendLoading, setResendLoading] = useState(false);
    const [resendMessage, setResendMessage] = useState("");

    const clearError = (field: keyof FieldErrors) =>
        setFieldErrors((prev) => ({ ...prev, [field]: undefined }));

    const validate = (): FieldErrors => {
        const errors: FieldErrors = {};
        if (!name.trim())  errors.name     = "Full name is required.";
        if (!email.trim()) errors.email    = "Email is required.";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
            errors.email = "Please enter a valid email address.";
        if (!password)     errors.password = "Password is required.";
        else if (password.length < 8)
            errors.password = "Password must be at least 8 characters.";
        return errors;
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        const errors = validate();
        if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }

        setFieldErrors({});
        setIsLoading(true);

        try {
            const res  = await fetch(`${BACKEND_URL}/api/auth/register/`, {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({
                    full_name: name, email, company_name: company,
                    password, password2: password,
                    plan: plan,
                }),
            });
            const data = await res.json();

            if (res.status === 201) {
                setSubmittedEmail(email);
                setPageState("email_sent");
                return;
            }

            // Google-account collision
            if (data.code === "google_account") {
                setSubmittedEmail(email);
                setPageState("google_account");
                return;
            }

            // Existing email/password account
            if (data.code === "email_exists") {
                setSubmittedEmail(email);
                setPageState("email_exists");
                return;
            }

            // Legacy unverified branch (shouldn't fire post-refactor, but keep for safety)
            if (
                data.email?.[0]?.includes("not verified") ||
                (Array.isArray(data.email) && data.email.some((e: string) => e.includes("not verified")))
            ) {
                setSubmittedEmail(email);
                setPageState("unverified");
                return;
            }

            const backendErrors: FieldErrors = {};
            if (data.email)            backendErrors.email    = Array.isArray(data.email)            ? data.email[0]            : data.email;
            if (data.password)         backendErrors.password = Array.isArray(data.password)         ? data.password[0]         : data.password;
            if (data.full_name)        backendErrors.name     = Array.isArray(data.full_name)        ? data.full_name[0]        : data.full_name;
            if (data.non_field_errors) backendErrors.password = Array.isArray(data.non_field_errors) ? data.non_field_errors[0] : data.non_field_errors;
            if (Object.keys(backendErrors).length === 0)
                backendErrors.password = data.detail || "Registration failed. Please try again.";
            setFieldErrors(backendErrors);
        } catch {
            setFieldErrors({ password: "An unexpected error occurred. Please check your connection." });
        } finally {
            setIsLoading(false);
        }
    };

    const handleResend = async () => {
        setResendLoading(true);
        setResendMessage("");
        const result = await resendVerification(submittedEmail);
        setResendMessage(result.message);
        setResendLoading(false);
    };

    const handleGoogleSignIn = async () => {
        setGoogleLoading(true);
        // Store intended plan in a cookie so the backend GoogleAuthView can read it
        document.cookie = `intended_plan=${plan}; path=/; max-age=300; SameSite=Lax`;
        const callbackUrl = plan === "pro" ? "/dashboard?upgrade=pro" : "/dashboard";
        await signIn("google", { callbackUrl });
    };

    const inputClass = (field: keyof FieldErrors) =>
        `block w-full pl-10 pr-3 py-2.5 border rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all text-sm ${
            fieldErrors[field] ? "border-red-400 focus:ring-red-500" : "border-slate-300 focus:ring-primary-500"
        }`;

    // ── page title / subtitle ─────────────────────────────────────────────────
    const titles: Record<PageState, string> = {
        form:           plan === "pro" ? "Sign up for Pro" : "Create an account",
        email_sent:     "Check your inbox",
        unverified:     "Verify your email",
        google_account: "Already have an account",
        email_exists:   "Already have an account",
    };
    const subtitles: Record<PageState, string> = {
        form:           plan === "pro" 
            ? "Complete your details to start your Pro subscription."
            : "Get started with automated invoice processing today.",
        email_sent:     `We sent a verification link to ${submittedEmail}. ${plan === "pro" ? "Verify to complete your subscription." : ""}`,
        unverified:     "This email is registered but not yet verified.",
        google_account: `${submittedEmail} is linked to a Google account.`,
        email_exists:   `${submittedEmail} is already registered.`,
    };

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
                    {titles[pageState]}
                </h2>
                <p className="mt-2 text-center text-[13px] text-slate-500">
                    {subtitles[pageState]}
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

                        {/* ── Email sent ── */}
                        {pageState === "email_sent" && (
                            <motion.div key="sent" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-4">
                                <div className="w-12 h-12 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle2 size={24} className="text-green-600" />
                                </div>
                                <p className="text-slate-600 text-[13px] leading-relaxed mb-5">
                                    Click the link in your email to activate your account. {plan === "pro" ? "You'll then be redirected to complete your payment." : "Check your spam folder if you don't see it."}
                                </p>
                                <button
                                    onClick={handleResend} disabled={resendLoading}
                                    className="inline-flex items-center gap-2 text-[13px] text-primary-600 hover:text-primary-700 transition-colors disabled:opacity-50"
                                >
                                    {resendLoading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
                                    Resend verification email
                                </button>
                                {resendMessage && <p className="mt-2 text-[12px] text-slate-500">{resendMessage}</p>}
                            </motion.div>
                        )}

                        {/* ── Unverified existing email ── */}
                        {pageState === "unverified" && (
                            <motion.div key="unverified" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-4">
                                <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4">
                                    <Mail size={20} className="text-amber-600" />
                                </div>
                                <p className="text-slate-900 font-semibold mb-1">Email not verified</p>
                                <p className="text-slate-500 text-[13px] mb-5">
                                    <span className="font-medium text-slate-700">{submittedEmail}</span> is registered but not yet verified.
                                </p>
                                <button
                                    onClick={handleResend} disabled={resendLoading}
                                    className="w-full flex justify-center items-center gap-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                                >
                                    {resendLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                                    {resendLoading ? "Sending…" : "Resend verification email"}
                                </button>
                                {resendMessage && <p className="mt-3 text-[12px] text-slate-500">{resendMessage}</p>}
                                <button
                                    onClick={() => { setPageState("form"); setResendMessage(""); }}
                                    className="mt-3 text-[12px] text-slate-400 hover:text-slate-700 transition-colors"
                                >
                                    Use a different email
                                </button>
                            </motion.div>
                        )}

                        {/* ── Google account collision ── */}
                        {pageState === "google_account" && (
                            <motion.div key="google_account" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-4">
                                <div className="w-12 h-12 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center mx-auto mb-4">
                                    <GoogleLogo size={22} />
                                </div>
                                <p className="text-slate-900 font-semibold mb-1">Already signed up with Google</p>
                                <p className="text-slate-500 text-[13px] mb-5 leading-relaxed">
                                    <span className="font-medium text-slate-700">{submittedEmail}</span> is linked to a Google account.
                                </p>
                                <button
                                    onClick={handleGoogleSignIn} disabled={googleLoading}
                                    className="w-full flex justify-center items-center gap-2.5 py-2.5 px-4 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 shadow-sm"
                                >
                                    {googleLoading ? <Loader2 size={14} className="animate-spin text-slate-400" /> : <GoogleLogo size={16} />}
                                    {googleLoading ? "Redirecting…" : "Continue with Google"}
                                </button>
                                <button
                                    onClick={() => { setPageState("form"); setResendMessage(""); }}
                                    className="mt-3 text-[12px] text-slate-400 hover:text-slate-700 transition-colors"
                                >
                                    Use a different email
                                </button>
                            </motion.div>
                        )}

                        {/* ── Existing email/password account ── */}
                        {pageState === "email_exists" && (
                            <motion.div key="email_exists" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-4">
                                <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto mb-4">
                                    <User size={20} className="text-slate-600" />
                                </div>
                                <p className="text-slate-900 font-semibold mb-1">Email already registered</p>
                                <p className="text-slate-500 text-[13px] mb-5 leading-relaxed">
                                    <span className="font-medium text-slate-700">{submittedEmail}</span> already has an account.
                                    Sign in instead.
                                </p>
                                <Link
                                    href="/login"
                                    className="w-full flex justify-center items-center gap-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold transition-colors"
                                >
                                    Sign in <ArrowRight size={14} />
                                </Link>
                                <button
                                    onClick={() => { setPageState("form"); setResendMessage(""); }}
                                    className="mt-3 text-[12px] text-slate-400 hover:text-slate-700 transition-colors"
                                >
                                    Use a different email
                                </button>
                            </motion.div>
                        )}

                        {/* ── Registration form ── */}
                        {pageState === "form" && (
                            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                {/* Google sign-up */}
                                <button
                                    type="button"
                                    onClick={handleGoogleSignIn}
                                    disabled={googleLoading || isLoading}
                                    className="w-full inline-flex justify-center items-center gap-3 py-2.5 px-4 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-sm font-medium text-slate-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
                                >
                                    {googleLoading
                                        ? <Loader2 size={18} className="animate-spin text-slate-400" />
                                        : <GoogleLogo size={18} />}
                                    {googleLoading ? "Redirecting to Google…" : "Continue with Google"}
                                </button>

                                <div className="my-6 relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-slate-200" />
                                    </div>
                                    <div className="relative flex justify-center text-[12px]">
                                        <span className="px-3 bg-white text-slate-400">or continue with email</span>
                                    </div>
                                </div>

                                <form className="space-y-4" onSubmit={handleRegister} noValidate>
                                    {/* Full Name */}
                                    <div>
                                        <label htmlFor="name" className="block text-[13px] font-medium text-slate-700 mb-1.5">Full Name</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <User className={`h-4 w-4 ${fieldErrors.name ? "text-red-500" : "text-slate-400"}`} />
                                            </div>
                                            <input id="name" type="text" autoComplete="name" value={name}
                                                onChange={(e) => { setName(e.target.value); clearError("name"); }}
                                                className={inputClass("name")} />
                                        </div>
                                        {fieldErrors.name && <p className="mt-1 text-[11px] text-red-600">{fieldErrors.name}</p>}
                                    </div>

                                    {/* Company Name */}
                                    <div>
                                        <label htmlFor="company" className="block text-[13px] font-medium text-slate-700 mb-1.5">
                                            Company <span className="text-slate-400 font-normal">(optional)</span>
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Building2 className="h-4 w-4 text-slate-400" />
                                            </div>
                                            <input id="company" type="text" autoComplete="organization" value={company}
                                                onChange={(e) => { setCompany(e.target.value); clearError("company"); }}
                                                className={inputClass("company")} />
                                        </div>
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label htmlFor="email" className="block text-[13px] font-medium text-slate-700 mb-1.5">Email address</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Mail className={`h-4 w-4 ${fieldErrors.email ? "text-red-500" : "text-slate-400"}`} />
                                            </div>
                                            <input id="email" type="email" autoComplete="email" value={email}
                                                onChange={(e) => { setEmail(e.target.value); clearError("email"); }}
                                                className={inputClass("email")} />
                                        </div>
                                        {fieldErrors.email && <p className="mt-1 text-[11px] text-red-600">{fieldErrors.email}</p>}
                                    </div>

                                    {/* Password */}
                                    <div>
                                        <label htmlFor="password" className="block text-[13px] font-medium text-slate-700 mb-1.5">Password</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Lock className={`h-4 w-4 ${fieldErrors.password ? "text-red-500" : "text-slate-400"}`} />
                                            </div>
                                            <input id="password" type="password" autoComplete="new-password" value={password}
                                                onChange={(e) => { setPassword(e.target.value); clearError("password"); }}
                                                className={inputClass("password")} />
                                        </div>
                                        {fieldErrors.password
                                            ? <p className="mt-1 text-[11px] text-red-600">{fieldErrors.password}</p>
                                            : <p className="mt-1 text-[11px] text-slate-400">At least 8 characters.</p>}
                                    </div>

                                    <p className="text-[12px] text-slate-400">
                                        By signing up you agree to our{" "}
                                        <a href="#" className="font-medium text-slate-700 hover:text-slate-900 underline underline-offset-2">Terms</a>{" "}
                                        and{" "}
                                        <a href="#" className="font-medium text-slate-700 hover:text-slate-900 underline underline-offset-2">Privacy Policy</a>.
                                    </p>

                                    <button type="submit" disabled={isLoading || googleLoading}
                                        className="w-full flex justify-center py-2.5 px-4 rounded-lg text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed items-center gap-2"
                                    >
                                        {isLoading
                                            ? <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                            : "Create account"}
                                    </button>
                                </form>
                            </motion.div>
                        )}

                    </AnimatePresence>
                </div>

                <p className="mt-5 text-center text-[13px] text-slate-500">
                    Already have an account?{" "}
                    <Link href={`/login${plan === "pro" ? "?plan=pro" : ""}`} className="font-medium text-slate-900 hover:text-slate-700 transition-colors">
                        Sign in
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}
