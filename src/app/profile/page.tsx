"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { User, Shield, CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import AppHeader from "@/components/AppHeader";
import ContactSalesModal from "@/components/ContactSalesModal";
import { api } from "@/services/api";
import { useUsage } from "@/hooks/useUsage";

interface UserProfile {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  company_name: string;
}

export default function ProfilePage() {
  const { usage, loading: usageLoading } = useUsage();
  const [salesOpen, setSalesOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadError, setLoadError] = useState(false);

  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [nameError, setNameError] = useState("");

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<UserProfile>("/api/auth/me/")
      .then((res) => {
        setProfile(res.data);
        setFullName(res.data.full_name);
        setCompany(res.data.company_name);
      })
      .catch(() => setLoadError(true));
  }, []);

  const handleSave = async () => {
    const trimmed = fullName.trim();
    if (!trimmed) {
      setNameError("Name cannot be empty.");
      return;
    }

    setSaving(true);
    try {
      const parts      = trimmed.split(" ");
      const first_name = parts[0];
      const last_name  = parts.slice(1).join(" ");

      const res = await api.patch<UserProfile>("/api/auth/me/", {
        first_name,
        last_name,
        company_name: company.trim(),
      });
      setProfile(res.data);
      setFullName(res.data.full_name);
      setCompany(res.data.company_name);
      toast.success("Profile updated.");
    } catch {
      toast.error("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        <AppHeader title="Profile" />

        <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 space-y-6 max-w-3xl">

          {/* Account Details */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-slate-200 rounded-xl p-6"
          >
            <h2 className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
              <User size={13} /> Account Details
            </h2>

            {loadError ? (
              <p className="text-sm text-red-600">Failed to load profile. Please refresh the page.</p>
            ) : !profile ? (
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Loader2 size={14} className="animate-spin" /> Loading…
              </div>
            ) : (
              <div className="space-y-4">
                {/* Full Name — editable */}
                <div className="bg-slate-50 rounded-lg px-4 py-3">
                  <div className="text-[10px] uppercase tracking-wide text-slate-400 mb-0.5">Full Name</div>
                  <input
                    value={fullName}
                    onChange={(e) => { setFullName(e.target.value); setNameError(""); }}
                    className="bg-transparent text-sm text-slate-900 w-full focus:outline-none focus:text-primary-700 transition-colors disabled:opacity-50"
                    aria-describedby={nameError ? "name-error" : undefined}
                  />
                  {nameError && (
                    <p id="name-error" className="text-xs text-red-600 mt-1">{nameError}</p>
                  )}
                </div>

                {/* Email — read-only */}
                <div className="bg-slate-50 rounded-lg px-4 py-3">
                  <div className="text-[10px] uppercase tracking-wide text-slate-400 mb-0.5">Email Address</div>
                  <input
                    value={profile.email}
                    readOnly
                    className="bg-transparent text-sm text-slate-400 w-full focus:outline-none cursor-not-allowed"
                  />
                </div>

                {/* Company — editable */}
                <div className="bg-slate-50 rounded-lg px-4 py-3">
                  <div className="text-[10px] uppercase tracking-wide text-slate-400 mb-0.5">Company</div>
                  <input
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="—"
                    className="bg-transparent text-sm text-slate-900 w-full focus:outline-none focus:text-primary-700 transition-colors placeholder-slate-300"
                  />
                </div>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="mt-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-all flex items-center gap-2"
                >
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            )}
          </motion.div>

          {/* Current Plan */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 }}
            className="bg-white border border-slate-200 rounded-xl p-6"
          >
            <h2 className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
              <Shield size={13} /> Current Plan
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-slate-900 font-semibold text-lg">Free Plan</div>
                <p className="text-sm text-slate-500 mt-1">Up to {usage?.invoice_limit ?? 50} invoices per month</p>
                <div className="mt-3 space-y-2">
                  {["Invoice data extraction", "Line-item extraction", "CSV export", "Basic approval step"].map((f) => (
                    <div key={f} className="flex items-center gap-2 text-xs text-slate-500">
                      <CheckCircle2 size={13} className="text-primary-600" /> {f}
                    </div>
                  ))}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400 mb-1">Usage this month</div>
                {usageLoading ? (
                  <div className="flex items-center justify-end gap-1.5 text-slate-400 text-sm">
                    <Loader2 size={13} className="animate-spin" /> Loading…
                  </div>
                ) : (
                  <>
                    <div className="text-2xl font-bold text-slate-900">
                      {usage?.invoice_count ?? 0}
                      <span className="text-slate-400 text-sm font-normal"> / {usage?.invoice_limit ?? 50}</span>
                    </div>
                    <div className="mt-2 w-32 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          usage && usage.invoice_count >= usage.invoice_limit
                            ? "bg-red-500"
                            : usage && usage.invoice_count / usage.invoice_limit >= 0.8
                              ? "bg-amber-500"
                              : "bg-primary-600"
                        }`}
                        style={{ width: `${Math.min(100, usage ? (usage.invoice_count / usage.invoice_limit) * 100 : 0)}%` }}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="mt-5 pt-5 border-t border-slate-200">
              <p className="text-sm text-slate-500 mb-3">Need unlimited invoices, custom integrations, or advanced workflows?</p>
              <button
                onClick={() => setSalesOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-all"
              >
                Contact Sales — Upgrade to Enterprise <ArrowRight size={15} />
              </button>
            </div>
          </motion.div>

        </div>
      </main>

      <ContactSalesModal open={salesOpen} onClose={() => setSalesOpen(false)} />
    </div>
  );
}
