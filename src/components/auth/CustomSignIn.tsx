import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useAuthForm } from '@/hooks/use-auth-form';

interface CustomSignInProps {
  redirectTo?: string;
  onSignIn?: () => void;
}

export const CustomSignIn = ({ redirectTo = window.location.origin, onSignIn }: CustomSignInProps) => {
  const [error, setError] = useState<string | null>(null);
  const {
    email,
    setEmail,
    password,
    setPassword,
    loading,
    handleSignIn: signIn,
  } = useAuthForm({ redirectTo });

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const { success, error } = await signIn();

    if (success && onSignIn) {
      onSignIn();
    } else if (error) {
      setError(error.message || 'An error occurred during sign in');
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSignIn} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
            required
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            required
            className="w-full"
          />
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={loading}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>
    </div>
  );
};
