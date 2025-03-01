import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { Profile } from "@/types";

interface EditUserFormProps {
  user: Profile;
  onSubmit: (formData: FormData) => Promise<void>;
}

export function EditUserForm({ user, onSubmit }: EditUserFormProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        onSubmit(formData);
      }}
      className="space-y-6 animate-fadeIn"
    >
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-sm font-medium text-gray-700">Username</Label>
            <Input
              id="username"
              name="username"
              defaultValue={user.username}
              className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              placeholder="Enter username"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="full_name" className="text-sm font-medium text-gray-700">Full Name</Label>
            <Input
              id="full_name"
              name="full_name"
              defaultValue={user.full_name || ''}
              className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              placeholder="Enter full name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="age" className="text-sm font-medium text-gray-700">Age</Label>
            <Input
              id="age"
              name="age"
              type="number"
              defaultValue={user.age || ''}
              className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              placeholder="Enter age"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="avatar_url" className="text-sm font-medium text-gray-700">Avatar URL</Label>
            <Input
              id="avatar_url"
              name="avatar_url"
              defaultValue={user.avatar_url || ''}
              className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              placeholder="Enter avatar URL"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bio" className="text-sm font-medium text-gray-700">Bio</Label>
            <Textarea
              id="bio"
              name="bio"
              defaultValue={user.bio || ''}
              className="min-h-[100px] transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              placeholder="Tell us about yourself"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="country" className="text-sm font-medium text-gray-700">Country</Label>
              <Input
                id="country"
                name="country"
                defaultValue={user.country || ''}
                className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                placeholder="Country"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="state" className="text-sm font-medium text-gray-700">State</Label>
              <Input
                id="state"
                name="state"
                defaultValue={user.state || ''}
                className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                placeholder="State"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city" className="text-sm font-medium text-gray-700">City</Label>
              <Input
                id="city"
                name="city"
                defaultValue={user.city || ''}
                className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
                placeholder="City"
              />
            </div>
          </div>
        </div>
      </div>

      <input
        type="hidden"
        name="is_profile_completed"
        value={String(user.is_profile_completed)}
      />

      <div className="flex justify-end pt-4 border-t">
        <Button
          type="submit"
          className="bg-gradient-to-r from-primary to-primary/80 text-white hover:opacity-90 transition-all duration-200"
        >
          Save Changes
        </Button>
      </div>
    </form>
  );
}