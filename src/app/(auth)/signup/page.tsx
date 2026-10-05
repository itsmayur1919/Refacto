"use client";

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthInput } from "@/components/auth/AuthInput";
import { auth } from "@/lib/api";
import {
  Layers,
  Building2,
  User,
  Mail,
  Lock,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Zap,
  FileText,
  Check,
  X,
} from "lucide-react";

interface FormData {
  organization_name: string;
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  organization_name?: string;
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

/* ─── Password Strength Indicator ─── */
function PasswordStrengthMeter({ password }: { password: string }) {
  const checks = useMemo(() => {
    return [
      { label: "At least 8 characters", met: password.length >= 8 },
      { label: "Contains uppercase letter", met: /[A-Z]/.test(password) },
      { label: "Contains lowercase letter", met: /[a-z]/.test(password) },
      { label: "Contains a number", met: /\d/.test(password) },
    ];
  }, [password]);

  const score = checks.filter((c) => c.met).length;

  const strengthLabel = score <= 1 ? "Weak" : score === 2 ? "Fair" : score === 3 ? "Good" : "Strong";
  const strengthColor =
    score <= 1
      ? "bg-red-400"
      : score === 2
      ? "bg-amber-400"
      : score === 3
      ? "bg-emerald-400"
      : "bg-emerald-500";

  if (!password) return null;

  return (
    <div className="space-y-2.5 pt-1">
      {/* Strength Bar */}
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-1">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                i <= score ? strengthColor : "bg-slate-200 dark:bg-slate-700"
              }`}
            />
          ))}
        </div>
        <span
          className={`text-[11px] font-bold ${
            score <= 1
              ? "text-red-500"
              : score === 2
              ? "text-amber-500"
              : "text-emerald-600 dark:text-emerald-400"
          }`}
        >
          {strengthLabel}
        </span>
      </div>

      {/* Criteria Checklist */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {checks.map((check) => (
          <div
            key={check.label}
            className={`flex items-center gap-1.5 text-[11px] font-medium transition-colors ${
              check.met
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-slate-400 dark:text-slate-500"
            }`}
          >
            {check.met ? (
              <Check className="h-3 w-3 shrink-0" />
            ) : (
              <X className="h-3 w-3 shrink-0" />
            )}
            <span>{check.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Feature cards on left panel ─── */
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

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    organization_name: "",
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
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

  const validateField = useCallback(
    (field: string, value: string): string | undefined => {
      switch (field) {
        case "organization_name":
          if (!value.trim()) return "Organization name is required.";
          if (value.trim().length < 2) return "Must be at least 2 characters.";
          break;
        case "name":
          if (!value.trim()) return "Your name is required.";
          if (value.trim().length < 2) return "Must be at least 2 characters.";
          break;
        case "email":
          if (!value.trim()) return "Email is required.";
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Enter a valid email address.";
          break;
        case "password":
          if (!value) return "Password is required.";
          if (value.length < 8) return "Password must be at least 8 characters.";
          break;
        case "confirmPassword":
          if (!value) return "Please confirm your password.";
          if (value !== formData.password) return "Passwords do not match.";
          break;
      }
      return undefined;
    },
    [formData.password]
  );

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
    // Re-validate confirmPassword when password changes
    if (field === "password" && touched.confirmPassword && formData.confirmPassword) {
      const confirmError =
        formData.confirmPassword !== value ? "Passwords do not match." : undefined;
      setErrors((prev) => ({ ...prev, confirmPassword: confirmError }));
    }
  }

  function handleBlur(field: string) {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field as keyof FormData]);
    setErrors((prev) => ({ ...prev, [field]: error }));
  }

  const isFormValid = useMemo(() => {
    const { organization_name, name, email, password, confirmPassword } = formData;
    return (
      organization_name.trim().length >= 2 &&
      name.trim().length >= 2 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
      password.length >= 8 &&
      confirmPassword === password
    );
  }, [formData]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    // Touch all fields
    const allTouched: Record<string, boolean> = {};
    Object.keys(formData).forEach((k) => (allTouched[k] = true));
    setTouched(allTouched);

    const newErrors: FormErrors = {};
    Object.entries(formData).forEach(([field, value]) => {
      const error = validateField(field, value);
      if (error) newErrors[field as keyof FormErrors] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setNotification({
        type: "error",
        message: "Please fix the highlighted fields and try again.",
      });
      return;
    }

    setLoading(true);
    setNotification(null);
    try {
      // API doesn't need confirmPassword
      const { confirmPassword: _, ...payload } = formData;
      await auth.signup(payload);
      window.location.href = "/projects";
    } catch (error) {
      if (!mounted.current) return;
      setLoading(false);
      const err = error instanceof Error ? error : new Error("Unable to create account.");
      const status = (err as any).status as number | undefined;
      const message = err.message || "Unable to create account.";

      if (status === 409 || message.toLowerCase().includes("already exists")) {
        setErrors((prev) => ({
          ...prev,
          email: "An account with this email already exists.",
        }));
        setNotification({
          type: "error",
          message: "Email is already registered. Please log in or use a different email.",
        });
      } else if (status === 400) {
        if (message.toLowerCase().includes("email") && message.toLowerCase().includes("password")) {
          setErrors({
            email: "Please enter a valid email address.",
            password: "Password must be at least 8 characters long.",
          });
        } else if (message.toLowerCase().includes("email")) {
          setErrors((prev) => ({ ...prev, email: "Please enter a valid email address." }));
        } else if (message.toLowerCase().includes("password")) {
          setErrors((prev) => ({
            ...prev,
            password: "Password must be at least 8 characters long.",
          }));
        } else {
          setErrors((prev) => ({ ...prev, general: message }));
        }
        setNotification({
          type: "error",
          message: "Please fix the highlighted fields and try again.",
        });
      } else {
        if (message.toLowerCase().includes("email")) {
          setErrors((prev) => ({
            ...prev,
            email: "An account with this email already exists.",
          }));
        } else {
          setErrors((prev) => ({ ...prev, general: message }));
        }
        setNotification({ type: "error", message });
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
              <span className="text-[11px] text-emerald-400/80 -mt-0.5">
                Generative AI Platform
              </span>
            </div>
          </Link>

          {/* Headline */}
          <div className="mt-16">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/20 mb-5">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Start for Free</span>
            </div>
            <h1 className="font-display text-4xl xl:text-5xl font-extrabold tracking-tight leading-[1.15]">
              Build Your First{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                Traceability Suite
              </span>{" "}
              in Minutes
            </h1>
            <p className="mt-4 text-base text-slate-400 leading-relaxed max-w-lg">
              Set up your workspace, upload a document, and let AI generate the full chain of use
              cases, requirements, and test cases.
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

      {/* Right Panel — Sign Up Form */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 sm:px-8 py-8 sm:py-12 overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Mobile-only brand */}
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
                Create Your Account
              </h1>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Set up your organization and start generating requirements in minutes.
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
                label="Organization Name"
                type="text"
                value={formData.organization_name}
                onChange={(e) => handleChange("organization_name", e.target.value)}
                onBlur={() => handleBlur("organization_name")}
                error={touched.organization_name ? errors.organization_name : undefined}
                success={
                  touched.organization_name &&
                  !errors.organization_name &&
                  formData.organization_name.trim().length >= 2
                }
                placeholder="Acme Engineering Inc."
                icon={<Building2 className="h-4.5 w-4.5" />}
              />

              <AuthInput
                label="Full Name"
                type="text"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                onBlur={() => handleBlur("name")}
                error={touched.name ? errors.name : undefined}
                success={touched.name && !errors.name && formData.name.trim().length >= 2}
                placeholder="Alex Chen"
                icon={<User className="h-4.5 w-4.5" />}
                autoComplete="name"
              />

              <AuthInput
                label="Work Email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                onBlur={() => handleBlur("email")}
                error={touched.email ? errors.email : undefined}
                success={
                  touched.email &&
                  !errors.email &&
                  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
                }
                placeholder="you@company.com"
                icon={<Mail className="h-4.5 w-4.5" />}
                autoComplete="email"
              />

              <div className="space-y-1.5">
                <AuthInput
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  onBlur={() => handleBlur("password")}
                  error={touched.password ? errors.password : undefined}
                  placeholder="Create a strong password"
                  icon={<Lock className="h-4.5 w-4.5" />}
                  autoComplete="new-password"
                />
                <PasswordStrengthMeter password={formData.password} />
              </div>

              <AuthInput
                label="Confirm Password"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleChange("confirmPassword", e.target.value)}
                onBlur={() => handleBlur("confirmPassword")}
                error={touched.confirmPassword ? errors.confirmPassword : undefined}
                success={
                  touched.confirmPassword &&
                  !errors.confirmPassword &&
                  formData.confirmPassword === formData.password &&
                  formData.confirmPassword.length > 0
                }
                placeholder="Re-enter your password"
                icon={<Lock className="h-4.5 w-4.5" />}
                autoComplete="new-password"
              />

              <button
                type="submit"
                disabled={loading || !isFormValid}
                className="group w-full flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 px-6 py-3.5 text-[15px] font-bold text-white shadow-lg shadow-emerald-600/20 transition-all hover:shadow-xl hover:shadow-emerald-600/30 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-lg"
              >
                {loading ? (
                  <>
                    <svg
                      className="h-5 w-5 animate-spin text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    <span>Creating your account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account & Get Started</span>
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

            {/* Sign In Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>

          {/* Trust Footer */}
          <div className="mt-8 flex items-center justify-center gap-2 text-[11px] text-slate-400 dark:text-slate-500 font-medium text-center">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <span>
              We never share your data. Read our{" "}
              <a href="#" className="text-emerald-600 dark:text-emerald-400 hover:underline">
                privacy policy
              </a>
              .
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
