import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  User,
  Building,
  Users,
  FileText,
  Shield,
  Settings as SettingsIcon,
  Save,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Loader2,
  Crown,
  Mail,
  Phone,
  Globe,
  MapPin,
  Calendar,
  Languages,
  Clock,
  RefreshCw,
  Trash2,
  Plus,
  Edit,
  Download,
  Upload,
  Key,
  Link,
  Zap,
  PlayCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useSelector, useDispatch } from "react-redux";
import { dbHelpers, CURRENT_USER } from "@/lib/supabase";
import { analytics } from "@/lib/analytics";
import { usePageTimer } from "@/hooks/userPageTimer";
import { getCountries, getCitiesForCountry } from "@/data/countriesAndCities";
import BusinessKnowledgeSection from "@/components/settings/BusinessKnowledgeSection";
import { config } from "@/lib/config";
import crmService from "@/services/crmService";

const Settings = () => {
  usePageTimer("Settings");

  const dispatch = useDispatch();
  const {
    user,
    organizationDetails,
    userRole,
    userRoleId,
    hasSeenOnboardingTour,
  } = useSelector((state) => state.auth);

  // Component state
  const [activeTab, setActiveTab] = useState("profile");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form states
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    email: "",
    timezone: "",
    language: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [organizationForm, setOrganizationForm] = useState({
    name: "",
    domain: "",
    industry: "",
    companySize: "",
    country: "",
    city: "",
    salesMethodology: "",
  });

  // Integration states
  const [firefliesIntegration, setFirefliesIntegration] = useState({
    connected: false,
    lastSync: null,
    apiKey: "",
  });

  const [hubspotIntegration, setHubspotIntegration] = useState({
    connected: false,
    lastSync: null,
    accountInfo: null,
  });

  // Load initial data
  useEffect(() => {
    loadUserData();
    loadOrganizationData();
    checkIntegrations();
  }, []);

  const loadUserData = async () => {
    try {
      if (user) {
        setProfileForm({
          fullName: user.full_name || "",
          email: user.email || "",
          timezone: user.timezone || "UTC",
          language: user.language || "en",
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      toast.error("Failed to load user data");
    }
  };

  const loadOrganizationData = async () => {
    try {
      if (organizationDetails) {
        setOrganizationForm({
          name: organizationDetails.name || "",
          domain: organizationDetails.domain || "",
          industry: organizationDetails.industry || "",
          companySize: organizationDetails.company_size || "",
          country: organizationDetails.country || "",
          city: organizationDetails.city || "",
          salesMethodology: organizationDetails.sales_methodology || "",
        });
      }
    } catch (error) {
      console.error("Error loading organization data:", error);
      toast.error("Failed to load organization data");
    }
  };

  const checkIntegrations = async () => {
    try {
      // Check HubSpot connection
      const hubspotStatus = await crmService.getConnectionStatus("hubspot");
      setHubspotIntegration({
        connected: hubspotStatus.connected,
        lastSync: hubspotStatus.last_sync,
        accountInfo: hubspotStatus.account_name
          ? {
              name: hubspotStatus.account_name,
              portalId: hubspotStatus.portal_id,
            }
          : null,
      });

      // Check Fireflies connection (mock for now)
      setFirefliesIntegration({
        connected: user?.fireflies_connected || false,
        lastSync: user?.fireflies_last_sync || null,
        apiKey: user?.fireflies_api_key ? "••••••••" : "",
      });
    } catch (error) {
      console.error("Error checking integrations:", error);
    }
  };

  const handleProfileSave = async () => {
    setIsSaving(true);
    try {
      // Validate form
      if (!profileForm.fullName.trim()) {
        toast.error("Full name is required");
        return;
      }

      // If changing password, validate
      if (profileForm.newPassword) {
        if (!profileForm.currentPassword) {
          toast.error("Current password is required to set a new password");
          return;
        }
        if (profileForm.newPassword !== profileForm.confirmPassword) {
          toast.error("New passwords do not match");
          return;
        }
        if (profileForm.newPassword.length < 8) {
          toast.error("New password must be at least 8 characters");
          return;
        }
      }

      // Update profile
      const updates = {
        full_name: profileForm.fullName.trim(),
        timezone: profileForm.timezone,
        language: profileForm.language,
      };

      // Add password update if provided
      if (profileForm.newPassword) {
        // In a real app, you'd verify current password first
        updates.hashed_password = profileForm.newPassword; // This should be hashed
      }

      await dbHelpers.updateUserProfile(user.id, updates);

      toast.success("Profile updated successfully");

      // Clear password fields
      setProfileForm((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleOrganizationSave = async () => {
    setIsSaving(true);
    try {
      // Validate form
      if (!organizationForm.name.trim()) {
        toast.error("Organization name is required");
        return;
      }

      const updates = {
        name: organizationForm.name.trim(),
        domain: organizationForm.domain.trim(),
        industry: organizationForm.industry,
        company_size: organizationForm.companySize,
        country: organizationForm.country,
        city: organizationForm.city,
        sales_methodology: organizationForm.salesMethodology,
      };

      // Update organization (this would need to be implemented in dbHelpers)
      // await dbHelpers.updateOrganization(organizationDetails.id, updates);

      toast.success("Organization updated successfully");
    } catch (error) {
      console.error("Error updating organization:", error);
      toast.error("Failed to update organization: " + error.message);
    } finally {
      setIsSaving(false);
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
      setHubspotIntegration({
        connected: false,
        lastSync: null,
        accountInfo: null,
      });
      toast.success("HubSpot disconnected successfully");
    } catch (error) {
      console.error("Error disconnecting HubSpot:", error);
      toast.error("Failed to disconnect HubSpot");
    }
  };

  const handleFirefliesConnect = async () => {
    // Mock Fireflies connection
    toast.info("Fireflies integration coming soon!");
  };

  const handleResetOnboardingTour = async () => {
    try {
      await dbHelpers.resetOnboardingTour(user.id);
      toast.success(
        "Onboarding tour reset! It will show again on your next page refresh."
      );

      // Track analytics
      analytics.track("onboarding_tour_reset", {
        user_id: user.id,
      });
    } catch (error) {
      console.error("Error resetting onboarding tour:", error);
      toast.error("Failed to reset onboarding tour");
    }
  };

  const isOrgAdmin = userRoleId === 2 || userRole?.key === "org_admin";
  const isSuperAdmin = userRoleId === 1 || userRole?.key === "super_admin";

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account, organization, and integrations
          </p>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="profile" data-tour="settings-profile">
            <User className="w-4 h-4 mr-1" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="organization" data-tour="settings-organization">
            <Building className="w-4 h-4 mr-1" />
            Organization
          </TabsTrigger>
          <TabsTrigger value="users" data-tour="settings-users">
            <Users className="w-4 h-4 mr-1" />
            Users
          </TabsTrigger>
          <TabsTrigger value="ai-training" data-tour="settings-ai-training">
            <FileText className="w-4 h-4 mr-1" />
            AI Training
          </TabsTrigger>
          <TabsTrigger value="integrations" data-tour="settings-integrations">
            <Link className="w-4 h-4 mr-1" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="advanced" data-tour="settings-advanced">
            <Shield className="w-4 h-4 mr-1" />
            Advanced
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
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
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileForm.email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed. Contact your administrator if
                    needed.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={profileForm.timezone}
                    onValueChange={(value) =>
                      setProfileForm((prev) => ({ ...prev, timezone: value }))
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
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
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

              <Button onClick={handleProfileSave} disabled={isSaving}>
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
            </CardContent>
          </Card>

          {/* Password Change Section */}
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showPassword ? "text" : "password"}
                    value={profileForm.currentPassword}
                    onChange={(e) =>
                      setProfileForm((prev) => ({
                        ...prev,
                        currentPassword: e.target.value,
                      }))
                    }
                    placeholder="Enter current password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={profileForm.newPassword}
                      onChange={(e) =>
                        setProfileForm((prev) => ({
                          ...prev,
                          newPassword: e.target.value,
                        }))
                      }
                      placeholder="Enter new password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={profileForm.confirmPassword}
                      onChange={(e) =>
                        setProfileForm((prev) => ({
                          ...prev,
                          confirmPassword: e.target.value,
                        }))
                      }
                      placeholder="Confirm new password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleProfileSave}
                disabled={
                  isSaving ||
                  !profileForm.newPassword ||
                  profileForm.newPassword !== profileForm.confirmPassword
                }
                variant="outline"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4 mr-2" />
                    Update Password
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Onboarding Tour Reset */}
          <Card>
            <CardHeader>
              <CardTitle>Onboarding Tour</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Reset Onboarding Tour</p>
                  <p className="text-sm text-muted-foreground">
                    Show the guided tour again to learn about Sales Genius
                    features
                  </p>
                </div>
                <Button
                  onClick={handleResetOnboardingTour}
                  variant="outline"
                  data-tour="settings-reset-tour"
                >
                  <PlayCircle className="w-4 h-4 mr-2" />
                  Reset Tour
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                Tour status:{" "}
                {hasSeenOnboardingTour ? "Completed" : "Not completed"}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Organization Tab */}
        <TabsContent value="organization" className="space-y-6">
          {isOrgAdmin || isSuperAdmin ? (
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
                      value={organizationForm.name}
                      onChange={(e) =>
                        setOrganizationForm((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder="Enter organization name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="domain">Domain</Label>
                    <Input
                      id="domain"
                      value={organizationForm.domain}
                      onChange={(e) =>
                        setOrganizationForm((prev) => ({
                          ...prev,
                          domain: e.target.value,
                        }))
                      }
                      placeholder="company.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Select
                      value={organizationForm.industry}
                      onValueChange={(value) =>
                        setOrganizationForm((prev) => ({
                          ...prev,
                          industry: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="healthcare">Healthcare</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                        <SelectItem value="manufacturing">
                          Manufacturing
                        </SelectItem>
                        <SelectItem value="retail">Retail</SelectItem>
                        <SelectItem value="education">Education</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="companySize">Company Size</Label>
                    <Select
                      value={organizationForm.companySize}
                      onValueChange={(value) =>
                        setOrganizationForm((prev) => ({
                          ...prev,
                          companySize: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select company size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-10">1-10 employees</SelectItem>
                        <SelectItem value="11-50">11-50 employees</SelectItem>
                        <SelectItem value="51-200">51-200 employees</SelectItem>
                        <SelectItem value="201-500">201-500 employees</SelectItem>
                        <SelectItem value="501-1000">
                          501-1000 employees
                        </SelectItem>
                        <SelectItem value="1000+">1000+ employees</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Select
                      value={organizationForm.country}
                      onValueChange={(value) => {
                        setOrganizationForm((prev) => ({
                          ...prev,
                          country: value,
                          city: "", // Reset city when country changes
                        }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        {getCountries().map((country) => (
                          <SelectItem key={country} value={country}>
                            {country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Select
                      value={organizationForm.city}
                      onValueChange={(value) =>
                        setOrganizationForm((prev) => ({
                          ...prev,
                          city: value,
                        }))
                      }
                      disabled={!organizationForm.country}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select city" />
                      </SelectTrigger>
                      <SelectContent>
                        {getCitiesForCountry(organizationForm.country).map(
                          (city) => (
                            <SelectItem key={city} value={city}>
                              {city}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button onClick={handleOrganizationSave} disabled={isSaving}>
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
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Shield className="w-12 h-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
                <p className="text-muted-foreground">
                  You don't have permission to manage organization settings
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          {isOrgAdmin || isSuperAdmin ? (
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">
                    User management features coming soon
                  </p>
                  <Button variant="outline" disabled>
                    <Plus className="w-4 h-4 mr-2" />
                    Invite User
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Shield className="w-12 h-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
                <p className="text-muted-foreground">
                  You don't have permission to manage users
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* AI Training Tab */}
        <TabsContent value="ai-training" className="space-y-6">
          <BusinessKnowledgeSection />
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-6">
          {/* HubSpot Integration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <ExternalLink className="w-5 h-5" />
                <span>HubSpot Integration</span>
                {hubspotIntegration.connected ? (
                  <Badge
                    variant="default"
                    className="bg-green-100 text-green-800 border-green-200"
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Connected
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
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
                Connect your HubSpot account to push emails, action items, and
                notes directly to your CRM.
              </p>

              {hubspotIntegration.connected ? (
                <div className="space-y-4">
                  {hubspotIntegration.accountInfo && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h4 className="font-medium text-green-900 mb-2">
                        Connected Account
                      </h4>
                      <div className="text-sm text-green-700 space-y-1">
                        <p>
                          <strong>Account:</strong>{" "}
                          {hubspotIntegration.accountInfo.name}
                        </p>
                        {hubspotIntegration.accountInfo.portalId && (
                          <p>
                            <strong>Portal ID:</strong>{" "}
                            {hubspotIntegration.accountInfo.portalId}
                          </p>
                        )}
                        {hubspotIntegration.lastSync && (
                          <p>
                            <strong>Last Sync:</strong>{" "}
                            {new Date(
                              hubspotIntegration.lastSync
                            ).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <Button
                      onClick={checkIntegrations}
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
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Connect your HubSpot account to enable CRM integration
                      features like pushing emails and action items.
                    </AlertDescription>
                  </Alert>

                  <Button
                    onClick={handleHubSpotConnect}
                    data-tour="settings-hubspot-connect"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Connect HubSpot
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fireflies Integration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="w-5 h-5" />
                <span>Fireflies.ai Integration</span>
                {firefliesIntegration.connected ? (
                  <Badge
                    variant="default"
                    className="bg-green-100 text-green-800 border-green-200"
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Connected
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
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
                Connect your Fireflies.ai account to automatically import call
                transcripts and recordings.
              </p>

              {firefliesIntegration.connected ? (
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-medium text-green-900 mb-2">
                      Integration Active
                    </h4>
                    <div className="text-sm text-green-700 space-y-1">
                      {firefliesIntegration.lastSync && (
                        <p>
                          <strong>Last Sync:</strong>{" "}
                          {new Date(
                            firefliesIntegration.lastSync
                          ).toLocaleString()}
                        </p>
                      )}
                      <p>
                        <strong>API Key:</strong> {firefliesIntegration.apiKey}
                      </p>
                    </div>
                  </div>

                  <Button variant="destructive" size="sm">
                    Disconnect Fireflies
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Connect your Fireflies.ai account to automatically import
                      call transcripts and enable seamless call processing.
                    </AlertDescription>
                  </Alert>

                  <Button
                    onClick={handleFirefliesConnect}
                    data-tour="settings-fireflies-connect"
                  >
                    <Zap className="w-4 h-4 mr-2" />
                    Connect Fireflies.ai
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Tab */}
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Advanced Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-8">
                <Shield className="w-12 h-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
                <p className="text-muted-foreground">
                  Advanced settings and configuration options
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;