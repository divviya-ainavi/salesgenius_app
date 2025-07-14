import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Settings as SettingsIcon,
  Shield,
  Users,
  Brain,
  Upload,
  Download,
  Trash2,
  Edit,
  Save,
  X,
  Plus,
  Eye,
  EyeOff,
  Key,
  Globe,
  Building,
  User,
  Bell,
  Database,
  Cloud,
  Lock,
  Unlock,
  CheckCircle,
  AlertCircle,
  Info,
  Crown,
  UserCheck,
  FileText,
  BarChart3,
  Zap,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useDispatch, useSelector } from "react-redux";
import { dbHelpers, CURRENT_USER, authHelpers } from "@/lib/supabase";
import {
  setCompany_size,
  setGetOrgList,
  setGetUsersList,
  setIndustry,
  setSales_methodology,
} from "../store/slices/orgSlice";
import {
  setOrganizationDetails,
  setUser,
  setHubspotIntegration,
} from "../store/slices/authSlice";
import { getCountries, getCitiesForCountry } from "@/data/countriesAndCities";
import { config } from "@/lib/config";

// Mock user data - in real app this would come from auth context
const mockCurrentUser = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  email: "john.smith@acmecorp.com",
  role: "client_admin", // super_admin, client_admin, app_user
  organizationId: "org-acme-corp",
  organizationName: "Acme Corp",
  permissions: [
    "manage_users",
    "manage_org_settings",
    "upload_org_materials",
    "view_org_analytics",
  ],
};

// User roles configuration
const userRoles = {
  super_admin: {
    label: "Super Admin",
    icon: Crown,
    color: "bg-purple-100 text-purple-800 border-purple-200",
    description: "Platform administrator with global access",
    permissions: ["all"],
  },
  client_admin: {
    label: "Organization Admin",
    icon: UserCheck,
    color: "bg-blue-100 text-blue-800 border-blue-200",
    description: "Organization-level administrator",
    permissions: [
      "manage_users",
      "manage_org_settings",
      "upload_org_materials",
      "view_org_analytics",
    ],
  },
  app_user: {
    label: "Application User",
    icon: User,
    color: "bg-green-100 text-green-800 border-green-200",
    description: "Individual user with personal access",
    permissions: [
      "view_personal_analytics",
      "upload_personal_materials",
      "manage_personal_settings",
    ],
  },
};

// Mock organization users
const mockOrgUsers = [
  {
    id: "1",
    email: "sarah.johnson@acmecorp.com",
    name: "Sarah Johnson",
    role: "app_user",
    status: "active",
    lastLogin: "2024-01-15T10:30:00Z",
    joinedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "2",
    email: "mike.chen@acmecorp.com",
    name: "Mike Chen",
    role: "app_user",
    status: "active",
    lastLogin: "2024-01-14T15:45:00Z",
    joinedAt: "2024-01-02T00:00:00Z",
  },
  {
    id: "3",
    email: "lisa.rodriguez@acmecorp.com",
    name: "Lisa Rodriguez",
    role: "app_user",
    status: "pending",
    lastLogin: null,
    joinedAt: "2024-01-14T00:00:00Z",
  },
];

// Mock training materials
const mockTrainingMaterials = {
  general: [
    {
      id: "1",
      name: "B2B Sales Best Practices 2024",
      type: "document",
      size: "2.4 MB",
      uploadedAt: "2024-01-10",
      status: "processed",
    },
    {
      id: "2",
      name: "Industry Insights - SaaS Sales",
      type: "video",
      size: "45.2 MB",
      uploadedAt: "2024-01-08",
      status: "processing",
    },
    {
      id: "3",
      name: "Sales Methodology Frameworks",
      type: "document",
      size: "1.8 MB",
      uploadedAt: "2024-01-05",
      status: "processed",
    },
  ],
  business: [
    {
      id: "4",
      name: "Acme Corp Sales Playbook",
      type: "document",
      size: "5.2 MB",
      uploadedAt: "2024-01-12",
      status: "processed",
    },
    {
      id: "5",
      name: "Product Demo Scripts",
      type: "document",
      size: "1.1 MB",
      uploadedAt: "2024-01-10",
      status: "processed",
    },
    {
      id: "6",
      name: "Competitive Analysis 2024",
      type: "presentation",
      size: "8.7 MB",
      uploadedAt: "2024-01-08",
      status: "processed",
    },
    {
      id: "7",
      name: "Customer Success Stories",
      type: "document",
      size: "3.4 MB",
      uploadedAt: "2024-01-06",
      status: "processed",
    },
  ],
  personal: [
    {
      id: "8",
      name: "My Sales Techniques",
      type: "document",
      size: "0.8 MB",
      uploadedAt: "2024-01-14",
      status: "processed",
    },
    {
      id: "9",
      name: "Personal Call Notes Template",
      type: "document",
      size: "0.3 MB",
      uploadedAt: "2024-01-12",
      status: "processed",
    },
  ],
};

export const Settings = () => {
  const createJWT = (payload, secret = "SG", type) => {
    const header = {
      alg: "HS256",
      typ: "JWT",
    };

    const base64UrlEncode = (obj) => {
      return btoa(JSON.stringify(obj))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=/g, "");
    };

    // Set expiration time for 24 hours if type is 'invite'
    const now = Math.floor(Date.now() / 1000);
    const payloadWithExp = {
      ...payload,
      ...(type === "invite" && { exp: now + 86400 }), // 86400 seconds = 24 hours
    };

    const encodedHeader = base64UrlEncode(header);
    const encodedPayload = base64UrlEncode(payloadWithExp);

    const signature = btoa(`${encodedHeader}.${encodedPayload}.${secret}`)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  };

  const {
    userProfileInfo,
    userRole,
    userRoleId,
    titleName,
    organizationDetails,
    user,
    hubspotIntegration,
  } = useSelector((state) => state.auth);
  const {
    company_size,
    sales_methodology,
    industry,
    roles,
    allTitles,
    getUserslist,
    getOrgList,
    allStatus,
  } = useSelector((state) => state.org);
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState(
    allTitles?.find((f) => f.role_id != 2)?.id
  );
  const [orgUsers, setOrgUsers] = useState(mockOrgUsers);
  const [trainingMaterials, setTrainingMaterials] = useState(
    mockTrainingMaterials
  );

  // Password change state
  const [passwordChange, setPasswordChange] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [availableCities, setAvailableCities] = useState([]);
  const [countryOpen, setCountryOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [countrySearchValue, setCountrySearchValue] = useState("");
  const [citySearchValue, setCitySearchValue] = useState("");

  const dispatch = useDispatch();

  // console.log(
  //   userProfileInfo,
  //   userRole,
  //   userRoleId,
  //   titleName,
  //   organizationDetails,
  //   "org details",
  //   user,
  //   "check user details"
  // );
  // console.log(allTitles, "all titles");
  // Profile settings state
  const [profileSettings, setProfileSettings] = useState({
    name: user?.full_name,
    email: user?.email,
    timezone: "Europe/London",
    language: "en",
    notifications: {
      email: true,
      push: true,
      weekly_reports: true,
      ai_insights: true,
    },
  });

  console.log(newUserRole, "new user role");
  // console.log(
  //   userProfileInfo,
  //   userRole,
  //   userRoleId,
  //   titleName,
  //   organizationDetails,
  //   user,
  //   "technology details"
  // );

  // console.log(organizationDetails, "check org details");
  // Organization settings state
  const [orgSettings, setOrgSettings] = useState({
    name: organizationDetails?.name,
    domain: organizationDetails?.domain || "",
    industry: organizationDetails?.industry?.id || "Technology",
    size: organizationDetails?.company_size?.id || "1-10",
    default_methodology: organizationDetails?.sales_methodology?.id,
    ai_training_enabled: false,
    data_retention_days: 365,
    require_2fa: false,
    country: organizationDetails?.country,
    city: organizationDetails?.city,
  });

  // Security settings state
  const [securitySettings, setSecuritySettings] = useState({
    two_factor_enabled: false,
    session_timeout: 480, // minutes
    password_policy: "strong",
    api_access_enabled: true,
    audit_logging: true,
  });

  // HubSpot integration state
  const [hubspotToken, setHubspotToken] = useState("");
  const [hubspotError, setHubspotError] = useState("");
  const [isCheckingHubSpot, setIsCheckingHubSpot] = useState(false);
  const [isEditingHubspot, setIsEditingHubspot] = useState(false);
  const [hasExistingToken, setHasExistingToken] = useState(false);

  const currentUserRole = userRoles[mockCurrentUser.role];
  const canManageUsers = mockCurrentUser.permissions.includes("manage_users");
  const canManageOrgSettings = mockCurrentUser.permissions.includes(
    "manage_org_settings"
  );
  const canUploadOrgMaterials = mockCurrentUser.permissions.includes(
    "upload_org_materials"
  );
  const canViewOrgAnalytics =
    mockCurrentUser.permissions.includes("view_org_analytics");

  useEffect(() => {
    if (orgSettings.country) {
      const cities = getCitiesForCountry(orgSettings.country);
      setAvailableCities(cities);
    } else {
      setAvailableCities([]);
    }
  }, [orgSettings.country]);

  // Load HubSpot integration status
  useEffect(() => {
    const loadHubSpotStatus = async () => {
      if (organizationDetails?.id) {
        try {
          const hubspotStatus = await authHelpers.getOrganizationHubSpotStatus(
            organizationDetails.id
          );

          dispatch(
            setHubspotIntegration({
              connected: hubspotStatus.connected,
              lastSync: hubspotStatus.connected
                ? new Date().toISOString()
                : null,
              accountInfo: hubspotStatus.connected
                ? {
                    maskedToken: hubspotStatus.encryptedToken
                      ? "xxxxx" + hubspotStatus.encryptedToken.slice(-4)
                      : null,
                  }
                : null,
            })
          );
        } catch (error) {
          console.error("Error loading HubSpot status:", error);
        }
      }
    };

    loadHubSpotStatus();
  }, [organizationDetails?.id, dispatch]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        let users = [];

        if (user?.title_id == null) {
          // Super Admin
          const allOrgs = await dbHelpers.getAllOrganizations();
          // console.log(allOrgs, "all orgs 445");
          // users = allOrgs.flatMap((org) =>
          //   org.profiles.map((profile) => ({
          //     ...profile,
          //     name: profile.full_name,
          //     organization: org.name,
          //   }))
          // );
          dispatch(setGetOrgList(allOrgs));
        } else if (userRole?.id === 2 || userRoleId === 2) {
          // Org Admin
          const profiles = await dbHelpers.getUsersByOrganizationId(
            organizationDetails?.id
          );
          // users = profiles.map((profile) => ({
          //   ...profile,
          //   name: profile.full_name,
          // }));
          dispatch(setGetUsersList(profiles));
        }

        // setGetUsersList(users);
      } catch (err) {
        console.error("Error fetching users:", err.message);
      }
    };

    fetchUsers();
  }, [user, userRole, userRoleId, organizationDetails?.id]);

  // console.log(getOrgList, getUserslist, "get org and users list");

  const handleSaveProfile = async () => {
    try {
      // Check if user ID is available
      const userId = user?.id || CURRENT_USER?.id;

      if (!userId) {
        toast.error(
          "Unable to update profile: User session not found. Please try logging out and logging back in."
        );
        return;
      }

      // Validate required fields
      if (!profileSettings.name?.trim()) {
        toast.error("Name is required");
        return;
      }

      if (!profileSettings.email?.trim()) {
        toast.error("Email is required");
        return;
      }

      const updatedProfile = await dbHelpers.updateUserProfile(userId, {
        name: profileSettings.name,
        email: profileSettings.email,
        // timezone: profileSettings.timezone,
        // language: profileSettings.language,
      });

      // 🔄 Update Redux state
      dispatch(
        setUser({
          ...user,
          full_name: updatedProfile.full_name,
          email: updatedProfile.email,
        })
      );

      setIsEditing(false);
      toast.success("Profile settings saved successfully");
    } catch (err) {
      console.error("Error updating user profile:", err);
      toast.error("Failed to update profile. Please try again.");
    }
  };

  const handleSaveOrgSettings = async () => {
    const dataToUpdate = {
      name: orgSettings?.name,
      domain: orgSettings?.domain || "",
      industry_id: orgSettings.industry,
      company_size_id: orgSettings.size,
      sales_methodology_id: orgSettings.default_methodology,
      country: orgSettings.country,
      city: orgSettings.city,
    };
    const response = await dbHelpers.updateOrganizationSettings(
      organizationDetails.id,
      dataToUpdate
    );

    if (response.success) {
      // console.log("Organization settings updated:", response?.data);
      dispatch(
        setOrganizationDetails({
          ...organizationDetails,
          name: response.data?.name,
          domain: response.data?.domain || "",
          industry_id: response.data.industry_id,
          company_size_id: response.data.company_size_id,
          sales_methodology_id: response.data.sales_methodology_id,
          country: response.data.country,
          city: response.data.city,
        })
      );
      toast.success("Organization settings updated successfully");
    } else {
      toast.error("Failed to update organization settings");
    }
  };
  // console.log(organizationDetails, "Organization settings updated:387");
  const handleSaveSecurity = () => {
    toast.success("Security settings saved successfully");
  };

  const validatePasswordChange = () => {
    const errors = {};

    // Current password validation
    if (!passwordChange.currentPassword.trim()) {
      errors.currentPassword = "Current password is required";
    }

    // New password validation
    if (!passwordChange.newPassword.trim()) {
      errors.newPassword = "New password is required";
    } else if (passwordChange.newPassword.length < 8) {
      errors.newPassword = "New password must be at least 8 characters";
    } else if (
      !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordChange.newPassword)
    ) {
      errors.newPassword =
        "Password must contain at least one uppercase letter, one lowercase letter, and one number";
    }

    // Confirm password validation
    if (!passwordChange.confirmPassword.trim()) {
      errors.confirmPassword = "Please confirm your new password";
    } else if (passwordChange.newPassword !== passwordChange.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    // Check if new password is same as current
    if (passwordChange.currentPassword === passwordChange.newPassword) {
      errors.newPassword =
        "New password must be different from current password";
    }

    return errors;
  };

  const handlePasswordChange = async () => {
    const errors = validatePasswordChange();
    setPasswordErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsChangingPassword(true);

    try {
      const userId = user?.id || CURRENT_USER?.id;

      if (!userId) {
        toast.error("Unable to change password: User session not found");
        return;
      }

      // First verify current password
      try {
        await authHelpers.loginWithCustomPassword(
          user.email,
          passwordChange.currentPassword
        );
      } catch (error) {
        setPasswordErrors({ currentPassword: "Current password is incorrect" });
        return;
      }

      // Update password in database
      await authHelpers.updateUserProfile(userId, {
        password: passwordChange.newPassword,
      });

      // Clear form
      setPasswordChange({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordErrors({});

      toast.success("Password changed successfully");
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error("Failed to change password. Please try again.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleInviteUser = async () => {
    const email = newUserEmail.trim();
    if (!email) {
      toast.error("Please enter a valid email address");
      return;
    }

    const token = createJWT({ email }, "SG", "invite");

    const result = await dbHelpers.inviteUserByEmail(
      email,
      organizationDetails?.id || CURRENT_USER.organization_id || null,
      newUserRole,
      token
    );

    if (result.status === "invited" || result.status === "re-invited") {
      const formData = new FormData();
      formData.append("id", result?.id);
      const response = await fetch(
        `${config.api.baseUrl}${config.api.endpoints.userInvite}`,
        {
          method: "POST",
          body: formData,
        }
      );
      // console.log(response, "check response");
      toast.success(
        `Invitation ${
          result.status === "re-invited" ? "re-" : ""
        }sent to ${email}`
      );
      // console.log("Invite ID:", result.id); // optional for webhook trigger
    } else if (result.status === "already-invited") {
      toast.info("User was already invited within the last 24 hours");
    } else {
      toast.error(result.message || "Failed to invite user");
    }

    setNewUserEmail("");
    setNewUserRole(null);
  };

  const handleRemoveUser = (userId: string) => {
    setOrgUsers((prev) => prev.filter((user) => user.id !== userId));
    toast.success("User removed from organization");
  };

  const handleFileUpload = async (
    file: File,
    category: "general" | "business" | "personal"
  ) => {
    if (!file) return;

    // Check permissions
    if (category === "general" && mockCurrentUser.role !== "super_admin") {
      toast.error("Only Super Admins can upload general materials");
      return;
    }
    if (category === "business" && !canUploadOrgMaterials) {
      toast.error("You do not have permission to upload business materials");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Simulate upload delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Add to materials list
      const newMaterial = {
        id: Date.now().toString(),
        name: file.name,
        type: file.type.includes("video")
          ? "video"
          : file.type.includes("presentation")
          ? "presentation"
          : "document",
        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        uploadedAt: new Date().toISOString().split("T")[0],
        status: "processing",
      };

      setTrainingMaterials((prev) => ({
        ...prev,
        [category]: [...prev[category], newMaterial],
      }));

      // Simulate processing completion
      setTimeout(() => {
        setTrainingMaterials((prev) => ({
          ...prev,
          [category]: prev[category].map((material) =>
            material.id === newMaterial.id
              ? { ...material, status: "processed" }
              : material
          ),
        }));
        toast.success("File processed and ready for AI training");
      }, 3000);

      toast.success("File uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload file");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteMaterial = (
    materialId: string,
    category: "general" | "business" | "personal"
  ) => {
    setTrainingMaterials((prev) => ({
      ...prev,
      [category]: prev[category].filter(
        (material) => material.id !== materialId
      ),
    }));
    toast.success("Training material deleted");
  };

  const generateApiKey = () => {
    const apiKey =
      "sk-" +
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
    navigator.clipboard.writeText(apiKey);
    toast.success("New API key generated and copied to clipboard");
  };

  const validateHubspotToken = async () => {
    if (!hubspotToken) {
      toast.error("No HubSpot access token found");
      return;
    }

    setIsCheckingHubSpot(true);
    setHubspotError("");

    try {
      // Create JWT payload with the access token
      const payload = {
        pat: hubspotToken,
      };

      // Encrypt the token using JWT
      const jwtToken = createJWT(payload);
      const formData = new FormData();
      formData.append("token", jwtToken);

      // Send encrypted token to n8n API
      const response = await fetch(
        `${config.api.baseUrl}${config.api.endpoints.hubspotConnectionCheck}`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(
          `API request failed: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.json();

      if (result.success || result.valid) {
        // Save the encrypted token to organization
        await authHelpers.updateOrganizationHubSpotToken(
          organizationDetails.id,
          hubspotToken
        );

        // Update Redux state
        dispatch(
          setHubspotIntegration({
            connected: true,
            lastSync: new Date().toISOString(),
            accountInfo: {
              maskedToken: "xxxxx" + hubspotToken.slice(-4),
              ...result.account_info,
            },
          })
        );

        toast.success("HubSpot connection verified successfully");
        setHubspotToken(""); // Clear the input field
      } else {
        setHubspotError(
          "Invalid HubSpot token. Please check your token and try again."
        );
        toast.error("HubSpot connection is invalid");
      }
    } catch (error) {
      console.error("Error checking HubSpot connection:", error);
      setHubspotError(`Failed to verify HubSpot connection: ${error.message}`);
      toast.error(`Failed to verify HubSpot connection: ${error.message}`);
    } finally {
      setIsCheckingHubSpot(false);
    }
  };

  const disconnectHubSpot = async () => {
    try {
      await dbHelpers.updateOrganizationHubSpotToken(
        organizationDetails.id,
        null
      );

      dispatch(
        setHubspotIntegration({
          connected: false,
          lastSync: null,
          accountInfo: null,
        })
      );

      toast.success("HubSpot disconnected successfully");
    } catch (error) {
      console.error("Error disconnecting HubSpot:", error);
      toast.error("Failed to disconnect HubSpot");
    }
  };

  const handleEditHubspotToken = () => {
    setIsEditingHubspot(true);
    setHubspotToken(""); // Clear the input field
  };

  const handleCancelEditHubspot = () => {
    setIsEditingHubspot(false);
    setHubspotToken(""); // Clear the input field
  };

  // console.log(
  //   user,
  //   organizationDetails,
  //   "user and org details in settings page"
  // );

  useEffect(() => {
    const fetchDropdowns = async () => {
      const result = await dbHelpers.getOrgDropdownOptions();
      if (result) {
        dispatch(setIndustry(result.industry));
        dispatch(setCompany_size(result.company_size));
        dispatch(setSales_methodology(result.sales_methodology));
      }
    };
    fetchDropdowns();
  }, []);

  // Check if organization has existing HubSpot token
  useEffect(() => {
    if (organizationDetails?.hubspot_encrypted_token) {
      setHasExistingToken(true);
    }
  }, [organizationDetails]);

  const countries = getCountries();
  // const isOrgAdmin = roles
  // console.log(roles, titles)
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center space-x-3">
            <SettingsIcon className="w-8 h-8 text-primary" />
            <span>Settings</span>
          </h1>
          <p className="text-muted-foreground">
            Manage your account, organization, and AI training configurations
          </p>
        </div>

        {/* User Role Badge */}
        <div className="flex items-center space-x-3">
          <Badge
            variant="outline"
            className={cn("text-sm", currentUserRole.color)}
          >
            <currentUserRole.icon className="w-4 h-4 mr-2" />
            {user?.title_name || ""}
          </Badge>
          <div className="text-right">
            <p className="text-sm font-medium">
              {organizationDetails?.name || "Your Organization"}
            </p>
            <p className="text-xs text-muted-foreground">
              {user?.email || "No email provided"}
            </p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="profile" className="flex items-center space-x-2">
            <User className="w-4 h-4" />
            <span>Profile</span>
          </TabsTrigger>
          {canManageOrgSettings && userRoleId == 2 && (
            <TabsTrigger
              value="organization"
              className="flex items-center space-x-2"
            >
              <Building className="w-4 h-4" />
              <span>Organization</span>
            </TabsTrigger>
          )}
          {userRoleId == 2 ||
            (userRoleId == 1 && (
              <TabsTrigger
                value="users"
                className="flex items-center space-x-2"
              >
                <Users className="w-4 h-4" />
                <span>Users</span>
              </TabsTrigger>
            ))}
          <TabsTrigger value="security" className="flex items-center space-x-2">
            <Shield className="w-4 h-4" />
            <span>Security</span>
          </TabsTrigger>
          <TabsTrigger
            value="ai-training"
            className="flex items-center space-x-2"
          >
            <Brain className="w-4 h-4" />
            <span>AI Training</span>
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="flex items-center space-x-2"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Analytics</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile" className="mt-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Personal Information</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      isEditing ? handleSaveProfile() : setIsEditing(true)
                    }
                  >
                    {isEditing ? (
                      <>
                        <Save className="w-4 h-4 mr-1" />
                        Save
                      </>
                    ) : (
                      <>
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </>
                    )}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Full Name
                  </label>
                  <Input
                    value={profileSettings.name}
                    onChange={(e) =>
                      setProfileSettings((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Email Address
                  </label>
                  <Input
                    value={profileSettings.email}
                    onChange={(e) =>
                      setProfileSettings((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    disabled={true}
                    type="email"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Timezone
                    </label>
                    <Select
                      value={profileSettings.timezone}
                      onValueChange={(value) =>
                        setProfileSettings((prev) => ({
                          ...prev,
                          timezone: value,
                        }))
                      }
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Europe/London">
                          London (GMT)
                        </SelectItem>
                        <SelectItem value="America/New_York">
                          New York (EST)
                        </SelectItem>
                        <SelectItem value="America/Los_Angeles">
                          Los Angeles (PST)
                        </SelectItem>
                        <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Language
                    </label>
                    <Select
                      value={profileSettings.language}
                      onValueChange={(value) =>
                        setProfileSettings((prev) => ({
                          ...prev,
                          language: value,
                        }))
                      }
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="w-5 h-5" />
                  <span>Notification Preferences</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Email Notifications</p>
                    <p className="text-xs text-muted-foreground">
                      Receive updates via email
                    </p>
                  </div>
                  <Switch
                    checked={profileSettings.notifications.email}
                    onCheckedChange={(checked) =>
                      setProfileSettings((prev) => ({
                        ...prev,
                        notifications: {
                          ...prev.notifications,
                          email: checked,
                        },
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Push Notifications</p>
                    <p className="text-xs text-muted-foreground">
                      Browser notifications
                    </p>
                  </div>
                  <Switch
                    checked={profileSettings.notifications.push}
                    onCheckedChange={(checked) =>
                      setProfileSettings((prev) => ({
                        ...prev,
                        notifications: { ...prev.notifications, push: checked },
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Weekly Reports</p>
                    <p className="text-xs text-muted-foreground">
                      Performance summaries
                    </p>
                  </div>
                  <Switch
                    checked={profileSettings.notifications.weekly_reports}
                    onCheckedChange={(checked) =>
                      setProfileSettings((prev) => ({
                        ...prev,
                        notifications: {
                          ...prev.notifications,
                          weekly_reports: checked,
                        },
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">AI Insights</p>
                    <p className="text-xs text-muted-foreground">
                      New AI-generated insights
                    </p>
                  </div>
                  <Switch
                    checked={profileSettings.notifications.ai_insights}
                    onCheckedChange={(checked) =>
                      setProfileSettings((prev) => ({
                        ...prev,
                        notifications: {
                          ...prev.notifications,
                          ai_insights: checked,
                        },
                      }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Password Change Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lock className="w-5 h-5" />
                  <span>Change Password</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Current Password *
                  </label>
                  <Input
                    type="password"
                    value={passwordChange.currentPassword}
                    onChange={(e) => {
                      setPasswordChange((prev) => ({
                        ...prev,
                        currentPassword: e.target.value,
                      }));
                      // Clear error when user starts typing
                      if (passwordErrors.currentPassword) {
                        setPasswordErrors((prev) => ({
                          ...prev,
                          currentPassword: "",
                        }));
                      }
                    }}
                    placeholder="Enter your current password"
                    className={
                      passwordErrors.currentPassword ? "border-red-500" : ""
                    }
                  />
                  {passwordErrors.currentPassword && (
                    <p className="text-sm text-red-600 mt-1">
                      {passwordErrors.currentPassword}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    New Password *
                  </label>
                  <Input
                    type="password"
                    value={passwordChange.newPassword}
                    onChange={(e) => {
                      setPasswordChange((prev) => ({
                        ...prev,
                        newPassword: e.target.value,
                      }));
                      // Clear error when user starts typing
                      if (passwordErrors.newPassword) {
                        setPasswordErrors((prev) => ({
                          ...prev,
                          newPassword: "",
                        }));
                      }
                    }}
                    placeholder="Enter your new password"
                    className={
                      passwordErrors.newPassword ? "border-red-500" : ""
                    }
                  />
                  {passwordErrors.newPassword && (
                    <p className="text-sm text-red-600 mt-1">
                      {passwordErrors.newPassword}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Password must be at least 8 characters with uppercase,
                    lowercase, and number
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Confirm New Password *
                  </label>
                  <Input
                    type="password"
                    value={passwordChange.confirmPassword}
                    onChange={(e) => {
                      setPasswordChange((prev) => ({
                        ...prev,
                        confirmPassword: e.target.value,
                      }));
                      // Clear error when user starts typing
                      if (passwordErrors.confirmPassword) {
                        setPasswordErrors((prev) => ({
                          ...prev,
                          confirmPassword: "",
                        }));
                      }
                    }}
                    placeholder="Confirm your new password"
                    className={
                      passwordErrors.confirmPassword ? "border-red-500" : ""
                    }
                  />
                  {passwordErrors.confirmPassword && (
                    <p className="text-sm text-red-600 mt-1">
                      {passwordErrors.confirmPassword}
                    </p>
                  )}
                </div>

                <Button
                  onClick={handlePasswordChange}
                  disabled={
                    isChangingPassword ||
                    !passwordChange.currentPassword ||
                    !passwordChange.newPassword ||
                    !passwordChange.confirmPassword
                  }
                  className="w-full"
                >
                  {isChangingPassword ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Changing Password...
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
          </div>
        </TabsContent>

        {/* Organization Settings */}
        {canManageOrgSettings && (
          <TabsContent value="organization" className="mt-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Organization Details</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSaveOrgSettings}
                    >
                      <Save className="w-4 h-4 mr-1" />
                      Save Changes
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Organization Name
                    </label>
                    <Input
                      value={orgSettings.name}
                      onChange={(e) =>
                        setOrgSettings((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Domain
                    </label>
                    <Input
                      value={orgSettings.domain}
                      onChange={(e) =>
                        setOrgSettings((prev) => ({
                          ...prev,
                          domain: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Industry
                      </label>
                      <Select
                        value={orgSettings.industry}
                        onValueChange={(value) =>
                          setOrgSettings((prev) => ({
                            ...prev,
                            industry: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {industry?.length > 0 &&
                            industry.map((item) => (
                              <SelectItem key={item.id} value={item.id}>
                                {item.label}
                              </SelectItem>
                            ))}

                          {/* <SelectItem value="technology">Technology</SelectItem>
                          <SelectItem value="finance">Finance</SelectItem>
                          <SelectItem value="healthcare">Healthcare</SelectItem>
                          <SelectItem value="manufacturing">
                          Manufacturing
                          </SelectItem>
                          <SelectItem value="retail">Retail</SelectItem>
                          <SelectItem value="other">Other</SelectItem> */}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Company Size
                      </label>
                      <Select
                        value={orgSettings.size}
                        onValueChange={(value) =>
                          setOrgSettings((prev) => ({ ...prev, size: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {company_size?.length > 0 &&
                            company_size.map((item) => (
                              <SelectItem key={item.id} value={item.id}>
                                {item.label}
                              </SelectItem>
                            ))}
                          {/* <SelectItem value="1-10">1-10 employees</SelectItem>
                          <SelectItem value="11-50">11-50 employees</SelectItem>
                          <SelectItem value="50-200">
                            50-200 employees
                          </SelectItem>
                          <SelectItem value="200-1000">
                            200-1000 employees
                          </SelectItem>
                          <SelectItem value="1000+">1000+ employees</SelectItem> */}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium mb-2 block">
                        Country
                      </label>
                      <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={countryOpen}
                            className="w-full justify-between"
                          >
                            {orgSettings.country || "Select country..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput
                              placeholder="Search country..."
                              value={countrySearchValue}
                              onValueChange={setCountrySearchValue}
                            />
                            <CommandList>
                              <CommandEmpty>No country found.</CommandEmpty>
                              <CommandGroup>
                                {getCountries()
                                  .filter((country) =>
                                    country
                                      .toLowerCase()
                                      .includes(
                                        countrySearchValue.toLowerCase()
                                      )
                                  )
                                  .map((country) => (
                                    <CommandItem
                                      key={country}
                                      value={country}
                                      onSelect={(currentValue) => {
                                        setOrgSettings((prev) => ({
                                          ...prev,
                                          country:
                                            currentValue === orgSettings.country
                                              ? ""
                                              : currentValue,
                                          city: "", // Reset city when country changes
                                        }));
                                        setCountryOpen(false);
                                        setCountrySearchValue("");
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          orgSettings.country === country
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                      />
                                      {country}
                                    </CommandItem>
                                  ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium mb-2 block">
                        City
                      </label>
                      <Popover open={cityOpen} onOpenChange={setCityOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={cityOpen}
                            className="w-full justify-between"
                            disabled={!orgSettings.country}
                          >
                            {orgSettings.city ||
                              (orgSettings.country
                                ? "Select city..."
                                : "Select country first")}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput
                              placeholder="Search city..."
                              value={citySearchValue}
                              onValueChange={setCitySearchValue}
                            />
                            <CommandList>
                              <CommandEmpty>No city found.</CommandEmpty>
                              <CommandGroup>
                                {orgSettings.country &&
                                  getCitiesForCountry(orgSettings.country)
                                    .filter((city) =>
                                      city
                                        .toLowerCase()
                                        .includes(citySearchValue.toLowerCase())
                                    )
                                    .map((city) => (
                                      <CommandItem
                                        key={city}
                                        value={city}
                                        onSelect={(currentValue) => {
                                          setOrgSettings((prev) => ({
                                            ...prev,
                                            city:
                                              currentValue === orgSettings.city
                                                ? ""
                                                : currentValue,
                                          }));
                                          setCityOpen(false);
                                          setCitySearchValue("");
                                        }}
                                      >
                                        <Check
                                          className={cn(
                                            "mr-2 h-4 w-4",
                                            orgSettings.city === city
                                              ? "opacity-100"
                                              : "opacity-0"
                                          )}
                                        />
                                        {city}
                                      </CommandItem>
                                    ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Default Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Default Sales Methodology
                    </label>
                    <Select
                      value={orgSettings.default_methodology}
                      onValueChange={(value) =>
                        setOrgSettings((prev) => ({
                          ...prev,
                          default_methodology: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {sales_methodology?.length > 0 &&
                          sales_methodology.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                              {item.label}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* <div>
                    <label className="text-sm font-medium mb-2 block">
                      Data Retention (Days)
                    </label>
                    <Input
                      type="number"
                      value={orgSettings.data_retention_days}
                      onChange={(e) =>
                        setOrgSettings((prev) => ({
                          ...prev,
                          data_retention_days: parseInt(e.target.value),
                        }))
                      }
                    />
                  </div> */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">AI Training Enabled</p>
                      <p className="text-xs text-muted-foreground">
                        Allow AI to learn from organization data
                      </p>
                    </div>
                    <Switch
                      checked={orgSettings.ai_training_enabled}
                      disabled
                      onCheckedChange={(checked) =>
                        setOrgSettings((prev) => ({
                          ...prev,
                          ai_training_enabled: checked,
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Require 2FA</p>
                      <p className="text-xs text-muted-foreground">
                        Mandatory two-factor authentication
                      </p>
                    </div>
                    <Switch
                      checked={orgSettings.require_2fa}
                      disabled
                      onCheckedChange={(checked) =>
                        setOrgSettings((prev) => ({
                          ...prev,
                          require_2fa: checked,
                        }))
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>HubSpot Integration</span>
                    {hubspotIntegration.connected && (
                      <Badge
                        variant="default"
                        className="bg-green-100 text-green-800 border-green-200"
                      >
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Connected
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {hubspotIntegration.connected ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-green-900">
                            HubSpot Successfully Connected
                          </p>
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>

                        {hubspotIntegration.accountInfo?.maskedToken && (
                          <div className="mt-3">
                            <p className="text-xs text-green-700 mb-1">
                              Access Token:
                            </p>
                            <div className="font-mono text-sm bg-white p-2 rounded border border-green-300">
                              {hubspotIntegration.accountInfo.maskedToken}
                            </div>
                          </div>
                        )}

                        {hubspotIntegration.lastSync && (
                          <p className="text-xs text-green-700 mt-2">
                            Last synced:{" "}
                            {new Date(
                              hubspotIntegration.lastSync
                            ).toLocaleString()}
                          </p>
                        )}
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          onClick={disconnectHubSpot}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Disconnect
                        </Button>
                        {/* <Button variant="outline">
                          <RefreshCw className="w-4 h-4 mr-1" />
                          Test Connection
                        </Button> */}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <AlertCircle className="w-5 h-5 text-yellow-600" />
                          <p className="text-sm font-medium text-yellow-900">
                            HubSpot Not Connected
                          </p>
                        </div>
                        <p className="text-xs text-yellow-700">
                          Connect your HubSpot account to enable CRM integration
                          features.
                        </p>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          HubSpot Access Token
                        </label>
                        <Input
                          value={hubspotToken}
                          onChange={(e) => {
                            setHubspotToken(e.target.value);
                            setHubspotError(""); // Clear error when user types
                          }}
                          placeholder="Enter your HubSpot Access Token"
                          disabled={isCheckingHubSpot}
                        />
                        {hubspotError && (
                          <p className="text-sm text-red-600 mt-2">
                            {hubspotError}
                          </p>
                        )}
                      </div>

                      <Button
                        onClick={validateHubspotToken}
                        disabled={!hubspotToken.trim() || isCheckingHubSpot}
                        className="w-full"
                      >
                        {isCheckingHubSpot ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                            Validating Token...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Connect HubSpot
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground">
                    <p className="mb-1">
                      <strong>Note:</strong> You can find your HubSpot Access
                      Token in your HubSpot account under:
                    </p>
                    <p>
                      Settings → Integrations → Private Apps → Create/View Token
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}

        {/* User Management */}
        {canManageUsers && (
          <TabsContent value="users" className="mt-6">
            <div className="space-y-6">
              {/* Invite User */}
              {/* {console.log(
                userRoleId,
                userRole,
                "check details from settings",
                user
              )} */}
              {(userRole?.id == 2 || user?.title_id == null) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Plus className="w-5 h-5" />
                      <span>Invite New User</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-end space-x-4">
                      <div className="flex-1">
                        <label className="text-sm font-medium mb-2 block">
                          Email Address
                        </label>
                        <Input
                          value={newUserEmail}
                          onChange={(e) => setNewUserEmail(e.target.value)}
                          placeholder="user@acmecorp.com"
                          type="email"
                        />
                      </div>
                      {user?.title_id != null && (
                        <div>
                          <label className="text-sm font-medium mb-2 block">
                            Role
                          </label>
                          {/* {console.log(
                            newUserRole,
                            "check new user role",
                            allTitles
                          )} */}
                          <Select
                            value={newUserRole?.toString()}
                            onValueChange={(value) =>
                              setNewUserRole(Number(value))
                            }
                          >
                            <SelectTrigger className="w-48">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              {allTitles
                                ?.filter((f) => f.role_id != 2)
                                ?.map((x) => (
                                  <SelectItem
                                    key={x.id}
                                    value={x.id.toString()}
                                  >
                                    {x.name}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <Button onClick={handleInviteUser}>
                        <Plus className="w-4 h-4 mr-1" />
                        Send Invite
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
              {/* Users List */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>
                      {user?.title_id == null
                        ? "Organizations"
                        : "Organization Users"}
                    </span>
                    <Badge variant="secondary">
                      {user?.title_id == null
                        ? getOrgList?.length + " organizations"
                        : getUserslist?.length + " users"}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {user?.title_id == null ? (
                    <div className="space-y-4">
                      {getOrgList?.length > 0 &&
                        getOrgList?.map((org) => {
                          const role = userRoles[org.role] || {
                            label: "Unknown",
                            icon: User,
                            color: "bg-gray-100 text-gray-700 border-gray-200",
                          };

                          return (
                            <div
                              key={org.id}
                              className="flex items-center justify-between p-4 border border-border rounded-lg"
                            >
                              <div className="flex items-center space-x-4">
                                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                                  <User className="w-5 h-5 text-muted-foreground" />
                                </div>
                                <div>
                                  <p className="font-medium">{org.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {org.domain}
                                  </p>
                                  <div className="flex items-center space-x-2 mt-1">
                                    {org.industry_id && (
                                      <Badge
                                        variant="outline"
                                        className={cn("text-xs", role.color)}
                                      >
                                        <role.icon className="w-3 h-3 mr-1" />
                                        {
                                          industry?.find(
                                            (x) => x.id == org.industry_id
                                          )?.label
                                        }
                                      </Badge>
                                    )}

                                    {org.status_id && (
                                      <Badge
                                        variant={
                                          allStatus?.find(
                                            (x) => x?.id == org.status_id
                                          )?.label === "active"
                                            ? "default"
                                            : "secondary"
                                        }
                                        className="text-xs"
                                      >
                                        {
                                          allStatus?.find(
                                            (x) => x?.id == org.status_id
                                          )?.label
                                        }
                                      </Badge>
                                    )}
                                    {org.organization && (
                                      <Badge
                                        variant="outline"
                                        className="text-xs bg-muted"
                                      >
                                        {org.organization}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <div className="text-right text-sm text-muted-foreground">
                                  {/* <p>
                                    Last login:{" "}
                                    {user.lastLogin
                                      ? new Date(
                                          org.created_at
                                        ).toLocaleDateString()
                                      : "Never"}
                                  </p> */}
                                  <p>
                                    Joined:{" "}
                                    {org.created_at
                                      ? new Date(
                                          org.created_at
                                        ).toLocaleDateString()
                                      : "-"}
                                  </p>
                                </div>
                                {/* <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleRemoveUser(user.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button> */}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {getUserslist?.length > 0 &&
                        getUserslist
                          ?.filter((u) => u.id != user?.id)
                          ?.map((user) => {
                            const getId = allTitles?.find(
                              (x) => x.id == user?.title_id
                            )?.role_id;
                            const role = {
                              label: allTitles?.find(
                                (x) => x.id == user?.title_id
                              )?.name,
                              icon: User,
                              color:
                                getId == 3
                                  ? "bg-purple-100 text-purple-800 border-purple-200"
                                  : getId == 4
                                  ? "bg-blue-100 text-blue-800 border-blue-200"
                                  : "bg-green-100 text-green-800 border-green-200",
                            };

                            return (
                              <div
                                key={user.id}
                                className="flex items-center justify-between p-4 border border-border rounded-lg"
                              >
                                <div className="flex items-center space-x-4">
                                  <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                                    <User className="w-5 h-5 text-muted-foreground" />
                                  </div>
                                  <div>
                                    <p className="font-medium">
                                      {user.full_name}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {user.email}
                                    </p>
                                    <div className="flex items-center space-x-2 mt-1">
                                      <Badge
                                        variant="outline"
                                        className={cn("text-xs", role.color)}
                                      >
                                        <role.icon className="w-3 h-3 mr-1" />
                                        {role?.label}
                                      </Badge>
                                      {user.status_id && (
                                        <Badge
                                          variant={
                                            allStatus?.find(
                                              (x) => x?.id == user.status_id
                                            )?.label === "active"
                                              ? "default"
                                              : "secondary"
                                          }
                                          className="text-xs"
                                        >
                                          {
                                            allStatus?.find(
                                              (x) => x?.id == user.status_id
                                            )?.label
                                          }
                                        </Badge>
                                      )}
                                      {user.organization && (
                                        <Badge
                                          variant="outline"
                                          className="text-xs bg-muted"
                                        >
                                          {user.organization}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <div className="text-right text-sm text-muted-foreground">
                                    {/* <p>
                                      Last login:{" "}
                                      {user.lastLogin
                                        ? new Date(
                                            user.lastLogin
                                          ).toLocaleDateString()
                                        : "Never"}
                                    </p> */}
                                    <p>
                                      Joined:{" "}
                                      {user.created_at
                                        ? new Date(
                                            user.created_at
                                          ).toLocaleDateString()
                                        : "-"}
                                    </p>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleRemoveUser(user.id)}
                                    className="text-destructive hover:text-destructive"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}

        {/* Security Settings */}
        <TabsContent value="security" className="mt-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Authentication & Access</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSaveSecurity}
                  >
                    <Save className="w-4 h-4 mr-1" />
                    Save Changes
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      Two-Factor Authentication
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Add extra security to your account
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings.two_factor_enabled}
                    onCheckedChange={(checked) =>
                      setSecuritySettings((prev) => ({
                        ...prev,
                        two_factor_enabled: checked,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Session Timeout (minutes)
                  </label>
                  <Input
                    type="number"
                    value={securitySettings.session_timeout}
                    onChange={(e) =>
                      setSecuritySettings((prev) => ({
                        ...prev,
                        session_timeout: parseInt(e.target.value),
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Password Policy
                  </label>
                  <Select
                    value={securitySettings.password_policy}
                    onValueChange={(value) =>
                      setSecuritySettings((prev) => ({
                        ...prev,
                        password_policy: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">
                        Basic (8+ characters)
                      </SelectItem>
                      <SelectItem value="strong">
                        Strong (12+ chars, mixed case, numbers)
                      </SelectItem>
                      <SelectItem value="enterprise">
                        Enterprise (16+ chars, symbols required)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">API Access</p>
                    <p className="text-xs text-muted-foreground">
                      Allow API key generation
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings.api_access_enabled}
                    onCheckedChange={(checked) =>
                      setSecuritySettings((prev) => ({
                        ...prev,
                        api_access_enabled: checked,
                      }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Audit Logging</p>
                    <p className="text-xs text-muted-foreground">
                      Track all administrative actions
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings.audit_logging}
                    onCheckedChange={(checked) =>
                      setSecuritySettings((prev) => ({
                        ...prev,
                        audit_logging: checked,
                      }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Key className="w-5 h-5" />
                  <span>API Keys</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">Current API Key</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <div className="font-mono text-sm bg-background p-2 rounded border">
                    {showApiKey
                      ? "sk-1234567890abcdef1234567890abcdef"
                      : "••••••••••••••••••••••••••••••••"}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Created: January 15, 2024 • Last used: 2 hours ago
                  </p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={generateApiKey}
                    className="flex-1"
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    Generate New Key
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => toast.success("API key copied to clipboard")}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">
                  <p>⚠️ Generating a new key will invalidate the current one</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AI Training Materials */}
        <TabsContent value="ai-training" className="mt-6">
          <div className="space-y-6">
            {/* Upload Progress */}
            {isUploading && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3 mb-2">
                    <Upload className="w-5 h-5 text-primary" />
                    <span className="font-medium">
                      Uploading training material...
                    </span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                  <p className="text-sm text-muted-foreground mt-2">
                    {uploadProgress < 50
                      ? "Uploading file..."
                      : uploadProgress < 90
                      ? "Processing content..."
                      : "Finalizing..."}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* General B2B Sales Knowledge */}
            {mockCurrentUser.role === "super_admin" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Globe className="w-5 h-5" />
                    <span>General B2B Sales Knowledge</span>
                    <Badge
                      variant="outline"
                      className="bg-purple-100 text-purple-800 border-purple-200"
                    >
                      Super Admin Only
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Platform-level resources for all organizations (industry
                    best practices, expert insights)
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                      <input
                        type="file"
                        id="general-upload"
                        className="hidden"
                        onChange={(e) =>
                          e.target.files?.[0] &&
                          handleFileUpload(e.target.files[0], "general")
                        }
                        accept=".pdf,.doc,.docx,.txt,.mp4,.mov,.ppt,.pptx"
                      />
                      <label
                        htmlFor="general-upload"
                        className="cursor-pointer"
                      >
                        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm font-medium">
                          Upload General Training Material
                        </p>
                        <p className="text-xs text-muted-foreground">
                          PDF, DOC, TXT, MP4, PPT (Max 100MB)
                        </p>
                      </label>
                    </div>

                    <div className="space-y-2">
                      {trainingMaterials.general.map((material) => (
                        <div
                          key={material.id}
                          className="flex items-center justify-between p-3 border border-border rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <FileText className="w-5 h-5 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">
                                {material.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {material.size} • {material.uploadedAt}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge
                              variant={
                                material.status === "processed"
                                  ? "default"
                                  : "secondary"
                              }
                              className="text-xs"
                            >
                              {material.status === "processed" ? (
                                <>
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Processed
                                </>
                              ) : (
                                <>
                                  <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                                  Processing
                                </>
                              )}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleDeleteMaterial(material.id, "general")
                              }
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Business-Specific Knowledge */}
            {canUploadOrgMaterials && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Building className="w-5 h-5" />
                    <span>Business-Specific Knowledge</span>
                    <Badge
                      variant="outline"
                      className="bg-blue-100 text-blue-800 border-blue-200"
                    >
                      Organization Level
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Company playbooks, product documentation, presentations, and
                    unique selling propositions
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                      <input
                        type="file"
                        id="business-upload"
                        className="hidden"
                        onChange={(e) =>
                          e.target.files?.[0] &&
                          handleFileUpload(e.target.files[0], "business")
                        }
                        accept=".pdf,.doc,.docx,.txt,.mp4,.mov,.ppt,.pptx"
                      />
                      <label
                        htmlFor="business-upload"
                        className="cursor-pointer"
                      >
                        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm font-medium">
                          Upload Business Material
                        </p>
                        <p className="text-xs text-muted-foreground">
                          PDF, DOC, TXT, MP4, PPT (Max 100MB)
                        </p>
                      </label>
                    </div>

                    <div className="space-y-2">
                      {trainingMaterials.business.map((material) => (
                        <div
                          key={material.id}
                          className="flex items-center justify-between p-3 border border-border rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <FileText className="w-5 h-5 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">
                                {material.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {material.size} • {material.uploadedAt}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge
                              variant={
                                material.status === "processed"
                                  ? "default"
                                  : "secondary"
                              }
                              className="text-xs"
                            >
                              {material.status === "processed" ? (
                                <>
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Processed
                                </>
                              ) : (
                                <>
                                  <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                                  Processing
                                </>
                              )}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleDeleteMaterial(material.id, "business")
                              }
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Personal Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Personal Insights</span>
                  <Badge
                    variant="outline"
                    className="bg-green-100 text-green-800 border-green-200"
                  >
                    Personal Level
                  </Badge>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Your personal sales knowledge, experiences, and preferred
                  approaches
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    <input
                      type="file"
                      id="personal-upload"
                      className="hidden"
                      onChange={(e) =>
                        e.target.files?.[0] &&
                        handleFileUpload(e.target.files[0], "personal")
                      }
                      accept=".pdf,.doc,.docx,.txt,.mp4,.mov,.ppt,.pptx"
                    />
                    <label htmlFor="personal-upload" className="cursor-pointer">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm font-medium">
                        Upload Personal Material
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PDF, DOC, TXT, MP4, PPT (Max 50MB)
                      </p>
                    </label>
                  </div>

                  <div className="space-y-2">
                    {trainingMaterials.personal.map((material) => (
                      <div
                        key={material.id}
                        className="flex items-center justify-between p-3 border border-border rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <FileText className="w-5 h-5 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">
                              {material.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {material.size} • {material.uploadedAt}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge
                            variant={
                              material.status === "processed"
                                ? "default"
                                : "secondary"
                            }
                            className="text-xs"
                          >
                            {material.status === "processed" ? (
                              <>
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Processed
                              </>
                            ) : (
                              <>
                                <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                                Processing
                              </>
                            )}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleDeleteMaterial(material.id, "personal")
                            }
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Access */}
        <TabsContent value="analytics" className="mt-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5" />
                  <span>Analytics Access</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {mockCurrentUser.role === "super_admin" && (
                    <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Globe className="w-5 h-5 text-purple-600" />
                        <div>
                          <p className="text-sm font-medium">
                            Platform Analytics
                          </p>
                          <p className="text-xs text-muted-foreground">
                            All organizations and users
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </div>
                  )}

                  {canViewOrgAnalytics && (
                    <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Building className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium">
                            Organization Analytics
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {mockCurrentUser.organizationName} only
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </div>
                  )}

                  <div className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <User className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium">
                          Personal Analytics
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Your individual performance
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <ExternalLink className="w-4 h-4 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Export</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        Export Personal Data
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Download your data in JSON format
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-1" />
                      Export
                    </Button>
                  </div>

                  {canViewOrgAnalytics && (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">
                          Export Organization Data
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Download organization analytics
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-1" />
                        Export
                      </Button>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="text-xs text-muted-foreground">
                  <p className="mb-2">Data Retention Policy:</p>
                  <ul className="space-y-1">
                    <li>• Personal data: Retained until account deletion</li>
                    <li>
                      • Call transcripts: {orgSettings.data_retention_days} days
                    </li>
                    <li>• Analytics data: 2 years</li>
                    <li>• Audit logs: 7 years</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
