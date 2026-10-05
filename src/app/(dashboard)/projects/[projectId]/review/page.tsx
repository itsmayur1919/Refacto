"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Filter, RefreshCw } from "lucide-react";
import { ReviewTabs } from "@/components/review/ReviewTabs";
import { DataTable, type Column } from "@/components/review/DataTable";
import { api, exportProjectXlsx } from "@/lib/api";
import type { Requirement, TestCase, UseCase } from "@/lib/types";

const priorityOptions = ["all", "high", "medium", "low"] as const;
const statusOptions = ["all", "draft", "pending", "approved", "rejected", "executed", "passed", "failed"] as const;

export default function ReviewPage({ params }: { params: { projectId: string } }) {
  const [activeTab, setActiveTab] = useState("use_cases");
  const [useCases, setUseCases] = useState<UseCase[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [loadingUseCases, setLoadingUseCases] = useState(true);
  const [loadingRequirements, setLoadingRequirements] = useState(false);
  const [loadingTestCases, setLoadingTestCases] = useState(false);
  const [sortBy, setSortBy] = useState("title");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [detailItem, setDetailItem] = useState<UseCase | Requirement | TestCase | null>(null);
  const [detailType, setDetailType] = useState<"use_cases" | "requirements" | "test_cases" | null>(null);
  const [actionState, setActionState] = useState({ loading: false, error: "" });
  const [generateState, setGenerateState] = useState({ ids: new Set<number>(), error: "" });
  const [isEditing, setIsEditing] = useState(false);
  const [editState, setEditState] = useState({ loading: false, error: "" });
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [projectName, setProjectName] = useState("Project");
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    setLoadingUseCases(true);
    api
      .getUseCases(Number(params.projectId))
      .then((data) => setUseCases(data as UseCase[]))
      .catch(() => {})
      .finally(() => setLoadingUseCases(false));
    // Fetch project name for XLSX filename
    api.getProjects()
      .then((projects) => {
        const match = projects.find((p) => p.id === Number(params.projectId));
        if (match) setProjectName(match.name);
      })
      .catch(() => {});
  }, [params.projectId]);

  useEffect(() => {
    if (detailItem) {
      setFormData({ ...detailItem });
    }
  }, [detailItem, detailType]);

  useEffect(() => {
    if (useCases.length === 0) {
      setRequirements([]);
      return;
    }
    setLoadingRequirements(true);
    Promise.all(useCases.map((uc) => api.getRequirements(uc.usecase_id)))
      .then((results) => setRequirements((results as Requirement[][]).flat()))
      .catch(() => {})
      .finally(() => setLoadingRequirements(false));
  }, [useCases]);

  useEffect(() => {
    if (useCases.length === 0) {
      setTestCases([]);
      return;
    }
    setLoadingTestCases(true);
    Promise.all(useCases.map((uc) => api.getTestCases(uc.usecase_id)))
      .then((results) => setTestCases((results as TestCase[][]).flat()))
      .catch(() => {})
      .finally(() => setLoadingTestCases(false));
  }, [useCases]);

  const useCaseMap = useMemo(
    () => new Map(useCases.map((uc) => [uc.usecase_id, uc])),
    [useCases]
  );

  const requirementMap = useMemo(
    () => new Map(requirements.map((req) => [req.requirement_id, req])),
    [requirements]
  );

  const requirementNumberMap = useMemo(() => {
    const map = new Map<number, string>();
    requirements.forEach((req, index) => {
      map.set(req.requirement_id, `REQ-${String(index + 1).padStart(2, "0")}`);
    });
    return map;
  }, [requirements]);

  const filteredUseCases = useMemo(() => {
    return useCases
      .filter((uc) =>
        statusFilter === "all" ? true : uc.status === statusFilter
      )
      .filter((uc) =>
        priorityFilter === "all" ? true : uc.priority === priorityFilter
      );
  }, [useCases, statusFilter, priorityFilter]);

  const filteredRequirements = useMemo(() => {
    return requirements
      .filter((req) =>
        statusFilter === "all" ? true : req.status === statusFilter
      )
      .filter((req) =>
        priorityFilter === "all" ? true : req.priority === priorityFilter
      );
  }, [requirements, statusFilter, priorityFilter]);

  const filteredTestCases = useMemo(() => {
    return testCases
      .filter((tc) =>
        statusFilter === "all" ? true : tc.status === statusFilter
      )
      .filter((tc) =>
        priorityFilter === "all" ? true : tc.priority === priorityFilter
      );
  }, [testCases, statusFilter, priorityFilter]);

  const sortRows = <T extends Record<string, any>>(rows: T[]) => {
    return [...rows].sort((a, b) => {
      const valueA = a[sortBy];
      const valueB = b[sortBy];
      if (typeof valueA === "number" && typeof valueB === "number") {
        return sortDirection === "asc" ? valueA - valueB : valueB - valueA;
      }
      return sortDirection === "asc"
        ? String(valueA).localeCompare(String(valueB))
        : String(valueB).localeCompare(String(valueA));
    });
  };

  const visibleUseCases = sortRows(filteredUseCases);
  const visibleRequirements = sortRows(filteredRequirements);
  const visibleTestCases = sortRows(filteredTestCases);

  const currentRows = activeTab === "use_cases" ? visibleUseCases : activeTab === "requirements" ? visibleRequirements : visibleTestCases;

  const tabs = [
    { key: "use_cases", label: "Use cases", count: useCases.length },
    { key: "requirements", label: "Requirements", count: requirements.length },
    { key: "test_cases", label: "Test cases", count: testCases.length },
  ];

  const UC_COLUMNS: Column<UseCase>[] = [
    { key: "id", label: "ID", render: (r, index) => `UC-${String(index + 1).padStart(2, "0")}` , sortable: true },
    { key: "title", label: "Title", render: (r) => r.title, sortable: true },
    { key: "actors", label: "Actors", render: (r) => r.actors || "—" },
    {
      key: "actions",
      label: "Actions",
      render: (r) => {
        const hasRequirements = requirements.some((req) => req.usecase_id === r.usecase_id);
        const loading = generateState.ids.has(r.usecase_id);
        return (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              handleGenerateRequirements(r.usecase_id);
            }}
            disabled={loading}
            className="rounded-md border border-hairline bg-white px-3 py-1 text-[11px] text-ink transition hover:bg-[#F6F6F3] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Generating…" : hasRequirements ? "Refresh requirements" : "Generate requirements"}
          </button>
        );
      },
    },
  ];

  const REQ_COLUMNS: Column<Requirement>[] = [
    { key: "id", label: "ID", render: (r, index) => `REQ-${String(index + 1).padStart(2, "0")}` , sortable: true },
    { key: "title", label: "Title", render: (r) => r.title, sortable: true },
    {
      key: "usecase",
      label: "Use Case",
      render: (r) => {
        const ucIndex = useCases.findIndex((uc) => uc.usecase_id === r.usecase_id);
        const label = ucIndex !== -1 ? `UC-${String(ucIndex + 1).padStart(2, "0")}` : `UC-${String(r.usecase_id).padStart(2, "0")}`;
        return (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              const uc = useCaseMap.get(r.usecase_id);
              if (uc) { setActiveTab("use_cases"); setDetailType("use_cases"); setDetailItem(uc); }
            }}
            className="font-mono text-accent hover:underline"
          >
            {label}
          </button>
        );
      },
    },
    { key: "type", label: "Type", render: (r) => r.requirement_type.replace("_", "-" ) },
    {
      key: "actions",
      label: "Actions",
      render: (r) => {
        const hasTestCases = testCases.some((tc) => tc.requirement_id === r.requirement_id);
        const loading = generateState.ids.has(r.requirement_id);
        return (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              handleGenerateTestCases(r.usecase_id, r.requirement_id);
            }}
            disabled={loading}
            className="rounded-md border border-hairline bg-white px-3 py-1 text-[11px] text-ink transition hover:bg-[#F6F6F3] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Generating…" : hasTestCases ? "Refresh test cases" : "Generate test cases"}
          </button>
        );
      },
    },
  ];

  const TC_COLUMNS: Column<TestCase>[] = [
    { key: "id", label: "ID", render: (r, index) => `TC-${String(index + 1).padStart(2, "0")}` , sortable: true },
    { key: "title", label: "Title", render: (r) => r.title, sortable: true },
    {
      key: "req",
      label: "Requirement",
      render: (r) => {
        const requirement = requirementMap.get(r.requirement_id);
        const reqNum = requirementNumberMap.get(r.requirement_id) || `REQ-${String(r.requirement_id).padStart(2, "0")}`;
        return requirement ? requirement.title : reqNum;
      },
    },
  ];

  const visibleTabLabel = tabs.find((tab) => tab.key === activeTab)?.label || "Items";

  function downloadCsv<T>(rows: T[], columns: Column<T>[], filename: string) {
    const header = columns.map((col) => col.label).join(",");
    const lines = rows.map((row, index) =>
      columns
        .map((col) => {
          const value = col.render(row, index);
          const text = typeof value === "string" ? value : String(value);
          return `"${text.replace(/"/g, '""')}"`;
        })
        .join(",")
    );
    const csv = [header, ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function handleGenerateRequirements(usecaseId: number) {
    setGenerateState((prev) => ({ ...prev, ids: new Set(prev.ids).add(usecaseId), error: "" }));
    try {
      await api.generateRequirements(usecaseId);
      await pollRequirements(usecaseId);
    } catch (error) {
      setGenerateState((prev) => ({ ...prev, error: error instanceof Error ? error.message : "Unable to queue requirement generation." }));
    } finally {
      setGenerateState((prev) => {
        const ids = new Set(prev.ids);
        ids.delete(usecaseId);
        return { ...prev, ids };
      });
    }
  }

  async function pollRequirements(usecaseId: number) {
    const previousCount = requirements.filter((req) => req.usecase_id === usecaseId).length;
    for (let attempt = 0; attempt < 10; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const updated = await api.getRequirements(usecaseId);
      setRequirements((prev) => [...prev.filter((req) => req.usecase_id !== usecaseId), ...(updated as Requirement[])]);
      if ((updated as Requirement[]).length > previousCount) return;
    }
  }

  async function handleGenerateTestCases(usecaseId: number, requirementId: number) {
    setGenerateState((prev) => ({ ...prev, ids: new Set(prev.ids).add(requirementId), error: "" }));
    try {
      await api.generateTestCases(usecaseId, requirementId);
      await pollTestCases(requirementId);
    } catch (error) {
      setGenerateState((prev) => ({ ...prev, error: error instanceof Error ? error.message : "Unable to queue test case generation." }));
    } finally {
      setGenerateState((prev) => {
        const ids = new Set(prev.ids);
        ids.delete(requirementId);
        return { ...prev, ids };
      });
    }
  }

  async function pollTestCases(requirementId: number) {
    const previousCount = testCases.filter((tc) => tc.requirement_id === requirementId).length;
    for (let attempt = 0; attempt < 10; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const updated = await api.getTestCasesByRequirement(requirementId);
      setTestCases((prev) => [...prev.filter((tc) => tc.requirement_id !== requirementId), ...(updated as TestCase[])]);
      if ((updated as TestCase[]).length > previousCount) return;
    }
  }

  async function handleStatusSave() {
    if (!detailItem || !detailType) return;
    setActionState({ loading: true, error: "" });
    const status = detailItem.status;
    const recordId =
      detailType === "use_cases"
        ? (detailItem as UseCase).usecase_id
        : detailType === "requirements"
        ? (detailItem as Requirement).requirement_id
        : (detailItem as TestCase).test_case_id;
    try {
      await api.patchStatus(detailType, recordId, status);
    } catch (error) {
      setActionState({ loading: false, error: error instanceof Error ? error.message : "Status change failed." });
      return;
    }
    setActionState({ loading: false, error: "" });
  }

  async function handleEditSave() {
    if (!detailItem || !detailType) return;
    setEditState({ loading: true, error: "" });

    try {
      let updated: UseCase | Requirement | TestCase;
      const id =
        detailType === "use_cases"
          ? (detailItem as UseCase).usecase_id
          : detailType === "requirements"
          ? (detailItem as Requirement).requirement_id
          : (detailItem as TestCase).test_case_id;

      if (detailType === "use_cases") {
        const updatedUseCase = await api.updateUseCase(id, formData as Partial<UseCase>);
        updated = updatedUseCase;
        setUseCases((prev) => prev.map((uc) => (uc.usecase_id === id ? updatedUseCase : uc)));
      } else if (detailType === "requirements") {
        const updatedRequirement = await api.updateRequirement(id, formData as Partial<Requirement>);
        updated = updatedRequirement;
        setRequirements((prev) => prev.map((req) => (req.requirement_id === id ? updatedRequirement : req)));
      } else {
        const updatedTestCase = await api.updateTestCase(id, formData as Partial<TestCase>);
        updated = updatedTestCase;
        setTestCases((prev) => prev.map((tc) => (tc.test_case_id === id ? updatedTestCase : tc)));
      }

      setDetailItem(updated as UseCase | Requirement | TestCase);
      setFormData({ ...updated });
      setIsEditing(false);
    } catch (error) {
      setEditState({ loading: false, error: error instanceof Error ? error.message : "Unable to save changes." });
      return;
    }

    setEditState({ loading: false, error: "" });
  }

  const emptyState = {
    use_cases: "No use cases yet — upload a document to generate them.",
    requirements: "No requirements yet — generate them from a use case.",
    test_cases: "No test cases yet — generate them from a requirement.",
  }[activeTab] as string;

  return (
    <div>
      <div className="mb-3.5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-lg font-medium text-ink">Review</h1>
          <p className="text-xs text-muted">Sort, filter, and inspect generated artifacts with traceability between stages.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={exportLoading}
            onClick={async () => {
              setExportLoading(true);
              try {
                await exportProjectXlsx(Number(params.projectId), projectName);
              } catch (err) {
                // surface error via generateState for simplicity
                setGenerateState((prev) => ({ ...prev, error: err instanceof Error ? err.message : "Export failed." }));
              } finally {
                setExportLoading(false);
              }
            }}
            className="flex items-center gap-1 rounded-md border border-hairline bg-white px-3 py-1.5 text-xs font-medium text-ink transition hover:bg-[#F6F6F3] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download size={13} />
            {exportLoading ? "Exporting…" : "Export .xlsx"}
          </button>
          <button
            type="button"
            onClick={() => {
              setSortBy("title");
              setSortDirection("asc");
              setStatusFilter("all");
              setPriorityFilter("all");
            }}
            className="flex items-center gap-1 rounded-md border border-hairline bg-white px-3 py-1.5 text-xs font-medium text-ink transition hover:bg-[#F6F6F3]"
          >
            <RefreshCw size={13} />
            Reset filters
          </button>
        </div>
      </div>

      <ReviewTabs tabs={tabs} active={activeTab} onChange={(key) => {
        setActiveTab(key);
        setDetailItem(null);
        setDetailType(null);
      }} />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-md border border-hairline bg-white px-3 py-2 text-xs text-ink">
            <Filter size={14} />
            <span>Status</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs outline-none"
            >
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "all" ? "All" : option}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-hairline bg-white px-3 py-2 text-xs text-ink">
            <span>Priority</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-transparent text-xs outline-none"
            >
              {priorityOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "all" ? "All" : option}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {generateState.error && (
        <div className="mb-4 rounded-lg bg-danger-light px-3 py-2 text-[12px] text-danger">
          {generateState.error}
        </div>
      )}

      {activeTab === "use_cases" && (
        <DataTable
          rows={visibleUseCases}
          columns={UC_COLUMNS}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onSort={(key) => {
            setSortBy(key);
            setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
          }}
          onRowClick={(row) => {
            setDetailItem(row);
            setDetailType("use_cases");
          }}
          noDataLabel={loadingUseCases ? "Loading use cases…" : emptyState}
        />
      )}
      {activeTab === "requirements" && (
        <DataTable
          rows={visibleRequirements}
          columns={REQ_COLUMNS}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onSort={(key) => {
            setSortBy(key);
            setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
          }}
          onRowClick={(row) => {
            setDetailItem(row);
            setDetailType("requirements");
          }}
          noDataLabel={loadingRequirements ? "Loading requirements…" : emptyState}
        />
      )}
      {activeTab === "test_cases" && (
        <DataTable
          rows={visibleTestCases}
          columns={TC_COLUMNS}
          sortBy={sortBy}
          sortDirection={sortDirection}
          onSort={(key) => {
            setSortBy(key);
            setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
          }}
          onRowClick={(row) => {
            setDetailItem(row);
            setDetailType("test_cases");
          }}
          noDataLabel={loadingTestCases ? "Loading test cases…" : emptyState}
        />
      )}

      {detailItem && detailType && (
        <div className="mt-6 rounded-[10px] border-[0.5px] border-hairline bg-white p-5">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-sm font-medium text-ink">
                {detailType === "use_cases" && (() => {
                  const idx = useCases.findIndex((uc) => uc.usecase_id === (detailItem as UseCase).usecase_id);
                  return `Use case UC-${String(idx !== -1 ? idx + 1 : (detailItem as UseCase).usecase_id).padStart(2, "0")}`;
                })()}
                {detailType === "requirements" && (() => {
                  const idx = requirements.findIndex((req) => req.requirement_id === (detailItem as Requirement).requirement_id);
                  return `Requirement REQ-${String(idx !== -1 ? idx + 1 : (detailItem as Requirement).requirement_id).padStart(2, "0")}`;
                })()}
                {detailType === "test_cases" && (() => {
                  const idx = testCases.findIndex((tc) => tc.test_case_id === (detailItem as TestCase).test_case_id);
                  return `Test case TC-${String(idx !== -1 ? idx + 1 : (detailItem as TestCase).test_case_id).padStart(2, "0")}`;
                })()}
              </h2>
              <p className="mt-1 text-xs text-muted">Full record details and traceability.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {isEditing ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({ ...detailItem });
                    setEditState({ loading: false, error: "" });
                  }}
                  className="rounded-md border border-hairline bg-white px-3 py-1 text-xs text-ink"
                >
                  Cancel
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="rounded-md border border-hairline bg-white px-3 py-1 text-xs text-ink"
                >
                  Edit
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setDetailItem(null);
                  setDetailType(null);
                }}
                className="rounded-md border border-hairline bg-white px-3 py-1 text-xs text-ink"
              >
                Close
              </button>
              {isEditing && (
                <button
                  type="button"
                  onClick={handleEditSave}
                  disabled={editState.loading}
                  className="rounded-md bg-accent px-4 py-1 text-xs font-medium text-white disabled:opacity-60"
                >
                  {editState.loading ? "Saving…" : "Save changes"}
                </button>
              )}
            </div>
          </div>

          {detailType === "use_cases" && (
            <div className="space-y-4 text-sm text-ink">
              {isEditing ? (
                <>
                  <div>
                    <label className="font-medium">Title</label>
                    <input
                      value={formData.title || ""}
                      onChange={(event) => setFormData({ ...formData, title: event.target.value })}
                      className="mt-2 w-full rounded-md border border-hairline bg-white px-3 py-2 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-medium">Actors</label>
                    <input
                      value={formData.actors || ""}
                      onChange={(event) => setFormData({ ...formData, actors: event.target.value })}
                      className="mt-2 w-full rounded-md border border-hairline bg-white px-3 py-2 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-medium">Preconditions</label>
                    <textarea
                      value={formData.preconditions || ""}
                      onChange={(event) => setFormData({ ...formData, preconditions: event.target.value })}
                      className="mt-2 w-full min-h-[96px] rounded-md border border-hairline bg-white px-3 py-2 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-medium">Postconditions</label>
                    <textarea
                      value={formData.postconditions || ""}
                      onChange={(event) => setFormData({ ...formData, postconditions: event.target.value })}
                      className="mt-2 w-full min-h-[96px] rounded-md border border-hairline bg-white px-3 py-2 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-medium">Main flow</label>
                    <textarea
                      value={formData.main_flow || ""}
                      onChange={(event) => setFormData({ ...formData, main_flow: event.target.value })}
                      className="mt-2 w-full min-h-[96px] rounded-md border border-hairline bg-white px-3 py-2 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-medium">Alternate flow</label>
                    <textarea
                      value={formData.alternate_flow || ""}
                      onChange={(event) => setFormData({ ...formData, alternate_flow: event.target.value })}
                      className="mt-2 w-full min-h-[96px] rounded-md border border-hairline bg-white px-3 py-2 text-sm outline-none"
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Title</p>
                    <p className="mt-0.5">{(detailItem as UseCase).title}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Description</p>
                    {(detailItem as UseCase).description
                      ? <p className="mt-0.5">{(detailItem as UseCase).description}</p>
                      : <p className="mt-0.5 italic text-muted">Not specified</p>}
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Actors</p>
                    {(detailItem as UseCase).actors
                      ? <p className="mt-0.5">{(detailItem as UseCase).actors}</p>
                      : <p className="mt-0.5 italic text-muted">Not specified</p>}
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Pre-Condition</p>
                    {(detailItem as UseCase).preconditions
                      ? <p className="mt-0.5 whitespace-pre-line">{(detailItem as UseCase).preconditions}</p>
                      : <p className="mt-0.5 italic text-muted">Not specified</p>}
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Post-Condition</p>
                    {(detailItem as UseCase).postconditions
                      ? <p className="mt-0.5 whitespace-pre-line">{(detailItem as UseCase).postconditions}</p>
                      : <p className="mt-0.5 italic text-muted">Not specified</p>}
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Main Flow</p>
                    {(detailItem as UseCase).main_flow
                      ? <p className="mt-0.5 whitespace-pre-line">{(detailItem as UseCase).main_flow}</p>
                      : <p className="mt-0.5 italic text-muted">Not specified</p>}
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Alternate Flow</p>
                    {(detailItem as UseCase).alternate_flow
                      ? <p className="mt-0.5 whitespace-pre-line">{(detailItem as UseCase).alternate_flow}</p>
                      : <p className="mt-0.5 italic text-muted">Not specified</p>}
                  </div>
                </div>
              )}
            </div>
          )}

          {detailType === "requirements" && (
            <div className="space-y-4 text-sm text-ink">
              <div>
                <p className="font-medium">Source use case</p>
                <button
                  type="button"
                  onClick={() => {
                    const parent = useCaseMap.get((detailItem as Requirement).usecase_id);
                    if (parent) {
                      setActiveTab("use_cases");
                      setDetailType("use_cases");
                      setDetailItem(parent);
                    }
                  }}
                  className="text-accent text-xs"
                >
                  {useCaseMap.get((detailItem as Requirement).usecase_id)?.title || "View source use case"}
                </button>
              </div>
              {isEditing ? (
                <>
                  <div>
                    <label className="font-medium">Title</label>
                    <input
                      value={formData.title || ""}
                      onChange={(event) => setFormData({ ...formData, title: event.target.value })}
                      className="mt-2 w-full rounded-md border border-hairline bg-white px-3 py-2 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-medium">Description</label>
                    <textarea
                      value={formData.description || ""}
                      onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                      className="mt-2 w-full min-h-[96px] rounded-md border border-hairline bg-white px-3 py-2 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-medium">Type</label>
                    <select
                      value={formData.requirement_type || "functional"}
                      onChange={(event) => setFormData({ ...formData, requirement_type: event.target.value })}
                      className="mt-2 w-full rounded-md border border-hairline bg-white px-3 py-2 text-sm outline-none"
                    >
                      <option value="functional">Functional</option>
                      <option value="non_functional">Non-functional</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-medium">Priority</label>
                    <select
                      value={formData.priority || "medium"}
                      onChange={(event) => setFormData({ ...formData, priority: event.target.value })}
                      className="mt-2 w-full rounded-md border border-hairline bg-white px-3 py-2 text-sm outline-none"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Title</p>
                    <p className="mt-0.5">{(detailItem as Requirement).title}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Description</p>
                    {(detailItem as Requirement).description
                      ? <p className="mt-0.5">{(detailItem as Requirement).description}</p>
                      : <p className="mt-0.5 italic text-muted">Not specified</p>}
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Use Case ID</p>
                    <p className="mt-0.5 font-mono text-accent">
                      {(() => {
                        const ucIdx = useCases.findIndex((uc) => uc.usecase_id === (detailItem as Requirement).usecase_id);
                        const ucLbl = ucIdx !== -1 ? `UC-${String(ucIdx + 1).padStart(2, "0")}` : `UC-${(detailItem as Requirement).usecase_id}`;
                        return `${ucLbl} (ID: ${(detailItem as Requirement).usecase_id})`;
                      })()}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Type</p>
                    <p className="mt-0.5 capitalize">{(detailItem as Requirement).requirement_type.replace("_", " ")}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {detailType === "test_cases" && (
            <div className="space-y-4 text-sm text-ink">
              <div>
                <p className="font-medium">Source requirement</p>
                <button
                  type="button"
                  onClick={() => {
                    const requirement = requirementMap.get((detailItem as TestCase).requirement_id);
                    if (requirement) {
                      setActiveTab("requirements");
                      setDetailType("requirements");
                      setDetailItem(requirement);
                    }
                  }}
                  className="text-accent text-xs"
                >
                  {requirementMap.get((detailItem as TestCase).requirement_id)?.title || "View source requirement"}
                </button>
              </div>
              <div>
                <p className="font-medium">Source use case</p>
                <button
                  type="button"
                  onClick={() => {
                    const parent = useCaseMap.get((detailItem as TestCase).usecase_id);
                    if (parent) {
                      setActiveTab("use_cases");
                      setDetailType("use_cases");
                      setDetailItem(parent);
                    }
                  }}
                  className="text-accent text-xs"
                >
                  {useCaseMap.get((detailItem as TestCase).usecase_id)?.title || "View source use case"}
                </button>
              </div>
              {isEditing ? (
                <>
                  <div>
                    <label className="font-medium">Title</label>
                    <input
                      value={formData.title || ""}
                      onChange={(event) => setFormData({ ...formData, title: event.target.value })}
                      className="mt-2 w-full rounded-md border border-hairline bg-white px-3 py-2 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-medium">Preconditions</label>
                    <textarea
                      value={formData.preconditions || ""}
                      onChange={(event) => setFormData({ ...formData, preconditions: event.target.value })}
                      className="mt-2 w-full min-h-[96px] rounded-md border border-hairline bg-white px-3 py-2 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-medium">Expected result</label>
                    <textarea
                      value={formData.expected_result || ""}
                      onChange={(event) => setFormData({ ...formData, expected_result: event.target.value })}
                      className="mt-2 w-full min-h-[96px] rounded-md border border-hairline bg-white px-3 py-2 text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="font-medium">Priority</label>
                    <select
                      value={formData.priority || "medium"}
                      onChange={(event) => setFormData({ ...formData, priority: event.target.value })}
                      className="mt-2 w-full rounded-md border border-hairline bg-white px-3 py-2 text-sm outline-none"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Title</p>
                    <p className="mt-0.5 font-medium">{(detailItem as TestCase).title}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Test Steps</p>
                    {((detailItem as TestCase).test_steps || []).length > 0 ? (
                      <ol className="mt-1 space-y-3">
                        {(detailItem as TestCase).test_steps?.map((step, i) => (
                          <li key={step.step ?? i} className="rounded-md border border-hairline bg-[#F6F6F3] p-3">
                            <p className="text-[11px] font-semibold text-muted">Step {step.step ?? i + 1}</p>
                            <p className="mt-1 font-medium">{step.action}</p>
                            {step.expected && (
                              <>
                                <p className="mt-1.5 text-[11px] font-semibold text-muted">Expected</p>
                                <p className="mt-0.5 text-muted">{step.expected}</p>
                              </>
                            )}
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p className="mt-0.5 italic text-muted">Not specified</p>
                    )}
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Expected Result</p>
                    {(detailItem as TestCase).expected_result
                      ? (
                        <div className="mt-1 rounded-md border border-accent/30 bg-accent/5 px-3 py-2.5">
                          <p className="text-sm">{(detailItem as TestCase).expected_result}</p>
                        </div>
                      )
                      : <p className="mt-0.5 italic text-muted">Not specified</p>}
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">Pre-Condition</p>
                    {(detailItem as TestCase).preconditions
                      ? <p className="mt-0.5 whitespace-pre-line">{(detailItem as TestCase).preconditions}</p>
                      : <p className="mt-0.5 italic text-muted">Not specified</p>}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-5 rounded-[10px] border border-hairline bg-[#F6F6F3] p-4 text-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="font-medium">Status control</p>
              <span className="text-[11px] text-muted">Backend status endpoint required</span>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <select
                value={detailItem.status}
                onChange={(event) => {
                  const value = event.target.value as typeof detailItem.status;
                  setDetailItem({ ...detailItem, status: value } as UseCase | Requirement | TestCase);
                }}
                className="rounded-md border border-hairline bg-white px-3 py-2 text-sm outline-none"
              >
                <option value="draft">Draft</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="executed">Executed</option>
                <option value="passed">Passed</option>
                <option value="failed">Failed</option>
              </select>
              <button
                type="button"
                onClick={handleStatusSave}
                disabled={actionState.loading}
                className="rounded-md bg-accent px-4 py-2 text-xs font-medium text-white disabled:opacity-60"
              >
                {actionState.loading ? "Saving…" : "Save status"}
              </button>
            </div>
            {actionState.error && (
              <p className="mt-3 text-[11px] text-danger">{actionState.error}</p>
            )}
            {editState.error && (
              <p className="mt-3 text-[11px] text-danger">{editState.error}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
