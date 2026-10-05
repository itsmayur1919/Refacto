"use client";

import { useState } from "react";
import {
  FileText,
  Zap,
  CheckSquare,
  GitCommit,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  Sparkles,
  Link as LinkIcon,
  Search,
  Check,
} from "lucide-react";

interface StepData {
  id: number;
  label: string;
  shortTag: string;
  icon: any;
  title: string;
  badge: string;
  summary: string;
  details: {
    title: string;
    idTag: string;
    meta: string;
    items: string[];
    traceLink: string;
  };
}

const STAGES: StepData[] = [
  {
    id: 1,
    label: "1. Upload Spec",
    shortTag: "PDF / DOCX / OCR",
    icon: FileText,
    title: "Raw Spec Document",
    badge: "Input Spec Parsed",
    summary: "System parses unstructured PDFs, Figma wireframes, or text specs with OCR.",
    details: {
      title: "Enterprise Mobile Payment Gateway Spec v3.4.pdf",
      idTag: "DOC-2026-904",
      meta: "14 Pages • 100% OCR Accuracy",
      items: [
        'Raw Spec Excerpt: "Users must be able to authenticate using 2FA, biometric passkey, or standard OAuth2 password fallback within 3 seconds."',
        'Parsed Entities: 4 Actors (User, Auth API, Gateway, SMS Provider)',
        'Extracted Scope: Payment Authentication, Session Management, Security Fallbacks',
      ],
      traceLink: "Source Document -> System Input",
    },
  },
  {
    id: 2,
    label: "2. Use Cases",
    shortTag: "Actors & Flows",
    icon: Zap,
    title: "AI Generated Use Cases",
    badge: "4 Use Cases Extracted",
    summary: "AI identifies primary actors, preconditions, triggers, and alternative exception flows.",
    details: {
      title: "[UC-102] Biometric & 2FA Payment Authorization",
      idTag: "UC-102",
      meta: "Actor: End User • Precondition: Active Account",
      items: [
        "Primary Flow: User initiates checkout -> System requests Biometric Passkey.",
        "Alternate Flow A: Passkey fails -> System prompts TOTP 6-digit backup code.",
        "Exception Flow B: 3 invalid attempts -> Account locked for 15 mins and triggers SecOps alert.",
      ],
      traceLink: "Linked to Document DOC-2026-904 Line 42",
    },
  },
  {
    id: 3,
    label: "3. Requirements",
    shortTag: "Functional & Edge",
    icon: GitCommit,
    title: "Derived Requirements",
    badge: "12 REQs Linked",
    summary: "Each use case breaks down into unambiguous, testable functional and security requirements.",
    details: {
      title: "[REQ-204] Biometric Authentication Fallback Policy",
      idTag: "REQ-204",
      meta: "Priority: High • Compliance: SOC-2 / PCI-DSS",
      items: [
        "REQ-204.1: System MUST enforce maximum 3 biometric retries before falling back to TOTP.",
        "REQ-204.2: Auth token issuance latency MUST NOT exceed 400ms under 10k RPS load.",
        "REQ-204.3: All failed authentication attempts MUST emit an audit event to SIEM.",
      ],
      traceLink: "Traces to Use Case [UC-102]",
    },
  },
  {
    id: 4,
    label: "4. Test Cases",
    shortTag: "Auto-Linked Suite",
    icon: CheckSquare,
    title: "Executable Test Cases",
    badge: "Ready for Jira / TestRail",
    summary: "Automated test suites with step-by-step assertions, expected outcomes, and traceability tags.",
    details: {
      title: "[TC-501] Verify Account Lockout after 3 Failed Biometric Attempts",
      idTag: "TC-501",
      meta: "Type: Automated E2E • Status: Verified 🟢",
      items: [
        "Step 1: Mock failed biometric challenge 3 consecutive times.",
        "Step 2: Assert HTTP 423 Locked response with error code AUTH_LOCKOUT_15M.",
        "Step 3: Verify SIEM webhook payload emitted with client IP and account ID.",
      ],
      traceLink: "Traces to REQ-204.1 & UC-102",
    },
  },
];

export function InteractiveTraceThread() {
  const [activeStep, setActiveStep] = useState<number>(2);

  const currentStage = STAGES.find((s) => s.id === activeStep) || STAGES[1];

  return (
    <div className="mx-auto w-full max-w-4xl">
      {/* Interactive Stepper Tabs */}
      <div className="relative rounded-2xl bg-white/90 dark:bg-slate-900/90 p-4 sm:p-6 shadow-xl border border-slate-200 dark:border-slate-800 backdrop-blur-lg">
        {/* Step Progress Line */}
        <div className="hidden sm:block absolute top-[52px] left-[10%] right-[10%] h-[3px] bg-slate-100 dark:bg-slate-800 -z-0">
          <div
            className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all duration-500 rounded-full"
            style={{ width: `${((activeStep - 1) / (STAGES.length - 1)) * 100}%` }}
          />
        </div>

        {/* Step Buttons */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-2">
          {STAGES.map((stage) => {
            const Icon = stage.icon;
            const isActive = stage.id === activeStep;
            const isCompleted = stage.id < activeStep;

            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => setActiveStep(stage.id)}
                className={`group flex flex-col items-center text-center p-3 rounded-xl transition-all duration-300 ${
                  isActive
                    ? "bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-500/40 shadow-md shadow-emerald-500/10 scale-[1.02]"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-transparent"
                }`}
              >
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-300 ${
                    isActive
                      ? "bg-gradient-to-br from-teal-600 to-emerald-600 text-white shadow-lg shadow-emerald-600/30"
                      : isCompleted
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:text-slate-700"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span
                  className={`mt-2 font-display text-xs sm:text-sm font-semibold transition-colors ${
                    isActive
                      ? "text-emerald-700 dark:text-emerald-300"
                      : "text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {stage.label}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block mt-0.5">
                  {stage.shortTag}
                </span>
              </button>
            );
          })}
        </div>

        {/* Live Step Inspector Output */}
        <div className="mt-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 p-4 sm:p-6 text-left transition-all duration-300">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-display text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                {currentStage.title}
              </span>
              <span className="rounded-md bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700">
                {currentStage.details.idTag}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-teal-50 dark:bg-teal-950/60 px-2.5 py-1 text-[11px] font-medium text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                <Sparkles className="h-3 w-3 text-teal-500" />
                {currentStage.badge}
              </span>
            </div>
          </div>

          <div className="mt-3">
            <h4 className="font-display text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100">
              {currentStage.details.title}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {currentStage.details.meta}
            </p>
          </div>

          <div className="mt-4 space-y-2">
            {currentStage.details.items.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 rounded-lg bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800 font-mono"
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{item}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200/60 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
              <LinkIcon className="h-3.5 w-3.5" />
              <span>Traceability Chain: {currentStage.details.traceLink}</span>
            </div>
            <div className="flex items-center gap-1 text-slate-400">
              <span>Click stages to test live preview</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
