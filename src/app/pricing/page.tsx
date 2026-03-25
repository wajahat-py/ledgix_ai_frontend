"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Check, ArrowRight, Zap, Building2 } from "lucide-react";

export default function PricingPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-32">
      <div className="container mx-auto px-4 relative z-10">

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-20">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-5">
            Simple, transparent pricing
          </h1>
          <p className="text-lg text-slate-400">
            Start for free. Scale when you're ready.
          </p>
        </div>

        {/* Pricing Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto"
        >
          {/* Free Plan */}
          <motion.div
            variants={itemVariants}
            className="bg-slate-900/60 border border-primary-500/40 rounded-3xl p-8 flex flex-col relative overflow-hidden shadow-[0_0_30px_rgba(63,191,155,0.08)]"
          >
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary-500/50 to-transparent"></div>

            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary-500/10 text-primary-400 flex items-center justify-center">
                  <Zap size={20} />
                </div>
                <h3 className="text-xl font-bold text-white">Free</h3>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">Get started with automated invoice processing.</p>
            </div>

            <ul className="space-y-4 mb-10 flex-1">
              {[
                "Up to 50 invoices per month",
                "Invoice data extraction",
                "Line-item extraction",
                "Manual upload",
                "CSV export",
                "Basic approval step (approve / reject)",
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                  <Check size={17} className="text-primary-400 shrink-0 mt-0.5" />
                  {feature}
                </li>
              ))}
            </ul>

            <Link
              href="/register"
              className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-500 text-white text-center font-medium rounded-xl transition-all hover:-translate-y-0.5 shadow-lg shadow-primary-500/20 flex items-center justify-center gap-2"
            >
              Get Started Free <ArrowRight size={16} />
            </Link>
          </motion.div>

          {/* Enterprise Plan */}
          <motion.div
            variants={itemVariants}
            className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 flex flex-col relative overflow-hidden"
          >
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-400 flex items-center justify-center">
                  <Building2 size={20} />
                </div>
                <h3 className="text-xl font-bold text-white">Enterprise</h3>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">For teams processing high volumes of invoices.</p>
            </div>

            <ul className="space-y-4 mb-10 flex-1">
              {[
                "Unlimited invoices",
                "Priority support",
                "Custom integrations",
                "Advanced workflows",
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                  <Check size={17} className="text-slate-400 shrink-0 mt-0.5" />
                  {feature}
                </li>
              ))}
            </ul>

            <a
              href="mailto:hello@ledgix.app"
              className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-center font-medium rounded-xl transition-all flex items-center justify-center gap-2"
            >
              Contact Sales <ArrowRight size={16} />
            </a>
          </motion.div>
        </motion.div>



      </div>
    </div>
  );
}
