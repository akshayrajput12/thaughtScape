import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Info } from 'lucide-react';
import { useAuthForm } from '@/hooks/use-auth-form';
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

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
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-blue-600 dark:text-blue-300">
            A verification email has been sent to <strong>{email}</strong>.
            Please check your inbox and click the link to verify your account.
            <br /><br />
            If you don't see the email, check your spam folder.
          </AlertDescription>
        </Alert>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </motion.div>
      )}

      <form onSubmit={handleSignUp} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-gray-900 dark:text-gray-100">Email address</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
            required
            className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-gray-900 dark:text-gray-100">Create password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a strong password"
            required
            className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
            minLength={6}
          />
          <p className="text-xs text-muted-foreground dark:text-gray-400">
            Password must be at least 6 characters long
          </p>
        </div>

        <motion.div
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <Button
            type="submit"
            className={cn(
              "w-full bg-gradient-to-r from-indigo-600 to-blue-600",
              "hover:from-indigo-700 hover:to-blue-700",
              "dark:from-indigo-700 dark:to-blue-700",
              "dark:hover:from-indigo-600 dark:hover:to-blue-600"
            )}
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Sign up'}
          </Button>
        </motion.div>
      </form>
    </div>
  );
};
