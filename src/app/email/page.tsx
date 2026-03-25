"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, CheckCircle2, AlertCircle, ArrowRight, Inbox, FileText } from "lucide-react";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import AppHeader from "@/components/AppHeader";
import Link from "next/link";

const DEMO_EMAILS = [
  { id: 1, subject: "Invoice #7821 from Acme Corp", sender: "billing@acmecorp.com", time: "9:01 AM", detected: true, invoiceId: "INV-2024-001" },
  { id: 2, subject: "Your AWS Invoice - March 2024", sender: "invoices@aws.amazon.com", time: "8:30 AM", detected: true, invoiceId: "INV-2024-002" },
  { id: 3, subject: "Re: Meeting tomorrow", sender: "alice@company.com", time: "7:45 AM", detected: false, invoiceId: null },
  { id: 4, subject: "Figma workspace invoice", sender: "noreply@figma.com", time: "Yesterday", detected: true, invoiceId: "INV-2024-007" },
];

export default function EmailPage() {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const handleConnect = () => {
    setConnecting(true);
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)),
      {
        loading: 'Connecting to Gmail...',
        success: () => {
          setConnecting(false);
          setConnected(true);
          return 'Gmail account connected!';
        },
        error: 'Failed to connect.',
      }
    );
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        <AppHeader title="Email Integration" />

        <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 space-y-6">

          {/* Connection Card */}
          <div className={`rounded-xl border p-6 transition-all ${connected ? "border-green-500/30 bg-green-500/5" : "border-slate-800 bg-slate-900/50"}`}>
            <div className="flex items-start gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${connected ? "bg-green-500/10 text-green-400" : "bg-blue-500/10 text-blue-400"}`}>
                <Mail size={22} />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-white mb-1">
                  {connected ? "Gmail Connected" : "Connect Your Email"}
                </h2>
                <p className="text-sm text-slate-400 mb-4">
                  {connected
                    ? "Your inbox is now monitored. Invoices detected in your emails are listed below."
                    : "Connect your inbox to automatically detect and process invoices."}
                </p>
                {!connected && (
                  <button
                    onClick={handleConnect}
                    disabled={connecting}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white text-slate-800 hover:bg-slate-100 text-sm font-semibold rounded-lg transition-all disabled:opacity-60"
                  >
                    {connecting ? (
                      <>
                        <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 24L4 9.7V38h40V9.7L24 24z"/><path fill="#FBBC05" d="M44 9.7L24 24 4 9.7 24 2l20 7.7z"/><path fill="#34A853" d="M4 38h40v2H4z"/><path fill="#4285F4" d="M44 9.7V38H4V9.7L24 24l20-14.3z"/></svg>
                        Connect Gmail
                      </>
                    )}
                  </button>
                )}
                {connected && (
                  <div className="inline-flex items-center gap-2 text-sm text-green-400 font-medium">
                    <CheckCircle2 size={16} /> Connected to Gmail
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Detected Emails */}
          <AnimatePresence>
            {connected && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900/50 border border-slate-800 rounded-xl"
              >
                <div className="px-6 py-4 border-b border-slate-800 flex items-center gap-2">
                  <Inbox size={16} className="text-slate-400" />
                  <h2 className="font-semibold text-white text-sm">Detected Emails</h2>
                </div>
                <div className="divide-y divide-slate-800/50">
                  {DEMO_EMAILS.map((email, i) => (
                    <motion.div
                      key={email.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.07 }}
                      className="flex items-center gap-4 px-6 py-4 hover:bg-slate-800/30 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 shrink-0">
                        {email.sender.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-200 truncate">{email.subject}</p>
                        <p className="text-xs text-slate-500 truncate">{email.sender}</p>
                      </div>
                      <div className="shrink-0 text-xs text-slate-500">{email.time}</div>
                      <div className="shrink-0">
                        {email.detected ? (
                          <Link
                            href={`/invoices/${email.invoiceId}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-600/10 text-primary-400 border border-primary-500/20 text-xs font-medium hover:bg-primary-600/20 transition-colors"
                          >
                            <FileText size={12} /> Review <ArrowRight size={12} />
                          </Link>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-500 text-xs">
                            <AlertCircle size={12} /> Not an invoice
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </main>
    </div>
  );
}
