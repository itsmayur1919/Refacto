"use client";

import { useState } from "react";
import Link from "next/link";
import { Trash2, ArrowRight, Clock, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { TraceThread } from "./TraceThread";
import { formatDate } from "@/lib/formatDate";

interface ProjectCardData {
  id: number;
  name: string;
  status: string;
  updated_at: string;
  pipeline_stage: number;
  description?: string | null;
}

interface ProjectCardProps {
  project: ProjectCardData;
  onDelete?: (id: number) => Promise<void>;
}

const STAGE_LABELS: Record<number, string> = {
  0: "Not Started",
  1: "Document Uploaded",
  2: "Use Cases Generated",
  3: "Requirements Ready",
  4: "Test Cases Completed",
};

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleConfirmDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!onDelete) return;
    setDeleting(true);
    try {
      await onDelete(project.id);
    } catch {
      setDeleting(false);
      setConfirming(false);
    }
  }

  const stageNumber = Math.min(Math.max(project.pipeline_stage || 0, 0), 4);
  const stageLabel = STAGE_LABELS[stageNumber] || "In Progress";
  const isCompleted = stageNumber === 4;

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 shadow-sm transition-all duration-300 hover:shadow-xl hover:border-emerald-500/30 hover:-translate-y-0.5">
      <div>
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/20 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
              <FileText className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <Link
                href={`/projects/${project.id}`}
                className="font-display text-base font-bold text-slate-900 dark:text-white truncate block hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              >
                {project.name}
              </Link>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                <Clock className="h-3 w-3" />
                <span>Updated {formatDate(project.updated_at)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
            <span
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                project.status === "active"
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
              }`}
            >
              {project.status === "active" ? "Active" : "Archived"}
            </span>

            {onDelete && !confirming && (
              <button
                type="button"
                aria-label="Delete project"
                title="Delete project"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setConfirming(true);
                }}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Optional Description */}
        {project.description && (
          <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {project.description}
          </p>
        )}

        {/* Delete Confirmation Box */}
        {confirming && (
          <div
            className="mt-3 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/80 dark:bg-red-950/40 p-3.5 text-xs text-slate-800 dark:text-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-1.5 font-bold text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Delete &quot;{project.name}&quot;?</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              This will permanently delete all uploaded documents, use cases, requirements, and test cases.
            </p>
            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={deleting}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setConfirming(false);
                }}
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="rounded-lg bg-red-600 px-3 py-1 text-[11px] font-bold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        )}

        {/* Traceability Progress Stepper */}
        {!confirming && (
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center justify-between text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
              <span>Pipeline Stage</span>
              <span className={`font-bold ${isCompleted ? "text-emerald-600 dark:text-emerald-400" : "text-slate-700 dark:text-slate-300"}`}>
                {stageLabel}
              </span>
            </div>
            <TraceThread stage={project.pipeline_stage} />
          </div>
        )}
      </div>

      {/* Card Footer CTA */}
      <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
          {isCompleted ? (
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>100% Traceable</span>
            </span>
          ) : (
            <span>Stage {stageNumber}/4</span>
          )}
        </div>

        <Link
          href={`/projects/${project.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform"
        >
          <span>Open Workspace</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
