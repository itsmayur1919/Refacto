"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  FileText,
  FileUp,
  GitBranch,
  LogOut,
  Settings,
  FolderKanban,
  Sparkles,
} from "lucide-react";
import { api, auth } from "@/lib/api";
import type { Project } from "@/lib/types";

const NAV_ITEMS = [
  { key: "uploads", label: "Uploads", icon: FileUp, getPath: (id: number) => `/projects/${id}` },
  { key: "traceability", label: "Traceability", icon: GitBranch, getPath: (id: number) => `/projects/${id}/traceability` },
  { key: "settings", label: "Settings", icon: Settings, getPath: () => `/settings` },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  const pathSegments = useMemo(() => pathname?.split("/").filter(Boolean) || [], [pathname]);
  const currentProjectId = pathSegments[0] === "projects" && pathSegments[1] ? Number(pathSegments[1]) : undefined;
  const currentProject = projects.find((project) => project.id === currentProjectId);

  useEffect(() => {
    async function load() {
      setLoadingProjects(true);
      try {
        const data = await api.getProjects();
        setProjects(data);
      } catch {
        setProjects([]);
      } finally {
        setLoadingProjects(false);
      }
    }
    load();

    window.addEventListener("projects-changed", load);
    return () => {
      window.removeEventListener("projects-changed", load);
    };
  }, []);

  const activeKey = useMemo(() => {
    if (!currentProjectId) return "";
    const nextSegment = pathSegments[2];
    return nextSegment || "uploads";
  }, [currentProjectId, pathSegments]);

  return (
    <aside className="relative flex h-full max-h-screen w-72 shrink-0 flex-col border-r border-slate-800/80 bg-slate-950 px-4 py-5 text-slate-200 select-none z-30">
      {/* Sidebar Header & Brand */}
      <div className="mb-5 flex flex-col gap-3.5 shrink-0">
        <div className="flex items-center justify-between px-2 py-2.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-sm">
          <Link href="/projects" className="flex items-center w-full justify-center">
            <img
              src="/refacto-logo-white.png"
              alt="RefactoFlow Logo"
              className="h-11 w-auto max-w-[230px] object-contain py-0.5 transition-transform hover:scale-105 duration-200"
            />
          </Link>
        </div>

        {/* Project Selector Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((prev) => !prev)}
            title={currentProject?.name || "Select Project"}
            className="flex w-full items-center justify-between rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-left text-sm font-medium transition-colors duration-150 hover:border-slate-700 hover:bg-slate-800/80 shadow-sm"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 font-bold text-sm">
                <FolderKanban className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                  ACTIVE PROJECT
                </div>
                <div className="truncate text-[15px] font-bold text-white">
                  {currentProject ? currentProject.name : loadingProjects ? "Loading..." : "All Projects"}
                </div>
              </div>
            </div>
            <ChevronDown
              className={`h-4.5 w-4.5 text-slate-400 transition-transform duration-200 ${
                dropdownOpen ? "rotate-180" : "rotate-0"
              }`}
            />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute left-0 top-full z-50 mt-2 w-full rounded-2xl border border-slate-800 bg-slate-900 p-2.5 shadow-2xl">
              <Link
                href="/projects"
                className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-emerald-400 hover:bg-slate-800 transition-colors duration-150"
                onClick={() => setDropdownOpen(false)}
              >
                <Sparkles className="h-4.5 w-4.5" />
                <span>View All Projects</span>
              </Link>
              <div className="my-2 border-t border-slate-800" />
              {projects.length > 0 ? (
                <div className="max-h-52 overflow-y-auto custom-scrollbar space-y-1">
                  {projects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/projects/${project.id}`}
                      className={`block rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors duration-150 ${
                        project.id === currentProjectId
                          ? "bg-emerald-500/15 text-emerald-400 font-bold"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
                      }`}
                      onClick={() => setDropdownOpen(false)}
                    >
                      {project.name}
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="px-3.5 py-2.5 text-sm text-slate-500">No projects yet</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navigation Items (Smooth Scrollable Area) */}
      <nav className="flex flex-1 flex-col gap-2 overflow-y-auto overflow-x-hidden custom-scrollbar overscroll-contain pr-0.5">
        {/* Workspace Home Link */}
        <Link
          href="/projects"
          className={`flex items-center gap-3.5 rounded-2xl px-4 py-3.5 text-[15px] font-semibold transition-colors duration-150 ${
            !currentProjectId && pathname === "/projects"
              ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold shadow-md shadow-emerald-600/20"
              : "text-slate-300 hover:bg-slate-900 hover:text-white"
          }`}
        >
          <FolderKanban className="h-5.5 w-5.5 shrink-0" />
          <span>Projects Directory</span>
        </Link>

        <div className="my-2 border-t border-slate-800/80" />

        {NAV_ITEMS.map(({ key, label, icon: Icon, getPath }) => {
          const href = currentProjectId ? getPath(currentProjectId) : "/projects";
          const active = key === activeKey;
          return (
            <Link
              key={key}
              href={href}
              className={`flex items-center gap-3.5 rounded-2xl px-4 py-3.5 text-[15px] font-semibold transition-colors duration-150 ${
                active
                  ? "bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30 shadow-sm shadow-emerald-500/10"
                  : "text-slate-300 hover:bg-slate-900 hover:text-white"
              }`}
            >
              <Icon className="h-5.5 w-5.5 shrink-0" />
              <span className="flex-1 truncate">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="mt-auto pt-4 border-t border-slate-800 shrink-0">
        <button
          type="button"
          onClick={async () => {
            setLogoutLoading(true);
            await auth.logout();
            router.push("/login");
          }}
          className="flex w-full items-center gap-3.5 rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3.5 text-[15px] font-semibold text-slate-300 transition-colors duration-150 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 disabled:opacity-60"
          disabled={logoutLoading}
        >
          <LogOut className="h-5.5 w-5.5 shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}



