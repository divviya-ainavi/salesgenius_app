import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    try {
      // Create FormData for API request with proper file handling
      const apiFormData = new FormData();
      apiFormData.append("companyName", formData.companyName);
      apiFormData.append("companyUrl", formData.companyWebsite);

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
      const result = data[0]?.output;

      const output = result.output || result;

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
      });

      await dbHelpers.saveResearchCompany({
        user_id: user?.id,
        company_name: formData.companyName,
        company_url: formData.companyWebsite,
        prospect_urls: uploadedFileUrls || [],
        company_analysis: output.companyOverview,
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
      });

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

  // Handle view stored research
  const handleViewStoredResearch = (storedResearch: StoredResearch) => {
    // Convert stored research back to ResearchResult format
    const result: ResearchResult = {
      companyName: storedResearch.company_name,
      companyOverview: storedResearch.company_analysis,
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
      prospectProfiles: storedResearch.prospect_profiles || [],
      profiles: [], // Will be loaded separately if needed
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
    const prospectProfilesText = researchResult.prospectProfiles && researchResult.prospectProfiles.length > 0
      ? `\n\n## Prospect Profiles\n\n${researchResult.prospectProfiles.map((profile, index) => 
          `### ${profile.name}\n\n**Communication Style:**\n${profile.communicationStyle}\n\n**Personality Type:**\n${profile.personalityType}`
        ).join('\n\n')}`
      : '';

    const copyText = `# Company Research: ${researchResult.companyName}

## Company Analysis
${researchResult.companyOverview || 'No analysis available'}

## Prospect Analysis
${researchResult.summaryNote || 'No prospect analysis available'}
${prospectProfilesText}

## Recommendations
${JSON.stringify(researchResult.recommendations) || 'No recommendations available'}

## Sources
${researchResult.sources ? researchResult.sources.map(source => `- ${source}`).join('\n') : 'No sources available'}

---
Generated by SalesGenius.ai on ${new Date().toLocaleDateString()}`;

    navigator.clipboard.writeText(copyText);
    toast.success("Research results copied to clipboard");
  };

  // Handle copy to clipboard
  const handleCopy = async () => {
    if (!researchResult) return;

    try {
      // Helper function to format recommendations object as readable text
      const formatRecommendations = (recommendations) => {
        if (typeof recommendations === "string") {
          return recommendations;
        }

        if (!recommendations || typeof recommendations !== "object") {
          return "No recommendations available";
        }

        let formatted = "";

        if (recommendations.primaryMeetingGoal) {
          formatted += `PRIMARY MEETING GOAL\n${recommendations.primaryMeetingGoal}\n\n`;
        }

        if (
          recommendations.keyTalkingPoints &&
          Array.isArray(recommendations.keyTalkingPoints)
        ) {
          formatted += `KEY TALKING POINTS\n`;
          recommendations.keyTalkingPoints.forEach((point, index) => {
            formatted += `${index + 1}. ${point}\n`;
          });
          formatted += "\n";
        }

        if (
          recommendations.highImpactSalesQuestions &&
          Array.isArray(recommendations.highImpactSalesQuestions)
        ) {
          formatted += `HIGH-IMPACT SALES QUESTIONS\n`;
          recommendations.highImpactSalesQuestions.forEach(
            (question, index) => {
              formatted += `${index + 1}. ${question}\n`;
            }
          );
          formatted += "\n";
        }

        if (
          recommendations.anticipatedObjections &&
          Array.isArray(recommendations.anticipatedObjections)
        ) {
          formatted += `ANTICIPATED OBJECTIONS\n`;
          recommendations.anticipatedObjections.forEach((objection, index) => {
            formatted += `${index + 1}. ${objection}\n`;
          });
          formatted += "\n";
        }

        if (
          recommendations.meetingChecklist &&
          Array.isArray(recommendations.meetingChecklist)
        ) {
          formatted += `MEETING PREPARATION CHECKLIST\n`;
          recommendations.meetingChecklist.forEach((item, index) => {
            formatted += `${index + 1}. ${item}\n`;
          });
          formatted += "\n";
        }

        // Handle any other properties
        Object.keys(recommendations).forEach((key) => {
          if (
            ![
              "primaryMeetingGoal",
              "keyTalkingPoints",
              "highImpactSalesQuestions",
              "anticipatedObjections",
              "meetingChecklist",
            ].includes(key)
          ) {
            formatted += `${key
              .toUpperCase()
              .replace(/([A-Z])/g, " $1")
              .trim()}\n${recommendations[key]}\n\n`;
          }
        });

        return formatted;
      };

      // Format the research result as readable text
      const formattedText = `
COMPANY RESEARCH ANALYSIS
========================

Company: ${researchResult.companyName}

COMPANY OVERVIEW
----------------
${researchResult.companyOverview}

KEY DETAILS
-----------
• Sector: ${researchResult.sector}
• Company Size: ${researchResult.size}
• Geographic Scope: ${researchResult.geographicScope}
• Nature of Business: ${researchResult.natureOfBusiness}
• Key Positioning: ${researchResult.keyPositioning}

GROWTH OPPORTUNITIES
--------------------
${
  researchResult.growthOpportunities
    ?.map((opportunity, index) => `${index + 1}. ${opportunity}`)
    .join("\n") || "None listed"
}

MARKET TRENDS
-------------
${
  researchResult.marketTrends
    ?.map((trend, index) => `${index + 1}. ${trend}`)
    .join("\n") || "None listed"
}

SUMMARY NOTE
------------
${researchResult.summaryNote}

SOURCES
-------
${
  researchResult.sources
    ?.map((source, index) => `${index + 1}. ${source}`)
    .join("\n") || "None listed"
}

SALES RECOMMENDATIONS
---------------------
${formatRecommendations(researchResult.recommendations)}

Generated by SalesGenius.ai
      `.trim();

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
                    value={formData.companyName}
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
                    value={formData.companyWebsite}
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
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Uploaded Files:</h4>
                      <div className="space-y-2">
                        {uploadedFiles.map((fileItem) => (
                          <div
                            key={fileItem.id}
                            className="flex items-center justify-between p-3 border border-border rounded-lg"
                          >
                            <div className="flex items-center space-x-3">
                              <FileText className="w-4 h-4 text-muted-foreground" />
                              <div>
                                <p className="text-sm font-medium">
                                  {fileItem.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {formatFileSize(fileItem.size)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {fileItem.uploading && (
                                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                              )}
                              {fileItem.uploaded && (
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              )}
                              {fileItem.error && (
                                <AlertCircle className="w-4 h-4 text-red-600" />
                              )}
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFile(fileItem.id)}
                                disabled={fileItem.uploading}
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
            <Button onClick={handleNewResearch}>
              <Plus className="w-4 h-4 mr-1" />
              New Research
            </Button>
          </div>
        </div>

        {/* Research History List */}
        {isLoadingHistory ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Loading research history...</p>
          </div>
        ) : researchHistory.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Search className="w-16 h-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No Research History</h3>
              <p className="text-muted-foreground mb-4">
                You haven't conducted any research yet. Start by researching a
                company.
              </p>
              <Button onClick={handleNewResearch}>
                <Plus className="w-4 h-4 mr-2" />
                Start Research
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {researchHistory.map((research) => (
              <Card
                key={research.id}
                className="cursor-pointer hover:shadow-md transition-shadow duration-200 hover:border-primary/50"
                onClick={() => handleViewStoredResearch(research)}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <Building className="w-5 h-5 text-primary" />
                    <span className="truncate">{research.company_name}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-sm">
                      <ExternalLink className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground truncate">
                        {research.company_url}
                      </span>
                    </div>

                    {research?.prospect_profiles &&
                      research.prospect_profiles.length > 0 && (
                        <div className="flex items-center space-x-2 text-sm">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {research.prospect_profiles.length} prospect profile
                            {research.prospect_profiles.length > 1
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
                      {research.prospect_profiles &&
                        research.prospect_profiles.length > 0 && (
                          <div className="pt-2 border-t border-border">
                            <h5 className="text-xs font-medium text-muted-foreground mb-1">
                              Prospect Profiles:
                            </h5>
                            <div className="space-y-1">
                              {research.prospect_profiles
                                .slice(0, 2)
                                .map((profile, index) => (
                                  <p
                                    key={index}
                                    className="text-xs text-muted-foreground truncate"
                                  >
                                    • {profile.name}
                                  </p>
                                ))}
                              {research.prospect_profiles.length > 2 && (
                                <p className="text-xs text-muted-foreground">
                                  +{research.prospect_profiles.length - 2}{" "}
                                  more...
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                    </div>
                  </div>

                  {research.sector && (
                    <Badge variant="outline" className="text-xs">
                      {research.sector}
                    </Badge>
                  )}

                  {research.summary_note && (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {research.summary_note}
                    </p>
                  )}

                  <div className="pt-2 border-t border-border">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-primary hover:text-primary"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }
  // Render results view
  return (
    <div className="max-w-7xl mx-auto flex flex-col h-[calc(100vh-4rem)]">
      {/* Fixed Top Bar */}
      <div className="bg-background border-b border-border p-6">
        <div className="flex items-center justify-between">
          {/* Left: Page Title */}
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={handleBackToHistory}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to History
            </Button>
            {/* <h1 className="text-2xl font-bold text-foreground">Research</h1> */}
          </div>

          {/* Middle: Tab Navigation */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            // className="flex-1 mx-8" // ⬅ removed max-w-md so the list can grow
          >
            <TabsList
              className="
              inline-flex items-center
              rounded-md bg-muted p-1 text-muted-foreground
              whitespace-nowrap overflow-x-auto
              gap-2 sm:gap-0
              no-scrollbar
            "
            >
              <TabsTrigger
                value="analysis"
                className="flex items-center gap-1 px-3 whitespace-nowrap"
              >
                <FileText className="w-4 h-4" />
                <span>Analysis</span>
              </TabsTrigger>

              <TabsTrigger
                value="prospects"
                className="flex items-center gap-1 px-3 whitespace-nowrap"
              >
                <User className="w-4 h-4" />
                <span>Profiles</span>
              </TabsTrigger>

              <TabsTrigger
                value="source"
                className="flex items-center gap-1 px-3 whitespace-nowrap"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Source</span>
              </TabsTrigger>

              <TabsTrigger
                value="recommendation"
                className="flex items-center gap-1 px-3 whitespace-nowrap"
              >
                <Target className="w-4 h-4" />
                <span>Recommendations</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Right: Controls */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Prospect in CRM:</span>
              <Switch
                checked={prospectInCRM}
                onCheckedChange={setProspectInCRM}
              />
              <span className="text-sm text-muted-foreground">
                {prospectInCRM ? "On" : "Off"}
              </span>
            </div>
            {/* <Button variant="outline" onClick={handleViewHistory}>
              <Search className="w-4 h-4 mr-1" />
              View History
            </Button> */}
            <Button variant="outline" onClick={handleNewResearch}>
              <Plus className="w-4 h-4 mr-1" />
              New Research
            </Button>
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          {activeTab === "analysis" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Building className="w-5 h-5" />
                    <span>{researchResult?.companyName}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {/* Company Overview */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center">
                        <FileText className="w-4 h-4 mr-2" />
                        Company Overview
                      </h3>
                      <p
                        className="text-sm leading-relaxed text-muted-foreground"
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(
                            researchResult?.companyOverview || ""
                          ),
                        }}
                      />
                    </div>

                    {/* Key Details Grid */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-sm mb-2">Sector</h4>
                          <Badge variant="outline" className="text-xs">
                            {researchResult?.sector}
                          </Badge>
                        </div>

                        <div>
                          <h4 className="font-medium text-sm mb-2">
                            Company Size
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {researchResult?.size}
                          </p>
                        </div>

                        <div>
                          <h4 className="font-medium text-sm mb-2">
                            Geographic Scope
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {researchResult?.geographicScope}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium text-sm mb-2">
                            Nature of Business
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {researchResult?.natureOfBusiness}
                          </p>
                        </div>

                        <div>
                          <h4 className="font-medium text-sm mb-2">
                            Key Positioning
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {researchResult?.keyPositioning}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Growth Opportunities */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Growth Opportunities
                      </h3>
                      <ul className="space-y-2">
                        {researchResult?.growthOpportunities?.map(
                          (opportunity, index) => (
                            <li
                              key={index}
                              className="flex items-start space-x-2"
                            >
                              <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                              <span className="text-sm text-muted-foreground leading-relaxed">
                                {opportunity}
                              </span>
                            </li>
                          )
                        )}
                      </ul>
                    </div>

                    {/* Market Trends */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Market Trends
                      </h3>
                      <ul className="space-y-2">
                        {researchResult?.marketTrends?.map((trend, index) => (
                          <li
                            key={index}
                            className="flex items-start space-x-2"
                          >
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                            <span className="text-sm text-muted-foreground leading-relaxed">
                              {trend}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Summary Note */}
                    <div>
                      <h3 className="text-lg font-semibold mb-3 flex items-center">
                        <Lightbulb className="w-4 h-4 mr-2" />
                        Summary Note
                      </h3>
                      <div className="bg-muted/50 rounded-lg p-4">
                        <p
                          className="text-sm leading-relaxed text-muted-foreground"
                          dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(
                              researchResult?.summaryNote || ""
                            ),
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Interaction Bar */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm">
                    <ThumbsUp className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <ThumbsDown className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleCopy}>
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </Button>
                </div>

                {!prospectInCRM && (
                  <Button onClick={handlePushToHubSpot} disabled={true}>
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Push to HubSpot
                  </Button>
                )}
              </div>
            </div>
          )}

          {activeTab === "prospects" && (
            <div className="space-y-6">
              {researchResult?.prospectProfiles &&
              researchResult.prospectProfiles.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {researchResult.prospectProfiles.map((profile, index) => (
                    <Card
                      key={index}
                      className="hover:shadow-md transition-shadow"
                    >
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center space-x-2">
                          <User className="w-5 h-5 text-primary" />
                          <span className="truncate">{profile.name}</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h4 className="font-medium text-sm mb-2 flex items-center">
                            <MessageSquare className="w-4 h-4 mr-2 text-blue-600" />
                            Communication Style
                          </h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {profile.communicationStyle}
                          </p>
                        </div>

                        <div>
                          <h4 className="font-medium text-sm mb-2 flex items-center">
                            <Lightbulb className="w-4 h-4 mr-2 text-green-600" />
                            Personality Type
                          </h4>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {profile.personalityType}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <User className="w-16 h-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
                    <h3 className="text-lg font-medium mb-2">
                      No Prospect Profiles
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Upload PDF files containing prospect information to
                      generate detailed profiles and communication insights.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeTab === "source" && (
            <Card>
              <CardHeader>
                <CardTitle>Sources</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {researchResult?.sources &&
                researchResult.sources.length > 0 ? (
                  <ol className="space-y-2 list-decimal list-inside">
                    {researchResult.sources.map((source, index) => (
                      <li key={index} className="text-sm leading-relaxed">
                        {source}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No sources available for this research</p>
                    <p>
                      Upload PDF files and complete your first research to see
                      results here
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "recommendation" && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="w-5 h-5" />
                  <span>Sales Recommendations</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* Primary Meeting Goal */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                      <Target className="w-4 h-4 mr-2" />
                      Primary Meeting Goal
                    </h3>
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                      <p className="text-sm leading-relaxed">
                        {DOMPurify.sanitize(
                          researchResult?.recommendations?.primaryMeetingGoal ||
                            ""
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Key Talking Points */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Key Talking Points
                    </h3>
                    <ul className="space-y-2">
                      {researchResult?.recommendations?.keyTalkingPoints?.map(
                        (point, index) => (
                          <li
                            key={index}
                            className="flex items-start space-x-2"
                          >
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                            <span className="text-sm text-muted-foreground leading-relaxed">
                              {point}
                            </span>
                          </li>
                        )
                      )}
                    </ul>
                  </div>

                  {/* High-Impact Sales Questions */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                      <Lightbulb className="w-4 h-4 mr-2" />
                      High-Impact Sales Questions
                    </h3>
                    <div className="space-y-2">
                      {researchResult?.recommendations?.highImpactSalesQuestions?.map(
                        (question, index) => (
                          <Collapsible key={index}>
                            <CollapsibleTrigger asChild>
                              <Button
                                variant="ghost"
                                className="w-full justify-between p-3 h-auto text-left"
                                onClick={() => toggleQuestion(index)}
                              >
                                <span className="text-sm font-medium">
                                  Q{index + 1}:{" "}
                                  {DOMPurify.sanitize(
                                    question.substring(0, 60)
                                  )}
                                  ...
                                </span>
                                <ChevronDown
                                  className={cn(
                                    "w-4 h-4 transition-transform",
                                    expandedQuestions.includes(index) &&
                                      "rotate-180"
                                  )}
                                />
                              </Button>
                            </CollapsibleTrigger>
                            {/* {console.log(question, "check question")} */}
                            <CollapsibleContent className="px-3 pb-3">
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {question}
                              </p>
                            </CollapsibleContent>
                          </Collapsible>
                        )
                      )}
                    </div>
                  </div>

                  {/* Anticipated Objections */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Anticipated Objections
                    </h3>
                    <ul className="space-y-2">
                      {researchResult?.recommendations?.anticipatedObjections?.map(
                        (objection, index) => (
                          <li
                            key={index}
                            className="flex items-start space-x-2"
                          >
                            <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                            <span className="text-sm text-muted-foreground leading-relaxed">
                              {objection}
                            </span>
                          </li>
                        )
                      )}
                    </ul>
                  </div>

                  {/* Meeting Checklist */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                      <CheckSquare className="w-4 h-4 mr-2" />
                      Meeting Preparation Checklist
                    </h3>
                    <ul className="space-y-2">
                      {researchResult?.recommendations?.meetingChecklist?.map(
                        (item, index) => (
                          <li
                            key={index}
                            className="flex items-start space-x-2"
                          >
                            <div className="w-4 h-4 border border-muted-foreground rounded mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-muted-foreground leading-relaxed">
                              {item}
                            </span>
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Research;
export { Research };