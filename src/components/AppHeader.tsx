"use client";

import Link from "next/link";
import { UploadCloud } from "lucide-react";
import { NotificationBell } from "./NotificationBell";

interface AppHeaderProps {
  title: string;
  isDemo?: boolean;
}

export default function AppHeader({ title, isDemo = false }: AppHeaderProps) {
  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-slate-200 bg-white sticky top-0 z-20 shrink-0">
      <h1 className="text-[15px] font-semibold text-slate-900 tracking-tight">{title}</h1>

      <div className="flex items-center gap-2">
        <NotificationBell />
        <Link
          href={isDemo ? "/demo/upload" : "/upload"}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[13px] font-medium transition-colors"
        >
          <UploadCloud size={14} />
          New Invoice
        </Link>
      </div>
    </header>
  );
}
