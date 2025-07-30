import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { authHelpers, supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import { CURRENT_USER } from "@/lib/supabase";

const ProtectedRoute = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check Supabase Auth first
        const { data: { session } } = await supabase.auth.getSession();
        
        let isAuth = false;
        
        if (session) {
          // User is authenticated with Supabase Auth
          // Verify they have a valid profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('auth_user_id', session.user.id);
          
          isAuth = !!(profile && profile.length > 0);
        } else {
          // Fall back to custom authentication
          isAuth = await authHelpers.isAuthenticated();
        }

        setIsAuthenticated(isAuth);
      } catch (error) {
        console.error("Error checking authentication:", error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
