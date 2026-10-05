"use client";

import Link from "next/link";
import { Check, Sparkles, Zap, Shield, ArrowRight } from "lucide-react";

const PLANS = [
  {
    name: "Free Starter",
    badge: "Community",
    price: "$0",
    period: "forever",
    description: "Ideal for individual developers and small QA projects.",
    features: [
      "Up to 15 Documents / Month",
      "PDF, DOCX & Plain Text OCR",
      "Standard Requirement Derivation",
      "Export to CSV & Markdown",
      "Community Support",
    ],
    cta: "Start Free",
    popular: false,
  },
  {
    name: "Professional",
    badge: "Most Popular",
    price: "$49",
    period: "per user / month",
    description: "For fast-growing product & QA engineering teams.",
    features: [
      "Unlimited Document Uploads",
      "Multimodal OCR & Figma Screenshot Parsing",
      "100% Bi-Directional Traceability Matrix",
      "Direct Sync to Jira & TestRail",
      "Ambiguity & Gap Detection Engine",
      "Priority Email & Slack Support",
    ],
    cta: "Start 14-Day Free Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    badge: "Custom Scale",
    price: "Custom",
    period: "tailored billing",
    description: "For enterprise QA orgs needing dedicated AI models & SOC-2 compliance.",
    features: [
      "Custom Fine-Tuned AI Models",
      "On-Premise / VPC Deployment Option",
      "Single Sign-On (SAML / Okta / Azure AD)",
      "Zero-Data Retention Policy Guarantee",
      "Dedicated Solutions Architect & SLA",
      "24/7 Dedicated Support Hotline",
    ],
    cta: "Contact Enterprise Sales",
    popular: false,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="relative bg-paper dark:bg-slate-950 px-4 py-20 sm:py-28 border-t border-hairline">
      <div className="mx-auto max-w-6xl">
        {/* Section Title */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 px-3.5 py-1 text-xs font-bold text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <Zap className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>TRANSPARENT PRICING</span>
          </div>
          <h2 className="mt-4 font-display text-3xl font-extrabold text-slate-900 dark:text-white sm:text-4xl lg:text-5xl">
            Flexible Plans for Every Team Scale
          </h2>
          <p className="mt-3 text-base sm:text-lg text-slate-600 dark:text-slate-300">
            Start for free, upgrade when your engineering team scales.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col justify-between rounded-2xl p-8 transition-all duration-300 ${
                plan.popular
                  ? "bg-white dark:bg-slate-900 border-2 border-emerald-500 shadow-2xl shadow-emerald-500/15 scale-[1.03]"
                  : "bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-lg"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-1 text-xs font-bold text-white shadow-md flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  <span>MOST POPULAR</span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white">
                    {plan.name}
                  </h3>
                  <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {plan.badge}
                  </span>
                </div>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-extrabold text-slate-900 dark:text-white">
                    {plan.price}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">{plan.period}</span>
                </div>

                <p className="mt-3 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  {plan.description}
                </p>

                <div className="mt-6 space-y-3 pt-6 border-t border-slate-200/80 dark:border-slate-800">
                  {plan.features.map((feat, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-4">
                <Link
                  href="/signup"
                  className={`w-full inline-flex items-center justify-center gap-2 rounded-xl py-3.5 px-5 text-sm font-bold transition my-1 ${
                    plan.popular
                      ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md hover:shadow-lg hover:scale-[1.01]"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  <span>{plan.cta}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
