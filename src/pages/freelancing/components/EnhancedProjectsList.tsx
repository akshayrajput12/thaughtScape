import React, { useState } from 'react';
import { EnhancedProjectCard } from './EnhancedProjectCard';
import type { Project } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Filter, SlidersHorizontal, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { Separator } from '@/components/ui/separator';
import { Briefcase, Award, Clock } from '@/components/icons/ProjectIcons';

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
  const [selectedJobType, setSelectedJobType] = useState<string>('');
  const [selectedExperienceLevel, setSelectedExperienceLevel] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('open');
  const [showFilters, setShowFilters] = useState(false);

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedJobType('');
    setSelectedExperienceLevel('');
    setSelectedStatus('open');
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = searchTerm === '' ||
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (project.company_name && project.company_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (project.location && project.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (project.required_skills && project.required_skills.some(skill =>
        skill.toLowerCase().includes(searchTerm.toLowerCase())
      ));

    const matchesJobType = selectedJobType === '' ||
      (project.job_type && project.job_type.toLowerCase() === selectedJobType.toLowerCase());

    const matchesExperienceLevel = selectedExperienceLevel === '' ||
      (project.experience_level && project.experience_level.toLowerCase() === selectedExperienceLevel.toLowerCase());

    const matchesStatus = selectedStatus === '' || project.status === selectedStatus;

    return matchesSearch && matchesJobType && matchesExperienceLevel && matchesStatus;
  });

  const featuredProjects = filteredProjects.filter(project => project.is_featured);
  const regularProjects = filteredProjects.filter(project => !project.is_featured);

  const jobTypes = [...new Set(projects
    .filter(p => p.job_type)
    .map(p => p.job_type as string))];

  const experienceLevels = [...new Set(projects
    .filter(p => p.experience_level)
    .map(p => p.experience_level as string))];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 w-full group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-md blur-sm opacity-75 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative bg-card rounded-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search jobs by title, skills, or company..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-full border-none focus-visible:ring-1 focus-visible:ring-primary/30 shadow-sm"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 hover:bg-muted/50"
                  onClick={() => setSearchTerm('')}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <Button
            variant={showFilters ? "default" : "outline"}
            className={`gap-2 transition-all duration-300 ${showFilters ? "bg-primary text-primary-foreground" : ""}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {(selectedJobType || selectedExperienceLevel || selectedStatus !== 'open') && (
              <Badge
                variant={showFilters ? "outline" : "secondary"}
                className="ml-1 h-5 w-5 p-0 flex items-center justify-center"
              >
                {[
                  selectedJobType ? 1 : 0,
                  selectedExperienceLevel ? 1 : 0,
                  selectedStatus !== 'open' ? 1 : 0
                ].reduce((a, b) => a + b, 0)}
              </Badge>
            )}
          </Button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0, y: -10 }}
              animate={{ height: 'auto', opacity: 1, y: 0 }}
              exit={{ height: 0, opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-xl blur-sm"></div>

                <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-4 p-6 bg-card/95 backdrop-blur-sm rounded-xl border border-border shadow-sm">
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2 text-foreground">
                      <Briefcase className="h-4 w-4 text-primary" /> Job Type
                    </label>
                    <Select value={selectedJobType} onValueChange={setSelectedJobType}>
                      <SelectTrigger className="bg-background/50 border-border/50">
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
                    <label className="text-sm font-medium flex items-center gap-2 text-foreground">
                      <Award className="h-4 w-4 text-primary" /> Experience Level
                    </label>
                    <Select value={selectedExperienceLevel} onValueChange={setSelectedExperienceLevel}>
                      <SelectTrigger className="bg-background/50 border-border/50">
                        <SelectValue placeholder="All experience levels" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All experience levels</SelectItem>
                        {experienceLevels.map(level => (
                          <SelectItem key={level} value={level}>{level}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2 text-foreground">
                      <Clock className="h-4 w-4 text-primary" /> Status
                    </label>
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                      <SelectTrigger className="bg-background/50 border-border/50">
                        <SelectValue placeholder="Job status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All statuses</SelectItem>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="sm:col-span-3 flex justify-end pt-2 border-t border-border/30 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearFilters}
                      className="gap-1.5"
                    >
                      <X className="h-3.5 w-3.5" />
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-sm opacity-75"></div>
            <div className="relative h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Briefcase className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              {filteredProjects.length} {filteredProjects.length === 1 ? 'Job' : 'Jobs'} Available
            </h2>
            <p className="text-sm text-muted-foreground">
              {searchTerm ? `Search results for "${searchTerm}"` : 'Browse all opportunities'}
            </p>
          </div>
        </div>

        <Tabs defaultValue="grid" className="w-[200px]">
          <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1">
            <TabsTrigger value="grid" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1">
                <path d="M1.5 1H6.5V6H1.5V1ZM8.5 1H13.5V6H8.5V1ZM1.5 8H6.5V13H1.5V8ZM8.5 8H13.5V13H8.5V8Z" stroke="currentColor" strokeWidth="1" />
              </svg>
              Grid
            </TabsTrigger>
            <TabsTrigger value="list" className="data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1">
                <path d="M1.5 3H13.5M1.5 7.5H13.5M1.5 12H13.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              List
            </TabsTrigger>
          </TabsList>
          <TabsContent value="grid" className="mt-0">
            {/* Grid view is default */}
          </TabsContent>
          <TabsContent value="list" className="mt-0">
            {/* List view will be implemented */}
          </TabsContent>
        </Tabs>
      </div>

      {featuredProjects.length > 0 && (
        <>
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="h-6 w-6 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Award className="h-3.5 w-3.5 text-amber-500" />
              </div>
              <h3 className="text-lg font-medium text-foreground">Featured Jobs</h3>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {featuredProjects.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                >
                  <EnhancedProjectCard
                    project={project}
                    hasApplied={userApplications.includes(project.id)}
                    onApply={onApply}
                    featured={true}
                  />
                </motion.div>
              ))}
            </div>
          </div>

          {regularProjects.length > 0 && (
            <Separator className="my-8 bg-gradient-to-r from-transparent via-border to-transparent opacity-50" />
          )}
        </>
      )}

      {regularProjects.length > 0 ? (
        <>
          {featuredProjects.length === 0 && (
            <div className="flex items-center gap-2 mb-4">
              <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center">
                <Briefcase className="h-3.5 w-3.5 text-primary" />
              </div>
              <h3 className="text-lg font-medium text-foreground">All Jobs</h3>
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {regularProjects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
              >
                <EnhancedProjectCard
                  project={project}
                  hasApplied={userApplications.includes(project.id)}
                  onApply={onApply}
                />
              </motion.div>
            ))}
          </div>
        </>
      ) : (
        filteredProjects.length === 0 && (
          <motion.div
            className="text-center py-16 rounded-xl border border-border/50 bg-card/50 backdrop-blur-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex flex-col items-center">
              <div className="relative mb-6">
                <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-lg opacity-50"></div>
                <div className="relative h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Search className="h-8 w-8 text-primary/70" />
                </div>
              </div>

              <h3 className="text-xl font-medium text-foreground mb-2">No jobs match your filters</h3>
              <p className="text-muted-foreground max-w-md mb-6">
                We couldn't find any jobs matching your current search criteria. Try adjusting your filters or search terms.
              </p>

              <Button
                variant="outline"
                size="lg"
                onClick={handleClearFilters}
                className="gap-2 bg-gradient-to-r from-background to-background/80 hover:from-background/80 hover:to-background border-primary/20"
              >
                <X className="h-4 w-4" />
                Clear All Filters
              </Button>
            </div>
          </motion.div>
        )
      )}
    </div>
  );
};
