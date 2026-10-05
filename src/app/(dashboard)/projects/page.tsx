"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  FolderKanban,
  CheckCircle2,
  Clock,
  TrendingUp,
  SlidersHorizontal,
  ArrowUpDown,
  Sparkles,
  Zap,
  Layers,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { NewProjectDialog } from "@/components/projects/NewProjectDialog";
import { api } from "@/lib/api";
import type { Project } from "@/lib/types";
import { formatDate } from "@/lib/formatDate";

const PAGE_SIZE = 9;

type ViewMode = "grid" | "list";
type FilterTab = "all" | "active" | "completed";
type SortOption = "updated" | "name" | "stage";

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [sortBy, setSortBy] = useState<SortOption>("updated");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    async function loadProjects() {
      setLoading(true);
      try {
        const data = await api.getProjects();
        setProjects(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load projects.");
      } finally {
        setLoading(false);
      }
    }
    loadProjects();
  }, []);

  // Filter & Sort Logic
  const filteredAndSortedProjects = useMemo(() => {
    let result = [...projects];

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) => p.name.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q))
      );
    }

    // Filter Tab
    if (filterTab === "active") {
      result = result.filter((p) => p.status === "active");
    } else if (filterTab === "completed") {
      result = result.filter((p) => p.pipeline_stage >= 4);
    }

    // Sorting
    if (sortBy === "updated") {
      result.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    } else if (sortBy === "name") {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "stage") {
      result.sort((a, b) => b.pipeline_stage - a.pipeline_stage);
    }

    return result;
  }, [projects, search, filterTab, sortBy]);

  const visibleProjects = filteredAndSortedProjects.slice(0, page * PAGE_SIZE);
  const hasMore = filteredAndSortedProjects.length > visibleProjects.length;

  // Compute Metrics Summary
  const stats = useMemo(() => {
    const total = projects.length;
    const active = projects.filter((p) => p.status === "active").length;
    const completed = projects.filter((p) => p.pipeline_stage >= 4).length;
    const avgStage = total > 0 ? (projects.reduce((acc, p) => acc + (p.pipeline_stage || 0), 0) / total).toFixed(1) : "0";
    const overallTraceabilityScore = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, active, completed, avgStage, overallTraceabilityScore };
  }, [projects]);

  async function handleDeleteProject(id: number) {
    try {
      await api.deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      window.dispatchEvent(new Event("projects-changed"));
      setToast({ type: "success", message: "Project deleted successfully" });
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to delete project";
      setToast({ type: "error", message: msg });
      setTimeout(() => setToast(null), 4000);
      throw err;
    }
  }

  async function handleCreateProject() {
    if (!projectName.trim()) {
      setError("Project name is required.");
      return;
    }

    setError(null);
    setCreating(true);

    try {
      const project = await api.createProject({
        name: projectName.trim(),
        description: projectDescription.trim() || undefined,
      });
      window.dispatchEvent(new Event("projects-changed"));
      setShowDialog(false);
      setProjectName("");
      setProjectDescription("");
      router.push(`/projects/${project.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create project.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <NewProjectDialog
        open={showDialog}
        name={projectName}
        description={projectDescription}
        loading={creating}
        error={error}
        onClose={() => {
          setShowDialog(false);
          setError(null);
        }}
        onChangeName={setProjectName}
        onChangeDescription={setProjectDescription}
        onSubmit={handleCreateProject}
      />

      {/* Header Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 mb-2">
            <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
            <span>WORKSPACE DASHBOARD</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Projects Directory
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Manage your specs, track pipeline stage progress, and generate bi-directional test suites.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowDialog(true)}
            disabled={creating}
            className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-emerald-600/20 transition-all hover:shadow-lg hover:shadow-emerald-600/30 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Metrics Dashboard Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Total Projects</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <FolderKanban className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-extrabold text-slate-900 dark:text-white">
              {stats.total}
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
              {stats.active} Active
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Across your team organization
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Completed Pipelines</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-500/10 text-teal-500">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-extrabold text-slate-900 dark:text-white">
              {stats.completed}
            </span>
            <span className="text-xs text-teal-600 dark:text-teal-400 font-bold">
              100% Traceable
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Fully derived test suites
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Average Pipeline Stage</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-extrabold text-slate-900 dark:text-white">
              {stats.avgStage} / 4
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
              style={{ width: `${(Number(stats.avgStage) / 4) * 100}%` }}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Traceability Coverage</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-500">
              <Zap className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-extrabold text-slate-900 dark:text-white">
              {stats.overallTraceabilityScore}%
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Bi-directional matrix completion
          </p>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`flex items-center justify-between rounded-xl px-4 py-3 text-xs font-semibold ${
            toast.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
              : "bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
          }`}
        >
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Controls Bar: Search, Filters, Sorting, View Toggle */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200 dark:border-slate-800 p-3 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects by name or keyword..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 pl-10 pr-9 py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white outline-none transition focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-950 placeholder:text-slate-400"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Filter Tabs */}
          <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-950 p-1 border border-slate-200 dark:border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setFilterTab("all")}
              className={`rounded-lg px-3 py-1.5 transition ${
                filterTab === "all"
                  ? "bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              All ({projects.length})
            </button>
            <button
              onClick={() => setFilterTab("active")}
              className={`rounded-lg px-3 py-1.5 transition ${
                filterTab === "active"
                  ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Active ({stats.active})
            </button>
            <button
              onClick={() => setFilterTab("completed")}
              className={`rounded-lg px-3 py-1.5 transition ${
                filterTab === "completed"
                  ? "bg-white dark:bg-slate-800 text-teal-600 dark:text-teal-400 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Completed ({stats.completed})
            </button>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 rounded-xl bg-slate-100 dark:bg-slate-950 px-3 py-1.5 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-transparent outline-none cursor-pointer text-xs font-semibold"
            >
              <option value="updated">Sort by Updated</option>
              <option value="name">Sort by Name</option>
              <option value="stage">Sort by Stage</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-950 p-1 border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setViewMode("grid")}
              title="Grid View"
              className={`rounded-lg p-1.5 transition ${
                viewMode === "grid"
                  ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm"
                  : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              title="List View"
              className={`rounded-lg p-1.5 transition ${
                viewMode === "list"
                  ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm"
                  : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Projects Display Section */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-44 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 animate-pulse flex flex-col justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-slate-200 dark:bg-slate-800" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-3 w-1/2 rounded bg-slate-100 dark:bg-slate-800/60" />
                </div>
              </div>
              <div className="h-2 w-full rounded bg-slate-200 dark:bg-slate-800" />
            </div>
          ))}
        </div>
      ) : filteredAndSortedProjects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
            <Layers className="h-7 w-7" />
          </div>
          <h3 className="mt-4 font-display text-lg font-bold text-slate-900 dark:text-white">
            No Projects Found
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {search
              ? `No project titles match "${search}". Try clearing your search filter.`
              : "Get started by creating your first specification project."}
          </p>
          <button
            onClick={() => setShowDialog(true)}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-500 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Create New Project</span>
          </button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visibleProjects.map((project) => (
            <ProjectCard key={project.id} project={project} onDelete={handleDeleteProject} />
          ))}
        </div>
      ) : (
        /* List / Table View */
        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px] font-bold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Project Name</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Pipeline Stage</th>
                <th className="px-6 py-3.5">Last Updated</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-medium">
              {visibleProjects.map((project) => (
                <tr
                  key={project.id}
                  onClick={() => router.push(`/projects/${project.id}`)}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900 dark:text-white">{project.name}</div>
                    {project.description && (
                      <div className="text-xs text-slate-400 line-clamp-1">{project.description}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        project.status === "active"
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      }`}
                    >
                      {project.status === "active" ? "Active" : "Archived"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        Stage {project.pipeline_stage || 0}/4
                      </span>
                      {project.pipeline_stage >= 4 && (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 dark:text-slate-400 text-xs">
                    {formatDate(project.updated_at)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/projects/${project.id}`);
                      }}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 transition"
                    >
                      Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Load More */}
      {hasMore && (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => setPage((prev) => prev + 1)}
            className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-6 py-2.5 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-sm transition hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Load More Projects
          </button>
        </div>
      )}
    </div>
  );
}
