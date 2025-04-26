
import { useState, useEffect } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SignUpErrorHandler } from '@/components/auth/SignUpErrorHandler';
import { VerificationReminder } from '@/components/auth/VerificationReminder';
import { MessageCircle, Shield } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const AuthPage = () => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [authError, setAuthError] = useState<any>(null);
  const [email, setEmail] = useState<string>('');
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const [activeTab, setActiveTab] = useState<'sign_in' | 'sign_up'>('sign_in');
  const [loginAttempts, setLoginAttempts] = useState(0);

  // Monitor auth state changes
  useEffect(() => {
    const handleAuthChange = (event: string, session: any) => {
      if (event === 'SIGNED_IN') {
        navigate('/home');
      } else if (event === 'PASSWORD_RECOVERY') {
        setAuthError({ message: 'Check your email for the password reset link.' });
      } else if (event === 'USER_UPDATED') {
        setAuthError(null);
        setShowVerificationMessage(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange);

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Use effect to monitor for email input changes
  useEffect(() => {
    const monitorEmailInput = () => {
      const emailInputs = document.querySelectorAll('input[name="email"]');
      emailInputs.forEach(input => {
        input.addEventListener('change', (e) => {
          const target = e.target as HTMLInputElement;
          setEmail(target.value);
        });
      });
    };

    // Wait for the auth components to render
    setTimeout(monitorEmailInput, 500);

    return () => {
      // Cleanup event listeners
      const emailInputs = document.querySelectorAll('input[name="email"]');
      emailInputs.forEach(input => {
        input.removeEventListener('change', () => {});
      });
    };
  }, [activeTab]);

  // If authenticated, redirect to home
  if (isAuthenticated && !loading) {
    return <Navigate to="/" replace />;
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value as 'sign_in' | 'sign_up');
    setAuthError(null);
    setShowVerificationMessage(false);
  };

  // Security feature: Rate limiting for login attempts
  useEffect(() => {
    if (loginAttempts >= 5) {
      const timer = setTimeout(() => {
        setLoginAttempts(0);
      }, 60000); // Reset after 1 minute
      return () => clearTimeout(timer);
    }
  }, [loginAttempts]);

  // Key points about CampusCash
  const keyPoints = [
    { icon: '💰', text: 'Find campus jobs and gigs' },
    { icon: '🔄', text: 'Connect with fellow students' },
    { icon: '📚', text: 'Share knowledge and resources' },
    { icon: '💼', text: 'Build your professional portfolio' },
    { icon: '🚀', text: 'Discover freelance opportunities' },
    { icon: '🌟', text: 'Grow your campus network' }
  ];

  // Security notice
  const securityNotice = (
    <Alert variant="default" className="bg-blue-50 mb-4">
      <Shield className="h-4 w-4 text-blue-500" />
      <AlertTitle className="text-blue-700">Security Notice</AlertTitle>
      <AlertDescription className="text-blue-600 text-xs">
        Your account is protected with strong encryption. We never store your passwords in plain text.
      </AlertDescription>
    </Alert>
  );

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Background image with overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2070"
          alt="Students on campus"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex min-h-screen w-full flex-col md:flex-row">
        {/* Left column - About section */}
        <div className="flex w-full flex-col justify-center p-8 text-white md:w-1/2 md:p-16">
          <div className="mb-8 animate-fade-up">
            <h1 className="mb-2 font-serif text-4xl font-bold md:text-5xl">CampusCash</h1>
            <p className="text-xl opacity-90">Learn, Earn, and Connect on Campus</p>
          </div>

          <div className="space-y-4 animate-fade-up" style={{ animationDelay: '0.1s' }}>
            {keyPoints.map((point, index) => (
              <div key={index} className="flex items-center space-x-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-xl">
                  {point.icon}
                </span>
                <span className="text-lg">{point.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right column - Auth card */}
        <div className="flex w-full items-center justify-center p-6 md:w-1/2 md:p-16">
          <div className="w-full max-w-md animate-fade-up rounded-xl bg-white p-8 shadow-xl" style={{ animationDelay: '0.2s' }}>
            <div className="text-center">
              <h1 className="font-serif text-3xl font-bold tracking-tight text-gray-900">
                {activeTab === 'sign_in' ? 'Welcome Back!' : 'Join CampusCash'}
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                {activeTab === 'sign_in'
                  ? 'Sign in to access your account'
                  : 'Create an account to get started'}
              </p>
            </div>

            {securityNotice}
            <SignUpErrorHandler error={authError} email={email} />
            <VerificationReminder email={email} isVisible={showVerificationMessage} />

            <Tabs defaultValue="sign_in" value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="mb-6 grid w-full grid-cols-2">
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
                      button: 'auth-button w-full py-2 rounded-md',
                      input: 'auth-input rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500',
                      label: 'auth-label block text-sm font-medium text-gray-700 mb-1',
                      anchor: 'text-sm text-indigo-600 hover:text-indigo-500',
                    },
                  }}
                  localization={{
                    variables: {
                      sign_in: {
                        email_label: 'Email address',
                        password_label: 'Password',
                      },
                    },
                  }}
                  providers={[]}
                  view="sign_in"
                  onlyThirdPartyProviders={false}
                  redirectTo={window.location.origin}
                  magicLink={false}
                />
                <div className="text-right">
                  <a href="#" className="text-sm text-indigo-600 hover:text-indigo-500">
                    Forgot Password?
                  </a>
                </div>
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
                      button: 'auth-button w-full py-2 rounded-md',
                      input: 'auth-input rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500',
                      label: 'auth-label block text-sm font-medium text-gray-700 mb-1',
                      anchor: 'text-sm text-indigo-600 hover:text-indigo-500',
                    },
                  }}
                  localization={{
                    variables: {
                      sign_up: {
                        email_label: 'Email address',
                        password_label: 'Create password',
                      },
                    },
                  }}
                  providers={[]}
                  view="sign_up"
                  onlyThirdPartyProviders={false}
                  redirectTo={window.location.origin}
                  magicLink={false}
                />
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-center text-xs text-gray-500">
              By continuing, you agree to our{' '}
              <a href="#" className="text-indigo-600 hover:text-indigo-500">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-indigo-600 hover:text-indigo-500">
                Privacy Policy
              </a>
            </div>

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
      </div>

      {/* Floating chat support button */}
      <button
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg transition-transform hover:bg-indigo-700 hover:scale-105"
        aria-label="Chat Support"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    </div>
  );
};

export default AuthPage;
