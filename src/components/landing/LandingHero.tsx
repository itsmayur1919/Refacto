"use client";

import Link from "next/link";
import { InteractiveTraceThread } from "./InteractiveTraceThread";
import { Sparkles, ArrowRight, ShieldCheck, Zap, Play, CheckCircle2 } from "lucide-react";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-paper to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 px-4 pt-12 pb-20 sm:pt-20 sm:pb-28 lg:pt-24 lg:pb-32">
      {/* Background Radial Ambient Lights */}
      <div className="pointer-events-none absolute inset-0 bg-radial-glow opacity-80" />
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-[450px] w-[800px] bg-gradient-to-r from-emerald-500/10 via-teal-500/15 to-cyan-500/10 blur-3xl rounded-full" />

      <div className="relative mx-auto max-w-5xl text-center z-10">
        {/* Top Innovation Pill */}
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 dark:bg-emerald-950/80 px-4 py-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-sm mb-6 animate-pulse-glow">
          <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Generative AI Refacto v2.0 • Autonomous Requirements & QA Platform</span>
        </div>

        {/* Main Headline */}
        <h1 className="mx-auto max-w-4xl font-display text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-6xl lg:text-7xl leading-[1.12]">
          Turn Any Document into{" "}
          <span className="bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600 dark:from-emerald-400 dark:via-teal-300 dark:to-cyan-400 bg-clip-text text-transparent">
            Tested, Fully Traceable
          </span>{" "}
          Requirements
        </h1>

        {/* Subheadline */}
        <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg lg:text-xl font-normal leading-relaxed text-slate-600 dark:text-slate-300">
          Upload PRDs, PDFs, Jira specs, or screenshots. AI instantly extracts use cases, derives testable requirements, and generates complete test suites — all bi-directionally linked.
        </p>

        {/* Action CTAs */}
        <div className="mt-10 mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-center">
          <Link
            href="/signup"
            className="group inline-flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 px-8 py-4.5 text-base font-bold text-white shadow-xl shadow-emerald-600/25 transition-all hover:shadow-2xl hover:shadow-emerald-600/35 hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Get Started Free</span>
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="#interactive-demo"
            className="inline-flex items-center justify-center gap-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-8 py-4.5 text-base font-semibold text-slate-800 dark:text-slate-100 shadow-sm transition hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-400"
          >
            <Play className="h-4 w-4 fill-slate-700 dark:fill-slate-200 text-slate-700 dark:text-slate-200" />
            <span>Watch 2-Min Demo</span>
          </Link>
        </div>

        {/* Trust Badges */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs font-medium text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span>No credit card required</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span>14-day Enterprise Trial</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>SOC-2 & ISO 27001 Certified</span>
          </div>
        </div>

        {/* Interactive Trace Thread Pipeline Visual */}
        <div className="mt-14 sm:mt-18">
          <InteractiveTraceThread />
        </div>
      </div>
    </section>
  );
}
