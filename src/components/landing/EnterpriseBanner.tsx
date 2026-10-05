"use client";

import { Layers, Workflow, CheckCircle, Shield, Cpu, RefreshCw } from "lucide-react";

const INTEGRATIONS = [
  { name: "Atlassian Jira", tag: "Native Sync" },
  { name: "Confluence", tag: "Auto Specs" },
  { name: "Azure DevOps", tag: "Work Items" },
  { name: "TestRail", tag: "Test Suites" },
  { name: "GitHub Enterprise", tag: "CI/CD Actions" },
  { name: "GitLab QA", tag: "Pipeline Sync" },
];

export function EnterpriseBanner() {
  return (
    <section className="border-y border-hairline bg-white/50 dark:bg-slate-900/50 py-10 px-4">
      <div className="mx-auto max-w-7xl">
        <p className="text-center font-display text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          Seamlessly Integrated with Enterprise Toolchains
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 sm:gap-8">
          {INTEGRATIONS.map((item) => (
            <div
              key={item.name}
              className="flex items-center gap-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2.5 shadow-sm transition hover:border-emerald-500/50 hover:shadow-md"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <Workflow className="h-4 w-4" />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-display text-xs font-bold text-slate-800 dark:text-slate-200">
                  {item.name}
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  {item.tag}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
