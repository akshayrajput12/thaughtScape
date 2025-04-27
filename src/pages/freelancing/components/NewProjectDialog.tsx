
// Fix for line 162 that has type mismatch for Project:

// Replace the direct cast to Project with proper mapping that includes all required fields:
if (data) {
  const formattedProject: Project = {
    ...data,
    status: (data.status || 'open') as "open" | "closed" | "in_progress",
    budget: data.min_budget,
    category: data.job_type || "other",
    author: {
      ...data.author,
      created_at: data.created_at, // Make sure all required Profile properties exist
      updated_at: data.updated_at || data.created_at
    }
  };
  onProjectCreated(formattedProject);
}
