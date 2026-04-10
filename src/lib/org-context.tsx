"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { orgStore } from "@/lib/org-store";
import { api } from "@/services/api";
import type { Organization, MyMembership, OrgRole } from "@/types/organization";

interface OrgContextValue {
    org:          Organization | null;
    membership:   MyMembership | null;
    role:         OrgRole | null;
    canUpload:    boolean;
    canApprove:   boolean;
    canDeleteAny: boolean;
    canInvite:    boolean;
    isLoading:    boolean;
    refresh:      () => Promise<void>;
}

const noopRefresh = async () => {};

const OrgContext = createContext<OrgContextValue>({
    org: null,
    membership: null,
    role: null,
    canUpload: false,
    canApprove: false,
    canDeleteAny: false,
    canInvite: false,
    isLoading: true,
    refresh: noopRefresh,
});

function derivePerms(role: OrgRole | null, membership: MyMembership | null) {
    if (!role) return { canUpload: false, canApprove: false, canDeleteAny: false, canInvite: false };
    return {
        canUpload: ["owner", "admin", "member"].includes(role),
        canApprove: ["owner", "admin"].includes(role) || (role === "member" && !!membership?.can_approve),
        canDeleteAny: ["owner", "admin"].includes(role),
        canInvite: ["owner", "admin"].includes(role),
    };
}

export function OrgProvider({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const [org, setOrg] = useState<Organization | null>(null);
    const [membership, setMembership] = useState<MyMembership | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const clearOrgState = useCallback(() => {
        setOrg(null);
        setMembership(null);
        orgStore.set(null);
    }, []);

    const refresh = useCallback(async () => {
        if (!session?.accessToken) {
            clearOrgState();
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const res = await api.get("/api/auth/me/");
            const data = res.data;
            const nextOrg = data.organization ?? null;
            const nextMembership = data.membership ?? null;

            setOrg(nextOrg);
            setMembership(nextMembership);
            orgStore.set(nextOrg?.id ?? null);
        } catch {
            clearOrgState();
        } finally {
            setIsLoading(false);
        }
    }, [clearOrgState, session?.accessToken]);

    useEffect(() => {
        if (status === "loading") return;
        void refresh();
    }, [refresh, status]);

    const role = membership?.role ?? null;
    const perms = derivePerms(role, membership);

    return (
        <OrgContext.Provider value={{ org, membership, role, isLoading, refresh, ...perms }}>
            {children}
        </OrgContext.Provider>
    );
}

export function useOrg() {
    return useContext(OrgContext);
}
