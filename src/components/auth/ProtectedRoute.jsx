import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { authHelpers, userHelpers } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import { dbHelpers, CURRENT_USER } from "@/lib/supabase";

const ProtectedRoute = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkCustomAuth = async () => {
      const isAuth = await userHelpers.isAuthenticated(); // custom checker
      console.log("ProtectedRoute - isAuthenticated:", isAuth);
      const getStatus = localStorage.getItem("status");
      setIsAuthenticated(isAuth && getStatus === "loggedin");
      setIsLoading(false);
    };

    checkCustomAuth();
  }, []);
  console.log(isAuthenticated, isLoading, CURRENT_USER.id, "check user id");
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
