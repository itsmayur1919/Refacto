import type { Project, UploadedFile, Requirement, TestCase, UseCase, UserStory, User, ChatMessage, ChatPrimerResponse } from "./types";


const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("access_token");
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken();
  const { headers, ...restOptions } = options || {};
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    ...restOptions,
  });

  const text = await res.text();
  let body: any = {};
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = {};
    }
  }
  if (!res.ok) {
    const error = new Error(body.error || body.message || `Request failed: ${res.status}`);
    (error as any).status = res.status;
    (error as any).body = body;
    throw error;
  }
  return body as T;
}

export const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;
export const ALLOWED_FILE_EXTENSIONS = [
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "png",
  "svg",
  "jpeg",
  "jpg",
] as const;

export const auth = {
  signup: (data: { organization_name: string; name: string; email: string; password: string }) =>
    request<{ access_token: string }>("/auth/signup", { method: "POST", body: JSON.stringify(data) })
      .then((res) => {
        sessionStorage.setItem("access_token", res.access_token);
        return res;
      }),

  login: (data: { email: string; password: string }) =>
    request<{ access_token: string; user?: User }>("/auth/login", { method: "POST", body: JSON.stringify(data) })
      .then((res) => {
        sessionStorage.setItem("access_token", res.access_token);
        return res;
      }),

  // verify: () =>
  //   request<{ user: User }>("/auth/verify")
  //     .catch(() => {
  //       sessionStorage.removeItem("access_token");
  //       throw new Error("Token invalid or expired");
  //     }),

  verify: () =>
    request<{ user: User }>("/auth/verify")
      .catch((err) => {
        // Only clear the token on a genuine auth rejection — a network
        // error or a missing/broken endpoint should never silently log
        // the user out, since that was wiping valid tokens and causing
        // unrelated 401s elsewhere (e.g. Generate UseCase).
        if (err?.status === 401 || err?.status === 422) {
          sessionStorage.removeItem("access_token");
        }
        throw err;
      }),

  getMe: () => request<User>("/auth/me"),

  updateMe: (data: Partial<Pick<User, "name" | "theme_preference" | "date_format" | "avatar_url">>) =>
    request<User>("/auth/me", { method: "PATCH", body: JSON.stringify(data) }),

  logout: () =>
    request("/auth/logout", { method: "POST" })
      .catch(() => undefined)
      .finally(() => sessionStorage.removeItem("access_token")),
};

function uploadWithProgress(formData: FormData, onProgress: (progress: number) => void): Promise<any> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE}/files`);
    const token = getToken();
    if (token) {
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      const text = xhr.responseText;
      let body: any = {};
      if (text) {
        try {
          body = JSON.parse(text);
        } catch {
          body = {};
        }
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(body);
      } else {
        reject(new Error(body.error || body.message || `Upload failed: ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error("Network error during upload."));
    xhr.send(formData);
  });
}

export const api = {
  getProjects: () => request<Project[]>("/projects"),

  getTraceability: (projectId: number, fileId?: number) =>
    request<{ user_stories: UserStory[]; use_cases: UseCase[]; requirements: Requirement[]; test_cases: TestCase[] }>(
      `/projects/${projectId}/traceability${fileId ? `?file_id=${fileId}` : ""}`
    ),

  deleteProject: (id: number) => request<{ message: string }>(`/projects/${id}`, { method: "DELETE" }),

  createProject: (data: { name: string; description?: string }) =>
    request<Project>("/projects", { method: "POST", body: JSON.stringify(data) }),

  getProjectFiles: (projectId: number) =>
    request<UploadedFile[]>(`/files?project_id=${projectId}`),

  getFile: (fileId: number) => request<UploadedFile>(`/files/${fileId}`),

  renameFile: (fileId: number, fileName: string) =>
    request<UploadedFile>(`/files/${fileId}`, {
      method: "PATCH",
      body: JSON.stringify({ file_name: fileName }),
    }),

  deleteFile: (fileId: number) => request<{ message: string }>(`/files/${fileId}`, { method: "DELETE" }),

  uploadFile: (formData: FormData) => uploadWithProgress(formData, () => { }),

  uploadFileWithProgress: (formData: FormData, onProgress: (progress: number) => void) =>
    uploadWithProgress(formData, onProgress),

  getUseCases: (projectId: number) => request<UseCase[]>(`/use-cases?project_id=${projectId}`),

  getUseCasesByFile: (fileId: number) => request<UseCase[]>(`/use-cases?file_id=${fileId}`),

  getUseCasesByUserStory: (userStoryId: number) => request<UseCase[]>(`/use-cases?user_story_id=${userStoryId}`),

  // User Stories
  getUserStories: (projectId: number, fileId?: number) =>
    request<UserStory[]>(`/user-stories?project_id=${projectId}${fileId ? `&file_id=${fileId}` : ""}`),

  generateUserStories: (fileId: number, customPrompt?: string) =>
    request<{ user_stories: UserStory[]; user_stories_generated: number }>(`/user-stories/generate/file/${fileId}`, {
      method: "POST",
      body: JSON.stringify({ custom_prompt: customPrompt || "" }),
    }),

  updateUserStory: (userStoryId: number, data: Partial<UserStory>) =>
    request<UserStory>(`/user-stories/${userStoryId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteUserStory: (userStoryId: number) =>
    request(`/user-stories/${userStoryId}`, { method: "DELETE" }),

  bulkDeleteUserStories: (ids: number[]) =>
    request<{ deleted: number }>("/user-stories/bulk-delete", {
      method: "POST",
      body: JSON.stringify({ ids }),
    }),

  generateUseCasesFromUserStory: (userStoryId: number, customPrompt?: string) =>
    request<{ use_cases: UseCase[]; use_cases_generated: number }>(`/use-cases/generate/user-story/${userStoryId}`, {
      method: "POST",
      body: JSON.stringify({ custom_prompt: customPrompt || "" }),
    }),

  getRequirements: (usecaseId: number) => request<Requirement[]>(`/requirements?usecase_id=${usecaseId}`),

  getTestCases: (usecaseId: number) => request<TestCase[]>(`/test-cases?usecase_id=${usecaseId}`),

  getTestCasesByRequirement: (requirementId: number) =>
    request<TestCase[]>(`/test-cases?requirement_id=${requirementId}`),

  generateUseCases: (fileId: number, customPrompt?: string) =>
    request<{ message: string; file_id: number; use_cases_generated: number; use_cases: UseCase[] }>(
      `/use-cases/generate/file/${fileId}`,
      { method: "POST", body: JSON.stringify({ custom_prompt: customPrompt || "" }) }
    ),

  generateRequirements: (usecaseId: number, customPrompt?: string) =>
    request<{ requirements: Requirement[]; requirements_generated: number }>(
      `/requirements/generate/${usecaseId}`,
      { method: "POST", body: JSON.stringify({ custom_prompt: customPrompt || "" }) }
    ),

  generateTestCases: (usecaseId: number, requirementId: number, customPrompt?: string) =>
    request<{ test_cases: TestCase[]; test_cases_generated: number }>(
      `/test-cases/generate/${usecaseId}/${requirementId}`,
      { method: "POST", body: JSON.stringify({ custom_prompt: customPrompt || "" }) }
    ),

  updateUseCase: (usecaseId: number, data: Partial<UseCase>) =>
    request<UseCase>(`/use-cases/${usecaseId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  updateRequirement: (requirementId: number, data: Partial<Requirement>) =>
    request<Requirement>(`/requirements/${requirementId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  updateTestCase: (testCaseId: number, data: Partial<TestCase>) =>
    request<TestCase>(`/test-cases/${testCaseId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deleteUseCase: (usecaseId: number) =>
    request(`/use-cases/${usecaseId}`, { method: "DELETE" }),

  bulkDeleteUseCases: (ids: number[]) =>
    request<{ deleted: number }>("/use-cases/bulk-delete", {
      method: "POST",
      body: JSON.stringify({ ids }),
    }),

  deleteRequirement: (requirementId: number) =>
    request(`/requirements/${requirementId}`, { method: "DELETE" }),

  bulkDeleteRequirements: (ids: number[]) =>
    request<{ deleted: number }>("/requirements/bulk-delete", {
      method: "POST",
      body: JSON.stringify({ ids }),
    }),

  deleteTestCase: (testCaseId: number) =>
    request(`/test-cases/${testCaseId}`, { method: "DELETE" }),

  bulkDeleteTestCases: (ids: number[]) =>
    request<{ deleted: number }>("/test-cases/bulk-delete", {
      method: "POST",
      body: JSON.stringify({ ids }),
    }),

  patchStatus: async (endpoint: string, id: number, status: string) => {
    const endpointPaths: Record<string, string> = {
      use_cases: "/use-cases",
      requirements: "/requirements",
      test_cases: "/test-cases",
    };
    const path = endpointPaths[endpoint];
    if (!path) {
      throw new Error(`Unknown endpoint type: ${endpoint}`);
    }
    return request(`${path}/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

  getProject: (id: number) => request<Project>(`/projects/${id}`),

  getProjectChat: (projectId: number) =>
    request<{ messages: ChatMessage[] }>(`/projects/${projectId}/chat/messages`),

  getChatPrimer: (projectId: number) =>
    request<ChatPrimerResponse>(`/projects/${projectId}/chat/primer`),

  confirmCopilotAction: (projectId: number, tool_name: string, argumentsData?: Record<string, any>) =>
    request<{ status: string; message?: string; data?: any }>(
      `/projects/${projectId}/chat/confirm-action`,
      { method: "POST", body: JSON.stringify({ tool_name, arguments: argumentsData || {} }) }
    ),

  sendChatMessage: (projectId: number, content: string) =>
    request<{ user_message: ChatMessage; assistant_message: ChatMessage }>(
      `/projects/${projectId}/chat/messages`,
      { method: "POST", body: JSON.stringify({ content }) }
    ),

  clearChatHistory: (projectId: number) =>
    request(`/projects/${projectId}/chat/messages`, { method: "DELETE" }),

  startAgentRun: (projectId: number, goal: string) =>
    request<import("./types").AgentRun>(`/projects/${projectId}/agent-runs`, {
      method: "POST",
      body: JSON.stringify({ goal }),
    }),

  getAgentRun: (projectId: number, runId: number) =>
    request<import("./types").AgentRun>(`/projects/${projectId}/agent-runs/${runId}`),

  cancelAgentRun: (projectId: number, runId: number) =>
    request<import("./types").AgentRun>(`/projects/${projectId}/agent-runs/${runId}/cancel`, {
      method: "POST",
    }),

  confirmAgentRunStep: (projectId: number, runId: number, confirmed: boolean) =>
    request<import("./types").AgentRun>(`/projects/${projectId}/agent-runs/${runId}/confirm-step`, {
      method: "POST",
      body: JSON.stringify({ confirmed }),
    }),
};


/**
 * Downloads the full project export as a .xlsx file with 3 sheets.
 * Must bypass the normal request() helper because that always calls res.json()
 * which would throw on a binary file response.
 */
export async function exportProjectXlsx(projectId: number, projectName: string): Promise<void> {
  const token = typeof window !== "undefined" ? sessionStorage.getItem("access_token") : null;
  const res = await fetch(`${API_BASE}/projects/${projectId}/export`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let msg = `Export failed (${res.status})`;
    try { msg = JSON.parse(text)?.error || msg; } catch { /* ignore */ }
    throw new Error(msg);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${projectName.replace(/\s+/g, "_")}_export.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
