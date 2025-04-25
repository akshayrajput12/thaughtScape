
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

const Messages = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Show toast to inform user that messaging is no longer available
    toast({
      title: "Feature Removed",
      description: "The messaging functionality has been removed from this application.",
      variant: "destructive",
    });

    // Check if user is authenticated, if not redirect to login
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
      }
    };
    
    checkAuth();
  }, [toast, navigate]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-b from-white to-primary/10 pt-20 pb-10">
        <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="flex flex-col items-center justify-center min-h-[80vh] p-8 text-center">
            <AlertCircle className="h-16 w-16 text-yellow-500 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Feature Removed</h2>
            <p className="text-gray-600 mb-6">
              The messaging functionality has been removed from this application.
            </p>
            <button 
              onClick={() => navigate('/')} 
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
            >
              Return Home
            </button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Messages;
