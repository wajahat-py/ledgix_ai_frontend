"use client";

import Link from "next/link";
import { UploadCloud, MoreVertical, Bell, Search } from "lucide-react";

interface AppHeaderProps {
  title: string;
  isDemo?: boolean;
}

export default function AppHeader({ title, isDemo = false }: AppHeaderProps) {
  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-slate-800 bg-background/80 backdrop-blur-md sticky top-0 z-20 shrink-0">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold text-white">{title}</h1>
      </div>
      
      <div className="flex items-center gap-4">
        {/* Global Search Mock */}
        <div className="hidden md:flex relative w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-slate-500" />
          </div>
          <input
            type="text"
            placeholder="Search anything..."
            className="block w-full pl-9 pr-3 py-1.5 border border-slate-700 rounded-full bg-slate-900/50 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <button className="text-slate-400 hover:text-white relative">
          <Bell size={20} />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full"></span>
        </button>

        <div className="w-px h-6 bg-slate-800 mx-2 hidden sm:block"></div>

        <Link 
          href={isDemo ? "/demo/upload" : "/upload"} 
          className="hidden sm:flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-medium transition-colors"
        >
          <UploadCloud size={16} /> Process New
        </Link>
        <button className="md:hidden p-2 text-slate-400 hover:text-white">
          <MoreVertical size={20} />
        </button>
      </div>
    </header>
  );
}
