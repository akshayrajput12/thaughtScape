import React from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Briefcase, Search, TrendingUp, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';

interface FreelanceHeaderProps {
  onPostJob: () => void;
  jobCount: number;
}

export const FreelanceHeader = ({ onPostJob, jobCount }: FreelanceHeaderProps) => {
  return (
    <div className="relative overflow-hidden rounded-xl border border-border bg-gradient-to-br from-card to-card/80 p-8 shadow-sm">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]">
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-secondary/30 blur-3xl" />
        <svg
          className="absolute inset-0 h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          height="100%"
          fill="none"
          viewBox="0 0 800 800"
        >
          <g stroke="currentColor" strokeWidth="2">
            <path d="M0 0h50v50H0z" />
            <path d="M100 0h50v50h-50z" />
            <path d="M200 0h50v50h-50z" />
            <path d="M300 0h50v50h-50z" />
            <path d="M400 0h50v50h-50z" />
            <path d="M500 0h50v50h-50z" />
            <path d="M600 0h50v50h-50z" />
            <path d="M700 0h50v50h-50z" />
            <path d="M0 100h50v50H0z" />
            <path d="M100 100h50v50h-50z" />
            <path d="M200 100h50v50h-50z" />
            <path d="M300 100h50v50h-50z" />
            <path d="M400 100h50v50h-50z" />
            <path d="M500 100h50v50h-50z" />
            <path d="M600 100h50v50h-50z" />
            <path d="M700 100h50v50h-50z" />
            <path d="M0 200h50v50H0z" />
            <path d="M100 200h50v50h-50z" />
            <path d="M200 200h50v50h-50z" />
            <path d="M300 200h50v50h-50z" />
            <path d="M400 200h50v50h-50z" />
            <path d="M500 200h50v50h-50z" />
            <path d="M600 200h50v50h-50z" />
            <path d="M700 200h50v50h-50z" />
          </g>
        </svg>
      </div>

      <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge variant="outline" className="mb-3 border-primary/20 bg-primary/10 text-primary">
              <TrendingUp className="mr-1 h-3 w-3" /> CampusCash Jobs
            </Badge>
            <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Find Your Next Opportunity
            </h1>
            <p className="mt-3 text-muted-foreground">
              Discover jobs, connect with employers, and build your career on campus. Browse through {jobCount} available opportunities.
            </p>
          </motion.div>

          <div className="mt-6 flex flex-wrap gap-3">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Button
                onClick={onPostJob}
                className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 gap-2"
              >
                <PlusCircle className="h-4 w-4" />
                Post a Job
              </Button>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Button variant="outline" className="gap-2">
                <Search className="h-4 w-4" />
                Browse All Jobs
              </Button>
            </motion.div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="hidden md:block"
        >
          <div className="relative">
            <div className="absolute -inset-0.5 rounded-xl bg-gradient-to-r from-primary/20 to-secondary/20 blur-sm" />
            <div className="relative rounded-lg bg-card p-5 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Briefcase className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Job Statistics</h3>
                  <p className="text-sm text-muted-foreground">Latest opportunities</p>
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="rounded-md bg-muted/50 p-3">
                  <div className="text-2xl font-bold text-foreground">{jobCount}</div>
                  <div className="text-xs text-muted-foreground">Active Jobs</div>
                </div>
                <div className="rounded-md bg-muted/50 p-3">
                  <div className="text-2xl font-bold text-foreground">
                    <Users className="inline h-5 w-5 text-primary" />
                    <span className="ml-1">Connect</span>
                  </div>
                  <div className="text-xs text-muted-foreground">With Employers</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
