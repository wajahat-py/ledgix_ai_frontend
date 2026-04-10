"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
    LayoutDashboard, FileText, UploadCloud,
    Mail, LogOut, ChevronRight, Settings, Users, CheckSquare, User,
} from "lucide-react";
import { useOrg } from "@/lib/org-context";

const PRIMARY_NAV_ITEMS = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, mobileLabel: "Home" },
    { name: "Invoices", href: "/invoices", icon: FileText, mobileLabel: "Invoices" },
    { name: "Upload", href: "/upload", icon: UploadCloud, mobileLabel: "Upload" },
    { name: "Gmail Import", href: "/email", icon: Mail, mobileLabel: "Email" },
] as const;

const SETTINGS_ITEMS = [
    { name: "Team", href: "/settings/team", icon: Users },
    { name: "Workspace", href: "/settings/workspace", icon: Settings },
] as const;

function getInitials(name: string): string {
    return name
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

function isActivePath(pathname: string, href: string): boolean {
    if (href === "/invoices") return pathname.startsWith("/invoices");
    if (href === "/settings") return pathname.startsWith("/settings");
    return pathname === href;
}

function DesktopNavLink({
    href,
    name,
    icon: Icon,
    active,
}: {
    href: string;
    name: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    active: boolean;
}) {
    return (
        <Link
            href={href}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-100 group ${
                active
                    ? "bg-primary-50 text-primary-700"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            }`}
        >
            <Icon
                size={15}
                className={active ? "text-primary-600" : "text-slate-400 group-hover:text-slate-600 transition-colors"}
            />
            <span className="flex-1">{name}</span>
            {active && <ChevronRight size={12} className="text-primary-400" />}
        </Link>
    );
}

function MobileNavLink({
    href,
    label,
    icon: Icon,
    active,
}: {
    href: string;
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    active: boolean;
}) {
    return (
        <Link
            href={href}
            className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[10px] font-medium transition-colors ${
                active ? "bg-primary-50 text-primary-700" : "text-slate-500"
            }`}
        >
            <Icon size={16} className={active ? "text-primary-600" : "text-slate-400"} />
            <span className="truncate">{label}</span>
        </Link>
    );
}

export default function Sidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();
    const { org, role, canApprove } = useOrg();

    const userName = session?.user?.name ?? "";
    const userEmail = session?.user?.email ?? "";
    const initials = userName ? getInitials(userName) : "?";
    const showApprovalQueue = canApprove || role === "owner" || role === "admin";

    return (
        <>
            <aside className="sticky top-0 hidden h-screen min-h-0 w-[220px] shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
                <div className="flex min-h-0 flex-1 flex-col">
                    <div className="flex h-14 items-center border-b border-slate-200 px-5 shrink-0">
                        <Link href="/" className="group flex items-center gap-2.5">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-900">
                                <FileText size={13} className="text-white" />
                            </div>
                            <span className="font-heading text-[15px] font-bold tracking-tight text-slate-900">Ledgix</span>
                        </Link>
                    </div>

                    {org && (
                        <div className="shrink-0 border-b border-slate-100 px-5 py-2.5">
                            <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">Workspace</p>
                            <p className="truncate text-[12px] font-medium text-slate-700">{org.name}</p>
                        </div>
                    )}

                    <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-3 py-3">
                        {PRIMARY_NAV_ITEMS.map(({ name, href, icon }) => (
                            <DesktopNavLink
                                key={href}
                                href={href}
                                name={name}
                                icon={icon}
                                active={isActivePath(pathname, href)}
                            />
                        ))}

                        {showApprovalQueue && (
                            <DesktopNavLink
                                href="/invoices/approval-queue"
                                name="Approval Queue"
                                icon={CheckSquare}
                                active={pathname === "/invoices/approval-queue"}
                            />
                        )}

                        <div className="pb-1 pt-3">
                            <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                                Settings
                            </p>
                            {SETTINGS_ITEMS.map(({ name, href, icon }) => (
                                <DesktopNavLink
                                    key={href}
                                    href={href}
                                    name={name}
                                    icon={icon}
                                    active={pathname === href}
                                />
                            ))}
                        </div>
                    </nav>

                    <div className="shrink-0 space-y-0.5 border-t border-slate-200 p-3">
                        <Link
                            href="/profile"
                            className={`group flex items-center gap-2.5 rounded-lg px-3 py-2.5 transition-all duration-100 ${
                                pathname === "/profile" ? "bg-primary-50" : "hover:bg-slate-50"
                            }`}
                        >
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-[10px] font-bold text-slate-600">
                                {initials}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className={`truncate text-[13px] font-medium leading-tight ${pathname === "/profile" ? "text-primary-700" : "text-slate-800"}`}>
                                    {userName || "Account"}
                                </p>
                                <p className="truncate text-[11px] leading-tight text-slate-400">{userEmail}</p>
                            </div>
                            {role && (
                                <span className="shrink-0 text-[9px] font-bold uppercase tracking-wide text-slate-400">
                                    {role}
                                </span>
                            )}
                        </Link>

                        <button
                            onClick={() => signOut({ callbackUrl: "/login" })}
                            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-slate-400 transition-all duration-100 hover:bg-red-50 hover:text-red-600"
                        >
                            <LogOut size={14} />
                            Sign out
                        </button>
                    </div>
                </div>
            </aside>

            <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden">
                <div className="grid grid-cols-6 gap-1 px-2 py-2">
                    {PRIMARY_NAV_ITEMS.map(({ href, icon, mobileLabel }) => (
                        <MobileNavLink
                            key={href}
                            href={href}
                            label={mobileLabel}
                            icon={icon}
                            active={isActivePath(pathname, href)}
                        />
                    ))}
                    <MobileNavLink
                        href="/profile"
                        label="Profile"
                        icon={User}
                        active={pathname === "/profile"}
                    />
                    <button
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[10px] font-medium text-slate-500 transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                        <LogOut size={16} className="text-slate-400" />
                        <span className="truncate">Sign out</span>
                    </button>
                </div>
            </div>
        </>
    );
}
