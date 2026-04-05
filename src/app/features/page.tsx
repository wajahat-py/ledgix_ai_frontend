"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Zap, Shield, Clock, Layers,
  FileCheck2, Database, Mail, ArrowRight,
  CheckCircle2, AlertTriangle, FileText
} from "lucide-react";

export default function FeaturesPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col pt-16">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="container mx-auto px-4 relative z-10 text-center max-w-4xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 border border-primary-200 text-primary-600 text-sm font-medium mb-8"
          >
            <Zap size={16} className="text-primary-600" />
            Built for Modern Finance Teams
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-heading font-bold text-slate-900 tracking-tight mb-8"
          >
            Automate Accounts Payable — <span className="text-primary-600">End to End</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-slate-500 mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            Capture, extract, and approve invoices automatically — no manual work required.
          </motion.p>
        </div>
      </section>

      {/* Feature 1: AI Data Extraction */}
      <section className="py-24 border-t border-slate-100 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="md:w-1/2">
              <div className="w-16 h-16 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center mb-6">
                <FileCheck2 size={32} />
              </div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary-600 mb-3">Data Extraction</p>
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-slate-900 mb-6">
                Extract Invoice Data — Accurately and Automatically
              </h2>
              <p className="text-slate-500 text-lg mb-8 leading-relaxed">
                Skip rigid templates and manual OCR setup. Ledgix extracts vendors, line items, and totals from any invoice format — automatically.
              </p>
              <ul className="space-y-4">
                {[
                  "99.8% extraction accuracy, out of the box",
                  "Line-item capture with quantities and unit prices",
                  "Supports multi-page invoices",
                  "Auto-detects currency and language"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-600">
                    <CheckCircle2 className="text-primary-600 shrink-0" size={20} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="md:w-1/2 w-full">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
                <div className="space-y-4 relative z-10">
                  {/* Mock extraction UI */}
                  <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="w-12 h-12 bg-slate-100 rounded flex items-center justify-center"><FileText className="text-slate-400"/></div>
                    <div className="flex-1">
                      <div className="h-4 w-32 bg-slate-200 rounded mb-2 w-full overflow-hidden relative">
                         <motion.div initial={{x: "-100%"}} animate={{x: "100%"}} transition={{repeat: Infinity, duration: 2, ease: "linear"}} className="absolute inset-0 bg-primary-400/40" />
                      </div>
                      <div className="h-3 w-48 bg-slate-100 rounded"></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div className="text-xs text-slate-500 mb-1">Vendor Detected</div>
                      <div className="text-sm font-medium text-slate-900 flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-green-600" /> Stripe Inc.
                      </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div className="text-xs text-slate-500 mb-1">Total Amount</div>
                      <div className="text-sm font-medium text-slate-900 flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-green-600" /> $450.00
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 2: Email & Intake */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row-reverse items-center gap-16">
            <div className="md:w-1/2">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6">
                <Mail size={32} />
              </div>
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-slate-900 mb-6">
                Connect Your Email
              </h2>
              <p className="text-slate-500 text-lg mb-8 leading-relaxed">
                Connect your inbox to automatically detect and process invoices.
              </p>
            </div>
            <div className="md:w-1/2 w-full">
               {/* Decorative email flow graphic */}
               <div className="relative h-80 rounded-2xl bg-slate-50 border border-slate-200 p-8 flex flex-col items-center justify-center">
                  <div className="absolute top-8 left-8 p-4 bg-white rounded-xl shadow-sm border border-slate-200 z-10 animate-bounce" style={{animationDuration: '3s'}}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center"><Mail size={16} className="text-blue-600"/></div>
                      <div>
                        <div className="h-2 w-20 bg-slate-200 rounded mb-1"></div>
                        <div className="h-2 w-12 bg-slate-100 rounded"></div>
                      </div>
                    </div>
                  </div>

                  <div className="w-0.5 h-32 bg-gradient-to-b from-blue-300 to-transparent"></div>

                  <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200 text-center relative z-20">
                    <Database className="text-primary-600 mb-3 mx-auto" size={32}/>
                    <div className="text-slate-900 font-medium">Ledgix Engine</div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature 3: Duplicate Protection */}
      <section className="py-24 border-t border-slate-100 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="md:w-1/2">
              <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-6">
                <AlertTriangle size={32} />
              </div>
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-slate-900 mb-6">
                Bulletproof Duplicate Detection
              </h2>
              <p className="text-slate-500 text-lg mb-8 leading-relaxed">
                Never pay the same invoice twice. Ledgix cross-references every new upload against historic data using fuzzy logic, catching duplicates even if the invoice number slightly changes.
              </p>
              <ul className="space-y-4">
                {[
                  "Fuzzy matching on Vendor Name and Amounts",
                  "Cross-checking across dates and PO numbers",
                  "Hard blocks on exact duplicate PDFs",
                  "Saves an average of 1.5% in lost capital"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-600">
                    <Shield className="text-red-600 shrink-0" size={20} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="md:w-1/2 w-full">
              <div className="bg-red-50 border border-red-200 rounded-2xl p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4">
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                </div>
                <AlertTriangle size={48} className="text-red-600 mb-6" />
                <h3 className="text-xl font-medium text-red-700 mb-2">Duplicate Found!</h3>
                <p className="text-slate-600 text-sm mb-6">We found a 98% match with a previously paid invoice from Oct 12, 2023.</p>
                <div className="flex gap-4">
                  <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">Reject Invoice</button>
                  <button className="border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-white transition-colors">Review Match</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Grid Features */}
      <section className="py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-heading font-bold text-slate-900 mb-16">Built for Real-World Workflows</h2>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid md:grid-cols-3 gap-8 text-left"
          >
            {[
              {
                icon: <Layers className="text-emerald-600" size={24}/>,
                title: "Automated Approval Flows",
                desc: "Automatically route invoices to the right approvers and keep everything moving."
              },
              {
                icon: <Database className="text-purple-600" size={24}/>,
                title: "Seamless Accounting Exports",
                desc: "Export structured data to Xero, QuickBooks, or NetSuite — no cleanup needed."
              },
              {
                icon: <Clock className="text-blue-600" size={24}/>,
                title: "Process Invoices in Seconds",
                desc: "Handle even complex invoices in seconds, not minutes."
              }
            ].map((feature, i) => (
              <motion.div key={i} variants={itemVariants} className="bg-white border border-slate-200 p-8 rounded-2xl hover:border-slate-300 hover:shadow-sm transition-all group">
                <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center mb-6 border border-slate-200">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-500 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32 relative overflow-hidden bg-slate-900">
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-6">
            Ready to stop doing manual entry?
          </h2>
          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
            Try our interactive demo right now with no account required, or sign up to process your first 100 invoices for free.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/register"
              className="px-8 py-4 bg-white hover:bg-slate-100 text-slate-900 font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
            >
              Start Free Trial <ArrowRight size={18} />
            </Link>
            <Link
              href="/demo"
              className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2"
            >
              Try Interactive Demo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
