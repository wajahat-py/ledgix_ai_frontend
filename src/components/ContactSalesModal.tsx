"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, User, Building2, MessageSquare, Loader2, CheckCircle2, ArrowRight } from "lucide-react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

interface Props {
  open: boolean;
  onClose: () => void;
}

interface Fields {
  name: string;
  email: string;
  company: string;
  message: string;
}

interface Errors {
  name?: string;
  email?: string;
  form?: string;
}

export default function ContactSalesModal({ open, onClose }: Props) {
  const [fields, setFields] = useState<Fields>({ name: "", email: "", company: "", message: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => firstInputRef.current?.focus(), 80);
    } else {
      setTimeout(() => {
        setFields({ name: "", email: "", company: "", message: "" });
        setErrors({});
        setSent(false);
        setLoading(false);
      }, 300);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  function set(field: keyof Fields, value: string) {
    setFields((f) => ({ ...f, [field]: value }));
    if (field === "name"  && errors.name)  setErrors((e) => ({ ...e, name:  undefined }));
    if (field === "email" && errors.email) setErrors((e) => ({ ...e, email: undefined }));
    if (errors.form) setErrors((e) => ({ ...e, form: undefined }));
  }

  function validate(): boolean {
    const errs: Errors = {};
    if (!fields.name.trim())  errs.name  = "Name is required.";
    if (!fields.email.trim()) errs.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email))
      errs.email = "Please enter a valid email address.";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({});
    try {
      const res  = await fetch(`${BACKEND_URL}/api/auth/contact-sales/`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(fields),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors({ form: data.detail ?? "Something went wrong. Please try again." });
        return;
      }
      setSent(true);
    } catch {
      setErrors({ form: "Network error. Please check your connection." });
    } finally {
      setLoading(false);
    }
  }

  const inputBase =
    "block w-full pl-10 pr-3 py-2.5 border rounded-lg bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all text-sm";
  const inputClass = (err?: string) =>
    `${inputBase} ${err ? "border-red-400 focus:ring-red-500" : "border-slate-300 focus:ring-primary-500"}`;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden
          />

          {/* Panel */}
          <motion.div
            key="panel"
            role="dialog"
            aria-modal="true"
            aria-label="Contact Sales"
            initial={{ opacity: 0, scale: 0.97, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl pointer-events-auto overflow-hidden">

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                <div>
                  <h2 className="text-[15px] font-semibold text-slate-900">Talk to Sales</h2>
                  <p className="text-[12px] text-slate-500 mt-0.5">We&apos;ll get back to you within 24 hours.</p>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                  aria-label="Close"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Body */}
              <div className="px-6 py-5">
                <AnimatePresence mode="wait">

                  {sent ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center text-center gap-3 py-6"
                    >
                      <div className="w-12 h-12 rounded-full bg-green-50 border border-green-200 flex items-center justify-center">
                        <CheckCircle2 size={24} className="text-green-600" />
                      </div>
                      <div>
                        <p className="text-slate-900 font-semibold">Message sent!</p>
                        <p className="text-slate-500 text-sm mt-1">
                          We&apos;ll reach out to <span className="text-slate-700 font-medium">{fields.email}</span> soon.
                        </p>
                      </div>
                      <button
                        onClick={onClose}
                        className="mt-2 px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg transition-colors"
                      >
                        Done
                      </button>
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
                    {/* Name */}
                    <div>
                      <label htmlFor="cs-name" className="block text-[12px] font-medium text-slate-700 mb-1.5">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User size={14} className={errors.name ? "text-red-500" : "text-slate-400"} />
                        </div>
                        <input
                          ref={firstInputRef}
                          id="cs-name"
                          type="text"
                          autoComplete="name"
                          value={fields.name}
                          onChange={(e) => set("name", e.target.value)}
                          className={inputClass(errors.name)}
                          aria-describedby={errors.name ? "cs-name-err" : undefined}
                        />
                      </div>
                      {errors.name && <p id="cs-name-err" className="mt-1 text-[11px] text-red-600">{errors.name}</p>}
                    </div>

                    {/* Email */}
                    <div>
                      <label htmlFor="cs-email" className="block text-[12px] font-medium text-slate-700 mb-1.5">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail size={14} className={errors.email ? "text-red-500" : "text-slate-400"} />
                        </div>
                        <input
                          id="cs-email"
                          type="email"
                          autoComplete="email"
                          value={fields.email}
                          onChange={(e) => set("email", e.target.value)}
                          className={inputClass(errors.email)}
                          aria-describedby={errors.email ? "cs-email-err" : undefined}
                        />
                      </div>
                      {errors.email && <p id="cs-email-err" className="mt-1 text-[11px] text-red-600">{errors.email}</p>}
                    </div>

                    {/* Company */}
                    <div>
                      <label htmlFor="cs-company" className="block text-[12px] font-medium text-slate-700 mb-1.5">
                        Company <span className="text-slate-400 font-normal">(optional)</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Building2 size={14} className="text-slate-400" />
                        </div>
                        <input
                          id="cs-company"
                          type="text"
                          autoComplete="organization"
                          value={fields.company}
                          onChange={(e) => set("company", e.target.value)}
                          className={inputClass()}
                        />
                      </div>
                    </div>

                    {/* Message */}
                    <div>
                      <label htmlFor="cs-message" className="block text-[12px] font-medium text-slate-700 mb-1.5">
                        What do you need? <span className="text-slate-400 font-normal">(optional)</span>
                      </label>
                      <div className="relative">
                        <div className="absolute top-2.5 left-0 pl-3 flex items-start pointer-events-none">
                          <MessageSquare size={14} className="text-slate-400" />
                        </div>
                        <textarea
                          id="cs-message"
                          rows={3}
                          value={fields.message}
                          onChange={(e) => set("message", e.target.value)}
                          placeholder="Tell us about your invoice volume, team size, or any specific requirements…"
                          className={`${inputClass()} pl-10 resize-none`}
                        />
                      </div>
                    </div>

                    {errors.form && (
                      <p className="text-[12px] text-red-600 text-center">{errors.form}</p>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
                    >
                      {loading
                        ? <><Loader2 size={14} className="animate-spin" /> Sending…</>
                        : <>Send Message <ArrowRight size={14} /></>}
                    </button>
                  </motion.form>
                  )}

                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
