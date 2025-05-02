
import React, { useState } from 'react';
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Calendar,
  Building,
  MapPin,
} from "lucide-react";
import { format } from "date-fns";
import { type Project } from "@/types";
import { useAuth } from "@/components/auth/AuthProvider";

export function ProjectVerificationTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [verificationNote, setVerificationNote] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  // Fetch pending projects
  const { data: pendingProjects, isLoading: isLoadingPending } = useQuery({
    queryKey: ["adminPendingProjects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          author:profiles!projects_author_id_fkey(
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq("verification_status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Project[];
    },
    enabled: !!user?.id,
  });

  // Fetch recently verified projects
  const { data: verifiedProjects, isLoading: isLoadingVerified } = useQuery({
    queryKey: ["adminVerifiedProjects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          author:profiles!projects_author_id_fkey(
            id,
            username,
            full_name,
            avatar_url
          ),
          verifier:profiles!projects_verified_by_fkey(
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .in("verification_status", ["approved", "rejected"])
        .order("verified_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as Project[];
    },
    enabled: !!user?.id,
  });

  // Handle project verification
  const handleVerify = async (status: 'approved' | 'rejected') => {
    if (!selectedProject || !user?.id) return;

    try {
      setIsVerifying(true);

      const { error } = await supabase
        .from("projects")
        .update({
          verification_status: status,
          verification_note: status === 'rejected' && verificationNote ? verificationNote : null,
          verified_at: new Date().toISOString(),
          verified_by: user.id,
        })
        .eq("id", selectedProject.id);

      if (error) throw error;

      toast({
        title: status === 'approved' ? "Project Approved" : "Project Rejected",
        description: `The project has been ${status}`,
      });

      setSelectedProject(null);
      setVerificationNote("");
      
      // Refresh both queries
      queryClient.invalidateQueries({ queryKey: ["adminPendingProjects"] });
      queryClient.invalidateQueries({ queryKey: ["adminVerifiedProjects"] });
      
    } catch (error) {
      console.error("Error verifying project:", error);
      toast({
        title: "Error",
        description: "Failed to update project verification status",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const getVerificationBadge = (status?: string) => {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Rejected</Badge>;
      case "pending":
      default:
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Pending Verification</h2>
        {isLoadingPending ? (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/30 border-t-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading pending projects...</p>
          </div>
        ) : !pendingProjects || pendingProjects.length === 0 ? (
          <div className="text-center py-10 bg-muted/20 rounded-lg border">
            <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="mt-4 text-lg font-medium">No pending projects</p>
            <p className="text-muted-foreground">All projects have been verified</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingProjects.map((project) => (
              <div
                key={project.id}
                className="p-6 border rounded-lg bg-card hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getVerificationBadge(project.verification_status)}
                      <span className="text-sm text-muted-foreground">
                        Posted {format(new Date(project.created_at), "MMM d, yyyy")}
                      </span>
                    </div>

                    <h3 className="text-xl font-semibold">{project.title}</h3>
                    
                    <div className="flex flex-wrap gap-4 mt-3 mb-4 text-sm">
                      {project.company_name && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Building className="h-4 w-4" />
                          <span>{project.company_name}</span>
                        </div>
                      )}
                      {project.location && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{project.location}</span>
                        </div>
                      )}
                      {project.application_deadline && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>Deadline: {format(new Date(project.application_deadline), "MMM d, yyyy")}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {project.description}
                    </div>

                    <div className="text-sm">
                      {project.min_budget && (
                        <span className="font-medium">
                          ₹{project.min_budget.toLocaleString()}
                          {project.max_budget && ` - ₹${project.max_budget.toLocaleString()}`}
                        </span>
                      )}
                    </div>

                    <div className="text-sm text-muted-foreground mt-2">
                      Posted by: {project.author?.full_name || project.author?.username || 'Unknown'}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-red-200 hover:bg-red-50 text-red-600 hover:text-red-700"
                      onClick={() => {
                        setSelectedProject(project);
                        setVerificationNote("");
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-green-200 hover:bg-green-50 text-green-600 hover:text-green-700"
                      onClick={() => {
                        handleVerify("approved");
                        setSelectedProject(project);
                      }}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Recently Verified</h2>
        {isLoadingVerified ? (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/30 border-t-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading verified projects...</p>
          </div>
        ) : !verifiedProjects || verifiedProjects.length === 0 ? (
          <div className="text-center py-10 bg-muted/20 rounded-lg border">
            <Clock className="h-12 w-12 mx-auto text-muted-foreground" />
            <p className="mt-4 text-lg font-medium">No verified projects</p>
            <p className="text-muted-foreground">Recent verification history will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {verifiedProjects.map((project) => (
              <div
                key={project.id}
                className="p-4 border rounded-lg bg-card"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {getVerificationBadge(project.verification_status)}
                      <span className="text-sm text-muted-foreground">
                        {project.verified_at && `Verified on ${format(new Date(project.verified_at), "MMM d, yyyy")}`}
                      </span>
                    </div>

                    <h3 className="font-medium">{project.title}</h3>
                    
                    {project.verification_note && (
                      <div className="mt-2 text-sm italic border-l-2 border-muted-foreground/30 pl-3 py-1 text-muted-foreground">
                        "{project.verification_note}"
                      </div>
                    )}
                    
                    <div className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                      <span className="font-medium">Action by:</span> {project.verified_by ? (project.author?.username || 'Admin') : 'Unknown'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reject Project Dialog */}
      <Dialog open={!!selectedProject && !isVerifying} onOpenChange={(open) => !open && setSelectedProject(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Project</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this project. This will be visible to the user.
            </DialogDescription>
          </DialogHeader>

          <Textarea
            value={verificationNote}
            onChange={(e) => setVerificationNote(e.target.value)}
            placeholder="Enter rejection reason here..."
            className="min-h-[100px]"
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedProject(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => handleVerify("rejected")}
              disabled={!verificationNote.trim()}
            >
              Reject Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
