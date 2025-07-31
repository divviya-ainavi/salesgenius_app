import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
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
  Lock,
  Eye,
  EyeOff,
  Save,
  AlertCircle,
  CheckCircle,
  Loader2,
  ExternalLink,
  Settings as SettingsIcon,
  Bell,
  Globe,
  Palette,
  Database,
  Key,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useSelector } from "react-redux";
import { supabase, CURRENT_USER } from "@/lib/supabase";
import BusinessKnowledgeSection from "@/components/settings/BusinessKnowledgeSection";
import { usePageTimer } from "@/hooks/userPageTimer";
import crmService from "@/services/crmService";
import { config } from "@/lib/config";

const Settings = () => {
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
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Password states
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  // HubSpot states
  const [hubspotStatus, setHubspotStatus] = useState({
    connected: false,
    loading: true,
    accountInfo: null,
  });
  const [isConnectingHubspot, setIsConnectingHubspot] = useState(false);

  // Auth status
  const [authStatus, setAuthStatus] = useState({
    hasSupabaseAuth: false,
    hasCustomAuth: false,
    supabaseUser: null,
  });

  // Load initial data
  useEffect(() => {
    loadProfileData();
    checkHubSpotConnection();
    checkAuthStatus();
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

  const checkAuthStatus = async () => {
    try {
      // Check Supabase Auth
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
      
      setAuthStatus({
        hasSupabaseAuth: !!supabaseUser,
        hasCustomAuth: !!CURRENT_USER.id,
        supabaseUser,
      });
    } catch (error) {
      console.error("Error checking auth status:", error);
    }
  };

  const loadProfileData = () => {
    setProfileData({
      fullName: user?.full_name || CURRENT_USER.full_name || "",
      email: user?.email || CURRENT_USER.email || "",
      timezone: user?.timezone || "UTC",
      language: user?.language || "en",
    });
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
              lastSync: status.last_sync,
            }
          : null,
      });
    } catch (error) {
      console.error("Error checking HubSpot connection:", error);
      setHubspotStatus({
        connected: false,
        loading: false,
        accountInfo: null,
      });
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsUpdatingProfile(true);

    try {
      // Update profile in Supabase
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profileData.fullName,
          timezone: profileData.timezone,
          language: profileData.language,
        })
        .eq("id", user?.id || CURRENT_USER.id);

      if (error) throw error;

      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile: " + error.message);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
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
      if (authStatus.hasSupabaseAuth) {
        // Update password using Supabase Auth
        console.log("🔄 Updating password via Supabase Auth...");
        
        const { error } = await supabase.auth.updateUser({
          password: passwordData.newPassword,
        });

        if (error) {
          console.error("❌ Supabase password update failed:", error);
          throw error;
        }

        console.log("✅ Supabase password updated successfully");
        toast.success("Password updated successfully!");
      } else {
        // Update password using custom auth (hash and store in profiles table)
        console.log("🔄 Updating password via custom auth...");
        
        // Import crypto for hashing
        const CryptoJS = (await import('crypto-js')).default;
        const hashedPassword = CryptoJS.SHA256(passwordData.newPassword + config.passwordSalt).toString();

        const { error } = await supabase
          .from("profiles")
          .update({
            hashed_password: hashedPassword,
          })
          .eq("id", user?.id || CURRENT_USER.id);

        if (error) {
          console.error("❌ Custom password update failed:", error);
          throw error;
        }

        console.log("✅ Custom password updated successfully");
        toast.success("Password updated successfully!");
      }

      // Clear form
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("❌ Password update error:", error);
      
      // Handle specific Supabase errors
      if (error.message?.includes("weak_password")) {
        toast.error("Password is too weak. Please choose a stronger password.");
      } else if (error.message?.includes("same_password")) {
        toast.error("New password must be different from your current password.");
      } else if (error.message?.includes("session_not_found")) {
        toast.error("Session expired. Please log out and log back in to change your password.");
      } else {
        toast.error("Failed to update password: " + error.message);
      }
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleHubSpotConnect = () => {
    setIsConnectingHubspot(true);
    const authUrl = `${config.hubspot.authUrl}?client_id=${config.hubspot.clientId}&redirect_uri=${encodeURIComponent(
      config.hubspot.redirectUri
    )}&scope=${encodeURIComponent(config.hubspot.scopes)}`;

    window.location.href = authUrl;
  };

  const handleHubSpotDisconnect = async () => {
    try {
      await crmService.hubspot.disconnect();
      toast.success("HubSpot disconnected successfully");
      await checkHubSpotConnection();
    } catch (error) {
      console.error("Error disconnecting HubSpot:", error);
      toast.error("Failed to disconnect HubSpot: " + error.message);
    }
  };

  const handleInputChange = (section, field, value) => {
    if (section === "profile") {
      setProfileData((prev) => ({
        ...prev,
        [field]: value,
      }));
    } else if (section === "password") {
      setPasswordData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  // Calculate password strength
  const passwordStrength = Object.values(passwordValidation).filter(Boolean).length;
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">
            <User className="w-4 h-4 mr-1" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="w-4 h-4 mr-1" />
            Security
          </TabsTrigger>
          <TabsTrigger value="integrations">
            <ExternalLink className="w-4 h-4 mr-1" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="business">
            <Database className="w-4 h-4 mr-1" />
            Business Knowledge
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={profileData.fullName}
                      onChange={(e) =>
                        handleInputChange("profile", "fullName", e.target.value)
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
                      Email cannot be changed. Contact support if needed.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Input
                      id="timezone"
                      value={profileData.timezone}
                      onChange={(e) =>
                        handleInputChange("profile", "timezone", e.target.value)
                      }
                      disabled={isUpdatingProfile}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Input
                      id="language"
                      value={profileData.language}
                      onChange={(e) =>
                        handleInputChange("profile", "language", e.target.value)
                      }
                      disabled={isUpdatingProfile}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={isUpdatingProfile}>
                    {isUpdatingProfile ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Organization Info */}
          <Card>
            <CardHeader>
              <CardTitle>Organization Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Organization</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {organizationDetails?.name || "No organization"}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Role</Label>
                  <div className="mt-1">
                    <Badge variant="outline">{titleName || "User"}</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          {/* Authentication Status */}
          <Card>
            <CardHeader>
              <CardTitle>Authentication Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Supabase Auth</span>
                  </div>
                  <Badge
                    variant={authStatus.hasSupabaseAuth ? "default" : "secondary"}
                    className={
                      authStatus.hasSupabaseAuth
                        ? "bg-green-100 text-green-800 border-green-200"
                        : ""
                    }
                  >
                    {authStatus.hasSupabaseAuth ? "Active" : "Not Active"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Key className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Custom Auth</span>
                  </div>
                  <Badge
                    variant={authStatus.hasCustomAuth ? "default" : "secondary"}
                    className={
                      authStatus.hasCustomAuth
                        ? "bg-blue-100 text-blue-800 border-blue-200"
                        : ""
                    }
                  >
                    {authStatus.hasCustomAuth ? "Active" : "Not Active"}
                  </Badge>
                </div>
              </div>
              {authStatus.hasSupabaseAuth && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Your account is using Supabase authentication. Password changes will be handled securely.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Password Update */}
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                {/* Current Password - Only show for custom auth */}
                {!authStatus.hasSupabaseAuth && (
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="currentPassword"
                        type={showPasswords.current ? "text" : "password"}
                        placeholder="Enter your current password"
                        value={passwordData.currentPassword}
                        onChange={(e) =>
                          handleInputChange("password", "currentPassword", e.target.value)
                        }
                        className="pl-10 pr-10"
                        disabled={isUpdatingPassword}
                        required={!authStatus.hasSupabaseAuth}
                      />
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility("current")}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        disabled={isUpdatingPassword}
                      >
                        {showPasswords.current ? (
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
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="newPassword"
                      type={showPasswords.new ? "text" : "password"}
                      placeholder="Enter your new password"
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        handleInputChange("password", "newPassword", e.target.value)
                      }
                      className="pl-10 pr-10"
                      disabled={isUpdatingPassword}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility("new")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      disabled={isUpdatingPassword}
                    >
                      {showPasswords.new ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {passwordData.newPassword && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Password strength:</span>
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
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={cn(
                            "h-2 rounded-full transition-all duration-300",
                            getPasswordStrengthColor()
                          )}
                          style={{ width: `${passwordStrengthPercentage}%` }}
                        />
                      </div>

                      {/* Password Requirements */}
                      <div className="grid grid-cols-1 gap-2 text-sm">
                        {[
                          { key: "minLength", label: "At least 8 characters" },
                          { key: "hasUppercase", label: "One uppercase letter" },
                          { key: "hasLowercase", label: "One lowercase letter" },
                          { key: "hasNumber", label: "One number" },
                          { key: "hasSpecialChar", label: "One special character" },
                        ].map(({ key, label }) => (
                          <div key={key} className="flex items-center space-x-2">
                            {passwordValidation[key] ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                            )}
                            <span
                              className={
                                passwordValidation[key]
                                  ? "text-green-600"
                                  : "text-gray-500"
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
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      id="confirmPassword"
                      type={showPasswords.confirm ? "text" : "password"}
                      placeholder="Confirm your new password"
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        handleInputChange("password", "confirmPassword", e.target.value)
                      }
                      className="pl-10 pr-10"
                      disabled={isUpdatingPassword}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility("confirm")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      disabled={isUpdatingPassword}
                    >
                      {showPasswords.confirm ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {passwordData.confirmPassword &&
                    passwordData.newPassword !== passwordData.confirmPassword && (
                      <p className="text-sm text-red-600 flex items-center space-x-1">
                        <AlertCircle className="w-4 h-4" />
                        <span>Passwords do not match</span>
                      </p>
                    )}
                  {passwordData.confirmPassword &&
                    passwordData.newPassword === passwordData.confirmPassword &&
                    passwordData.newPassword && (
                      <p className="text-sm text-green-600 flex items-center space-x-1">
                        <CheckCircle className="w-4 h-4" />
                        <span>Passwords match</span>
                      </p>
                    )}
                </div>

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={
                      isUpdatingPassword ||
                      !passwordData.newPassword ||
                      passwordData.newPassword !== passwordData.confirmPassword ||
                      !Object.values(passwordValidation).every(Boolean)
                    }
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
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-6">
          {/* HubSpot Integration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ExternalLink className="w-5 h-5" />
                  <span>HubSpot Integration</span>
                </div>
                <Badge
                  variant={hubspotStatus.connected ? "default" : "secondary"}
                  className={
                    hubspotStatus.connected
                      ? "bg-green-100 text-green-800 border-green-200"
                      : ""
                  }
                >
                  {hubspotStatus.loading ? (
                    <>
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Checking...
                    </>
                  ) : hubspotStatus.connected ? (
                    <>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Connected
                    </>
                  ) : (
                    "Not Connected"
                  )}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Connect your HubSpot account to push emails, commitments, and
                notes directly to your CRM.
              </p>

              {hubspotStatus.connected && hubspotStatus.accountInfo && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-medium text-green-900 mb-2">
                    Connected Account
                  </h4>
                  <div className="text-sm text-green-700 space-y-1">
                    <p>
                      <strong>Account:</strong> {hubspotStatus.accountInfo.name}
                    </p>
                    {hubspotStatus.accountInfo.portalId && (
                      <p>
                        <strong>Portal ID:</strong>{" "}
                        {hubspotStatus.accountInfo.portalId}
                      </p>
                    )}
                    {hubspotStatus.accountInfo.lastSync && (
                      <p>
                        <strong>Last Sync:</strong>{" "}
                        {new Date(
                          hubspotStatus.accountInfo.lastSync
                        ).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                {hubspotStatus.connected ? (
                  <>
                    <Button
                      onClick={checkHubSpotConnection}
                      variant="outline"
                      size="sm"
                    >
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Refresh Status
                    </Button>
                    <Button
                      onClick={handleHubSpotDisconnect}
                      variant="destructive"
                      size="sm"
                    >
                      Disconnect
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={handleHubSpotConnect}
                    disabled={isConnectingHubspot}
                  >
                    {isConnectingHubspot ? (
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
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Business Knowledge Tab */}
        <TabsContent value="business" className="space-y-6">
          <BusinessKnowledgeSection />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;