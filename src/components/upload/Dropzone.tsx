"use client";

import { useRef, useState } from "react";
import { CloudUpload, FileCode2, Sparkles } from "lucide-react";
import { ALLOWED_FILE_EXTENSIONS, MAX_FILE_SIZE_BYTES } from "@/lib/api";

const ACCEPTED = ALLOWED_FILE_EXTENSIONS.map((ext) => `.${ext}`).join(",");

export function Dropzone({
  onFileSelected,
  onError,
}: {
  onFileSelected: (files: File[]) => void;
  onError?: (message: string) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFiles = (files: FileList | File[]) => {
    const selected = Array.from(files);
    const rejected = selected.find((file) => {
      const extension = file.name.split(".").pop()?.toLowerCase() || "";
      return (
        !ALLOWED_FILE_EXTENSIONS.includes(extension as typeof ALLOWED_FILE_EXTENSIONS[number]) ||
        file.size > MAX_FILE_SIZE_BYTES
      );
    });

    if (rejected) {
      const extension = rejected.name.split(".").pop()?.toLowerCase() || "";
      const message = !ALLOWED_FILE_EXTENSIONS.includes(extension as typeof ALLOWED_FILE_EXTENSIONS[number])
        ? `Unsupported file type: .${extension}`
        : `File is too large. Maximum file size is ${MAX_FILE_SIZE_BYTES / 1024 / 1024} MB.`;
      setMessage(message);
      onError?.(message);
      return;
    }

    setMessage(null);
    onFileSelected(selected);
  };

  const handleFiles = (files: FileList | null) => {
    if (!files?.length) return;
    validateFiles(files);
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      className={`group relative overflow-hidden rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-300 bg-white dark:bg-slate-900/60 ${
        dragging
          ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 scale-[1.005] shadow-lg shadow-emerald-500/10"
          : "border-slate-300 dark:border-slate-800 hover:border-emerald-500/50 hover:bg-slate-50/80 dark:hover:bg-slate-900"
      }`}
    >
      {/* Background Subtle Accent Glow */}
      <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-40 w-80 bg-emerald-500/10 blur-3xl rounded-full" />

      <div className="relative z-10 flex flex-col items-center">
        {/* Cloud Icon */}
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/15 to-teal-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-md shadow-emerald-500/10 group-hover:scale-110 transition-transform">
          <CloudUpload className="h-7 w-7" />
        </div>

        {/* Text */}
        <h3 className="mt-4 font-display text-base font-bold text-slate-900 dark:text-white">
          Drop files here or click to browse
        </h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-md">
          Upload specifications, requirements documents, diagrams, or wireframe screenshots for automated AI extraction.
        </p>

        {/* File Format Pills */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
          {ALLOWED_FILE_EXTENSIONS.map((ext) => (
            <span
              key={ext}
              className="rounded-lg bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 uppercase tracking-wide border border-slate-200 dark:border-slate-700"
            >
              .{ext}
            </span>
          ))}
          <span className="ml-1 text-emerald-600 dark:text-emerald-400 font-bold">
            (Max {MAX_FILE_SIZE_BYTES / 1024 / 1024} MB)
          </span>
        </div>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED}
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />

        {/* Button */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]"
        >
          <Sparkles className="h-4 w-4" />
          <span>Browse Files</span>
        </button>

        {/* Error message */}
        {message && (
          <div className="mt-4 rounded-xl bg-red-50 dark:bg-red-950/60 px-4 py-2 text-xs font-semibold text-red-600 dark:text-red-300 border border-red-200 dark:border-red-800">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
