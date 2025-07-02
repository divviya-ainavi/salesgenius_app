import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Settings as SettingsIcon,
  User,
  Building,
  Bell,
  Shield,
  Lock,
  Globe,
  Mail,
  ExternalLink,
  Check,
  X,
  Loader2,
  RefreshCw,
  Save,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import { CURRENT_USER, dbHelpers } from "@/lib/supabase";
import { useSelector, useDispatch } from "react-redux";
import { getCountries, getCitiesForCountry } from "@/data/countriesAndCities";
import { usePageTimer } from "../hooks/userPageTimer";

export const Settings = () => {
  usePageTimer("Settings");
  
  const [activeTab, setActiveTab] = useState("account");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hubspotConnected, setHubspotConnected] = useState(false);
  const [hubspotStatus, setHubspotStatus] = useState("checking");
  const [dropdownOptions, setDropdownOptions] = useState(null);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [availableCities, setAvailableCities] = useState([]);
  
  const countries = getCountries();

  // User profile state
  const [userProfile, setUserProfile] = useState({
    name: CURRENT_USER.full_name || "",
    email: CURRENT_USER.email || "",
    role: "Sales Manager",
    organization: "Demo Sales Company",
  });

  // Organization settings state
  const [orgSettings, setOrgSettings] = useState({
    name: "Demo Sales Company",
    domain: "company.com",
    industry: "Technology",
    size: "51-200",
    methodology: "SPIN Selling",
  });

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    callReminders: true,
    followUpReminders: true,
    weeklyDigest: false,
    teamUpdates: true,
  });

  // Security settings state
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    sessionTimeout: "30 minutes",
    passwordExpiry: "90 days",
    ipRestriction: false,
  });

  // Integration settings state
  const [integrationSettings, setIntegrationSettings] = useState({
    hubspotConnected: false,
    hubspotLastSync: null,
    salesforceConnected: false,
    salesforceLastSync: null,
    gmailConnected: true,
    gmailLastSync: "2024-01-15T10:30:00Z",
    outlookConnected: false,
    outlookLastSync: null,
  });

  // Load organization details
  useEffect(() => {
    const fetchOrgDetails = async () => {
      try {
        // Get organization details from Redux store or API
        const orgDetails = {
          name: "Demo Sales Company",
          domain: "company.com",
          industry: "Technology",
          size: "51-200",
          methodology: "SPIN Selling",
          country: "United States",
          city: "San Francisco",
        };

        setOrgSettings(orgDetails);
        
        // Set country and city if available
        if (orgDetails.country) {
          setSelectedCountry(orgDetails.country);
          // Load cities for this country
          const cities = getCitiesForCountry(orgDetails.country);
          setAvailableCities(cities);
          
          // Set city if it exists in the available cities
          if (orgDetails.city && cities.includes(orgDetails.city)) {
            setSelectedCity(orgDetails.city);
          }
        }
        
        // Check HubSpot connection status
        checkHubSpotConnection();
        
        // Fetch dropdown options
        fetchDropdownOptions();
      } catch (error) {
        console.error("Error fetching organization details:", error);
        toast.error("Failed to load organization details");
      }
    };

    fetchOrgDetails();
  }, []);

  // Update available cities when country changes
  useEffect(() => {
    if (selectedCountry) {
      const cities = getCitiesForCountry(selectedCountry);
      setAvailableCities(cities);
      setSelectedCity(""); // Reset city when country changes
    }
  }, [selectedCountry]);

  const fetchDropdownOptions = async () => {
    try {
      const options = await dbHelpers.getOrgDropdownOptions();
      setDropdownOptions(options);
    } catch (error) {
      console.error("Error fetching dropdown options:", error);
    }
  };

  const checkHubSpotConnection = async () => {
    setHubspotStatus("checking");
    try {
      // Simulate API call to check HubSpot connection
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo purposes, we'll use the CURRENT_USER.hubspot_connected value
      const isConnected = CURRENT_USER.hubspot_connected || false;
      
      setHubspotConnected(isConnected);
      setHubspotStatus(isConnected ? "connected" : "disconnected");
      
      // Update integration settings
      setIntegrationSettings(prev => ({
        ...prev,
        hubspotConnected: isConnected,
        hubspotLastSync: isConnected ? new Date().toISOString() : null,
      }));
    } catch (error) {
      console.error("Error checking HubSpot connection:", error);
      setHubspotStatus("error");
    }
  };

  const handleConnectHubSpot = () => {
    // Redirect to HubSpot OAuth flow
    const clientId = import.meta.env.VITE_HUBSPOT_CLIENT_ID;
    const redirectUri = import.meta.env.VITE_HUBSPOT_REDIRECT_URI;
    const scopes = "crm.objects.contacts.write crm.objects.deals.read crm.objects.deals.write crm.objects.contacts.read";
    
    const authUrl = `https://app.hubspot.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}`;
    
    window.location.href = authUrl;
  };

  const handleDisconnectHubSpot = async () => {
    try {
      setIsLoading(true);
      
      // Simulate API call to disconnect HubSpot
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setHubspotConnected(false);
      setHubspotStatus("disconnected");
      
      // Update integration settings
      setIntegrationSettings(prev => ({
        ...prev,
        hubspotConnected: false,
        hubspotLastSync: null,
      }));
      
      toast.success("HubSpot disconnected successfully");
    } catch (error) {
      console.error("Error disconnecting HubSpot:", error);
      toast.error("Failed to disconnect HubSpot");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      
      // Simulate API call to save profile
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update CURRENT_USER with new values
      CURRENT_USER.full_name = userProfile.name;
      CURRENT_USER.email = userProfile.email;
      
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveOrgSettings = async () => {
    try {
      setIsSaving(true);
      
      // Prepare data for update
      const updateData = {
        ...orgSettings,
        country: selectedCountry,
        city: selectedCity
      };
      
      // Simulate API call to save organization settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real implementation, you would update the database
      // await dbHelpers.updateOrganizationSettings(CURRENT_USER.organization_id, updateData);
      
      toast.success("Organization settings updated successfully");
    } catch (error) {
      console.error("Error saving organization settings:", error);
      toast.error("Failed to update organization settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotificationSettings = async () => {
    try {
      setIsSaving(true);
      
      // Simulate API call to save notification settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Notification settings updated successfully");
    } catch (error) {
      console.error("Error saving notification settings:", error);
      toast.error("Failed to update notification settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSecuritySettings = async () => {
    try {
      setIsSaving(true);
      
      // Simulate API call to save security settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Security settings updated successfully");
    } catch (error) {
      console.error("Error saving security settings:", error);
      toast.error("Failed to update security settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account, organization, and application preferences.
        </p>
      </div>

      {/* Settings Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="account" className="flex items-center space-x-2">
            <User className="w-4 h-4" />
            <span>Account</span>
          </TabsTrigger>
          <TabsTrigger value="organization" className="flex items-center space-x-2">
            <Building className="w-4 h-4" />
            <span>Organization</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Bell className="w-4 h-4" />
            <span>Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center space-x-2">
            <Shield className="w-4 h-4" />
            <span>Security</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center space-x-2">
            <Globe className="w-4 h-4" />
            <span>Integrations</span>
          </TabsTrigger>
        </TabsList>

        {/* Account Settings */}
        <TabsContent value="account" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={userProfile.name}
                  onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
                  placeholder="Your full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={userProfile.email}
                  onChange={(e) => setUserProfile({ ...userProfile, email: e.target.value })}
                  placeholder="Your email address"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Input
                  id="role"
                  value={userProfile.role}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Your role is managed by your organization administrator.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="organization">Organization</Label>
                <Input
                  id="organization"
                  value={userProfile.organization}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Your organization is managed by your administrator.
                </p>
              </div>
              <Button onClick={handleSaveProfile} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Organization Settings */}
        <TabsContent value="organization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Organization Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orgName">Organization Name</Label>
                <Input
                  id="orgName"
                  value={orgSettings.name}
                  onChange={(e) => setOrgSettings({ ...orgSettings, name: e.target.value })}
                  placeholder="Organization name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="domain">Domain</Label>
                <Input
                  id="domain"
                  value={orgSettings.domain}
                  onChange={(e) => setOrgSettings({ ...orgSettings, domain: e.target.value })}
                  placeholder="company.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Select
                    value={selectedCountry}
                    onValueChange={setSelectedCountry}
                  >
                    <SelectTrigger id="country">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
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
                    value={selectedCity}
                    onValueChange={setSelectedCity}
                    disabled={!selectedCountry || availableCities.length === 0}
                  >
                    <SelectTrigger id="city">
                      <SelectValue placeholder={!selectedCountry ? "Select country first" : "Select city"} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCities.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Select
                  value={orgSettings.industry}
                  onValueChange={(value) => setOrgSettings({ ...orgSettings, industry: value })}
                >
                  <SelectTrigger id="industry">
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                    <SelectItem value="Healthcare">Healthcare</SelectItem>
                    <SelectItem value="Education">Education</SelectItem>
                    <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="Retail">Retail</SelectItem>
                    <SelectItem value="Professional Services">Professional Services</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="size">Company Size</Label>
                <Select
                  value={orgSettings.size}
                  onValueChange={(value) => setOrgSettings({ ...orgSettings, size: value })}
                >
                  <SelectTrigger id="size">
                    <SelectValue placeholder="Select company size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-10">1-10 employees</SelectItem>
                    <SelectItem value="11-50">11-50 employees</SelectItem>
                    <SelectItem value="51-200">51-200 employees</SelectItem>
                    <SelectItem value="201-500">201-500 employees</SelectItem>
                    <SelectItem value="501-1000">501-1000 employees</SelectItem>
                    <SelectItem value="1001+">1001+ employees</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="methodology">Sales Methodology</Label>
                <Select
                  value={orgSettings.methodology}
                  onValueChange={(value) => setOrgSettings({ ...orgSettings, methodology: value })}
                >
                  <SelectTrigger id="methodology">
                    <SelectValue placeholder="Select sales methodology" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SPIN Selling">SPIN Selling</SelectItem>
                    <SelectItem value="Challenger Sale">Challenger Sale</SelectItem>
                    <SelectItem value="Solution Selling">Solution Selling</SelectItem>
                    <SelectItem value="MEDDIC">MEDDIC</SelectItem>
                    <SelectItem value="Sandler Selling System">Sandler Selling System</SelectItem>
                    <SelectItem value="Value Selling">Value Selling</SelectItem>
                    <SelectItem value="Consultative Selling">Consultative Selling</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSaveOrgSettings} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="emailNotifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications via email
                  </p>
                </div>
                <Switch
                  id="emailNotifications"
                  checked={notificationSettings.emailNotifications}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({ ...notificationSettings, emailNotifications: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="callReminders">Call Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Get reminders for upcoming calls
                  </p>
                </div>
                <Switch
                  id="callReminders"
                  checked={notificationSettings.callReminders}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({ ...notificationSettings, callReminders: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="followUpReminders">Follow-up Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Get reminders for follow-up tasks
                  </p>
                </div>
                <Switch
                  id="followUpReminders"
                  checked={notificationSettings.followUpReminders}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({ ...notificationSettings, followUpReminders: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="weeklyDigest">Weekly Digest</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive a weekly summary of your activity
                  </p>
                </div>
                <Switch
                  id="weeklyDigest"
                  checked={notificationSettings.weeklyDigest}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({ ...notificationSettings, weeklyDigest: checked })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="teamUpdates">Team Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about team activity
                  </p>
                </div>
                <Switch
                  id="teamUpdates"
                  checked={notificationSettings.teamUpdates}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({ ...notificationSettings, teamUpdates: checked })
                  }
                />
              </div>
              <Button onClick={handleSaveNotificationSettings} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="twoFactorAuth">Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security to your account
                  </p>
                </div>
                <Switch
                  id="twoFactorAuth"
                  checked={securitySettings.twoFactorAuth}
                  onCheckedChange={(checked) =>
                    setSecuritySettings({ ...securitySettings, twoFactorAuth: checked })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">Session Timeout</Label>
                <Select
                  value={securitySettings.sessionTimeout}
                  onValueChange={(value) =>
                    setSecuritySettings({ ...securitySettings, sessionTimeout: value })
                  }
                >
                  <SelectTrigger id="sessionTimeout">
                    <SelectValue placeholder="Select session timeout" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15 minutes">15 minutes</SelectItem>
                    <SelectItem value="30 minutes">30 minutes</SelectItem>
                    <SelectItem value="1 hour">1 hour</SelectItem>
                    <SelectItem value="4 hours">4 hours</SelectItem>
                    <SelectItem value="8 hours">8 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="passwordExpiry">Password Expiry</Label>
                <Select
                  value={securitySettings.passwordExpiry}
                  onValueChange={(value) =>
                    setSecuritySettings({ ...securitySettings, passwordExpiry: value })
                  }
                >
                  <SelectTrigger id="passwordExpiry">
                    <SelectValue placeholder="Select password expiry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30 days">30 days</SelectItem>
                    <SelectItem value="60 days">60 days</SelectItem>
                    <SelectItem value="90 days">90 days</SelectItem>
                    <SelectItem value="180 days">180 days</SelectItem>
                    <SelectItem value="Never">Never</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="ipRestriction">IP Restriction</Label>
                  <p className="text-sm text-muted-foreground">
                    Limit access to specific IP addresses
                  </p>
                </div>
                <Switch
                  id="ipRestriction"
                  checked={securitySettings.ipRestriction}
                  onCheckedChange={(checked) =>
                    setSecuritySettings({ ...securitySettings, ipRestriction: checked })
                  }
                />
              </div>
              <Button onClick={handleSaveSecuritySettings} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Settings */}
        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>CRM Integrations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="text-orange-600"
                    >
                      <path
                        d="M19.5 12.5C19.5 11.12 20.62 10 22 10V9C22 5 21 4 17 4H7C3 4 2 5 2 9V9.5C3.38 9.5 4.5 10.62 4.5 12C4.5 13.38 3.38 14.5 2 14.5V15C2 19 3 20 7 20H17C21 20 22 19 22 15C20.62 15 19.5 13.88 19.5 12.5Z"
                        fill="#FF7A59"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium">HubSpot</h3>
                    <p className="text-sm text-muted-foreground">
                      Connect your HubSpot account to sync contacts and deals
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {hubspotStatus === "checking" ? (
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  ) : hubspotStatus === "connected" ? (
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                        <Check className="w-3 h-3 mr-1" />
                        Connected
                      </Badge>
                      <Button variant="outline" size="sm" onClick={handleDisconnectHubSpot} disabled={isLoading}>
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Disconnect"}
                      </Button>
                    </div>
                  ) : (
                    <Button onClick={handleConnectHubSpot} disabled={isLoading}>
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <ExternalLink className="w-4 h-4 mr-1" />
                      )}
                      Connect
                    </Button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="text-blue-600"
                    >
                      <path
                        d="M5 5H19C20.1 5 21 5.9 21 7V17C21 18.1 20.1 19 19 19H5C3.9 19 3 18.1 3 17V7C3 5.9 3.9 5 5 5Z"
                        fill="#009EDB"
                      />
                      <path
                        d="M11.5 12C11.5 12.83 12.17 13.5 13 13.5C13.83 13.5 14.5 12.83 14.5 12C14.5 11.17 13.83 10.5 13 10.5C12.17 10.5 11.5 11.17 11.5 12Z"
                        fill="white"
                      />
                      <path
                        d="M5.5 12C5.5 12.83 6.17 13.5 7 13.5C7.83 13.5 8.5 12.83 8.5 12C8.5 11.17 7.83 10.5 7 10.5C6.17 10.5 5.5 11.17 5.5 12Z"
                        fill="white"
                      />
                      <path
                        d="M17.5 12C17.5 12.83 18.17 13.5 19 13.5C19.83 13.5 20.5 12.83 20.5 12C20.5 11.17 19.83 10.5 19 10.5C18.17 10.5 17.5 11.17 17.5 12Z"
                        fill="white"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium">Salesforce</h3>
                    <p className="text-sm text-muted-foreground">
                      Connect your Salesforce account to sync CRM data
                    </p>
                  </div>
                </div>
                <div>
                  <Button variant="outline">
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Connect
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Email Integrations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <Mail className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">Gmail</h3>
                    <p className="text-sm text-muted-foreground">
                      Connect your Gmail account to send emails
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                    <Check className="w-3 h-3 mr-1" />
                    Connected
                  </Badge>
                  <Button variant="outline" size="sm">
                    Disconnect
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Mail className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">Outlook</h3>
                    <p className="text-sm text-muted-foreground">
                      Connect your Outlook account to send emails
                    </p>
                  </div>
                </div>
                <div>
                  <Button variant="outline">
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Connect
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;