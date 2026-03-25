"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft, CheckCircle2, XCircle, AlertTriangle,
  FileText, Clock, User, Hash, Calendar, DollarSign,
} from "lucide-react";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import AppHeader from "@/components/AppHeader";

const INVOICE_DATA: Record<string, {
  id: string; vendor: string; invoiceNumber: string; date: string; dueDate: string;
  amount: string; status: string; duplicate: boolean; duplicateMatch?: string;
  lineItems: { desc: string; qty: number; price: string; total: string }[];
  log: { time: string; event: string }[];
}> = {
  "INV-2024-001": {
    id: "INV-2024-001", vendor: "Acme Corp Software", invoiceNumber: "ACM-7821",
    date: "Mar 24, 2024", dueDate: "Apr 24, 2024", amount: "$3,450.00", status: "Approved",
    duplicate: false,
    lineItems: [
      { desc: "Software License x10", qty: 10, price: "$250.00", total: "$2,500.00" },
      { desc: "Support Retainer", qty: 1, price: "$500.00", total: "$500.00" },
      { desc: "Onboarding Fee", qty: 1, price: "$450.00", total: "$450.00" },
    ],
    log: [
      { time: "9:01 AM", event: "Invoice uploaded" },
      { time: "9:01 AM", event: "AI extraction started" },
      { time: "9:02 AM", event: "Data extracted (99% confidence)" },
      { time: "9:02 AM", event: "Duplicate check passed — no matches" },
      { time: "9:15 AM", event: "Approved by admin" },
    ],
  },
  "INV-2024-002": {
    id: "INV-2024-002", vendor: "AWS Services", invoiceNumber: "AWS-00194",
    date: "Mar 23, 2024", dueDate: "Apr 23, 2024", amount: "$1,245.50", status: "Pending",
    duplicate: false,
    lineItems: [
      { desc: "EC2 Compute (t3.medium x3)", qty: 3, price: "$180.00", total: "$540.00" },
      { desc: "S3 Storage (500GB)", qty: 1, price: "$345.50", total: "$345.50" },
      { desc: "Data Transfer", qty: 1, price: "$360.00", total: "$360.00" },
    ],
    log: [
      { time: "8:30 AM", event: "Invoice uploaded" },
      { time: "8:30 AM", event: "AI extraction started" },
      { time: "8:31 AM", event: "Data extracted (97% confidence)" },
      { time: "8:31 AM", event: "Duplicate check passed" },
      { time: "8:31 AM", event: "Awaiting approval" },
    ],
  },
  "INV-2024-004": {
    id: "INV-2024-004", vendor: "Stripe Payments", invoiceNumber: "STR-44291",
    date: "Mar 21, 2024", dueDate: "Apr 21, 2024", amount: "$450.00", status: "Duplicate",
    duplicate: true, duplicateMatch: "INV-2024-001",
    lineItems: [
      { desc: "Transaction Fees", qty: 1, price: "$450.00", total: "$450.00" },
    ],
    log: [
      { time: "2:10 PM", event: "Invoice uploaded" },
      { time: "2:10 PM", event: "AI extraction started" },
      { time: "2:11 PM", event: "Data extracted" },
      { time: "2:11 PM", event: "⚠️ Duplicate detected — 98% match with INV-2024-001" },
    ],
  },
};

const FALLBACK = INVOICE_DATA["INV-2024-002"];

const statusStyles: Record<string, string> = {
  Approved: "bg-green-500/10 text-green-400 border-green-500/20",
  Pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  Duplicate: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  Rejected: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

export default function InvoiceDetailPage() {
  const params = useParams();
  const invoiceId = params?.id as string;
  const invoice = INVOICE_DATA[invoiceId] ?? FALLBACK;

  const [status, setStatus] = useState(invoice.status);

  const handleApprove = () => {
    setStatus("Approved");
    toast.success("Invoice approved successfully.");
  };
  const handleReject = () => {
    setStatus("Rejected");
    toast.error("Invoice has been rejected.");
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <AppHeader title="Invoice Detail" />

        <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          {/* Back */}
          <Link href="/invoices" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-6">
            <ArrowLeft size={16} /> Back to Invoices
          </Link>

          <div className="grid md:grid-cols-2 gap-6">
            {/* LEFT — Invoice Preview */}
            <div className="space-y-5">
              {/* Mock Invoice */}
              <div className="bg-white rounded-xl p-6 shadow-lg text-slate-800 text-sm">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <div className="text-lg font-bold text-slate-900">INVOICE</div>
                    <div className="text-slate-500 text-xs mt-1">#{invoice.invoiceNumber}</div>
                  </div>
                  <div className="text-right text-xs text-slate-500">
                    <p><span className="font-medium">Issued:</span> {invoice.date}</p>
                    <p><span className="font-medium">Due:</span> {invoice.dueDate}</p>
                  </div>
                </div>
                <div className="mb-5">
                  <div className="font-semibold text-slate-700 text-xs uppercase tracking-wide mb-1">From</div>
                  <div className="font-bold text-slate-900">{invoice.vendor}</div>
                  <div className="text-slate-500 text-xs">billing@{invoice.vendor.toLowerCase().replace(/\s+/g, "")}.com</div>
                </div>
                <table className="w-full text-xs mb-4 border-t border-slate-100 pt-3">
                  <thead>
                    <tr className="text-slate-400 uppercase text-[10px] tracking-wide">
                      <th className="text-left py-2">Description</th>
                      <th className="text-center py-2">Qty</th>
                      <th className="text-right py-2">Unit Price</th>
                      <th className="text-right py-2">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoice.lineItems.map((item, i) => (
                      <tr key={i}>
                        <td className="py-2 text-slate-700">{item.desc}</td>
                        <td className="py-2 text-center text-slate-500">{item.qty}</td>
                        <td className="py-2 text-right text-slate-500">{item.price}</td>
                        <td className="py-2 text-right font-medium text-slate-800">{item.total}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-slate-200">
                      <td colSpan={3} className="py-3 text-right font-semibold text-slate-700">Total Due</td>
                      <td className="py-3 text-right font-bold text-slate-900">{invoice.amount}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Processing Log */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-white mb-4">Processing Log</h3>
                <div className="space-y-3">
                  {invoice.log.map((entry, i) => (
                    <div key={i} className="flex gap-3 text-xs">
                      <span className="text-slate-600 shrink-0 w-16">{entry.time}</span>
                      <span className="text-slate-400">{entry.event}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* RIGHT — Extracted Data + Actions */}
            <div className="space-y-5">
              {/* Extracted Fields */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900/50 border border-slate-800 rounded-xl p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-white">Extracted Data</h3>
                  <span className="text-xs px-2 py-0.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full">99% confidence</span>
                </div>
                <div className="space-y-3">
                  {[
                    { label: "Vendor", value: invoice.vendor, icon: <User size={14} /> },
                    { label: "Invoice Number", value: invoice.invoiceNumber, icon: <Hash size={14} /> },
                    { label: "Issue Date", value: invoice.date, icon: <Calendar size={14} /> },
                    { label: "Amount", value: invoice.amount, icon: <DollarSign size={14} /> },
                  ].map((field, i) => (
                    <div key={i} className="flex items-center gap-3 bg-slate-800/50 rounded-lg px-4 py-3">
                      <span className="text-slate-500 shrink-0">{field.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] uppercase tracking-wide text-slate-500 mb-0.5">{field.label}</div>
                        <input
                          defaultValue={field.value}
                          className="bg-transparent text-sm text-white font-medium w-full focus:outline-none focus:text-primary-300 transition-colors"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Line Items */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-white mb-4">Line Items</h3>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-500 uppercase tracking-wide text-[10px] border-b border-slate-800">
                      <th className="text-left pb-2">Description</th>
                      <th className="text-center pb-2">Qty</th>
                      <th className="text-right pb-2">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {invoice.lineItems.map((item, i) => (
                      <tr key={i}>
                        <td className="py-2.5 text-slate-300">{item.desc}</td>
                        <td className="py-2.5 text-center text-slate-400">{item.qty}</td>
                        <td className="py-2.5 text-right font-medium text-slate-200">{item.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Duplicate Detection */}
              <div className={`rounded-xl p-5 border ${invoice.duplicate ? "bg-rose-500/5 border-rose-500/20" : "bg-green-500/5 border-green-500/20"}`}>
                <div className="flex items-center gap-3">
                  {invoice.duplicate ? (
                    <AlertTriangle size={20} className="text-rose-400 shrink-0" />
                  ) : (
                    <CheckCircle2 size={20} className="text-green-400 shrink-0" />
                  )}
                  <div>
                    <p className={`text-sm font-semibold ${invoice.duplicate ? "text-rose-400" : "text-green-400"}`}>
                      {invoice.duplicate ? "Possible Duplicate" : "No Duplicate Found"}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {invoice.duplicate
                        ? `98% match with ${invoice.duplicateMatch}. Review before approving.`
                        : "This invoice has no matches in your history."}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status + Actions */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-sm font-semibold text-white">Status</h3>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusStyles[status] ?? statusStyles["Pending"]}`}>
                    <FileText size={12} /> {status}
                  </span>
                </div>
                {(status === "Pending" || status === "Duplicate") && (
                  <div className="flex gap-3">
                    <button
                      onClick={handleReject}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-sm text-white transition-all"
                    >
                      <XCircle size={16} className="text-rose-400" /> Reject
                    </button>
                    <button
                      onClick={handleApprove}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-500 text-sm text-white font-medium transition-all shadow-lg shadow-primary-500/20"
                    >
                      <CheckCircle2 size={16} /> Approve
                    </button>
                  </div>
                )}
                {(status === "Approved" || status === "Rejected") && (
                  <p className="text-xs text-slate-500 text-center">
                    This invoice has been <span className={status === "Approved" ? "text-green-400" : "text-rose-400"}>{status.toLowerCase()}</span>.
                  </p>
                )}
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
