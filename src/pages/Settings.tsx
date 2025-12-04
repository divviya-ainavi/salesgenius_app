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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  Phone,
  Check,
  ChevronsUpDown,
  Loader2,
  Mic,
  Calendar,
  Clock,
  Target,
  AlertTriangle,
  DollarSign,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useDispatch, useSelector } from "react-redux";
import { useDropzone } from "react-dropzone";
import { dbHelpers, CURRENT_USER, authHelpers, supabase } from "@/lib/supabase";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import {
  setBusinessKnowledge,
  setCompany_size,
  setGetOrgList,
  setGetUsersList,
  setIndustry,
  setPersonalInsightKnowledge,
  setPlanExpiryModal,
  setSales_methodology,
  setShowUpgradeModal,
} from "../store/slices/orgSlice";
import {
  setOrganizationDetails,
  setUser,
  setHubspotIntegration,
} from "../store/slices/authSlice";
import { getCountries, getCitiesForCountry } from "@/data/countriesAndCities";
import { config } from "@/lib/config";
import { UpgradePlanDialog } from "@/components/billing/UpgradePlanDialog";
import CryptoJS from "crypto-js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/ui/alert-dialog";
import TourManagement from "@/components/admin/TourManagement";
import { BusinessKnowledgeModal } from "@/components/business/BusinessKnowledgeModal";
import { PersonalInsightsModal } from "../components/personal/PersonalInsightsModal";
import { BillingComponent } from "@/components/billing/BillingComponent";
import { UpdateTeamSizeDialog } from "@/components/admin/UpdateTeamSizeDialog";

// Active User Card Component
const ActiveUserCard = ({ listUser, role, allStatus, user, userRoleId }) => {
  const [userPlan, setUserPlan] = useState(null);
  const [isLoadingPlan, setIsLoadingPlan] = useState(true);
  const [isRevoking, setIsRevoking] = useState(false);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);

  const isOrganizationPlan = (plan) => {
    if (!plan) return false;
    const planName = plan.plan_name?.toLowerCase() || "";
    return planName.includes("organization");
  };

  const isFreePlan = (plan) => {
    if (!plan) return true;
    const planName = plan.plan_name?.toLowerCase() || "";
    return (
      planName.includes("free") ||
      planName.includes("trial") ||
      planName.includes("beta") ||
      parseFloat(plan.price) === 0
    );
  };

  const isProPlan = (plan) => {
    if (!plan) return false;
    const planName = plan.plan_name?.toLowerCase() || "";
    return planName.includes("pro") && !planName.includes("organization");
  };

  const canInviteUsers =
    userPlan?.plan_master && isOrganizationPlan(userPlan.plan_master);

  useEffect(() => {
    const fetchUserPlan = async () => {
      try {
        const data = await dbHelpers.getUserPlanDetails(listUser.id);
        // supabase
        //   .from("user_plan")
        //   .select("*, plan_master(*)")
        //   .eq("user_id", listUser.id)
        //   .eq("is_active", true)
        //   .order("created_at", { ascending: false })
        //   .limit(1)
        //   .maybeSingle();

        // if (!error && data) {
        setUserPlan(data);
        // }
      } catch (err) {
        console.error("Error fetching user plan:", err);
      } finally {
        setIsLoadingPlan(false);
      }
    };

    fetchUserPlan();
  }, [listUser.id]);

  const handleRevokeAccess = async () => {
    setIsRevoking(true);
    setShowRevokeDialog(false);
    try {
      await dbHelpers.revokeUserAccess(listUser.id);

      toast.success("Access revoked successfully");
      setUserPlan(null);
    } catch (err) {
      console.error("Error revoking access:", err);
      toast.error("Failed to revoke access");
    } finally {
      setIsRevoking(false);
    }
  };

  const isExpiringSoon =
    userPlan?.end_date &&
    new Date(userPlan.end_date) <=
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const isExpired =
    userPlan?.end_date && new Date(userPlan.end_date) < new Date();
  const isRevoked = userPlan?.is_cancel;

  const isOrgAdmin = listUser.id == user?.id;

  return (
    <div className="flex items-center justify-between p-4 border border-border rounded-lg hover:border-gray-300 transition-colors">
      <div className="flex items-center space-x-4">
        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
          <User className="w-5 h-5 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium">{listUser.full_name}</p>
          <p className="text-sm text-muted-foreground">{listUser.email}</p>
          <div className="flex items-center space-x-2 mt-1 flex-wrap gap-1">
            <Badge variant="outline" className={cn("text-xs", role.color)}>
              <role.icon className="w-3 h-3 mr-1" />
              {role?.label}
            </Badge>
            {listUser.status_id && (
              <Badge
                variant={
                  allStatus?.find((x) => x?.id == listUser.status_id)?.label ===
                  "active"
                    ? "default"
                    : "secondary"
                }
                className="text-xs"
              >
                {allStatus?.find((x) => x?.id == listUser.status_id)?.label}
              </Badge>
            )}
            {userPlan && (
              <Badge
                variant="outline"
                className="text-xs bg-blue-50 text-blue-700 border-blue-200"
              >
                <Crown className="w-3 h-3 mr-1" />
                {userPlan.plan_master?.plan_name || "Pro"}
              </Badge>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <div className="flex flex-col items-end gap-2">
          {isLoadingPlan ? (
            <div className="flex items-center text-muted-foreground">
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              <span className="text-xs">Loading...</span>
            </div>
          ) : userPlan ? (
            <>
              <div className="text-right">
                <p
                  className={cn(
                    "text-xs font-medium flex items-center justify-end gap-1",
                    isExpired
                      ? "text-red-600"
                      : isExpiringSoon
                      ? "text-amber-600"
                      : "text-muted-foreground"
                  )}
                >
                  <Calendar className="w-3 h-3" />
                  {isExpired ? "Expired" : "Expires"}
                </p>
                <p
                  className={cn(
                    "text-sm font-medium",
                    isExpired
                      ? "text-red-600"
                      : isExpiringSoon
                      ? "text-amber-600"
                      : "text-foreground"
                  )}
                >
                  {userPlan.end_date
                    ? new Date(userPlan.end_date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "-"}
                </p>
              </div>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Joined{" "}
                {listUser.created_at
                  ? new Date(listUser.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "-"}
              </span>
            </>
          ) : (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Joined{" "}
              {listUser.created_at
                ? new Date(listUser.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "-"}
            </span>
          )}
        </div>
        {/* {console.log(userRoleId, "user role id in active user card")} */}
        {userPlan && !isExpired && !isRevoked && user.id != listUser.id && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRevokeDialog(true)}
            disabled={isRevoking}
            className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-200"
          >
            {isRevoking ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Lock className="w-4 h-4 mr-1" />
                Revoke Access
              </>
            )}
          </Button>
        )}
        {/* {!isOrgAdmin && !isExpired && (
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )} */}
      </div>

      {/* Revoke Access Confirmation Dialog */}
      <AlertDialog open={showRevokeDialog} onOpenChange={setShowRevokeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              Revoke User Access
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2">
              <p className="text-base">
                Are you sure you want to remove access for{" "}
                <span className="font-semibold text-gray-900">
                  {listUser.full_name || listUser.email}
                </span>
                ?
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-900 flex items-start gap-2">
                  <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>
                    If you revoke the access, the user will no longer be able to
                    process transcripts, but they will still be able to view the
                    previously processed data.
                  </span>
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRevoking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeAccess}
              disabled={isRevoking}
              className="bg-orange-600 hover:bg-orange-700 focus:ring-orange-600"
            >
              {isRevoking ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Revoking...
                </>
              ) : (
                "Yes, Revoke Access"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

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
    planDetails,
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
  const [invitedUsers, setInvitedUsers] = useState([]);
  const [isActiveUsersOpen, setIsActiveUsersOpen] = useState(true);
  const [isInvitedUsersOpen, setIsInvitedUsersOpen] = useState(false);
  const [orgPlan, setOrgPlan] = useState(null);
  const [isLoadingOrgPlan, setIsLoadingOrgPlan] = useState(false);
  const [showUpdateTeamSizeDialog, setShowUpdateTeamSizeDialog] =
    useState(false);
  const [trainingMaterials, setTrainingMaterials] = useState(
    mockTrainingMaterials
  );

  const isOrganizationPlan = (plan) => {
    if (!plan) return false;
    const planName = plan?.plan_name?.toLowerCase() || "";
    return planName.includes("organization");
  };

  const isFreePlan = (plan) => {
    if (!plan) return true;
    const planName = plan?.plan_name?.toLowerCase() || "";
    return (
      planName.includes("free") ||
      planName.includes("trial") ||
      planName.includes("beta") ||
      parseFloat(plan?.price || 0) === 0
    );
  };

  const isProPlan = (plan) => {
    if (!plan) return false;
    const planName = plan?.plan_name?.toLowerCase() || "";
    return planName.includes("pro") && !planName.includes("organization");
  };

  const canInviteUsers =
    planDetails?.plan_master && isOrganizationPlan(planDetails.plan_master);

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
  const [removingInviteId, setRemovingInviteId] = useState(null);

  // Fireflies integration state
  const [firefliesToken, setFirefliesToken] = useState("");
  const [showFirefliesToken, setShowFirefliesToken] = useState(false);
  const [firefliesStatus, setFirefliesStatus] = useState(null);
  const [isConnectingFireflies, setIsConnectingFireflies] = useState(false);
  const [isDisconnectingFireflies, setIsDisconnectingFireflies] =
    useState(false);

  // Fathom integration state
  const [fathomToken, setFathomToken] = useState("");
  const [showFathomToken, setShowFathomToken] = useState(false);
  const [fathomStatus, setFathomStatus] = useState(null);
  const [isConnectingFathom, setIsConnectingFathom] = useState(false);
  const [isDisconnectingFathom, setIsDisconnectingFathom] = useState(false);

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

  // Fetch organization plan
  const fetchOrganizationPlan = async () => {
    if (!organizationDetails?.id && !CURRENT_USER.organization_id) return;

    setIsLoadingOrgPlan(true);
    try {
      const plan = await authHelpers.getOrganizationPlan(
        organizationDetails?.id || CURRENT_USER.organization_id
      );
      setOrgPlan(plan);
    } catch (error) {
      console.error("Error fetching organization plan:", error);
    } finally {
      setIsLoadingOrgPlan(false);
    }
  };

  // Handle team size update success
  const handleTeamSizeUpdateSuccess = () => {
    fetchOrganizationPlan();
    toast.success("Team size updated successfully!");
  };

  // Load initial data
  useEffect(() => {
    checkFirefliesStatus();
    checkFathomStatus();
    getInternalUploadedFiles();
  }, []);

  useEffect(() => {
    fetchOrganizationPlan();
  }, [planDetails]);

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

  const checkFathomStatus = async () => {
    try {
      const status = await dbHelpers.getUserFathomStatus(user?.id);
      setFathomStatus(status);
    } catch (error) {
      console.error("Error checking Fireflies status:", error);
      setFathomStatus({ connected: false, hasToken: false });
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
    if (planDetails?.isExpired) {
      // Show plan expiry modal
      dispatch(
        setPlanExpiryModal({
          isOpen: true,
          featureName: "Connect Fireflies",
          featureDescription:
            "Access AI-powered company research and insights to better understand your prospects and prepare for sales conversations.",
        })
      );
      return;
    }
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

      dispatch(setUser(updatedUser));
      setFirefliesStatus({ connected: false, hasToken: false });
      toast.success("Fireflies integration disconnected successfully");
    } catch (error) {
      console.error("Error disconnecting Fireflies:", error);
      toast.error("Failed to disconnect Fireflies integration");
    } finally {
      setIsDisconnectingFireflies(false);
    }
  };

  const handleFathomConnect = async () => {
    if (planDetails?.isExpired) {
      dispatch(
        setPlanExpiryModal({
          isOpen: true,
          featureName: "Connect Fathom",
          featureDescription:
            "Connect your Fathom account to automatically sync meeting transcripts and recordings.",
        })
      );
      return;
    }
    if (!fathomToken.trim()) {
      toast.error("Please enter a valid Fathom API token");
      return;
    }

    const payload = {
      pat: fathomToken.trim(),
    };

    const jwtToken = createJWT(payload);
    const formData = new FormData();
    formData.append("token", jwtToken);
    setIsConnectingFathom(true);

    try {
      const response = await fetch(
        `${config.api.baseUrl}${config.api.endpoints.fathomConnectionCheck}`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to validate Fathom token");
      }

      const result = await response.json();
      console.log("Fathom validation result:", result);

      await dbHelpers.saveUserFathomToken(user?.id, jwtToken);
      const updatedUser = {
        ...user,
        fathom_connected: true,
      };

      dispatch(setUser(updatedUser));
      setFathomStatus({ connected: true, hasToken: true });
      toast.success("Fathom integration connected successfully");
    } catch (error) {
      console.error("Error connecting Fathom:", error);
      toast.error(
        error.message || "Failed to connect Fathom. Please check your token."
      );
    } finally {
      setIsConnectingFathom(false);
    }
  };

  const handleFathomDisconnect = async () => {
    setIsDisconnectingFathom(true);

    try {
      await dbHelpers.deleteUserFathomToken(user?.id);
      const updatedUser = {
        ...user,
        fathom_connected: false,
      };

      dispatch(setUser(updatedUser));
      setFathomStatus({ connected: false, hasToken: false });
      toast.success("Fathom integration disconnected successfully");
    } catch (error) {
      console.error("Error disconnecting Fathom:", error);
      toast.error("Failed to disconnect Fathom integration");
    } finally {
      setIsDisconnectingFathom(false);
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

  console.log(user?.title_id, organizationDetails?.id, "check users list");
  // Fetch invited users
  useEffect(() => {
    const fetchInvitedUsers = async () => {
      try {
        if (organizationDetails?.id) {
          console.log("1295");
          // Fetch invited users from invites table
          const data = await dbHelpers.getInvitedPendingUsers(
            organizationDetails?.id
          );
          console.log(data, "invited users 1298");
          // if (error) throw error;
          setInvitedUsers(data || []);
        }
      } catch (err) {
        console.error("Error fetching invited users:", err.message);
      }
    };

    fetchInvitedUsers();
  }, [user, organizationDetails?.id]);
  console.log(invitedUsers, "check invited users");
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

      // Check if phone number was updated
      const phoneNumberChanged =
        profileSettings.phoneNumber !== user?.phone_number;

      const updatedProfile = await dbHelpers.updateUserProfile(userId, {
        name: profileSettings.name,
        email: profileSettings.email,
        timezone: profileSettings.timezone,
        language: profileSettings.language,
        phone_number: profileSettings.phoneNumber,
      });

      // Call updateContact API if phone number was changed
      if (phoneNumberChanged && profileSettings.phoneNumber) {
        try {
          console.log("📞 Phone number updated, calling updateContact API...");

          const updateContactResponse = await fetch(
            `${config.api.baseUrl}${config.api.endpoints.updateContact}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                EMAIL: profileSettings.email,
                CONTACT: profileSettings.phoneNumber,
              }),
            }
          );

          if (!updateContactResponse.ok) {
            console.warn(
              "Failed to update contact:",
              updateContactResponse.statusText
            );
            // Don't show error to user - contact update is optional
          } else {
            console.log("✅ Contact updated successfully");
          }
        } catch (contactError) {
          console.warn("Error updating contact:", contactError);
          // Don't show error to user - contact update is optional
        }
      }

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

  // const handleInviteUser = async () => {
  //   if (planDetails?.isExpired) {
  //     // Show plan expiry modal
  //     dispatch(
  //       setPlanExpiryModal({
  //         isOpen: true,
  //         featureName: "Invite Users",
  //         featureDescription:
  //           "Access AI-powered company research and insights to better understand your prospects and prepare for sales conversations.",
  //       })
  //     );
  //     return;
  //   }
  //   setIsLoading(true);
  //   const email = newUserEmail.trim();
  //   if (!email) {
  //     setIsLoading(false);
  //     toast.error("Please enter a valid email address");
  //     return;
  //   }

  //   // Check organization plan seat availability
  //   try {
  //     const canAddResult = await dbHelpers.canAddUser(
  //       organizationDetails?.id || CURRENT_USER.organization_id
  //     );

  //     if (!canAddResult.canAdd) {
  //       setIsLoading(false);
  //       if (canAddResult.reason === "User limit reached") {
  //         toast.error(
  //           `Team size limit reached! You have ${canAddResult.planDetails?.buy_quantity} seats and all are currently in use. Please upgrade your team size to invite more users.`,
  //           { duration: 5000 }
  //         );
  //       } else {
  //         toast.error(canAddResult.reason || "Cannot add user at this time");
  //       }
  //       return;
  //     }
  //   } catch (error) {
  //     setIsLoading(false);
  //     console.error("Error checking seat availability:", error);
  //     toast.error("Failed to verify team size availability");
  //     return;
  //   }

  //   const token = createJWT({ email }, "SG", "invite");

  //   const result = await dbHelpers.inviteUserByEmail(
  //     email,
  //     organizationDetails?.id || CURRENT_USER.organization_id || null,
  //     newUserRole,
  //     token,
  //     user?.id,
  //     isBetaUser ? "beta" : null
  //   );

  //   if (result.status === "invited" || result.status === "re-invited") {
  //     const formData = new FormData();
  //     formData.append("id", result?.id);
  //     const response = await fetch(
  //       `${config.api.baseUrl}${config.api.endpoints.userInvite}`,
  //       {
  //         method: "POST",
  //         body: formData,
  //       }
  //     );
  //     // console.log(response, "check response");
  //     toast.success(
  //       `Invitation ${
  //         result.status === "re-invited" ? "re-" : ""
  //       }sent to ${email}`
  //     );

  //     // Refresh invited users list
  //     try {
  //       const data = await dbHelpers.getInvitedPendingUsers(
  //         organizationDetails?.id
  //       );
  //       // supabase
  //       //   .from("invites")
  //       //   .select("*")
  //       //   .eq("organization_id", organizationDetails?.id)
  //       //   .eq("status", "pending")
  //       //   .order("invited_at", { ascending: false });

  //       // if (!error) {
  //       setInvitedUsers(data || []);
  //       // }
  //     } catch (err) {
  //       console.error("Error refreshing invited users:", err);
  //     }

  //     // Refresh organization plan to update seat counts
  //     await fetchOrganizationPlan();

  //     setIsLoading(false);
  //     // console.log("Invite ID:", result.id); // optional for webhook trigger
  //   } else if (result.status === "registered") {
  //     toast.info("User is already registered.");
  //     setIsLoading(false);
  //   } else if (result.status === "already-invited") {
  //     toast.info("User was already invited within the last 24 hours");
  //     setIsLoading(false);
  //   } else {
  //     toast.error(result.message || "Failed to invite user");
  //     setIsLoading(false);
  //   }

  //   setNewUserEmail("");

  //   setNewUserRole(null);
  // };

  const handleInviteUser = async () => {
    if (planDetails?.isExpired) {
      dispatch(
        setPlanExpiryModal({
          isOpen: true,
          featureName: "Invite Users",
          featureDescription:
            "Access AI-powered company research and insights to better understand your prospects and prepare for sales conversations.",
        })
      );
      return;
    }

    setIsLoading(true);
    const email = newUserEmail.trim();
    if (!email) {
      setIsLoading(false);
      toast.error("Please enter a valid email address");
      return;
    }

    const orgId = organizationDetails?.id || CURRENT_USER.organization_id;

    try {
      const canAddResult = await authHelpers.canAddUser(orgId);

      if (!canAddResult.canAdd) {
        setIsLoading(false);
        if (canAddResult.reason === "User limit reached") {
          toast.error(
            `Team size limit reached! You have ${canAddResult.planDetails?.buy_quantity} seats and all are currently in use. Please upgrade your team size to invite more users.`,
            { duration: 5000 }
          );
        } else {
          toast.error(canAddResult.reason || "Cannot add user at this time");
        }
        return;
      }
    } catch (error) {
      setIsLoading(false);
      console.error("Error checking seat availability:", error);
      toast.error("Failed to verify team size availability");
      return;
    }

    const token = createJWT({ email }, "SG", "invite");

    const result = await dbHelpers.inviteUserByEmail(
      email,
      orgId,
      newUserRole,
      token,
      user?.id,
      isBetaUser ? "beta" : null
    );

    if (result.status === "invited" || result.status === "re-invited") {
      try {
        await authHelpers.incrementUsedQuantity(orgId);

        const formData = new FormData();
        formData.append("id", result?.id);
        const response = await fetch(
          `${config.api.baseUrl}${config.api.endpoints.userInvite}`,
          {
            method: "POST",
            body: formData,
          }
        );

        toast.success(
          `Invitation ${
            result.status === "re-invited" ? "re-" : ""
          }sent to ${email}`
        );

        try {
          const data = await dbHelpers.getInvitedPendingUsers(orgId);
          setInvitedUsers(data || []);
        } catch (err) {
          console.error("Error refreshing invited users:", err);
        }

        await fetchOrganizationPlan();

        setNewUserEmail("");
        setNewUserRole(allTitles?.find((f) => f.role_id != 2)?.id);
      } catch (error) {
        console.error("Error updating seat count:", error);
        toast.error(
          "Invitation sent but failed to update seat count. Please refresh the page."
        );
      }
      setIsLoading(false);
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
  };

  const handleRemoveInvite = async (inviteId) => {
    setRemovingInviteId(inviteId);

    try {
      const orgId = organizationDetails?.id || CURRENT_USER.organization_id;

      const { error } = await supabase
        .from("invites")
        .update({
          status: "completed",
          token: null,
        })
        .eq("id", inviteId);

      if (error) {
        throw error;
      }

      await authHelpers.decrementUsedQuantity(orgId);

      const data = await dbHelpers.getInvitedPendingUsers(orgId);
      setInvitedUsers(data || []);

      await fetchOrganizationPlan();

      toast.success("Invitation removed successfully");
    } catch (error) {
      console.error("Error removing invite:", error);
      toast.error("Failed to remove invitation");
    } finally {
      setRemovingInviteId(null);
    }
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
    if (planDetails?.isExpired) {
      // Show plan expiry modal
      dispatch(
        setPlanExpiryModal({
          isOpen: true,
          featureName: "Supply Business Materials",
          featureDescription:
            "Access AI-powered company research and insights to better understand your prospects and prepare for sales conversations.",
        })
      );
      return;
    }
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
    if (planDetails?.isExpired) {
      // Show plan expiry modal
      dispatch(
        setPlanExpiryModal({
          isOpen: true,
          featureName: "Connect HubSpot",
          featureDescription:
            "Access AI-powered company research and insights to better understand your prospects and prepare for sales conversations.",
        })
      );
      return;
    }
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
        //   })
        // );

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
          {console.log(userRoleId, userRole, "check user role id")}
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
          <TabsTrigger value="billing" className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4" />
            <span>Billing</span>
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
                <div className="grid grid-cols-2 gap-4">
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
                  {/* Phone Number */}
                  <div className="space-y-2">
                    <Label className="flex items-center space-x-2">
                      <Phone className="w-4 h-4" />
                      <span>Phone Number</span>
                    </Label>

                    <div className="phone-input">
                      <PhoneInput
                        placeholder="Enter phone number"
                        value={profileSettings.phoneNumber}
                        onChange={(value) =>
                          setProfileSettings((prev) => ({
                            ...prev,
                            phoneNumber: value || "",
                          }))
                        }
                        defaultCountry="US"
                        international
                        countryCallingCodeEditable={false}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
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

            {/* Meeting Recording Integration */}
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Mic className="w-5 h-5" />
                    <span>Meeting Recording Integration</span>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    Connect your meeting recording platforms to automatically
                    sync transcripts and recordings
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Integrated Platforms - Compact Display */}
                  {/* <div>
                    <Label className="text-sm font-medium mb-3 block">
                      Connected Platforms
                    </Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      
                      {firefliesStatus?.connected && (
                        <div className="relative group">
                          <div className="border-2 border-green-200 bg-green-50 rounded-lg p-3 hover:shadow-md transition-all cursor-pointer">
                            <div className="flex flex-col items-center text-center space-y-2">
                              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                                <Zap className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-sm text-foreground">
                                  Fireflies.ai
                                </h4>
                                <div className="flex items-center justify-center mt-1">
                                  <CheckCircle className="w-3 h-3 text-green-600 mr-1" />
                                  <span className="text-xs text-green-700">
                                    Connected
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                     
                      {fathomStatus?.connected && (
                        <div className="relative group">
                          <div className="border-2 border-green-200 bg-green-50 rounded-lg p-3 hover:shadow-md transition-all cursor-pointer">
                            <div className="flex flex-col items-center text-center space-y-2">
                              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                                <Calendar className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-sm text-foreground">
                                  Fathom
                                </h4>
                                <div className="flex items-center justify-center mt-1">
                                  <CheckCircle className="w-3 h-3 text-green-600 mr-1" />
                                  <span className="text-xs text-green-700">
                                    Connected
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {!firefliesStatus?.connected &&
                      !fathomStatus?.connected && (
                        <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-4 text-center">
                          <AlertCircle className="w-5 h-5 mx-auto mb-2 text-muted-foreground" />
                          No platforms connected yet. Connect a platform below
                          to get started.
                        </div>
                      )}
                  </div>

                  <Separator /> */}

                  {/* Available Integrations - Expandable */}
                  <div>
                    {/* <Label className="text-sm font-medium mb-3 block">
                      Available Platforms
                    </Label> */}
                    <div className="space-y-3">
                      {/* Fireflies Integration */}
                      {!firefliesStatus?.connected && (
                        <Collapsible>
                          <div className="border rounded-lg">
                            <CollapsibleTrigger asChild>
                              <div className="flex items-center justify-between p-3 hover:bg-muted/50 cursor-pointer rounded-lg transition-colors">
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center flex-shrink-0">
                                    <Zap className="w-5 h-5 text-white" />
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-sm">
                                      Fireflies.ai
                                    </h4>
                                    <p className="text-xs text-muted-foreground">
                                      AI meeting transcription
                                    </p>
                                  </div>
                                </div>
                                <Badge
                                  variant="outline"
                                  className="bg-gray-100 text-gray-800 border-gray-200"
                                >
                                  <Plus className="w-3 h-3 mr-1" />
                                  Connect
                                </Badge>
                              </div>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <div className="border-t p-4 space-y-4 bg-muted/20">
                                <div className="space-y-2">
                                  <Label
                                    htmlFor="fireflies-token"
                                    className="text-sm"
                                  >
                                    Fireflies API Token
                                  </Label>
                                  <div className="relative">
                                    <Input
                                      id="fireflies-token"
                                      type={
                                        showFirefliesToken ? "text" : "password"
                                      }
                                      placeholder="Enter your Fireflies API token"
                                      value={firefliesToken}
                                      onChange={(e) =>
                                        setFirefliesToken(e.target.value)
                                      }
                                      className="pr-10"
                                    />
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                      onClick={() =>
                                        setShowFirefliesToken(
                                          !showFirefliesToken
                                        )
                                      }
                                    >
                                      {showFirefliesToken ? (
                                        <EyeOff className="h-4 w-4" />
                                      ) : (
                                        <Eye className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    Find your API key: Settings → Developer
                                    Settings → Generate/View API Key
                                  </p>
                                </div>
                                <Button
                                  onClick={handleFirefliesConnect}
                                  disabled={
                                    isConnectingFireflies ||
                                    !firefliesToken.trim()
                                  }
                                  className="w-full"
                                  size="sm"
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
                            </CollapsibleContent>
                          </div>
                        </Collapsible>
                      )}

                      {/* Fireflies - When Connected */}
                      {firefliesStatus?.connected && (
                        <div className="border-2 border-green-200 rounded-lg bg-green-50/50 p-3">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center flex-shrink-0">
                                <Zap className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-sm">
                                  Fireflies.ai
                                </h4>
                                <div className="flex items-center mt-0.5">
                                  <CheckCircle className="w-3 h-3 text-green-600 mr-1" />
                                  <span className="text-xs text-green-700">
                                    Integration Active
                                  </span>
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleFirefliesDisconnect}
                              disabled={isDisconnectingFireflies}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              {isDisconnectingFireflies ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                "Disconnect"
                              )}
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Fathom Integration */}
                      {!fathomStatus?.connected && (
                        <Collapsible>
                          <div className="border rounded-lg">
                            <CollapsibleTrigger asChild>
                              <div className="flex items-center justify-between p-3 hover:bg-muted/50 cursor-pointer rounded-lg transition-colors">
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0">
                                    <Calendar className="w-5 h-5 text-white" />
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-sm">
                                      Fathom
                                    </h4>
                                    <p className="text-xs text-muted-foreground">
                                      Free meeting recorder
                                    </p>
                                  </div>
                                </div>
                                <Badge
                                  variant="outline"
                                  className="bg-gray-100 text-gray-800 border-gray-200"
                                >
                                  <Plus className="w-3 h-3 mr-1" />
                                  Connect
                                </Badge>
                              </div>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                              <div className="border-t p-4 space-y-4 bg-muted/20">
                                <div className="space-y-2">
                                  <Label
                                    htmlFor="fathom-token"
                                    className="text-sm"
                                  >
                                    Fathom API Token
                                  </Label>
                                  <div className="relative">
                                    <Input
                                      id="fathom-token"
                                      type={
                                        showFathomToken ? "text" : "password"
                                      }
                                      placeholder="Enter your Fathom API token"
                                      value={fathomToken}
                                      onChange={(e) =>
                                        setFathomToken(e.target.value)
                                      }
                                      className="pr-10"
                                    />
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                      onClick={() =>
                                        setShowFathomToken(!showFathomToken)
                                      }
                                    >
                                      {showFathomToken ? (
                                        <EyeOff className="h-4 w-4" />
                                      ) : (
                                        <Eye className="h-4 w-4" />
                                      )}
                                    </Button>
                                  </div>
                                  <p className="text-xs text-muted-foreground">
                                    Find your API key: Settings → Generate/View
                                    API Key
                                  </p>
                                </div>
                                <Button
                                  onClick={handleFathomConnect}
                                  disabled={
                                    isConnectingFathom || !fathomToken.trim()
                                  }
                                  className="w-full"
                                  size="sm"
                                >
                                  {isConnectingFathom ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      Connecting...
                                    </>
                                  ) : (
                                    <>
                                      <ExternalLink className="w-4 h-4 mr-2" />
                                      Connect Fathom
                                    </>
                                  )}
                                </Button>
                              </div>
                            </CollapsibleContent>
                          </div>
                        </Collapsible>
                      )}

                      {/* Fathom - When Connected */}
                      {fathomStatus?.connected && (
                        <div className="border-2 border-green-200 rounded-lg bg-green-50/50 p-3">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0">
                                <Calendar className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-sm">
                                  Fathom
                                </h4>
                                <div className="flex items-center mt-0.5">
                                  <CheckCircle className="w-3 h-3 text-green-600 mr-1" />
                                  <span className="text-xs text-green-700">
                                    Integration Active
                                  </span>
                                </div>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleFathomDisconnect}
                              disabled={isDisconnectingFathom}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              {isDisconnectingFathom ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                "Disconnect"
                              )}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
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

              {/* <Card>
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
              </Card> */}

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
                          Settings → Integrations → Legacy Apps → Create App →
                          Add scopes → Token
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
                <>
                  {!canInviteUsers ? (
                    <Card className="shadow-sm border-2 border-dashed border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
                      <CardContent className="pt-6">
                        <div className="text-center py-8">
                          <div className="mb-6">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 mb-4">
                              <Users className="w-10 h-10 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">
                              Invite Team Members
                            </h3>
                            <p className="text-gray-600 max-w-md mx-auto">
                              Upgrade to an{" "}
                              <span className="font-semibold text-blue-600">
                                Organization Plan
                              </span>{" "}
                              to invite team members and collaborate together.
                            </p>
                          </div>

                          <div className="bg-white rounded-lg p-6 max-w-lg mx-auto mb-6 shadow-sm">
                            <div className="flex items-start gap-3 text-left mb-4">
                              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="font-medium text-gray-900">
                                  Unlimited Team Members
                                </p>
                                <p className="text-sm text-gray-600">
                                  Add as many users as you need
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3 text-left mb-4">
                              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="font-medium text-gray-900">
                                  Shared Workspace
                                </p>
                                <p className="text-sm text-gray-600">
                                  Collaborate on deals and insights
                                </p>
                              </div>
                            </div>
                            <div className="flex items-start gap-3 text-left">
                              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="font-medium text-gray-900">
                                  Role-Based Access
                                </p>
                                <p className="text-sm text-gray-600">
                                  Control permissions for team members
                                </p>
                              </div>
                            </div>
                          </div>

                          <Button
                            onClick={() => dispatch(setShowUpgradeModal(true))}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl px-8 py-6 text-lg h-auto gap-2"
                          >
                            <Crown className="w-5 h-5" />
                            Upgrade to Organization Plan
                          </Button>

                          <p className="text-xs text-gray-500 mt-4">
                            Currently on{" "}
                            {planDetails?.plan_master?.plan_name || "Free"} plan
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="shadow-sm">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex items-center gap-2">
                            <Plus className="w-5 h-5" />
                            <h3 className="text-xl font-semibold">
                              Invite New User
                            </h3>
                          </div>

                          {!isLoadingOrgPlan && orgPlan && (
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-6 px-4 py-2 bg-muted/50 rounded-lg">
                                <div className="text-center">
                                  <p className="text-xs text-muted-foreground mb-1">
                                    Team Size
                                  </p>
                                  <p className="text-lg font-bold">
                                    {orgPlan.buy_quantity}
                                  </p>
                                </div>
                                <Separator
                                  orientation="vertical"
                                  className="h-10"
                                />
                                <div className="text-center">
                                  <p className="text-xs text-muted-foreground mb-1">
                                    Used
                                  </p>
                                  <p className="text-lg font-bold">
                                    {orgPlan.used_quantity}
                                  </p>
                                </div>
                                <Separator
                                  orientation="vertical"
                                  className="h-10"
                                />
                                <div className="text-center">
                                  <p className="text-xs text-muted-foreground mb-1">
                                    Available
                                  </p>
                                  <p
                                    className={cn(
                                      "text-lg font-bold",
                                      orgPlan.remaining_quantity === 0
                                        ? "text-red-600"
                                        : orgPlan.remaining_quantity <= 2
                                        ? "text-amber-600"
                                        : "text-green-600"
                                    )}
                                  >
                                    {orgPlan.remaining_quantity}
                                  </p>
                                </div>
                              </div>
                              {console.log(orgPlan, "org plan details")}
                              {orgPlan.status != "canceled" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-2 h-10"
                                  onClick={() =>
                                    setShowUpdateTeamSizeDialog(true)
                                  }
                                >
                                  <Target className="w-4 h-4" />
                                  Update Team Size
                                </Button>
                              )}
                            </div>
                          )}
                          {isLoadingOrgPlan && (
                            <div className="flex items-center text-muted-foreground px-4 py-2">
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              <span className="text-sm">Loading...</span>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-12 gap-4 items-end">
                          <div className="col-span-6">
                            <label className="text-sm font-medium mb-2 block">
                              Email Address
                            </label>
                            <Input
                              value={newUserEmail}
                              onChange={(e) => setNewUserEmail(e.target.value)}
                              placeholder="user@acmecorp.com"
                              type="email"
                              className="h-11"
                            />
                          </div>
                          {user?.title_id != 45 && (
                            <div className="col-span-3">
                              <label className="text-sm font-medium mb-2 block">
                                Role
                              </label>
                              <Select
                                value={newUserRole?.toString()}
                                onValueChange={(value) =>
                                  setNewUserRole(Number(value))
                                }
                              >
                                <SelectTrigger className="h-11">
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

                          <div
                            className={
                              user?.title_id != 45 ? "col-span-3" : "col-span-6"
                            }
                          >
                            <Button
                              onClick={handleInviteUser}
                              disabled={
                                isLoading ||
                                (orgPlan && orgPlan.remaining_quantity === 0)
                              }
                              className="w-full h-11 gap-2"
                              size="lg"
                            >
                              {isLoading ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  Sending invite...
                                </>
                              ) : (
                                <>
                                  <Plus className="w-4 h-4" />
                                  Send Invite
                                </>
                              )}
                            </Button>
                          </div>
                        </div>

                        {orgPlan && orgPlan.remaining_quantity === 0 && (
                          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm text-red-900 font-medium">
                                Team size limit reached
                              </p>
                              <p className="text-xs text-red-700 mt-0.5">
                                All {orgPlan.buy_quantity} seats are currently
                                in use. Please upgrade your team size to invite
                                more users.
                              </p>
                            </div>
                          </div>
                        )}

                        {/* {orgPlan && orgPlan.remaining_quantity > 0 && orgPlan.remaining_quantity <= 2 && (
                      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-amber-900 font-medium">Low availability</p>
                          <p className="text-xs text-amber-700 mt-0.5">
                            Only {orgPlan.remaining_quantity} seat{orgPlan.remaining_quantity === 1 ? '' : 's'} remaining. Consider upgrading your team size.
                          </p>
                        </div>
                      </div>
                    )} */}
                      </CardContent>
                    </Card>
                  )}
                </>
              )}

              {/* Invited Users List */}
              {user?.title_id != 45 && canInviteUsers && (
                <Collapsible
                  open={isInvitedUsersOpen}
                  onOpenChange={setIsInvitedUsersOpen}
                >
                  <Card>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <CardTitle className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <UserCheck className="w-5 h-5" />
                            Invited Users
                          </span>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {invitedUsers?.length || 0} invited
                            </Badge>
                            <ChevronDown
                              className={cn(
                                "w-5 h-5 transition-transform duration-200",
                                isInvitedUsersOpen && "transform rotate-180"
                              )}
                            />
                          </div>
                        </CardTitle>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent>
                        <div className="space-y-4">
                          {invitedUsers?.length > 0 &&
                            invitedUsers?.map((invite) => {
                              const role = {
                                label:
                                  allTitles?.find(
                                    (x) => x.id == invite?.title_id
                                  )?.name || "User",
                                icon: User,
                                color:
                                  "bg-amber-100 text-amber-800 border-amber-200",
                              };

                              return (
                                <div
                                  key={invite.id}
                                  className="flex items-center justify-between p-5 border border-amber-200/60 bg-gradient-to-r from-amber-50/40 to-orange-50/30 rounded-xl hover:shadow-md hover:border-amber-300/80 transition-all duration-200"
                                >
                                  <div className="flex items-center space-x-4 flex-1">
                                    <div className="relative">
                                      <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl flex items-center justify-center shadow-sm">
                                        <UserCheck className="w-6 h-6 text-amber-700" />
                                      </div>
                                      <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full border-2 border-white flex items-center justify-center">
                                        <Clock className="w-2.5 h-2.5 text-white" />
                                      </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-semibold text-foreground truncate mb-1">
                                        {invite.email}
                                      </p>
                                      <p className="text-xs text-muted-foreground mb-2">
                                        Awaiting acceptance
                                      </p>
                                      <div className="flex items-center gap-2">
                                        <Badge
                                          variant="outline"
                                          className="text-xs bg-white/60 text-amber-900 border-amber-300/40 shadow-sm"
                                        >
                                          <role.icon className="w-3 h-3 mr-1" />
                                          {role?.label}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-end gap-2 ml-4">
                                    <div className="flex items-center gap-2">
                                      <Badge
                                        variant="outline"
                                        className="text-xs font-medium bg-amber-100/80 text-amber-800 border-amber-300/60 px-2.5 py-1"
                                      >
                                        <Clock className="w-3 h-3 mr-1" />
                                        Pending
                                      </Badge>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                          handleRemoveInvite(invite.id)
                                        }
                                        disabled={
                                          removingInviteId === invite.id
                                        }
                                        className="h-7 px-3 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-muted-foreground text-xs"
                                      >
                                        {removingInviteId === invite.id ? (
                                          <>
                                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                            Removing...
                                          </>
                                        ) : (
                                          <>
                                            <X className="w-3 h-3 mr-1" />
                                            Revoke
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                    <span className="text-xs text-amber-700/70 flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      {invite.invited_at
                                        ? new Date(
                                            invite.invited_at
                                          ).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                          })
                                        : "-"}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          {invitedUsers?.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                              <UserCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
                              <p>No pending invitations</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              )}

              {/* Active Users List */}
              {canInviteUsers && (
                <Collapsible
                  open={isActiveUsersOpen}
                  onOpenChange={setIsActiveUsersOpen}
                >
                  <Card>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <CardTitle className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            {user?.title_id == 45 ? (
                              <>
                                <Building className="w-5 h-5" />
                                Organizations
                              </>
                            ) : (
                              <>
                                <Users className="w-5 h-5" />
                                Active Users
                              </>
                            )}
                          </span>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">
                              {user?.title_id == 45
                                ? getOrgList?.length + " organizations"
                                : getUserslist?.length +
                                  // ?.filter(
                                  //     (u) =>
                                  //       allStatus?.find((s) => s?.id == u.status_id)
                                  //         ?.label === "active"
                                  //   )
                                  // ?.filter((u) => u.id != user?.id)?.length +
                                  " active users"}
                            </Badge>
                            <ChevronDown
                              className={cn(
                                "w-5 h-5 transition-transform duration-200",
                                isActiveUsersOpen && "transform rotate-180"
                              )}
                            />
                          </div>
                        </CardTitle>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent>
                        {user?.title_id == 45 ? (
                          <div className="space-y-4">
                            {getOrgList?.length > 0 &&
                              getOrgList?.map((org) => {
                                const role = userRoles[org.role] || {
                                  label: "Unknown",
                                  icon: User,
                                  color:
                                    "bg-gray-100 text-gray-700 border-gray-200",
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
                                        <p className="font-medium">
                                          {org.name}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                          {org.domain}
                                        </p>
                                        <div className="flex items-center space-x-2 mt-1">
                                          {org.industry_id && (
                                            <Badge
                                              variant="outline"
                                              className={cn(
                                                "text-xs",
                                                role.color
                                              )}
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
                                // ?.filter(
                                //   (u) =>
                                //     u.id != user?.id &&
                                //     allStatus?.find((s) => s?.id == u.status_id)
                                //       ?.label === "active"
                                // )
                                // ?.filter((u) => u.id != user?.id)
                                ?.map((listUser) => {
                                  const getId = allTitles?.find(
                                    (x) => x.id == listUser?.title_id
                                  )?.role_id;
                                  const role = {
                                    label: allTitles?.find(
                                      (x) => x.id == listUser?.title_id
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
                                    <ActiveUserCard
                                      key={listUser.id}
                                      listUser={listUser}
                                      role={role}
                                      allStatus={allStatus}
                                      user={user}
                                      userRoleId={userRoleId}
                                    />
                                  );
                                })}
                            {getUserslist?.length === 0 && (
                              // ?.filter(
                              //   (u) =>
                              //     u.id != user?.id &&
                              //     allStatus?.find((s) => s?.id == u.status_id)
                              //       ?.label === "active"
                              // )
                              // ?.filter((u) => u.id != user?.id)?.length === 0 && (
                              <div className="text-center py-8 text-muted-foreground">
                                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>No active users found</p>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              )}
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
                                        handleDeleteClick(
                                          knowledge,
                                          "business"
                                        );
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
                </CardTitle>

                <p className="text-sm text-muted-foreground">
                  Your personal sales knowledge, experiences, and preferred
                  approaches
                </p>
              </CardHeader>
              <CardContent>
                {isUploadingPersonal && (
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-3 mb-2">
                      <Upload className="w-5 h-5 text-blue-600" />
                      <span className="font-medium text-blue-800">
                        Uploading personal material...
                      </span>
                    </div>
                    <Progress
                      value={personalUploadProgress}
                      className="w-full"
                    />
                    <p className="text-sm text-blue-700 mt-2">
                      {personalUploadProgress < 50
                        ? "Uploading file..."
                        : personalUploadProgress < 90
                        ? "Processing content..."
                        : "Finalizing..."}
                    </p>
                  </div>
                )}

                <div className="space-y-4">
                  <div
                    {...getPersonalRootProps()}
                    className={cn(
                      "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                      isPersonalDragActive
                        ? "border-blue-500 bg-blue-50"
                        : "border-border hover:border-blue-400 hover:bg-blue-50/50",
                      isUploadingPersonal && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <input {...getPersonalInputProps()} />
                    {isUploadingPersonal ? (
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
                          {isPersonalDragActive
                            ? "Drop the file here"
                            : "Upload Personal Materials"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {isPersonalDragActive
                            ? "Release to upload"
                            : "Click to browse or drag and drop multiple files here"}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          PDF, TXT (Max 10MB each, multiple files supported)
                        </p>
                      </>
                    )}
                  </div>

                  {console.log(
                    processedPersonalData,
                    "processed personal data"
                  )}
                  <div className="space-y-2">
                    {processedPersonalData?.length > 0
                      ? processedPersonalData?.map((knowledge) => (
                          <Card
                            key={knowledge.id}
                            className="cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() =>
                              handleViewPersonalKnowledge(knowledge)
                            }
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-3 flex-1">
                                  <Building className="w-5 h-5 text-primary mt-1" />
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-lg mb-1">
                                      {knowledge.rep_name ||
                                        "Unnamed Organization"}
                                    </h3>
                                    <p className="text-sm text-muted-foreground mb-3 line-clamp-1">
                                      {knowledge.summary_note?.substring(
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
                                      {knowledge.updated_at != null && (
                                        <span>
                                          Updated:{" "}
                                          {new Date(
                                            knowledge.updated_at
                                          ).toLocaleDateString()}
                                        </span>
                                      )}
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
                                      handleViewPersonalKnowledge(knowledge)
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
                                      handleDeleteClick(knowledge, "personal");
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
                      : ""}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Access */}
        <TabsContent value="billing" className="mt-6">
          <BillingComponent
            orgPlan={orgPlan}
            onPlanUpdate={fetchOrganizationPlan}
          />
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
                      <div className="flex items-start space-x-3 flex-1">
                        <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">
                            {file.original_filename || file.filename}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {file.description || "No description available"}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-2">
                            <span>
                              Size: {(file.file_size / 1024).toFixed(1)} KB
                            </span>
                            <span>Type: {file.content_type}</span>
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
                          disabled={!file.file_url}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View File
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

      <PersonalInsightsModal
        isOpen={showPersonalInsightsModal}
        onClose={() => setShowPersonalInsightsModal(false)}
        data={personalInsightsData}
        onSave={handleUpdatePersonalInsights}
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
                    {fileToDelete.organization_name || fileToDelete?.rep_name}
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

      <UpgradePlanDialog />
      {/* {console.log(orgPlan, "organizationPlan 326")} */}
      {orgPlan && (
        <UpdateTeamSizeDialog
          isOpen={showUpdateTeamSizeDialog}
          onClose={() => setShowUpdateTeamSizeDialog(false)}
          organizationPlan={{
            id: orgPlan.id,
            buy_quantity: orgPlan.buy_quantity || 0,
            used_quantity: orgPlan.used_quantity || 0,
            amount: orgPlan.amount || 0,
            currency: orgPlan.currency || "usd",
            plan_id: orgPlan.plan_id,
            stripe_subscription_id: orgPlan.stripe_subscription_id,
          }}
          onSuccess={handleTeamSizeUpdateSuccess}
        />
      )}
    </div>
  );
};

export default Settings;
