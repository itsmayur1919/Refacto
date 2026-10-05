"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Bot,
  Send,
  Trash2,
  Loader2,
  User as UserIcon,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Zap,
  FileText,
  CheckSquare,
  FlaskConical,
  Copy,
  Check,
  Play,
  MessageSquare,
  StopCircle,
  RotateCcw,
  ShieldCheck,
  Clock,
  Layers,
  ChevronRight,
} from "lucide-react";
import { api } from "@/lib/api";
import type { ChatMessage, CopilotAction, ChatPrimerResponse, AgentRun, AgentRunStep } from "@/lib/types";
import { formatDateTime } from "@/lib/formatDate";

type InputMode = "ask" | "run";

/* ─────────────────────────────────────────────────────────────
   Tool Icon & Label Resolver
───────────────────────────────────────────────────────────── */
function getToolMetadata(toolName: string, rawLabel?: string) {
  switch (toolName) {
    case "extract_file_metadata":
      return {
        icon: FileText,
        label: rawLabel || "Extracting specification document metadata",
        color: "text-blue-500",
      };
    case "generate_use_cases":
      return {
        icon: Sparkles,
        label: rawLabel || "Deriving Use Cases from specification document",
        color: "text-emerald-500",
      };
    case "generate_requirements":
      return {
        icon: CheckSquare,
        label: rawLabel || "Generating requirements for derived use cases",
        color: "text-teal-500",
      };
    case "generate_test_cases":
      return {
        icon: FlaskConical,
        label: rawLabel || "Generating executable test suites",
        color: "text-indigo-500",
      };
    case "delete_project":
    case "update_entity_status":
      return {
        icon: AlertTriangle,
        label: rawLabel || "Destructive Action Pause",
        color: "text-red-500",
      };
    case "mark_goal_complete":
      return {
        icon: ShieldCheck,
        label: rawLabel || "Finalizing project traceability matrix",
        color: "text-emerald-600",
      };
    default:
      return {
        icon: Zap,
        label: rawLabel || toolName,
        color: "text-slate-500",
      };
  }
}

/* ─────────────────────────────────────────────────────────────
   Minimal Markdown renderer with Code Copy
───────────────────────────────────────────────────────────── */
function MarkdownRenderer({ text }: { text: string }) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (!text) return null;

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const lines = text.split("\n");
  return (
    <div className="space-y-1 text-xs sm:text-sm leading-relaxed">
      {lines.map((line, li) => {
        const parts: React.ReactNode[] = [];
        let cursor = 0;
        let key = 0;

        const isBullet = /^\s*[•\-]\s+/.test(line);
        const displayLine = isBullet ? line.replace(/^\s*[•\-]\s+/, "") : line;

        const re = /(\*\*(.+?)\*\*|`([^`]+)`)/g;
        let m: RegExpExecArray | null;

        while ((m = re.exec(displayLine)) !== null) {
          if (m.index > cursor) {
            parts.push(displayLine.slice(cursor, m.index));
          }
          if (m[0].startsWith("**")) {
            parts.push(
              <strong key={key++} className="font-bold text-slate-900 dark:text-white">
                {m[2]}
              </strong>
            );
          } else {
            const codeText = m[3];
            parts.push(
              <code
                key={key++}
                onClick={() => copyCode(codeText)}
                className="group relative inline-flex items-center gap-1 cursor-pointer rounded-lg bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 font-mono text-[11px] text-emerald-600 dark:text-emerald-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                <span>{codeText}</span>
                {copiedCode === codeText ? (
                  <Check className="h-3 w-3 text-emerald-500 inline" />
                ) : (
                  <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 text-slate-400 inline" />
                )}
              </code>
            );
          }
          cursor = m.index + m[0].length;
        }
        if (cursor < displayLine.length) parts.push(displayLine.slice(cursor));

        const content = parts.length ? parts : [displayLine];

        return isBullet ? (
          <li key={li} className="ml-4 list-disc marker:text-emerald-500">
            {content}
          </li>
        ) : (
          <p key={li}>{content}</p>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Copilot Action Card (For single chat messages)
───────────────────────────────────────────────────────────── */
function ActionCard({
  action,
  projectId,
  onActionComplete,
}: {
  action: CopilotAction;
  projectId: number;
  onActionComplete: () => void;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<CopilotAction["status"]>(action.status || "requires_confirmation");
  const [executing, setExecuting] = useState(false);
  const [message, setMessage] = useState(action.message || "");

  const isDestructive =
    action.tool_name === "delete_project" ||
    (action.tool_name === "update_entity_status" && action.arguments?.status === "rejected");

  const handleConfirm = async () => {
    setExecuting(true);
    setStatus("running");
    try {
      const res = await api.confirmCopilotAction(projectId, action.tool_name, action.arguments);
      if (res.status === "ok" || res.status === "queued" || res.status === "success") {
        setStatus("success");
        setMessage(res.message || "Action executed successfully.");
        onActionComplete();

        if (action.tool_name === "navigate_to_page" && action.arguments?.page) {
          const target = action.arguments.page.toLowerCase();
          if (target.includes("traceability") || target.includes("matrix")) {
            router.push(`/projects/${projectId}/traceability`);
          } else if (target.includes("document") || target.includes("file")) {
            router.push(`/projects/${projectId}`);
          } else if (target.includes("setting")) {
            router.push(`/settings`);
          }
        }
      } else {
        setStatus("failed");
        setMessage(res.message || "Execution failed.");
      }
    } catch (err: any) {
      setStatus("failed");
      setMessage(err?.message || "Error confirming action.");
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div
      className={`my-3 rounded-2xl border p-4 shadow-sm transition-all ${
        status === "requires_confirmation"
          ? isDestructive
            ? "border-red-300 dark:border-red-800 bg-red-50/60 dark:bg-red-950/40"
            : "border-amber-300 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/40"
          : status === "running"
          ? "border-teal-300 dark:border-teal-800 bg-teal-50/60 dark:bg-teal-950/40"
          : status === "success"
          ? "border-emerald-300 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/40"
          : "border-red-300 dark:border-red-800 bg-red-50/60 dark:bg-red-950/40"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {status === "requires_confirmation" && isDestructive && (
            <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
          )}
          {status === "requires_confirmation" && !isDestructive && (
            <Zap className="h-5 w-5 text-amber-500 shrink-0" />
          )}
          {status === "running" && <Loader2 className="h-5 w-5 animate-spin text-teal-500 shrink-0" />}
          {status === "success" && <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />}
          {status === "failed" && <XCircle className="h-5 w-5 text-red-500 shrink-0" />}

          <div>
            <h4 className="font-display text-xs font-bold text-slate-900 dark:text-white">{action.label}</h4>
            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
              {message || `Tool: ${action.tool_name}`}
            </p>
          </div>
        </div>

        <span
          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
            status === "requires_confirmation"
              ? isDestructive
                ? "bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300"
                : "bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300"
              : status === "running"
              ? "bg-teal-100 text-teal-700 dark:bg-teal-900/60 dark:text-teal-300"
              : status === "success"
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300"
              : "bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-300"
          }`}
        >
          {status === "requires_confirmation" ? "Confirmation Required" : status}
        </span>
      </div>

      {status === "requires_confirmation" && (
        <div className="mt-3 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800 pt-3">
          <button
            onClick={() => setStatus("failed")}
            disabled={executing}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={executing}
            className={`flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-xs font-bold text-white shadow-md transition ${
              isDestructive
                ? "bg-red-600 hover:bg-red-700"
                : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:scale-[1.01]"
            }`}
          >
            {executing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
            <span>Confirm & Execute</span>
          </button>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Message Bubble Component
───────────────────────────────────────────────────────────── */
function MessageBubble({
  msg,
  projectId,
  onSendPrompt,
  onActionComplete,
}: {
  msg: ChatMessage;
  projectId: number;
  onSendPrompt: (prompt: string) => void;
  onActionComplete: () => void;
}) {
  const isUser = msg.sender === "user";
  const hasActions = msg.actions && msg.actions.length > 0;
  const isSuggestion =
    !isUser &&
    (msg.content.toLowerCase().includes("suggestion:") ||
      msg.content.toLowerCase().includes("recommendation:"));

  return (
    <div className={`flex gap-3.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-md ${
          isUser
            ? "bg-gradient-to-br from-emerald-500 to-teal-600 shadow-emerald-500/20"
            : "bg-slate-900 dark:bg-slate-800 border border-slate-700"
        }`}
      >
        {isUser ? <UserIcon className="h-4 w-4" /> : <Bot className="h-4 w-4 text-emerald-400" />}
      </div>

      <div className={`max-w-[85%] sm:max-w-[75%] space-y-1.5 ${isUser ? "items-end" : "items-start"} flex flex-col`}>
        <div
          className={`rounded-2xl px-5 py-3.5 shadow-sm transition-all ${
            isUser
              ? "rounded-tr-xs bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white font-medium"
              : isSuggestion
              ? "rounded-tl-xs border border-emerald-200 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/30 text-slate-900 dark:text-slate-100"
              : "rounded-tl-xs border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
          }`}
        >
          {!isUser && !hasActions && !isSuggestion && (
            <div className="mb-2 flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              <Sparkles className="h-3.5 w-3.5" />
              <span>REFACTO COPILOT</span>
            </div>
          )}

          <MarkdownRenderer text={msg.content} />

          {hasActions && (
            <div className="mt-3 space-y-2 border-t border-slate-200 dark:border-slate-800 pt-3">
              {msg.actions!.map((act) => (
                <ActionCard key={act.id} action={act} projectId={projectId} onActionComplete={onActionComplete} />
              ))}
            </div>
          )}
        </div>

        <span className="px-1 text-[10px] font-semibold text-slate-400">{formatDateTime(msg.created_at)}</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   LIVE PROGRESS VIEW: Autonomous Agent Run Panel
───────────────────────────────────────────────────────────── */
function AgentRunProgressView({
  run,
  projectId,
  onCancel,
  onConfirmStep,
  onRestartRun,
}: {
  run: AgentRun;
  projectId: number;
  onCancel: () => void;
  onConfirmStep: (confirmed: boolean) => void;
  onRestartRun: () => void;
}) {
  const router = useRouter();

  const getStatusBadge = () => {
    switch (run.status) {
      case "running":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 animate-pulse">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-500" />
            <span>RUNNING...</span>
          </span>
        );
      case "awaiting_confirmation":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-950/60 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
            <span>AWAITING CONFIRMATION</span>
          </span>
        );
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            <span>COMPLETED</span>
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 dark:bg-red-950/60 px-3 py-1 text-xs font-bold text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
            <XCircle className="h-3.5 w-3.5 text-red-500" />
            <span>FAILED</span>
          </span>
        );
      case "cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-bold text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
            <StopCircle className="h-3.5 w-3.5 text-slate-400" />
            <span>CANCELLED</span>
          </span>
        );
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg p-6 space-y-6">
      {/* Run Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              AUTONOMOUS AGENT RUN #{run.id}
            </span>
            {getStatusBadge()}
          </div>
          <h3 className="font-display text-base font-extrabold text-slate-900 dark:text-white">
            &quot;{run.goal}&quot;
          </h3>
        </div>

        {run.status === "running" && (
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 px-4 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-100 transition"
          >
            <StopCircle className="h-4 w-4" />
            <span>Cancel Run</span>
          </button>
        )}
      </div>

      {/* CI/CD Pipeline Timeline of Tool Steps */}
      <div className="space-y-3">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Execution Step Pipeline Logs ({run.steps.length})
        </div>

        <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
          {run.steps.map((step) => {
            const meta = getToolMetadata(step.tool_name, step.label);
            const StepIcon = meta.icon;

            return (
              <div key={step.id} className="relative flex items-start justify-between gap-4 group">
                {/* Timeline Dot Icon */}
                <div className="absolute -left-6 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white dark:bg-slate-900 ring-4 ring-white dark:ring-slate-900">
                  {step.status === "in_flight" ? (
                    <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                  ) : step.status === "success" ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : step.status === "requires_confirmation" ? (
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <StepIcon className={`h-4 w-4 shrink-0 ${meta.color}`} />
                    <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      {meta.label}
                    </span>
                  </div>

                  {/* Paused Confirm Card */}
                  {step.status === "requires_confirmation" && (
                    <div className="mt-3 rounded-2xl border border-red-300 dark:border-red-800 bg-red-50/80 dark:bg-red-950/60 p-4 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-red-700 dark:text-red-300">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Destructive Action Confirmation Required</span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                        This step involves high-risk project updates. Please confirm to proceed with execution.
                      </p>
                      <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => onConfirmStep(false)}
                          className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                        >
                          Cancel Run
                        </button>
                        <button
                          type="button"
                          onClick={() => onConfirmStep(true)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-1.5 text-xs font-bold text-white shadow-md hover:bg-red-700"
                        >
                          <Zap className="h-3.5 w-3.5" />
                          <span>Confirm & Execute</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <span className="text-[10px] font-mono text-slate-400 shrink-0">
                  {formatDateTime(step.timestamp)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Terminal States Footer Banners */}
      {run.status === "completed" && (
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/80 dark:bg-emerald-950/60 p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-extrabold text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
            <span>Autonomous Run Completed Successfully</span>
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
            {run.summary || "All artifacts have been derived and synchronized with the project traceability matrix."}
          </p>
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => router.push(`/projects/${projectId}/traceability`)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:scale-[1.01] transition"
            >
              <span>View Results in Traceability Matrix</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onRestartRun}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Start New Run</span>
            </button>
          </div>
        </div>
      )}

      {run.status === "failed" && (
        <div className="rounded-2xl border border-red-200 dark:border-red-800 bg-red-50/80 dark:bg-red-950/60 p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-extrabold text-red-700 dark:text-red-300">
            <XCircle className="h-5 w-5 text-red-500 shrink-0" />
            <span>Autonomous Run Failed</span>
          </div>
          <p className="text-xs font-mono text-red-600 dark:text-red-400 bg-red-100/60 dark:bg-red-950 p-3 rounded-xl">
            {run.error_message || "An unexpected error occurred during execution."}
          </p>
          <button
            type="button"
            onClick={onRestartRun}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-red-700 transition"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Try Again</span>
          </button>
        </div>
      )}

      {run.status === "cancelled" && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-950/60 p-5 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
            <StopCircle className="h-4 w-4 text-slate-400" />
            <span>Cancelled by User</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Completed pipeline steps remain saved and accessible.
          </p>
          <button
            type="button"
            onClick={onRestartRun}
            className="mt-2 inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Start Fresh Run</span>
          </button>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Main Copilot Chat & Agent Run Page
───────────────────────────────────────────────────────────── */
export default function ChatPage({ params }: { params: { projectId: string } }) {
  const projectId = Number(params.projectId);

  // Input mode state: "ask" vs "run"
  const [mode, setMode] = useState<InputMode>("ask");

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [primer, setPrimer] = useState<ChatPrimerResponse | null>(null);
  const [activeRun, setActiveRun] = useState<AgentRun | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clearConfirm, setClearConfirm] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const loadPrimer = useCallback(async () => {
    try {
      const data = await api.getChatPrimer(projectId);
      setPrimer(data);
    } catch (err) {
      console.warn("Failed to load chat primer:", err);
    }
  }, [projectId]);

  // Initial Load
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [chatRes] = await Promise.all([api.getProjectChat(projectId), loadPrimer()]);
        setMessages(chatRes.messages || []);
      } catch {
        setError("Unable to load chat history.");
      } finally {
        setLoading(false);
      }
    })();
  }, [projectId, loadPrimer]);

  // Polling loop for active Agent Run (~2 seconds)
  useEffect(() => {
    if (!activeRun || (activeRun.status !== "running" && activeRun.status !== "awaiting_confirmation")) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const updated = await api.getAgentRun(projectId, activeRun.id);
        setActiveRun(updated);
        if (updated.status === "completed") {
          loadPrimer();
        }
      } catch (err) {
        console.warn("Failed to poll agent run status:", err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [activeRun, projectId, loadPrimer]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending, activeRun]);

  // Handle Send for Ask mode or Run mode
  const handleSubmit = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;

    if (mode === "ask") {
      setInput("");
      setSending(true);
      setError(null);

      const tempUser: ChatMessage = {
        id: Date.now(),
        project_id: projectId,
        sender: "user",
        content: text,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, tempUser]);

      try {
        const res = await api.sendChatMessage(projectId, text);
        setMessages((prev) => {
          const withoutTemp = prev.filter((m) => m.id !== tempUser.id);
          return [...withoutTemp, res.user_message, res.assistant_message];
        });
        loadPrimer();
      } catch (err) {
        setMessages((prev) => prev.filter((m) => m.id !== tempUser.id));
        setError(err instanceof Error ? err.message : "Failed to send message.");
      } finally {
        setSending(false);
        inputRef.current?.focus();
      }
    } else {
      // MODE = RUN
      setInput("");
      setSending(true);
      setError(null);

      try {
        const newRun = await api.startAgentRun(projectId, text);
        setActiveRun(newRun);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to start autonomous run.");
      } finally {
        setSending(false);
      }
    }
  }, [input, mode, projectId, sending, loadPrimer]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  async function handleCancelRun() {
    if (!activeRun) return;
    try {
      const cancelled = await api.cancelAgentRun(projectId, activeRun.id);
      setActiveRun(cancelled);
    } catch {
      setError("Failed to cancel agent run.");
    }
  }

  async function handleConfirmRunStep(confirmed: boolean) {
    if (!activeRun) return;
    try {
      const updated = await api.confirmAgentRunStep(projectId, activeRun.id, confirmed);
      setActiveRun(updated);
    } catch {
      setError("Failed to confirm agent step.");
    }
  }

  async function handleClear() {
    try {
      await api.clearChatHistory(projectId);
      setMessages([]);
      setClearConfirm(false);
    } catch {
      setError("Failed to clear chat history.");
    }
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-[calc(100vh-100px)] flex-col space-y-4 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 dark:border-slate-800 pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-md shadow-emerald-500/20">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-xl font-extrabold text-slate-900 dark:text-white">
                Project Copilot & Autonomous Agent
              </h1>
              {primer?.project_name && (
                <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-3 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  {primer.project_name}
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Switch between single-turn Q&A (&quot;Ask&quot;) and autonomous multi-step pipeline execution (&quot;Run&quot;).
            </p>
          </div>
        </div>

        {messages.length > 0 && !activeRun && (
          <button
            type="button"
            onClick={() => setClearConfirm(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 transition"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* Clear Confirmation Banner */}
      {clearConfirm && (
        <div className="flex items-center justify-between rounded-2xl border border-red-200 dark:border-red-800 bg-red-50/80 dark:bg-red-950/60 p-4 text-xs font-semibold text-red-700 dark:text-red-300 shadow-sm shrink-0">
          <span>Clear all conversation history? This action cannot be undone.</span>
          <div className="flex gap-2">
            <button
              onClick={() => setClearConfirm(false)}
              className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              onClick={handleClear}
              className="rounded-xl bg-red-600 px-4 py-1.5 text-white font-bold hover:bg-red-700"
            >
              Clear Permanently
            </button>
          </div>
        </div>
      )}

      {/* Main Conversation or Agent Run Live Progress View */}
      <div className="flex-1 overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 shadow-inner">
        {activeRun ? (
          /* LIVE PROGRESS VIEW FOR AUTONOMOUS AGENT RUN */
          <AgentRunProgressView
            run={activeRun}
            projectId={projectId}
            onCancel={handleCancelRun}
            onConfirmStep={handleConfirmRunStep}
            onRestartRun={() => setActiveRun(null)}
          />
        ) : loading ? (
          <div className="flex h-full items-center justify-center gap-2 text-xs font-semibold text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
            <span>Initializing Copilot workspace...</span>
          </div>
        ) : isEmpty ? (
          /* Empty State Primer */
          <div className="flex h-full flex-col items-center justify-center text-center p-6 space-y-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-md">
              <Bot className="h-8 w-8" />
            </div>

            <div className="max-w-lg space-y-2">
              <h2 className="font-display text-xl font-extrabold text-slate-900 dark:text-white">
                Welcome to {primer?.project_name || "Project"} Copilot
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {primer?.primer_line ||
                  "I can analyze requirements coverage, generate downstream artifacts, and execute project management tools safely."}
              </p>
            </div>

            {/* Suggestions */}
            {primer?.suggestions && primer.suggestions.length > 0 && (
              <div className="max-w-xl w-full space-y-2 pt-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Suggested Actions for Current State
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {primer.suggestions.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setInput(s.prompt);
                        setMode("ask");
                      }}
                      disabled={sending}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-sm hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition disabled:opacity-50"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      <span>{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Normal Chat History */
          <div className="space-y-6">
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                projectId={projectId}
                onSendPrompt={(p) => {
                  setInput(p);
                  setMode("ask");
                }}
                onActionComplete={loadPrimer}
              />
            ))}
            {sending && (
              <div className="flex gap-3.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-emerald-400 shadow-md">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-3.5 shadow-sm">
                  <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                  <span className="text-xs font-semibold text-slate-500">Copilot is thinking...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Error notification */}
      {error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-950/60 p-3 text-xs font-semibold text-red-600 dark:text-red-300 border border-red-200 dark:border-red-800 flex justify-between shrink-0">
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Input Docking Controls Bar */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 shadow-md space-y-2 shrink-0">
        {/* Mode Toggle Pills: Ask vs Run */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 px-1">
          <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-950 p-1 gap-1 border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setMode("ask")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                mode === "ask"
                  ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Ask (Single-Turn)</span>
            </button>

            <button
              type="button"
              onClick={() => setMode("run")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                mode === "run"
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Play className="h-3.5 w-3.5" />
              <span>Run (Autonomous Multi-Step)</span>
            </button>
          </div>

          <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline">
            {mode === "ask" ? "Single Q&A mode" : "Unattended pipeline run mode"}
          </span>
        </div>

        {/* Text Input Area */}
        <div className="flex items-end gap-3 pt-1">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              mode === "ask"
                ? "Which requirements need test cases? Ask Copilot to analyze or clarify..."
                : "Generate everything for this document... (Autonomous background run)"
            }
            rows={1}
            disabled={sending || loading || (!!activeRun && (activeRun.status === "running" || activeRun.status === "awaiting_confirmation"))}
            className="flex-1 resize-none bg-transparent py-1.5 px-2 text-xs sm:text-sm text-slate-900 dark:text-white outline-none placeholder:text-slate-400 disabled:opacity-50"
            style={{ maxHeight: "120px", overflowY: "auto" }}
          />

          <button
            type="button"
            disabled={
              !input.trim() ||
              sending ||
              loading ||
              (!!activeRun && (activeRun.status === "running" || activeRun.status === "awaiting_confirmation"))
            }
            onClick={handleSubmit}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-md transition disabled:opacity-40 ${
              mode === "run"
                ? "bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 shadow-emerald-600/20 hover:scale-[1.03]"
                : "bg-slate-900 dark:bg-slate-800 hover:bg-slate-800"
            }`}
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : mode === "run" ? (
              <Play className="h-4 w-4" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
