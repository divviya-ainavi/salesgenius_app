import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Loader2,
  Mic,
  Calendar,
  Clock,
  Target,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useDispatch, useSelector } from "react-redux";
import { useDropzone } from "react-dropzone";
import { dbHelpers, CURRENT_USER, authHelpers } from "@/lib/supabase";
import {
  setBusinessKnowledge,
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
import CryptoJS from "crypto-js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import TourManagement from "@/components/admin/TourManagement";
import { BusinessKnowledgeModal } from "@/components/business/BusinessKnowledgeModal";

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
      name: "Sales Playbook",
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
  const [businessKnowledgeData, setBusinessKnowledgeData] = useState(null);
  const [businessOrgData, setBusinessOrgData] = useState(null);
  const [showBusinessKnowledgeModal, setShowBusinessKnowledgeModal] =
    useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [showProcessedFilesModal, setShowProcessedFilesModal] = useState(false);
  const [processedFiles, setProcessedFiles] = useState([]);
  const [
    selectedBusinessKnowledgeForFiles,
    setSelectedBusinessKnowledgeForFiles,
  ] = useState(null);
  const [loadingProcessedFiles, setLoadingProcessedFiles] = useState(false);

  const handleViewProcessedFiles = async (knowledgeData) => {
    try {
      if (
        !knowledgeData.processed_file_ids ||
        knowledgeData.processed_file_ids.length === 0
      ) {
        toast.info(
          "No processed files found for this business knowledge profile"
        );
        setSelectedBusinessKnowledgeForFiles(knowledgeData);
        setLoadingProcessedFiles(true);
        setShowProcessedFilesModal(true);

        return;
      }

      setProcessedFiles([]);
      const files = await dbHelpers.getProcessedFilesByIds(
        knowledgeData.processed_file_ids
      );
      setProcessedFiles(files);
      setProcessedFiles(files || []);
      setShowProcessedFilesModal(true);
    } catch (error) {
      console.error("Error fetching processed files:", error);
      toast.error("Failed to load processed files");
      setProcessedFiles([]);
    } finally {
      setLoadingProcessedFiles(false);
    }
  };

  const handleViewFile = (file) => {
    if (file.file_url) {
      window.open(file.file_url, "_blank");
    } else {
      toast.error("File URL not available");
    }
  };

  const handleDeleteBusinessKnowledge = async (id) => {
    try {
      await dbHelpers.deleteBusinessKnowledgeData(id);
      await loadBusinessKnowledgeData();
      toast.success("Business knowledge profile deleted successfully");
    } catch (error) {
      console.error("Error deleting business knowledge:", error);
      toast.error("Failed to delete business knowledge profile");
    }
  };

  const handleUpdateBusinessKnowledge = async (data) => {
    try {
      // Save business knowledge data to database
      console.log("Saving business knowledge data:", data);

      // Save to database using dbHelpers
      await dbHelpers.updateBusinessKnowledgeData(data);

      // Update local state
      setBusinessKnowledgeData(data);

      toast.success("Business knowledge updated successfully!");
    } catch (error) {
      console.error("Error saving business knowledge:", error);
      toast.error("Failed to save business knowledge");
      throw error;
    }
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
  const [isUpdating, setIsUpdating] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const isSuperAdmin = userRole?.key === "super_admin";
  console.log(isSuperAdmin, "check super admin");
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
  const [isLoading, setIsLoading] = useState(false);

  // Fireflies integration state
  const [firefliesToken, setFirefliesToken] = useState("");
  const [showFirefliesToken, setShowFirefliesToken] = useState(false);
  const [firefliesStatus, setFirefliesStatus] = useState(null);
  const [isConnectingFireflies, setIsConnectingFireflies] = useState(false);
  const [isDisconnectingFireflies, setIsDisconnectingFireflies] =
    useState(false);
  const [internalUploadedFiles, setInternalUploadedFiles] = useState([]);
  const [isUploadingBusiness, setIsUploadingBusiness] = useState(false);
  const [businessUploadProgress, setBusinessUploadProgress] = useState(0);
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [isDeletingBusinessFile, setIsDeletingBusinessFile] = useState(false);
  // const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const dispatch = useDispatch();

  console.log("LoginPage rendered", hubspotIntegration);

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
  // console.log(user, "check user details");
  const [profileSettings, setProfileSettings] = useState({
    name: user?.full_name,
    email: user?.email,
    timezone: user?.timezone || "Europe/London",
    language: user?.language || "en",
    notifications: {
      email: true,
      push: true,
      weekly_reports: true,
      ai_insights: true,
    },
  });

  // console.log(userRoleId, "new user role");
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

  const loadBusinessKnowledgeData = async () => {
    // setIsLoadingInternalFiles(true);
    try {
      const data = await dbHelpers.getBusinessKnowledgeData(
        user?.organization_id,
        user?.id
      );
      console.log(data, "check business knowledge data");
      setBusinessOrgData(data);
      dispatch(setBusinessKnowledge(data));
    } catch (error) {
      console.error("Error loading business knowledge data:", error);
      toast.error("Failed to load business knowledge data");
    } finally {
      // setIsLoadingInternalFiles(false);
    }
  };

  useEffect(() => {
    loadBusinessKnowledgeData();
  }, [businessKnowledgeData]);

  // Load initial data
  useEffect(() => {
    checkFirefliesStatus();
    getInternalUploadedFiles();
  }, []);

  const handleViewBusinessKnowledge = (knowledgeData) => {
    console.log(knowledgeData, "check knowledge data 505");
    setBusinessKnowledgeData(knowledgeData);
    setShowBusinessKnowledgeModal(true);
  };

  const getInternalUploadedFiles = async () => {
    try {
      const data = await dbHelpers.getInternalUploadedFiles(
        organizationDetails?.id
      );

      const updatedData = data.map((item) => ({
        ...item,
        status: "processed",
      }));
      const getActiveData = await dbHelpers.getFilteredFiles();
      console.log(getActiveData, "check active data");
      setInternalUploadedFiles(updatedData);
    } catch (error) {
      console.error("Error checking Fireflies status:", error);
      setInternalUploadedFiles([]);
    }
  };

  const checkFirefliesStatus = async () => {
    try {
      const status = await dbHelpers.getUserFirefliesStatus(user?.id);
      setFirefliesStatus(status);
    } catch (error) {
      console.error("Error checking Fireflies status:", error);
      setFirefliesStatus({ connected: false, hasToken: false });
    }
  };

  const formatFileSize = (bytes) => {
    return `${(bytes / 1024).toFixed(2)} KB`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handleFirefliesConnect = async () => {
    if (!firefliesToken.trim()) {
      toast.error("Please enter a valid Fireflies API token");
      return;
    }

    const payload = {
      pat: firefliesToken.trim(),
    };

    // Encrypt the token using JWT
    const jwtToken = createJWT(payload);
    const formData = new FormData();
    formData.append("token", jwtToken);
    setIsConnectingFireflies(true);

    try {
      // Validate token with Fireflies API
      // const response = await fetch(`${config.api.baseUrl}FF-check`, {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: formData,
      // });
      const response = await fetch(
        `${config.api.baseUrl}${config.api.endpoints.firefliesConnectionCheck}`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Invalid Fireflies token or API error");
      }

      const result = await response.json();

      // Check if the token validation was successful
      // Extract others data from API response
      const othersData = result.others || null;
      console.log("📋 Others data extracted:", othersData);

      if (!result.success && !result.valid) {
        throw new Error("Invalid Fireflies token");
      }

      // Encrypt the token before saving
      const encryptedToken = CryptoJS.AES.encrypt(
        firefliesToken.trim(),
        "SG"
      ).toString();

      const savedData = await dbHelpers.saveBusinessKnowledgeWithOthers(
        user.organization_id,
        user.id,
        result,
        othersData
      );

      // Save encrypted token to database
      await dbHelpers.saveUserFirefliesToken(user?.id, encryptedToken);
      const updatedUser = {
        ...user,
        fireflies_connected: true,
      };

      dispatch(setUser(updatedUser)); // update Redux store
      // Update local state
      setFirefliesStatus({ connected: true, hasToken: true });
      setFirefliesToken("");

      toast.success("Fireflies integration connected successfully!");
    } catch (error) {
      console.error("Error connecting Fireflies:", error);
      toast.error(`Failed to connect Fireflies: ${error.message}`);
    } finally {
      setIsConnectingFireflies(false);
    }
  };
  // console.log(user, "check settings");
  const handleFirefliesDisconnect = async () => {
    setIsDisconnectingFireflies(true);

    try {
      await dbHelpers.deleteUserFirefliesToken(user?.id);
      const updatedUser = {
        ...user,
        fireflies_connected: false,
      };

      dispatch(setUser(updatedUser)); // update Redux store
      setFirefliesStatus({ connected: false, hasToken: false });
      toast.success("Fireflies integration disconnected successfully");
    } catch (error) {
      console.error("Error disconnecting Fireflies:", error);
      toast.error("Failed to disconnect Fireflies integration");
    } finally {
      setIsDisconnectingFireflies(false);
    }
  };

  console.log(hubspotIntegration, "check hubspot user details");

  // Load HubSpot integration status
  useEffect(() => {
    const loadHubSpotStatus = async () => {
      if (organizationDetails?.id) {
        try {
          const hubspotStatus = await authHelpers.getOrganizationHubSpotStatus(
            organizationDetails.id
          );
          const hubspotUserDetails = await dbHelpers.getHubSpotUserDetails(
            user?.id,
            organizationDetails?.id
          );

          dispatch(
            // setHubspotIntegration({
            //   connected: hubspotStatus.connected,
            //   lastSync: hubspotStatus.connected
            //     ? new Date().toISOString()
            //     : null,
            //   accountInfo: hubspotStatus.connected
            //     ? {
            //         maskedToken: hubspotStatus.encryptedToken
            //           ? "xxxxx" + hubspotStatus.encryptedToken.slice(-4)
            //           : null,
            //       }
            //     : null,
            // })
            setHubspotIntegration({
              connected: hubspotStatus.connected,
              hubspotUserId: hubspotUserDetails?.hubspot_user_id || null,
              hubspotUserDetails: hubspotUserDetails,
              lastSync: hubspotStatus.connected
                ? new Date().toISOString()
                : null,
              accountInfo: hubspotStatus.connected
                ? {
                    maskedToken: hubspotStatus.encryptedToken
                      ? "xxxxx" + hubspotStatus.encryptedToken.slice(-4)
                      : null,
                    userEmail: hubspotUserDetails?.email || null,
                    userName: hubspotUserDetails
                      ? `${hubspotUserDetails.first_name} ${hubspotUserDetails.last_name}`.trim()
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
  console.log(userRoleId, user?.title_id, "check user role id and title id");
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        let users = [];

        if (user?.title_id == 45) {
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

  // console.log(profileSettings, "get org and users list");

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
        timezone: profileSettings.timezone,
        language: profileSettings.language,
      });

      // 🔄 Update Redux state
      dispatch(
        setUser({
          ...user,
          full_name: updatedProfile.full_name,
          email: updatedProfile.email,
          timezone: updatedProfile.timezone,
          language: updatedProfile.language,
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
    setIsLoading(true);
    const email = newUserEmail.trim();
    if (!email) {
      setIsLoading(false);
      toast.error("Please enter a valid email address");
      return;
    }

    const token = createJWT({ email }, "SG", "invite");

    const result = await dbHelpers.inviteUserByEmail(
      email,
      organizationDetails?.id || CURRENT_USER.organization_id || null,
      newUserRole,
      token,
      user?.id
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
      setIsLoading(false);
      // console.log("Invite ID:", result.id); // optional for webhook trigger
    } else if (result.status === "registered") {
      toast.info("User is already registered.");
      setIsLoading(false);
    } else if (result.status === "already-invited") {
      toast.info("User was already invited within the last 24 hours");
      setIsLoading(false);
    } else {
      toast.error(result.message || "Failed to invite user");
      setIsLoading(false);
    }

    setNewUserEmail("");

    setNewUserRole(null);
  };

  // Drag and drop configuration for business files
  const onDropBusiness = (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      handleFileUpload(acceptedFiles, "business");
    }
  };

  const {
    getRootProps: getBusinessRootProps,
    getInputProps: getBusinessInputProps,
    isDragActive: isBusinessDragActive,
  } = useDropzone({
    onDrop: onDropBusiness,
    accept: {
      "application/pdf": [".pdf"],
      // "application/msword": [".doc"],
      // "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      //   [".docx"],
      "text/plain": [".txt"],
      // "application/vnd.ms-powerpoint": [".ppt"],
      // "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      //   [".pptx"],
    },
    multiple: true,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: isUploadingBusiness,
  });

  const handleRemoveUser = (userId) => {
    setOrgUsers((prev) => prev.filter((user) => user.id !== userId));
    toast.success("User removed from organization");
  };

  const handleDeleteClick = (material) => {
    setFileToDelete(material);
    setShowDeleteConfirmDialog(true);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirmDialog(false);
    setFileToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!fileToDelete) return;

    setIsDeletingBusinessFile(true);
    try {
      await handleDeleteBusinessKnowledge(fileToDelete.id);
      setShowDeleteConfirmDialog(false);
      setFileToDelete(null);
    } catch (error) {
      console.error("Error deleting file:", error);
      toast.error("Failed to delete file");
    } finally {
      setIsDeletingBusinessFile(false);
    }
  };

  const handleFileUpload = async (files, category) => {
    if (!files || files.length === 0) return;

    // Convert single file to array for consistency
    const fileArray = Array.isArray(files) ? files : [files];

    // Check permissions
    if (category === "business" && !canUploadOrgMaterials) {
      toast.error("You do not have permission to upload business materials");
      return;
    }

    console.log(
      `📁 Uploading ${fileArray.length} file(s) for category: ${category}`
    );

    if (category === "business") {
      setIsUploadingBusiness(true);
      setBusinessUploadProgress(0);
    } else {
      setIsUploading(true);
      setUploadProgress(0);
    }

    const uploadedFileRecords = [];

    try {
      // Upload progress simulation
      const progressInterval = setInterval(() => {
        if (category === "business") {
          setBusinessUploadProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        } else {
          setUploadProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }
      }, 200);

      // Save all uploaded files to database first

      // Prepare FormData with all files
      const formData = new FormData();
      formData.append("type", "org");

      // Append all files to the same FormData
      fileArray.forEach((file, index) => {
        formData.append(`data`, file);
      });

      // Add metadata
      formData.append("organization_id", organizationDetails.id);
      formData.append("organization_name", organizationDetails.name);
      formData.append("file_count", fileArray.length.toString());

      // Send encrypted token to n8n API
      const response = await fetch(
        `${config.api.baseUrl}${config.api.endpoints.fileUpload}`,
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

      const apiData = await response.json();
      // Check if we have business knowledge data in the response
      if (apiData && Array.isArray(apiData) && apiData.length > 0) {
        const businessData = apiData[0];
        console.log("📋 Business Knowledge Data:", businessData);

        // Store the business knowledge data in database
        try {
          for (const file of fileArray) {
            const uploadedFile = await dbHelpers?.saveInternalUploadedFile(
              user?.id,
              file,
              organizationDetails.id
            );
            uploadedFileRecords.push(uploadedFile);
          }
          const fileIds = uploadedFileRecords.map((file) => file.id);
          const savedData = await dbHelpers.saveBusinessKnowledgeData(
            businessData,
            user?.organization_id,
            user?.id,
            fileIds
          );
          setBusinessKnowledgeData(savedData);
          setShowBusinessKnowledgeModal(true);
          // const getalldata = await dbHelpers.getBusinessKnowledgeByOrgId(
          //   user.organization_id
          // );

          // if (getalldata) {
          //   dispatch(setBusinessKnowledge(getalldata));
          // }
        } catch (dbError) {
          console.error(
            "❌ Error saving business knowledge to database:",
            dbError
          );
          // Continue with popup display even if DB save fails
        }

        toast.success(
          `Business knowledge extracted from ${fileArray.length} file(s)! Review the data below.`
        );
      } else {
        console.log(
          "📭 No business knowledge data found in response:",
          apiData
        );
        toast.success(`${fileArray.length} file(s) processed successfully!`);
      }

      clearInterval(progressInterval);
      if (category === "business") {
        setBusinessUploadProgress(100);
      } else {
        setUploadProgress(100);
      }

      // Update internalUploadedFiles state with all new files
      const newFilesData = uploadedFileRecords.map((uploadedFile) => ({
        ...uploadedFile,
        status: "processed",
      }));

      setInternalUploadedFiles((prev) => [...prev, ...newFilesData]);

      toast.success(`${fileArray.length} file(s) uploaded successfully`);
    } catch (error) {
      console.error("❌ Error uploading file:", error);
      toast.error(`Failed to upload file(s): ${error.message}`);
    } finally {
      if (category === "business") {
        setIsUploadingBusiness(false);
        setBusinessUploadProgress(0);
      } else {
        setIsUploading(false);
        setUploadProgress(0);
      }
    }
  };

  const handleDeleteMaterial = (materialId, category) => {
    if (category === "business") {
      handleDeleteBusinessMaterial(materialId);
    } else {
      setTrainingMaterials((prev) => ({
        ...prev,
        [category]: prev[category].filter(
          (material) => material.id !== materialId
        ),
      }));
      toast.success("Training material deleted");
    }
  };

  const handleDeleteBusinessMaterial = async (materialId) => {
    try {
      // Update is_active to false in database
      await dbHelpers.updateInternalUploadedFileStatus(materialId, false);
      await dbHelpers.updateIsActiveFalseByUploadedId(materialId);

      // Update UI by removing the file from the list
      setInternalUploadedFiles((prev) =>
        prev.filter((file) => file.id !== materialId)
      );

      toast.success("Business material deleted successfully");
    } catch (error) {
      console.error("Error deleting business material:", error);
      toast.error("Failed to delete business material");
    }
  };

  const generateApiKey = () => {
    const apiKey =
      "sk-" +
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15);
    navigator.clipboard.writeText(apiKey);
    toast.success("New API key generated and copied to clipboard");
  };

  const getOwnerDetails = async () => {
    const formData = new FormData();
    formData.append("id", organizationDetails.id);
    const response = await fetch(
      `${config.api.baseUrl}${config.api.endpoints.getOwnersDetails}`,
      {
        method: "POST",
        body: formData,
      }
    );
    const finalResponse = await response.json();
    return finalResponse?.length > 0 ? finalResponse : [];
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

      // Parse the JSON response
      const responseData = await response.json();
      console.log("📊 API Response Data:", responseData);

      const apiData = responseData;
      console.log("API Response:", apiData);

      const result = await response.json();

      if (result.success || result.valid) {
        await authHelpers.updateOrganizationHubSpotToken(
          organizationDetails.id,
          { hubspot_encrypted_token: jwtToken }
        );
        // Get owner details and save to separate table
        const ownersData = await getOwnerDetails();
        if (ownersData.length > 0) {
          // Extract the actual owners array from the response
          const actualOwners = ownersData[0]?.Owners || [];

          if (actualOwners.length > 0) {
            console.log(
              "👥 Processing HubSpot owners:",
              actualOwners.length,
              "owners"
            );

            // Save/update HubSpot users in separate table
            const saveResult = await dbHelpers.saveOrUpdateHubSpotUsers(
              organizationDetails.id,
              actualOwners
            );

            console.log("💾 HubSpot users save result:", saveResult.summary);

            // Show summary toast
            const { successful, failed, matched_profiles } = saveResult.summary;
            if (successful > 0) {
              toast.success(
                `HubSpot users synced: ${successful} saved, ${matched_profiles} matched with existing profiles`
              );
            }
            if (failed > 0) {
              toast.warning(`${failed} HubSpot users failed to sync`);
            }
          } else {
            console.warn("⚠️ No owners found in HubSpot response");
            toast.warning("No HubSpot owners found to sync");
          }
        } else {
          console.warn("⚠️ Empty owners data received");
          toast.warning("No HubSpot owner data received");
        }

        // const ownersData = await getOwnerDetails();
        // await authHelpers.updateOrganizationHubSpotToken(
        //   organizationDetails.id,
        //   {
        //     hubspot_user_details: ownersData,
        //   }
        // );
        // Update Redux state

        const hubspotUserDetails = await dbHelpers.getHubSpotUserDetails(
          user?.id,
          organizationDetails?.id
        );

        dispatch(
          setHubspotIntegration({
            connected: true,
            hubspotUserId: hubspotUserDetails?.hubspot_user_id || null,
            hubspotUserDetails: hubspotUserDetails,
            lastSync: new Date().toISOString(),
            accountInfo: {
              maskedToken: "xxxxx" + hubspotToken.slice(-4),
              ...result.account_info,
            },
          })
        );
        // dispatch(
        //   setHubspotIntegration({
        //     connected: true,
        //     lastSync: new Date().toISOString(),
        //     accountInfo: {
        //       maskedToken: "xxxxx" + hubspotToken.slice(-4),
        //       ...result.account_info,
        //     },
        if (apiData && Array.isArray(apiData) && apiData.length > 0) {
          const businessData = apiData[0];

          toast.success("HubSpot connection verified successfully");
          setHubspotToken(""); // Clear the input field
        } else {
          setHubspotError(
            "Invalid HubSpot token. Please check your token and try again."
          );
          toast.error("HubSpot connection is invalid");
        }
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
      await authHelpers.updateOrganizationHubSpotToken(organizationDetails.id, {
        hubspot_encrypted_token: null,
      });

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
          <TabsTrigger
            value="profile"
            className="flex items-center space-x-2"
            data-tour="settings-tab-profile"
          >
            <User className="w-4 h-4" />
            <span>Profile</span>
          </TabsTrigger>
          {canManageOrgSettings && userRoleId == 2 && (
            <TabsTrigger
              value="organization"
              className="flex items-center space-x-2"
              data-tour="settings-tab-organization"
            >
              <Building className="w-4 h-4" />
              <span>Organization</span>
            </TabsTrigger>
          )}
          {(userRoleId == 2 || userRoleId == 1 || userRoleId == null) && (
            <TabsTrigger
              value="users"
              className="flex items-center space-x-2"
              data-tour="settings-tab-users"
            >
              <Users className="w-4 h-4" />
              <span>Users</span>
            </TabsTrigger>
          )}
          {isSuperAdmin && (
            <TabsTrigger value="tour-management">Tour Management</TabsTrigger>
          )}
          <TabsTrigger value="security" className="flex items-center space-x-2">
            <Shield className="w-4 h-4" />
            <span>Security</span>
          </TabsTrigger>
          {userRoleId !== 1 && (
            <TabsTrigger
              value="ai-training"
              className="flex items-center space-x-2"
              data-tour="settings-tab-ai-training"
            >
              <Brain className="w-4 h-4" />
              <span>AI Training</span>
            </TabsTrigger>
          )}
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
                    <>Save Changes</>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Fireflies Integration */}
            <div>
              <h3 className="text-lg font-semibold mb-4">
                Fireflies Integration
              </h3>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Mic className="w-5 h-5" />
                    <span>Fireflies.ai</span>
                    {firefliesStatus?.connected ? (
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Connected
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="bg-gray-100 text-gray-800 border-gray-200"
                      >
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Not Connected
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Connect your Fireflies.ai account to automatically sync
                    meeting transcripts and recordings.
                  </p>

                  {!firefliesStatus?.connected ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="fireflies-token">
                          Fireflies API Token
                        </Label>
                        <div className="relative">
                          <Input
                            id="fireflies-token"
                            type={showFirefliesToken ? "text" : "password"}
                            placeholder="Enter your Fireflies API token"
                            value={firefliesToken}
                            onChange={(e) => setFirefliesToken(e.target.value)}
                            className="pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() =>
                              setShowFirefliesToken(!showFirefliesToken)
                            }
                          >
                            {showFirefliesToken ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <p className="mb-1">
                            <strong>Note:</strong> You can find your Fireflies
                            API key in your Fireflies account under:
                          </p>
                          <p>
                            Settings → Developer Settings → Generate/View API
                            Key
                          </p>
                        </div>
                      </div>

                      <Button
                        onClick={handleFirefliesConnect}
                        disabled={
                          isConnectingFireflies || !firefliesToken.trim()
                        }
                        className="w-full"
                      >
                        {isConnectingFireflies ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Connecting...
                          </>
                        ) : (
                          <>
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Connect Fireflies
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">
                            Fireflies Integration Active
                          </span>
                        </div>
                        <p className="text-sm text-green-700">
                          Your Fireflies.ai account is connected and ready to
                          sync meeting data.
                        </p>
                      </div>

                      <Button
                        variant="outline"
                        onClick={handleFirefliesDisconnect}
                        disabled={isDisconnectingFireflies}
                        className="w-full"
                      >
                        {isDisconnectingFireflies ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Disconnecting...
                          </>
                        ) : (
                          "Disconnect Fireflies"
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
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
                  <CardTitle className="flex items-center space-x-2">
                    <Zap className="w-5 h-5" />
                    <span>Hubspot</span>
                    {hubspotIntegration.connected ? (
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Connected
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="bg-gray-100 text-gray-800 border-gray-200"
                      >
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Not Connected
                      </Badge>
                    )}
                  </CardTitle>
                  {/* <CardTitle className="flex items-center justify-between">
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
                  </CardTitle> */}
                </CardHeader>
                {console.log(hubspotIntegration, "check hubspot integration")}
                <CardContent className="space-y-4">
                  {hubspotIntegration.connected ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-800">
                            HubSpot Successfully Connected
                          </span>
                        </div>
                        <p className="text-sm text-green-700">
                          Your Hubspot is connected and ready to sync crm data.
                        </p>
                        {hubspotIntegration.accountInfo?.userName && (
                          <p className="text-xs text-green-600 mt-1">
                            Connected as:{" "}
                            {hubspotIntegration.accountInfo.userName}
                            {hubspotIntegration.accountInfo.userEmail && (
                              <span>
                                {" "}
                                ({hubspotIntegration.accountInfo.userEmail})
                              </span>
                            )}
                          </p>
                        )}
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          onClick={handleEditHubspotToken}
                          className="flex-1"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Update Token
                        </Button>
                        <Button
                          variant="outline"
                          onClick={disconnectHubSpot}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Disconnect
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        Connect your HubSpot account to sync CRM data and
                        enhance AI insights.
                      </p>

                      <div className="space-y-2">
                        <Label htmlFor="hubspot-token">
                          HubSpot Access Token
                        </Label>
                        <Input
                          id="hubspot-token"
                          type="password"
                          placeholder="Enter your HubSpot access token"
                          value={hubspotToken}
                          onChange={(e) => setHubspotToken(e.target.value)}
                          className={hubspotError ? "border-red-500" : ""}
                        />
                        {hubspotError && (
                          <p className="text-sm text-red-600">{hubspotError}</p>
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
                      <div className="text-xs text-muted-foreground">
                        <p className="mb-1">
                          <strong>Note:</strong> You can find your HubSpot
                          Access Token in your HubSpot account under:
                        </p>
                        <p>
                          Settings → Integrations → Private Apps → Create/View
                          Token
                        </p>
                      </div>
                    </div>
                  )}

                  {isEditingHubspot && (
                    <div className="space-y-4 border-t pt-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-hubspot-token">
                          New HubSpot Access Token
                        </Label>
                        <Input
                          id="new-hubspot-token"
                          type="password"
                          placeholder="Enter your new HubSpot access token"
                          value={hubspotToken}
                          onChange={(e) => setHubspotToken(e.target.value)}
                          className={hubspotError ? "border-red-500" : ""}
                        />
                        {hubspotError && (
                          <p className="text-sm text-red-600">{hubspotError}</p>
                        )}
                      </div>

                      <div className="flex space-x-2">
                        <Button
                          onClick={validateHubspotToken}
                          disabled={!hubspotToken.trim() || isCheckingHubSpot}
                          className="flex-1"
                        >
                          {isCheckingHubSpot ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                              Updating...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-1" />
                              Update Token
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleCancelEditHubspot}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
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
              {(userRole?.id == 2 || user?.title_id == 45) && (
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
                      {user?.title_id != 45 && (
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

                      <Button onClick={handleInviteUser} disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Sending invite ...
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-1" />
                            Send Invite
                          </>
                        )}
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
                      {user?.title_id == 45
                        ? "Organizations"
                        : "Organization Users"}
                    </span>
                    <Badge variant="secondary">
                      {user?.title_id == 45
                        ? getOrgList?.length + " organizations"
                        : getUserslist?.length + " users"}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {user?.title_id == 45 ? (
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
                                    onClick={() => handleDeleteClick(user)}
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

        {isSuperAdmin && (
          <TabsContent value="tour-management" className="space-y-6">
            <TourManagement />
          </TabsContent>
        )}
        {/* Security Settings */}
        <TabsContent value="security" className="mt-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="items-center ">
                    <span className="space-x-2">Authentication & Access</span>
                    <Badge
                      variant="outline"
                      className="bg-orange-50 text-orange-700 border-orange-200"
                    >
                      Coming Soon for Your Organization
                    </Badge>
                  </div>
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
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Key className="w-5 h-5" />
                    <span>API Keys</span>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-orange-50 text-orange-700 border-orange-200"
                  >
                    Coming Soon for Your Organization
                  </Badge>
                </CardTitle>
                {/* <CardTitle className="flex items-center space-x-2">
                  <Key className="w-5 h-5" />
                  <span>API Keys</span>
                </CardTitle> */}
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
                        // accept=".pdf,.doc,.docx,.txt,.mp4,.mov,.ppt,.pptx"
                        accept=".pdf,.txt"
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
                          PDF, TXT(Max 10MB)
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
            {/* {console.log(userRoleId, "check user role id")} */}
            {/* Business-Specific Knowledge */}
            {canUploadOrgMaterials && userRoleId == 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Building className="w-5 h-5" />
                      <span>Business-Specific Knowledge</span>
                      <Badge
                        variant="outline"
                        className="bg-blue-100 text-blue-800 border-blue-200"
                      >
                        Organization Level
                      </Badge>
                    </div>
                    {/* <Badge
                      variant="outline"
                      className="bg-orange-50 text-orange-700 border-orange-200"
                    >
                      Coming Soon for Your Organization
                    </Badge> */}
                  </CardTitle>
                  {/* <CardTitle className="flex items-center space-x-2">
                    <Building className="w-5 h-5" />
                    <span>Business-Specific Knowledge</span>
                  </CardTitle> */}
                  <p className="text-sm text-muted-foreground">
                    Company playbooks, product documentation, presentations, and
                    unique selling propositions
                  </p>
                </CardHeader>
                <CardContent>
                  {/* Upload Progress for Business Files */}
                  {isUploadingBusiness && (
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center space-x-3 mb-2">
                        <Upload className="w-5 h-5 text-blue-600" />
                        <span className="font-medium text-blue-800">
                          Uploading business material...
                        </span>
                      </div>
                      <Progress
                        value={businessUploadProgress}
                        className="w-full"
                      />
                      <p className="text-sm text-blue-700 mt-2">
                        {businessUploadProgress < 50
                          ? "Uploading file..."
                          : businessUploadProgress < 90
                          ? "Processing content..."
                          : "Finalizing..."}
                      </p>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div
                      {...getBusinessRootProps()}
                      className={cn(
                        "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                        isBusinessDragActive
                          ? "border-blue-500 bg-blue-50"
                          : "border-border hover:border-blue-400 hover:bg-blue-50/50",
                        isUploadingBusiness && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <input {...getBusinessInputProps()} />
                      {isUploadingBusiness ? (
                        <>
                          <Loader2 className="w-8 h-8 mx-auto mb-2 text-blue-600 animate-spin" />
                          <p className="text-sm font-medium text-blue-800">
                            Uploading...
                          </p>
                        </>
                      ) : (
                        <>
                          <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm font-medium">
                            {isBusinessDragActive
                              ? "Drop the file here"
                              : "Upload Business Materials"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {isBusinessDragActive
                              ? "Release to upload"
                              : "Click to browse or drag and drop multiple files here"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            PDF, TXT (Max 10MB each, multiple files supported)
                          </p>
                        </>
                      )}
                    </div>

                    <div className="space-y-2">
                      {console.log(businessOrgData, "businessKnowledgeData")}
                      {businessOrgData ? (
                        businessOrgData?.length > 0 ? (
                          businessOrgData?.map((knowledge) => (
                            <Card
                              key={knowledge.id}
                              className="cursor-pointer hover:shadow-md transition-shadow"
                              onClick={() =>
                                handleViewBusinessKnowledge(knowledge)
                              }
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start space-x-3 flex-1">
                                    <Building className="w-5 h-5 text-primary mt-1" />
                                    <div className="flex-1 min-w-0">
                                      <h3 className="font-semibold text-lg mb-1">
                                        {knowledge.organization_name ||
                                          "Unnamed Organization"}
                                      </h3>
                                      <p className="text-sm text-muted-foreground mb-3 line-clamp-1">
                                        {knowledge.static_supply_elements?.coreBusinessOffering?.substring(
                                          0,
                                          100
                                        ) + "..." || "No summary available"}
                                      </p>
                                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                        <span>
                                          Created:{" "}
                                          {new Date(
                                            knowledge.created_at
                                          ).toLocaleDateString()}
                                        </span>
                                        <span>
                                          Updated:{" "}
                                          {new Date(
                                            knowledge.updated_at
                                          ).toLocaleDateString()}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleViewProcessedFiles(knowledge);
                                      }}
                                      className="text-xs"
                                    >
                                      <FileText className="w-3 h-3 mr-1" />
                                      View Files
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        handleViewBusinessKnowledge(knowledge)
                                      }
                                      className="text-black hover:text-black"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // handleDeleteBusinessKnowledge(
                                        //   knowledge
                                        // );
                                        handleDeleteClick(knowledge);
                                      }}
                                      className="text-destructive hover:text-destructive"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        ) : (
                          ""
                        )
                      ) : (
                        // (
                        //   <div className="text-center py-8">
                        //     <p className="text-muted-foreground">
                        //       No business knowledge profiles yet
                        //     </p>
                        //     <p className="text-sm text-muted-foreground mt-1">
                        //       Upload business knowledge files to create your
                        //       first profile
                        //     </p>
                        //   </div>
                        // )
                        <div className="text-center py-8">
                          <p className="text-muted-foreground">
                            Loading business knowledge...
                          </p>
                        </div>
                      )}
                      {/* {internalUploadedFiles?.length > 0 &&
                        internalUploadedFiles.map((material) => (
                          <div
                            key={material.id}
                            className="flex items-center justify-between p-3 border border-border rounded-lg"
                          >
                            <div className="flex items-center space-x-3">
                              <FileText className="w-5 h-5 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium">
                                  {material.original_filename}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatFileSize(material.file_size)} •{" "}
                                  {formatDate(material.created_at)}
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
                                  // handleDeleteMaterial(material.id, "business")
                                  handleDeleteClick(material)
                                }
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewBusinessKnowledge(item)}
                                className="text-green-600 hover:bg-green-50"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))} */}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Personal Insights */}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <User className="w-5 h-5" />
                    <span>Personal Insights</span>
                    <Badge
                      variant="outline"
                      className="bg-green-100 text-green-800 border-green-200"
                    >
                      Personal Level
                    </Badge>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-orange-50 text-orange-700 border-orange-200"
                  >
                    Coming Soon for Your Organization
                  </Badge>
                </CardTitle>
                {/* <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5" />
                  <span>Personal Insights</span>
                  <Badge
                    variant="outline"
                    className="bg-green-100 text-green-800 border-green-200"
                  >
                    Personal Level
                  </Badge>
                </CardTitle> */}
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
                      accept=".pdf,.txt"
                    />
                    <label htmlFor="personal-upload" className="cursor-pointer">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm font-medium">
                        Upload Personal Material
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PDF, TXT(Max 10MB)
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
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="w-5 h-5" />
                    <span>Analytics Access</span>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-orange-50 text-orange-700 border-orange-200"
                  >
                    Coming Soon for Your Organization
                  </Badge>
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
                            {organizationDetails?.name} only
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
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span>Data Export</span>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-orange-50 text-orange-700 border-orange-200"
                  >
                    Coming Soon for Your Organization
                  </Badge>
                </CardTitle>
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

      {/* Processed Files Modal */}
      <Dialog
        open={showProcessedFilesModal}
        onOpenChange={setShowProcessedFilesModal}
      >
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Processed Files</span>
              {selectedBusinessKnowledgeForFiles && (
                <Badge
                  variant="outline"
                  className="bg-blue-100 text-blue-800 border-blue-200"
                >
                  {selectedBusinessKnowledgeForFiles.organization_name}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Files that were processed to create this business knowledge
              profile
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {processedFiles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="mb-2">No processed files found</p>
                <p className="text-sm">
                  This business knowledge profile has no associated files
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {processedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">
                            {file.original_filename}
                          </h4>
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-1">
                            <span>
                              {(file.file_size / 1024 / 1024).toFixed(2)} MB
                            </span>
                            <span>
                              Uploaded:{" "}
                              {new Date(file.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewFile(file)}
                          className="text-xs"
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowProcessedFilesModal(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Business Knowledge Modal */}
      <BusinessKnowledgeModal
        isOpen={showBusinessKnowledgeModal}
        onClose={() => setShowBusinessKnowledgeModal(false)}
        data={businessKnowledgeData}
        onSave={handleUpdateBusinessKnowledge}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteConfirmDialog}
        onOpenChange={setShowDeleteConfirmDialog}
      >
        <DialogContent className="sm:max-w-lg border-0 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              <span>Confirm Delete</span>
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this item?
            </DialogDescription>
          </DialogHeader>

          {fileToDelete && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mx-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <Building className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-red-900 truncate">
                    {fileToDelete.organization_name}
                  </h4>
                  <p className="text-sm text-red-700">
                    Created:{" "}
                    {new Date(fileToDelete.created_at).toLocaleDateString()}
                  </p>
                  {fileToDelete.processed_file_ids && (
                    <p className="text-xs text-red-600 mt-1">
                      {fileToDelete.processed_file_ids.length} associated files
                      will also be affected
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
          {/* Warning Message */}
          {/* <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mx-6">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-amber-900 mb-1">
                  This action cannot be undone
                </h4>
                <p className="text-sm text-amber-800 leading-relaxed">
                  Deleting this business knowledge profile will permanently
                  remove all associated data, insights, and file references.
                  This may affect AI processing quality for future calls.
                </p>
              </div>
            </div>
          </div> */}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirmDialog(false)}
              className="mt-2 sm:mt-0 border-gray-300 hover:bg-gray-50 px-6 py-2.5"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeletingBusinessFile}
            >
              {isDeletingBusinessFile ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;
