"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  FileText, UploadCloud, LayoutDashboard, 
  Mail, User, LogOut, ListFilter
} from "lucide-react";

interface SidebarProps {
  isDemo?: boolean;
}

export default function Sidebar({ isDemo = false }: SidebarProps) {
  const pathname = usePathname();
  
  const getHref = (path: string) => isDemo ? `/demo${path === '/dashboard' ? '' : path}` : path;
  
  const isActive = (path: string) => {
    if (isDemo) {
      if (path === '/dashboard' && pathname === '/demo') return true;
      return pathname === `/demo${path}`;
    }
    if (path === '/invoices') return pathname.startsWith('/invoices');
    return pathname === path;
  };

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Invoices", href: "/invoices", icon: ListFilter },
    { name: "Upload Invoice", href: "/upload", icon: UploadCloud },
    { name: "Email", href: "/email", icon: Mail },
  ];

  return (
    <aside className="w-64 bg-slate-900/50 border-r border-slate-800 flex flex-col hidden md:flex shrink-0">
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white font-bold">
            <FileText size={16} />
          </div>
          <span className="font-heading font-semibold text-lg text-white">
            Ledgix
          </span>
        </Link>
      </div>
      
      <div className="flex-1 py-6 px-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          return (
            <Link 
              key={item.href}
              href={getHref(item.href)} 
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
                active 
                  ? "bg-primary-600/10 text-primary-400" 
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
              }`}
            >
              <Icon size={18} /> {item.name}
            </Link>
          );
        })}
      </div>
      
      <div className="p-4 border-t border-slate-800 space-y-1">
        <Link
          href="/profile"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
            pathname === '/profile' ? "bg-primary-600/10 text-primary-400" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
          }`}
        >
          <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">
            {isDemo ? "DM" : "JD"}
          </div>
          <span className="text-sm">{isDemo ? "Demo User" : "Jane Doe"}</span>
        </Link>
        <Link href="/" className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-slate-500 hover:bg-slate-800/50 hover:text-white transition-colors text-sm">
          <LogOut size={16} /> Exit {isDemo ? "Demo" : "App"}
        </Link>
      </div>
    </aside>
  );
}
