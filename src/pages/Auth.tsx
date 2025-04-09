
import { useState } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SignUpErrorHandler } from '@/components/auth/SignUpErrorHandler';
import { VerificationReminder } from '@/components/auth/VerificationReminder';
import { motion } from 'framer-motion';
import { ArrowLeft, UserPlus, LogIn } from 'lucide-react';

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
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md space-y-8 rounded-xl bg-white/80 backdrop-blur-md p-8 shadow-xl border border-gray-200/50"
      >
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 font-serif">
            Welcome to Thoughtscape
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Join our community of thinkers and creators
          </p>
        </div>

        <SignUpErrorHandler error={authError} email={email} />
        <VerificationReminder email={email} isVisible={showVerificationMessage} />

        <Tabs defaultValue="sign_in" value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100/80 p-1 rounded-lg">
            <TabsTrigger 
              value="sign_in"
              className="data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm rounded-md py-2 flex items-center justify-center gap-2"
            >
              <LogIn className="h-4 w-4" />
              Sign In
            </TabsTrigger>
            <TabsTrigger 
              value="sign_up"
              className="data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm rounded-md py-2 flex items-center justify-center gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Sign Up
            </TabsTrigger>
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
                    radii: {
                      borderRadiusButton: '8px',
                      buttonBorderRadius: '8px',
                      inputBorderRadius: '8px',
                    },
                  },
                },
                className: {
                  container: 'auth-container',
                  button: 'auth-button hover:scale-[1.01] transition-transform duration-200',
                  input: 'auth-input focus:ring-2 focus:ring-indigo-200 transition-shadow duration-200',
                  label: 'auth-label text-gray-700 font-medium',
                  anchor: 'text-indigo-600 hover:text-indigo-800 transition-colors',
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
                    radii: {
                      borderRadiusButton: '8px',
                      buttonBorderRadius: '8px',
                      inputBorderRadius: '8px',
                    },
                  },
                },
                className: {
                  container: 'auth-container',
                  button: 'auth-button hover:scale-[1.01] transition-transform duration-200',
                  input: 'auth-input focus:ring-2 focus:ring-indigo-200 transition-shadow duration-200',
                  label: 'auth-label text-gray-700 font-medium',
                  anchor: 'text-indigo-600 hover:text-indigo-800 transition-colors',
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
            className="inline-flex items-center font-medium text-indigo-600 hover:text-indigo-500 gap-1 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Return to Home
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthPage;
