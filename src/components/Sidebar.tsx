"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
    LayoutDashboard, FileText, UploadCloud,
    Mail, LogOut, ChevronRight,
} from "lucide-react";

const NAV_ITEMS = [
    { name: "Dashboard",    href: "/dashboard", icon: LayoutDashboard },
    { name: "Invoices",     href: "/invoices",  icon: FileText },
    { name: "Upload",       href: "/upload",    icon: UploadCloud },
    { name: "Gmail Import", href: "/email",     icon: Mail },
];

function getInitials(name: string): string {
    return name
        .split(" ")
        .filter(Boolean)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

export default function Sidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();

    const userName  = session?.user?.name  ?? "";
    const userEmail = session?.user?.email ?? "";
    const initials  = userName ? getInitials(userName) : "?";

    const isActive = (href: string) =>
        href === "/invoices" ? pathname.startsWith("/invoices") : pathname === href;

    return (
        <aside className="w-[220px] bg-white border-r border-slate-200 flex-col hidden md:flex shrink-0">
            {/* Logo */}
            <div className="h-14 flex items-center px-5 border-b border-slate-200 shrink-0">
                <Link href="/" className="flex items-center gap-2.5 group">
                    <div className="w-7 h-7 rounded-md bg-slate-900 flex items-center justify-center shrink-0">
                        <FileText size={13} className="text-white" />
                    </div>
                    <span className="font-heading font-bold text-[15px] text-slate-900 tracking-tight">Ledgix</span>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
                <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                    Workspace
                </p>
                {NAV_ITEMS.map(({ name, href, icon: Icon }) => {
                    const active = isActive(href);
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-100 group ${
                                active
                                    ? "bg-primary-50 text-primary-700"
                                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                            }`}
                        >
                            <Icon
                                size={15}
                                className={
                                    active
                                        ? "text-primary-600"
                                        : "text-slate-400 group-hover:text-slate-600 transition-colors"
                                }
                            />
                            <span className="flex-1">{name}</span>
                            {active && <ChevronRight size={12} className="text-primary-400" />}
                        </Link>
                    );
                })}
            </nav>

            {/* User section */}
            <div className="p-3 border-t border-slate-200 shrink-0 space-y-0.5">
                <Link
                    href="/profile"
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-all duration-100 group ${
                        pathname === "/profile"
                            ? "bg-primary-50"
                            : "hover:bg-slate-50"
                    }`}
                >
                    <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0">
                        {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className={`text-[13px] font-medium truncate leading-tight ${pathname === "/profile" ? "text-primary-700" : "text-slate-800"}`}>
                            {userName || "Account"}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate leading-tight">{userEmail}</p>
                    </div>
                </Link>

                <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="flex items-center gap-2.5 px-3 py-2 w-full rounded-lg text-[13px] text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all duration-100"
                >
                    <LogOut size={14} />
                    Sign out
                </button>
            </div>
        </aside>
    );
}
