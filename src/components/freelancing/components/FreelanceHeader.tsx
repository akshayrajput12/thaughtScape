
import React from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

interface FreelanceHeaderProps {
  onNewProject: () => void;
  isAuthenticated: boolean;
}

export const FreelanceHeader = ({ onNewProject, isAuthenticated }: FreelanceHeaderProps) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 className="text-3xl font-bold">Freelancing Projects</h1>
        <p className="text-muted-foreground mt-2">Find projects or post your own to work with talented students</p>
      </div>
      {isAuthenticated && (
        <Button onClick={onNewProject} className="gap-2">
          <PlusCircle className="h-4 w-4" />
          Post New Project
        </Button>
      )}
    </div>
  );
};
