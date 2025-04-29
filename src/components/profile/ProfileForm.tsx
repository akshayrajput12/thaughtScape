import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ProfileImageUpload } from './ProfileImageUpload';
import { Profile } from '@/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ProfileFormProps {
  profile: Profile;
  onSubmitSuccess: (updatedProfile: Profile) => void;
  isFirstTimeSetup?: boolean;
}

export function ProfileForm({ profile, onSubmitSuccess, isFirstTimeSetup = false }: ProfileFormProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatar_url || null);

  // Define the form validation schema
  const formSchema = z.object({
    username: z
      .string()
      .min(3, { message: 'Username must be at least 3 characters' })
      .max(50, { message: 'Username must be less than 50 characters' })
      .regex(/^[a-z0-9_.]+$/, {
        message: 'Username can only contain lowercase letters, numbers, underscores and periods',
      }),
    full_name: z.string().min(2, { message: 'Name is required' }).max(100),
    bio: z.string().max(500).optional().nullable(),
    college: z.string().max(100).optional().nullable(),
    registration_number: z.string().max(50).optional().nullable(),
    whatsapp_number: z.string().max(20).optional().nullable(),
    instagram_url: z.union([
      z.string().url({ message: 'Please enter a valid URL' }),
      z.string().max(0),
      z.null()
    ]).optional().nullable(),
    linkedin_url: z.union([
      z.string().url({ message: 'Please enter a valid URL' }),
      z.string().max(0),
      z.null()
    ]).optional().nullable(),
    twitter_url: z.union([
      z.string().url({ message: 'Please enter a valid URL' }),
      z.string().max(0),
      z.null()
    ]).optional().nullable(),
    portfolio_url: z.union([
      z.string().url({ message: 'Please enter a valid URL' }),
      z.string().max(0),
      z.null()
    ]).optional().nullable(),
    snapchat_url: z.union([
      z.string().url({ message: 'Please enter a valid URL' }),
      z.string().max(0),
      z.null()
    ]).optional().nullable(),
  });

  // Initialize the form with the profile data
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: profile.username || '',
      full_name: profile.full_name || '',
      bio: profile.bio || '',
      college: profile.college || '',
      registration_number: profile.registration_number || '',
      whatsapp_number: profile.whatsapp_number || '',
      instagram_url: profile.instagram_url || '',
      linkedin_url: profile.linkedin_url || '',
      twitter_url: profile.twitter_url || '',
      portfolio_url: profile.portfolio_url || '',
      snapchat_url: profile.snapchat_url || '',
    },
  });

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          ...values,
          avatar_url: avatarUrl,
          is_profile_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Your profile has been updated',
      });

      // Pass the updated profile back to the parent component
      onSubmitSuccess({
        ...profile,
        ...values,
        avatar_url: avatarUrl,
        is_profile_completed: true,
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive',
      });
    }
  };

  // Handle avatar upload
  const onImageUploaded = (url: string) => {
    setAvatarUrl(url);
    setIsUploading(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="flex flex-col items-center mb-6">
          <ProfileImageUpload
            profile={profile}
            onImageUploaded={onImageUploaded}
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Click to upload a profile picture</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input placeholder="username" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="full_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio <span className="text-xs text-muted-foreground">(Optional)</span></FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Tell people a bit about yourself..."
                  className="resize-none"
                  {...field}
                  value={field.value || ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="college"
            render={({ field }) => (
              <FormItem>
                <FormLabel>College/University <span className="text-xs text-muted-foreground">(Optional)</span></FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value || ''}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your university" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Lovely Professional University">Lovely Professional University</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="registration_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Registration Number <span className="text-xs text-muted-foreground">(Optional)</span></FormLabel>
                <FormControl>
                  <Input placeholder="Your registration number" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="whatsapp_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>WhatsApp Number <span className="text-xs text-muted-foreground">(Optional)</span></FormLabel>
              <FormControl>
                <Input placeholder="Your WhatsApp number with country code" {...field} value={field.value || ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Social Media Links</h3>
            <span className="text-sm text-muted-foreground">All fields optional</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="instagram_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instagram URL <span className="text-xs text-muted-foreground">(Optional)</span></FormLabel>
                  <FormControl>
                    <Input placeholder="https://instagram.com/username" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="twitter_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Twitter URL <span className="text-xs text-muted-foreground">(Optional)</span></FormLabel>
                  <FormControl>
                    <Input placeholder="https://twitter.com/username" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="linkedin_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>LinkedIn URL <span className="text-xs text-muted-foreground">(Optional)</span></FormLabel>
                  <FormControl>
                    <Input placeholder="https://linkedin.com/in/username" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="portfolio_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Portfolio URL <span className="text-xs text-muted-foreground">(Optional)</span></FormLabel>
                  <FormControl>
                    <Input placeholder="https://yourportfolio.com" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="snapchat_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Snapchat URL <span className="text-xs text-muted-foreground">(Optional)</span></FormLabel>
                <FormControl>
                  <Input placeholder="https://snapchat.com/add/username" {...field} value={field.value || ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isUploading}
            className={isFirstTimeSetup ? "w-full" : ""}
          >
            {isUploading ? 'Uploading...' : isFirstTimeSetup ? 'Complete Profile' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
