import re

with open("src/app/(dashboard)/projects/[projectId]/traceability/page.tsx", "r") as f:
    content = f.read()

# 1. In fetchStepData, add setUserStories
fetch_step = """
        const data = await api.getTraceability(projectId, selectedFileId ?? undefined);
        setUserStories(data.user_stories || []);
        setUseCases(data.use_cases);
"""
content = content.replace('const data = await api.getTraceability(projectId, selectedFileId ?? undefined);\n        setUseCases(data.use_cases);', fetch_step.strip())

# 2. Add generate handlers
gen_handlers = """
  async function handleGenerateUserStories() {
    if (!selectedFileId) return;
    setGenerating("file-" + selectedFileId);
    try {
      const prompt = promptModal.prompt;
      const res = await api.generateUserStories(selectedFileId, prompt);
      showNotification("success", res.message);
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
      showNotification("success", res.message);
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
      showNotification("success", res.message || "Requirements generated successfully");
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
      showNotification("success", res.message || "Test cases generated successfully");
      const data = await api.getTraceability(projectId, selectedFileId ?? undefined);
      setTestCases(data.test_cases);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate test cases.");
    } finally {
      setGenerating(null);
      setPromptModal({isOpen: false, type: "", targetId: null, prompt: ""});
    }
  }
"""

content = re.sub(
    r"async function handleGenerateRequirementsForRow\(.*?\) \{.*?(?=async function handleGenerateTestCasesForRow|const filteredUseCases)/s",
    "",
    content,
    flags=re.DOTALL
)
content = re.sub(
    r"async function handleGenerateTestCasesForRow\(.*?\) \{.*?(?=const filteredUseCases)/s",
    "",
    content,
    flags=re.DOTALL
)
content = content.replace("const filteredUseCases =", gen_handlers + "\n  const filteredUseCases =")


# write it back
with open("src/app/(dashboard)/projects/[projectId]/traceability/page.tsx", "w") as f:
    f.write(content)

print("Patched handle handlers")
