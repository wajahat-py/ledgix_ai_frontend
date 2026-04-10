"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  ArrowRight, FileText, Zap, ShieldCheck,
  BarChart3, UploadCloud, CheckCircle2,
  AlertCircle, Clock, Building2, UserCircle,
  Mail, Download, Users,
} from "lucide-react";
import { featureCategories, marketingFeatures } from "@/lib/marketing-features";

export default function LandingPage() {
  const [demoStep, setDemoStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setDemoStep((prev) => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };



  return (
    <div className="relative min-h-screen bg-white overflow-hidden text-slate-700">
      {/* Background Gradients */}
      <div
        className="absolute top-0 left-0 w-full h-[800px] pointer-events-none opacity-40 mix-blend-screen"
        style={{
          background: 'linear-gradient(135deg, #1E2A38 0%, #3A4F7A 100%)',
          maskImage: 'linear-gradient(to bottom, black 20%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 20%, transparent 100%)'
        }}
      ></div>

      <div className="container mx-auto px-4 pt-32 pb-24 relative z-10 space-y-32">

        {/* 1. HERO SECTION */}
        <section className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-left"
          >


            <h1 className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold text-slate-900 tracking-tight mb-6 leading-[1.1]">
              Automate Invoice <br /> Processing with <span className="text-primary-600">AI</span>
            </h1>

            <p className="text-xl text-slate-500 mb-8 max-w-lg leading-relaxed">
              Extract, validate, and organize invoice data in seconds — no manual entry required. Scale your finance team efficiently.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link
                href="/demo"
                className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-full font-semibold transition-all flex items-center justify-center gap-2"
              >
                Try Demo <ArrowRight size={18} />
              </Link>
              <Link
                href="/register"
                className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-50 text-slate-900 rounded-full font-semibold transition-all flex items-center justify-center gap-2 border border-slate-200"
              >
                Sign Up
              </Link>
            </div>

            <p className="mt-3 text-sm text-slate-500">
              Or explore full dashboard instantly using the{" "}
              <Link href="/login?demo=1" className="font-medium text-slate-900 underline underline-offset-2 transition-colors hover:text-slate-700">
                demo account
              </Link>
              .
            </p>

            <div className="mt-8 flex items-center gap-4 text-sm text-slate-500">
              <span className="flex items-center gap-1"><CheckCircle2 size={16} className="text-primary-600" /> No credit card required</span>
              <span className="flex items-center gap-1"><CheckCircle2 size={16} className="text-primary-600" /> Free to get started</span>
            </div>
          </motion.div>

          {/* Hero Dashboard Isometric Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 30, rotateY: 10 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative perspective-[1000px] w-full"
          >
            <div className="relative rounded-2xl border border-slate-700/50 bg-slate-900/80 backdrop-blur-xl shadow-2xl p-4 overflow-hidden transform-gpu md:rotate-y-[-5deg] md:rotate-x-[2deg]">
              <div className="flex items-center gap-2 mb-4 border-b border-white/5 pb-4">
                <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                <div className="ml-4 text-xs font-mono text-slate-500">ledgix.app/dashboard</div>
              </div>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="h-24 w-1/3 bg-primary-500/10 rounded-xl border border-primary-500/20 p-4 flex flex-col justify-between">
                    <span className="text-xs text-primary-400 font-medium">Processed</span>
                    <span className="text-2xl font-bold text-white">1,248</span>
                  </div>
                  <div className="h-24 w-1/3 bg-white/5 rounded-xl border border-white/10 p-4 flex flex-col justify-between">
                    <span className="text-xs text-slate-400">Total Value</span>
                    <span className="text-2xl font-bold text-white">$45k</span>
                  </div>
                  <div className="h-24 w-1/3 bg-rose-500/10 rounded-xl border border-rose-500/20 p-4 flex flex-col justify-between">
                    <span className="text-xs text-rose-400 font-medium">Duplicates Caught</span>
                    <span className="text-2xl font-bold text-white">12</span>
                  </div>
                </div>
                <div className="bg-[#0a0a0c] rounded-lg border border-white/5 overflow-hidden">
                  <div className="grid grid-cols-4 gap-4 p-3 border-b border-white/5 text-xs text-slate-500 font-medium uppercase tracking-wide bg-white/[0.02]">
                    <div className="col-span-1">Vendor</div>
                    <div className="col-span-1">Amount</div>
                    <div className="col-span-1">Date</div>
                    <div className="col-span-1">Status</div>
                  </div>
                  {[
                    { vendor: 'Stripe Inc', amount: '$1,200.00', date: 'Oct 12', status: 'Approved', color: 'text-green-400' },
                    { vendor: 'AWS Services', amount: '$4,532.12', date: 'Oct 11', status: 'Pending', color: 'text-yellow-400' },
                    { vendor: 'Adobe Systems', amount: '$54.99', date: 'Oct 10', status: 'Duplicate', color: 'text-rose-400' },
                  ].map((row, i) => (
                    <div key={i} className="grid grid-cols-4 gap-4 p-4 border-b border-white/5 text-sm hover:bg-white/[0.02] transition-colors items-center">
                      <div className="col-span-1 text-white font-medium flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center text-[10px]">{row.vendor.charAt(0)}</div>
                        {row.vendor}
                      </div>
                      <div className="col-span-1 text-slate-300 font-mono">{row.amount}</div>
                      <div className="col-span-1 text-slate-400">{row.date}</div>
                      <div className="col-span-1"><span className={`inline-flex px-2 py-1 rounded bg-white/5 text-xs font-medium ${row.color}`}>{row.status}</span></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating Element Mock */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute -right-8 top-12 bg-background border border-border p-4 rounded-xl shadow-xl flex items-center gap-3 w-64"
            >
              <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-500 flex items-center justify-center"><AlertCircle size={20} /></div>
              <div>
                <p className="text-sm font-semibold text-slate-900">Duplicate Detected</p>
                <p className="text-xs text-slate-400">Match found: INV-9932</p>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* 2. PROBLEM SECTION */}
        <section className="max-w-4xl mx-auto text-center">
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            variants={container}
            className="p-10 rounded-3xl border border-red-100 bg-red-50 relative overflow-hidden"
          >
            <h2 className="text-3xl font-heading font-bold text-slate-900 mb-4">
              Manual invoice processing is slow, repetitive, and error-prone.
            </h2>
            <div className="grid md:grid-cols-3 gap-6 mt-10 relative z-10 text-left">
              <div className="space-y-3">
                <div className="text-red-500 mb-2"><FileText size={24} /></div>
                <h4 className="font-semibold text-slate-900">Copying Data</h4>
                <p className="text-sm text-slate-500">Endless copy-pasting into spreadsheets leads to typos and burnout.</p>
              </div>
              <div className="space-y-3">
                <div className="text-red-500 mb-2"><AlertCircle size={24} /></div>
                <h4 className="font-semibold text-slate-900">Missing Duplicates</h4>
                <p className="text-sm text-slate-500">Paying the same invoice twice costs your company thousands of dollars.</p>
              </div>
              <div className="space-y-3">
                <div className="text-red-500 mb-2"><Clock size={24} /></div>
                <h4 className="font-semibold text-slate-900">Wasting Hours</h4>
                <p className="text-sm text-slate-500">Finance teams spend 60% of their time on admin work instead of strategy.</p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* 3. HOW IT WORKS */}
        <section className="text-center relative z-10">
          <div className="mb-16">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-slate-900 mb-4">How It Works</h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-lg">Three simple steps to put your accounts payable on autopilot.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto relative">
            <div className="hidden md:block absolute top-[28%] left-[20%] right-[20%] h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>

            {[
              { step: "01", title: "Upload or Import from Gmail", desc: "Upload PDFs directly or connect Gmail to import invoice attachments in a few clicks.", icon: UploadCloud },
              { step: "02", title: "AI Extracts & Validates", desc: "Instantly extracts vendors, amounts, line items, and flags duplicate invoices automatically.", icon: Zap },
              { step: "03", title: "Review, Approve & Export", desc: "Approve or reject invoices as a team, then export to CSV, Excel, QuickBooks, or Xero.", icon: CheckCircle2 }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2, duration: 0.5 }}
                className="relative h-full bg-white border border-slate-200 p-6 md:p-8 rounded-2xl flex flex-col items-center shadow-sm"
              >
                <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center mb-6 font-mono font-bold text-xl text-slate-400 z-10 shadow-sm shrink-0">
                  {item.step}
                </div>
                <item.icon size={32} className="mb-5 shrink-0 text-primary-600" />
                <div className="flex-1 flex flex-col w-full">
                  <div className="h-20 lg:h-24 flex items-center justify-center mb-3">
                    <h3 className="text-lg lg:text-xl font-bold text-slate-900 text-balance leading-tight">{item.title}</h3>
                  </div>
                  <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* 4. FEATURES */}
        <section className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-slate-900 mb-4">Key Features</h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-lg">Everything you need, nothing you don&apos;t. Keep it clean and moving fast.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 p-6 rounded-2xl hover:border-slate-300 hover:shadow-sm transition-all">
              <div className="w-10 h-10 rounded-lg bg-primary-50 text-primary-600 flex items-center justify-center mb-4"><Zap size={20} /></div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">AI Data Extraction</h3>
              <p className="text-sm text-slate-500">Extracts vendors, dates, amounts, and line items from any PDF or image invoice.</p>
            </div>
            <div className="bg-white border border-slate-200 p-6 rounded-2xl hover:border-slate-300 hover:shadow-sm transition-all">
              <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center mb-4"><ShieldCheck size={20} /></div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Duplicate Detection</h3>
              <p className="text-sm text-slate-500">Multi-signal matching catches identical and fuzzy duplicates before they get approved.</p>
            </div>
            <div className="bg-white border border-slate-200 p-6 rounded-2xl hover:border-slate-300 hover:shadow-sm transition-all">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-4"><Mail size={20} /></div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Gmail Import</h3>
              <p className="text-sm text-slate-500">Connect Gmail via OAuth and import invoice attachments directly — no forwarding needed.</p>
            </div>
            <div className="bg-white border border-slate-200 p-6 rounded-2xl hover:border-slate-300 hover:shadow-sm transition-all">
              <div className="w-10 h-10 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center mb-4"><Users size={20} /></div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Team & Approval Queue</h3>
              <p className="text-sm text-slate-500">Invite teammates, assign roles, and manage invoice approvals through a shared queue.</p>
            </div>
            <div className="bg-white border border-slate-200 p-6 rounded-2xl hover:border-slate-300 hover:shadow-sm transition-all">
              <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center mb-4"><Download size={20} /></div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Export Anywhere</h3>
              <p className="text-sm text-slate-500">Download as CSV, Excel, PDF, or import-ready files for QuickBooks and Xero.</p>
            </div>
            <div className="bg-white border border-slate-200 p-6 rounded-2xl hover:border-slate-300 hover:shadow-sm transition-all">
              <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center mb-4"><FileText size={20} /></div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Line Item Extraction</h3>
              <p className="text-sm text-slate-500">Captures full table data with quantities and unit prices — not just the invoice total.</p>
            </div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto">
          <div className="rounded-[2rem] border border-slate-200 bg-slate-50 p-6 md:p-8 lg:p-10">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8 mb-8">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary-600 mb-3">Feature Map</p>
                <h2 className="text-3xl md:text-4xl font-heading font-bold text-slate-900 mb-4">See the whole product, not just isolated tools</h2>
                <p className="text-slate-500 text-base md:text-lg leading-relaxed">
                  Strong home pages explain how a product works across the full workflow. Ledgix brings invoice capture, AI extraction, review controls, and accounting export into one system.
                </p>
              </div>
              <Link
                href="/features"
                className="inline-flex items-center gap-2 self-start px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                View all features <ArrowRight size={14} />
              </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 mb-8">
              {featureCategories.map((category) => (
                <div key={category.title} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">{category.title}</h3>
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

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {marketingFeatures.slice(6, 11).map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.title} className="rounded-2xl border border-slate-200 bg-white p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${feature.accent}`}>
                        <Icon size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{feature.badge}</p>
                        <h4 className="text-sm font-semibold text-slate-900 capitalize">{feature.title}</h4>
                      </div>
                    </div>
                    <p className="text-sm text-slate-500 leading-relaxed">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 5. WHY THIS IS DIFFERENT */}
        <section className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-slate-900 mb-4">
              Not just OCR. A <span className="text-primary-600">complete system.</span>
            </h2>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="grid grid-cols-3 bg-slate-50 p-6 border-b border-slate-200">
              <div className="col-span-1"></div>
              <div className="col-span-1 text-center font-semibold text-slate-400 text-lg">Traditional Tools</div>
              <div className="col-span-1 text-center font-bold text-slate-900 text-xl">Ledgix</div>
            </div>

            {[
              { feature: "Data Entry", old: "Manual typing", new: "Automated AI extraction", highlight: true },
              { feature: "Duplicate Check", old: "No duplicate check", new: "Multi-signal duplicate detection", highlight: false },
              { feature: "Line Items", old: "Basic OCR text", new: "Structured table data", highlight: true },
              { feature: "Team & Approvals", old: "Email threads", new: "Shared queue with role-based access", highlight: false },
              { feature: "Accounting Export", old: "Manual reformatting", new: "CSV, Excel, QuickBooks, Xero", highlight: true },
            ].map((row, i) => (
              <div key={i} className={`grid grid-cols-3 p-6 border-b border-slate-100 ${row.highlight ? 'bg-slate-50/50' : ''}`}>
                <div className="col-span-1 font-medium text-slate-900 flex items-center">{row.feature}</div>
                <div className="col-span-1 text-center flex items-center justify-center text-slate-400">{row.old}</div>
                <div className="col-span-1 text-center flex items-center justify-center text-slate-900 font-medium gap-2">
                  <CheckCircle2 size={16} className="text-primary-600" />
                  {row.new}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 6. PRODUCT PREVIEW (WOW SECTION WOW) */}
        <section className="relative -mx-4 px-4 sm:mx-0 py-20">
          <div className="max-w-6xl mx-auto text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-slate-900 mb-4">From Invoice to Structured Data</h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-lg">Automate Invoice Processing in Seconds.</p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="max-w-5xl mx-auto relative group"
          >
            {/* Interactive Steps Header */}
            <div className="flex flex-wrap justify-center mb-8 gap-2 md:gap-4 relative z-10">
              {['1. Upload / Forward', '2. AI Processing', '3. Extracted Data'].map((text, idx) => (
                <button 
                  key={idx}
                  onClick={() => setDemoStep(idx)}
                  className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                    demoStep === idx 
                      ? 'bg-slate-900 text-white'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {text}
                </button>
              ))}
            </div>

            <div className="absolute -inset-1 rounded-2xl bg-slate-200/50 opacity-60 blur top-16"></div>
            
            <div 
              className="relative rounded-xl border border-slate-700 bg-background overflow-hidden md:h-[550px] flex flex-col shadow-2xl transition-all duration-500"
            >
              {/* Pseudo UI Header */}
              <div className="h-14 border-b border-slate-800 bg-slate-900/50 flex flex-col justify-center px-6 shrink-0">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-700"></div>
                  <div className="w-3 h-3 rounded-full bg-slate-700"></div>
                  <div className="w-3 h-3 rounded-full bg-slate-700"></div>
                </div>
              </div>

              {/* Pseudo App Body */}
              <div className="flex-1 flex flex-col md:flex-row p-4 lg:p-6 gap-6 bg-[#0a0a0c] overflow-hidden">
                
                {/* Left Side: Invoice Image */}
                <div className="w-full md:w-1/2 bg-white/5 rounded-lg border border-white/10 p-4 md:p-8 relative overflow-hidden flex items-center justify-center">
                  
                  {/* The Realistic Invoice Document */}
                  <div className={`w-full max-w-sm bg-white text-slate-900 p-6 shadow-xl rounded transition-all duration-700 origin-top transform-gpu ${demoStep === 0 ? 'opacity-50 scale-95 blur-sm' : 'opacity-100 scale-100'}`}>
                     {/* Invoice Header */}
                     <div className="flex justify-between items-start mb-6">
                       <div>
                         <div className="flex items-center gap-2 mb-1">
                           <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-xs">A</div>
                           <span className="font-bold text-sm sm:text-base">Acme Corp Software</span>
                         </div>
                         <div className="text-[10px] text-slate-500">123 Tech Blvd, Suite 400<br/>San Francisco, CA 94105</div>
                       </div>
                       <div className="text-right">
                         <h2 className="text-lg font-bold text-slate-800 tracking-wider">INVOICE</h2>
                         <div className="text-[10px] font-mono mt-1 text-slate-500">INV-2023-089</div>
                       </div>
                     </div>
                     {/* Details */}
                     <div className="flex justify-between text-[10px] sm:text-xs mb-6 border-t border-slate-200 border-b py-3">
                       <div><span className="text-slate-400 block mb-1">Billed To</span><strong>Ledgix Ops</strong></div>
                       <div><span className="text-slate-400 block mb-1">Date</span><strong>Nov 01, 2023</strong></div>
                       <div><span className="text-slate-400 block mb-1">Due Date</span><strong>Nov 15, 2023</strong></div>
                     </div>
                     {/* Lines */}
                     <div className="w-full text-[10px] sm:text-xs mb-6">
                       <div className="flex justify-between text-slate-500 border-b border-slate-200 pb-2 mb-2">
                         <span>Description</span><span>Amount</span>
                       </div>
                       <div className="flex justify-between py-1.5"><span className="font-medium text-slate-700">Software License x10</span><span className="text-slate-600">$2,500.00</span></div>
                       <div className="flex justify-between py-1.5 border-b border-slate-100 mb-2"><span className="font-medium text-slate-700">Support Retainer</span><span className="text-slate-600">$500.00</span></div>
                       {/* Total */}
                       <div className="flex justify-between font-bold text-sm pt-2 text-slate-800">
                         <span>Total Due</span><span>$3,000.00</span>
                       </div>
                     </div>
                  </div>

                  {/* Processing Overlays */}
                  {demoStep === 0 && (
                    <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-[2px] flex items-center justify-center z-20">
                       <div className="text-center p-6 border-2 border-dashed border-slate-600 rounded-xl bg-slate-800/50 w-3/4">
                         <UploadCloud size={40} className="mx-auto text-primary-400 mb-3" />
                         <p className="text-white font-medium text-sm">Forward or Drop PDF here</p>
                       </div>
                    </div>
                  )}

                  {demoStep === 1 && (
                    <>
                      <div className="absolute inset-0 bg-primary-900/20 mix-blend-overlay z-10 transition-opacity duration-500"></div>
                      <motion.div 
                        initial={{ top: '0%' }}
                        animate={{ top: ['0%', '100%', '0%'] }} 
                        transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
                        className="absolute left-0 w-full h-[2px] bg-primary-400 shadow-[0_0_20px_4px_rgba(63,191,155,0.8)] z-20" 
                      />
                      <div className="absolute inset-0 z-30 pointer-events-none flex flex-col items-center justify-center opacity-80 mix-blend-plus-lighter">
                         <div className="w-32 h-10 border border-primary-500 rounded flex items-center justify-center translate-x-12 -translate-y-24 bg-primary-500/10"><span className="text-green-400 font-mono text-[10px]">VENDOR MATCH</span></div>
                         <div className="w-24 h-6 border border-primary-500 rounded flex items-center justify-center -translate-x-16 translate-y-4 bg-primary-500/10"><span className="text-green-400 font-mono text-[10px]">TOTAL $3k</span></div>
                      </div>
                    </>
                  )}
                  
                  {demoStep === 2 && (
                    <div className="absolute top-[34%] left-10 right-10 h-8 border-2 border-primary-500 bg-primary-500/10 rounded flex items-center justify-center z-20 animate-pulse"></div>
                  )}
                </div>

                {/* Right Side: Extraction Panel */}
                <div className="w-full md:w-1/2 flex flex-col gap-4 relative">
                  
                  {/* Step 0 Empty State */}
                  <div className={`absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-500 z-10 bg-[#0a0a0c] ${demoStep === 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4 text-slate-500">
                      <FileText size={24} />
                    </div>
                    <p className="text-slate-400 text-sm">Waiting for invoice upload...</p>
                  </div>

                  {/* Base Content (Steps 1 & 2) */}
                  <div className={`flex flex-col h-full transition-opacity duration-500 ${demoStep > 0 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-white flex items-center gap-2">
                        {demoStep === 1 ? (
                          <><Zap size={18} className="text-primary-400 animate-pulse" /> Processing Invoice...</>
                        ) : (
                          <>Extracted Data</>
                        )}
                      </h3>
                      {demoStep === 2 && (
                        <div className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded font-medium flex items-center gap-1">
                          <CheckCircle2 size={12} /> AI Confidence: 99%
                        </div>
                      )}
                    </div>
                    
                    {demoStep === 2 && (
                      <p className="text-xs text-primary-400 font-medium mb-3">Ledgix automatically extracts key fields with high accuracy.</p>
                    )}

                    <div className="space-y-4 flex-1 mt-2">
                      {/* Vendor Name */}
                      <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3 overflow-hidden relative">
                        {demoStep === 1 && <div className="absolute inset-0 bg-primary-500/5 animate-pulse"></div>}
                        <label className="text-xs text-slate-500 mb-1 block">Vendor Name</label>
                        {demoStep === 1 ? <div className="h-5 w-3/4 bg-slate-700/50 rounded animate-pulse"></div> : <div className="text-slate-200 font-medium text-sm">Acme Corp Software</div>}
                      </div>
                      
                      {/* Grid IDs */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3 relative overflow-hidden">
                          {demoStep === 1 && <div className="absolute inset-0 bg-primary-500/5 animate-pulse" style={{ animationDelay: '200ms' }}></div>}
                          <label className="text-xs text-slate-500 mb-1 block">Invoice Number</label>
                          {demoStep === 1 ? <div className="h-5 w-1/2 bg-slate-700/50 rounded animate-pulse" style={{ animationDelay: '200ms' }}></div> : <div className="text-slate-200 font-medium font-mono text-sm">INV-2023-089</div>}
                        </div>
                        <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3 relative overflow-hidden">
                          {demoStep === 1 && <div className="absolute inset-0 bg-primary-500/5 animate-pulse" style={{ animationDelay: '400ms' }}></div>}
                          <label className="text-xs text-slate-500 mb-1 block">Due Date</label>
                          {demoStep === 1 ? <div className="h-5 w-2/3 bg-slate-700/50 rounded animate-pulse" style={{ animationDelay: '400ms' }}></div> : <div className="text-slate-200 font-medium text-sm">Nov 15, 2023</div>}
                        </div>
                      </div>

                      {/* Line Items */}
                      <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3 relative overflow-hidden">
                        {demoStep === 1 && <div className="absolute inset-0 bg-primary-500/5 animate-pulse" style={{ animationDelay: '600ms' }}></div>}
                        <label className="text-xs text-slate-500 mb-2 block">Line Items (3)</label>
                        <div className="space-y-2 text-sm text-slate-300">
                          {demoStep === 1 ? (
                            <>
                              <div className="flex justify-between py-1"><div className="h-4 w-1/2 bg-slate-700/50 rounded animate-pulse delay-700"></div> <div className="h-4 w-16 bg-slate-700/50 rounded animate-pulse delay-700"></div></div>
                              <div className="flex justify-between py-1"><div className="h-4 w-1/3 bg-slate-700/50 rounded animate-pulse delay-1000"></div> <div className="h-4 w-16 bg-slate-700/50 rounded animate-pulse delay-1000"></div></div>
                              <div className="flex justify-between py-1 pt-2 border-t border-white/5 mt-2"><div className="h-4 w-20 bg-slate-700/50 rounded animate-pulse delay-1000"></div> <div className="h-4 w-24 bg-slate-700/50 rounded animate-pulse delay-1000"></div></div>
                            </>
                          ) : (
                            <>
                              <div className="flex justify-between py-1 border-b border-white/5"><span className="text-xs">Software License x10</span> <span className="text-xs">$2,500.00</span></div>
                              <div className="flex justify-between py-1 border-b border-white/5"><span className="text-xs">Support Retainer</span> <span className="text-xs">$500.00</span></div>
                              <div className="flex justify-between py-1 pt-2 font-semibold text-white"><span className="text-xs">Total Amount</span> <span className="text-primary-400 text-xs">$3,000.00</span></div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 mt-4">
                      <button className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all ${demoStep === 2 ? 'bg-white/5 hover:bg-white/10 text-white border border-white/10' : 'bg-slate-800 text-slate-500 border border-transparent'}`}>Reject</button>
                      <button className={`flex-1 py-3 rounded-lg text-sm font-medium transition-all ${demoStep === 2 ? 'bg-primary-600 hover:bg-primary-500 text-white shadow-lg' : 'bg-slate-800 text-slate-500'}`}>Approve & Save</button>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* 7. USE CASES */}
        <section className="py-16 md:py-24 border-t border-b border-slate-100 my-20 relative">
          <div className="max-w-4xl mx-auto text-center mb-16 px-4">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-slate-900">Built for Teams That Handle Invoices Daily</h2>
          </div>
          <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-slate-200">
            <div className="p-6 md:px-10">
              <Building2 className="w-12 h-12 mx-auto text-primary-600 mb-6" />
              <h3 className="text-slate-900 font-bold text-xl mb-3">Accounting Firms</h3>
              <p className="text-primary-600 font-semibold mb-3">Scale without hiring</p>
              <p className="text-slate-500 text-sm leading-relaxed">Process client invoices faster — without increasing headcount.</p>
            </div>
            <div className="p-6 md:px-10">
              <UserCircle className="w-12 h-12 mx-auto text-primary-600 mb-6" />
              <h3 className="text-slate-900 font-bold text-xl mb-3">Freelancers</h3>
              <p className="text-primary-600 font-semibold mb-3">Stay organized effortlessly</p>
              <p className="text-slate-500 text-sm leading-relaxed">Track and organize expenses automatically, no spreadsheets required.</p>
            </div>
            <div className="p-6 md:px-10">
              <BarChart3 className="w-12 h-12 mx-auto text-primary-600 mb-6" />
              <h3 className="text-slate-900 font-bold text-xl mb-3">Finance Teams</h3>
              <p className="text-primary-600 font-semibold mb-3">Reduce costly errors</p>
              <p className="text-slate-500 text-sm leading-relaxed">Automate approvals and catch duplicate invoices before they slip through.</p>
            </div>
          </div>
        </section>

        {/* 8. DEMO & FINAL CTA */}
        <section className="max-w-5xl mx-auto px-4 pb-32">
          <div className="bg-slate-900 rounded-[2.5rem] p-12 md:p-20 text-center relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-6 tracking-tight">
                Ready to automate your workflow?
              </h2>
              <p className="text-lg text-slate-400 mb-10 max-w-xl mx-auto leading-relaxed">
                Join forward-thinking teams processing invoices securely and automatically. Start building your automated accounts payable pipeline today.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/register"
                  className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-100 text-slate-900 rounded-full font-semibold transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                  Get Started for Free <ArrowRight size={18} />
                </Link>
                <Link
                  href="/demo"
                  className="w-full sm:w-auto px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-full font-medium transition-all border border-slate-700 flex items-center justify-center gap-2 hover:-translate-y-0.5"
                >
                  <Zap size={18} className="text-slate-400" /> Interactive Demo
                </Link>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
