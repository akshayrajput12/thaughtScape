
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { safeLog, safeErrorLog } from '@/utils/sanitizeData';

interface UseAuthFormProps {
  redirectTo?: string;
}

export const useAuthForm = ({ redirectTo = window.location.origin }: UseAuthFormProps = {}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSignIn = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      return { success: true, data };
    } catch (error: any) {
      safeErrorLog('Error signing in', error);
      toast({
        title: 'Sign in failed',
        description: error.message || 'An error occurred during sign in',
        variant: 'destructive',
      });
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectTo,
          data: {
            full_name: fullName,
            phone: phoneNumber,
          },
        },
      });

      if (error) throw error;

      toast({
        title: 'Sign up successful',
        description: 'Please check your email for a confirmation link.',
      });

      return { success: true, data };
    } catch (error: any) {
      safeErrorLog('Error signing up', error);
      toast({
        title: 'Sign up failed',
        description: error.message || 'An error occurred during sign up',
        variant: 'destructive',
      });
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    try {
      setLoading(true);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${redirectTo}/reset-password`,
      });

      if (error) throw error;

      toast({
        title: 'Password reset email sent',
        description: 'Please check your email for a password reset link.',
      });

      return { success: true };
    } catch (error: any) {
      safeErrorLog('Error resetting password', error);
      toast({
        title: 'Password reset failed',
        description: error.message || 'An error occurred during password reset',
        variant: 'destructive',
      });
      return { success: false, error };
    } finally {
      setLoading(false);
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    fullName,
    setFullName,
    phoneNumber,
    setPhoneNumber,
    loading,
    handleSignIn,
    handleSignUp,
    handleResetPassword,
  };
};
