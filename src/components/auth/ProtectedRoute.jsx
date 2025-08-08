import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { authHelpers, supabase, handleSupabaseError } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import { CURRENT_USER } from "@/lib/supabase";

const ProtectedRoute = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check Supabase Auth first with error handling
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          await handleSupabaseError(error, 'protected_route_auth_check');
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }
        
        let isAuth = false;
        
        if (session) {
          // Validate session expiry
          const now = Math.floor(Date.now() / 1000);
          if (session.expires_at && session.expires_at < now) {
            console.log('🔐 Session expired in ProtectedRoute, triggering logout');
            const { handleAutoLogout } = await import('@/lib/supabase');
            await handleAutoLogout();
            setIsAuthenticated(false);
            setIsLoading(false);
            return;
          }
          
          // User is authenticated with Supabase Auth
          // Verify they have a valid profile
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('auth_user_id', session.user.id);
          
          if (profileError) {
            await handleSupabaseError(profileError, 'protected_route_profile_check');
            setIsAuthenticated(false);
            setIsLoading(false);
            return;
          }
          
          isAuth = !!(profile && profile.length > 0);
        } else {
          // Fall back to custom authentication
          isAuth = await authHelpers.isAuthenticated();
        }

        setIsAuthenticated(isAuth);
      } catch (error) {
        console.error("Error checking authentication:", error);
        // Handle potential auth errors
        if (error?.message?.includes('JWT') || error?.message?.includes('token')) {
          const { handleAutoLogout } = await import('@/lib/supabase');
          await handleAutoLogout();
        }
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
