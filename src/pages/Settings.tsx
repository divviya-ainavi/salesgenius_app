import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  User,
  Mail,
  Building,
  Shield,
  Bell,
  Palette,
  Globe,
  Lock,
  Eye,
  EyeOff,
  Save,
  AlertCircle,
  CheckCircle,
  Loader2,
  ExternalLink,
  Settings as SettingsIcon,
  Crown,
  Users,
  HelpCircle,
  Zap,
  Database,
  FileText,
  Upload,
  Download,
  Trash2,
  Plus,
  MoreVertical,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CURRENT_USER, authHelpers, supabase } from "@/lib/supabase";
import { useSelector } from "react-redux";
import { config } from "@/lib/config";
import crmService from "@/services/crmService";
import { usePageTimer } from "../hooks/userPageTimer";
import BusinessKnowledgeSection from "@/components/settings/BusinessKnowledgeSection";
import FeedbackDataViewer from "@/components/testing/FeedbackDataViewer";
import FeedbackPolicyTester from "@/components/testing/FeedbackPolicyTester";

export const Settings = () => {
  usePageTimer("Settings");

  const {
    userProfileInfo,
    userRole,
    userRoleId,
    titleName,
    organizationDetails,
    user,
    hubspotIntegration,
  } = useSelector((state) => state.auth);

  // Profile states
  const [profileData, setProfileData] = useState({
    fullName: "",
    email: "",
    timezone: "",
    language: "",
  });

  // Password change states
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Password validation state
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  // HubSpot connection states
  const [hubspotStatus, setHubspotStatus] = useState({
    connected: false,
    loading: true,
    accountInfo: null,
    lastSync: null,
  });

  // Notification preferences
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: false,
    weeklyReports: true,
    marketingEmails: false,
  });

  // Loading states
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isConnectingHubSpot, setIsConnectingHubSpot] = useState(false);

  // Load user data on component mount
  useEffect(() => {
    loadUserData();
    checkHubSpotConnection();
  }, []);

  // Validate password in real-time
  useEffect(() => {
    const password = passwordData.newPassword;
    setPasswordValidation({
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    });
  }, [passwordData.newPassword]);

  const loadUserData = async () => {
    try {
      const currentUser = CURRENT_USER;
      setProfileData({
        fullName: currentUser.full_name || "",
        email: currentUser.email || "",
        timezone: currentUser.timezone || "UTC",
        language: currentUser.language || "en",
      });
    } catch (error) {
      console.error("Error loading user data:", error);
      toast.error("Failed to load user data");
    }
  };

  const checkHubSpotConnection = async () => {
    try {
      const status = await crmService.getConnectionStatus("hubspot");
      setHubspotStatus({
        connected: status.connected,
        loading: false,
        accountInfo: status.account_name
          ? {
              name: status.account_name,
              portalId: status.portal_id,
            }
          : null,
        lastSync: status.last_sync,
      });
    } catch (error) {
      console.error("Error checking HubSpot connection:", error);
      setHubspotStatus({
        connected: false,
        loading: false,
        accountInfo: null,
        lastSync: null,
      });
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsUpdatingProfile(true);

    try {
      // Update profile in database
      await authHelpers.updateUserProfile(CURRENT_USER.id, {
        full_name: profileData.fullName,
        timezone: profileData.timezone,
        language: profileData.language,
      });

      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile: " + error.message);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    // Validate form
    if (!passwordData.newPassword) {
      toast.error("New password is required");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    const isPasswordValid = Object.values(passwordValidation).every(Boolean);
    if (!isPasswordValid) {
      toast.error("Password does not meet security requirements");
      return;
    }

    setIsUpdatingPassword(true);

    try {
      // Check if user has Supabase Auth session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // User is authenticated with Supabase - use Supabase method
        console.log("🔐 Using Supabase auth to update password");
        
        const { error } = await supabase.auth.updateUser({
          password: passwordData.newPassword
        });

        if (error) {
          throw new Error(error.message);
        }

        console.log("✅ Password updated successfully via Supabase");
      } else {
        // User is using custom auth - use existing custom method
        console.log("🔐 Using custom auth to update password");
        
        if (!passwordData.currentPassword) {
          toast.error("Current password is required");
          return;
        }

        // Verify current password first
        const isCurrentPasswordValid = await authHelpers.verifyPassword(
          CURRENT_USER.email,
          passwordData.currentPassword
        );

        if (!isCurrentPasswordValid) {
          toast.error("Current password is incorrect");
          return;
        }

        // Update password using custom method
        await authHelpers.updatePassword(
          CURRENT_USER.id,
          passwordData.newPassword
        );

        console.log("✅ Password updated successfully via custom auth");
      }

      // Clear form
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      toast.success("Password updated successfully");
    } catch (error) {
      console.error("Error updating password:", error);
      toast.error("Failed to update password: " + error.message);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleHubSpotConnect = async () => {
    setIsConnectingHubSpot(true);

    try {
      const authUrl = `${config.hubspot.authUrl}?client_id=${
        config.hubspot.clientId
      }&redirect_uri=${encodeURIComponent(
        config.hubspot.redirectUri
      )}&scope=${encodeURIComponent(config.hubspot.scopes)}`;

      window.location.href = authUrl;
    } catch (error) {
      console.error("Error connecting to HubSpot:", error);
      toast.error("Failed to connect to HubSpot");
      setIsConnectingHubSpot(false);
    }
  };

  const handleHubSpotDisconnect = async () => {
    try {
      await crmService.hubspot.disconnect();
      setHubspotStatus({
        connected: false,
        loading: false,
        accountInfo: null,
        lastSync: null,
      });
      toast.success("HubSpot disconnected successfully");
    } catch (error) {
      console.error("Error disconnecting HubSpot:", error);
      toast.error("Failed to disconnect HubSpot");
    }
  };

  const handleNotificationChange = (key, value) => {
    setNotifications((prev) => ({
      ...prev,
      [key]: value,
    }));
    toast.success("Notification preferences updated");
  };

  // Calculate password strength
  const passwordStrength =
    Object.values(passwordValidation).filter(Boolean).length;
  const passwordStrengthPercentage = (passwordStrength / 5) * 100;

  const getPasswordStrengthColor = () => {
    if (passwordStrength <= 2) return "bg-red-500";
    if (passwordStrength <= 3) return "bg-yellow-500";
    if (passwordStrength <= 4) return "bg-blue-500";
    return "bg-green-500";
  };

  const getPasswordStrengthLabel = () => {
    if (passwordStrength <= 2) return "Weak";
    if (passwordStrength <= 3) return "Fair";
    if (passwordStrength <= 4) return "Good";
    return "Strong";
  };

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

  // Check if user has Supabase Auth session
  const [hasSupabaseAuth, setHasSupabaseAuth] = useState(false);
  
  useEffect(() => {
    const checkSupabaseAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setHasSupabaseAuth(!!session);
    };
    checkSupabaseAuth();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings, integrations, and preferences.
        </p>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="business">Business Knowledge</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          {/* User Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>User Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current User Details */}
              <div className="flex items-center space-x-4 p-4 bg-muted rounded-lg">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  {React.createElement(getRoleIcon(userRole?.key), {
                    className: "w-6 h-6 text-primary",
                  })}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{profileData.fullName}</h3>
                  <p className="text-sm text-muted-foreground">
                    {profileData.email}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge
                      variant="outline"
                      className={cn("text-xs", getRoleColor(userRole?.key))}
                    >
                      {React.createElement(getRoleIcon(userRole?.key), {
                        className: "w-3 h-3 mr-1",
                      })}
                      {titleName || "User"}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <Building className="w-3 h-3 mr-1" />
                      {organizationDetails?.name || "No Organization"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Profile Update Form */}
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={profileData.fullName}
                      onChange={(e) =>
                        setProfileData((prev) => ({
                          ...prev,
                          fullName: e.target.value,
                        }))
                      }
                      disabled={isUpdatingProfile}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      Email cannot be changed. Contact your administrator.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select
                      value={profileData.timezone}
                      onValueChange={(value) =>
                        setProfileData((prev) => ({
                          ...prev,
                          timezone: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="America/New_York">
                          Eastern Time
                        </SelectItem>
                        <SelectItem value="America/Chicago">
                          Central Time
                        </SelectItem>
                        <SelectItem value="America/Denver">
                          Mountain Time
                        </SelectItem>
                        <SelectItem value="America/Los_Angeles">
                          Pacific Time
                        </SelectItem>
                        <SelectItem value="Europe/London">London</SelectItem>
                        <SelectItem value="Europe/Paris">Paris</SelectItem>
                        <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select
                      value={profileData.language}
                      onValueChange={(value) =>
                        setProfileData((prev) => ({
                          ...prev,
                          language: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                        <SelectItem value="it">Italian</SelectItem>
                        <SelectItem value="pt">Portuguese</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="w-full md:w-auto"
                >
                  {isUpdatingProfile ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Update Profile
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Password Change */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lock className="w-5 h-5" />
                <span>Change Password</span>
                {hasSupabaseAuth && (
                  <Badge variant="outline" className="text-xs bg-green-100 text-green-800 border-green-200">
                    <Shield className="w-3 h-3 mr-1" />
                    Supabase Auth
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                {/* Current Password - Only show for custom auth users */}
                {!hasSupabaseAuth && (
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? "text" : "password"}
                        placeholder="Enter your current password"
                        value={passwordData.currentPassword}
                        onChange={(e) =>
                          setPasswordData((prev) => ({
                            ...prev,
                            currentPassword: e.target.value,
                          }))
                        }
                        disabled={isUpdatingPassword}
                        required={!hasSupabaseAuth}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        disabled={isUpdatingPassword}
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* New Password */}
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Enter your new password"
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData((prev) => ({
                          ...prev,
                          newPassword: e.target.value,
                        }))
                      }
                      disabled={isUpdatingPassword}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      disabled={isUpdatingPassword}
                    >
                      {showNewPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {passwordData.newPassword && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Password strength:
                        </span>
                        <span
                          className={cn(
                            "text-sm font-medium",
                            passwordStrength <= 2
                              ? "text-red-600"
                              : passwordStrength <= 3
                              ? "text-yellow-600"
                              : passwordStrength <= 4
                              ? "text-blue-600"
                              : "text-green-600"
                          )}
                        >
                          {getPasswordStrengthLabel()}
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className={cn(
                            "h-2 rounded-full transition-all duration-300",
                            getPasswordStrengthColor()
                          )}
                          style={{ width: `${passwordStrengthPercentage}%` }}
                        />
                      </div>

                      {/* Password Requirements */}
                      <div className="grid grid-cols-1 gap-1 text-sm">
                        {[
                          { key: "minLength", label: "At least 8 characters" },
                          { key: "hasUppercase", label: "One uppercase letter" },
                          { key: "hasLowercase", label: "One lowercase letter" },
                          { key: "hasNumber", label: "One number" },
                          {
                            key: "hasSpecialChar",
                            label: "One special character",
                          },
                        ].map(({ key, label }) => (
                          <div key={key} className="flex items-center space-x-2">
                            {passwordValidation[key] ? (
                              <CheckCircle className="w-3 h-3 text-green-600" />
                            ) : (
                              <div className="w-3 h-3 rounded-full border border-muted-foreground" />
                            )}
                            <span
                              className={
                                passwordValidation[key]
                                  ? "text-green-600"
                                  : "text-muted-foreground"
                              }
                            >
                              {label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your new password"
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData((prev) => ({
                          ...prev,
                          confirmPassword: e.target.value,
                        }))
                      }
                      disabled={isUpdatingPassword}
                      required
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      disabled={isUpdatingPassword}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {passwordData.confirmPassword &&
                    passwordData.newPassword !== passwordData.confirmPassword && (
                      <p className="text-sm text-red-600 flex items-center space-x-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>Passwords do not match</span>
                      </p>
                    )}
                </div>

                <Button
                  type="submit"
                  disabled={
                    isUpdatingPassword ||
                    !passwordData.newPassword ||
                    passwordData.newPassword !== passwordData.confirmPassword ||
                    (!hasSupabaseAuth && !passwordData.currentPassword)
                  }
                  className="w-full md:w-auto"
                >
                  {isUpdatingPassword ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating Password...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" />
                      Update Password
                    </>
                  )}
                </Button>
              </form>

              {/* Authentication Method Info */}
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-2 text-sm">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Authentication:</span>
                  <Badge variant="outline" className="text-xs">
                    {hasSupabaseAuth ? "Supabase Auth" : "Custom Auth"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {hasSupabaseAuth
                    ? "Your password is managed by Supabase. Current password not required."
                    : "Your password is managed by our custom system. Current password required for verification."}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-6">
          {/* HubSpot Integration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ExternalLink className="w-5 h-5" />
                <span>HubSpot Integration</span>
                {hubspotStatus.connected && (
                  <Badge
                    variant="default"
                    className="bg-green-100 text-green-800 border-green-200"
                  >
                    Connected
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {hubspotStatus.loading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">
                    Checking connection...
                  </span>
                </div>
              ) : hubspotStatus.connected ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-green-900">
                        HubSpot Connected
                      </h4>
                      {hubspotStatus.accountInfo && (
                        <div className="text-sm text-green-700 mt-1">
                          <p>Account: {hubspotStatus.accountInfo.name}</p>
                          {hubspotStatus.accountInfo.portalId && (
                            <p>Portal ID: {hubspotStatus.accountInfo.portalId}</p>
                          )}
                        </div>
                      )}
                      {hubspotStatus.lastSync && (
                        <p className="text-xs text-green-600 mt-1">
                          Last sync: {hubspotStatus.lastSync}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleHubSpotDisconnect}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      Disconnect
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Connect HubSpot</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Connect your HubSpot account to automatically sync
                      contacts, deals, and push follow-up emails and action
                      items.
                    </p>
                    <Button
                      onClick={handleHubSpotConnect}
                      disabled={isConnectingHubSpot}
                    >
                      {isConnectingHubSpot ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Connect HubSpot
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="w-5 h-5" />
                <span>Notification Preferences</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {Object.entries({
                emailNotifications: "Email Notifications",
                pushNotifications: "Push Notifications",
                weeklyReports: "Weekly Reports",
                marketingEmails: "Marketing Emails",
              }).map(([key, label]) => (
                <div
                  key={key}
                  className="flex items-center justify-between py-2"
                >
                  <div>
                    <h4 className="font-medium">{label}</h4>
                    <p className="text-sm text-muted-foreground">
                      {key === "emailNotifications" &&
                        "Receive email notifications for important updates"}
                      {key === "pushNotifications" &&
                        "Receive push notifications in your browser"}
                      {key === "weeklyReports" &&
                        "Get weekly performance and activity reports"}
                      {key === "marketingEmails" &&
                        "Receive product updates and marketing communications"}
                    </p>
                  </div>
                  <Switch
                    checked={notifications[key]}
                    onCheckedChange={(checked) =>
                      handleNotificationChange(key, checked)
                    }
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Business Knowledge Tab */}
        <TabsContent value="business" className="space-y-6">
          <BusinessKnowledgeSection />
        </TabsContent>

        {/* Testing Tab - Only for super_admin */}
        <TabsContent value="testing" className="space-y-6">
          {userRole?.key === "super_admin" ? (
            <>
              <FeedbackDataViewer />
              <FeedbackPolicyTester />
            </>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Shield className="w-12 h-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">Access Restricted</h3>
                <p className="text-muted-foreground">
                  Testing features are only available to super administrators.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};