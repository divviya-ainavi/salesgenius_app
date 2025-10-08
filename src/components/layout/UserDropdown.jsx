import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSelector, useDispatch } from "react-redux";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  User,
  UserCircle,
  Settings,
  LogOut,
  Building,
  Crown,
  Users,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { CURRENT_USER, authHelpers } from "@/lib/supabase";
import { resetOrgState } from "@/store/slices/orgSlice";
import { resetAuthState } from "../../store/slices/authSlice";
import { supabase } from "../../lib/supabase";

// Constants
const THREE_HOURS_IN_MS = 3 * 60 * 60 * 1000; // 3 hours in milliseconds

const getRoleIcon = (roleKey) => {
  switch (roleKey) {
    case "super_admin":
      return Crown;
    case "org_admin":
      return Shield;
    case "sales_manager":
      return Users;
    default:
      return User;
  }
};

const getRoleColor = (roleKey) => {
  switch (roleKey) {
    case "super_admin":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "org_admin":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "sales_manager":
      return "bg-green-100 text-green-800 border-green-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
};

export const UserDropdown = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionCheckInterval, setSessionCheckInterval] = useState(null);

  // Get plan information from Redux
  const { currentPlan, planDetails } = useSelector((state) => state.org);

  const {
    userProfileInfo,
    userRole,
    userRoleId,
    titleName,
    organizationDetails,
    user,
    hubspotIntegration,
  } = useSelector((state) => state.auth);
  console.log(organizationDetails, "organization details");
  // Load user profile
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        // Use current user data
        const profile = {
          ...CURRENT_USER,
          role: {
            key: userRole?.key || "sales_manager",
            label: userRole?.label || "Sales Manager",
            description: "",
          },
          organization: {
            name: organizationDetails?.name,
            industry: "Technology",
          },
        };
        setUserProfile(profile);
      } catch (error) {
        console.error("Error loading user profile:", error);
        // Fallback to current user data
        setUserProfile(CURRENT_USER);
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, []);

  // Check for 3-hour session expiry
  useEffect(() => {
    const checkSessionExpiry = () => {
      const loginTimestamp = localStorage.getItem("login_timestamp");

      if (!loginTimestamp) {
        console.log("⚠️ No login timestamp found");
        return;
      }

      const loginTime = parseInt(loginTimestamp);
      const currentTime = Date.now();
      const elapsedTime = currentTime - loginTime;

      console.log("🕐 Session check:", {
        loginTime: new Date(loginTime).toLocaleString(),
        currentTime: new Date(currentTime).toLocaleString(),
        elapsedHours: (elapsedTime / (1000 * 60 * 60)).toFixed(2),
        remainingMinutes: Math.max(
          0,
          Math.ceil((THREE_HOURS_IN_MS - elapsedTime) / (1000 * 60))
        ),
      });

      if (elapsedTime >= THREE_HOURS_IN_MS) {
        console.log(
          "⏰ 3-hour session limit reached - triggering automatic logout"
        );

        // Set flag to indicate this is an automatic logout
        sessionStorage.setItem("auto_logout_reason", "3_hour_limit");

        // Show toast message
        toast.error(
          "Your session has expired after 3 hours. Please log in again."
        );

        // Trigger logout
        handleConfirmLogout();
      }
    };

    // Check immediately on mount
    checkSessionExpiry();

    // Set up interval to check every minute
    const interval = setInterval(checkSessionExpiry, 60 * 1000); // Check every minute
    setSessionCheckInterval(interval);

    // Cleanup interval on unmount
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, []);

  // Cleanup interval when component unmounts
  useEffect(() => {
    return () => {
      if (sessionCheckInterval) {
        clearInterval(sessionCheckInterval);
      }
    };
  }, [sessionCheckInterval]);

  const handleProfileClick = () => {
    // Navigate to profile page (to be implemented)
    navigate("/settings");
  };

  const handleSettingsClick = () => {
    navigate("/settings");
  };

  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
  };

  const handleConfirmLogout = async () => {
    try {
      // Check if this is an automatic logout
      const autoLogoutReason = sessionStorage.getItem("auto_logout_reason");
      const isAutoLogout = !!autoLogoutReason;

      if (!isAutoLogout) {
        // Set flag to indicate this is a manual logout
        sessionStorage.setItem("manual_logout", "true");
      }

      // Sign out from Supabase Auth if user is authenticated there
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        await supabase.auth.signOut();
      }

      const result = await authHelpers.signOut();

      if (result.success) {
        // Clear storage
        localStorage.clear(); // ✅ Clears all localStorage
        sessionStorage.clear(); // ✅ Clears all sessionStorage

        // Optionally clear Redux state
        dispatch(resetOrgState());
        dispatch(resetAuthState());

        // Show appropriate message based on logout type
        if (isAutoLogout) {
          if (autoLogoutReason === "3_hour_limit") {
            toast.error("Session expired after 3 hours. Please log in again.");
          } else {
            toast.error("Session expired. Please log in again.");
          }
        } else {
          toast.success("Logged out successfully");
        }

        setShowLogoutDialog(false);

        // Reload the page to clear any in-memory data
        navigate("/auth/login"); // or use window.location.href
      } else {
        toast.error("Failed to logout: " + result.error);
      }
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("An error occurred during logout");
    } finally {
      // Clean up any auto logout flags
      sessionStorage.removeItem("auto_logout_reason");
    }
  };

  const handleCancelLogout = () => {
    setShowLogoutDialog(false);
  };

  if (loading) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-9 w-9 rounded-full"
        disabled
      >
        <User className="w-4 h-4" />
      </Button>
    );
  }

  const RoleIcon = getRoleIcon(userProfile?.role?.key || "user");

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 rounded-full hover:bg-accent focus:bg-accent focus:ring-2 focus:ring-ring focus:ring-offset-2"
            aria-label="User menu"
            data-tour="user-dropdown"
          >
            <User className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          className="w-72 mr-4"
          align="end"
          sideOffset={8}
          aria-label="User account menu"
        >
          {/* User Info Header */}
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-2">
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium leading-none">
                  {userProfile?.full_name || userProfile?.name || "User"}
                </p>
                <Badge
                  variant="outline"
                  className={`text-xs ${getRoleColor(
                    userProfile?.role?.key || "user"
                  )}`}
                >
                  <RoleIcon className="w-3 h-3 mr-1" />
                  {userProfile?.role?.label || "User"}
                </Badge>
              </div>
              <p className="text-xs leading-none text-muted-foreground">
                {userProfile?.email}
              </p>
              {userProfile?.organization && (
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  <Building className="w-3 h-3" />
                  <span>{userProfile.organization.name}</span>
                  {userProfile.organization.industry && (
                    <span className="text-muted-foreground/70">
                      • {userProfile.organization.industry}
                    </span>
                  )}
                </div>
              )}

              {/* Current Plan Display */}
              {/* {currentPlan && (
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  <Crown className="w-3 h-3" />
                  <span className="font-medium">{currentPlan.plan_name}</span>
                 
                  {planDetails && !planDetails.isExpired && (
                    <span className="text-muted-foreground/70">
                      • {planDetails.daysRemaining} days remaining
                    </span>
                  )}
                  {planDetails && planDetails.isExpired && (
                    <span className="text-red-600">• Expired</span>
                  )}
                </div>
              )} */}

              {userProfile?.status && (
                <Badge
                  variant={
                    userProfile.status === "active" ? "default" : "secondary"
                  }
                  className="text-xs w-fit"
                >
                  {userProfile.status}
                </Badge>
              )}
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          {/* Menu Items */}
          <DropdownMenuItem
            onClick={handleProfileClick}
            className="cursor-pointer focus:bg-accent hover:bg-accent"
            aria-label="View profile"
          >
            <UserCircle className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={handleSettingsClick}
            className="cursor-pointer focus:bg-accent hover:bg-accent"
            aria-label="Account settings"
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>Account Settings</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={handleLogoutClick}
            className="cursor-pointer focus:bg-accent hover:bg-accent text-destructive focus:text-destructive"
            aria-label="Sign out"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Logout</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Logout</DialogTitle>
            <DialogDescription>
              Are you sure you want to sign out of your account? You'll need to
              sign in again to access your data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
            <Button
              variant="outline"
              onClick={handleCancelLogout}
              className="mt-2 sm:mt-0"
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
