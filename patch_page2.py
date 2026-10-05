import re

with open("src/app/(dashboard)/projects/[projectId]/traceability/page.tsx", "r") as f:
    content = f.read()

# handleConfirmedDelete
del_us_code = """
      if (type === "userstories") {
        if (ids.length === 1) {
          await api.deleteUserStory(ids[0]);
        } else {
          await api.bulkDeleteUserStories(ids);
        }
        setUserStories((prev) => prev.filter((us) => !ids.includes(us.user_story_id)));
        setSelectedUSIds(new Set());
        showNotification("success", `${ids.length} user stor${ids.length > 1 ? "ies" : "y"} deleted`);
      } else if (type === "usecases") {"""

content = content.replace('if (type === "usecases") {', del_us_code.strip())

# Fetch data in useEffect
fetch_code = """
        const [filesRes, usRes, ucRes, reqRes, tcRes] = await Promise.all([
          api.getProjectFiles(projectId),
          api.getUserStories(projectId, fileIdParam || undefined),
          api.getUseCases(projectId),
          api.getRequirements(0).catch(() => []), // we fetch all if needed or empty
          api.getTestCases(0).catch(() => []),
        ]);
        setFiles(filesRes);
        setUserStories(usRes);
        setUseCases(fileIdParam ? ucRes.filter(uc => uc.file_id === fileIdParam) : ucRes);
        // We'll refetch requirements/testcases based on params later if needed
"""

# Wait, looking at the actual code in useEffect, it probably fetches based on file/usecase. Let's see how it fetches.
