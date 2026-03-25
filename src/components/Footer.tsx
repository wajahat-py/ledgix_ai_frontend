"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, ArrowRight, Zap } from "lucide-react";

export default function Footer() {
  const pathname = usePathname();
  if (pathname === '/dashboard' || pathname.startsWith('/invoices')) return null;
  return (
    <footer className="bg-background border-t border-border pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl flex flex-col md:flex-row items-start justify-between gap-12 mb-12">
          {/* Brand & CTA */}
          <div className="max-w-sm">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white">
                <FileText size={18} />
              </div>
              <span className="font-heading font-semibold text-xl tracking-tight text-white">
                Ledgix
              </span>
            </Link>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              AI-powered invoice automation for accounting firms, freelancers, and finance teams.
            </p>
            <div className="flex gap-3">
              <Link
                href="/register"
                className="px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white text-sm font-medium rounded-lg transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(63,191,155,0.2)]"
              >
                Get Started <ArrowRight size={15} />
              </Link>
              <Link
                href="/demo"
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-lg transition-all border border-slate-700 flex items-center gap-2"
              >
                <Zap size={15} className="text-primary-400" /> Try Demo
              </Link>
            </div>
          </div>

          {/* Nav Links */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Product</h3>
            <ul className="flex flex-col gap-3 text-sm text-slate-400">
              <li><Link href="/features" className="hover:text-white transition-colors">Features</Link></li>
              <li><Link href="/demo" className="hover:text-white transition-colors">Interactive Demo</Link></li>
              <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Ledgix. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
