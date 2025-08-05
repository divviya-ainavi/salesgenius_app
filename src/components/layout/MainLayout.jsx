import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { UserDropdown } from "./UserDropdown";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Zap } from "lucide-react";
import { CURRENT_USER } from "@/lib/supabase";
import { useSelector } from "react-redux";
import { FeedbackWidget } from "@/components/feedback/FeedbackWidget";
import OnboardingTour from "@/components/onboarding/OnboardingTour";

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

      {/* Onboarding Tour */}
      <OnboardingTour />
    </div>
  );
};
