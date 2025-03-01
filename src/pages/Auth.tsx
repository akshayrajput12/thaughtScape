import { Auth as SupabaseAuth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { FiMail, FiLock, FiGithub, FiTwitter } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { RiQuillPenLine } from "react-icons/ri";
import { useAuth } from "@/components/auth/AuthProvider";

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loading } = useAuth();
  
  const from = location.state?.from?.pathname || "/";

  useEffect(() => {
    if (isAuthenticated && !loading) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, loading, navigate, from]);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ duration: 0.5 }}
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#E5DEFF] via-white to-[#FDE1D3] p-4"
    >
      <div className="w-full max-w-md">
        <motion.div 
          initial={{ y: 20, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          transition={{ delay: 0.2, duration: 0.5 }}
          className="bg-white/90 backdrop-blur-lg rounded-3xl shadow-2xl p-8 space-y-6 border border-purple-100 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-purple-500 to-pink-500"></div>
          <motion.div 
            initial={{ y: 10, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-center space-y-4 mb-8"
          >
            <div className="flex justify-center mb-4">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.5 }}
                className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full"
              >
                <RiQuillPenLine className="w-8 h-8 text-white" />
              </motion.div>
            </div>
            <h1 className="text-4xl font-serif font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Welcome Back
            </h1>
            <p className="text-gray-600 text-lg">
              Connect with creative minds and share your thoughts
            </p>
          </motion.div>

          <motion.div 
            initial={{ y: 20, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            transition={{ delay: 0.4, duration: 0.5 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl blur-xl opacity-40"></div>
            <div className="relative space-y-4">
              <SupabaseAuth 
                supabaseClient={supabase} 
                appearance={{ 
                  theme: ThemeSupa,
                  variables: {
                    default: {
                      colors: {
                        brand: '#8B5CF6',
                        brandAccent: '#7C3AED',
                        brandButtonText: 'white',
                        defaultButtonBackground: 'white',
                        defaultButtonBackgroundHover: '#F9FAFB',
                        inputBackground: 'white',
                        inputBorder: '#E5E7EB',
                        inputBorderHover: '#D1D5DB',
                        inputBorderFocus: '#8B5CF6',
                      },
                      space: {
                        labelBottomMargin: '8px',
                        anchorBottomMargin: '4px',
                        buttonPadding: '10px 15px',
                        inputPadding: '10px 15px',
                      },
                      borderWidths: {
                        buttonBorderWidth: '1px',
                        inputBorderWidth: '1px',
                      },
                      radii: {
                        borderRadiusButton: '8px',
                        buttonBorderRadius: '8px',
                        inputBorderRadius: '8px',
                      },
                    },
                  },
                  className: {
                    container: 'space-y-4',
                    button: 'group w-full px-4 py-3 text-sm font-medium transition-all duration-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]',
                    input: 'w-full pl-10 pr-4 py-3 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200',
                    label: 'block text-sm font-medium text-gray-700 mb-1 flex items-center space-x-2',
                    anchor: 'text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors duration-200',
                  },
                }}
                providers={[]}
              />
              <div className="mt-6 flex justify-center space-x-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
                >
                  <FcGoogle className="w-5 h-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
                >
                  <FiGithub className="w-5 h-5 text-gray-600" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
                >
                  <FiTwitter className="w-5 h-5 text-gray-600" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>

        <motion.div 
          initial={{ y: 20, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mt-8 text-center text-sm text-gray-500"
        >
          By signing in, you agree to our{' '}
          <motion.a 
            whileHover={{ color: '#7C3AED' }}
            href="#" 
            className="text-purple-600 hover:text-purple-700 font-medium transition-colors duration-200"
          >
            Terms of Service
          </motion.a>{' '}
          and{' '}
          <motion.a 
            whileHover={{ color: '#7C3AED' }}
            href="#" 
            className="text-purple-600 hover:text-purple-700 font-medium transition-colors duration-200"
          >
            Privacy Policy
          </motion.a>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Auth;
