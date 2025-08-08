import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { ActionItems } from "@/pages/followups/ActionItems";
import { EmailTemplates } from "@/pages/followups/EmailTemplates";
import { DeckBuilder } from "@/pages/followups/DeckBuilder";
import { Research } from "@/pages/Research";
import { SalesCalls } from "@/pages/SalesCalls";
import { CallInsights } from "@/pages/CallInsights";
import { Analytics } from "@/pages/Analytics";
import { Settings } from "@/pages/Settings";
import UserManagementPage from "@/pages/admin/UserManagement";
import LoginPage from "@/pages/Auth/LoginPage";
import ForgotPassword from "@/pages/Auth/ForgotPassword";
import ResetPassword from "@/pages/Auth/ResetPassword";
import AccountSetup from "@/pages/Auth/AccountSetup";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import HubSpotCallback from "@/pages/HubSpotCallback";
import NotFound from "./pages/NotFound";
import { useEffect } from "react";
import { analytics } from "@/lib/analytics";
import { useDispatch } from "react-redux";
import { dbHelpers, CURRENT_USER, authHelpers, supabase } from "@/lib/supabase";
import {
  setCommunicationTypes,
  setGetAllStatus,
  setInsightTypes,
  setRoles,
} from "./store/slices/orgSlice";
import { resetAuthState } from "./store/slices/authSlice";
import { resetOrgState } from "./store/slices/orgSlice";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const queryClient = new QueryClient();

const App = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Auto-logout function
  const handleAutoLogout = async () => {
    try {
      console.log("🔄 Auto-logout triggered due to token expiry");
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // Clear all storage
      localStorage.clear();
      sessionStorage.clear();
      
      // Reset Redux state
      dispatch(resetAuthState());
      dispatch(resetOrgState());
      
      // Show notification
      toast.error("Your session has expired. Please log in again.");
      
      // Redirect to login
      navigate("/auth/login");
    } catch (error) {
      console.error("Error during auto-logout:", error);
      // Force redirect even if cleanup fails
      window.location.href = "/auth/login";
    }
  };

  // Expose auto-logout function globally for error handlers
  useEffect(() => {
    window.handleAutoLogout = handleAutoLogout;
    
    return () => {
      delete window.handleAutoLogout;
    };
  }, []);

  // Monitor auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("🔐 Auth state change:", event, session ? "Session exists" : "No session");
        
        if (event === 'TOKEN_REFRESHED') {
          console.log("✅ Token refreshed successfully");
        } else if (event === 'SIGNED_OUT') {
          console.log("👋 User signed out");
          // Only auto-logout if this wasn't a manual logout
          const isManualLogout = sessionStorage.getItem('manual_logout');
          if (!isManualLogout) {
            handleAutoLogout();
          } else {
            sessionStorage.removeItem('manual_logout');
          }
        } else if (event === 'USER_UPDATED' && !session) {
          console.log("🔄 User updated but no session - possible token expiry");
          handleAutoLogout();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate, dispatch]);

  // Check token expiry periodically
  useEffect(() => {
    const checkTokenExpiry = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session check error:", error);
          if (error.message?.includes('JWT') || error.message?.includes('expired')) {
            handleAutoLogout();
          }
          return;
        }
        
        if (session) {
          const expiresAt = session.expires_at;
          const now = Math.floor(Date.now() / 1000);
          const timeUntilExpiry = expiresAt - now;
          
          // If token expires in less than 5 minutes, try to refresh
          if (timeUntilExpiry < 300) {
            console.log("🔄 Token expiring soon, attempting refresh...");
            const { error: refreshError } = await supabase.auth.refreshSession();
            
            if (refreshError) {
              console.error("Token refresh failed:", refreshError);
              handleAutoLogout();
            }
          }
        }
      } catch (error) {
        console.error("Error checking token expiry:", error);
      }
    };

    // Check immediately and then every 5 minutes
    checkTokenExpiry();
    const interval = setInterval(checkTokenExpiry, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  // Initialize analytics
  useEffect(() => {
    // Track app initialization
    analytics.track("app_initialized", {
      timestamp: new Date().toISOString(),
    });
    const fetchRoles = async () => {
      const roles = await dbHelpers.getRoles();
      const statuses = await dbHelpers.getStatus();
      const getInsightTypes = await dbHelpers.getSalesInsightTypes();
      const communicationTypes = await dbHelpers.getCommunicationStyleTypes();
      dispatch(setRoles(roles)); // assuming you have a Redux slice
      dispatch(setGetAllStatus(statuses));
      dispatch(setInsightTypes(getInsightTypes));
      dispatch(setCommunicationTypes(communicationTypes));
    };

    fetchRoles();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Routes */}
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/forgot-password" element={<ForgotPassword />} />
            <Route path="/auth/reset-password" element={<ResetPassword />} />
            <Route path="/auth/setup" element={<AccountSetup />} />
            <Route path="/hubspot-callback" element={<HubSpotCallback />} />

            {/* Protected Routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/calls" replace />} />
              <Route path="research" element={<Research />} />
              <Route path="calls" element={<SalesCalls />} />
              <Route path="call-insights" element={<CallInsights />} />
              <Route path="follow-ups">
                <Route
                  index
                  element={<Navigate to="/call-insights" replace />}
                />
                <Route path="actions" element={<ActionItems />} />
                <Route path="emails" element={<EmailTemplates />} />
                <Route path="decks" element={<DeckBuilder />} />
                <Route path="wrap-up" element={<CallInsights />} />
              </Route>
              <Route path="analytics" element={<Analytics />} />
              <Route path="settings" element={<Settings />} />
              <Route path="admin">
                <Route path="users" element={<UserManagementPage />} />
              </Route>
            </Route>

            {/* Catch all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
