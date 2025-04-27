import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Info } from 'lucide-react';
import { useAuthForm } from '@/hooks/use-auth-form';

interface CustomSignUpProps {
  redirectTo?: string;
  onSignUp?: () => void;
}

export const CustomSignUp = ({ redirectTo = window.location.origin, onSignUp }: CustomSignUpProps) => {
  const [error, setError] = useState<string | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);
  const {
    email,
    setEmail,
    password,
    setPassword,
    loading,
    handleSignUp: signUp,
  } = useAuthForm({ redirectTo });

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const { success, error } = await signUp();
    
    if (success) {
      setVerificationSent(true);
      if (onSignUp) {
        onSignUp();
      }
    } else if (error) {
      setError(error.message || 'An error occurred during sign up');
    }
  };

  if (verificationSent) {
    return (
      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-600">
          A verification email has been sent to <strong>{email}</strong>. 
          Please check your inbox and click the link to verify your account.
          <br /><br />
          If you don't see the email, check your spam folder.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSignUp} className="space-y-4">
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
          <Label htmlFor="password">Create password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a strong password"
            required
            className="w-full"
            minLength={6}
          />
          <p className="text-xs text-muted-foreground">
            Password must be at least 6 characters long
          </p>
        </div>

        <Button
          type="submit"
          className="w-full"
          disabled={loading}
        >
          {loading ? 'Creating account...' : 'Sign up'}
        </Button>
      </form>
    </div>
  );
};
