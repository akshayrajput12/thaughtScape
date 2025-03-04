
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';

type VerificationReminderProps = {
  email?: string;
  isVisible: boolean;
};

export const VerificationReminder = ({ email, isVisible }: VerificationReminderProps) => {
  if (!isVisible) return null;

  return (
    <Alert className="mb-4 bg-blue-50 border-blue-200">
      <InfoIcon className="h-4 w-4 text-blue-600" />
      <AlertTitle className="text-blue-700">Verification Required</AlertTitle>
      <AlertDescription className="text-blue-600">
        We've sent a verification email to <strong>{email}</strong>. Please verify your email within 7 days or your account will be automatically deleted. 
        <br /><br />
        Check your spam folder if you don't see it in your inbox.
      </AlertDescription>
    </Alert>
  );
};
