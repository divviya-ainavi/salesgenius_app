import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  Bell,
  Shield,
  Palette,
  Globe,
  Clock,
  Save,
  Eye,
  EyeOff,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Loader2,
  Key,
  Settings as SettingsIcon,
  Calendar,
  Lock,
  Unlock,
  RefreshCw,
  Info,
  Zap,
  Building,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CURRENT_USER, authHelpers, dbHelpers } from "@/lib/supabase";
import { usePageTimer } from "../hooks/userPageTimer";

const Settings = () => {
  usePageTimer("Settings");

  const [activeTab, setActiveTab] = useState("profile");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  // Profile settings
  const [profileData, setProfileData] = useState({
    fullName: CURRENT_USER.full_name || "",
    email: CURRENT_USER.email || "",
    timezone: "UTC",
    language: "en",
    theme: "light",
  });

  // Notification settings
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: false,
    weeklyReports: true,
    securityAlerts: true,
  });

  // Setup settings
  const [firefliesKey, setFirefliesKey] = useState("");
  const [hubspotToken, setHubspotToken] = useState("");
  const [showFirefliesKey, setShowFirefliesKey] = useState(false);
  const [showHubspotToken, setShowHubspotToken] = useState(false);
  const [firefliesStatus, setFirefliesStatus] = useState(null);
  const [hubspotStatus, setHubspotStatus] = useState(null);
  const [isValidatingFireflies, setIsValidatingFireflies] = useState(false);
  const [isValidatingHubspot, setIsValidatingHubspot] = useState(false);

  // Check if user is org admin
  const isOrgAdmin = CURRENT_USER.role_key === 'org_admin' || CURRENT_USER.role_key === 'super_admin';

  useEffect(() => {
    loadSetupData();
  }, []);

  const loadSetupData = async () => {
    try {
      // Load existing Fireflies key status
      const firefliesData = await dbHelpers.getUserFirefliesKey(CURRENT_USER.id);
      if (firefliesData) {
        setFirefliesStatus({
          connected: true,
          lastVerified: firefliesData.last_verified,
          isValid: firefliesData.is_valid,
        });
      }

      // Load existing HubSpot token status (for org admins)
      if (isOrgAdmin) {
        const hubspotData = await dbHelpers.getOrgHubspotToken(CURRENT_USER.organization_id);
        if (hubspotData) {
          setHubspotStatus({
            connected: true,
            expiresAt: hubspotData.expires_at,
            lastVerified: hubspotData.last_verified,
            isValid: hubspotData.is_valid,
            daysUntilExpiration: calculateDaysUntilExpiration(hubspotData.expires_at),
          });
        }
      }
    } catch (error) {
      console.error('Error loading setup data:', error);
    }
  };

  const calculateDaysUntilExpiration = (expiresAt) => {
    if (!expiresAt) return null;
    const now = new Date();
    const expiration = new Date(expiresAt);
    const diffTime = expiration - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    try {
      await authHelpers.updateUserProfile(CURRENT_USER.id, {
        full_name: profileData.fullName,
        timezone: profileData.timezone,
        language: profileData.language,
        theme: profileData.theme,
      });
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error("Failed to update profile");
      console.error("Profile update error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveNotifications = async () => {
    setIsLoading(true);
    try {
      await dbHelpers.updateUserNotificationSettings(CURRENT_USER.id, notifications);
      toast.success("Notification settings updated");
    } catch (error) {
      toast.error("Failed to update notification settings");
      console.error("Notification update error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const validateAndSaveFirefliesKey = async () => {
    if (!firefliesKey.trim()) {
      toast.error("Please enter a Fireflies API key");
      return;
    }

    setIsValidatingFireflies(true);
    try {
      // Validate the key with Fireflies API
      const isValid = await validateFirefliesKey(firefliesKey);
      
      if (isValid) {
        // Encrypt and save the key
        await dbHelpers.saveUserFirefliesKey(CURRENT_USER.id, firefliesKey);
        
        setFirefliesStatus({
          connected: true,
          lastVerified: new Date().toISOString(),
          isValid: true,
        });
        
        setFirefliesKey("");
        toast.success("Fireflies API key saved and validated successfully");
      } else {
        toast.error("Invalid Fireflies API key. Please check and try again.");
      }
    } catch (error) {
      console.error("Fireflies validation error:", error);
      toast.error("Failed to validate Fireflies API key");
    } finally {
      setIsValidatingFireflies(false);
    }
  };

  const validateAndSaveHubspotToken = async () => {
    if (!hubspotToken.trim()) {
      toast.error("Please enter a HubSpot access token");
      return;
    }

    setIsValidatingHubspot(true);
    try {
      // Validate the token with HubSpot API
      const validation = await validateHubspotToken(hubspotToken);
      
      if (validation.isValid) {
        // Encrypt and save the token
        await dbHelpers.saveOrgHubspotToken(CURRENT_USER.organization_id, {
          access_token: hubspotToken,
          expires_at: validation.expiresAt,
          hub_id: validation.hubId,
          account_name: validation.accountName,
        });
        
        setHubspotStatus({
          connected: true,
          expiresAt: validation.expiresAt,
          lastVerified: new Date().toISOString(),
          isValid: true,
          daysUntilExpiration: calculateDaysUntilExpiration(validation.expiresAt),
          accountName: validation.accountName,
          hubId: validation.hubId,
        });
        
        setHubspotToken("");
        toast.success("HubSpot access token saved and validated successfully");
      } else {
        toast.error("Invalid HubSpot access token. Please check and try again.");
      }
    } catch (error) {
      console.error("HubSpot validation error:", error);
      toast.error("Failed to validate HubSpot access token");
    } finally {
      setIsValidatingHubspot(false);
    }
  };

  const validateFirefliesKey = async (apiKey) => {
    try {
      // Mock validation - replace with actual Fireflies API call
      const response = await fetch('https://api.fireflies.ai/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          query: `
            query {
              user {
                user_id
                email
              }
            }
          `
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Fireflies validation error:', error);
      return false;
    }
  };

  const validateHubspotToken = async (accessToken) => {
    try {
      const response = await fetch('https://api.hubapi.com/account-info/v3/details', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        
        // Get token info for expiration
        const tokenResponse = await fetch('https://api.hubapi.com/oauth/v1/access-tokens/' + accessToken);
        let expiresAt = null;
        
        if (tokenResponse.ok) {
          const tokenData = await tokenResponse.json();
          expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString();
        }

        return {
          isValid: true,
          hubId: data.portalId,
          accountName: data.companyName,
          expiresAt: expiresAt,
        };
      }

      return { isValid: false };
    } catch (error) {
      console.error('HubSpot validation error:', error);
      return { isValid: false };
    }
  };

  const handleRevokeFirefliesKey = async () => {
    try {
      await dbHelpers.deleteUserFirefliesKey(CURRENT_USER.id);
      setFirefliesStatus(null);
      toast.success("Fireflies API key revoked successfully");
    } catch (error) {
      toast.error("Failed to revoke Fireflies API key");
      console.error("Fireflies revoke error:", error);
    }
  };

  const handleRevokeHubspotToken = async () => {
    try {
      await dbHelpers.deleteOrgHubspotToken(CURRENT_USER.organization_id);
      setHubspotStatus(null);
      toast.success("HubSpot access token revoked successfully");
    } catch (error) {
      toast.error("Failed to revoke HubSpot access token");
      console.error("HubSpot revoke error:", error);
    }
  };

  const getExpirationBadge = (daysUntilExpiration) => {
    if (daysUntilExpiration === null) return null;
    
    if (daysUntilExpiration < 0) {
      return (
        <Badge variant="destructive" className="flex items-center space-x-1">
          <AlertCircle className="w-3 h-3" />
          <span>Expired</span>
        </Badge>
      );
    } else if (daysUntilExpiration <= 7) {
      return (
        <Badge variant="destructive" className="flex items-center space-x-1">
          <Clock className="w-3 h-3" />
          <span>{daysUntilExpiration} days left</span>
        </Badge>
      );
    } else if (daysUntilExpiration <= 30) {
      return (
        <Badge variant="outline" className="flex items-center space-x-1 bg-yellow-100 text-yellow-800 border-yellow-200">
          <Clock className="w-3 h-3" />
          <span>{daysUntilExpiration} days left</span>
        </Badge>
      );
    } else {
      return (
        <Badge variant="default" className="flex items-center space-x-1 bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="w-3 h-3" />
          <span>{daysUntilExpiration} days left</span>
        </Badge>
      );
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings, preferences, and integrations.
        </p>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center space-x-2">
            <User className="w-4 h-4" />
            <span>Profile</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Bell className="w-4 h-4" />
            <span>Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="setup" className="flex items-center space-x-2">
            <SettingsIcon className="w-4 h-4" />
            <span>Setup</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center space-x-2">
            <Shield className="w-4 h-4" />
            <span>Security</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={profileData.fullName}
                    onChange={(e) =>
                      setProfileData({ ...profileData, fullName: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={profileData.email}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={profileData.timezone}
                    onValueChange={(value) =>
                      setProfileData({ ...profileData, timezone: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
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
                      setProfileData({ ...profileData, language: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="it">Italian</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select
                  value={profileData.theme}
                  onValueChange={(value) =>
                    setProfileData({ ...profileData, theme: value })
                  }
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleSaveProfile} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Profile
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="emailNotifications">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive email notifications for important updates
                    </p>
                  </div>
                  <Switch
                    id="emailNotifications"
                    checked={notifications.emailNotifications}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, emailNotifications: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="pushNotifications">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive browser push notifications
                    </p>
                  </div>
                  <Switch
                    id="pushNotifications"
                    checked={notifications.pushNotifications}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, pushNotifications: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="weeklyReports">Weekly Reports</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive weekly performance reports
                    </p>
                  </div>
                  <Switch
                    id="weeklyReports"
                    checked={notifications.weeklyReports}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, weeklyReports: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="securityAlerts">Security Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive alerts for security-related events
                    </p>
                  </div>
                  <Switch
                    id="securityAlerts"
                    checked={notifications.securityAlerts}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, securityAlerts: checked })
                    }
                  />
                </div>
              </div>

              <Button onClick={handleSaveNotifications} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Setup Tab */}
        <TabsContent value="setup" className="mt-6">
          <div className="space-y-6">
            {/* Fireflies Integration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="w-5 h-5" />
                  <span>Fireflies.ai Integration</span>
                  {firefliesStatus?.connected && (
                    <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Connected
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {firefliesStatus?.connected ? (
                  <div className="space-y-4">
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        Your Fireflies API key is connected and working properly.
                        Last verified: {new Date(firefliesStatus.lastVerified).toLocaleDateString()}
                      </AlertDescription>
                    </Alert>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => loadSetupData()}
                        size="sm"
                      >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Test Connection
                      </Button>
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Unlock className="w-4 h-4 mr-1" />
                            Revoke Key
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Revoke Fireflies API Key</DialogTitle>
                            <DialogDescription>
                              Are you sure you want to revoke your Fireflies API key? 
                              This will disable automatic transcript syncing.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button variant="outline">Cancel</Button>
                            <Button variant="destructive" onClick={handleRevokeFirefliesKey}>
                              Revoke Key
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        Connect your Fireflies.ai account to automatically sync call transcripts.
                        You can find your API key in your Fireflies.ai account settings.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="space-y-2">
                      <Label htmlFor="firefliesKey">Fireflies API Key</Label>
                      <div className="flex space-x-2">
                        <div className="relative flex-1">
                          <Input
                            id="firefliesKey"
                            type={showFirefliesKey ? "text" : "password"}
                            value={firefliesKey}
                            onChange={(e) => setFirefliesKey(e.target.value)}
                            placeholder="Enter your Fireflies API key"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowFirefliesKey(!showFirefliesKey)}
                          >
                            {showFirefliesKey ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                        <Button
                          onClick={validateAndSaveFirefliesKey}
                          disabled={isValidatingFireflies || !firefliesKey.trim()}
                        >
                          {isValidatingFireflies ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Key className="w-4 h-4 mr-2" />
                          )}
                          {isValidatingFireflies ? "Validating..." : "Save & Validate"}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <ExternalLink className="w-4 h-4" />
                      <a
                        href="https://app.fireflies.ai/integrations/custom/api"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        Get your Fireflies API key
                      </a>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* HubSpot Integration (Org Admin Only) */}
            {isOrgAdmin && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Building className="w-5 h-5" />
                    <span>HubSpot Organization Token</span>
                    {hubspotStatus?.connected && (
                      <div className="flex items-center space-x-2">
                        <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Connected
                        </Badge>
                        {getExpirationBadge(hubspotStatus.daysUntilExpiration)}
                      </div>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {hubspotStatus?.connected ? (
                    <div className="space-y-4">
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          Organization HubSpot token is connected and working properly.
                          {hubspotStatus.accountName && (
                            <div className="mt-2">
                              <strong>Account:</strong> {hubspotStatus.accountName}
                              {hubspotStatus.hubId && (
                                <span className="ml-2 text-muted-foreground">
                                  (Hub ID: {hubspotStatus.hubId})
                                </span>
                              )}
                            </div>
                          )}
                          <div className="mt-1">
                            Last verified: {new Date(hubspotStatus.lastVerified).toLocaleDateString()}
                          </div>
                        </AlertDescription>
                      </Alert>
                      
                      {hubspotStatus.daysUntilExpiration !== null && hubspotStatus.daysUntilExpiration <= 30 && (
                        <Alert variant={hubspotStatus.daysUntilExpiration <= 7 ? "destructive" : "default"}>
                          <Clock className="h-4 w-4" />
                          <AlertDescription>
                            {hubspotStatus.daysUntilExpiration <= 0
                              ? "Your HubSpot token has expired. Please update it to continue using HubSpot integration."
                              : `Your HubSpot token will expire in ${hubspotStatus.daysUntilExpiration} days. Consider updating it soon.`
                            }
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          onClick={() => loadSetupData()}
                          size="sm"
                        >
                          <RefreshCw className="w-4 h-4 mr-1" />
                          Test Connection
                        </Button>
                        
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              <Unlock className="w-4 h-4 mr-1" />
                              Revoke Token
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Revoke HubSpot Token</DialogTitle>
                              <DialogDescription>
                                Are you sure you want to revoke the organization's HubSpot token? 
                                This will disable HubSpot integration for all users in your organization.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <Button variant="outline">Cancel</Button>
                              <Button variant="destructive" onClick={handleRevokeHubspotToken}>
                                Revoke Token
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          As an organization administrator, you can configure a HubSpot access token 
                          that will be used by all users in your organization for CRM integration.
                        </AlertDescription>
                      </Alert>
                      
                      <div className="space-y-2">
                        <Label htmlFor="hubspotToken">HubSpot Access Token</Label>
                        <div className="flex space-x-2">
                          <div className="relative flex-1">
                            <Input
                              id="hubspotToken"
                              type={showHubspotToken ? "text" : "password"}
                              value={hubspotToken}
                              onChange={(e) => setHubspotToken(e.target.value)}
                              placeholder="Enter HubSpot access token"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3"
                              onClick={() => setShowHubspotToken(!showHubspotToken)}
                            >
                              {showHubspotToken ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                          <Button
                            onClick={validateAndSaveHubspotToken}
                            disabled={isValidatingHubspot || !hubspotToken.trim()}
                          >
                            {isValidatingHubspot ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Lock className="w-4 h-4 mr-2" />
                            )}
                            {isValidatingHubspot ? "Validating..." : "Save & Validate"}
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <ExternalLink className="w-4 h-4" />
                        <a
                          href="https://developers.hubspot.com/docs/api/private-apps"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          Learn how to create a HubSpot access token
                        </a>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Access Level Info */}
            <Card>
              <CardHeader>
                <CardTitle>Access Level Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Your Role:</span>
                    <Badge variant="outline">
                      {CURRENT_USER.role_key?.replace('_', ' ').toUpperCase() || 'USER'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Fireflies Integration:</span>
                    <Badge variant="secondary">User Level</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">HubSpot Integration:</span>
                    <Badge variant={isOrgAdmin ? "default" : "secondary"}>
                      {isOrgAdmin ? "Admin Level" : "Organization Level"}
                    </Badge>
                  </div>
                  
                  {!isOrgAdmin && (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        HubSpot integration is managed at the organization level. 
                        Contact your organization administrator to configure HubSpot access.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Security settings are coming soon. This will include password management,
                  two-factor authentication, and session management.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
export { Settings };