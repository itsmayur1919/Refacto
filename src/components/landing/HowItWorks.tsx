"use client";

import { Upload, Zap, ListChecks, CheckCircle2, FileSearch, ArrowRight, ShieldCheck, Cpu } from "lucide-react";

const STEPS = [
  {
    step: "01",
    title: "Document Ingestion & OCR",
    subtitle: "Supports PDF, DOCX, XLS, Figma, Screenshots & Scanned Documents",
    description: "Drop any PRD, architecture spec, wireframe, or raw text. Built-in OCR parses text, tables, and flow diagrams with enterprise accuracy.",
    icon: Upload,
    tag: "Multi-Format Parsing",
    bullets: ["PDF / DOCX / Image OCR", "Table & Diagram Recognition", "Automatic Versioning"],
  },
  {
    step: "02",
    title: "AI Use Case Extraction",
    subtitle: "Identifies Primary Flow, Alternate Paths & System Actors",
    description: "Generates structured Use Cases complete with preconditions, trigger conditions, main success scenarios, and exception handling paths.",
    icon: Zap,
    tag: "Autonomous Agent",
    bullets: ["Actor & System Boundaries", "Exception Path Detection", "Precondition Validation"],
  },
  {
    step: "03",
    title: "Requirement Derivation",
    subtitle: "Drafts Functional, Security & Non-Functional Requirements",
    description: "Derives atomic, testable requirements from every use case step. Eliminates ambiguity, gaps, and contradictory requirements automatically.",
    icon: ListChecks,
    tag: "Gherkin & ISO Specs",
    bullets: ["Atomic & Testable Rules", "Ambiguity Resolution", "Security & Compliance Rules"],
  },
  {
    step: "04",
    title: "Test Suite & Matrix Generation",
    subtitle: "Bi-Directionally Linked Test Cases Ready for Jira & TestRail",
    description: "Automatically writes step-by-step test cases, expected assertions, and coverage matrices linked directly to their parent requirements.",
    icon: CheckCircle2,
    tag: "100% Traceability",
    bullets: ["Full Bi-Directional Links", "Jira & TestRail Export", "Automated Coverage Score"],
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative bg-white dark:bg-slate-950 px-4 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl">
        {/* Section Title */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 px-3.5 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <Cpu className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>HOW IT WORKS</span>
          </div>
          <h2 className="mt-4 font-display text-3xl font-extrabold text-slate-900 dark:text-white sm:text-4xl lg:text-5xl leading-tight">
            Autonomous 4-Step Traceability Engine
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300">
            Transform raw engineering documentation into a fully verified chain of Use Cases, Requirements, and Test Cases in under 30 seconds.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 p-6 sm:p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/50 hover:bg-white dark:hover:bg-slate-900 hover:shadow-xl hover:shadow-emerald-500/10"
              >
                <div>
                  {/* Top Step Number Badge & Icon */}
                  <div className="flex items-center justify-between">
                    <span className="font-display text-2xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                      {item.step}
                    </span>
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500/10 to-emerald-500/20 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>

                  <span className="mt-4 inline-block rounded-md bg-emerald-100/70 dark:bg-emerald-950/70 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                    {item.tag}
                  </span>

                  <h3 className="mt-3 font-display text-lg font-bold text-slate-900 dark:text-white leading-snug">
                    {item.title}
                  </h3>

                  <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Bullets */}
                <div className="mt-6 border-t border-slate-200/80 dark:border-slate-800 pt-4 space-y-2">
                  {item.bullets.map((b, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 font-medium">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Trace Callout */}
        <div className="mt-12 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-950 p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6 border border-slate-800">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-display text-base sm:text-lg font-bold text-white">
                Guaranteed 100% Bi-Directional Traceability Matrix
              </h4>
              <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
                Every test case maps back to its parent requirement, and every requirement links to its originating source document.
              </p>
            </div>
          </div>
          <a
            href="#interactive-demo"
            className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-xs sm:text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
          >
            <span>Explore Live Matrix</span>
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
