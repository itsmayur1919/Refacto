"use client";

import Link from "next/link";
import { Layers, ShieldCheck, ArrowUp, Github, Twitter, Mail } from "lucide-react";

export function LandingFooter() {
  const currentYear = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="border-t border-hairline bg-slate-950 text-slate-400 text-xs py-14 px-4">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-5">
          {/* Brand & Description */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-md">
                <Layers className="h-5 w-5" />
              </div>
              <span className="font-display text-lg font-bold tracking-tight text-white">
                Generative AI Refacto
              </span>
            </Link>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Enterprise AI platform for autonomous specification parsing, use case extraction, requirement derivation, and bi-directional test suite generation.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-emerald-400 font-medium">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>All Systems Operational • SOC-2 Type II Certified</span>
            </div>
          </div>

          {/* Product */}
          <div>
            <p className="font-display text-xs font-bold uppercase tracking-wider text-slate-200">
              Product
            </p>
            <ul className="mt-4 space-y-2.5 font-medium">
              <li>
                <Link href="#how-it-works" className="hover:text-emerald-400 transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="#features" className="hover:text-emerald-400 transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link href="#interactive-demo" className="hover:text-emerald-400 transition-colors">
                  Live Interactive Demo
                </Link>
              </li>
              <li>
                <Link href="#pricing" className="hover:text-emerald-400 transition-colors">
                  Pricing Plans
                </Link>
              </li>
              <li>
                <Link href="/projects" className="hover:text-emerald-400 transition-colors">
                  Project Workspace
                </Link>
              </li>
            </ul>
          </div>

          {/* Integrations */}
          <div>
            <p className="font-display text-xs font-bold uppercase tracking-wider text-slate-200">
              Integrations
            </p>
            <ul className="mt-4 space-y-2.5 font-medium">
              <li>
                <span className="hover:text-emerald-400 transition-colors cursor-pointer">
                  Atlassian Jira
                </span>
              </li>
              <li>
                <span className="hover:text-emerald-400 transition-colors cursor-pointer">
                  Confluence Specs
                </span>
              </li>
              <li>
                <span className="hover:text-emerald-400 transition-colors cursor-pointer">
                  Azure DevOps
                </span>
              </li>
              <li>
                <span className="hover:text-emerald-400 transition-colors cursor-pointer">
                  TestRail Suite
                </span>
              </li>
              <li>
                <span className="hover:text-emerald-400 transition-colors cursor-pointer">
                  GitHub Actions
                </span>
              </li>
            </ul>
          </div>

          {/* Company & Legal */}
          <div>
            <p className="font-display text-xs font-bold uppercase tracking-wider text-slate-200">
              Company
            </p>
            <ul className="mt-4 space-y-2.5 font-medium">
              <li>
                <a href="mailto:support@refacto.ai" className="hover:text-emerald-400 transition-colors">
                  Contact Support
                </a>
              </li>
              <li>
                <span className="hover:text-emerald-400 transition-colors cursor-pointer">
                  Privacy Policy
                </span>
              </li>
              <li>
                <span className="hover:text-emerald-400 transition-colors cursor-pointer">
                  Terms of Service
                </span>
              </li>
              <li>
                <span className="hover:text-emerald-400 transition-colors cursor-pointer">
                  Security Whitepaper
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright & Scroll To Top */}
        <div className="mt-12 pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <p>&copy; {currentYear} Generative AI Refacto, Inc. All rights reserved.</p>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={scrollToTop}
              className="inline-flex items-center gap-1 text-slate-400 hover:text-emerald-400 transition-colors font-medium"
            >
              <span>Back to top</span>
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
