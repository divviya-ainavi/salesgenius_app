import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { UserDropdown } from "./UserDropdown";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Zap, HelpCircle } from "lucide-react";
import { CURRENT_USER } from "@/lib/supabase";
import { useSelector } from "react-redux";
import { FeedbackWidget } from "@/components/feedback/FeedbackWidget";
import SalesCallsTour from "@/components/onboarding/SalesCallsTour";
import { toast } from "sonner";

export const MainLayout = () => {
  const location = useLocation();
  const {
    userProfileInfo,
    userRole,
    userRoleId,
    titleName,
    organizationDetails,
    user,
    hubspotIntegration,
    hasSeenOnboardingTour,
  } = useSelector((state) => state.auth);
  console.log(user, "check user");
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Unified Application Header */}
      <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
        <div className="flex items-center space-x-6">
          {/* Application Logo/Brand */}
          <div>
            <h1 className="text-xl font-bold text-foreground">
              SalesGenius.ai
            </h1>
            <p className="text-sm text-muted-foreground">
              AI-Powered Sales Assistant
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* User Context Indicator */}
          <div className="hidden md:flex items-center space-x-2 text-sm text-muted-foreground">
            <span>Logged in as:</span>
            <span className="font-medium text-foreground">
              {user?.full_name || ""}
            </span>
            <Badge
              variant="outline"
              className="text-xs bg-green-100 text-green-800 border-green-200"
            >
              <Zap className="w-3 h-3 mr-1" />
              {userRole?.label || "Super Admin"}
            </Badge>
          </div>

          {/* HubSpot Connection Status */}
          {hubspotIntegration.connected && (
            <Badge
              variant="default"
              className="bg-green-100 text-green-800 border-green-200"
            >
              HubSpot Connected
            </Badge>
          )}

          {/* Action Icons */}
          <div className="flex items-center space-x-2">
            {/* Guidelines Icon - Only show after tour completion */}
            {user && hasSeenOnboardingTour && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  console.log("🎯 User clicked guidelines icon in header");
                  if (window.replaySalesFlowTour) {
                    console.log("🎯 User manually triggered tour replay from header");
                    window.replaySalesFlowTour();
                  } else {
                    console.error("❌ replaySalesFlowTour function not available");
                    toast.error("Tour is not ready yet. Please try again in a moment.");
                  }
                }}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                title="Replay Complete Sales Flow Tour"
                aria-label="Replay Complete Sales Flow Tour"
              >
                <HelpCircle className="w-4 h-4" />
              </Button>
            )}
            <Button variant="ghost" size="sm" aria-label="Notifications">
              <Bell className="w-4 h-4" />
            </Button>
            {/* User Dropdown Menu */}
            <UserDropdown />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* Feedback Widget - Available to all users */}
      <FeedbackWidget />

      {/* Sales Calls Tour - Primary onboarding experience */}
      <SalesCallsTour />

      {/* HubSpot Welcome Modal - Shows if integration not configured */}
      <HubSpotWelcomeModal />
    </div>
  );
};
