
import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { AlertCircle, Clock, Calendar, Building } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { Project } from "@/types";

export function PendingProjectsList() {
  const { user } = useAuth();

  const { data: pendingProjects, isLoading } = useQuery({
    queryKey: ["userPendingProjects", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('author_id', user.id)
        .eq('verification_status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Project[];
    },
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <div className="p-4 border rounded-md bg-background animate-pulse">
        <div className="h-6 w-3/4 bg-muted rounded mb-4"></div>
        <div className="space-y-2">
          <div className="h-4 w-full bg-muted rounded"></div>
          <div className="h-4 w-5/6 bg-muted rounded"></div>
          <div className="h-4 w-4/6 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!pendingProjects || pendingProjects.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Pending Job Verifications
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Alert className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 mb-4">
          <AlertCircle className="h-4 w-4 text-amber-500 dark:text-amber-400" />
          <AlertDescription className="text-amber-800 dark:text-amber-300 text-sm">
            These jobs are pending admin verification and are not yet visible to users.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          {pendingProjects.map(project => (
            <div key={project.id} className="border rounded-md p-3 bg-card">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{project.title}</h3>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-2">
                    <div className="flex items-center gap-1">
                      <Building className="h-3.5 w-3.5" />
                      <span>{project.company_name || 'No company'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Posted on {format(new Date(project.created_at), "MMM d, yyyy")}</span>
                    </div>
                  </div>
                </div>
                <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300">
                  Pending
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
