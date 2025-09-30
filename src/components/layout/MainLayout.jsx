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
  const { currentPlan, planDetails } = useSelector((state) => state.org);

  // Helper function to check if user is on a free plan
  const isFreePlan = (plan) => {
    if (!plan) return true;
    const planName = plan.plan_name?.toLowerCase() || "";
    return (
      planName.includes("free") ||
      planName.includes("trial") ||
      planName.includes("beta") ||
      plan.price === 0
    );
  };

  // Helper function to get remaining days color
  const getRemainingDaysColor = (daysRemaining) => {
    if (daysRemaining <= 3) return "bg-red-100 text-red-800 border-red-200";
    if (daysRemaining <= 7) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-blue-100 text-blue-800 border-blue-200";
  };

  // Determine if we should show remaining days
  const shouldShowRemainingDays = 
    currentPlan && 
    isFreePlan(currentPlan) && 
    planDetails && 
    !planDetails.isExpired && 
    planDetails.daysRemaining !== undefined;

  console.log(user, "check user");
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Unified Application Header */}
      <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
        <div className="flex items-center space-x-6">
          {/* Application Logo/Brand */}
          <div>
            <h1 className="text-xl font-bold text-foreground">
              SalesGenius Ai
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
            <div className="flex items-center space-x-2">
              <Badge
                variant="outline"
                className="text-xs bg-green-100 text-green-800 border-green-200"
              >
                <Zap className="w-3 h-3 mr-1" />
                {userRole?.label || "Super Admin"}
              </Badge>
              
              {/* Remaining Days Badge for Free Plan Users */}
              {shouldShowRemainingDays && (
                <Badge
                  variant="outline"
                  className={`text-xs ${getRemainingDaysColor(planDetails.daysRemaining)}`}
                >
                  {planDetails.daysRemaining} days remaining
                </Badge>
              )}

              {/* Coupon Code Badge for Free Plan Users after 15 days */}
              {currentPlan && 
               isFreePlan(currentPlan) && 
               planDetails && 
               !planDetails.isExpired && 
               planDetails.daysRemaining <= 15 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    localStorage.setItem('apply_coupon_50', 'true');
                    toast.success('50% OFF coupon applied! Choose your plan.');
                    // Navigate to settings or trigger upgrade modal
                    window.location.href = '/settings';
                  }}
                  className="text-xs bg-gradient-to-r from-orange-500 to-red-500 text-white border-orange-400 hover:from-orange-600 hover:to-red-600 animate-pulse"
                >
                  🎟️ Use Coupon 50% OFF
                </Button>
              )}
            </div>
          </div>
          {console.log(
            hubspotIntegration.connected,
            hubspotIntegration?.hubspotUserId,
            hubspotIntegration,
            "HubSpot connection status"
          )}
          {/* HubSpot Connection Status */}
          {hubspotIntegration.connected &&
            hubspotIntegration?.hubspotUserId && (
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
                    console.log(
                      "🎯 User manually triggered tour replay from header"
                    );
                    window.replaySalesFlowTour();
                  } else {
                    console.error(
                      "❌ replaySalesFlowTour function not available"
                    );
                    toast.error(
                      "Tour is not ready yet. Please try again in a moment."
                    );
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
    </div>
  );
};
