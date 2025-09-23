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
  Phone,
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
  setPersonalInsightKnowledge,
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
import { PersonalInsightsModal } from "../components/personal/PersonalInsightsModal";
import PhoneInput from "react-phone-number-input";
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
  const [processedPersonalData, setProcessedPersonalData] = useState([]);
  const [personalInsightsData, setPersonalInsightsData] = useState(null);
  const [showPersonalInsightsModal, setShowPersonalInsightsModal] =
    useState(false);

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
      setSelectedCategory("business");
      toast.success("Business knowledge profile deleted successfully");
    } catch (error) {
      console.error("Error deleting business knowledge:", error);
      toast.error("Failed to delete business knowledge profile");
    }
  };

  const handleDeletePersonalKnowledge = async (id) => {
    try {
      await dbHelpers.deletePersonalKnowledgeData(id);
      await loadPersonalInsightsData();
      setSelectedCategory("business");
      toast.success("Personal knowledge profile deleted successfully");
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

  const handleUpdatePersonalInsights = async (data) => {
    try {
      // Save business knowledge data to database
      console.log("Saving personal knowledge data:", data);

      // Save to database using dbHelpers
      await dbHelpers.updatePersonalKnowledgeData(data);

      // Update local state
      setPersonalInsightsData(data);

      toast.success("Personal knowledge updated successfully!");
    } catch (error) {
      console.error("Error saving personal knowledge:", error);
      toast.error("Failed to save personal knowledge");
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
    isBetaUser,
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

  // console.log(isBetaUser, "check beta user");
  const [isUpdating, setIsUpdating] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const isSuperAdmin = userRole?.key === "super_admin";
  // console.log(isSuperAdmin, "check super admin");
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
  const [isUploadingPersonal, setIsUploadingPersonal] = useState(false);
  const [personalUploadProgress, setPersonalUploadProgress] = useState(0);
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [isDeletingBusinessFile, setIsDeletingBusinessFile] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("business");
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
    phoneNumber: user?.phone_number || "",
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
      // console.log(data, "check business knowledge data");
      setBusinessOrgData(data);
      const cleanedData = data.map(
        ({
          id,
          organization_id,
          user_id,
          processed_file_ids,
          is_active,
          updated_at,
          created_at,
          ...rest
        }) => rest
      );
      dispatch(setBusinessKnowledge(cleanedData));
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

  const loadPersonalInsightsData = async () => {
    try {
      const data = await dbHelpers.getPersonalInsights(user?.id);
      // console.log(data, "get sales insights");
      const cleanedData = data.map(
        ({
          id,
          organization_id,
          user_id,
          processed_file_ids,
          is_active,
          updated_at,
          created_at,
          ...rest
        }) => rest
      );
      dispatch(setPersonalInsightKnowledge(cleanedData));
      setProcessedPersonalData(data);
    } catch (error) {
      console.error("Error loading personal insights:", error);
    }
  };
  console.log(processedPersonalData, "check processed personal data");
  // Load personal insights files on component mount
  useEffect(() => {
    loadPersonalInsightsData();
  }, [personalInsightsData]);
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

  const handleViewPersonalKnowledge = (knowledgeData) => {
    // console.log(knowledgeData, "check knowledge data 505");
    setPersonalInsightsData(knowledgeData);
    setShowPersonalInsightsModal(true);
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

  // const handleFirefliesConnect = async () => {
  //   if (!firefliesToken.trim()) {
  //     toast.error("Please enter a valid Fireflies API token");
  //     return;
  //   }

  //   const payload = {
  //     pat: firefliesToken.trim(),
  //   };

  //   // Encrypt the token using JWT
  //   const jwtToken = createJWT(payload);
  //   const formData = new FormData();
  //   formData.append("token", jwtToken);
  //   setIsConnectingFireflies(true);

  //   try {
  //     // Validate token with Fireflies API
  //     // const response = await fetch(`${config.api.baseUrl}FF-check`, {
  //     //   method: "POST",
  //     //   headers: {
  //     //     "Content-Type": "application/json",
  //     //   },
  //     //   body: formData,
  //     // });
  //     const response = await fetch(
  //       `${config.api.baseUrl}${config.api.endpoints.firefliesConnectionCheck}`,
  //       {
  //         method: "POST",
  //         body: formData,
  //       }
  //     );

  //     if (!response.ok) {
  //       throw new Error("Invalid Fireflies token or API error");
  //     }

  //     const result = await response.json();

  //     // Check if the token validation was successful
  //     // Extract others data from API response
  //     const othersData = result.others || null;
  //     console.log("📋 Others data extracted:", othersData);

  //     if (!result.success && !result.valid) {
  //       throw new Error("Invalid Fireflies token");
  //     }

  //     // Encrypt the token before saving
  //     const encryptedToken = CryptoJS.AES.encrypt(
  //       firefliesToken.trim(),
  //       "SG"
  //     ).toString();

  //     const savedData = await dbHelpers.saveBusinessKnowledgeWithOthers(
  //       user.organization_id,
  //       user.id,
  //       result,
  //       othersData
  //     );

  //     // Save encrypted token to database
  //     await dbHelpers.saveUserFirefliesToken(user?.id, encryptedToken);
  //     const updatedUser = {
  //       ...user,
  //       fireflies_connected: true,
  //     };

  //     dispatch(setUser(updatedUser)); // update Redux store
  //     // Update local state
  //     setFirefliesStatus({ connected: true, hasToken: true });
  //     setFirefliesToken("");

  //     toast.success("Fireflies integration connected successfully!");
  //   } catch (error) {
  //     console.error("Error connecting Fireflies:", error);
  //     toast.error(`Failed to connect Fireflies: ${error.message}`);
  //   } finally {
  //     setIsConnectingFireflies(false);
  //   }
  // };
  // console.log(user, "check settings");

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
      if (!result.success && !result.valid) {
        throw new Error("Invalid Fireflies token");
      }

      // Encrypt the token using the same method as HubSpot
      const encryptedToken = jwtToken;

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
        phone_number: profileSettings.phoneNumber,
      });

      // 🔄 Update Redux state
      dispatch(
        setUser({
          ...user,
          full_name: updatedProfile.full_name,
          email: updatedProfile.email,
          timezone: updatedProfile.timezone,
          language: updatedProfile.language,
          phone_number: updatedProfile.phone_number,
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
      user?.id,
      isBetaUser ? "beta" : null
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

  const onDropPersonal = (acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      handleFileUpload(acceptedFiles, "personal");
    }
  };

  const {
    getRootProps: getPersonalRootProps,
    getInputProps: getPersonalInputProps,
    isDragActive: isPersonalDragActive,
  } = useDropzone({
    onDrop: onDropPersonal,
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
    disabled: isUploadingPersonal,
  });

  const handleRemoveUser = (userId) => {
    setOrgUsers((prev) => prev.filter((user) => user.id !== userId));
    toast.success("User removed from organization");
  };

  const handleDeleteClick = (material, type) => {
    setSelectedCategory(type);
    setFileToDelete(material);
    setShowDeleteConfirmDialog(true);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirmDialog(false);
    setFileToDelete(null);
  };
  console.log(fileToDelete, "check file to delete");
  const handleConfirmDelete = async () => {
    if (!fileToDelete) return;

    setIsDeletingBusinessFile(true);
    try {
      if (selectedCategory == "business") {
        await handleDeleteBusinessKnowledge(fileToDelete.id);
      } else {
        await handleDeletePersonalKnowledge(fileToDelete.id);
      }
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
    } else if (category == "personal") {
      setIsUploadingPersonal(true);
      setPersonalUploadProgress(0);
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
        } else if (category === "personal") {
          setPersonalUploadProgress((prev) => {
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
      formData.append("type", category == "business" ? "org" : "personal");

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
            const uploadedFile =
              category == "business"
                ? await dbHelpers?.saveInternalUploadedFile(
                    user?.id,
                    file,
                    organizationDetails.id
                  )
                : await dbHelpers?.savePersonalUploadedFile(
                    user?.id,
                    file,
                    organizationDetails.id
                  );
            uploadedFileRecords.push(uploadedFile);
          }
          const fileIds = uploadedFileRecords.map((file) => file.id);
          if (category == "business") {
            const savedData = await dbHelpers.saveBusinessKnowledgeData(
              businessData,
              user?.organization_id,
              user?.id,
              fileIds
            );
            setBusinessKnowledgeData(savedData);
            setShowBusinessKnowledgeModal(true);
          } else if (category == "personal") {
            const savedData = await dbHelpers.savePersonalKnowledgeData(
              businessData,
              user?.organization_id,
              user?.id,
              fileIds
            );
            // setShowPersonalInsightsModal
            setPersonalInsightsData(savedData);
            setShowPersonalInsightsModal(true);
          }
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
      } else if (category === "personal") {
        console.log("1366 called");
        setPersonalUploadProgress(100);
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
        setIsUploadingPersonal(false);
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
    }

    toast.success("Material deleted successfully");
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Settings content would go here */}
      <div>Settings Page Content</div>
    </div>
  );
};
      