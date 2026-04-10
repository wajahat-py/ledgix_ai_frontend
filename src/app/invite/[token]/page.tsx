"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { signIn, useSession } from "next-auth/react";
import { Loader2, Users, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";
import type { PublicInvitation } from "@/types/organization";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:8000";

const ROLE_LABELS: Record<string, string> = {
    admin:  "Admin",
    member: "Member",
    viewer: "Viewer",
};

export default function InvitePage() {
    const params  = useParams();
    const router  = useRouter();
    const token   = Array.isArray(params.token) ? params.token[0] : params.token;
    const { data: session, status: sessionStatus } = useSession();

    const [invitation, setInvitation] = useState<PublicInvitation | null>(null);
    const [loadError,  setLoadError]  = useState("");
    const [accepting,  setAccepting]  = useState(false);
    const [accepted,   setAccepted]   = useState(false);
    const [acceptError, setAcceptError] = useState("");

    // Fetch invitation details
    useEffect(() => {
        if (!token) return;
        fetch(`${BACKEND_URL}/api/invitations/${token}/`)
            .then((res) => {
                if (!res.ok) throw new Error("not_found");
                return res.json();
            })
            .then((data: PublicInvitation) => setInvitation(data))
            .catch(() => setLoadError("This invitation link is invalid or has expired."));
    }, [token]);

    const handleAccept = async () => {
        if (!session?.accessToken || !token) return;
        setAccepting(true);
        setAcceptError("");
        try {
            const res = await fetch(`${BACKEND_URL}/api/invitations/${token}/accept/`, {
                method:  "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization:  `Bearer ${session.accessToken}`,
                },
            });
            const data = await res.json();
            if (!res.ok) {
                setAcceptError(data.detail ?? "Failed to accept invitation.");
                return;
            }
            setAccepted(true);
            // Give them a moment to see the success, then redirect
            setTimeout(() => router.push("/dashboard"), 2000);
        } catch {
            setAcceptError("Network error. Please try again.");
        } finally {
            setAccepting(false);
        }
    };

    // Loading
    if (!invitation && !loadError) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 size={24} className="animate-spin text-slate-400" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="sm:mx-auto sm:w-full sm:max-w-sm"
            >
                {/* Logo */}
                <div className="flex justify-center mb-6">
                    <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center">
                        <Users size={16} className="text-white" />
                    </div>
                </div>

                <div className="bg-white border border-slate-200 py-8 px-6 rounded-2xl shadow-sm">
                    {/* Invalid link */}
                    {loadError && (
                        <div className="text-center">
                            <div className="w-12 h-12 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-4">
                                <XCircle size={24} className="text-red-600" />
                            </div>
                            <p className="text-slate-900 font-semibold mb-2">Invalid Invitation</p>
                            <p className="text-slate-500 text-[13px] mb-5">{loadError}</p>
                            <Link href="/login" className="text-[13px] text-primary-600 hover:text-primary-700 font-medium">
                                Go to sign in →
                            </Link>
                        </div>
                    )}

                    {/* Expired */}
                    {invitation && invitation.is_expired && !invitation.is_pending && (
                        <div className="text-center">
                            <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4">
                                <XCircle size={24} className="text-amber-600" />
                            </div>
                            <p className="text-slate-900 font-semibold mb-2">Invitation Expired</p>
                            <p className="text-slate-500 text-[13px] mb-5">
                                This invitation to <strong>{invitation.organization_name}</strong> has expired.
                                Ask your team admin to send a new one.
                            </p>
                            <Link href="/login" className="text-[13px] text-primary-600 hover:text-primary-700 font-medium">
                                Go to sign in →
                            </Link>
                        </div>
                    )}

                    {/* Accepted state */}
                    {accepted && (
                        <div className="text-center">
                            <div className="w-12 h-12 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 size={24} className="text-green-600" />
                            </div>
                            <p className="text-slate-900 font-semibold mb-2">You're in!</p>
                            <p className="text-slate-500 text-[13px]">
                                Welcome to <strong>{invitation?.organization_name}</strong>. Redirecting to your dashboard…
                            </p>
                        </div>
                    )}

                    {/* Valid pending invitation */}
                    {invitation && invitation.is_pending && !accepted && (
                        <>
                            <div className="text-center mb-6">
                                <div className="w-12 h-12 rounded-full bg-primary-50 border border-primary-200 flex items-center justify-center mx-auto mb-4">
                                    <Users size={22} className="text-primary-600" />
                                </div>
                                <h2 className="text-slate-900 font-bold text-lg mb-1">
                                    Join {invitation.organization_name}
                                </h2>
                                <p className="text-slate-500 text-[13px] leading-relaxed">
                                    <strong className="text-slate-700">{invitation.inviter_name}</strong> has invited you
                                    as <strong className="text-slate-700">{ROLE_LABELS[invitation.role] ?? invitation.role}</strong>.
                                </p>
                                <p className="text-[12px] text-slate-400 mt-1">
                                    Invite sent to: <strong className="text-slate-600">{invitation.email}</strong>
                                </p>
                            </div>

                            {acceptError && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-[12px] text-red-700">
                                    {acceptError}
                                </div>
                            )}

                            {/* Not signed in */}
                            {sessionStatus !== "authenticated" ? (
                                <div className="space-y-3">
                                    <p className="text-center text-[13px] text-slate-500 mb-4">
                                        Sign in to accept this invitation.
                                    </p>
                                    <button
                                        onClick={() => signIn(undefined, { callbackUrl: `/invite/${token}` })}
                                        className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold transition-colors"
                                    >
                                        Sign in to accept
                                    </button>
                                    <p className="text-center text-[12px] text-slate-400">
                                        Don&apos;t have an account?{" "}
                                        <Link href={`/register?invite=${token}`} className="text-primary-600 hover:text-primary-700 font-medium">
                                            Create one
                                        </Link>
                                    </p>
                                </div>
                            ) : (
                                /* Signed in — check email match */
                                session?.user?.email?.toLowerCase() !== invitation.email.toLowerCase() ? (
                                    <div className="text-center space-y-3">
                                        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-[12px] text-amber-700">
                                            You&apos;re signed in as <strong>{session?.user?.email}</strong>, but this invite
                                            is for <strong>{invitation.email}</strong>.
                                        </div>
                                        <button
                                            onClick={() => signIn(undefined, { callbackUrl: `/invite/${token}` })}
                                            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold transition-colors"
                                        >
                                            Sign in with {invitation.email}
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={handleAccept}
                                        disabled={accepting}
                                        className="w-full flex justify-center items-center gap-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white rounded-lg text-sm font-semibold transition-colors"
                                    >
                                        {accepting
                                            ? <><Loader2 size={14} className="animate-spin" /> Joining…</>
                                            : "Accept & Join Workspace"}
                                    </button>
                                )
                            )}
                        </>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
