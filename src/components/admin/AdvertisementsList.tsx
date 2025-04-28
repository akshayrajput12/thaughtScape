import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Advertisement } from "@/types";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Eye, 
  Pencil, 
  Trash2, 
  RefreshCw, 
  Plus,
  ExternalLink,
  Image as ImageIcon
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { AdvertisementDialog } from "./AdvertisementDialog";

export function AdvertisementsList() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAdvertisement, setSelectedAdvertisement] = useState<Advertisement | null>(null);
  const [isAdvertisementDialogOpen, setIsAdvertisementDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Fetch advertisements
  const { data: advertisements, isLoading, refetch } = useQuery({
    queryKey: ["advertisements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("advertisements")
        .select(`
          *,
          author:profiles!advertisements_author_id_fkey(
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Advertisement[];
    },
  });

  // Toggle advertisement active status
  const toggleActiveStatus = async (advertisement: Advertisement) => {
    try {
      const { error } = await supabase
        .from("advertisements")
        .update({ is_active: !advertisement.is_active })
        .eq("id", advertisement.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Advertisement ${advertisement.is_active ? "deactivated" : "activated"}`,
      });

      refetch();
    } catch (error) {
      console.error("Error toggling advertisement status:", error);
      toast({
        title: "Error",
        description: "Failed to update advertisement status",
        variant: "destructive",
      });
    }
  };

  // Delete advertisement
  const deleteAdvertisement = async () => {
    if (!selectedAdvertisement) return;

    try {
      const { error } = await supabase
        .from("advertisements")
        .delete()
        .eq("id", selectedAdvertisement.id);

      if (error) throw error;

      // Delete images from storage
      if (selectedAdvertisement.images && selectedAdvertisement.images.length > 0) {
        // Extract file names from URLs
        const fileNames = selectedAdvertisement.images.map(url => {
          const parts = url.split("/");
          return parts[parts.length - 1];
        });

        // Delete files from storage
        const { error: storageError } = await supabase.storage
          .from("advertisement-images")
          .remove(fileNames);

        if (storageError) {
          console.error("Error deleting advertisement images:", storageError);
        }
      }

      toast({
        title: "Success",
        description: "Advertisement deleted successfully",
      });

      setIsDeleteDialogOpen(false);
      refetch();
    } catch (error) {
      console.error("Error deleting advertisement:", error);
      toast({
        title: "Error",
        description: "Failed to delete advertisement",
        variant: "destructive",
      });
    }
  };

  // Handle edit advertisement
  const handleEditAdvertisement = (advertisement: Advertisement) => {
    setSelectedAdvertisement(advertisement);
    setIsEditing(true);
    setIsAdvertisementDialogOpen(true);
  };

  // Handle new advertisement
  const handleNewAdvertisement = () => {
    setSelectedAdvertisement(null);
    setIsEditing(false);
    setIsAdvertisementDialogOpen(true);
  };

  // Handle advertisement dialog close
  const handleAdvertisementDialogClose = (success: boolean) => {
    setIsAdvertisementDialogOpen(false);
    if (success) {
      refetch();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Advertisements</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            className="flex items-center gap-1"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={handleNewAdvertisement}
            className="flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            New Advertisement
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/30 border-t-primary"></div>
        </div>
      ) : advertisements && advertisements.length > 0 ? (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Images</TableHead>
                <TableHead>Display Location</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {advertisements.map((advertisement) => (
                <TableRow key={advertisement.id}>
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-medium">{advertisement.title}</div>
                      <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {advertisement.description}
                      </div>
                      {advertisement.link_url && (
                        <div className="flex items-center gap-1 text-xs text-primary mt-1">
                          <ExternalLink className="h-3 w-3" />
                          <span className="truncate max-w-[180px]">{advertisement.link_url}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      <span>{advertisement.images?.length || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {advertisement.display_location?.map((location) => (
                        <Badge key={location} variant="outline" className="capitalize">
                          {location}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(advertisement.created_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={advertisement.is_active}
                      onCheckedChange={() => toggleActiveStatus(advertisement)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditAdvertisement(advertisement)}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <AlertDialog
                        open={isDeleteDialogOpen && selectedAdvertisement?.id === advertisement.id}
                        onOpenChange={(open) => {
                          setIsDeleteDialogOpen(open);
                          if (!open) setSelectedAdvertisement(null);
                        }}
                      >
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive/90"
                            onClick={() => {
                              setSelectedAdvertisement(advertisement);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Advertisement</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this advertisement? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={deleteAdvertisement}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <ImageIcon className="h-6 w-6 text-primary" />
          </div>
          <h3 className="text-xl font-medium text-foreground mb-2">No advertisements yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            Create your first advertisement to promote content across the platform.
          </p>
          <Button onClick={handleNewAdvertisement}>
            Create Advertisement
          </Button>
        </div>
      )}

      {/* Advertisement Dialog */}
      <AdvertisementDialog
        open={isAdvertisementDialogOpen}
        onOpenChange={setIsAdvertisementDialogOpen}
        advertisement={selectedAdvertisement}
        isEditing={isEditing}
        onClose={handleAdvertisementDialogClose}
      />
    </div>
  );
}
