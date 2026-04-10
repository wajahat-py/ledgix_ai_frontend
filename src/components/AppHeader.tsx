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
    <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 md:px-6">
      <h1 className="truncate pr-3 text-[15px] font-semibold tracking-tight text-slate-900">{title}</h1>

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
