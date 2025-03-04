
import { useState, useEffect } from 'react';
import { AuthError } from '@supabase/supabase-js';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { checkEmailExists, supabase } from '@/integrations/supabase/client';

type SignUpErrorHandlerProps = {
  error: AuthError | null;
  email?: string;
};

export const SignUpErrorHandler = ({ error, email }: SignUpErrorHandlerProps) => {
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Listen for auth form submissions
  useEffect(() => {
    const handleFormSubmission = () => {
      const form = document.querySelector('form');
      if (form) {
        const originalSubmit = form.onsubmit;
        form.onsubmit = async (e) => {
          const emailInput = form.querySelector('input[name="email"]') as HTMLInputElement;
          if (emailInput && emailInput.value) {
            setMessage(null);
            const exists = await checkEmailExists(emailInput.value);
            if (exists) {
              e.preventDefault();
              setMessage("This email is already registered. Please try signing in instead.");
              return false;
            }
          }
          if (originalSubmit) {
            // @ts-ignore - This is a workaround for the form submission
            return originalSubmit.call(form, e);
          }
          return true;
        };
      }
    };

    // Add listener for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_UP') {
        const userEmail = session?.user?.email;
        if (userEmail) {
          setMessage(`A verification email has been sent to ${userEmail}. Please check your inbox.`);
        }
      } else if (event === 'USER_UPDATED') {
        setMessage(null);
      }
    });

    handleFormSubmission();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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
