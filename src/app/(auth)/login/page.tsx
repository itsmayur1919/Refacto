"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthInput } from "@/components/auth/AuthInput";
import { auth } from "@/lib/api";
import {
  Layers,
  Mail,
  Lock,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Zap,
  FileText,
} from "lucide-react";

interface FormData {
  email: string;
  password: string;
}

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

const FEATURES = [
  {
    icon: Zap,
    title: "AI-Powered Extraction",
    desc: "Auto-generate use cases, requirements & test suites from any document.",
  },
  {
    icon: ShieldCheck,
    title: "100% Traceability",
    desc: "Bi-directional linking across your entire requirements chain.",
  },
  {
    icon: FileText,
    title: "Multi-Format OCR",
    desc: "Parse PDFs, DOCX, Figma screenshots, and scanned architecture specs.",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);

  function validateField(field: string, value: string): string | undefined {
    switch (field) {
      case "email":
        if (!value.trim()) return "Email is required.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Enter a valid email address.";
        break;
      case "password":
        if (!value) return "Password is required.";
        break;
    }
    return undefined;
  }

  function handleChange(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      const error = validateField(field, value);
      setErrors((prev) => ({
        ...prev,
        [field]: error,
        general: undefined,
      }));
    }
  }

  function handleBlur(field: string) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field as keyof FormData]);
    setErrors((prev) => ({ ...prev, [field]: error }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const newErrors: FormErrors = {};
    Object.entries(formData).forEach(([field, value]) => {
      const error = validateField(field, value);
      if (error) newErrors[field as keyof FormErrors] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTouched({ email: true, password: true });
      return;
    }

    setLoading(true);
    setNotification(null);
    try {
      await auth.login(formData);
      window.location.href = "/projects";
    } catch (error) {
      if (!mounted.current) return;
      setLoading(false);
      const err = error instanceof Error ? error : new Error("Unable to log in.");
      const status = (err as any).status as number | undefined;
      const message = err.message || "Unable to log in.";

      if (status === 403 || message.toLowerCase().includes("deactivated")) {
        setErrors((prev) => ({ ...prev, general: "This account has been deactivated." }));
        setNotification({ type: "error", message: "This account has been deactivated." });
      } else {
        setErrors((prev) => ({ ...prev, general: "Invalid email or password." }));
        setNotification({ type: "error", message: "Invalid email or password." });
      }
    }
  }

  return (
    <div className="flex min-h-screen bg-paper dark:bg-slate-950">
      {/* Left Panel — Feature Showcase (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-[48%] xl:w-[52%] relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white flex-col justify-between p-10 xl:p-14">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 h-[500px] w-[700px] bg-emerald-500/15 blur-3xl rounded-full" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-[300px] w-[400px] bg-teal-500/10 blur-3xl rounded-full" />

        <div className="relative z-10">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Layers className="h-6 w-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-display text-xl font-bold tracking-tight">Refacto</span>
              <span className="text-[11px] text-emerald-400/80 -mt-0.5">Generative AI Platform</span>
            </div>
          </Link>

          {/* Headline */}
          <div className="mt-16">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/20 mb-5">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Enterprise AI Platform</span>
            </div>
            <h1 className="font-display text-4xl xl:text-5xl font-extrabold tracking-tight leading-[1.15]">
              Transform Documents Into{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                Tested Requirements
              </span>
            </h1>
            <p className="mt-4 text-base text-slate-400 leading-relaxed max-w-lg">
              Upload any spec and get AI-generated use cases, requirements, and test suites — all bi-directionally linked with 100% traceability.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="mt-12 space-y-4">
            {FEATURES.map((f, idx) => {
              const Icon = f.icon;
              return (
                <div
                  key={idx}
                  className="flex items-start gap-4 rounded-xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-sm hover:border-emerald-500/30 transition-colors"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-sm font-bold text-white">{f.title}</h3>
                    <p className="mt-0.5 text-xs text-slate-400">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom badge */}
        <div className="relative z-10 flex items-center gap-2 text-[11px] text-emerald-400/70 font-medium mt-auto pt-8">
          <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>SOC-2 Type II Certified · 99.99% Uptime SLA</span>
        </div>
      </div>

      {/* Right Panel — Sign In Form */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 sm:px-8 py-12">
        <div className="w-full max-w-md">
          {/* Mobile-only brand (hidden on desktop where left panel shows it) */}
          <div className="mb-8 flex items-center justify-center gap-3 lg:hidden">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                <Layers className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                  Refacto
                </span>
                <span className="text-[11px] text-muted -mt-0.5">Generative AI Platform</span>
              </div>
            </Link>
          </div>

          {/* Form Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-xl shadow-slate-200/40 dark:shadow-slate-900/40 p-8 sm:p-10">
            <div className="text-center">
              <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                Welcome Back
              </h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Sign in to your workspace to continue building.
              </p>
            </div>

            {/* Notification Banner */}
            {notification && (
              <div
                className={`mt-6 flex items-center gap-2.5 rounded-xl px-4 py-3 text-[13px] font-medium ${
                  notification.type === "success"
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                    : "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
                }`}
              >
                {notification.type === "error" ? (
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                )}
                <span>{notification.message}</span>
              </div>
            )}

            {/* General error */}
            {errors.general && !notification && (
              <div className="mt-6 flex items-center gap-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 px-4 py-3 text-[13px] font-medium text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{errors.general}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="mt-7 space-y-5">
              <AuthInput
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                onBlur={() => handleBlur("email")}
                error={touched.email && errors.email ? errors.email : undefined}
                placeholder="you@company.com"
                icon={<Mail className="h-4.5 w-4.5" />}
                autoComplete="email"
              />

              <AuthInput
                label="Password"
                type="password"
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
                onBlur={() => handleBlur("password")}
                error={touched.password && errors.password ? errors.password : undefined}
                placeholder="Enter your password"
                icon={<Lock className="h-4.5 w-4.5" />}
                autoComplete="current-password"
              />

              <button
                type="submit"
                disabled={loading}
                className="group w-full flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 px-6 py-3.5 text-[15px] font-bold text-white shadow-lg shadow-emerald-600/20 transition-all hover:shadow-xl hover:shadow-emerald-600/30 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-lg"
              >
                {loading ? (
                  <>
                    <svg className="h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Workspace</span>
                    <ArrowRight className="h-4.5 w-4.5 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="mt-7 flex items-center gap-3">
              <div className="flex-1 border-t border-slate-200 dark:border-slate-800" />
              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">OR</span>
              <div className="flex-1 border-t border-slate-200 dark:border-slate-800" />
            </div>

            {/* Secondary Actions */}
            <div className="mt-6 text-center space-y-3">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Don&apos;t have an account?{" "}
                <Link
                  href="/signup"
                  className="font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                >
                  Create one free
                </Link>
              </p>
              <button
                type="button"
                disabled
                title="Password reset coming soon"
                className="text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400 transition-colors cursor-not-allowed"
              >
                Forgot your password?
              </button>
            </div>
          </div>

          {/* Trust Footer */}
          <div className="mt-8 flex items-center justify-center gap-2 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>Your data is encrypted and secure. We never share your information.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
