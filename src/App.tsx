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
import AccountSetup from "@/pages/Auth/AccountSetup";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import HubSpotCallback from "@/pages/HubSpotCallback";
import NotFound from "./pages/NotFound";
import { useEffect } from "react";
import { analytics } from "@/lib/analytics";
import { useDispatch } from "react-redux";
import { dbHelpers, CURRENT_USER, authHelpers } from "@/lib/supabase";
import {
  setGetAllStatus,
  setInsightTypes,
  setRoles,
} from "./store/slices/orgSlice";

const queryClient = new QueryClient();

const App = () => {
  const dispatch = useDispatch();
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
      dispatch(setRoles(roles)); // assuming you have a Redux slice
      dispatch(setGetAllStatus(statuses));
      dispatch(setInsightTypes(getInsightTypes));
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
