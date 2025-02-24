
import { Auth as SupabaseAuth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

const Auth = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/");
      }
    };
    
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN") {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 space-y-6 border border-purple-100">
          <div className="text-center space-y-2 mb-8">
            <h1 className="text-4xl font-serif font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Welcome Back
            </h1>
            <p className="text-gray-600">
              Connect with creative minds and share your thoughts
            </p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg blur-xl opacity-30"></div>
            <div className="relative">
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
                    button: 'w-full px-4 py-2 text-sm font-medium transition-colors rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500',
                    input: 'w-full px-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500',
                    label: 'block text-sm font-medium text-gray-700 mb-1',
                    anchor: 'text-sm text-purple-600 hover:text-purple-700 font-medium',
                  },
                }}
                providers={[]}
              />
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          By signing in, you agree to our{' '}
          <a href="#" className="text-purple-600 hover:text-purple-700 font-medium">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#" className="text-purple-600 hover:text-purple-700 font-medium">
            Privacy Policy
          </a>
        </div>
      </div>
    </div>
  );
};

export default Auth;
