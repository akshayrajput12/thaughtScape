import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth/AuthProvider";
import { Advertisement } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { X, Upload, Image as ImageIcon, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdvertisementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  advertisement: Advertisement | null;
  isEditing: boolean;
  onClose: (success: boolean) => void;
}

// Define form schema
const formSchema = z.object({
  title: z.string().min(1, "Title is required").max(100, "Title is too long"),
  description: z.string().min(1, "Description is required").max(500, "Description is too long"),
  link_url: z.string().url("Must be a valid URL").or(z.string().length(0)).optional(),
  is_active: z.boolean().default(true),
  display_location: z.array(z.string()).min(1, "Select at least one display location"),
  category: z.string().optional(),
});

export function AdvertisementDialog({
  open,
  onOpenChange,
  advertisement,
  isEditing,
  onClose,
}: AdvertisementDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [previewImages, setPreviewImages] = useState<{ file: File; preview: string }[]>([]);

  // Initialize form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      link_url: "",
      is_active: true,
      display_location: ["home"],
      category: "",
    },
  });

  // Set form values when editing
  useEffect(() => {
    if (isEditing && advertisement) {
      form.reset({
        title: advertisement.title,
        description: advertisement.description,
        link_url: advertisement.link_url || "",
        is_active: advertisement.is_active,
        display_location: advertisement.display_location || ["home"],
        category: advertisement.category || "",
      });
      setImages(advertisement.images || []);
      setMainImageIndex(advertisement.main_image_index || 0);
    } else {
      form.reset({
        title: "",
        description: "",
        link_url: "",
        is_active: true,
        display_location: ["home"],
        category: "",
      });
      setImages([]);
      setMainImageIndex(0);
      setPreviewImages([]);
    }
  }, [isEditing, advertisement, form]);

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Convert FileList to array
    const fileArray = Array.from(files);

    // Check file sizes (max 2MB each)
    const oversizedFiles = fileArray.filter(file => file.size > 2 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast({
        title: "Files too large",
        description: "Some files exceed the 2MB limit",
        variant: "destructive",
      });
      return;
    }

    // Check if all files are images
    const nonImageFiles = fileArray.filter(file => !file.type.startsWith("image/"));
    if (nonImageFiles.length > 0) {
      toast({
        title: "Invalid file type",
        description: "Please select only image files",
        variant: "destructive",
      });
      return;
    }

    // Create previews
    const newPreviews = fileArray.map(file => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setPreviewImages(prev => [...prev, ...newPreviews]);
  };

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) return;

    try {
      setUploading(true);

      // Upload new images
      const uploadedImageUrls: string[] = [...images];

      if (previewImages.length > 0) {
        for (const preview of previewImages) {
          const file = preview.file;
          const fileExt = file.name.split(".").pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
          const filePath = fileName;

          const { error: uploadError, data } = await supabase.storage
            .from("advertisement-images")
            .upload(filePath, file, {
              upsert: true,
            });

          if (uploadError) {
            throw uploadError;
          }

          // Get the public URL
          const { data: publicUrlData } = supabase.storage
            .from("advertisement-images")
            .getPublicUrl(filePath);

          if (publicUrlData) {
            uploadedImageUrls.push(publicUrlData.publicUrl);
          }
        }
      }

      // Ensure main image index is valid
      const safeMainImageIndex = Math.min(mainImageIndex, uploadedImageUrls.length - 1);

      if (isEditing && advertisement) {
        // Update existing advertisement
        const { error } = await supabase
          .from("advertisements")
          .update({
            ...values,
            images: uploadedImageUrls,
            main_image_index: safeMainImageIndex,
            updated_at: new Date().toISOString(),
          })
          .eq("id", advertisement.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Advertisement updated successfully",
        });
      } else {
        // Create new advertisement
        const { error } = await supabase
          .from("advertisements")
          .insert({
            ...values,
            images: uploadedImageUrls,
            main_image_index: safeMainImageIndex,
            author_id: user.id,
          });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Advertisement created successfully",
        });
      }

      // Clean up preview URLs
      previewImages.forEach(preview => URL.revokeObjectURL(preview.preview));
      
      onClose(true);
    } catch (error) {
      console.error("Error saving advertisement:", error);
      toast({
        title: "Error",
        description: "Failed to save advertisement",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  // Handle removing an image
  const handleRemoveImage = async (index: number, isExisting: boolean) => {
    if (isExisting) {
      // Remove from existing images
      const imageToRemove = images[index];
      
      // Extract file name from URL
      const fileName = imageToRemove.split("/").pop();
      
      if (fileName) {
        try {
          // Remove from storage
          const { error: removeError } = await supabase.storage
            .from("advertisement-images")
            .remove([fileName]);

          if (removeError) {
            console.error("Error removing image from storage:", removeError);
          }
        } catch (error) {
          console.error("Error removing image:", error);
        }
      }
      
      // Update images array
      const newImages = [...images];
      newImages.splice(index, 1);
      setImages(newImages);
      
      // Update main image index if needed
      if (mainImageIndex >= newImages.length) {
        setMainImageIndex(Math.max(0, newImages.length - 1));
      } else if (mainImageIndex === index) {
        setMainImageIndex(0);
      }
    } else {
      // Remove from preview images
      const newPreviews = [...previewImages];
      
      // Revoke the object URL to prevent memory leaks
      URL.revokeObjectURL(newPreviews[index].preview);
      
      newPreviews.splice(index, 1);
      setPreviewImages(newPreviews);
    }
  };

  // Set an image as the main image
  const setAsMainImage = (index: number, isExisting: boolean) => {
    if (isExisting) {
      setMainImageIndex(index);
    } else {
      // For preview images, we'll set it as main after upload
      // Just store the index for now
      setMainImageIndex(images.length + index);
    }
  };

  const displayLocationOptions = [
    { id: "home", label: "Home Feed" },
    { id: "explore", label: "Explore Page" },
    { id: "popup", label: "Popup Dialog" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Advertisement" : "Create Advertisement"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the details of your advertisement."
              : "Create a new advertisement to promote content."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter advertisement title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter advertisement description"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="link_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link URL (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com" {...field} />
                  </FormControl>
                  <FormDescription>
                    The URL users will be directed to when clicking the advertisement.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Image Upload */}
            <div className="space-y-4">
              <div>
                <FormLabel>Images</FormLabel>
                <FormDescription>
                  Upload images for your advertisement. The main image will be displayed prominently.
                </FormDescription>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-2">
                {/* Existing images */}
                {images.map((image, index) => (
                  <div
                    key={`existing-${index}`}
                    className={cn(
                      "relative aspect-square rounded-md overflow-hidden border-2",
                      mainImageIndex === index
                        ? "border-primary"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <img
                      src={image}
                      alt={`Advertisement image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="w-full max-w-[120px]"
                        onClick={() => setAsMainImage(index, true)}
                        disabled={mainImageIndex === index}
                      >
                        {mainImageIndex === index ? "Main Image" : "Set as Main"}
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="w-full max-w-[120px]"
                        onClick={() => handleRemoveImage(index, true)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Preview images */}
                {previewImages.map((preview, index) => (
                  <div
                    key={`preview-${index}`}
                    className={cn(
                      "relative aspect-square rounded-md overflow-hidden border-2",
                      mainImageIndex === images.length + index
                        ? "border-primary"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <img
                      src={preview.preview}
                      alt={`New image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        className="w-full max-w-[120px]"
                        onClick={() => setAsMainImage(index, false)}
                        disabled={mainImageIndex === images.length + index}
                      >
                        {mainImageIndex === images.length + index ? "Main Image" : "Set as Main"}
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="w-full max-w-[120px]"
                        onClick={() => handleRemoveImage(index, false)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Upload button */}
                <div className="relative aspect-square rounded-md border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center cursor-pointer">
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <Upload className="h-8 w-8 mb-2" />
                    <span className="text-sm">Upload Images</span>
                  </div>
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="display_location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Display Location</FormLabel>
                  <FormDescription>
                    Select where this advertisement should be displayed.
                  </FormDescription>
                  <div className="space-y-2 mt-2">
                    {displayLocationOptions.map((option) => (
                      <div key={option.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`location-${option.id}`}
                          checked={field.value?.includes(option.id)}
                          onCheckedChange={(checked) => {
                            const updatedLocations = checked
                              ? [...field.value, option.id]
                              : field.value.filter((loc) => loc !== option.id);
                            field.onChange(updatedLocations);
                          }}
                        />
                        <label
                          htmlFor={`location-${option.id}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          {option.label}
                        </label>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Technology, Fashion, Education" {...field} />
                  </FormControl>
                  <FormDescription>
                    Categorize your advertisement for better targeting.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Active Status</FormLabel>
                    <FormDescription>
                      Toggle whether this advertisement is active and visible to users.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onClose(false)}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={uploading}>
                {uploading ? (
                  <>
                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                    {isEditing ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>{isEditing ? "Update" : "Create"}</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
