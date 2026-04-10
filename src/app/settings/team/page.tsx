"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    Users, Mail, Plus, Trash2, RefreshCw, ChevronDown,
    Loader2, Crown, Shield, Eye, UserCheck, AlertTriangle, X
} from "lucide-react";
import { toast } from "sonner";
import Sidebar from "@/components/Sidebar";
import AppHeader from "@/components/AppHeader";
import { api } from "@/services/api";
import { useOrg } from "@/lib/org-context";
import type { Membership, Invitation, OrgRole } from "@/types/organization";

const ROLE_CONFIG: Record<OrgRole, { label: string; icon: React.ReactNode; color: string }> = {
    owner:  { label: "Owner",  icon: <Crown  size={12} />, color: "bg-amber-50  text-amber-700  border-amber-200"  },
    admin:  { label: "Admin",  icon: <Shield size={12} />, color: "bg-blue-50   text-blue-700   border-blue-200"   },
    member: { label: "Member", icon: <UserCheck size={12} />, color: "bg-slate-100 text-slate-600 border-slate-200" },
    viewer: { label: "Viewer", icon: <Eye size={12} />,    color: "bg-slate-50  text-slate-500  border-slate-200"  },
};

const ASSIGNABLE_ROLES: OrgRole[] = ["admin", "member", "viewer"];

function RoleBadge({ role }: { role: OrgRole }) {
    const cfg = ROLE_CONFIG[role];
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${cfg.color}`}>
            {cfg.icon} {cfg.label}
        </span>
    );
}

// ── Remove confirm modal ──────────────────────────────────────────────────────

function RemoveConfirmModal({
    name, onConfirm, onCancel, loading,
}: {
    name: string; onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
    const overlayRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const h = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
        window.addEventListener("keydown", h);
        return () => window.removeEventListener("keydown", h);
    }, [onCancel]);

    return (
        <AnimatePresence>
            <motion.div
                ref={overlayRef}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
                onClick={(e) => { if (e.target === overlayRef.current) onCancel(); }}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 8 }}
                    className="bg-white border border-slate-200 rounded-2xl p-6 w-full max-w-sm shadow-xl"
                >
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-red-50 border border-red-200 flex items-center justify-center">
                            <AlertTriangle size={18} className="text-red-600" />
                        </div>
                        <div>
                            <p className="text-slate-900 font-semibold text-sm">Remove Member</p>
                            <p className="text-xs text-slate-500 mt-0.5">They will lose access immediately.</p>
                        </div>
                    </div>
                    <p className="text-sm text-slate-600 mb-6">
                        Remove <span className="font-medium text-slate-900">{name}</span> from the workspace?
                    </p>
                    <div className="flex gap-3">
                        <button onClick={onCancel} disabled={loading} className="flex-1 py-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-sm text-slate-700 transition-colors disabled:opacity-50">
                            Cancel
                        </button>
                        <button onClick={onConfirm} disabled={loading} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-sm text-white font-semibold transition-colors disabled:opacity-50">
                            {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                            {loading ? "Removing…" : "Remove"}
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

// ── main component ────────────────────────────────────────────────────────────

export default function TeamPage() {
    const { org, membership: myMembership, canInvite, isLoading: orgLoading, refresh: refreshOrg } = useOrg();

    const [members,     setMembers]     = useState<Membership[]>([]);
    const [invitations, setInvitations] = useState<Invitation[]>([]);
    const [loading,     setLoading]     = useState(true);

    // Invite form
    const [inviteEmail, setInviteEmail]   = useState("");
    const [inviteRole,  setInviteRole]    = useState<OrgRole>("member");
    const [inviteError, setInviteError]   = useState("");
    const [inviting,    setInviting]      = useState(false);

    // Remove confirm
    const [removeTarget, setRemoveTarget] = useState<Membership | null>(null);
    const [removing,     setRemoving]     = useState(false);

    // Role change loading
    const [changingRole, setChangingRole] = useState<number | null>(null);

    const isAdminPlus = myMembership?.role === "owner" || myMembership?.role === "admin";

    const load = async () => {
        if (!org) return;
        setLoading(true);
        try {
            const [membersRes, invitesRes] = await Promise.all([
                api.get<Membership[]>(`/api/orgs/${org.id}/members/`),
                isAdminPlus ? api.get<Invitation[]>(`/api/orgs/${org.id}/invitations/`) : Promise.resolve({ data: [] }),
            ]);
            setMembers(membersRes.data);
            setInvitations(invitesRes.data as Invitation[]);
        } catch {
            toast.error("Failed to load team data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!orgLoading && org) load();
    }, [org?.id, orgLoading]);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        const email = inviteEmail.trim();
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setInviteError("Please enter a valid email address.");
            return;
        }
        if (!org) return;

        setInviting(true);
        setInviteError("");
        try {
            await api.post(`/api/orgs/${org.id}/invitations/`, { email, role: inviteRole });
            toast.success(`Invitation sent to ${email}.`);
            setInviteEmail("");
            await load();
        } catch (err: unknown) {
            const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
            if (detail?.includes("seat_limit_exceeded") || (err as { response?: { data?: { code?: string } } })?.response?.data?.code === "seat_limit_exceeded") {
                setInviteError("Seat limit reached. Upgrade your plan to invite more members.");
            } else {
                setInviteError(detail ?? "Failed to send invitation.");
            }
        } finally {
            setInviting(false);
        }
    };

    const handleRevokeInvite = async (invId: number) => {
        if (!org) return;
        try {
            await api.delete(`/api/orgs/${org.id}/invitations/${invId}/`);
            toast.success("Invitation revoked.");
            setInvitations((prev) => prev.filter((i) => i.id !== invId));
        } catch {
            toast.error("Failed to revoke invitation.");
        }
    };

    const handleResendInvite = async (invId: number) => {
        if (!org) return;
        try {
            await api.post(`/api/orgs/${org.id}/invitations/${invId}/resend/`, {});
            toast.success("Invitation resent.");
        } catch {
            toast.error("Failed to resend invitation.");
        }
    };

    const handleRoleChange = async (membershipId: number, newRole: OrgRole) => {
        if (!org) return;
        setChangingRole(membershipId);
        try {
            await api.patch(`/api/orgs/${org.id}/members/${membershipId}/`, { role: newRole });
            setMembers((prev) => prev.map((m) => m.id === membershipId ? { ...m, role: newRole } : m));
            toast.success("Role updated.");
        } catch (err: unknown) {
            const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
            toast.error(detail ?? "Failed to update role.");
        } finally {
            setChangingRole(null);
        }
    };

    const handleRemove = async () => {
        if (!org || !removeTarget) return;
        setRemoving(true);
        try {
            await api.delete(`/api/orgs/${org.id}/members/${removeTarget.id}/`);
            setMembers((prev) => prev.filter((m) => m.id !== removeTarget.id));
            setRemoveTarget(null);
            toast.success(`${removeTarget.user.full_name || removeTarget.user.email} removed.`);
            refreshOrg();
        } catch (err: unknown) {
            const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
            toast.error(detail ?? "Failed to remove member.");
        } finally {
            setRemoving(false);
        }
    };

    return (
        <>
            {removeTarget && (
                <RemoveConfirmModal
                    name={removeTarget.user.full_name || removeTarget.user.email}
                    onConfirm={handleRemove}
                    onCancel={() => !removing && setRemoveTarget(null)}
                    loading={removing}
                />
            )}

            <div className="min-h-screen bg-slate-50 flex">
                <Sidebar />
                <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
                    <AppHeader title="Team" />

                    <div className="flex-1 overflow-auto p-4 pb-24 md:p-6 md:pb-6 lg:p-8 space-y-6 max-w-3xl">

                        {/* Invite form — admins / owners only */}
                        {canInvite && (
                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white border border-slate-200 rounded-xl p-6"
                            >
                                <h2 className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                                    <Plus size={13} /> Invite Member
                                </h2>
                                <form onSubmit={handleInvite} noValidate className="flex flex-col sm:flex-row gap-3">
                                    <div className="flex-1">
                                        <div className="relative">
                                            <Mail size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${inviteError ? "text-red-400" : "text-slate-400"}`} />
                                            <input
                                                type="email"
                                                placeholder="colleague@company.com"
                                                value={inviteEmail}
                                                onChange={(e) => { setInviteEmail(e.target.value); setInviteError(""); }}
                                                className={`w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all ${
                                                    inviteError ? "border-red-400 focus:ring-red-500" : "border-slate-200 focus:ring-primary-500"
                                                }`}
                                            />
                                        </div>
                                        {inviteError && <p className="mt-1 text-[11px] text-red-600">{inviteError}</p>}
                                    </div>

                                    <div className="relative shrink-0">
                                        <select
                                            value={inviteRole}
                                            onChange={(e) => setInviteRole(e.target.value as OrgRole)}
                                            className="appearance-none pl-3 pr-7 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
                                        >
                                            {ASSIGNABLE_ROLES.map((r) => (
                                                <option key={r} value={r}>{ROLE_CONFIG[r].label}</option>
                                            ))}
                                        </select>
                                        <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={inviting}
                                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-all shrink-0"
                                    >
                                        {inviting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                                        {inviting ? "Sending…" : "Send Invite"}
                                    </button>
                                </form>
                            </motion.div>
                        )}

                        {/* Members table */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.04 }}
                            className="bg-white border border-slate-200 rounded-xl"
                        >
                            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                                <h2 className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Users size={13} /> Members
                                </h2>
                                <span className="text-[12px] text-slate-400">{members.length} member{members.length !== 1 ? "s" : ""}</span>
                            </div>

                            {loading ? (
                                <div className="flex items-center justify-center gap-2 py-12 text-slate-400 text-sm">
                                    <Loader2 size={16} className="animate-spin" /> Loading…
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-100">
                                    {members.map((m) => {
                                        const isMe    = myMembership?.id === m.id;
                                        const canEdit = isAdminPlus && !isMe && m.role !== "owner";
                                        return (
                                            <div key={m.id} className="flex items-center gap-3 px-5 py-3.5">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[11px] font-bold text-slate-600 shrink-0">
                                                    {(m.user.full_name || m.user.email)[0].toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-[13px] font-medium text-slate-900 truncate">
                                                            {m.user.full_name || m.user.email}
                                                        </p>
                                                        {isMe && <span className="text-[10px] text-slate-400">(you)</span>}
                                                    </div>
                                                    <p className="text-[11px] text-slate-400 truncate">{m.user.email}</p>
                                                </div>

                                                {/* Role selector (admins can change roles) */}
                                                {canEdit ? (
                                                    <div className="relative shrink-0">
                                                        {changingRole === m.id ? (
                                                            <Loader2 size={14} className="animate-spin text-slate-400" />
                                                        ) : (
                                                            <>
                                                                <select
                                                                    value={m.role}
                                                                    onChange={(e) => handleRoleChange(m.id, e.target.value as OrgRole)}
                                                                    className="appearance-none pl-2 pr-6 py-1 border border-slate-200 rounded-lg text-[12px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary-500 bg-white"
                                                                >
                                                                    {ASSIGNABLE_ROLES.map((r) => (
                                                                        <option key={r} value={r}>{ROLE_CONFIG[r].label}</option>
                                                                    ))}
                                                                </select>
                                                                <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                                            </>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <RoleBadge role={m.role} />
                                                )}

                                                {/* Remove button */}
                                                {isAdminPlus && !isMe && m.role !== "owner" && (
                                                    <button
                                                        onClick={() => setRemoveTarget(m)}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
                                                        title="Remove member"
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </motion.div>

                        {/* Pending invitations */}
                        {isAdminPlus && invitations.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.08 }}
                                className="bg-white border border-slate-200 rounded-xl"
                            >
                                <div className="px-5 py-3.5 border-b border-slate-100">
                                    <h2 className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Mail size={13} /> Pending Invitations
                                    </h2>
                                </div>
                                <div className="divide-y divide-slate-100">
                                    {invitations.map((inv) => (
                                        <div key={inv.id} className="flex items-center gap-3 px-5 py-3">
                                            <Mail size={14} className="text-slate-400 shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[13px] text-slate-900 truncate">{inv.email}</p>
                                                <p className="text-[11px] text-slate-400">
                                                    Invited as {ROLE_CONFIG[inv.role]?.label} · Expires {new Date(inv.expires_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <button
                                                    onClick={() => handleResendInvite(inv.id)}
                                                    className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-lg transition-colors"
                                                    title="Resend"
                                                >
                                                    <RefreshCw size={11} /> Resend
                                                </button>
                                                <button
                                                    onClick={() => handleRevokeInvite(inv.id)}
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                    title="Revoke"
                                                >
                                                    <X size={13} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                    </div>
                </main>
            </div>
        </>
    );
}
