"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Zap, Shield, Mail, ArrowRight,
  CheckCircle2, AlertTriangle, FileText,
  Download, Users, Eye, CheckSquare,
  FileSpreadsheet, BookOpen, RefreshCw,
  Play, Pencil, Wifi,
} from "lucide-react";
import { featureCategories, marketingFeatures } from "@/lib/marketing-features";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col pt-16">

      {/* Hero */}
      <section className="relative pt-20 pb-28 overflow-hidden">
        <div className="container mx-auto px-4 relative z-10 text-center max-w-4xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 border border-primary-200 text-primary-600 text-sm font-medium mb-8"
          >
            <Zap size={16} />
            Everything your team needs — nothing you don&apos;t
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-heading font-bold text-slate-900 tracking-tight mb-6"
          >
            Invoice processing,{" "}
            <span className="text-primary-600">done right</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed"
          >
            Upload, extract, review, and export invoices — with your whole team, in real time.
          </motion.p>
        </div>
      </section>

      <section className="pb-20">
        <div className="container mx-auto px-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {featureCategories.map((category) => (
              <div key={category.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <h2 className="text-sm font-semibold text-slate-900 mb-2">{category.title}</h2>
                <p className="text-xs text-slate-500 leading-relaxed mb-4">{category.description}</p>
                <div className="space-y-2">
                  {category.items.map((item) => (
                    <div key={item} className="flex items-start gap-2 text-xs text-slate-600">
                      <CheckCircle2 size={12} className="text-primary-600 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature 1: AI Data Extraction */}
      <section className="py-24 border-t border-slate-100 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="md:w-1/2">
              <div className="w-16 h-16 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mb-6">
                <FileText size={32} />
              </div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary-600 mb-3">AI Extraction</p>
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-slate-900 mb-6">
                Extract invoice data automatically
              </h2>
              <p className="text-slate-500 text-lg mb-8 leading-relaxed">
                Upload any PDF or image invoice and Ledgix extracts vendor details, line items, totals, dates, and more — no templates, no manual entry.
              </p>
              <ul className="space-y-4">
                {[
                  "Vendor name, invoice number, dates, and totals",
                  "Full line-item capture with quantities and unit prices",
                  "Per-field confidence scores so you know what to trust",
                  "Edit extracted fields inline before approving",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-600">
                    <CheckCircle2 className="text-primary-600 shrink-0" size={20} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="md:w-1/2 w-full">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                    <FileText className="text-slate-400" size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="h-3.5 bg-slate-200 rounded w-40 mb-2 overflow-hidden relative">
                      <motion.div
                        initial={{ x: "-100%" }}
                        animate={{ x: "100%" }}
                        transition={{ repeat: Infinity, duration: 1.8, ease: "linear" }}
                        className="absolute inset-0 bg-primary-400/40"
                      />
                    </div>
                    <div className="h-2.5 bg-slate-100 rounded w-24" />
                  </div>
                  <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5 shrink-0">Processing…</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Vendor", value: "Stripe Inc.", color: "text-green-600" },
                    { label: "Total Amount", value: "$1,240.00", color: "text-green-600" },
                    { label: "Invoice #", value: "INV-20489", color: "text-green-600" },
                    { label: "Due Date", value: "Dec 15, 2025", color: "text-green-600" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">{label}</div>
                      <div className={`text-sm font-semibold ${color} flex items-center gap-1.5`}>
                        <CheckCircle2 size={12} /> {value}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span className="text-xs text-slate-500">2 line items extracted</span>
                  <button className="inline-flex items-center gap-1.5 text-[11px] text-slate-500 hover:text-slate-700 border border-slate-200 bg-white px-2.5 py-1 rounded-lg">
                    <Pencil size={11} /> Edit fields
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 2: Gmail Import */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row-reverse items-center gap-16">
            <div className="md:w-1/2">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6">
                <Mail size={32} />
              </div>
              <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-3">Gmail Import</p>
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-slate-900 mb-6">
                Pull invoices straight from Gmail
              </h2>
              <p className="text-slate-500 text-lg mb-8 leading-relaxed">
                Connect your Google account and Ledgix scans your inbox for invoice attachments. Select what to import — no forwarding rules, no manual downloads.
              </p>
              <ul className="space-y-4">
                {[
                  "Searches Gmail for PDF and image attachments",
                  "Preview attachments before importing",
                  "One-click import into your invoice queue",
                  "Secure OAuth — Ledgix never stores your password",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-600">
                    <CheckCircle2 className="text-blue-600 shrink-0" size={20} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="md:w-1/2 w-full">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
                <div className="flex items-center gap-2 mb-4">
                  <Mail size={16} className="text-blue-600" />
                  <span className="text-sm font-semibold text-slate-700">Gmail Import</span>
                  <span className="ml-auto text-[11px] text-slate-400">3 attachments found</span>
                </div>
                {[
                  { from: "billing@stripe.com", subject: "Invoice for November", file: "invoice_nov.pdf", size: "148 KB" },
                  { from: "noreply@aws.amazon.com", subject: "AWS Invoice — Oct 2025", file: "aws-invoice.pdf", size: "92 KB" },
                  { from: "invoices@figma.com", subject: "Figma — Team Plan", file: "figma_receipt.pdf", size: "64 KB" },
                ].map((email, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
                      <FileText size={13} className="text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-slate-800 truncate">{email.subject}</p>
                      <p className="text-[11px] text-slate-400 truncate">{email.from} · {email.size}</p>
                    </div>
                    <button className="text-[11px] font-semibold text-primary-600 bg-primary-50 border border-primary-200 px-2.5 py-1 rounded-lg shrink-0">
                      Import
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 3: Duplicate Detection */}
      <section className="py-24 border-t border-slate-100 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="md:w-1/2">
              <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-6">
                <AlertTriangle size={32} />
              </div>
              <p className="text-xs font-semibold uppercase tracking-widest text-red-600 mb-3">Duplicate Detection</p>
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-slate-900 mb-6">
                Never pay the same invoice twice
              </h2>
              <p className="text-slate-500 text-lg mb-8 leading-relaxed">
                Every upload is checked against your history using rule-based matching, fuzzy text comparison, embedding similarity, and AI verification — all combined into a single confidence score.
              </p>
              <ul className="space-y-4">
                {[
                  "Multi-signal scoring: rules, fuzzy, embeddings, and AI",
                  "Catches near-duplicates even if the invoice number changes",
                  "Score breakdown so you understand every decision",
                  "Dismiss false positives without losing the audit trail",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-600">
                    <Shield className="text-red-600 shrink-0" size={20} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="md:w-1/2 w-full">
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <AlertTriangle size={20} className="text-red-600 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-red-700">Duplicate Detected</p>
                    <p className="text-xs text-red-600">94% confidence match with a previously uploaded invoice</p>
                  </div>
                  <span className="ml-auto text-[11px] font-bold bg-red-100 text-red-700 border border-red-200 px-2 py-0.5 rounded-full shrink-0">94%</span>
                </div>
                <div className="space-y-2.5">
                  {[
                    { label: "Rule-based", value: 92 },
                    { label: "Fuzzy match", value: 88 },
                    { label: "Embedding similarity", value: 97 },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                        <span>{label}</span><span className="font-mono">{value}%</span>
                      </div>
                      <div className="h-1.5 bg-red-100 rounded-full overflow-hidden">
                        <div className="h-full bg-red-400 rounded-full" style={{ width: `${value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 pt-1">
                  <button className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">Reject Invoice</button>
                  <button className="flex-1 border border-red-200 bg-white text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors">Dismiss</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 4: Team & Approval */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row-reverse items-center gap-16">
            <div className="md:w-1/2">
              <div className="w-16 h-16 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center mb-6">
                <Users size={32} />
              </div>
              <p className="text-xs font-semibold uppercase tracking-widest text-violet-600 mb-3">Team Collaboration</p>
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-slate-900 mb-6">
                Built for teams — not just solo users
              </h2>
              <p className="text-slate-500 text-lg mb-8 leading-relaxed">
                Invite your team, assign roles, and keep invoice approval moving. Members upload, approvers review, and everyone stays in the loop.
              </p>
              <ul className="space-y-4">
                {[
                  "Four roles: Owner, Admin, Member, and Viewer",
                  "Invite teammates by email with one click",
                  "Dedicated approval queue for invoices pending review",
                  "Rejection reasons tracked for every decision",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-600">
                    <CheckCircle2 className="text-violet-600 shrink-0" size={20} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="md:w-1/2 w-full">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckSquare size={15} className="text-violet-600" />
                  <span className="text-sm font-semibold text-slate-700">Approval Queue</span>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-semibold ml-auto">3 pending</span>
                </div>
                {[
                  { vendor: "Stripe Inc.", amount: "$1,240.00", by: "alice@company.com" },
                  { vendor: "AWS", amount: "$892.50", by: "bob@company.com" },
                  { vendor: "Figma", amount: "$156.00", by: "alice@company.com" },
                ].map((inv, i) => (
                  <div key={i} className="flex items-center gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                      <Eye size={13} className="text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-slate-900 truncate">{inv.vendor}</p>
                      <p className="text-[11px] text-slate-400 truncate">{inv.by}</p>
                    </div>
                    <span className="font-mono text-[12px] font-semibold text-slate-800 shrink-0">{inv.amount}</span>
                    <div className="flex gap-1.5 shrink-0">
                      <button className="text-[10px] font-bold text-white bg-green-600 hover:bg-green-500 px-2 py-1 rounded-md transition-colors">✓</button>
                      <button className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 px-2 py-1 rounded-md transition-colors">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="py-24 border-t border-slate-100 bg-slate-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-heading font-bold text-slate-900 mb-4">Everything else you need</h2>
          <p className="text-slate-500 mb-16 max-w-xl mx-auto">Packed with the day-to-day tools finance teams actually use.</p>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="grid md:grid-cols-3 gap-6 text-left"
          >
            {[
              {
                icon: <Download className="text-emerald-600" size={22} />,
                bg: "bg-emerald-50",
                title: "Export in 5 formats",
                desc: "Download your invoices as CSV, Excel, PDF, QuickBooks IIF, or Xero-ready CSV — ready to import into your accounting software.",
                tags: ["CSV", "Excel", "PDF", "QuickBooks", "Xero"],
              },
              {
                icon: <Eye className="text-cyan-600" size={22} />,
                bg: "bg-cyan-50",
                title: "Side-by-side file preview",
                desc: "View the original PDF or image next to the extracted fields. Spot discrepancies and edit data without switching tabs.",
                tags: ["PDF preview", "Image preview", "Inline editing"],
              },
              {
                icon: <Wifi className="text-blue-600" size={22} />,
                bg: "bg-blue-50",
                title: "Real-time status updates",
                desc: "Processing results, duplicate alerts, and approval decisions appear instantly via WebSocket — no page refresh needed.",
                tags: ["Live updates", "Toast alerts", "No polling"],
              },
              {
                icon: <Play className="text-primary-600" size={22} />,
                bg: "bg-primary-50",
                title: "On-demand processing",
                desc: "Control when AI extraction runs. Upload invoices now, process them later — or trigger it instantly in one click.",
                tags: ["Manual trigger", "Retry on failure"],
              },
              {
                icon: <FileSpreadsheet className="text-green-600" size={22} />,
                bg: "bg-green-50",
                title: "QuickBooks & Xero import",
                desc: "Export a correctly formatted IIF file for QuickBooks Desktop or a Xero-compatible CSV — no reformatting required.",
                tags: ["QuickBooks IIF", "Xero CSV"],
              },
              {
                icon: <Shield className="text-red-600" size={22} />,
                bg: "bg-red-50",
                title: "Role-based access control",
                desc: "Viewers can browse, Members upload and edit, Admins manage the team, Owners control the workspace. The backend enforces all of it.",
                tags: ["Owner", "Admin", "Member", "Viewer"],
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                className="bg-white border border-slate-200 p-6 rounded-2xl hover:border-slate-300 hover:shadow-sm transition-all"
              >
                <div className={`w-11 h-11 rounded-xl ${feature.bg} flex items-center justify-center mb-5 border border-slate-200`}>
                  {feature.icon}
                </div>
                <h3 className="text-[15px] font-semibold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-4">{feature.desc}</p>
                <div className="flex flex-wrap gap-1.5">
                  {feature.tags.map((tag) => (
                    <span key={tag} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-24 border-t border-slate-100">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary-600 mb-3">Complete Capability List</p>
              <h2 className="text-3xl font-heading font-bold text-slate-900 mb-3">All major product features at a glance</h2>
              <p className="text-slate-500 text-base leading-relaxed">
                This section gives buyers a quick scan of the app’s full capability set without forcing them to infer it from screenshots or long-form copy.
              </p>
            </div>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 self-start px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              See pricing <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {marketingFeatures.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-slate-300 transition-colors">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${feature.accent}`}>
                      <Icon size={20} />
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{feature.badge}</span>
                  </div>
                  <h3 className="text-[15px] font-semibold text-slate-900 mb-2 capitalize">{feature.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 bg-slate-900">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-6">
            Ready to cut the manual work?
          </h2>
          <p className="text-xl text-slate-400 mb-10 max-w-xl mx-auto">
            Sign up free and start processing invoices today — no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/register"
              className="px-8 py-4 bg-white hover:bg-slate-100 text-slate-900 font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              Get started free <ArrowRight size={18} />
            </Link>
            <Link
              href="/demo"
              className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2"
            >
              <RefreshCw size={16} /> Try the demo
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
