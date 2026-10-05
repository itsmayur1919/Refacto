"use client";

import { forwardRef, InputHTMLAttributes, useState } from "react";
import { AlertCircle, Eye, EyeOff, CheckCircle2 } from "lucide-react";

export interface AuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
  success?: boolean;
}

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  ({ label, error, hint, icon, success, type, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    const inputType = isPassword && showPassword ? "text" : type;

    return (
      <div className="space-y-1.5">
        <label className="flex items-center justify-between">
          <span className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">
            {label}
          </span>
          {success && !error && (
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          )}
        </label>
        <div className="relative">
          {icon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            type={inputType}
            className={`w-full rounded-xl border bg-white dark:bg-slate-900/80 text-[14px] text-slate-900 dark:text-slate-100 outline-none transition-all duration-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 ${
              icon ? "pl-10" : "pl-4"
            } ${isPassword ? "pr-12" : "pr-4"} py-3 ${
              error
                ? "border-red-400 bg-red-50/50 dark:bg-red-950/20 focus:border-red-500 focus:ring-2 focus:ring-red-500/15"
                : success
                ? "border-emerald-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
                : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
            }`}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              tabIndex={-1}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
            </button>
          )}
        </div>
        {error && (
          <div className="flex items-start gap-1.5 pt-0.5 text-[12px] font-medium text-red-600 dark:text-red-400">
            <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {hint && !error && (
          <p className="text-[12px] text-slate-500 dark:text-slate-400 pt-0.5">{hint}</p>
        )}
      </div>
    );
  }
);

AuthInput.displayName = "AuthInput";
