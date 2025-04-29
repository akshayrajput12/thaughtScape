
import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SignUpErrorHandler } from '@/components/auth/SignUpErrorHandler';
import { VerificationReminder } from '@/components/auth/VerificationReminder';
import { CustomSignIn } from '@/components/auth/CustomSignIn';
import { CustomSignUp } from '@/components/auth/CustomSignUp';
import { ForgotPassword } from '@/components/auth/ForgotPassword';
import { MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const AuthPage = () => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [authError, setAuthError] = useState<any>(null);
  const [email, setEmail] = useState<string>('');
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const [activeTab, setActiveTab] = useState<'sign_in' | 'sign_up'>('sign_in');
  const [showForgotPassword, setShowForgotPassword] = useState(false);

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
    return <Navigate to="/home" replace />;
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value as 'sign_in' | 'sign_up');
    setAuthError(null);
    setShowVerificationMessage(false);
    setShowForgotPassword(false);
  };

  // Key points about CampusCash
  const keyPoints = [
    { icon: '💰', text: 'Find campus jobs and gigs' },
    { icon: '🔄', text: 'Connect with fellow students' },
    { icon: '📚', text: 'Share knowledge and resources' },
    { icon: '💼', text: 'Build your professional portfolio' },
    { icon: '🚀', text: 'Discover freelance opportunities' },
    { icon: '🌟', text: 'Grow your campus network' }
  ];

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
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-center mb-4">
              <img
                src="/logo.png"
                alt="CampusCash Logo"
                className="h-16 w-auto object-contain rounded-md shadow-md"
              />
            </div>
            <h1 className="mb-2 font-serif text-4xl font-bold md:text-5xl">CampusCash</h1>
            <p className="text-xl opacity-90">Learn, Earn, and Connect on Campus</p>
          </motion.div>

          <div className="space-y-4">
            {keyPoints.map((point, index) => (
              <motion.div
                key={index}
                className="flex items-center space-x-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ x: 5, transition: { duration: 0.2 } }}
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-xl">
                  {point.icon}
                </span>
                <span className="text-lg">{point.text}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right column - Auth card */}
        <div className="flex w-full items-center justify-center p-6 md:w-1/2 md:p-16">
          <motion.div
            className={cn(
              "w-full max-w-md rounded-xl p-8 shadow-xl",
              "bg-white dark:bg-gray-800"
            )}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <img
                  src="/logo.png"
                  alt="CampusCash Logo"
                  className="h-12 w-auto object-contain rounded-md"
                />
              </div>
              <h1 className="font-serif text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                {activeTab === 'sign_in' ? 'Welcome Back!' : 'Join CampusCash'}
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                {activeTab === 'sign_in'
                  ? 'Sign in to access your account'
                  : 'Create an account to get started'}
              </p>
            </div>

            <SignUpErrorHandler error={authError} email={email} />
            <VerificationReminder email={email} isVisible={showVerificationMessage} />

            <Tabs defaultValue="sign_in" value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="mb-6 grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-700">
                <TabsTrigger value="sign_in" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-100">Sign In</TabsTrigger>
                <TabsTrigger value="sign_up" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-gray-900 dark:data-[state=active]:text-gray-100">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="sign_in" className="space-y-4">
                {showForgotPassword ? (
                  <ForgotPassword onBack={() => setShowForgotPassword(false)} />
                ) : (
                  <>
                    {/* Use our custom sign-in component instead of Auth UI */}
                    <CustomSignIn
                      redirectTo={window.location.origin}
                      onSignIn={() => {
                        // Handle successful sign-in if needed
                      }}
                    />
                    <div className="text-right">
                      <button
                        onClick={() => setShowForgotPassword(true)}
                        className="text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        Forgot Password?
                      </button>
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="sign_up" className="space-y-4">
                {/* Use our custom sign-up component */}
                <CustomSignUp
                  redirectTo={window.location.origin}
                  onSignUp={() => {
                    // Handle successful sign-up if needed
                    setShowVerificationMessage(true);
                  }}
                />
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
              By continuing, you agree to our{' '}
              <a href="#" className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300">
                Privacy Policy
              </a>
            </div>

            <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
              <button
                onClick={() => navigate('/')}
                className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                Return to Home
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Floating chat support button */}
      <motion.button
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600"
        aria-label="Chat Support"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <MessageCircle className="h-6 w-6" />
      </motion.button>
    </div>
  );
};

export default AuthPage;
