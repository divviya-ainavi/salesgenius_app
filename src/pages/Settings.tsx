import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
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
  Building,
  Bell,
  Shield,
  Key,
  Globe,
  Palette,
  Database,
  Zap,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Settings as SettingsIcon,
  Save,
  RefreshCw,
  Loader2,
  Crown,
  Users,
  Brain,
  FileText,
  HelpCircle,
  Lock,
  Unlock,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CURRENT_USER, dbHelpers } from "@/lib/supabase";
import crmService from "@/services/crmService";
import { config } from "@/lib/config";
import { useSelector } from "react-redux";
import BusinessKnowledgeSection from "@/components/settings/BusinessKnowledgeSection";
import { usePageTimer } from "../hooks/userPageTimer";

const Settings = () => {
  usePageTimer("Settings");

  const [activeTab, setActiveTab] = useState("profile");
  const [isLoading, setIsLoading] = useState(false);
  const [hubspotStatus, setHubspotStatus] = useState(null);
  const [isCheckingHubspot, setIsCheckingHubspot] = useState(false);
  const [showHubspotDialog, setShowHubspotDialog] = useState(false);

  // Get user data from Redux store
  const {
    userProfileInfo,
    userRole,
    userRoleId,
    titleName,
    organizationDetails,
    user,
    hubspotIntegration,
  } = useSelector((state) => state.auth);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    fullName: user?.full_name || "",
    email: user?.email || "",
    timezone: user?.timezone || "UTC",
    language: user?.language || "en",
  });

  // Organization form state
  const [orgForm, setOrgForm] = useState({
    name: organizationDetails?.name || "",
    domain: organizationDetails?.domain || "",
    industry: organizationDetails?.industry || "",
    companySize: organizationDetails?.company_size || "",
    country: organizationDetails?.country || "",
    city: organizationDetails?.city || "",
  });

  // Notification preferences
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    weeklyReports: true,
    securityAlerts: true,
  });

  // Check HubSpot connection status on component mount
  useEffect(() => {
    checkHubSpotConnection();
  }, []);

  const checkHubSpotConnection = async () => {
    setIsCheckingHubspot(true);
    try {
      const status = await crmService.getConnectionStatus("hubspot");
      setHubspotStatus(status);
    } catch (error) {
      console.error("Error checking HubSpot connection:", error);
      setHubspotStatus({ connected: false, error: error.message });
    } finally {
      setIsCheckingHubspot(false);
    }
  };

  const handleProfileUpdate = async () => {
    setIsLoading(true);
    try {
      // Update profile logic here
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOrgUpdate = async () => {
    setIsLoading(true);
    try {
      // Update organization logic here
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
      toast.success("Organization settings updated successfully");
    } catch (error) {
      toast.error("Failed to update organization settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleHubSpotConnect = () => {
    const authUrl = `${config.hubspot.authUrl}?client_id=${
      config.hubspot.clientId
    }&redirect_uri=${encodeURIComponent(
      config.hubspot.redirectUri
    )}&scope=${encodeURIComponent(config.hubspot.scopes)}`;

    window.location.href = authUrl;
  };

  const handleHubSpotDisconnect = async () => {
    try {
      await crmService.hubspot.disconnect();
      setHubspotStatus({ connected: false });
      toast.success("HubSpot disconnected successfully");
      setShowHubspotDialog(false);
    } catch (error) {
      toast.error("Failed to disconnect HubSpot: " + error.message);
    }
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

  const RoleIcon = getRoleIcon(userRole?.key || "user");

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account, organization, and application preferences.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Badge
            variant="outline"
            className={cn("text-sm", getRoleColor(userRole?.key || "user"))}
          >
            <RoleIcon className="w-4 h-4 mr-2" />
            {userRole?.label || titleName || "User"}
          </Badge>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile">
            <User className="w-4 h-4 mr-1" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="organization">
            <Building className="w-4 h-4 mr-1" />
            Organization
          </TabsTrigger>
          <TabsTrigger value="integrations">
            <Zap className="w-4 h-4 mr-1" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="ai-training">
            <Brain className="w-4 h-4 mr-1" />
            AI Training
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="w-4 h-4 mr-1" />
            Notifications
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="mt-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={profileForm.fullName}
                      onChange={(e) =>
                        setProfileForm((prev) => ({
                          ...prev,
                          fullName: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileForm.email}
                      onChange={(e) =>
                        setProfileForm((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      disabled
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select
                      value={profileForm.timezone}
                      onValueChange={(value) =>
                        setProfileForm((prev) => ({ ...prev, timezone: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
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
                      value={profileForm.language}
                      onValueChange={(value) =>
                        setProfileForm((prev) => ({ ...prev, language: value }))
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
                        <SelectItem value="pt">Portuguese</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleProfileUpdate} disabled={isLoading}>
                    {isLoading ? (
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
              </CardContent>
            </Card>

            {/* Role Information */}
            <Card>
              <CardHeader>
                <CardTitle>Role & Permissions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center space-x-3">
                    <RoleIcon className="w-8 h-8 text-primary" />
                    <div>
                      <h3 className="font-medium">
                        {userRole?.label || titleName || "User"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {userRole?.description || "Standard user permissions"}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(getRoleColor(userRole?.key || "user"))}
                  >
                    {userRole?.key || "user"}
                  </Badge>
                </div>

                <div className="text-sm text-muted-foreground">
                  <p>
                    Your role determines what features and data you can access
                    within the application. Contact your administrator if you
                    need different permissions.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Organization Tab */}
        <TabsContent value="organization" className="mt-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Organization Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="orgName">Organization Name</Label>
                    <Input
                      id="orgName"
                      value={orgForm.name}
                      onChange={(e) =>
                        setOrgForm((prev) => ({ ...prev, name: e.target.value }))
                      }
                      disabled={userRoleId !== 2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="domain">Domain</Label>
                    <Input
                      id="domain"
                      value={orgForm.domain}
                      onChange={(e) =>
                        setOrgForm((prev) => ({
                          ...prev,
                          domain: e.target.value,
                        }))
                      }
                      disabled={userRoleId !== 2}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Select
                      value={orgForm.industry}
                      onValueChange={(value) =>
                        setOrgForm((prev) => ({ ...prev, industry: value }))
                      }
                      disabled={userRoleId !== 2}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="healthcare">Healthcare</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                        <SelectItem value="education">Education</SelectItem>
                        <SelectItem value="retail">Retail</SelectItem>
                        <SelectItem value="manufacturing">
                          Manufacturing
                        </SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companySize">Company Size</Label>
                    <Select
                      value={orgForm.companySize}
                      onValueChange={(value) =>
                        setOrgForm((prev) => ({ ...prev, companySize: value }))
                      }
                      disabled={userRoleId !== 2}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-10">1-10 employees</SelectItem>
                        <SelectItem value="11-50">11-50 employees</SelectItem>
                        <SelectItem value="51-200">51-200 employees</SelectItem>
                        <SelectItem value="201-1000">
                          201-1000 employees
                        </SelectItem>
                        <SelectItem value="1000+">1000+ employees</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={orgForm.country}
                      onChange={(e) =>
                        setOrgForm((prev) => ({
                          ...prev,
                          country: e.target.value,
                        }))
                      }
                      disabled={userRoleId !== 2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={orgForm.city}
                      onChange={(e) =>
                        setOrgForm((prev) => ({ ...prev, city: e.target.value }))
                      }
                      disabled={userRoleId !== 2}
                    />
                  </div>
                </div>

                {userRoleId !== 2 && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <Lock className="w-4 h-4 inline mr-1" />
                      Only organization administrators can modify these settings.
                    </p>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button
                    onClick={handleOrgUpdate}
                    disabled={isLoading || userRoleId !== 2}
                  >
                    {isLoading ? (
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
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="mt-6">
          <div className="grid gap-6">
            {/* HubSpot Integration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-5 h-5" />
                    <span>HubSpot CRM Integration</span>
                  </div>
                  {isCheckingHubspot ? (
                    <Badge variant="outline">
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      Checking...
                    </Badge>
                  ) : hubspotStatus?.connected ? (
                    <Badge
                      variant="default"
                      className="bg-green-100 text-green-800 border-green-200"
                    >
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Connected
                    </Badge>
                  ) : (
                    <Badge
                      variant="destructive"
                      className="bg-red-100 text-red-800 border-red-200"
                    >
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Not Connected
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Connect your HubSpot account to automatically sync contacts,
                  deals, and push follow-up emails and action items.
                </p>

                {hubspotStatus?.connected ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-green-900">
                            HubSpot Connected
                          </h4>
                          <p className="text-sm text-green-700">
                            Account: {hubspotStatus.account_name || "Connected"}
                          </p>
                          {hubspotStatus.last_sync && (
                            <p className="text-xs text-green-600">
                              Last sync: {hubspotStatus.last_sync}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowHubspotDialog(true)}
                        >
                          Manage
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        onClick={checkHubSpotConnection}
                        disabled={isCheckingHubspot}
                      >
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Test Connection
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <h4 className="font-medium mb-2">Connect HubSpot</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        Authorize SalesGenius.ai to access your HubSpot account
                        for seamless CRM integration.
                      </p>
                      <Button onClick={handleHubSpotConnect}>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Connect to HubSpot
                      </Button>
                    </div>

                    {hubspotStatus?.error && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800">
                          <AlertCircle className="w-4 h-4 inline mr-1" />
                          {hubspotStatus.error}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Other Integrations */}
            <Card>
              <CardHeader>
                <CardTitle>Other Integrations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Database className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">Salesforce</h4>
                      <p className="text-sm text-muted-foreground">
                        CRM integration
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">Coming Soon</Badge>
                </div>

                <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Globe className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">Zoom</h4>
                      <p className="text-sm text-muted-foreground">
                        Meeting transcription
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">Coming Soon</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AI Training Tab */}
        <TabsContent value="ai-training" className="mt-6">
          <div className="grid gap-6">
            {/* Business Knowledge Section */}
            <BusinessKnowledgeSection />

            {/* AI Model Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="w-5 h-5" />
                  <span>AI Model Configuration</span>
                  <Badge variant="outline" className="text-xs">
                    Coming Soon
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Configure AI model parameters and training preferences for your organization.
                </p>

                <div className="space-y-4 opacity-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Response Creativity</Label>
                      <p className="text-xs text-muted-foreground">
                        Control how creative vs. conservative AI responses are
                      </p>
                    </div>
                    <Select disabled>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Balanced" />
                      </SelectTrigger>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Industry Focus</Label>
                      <p className="text-xs text-muted-foreground">
                        Optimize responses for your industry
                      </p>
                    </div>
                    <Select disabled>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Auto" />
                      </SelectTrigger>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Custom Training</Label>
                      <p className="text-xs text-muted-foreground">
                        Use uploaded files for model fine-tuning
                      </p>
                    </div>
                    <Switch disabled />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Training Data Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Training Data Insights</span>
                  <Badge variant="outline" className="text-xs">
                    Coming Soon
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  View insights about your organization's training data and AI model performance.
                </p>

                <div className="grid md:grid-cols-3 gap-4 opacity-50">
                  <div className="text-center p-4 border border-border rounded-lg">
                    <div className="text-2xl font-bold text-primary">0</div>
                    <div className="text-sm text-muted-foreground">
                      Documents Processed
                    </div>
                  </div>
                  <div className="text-center p-4 border border-border rounded-lg">
                    <div className="text-2xl font-bold text-primary">0%</div>
                    <div className="text-sm text-muted-foreground">
                      Model Accuracy
                    </div>
                  </div>
                  <div className="text-center p-4 border border-border rounded-lg">
                    <div className="text-2xl font-bold text-primary">0</div>
                    <div className="text-sm text-muted-foreground">
                      Training Hours
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="mt-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive email updates about your account activity
                      </p>
                    </div>
                    <Switch
                      checked={notifications.emailNotifications}
                      onCheckedChange={(checked) =>
                        setNotifications((prev) => ({
                          ...prev,
                          emailNotifications: checked,
                        }))
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified about important events in real-time
                      </p>
                    </div>
                    <Switch
                      checked={notifications.pushNotifications}
                      onCheckedChange={(checked) =>
                        setNotifications((prev) => ({
                          ...prev,
                          pushNotifications: checked,
                        }))
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Weekly Reports</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive weekly performance and analytics reports
                      </p>
                    </div>
                    <Switch
                      checked={notifications.weeklyReports}
                      onCheckedChange={(checked) =>
                        setNotifications((prev) => ({
                          ...prev,
                          weeklyReports: checked,
                        }))
                      }
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Security Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified about security-related events
                      </p>
                    </div>
                    <Switch
                      checked={notifications.securityAlerts}
                      onCheckedChange={(checked) =>
                        setNotifications((prev) => ({
                          ...prev,
                          securityAlerts: checked,
                        }))
                      }
                      disabled
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={() => toast.success("Notification preferences saved")}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* HubSpot Management Dialog */}
      <Dialog open={showHubspotDialog} onOpenChange={setShowHubspotDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manage HubSpot Integration</DialogTitle>
            <DialogDescription>
              Manage your HubSpot connection and settings.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {hubspotStatus?.connected && (
              <div className="space-y-3">
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-1">
                    Connection Status
                  </h4>
                  <p className="text-sm text-green-700">
                    Successfully connected to{" "}
                    {hubspotStatus.account_name || "HubSpot"}
                  </p>
                  {hubspotStatus.portal_id && (
                    <p className="text-xs text-green-600">
                      Portal ID: {hubspotStatus.portal_id}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Available Actions</h4>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={checkHubSpotConnection}
                      disabled={isCheckingHubspot}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Test Connection
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => {
                        window.open("https://app.hubspot.com", "_blank");
                      }}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open HubSpot
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowHubspotDialog(false)}
            >
              Close
            </Button>
            {hubspotStatus?.connected && (
              <Button variant="destructive" onClick={handleHubSpotDisconnect}>
                Disconnect HubSpot
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;
export { Settings };