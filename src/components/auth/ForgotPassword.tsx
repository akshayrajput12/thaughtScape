import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft, Info } from 'lucide-react';
import { useAuthForm } from '@/hooks/use-auth-form';
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ForgotPasswordProps {
  onBack: () => void;
}

export const ForgotPassword = ({ onBack }: ForgotPasswordProps) => {
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const {
    email,
    setEmail,
    loading,
    handleResetPassword,
  } = useAuthForm();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const { success, error } = await handleResetPassword();

    if (success) {
      setResetSent(true);
    } else if (error) {
      setError(error.message || 'An error occurred while sending the reset link');
    }
  };

  if (resetSent) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Alert className="bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800">
          <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertDescription className="text-blue-600 dark:text-blue-300">
            A password reset link has been sent to <strong>{email}</strong>.
            Please check your inbox and click the link to reset your password.
            <br /><br />
            If you don't see the email, check your spam folder.
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button
            variant="outline"
            className="w-full text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600"
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sign In
          </Button>
        </div>
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

      <div className="text-center mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Reset your password</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Enter your email address and we'll send you a link to reset your password
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="reset-email" className="text-gray-900 dark:text-gray-100">Email address</Label>
          <Input
            id="reset-email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email address"
            required
            className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
          />
        </div>

        <div className="flex flex-col gap-2">
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
              {loading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </motion.div>

          <Button
            type="button"
            variant="ghost"
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            onClick={onBack}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Sign In
          </Button>
        </div>
      </form>
    </div>
  );
};
