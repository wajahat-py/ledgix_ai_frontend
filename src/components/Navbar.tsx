"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Menu, X } from "lucide-react";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const APP_ROUTES = ["/dashboard", "/invoices", "/upload", "/email", "/profile"];
  if (APP_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`))) return null;

  const navLinks = [
    { name: "Features", href: "/features" },
    { name: "Pricing",  href: "/pricing"  },
    { name: "Demo",     href: "/demo"     },
  ];

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-200 ${
        isScrolled
          ? "bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-[0_1px_0_rgba(0,0,0,0.04)]"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-md bg-slate-900 flex items-center justify-center">
            <FileText size={13} className="text-white" />
          </div>
          <span className="font-heading font-bold text-[15px] tracking-tight text-slate-900">
            Ledgix
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`text-[13px] font-medium transition-colors ${
                pathname === link.href
                  ? "text-slate-900"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Auth buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="text-[13px] font-medium text-slate-500 hover:text-slate-900 transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="text-[13px] font-semibold bg-slate-900 text-white px-4 py-1.5 rounded-full hover:bg-slate-800 transition-colors"
          >
            Get started free
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-1.5 text-slate-500 hover:text-slate-900 transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 absolute w-full top-16 left-0 flex flex-col p-4 gap-1 shadow-lg">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="text-[15px] font-medium text-slate-600 hover:text-slate-900 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors"
            >
              {link.name}
            </Link>
          ))}
          <div className="h-px bg-slate-200 my-2" />
          <Link
            href="/login"
            onClick={() => setMobileMenuOpen(false)}
            className="text-[15px] font-medium text-slate-600 hover:text-slate-900 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/register"
            onClick={() => setMobileMenuOpen(false)}
            className="text-[15px] font-semibold bg-slate-900 text-white px-4 py-3 rounded-xl text-center hover:bg-slate-800 transition-colors mt-1"
          >
            Get started free
          </Link>
        </div>
      )}
    </header>
  );
}
