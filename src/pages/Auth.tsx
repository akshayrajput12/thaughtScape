
import { useState } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SignUpErrorHandler } from '@/components/auth/SignUpErrorHandler';
import { VerificationReminder } from '@/components/auth/VerificationReminder';

const AuthPage = () => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [authError, setAuthError] = useState<any>(null);
  const [email, setEmail] = useState<string>('');
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const [activeTab, setActiveTab] = useState<'sign_in' | 'sign_up'>('sign_in');

  // If authenticated, redirect to home
  if (isAuthenticated && !loading) {
    return <Navigate to="/" replace />;
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value as 'sign_in' | 'sign_up');
    setAuthError(null);
    setShowVerificationMessage(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-pink-50 p-4">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Welcome
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to access your account or create a new one
          </p>
        </div>

        <SignUpErrorHandler error={authError} email={email} />
        <VerificationReminder email={email} isVisible={showVerificationMessage} />

        <Tabs defaultValue="sign_in" value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="sign_in">Sign In</TabsTrigger>
            <TabsTrigger value="sign_up">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="sign_in" className="space-y-4">
            <Auth
              supabaseClient={supabase}
              appearance={{
                theme: ThemeSupa,
                variables: {
                  default: {
                    colors: {
                      brand: '#6366f1',
                      brandAccent: '#4f46e5',
                    },
                  },
                },
                className: {
                  container: 'auth-container',
                  button: 'auth-button',
                  input: 'auth-input',
                  label: 'auth-label',
                },
              }}
              providers={[]}
              view="sign_in"
              onlyThirdPartyProviders={false}
              redirectTo={window.location.origin}
            />
          </TabsContent>

          <TabsContent value="sign_up" className="space-y-4">
            <Auth
              supabaseClient={supabase}
              appearance={{
                theme: ThemeSupa,
                variables: {
                  default: {
                    colors: {
                      brand: '#6366f1',
                      brandAccent: '#4f46e5',
                    },
                  },
                },
                className: {
                  container: 'auth-container',
                  button: 'auth-button',
                  input: 'auth-input',
                  label: 'auth-label',
                },
              }}
              providers={[]}
              view="sign_up"
              onlyThirdPartyProviders={false}
              redirectTo={window.location.origin}
            />
          </TabsContent>
        </Tabs>

        <div className="mt-4 text-center text-sm text-gray-500">
          <button
            onClick={() => navigate('/')}
            className="font-medium text-indigo-600 hover:text-indigo-500"
          >
            Return to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
