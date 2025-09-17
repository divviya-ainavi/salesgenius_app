import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route, Navigate } from "react-router-dom";
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
import SignupPage from "@/pages/Auth/SignupPage";
import CompleteSignup from "@/pages/Auth/CompleteSignup";
import AccountSetup from "@/pages/Auth/AccountSetup";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import HubSpotCallback from "@/pages/HubSpotCallback";
import NotFound from "./pages/NotFound";
import { useEffect } from "react";
import { analytics } from "@/lib/analytics";
import { useDispatch } from "react-redux";
import { dbHelpers, CURRENT_USER, authHelpers } from "@/lib/supabase";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import {
  setCommunicationTypes,
  setGetAllStatus,
  setInsightTypes,
  setRoles,
} from "./store/slices/orgSlice";
import { resetAuthState } from "./store/slices/authSlice";
import { resetOrgState } from "./store/slices/orgSlice";
import { toast } from "sonner";

const queryClient = new QueryClient();

const App = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
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

  // Monitor Supabase auth state for token expiry
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' && !sessionStorage.getItem('manual_logout')) {
        // Token expired - auto logout
        console.log('🔒 Supabase token expired - auto logout triggered');
        
        // Clear all storage
        localStorage.clear();
        sessionStorage.clear();
        
        // Reset Redux state
        dispatch(resetAuthState());
        dispatch(resetOrgState());
        
        // Show message and redirect
        toast.error('Your session has expired. Please log in again.');
        navigate('/auth/login');
      }
      
      // Clear manual logout flag after processing
      if (event === 'SIGNED_OUT') {
        sessionStorage.removeItem('manual_logout');
      }
    });

    return () => subscription.unsubscribe();
  }, [dispatch, navigate]);
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
          <Routes>
            {/* Public Routes */}
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/signup" element={<SignupPage />} />
            <Route path="/auth/complete-signup" element={<CompleteSignup />} />
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
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
