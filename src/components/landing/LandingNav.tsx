"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, Menu, X, ArrowRight, Layers, ShieldCheck, ChevronRight } from "lucide-react";

export function LandingNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/90 dark:bg-slate-950/90 backdrop-blur-md shadow-sm border-b border-hairline"
          : "bg-paper/80 dark:bg-slate-950/80 backdrop-blur-sm border-b border-hairline/60"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-18 items-center justify-between py-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Layers className="h-5.5 w-5.5 text-white" />
              <div className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-400 border-2 border-white dark:border-slate-950">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              </div>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                  Refacto
                </span>
                <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  AI v2.0
                </span>
              </div>
              <span className="text-[11px] text-muted -mt-0.5">Generative Requirements Platform</span>
            </div>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex md:items-center md:gap-8">
            <Link
              href="#how-it-works"
              className="text-sm font-medium text-slate-600 dark:text-slate-300 transition hover:text-emerald-600 dark:hover:text-emerald-400"
            >
              How It Works
            </Link>
            <Link
              href="#features"
              className="text-sm font-medium text-slate-600 dark:text-slate-300 transition hover:text-emerald-600 dark:hover:text-emerald-400"
            >
              Features
            </Link>
            <Link
              href="#interactive-demo"
              className="text-sm font-medium text-slate-600 dark:text-slate-300 transition hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1"
            >
              <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
              Live Demo
            </Link>
            <Link
              href="#pricing"
              className="text-sm font-medium text-slate-600 dark:text-slate-300 transition hover:text-emerald-600 dark:hover:text-emerald-400"
            >
              Pricing
            </Link>
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex md:items-center md:gap-3">
            <Link
              href="/login"
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 transition hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-600/20 transition-all hover:shadow-lg hover:shadow-emerald-600/30 hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Get Started Free</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-xl p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile menu drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-hairline py-4 space-y-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg px-3 my-2 rounded-b-2xl shadow-xl">
            <Link
              href="#how-it-works"
              className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => setMobileMenuOpen(false)}
            >
              How It Works
            </Link>
            <Link
              href="#features"
              className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </Link>
            <Link
              href="#interactive-demo"
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Sparkles className="h-4 w-4 text-emerald-500" />
              Live Demo
            </Link>
            <Link
              href="#pricing"
              className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </Link>
            <div className="pt-3 flex flex-col gap-2.5 border-t border-hairline my-2">
              <Link
                href="/login"
                className="w-full rounded-xl border border-hairline py-3 text-center text-sm font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="flex items-center justify-center gap-2 w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3.5 px-4 text-center text-sm font-bold text-white shadow-md my-1"
                onClick={() => setMobileMenuOpen(false)}
              >
                <span>Get Started Free</span>
                <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
