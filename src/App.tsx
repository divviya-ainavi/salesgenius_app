import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { CallWrapUp } from "@/pages/followups/CallWrapUp";
import { ActionItems } from "@/pages/followups/ActionItems";
import { EmailTemplates } from "@/pages/followups/EmailTemplates";
import { DeckBuilder } from "@/pages/followups/DeckBuilder";
import { Research } from "@/pages/Research";
import { SalesCalls } from "@/pages/SalesCalls";
import { CallInsights } from "@/pages/CallInsights";
import { Analytics } from "@/pages/Analytics";
import { Settings } from "@/pages/Settings";
import { ProcessingHistory } from "@/pages/ProcessingHistory";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
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
              <Route index element={<Navigate to="/follow-ups/wrap-up" replace />} />
              <Route path="wrap-up" element={<CallWrapUp />} />
              <Route path="actions" element={<ActionItems />} />
              <Route path="emails" element={<EmailTemplates />} />
              <Route path="decks" element={<DeckBuilder />} />
              <Route path="processing-history" element={<ProcessingHistory />} />
            </Route>
            <Route path="analytics" element={<Analytics />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;