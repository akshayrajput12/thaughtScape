
// Example fix for lines using _count property:

// Replace lines 309 and 317 with:
const applicationsCount = project.applications_count || project._count?.applications || 0;
const milestonesCount = project.milestones_count || project._count?.milestones || 0;
