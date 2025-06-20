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
import HubSpotCallback from "@/pages/HubSpotCallback";
import NotFound from "./pages/NotFound";
import { useEffect } from "react";
import { analytics } from "@/lib/analytics";
import { CURRENT_USER } from "@/lib/supabase";

const queryClient = new QueryClient();

const App = () => {
  // Initialize user identification and properties
  useEffect(() => {
    // Identify the current user for analytics
    analytics.identify(CURRENT_USER.id, {
      email: CURRENT_USER.email,
      name: CURRENT_USER.name,
      role: CURRENT_USER.role_key,
      organization_id: CURRENT_USER.organization_id,
    })

    // Set user properties
    analytics.setUserProperties({
      user_type: 'sales_manager',
      subscription_tier: 'demo',
      signup_date: new Date().toISOString(),
    })

    // Track app initialization
    analytics.track('app_initialized', {
      user_id: CURRENT_USER.id,
      user_role: CURRENT_USER.role_key,
      timestamp: new Date().toISOString(),
    })
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Navigate to="/calls" replace />} />
              <Route path="research" element={<Research />} />
              <Route path="calls" element={<SalesCalls />} />
              <Route path="call-insights" element={<CallInsights />} />
              <Route path="follow-ups">
                <Route index element={<Navigate to="/call-insights" replace />} />
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
            <Route path="/hubspot-callback" element={<HubSpotCallback />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;