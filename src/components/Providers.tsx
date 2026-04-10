"use client";

import { SessionProvider } from "next-auth/react";
import { AuthProvider } from "@/lib/auth-context";
import { OrgProvider } from "@/lib/org-context";
import { SocketProvider } from "./SocketProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <SocketProvider>
                <AuthProvider>
                    <OrgProvider>
                        {children}
                    </OrgProvider>
                </AuthProvider>
            </SocketProvider>
        </SessionProvider>
    );
}
