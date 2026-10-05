import React from "react";

const STYLES: Record<string, { bg: string; dot: string; text: string }> = {
  completed: {
    bg: "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800",
    dot: "bg-emerald-500",
    text: "text-emerald-700 dark:text-emerald-300",
  },
  approved: {
    bg: "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800",
    dot: "bg-emerald-500",
    text: "text-emerald-700 dark:text-emerald-300",
  },
  processing: {
    bg: "bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800",
    dot: "bg-amber-500 animate-pulse",
    text: "text-amber-700 dark:text-amber-300",
  },
  pending: {
    bg: "bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800",
    dot: "bg-amber-500 animate-pulse",
    text: "text-amber-700 dark:text-amber-300",
  },
  queued: {
    bg: "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700",
    dot: "bg-slate-400",
    text: "text-slate-600 dark:text-slate-400",
  },
  uploading: {
    bg: "bg-teal-50 dark:bg-teal-950/60 border-teal-200 dark:border-teal-800",
    dot: "bg-teal-500 animate-ping",
    text: "text-teal-700 dark:text-teal-300",
  },
  draft: {
    bg: "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700",
    dot: "bg-slate-400",
    text: "text-slate-600 dark:text-slate-400",
  },
  failed: {
    bg: "bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-800",
    dot: "bg-red-500",
    text: "text-red-700 dark:text-red-300",
  },
  rejected: {
    bg: "bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-800",
    dot: "bg-red-500",
    text: "text-red-700 dark:text-red-300",
  },
  high: {
    bg: "bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-800",
    dot: "bg-red-500",
    text: "text-red-700 dark:text-red-300",
  },
  medium: {
    bg: "bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800",
    dot: "bg-amber-500",
    text: "text-amber-700 dark:text-amber-300",
  },
  low: {
    bg: "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700",
    dot: "bg-slate-400",
    text: "text-slate-600 dark:text-slate-400",
  },
};

export function StatusBadge({ value }: { value: string }) {
  const normalizedKey = (value || "draft").toLowerCase();
  const style = STYLES[normalizedKey] || STYLES.draft;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold capitalize transition-all ${style.bg} ${style.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      <span>{value.replace("_", " ")}</span>
    </span>
  );
}
