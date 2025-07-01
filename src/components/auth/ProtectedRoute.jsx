import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { authHelpers, userHelpers } from "@/lib/supabase.jsx";
import { Loader2 } from "lucide-react";
import { CURRENT_USER } from "@/lib/supabase.jsx";

const ProtectedRoute = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuth = await authHelpers.isAuthenticated();
        console.log("ProtectedRoute - isAuthenticated:", isAuth);
        console.log("ProtectedRoute - CURRENT_USER:", CURRENT_USER);
        
        setIsAuthenticated(isAuth);
      } catch (error) {
        console.error('Error checking authentication:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  console.log("ProtectedRoute state:", { isAuthenticated, isLoading, userId: CURRENT_USER.id });

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