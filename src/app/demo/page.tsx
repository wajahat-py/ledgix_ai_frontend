"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2, AlertTriangle, Zap, ArrowRight, ChevronRight, ChevronLeft,
  X, Flag, Shield, Loader2, RotateCcw, Info,
  Download, Clock, TrendingUp,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BBox    { top: string; left: string; width: string; height: string }
interface LineItem { desc: string; amount: string }
interface DupMatch { invoiceNum: string; score: number; date: string; amount: string }
interface Field   {
  label: string; value: string; confidence: number;
  reason: string; bbox: BBox;
}
interface InvoiceData {
  id: string; company: string; shortName: string;
  initials: string; colorClass: string;
  invoiceNum: string; issueDate: string; dueDate: string;
  billTo: string; address: string;
  lineItems: LineItem[]; total: string;
  fields: Field[]; duplicate: DupMatch | null;
}

type Phase    = "idle" | "scanning" | "review" | "decided";
type Decision = "approved" | "rejected" | "flagged";

// ─── Timeline events ──────────────────────────────────────────────────────────

const TIMELINE: { delayMs: number; label: string }[] = [
  { delayMs: 0,    label: "PDF uploaded and parsed"        },
  { delayMs: 480,  label: "OCR pipeline complete"           },
  { delayMs: 1050, label: "Document structure analyzed"     },
  { delayMs: 1850, label: "LLM field extraction started"    },
  { delayMs: 2850, label: "Fields validated against schema" },
  { delayMs: 3350, label: "Duplicate scan initiated"        },
  { delayMs: 4350, label: "Processing complete"             },
];

// ─── Sample invoices ──────────────────────────────────────────────────────────

const INVOICES: InvoiceData[] = [
  {
    id: "acme", company: "Acme Corp Software", shortName: "Acme Corp",
    initials: "AC", colorClass: "bg-blue-600",
    invoiceNum: "INV-2023-089", issueDate: "Nov 01, 2023", dueDate: "Nov 15, 2023",
    billTo: "Ledgix Ops", address: "123 Tech Blvd, Suite 400\nSan Francisco, CA 94105",
    lineItems: [
      { desc: "Software License × 10", amount: "$2,500.00" },
      { desc: "Support Retainer",       amount: "$500.00"   },
    ],
    total: "$3,000.00",
    duplicate: null,
    fields: [
      { label: "Vendor Name",    value: "Acme Corp Software", confidence: 99,
        reason: "Exact match with known vendor registry",
        bbox: { top: "2%",  left: "0%",  width: "56%", height: "22%" } },
      { label: "Invoice Number", value: "INV-2023-089",       confidence: 97,
        reason: "Standard alphanumeric format, clearly labeled",
        bbox: { top: "2%",  left: "63%", width: "37%", height: "11%" } },
      { label: "Issue Date",     value: "Nov 01, 2023",       confidence: 95,
        reason: "Date header clearly formatted in document",
        bbox: { top: "30%", left: "25%", width: "26%", height: "14%" } },
      { label: "Due Date",       value: "Nov 15, 2023",       confidence: 98,
        reason: "Due date field explicitly labeled in header",
        bbox: { top: "30%", left: "56%", width: "26%", height: "14%" } },
      { label: "Line Items",     value: "2 items extracted",  confidence: 94,
        reason: "Table structure parsed with clear column boundaries",
        bbox: { top: "48%", left: "0%",  width: "100%", height: "34%" } },
      { label: "Total Amount",   value: "$3,000.00",          confidence: 99,
        reason: "Total matched arithmetic sum of all line items",
        bbox: { top: "84%", left: "32%", width: "68%", height: "10%" } },
    ],
  },
  {
    id: "aws", company: "Amazon Web Services", shortName: "AWS",
    initials: "AW", colorClass: "bg-orange-500",
    invoiceNum: "AWS-2023-1047", issueDate: "Oct 11, 2023", dueDate: "Nov 10, 2023",
    billTo: "Ledgix Ops", address: "410 Terry Ave N\nSeattle, WA 98109",
    lineItems: [
      { desc: "EC2 Compute (us-east-1)", amount: "$3,750.00" },
      { desc: "S3 Storage (2.1 TB)",     amount: "$432.12"   },
      { desc: "Technical Support",        amount: "$350.00"   },
    ],
    total: "$4,532.12",
    duplicate: { invoiceNum: "AWS-2023-0998", score: 87, date: "Sep 11, 2023", amount: "$4,532.12" },
    fields: [
      { label: "Vendor Name",    value: "Amazon Web Services", confidence: 96,
        reason: "High-confidence match — vendor name registered in system",
        bbox: { top: "2%",  left: "0%",  width: "56%", height: "22%" } },
      { label: "Invoice Number", value: "AWS-2023-1047",       confidence: 91,
        reason: "Numeric sequence detected with expected prefix",
        bbox: { top: "2%",  left: "63%", width: "37%", height: "11%" } },
      { label: "Issue Date",     value: "Oct 11, 2023",        confidence: 88,
        reason: "Date format ambiguous — MM/DD vs DD/MM could not be fully resolved",
        bbox: { top: "30%", left: "25%", width: "26%", height: "14%" } },
      { label: "Due Date",       value: "Nov 10, 2023",        confidence: 85,
        reason: "Multiple date fields found — selected by proximity to 'Due' label",
        bbox: { top: "30%", left: "56%", width: "26%", height: "14%" } },
      { label: "Line Items",     value: "3 items extracted",   confidence: 92,
        reason: "Table rows parsed — one row had truncated description text",
        bbox: { top: "48%", left: "0%",  width: "100%", height: "38%" } },
      { label: "Total Amount",   value: "$4,532.12",           confidence: 99,
        reason: "Total matched arithmetic sum of all line items exactly",
        bbox: { top: "88%", left: "32%", width: "68%", height: "10%" } },
    ],
  },
  {
    id: "stripe", company: "Stripe Inc.", shortName: "Stripe",
    initials: "ST", colorClass: "bg-indigo-600",
    invoiceNum: "STRP-NOV-2023", issueDate: "Nov 05, 2023", dueDate: "Nov 20, 2023",
    billTo: "Ledgix Ops", address: "354 Oyster Point Blvd\nSouth San Francisco, CA 94080",
    lineItems: [
      { desc: "Payment Processing Fee", amount: "$325.00" },
      { desc: "Monthly Platform Fee",   amount: "$125.00" },
    ],
    total: "$450.00",
    duplicate: null,
    fields: [
      { label: "Vendor Name",    value: "Stripe Inc.",        confidence: 99,
        reason: "Exact match — vendor verified in known merchant database",
        bbox: { top: "2%",  left: "0%",  width: "56%", height: "22%" } },
      { label: "Invoice Number", value: "STRP-NOV-2023",      confidence: 94,
        reason: "Alphanumeric format matches Stripe's standard invoice schema",
        bbox: { top: "2%",  left: "63%", width: "37%", height: "11%" } },
      { label: "Issue Date",     value: "Nov 05, 2023",       confidence: 92,
        reason: "Date clearly present in document header section",
        bbox: { top: "30%", left: "25%", width: "26%", height: "14%" } },
      { label: "Due Date",       value: "Nov 20, 2023",       confidence: 97,
        reason: "Due date label and value uniquely identified",
        bbox: { top: "30%", left: "56%", width: "26%", height: "14%" } },
      { label: "Line Items",     value: "2 items extracted",  confidence: 96,
        reason: "Clean two-row table structure detected with no ambiguity",
        bbox: { top: "48%", left: "0%",  width: "100%", height: "34%" } },
      { label: "Total Amount",   value: "$450.00",            confidence: 99,
        reason: "Total exactly matches line-item sum — no rounding discrepancy",
        bbox: { top: "84%", left: "32%", width: "68%", height: "10%" } },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function confInfo(score: number) {
  if (score >= 95) return { label: "High",   cls: "bg-green-50 text-green-700 border border-green-200"  };
  if (score >= 80) return { label: "Medium", cls: "bg-amber-50 text-amber-700 border border-amber-200"  };
  return               { label: "Low",    cls: "bg-red-50   text-red-700   border border-red-200"    };
}

function personalizedCTA(decision: Decision | null, hasDuplicate: boolean) {
  if (hasDuplicate) return {
    title: "Ledgix caught that duplicate.",
    desc:  "How many duplicates are slipping through your current process?",
  };
  if (decision === "approved") return {
    title: "Ready to automate approvals for your team?",
    desc:  "Set up workflows and let Ledgix route invoices to the right approver automatically.",
  };
  if (decision === "rejected") return {
    title: "Protect your business from bad invoices.",
    desc:  "Ledgix flags suspicious invoices before they reach your payment queue.",
  };
  if (decision === "flagged") return {
    title: "Your team can review flagged invoices in a shared queue.",
    desc:  "Invite teammates, assign reviewers, and close the loop on every flagged invoice.",
  };
  return {
    title: "Ready to process your real invoices?",
    desc:  "Sign up free — first 50 invoices included, no credit card required.",
  };
}

// ─── TypewriterText ───────────────────────────────────────────────────────────

function TypewriterText({ text, speed = 32 }: { text: string; speed?: number }) {
  const [shown, setShown] = useState("");
  useEffect(() => {
    setShown("");
    if (!text) return;
    let i = 0;
    const id = setInterval(() => {
      i++;
      setShown(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);
  return (
    <>
      {shown}
      {shown.length < text.length && (
        <span className="inline-block w-0.5 h-3 bg-primary-500 ml-px align-middle animate-pulse" />
      )}
    </>
  );
}

// ─── Confidence badge with tooltip ───────────────────────────────────────────

function ConfidenceBadge({ score, reason }: { score: number; reason: string }) {
  const [open, setOpen] = useState(false);
  const info = confInfo(score);
  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <span className={`cursor-help shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold select-none ${info.cls}`}>
        {info.label} · {score}%
      </span>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full right-0 mb-2 w-56 bg-slate-900 text-white text-[11px] rounded-xl p-3 z-50 shadow-xl pointer-events-none"
          >
            <p className="font-semibold text-[12px] mb-1">{info.label} confidence · {score}%</p>
            <p className="text-slate-300 leading-relaxed">{reason}</p>
            <div className="absolute -bottom-1.5 right-4 w-3 h-3 bg-slate-900 rotate-45 rounded-sm" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Invoice document ─────────────────────────────────────────────────────────

function PDFViewer({
  invoice, scanning, revealedFields, isDupRisk,
}: {
  invoice: InvoiceData; scanning: boolean; revealedFields: number; isDupRisk: boolean;
}) {
  return (
    <div className="rounded-xl overflow-hidden shadow-md" style={{ border: "1px solid #2a2a2a" }}>

      {/* ── PDF toolbar ── */}
      <div className="bg-[#3c3c3c] px-3 py-2 flex items-center gap-2 select-none">
        {/* Page nav */}
        <div className="flex items-center gap-0.5 text-slate-400">
          <button className="w-6 h-6 flex items-center justify-center rounded opacity-40 cursor-default hover:bg-white/10 transition-colors">
            <ChevronLeft size={13} />
          </button>
          <span className="text-[11px] text-slate-300 px-1">1 / 1</span>
          <button className="w-6 h-6 flex items-center justify-center rounded opacity-40 cursor-default hover:bg-white/10 transition-colors">
            <ChevronRight size={13} />
          </button>
        </div>

        <div className="flex-1" />

        {/* Filename */}
        <span className="text-[11px] font-mono text-slate-300 truncate max-w-[140px]">{invoice.invoiceNum}.pdf</span>

        <div className="flex-1" />

        {/* Right controls */}
        <div className="flex items-center gap-2">
          {isDupRisk && revealedFields === 0 && !scanning && (
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1 text-[10px] font-semibold text-amber-300 bg-amber-900/50 border border-amber-600/40 px-2 py-0.5 rounded-full"
            >
              <AlertTriangle size={9} /> Risk flagged
            </motion.span>
          )}
          <span className="text-[11px] text-slate-400">100%</span>
          <div className="w-px h-3.5 bg-slate-600" />
          <button className="w-6 h-6 flex items-center justify-center rounded text-slate-400 opacity-50 cursor-default hover:bg-white/10 hover:opacity-70 transition-all">
            <Download size={13} />
          </button>
        </div>
      </div>

      {/* ── PDF viewer body ── */}
      <div className="bg-[#525659] px-6 py-5 relative overflow-hidden">

        {/* Scanning glow overlay */}
        {scanning && (
          <div className="absolute inset-0 bg-indigo-500/5 z-[5] pointer-events-none" />
        )}
        {/* Scanning line — over the whole viewer body */}
        {scanning && (
          <motion.div
            initial={{ top: "0%" }}
            animate={{ top: ["0%", "100%", "0%"] }}
            transition={{ repeat: Infinity, duration: 2.1, ease: "linear" }}
            className="absolute left-0 w-full h-px z-[20] pointer-events-none"
            style={{ background: "rgba(99,102,241,0.9)", boxShadow: "0 0 18px 6px rgba(99,102,241,0.5)" }}
          />
        )}

        {/* Paper document */}
        <div
          className="bg-white mx-auto relative"
          style={{
            boxShadow: "0 4px 32px rgba(0,0,0,0.55), 0 1px 6px rgba(0,0,0,0.4)",
            backgroundImage: "radial-gradient(circle, #dde3ea 0.4px, transparent 0.4px)",
            backgroundSize: "18px 18px",
          }}
        >
          {/* Paper tint overlay */}
          <div className="absolute inset-0 bg-white/93 pointer-events-none" />

          {/* Bounding box overlays */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-[12]">
            {invoice.fields.map((field, i) =>
              revealedFields > i ? (
                <motion.div
                  key={field.label}
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: [0, 1, 0.32], scale: [0.94, 1.01, 1] }}
                  transition={{ duration: 0.65, times: [0, 0.18, 1] }}
                  className="absolute rounded-sm"
                  style={{
                    ...field.bbox,
                    border: "1.5px solid rgba(99,102,241,0.65)",
                    background: "rgba(99,102,241,0.07)",
                  }}
                />
              ) : null
            )}
          </div>

          {/* Invoice content */}
          <div className="relative z-[14] px-8 py-8">

            {/* Header */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className={`w-8 h-8 rounded-md ${invoice.colorClass} flex items-center justify-center text-white text-[11px] font-bold shrink-0`}>
                    {invoice.initials}
                  </div>
                  <span className="font-bold text-[15px] text-slate-800">{invoice.company}</span>
                </div>
                <div className="text-[10px] text-slate-400 leading-relaxed whitespace-pre-line ml-10">{invoice.address}</div>
              </div>
              <div className="text-right">
                <p className="text-[22px] font-black text-slate-800 tracking-[0.3em]">INVOICE</p>
                <p className="text-[10px] font-mono text-slate-400 mt-1">{invoice.invoiceNum}</p>
              </div>
            </div>

            {/* Meta row */}
            <div className="grid grid-cols-3 text-[10px] border-t border-b border-slate-150 py-3 mb-5 gap-4"
              style={{ borderColor: "#e8ecf0" }}>
              <div>
                <span className="text-[9px] uppercase tracking-widest text-slate-400 block mb-1">Billed To</span>
                <strong className="text-slate-700 text-[11px]">{invoice.billTo}</strong>
              </div>
              <div>
                <span className="text-[9px] uppercase tracking-widest text-slate-400 block mb-1">Issue Date</span>
                <strong className="text-slate-700 text-[11px]">{invoice.issueDate}</strong>
              </div>
              <div>
                <span className="text-[9px] uppercase tracking-widest text-slate-400 block mb-1">Due Date</span>
                <strong className="text-slate-700 text-[11px]">{invoice.dueDate}</strong>
              </div>
            </div>

            {/* Line items table */}
            <table className="w-full text-[10px] mb-1">
              <thead>
                <tr style={{ borderBottom: "1px solid #e8ecf0" }}>
                  <th className="text-left text-[9px] uppercase tracking-widest text-slate-400 font-medium pb-2">Description</th>
                  <th className="text-right text-[9px] uppercase tracking-widest text-slate-400 font-medium pb-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lineItems.map((item, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f5f7f9" }}>
                    <td className="py-1.5 text-slate-600">{item.desc}</td>
                    <td className="py-1.5 text-right font-mono text-slate-600">{item.amount}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: "2px solid #e2e6ea" }}>
                  <td className="pt-3 font-black text-[13px] text-slate-800">Total Due</td>
                  <td className="pt-3 text-right font-black text-[14px] text-slate-800 font-mono">{invoice.total}</td>
                </tr>
              </tfoot>
            </table>

            {/* Footer */}
            <div className="mt-6 pt-4" style={{ borderTop: "1px solid #eef0f3" }}>
              <p className="text-[9px] text-slate-300 leading-relaxed">
                Payment is due within 15 days of the invoice date. Please reference the invoice number in your remittance.
                Thank you for your business.
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Processing timeline ──────────────────────────────────────────────────────

function ProcessingTimeline({
  events, visibleCount,
}: { events: { time: string; label: string }[]; visibleCount: number }) {
  return (
    <div className="bg-slate-900 rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 border-b border-slate-800 flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
          <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
          <div className="w-2.5 h-2.5 rounded-full bg-slate-700" />
        </div>
        <span className="text-[11px] font-mono text-slate-500 ml-1">ledgix — audit log</span>
      </div>
      <div className="p-4 font-mono text-[11px] space-y-1.5 min-h-[120px]">
        {events.slice(0, visibleCount).map((e, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2.5"
          >
            <span className="text-slate-600 shrink-0">{e.time}</span>
            <span className="text-slate-500">—</span>
            <span className={i === visibleCount - 1 && visibleCount < events.length ? "text-primary-400" : "text-slate-300"}>
              {e.label}
            </span>
            {i === visibleCount - 1 && visibleCount < events.length && (
              <span className="inline-block w-1.5 h-3.5 bg-primary-500 animate-pulse ml-0.5" />
            )}
          </motion.div>
        ))}
        {visibleCount === 0 && (
          <span className="text-slate-600">Waiting for input...</span>
        )}
      </div>
    </div>
  );
}

// ─── Volume ROI simulator ─────────────────────────────────────────────────────

function VolumeSimulator() {
  const [volume, setVolume] = useState(50);
  const manualHours  = parseFloat(((volume * 8) / 60).toFixed(1));
  const ledgixMins   = Math.ceil((volume * 12) / 60);
  const savedHours   = parseFloat((manualHours - ledgixMins / 60).toFixed(1));
  const savedDollars = Math.round(savedHours * 40);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white border border-slate-200 rounded-xl overflow-hidden"
    >
      <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center">
          <TrendingUp size={16} className="text-primary-600" />
        </div>
        <div>
          <p className="text-[13px] font-semibold text-slate-900">ROI Calculator</p>
          <p className="text-[11px] text-slate-400">How much time is manual processing costing you?</p>
        </div>
      </div>

      <div className="p-6">
        {/* Slider */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="text-[12px] font-medium text-slate-600">Monthly invoice volume</label>
            <span className="text-[14px] font-bold text-slate-900">{volume} invoices</span>
          </div>
          <input
            type="range" min={10} max={500} step={10} value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-full accent-slate-900"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>10</span><span>500+</span>
          </div>
        </div>

        {/* Comparison */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-center">
            <Clock size={18} className="text-red-400 mx-auto mb-2" />
            <p className="text-[11px] text-red-500 font-medium uppercase tracking-wide mb-1">Manual Process</p>
            <p className="text-[22px] font-bold text-red-700">{manualHours}<span className="text-[13px] font-normal text-red-500"> hrs</span></p>
            <p className="text-[10px] text-red-400 mt-0.5">per month · ~8 min/invoice</p>
          </div>
          <div className="bg-green-50 border border-green-100 rounded-xl p-4 text-center">
            <Zap size={18} className="text-green-500 mx-auto mb-2" />
            <p className="text-[11px] text-green-600 font-medium uppercase tracking-wide mb-1">With Ledgix</p>
            <p className="text-[22px] font-bold text-green-700">{ledgixMins}<span className="text-[13px] font-normal text-green-500"> min</span></p>
            <p className="text-[10px] text-green-500 mt-0.5">per month · ~12 sec/invoice</p>
          </div>
        </div>

        {/* Savings callout */}
        <div className="bg-slate-900 rounded-xl p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-white font-semibold text-[14px]">Save {savedHours} hrs/month</p>
            <p className="text-slate-400 text-[12px] mt-0.5">≈ ${savedDollars.toLocaleString()} in labour at $40/hr</p>
          </div>
          <Link
            href="/register"
            className="shrink-0 flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-100 text-slate-900 text-[12px] font-semibold rounded-lg transition-colors"
          >
            Start saving <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ phase }: { phase: Phase }) {
  const steps = [
    { label: "Uploaded",     done: true,                                  active: false               },
    { label: "AI Extraction",done: phase === "review" || phase === "decided", active: phase === "scanning" },
    { label: "Review",       done: phase === "decided",                   active: phase === "review"   },
  ];
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {steps.map((s, i) => (
        <div key={i} className="flex items-center gap-2">
          {i > 0 && <div className="w-6 h-px bg-slate-200" />}
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium border transition-colors ${
            s.done   ? "bg-green-50 border-green-200 text-green-700" :
            s.active ? "bg-blue-50  border-blue-200  text-blue-700"  :
                       "bg-white    border-slate-200  text-slate-400"
          }`}>
            {s.done   ? <CheckCircle2 size={11} /> :
             s.active ? <Loader2 size={11} className="animate-spin" /> :
                        <div className="w-2.5 h-2.5 rounded-full border border-current opacity-40" />}
            {s.label}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function DemoPage() {
  const [selectedIdx,    setSelectedIdx]    = useState(0);
  const [phase,          setPhase]          = useState<Phase>("idle");
  const [revealedFields, setRevealedFields] = useState(0);
  const [dupPhase,       setDupPhase]       = useState<"hidden" | "checking" | "done">("hidden");
  const [decision,       setDecision]       = useState<Decision | null>(null);
  const [processedCount, setProcessedCount] = useState(0);
  const [customVendor,   setCustomVendor]   = useState("");
  const [showROI,        setShowROI]        = useState(false);

  // Timeline
  const [timelineEvents,  setTimelineEvents]  = useState<{ time: string; label: string }[]>([]);
  const [timelineVisible, setTimelineVisible] = useState(0);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  function clearTimers() {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }
  useEffect(() => () => clearTimers(), []);

  function handleSelectInvoice(idx: number) {
    clearTimers();
    setSelectedIdx(idx);
    setPhase("idle");
    setRevealedFields(0);
    setDupPhase("hidden");
    setDecision(null);
    setCustomVendor("");
    setTimelineVisible(0);
  }

  function handleProcess() {
    clearTimers();
    setPhase("scanning");
    setRevealedFields(0);
    setDupPhase("hidden");
    setDecision(null);
    setCustomVendor("");

    // Build timeline with real current time
    const now = Date.now();
    const built = TIMELINE.map((e) => {
      const d = new Date(now + e.delayMs);
      const hh = d.getHours().toString().padStart(2, "0");
      const mm = d.getMinutes().toString().padStart(2, "0");
      const ss = d.getSeconds().toString().padStart(2, "0");
      return { time: `${hh}:${mm}:${ss}`, label: e.label };
    });
    setTimelineEvents(built);
    setTimelineVisible(0);

    // Timeline visibility
    TIMELINE.forEach((e, i) => {
      timers.current.push(setTimeout(() => setTimelineVisible(i + 1), e.delayMs));
    });

    // Field reveals
    const fieldDelays = [650, 1150, 1600, 2000, 2450, 2900];
    fieldDelays.forEach((d, i) =>
      timers.current.push(setTimeout(() => setRevealedFields(i + 1), d))
    );

    // Dup check
    timers.current.push(setTimeout(() => setDupPhase("checking"), 3350));
    timers.current.push(setTimeout(() => {
      setDupPhase("done");
      setPhase("review");
    }, 4350));
  }

  function handleDecision(d: Decision) {
    setDecision(d);
    setPhase("decided");
    setProcessedCount((c) => c + 1);
    setShowROI(true);
  }

  function handleReset() {
    clearTimers();
    setPhase("idle");
    setRevealedFields(0);
    setDupPhase("hidden");
    setDecision(null);
    setCustomVendor("");
    setTimelineVisible(0);
  }

  const invoice       = INVOICES[selectedIdx];
  const scanning      = phase === "scanning";
  const inReview      = phase === "review" || phase === "decided";
  const isDupRisk     = invoice.duplicate !== null;
  const ctaContent    = personalizedCTA(decision, isDupRisk && phase === "decided");

  // Fake confidence score for custom vendor input
  const customScore   = customVendor
    ? Math.min(99, 78 + (customVendor.charCodeAt(0) % 22))
    : 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pt-16">

      {/* ── Banner ── */}
      <div className="bg-slate-900 px-4 py-2.5 flex items-center justify-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-[13px] text-slate-400">
          <Info size={13} className="shrink-0" />
          Demo mode — sample data only. No account required.
        </div>
        <Link
          href="/register"
          className="text-[13px] font-semibold text-white underline underline-offset-2 hover:text-slate-200 transition-colors"
        >
          Sign up free to process real invoices →
        </Link>
      </div>

      <div className="flex flex-1">

        {/* ── Sidebar ── */}
        <aside className="w-64 shrink-0 border-r border-slate-200 bg-white flex-col hidden md:flex">
          <div className="px-4 py-4 border-b border-slate-200">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Sample Invoices</p>
            <p className="text-[12px] text-slate-500 mt-0.5">Click any to load it</p>
          </div>

          <nav className="flex-1 p-3 space-y-1">
            {INVOICES.map((inv, i) => (
              <button
                key={inv.id}
                onClick={() => handleSelectInvoice(i)}
                className={`w-full text-left flex items-center gap-3 px-3 py-3 rounded-lg border transition-all ${
                  selectedIdx === i
                    ? "bg-primary-50 border-primary-200"
                    : "border-transparent hover:bg-slate-50"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg ${inv.colorClass} flex items-center justify-center text-white text-[11px] font-bold shrink-0`}>
                  {inv.initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-[13px] font-medium truncate ${selectedIdx === i ? "text-primary-700" : "text-slate-700"}`}>
                    {inv.shortName}
                  </p>
                  <p className={`text-[11px] font-mono ${selectedIdx === i ? "text-primary-500" : "text-slate-400"}`}>
                    {inv.invoiceNum}
                  </p>
                </div>
                {inv.duplicate && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" title="Contains duplicate" />
                )}
                {selectedIdx === i && <ChevronRight size={13} className="text-primary-400 shrink-0" />}
              </button>
            ))}
          </nav>

          <AnimatePresence>
            {processedCount > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="p-4 border-t border-slate-200 bg-slate-50"
              >
                <p className="text-[12px] text-slate-700 font-medium leading-relaxed mb-3">
                  {processedCount} demo invoice{processedCount > 1 ? "s" : ""} processed.<br />
                  Ready for your real ones?
                </p>
                <Link
                  href="/register"
                  className="flex items-center justify-center gap-1.5 w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-semibold rounded-lg transition-colors"
                >
                  Get Started Free <ArrowRight size={13} />
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </aside>

        {/* ── Main ── */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 min-w-0">
          <div className="max-w-4xl mx-auto space-y-5">

            {/* Mobile invoice picker */}
            <div className="flex md:hidden gap-2 overflow-x-auto pb-1">
              {INVOICES.map((inv, i) => (
                <button
                  key={inv.id}
                  onClick={() => handleSelectInvoice(i)}
                  className={`shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg border text-[13px] font-medium transition-colors ${
                    selectedIdx === i
                      ? "bg-primary-50 border-primary-200 text-primary-700"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <div className={`w-5 h-5 rounded ${inv.colorClass} flex items-center justify-center text-white text-[9px] font-bold shrink-0`}>
                    {inv.initials}
                  </div>
                  {inv.shortName}
                </button>
              ))}
            </div>

            {/* Step indicator */}
            <StepIndicator phase={phase} />

            {/* Two-column: document + extraction */}
            <div className="grid md:grid-cols-2 gap-5 items-start">

              {/* LEFT: PDF preview */}
              <PDFViewer
                invoice={invoice}
                scanning={scanning}
                revealedFields={revealedFields}
                isDupRisk={isDupRisk}
              />

              {/* RIGHT: Panel */}
              <div className="space-y-4">

                {/* Idle */}
                {phase === "idle" && (
                  <motion.div
                    key={`idle-${selectedIdx}`}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="bg-white border border-slate-200 rounded-xl p-8 flex flex-col items-center text-center"
                  >
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${
                      isDupRisk ? "bg-amber-50 border border-amber-200" : "bg-primary-50 border border-primary-200"
                    }`}>
                      {isDupRisk
                        ? <AlertTriangle size={26} className="text-amber-500" />
                        : <Zap size={26} className="text-primary-600" />}
                    </div>
                    <h3 className="text-slate-900 font-semibold text-[15px] mb-2">
                      {isDupRisk ? "Possible duplicate risk" : "Ready to Extract"}
                    </h3>
                    <p className="text-slate-500 text-[13px] mb-6 max-w-xs leading-relaxed">
                      {isDupRisk
                        ? "This invoice shares characteristics with a previous record. Run the AI to confirm."
                        : "Watch the AI extract all invoice fields with confidence scores — in seconds."}
                    </p>
                    <button
                      onClick={handleProcess}
                      className={`flex items-center gap-2 px-6 py-3 text-white text-[13px] font-semibold rounded-xl transition-colors ${
                        isDupRisk
                          ? "bg-amber-600 hover:bg-amber-700"
                          : "bg-slate-900 hover:bg-slate-800"
                      }`}
                    >
                      <Zap size={15} /> Process Invoice
                    </button>
                  </motion.div>
                )}

                {/* Extracted fields */}
                {phase !== "idle" && (
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                        Extracted Data
                      </span>
                      {scanning && (
                        <span className="flex items-center gap-1.5 text-[12px] text-blue-600 font-medium">
                          <Loader2 size={11} className="animate-spin" /> Extracting…
                        </span>
                      )}
                      {inReview && (
                        <span className="flex items-center gap-1.5 text-[12px] text-green-600 font-medium">
                          <CheckCircle2 size={11} /> Complete
                        </span>
                      )}
                    </div>
                    <div className="divide-y divide-slate-50">
                      {invoice.fields.map((field, i) => {
                        if (revealedFields > i) {
                          return (
                            <motion.div
                              key={field.label}
                              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.22 }}
                              className="flex items-center justify-between gap-3 px-4 py-2.5"
                            >
                              <div className="min-w-0">
                                <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">{field.label}</p>
                                <p className="text-[13px] font-medium text-slate-900 truncate">
                                  <TypewriterText text={field.value} key={`${field.label}-${selectedIdx}`} />
                                </p>
                              </div>
                              <ConfidenceBadge score={field.confidence} reason={field.reason} />
                            </motion.div>
                          );
                        }
                        if (scanning) {
                          return (
                            <div key={field.label} className="flex items-center justify-between gap-3 px-4 py-2.5">
                              <div className="flex-1">
                                <div className="h-2 w-16 bg-slate-100 rounded animate-pulse mb-1.5" />
                                <div className="h-3.5 w-28 bg-slate-100 rounded animate-pulse" />
                              </div>
                              <div className="h-5 w-20 bg-slate-100 rounded-full animate-pulse shrink-0" />
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>

                    {/* Custom vendor test */}
                    {inReview && (
                      <div className="border-t border-slate-100 px-4 py-3">
                        <p className="text-[10px] uppercase tracking-wide text-slate-400 mb-2">Try your own vendor name</p>
                        <input
                          value={customVendor}
                          onChange={(e) => setCustomVendor(e.target.value)}
                          placeholder="e.g. Microsoft, Shopify…"
                          className="w-full text-[13px] text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-400/30 focus:border-primary-400 transition-colors placeholder-slate-300"
                        />
                        <AnimatePresence>
                          {customVendor && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              className="flex items-center justify-between pt-2.5 mt-0.5 border-t border-slate-50"
                            >
                              <div>
                                <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Vendor Name</p>
                                <p className="text-[13px] font-medium text-slate-900">{customVendor}</p>
                              </div>
                              <ConfidenceBadge
                                score={customScore}
                                reason={customScore >= 95 ? "Exact match in vendor database" : "Partial match — name verified via fuzzy search"}
                              />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                )}

                {/* Line items */}
                {inReview && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
                    className="bg-white border border-slate-200 rounded-xl overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-slate-100">
                      <span className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">Line Items</span>
                    </div>
                    <div className="p-4">
                      <table className="w-full text-[12px]">
                        <thead>
                          <tr className="border-b border-slate-100">
                            <th className="text-left text-slate-400 font-medium pb-2">Description</th>
                            <th className="text-right text-slate-400 font-medium pb-2">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {invoice.lineItems.map((item, i) => (
                            <tr key={i} className="border-b border-slate-50 last:border-0">
                              <td className="py-1.5 text-slate-700">{item.desc}</td>
                              <td className="py-1.5 text-right font-mono text-slate-700">{item.amount}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t border-slate-200">
                            <td className="pt-2.5 font-semibold text-slate-900 text-[13px]">Total</td>
                            <td className="pt-2.5 text-right font-mono font-semibold text-slate-900 text-[13px]">{invoice.total}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </motion.div>
                )}

                {/* Dup check */}
                {(dupPhase === "checking" || dupPhase === "done") && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    className={`rounded-xl border overflow-hidden ${
                      dupPhase === "checking"      ? "bg-white border-slate-200" :
                      invoice.duplicate            ? "bg-amber-50 border-amber-200" :
                                                     "bg-green-50 border-green-200"
                    }`}
                  >
                    <div className="px-4 py-3 flex items-center gap-2.5">
                      {dupPhase === "checking" ? (
                        <><Loader2 size={14} className="text-blue-500 animate-spin shrink-0" /><span className="text-[13px] text-slate-600">Scanning {invoice.company} history…</span></>
                      ) : invoice.duplicate ? (
                        <><AlertTriangle size={14} className="text-amber-600 shrink-0" />
                          <span className="text-[13px] font-semibold text-amber-800 flex-1">Possible Duplicate Detected</span>
                          <span className="shrink-0 text-[11px] font-bold text-amber-700 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">{invoice.duplicate.score}% match</span></>
                      ) : (
                        <><Shield size={14} className="text-green-600 shrink-0" /><span className="text-[13px] font-semibold text-green-800">No Duplicates Found</span></>
                      )}
                    </div>
                    {dupPhase === "done" && invoice.duplicate && (
                      <div className="px-4 pb-3 text-[12px] text-amber-700 border-t border-amber-200 bg-amber-100/50 py-2.5">
                        Matched <span className="font-semibold font-mono">{invoice.duplicate.invoiceNum}</span> from {invoice.duplicate.date} · {invoice.duplicate.amount}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Approval buttons */}
                {phase === "review" && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
                    className="bg-white border border-slate-200 rounded-xl p-4"
                  >
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 mb-3">Review Decision</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDecision("rejected")}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 border border-slate-200 bg-white hover:bg-red-50 hover:border-red-200 text-slate-600 hover:text-red-700 text-[13px] font-medium rounded-lg transition-all"
                      >
                        <X size={14} /> Reject
                      </button>
                      <button
                        onClick={() => handleDecision("flagged")}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 border border-slate-200 bg-white hover:bg-amber-50 hover:border-amber-200 text-slate-600 hover:text-amber-700 text-[13px] font-medium rounded-lg transition-all"
                      >
                        <Flag size={14} /> Flag
                      </button>
                      <button
                        onClick={() => handleDecision("approved")}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-semibold rounded-lg transition-colors"
                      >
                        <CheckCircle2 size={14} /> Approve
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Decision result */}
                {phase === "decided" && decision && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                    className={`rounded-xl border p-5 text-center ${
                      decision === "approved" ? "bg-green-50 border-green-200" :
                      decision === "rejected" ? "bg-red-50   border-red-200"   :
                                                "bg-amber-50 border-amber-200"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full mx-auto mb-3 flex items-center justify-center ${
                      decision === "approved" ? "bg-green-100" :
                      decision === "rejected" ? "bg-red-100"   : "bg-amber-100"
                    }`}>
                      {decision === "approved" && <CheckCircle2 size={20} className="text-green-600" />}
                      {decision === "rejected"  && <X           size={20} className="text-red-600"   />}
                      {decision === "flagged"   && <Flag        size={20} className="text-amber-600" />}
                    </div>
                    <p className={`text-[14px] font-semibold ${
                      decision === "approved" ? "text-green-800" :
                      decision === "rejected" ? "text-red-800"   : "text-amber-800"
                    }`}>
                      Invoice {decision === "approved" ? "Approved" : decision === "rejected" ? "Rejected" : "Flagged for Review"}
                    </p>
                    <button
                      onClick={handleReset}
                      className="mt-3 inline-flex items-center gap-1.5 text-[12px] text-slate-400 hover:text-slate-700 transition-colors"
                    >
                      <RotateCcw size={11} /> Run demo again
                    </button>
                  </motion.div>
                )}


              </div>
            </div>

            {/* Processing timeline — full width, below the grid */}
            {timelineEvents.length > 0 && (
              <ProcessingTimeline events={timelineEvents} visibleCount={timelineVisible} />
            )}

            {/* Personalized CTA */}
            <AnimatePresence>
              {processedCount > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-slate-900 rounded-xl p-6 flex flex-col sm:flex-row items-center gap-4 justify-between"
                >
                  <div>
                    <p className="text-white font-semibold text-[14px]">{ctaContent.title}</p>
                    <p className="text-slate-400 text-[13px] mt-0.5">{ctaContent.desc}</p>
                  </div>
                  <Link
                    href="/register"
                    className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-900 text-[13px] font-semibold rounded-lg transition-colors"
                  >
                    Get Started Free <ArrowRight size={14} />
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ROI simulator */}
            <AnimatePresence>
              {showROI && <VolumeSimulator />}
            </AnimatePresence>

          </div>
        </main>
      </div>
    </div>
  );
}
