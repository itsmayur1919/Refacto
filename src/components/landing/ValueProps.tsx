"use client";

import { Link as LinkIcon, Eye, Zap, Users, ShieldCheck, Layers, Cpu, ArrowUpRight, Database, Code2 } from "lucide-react";

const FEATURES = [
  {
    title: "100% Bi-Directional Traceability",
    description:
      "Every generated test case links back to its parent requirement, and every requirement links to its originating source spec line item. Zero orphaned requirements.",
    icon: LinkIcon,
    tag: "Audit Compliant",
  },
  {
    title: "Multi-Format Vision & OCR Engine",
    description:
      "Parse PDFs, DOCX files, Excel tables, Figma wireframe screenshots, and scanned architecture diagrams with enterprise OCR precision.",
    icon: Eye,
    tag: "OCR & Multimodal",
  },
  {
    title: "Human-in-the-Loop Governance",
    description:
      "AI drafts the initial requirements and test suites; your product and QA team reviews, tweaks, and approves with complete version control.",
    icon: Users,
    tag: "Full Team Control",
  },
  {
    title: "Automated Ambiguity & Gap Detection",
    description:
      "Refacto scans specifications for missing edge cases, contradictory business logic, and ambiguous language before development begins.",
    icon: ShieldCheck,
    tag: "Defect Prevention",
  },
  {
    title: "Native Jira & TestRail Integration",
    description:
      "Export approved requirements directly into Jira as Epics & User Stories, and test suites straight into TestRail, Xray, or Azure DevOps.",
    icon: Database,
    tag: "1-Click Sync",
  },
  {
    title: "Enterprise Data Security & Privacy",
    description:
      "SOC-2 Type II certified infrastructure. Your sensitive project specifications are never used to train public AI models.",
    icon: Code2,
    tag: "Zero-Data Retention",
  },
];

export function ValueProps() {
  return (
    <section id="features" className="relative bg-white dark:bg-slate-950 px-4 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 px-3.5 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <Cpu className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>ENTERPRISE CAPABILITIES</span>
          </div>
          <h2 className="mt-4 font-display text-3xl font-extrabold text-slate-900 dark:text-white sm:text-4xl lg:text-5xl leading-tight">
            Why Leading Engineering Teams Trust Refacto
          </h2>
          <p className="mt-3 text-base sm:text-lg text-slate-600 dark:text-slate-300">
            Built from the ground up for QA leaders, Systems Engineers, and Product Managers who demand rigor without sacrificing velocity.
          </p>
        </div>

        {/* Features Grid */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/50 hover:bg-white dark:hover:bg-slate-900 hover:shadow-xl hover:shadow-emerald-500/10"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500/10 to-emerald-500/20 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="rounded-md bg-emerald-100/70 dark:bg-emerald-950/80 px-2.5 py-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      {feature.tag}
                    </span>
                  </div>

                  <h3 className="mt-5 font-display text-lg font-bold text-slate-900 dark:text-white">
                    {feature.title}
                  </h3>

                  <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-slate-800 flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform">
                  <span>Learn more</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
