"use client";

import { TrendingUp, Clock, ShieldCheck, Zap } from "lucide-react";

const STATS = [
  {
    value: "10x",
    label: "Faster Requirements & Test Writing",
    subtext: "Cut manual QA authoring hours to minutes",
    icon: Zap,
  },
  {
    value: "99.8%",
    label: "Traceability Coverage",
    subtext: "Zero orphaned requirements or unlinked tests",
    icon: ShieldCheck,
  },
  {
    value: "500k+",
    label: "Generated Test Suites",
    subtext: "Executed across enterprise dev pipelines",
    icon: TrendingUp,
  },
  {
    value: "< 30s",
    label: "Doc Processing Latency",
    subtext: "Instant parsing & extraction speed",
    icon: Clock,
  },
];

export function MetricsSection() {
  return (
    <section className="border-y border-hairline bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-white py-16 px-4">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 text-center">
          {STATS.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={idx}
                className="relative rounded-2xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 backdrop-blur-sm shadow-xl flex flex-col items-center hover:border-emerald-500/40 transition"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="font-display text-4xl sm:text-5xl font-black tracking-tight text-white bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="mt-2 font-display text-sm font-bold text-slate-200">
                  {stat.label}
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  {stat.subtext}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
