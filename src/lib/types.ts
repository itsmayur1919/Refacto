export type Priority = "low" | "medium" | "high";

export interface CopilotAction {
  id: string;
  tool_name: string;
  arguments: Record<string, any>;
  label: string;
  status: "idle" | "running" | "success" | "failed" | "requires_confirmation";
  message?: string;
  data?: Record<string, any>;
}

export interface ChatMessage {
  id: number;
  project_id: number;
  user_id?: number | null;
  sender: "user" | "assistant";
  content: string;
  actions?: CopilotAction[];
  created_at: string;
}

export interface ChatPrimerSuggestion {
  label: string;
  prompt: string;
  tool_name?: string;
  arguments?: Record<string, any>;
}

export interface ChatPrimerResponse {
  project_name: string;
  primer_line: string;
  suggestions: ChatPrimerSuggestion[];
  counts?: {
    use_cases: number;
    requirements: number;
    test_cases: number;
    missing_requirements: number;
    missing_test_cases: number;
  };
}


export interface User {
  id: number;
  organization_id: number;
  name: string;
  email: string;
  role: "owner" | "admin" | "project_lead" | "member" | "viewer";
  theme_preference: "light" | "dark" | "auto";
  date_format: string;
  avatar_url?: string | null;
}

export interface Project {
  id: number;
  name: string;
  description: string | null;
  status: "active" | "archived";
  updated_at: string;
  pipeline_stage: number;
}

export interface UploadedFile {
  id: number;
  project_id: number;
  file_name: string;
  file_type: string;
  file_size_bytes?: number;
  ocr_used: boolean;
  extraction_status: "pending" | "processing" | "completed" | "failed" | "queued" | "uploading";
  extraction_error?: string | null;
  extracted_text?: string | null;
  uploaded_at: string;
  processed_at?: string | null;
  use_case_count: number;
  progress?: number;
}

export interface UserStory {
  user_story_id: number;
  file_id: number;
  project_id: number;
  title: string;
  description: string | null;
  acceptance_criteria: string | null;
  priority: Priority;
  status: "draft" | "pending" | "approved" | "rejected";
  ai_generated: boolean;
  version: number;
}

export interface UseCase {
  usecase_id: number;
  user_story_id?: number | null;
  file_id: number | null;
  project_id: number;
  title: string;
  description: string | null;
  actors: string | null;
  preconditions?: string | null;
  postconditions?: string | null;
  main_flow?: string | null;
  alternate_flow?: string | null;
  priority: Priority;
  status: "draft" | "pending" | "approved" | "rejected";
  ai_generated: boolean;
  version: number;
}

export interface Requirement {
  requirement_id: number;
  usecase_id: number;
  project_id: number;
  title: string;
  description?: string | null;
  requirement_type: "functional" | "non_functional";
  priority: Priority;
  status: "draft" | "pending" | "approved" | "rejected";
  ai_generated: boolean;
  version: number;
}

export interface TestStep {
  step: number;
  action: string;
  expected: string;
}

export interface TestCase {
  test_case_id: number;
  usecase_id: number;
  requirement_id: number;
  project_id: number;
  title: string;
  description?: string | null;
  preconditions?: string | null;
  test_steps?: TestStep[];
  expected_result?: string | null;
  actual_result?: string | null;
  priority: Priority;
  status: "draft" | "approved" | "executed" | "passed" | "failed";
  ai_generated: boolean;
  version: number;
}

export interface AgentRunStep {
  id: string;
  tool_name: string;
  label: string;
  status: "in_flight" | "success" | "failed" | "requires_confirmation";
  arguments?: Record<string, any>;
  timestamp: string;
}

export interface AgentRun {
  id: number;
  project_id: number;
  goal: string;
  status: "running" | "awaiting_confirmation" | "completed" | "failed" | "cancelled";
  summary?: string | null;
  error_message?: string | null;
  steps: AgentRunStep[];
  created_at: string;
}

