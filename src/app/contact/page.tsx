"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Building2, CheckCircle2, Loader2, Send, ArrowRight, Sparkles, MessageSquare } from "lucide-react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://ledgixapi.wajahatlabs.com";

interface FormData {
    name: string;
    email: string;
    company: string;
    message: string;
    plan: "free" | "pro";
}

interface FieldErrors {
    name?: string;
    email?: string;
    company?: string;
    message?: string;
}

export default function ContactPage() {
    const plan = (typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("plan") : "") || "free";

    const [formData, setFormData] = useState<FormData>({
        name: "",
        email: "",
        company: "",
        message: "",
        plan: plan as "free" | "pro",
    });

    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const validate = (): FieldErrors => {
        const errors: FieldErrors = {};
        if (!formData.name.trim()) errors.name = "Name is required.";
        if (!formData.email.trim()) errors.email = "Email is required.";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
            errors.email = "Please enter a valid email address.";
        if (!formData.company.trim()) errors.company = "Company name is required.";
        if (!formData.message.trim()) errors.message = "Please tell us about your needs.";
        return errors;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const errors = validate();
        if (Object.keys(errors).length > 0) {
            setFieldErrors(errors);
            return;
        }

        setFieldErrors({});
        setIsLoading(true);

        try {
            const res = await fetch(`${BACKEND_URL}/api/auth/contact-sales/`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                setIsSubmitted(true);
            } else {
                const data = await res.json();
                setFieldErrors({ email: data.detail || "Failed to send message. Please try again." });
            }
        } catch {
            setFieldErrors({ email: "Network error. Please try again." });
        } finally {
            setIsLoading(false);
        }
    };

    const inputClass = (field: keyof FieldErrors) =>
        `block w-full px-4 py-3 border rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all text-sm ${
            fieldErrors[field] ? "border-red-400 focus:ring-red-500" : "border-slate-300 focus:ring-primary-500"
        }`;

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="sm:mx-auto sm:w-full sm:max-w-md"
                >
                    <div className="bg-white border border-slate-200 py-12 px-8 rounded-2xl shadow-sm text-center">
                        <div className="w-16 h-16 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-6">
                            <CheckCircle2 size={32} className="text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Thank You!</h2>
                        <p className="text-slate-600 mb-6">
                            We&apos;ve received your inquiry and will get back to you within 1-2 business days.
                        </p>
                        <a
                            href="/"
                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold transition-colors"
                        >
                            <ArrowRight size={16} />
                            Back to Home
                        </a>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Header */}
            <div className="bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <a href="/" className="inline-flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                                <rect x="1" y="1" width="6" height="8" rx="1.5" fill="white" fillOpacity="0.9"/>
                                <rect x="9" y="1" width="6" height="4" rx="1.5" fill="white" fillOpacity="0.9"/>
                                <rect x="9" y="7" width="6" height="4" rx="1.5" fill="white" fillOpacity="0.9"/>
                                <rect x="1" y="11" width="14" height="2.5" rx="1.25" fill="white" fillOpacity="0.5"/>
                            </svg>
                        </div>
                        <span className="font-bold text-slate-900">Ledgix</span>
                    </a>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 py-12 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 items-start">

                        {/* Left Column - Info */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4 }}
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                                    <MessageSquare size={20} className="text-white" />
                                </div>
                                <h1 className="text-3xl font-bold text-slate-900">Get Started</h1>
                            </div>

                            <p className="text-lg text-slate-600 mb-8">
                                Ready to automate your invoice processing? Fill out the form and our team will get back to you within 1-2 business days.
                            </p>

                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-primary-50 border border-primary-100 flex items-center justify-center shrink-0">
                                        <Sparkles size={18} className="text-primary-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900 mb-1">Try the Demo First</h3>
                                        <p className="text-sm text-slate-600">
                                            Explore our full dashboard with sample data — no signup required.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-green-50 border border-green-100 flex items-center justify-center shrink-0">
                                        <Building2 size={18} className="text-green-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900 mb-1">Enterprise Solutions</h3>
                                        <p className="text-sm text-slate-600">
                                            Custom integrations, dedicated support, and volume pricing available.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                                        <Send size={18} className="text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-slate-900 mb-1">Quick Response</h3>
                                        <p className="text-sm text-slate-600">
                                            We typically respond within 1-2 business days with personalized next steps.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 p-4 bg-slate-100 rounded-lg">
                                <p className="text-sm text-slate-700">
                                    <span className="font-semibold">Prefer to explore first?</span>{" "}
                                    <a href="/demo" className="text-primary-600 hover:text-primary-700 font-medium">
                                        Try our live demo →
                                    </a>
                                </p>
                            </div>
                        </motion.div>

                        {/* Right Column - Form */}
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.4, delay: 0.1 }}
                        >
                            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
                                <h2 className="text-xl font-bold text-slate-900 mb-6">Contact Sales</h2>

                                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                                    <div>
                                        <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">
                                            Full Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            id="name"
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => {
                                                setFormData({ ...formData, name: e.target.value });
                                                setFieldErrors((p) => ({ ...p, name: undefined }));
                                            }}
                                            className={inputClass("name")}
                                            placeholder="John Smith"
                                        />
                                        {fieldErrors.name && (
                                            <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                                            Work Email <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            id="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => {
                                                setFormData({ ...formData, email: e.target.value });
                                                setFieldErrors((p) => ({ ...p, email: undefined }));
                                            }}
                                            className={inputClass("email")}
                                            placeholder="john@company.com"
                                        />
                                        {fieldErrors.email && (
                                            <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="company" className="block text-sm font-medium text-slate-700 mb-1.5">
                                            Company Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            id="company"
                                            type="text"
                                            value={formData.company}
                                            onChange={(e) => {
                                                setFormData({ ...formData, company: e.target.value });
                                                setFieldErrors((p) => ({ ...p, company: undefined }));
                                            }}
                                            className={inputClass("company")}
                                            placeholder="Acme Inc."
                                        />
                                        {fieldErrors.company && (
                                            <p className="mt-1 text-xs text-red-600">{fieldErrors.company}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="message" className="block text-sm font-medium text-slate-700 mb-1.5">
                                            How can we help? <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            id="message"
                                            rows={4}
                                            value={formData.message}
                                            onChange={(e) => {
                                                setFormData({ ...formData, message: e.target.value });
                                                setFieldErrors((p) => ({ ...p, message: undefined }));
                                            }}
                                            className={inputClass("message")}
                                            placeholder="Tell us about your invoice processing needs..."
                                        />
                                        {fieldErrors.message && (
                                            <p className="mt-1 text-xs text-red-600">{fieldErrors.message}</p>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-lg text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin" />
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <Send size={16} />
                                                Send Message
                                            </>
                                        )}
                                    </button>

                                    <p className="text-xs text-slate-500 text-center">
                                        By submitting this form you agree to our{" "}
                                        <a href="#" className="text-slate-700 hover:text-slate-900 underline">Terms</a>
                                        {" "}and{" "}
                                        <a href="#" className="text-slate-700 hover:text-slate-900 underline">Privacy Policy</a>.
                                    </p>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}
