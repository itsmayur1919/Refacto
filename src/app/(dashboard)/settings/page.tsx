"use client";

import { useEffect, useState } from "react";
import {
  Sun,
  Moon,
  Monitor,
  Check,
  Loader2,
  Clock,
  Calendar,
  User as UserIcon,
  Shield,
  Palette,
  Sparkles,
  Save,
  SlidersHorizontal,
  CheckCircle2,
  AlertCircle,
  Key,
} from "lucide-react";
import { auth } from "@/lib/api";
import { applyTheme, getStoredThemePreference, type ThemePreference } from "@/lib/theme";
import { formatRealTimeClock, getStoredDateFormat, type DateFormatOption } from "@/lib/formatDate";
import type { User as UserType } from "@/lib/types";

export default function SettingsPage() {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [themePreference, setThemePreference] = useState<ThemePreference>("auto");
  const [dateFormat, setDateFormat] = useState<DateFormatOption>("DD/MM/YYYY");
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Real-time ticking clock for auditing & tracking
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function loadUser() {
      setLoading(true);
      setError(null);
      try {
        const userData = await auth.getMe();
        setUser(userData);
        setName(userData.name || "");
        setAvatarUrl(userData.avatar_url || "");
        const pref = (userData.theme_preference as ThemePreference) || getStoredThemePreference();
        setThemePreference(pref);
        applyTheme(pref);

        const fmt = (userData.date_format as DateFormatOption) || getStoredDateFormat();
        setDateFormat(fmt);
        localStorage.setItem("date_format", fmt);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load user settings.");
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, []);

  function handleThemeChange(newTheme: ThemePreference) {
    setThemePreference(newTheme);
    applyTheme(newTheme);
  }

  function handleDateFormatChange(newFormat: DateFormatOption) {
    setDateFormat(newFormat);
    localStorage.setItem("date_format", newFormat);
    window.dispatchEvent(new Event("date-format-changed"));
  }

  async function handleSave() {
    if (!name.trim()) {
      setToast({ type: "error", message: "Full name cannot be empty." });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const updated = await auth.updateMe({
        name: name.trim(),
        avatar_url: avatarUrl.trim() || null,
        theme_preference: themePreference,
        date_format: dateFormat,
      });
      setUser(updated);
      applyTheme(updated.theme_preference);
      localStorage.setItem("date_format", dateFormat);
      window.dispatchEvent(new Event("date-format-changed"));

      setToast({ type: "success", message: "Settings saved successfully." });
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to update settings.";
      setToast({ type: "error", message: msg });
      setTimeout(() => setToast(null), 4000);
    } finally {
      setSaving(false);
    }
  }

  const initials = name
    ? name
        .split(" ")
        .map((part) => part[0])
        .filter(Boolean)
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-xs text-slate-500 max-w-4xl mx-auto">
        <Loader2 className="mr-2 h-4 w-4 animate-spin text-emerald-500" />
        <span>Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 mb-2">
            <SlidersHorizontal className="h-3.5 w-3.5 text-emerald-500" />
            <span>ENTERPRISE SYSTEM CONFIGURATION</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Workspace Settings
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Manage profile preferences, UI theme customization, date formatting, and system parameters.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:scale-[1.02] active:scale-[0.98] transition disabled:opacity-60"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>Save Changes</span>
            </>
          )}
        </button>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`flex items-center justify-between rounded-2xl px-4 py-3 text-xs font-semibold shadow-sm border ${
            toast.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
              : "bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-2xl bg-red-50 dark:bg-red-950/60 px-4 py-3 text-xs font-semibold text-red-600 dark:text-red-300 border border-red-200 dark:border-red-800">
          {error}
        </div>
      )}

      {/* SECTION 1: PROFILE */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-4">
          <UserIcon className="h-5 w-5 text-emerald-500" />
          <div>
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">Profile Information</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Update your personal account credentials and display name.</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Avatar Header */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={name}
                className="h-16 w-16 rounded-2xl object-cover ring-2 ring-emerald-500/30 shadow-md"
                onError={() => setAvatarUrl("")}
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 font-display text-xl font-bold text-white shadow-md shadow-emerald-500/20">
                {initials}
              </div>
            )}
            <div className="flex-1 space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Avatar Image URL
              </label>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 px-4 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition"
              />
              <p className="text-[11px] text-slate-400">Provide a direct web link to a PNG, JPG, or SVG avatar.</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter full name"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 px-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={user?.email || ""}
                disabled
                className="w-full cursor-not-allowed rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/60 px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400 outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 px-4 py-3 text-xs">
            <span className="text-slate-500 font-semibold">User ID: <code className="font-mono text-slate-900 dark:text-white">{user?.id}</code></span>
            <span className="text-slate-500 font-semibold">Organization Role: <span className="font-bold text-emerald-600 dark:text-emerald-400 uppercase">{user?.role}</span></span>
          </div>
        </div>
      </div>

      {/* SECTION 2: APPEARANCE */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-4">
          <Palette className="h-5 w-5 text-teal-500" />
          <div>
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">Appearance & Theme</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Choose your preferred visual theme across the dashboard.</p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => handleThemeChange("light")}
            className={`flex flex-col items-center justify-center gap-3 rounded-2xl border p-5 transition text-center ${
              themePreference === "light"
                ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20"
                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 hover:border-slate-300"
            }`}
          >
            <Sun className={`h-6 w-6 ${themePreference === "light" ? "text-emerald-500" : "text-slate-400"}`} />
            <div className="font-bold text-xs">Light Mode</div>
          </button>

          <button
            type="button"
            onClick={() => handleThemeChange("dark")}
            className={`flex flex-col items-center justify-center gap-3 rounded-2xl border p-5 transition text-center ${
              themePreference === "dark"
                ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20"
                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 hover:border-slate-300"
            }`}
          >
            <Moon className={`h-6 w-6 ${themePreference === "dark" ? "text-emerald-500" : "text-slate-400"}`} />
            <div className="font-bold text-xs">Dark Mode</div>
          </button>

          <button
            type="button"
            onClick={() => handleThemeChange("auto")}
            className={`flex flex-col items-center justify-center gap-3 rounded-2xl border p-5 transition text-center ${
              themePreference === "auto"
                ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/20"
                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 hover:border-slate-300"
            }`}
          >
            <Monitor className={`h-6 w-6 ${themePreference === "auto" ? "text-emerald-500" : "text-slate-400"}`} />
            <div className="font-bold text-xs">System Auto</div>
          </button>
        </div>
      </div>

      {/* SECTION 3: DATE & TIME */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-2.5 border-b border-slate-100 dark:border-slate-800 pb-4">
          <Calendar className="h-5 w-5 text-indigo-500" />
          <div>
            <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">Date & Time Preferences</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Configure global date displays and real-time audit timestamps.</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { id: "DD/MM/YYYY", label: "DD/MM/YYYY (Standard)", example: "11/08/2026" },
            { id: "MM/DD/YYYY", label: "MM/DD/YYYY (US Format)", example: "08/11/2026" },
            { id: "YYYY-MM-DD", label: "YYYY-MM-DD (ISO 8601)", example: "2026-08-11" },
            { id: "DD MMM YYYY", label: "DD MMM YYYY (Verbose)", example: "11 Aug 2026" },
          ].map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => handleDateFormatChange(option.id as DateFormatOption)}
              className={`flex items-center justify-between rounded-xl border p-4 text-left transition ${
                dateFormat === option.id
                  ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-slate-900 dark:text-white ring-2 ring-emerald-500/20"
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 hover:border-slate-300"
              }`}
            >
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">{option.label}</div>
                <div className="font-mono text-[11px] text-slate-400 mt-1">Example: {option.example}</div>
              </div>
              {dateFormat === option.id && (
                <span className="rounded-full bg-emerald-500 p-1 text-white">
                  <Check className="h-3.5 w-3.5" />
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Real-time System Clock */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75"></span>
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
              </div>
              <span className="text-xs font-bold text-slate-900 dark:text-white">Real-Time Audit Clock</span>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-1 font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 shadow-sm">
              <Clock className="h-3.5 w-3.5" />
              {formatRealTimeClock(currentTime, dateFormat)}
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400">
            All document uploads, AI processing logs, and traceability revision records are stamped with this live system clock standard.
          </p>
        </div>
      </div>
    </div>
  );
}
