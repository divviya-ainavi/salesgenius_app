import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { useDispatch } from "react-redux";
import { resetOrgState } from "@/store/slices/orgSlice";
import { resetAuthState } from "../../store/slices/authSlice";

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

  // Load user profile
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        // Use current user data
        const profile = {
          ...CURRENT_USER,
          role: {
            key: CURRENT_USER.role_key || "sales_manager",
            label: "Sales Manager",
            description: "Sales team management and analytics access",
          },
          organization: {
            name: "Demo Sales Company",
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

  const handleProfileClick = () => {
    // Navigate to profile page (to be implemented)
    toast.info("Profile page coming soon");
    // navigate('/profile')
  };

  const handleSettingsClick = () => {
    navigate("/settings");
  };

  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
  };

  const handleConfirmLogout = async () => {
    try {
      const result = await authHelpers.signOut();

      if (result.success) {
        // Reset org state when user logs out
        dispatch(resetOrgState());
        dispatch(resetAuthState());
        toast.success("Logged out successfully");
        setShowLogoutDialog(false);
        localStorage.removeItem("userId");
        localStorage.removeItem("status");
        navigate("/auth/login");
      } else {
        toast.error("Failed to logout: " + result.error);
      }
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("An error occurred during logout");
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
