
import { useState, useEffect } from 'react';
import { AuthError } from '@supabase/supabase-js';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { checkEmailExists } from '@/integrations/supabase/client';

type SignUpErrorHandlerProps = {
  error: AuthError | null;
  email?: string;
};

export const SignUpErrorHandler = ({ error, email }: SignUpErrorHandlerProps) => {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkEmail = async () => {
      if (!error && email) {
        setLoading(true);
        try {
          const exists = await checkEmailExists(email);
          if (exists) {
            setMessage("This email is already registered. Please try signing in instead.");
          } else {
            setMessage(null);
          }
        } catch (err) {
          console.error("Error checking email:", err);
        } finally {
          setLoading(false);
        }
      }
    };

    if (email) {
      checkEmail();
    }
  }, [email]);

  useEffect(() => {
    if (error) {
      // Handle various auth errors
      if (error.message.includes("already registered")) {
        setMessage("This email is already registered. Please try signing in instead.");
      } else if (error.message.includes("Invalid login")) {
        setMessage("Invalid login credentials. Please check your email and password.");
      } else {
        setMessage(error.message);
      }
    }
  }, [error]);

  if (!message || loading) return null;

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
};
