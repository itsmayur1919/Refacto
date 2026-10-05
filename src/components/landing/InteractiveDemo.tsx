"use client";

import { useState } from "react";
import { Sparkles, FileText, CheckCircle2, RefreshCw, Copy, ExternalLink, ShieldAlert, Cpu } from "lucide-react";

const DEMO_SAMPLES = [
  {
    id: "auth-spec",
    label: "OAuth2 & MFA Spec",
    docName: "Security_Authentication_Module_v2.1.docx",
    rawText: `[DOCUMENT INPUT]
Security Standard 4.1: User login must support OAuth2 PKCE flow with mandatory TOTP or SMS fallback. 
Session tokens must expire after 15 minutes of inactivity. Failed logins must lock the account after 5 attempts and issue an audit alert.`,
    useCases: [
      { id: "UC-101", title: "User Initiates OAuth2 PKCE Authentication", actor: "End User / Client App" },
      { id: "UC-102", title: "Enforce Session Inactivity Expiration (15 mins)", actor: "System Auth Service" },
      { id: "UC-103", title: "Account Lockout & Audit Emission on 5 Failed Logins", actor: "SecOps / Auth Guard" },
    ],
    requirements: [
      { id: "REQ-301", text: "System MUST validate PKCE code challenge before granting OAuth token.", type: "Security" },
      { id: "REQ-302", text: "Session token validity MUST be capped at 900 seconds of inactivity.", type: "Functional" },
      { id: "REQ-303", text: "Account status MUST transition to LOCKED upon 5th failed password attempt.", type: "Security" },
    ],
    testCases: [
      { id: "TC-901", title: "Verify PKCE Code Challenge Rejection on Invalid Secret", status: "PASSED 🟢" },
      { id: "TC-902", title: "Assert Session Revocation at T+901 Seconds of Idle State", status: "PASSED 🟢" },
      { id: "TC-903", title: "Verify Account Lockout Notification Emitted to SIEM Webhook", status: "PASSED 🟢" },
    ],
  },
  {
    id: "payment-spec",
    label: "Payment Gateway API",
    docName: "Stripe_Checkout_Integration_Spec.pdf",
    rawText: `[DOCUMENT INPUT]
Payment Engine 2.0: Credit card payments over $500 require 3D-Secure 2.0 validation. 
In case of network timeout, auto-retry up to 3 times with exponential backoff. Webhooks must verify HMAC signature before fulfilling orders.`,
    useCases: [
      { id: "UC-201", title: "High-Value Transaction 3DS Verification Flow", actor: "Customer / Gateway" },
      { id: "UC-202", title: "Exponential Backoff Retry Strategy on Gateway Failure", actor: "Payment Engine" },
      { id: "UC-203", title: "Webhook Cryptographic Signature Verification", actor: "Order Fulfillment Service" },
    ],
    requirements: [
      { id: "REQ-401", text: "3D-Secure 2.0 challenge MUST be triggered for amounts > $500.00 USD.", type: "Functional" },
      { id: "REQ-402", text: "System MUST execute maximum 3 retries at 1s, 2s, and 4s intervals.", type: "Performance" },
      { id: "REQ-403", text: "Unsigned or tampered webhooks MUST be rejected with HTTP 401 Unauthorized.", type: "Security" },
    ],
    testCases: [
      { id: "TC-801", title: "Verify 3DS Modal Triggered for $500.01 Checkout", status: "PASSED 🟢" },
      { id: "TC-802", title: "Validate Retry Delays Match Exponential Timeline (1s, 2s, 4s)", status: "PASSED 🟢" },
      { id: "TC-803", title: "Assert HTTP 401 Returned for Invalid HMAC Webhook Payload", status: "PASSED 🟢" },
    ],
  },
];

export function InteractiveDemo() {
  const [activeSampleId, setActiveSampleId] = useState<string>("auth-spec");
  const [activeTab, setActiveTab] = useState<"input" | "usecases" | "requirements" | "testcases">("requirements");
  const [isCopied, setIsCopied] = useState(false);

  const currentSample = DEMO_SAMPLES.find((s) => s.id === activeSampleId) || DEMO_SAMPLES[0];

  const handleCopy = () => {
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <section id="interactive-demo" className="relative bg-paper dark:bg-slate-900/60 px-4 py-20 sm:py-28 border-t border-hairline">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 px-3.5 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>INTERACTIVE AI SANDBOX</span>
          </div>
          <h2 className="mt-4 font-display text-3xl font-extrabold text-slate-900 dark:text-white sm:text-4xl lg:text-5xl">
            See Refacto in Action
          </h2>
          <p className="mt-3 text-base sm:text-lg text-slate-600 dark:text-slate-300">
            Test how our AI transforms raw specifications into structured requirements and test cases.
          </p>
        </div>

        {/* Sample Document Selector */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Select Spec Preset:
          </span>
          {DEMO_SAMPLES.map((sample) => (
            <button
              key={sample.id}
              type="button"
              onClick={() => setActiveSampleId(sample.id)}
              className={`rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition ${
                sample.id === activeSampleId
                  ? "bg-slate-900 text-white dark:bg-emerald-600 shadow-md"
                  : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-hairline"
              }`}
            >
              {sample.label}
            </button>
          ))}
        </div>

        {/* Interactive Workspace Window */}
        <div className="mt-8 rounded-2xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 shadow-2xl overflow-hidden">
          {/* Top Bar / Navigation Tabs */}
          <div className="flex flex-wrap items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-900/80 px-4 py-3 gap-3">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span className="font-display text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                {currentSample.docName}
              </span>
              <span className="rounded bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:text-emerald-300">
                100% Traceability Score
              </span>
            </div>

            {/* View Tabs */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab("input")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  activeTab === "input"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                1. Raw Spec Input
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("usecases")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  activeTab === "usecases"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                2. Use Cases ({currentSample.useCases.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("requirements")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  activeTab === "requirements"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                3. Requirements ({currentSample.requirements.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("testcases")}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  activeTab === "testcases"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                4. Test Cases ({currentSample.testCases.length})
              </button>
            </div>
          </div>

          {/* Tab Content Display */}
          <div className="p-6 min-h-[280px]">
            {activeTab === "input" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Input Specification Content</span>
                  <span className="text-xs text-emerald-600 font-mono">Parsed in 0.8s</span>
                </div>
                <pre className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 text-xs sm:text-sm font-mono text-slate-800 dark:text-slate-200 whitespace-pre-wrap border border-slate-200 dark:border-slate-800 leading-relaxed">
                  {currentSample.rawText}
                </pre>
              </div>
            )}

            {activeTab === "usecases" && (
              <div className="space-y-3">
                <span className="text-xs font-semibold text-slate-500 uppercase">AI Extracted Use Cases</span>
                <div className="grid gap-3 sm:grid-cols-3">
                  {currentSample.useCases.map((uc) => (
                    <div
                      key={uc.id}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between"
                    >
                      <div>
                        <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          {uc.id}
                        </span>
                        <h4 className="mt-1 font-display text-sm font-bold text-slate-900 dark:text-white">
                          {uc.title}
                        </h4>
                      </div>
                      <span className="mt-3 text-[11px] text-slate-500">Actor: {uc.actor}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "requirements" && (
              <div className="space-y-3">
                <span className="text-xs font-semibold text-slate-500 uppercase">Derived Requirements</span>
                <div className="space-y-2.5">
                  {currentSample.requirements.map((req) => (
                    <div
                      key={req.id}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="flex items-start gap-3">
                        <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-1 rounded border border-emerald-200 dark:border-emerald-800 shrink-0">
                          {req.id}
                        </span>
                        <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200">
                          {req.text}
                        </span>
                      </div>
                      <span className="self-start sm:self-auto text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {req.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "testcases" && (
              <div className="space-y-3">
                <span className="text-xs font-semibold text-slate-500 uppercase">Generated Executable Test Suites</span>
                <div className="space-y-2.5">
                  {currentSample.testCases.map((tc) => (
                    <div
                      key={tc.id}
                      className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          {tc.id}
                        </span>
                        <span className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200">
                          {tc.title}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-800 shrink-0">
                        {tc.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
