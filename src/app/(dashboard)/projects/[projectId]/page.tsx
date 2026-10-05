"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  FileText,
  Loader2,
  RefreshCw,
  Trash2,
  Upload,
  Sparkles,
  Eye,
  Edit3,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  X,
  FileCode,
  FileSpreadsheet,
  Image as ImageIcon,
  Layers,
  Database,
} from "lucide-react";
import { Dropzone } from "@/components/upload/Dropzone";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { api, MAX_FILE_SIZE_BYTES } from "@/lib/api";
import { formatDateTime, formatDate } from "@/lib/formatDate";
import type { UploadedFile, UseCase } from "@/lib/types";

type UploadItem = UploadedFile & {
  progress?: number;
  sourceFile?: File;
};

type Notification = {
  type: "success" | "error";
  message: string;
};

function getFileIcon(typeString: string) {
  const ext = (typeString || "").toLowerCase();
  if (["png", "jpg", "jpeg", "svg"].includes(ext)) {
    return <ImageIcon className="h-5 w-5 text-indigo-500" />;
  }
  if (["xls", "xlsx", "csv"].includes(ext)) {
    return <FileSpreadsheet className="h-5 w-5 text-emerald-500" />;
  }
  if (["json", "xml", "html"].includes(ext)) {
    return <FileCode className="h-5 w-5 text-amber-500" />;
  }
  return <FileText className="h-5 w-5 text-teal-500" />;
}

function formatBytes(bytes?: number): string {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export default function ProjectUploadPage({ params }: { params: { projectId: string } }) {
  const router = useRouter();
  const [files, setFiles] = useState<UploadItem[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [detailUseCases, setDetailUseCases] = useState<UseCase[]>([]);
  const [renameTarget, setRenameTarget] = useState<UploadedFile | null>(null);
  const [renameName, setRenameName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<UploadedFile | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [generatingFileId, setGeneratingFileId] = useState<number | null>(null);
  const [copiedText, setCopiedText] = useState(false);

  useEffect(() => {
    loadFiles();
  }, [params.projectId]);

  async function loadFiles() {
    setLoadingFiles(true);
    setGlobalError(null);
    try {
      const projectFiles = await api.getProjectFiles(Number(params.projectId));
      setFiles(projectFiles);
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : "Unable to load uploaded documents.");
    } finally {
      setLoadingFiles(false);
    }
  }

  const orderedFiles = useMemo(
    () => [...files].sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()),
    [files]
  );

  // Stats calculation
  const stats = useMemo(() => {
    const total = files.length;
    const completed = files.filter((f) => f.extraction_status === "completed").length;
    const ocrCount = files.filter((f) => f.ocr_used).length;
    const totalUseCases = files.reduce((acc, f) => acc + (f.use_case_count || 0), 0);
    return { total, completed, ocrCount, totalUseCases };
  }, [files]);

  async function startUpload(item: UploadItem) {
    if (!item.sourceFile) return;

    setFiles((prev) =>
      prev.map((f) => (f.id === item.id ? { ...f, extraction_status: "uploading", progress: 0 } : f))
    );

    const formData = new FormData();
    formData.append("file", item.sourceFile);
    formData.append("project_id", params.projectId);

    try {
      const data = await api.uploadFileWithProgress(formData, (progress) => {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === item.id ? { ...f, progress, extraction_status: "uploading" } : f
          )
        );
      });

      setFiles((prev) =>
        prev.map((f) =>
          f.id === item.id
            ? {
                ...f,
                id: data.file_id,
                extraction_status: data.extraction_status || "pending",
                progress: 100,
                ocr_used: data.ocr_used ?? f.ocr_used,
              }
            : f
        )
      );

      await pollFile(data.file_id);
      await loadFiles();
      setNotification({ type: "success", message: "Upload completed and processing started." });
    } catch (error) {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === item.id
            ? {
                ...f,
                extraction_status: "failed",
                progress: undefined,
              }
            : f
        )
      );
      setNotification({
        type: "error",
        message: error instanceof Error ? error.message : "Upload failed. Please try again.",
      });
    }
  }

  async function pollFile(fileId: number) {
    const maxAttempts = 15;
    let attempts = 0;

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      attempts += 1;

      try {
        const updated = await api.getFile(fileId);
        setFiles((prev) =>
          prev.map((f) => (f.id === fileId ? { ...f, ...updated } : f))
        );
        if (updated.extraction_status === "completed" || updated.extraction_status === "failed") {
          return;
        }
      } catch {
        // continue polling until timeout
      }
    }
  }

  function queueFiles(selectedFiles: File[]) {
    setGlobalError(null);
    const newItems = selectedFiles.map((file) => ({
      id: -Date.now() - Math.random(),
      project_id: Number(params.projectId),
      file_name: file.name,
      file_type: file.name.split(".").pop()?.toLowerCase() || "other",
      file_size_bytes: file.size,
      ocr_used: false,
      extraction_status: "queued",
      extraction_error: null,
      uploaded_at: new Date().toISOString(),
      processed_at: null,
      extracted_text: null,
      use_case_count: 0,
      priority: "medium",
      status: "draft",
      sourceFile: file,
    })) as UploadItem[];

    setFiles((prev) => [...newItems, ...prev]);
    newItems.forEach((item) => startUpload(item));
  }

  function handleFileSelected(selectedFiles: File[]) {
    const invalid = selectedFiles.find((file) => file.size > MAX_FILE_SIZE_BYTES);
    if (invalid) {
      const message = `File is too large. Maximum allowed size is ${MAX_FILE_SIZE_BYTES / 1024 / 1024} MB.`;
      setGlobalError(message);
      setNotification({ type: "error", message });
      return;
    }
    queueFiles(selectedFiles);
  }

  async function openFileDetails(file: UploadedFile) {
    setActionLoading(true);
    setSelectedFile(file);
    try {
      const latestFile = await api.getFile(file.id);
      setSelectedFile(latestFile);
      const useCases = await api.getUseCases(Number(params.projectId));
      setDetailUseCases(useCases.filter((uc) => uc.file_id === file.id));
    } catch (error) {
      setNotification({
        type: "error",
        message: error instanceof Error ? error.message : "Unable to load file details.",
      });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRenameFile() {
    if (!renameTarget) return;
    if (!renameName.trim()) {
      setNotification({ type: "error", message: "Document name cannot be empty." });
      return;
    }
    setActionLoading(true);
    try {
      const updated = await api.renameFile(renameTarget.id, renameName.trim());
      setFiles((prev) => prev.map((file) => (file.id === updated.id ? updated : file)));
      setRenameTarget(null);
      setRenameName("");
      setNotification({ type: "success", message: "Document name updated." });
    } catch (error) {
      setNotification({ type: "error", message: error instanceof Error ? error.message : "Unable to rename document." });
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDeleteFile() {
    if (!deleteTarget) return;
    setActionLoading(true);
    try {
      await api.deleteFile(deleteTarget.id);
      setFiles((prev) => prev.filter((file) => file.id !== deleteTarget.id));
      setDeleteTarget(null);
      setNotification({ type: "success", message: "Document removed from project." });
    } catch (error) {
      setNotification({ type: "error", message: error instanceof Error ? error.message : "Unable to delete document." });
    } finally {
      setActionLoading(false);
    }
  }

  function handleGoToTraceability(file: UploadedFile) {
    router.push(`/projects/${params.projectId}/traceability?step=userstories&file_id=${file.id}`);
  }

  const copyExtractedText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 mb-2">
            <Upload className="h-3.5 w-3.5 text-emerald-500" />
            <span>DOCUMENT PROCESSING WORKSPACE</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Document Upload
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Manage file uploads, review extraction status, and prepare documents for automated use case generation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-sm">
            Max File Size: <span className="text-emerald-600 dark:text-emerald-400">{MAX_FILE_SIZE_BYTES / 1024 / 1024} MB</span>
          </div>
          <button
            type="button"
            onClick={loadFiles}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <RefreshCw className={`h-4 w-4 ${loadingFiles ? "animate-spin text-emerald-500" : ""}`} />
            <span>Refresh Workspace</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Widgets */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Uploaded Files</span>
            <FileText className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 font-display text-3xl font-extrabold text-slate-900 dark:text-white">
            {stats.total}
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">In project repository</p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Extraction Completed</span>
            <CheckCircle2 className="h-4 w-4 text-teal-500" />
          </div>
          <div className="mt-2 font-display text-3xl font-extrabold text-slate-900 dark:text-white">
            {stats.completed} / {stats.total}
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Ready for LLM parsing</p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>OCR Processed</span>
            <Database className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="mt-2 font-display text-3xl font-extrabold text-slate-900 dark:text-white">
            {stats.ocrCount}
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Image & scanned PDF text</p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>Use Cases Generated</span>
            <Sparkles className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 font-display text-3xl font-extrabold text-slate-900 dark:text-white">
            {stats.totalUseCases}
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">Total derived functional scenarios</p>
        </div>
      </div>

      {/* Main Upload Dropzone */}
      <Dropzone onFileSelected={handleFileSelected} onError={setGlobalError} />

      {/* Global Error or Success Notifications */}
      {(globalError || notification) && (
        <div
          className={`flex items-center justify-between rounded-2xl p-4 text-xs font-semibold shadow-sm border ${
            globalError || notification?.type === "error"
              ? "bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
              : "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
          }`}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{globalError || notification?.message}</span>
          </div>
          <button
            onClick={() => {
              setGlobalError(null);
              setNotification(null);
            }}
            className="hover:opacity-75"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Selected File Detail Inspector Card */}
      {selectedFile && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl space-y-6">
          <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20">
                {getFileIcon(selectedFile.file_type)}
              </div>
              <div>
                <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                  {selectedFile.file_name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Uploaded {formatDateTime(selectedFile.uploaded_at)} · {formatBytes(selectedFile.file_size_bytes)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedFile(null)}
              className="rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Close Inspector
            </button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Metadata Overview */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Document Overview</h4>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-4 space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-semibold">Extraction Status</span>
                  <StatusBadge value={selectedFile.extraction_status} />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-semibold">OCR Processing</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {selectedFile.ocr_used ? "Enabled (Scanned)" : "Native Text"}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-semibold">Use Cases Generated</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {selectedFile.use_case_count}
                  </span>
                </div>
              </div>
            </div>

            {/* Extracted Text Preview Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Extracted Content Preview</h4>
                {selectedFile.extracted_text && (
                  <button
                    onClick={() => copyExtractedText(selectedFile.extracted_text || "")}
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    {copiedText ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedText ? "Copied!" : "Copy Text"}</span>
                  </button>
                )}
              </div>
              <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-200 p-4 text-xs font-mono leading-relaxed">
                {selectedFile.extracted_text
                  ? selectedFile.extracted_text.substring(0, 1500)
                  : "Extraction details are not available yet."}
              </div>
            </div>
          </div>

          {/* Derived Use Cases */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Derived Use Cases ({detailUseCases.length})
            </h4>
            {detailUseCases.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {detailUseCases.map((uc) => (
                  <div
                    key={uc.usecase_id}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 p-3.5"
                  >
                    <div className="font-bold text-xs text-slate-900 dark:text-white">{uc.title}</div>
                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {uc.description || "No detailed description provided."}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                No use cases generated for this document yet. Click &quot;Queue Use Case Generation&quot; below.
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-3">
              <button
                type="button"
                onClick={() => handleGoToTraceability(selectedFile)}
                disabled={selectedFile.extraction_status !== "completed"}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:scale-[1.01] transition disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                <span>Generate User Stories</span>
              </button>
              <button
                type="button"
                onClick={() => openFileDetails(selectedFile)}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Refresh Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Uploaded Documents List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <Layers className="h-4 w-4 text-emerald-500" />
            <span>Uploaded Project Documents ({orderedFiles.length})</span>
          </div>
        </div>

        {loadingFiles ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-20 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 animate-pulse flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-slate-200 dark:bg-slate-800" />
                  <div className="space-y-2">
                    <div className="h-4 w-48 rounded bg-slate-200 dark:bg-slate-800" />
                    <div className="h-3 w-24 rounded bg-slate-100 dark:bg-slate-800/60" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : orderedFiles.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-8 text-center text-slate-500 dark:text-slate-400 text-xs">
            No documents have been uploaded for this project yet. Use the upload box above to add your first spec file.
          </div>
        ) : (
          <div className="space-y-3">
            {orderedFiles.map((file) => (
              <div
                key={file.id}
                className="group flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm transition-all hover:border-emerald-500/30 hover:shadow-md"
              >
                {/* Left File Meta */}
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    {getFileIcon(file.file_type)}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                      {file.file_name}
                    </h4>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
                      <span>{file.file_type.toUpperCase()}</span>
                      <span>•</span>
                      <span>{formatBytes(file.file_size_bytes)}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(file.uploaded_at)}
                      </span>
                    </div>

                    {/* Active Uploading Progress Bar */}
                    {file.extraction_status === "uploading" && (
                      <div className="mt-2.5 w-full max-w-xs space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          <span>Uploading...</span>
                          <span>{file.progress || 0}%</span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 transition-all duration-300"
                            style={{ width: `${file.progress || 0}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Status Badges */}
                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      <StatusBadge value={file.extraction_status} />
                      {file.use_case_count > 0 ? (
                        <StatusBadge value="completed" />
                      ) : (
                        <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-[10px] font-bold text-slate-500 border border-slate-200 dark:border-slate-700">
                          0 Use Cases
                        </span>
                      )}
                      {file.ocr_used && <StatusBadge value="processing" />}
                    </div>
                  </div>
                </div>

                {/* Right Action Button Group */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => openFileDetails(file)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <Eye className="h-3.5 w-3.5 text-slate-400" />
                    <span>View</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRenameTarget(file);
                      setRenameName(file.file_name);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <Edit3 className="h-3.5 w-3.5 text-slate-400" />
                    <span>Edit</span>
                  </button>

                  {file.extraction_status === "failed" ? (
                    <span className="text-xs font-bold text-red-600 dark:text-red-400 px-2 py-1 bg-red-50 dark:bg-red-950/40 rounded-lg">
                      Extraction Failed
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={file.extraction_status !== "completed"}
                      title={
                        file.extraction_status === "completed"
                          ? "Start Traceability Generation (User Stories)"
                          : "Document extraction must finish before generating"
                      }
                      onClick={() => handleGoToTraceability(file)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:scale-[1.01] transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Generate User Stories</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setDeleteTarget(file)}
                    className="inline-flex items-center justify-center h-8 w-8 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-400 transition-colors"
                    title="Delete document"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rename Document Modal */}
      {renameTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4">
            <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
              Rename Document
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Update the display name for this document artifact.
            </p>
            <input
              value={renameName}
              onChange={(event) => setRenameName(event.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15"
              autoFocus
            />
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRenameTarget(null)}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleRenameFile}
                className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-500 disabled:opacity-50"
              >
                {actionLoading ? "Saving..." : "Save Name"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Document Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <h3 className="font-display text-lg">Delete Document?</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Are you sure you want to remove &quot;{deleteTarget.file_name}&quot;? This will also remove any derived use cases and test suites associated with this file.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleDeleteFile}
                className="rounded-xl bg-red-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? "Deleting..." : "Delete Document"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
