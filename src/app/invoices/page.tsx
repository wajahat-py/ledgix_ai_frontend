"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, Download, CheckCircle2, AlertCircle, Clock, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import AppHeader from "@/components/AppHeader";

const ALL_INVOICES = [
  { id: "INV-2024-001", vendor: "Acme Corp Software", amount: "$3,450.00", date: "Mar 24, 2024", status: "Approved" },
  { id: "INV-2024-002", vendor: "AWS Services", amount: "$1,245.50", date: "Mar 23, 2024", status: "Pending" },
  { id: "INV-2024-003", vendor: "Adobe Creative Cloud", amount: "$54.99", date: "Mar 22, 2024", status: "Approved" },
  { id: "INV-2024-004", vendor: "Stripe Payments", amount: "$450.00", date: "Mar 21, 2024", status: "Duplicate" },
  { id: "INV-2024-005", vendor: "Vercel Inc", amount: "$120.00", date: "Mar 20, 2024", status: "Approved" },
  { id: "INV-2024-006", vendor: "Google Workspace", amount: "$72.00", date: "Mar 19, 2024", status: "Approved" },
  { id: "INV-2024-007", vendor: "Figma Inc", amount: "$144.00", date: "Mar 18, 2024", status: "Rejected" },
  { id: "INV-2024-008", vendor: "Notion Labs", amount: "$96.00", date: "Mar 17, 2024", status: "Pending" },
  { id: "INV-2024-009", vendor: "Linear Orbit", amount: "$360.00", date: "Mar 16, 2024", status: "Approved" },
  { id: "INV-2024-010", vendor: "Slack Technologies", amount: "$87.50", date: "Mar 15, 2024", status: "Pending" },
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
  Rejected: <AlertCircle size={13} />,
};

export default function InvoicesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filtered = ALL_INVOICES.filter((inv) => {
    const matchSearch = inv.vendor.toLowerCase().includes(search.toLowerCase()) || inv.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        <AppHeader title="Invoices" />

        <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl flex flex-col">

            {/* Controls */}
            <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row gap-3 justify-between items-center">
              <div className="flex gap-3 w-full sm:w-auto">
                {/* Search */}
                <div className="relative flex-1 sm:w-64">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search vendor or ID..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                {/* Status Filter */}
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="appearance-none pl-3 pr-8 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer"
                  >
                    {["All", "Pending", "Approved", "Rejected", "Duplicate"].map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                </div>
              </div>

              {/* Export */}
              <button 
                onClick={() => toast.success("Invoice data exported to CSV.")}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm text-slate-300 transition-colors whitespace-nowrap"
              >
                <Download size={15} /> Export CSV
              </button>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-xs uppercase tracking-wider text-slate-500 border-b border-slate-800/50">
                    <th className="px-6 py-3 font-semibold">Vendor</th>
                    <th className="px-6 py-3 font-semibold">Invoice ID</th>
                    <th className="px-6 py-3 font-semibold">Date</th>
                    <th className="px-6 py-3 font-semibold text-right">Amount</th>
                    <th className="px-6 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center text-slate-500 text-sm">No invoices found</td>
                    </tr>
                  ) : filtered.map((inv, i) => (
                    <motion.tr
                      key={inv.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.04 }}
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
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400">{inv.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-slate-200 text-right">{inv.amount}</td>
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

            {/* Footer */}
            <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span>Showing <span className="text-slate-300 font-medium">{filtered.length}</span> of <span className="text-slate-300 font-medium">{ALL_INVOICES.length}</span> invoices</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
