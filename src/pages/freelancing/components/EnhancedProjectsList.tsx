import React, { useState } from 'react';
import { Project } from "@/types";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal, X, ChevronDown, Clock } from "lucide-react";
import { EnhancedProjectCard } from './EnhancedProjectCard';
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface EnhancedProjectsListProps {
  projects: Project[];
  userApplications: string[];
  onApply: (project: Project) => void;
  isLoading?: boolean;
}

export const EnhancedProjectsList = ({
  projects,
  userApplications,
  onApply,
  isLoading = false
}: EnhancedProjectsListProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    jobType: '',
    experienceLevel: '',
    location: '',
    budget: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  // Get unique values for filter options
  const locations = [...new Set(projects.filter(p => p.location).map(p => p.location))];
  const jobTypes = [...new Set(projects.filter(p => p.job_type).map(p => p.job_type))];
  const expLevels = [...new Set(projects.filter(p => p.experience_level).map(p => p.experience_level))];

  // Budget ranges
  const budgetRanges = [
    { label: "Any", value: "" },
    { label: "Under ₹10,000", value: "0-10000" },
    { label: "₹10,000 - ₹20,000", value: "10000-20000" },
    { label: "₹20,000 - ₹50,000", value: "20000-50000" },
    { label: "Above ₹50,000", value: "50000-" }
  ];

  const resetFilters = () => {
    setFilters({
      jobType: '',
      experienceLevel: '',
      location: '',
      budget: ''
    });
    setSearchTerm('');
  };

  // Filter projects based on search term and filters
  const filteredProjects = projects.filter(project => {
    // Search term filter
    const searchMatch = 
      !searchTerm || 
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.required_skills && Array.isArray(project.required_skills) && 
       project.required_skills.some(skill => 
         skill.toLowerCase().includes(searchTerm.toLowerCase())
       ));
    
    // Budget filter
    let budgetMatch = true;
    if (filters.budget) {
      const [minStr, maxStr] = filters.budget.split('-');
      const min = parseInt(minStr);
      const max = maxStr ? parseInt(maxStr) : Infinity;
      
      const projectMin = project.min_budget || project.budget || 0;
      const projectMax = project.max_budget || project.budget || Infinity;
      
      budgetMatch = (projectMin >= min && (maxStr ? projectMin <= max : true)) || 
                   (projectMax >= min && (maxStr ? projectMax <= max : true));
    }
    
    // Job type filter
    const jobTypeMatch = !filters.jobType || project.job_type === filters.jobType;
    
    // Experience level filter
    const expMatch = !filters.experienceLevel || project.experience_level === filters.experienceLevel;
    
    // Location filter
    const locationMatch = !filters.location || project.location === filters.location;
    
    return searchMatch && budgetMatch && jobTypeMatch && expMatch && locationMatch;
  });
  
  // Featured projects that match the filters
  const featuredProjects = filteredProjects.filter(p => p.is_featured);
  
  // Regular projects that match the filters (excluding featured ones)
  const regularProjects = filteredProjects.filter(p => !p.is_featured);

  const sortedProjects = [...featuredProjects, ...regularProjects];

  if (isLoading) {
    return (
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="p-5 bg-background rounded-xl shadow-sm animate-pulse">
            <div className="flex items-center gap-3 mb-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div>
                <Skeleton className="h-5 w-40 mb-1" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-5/6 mb-4" />
            <div className="grid grid-cols-2 gap-3 mb-4">
              <Skeleton className="h-10 rounded-md" />
              <Skeleton className="h-10 rounded-md" />
            </div>
            <div className="flex gap-2 mb-3">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <Skeleton className="h-10 w-full rounded-md mt-4" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and filters */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search projects by title, description or skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-background"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {(filters.jobType || filters.experienceLevel || filters.location || filters.budget) && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center rounded-full">
                  {Object.values(filters).filter(Boolean).length}
                </Badge>
              )}
            </Button>
            
            {(filters.jobType || filters.experienceLevel || filters.location || filters.budget || searchTerm) && (
              <Button 
                variant="ghost" 
                onClick={resetFilters}
                className="gap-2"
              >
                <X className="h-4 w-4" />
                Reset
              </Button>
            )}
          </div>
        </div>
        
        <Collapsible open={showFilters} onOpenChange={setShowFilters}>
          <CollapsibleContent className="pt-4">
            <Separator className="mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Job Type</label>
                <Select 
                  value={filters.jobType} 
                  onValueChange={(value) => setFilters({...filters, jobType: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All job types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All job types</SelectItem>
                    {jobTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Experience Level</label>
                <Select 
                  value={filters.experienceLevel} 
                  onValueChange={(value) => setFilters({...filters, experienceLevel: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any experience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any experience</SelectItem>
                    {expLevels.map(level => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Location</label>
                <Select 
                  value={filters.location} 
                  onValueChange={(value) => setFilters({...filters, location: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Any location</SelectItem>
                    {locations.map(location => (
                      <SelectItem key={location} value={location}>{location}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Budget</label>
                <Select 
                  value={filters.budget} 
                  onValueChange={(value) => setFilters({...filters, budget: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any budget" />
                  </SelectTrigger>
                  <SelectContent>
                    {budgetRanges.map(range => (
                      <SelectItem key={range.value} value={range.value}>{range.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
      
      {/* Projects list */}
      {filteredProjects.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm text-center">
          <div className="mx-auto mb-4 bg-muted/30 w-16 h-16 rounded-full flex items-center justify-center">
            <Clock className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">No projects found</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-4">
            We couldn't find any projects matching your search criteria. Try adjusting your filters or check back later.
          </p>
          <Button variant="outline" onClick={resetFilters} className="mt-2">
            Clear filters
          </Button>
        </div>
      ) : (
        <>
          <div className="text-sm text-muted-foreground">
            Showing {filteredProjects.length} projects
          </div>
          
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {sortedProjects.map((project) => (
              <EnhancedProjectCard
                key={project.id}
                project={project}
                hasApplied={userApplications.includes(project.id)}
                onApply={onApply}
                featured={project.is_featured}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
