import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { useAuthForm } from '@/hooks/use-auth-form';
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

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

      <form onSubmit={handleSignIn} className="space-y-4">
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
          <Label htmlFor="password" className="text-gray-900 dark:text-gray-100">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your password"
            required
            className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
          />
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
            {loading ? 'Signing in...' : 'Sign in'}
          </Button>
        </motion.div>
      </form>
    </div>
  );
};
