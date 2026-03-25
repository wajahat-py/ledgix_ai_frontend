"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  FileText, UploadCloud, CheckCircle2, AlertCircle,
  Clock, TrendingUp, Mail, ArrowRight,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
import AppHeader from "@/components/AppHeader";

const mockInvoices = [
  { id: "INV-2024-001", vendor: "Acme Corp Software", amount: "$3,450.00", date: "Mar 24, 2024", status: "Approved" },
  { id: "INV-2024-002", vendor: "AWS Services", amount: "$1,245.50", date: "Mar 23, 2024", status: "Pending" },
  { id: "INV-2024-003", vendor: "Adobe Creative Cloud", amount: "$54.99", date: "Mar 22, 2024", status: "Approved" },
  { id: "INV-2024-004", vendor: "Stripe Payments", amount: "$450.00", date: "Mar 21, 2024", status: "Duplicate" },
  { id: "INV-2024-005", vendor: "Vercel Inc", amount: "$120.00", date: "Mar 20, 2024", status: "Approved" },
];

const statusStyles: Record<string, string> = {
  Approved: "bg-green-500/10 text-green-400 border-green-500/20",
  Pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  Duplicate: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  Rejected: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

const statusIcons: Record<string, React.ReactNode> = {
  Approved: <CheckCircle2 size={13} />,
  Pending: <Clock size={13} />,
  Duplicate: <AlertCircle size={13} />,
};

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        <AppHeader title="Dashboard" />

        <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 space-y-8">

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Invoices", value: "48", sub: "This month", icon: <FileText size={18} />, color: "text-primary-400" },
              { label: "Pending Approval", value: "7", sub: "Needs review", icon: <Clock size={18} />, color: "text-yellow-400" },
              { label: "Approved", value: "38", sub: "Processed", icon: <CheckCircle2 size={18} />, color: "text-green-400" },
              { label: "Amount Processed", value: "$24,890", sub: "Total value", icon: <TrendingUp size={18} />, color: "text-indigo-400" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="bg-slate-900/50 border border-slate-800 rounded-xl p-5"
              >
                <div className={`mb-3 ${stat.color}`}>{stat.icon}</div>
                <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-xs text-slate-500">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="grid md:grid-cols-2 gap-4">
            <Link href="/upload" className="group flex items-center gap-4 bg-slate-900/50 border border-slate-800 hover:border-primary-500/40 rounded-xl p-5 transition-all">
              <div className="w-10 h-10 rounded-xl bg-primary-600/10 text-primary-400 flex items-center justify-center shrink-0">
                <UploadCloud size={20} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-white text-sm">Upload Invoice</p>
                <p className="text-xs text-slate-500 mt-0.5">Drag & drop or select a PDF to process</p>
              </div>
              <ArrowRight size={16} className="text-slate-600 group-hover:text-primary-400 transition-colors" />
            </Link>
            <Link href="/email" className="group flex items-center gap-4 bg-slate-900/50 border border-slate-800 hover:border-primary-500/40 rounded-xl p-5 transition-all">
              <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-400 flex items-center justify-center shrink-0">
                <Mail size={20} />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-white text-sm">Connect Email</p>
                <p className="text-xs text-slate-500 mt-0.5">Auto-detect invoices from your inbox</p>
              </div>
              <ArrowRight size={16} className="text-slate-600 group-hover:text-blue-400 transition-colors" />
            </Link>
          </div>

          {/* Recent Activity */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="font-semibold text-white">Recent Activity</h2>
              <Link href="/invoices" className="text-xs text-primary-400 hover:text-primary-300 transition-colors flex items-center gap-1">
                View all <ArrowRight size={13} />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-xs uppercase tracking-wider text-slate-500 border-b border-slate-800/50">
                    <th className="px-6 py-3 font-semibold">Vendor</th>
                    <th className="px-6 py-3 font-semibold">Invoice ID</th>
                    <th className="px-6 py-3 font-semibold text-right">Amount</th>
                    <th className="px-6 py-3 font-semibold">Date</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {mockInvoices.map((inv, i) => (
                    <motion.tr
                      key={inv.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 + i * 0.05 }}
                      className="hover:bg-slate-800/30 transition-colors group cursor-pointer"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                            {inv.vendor.charAt(0)}
                          </div>
                          <span className="font-medium text-slate-200 text-sm">{inv.vendor}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-slate-400">{inv.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-200 text-right">{inv.amount}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400">{inv.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusStyles[inv.status]}`}>
                          {statusIcons[inv.status]} {inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <Link href={`/invoices/${inv.id}`} className="text-xs text-primary-400 hover:text-primary-300 opacity-0 group-hover:opacity-100 transition-opacity">
                          Review →
                        </Link>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
