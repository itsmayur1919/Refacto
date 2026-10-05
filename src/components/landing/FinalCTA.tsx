"use client";

import Link from "next/link";
import { Sparkles, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden bg-white dark:bg-slate-950 px-4 py-20 sm:py-28">
      <div className="mx-auto max-w-5xl">
        <div className="relative rounded-3xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-950 p-8 sm:p-14 text-center text-white shadow-2xl overflow-hidden border border-slate-800">
          {/* Subtle Ambient Glow */}
          <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-[350px] w-[600px] bg-emerald-500/15 blur-3xl rounded-full" />

          <div className="relative z-10 mx-auto max-w-3xl">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3.5 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/20 mb-4">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              <span>READY TO TRANSFORM YOUR QA WORKFLOW?</span>
            </div>

            <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl leading-tight">
              Stop Writing Requirements by Hand. <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                Automate Traceability Today.
              </span>
            </h2>

            <p className="mt-4 text-base sm:text-lg text-slate-300">
              Join thousands of engineers and product managers shipping high-quality software faster with AI-generated, traceable artifacts.
            </p>

            <div className="mt-9 mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-center">
              <Link
                href="/signup"
                className="group inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-8 py-4.5 text-base font-bold text-slate-950 shadow-xl shadow-emerald-500/20 transition-all hover:bg-emerald-400 hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Get Started Free</span>
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2.5 rounded-2xl border border-slate-700 bg-slate-900/80 px-8 py-4.5 text-base font-semibold text-white transition hover:bg-slate-800"
              >
                <span>Sign In to Portal</span>
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-medium">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>Instant Setup in 2 Minutes</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                <span>No Credit Card Required</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>SOC-2 Type II Certified</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
