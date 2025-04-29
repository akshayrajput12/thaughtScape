
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';
import { motion } from 'framer-motion';

type VerificationReminderProps = {
  email?: string;
  isVisible: boolean;
};

export const VerificationReminder = ({ email, isVisible }: VerificationReminderProps) => {
  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Alert className="mb-4 bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800">
        <InfoIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertTitle className="text-blue-700 dark:text-blue-300">Verification Required</AlertTitle>
        <AlertDescription className="text-blue-600 dark:text-blue-300">
          We've sent a verification email to <strong>{email}</strong>. Please verify your email within 7 days or your account will be automatically deleted.
          <br /><br />
          Check your spam folder if you don't see it in your inbox.
        </AlertDescription>
      </Alert>
    </motion.div>
  );
};
