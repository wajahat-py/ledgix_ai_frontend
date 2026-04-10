"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { User, Shield, CheckCircle2, ArrowRight, Loader2, Star, CreditCard } from "lucide-react";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import AppHeader from "@/components/AppHeader";
import ContactSalesModal from "@/components/ContactSalesModal";
import { api } from "@/services/api";
import { useUsage } from "@/hooks/useUsage";
import { useOrg } from "@/lib/org-context";

interface UserProfile {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  company_name: string;
}

export default function ProfilePage() {
  const { org, membership, isLoading: orgLoading, refresh } = useOrg();
  const { usage, loading: usageLoading } = useUsage(org?.plan ?? null);
  const [salesOpen, setSalesOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [billingLoading, setBillingLoading] = useState(false);

  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [nameError, setNameError] = useState("");

  const [saving, setSaving] = useState(false);

  const isPro   = org?.plan === "pro" || org?.plan === "business";
  const isOwner = membership?.role === "owner";
  const cancellationScheduled = isPro && org?.intended_plan === "free";
  const paymentPending = org?.intended_plan === "pro" && org?.plan === "free";

  useEffect(() => {
    if (!org || !isOwner) return;
    api.get("/api/billing/status/")
      .then(() => refresh())
      .catch(() => {});
  }, [isOwner, org?.id, refresh]);

  useEffect(() => {
    api.get<UserProfile>("/api/auth/me/")
      .then((res) => {
        setProfile(res.data);
        setFullName(res.data.full_name);
        setCompany(res.data.company_name);
      })
      .catch(() => setLoadError(true));
  }, []);

  const handleUpgrade = async () => {
    setBillingLoading(true);
    try {
      const res = await api.post<{ url: string }>("/api/billing/create-checkout-session/");
      window.location.href = res.data.url;
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(detail ?? "Could not start checkout. Please try again.");
      setBillingLoading(false);
    }
  };

  const handleBillingPortal = async () => {
    setBillingLoading(true);
    try {
      const res = await api.post<{ url: string }>("/api/billing/portal/");
      window.location.href = res.data.url;
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(detail ?? "Could not open billing portal.");
      setBillingLoading(false);
    }
  };

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

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <AppHeader title="Profile" />

        <div className="flex-1 overflow-auto p-4 pb-24 md:p-6 md:pb-6 lg:p-8 space-y-6 max-w-3xl">

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

            {orgLoading ? (
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Loader2 size={14} className="animate-spin" /> Loading…
              </div>
            ) : (
              <>
                {/* Plan badge + usage */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-slate-900 font-semibold text-lg">
                        {isPro ? "Pro Plan" : "Free Plan"}
                      </span>
                      {isPro && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 uppercase tracking-wide">
                          <Star size={9} /> Pro
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500">
                      {usage?.invoice_limit === null
                        ? "Unlimited invoices per month"
                        : `Up to ${usage?.invoice_limit ?? (isPro ? 500 : 50)} invoices per month`}
                    </p>
                    {paymentPending && (
                      <p className="text-xs text-amber-700 mt-2">
                        Payment is still pending for this Pro workspace.
                      </p>
                    )}
                    {cancellationScheduled && (
                      <p className="text-xs text-amber-700 mt-2">
                        Cancellation is scheduled. Pro remains active until the current billing period ends.
                      </p>
                    )}
                    <div className="mt-3 space-y-1.5">
                      {(isPro
                        ? ["500 invoices / month", "Everything in Free", "Up to 5 workspace seats", "Excel, PDF, QuickBooks & Xero export", "Priority support"]
                        : ["Invoice data extraction", "Line-item extraction", "CSV export", "Approve / reject workflow"]
                      ).map((f) => (
                        <div key={f} className="flex items-center gap-2 text-xs text-slate-500">
                          <CheckCircle2 size={12} className="text-primary-600 shrink-0" /> {f}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs text-slate-400 mb-1">Usage this month</div>
                    {usageLoading ? (
                      <div className="flex items-center justify-end gap-1.5 text-slate-400 text-sm">
                        <Loader2 size={13} className="animate-spin" /> Loading…
                      </div>
                    ) : (
                      <>
                        <div className="text-2xl font-bold text-slate-900">
                          {usage?.invoice_count ?? 0}
                          <span className="text-slate-400 text-sm font-normal">
                            {" / "}
                            {usage?.invoice_limit === null ? "Unlimited" : (usage?.invoice_limit ?? (isPro ? 500 : 50))}
                          </span>
                        </div>
                        {usage?.invoice_limit !== null && (
                          <div className="mt-2 w-32 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                usage && usage.invoice_limit !== null && usage.invoice_count >= usage.invoice_limit
                                  ? "bg-red-500"
                                  : usage && usage.invoice_limit !== null && usage.invoice_count / usage.invoice_limit >= 0.8
                                    ? "bg-amber-500"
                                    : "bg-primary-600"
                              }`}
                              style={{ width: `${Math.min(100, usage && usage.invoice_limit ? (usage.invoice_count / usage.invoice_limit) * 100 : 0)}%` }}
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Plan actions */}
                <div className="mt-5 pt-5 border-t border-slate-200 space-y-3">
                  {!isPro && isOwner && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                      <p className="text-sm font-semibold text-slate-900 mb-0.5">Upgrade to Pro — $50/month</p>
                      <p className="text-xs text-slate-500 mb-3">10× more invoices, team seats, and advanced exports.</p>
                      <button
                        onClick={handleUpgrade}
                        disabled={billingLoading}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition-all"
                      >
                        {billingLoading
                          ? <><Loader2 size={14} className="animate-spin" /> Redirecting…</>
                          : <>Upgrade to Pro <ArrowRight size={14} /></>}
                      </button>
                    </div>
                  )}

                  {!isPro && !isOwner && (
                    <p className="text-sm text-slate-400">Ask your workspace owner to upgrade to Pro.</p>
                  )}

                  {isPro && isOwner && (
                    <div>
                      <button
                        onClick={handleBillingPortal}
                        disabled={billingLoading}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-all disabled:opacity-60"
                      >
                        {billingLoading
                          ? <><Loader2 size={14} className="animate-spin" /> Loading…</>
                          : <><CreditCard size={14} /> {cancellationScheduled ? "Manage Cancellation" : "Manage Subscription"}</>}
                      </button>
                      <p className="text-xs text-slate-400 mt-2">Cancel or update your payment method via the Stripe portal. Canceling keeps Pro until the current billing period ends, then downgrades to Free.</p>
                    </div>
                  )}

                  {isPro && !isOwner && (
                    <p className="text-sm text-slate-400">Contact your workspace owner to manage the subscription.</p>
                  )}

                  <div className="pt-1">
                    <p className="text-sm text-slate-500 mb-2">Need unlimited invoices or custom integrations?</p>
                    <button
                      onClick={() => setSalesOpen(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-sm font-medium rounded-lg transition-all"
                    >
                      Contact Sales — Enterprise <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>

        </div>
      </main>

      <ContactSalesModal open={salesOpen} onClose={() => setSalesOpen(false)} />
    </div>
  );
}
