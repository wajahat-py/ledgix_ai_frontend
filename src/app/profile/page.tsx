"use client";

import { motion } from "framer-motion";
import { User, CreditCard, Mail, ArrowRight, CheckCircle2, Shield } from "lucide-react";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import AppHeader from "@/components/AppHeader";

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        <AppHeader title="Profile" />

        <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 space-y-6 max-w-3xl">

          {/* Account Info */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5 flex items-center gap-2">
              <User size={14} /> Account Details
            </h2>
            <div className="space-y-4">
              {[
                { label: "Full Name", value: "Jane Doe" },
                { label: "Email Address", value: "jane@company.com" },
                { label: "Company", value: "Acme Corp" },
              ].map((field) => (
                <div key={field.label} className="flex items-center gap-4 bg-slate-800/50 rounded-lg px-4 py-3">
                  <div className="flex-1">
                    <div className="text-[10px] uppercase tracking-wide text-slate-500 mb-0.5">{field.label}</div>
                    <input
                      defaultValue={field.value}
                      className="bg-transparent text-sm text-white w-full focus:outline-none focus:text-primary-300 transition-colors"
                    />
                  </div>
                </div>
              ))}
              <button 
                onClick={() => toast.success("Account details updated.")}
                className="mt-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium rounded-lg transition-all"
              >
                Save Changes
              </button>
            </div>
          </motion.div>

          {/* Current Plan */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5 flex items-center gap-2">
              <Shield size={14} /> Current Plan
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white font-semibold text-lg">Free Plan</div>
                <p className="text-sm text-slate-400 mt-1">Up to 50 invoices per month</p>
                <div className="mt-3 space-y-2">
                  {["Invoice data extraction", "Line-item extraction", "CSV export", "Basic approval step"].map((f) => (
                    <div key={f} className="flex items-center gap-2 text-xs text-slate-400">
                      <CheckCircle2 size={13} className="text-primary-400" /> {f}
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-500 mb-1">Usage this month</div>
                <div className="text-2xl font-bold text-white">12<span className="text-slate-500 text-sm font-normal"> / 50</span></div>
                <div className="mt-2 w-32 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-primary-500 rounded-full" style={{ width: "24%" }} />
                </div>
              </div>
            </div>
            <div className="mt-5 pt-5 border-t border-slate-800">
              <p className="text-sm text-slate-400 mb-3">Need unlimited invoices, custom integrations, or advanced workflows?</p>
              <a
                href="mailto:hello@ledgix.app"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-sm font-medium rounded-lg transition-all"
              >
                Contact Sales — Upgrade to Enterprise <ArrowRight size={15} />
              </a>
            </div>
          </motion.div>

          {/* Payment Method */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5 flex items-center gap-2">
              <CreditCard size={14} /> Payment Method
            </h2>
            <div className="flex items-center gap-4 bg-slate-800/50 rounded-lg px-4 py-3">
              <div className="w-10 h-7 bg-slate-700 rounded flex items-center justify-center text-[10px] font-bold text-slate-300">VISA</div>
              <div className="flex-1">
                <p className="text-sm text-white">•••• •••• •••• 4242</p>
                <p className="text-xs text-slate-500">Expires 08 / 26</p>
              </div>
              <button className="text-xs text-primary-400 hover:text-primary-300 transition-colors">Update</button>
            </div>
          </motion.div>

          {/* Contact */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Mail size={14} /> Need Help?
            </h2>
            <p className="text-sm text-slate-400 mb-3">Our team is happy to help with billing, account issues, or enterprise plans.</p>
            <a
              href="mailto:hello@ledgix.app"
              className="inline-flex items-center gap-2 text-sm text-primary-400 hover:text-primary-300 transition-colors font-medium"
            >
              Contact Support <ArrowRight size={14} />
            </a>
          </motion.div>

        </div>
      </main>
    </div>
  );
}
