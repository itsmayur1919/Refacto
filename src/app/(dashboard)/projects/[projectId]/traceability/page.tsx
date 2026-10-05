"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  FileText,
  Loader2,
  Sparkles,
  Search,
  Filter,
  Download,
  Check,
  ChevronDown,
  Layers,
  GitBranch,
  ListChecks,
  ShieldCheck,
  Zap,
  Trash2,
} from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { api, exportProjectXlsx } from "@/lib/api";
import type { UploadedFile, Requirement, TestCase, UseCase, UserStory, Priority } from "@/lib/types";

type StepType = "userstories" | "usecases" | "requirements" | "testcases";

export default function TraceabilityStepperPage({ params }: { params: { projectId: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL state synchronization
  const stepParam = (searchParams.get("step") as StepType) || "usecases";
  const fileIdParam = searchParams.get("file_id") ? Number(searchParams.get("file_id")) : null;
  const userStoryIdParam = searchParams.get("userstory_id") ? Number(searchParams.get("userstory_id")) : null;
  const usecaseIdParam = searchParams.get("usecase_id") ? Number(searchParams.get("usecase_id")) : null;
  const requirementIdParam = searchParams.get("requirement_id") ? Number(searchParams.get("requirement_id")) : null;

  const projectId = Number(params.projectId);

  // Data states
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<number | null>(fileIdParam);
  const [userStories, setUserStories] = useState<UserStory[]>([]);
  const [useCases, setUseCases] = useState<UseCase[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [testCases, setTestCases] = useState<TestCase[]>([]);

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  // Selection state for bulk delete
  const [selectedUSIds, setSelectedUSIds] = useState<Set<number>>(new Set());
  const [selectedUCIds, setSelectedUCIds] = useState<Set<number>>(new Set());
  const [selectedReqIds, setSelectedReqIds] = useState<Set<number>>(new Set());
  const [selectedTCIds, setSelectedTCIds] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{ type: string; ids: number[] } | null>(null);

  // UI / Loading / Error states
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [projectName, setProjectName] = useState<string>("Project");
  const [expandedUseCaseId, setExpandedUseCaseId] = useState<number | null>(null);
  const [expandedRequirementId, setExpandedRequirementId] = useState<number | null>(null);
  const [expandedTestCaseId, setExpandedTestCaseId] = useState<number | null>(null);
  const [expandedUserStoryId, setExpandedUserStoryId] = useState<number | null>(null);
  const [promptModal, setPromptModal] = useState<{isOpen: boolean, type: string, targetId: number | null, prompt: string, isSkipped?: boolean, status?: "idle" | "generating"}>({isOpen: false, type: "", targetId: null, prompt: "", status: "idle"});
  const [generationProgress, setGenerationProgress] = useState<number>(0);

  useEffect(() => {
    if (promptModal.status === "generating") {
      setGenerationProgress(0);
      const interval = setInterval(() => {
        setGenerationProgress((prev) => {
          if (prev < 30) return prev + Math.floor(Math.random() * 5) + 2;
          if (prev < 60) return prev + Math.floor(Math.random() * 3) + 1;
          if (prev < 90) return prev + Math.floor(Math.random() * 2) + 1;
          if (prev < 98) return prev + 1;
          return prev;
        });
      }, 600);
      return () => clearInterval(interval);
    } else {
      setGenerationProgress(0);
    }
  }, [promptModal.status]);

  const currentStep: StepType = ["userstories", "usecases", "requirements", "testcases"].includes(stepParam)
    ? stepParam
    : "userstories";

  function showNotification(type: "success" | "error", message: string) {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleConfirmedDelete() {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      const { type, ids } = confirmDelete;
      if (type === "userstories") {
        if (ids.length === 1) {
          await api.deleteUserStory(ids[0]);
        } else {
          await api.bulkDeleteUserStories(ids);
        }
        setUserStories((prev) => prev.filter((us) => !ids.includes(us.user_story_id)));
        setSelectedUSIds(new Set());
        showNotification("success", `${ids.length} user stor${ids.length > 1 ? "ies" : "y"} deleted`);
      } else if (type === "usecases") {
        if (ids.length === 1) {
          await api.deleteUseCase(ids[0]);
        } else {
          await api.bulkDeleteUseCases(ids);
        }
        setUseCases((prev) => prev.filter((uc) => !ids.includes(uc.usecase_id)));
        setSelectedUCIds(new Set());
        showNotification("success", `${ids.length} use case${ids.length > 1 ? "s" : ""} deleted`);
      } else if (type === "requirements") {
        if (ids.length === 1) {
          await api.deleteRequirement(ids[0]);
        } else {
          await api.bulkDeleteRequirements(ids);
        }
        setRequirements((prev) => prev.filter((r) => !ids.includes(r.requirement_id)));
        setSelectedReqIds(new Set());
        showNotification("success", `${ids.length} requirement${ids.length > 1 ? "s" : ""} deleted`);
      } else if (type === "testcases") {
        if (ids.length === 1) {
          await api.deleteTestCase(ids[0]);
        } else {
          await api.bulkDeleteTestCases(ids);
        }
        setTestCases((prev) => prev.filter((t) => !ids.includes(t.test_case_id)));
        setSelectedTCIds(new Set());
        showNotification("success", `${ids.length} test case${ids.length > 1 ? "s" : ""} deleted`);
      }
    } catch {
      showNotification("error", "Delete failed. Please try again.");
    } finally {
      setDeleting(false);
      setConfirmDelete(null);
    }
  }

  function updateUrlParams(updates: { step?: StepType; file_id?: number | null; userstory_id?: number | null; usecase_id?: number | null; requirement_id?: number | null }) {
    const params = new URLSearchParams(searchParams.toString());

    if (updates.step !== undefined) params.set("step", updates.step);

    if (updates.file_id !== undefined) {
      if (updates.file_id === null) params.delete("file_id");
      else params.set("file_id", String(updates.file_id));
    }

    if (updates.userstory_id !== undefined) {
      if (updates.userstory_id === null) params.delete("userstory_id");
      else params.set("userstory_id", String(updates.userstory_id));
    }

    if (updates.usecase_id !== undefined) {
      if (updates.usecase_id === null) params.delete("usecase_id");
      else params.set("usecase_id", String(updates.usecase_id));
    }

    if (updates.requirement_id !== undefined) {
      if (updates.requirement_id === null) params.delete("requirement_id");
      else params.set("requirement_id", String(updates.requirement_id));
    }

    router.push(`/projects/${projectId}/traceability?${params.toString()}`);
  }

  // Load project files on mount
  useEffect(() => {
    async function loadFiles() {
      setLoading(true);
      try {
        const projectFiles = await api.getProjectFiles(projectId);
        setFiles(projectFiles);

        // If no file_id param is provided, fallback to most recent file
        if (!fileIdParam && projectFiles.length > 0) {
          const sorted = [...projectFiles].sort(
            (a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
          );
          setSelectedFileId(sorted[0].id);
        } else if (fileIdParam) {
          setSelectedFileId(fileIdParam);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load project files.");
      } finally {
        setLoading(false);
      }
    }
    loadFiles();
  }, [projectId, fileIdParam]);

  // Fetch project name for export filename
  useEffect(() => {
    api.getProjects()
      .then((projects) => {
        const match = projects.find((p) => p.id === projectId);
        if (match) setProjectName(match.name);
      })
      .catch(() => { /* keep default */ });
  }, [projectId]);

  // Load step data when step / filters change
  useEffect(() => {
    async function fetchStepData() {
      setError(null);
      setLoading(true);
      try {
        const data = await api.getTraceability(projectId, selectedFileId ?? undefined);
        setUserStories(data.user_stories || []);
        setUseCases(data.use_cases);

        if (usecaseIdParam) {
          setRequirements(data.requirements.filter((r) => r.usecase_id === usecaseIdParam));
        } else {
          setRequirements(data.requirements);
        }

        if (requirementIdParam) {
          setTestCases(data.test_cases.filter((t) => t.requirement_id === requirementIdParam));
        } else if (usecaseIdParam) {
          setTestCases(data.test_cases.filter((t) => t.usecase_id === usecaseIdParam));
        } else {
          setTestCases(data.test_cases);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch data for current step.");
      } finally {
        setLoading(false);
      }
    }

    fetchStepData();
  }, [currentStep, selectedFileId, usecaseIdParam, requirementIdParam, projectId]);

  // Filtered Items Computed
  
  async function handleGenerateUserStories() {
    if (!selectedFileId) return;
    setGenerating("file-" + selectedFileId);
    try {
      const prompt = promptModal.prompt;
      const res = await api.generateUserStories(selectedFileId, prompt);
      showNotification("success", `${res.user_stories_generated ?? res.user_stories.length} user stories generated!`);
      const data = await api.getTraceability(projectId, selectedFileId);
      setUserStories(data.user_stories || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate user stories.");
    } finally {
      setGenerating(null);
      setPromptModal({isOpen: false, type: "", targetId: null, prompt: ""});
    }
  }

  async function handleGenerateUseCasesFromStory(userStoryId: number) {
    setGenerating(`us-${userStoryId}`);
    try {
      const prompt = promptModal.prompt;
      const res = await api.generateUseCasesFromUserStory(userStoryId, prompt);
      showNotification("success", `${res.use_cases_generated ?? res.use_cases.length} use cases generated!`);
      const data = await api.getTraceability(projectId, selectedFileId ?? undefined);
      setUseCases(data.use_cases);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate use cases.");
    } finally {
      setGenerating(null);
      setPromptModal({isOpen: false, type: "", targetId: null, prompt: ""});
    }
  }

  async function handleGenerateUseCasesFromFile(fileId: number) {
    setGenerating(`file-${fileId}`);
    try {
      const prompt = promptModal.prompt;
      const res = await api.generateUseCases(fileId, prompt);
      showNotification("success", res.message || "Use cases generated successfully");
      const data = await api.getTraceability(projectId, selectedFileId ?? undefined);
      setUseCases(data.use_cases);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate use cases.");
    } finally {
      setGenerating(null);
      setPromptModal({isOpen: false, type: "", targetId: null, prompt: ""});
    }
  }

  async function handleGenerateRequirementsForRow(usecaseId: number) {
    setGenerating(`uc-${usecaseId}`);
    try {
      const prompt = promptModal.prompt;
      const res = await api.generateRequirements(usecaseId, prompt);
      showNotification("success", `${res.requirements_generated ?? res.requirements.length} requirements generated!`);
      const data = await api.getTraceability(projectId, selectedFileId ?? undefined);
      setRequirements(data.requirements);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate requirements.");
    } finally {
      setGenerating(null);
      setPromptModal({isOpen: false, type: "", targetId: null, prompt: ""});
    }
  }

  async function handleGenerateTestCasesForRow(usecaseId: number, requirementId: number) {
    setGenerating(`req-${requirementId}`);
    try {
      const prompt = promptModal.prompt;
      const res = await api.generateTestCases(usecaseId, requirementId, prompt);
      showNotification("success", `${res.test_cases_generated ?? res.test_cases.length} test cases generated!`);
      const data = await api.getTraceability(projectId, selectedFileId ?? undefined);
      setTestCases(data.test_cases);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate test cases.");
    } finally {
      setGenerating(null);
      setPromptModal({isOpen: false, type: "", targetId: null, prompt: ""});
    }
  }

  const filteredUserStories = useMemo(() => {
    return userStories.filter((us) => {
      const matchSearch = !search || us.title.toLowerCase().includes(search.toLowerCase());
      const matchPriority = priorityFilter === "all" || (us.priority || "").toLowerCase() === priorityFilter.toLowerCase();
      return matchSearch && matchPriority;
    });
  }, [userStories, search, priorityFilter]);

  const filteredUseCases = useMemo(() => {
    return useCases.filter((uc) => {
      const matchSearch =
        !search ||
        uc.title.toLowerCase().includes(search.toLowerCase()) ||
        (uc.actors && uc.actors.toLowerCase().includes(search.toLowerCase()));
      const matchPriority = priorityFilter === "all" || (uc.priority || "").toLowerCase() === priorityFilter.toLowerCase();
      return matchSearch && matchPriority;
    });
  }, [useCases, search, priorityFilter]);

  const filteredRequirements = useMemo(() => {
    return requirements.filter((req) => {
      const matchSearch =
        !search ||
        req.title.toLowerCase().includes(search.toLowerCase()) ||
        (req.requirement_type && req.requirement_type.toLowerCase().includes(search.toLowerCase()));
      const matchPriority = priorityFilter === "all" || (req.priority || "").toLowerCase() === priorityFilter.toLowerCase();
      return matchSearch && matchPriority;
    });
  }, [requirements, search, priorityFilter]);

  const filteredTestCases = useMemo(() => {
    return testCases.filter((tc) => {
      const matchSearch = !search || tc.title.toLowerCase().includes(search.toLowerCase());
      const matchPriority = priorityFilter === "all" || (tc.priority || "").toLowerCase() === priorityFilter.toLowerCase();
      return matchSearch && matchPriority;
    });
  }, [testCases, search, priorityFilter]);

  // Actions
  async function handleExport() {
    setExportLoading(true);
    try {
      await exportProjectXlsx(projectId, projectName);
      showNotification("success", "Traceability matrix export downloaded successfully.");
    } catch (err) {
      showNotification("error", err instanceof Error ? err.message : "Export failed.");
    } finally {
      setExportLoading(false);
    }
  }


  const selectedFile = files.find((f) => f.id === selectedFileId);
  const selectedUseCaseIndex = usecaseIdParam !== null ? useCases.findIndex((uc) => uc.usecase_id === usecaseIdParam) : -1;
  const useCaseLabel = selectedUseCaseIndex !== -1 ? `UC-${String(selectedUseCaseIndex + 1).padStart(2, "0")}` : `UC-${String(usecaseIdParam).padStart(2, "0")}`;

  const selectedRequirementIndex = requirementIdParam !== null ? requirements.findIndex((r) => r.requirement_id === requirementIdParam) : -1;
  const requirementLabel = selectedRequirementIndex !== -1 ? `REQ-${String(selectedRequirementIndex + 1).padStart(2, "0")}` : `REQ-${String(requirementIdParam).padStart(2, "0")}`;

  const getPriorityBadgeClass = (priority?: string) => {
    const p = (priority || "").toLowerCase();
    if (p === "high") return "bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border-red-200 dark:border-red-800";
    if (p === "medium") return "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800";
    return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700";
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 w-full max-w-sm mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-950">
                <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white text-sm">Confirm Delete</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Delete {confirmDelete.ids.length} {confirmDelete.type.replace("cases","case").replace("s"," (s)")}? This cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                disabled={deleting}
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmedDelete}
                disabled={deleting}
                className="flex-1 rounded-xl bg-red-600 py-2 text-xs font-bold text-white hover:bg-red-500 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold shadow-xl transition-all ${
          toast.type === "success"
            ? "bg-emerald-600 text-white"
            : "bg-red-600 text-white"
        }`}>
          {toast.type === "success" ? <CheckCircle2 className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
          {toast.message}
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 mb-2">
            <GitBranch className="h-3.5 w-3.5 text-emerald-500" />
            <span>TRACEABILITY PIPELINE WORKFLOW</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Traceability Matrix
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Step-by-step AI artifact derivation: Document → User Stories → Use Cases → Requirements → Executable Test Suites.
          </p>
        </div>

        {/* Document Selector Dropdown */}
        {files.length > 0 && (
          <div className="flex flex-wrap items-center justify-end gap-3 shrink-0">
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 px-4 py-2.5 shadow-sm max-w-full">
              <FileText className="h-4 w-4 text-emerald-500 shrink-0" />
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 shrink-0 hidden sm:block">
                Active Document:
              </label>
              <select
                value={selectedFileId ?? ""}
                title={selectedFile?.file_name || "Select Document"}
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : null;
                  setSelectedFileId(val);
                  updateUrlParams({ file_id: val, usecase_id: null, requirement_id: null });
                }}
                className="bg-transparent text-xs font-bold text-slate-900 dark:text-white outline-none cursor-pointer w-32 sm:w-48 md:w-64 truncate"
              >
                {files.map((f) => (
                  <option key={f.id} value={f.id} className="text-slate-900 dark:text-white bg-white dark:bg-slate-900">
                    {f.file_name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleExport}
              disabled={exportLoading}
              className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 shadow-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50 whitespace-nowrap"
            >
              <Download className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>{exportLoading ? "Exporting..." : "Export .xlsx"}</span>
            </button>
          </div>
        )}
      </div>

      {/* Stepper Progress Navigation Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-2 shadow-sm">
        {/* Step 1 */}
        <button
          type="button"
          onClick={() => updateUrlParams({ step: "userstories" })}
          className={`flex items-center gap-3.5 rounded-xl px-4 py-3 text-left transition-all ${
            currentStep === "userstories"
              ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-md shadow-emerald-600/20"
              : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-bold text-xs ${
              currentStep === "userstories"
                ? "bg-white/20 text-white"
                : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            }`}
          >
            1
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase tracking-wider font-semibold opacity-80">STEP 1</div>
            <div className="truncate text-xs sm:text-sm font-extrabold">User Stories ({userStories.length})</div>
          </div>
        </button>

        {/* Step 2 */}
        <button
          type="button"
          onClick={() => updateUrlParams({ step: "usecases" })}
          className={`flex items-center gap-3.5 rounded-xl px-4 py-3 text-left transition-all ${
            currentStep === "usecases"
              ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-md shadow-emerald-600/20"
              : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-bold text-xs ${
              currentStep === "usecases"
                ? "bg-white/20 text-white"
                : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            }`}
          >
            1
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase tracking-wider font-semibold opacity-80">STEP 1</div>
            <div className="truncate text-xs sm:text-sm font-extrabold">Use Cases ({useCases.length})</div>
          </div>
        </button>

        {/* Step 2 */}
        <button
          type="button"
          onClick={() => updateUrlParams({ step: "requirements" })}
          className={`flex items-center gap-3.5 rounded-xl px-4 py-3 text-left transition-all ${
            currentStep === "requirements"
              ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-md shadow-emerald-600/20"
              : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-bold text-xs ${
              currentStep === "requirements"
                ? "bg-white/20 text-white"
                : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            }`}
          >
            2
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase tracking-wider font-semibold opacity-80">STEP 2</div>
            <div className="truncate text-xs sm:text-sm font-extrabold">Requirements ({requirements.length})</div>
          </div>
        </button>

        {/* Step 3 */}
        <button
          type="button"
          onClick={() => updateUrlParams({ step: "testcases" })}
          className={`flex items-center gap-3.5 rounded-xl px-4 py-3 text-left transition-all ${
            currentStep === "testcases"
              ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-md shadow-emerald-600/20"
              : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-bold text-xs ${
              currentStep === "testcases"
                ? "bg-white/20 text-white"
                : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
            }`}
          >
            3
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase tracking-wider font-semibold opacity-80">STEP 3</div>
            <div className="truncate text-xs sm:text-sm font-extrabold">Test Cases ({testCases.length})</div>
          </div>
        </button>
      </div>

      {/* Toast Banner */}
      {toast && (
        <div
          className={`flex items-center justify-between rounded-2xl px-4 py-3 text-xs font-semibold shadow-sm border ${
            toast.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
              : "bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Empty State when no document exists */}
      {!loading && files.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-12 text-center">
          <FileText className="mx-auto h-12 w-12 text-slate-400 mb-3" />
          <h3 className="font-display text-lg font-bold text-slate-900 dark:text-white">
            No Documents Uploaded
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            Upload a specification document first before deriving use cases and test suites.
          </p>
          <button
            type="button"
            onClick={() => router.push(`/projects/${projectId}`)}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-500 transition"
          >
            <span>Go to Document Uploads</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Controls Bar: Search & Priority Filter */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 shadow-sm">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Filter ${currentStep} by title or ID...`}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white outline-none transition focus:border-emerald-500 placeholder:text-slate-400"
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-xl bg-slate-100 dark:bg-slate-950 px-3 py-2 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <Filter className="h-3.5 w-3.5 text-slate-400" />
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="bg-transparent outline-none cursor-pointer text-xs font-semibold"
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>
            </div>
          </div>

          {/* STEP 1: USER STORIES SCREEN */}
          {currentStep === "userstories" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                  Generated User Stories {selectedFile ? `(${selectedFile.file_name})` : ""}
                </h2>
                <div className="flex gap-2">
                  {filteredUserStories.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setPromptModal({ isOpen: true, type: "userstories", targetId: null, prompt: "" })}
                      disabled={generating !== null || !selectedFileId}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800 px-4 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition disabled:opacity-50"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Generate More</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => updateUrlParams({ step: "usecases", userstory_id: null })}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <span>NEXT (All Use Cases)</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                    <span>Loading derived user stories...</span>
                  </div>
                  <div className="h-10 rounded-xl bg-slate-100 dark:bg-slate-800/60 animate-pulse" />
                </div>
              ) : filteredUserStories.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center">
                  <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40 mb-4">
                    <Sparkles className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">No User Stories</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Start your traceability pipeline by generating Agile user stories from the uploaded document.</p>
                  <button
                    type="button"
                    onClick={() => setPromptModal({ isOpen: true, type: "userstories", targetId: null, prompt: "" })}
                    disabled={generating !== null || !selectedFileId}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-500 transition disabled:opacity-50"
                  >
                    {generating !== null ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    <span>Generate User Stories with AI</span>
                  </button>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-500 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="px-4 py-3.5">ID</th>
                        <th className="px-4 py-3.5">User Story Title</th>
                        <th className="px-4 py-3.5">Priority</th>
                        <th className="px-4 py-3.5">Status</th>
                        <th className="px-4 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {filteredUserStories.map((us, idx) => (
                        <React.Fragment key={us.user_story_id}>
                          <tr 
                            onClick={() => setExpandedUserStoryId(expandedUserStoryId === us.user_story_id ? null : us.user_story_id)}
                            className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer"
                          >
                            <td className="px-4 py-4 whitespace-nowrap text-xs font-bold text-slate-400">
                              US-{String(idx + 1).padStart(2, "0")}
                            </td>
                            <td className="px-4 py-4 font-semibold text-slate-900 dark:text-white">
                              {us.title}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                              <select
                                value={(us.priority || "medium").toLowerCase()}
                                onChange={async (e) => {
                                  const val = e.target.value as any;
                                  setUserStories((prev) => prev.map((s) => (s.user_story_id === us.user_story_id ? { ...s, priority: val } : s)));
                                  try {
                                    await api.updateUserStory(us.user_story_id, { priority: val });
                                  } catch (err) {
                                    console.error("Failed to update priority", err);
                                  }
                                }}
                                className={`rounded-full px-2.5 py-1 text-[10px] font-bold border capitalize cursor-pointer outline-none bg-white dark:bg-slate-900 ${getPriorityBadgeClass(
                                  us.priority
                                )}`}
                              >
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                              </select>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                              <select
                                value={(us.status || "draft").toLowerCase()}
                                onChange={async (e) => {
                                  const val = e.target.value as any;
                                  setUserStories((prev) => prev.map((s) => (s.user_story_id === us.user_story_id ? { ...s, status: val } : s)));
                                  try {
                                    await api.updateUserStory(us.user_story_id, { status: val });
                                  } catch (err) {
                                    console.error("Failed to update status", err);
                                  }
                                }}
                                className="rounded-full px-2.5 py-1 text-[10px] font-bold border capitalize cursor-pointer outline-none bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                              >
                                <option value="draft">Draft</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                              </select>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPromptModal({ isOpen: true, type: "usecases", targetId: us.user_story_id, prompt: "" });
                                  }}
                                  disabled={generating !== null}
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/40 px-3 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition disabled:opacity-50"
                                >
                                  {generating === `us-${us.user_story_id}` ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Sparkles className="h-3 w-3" />
                                  )}
                                  <span>Generate Use Cases</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirmDelete({ type: "userstories", ids: [us.user_story_id] });
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition"
                                  title="Delete User Story"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                          {expandedUserStoryId === us.user_story_id && (
                            <tr className="bg-slate-50 dark:bg-slate-900/50 border-t-0">
                              <td colSpan={5} className="px-6 py-6">
                                <div className="space-y-4 max-w-4xl">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1 flex justify-between">
                                        <span>Description</span>
                                        <span className="text-[9px] font-normal">Auto-saves on blur</span>
                                      </h4>
                                      <textarea
                                        defaultValue={us.description || ""}
                                        onBlur={async (e) => {
                                          const val = e.target.value;
                                          setUserStories(prev => prev.map(s => s.user_story_id === us.user_story_id ? { ...s, description: val } : s));
                                          try { await api.updateUserStory(us.user_story_id, { description: val }); } catch (err) { console.error(err); }
                                        }}
                                        className="w-full min-h-[100px] text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 outline-none focus:border-emerald-500"
                                      />
                                    </div>
                                    <div>
                                      <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1 flex justify-between">
                                        <span>Acceptance Criteria</span>
                                        <span className="text-[9px] font-normal">Auto-saves on blur</span>
                                      </h4>
                                      <textarea
                                        defaultValue={us.acceptance_criteria || ""}
                                        onBlur={async (e) => {
                                          const val = e.target.value;
                                          setUserStories(prev => prev.map(s => s.user_story_id === us.user_story_id ? { ...s, acceptance_criteria: val } : s));
                                          try { await api.updateUserStory(us.user_story_id, { acceptance_criteria: val }); } catch (err) { console.error(err); }
                                        }}
                                        className="w-full min-h-[100px] text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 outline-none focus:border-emerald-500"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: USE CASE SCREEN */}
          {currentStep === "usecases" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                  Generated Use Cases {selectedFile ? `(${selectedFile.file_name})` : ""}
                </h2>
                <button
                  type="button"
                  onClick={() => updateUrlParams({ step: "requirements", usecase_id: null })}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <span>NEXT (All Requirements)</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              {loading ? (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                    <span>Loading derived use cases...</span>
                  </div>
                  <div className="h-10 rounded-xl bg-slate-100 dark:bg-slate-800/60 animate-pulse" />
                  <div className="h-10 rounded-xl bg-slate-100 dark:bg-slate-800/60 animate-pulse" />
                </div>
              ) : filteredUseCases.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center">
                  <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40 mb-4">
                    <Layers className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">No Use Cases</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">Generate use cases from the document directly, or go back to User Stories to generate from individual stories.</p>
                  <div className="flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => selectedFileId && setPromptModal({ isOpen: true, type: "fileusecase_" + selectedFileId, targetId: selectedFileId, prompt: "" })}
                      disabled={generating !== null || !selectedFileId}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-500 transition disabled:opacity-50"
                    >
                      {generating !== null ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      <span>Generate from Document</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => updateUrlParams({ step: "userstories" })}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 px-5 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span>Back to User Stories</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-500 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="px-4 py-3.5 w-10">
                          <input
                            type="checkbox"
                            className="rounded"
                            checked={filteredUseCases.length > 0 && filteredUseCases.every((uc) => selectedUCIds.has(uc.usecase_id))}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedUCIds(new Set(filteredUseCases.map((uc) => uc.usecase_id)));
                              } else {
                                setSelectedUCIds(new Set());
                              }
                            }}
                          />
                        </th>
                        <th className="px-5 py-3.5">ID</th>
                        <th className="px-5 py-3.5">Title</th>
                        <th className="px-5 py-3.5">Actors</th>
                        <th className="px-5 py-3.5">Priority</th>
                        <th className="px-5 py-3.5">Status</th>
                        <th className="px-5 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    {selectedUCIds.size > 0 && (
                      <tbody>
                        <tr className="bg-red-50 dark:bg-red-950/30">
                          <td colSpan={7} className="px-5 py-2.5">
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-bold text-red-700 dark:text-red-400">{selectedUCIds.size} selected</span>
                              <button
                                type="button"
                                onClick={() => setConfirmDelete({ type: "usecases", ids: Array.from(selectedUCIds) })}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-500 transition"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete Selected
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedUCIds(new Set())}
                                className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition"
                              >
                                Clear selection
                              </button>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    )}
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                      {filteredUseCases.map((uc, index) => (
                        <React.Fragment key={uc.usecase_id}>
                          <tr
                            className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${selectedUCIds.has(uc.usecase_id) ? "bg-red-50/50 dark:bg-red-950/20" : ""}`}
                            onClick={() =>
                              setExpandedUseCaseId(expandedUseCaseId === uc.usecase_id ? null : uc.usecase_id)
                            }
                          >
                            <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                className="rounded"
                                checked={selectedUCIds.has(uc.usecase_id)}
                                onChange={(e) => {
                                  const next = new Set(selectedUCIds);
                                  if (e.target.checked) next.add(uc.usecase_id);
                                  else next.delete(uc.usecase_id);
                                  setSelectedUCIds(next);
                                }}
                              />
                            </td>
                            <td className="px-5 py-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              <span className="inline-flex items-center gap-1.5">
                                <ChevronRight
                                  className={`h-3.5 w-3.5 transition-transform ${
                                    expandedUseCaseId === uc.usecase_id ? "rotate-90 text-emerald-500" : "text-slate-400"
                                  }`}
                                />
                                UC-{String(index + 1).padStart(2, "0")}
                              </span>
                            </td>
                            <td className="px-5 py-4 font-bold text-slate-900 dark:text-white">{uc.title}</td>
                            <td className="px-5 py-4 text-slate-500 dark:text-slate-400">{uc.actors || "—"}</td>
                            <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                              <select
                                value={(uc.priority || "medium").toLowerCase()}
                                onChange={async (e) => {
                                  const val = e.target.value as Priority;
                                  setUseCases((prev) => prev.map((u) => (u.usecase_id === uc.usecase_id ? { ...u, priority: val } : u)));
                                  try {
                                    await api.updateUseCase(uc.usecase_id, { priority: val });
                                  } catch (err) {
                                    console.error("Failed to update priority", err);
                                  }
                                }}
                                className={`rounded-full px-2.5 py-1 text-[10px] font-bold border capitalize cursor-pointer outline-none bg-white dark:bg-slate-900 ${getPriorityBadgeClass(
                                  uc.priority
                                )}`}
                              >
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                              </select>
                            </td>
                            <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                              <select
                                value={(uc.status || "draft").toLowerCase()}
                                onChange={async (e) => {
                                  const val = e.target.value as any;
                                  setUseCases((prev) => prev.map((u) => (u.usecase_id === uc.usecase_id ? { ...u, status: val } : u)));
                                  try {
                                    await api.updateUseCase(uc.usecase_id, { status: val });
                                  } catch (err) {
                                    console.error("Failed to update status", err);
                                  }
                                }}
                                className="rounded-full px-2.5 py-1 text-[10px] font-bold border capitalize cursor-pointer outline-none bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                              >
                                <option value="draft">Draft</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                              </select>
                            </td>
                            <td className="px-5 py-4 text-right flex items-center justify-end gap-2">
                              <button
                                type="button"
                                disabled={generating === `uc-${uc.usecase_id}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPromptModal({ isOpen: true, type: "requirements", targetId: uc.usecase_id, prompt: "" });
                                }}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:scale-[1.01] transition disabled:opacity-50"
                              >
                                {generating === `uc-${uc.usecase_id}` ? (
                                  <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    <span>Generating...</span>
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="h-3.5 w-3.5" />
                                    <span>Generate Requirements</span>
                                  </>
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmDelete({ type: "usecases", ids: [uc.usecase_id] });
                                }}
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition"
                                title="Delete Use Case"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                          {expandedUseCaseId === uc.usecase_id && (
                            <tr>
                              <td colSpan={7} className="bg-slate-50/80 dark:bg-slate-950/60 px-6 py-5 text-xs">
                                <div className="space-y-4">
                                  <div>
                                    <div className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">
                                      Description
                                    </div>
                                    <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                                      {uc.description || <span className="italic text-slate-400">Not specified</span>}
                                    </p>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5">
                                      <div className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">
                                        Pre-Condition
                                      </div>
                                      <p className="whitespace-pre-line text-slate-700 dark:text-slate-300 font-medium">
                                        {uc.preconditions || <span className="italic text-slate-400">Not specified</span>}
                                      </p>
                                    </div>
                                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5">
                                      <div className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">
                                        Post-Condition
                                      </div>
                                      <p className="whitespace-pre-line text-slate-700 dark:text-slate-300 font-medium">
                                        {uc.postconditions || <span className="italic text-slate-400">Not specified</span>}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5">
                                    <div className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">
                                      Main Execution Flow
                                    </div>
                                    <p className="whitespace-pre-line text-slate-700 dark:text-slate-300 font-mono text-[11px] leading-relaxed">
                                      {uc.main_flow || <span className="italic text-slate-400">Not specified</span>}
                                    </p>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: REQUIREMENT SCREEN */}
          {currentStep === "requirements" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => updateUrlParams({ step: "usecases" })}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>PREVIOUS</span>
                  </button>
                  <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                    Derived Requirements {usecaseIdParam ? `(Filtered to ${useCaseLabel})` : "(All Unfiltered)"}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => updateUrlParams({ step: "testcases", requirement_id: null })}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <span>NEXT (All Test Cases)</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              {loading ? (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                    <span>Loading derived requirements...</span>
                  </div>
                </div>
              ) : filteredRequirements.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center text-xs text-slate-500">
                  No requirements generated yet for this selection. Click &quot;Generate Requirements&quot; on Step 1.
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-500 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="px-4 py-3.5 w-10">
                          <input
                            type="checkbox"
                            className="rounded"
                            checked={filteredRequirements.length > 0 && filteredRequirements.every((r) => selectedReqIds.has(r.requirement_id))}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedReqIds(new Set(filteredRequirements.map((r) => r.requirement_id)));
                              } else {
                                setSelectedReqIds(new Set());
                              }
                            }}
                          />
                        </th>
                        <th className="px-5 py-3.5">ID</th>
                        <th className="px-5 py-3.5">Title</th>
                        <th className="px-5 py-3.5">Use Case Link</th>
                        <th className="px-5 py-3.5">Type</th>
                        <th className="px-5 py-3.5">Priority</th>
                        <th className="px-5 py-3.5">Status</th>
                        <th className="px-5 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    {selectedReqIds.size > 0 && (
                      <tbody>
                        <tr className="bg-red-50 dark:bg-red-950/30">
                          <td colSpan={8} className="px-5 py-2.5">
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-bold text-red-700 dark:text-red-400">{selectedReqIds.size} selected</span>
                              <button
                                type="button"
                                onClick={() => setConfirmDelete({ type: "requirements", ids: Array.from(selectedReqIds) })}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-500 transition"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete Selected
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedReqIds(new Set())}
                                className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition"
                              >
                                Clear selection
                              </button>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    )}
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                      {filteredRequirements.map((req, index) => {
                        const ucIdx = useCases.findIndex((u) => u.usecase_id === req.usecase_id);
                        const ucLbl = ucIdx !== -1 ? `UC-${String(ucIdx + 1).padStart(2, "0")}` : `UC-${req.usecase_id}`;
                        return (
                          <React.Fragment key={req.requirement_id}>
                            <tr
                              className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${selectedReqIds.has(req.requirement_id) ? "bg-red-50/50 dark:bg-red-950/20" : ""}`}
                              onClick={() =>
                                setExpandedRequirementId(
                                  expandedRequirementId === req.requirement_id ? null : req.requirement_id
                                )
                              }
                            >
                              <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  className="rounded"
                                  checked={selectedReqIds.has(req.requirement_id)}
                                  onChange={(e) => {
                                    const next = new Set(selectedReqIds);
                                    if (e.target.checked) next.add(req.requirement_id);
                                    else next.delete(req.requirement_id);
                                    setSelectedReqIds(next);
                                  }}
                                />
                              </td>
                              <td className="px-5 py-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                <span className="inline-flex items-center gap-1.5">
                                  <ChevronRight
                                    className={`h-3.5 w-3.5 transition-transform ${
                                      expandedRequirementId === req.requirement_id ? "rotate-90 text-emerald-500" : "text-slate-400"
                                    }`}
                                  />
                                  REQ-{String(index + 1).padStart(2, "0")}
                                </span>
                              </td>
                              <td className="px-5 py-4 font-bold text-slate-900 dark:text-white">{req.title}</td>
                              <td className="px-5 py-4 font-mono text-slate-500 dark:text-slate-400">{ucLbl}</td>
                              <td className="px-5 py-4 uppercase text-slate-500 dark:text-slate-400 text-xs">
                                {req.requirement_type}
                              </td>
                              <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                                <select
                                  value={(req.priority || "medium").toLowerCase()}
                                  onChange={async (e) => {
                                    const val = e.target.value as Priority;
                                    setRequirements((prev) => prev.map((r) => (r.requirement_id === req.requirement_id ? { ...r, priority: val } : r)));
                                    try {
                                      await api.updateRequirement(req.requirement_id, { priority: val });
                                    } catch (err) {
                                      console.error("Failed to update requirement priority", err);
                                    }
                                  }}
                                  className={`rounded-full px-2.5 py-1 text-[10px] font-bold border capitalize cursor-pointer outline-none bg-white dark:bg-slate-900 ${getPriorityBadgeClass(
                                    req.priority
                                  )}`}
                                >
                                  <option value="high">High</option>
                                  <option value="medium">Medium</option>
                                  <option value="low">Low</option>
                                </select>
                              </td>
                              <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                                <select
                                  value={(req.status || "draft").toLowerCase()}
                                  onChange={async (e) => {
                                    const val = e.target.value as any;
                                    setRequirements((prev) => prev.map((r) => (r.requirement_id === req.requirement_id ? { ...r, status: val } : r)));
                                    try {
                                      await api.updateRequirement(req.requirement_id, { status: val });
                                    } catch (err) {
                                      console.error("Failed to update requirement status", err);
                                    }
                                  }}
                                  className="rounded-full px-2.5 py-1 text-[10px] font-bold border capitalize cursor-pointer outline-none bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                                >
                                  <option value="draft">Draft</option>
                                  <option value="pending">Pending</option>
                                  <option value="approved">Approved</option>
                                  <option value="rejected">Rejected</option>
                                </select>
                              </td>
                              <td className="px-5 py-4 text-right flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  disabled={generating === `req-${req.requirement_id}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPromptModal({ isOpen: true, type: `testcases_${req.usecase_id}`, targetId: req.requirement_id, prompt: "" });
                                  }}
                                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-emerald-600/20 hover:scale-[1.01] transition disabled:opacity-50"
                                >
                                  {generating === `req-${req.requirement_id}` ? (
                                    <>
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                      <span>Generating...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Sparkles className="h-3.5 w-3.5" />
                                      <span>Generate Test Cases</span>
                                    </>
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirmDelete({ type: "requirements", ids: [req.requirement_id] });
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition"
                                  title="Delete Requirement"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                            {expandedRequirementId === req.requirement_id && (
                              <tr>
                                <td colSpan={8} className="bg-slate-50/80 dark:bg-slate-950/60 px-6 py-5 text-xs">
                                  <div className="space-y-3">
                                    <div className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                                      Requirement Description
                                    </div>
                                    <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                                      {req.description || <span className="italic text-slate-400">Not specified</span>}
                                    </p>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: TEST CASE SCREEN */}
          {currentStep === "testcases" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => updateUrlParams({ step: "requirements" })}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    <span>PREVIOUS</span>
                  </button>
                  <h2 className="font-display text-base font-bold text-slate-900 dark:text-white">
                    Derived Executable Test Suites {requirementIdParam ? `(Filtered to ${requirementLabel})` : "(All Unfiltered)"}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => showNotification("success", "Project marked as reviewed.")}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-500 transition"
                  >
                    <ShieldCheck className="h-4 w-4" />
                    <span>Mark Project Reviewed</span>
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                    <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                    <span>Loading derived test cases...</span>
                  </div>
                </div>
              ) : filteredTestCases.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center text-xs text-slate-500">
                  No test cases generated yet for this selection. Click &quot;Generate Test Cases&quot; on Step 2.
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-500 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="px-4 py-3.5 w-10">
                          <input
                            type="checkbox"
                            className="rounded"
                            checked={filteredTestCases.length > 0 && filteredTestCases.every((tc) => selectedTCIds.has(tc.test_case_id))}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedTCIds(new Set(filteredTestCases.map((tc) => tc.test_case_id)));
                              } else {
                                setSelectedTCIds(new Set());
                              }
                            }}
                          />
                        </th>
                        <th className="px-5 py-3.5">ID</th>
                        <th className="px-5 py-3.5">Title</th>
                        <th className="px-5 py-3.5">Requirement Link</th>
                        <th className="px-5 py-3.5">Priority</th>
                        <th className="px-5 py-3.5">Status</th>
                        <th className="px-5 py-3.5">Actual Result</th>
                        <th className="px-5 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    {selectedTCIds.size > 0 && (
                      <tbody>
                        <tr className="bg-red-50 dark:bg-red-950/30">
                          <td colSpan={8} className="px-5 py-2.5">
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-bold text-red-700 dark:text-red-400">{selectedTCIds.size} selected</span>
                              <button
                                type="button"
                                onClick={() => setConfirmDelete({ type: "testcases", ids: Array.from(selectedTCIds) })}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-500 transition"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                Delete Selected
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedTCIds(new Set())}
                                className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition"
                              >
                                Clear selection
                              </button>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    )}
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
                      {filteredTestCases.map((tc, index) => (
                        <React.Fragment key={tc.test_case_id}>
                          <tr
                            className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors ${selectedTCIds.has(tc.test_case_id) ? "bg-red-50/50 dark:bg-red-950/20" : ""}`}
                            onClick={() =>
                              setExpandedTestCaseId(expandedTestCaseId === tc.test_case_id ? null : tc.test_case_id)
                            }
                          >
                            <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                className="rounded"
                                checked={selectedTCIds.has(tc.test_case_id)}
                                onChange={(e) => {
                                  const next = new Set(selectedTCIds);
                                  if (e.target.checked) next.add(tc.test_case_id);
                                  else next.delete(tc.test_case_id);
                                  setSelectedTCIds(next);
                                }}
                              />
                            </td>
                            <td className="px-5 py-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              <span className="inline-flex items-center gap-1.5">
                                <ChevronRight
                                  className={`h-3.5 w-3.5 transition-transform ${
                                    expandedTestCaseId === tc.test_case_id ? "rotate-90 text-emerald-500" : "text-slate-400"
                                  }`}
                                />
                                TC-{String(index + 1).padStart(2, "0")}
                              </span>
                            </td>
                            <td className="px-5 py-4 font-bold text-slate-900 dark:text-white">{tc.title}</td>
                            <td className="px-5 py-4 font-mono text-slate-500 dark:text-slate-400">
                              {(() => {
                                const rIdx = requirements.findIndex((r) => r.requirement_id === tc.requirement_id);
                                return rIdx !== -1
                                  ? `REQ-${String(rIdx + 1).padStart(2, "0")}`
                                  : `REQ-${String(tc.requirement_id).padStart(2, "0")}`;
                              })()}
                            </td>
                            <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                              <select
                                value={(tc.priority || "medium").toLowerCase()}
                                onChange={async (e) => {
                                  const val = e.target.value as Priority;
                                  setTestCases((prev) => prev.map((t) => (t.test_case_id === tc.test_case_id ? { ...t, priority: val } : t)));
                                  try {
                                    await api.updateTestCase(tc.test_case_id, { priority: val });
                                  } catch (err) {
                                    console.error("Failed to update test case priority", err);
                                  }
                                }}
                                className={`rounded-full px-2.5 py-1 text-[10px] font-bold border capitalize cursor-pointer outline-none bg-white dark:bg-slate-900 ${getPriorityBadgeClass(
                                  tc.priority
                                )}`}
                              >
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                              </select>
                            </td>
                            <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                              <select
                                value={(tc.status || "draft").toLowerCase()}
                                onChange={async (e) => {
                                  const val = e.target.value as any;
                                  setTestCases((prev) => prev.map((t) => (t.test_case_id === tc.test_case_id ? { ...t, status: val } : t)));
                                  try {
                                    await api.updateTestCase(tc.test_case_id, { status: val });
                                  } catch (err) {
                                    console.error("Failed to update test case status", err);
                                  }
                                }}
                                className="rounded-full px-2.5 py-1 text-[10px] font-bold border capitalize cursor-pointer outline-none bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                              >
                                <option value="draft">Draft</option>
                                <option value="pending">Pending</option>
                                <option value="approved">Approved</option>
                                <option value="executed">Executed</option>
                                <option value="passed">Passed</option>
                                <option value="failed">Failed</option>
                              </select>
                            </td>
                            <td className="px-5 py-4 max-w-[180px] truncate text-slate-600 dark:text-slate-400 text-xs font-normal">
                              {tc.actual_result || <span className="italic text-slate-400">Not recorded</span>}
                            </td>
                            <td className="px-5 py-4 text-right">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmDelete({ type: "testcases", ids: [tc.test_case_id] });
                                }}
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition"
                                title="Delete Test Case"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                          {expandedTestCaseId === tc.test_case_id && (
                            <tr>
                              <td colSpan={8} className="bg-slate-50/80 dark:bg-slate-950/60 px-6 py-5 text-xs">
                                <div className="space-y-4">
                                  <div>
                                    <div className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-2">
                                      Test Execution Steps
                                    </div>
                                    {tc.test_steps && tc.test_steps.length > 0 ? (
                                      <div className="space-y-2">
                                        {tc.test_steps.map((step: any, i: number) => (
                                          <div
                                            key={i}
                                            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 flex items-start gap-3"
                                          >
                                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                                              {step.step ?? i + 1}
                                            </span>
                                            <div className="space-y-1">
                                              <div className="font-bold text-slate-800 dark:text-slate-200">
                                                {step.action}
                                              </div>
                                              {step.expected && (
                                                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                                                  Expected: {step.expected}
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <span className="italic text-slate-400">No steps specified</span>
                                    )}
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5">
                                      <div className="font-bold text-slate-400 uppercase tracking-wider text-[10px] mb-1">
                                        Expected Result Summary
                                      </div>
                                      <p className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                                        {tc.expected_result || <span className="italic text-slate-400">Not specified</span>}
                                      </p>
                                    </div>

                                    <div className="rounded-xl border border-emerald-500/30 dark:border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/20 p-3.5">
                                      <div className="font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider text-[10px] mb-1.5 flex items-center justify-between">
                                        <span>Actual Result</span>
                                        <span className="text-[9px] text-slate-400 font-normal">Auto-saves on blur</span>
                                      </div>
                                      <textarea
                                        defaultValue={tc.actual_result || ""}
                                        placeholder="Type actual test result here..."
                                        onClick={(e) => e.stopPropagation()}
                                        onBlur={async (e) => {
                                          const val = e.target.value;
                                          setTestCases((prev) => prev.map((t) => (t.test_case_id === tc.test_case_id ? { ...t, actual_result: val } : t)));
                                          try {
                                            await api.updateTestCase(tc.test_case_id, { actual_result: val });
                                          } catch (err) {
                                            console.error("Failed to save actual result", err);
                                          }
                                        }}
                                        className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-white outline-none transition focus:border-emerald-500 min-h-[60px]"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Custom Prompt Modal */}
      {promptModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 w-full max-w-lg mx-4">
            {promptModal.status === "generating" ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="relative h-32 w-32 mb-6">
                  <svg className="h-full w-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="8" />
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      className="stroke-emerald-500 transition-all duration-500 ease-out"
                      strokeWidth="8"
                      strokeDasharray="283"
                      strokeDashoffset={283 - (283 * generationProgress) / 100}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center font-display text-2xl font-bold text-slate-900 dark:text-white">
                    {generationProgress}%
                  </div>
                </div>
                <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white mb-2 animate-pulse">Generating Artifacts...</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-sm">
                  Our AI is currently analyzing context and generating high-quality software specifications. This may take a few moments.
                </p>
              </div>
            ) : (
              <>
                <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white mb-2">Custom Generation Prompt</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  Add any extra context, specific constraints, or instructions for the AI before it generates artifacts.
                </p>
                <textarea
                  className="w-full h-32 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 text-sm text-slate-900 dark:text-white outline-none focus:border-emerald-500 resize-none mb-4"
                  placeholder="e.g., Focus specifically on GDPR compliance requirements, or format all test steps as Given/When/Then..."
                  value={promptModal.prompt}
                  onChange={(e) => setPromptModal({ ...promptModal, prompt: e.target.value })}
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setPromptModal({ isOpen: false, type: "", targetId: null, prompt: "" })}
                    className="px-4 py-2 rounded-xl font-bold text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setPromptModal({ ...promptModal, isSkipped: true })}
                    disabled={promptModal.prompt.trim() !== "" || promptModal.isSkipped}
                    className={`px-4 py-2 rounded-xl font-bold text-xs transition ${(promptModal.prompt.trim() !== "" || promptModal.isSkipped) ? 'opacity-50 cursor-not-allowed bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500' : 'bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'}`}
                  >
                    Skip
                  </button>
                  {(promptModal.prompt.trim() !== "" || promptModal.isSkipped) && (
                    <button
                      onClick={() => {
                        setPromptModal(prev => ({ ...prev, status: "generating" }));
                        if (promptModal.type === "userstories") handleGenerateUserStories();
                        else if (promptModal.type === "usecases") handleGenerateUseCasesFromStory(promptModal.targetId!);
                        else if (promptModal.type === "requirements") handleGenerateRequirementsForRow(promptModal.targetId!);
                        else if (promptModal.type.startsWith("testcases_")) {
                          const ucId = Number(promptModal.type.split("_")[1]);
                          const reqId = promptModal.targetId!;
                          handleGenerateTestCasesForRow(ucId, reqId);
                        } else if (promptModal.type.startsWith("fileusecase_")) {
                          const fileId = Number(promptModal.type.split("_")[1]);
                          handleGenerateUseCasesFromFile(fileId);
                        }
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md hover:bg-emerald-500 transition inline-flex items-center gap-2 animate-fade-in"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Generate
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
