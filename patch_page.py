import re

with open("src/app/(dashboard)/projects/[projectId]/traceability/page.tsx", "r") as f:
    content = f.read()

# 1. Update imports
content = content.replace(
    'import type { UploadedFile, Requirement, TestCase, UseCase, Priority } from "@/lib/types";',
    'import type { UploadedFile, Requirement, TestCase, UseCase, UserStory, Priority } from "@/lib/types";'
)

# 2. Update StepType
content = content.replace(
    'type StepType = "usecases" | "requirements" | "testcases";',
    'type StepType = "userstories" | "usecases" | "requirements" | "testcases";'
)

# 3. Add url params
content = content.replace(
    'const usecaseIdParam = searchParams.get("usecase_id") ? Number(searchParams.get("usecase_id")) : null;',
    'const userStoryIdParam = searchParams.get("userstory_id") ? Number(searchParams.get("userstory_id")) : null;\n  const usecaseIdParam = searchParams.get("usecase_id") ? Number(searchParams.get("usecase_id")) : null;'
)

# 4. Add data state
content = content.replace(
    'const [useCases, setUseCases] = useState<UseCase[]>([]);',
    'const [userStories, setUserStories] = useState<UserStory[]>([]);\n  const [useCases, setUseCases] = useState<UseCase[]>([]);'
)

# 5. Add selection state
content = content.replace(
    'const [selectedUCIds, setSelectedUCIds] = useState<Set<number>>(new Set());',
    'const [selectedUSIds, setSelectedUSIds] = useState<Set<number>>(new Set());\n  const [selectedUCIds, setSelectedUCIds] = useState<Set<number>>(new Set());'
)

# 6. Add prompt modal state
content = content.replace(
    'const [expandedTestCaseId, setExpandedTestCaseId] = useState<number | null>(null);',
    'const [expandedTestCaseId, setExpandedTestCaseId] = useState<number | null>(null);\n  const [expandedUserStoryId, setExpandedUserStoryId] = useState<number | null>(null);\n  const [promptModal, setPromptModal] = useState<{isOpen: boolean, type: string, targetId: number | null, prompt: string}>({isOpen: false, type: "", targetId: null, prompt: ""});'
)

# 7. Update currentStep array
content = content.replace(
    '["usecases", "requirements", "testcases"].includes(stepParam)',
    '["userstories", "usecases", "requirements", "testcases"].includes(stepParam)'
)
content = content.replace(
    '? stepParam\n    : "usecases";',
    '? stepParam\n    : "userstories";'
)

# write it back temporarily
with open("src/app/(dashboard)/projects/[projectId]/traceability/page.tsx", "w") as f:
    f.write(content)

print("Patched basic states")
