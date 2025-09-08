import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
  Copy,
  ExternalLink,
  Loader2,
  Building,
  User,
  Target,
  Lightbulb,
  FileText,
  CheckSquare,
  AlertTriangle,
  Plus,
  TrendingUp,
  BarChart3,
  MessageSquare,
  RefreshCw,
  ArrowLeft,
  Eye,
  Calendar,
  CheckCircle,
  AlertCircle,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Users,
  Briefcase,
  Globe,
  DollarSign,
  Rocket,
  ArrowRight,
  ShieldOff,
  Shield,
  PieChart,
  Activity,
  Compass,
  Star,
  Brain,
  Zap,
  HelpCircle,
  Package,
  Award,
  Clock,
  Network,
  ChevronUp,
} from "lucide-react";
import { toast } from "sonner";
import DOMPurify from "dompurify";
import { cn } from "@/lib/utils";
import { dbHelpers, CURRENT_USER } from "@/lib/supabase";
import { usePageTimer } from "../hooks/userPageTimer";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useSelector } from "react-redux";
import { config } from "@/lib/config";
import { useDropzone } from "react-dropzone";
import { supabase } from "@/lib/supabase";

import { fileStorage } from "@/lib/fileStorage";
interface ResearchFormData {
  companyName: string;
  companyWebsite: string;
  prospectFiles: File[]; // PDF files for prospect analysis
}

interface UploadedFile {
  id: string;
  file: File;
  storagePath?: string;
  publicUrl?: string;
  name: string;
  size: number;
  uploading: boolean;
  uploaded: boolean;
  storageUrl?: string;
  error?: string;
}

interface ResearchResult {
  companyName: string;
  companyOverview: string;
  sector: string;
  size: string;
  geographicScope: string;
  natureOfBusiness: string;
  keyPositioning: string;
  growthOpportunities: string[];
  marketTrends: string[];
  summaryNote: string;
  sources: string[];
  recommendations: any;
  prospectProfiles: Array<{
    name: string;
    communicationStyle: string;
    personalityType: string;
  }>;
  profiles: UploadedFile[];
}

interface StoredResearch {
  id: string;
  company_name: string;
  company_url: string;
  prospect_urls: string[];
  created_at: string;
  sector: string;
  size: string;
  summary_note: string;
  company_analysis: string;
  geographic_scope: string;
  nature_of_business: string;
  key_positioning: string;
  growth_opportunities: string[];
  market_trends: string[];
  sources: string[];
  recommendations: string;
  prospect_profiles: Array<{
    name: string;
    communicationStyle: string;
    personalityType: string;
  }>;
  uploaded_file_ids: string[];
  uploaded_file_paths: string[];
}

const Research = () => {
  usePageTimer("Research");

  const [currentView, setCurrentView] = useState<
    "form" | "results" | "history"
  >("form");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [formData, setFormData] = useState<ResearchFormData>({
    companyName: "",
    companyWebsite: "",
    prospectFiles: [], // initialize with empty array
  });
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploadingFiles, setIsUploadingFiles] = useState(false);

  const [researchResult, setResearchResult] = useState<ResearchResult | null>(
    null
  );
  const [researchHistory, setResearchHistory] = useState<StoredResearch[]>([]);
  const [activeTab, setActiveTab] = useState("analysis");
  const [prospectInCRM, setProspectInCRM] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<number[]>([]);
  const {
    userProfileInfo,
    userRole,
    userRoleId,
    titleName,
    organizationDetails,
    user,
    hubspotIntegration,
  } = useSelector((state) => state.auth);
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({});
  const { businessKnowledge, personalInsightKnowledge } = useSelector(
    (state) => state.org
  );

  console.log("business knowledge data", businessKnowledge);
  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const [historySearch, setHistorySearch] = useState("");
  const filteredHistory =
    researchHistory?.length > 0
      ? researchHistory.filter((r) => {
          const q = historySearch.trim().toLowerCase();
          if (!q) return true;
          return (
            r.company_name?.toLowerCase().includes(q) ||
            r.company_url?.toLowerCase().includes(q) ||
            r.sector?.toLowerCase().includes(q) ||
            r.summary_note?.toLowerCase().includes(q)
          );
        })
      : [];

  // Form validation
  const isFormValid =
    formData.companyName.trim() !== "" && formData.companyWebsite.trim() !== "";

  const toggleQuestion = (index: number) => {
    setExpandedQuestions((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  // Handle form input changes
  const handleInputChange = (field: keyof ResearchFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // File upload handling
  const onDrop = (acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map((file) => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      name: file.name,
      size: file.size,
      uploading: false,
      uploaded: false,
    }));

    setUploadedFiles((prev) => [...prev, ...newFiles]);
    setFormData((prev) => ({
      ...prev,
      prospectFiles: [...prev.prospectFiles, ...acceptedFiles],
    }));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    maxFiles: 5,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const removeFile = (fileId: string) => {
    setUploadedFiles((prev) => {
      const updatedFiles = prev.filter((f) => f.id !== fileId);
      const updatedFormFiles = updatedFiles.map((f) => f.file);
      setFormData((prevForm) => ({
        ...prevForm,
        prospectFiles: updatedFormFiles,
      }));
      return updatedFiles;
    });
  };

  const uploadFilesToStorage = async (): Promise<string[]> => {
    if (uploadedFiles.length === 0) return [];

    setIsUploadingFiles(true);
    const uploadedUrls: string[] = [];

    try {
      for (const fileItem of uploadedFiles) {
        if (fileItem.uploaded) {
          uploadedUrls.push(fileItem.storageUrl!);
          continue;
        }

        // Update file status to uploading
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === fileItem.id ? { ...f, uploading: true } : f
          )
        );

        // Generate unique filename
        const timestamp = Date.now();
        const uniqueFileName = `research-files/${user?.id}/${timestamp}_${fileItem.file.name}`;

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("research-files")
          .upload(uniqueFileName, fileItem.file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          console.error("Storage upload error:", uploadError);
          // Update file status to error
          setUploadedFiles((prev) =>
            prev.map((f) =>
              f.id === fileItem.id
                ? { ...f, uploading: false, error: uploadError.message }
                : f
            )
          );
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from("research-files")
          .getPublicUrl(uniqueFileName);

        // Update file status to uploaded
        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === fileItem.id
              ? {
                  ...f,
                  uploading: false,
                  uploaded: true,
                  storageUrl: urlData.publicUrl,
                }
              : f
          )
        );

        uploadedUrls.push(urlData.publicUrl);
      }

      return uploadedUrls;
    } catch (error) {
      console.error("Error uploading files:", error);
      toast.error("Failed to upload files");
      return [];
    } finally {
      setIsUploadingFiles(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setIsLoading(true);

    const fieldsToRemove = [
      "id",
      "organization_id",
      "user_id",
      "processed_file_ids",
      "is_active",
      "updated_at",
      "created_at",
    ];

    // const cleanedData = businessKnowledge.map(
    //   ({
    //     id,
    //     organization_id,
    //     user_id,
    //     processed_file_ids,
    //     is_active,
    //     updated_at,
    //     created_at,
    //     ...rest
    //   }) => rest
    // );
    try {
      // Create FormData for API request with proper file handling
      const orgContext =
        businessKnowledge?.length > 0 && businessKnowledge != null
          ? "Seller Organization Contexts:" + JSON.stringify(businessKnowledge)
          : "";
      const repContext =
        personalInsightKnowledge?.length > 0 && personalInsightKnowledge != null
          ? "Seller Rep Contexts:" + JSON.stringify(personalInsightKnowledge)
          : "";
      const contextData =
        businessKnowledge?.length > 0 &&
        businessKnowledge != null &&
        personalInsightKnowledge?.length > 0 &&
        personalInsightKnowledge != null
          ? orgContext + repContext
          : businessKnowledge?.length > 0 && businessKnowledge != null
          ? orgContext
          : personalInsightKnowledge?.length > 0 &&
            personalInsightKnowledge != null
          ? repContext
          : "";
      const apiFormData = new FormData();
      apiFormData.append("companyName", formData.companyName);
      apiFormData.append("companyUrl", formData.companyWebsite);
      apiFormData.append("org_context", JSON.stringify(businessKnowledge));

      // Add files to FormData with consistent naming
      uploadedFiles.forEach((file, index) => {
        apiFormData.append("profiles", file.file); // Use 'profiles' as the field name
      });

      // Add metadata
      // apiFormData.append("fileCount", uploadedFiles.length.toString());
      // apiFormData.append("userId", user?.id || "");

      // Log FormData contents for debugging
      console.log("📤 API FormData contents:");
      for (let [key, value] of apiFormData.entries()) {
        if (value instanceof File) {
          console.log(`  ${key}:`, {
            name: value.name,
            size: value.size,
            type: value.type,
          });
        } else {
          console.log(`  ${key}:`, value);
        }
      }
      const response = await fetch(
        `${config.api.baseUrl}${config.api.endpoints.companyResearch}`,
        {
          method: "POST",
          body: apiFormData,
          // headers: {
          //   // Don't set Content-Type - let browser set it with boundary for FormData
          //   Authorization: `Bearer ${api.auth.getToken() || ""}`,
          // },
        }
      );

      const uploadedFileData = [];
      const uploadedFileUrls = [];
      for (const file of uploadedFiles) {
        try {
          const fileData = await fileStorage.uploadFile(file, user?.id);

          // const { data: fileRecord, error: fileError } = await supabase
          //   .from("uploaded_files")
          //   .insert([
          //     {
          //       user_id: userId,
          //       filename: fileData.fileName,
          //       file_type: "application/pdf",
          //       file_size: fileData.fileSize,
          //       content_type: fileData.contentType,
          //       file_url: fileData.publicUrl,
          //       storage_path: fileData.filePath,
          //       is_processed: true,
          //     },
          //   ])
          //   .select()
          //   .single();

          // if (fileError) {
          //   console.error("Error saving file metadata:", fileError);
          //   throw new Error(`Failed to save file metadata for ${file.name}`);
          // }

          uploadedFileData.push({
            // id: fileRecord.id,
            file: file,
            storagePath: fileData.filePath,
            publicUrl: fileData.publicUrl,
            fileName: fileData.fileName,
            fileSize: fileData.fileSize,
            contentType: fileData.contentType,
          });
        } catch (uploadError) {
          console.error("Error uploading file:", uploadError);
          throw new Error(
            `Failed to upload ${file.name}: ${uploadError.message}`
          );
        }
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `API request failed: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const apiResponseData = await response.json();
      const data = apiResponseData;
      // const result = data[0]?.output;
      const result = data?.[0];

      // const output = result.output || result;
      const output = result;

      for (const fileItem of uploadedFiles) {
        try {
          // Upload to Supabase Storage
          const fileData = await fileStorage.uploadFile(
            fileItem.file,
            user?.id
          );

          uploadedFileData.push({
            file: fileItem.file,
            storagePath: fileData.filePath,
            publicUrl: fileData.publicUrl,
            fileName: fileData.fileName,
            fileSize: fileData.fileSize,
            contentType: fileData.contentType,
          });
        } catch (uploadError) {
          console.error("Error uploading file:", uploadError);
          throw new Error(
            `Failed to upload ${fileItem.file.name}: ${uploadError.message}`
          );
        }
      }

      setResearchResult({
        companyName: output.companyName || formData.companyName,
        companyOverview: output.companyOverview || "",
        sector: output.sector || "",
        size: output.size || "",
        geographicScope: output.geographicScope || "",
        natureOfBusiness: output.natureOfBusiness || "",
        keyPositioning: output.keyPositioning || "",
        growthOpportunities: output.growthOpportunities || [],
        marketTrends: output.marketTrends || [],
        summaryNote: output.summaryNote || "",
        sources: output.sources || [],
        recommendations: output.recommendations || {},
        prospectProfiles: output?.prospectProfiles || [],
        profiles: uploadedFileData || [],
        executiveSummary: output?.executiveSummary,
        companyAnalysisDetails: output?.companyAnalysisDetails,
        marketAnalysis: output?.marketAnalysis,
        demandSide: output?.demandSide,
        is_new: true,
      });

      await dbHelpers.saveResearchCompany({
        user_id: user?.id,
        company_name: formData.companyName,
        company_url: formData.companyWebsite,
        prospect_urls: uploadedFileUrls || [],
        // company_analysis: output.companyOverview,
        prospect_analysis: "",
        sources: output.sources || [],
        recommendations: JSON.stringify(output.recommendations || {}),
        summary_note: output.summaryNote || "",
        market_trends: output.marketTrends || [],
        growth_opportunities: output.growthOpportunities || [],
        key_positioning: output.keyPositioning || "",
        nature_of_business: output.natureOfBusiness || "",
        geographic_scope: output.geographicScope || "",
        size: output.size || "",
        sector: output.sector || "",
        prospectProfiles: output?.prospectProfiles || [],
        profiles: uploadedFileData,
        executive_summary: output?.executiveSummary || {},
        company_overview: output?.companyOverview || "",
        company_analysis_details: output?.companyAnalysisDetails || {},
        market_analysis: output?.marketAnalysis || {},
        demand_side: output?.demandSide || {},
        is_new: true,
      });
      await refreshHistory();
      setCurrentView("results");
      toast.success(`Research completed for ${formData.companyName}`);
    } catch (error) {
      console.error("Research API Error:", error);
      toast.error(
        error.message || "Failed to fetch research. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle new research
  const handleNewResearch = () => {
    setCurrentView("form");
    setFormData({
      companyName: "",
      companyWebsite: "",
      prospectFiles: [],
    });
    setUploadedFiles([]);
    setResearchResult(null);
    setActiveTab("analysis");
    setProspectInCRM(false);
  };

  // Handle view history
  const handleViewHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const history = await dbHelpers.getResearchHistory(user?.id);
      setResearchHistory(history);
      setCurrentView("history");
    } catch (error) {
      console.error("Failed to load research history:", error);
      toast.error("Failed to load research history");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Handle view history
  const refreshHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const history = await dbHelpers.getResearchHistory(user?.id);
      setResearchHistory(history);
      // setCurrentView("history");
    } catch (error) {
      console.error("Failed to load research history:", error);
      toast.error("Failed to load research history");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Handle view stored research
  const handleViewStoredResearch = (storedResearch: StoredResearch) => {
    console.log(storedResearch, "check stored research");
    // Convert stored research back to ResearchResult format
    const result: ResearchResult = {
      companyName: storedResearch.company_name,
      sector: storedResearch.sector,
      size: storedResearch.size,
      geographicScope: storedResearch.geographic_scope,
      natureOfBusiness: storedResearch.nature_of_business,
      keyPositioning: storedResearch.key_positioning,
      growthOpportunities: storedResearch.growth_opportunities,
      marketTrends: storedResearch.market_trends,
      summaryNote: storedResearch.summary_note,
      sources: storedResearch.sources,
      recommendations: storedResearch.recommendations
        ? JSON.parse(storedResearch.recommendations)
        : {},
      prospectProfiles: storedResearch?.prospectProfiles
        ? storedResearch.prospectProfiles.map((profile) => JSON.parse(profile))
        : [],
      profiles: [], // Will be loaded separately if needed
      executiveSummary: storedResearch?.executive_summary,
      companyOverview: storedResearch?.is_new
        ? storedResearch?.company_overview
        : storedResearch?.company_analysis,
      companyAnalysisDetails: storedResearch?.company_analysis_details,
      marketAnalysis: storedResearch?.market_analysis,
      demandSide: storedResearch?.demand_side,
      is_new: storedResearch?.is_new || false,
    };

    setResearchResult(result);
    setCurrentView("results");
    setActiveTab("analysis");
  };

  // Handle back to history
  const handleBackToHistory = () => {
    setCurrentView("history");
  };

  const handleCopyResults = () => {
    if (!researchResult) return;

    // Include prospect profiles in the copy data
    const prospectProfilesText =
      researchResult.prospectProfiles &&
      researchResult.prospectProfiles.length > 0
        ? `\n\n## Prospect Profiles\n\n${researchResult.prospectProfiles
            .map(
              (profile, index) =>
                `### ${profile.name}\n\n**Communication Style:**\n${profile.communicationStyle}\n\n**Personality Type:**\n${profile.personalityType}`
            )
            .join("\n\n")}`
        : "";

    const copyText = `# Company Research: ${researchResult.companyName}

## Company Analysis
${researchResult.companyOverview || "No analysis available"}

## Prospect Analysis
${researchResult.summaryNote || "No prospect analysis available"}
${prospectProfilesText}

## Recommendations
${
  JSON.stringify(researchResult.recommendations) ||
  "No recommendations available"
}

## Sources
${
  researchResult.sources
    ? researchResult.sources.map((source) => `- ${source}`).join("\n")
    : "No sources available"
}

---
Generated by SalesGenius.ai on ${new Date().toLocaleDateString()}`;

    navigator.clipboard.writeText(copyText);
    toast.success("Research results copied to clipboard");
  };

  // Handle copy to clipboard
  const handleCopy = async () => {
    if (!researchResult) return;

    // ---------- helpers ----------
    const formatList = (arr?: any[], bullet = "•") =>
      Array.isArray(arr) && arr.length
        ? arr
            .map((v, i) =>
              typeof v === "string"
                ? `${bullet} ${v}`
                : `${bullet} ${JSON.stringify(v)}`
            )
            .join("\n")
        : "None listed";

    const numbered = (arr?: any[]) =>
      Array.isArray(arr) && arr.length
        ? arr.map((v, i) => `${i + 1}. ${v}`).join("\n")
        : "None listed";

    const normalizeTitle = (s: string) =>
      s
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .replace(/_/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .toUpperCase();

    const formatKeyValBlock = (
      obj: Record<string, any>,
      knownKeys: string[] = []
    ) => {
      let out = "";
      Object.keys(obj || {}).forEach((key) => {
        if (knownKeys.includes(key)) return;
        const val = obj[key];
        if (
          val == null ||
          val === "" ||
          (Array.isArray(val) && val.length === 0)
        )
          return;

        out += `${normalizeTitle(key)}\n`;
        out += Array.isArray(val)
          ? `${numbered(val)}\n\n`
          : `${String(val)}\n\n`;
      });
      return out.trimEnd();
    };

    // ---------- legacy formatter (your existing structure) ----------
    const formatRecommendationsLegacy = (recommendations: any) => {
      if (typeof recommendations === "string") return recommendations;
      if (!recommendations || typeof recommendations !== "object")
        return "No recommendations available";

      let formatted = "";

      if (recommendations.primaryMeetingGoal) {
        formatted += `PRIMARY MEETING GOAL\n${recommendations.primaryMeetingGoal}\n\n`;
      }

      if (Array.isArray(recommendations.keyTalkingPoints)) {
        formatted += `KEY TALKING POINTS\n${numbered(
          recommendations.keyTalkingPoints
        )}\n\n`;
      }

      if (Array.isArray(recommendations.highImpactSalesQuestions)) {
        formatted += `HIGH-IMPACT SALES QUESTIONS\n${numbered(
          recommendations.highImpactSalesQuestions
        )}\n\n`;
      }

      if (Array.isArray(recommendations.anticipatedObjections)) {
        formatted += `ANTICIPATED OBJECTIONS\n${numbered(
          recommendations.anticipatedObjections
        )}\n\n`;
      }

      if (Array.isArray(recommendations.meetingChecklist)) {
        formatted += `MEETING PREPARATION CHECKLIST\n${numbered(
          recommendations.meetingChecklist
        )}\n\n`;
      }

      // any remaining keys
      const known = [
        "primaryMeetingGoal",
        "keyTalkingPoints",
        "highImpactSalesQuestions",
        "anticipatedObjections",
        "meetingChecklist",
      ];
      formatted += formatKeyValBlock(recommendations, known);

      return formatted.trimEnd();
    };

    const buildFormattedTextLegacy = (d: any) => {
      const growth = Array.isArray(d.growthOpportunities)
        ? d.growthOpportunities
            .map((x: string, i: number) => `${i + 1}. ${x}`)
            .join("\n")
        : "None listed";

      const trends = Array.isArray(d.marketTrends)
        ? d.marketTrends
            .map((x: string, i: number) => `${i + 1}. ${x}`)
            .join("\n")
        : "None listed";

      const profiles =
        Array.isArray(d.prospectProfiles) && d.prospectProfiles.length > 0
          ? `Prospect Profiles\n${d.prospectProfiles
              .map(
                (p: any) =>
                  `${p.name}\nCommunication Style:\n${p.communicationStyle}\nPersonality Type:\n${p.personalityType}`
              )
              .join("\n\n")}`
          : "";

      const sources = Array.isArray(d.sources)
        ? d.sources.map((s: string, i: number) => `${i + 1}. ${s}`).join("\n")
        : "None listed";

      return `
COMPANY RESEARCH ANALYSIS
========================

Company: ${d.companyName}

COMPANY OVERVIEW
----------------
${d.companyOverview || "—"}

KEY DETAILS
-----------
• Sector: ${d.sector}
• Company Size: ${d.size}
• Geographic Scope: ${d.geographicScope}
• Nature of Business: ${d.natureOfBusiness}
• Key Positioning: ${d.keyPositioning}

GROWTH OPPORTUNITIES
--------------------
${growth}

MARKET TRENDS
-------------
${trends}

SUMMARY NOTE
------------
${d.summaryNote || "—"}

PROFILES
--------
${profiles}

SALES RECOMMENDATIONS
---------------------
${formatRecommendationsLegacy(d.recommendations)}

SOURCES
-------
${sources}

Generated by SalesGenius.ai
`.trim();
    };

    // ---------- new formatter (for is_new === true structure) ----------
    const formatRecommendationsNew = (recs: any) => {
      if (!recs || typeof recs !== "object")
        return "No recommendations available";
      let out = "";

      // map common/known sections to friendly titles
      const map: Record<string, string> = {
        primaryMeetingGoal: "PRIMARY MEETING GOAL",
        keyTalkingPoints: "KEY TALKING POINTS",
        discoveryQuestions: "DISCOVERY QUESTIONS",
        highImpactSalesQuestions: "HIGH-IMPACT SALES QUESTIONS",
        anticipatedObjections: "ANTICIPATED OBJECTIONS",
        positioningLevers: "POSITIONING LEVERS",
        scarcityAndPrizingAngles: "SCARCITY & PRIZING ANGLES",
        engagementMomentum: "ENGAGEMENT MOMENTUM",
        offerPackagingGuidance: "OFFER PACKAGING GUIDANCE",
        leadGenerationLeverage: "LEAD GENERATION LEVERAGE",
        meetingPreparationChecklist: "MEETING PREPARATION CHECKLIST",
        meetingChecklist: "MEETING PREPARATION CHECKLIST",
      };

      const handledKeys: string[] = [];

      Object.keys(map).forEach((k) => {
        if (recs[k] == null) return;
        handledKeys.push(k);
        const title = map[k];
        const val = recs[k];
        out += `${title}\n`;
        out += Array.isArray(val)
          ? `${numbered(val)}\n\n`
          : `${String(val)}\n\n`;
      });

      // anything else, nicely printed
      out += formatKeyValBlock(recs, handledKeys);

      return out.trimEnd();
    };

    const buildFormattedTextNew = (d: any) => {
      const exec = d.executiveSummary || {};
      const company = d.companyAnalysisDetails || {};
      const market = d.marketAnalysis || {};
      const demand = d.demandSide || {};

      const profiles =
        Array.isArray(d.prospectProfiles) && d.prospectProfiles.length
          ? d.prospectProfiles
              .map((p: any, i: number) => {
                const lines = [
                  `Name: ${p.name || "—"}`,
                  p.title ? `Title: ${p.title}` : null,
                  p.seniorityLevel ? `Seniority: ${p.seniorityLevel}` : null,
                  p.roleInDecisionMaking
                    ? `Buying Role: ${p.roleInDecisionMaking}`
                    : null,
                  p.publicProfessionalBackground
                    ? `Background: ${p.publicProfessionalBackground}`
                    : null,
                  p.communicationStyle
                    ? `Communication Style: ${p.communicationStyle}`
                    : null,
                  p.personalityType
                    ? `Personality Type: ${p.personalityType}`
                    : null,
                  p.influencePatterns
                    ? `Influence: ${p.influencePatterns}`
                    : null,
                ].filter(Boolean);
                return `PROSPECT ${i + 1}\n${lines.join("\n")}`;
              })
              .join("\n\n")
          : "None listed";

      const sources =
        Array.isArray(d.sources) && d.sources.length
          ? d.sources.map((s: string, i: number) => `${i + 1}. ${s}`).join("\n")
          : "None listed";

      return `
COMPANY RESEARCH ANALYSIS
========================

Company: ${d.companyName}

EXECUTIVE SUMMARY
-----------------
${exec.overview || "—"}

AHA INSIGHTS
------------
${formatList(exec.ahaInsights, "•")}

COMPANY SNAPSHOT
----------------
• Sector: ${d.sector || company.sector || "—"}
• Company Size: ${d.size || "—"}
• Geographic Scope: ${d.geographicScope || company.geographicScope || "—"}
• Nature of Business: ${d.natureOfBusiness || company.natureOfBusiness || "—"}
• Market Position: ${company.marketPosition || "—"}
• Financial Health: ${company.financialHealth || "—"}
• Key Positioning: ${d.keyPositioning || company.competitivePositioning || "—"}

COMPETITIVE ANALYSIS
--------------------
${numbered(company.competitiveAnalysis)}

STRATEGIC INITIATIVES
---------------------
${numbered(company.strategicInitiatives)}

KEY BUSINESS CHALLENGES
-----------------------
${numbered(company.keyBusinessChallenges)}

MARKET ANALYSIS
---------------
TAM/SAM & TRENDS
${market.tamSamTrends || "—"}

MACROECONOMIC FORCES
${numbered(market.macroeconomicForces)}

GROWTH OPPORTUNITIES
${numbered(market.growthOpportunities || d.growthOpportunities)}

THREATS & DISRUPTIONS
${numbered(market.threatsAndDisruptions)}

DEMAND-SIDE DRIVERS
-------------------
STATIC ELEMENTS
${numbered(demand.staticElements)}

DYNAMIC ELEMENTS
${numbered(demand.dynamicElements)}

PROFILES
--------
${profiles}

SOURCES
-------
${sources}

SALES RECOMMENDATIONS
---------------------
${formatRecommendationsNew(d.recommendations)}

Generated by SalesGenius.ai
`.trim();
    };

    try {
      const formattedText = researchResult.is_new
        ? buildFormattedTextNew(researchResult)
        : buildFormattedTextLegacy(researchResult);
      await navigator.clipboard.writeText(formattedText);
      toast.success("Analysis copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy to clipboard");
    }
  };

  // Handle push to HubSpot
  const handlePushToHubSpot = () => {
    toast.success("Research pushed to HubSpot successfully");
    setProspectInCRM(true);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };
  console.log(researchResult, "research result");
  // Render form view
  if (currentView === "form") {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="text-center flex-1">
            <h1 className="text-3xl font-bold text-foreground">Research</h1>
            <p className="text-muted-foreground">
              Get comprehensive analysis and insights for your sales outreach
            </p>
          </div>
          <Button variant="outline" onClick={handleViewHistory}>
            <Search className="w-4 h-4 mr-1" />
            View History
          </Button>
        </div>

        {/* Input Form */}
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Search className="w-5 h-5" />
                <span>Company & Prospect Research</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Company Name */}
                <div className="space-y-2">
                  <label htmlFor="companyName" className="text-sm font-medium">
                    Company Name *
                  </label>
                  <Input
                    data-tour="company-name"
                    id="companyName"
                    type="text"
                    placeholder="Enter company name"
                    value={formData?.companyName}
                    onChange={(e) =>
                      handleInputChange("companyName", e.target.value)
                    }
                    required
                  />
                </div>

                {/* Company Website */}
                <div className="space-y-2">
                  <label
                    htmlFor="companyWebsite"
                    className="text-sm font-medium"
                  >
                    Company Website URL *
                  </label>
                  <Input
                    data-tour="company-url"
                    id="companyWebsite"
                    type="url"
                    placeholder="e.g., https://www.salesgenius.ai"
                    value={formData?.companyWebsite}
                    onChange={(e) =>
                      handleInputChange("companyWebsite", e.target.value)
                    }
                    required
                  />
                </div>

                {/* Prospect LinkedIn */}
                {/* Prospect Files Upload */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Prospect Files (PDF)
                  </label>

                  {/* File Drop Zone */}
                  <div
                    {...getRootProps()}
                    className={cn(
                      "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
                      isDragActive
                        ? "border-primary bg-primary/5"
                        : "border-gray-300 hover:border-primary"
                    )}
                  >
                    <input {...getInputProps()} />
                    <div className="space-y-2">
                      <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <FileText className="w-6 h-6 text-gray-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {isDragActive
                            ? "Drop PDF files here"
                            : "Click to upload or drag and drop PDF files"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          PDF files only, max 10MB each, up to 5 files
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Uploaded Files List */}
                  {uploadedFiles?.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Uploaded Files:</h4>
                      <div className="space-y-2">
                        {uploadedFiles?.map((fileItem) => (
                          <div
                            key={fileItem?.id}
                            className="flex items-center justify-between p-3 border border-border rounded-lg"
                          >
                            <div className="flex items-center space-x-3">
                              <FileText className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium">
                                  {fileItem?.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatFileSize(fileItem.size)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {fileItem?.uploading && (
                                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                              )}
                              {fileItem?.uploaded && (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              )}
                              {fileItem?.error && (
                                <AlertCircle className="w-4 h-4 text-red-600" />
                              )}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFile(fileItem?.id)}
                                disabled={fileItem?.uploading}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground">
                    Optional: Upload PDF files containing prospect information
                    for enhanced analysis
                  </p>
                </div>

                {/* Submit Button */}
                <Button
                  data-tour="research-button"
                  type="submit"
                  disabled={!isFormValid || isLoading || isUploadingFiles}
                  className="w-full"
                  size="lg"
                >
                  {isLoading || isUploadingFiles ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      {isUploadingFiles
                        ? "Uploading files..."
                        : "Researching..."}
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5 mr-2" />
                      Research
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Render history view
  if (currentView === "history") {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Page Header */}

        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-4">
              {/* <Button variant="outline" onClick={handleNewResearch}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Research
              </Button> */}
              <h1 className="text-3xl font-bold text-foreground">
                Research History
              </h1>
            </div>
            <p className="text-muted-foreground">
              View your previous research results and analysis
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-72">
                <Input
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Search by company, URL, sector…"
                  className="pl-9"
                />
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              </div>

              <Button onClick={handleNewResearch}>
                <Plus className="w-4 h-4 mr-1" />
                New Research
              </Button>
            </div>
            <Button
              variant="outline"
              onClick={handleViewHistory}
              disabled={isLoadingHistory}
            >
              {isLoadingHistory ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-1" />
              )}
              Refresh
            </Button>
          </div>
        </div>

        {/* Research History List */}
        {isLoadingHistory ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading research history...</p>
          </div>
        ) : filteredHistory?.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Search className="w-16 h-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
              {historySearch ? (
                <>
                  <h3 className="text-lg font-medium mb-2">
                    No matching results
                  </h3>
                  <p className="text-muted-foreground mb-2">
                    Try a different search or clear the search box.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setHistorySearch("")}
                  >
                    Clear Search
                  </Button>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-medium mb-2">
                    No Research History
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    You haven't conducted any research yet. Start by researching
                    a company.
                  </p>
                  <Button onClick={handleNewResearch}>
                    <Plus className="w-4 h-4 mr-2" />
                    Start Research
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHistory?.map((research) => (
              <Card
                key={research.id}
                className="cursor-pointer hover:shadow-md transition-shadow duration-200 hover:border-primary/50"
                onClick={() => handleViewStoredResearch(research)}
              >
                <CardHeader className="pb-3">
                  {/* <CardTitle className="text-lg flex items-center space-x-2">
                    <Building className="w-5 h-5 text-primary" />
                    <span className="truncate">{research.company_name}</span>
                  </CardTitle> */}
                  <CardTitle
                    asChild
                    className="text-lg flex items-center justify-between cursor-pointer hover:text-primary transition-colors"
                  >
                    <button
                      // onClick={() => {
                      //   // Navigate or perform action here
                      // }}
                      className="w-full flex items-center justify-between"
                    >
                      <span className="flex items-center space-x-2">
                        <Building className="w-5 h-5 text-primary" />
                        <span className="truncate">
                          {research?.company_name}
                        </span>
                      </span>

                      <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary" />
                    </button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <ExternalLink className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground truncate">
                        {research?.company_url}
                      </span>
                    </div>

                    {research?.prospect_profiles &&
                      research?.prospect_profiles?.length > 0 && (
                        <div className="flex items-center space-x-2 text-sm">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {research?.prospect_profiles?.length} prospect
                            profile
                            {research?.prospect_profiles?.length > 1
                              ? "s"
                              : ""}{" "}
                            analyzed
                          </span>
                        </div>
                      )}

                    <div className="flex items-center space-x-2 text-sm">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {new Date(research.created_at).toLocaleDateString()}
                      </span>

                      {/* Show prospect profiles preview in history cards */}
                      {research?.prospect_profiles &&
                        research?.prospect_profiles?.length > 0 && (
                          <div className="pt-2 border-t border-border">
                            <h5 className="text-xs font-medium text-muted-foreground mb-1">
                              Prospect Profiles:
                            </h5>
                            <div className="space-y-1">
                              {research?.prospect_profiles
                                ?.slice(0, 2)
                                ?.map((profile, index) => (
                                  <p
                                    key={index}
                                    className="text-xs text-muted-foreground truncate"
                                  >
                                    • {profile?.name}
                                  </p>
                                ))}
                              {research?.prospect_profiles?.length > 2 && (
                                <p className="text-xs text-muted-foreground">
                                  +{research.prospect_profiles?.length - 2}{" "}
                                  more...
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                  </div>

                  {research?.sector && (
                    <Badge variant="outline" className="text-xs">
                      {research?.sector}
                    </Badge>
                  )}

                  {research?.summary_note && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {research?.summary_note}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }
  // Render results view
  return !researchResult?.is_new ? (
    <div className="max-w-7xl mx-auto flex flex-col h-[calc(100vh-4rem)]">
      {/* Fixed Top Bar */}
      <div className="bg-background border-b border-border p-6">
        <div className="flex items-center justify-between">
          {/* Left: Page Title */}
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={handleBackToHistory}>
              <ArrowLeft className="w-4 h-4 mr-2" />