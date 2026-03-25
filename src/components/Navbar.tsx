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
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (pathname === '/dashboard' || pathname.startsWith('/invoices')) return null;

  const navLinks = [
    { name: "Features", href: "/features" },
    { name: "Demo", href: "/demo" },
    { name: "Pricing", href: "/pricing" },
  ];

  return (
    <header
      className={`fixed top-0 w-full z-50 transition-all duration-300 border-b ${isScrolled
        ? "bg-background/80 backdrop-blur-md border-border"
        : "bg-transparent border-transparent"
        }`}
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white font-bold group-hover:bg-primary-500 transition-colors">
            <FileText size={18} />
          </div>
          <span className="font-heading font-semibold text-lg tracking-tight">
            Ledgix Invoice<span className="text-primary-500">.ai</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className={`hover:text-white transition-colors ${pathname === link.href ? "text-white" : ""
                }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        {/* Auth Buttons */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="text-sm font-medium bg-white text-black px-4 py-2 rounded-full hover:bg-slate-200 transition-colors"
          >
            Sign up
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-slate-300 hover:text-white"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-background border-b border-border absolute w-full top-16 left-0 flex flex-col p-4 gap-4 shadow-xl">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="text-lg font-medium text-slate-300 hover:text-white"
            >
              {link.name}
            </Link>
          ))}
          <div className="h-px bg-border my-2 w-full" />
          <Link
            href="/login"
            onClick={() => setMobileMenuOpen(false)}
            className="text-lg font-medium text-slate-300 hover:text-white"
          >
            Log in
          </Link>
          <Link
            href="/register"
            onClick={() => setMobileMenuOpen(false)}
            className="text-lg font-medium bg-primary-600 text-white px-4 py-3 rounded-lg text-center hover:bg-primary-500 mt-2"
          >
            Sign up Free
          </Link>
        </div>
      )}
    </header>
  );
}
