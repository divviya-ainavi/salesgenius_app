import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Building,
  Bell,
  Shield,
  ExternalLink,
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Settings as SettingsIcon,
  Loader2,
  Eye,
  EyeOff,
  Key,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CURRENT_USER, dbHelpers } from "@/lib/supabase";
import { useSelector } from "react-redux";

// JWT utility functions
const createJWT = (payload, secret = 'your-secret-key') => {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const base64UrlEncode = (obj) => {
    return btoa(JSON.stringify(obj))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  };

  const encodedHeader = base64UrlEncode(header);
  const encodedPayload = base64UrlEncode(payload);

  // Simple HMAC-SHA256 simulation (for demo purposes)
  // In production, use a proper JWT library like jsonwebtoken
  const signature = btoa(`${encodedHeader}.${encodedPayload}.${secret}`)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
};

const Settings = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setSaving] = useState(false);

  // Profile state
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
  });

  // Organization state
  const [organizationData, setOrganizationData] = useState({
    name: "",
    industry: "",
    companySize: "",
    salesMethodology: "",
  });

  // HubSpot integration state
  const [hubspotData, setHubspotData] = useState({
    connected: false,
    accessToken: "",
    refreshToken: "",
    lastSync: null,
    accountInfo: null,
  });
  const [showTokens, setShowTokens] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    weeklyReports: true,
    marketingEmails: false,
  });

  // Dropdown options
  const [dropdownOptions, setDropdownOptions] = useState({
    industry: [],
    company_size: [],
    sales_methodology: [],
  });

  const user = useSelector((state) => state.auth.user);
  const organizationDetails = useSelector(
    (state) => state.auth.organizationDetails
  );

  // Load initial data
  useEffect(() => {
    loadInitialData();
    loadDropdownOptions();
  }, []);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      // Load profile data
      if (user) {
        setProfileData({
          name: user.full_name || "",
          email: user.email || "",
        });
      }

      // Load organization data
      if (organizationDetails) {
        setOrganizationData({
          name: organizationDetails.name || "",
          industry: organizationDetails.industry?.key || "",
          companySize: organizationDetails.company_size?.key || "",
          salesMethodology: organizationDetails.sales_methodology?.key || "",
        });
      }

      // Load HubSpot connection status
      await loadHubSpotStatus();
    } catch (error) {
      console.error("Error loading initial data:", error);
      toast.error("Failed to load settings data");
    } finally {
      setIsLoading(false);
    }
  };

  const loadDropdownOptions = async () => {
    try {
      const options = await dbHelpers.getOrgDropdownOptions();
      if (options) {
        setDropdownOptions(options);
      }
    } catch (error) {
      console.error("Error loading dropdown options:", error);
    }
  };

  const loadHubSpotStatus = async () => {
    try {
      const credentials = await dbHelpers.getUserHubSpotCredentials(
        user?.id || CURRENT_USER?.id
      );

      if (credentials && credentials.hubspot_access_token) {
        setHubspotData({
          connected: credentials.hubspot_connected || false,
          accessToken: credentials.hubspot_access_token,
          refreshToken: credentials.hubspot_refresh_token || "",
          lastSync: credentials.updated_at,
          accountInfo: null,
        });
      }
    } catch (error) {
      console.error("Error loading HubSpot status:", error);
    }
  };

  const handleProfileChange = (field, value) => {
    setProfileData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleOrganizationChange = (field, value) => {
    setOrganizationData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNotificationChange = (setting, value) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [setting]: value,
    }));
  };

  const handleSaveProfile = async () => {
    const userId = user?.id || CURRENT_USER?.id;
    
    if (!userId) {
      toast.error("User session invalid. Please log in again.");
      return;
    }

    if (!profileData.name.trim() || !profileData.email.trim()) {
      toast.error("Name and email are required fields");
      return;
    }

    setSaving(true);
    try {
      await dbHelpers.updateUserProfile(userId, {
        name: profileData.name.trim(),
        email: profileData.email.trim(),
      });

      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating user profile:", error);
      toast.error(`Failed to update profile: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveOrganization = async () => {
    if (!organizationDetails?.id) {
      toast.error("No organization found to update");
      return;
    }

    if (!organizationData.name.trim()) {
      toast.error("Organization name is required");
      return;
    }

    setSaving(true);
    try {
      // Find the selected option objects
      const selectedIndustry = dropdownOptions.industry.find(
        (item) => item.key === organizationData.industry
      );
      const selectedCompanySize = dropdownOptions.company_size.find(
        (item) => item.key === organizationData.companySize
      );
      const selectedSalesMethodology = dropdownOptions.sales_methodology.find(
        (item) => item.key === organizationData.salesMethodology
      );

      const updateData = {
        name: organizationData.name.trim(),
        industry_id: selectedIndustry?.id || null,
        company_size_id: selectedCompanySize?.id || null,
        sales_methodology_id: selectedSalesMethodology?.id || null,
      };

      const result = await dbHelpers.updateOrganizationSettings(
        organizationDetails.id,
        updateData
      );

      if (result.success) {
        toast.success("Organization settings updated successfully");
      } else {
        throw new Error(result.error?.message || "Update failed");
      }
    } catch (error) {
      console.error("Error updating organization:", error);
      toast.error(`Failed to update organization: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleConnectHubSpot = () => {
    const clientId = import.meta.env.VITE_HUBSPOT_CLIENT_ID;
    const redirectUri = import.meta.env.VITE_HUBSPOT_REDIRECT_URI;
    const scopes = [
      "crm.objects.contacts.write",
      "crm.dealsplits.read_write",
      "oauth",
      "crm.lists.write",
      "crm.lists.read",
      "crm.objects.deals.read",
      "crm.objects.deals.write",
      "crm.objects.contacts.read"
    ].join("%20");

    const authUrl = `https://app-na2.hubspot.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}`;
    
    window.location.href = authUrl;
  };

  const handleDisconnectHubSpot = async () => {
    const userId = user?.id || CURRENT_USER?.id;
    
    if (!userId) {
      toast.error("User session invalid");
      return;
    }

    setSaving(true);
    try {
      await dbHelpers.deleteUserHubSpotCredentials(userId);
      
      setHubspotData({
        connected: false,
        accessToken: "",
        refreshToken: "",
        lastSync: null,
        accountInfo: null,
      });

      toast.success("HubSpot disconnected successfully");
    } catch (error) {
      console.error("Error disconnecting HubSpot:", error);
      toast.error("Failed to disconnect HubSpot");
    } finally {
      setSaving(false);
    }
  };

  const handleCheckHubSpotConnection = async () => {
    if (!hubspotData.accessToken) {
      toast.error("No HubSpot access token found");
      return;
    }

    setIsCheckingConnection(true);
    try {
      // Create JWT payload with the access token
      const payload = {
        access_token: hubspotData.accessToken,
        user_id: user?.id || CURRENT_USER?.id,
        timestamp: Date.now(),
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour expiration
      };

      // Encrypt the token using JWT
      const jwtToken = createJWT(payload);

      // Send encrypted token to n8n API
      const response = await fetch(
        "https://salesgenius.ainavi.co.uk/n8n/webhook-test/hubspotconnection-check",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${jwtToken}`,
          },
          body: JSON.stringify({
            encrypted_token: jwtToken,
            user_id: user?.id || CURRENT_USER?.id,
            check_type: "connection_validation",
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success || result.valid) {
        setHubspotData(prev => ({
          ...prev,
          connected: true,
          accountInfo: result.account_info || result.data,
        }));
        toast.success("HubSpot connection verified successfully");
      } else {
        setHubspotData(prev => ({
          ...prev,
          connected: false,
        }));
        toast.error("HubSpot connection is invalid");
      }
    } catch (error) {
      console.error("Error checking HubSpot connection:", error);
      toast.error(`Failed to verify HubSpot connection: ${error.message}`);
      
      setHubspotData(prev => ({
        ...prev,
        connected: false,
      }));
    } finally {
      setIsCheckingConnection(false);
    }
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    try {
      // Simulate API call to save notification settings
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success("Notification settings saved successfully");
    } catch (error) {
      toast.error("Failed to save notification settings");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account, organization, and integration preferences.
        </p>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">
            <User className="w-4 h-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="organization">
            <Building className="w-4 h-4 mr-2" />
            Organization
          </TabsTrigger>
          <TabsTrigger value="integrations">
            <Zap className="w-4 h-4 mr-2" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Profile Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) => handleProfileChange("name", e.target.value)}
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => handleProfileChange("email", e.target.value)}
                    placeholder="Enter your email address"
                  />
                </div>
              </div>

              <Separator />

              <div className="flex justify-end">
                <Button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="min-w-32"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Profile
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Organization Tab */}
        <TabsContent value="organization" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="w-5 h-5" />
                <span>Organization Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="orgName">Organization Name</Label>
                <Input
                  id="orgName"
                  value={organizationData.name}
                  onChange={(e) =>
                    handleOrganizationChange("name", e.target.value)
                  }
                  placeholder="Enter organization name"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Select
                    value={organizationData.industry}
                    onValueChange={(value) =>
                      handleOrganizationChange("industry", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {dropdownOptions.industry.map((option) => (
                        <SelectItem key={option.id} value={option.key}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companySize">Company Size</Label>
                  <Select
                    value={organizationData.companySize}
                    onValueChange={(value) =>
                      handleOrganizationChange("companySize", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select company size" />
                    </SelectTrigger>
                    <SelectContent>
                      {dropdownOptions.company_size.map((option) => (
                        <SelectItem key={option.id} value={option.key}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="salesMethodology">Sales Methodology</Label>
                  <Select
                    value={organizationData.salesMethodology}
                    onValueChange={(value) =>
                      handleOrganizationChange("salesMethodology", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select methodology" />
                    </SelectTrigger>
                    <SelectContent>
                      {dropdownOptions.sales_methodology.map((option) => (
                        <SelectItem key={option.id} value={option.key}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="flex justify-end">
                <Button
                  onClick={handleSaveOrganization}
                  disabled={isSaving}
                  className="min-w-32"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Organization
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="w-5 h-5" />
                <span>CRM Integrations</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* HubSpot Integration */}
              <div className="border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <ExternalLink className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">HubSpot CRM</h3>
                      <p className="text-sm text-muted-foreground">
                        Connect your HubSpot account to sync contacts and deals
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={hubspotData.connected ? "default" : "secondary"}
                    className={cn(
                      hubspotData.connected
                        ? "bg-green-100 text-green-800 border-green-200"
                        : "bg-gray-100 text-gray-800 border-gray-200"
                    )}
                  >
                    {hubspotData.connected ? (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Connected
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Disconnected
                      </>
                    )}
                  </Badge>
                </div>

                {hubspotData.connected && hubspotData.accessToken && (
                  <div className="space-y-4 mb-4">
                    <div className="bg-muted rounded-lg p-4">
                      <h4 className="font-medium mb-2">Connection Details</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Access Token:</span>
                          <div className="flex items-center space-x-2">
                            <code className="bg-background px-2 py-1 rounded text-xs">
                              {showTokens 
                                ? hubspotData.accessToken 
                                : `${hubspotData.accessToken.substring(0, 8)}...`
                              }
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowTokens(!showTokens)}
                            >
                              {showTokens ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                        {hubspotData.lastSync && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Last Sync:</span>
                            <span>{new Date(hubspotData.lastSync).toLocaleString()}</span>
                          </div>
                        )}
                        {hubspotData.accountInfo && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Account:</span>
                            <span>{hubspotData.accountInfo.companyName || 'HubSpot Account'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-3">
                  {hubspotData.connected ? (
                    <>
                      <Button
                        variant="outline"
                        onClick={handleCheckHubSpotConnection}
                        disabled={isCheckingConnection}
                      >
                        {isCheckingConnection ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Checking...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Test Connection
                          </>
                        )}
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleDisconnectHubSpot}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Disconnecting...
                          </>
                        ) : (
                          "Disconnect"
                        )}
                      </Button>
                    </>
                  ) : (
                    <Button onClick={handleConnectHubSpot}>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Connect HubSpot
                    </Button>
                  )}
                </div>
              </div>

              {/* Additional integrations can be added here */}
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>More integrations coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="w-5 h-5" />
                <span>Notification Preferences</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Email Notifications</h4>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.emailNotifications}
                    onCheckedChange={(checked) =>
                      handleNotificationChange("emailNotifications", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Push Notifications</h4>
                    <p className="text-sm text-muted-foreground">
                      Receive push notifications in your browser
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.pushNotifications}
                    onCheckedChange={(checked) =>
                      handleNotificationChange("pushNotifications", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Weekly Reports</h4>
                    <p className="text-sm text-muted-foreground">
                      Receive weekly performance reports
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.weeklyReports}
                    onCheckedChange={(checked) =>
                      handleNotificationChange("weeklyReports", checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Marketing Emails</h4>
                    <p className="text-sm text-muted-foreground">
                      Receive product updates and marketing communications
                    </p>
                  </div>
                  <Switch
                    checked={notificationSettings.marketingEmails}
                    onCheckedChange={(checked) =>
                      handleNotificationChange("marketingEmails", checked)
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="flex justify-end">
                <Button
                  onClick={handleSaveNotifications}
                  disabled={isSaving}
                  className="min-w-32"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Preferences
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
export { Settings };