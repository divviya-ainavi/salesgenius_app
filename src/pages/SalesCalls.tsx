import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrackedButton } from "@/components/ui/tracked-button";
import {
  Upload,
  FileText,
  Eye,
  Download,
  Search,
  Calendar,
  User,
  Building,
  Phone,
  Clock,
  Filter,
  RefreshCw,
  ExternalLink,
  Play,
  Pause,
  Volume2,
  FileIcon,
  Plus,
  ArrowRight,
  Copy,
  AlertCircle,
  Loader2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useDropzone } from "react-dropzone";
import { dbHelpers, CURRENT_USER } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import { useAnalytics } from "@/hooks/useAnalytics";
import firefliesService from "@/services/firefliesService";
import { usePageTimer } from "../hooks/userPageTimer";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDispatch, useSelector } from "react-redux";
import { setCummulativeSpin } from "../store/slices/prospectSlice";

const SalesCalls = () => {
  usePageTimer("Sales Calls");

  const navigate = useNavigate();
  const { trackButtonClick, trackFeatureUsage, trackFileUpload } =
    useAnalytics();
  const [activeTab, setActiveTab] = useState("upload");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCall, setSelectedCall] = useState(null);
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [modalContent, setModalContent] = useState("");
  const [modalTitle, setModalTitle] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingFileId, setProcessingFileId] = useState(null);
  const [processedCalls, setProcessedCalls] = useState([]);

  // Processing modal state
  const [showProcessingModal, setShowProcessingModal] = useState(false);

  // Fireflies state
  const [firefliesCalls, setFirefliesCalls] = useState([]);
  const [isLoadingFireflies, setIsLoadingFireflies] = useState(false);
  const [firefliesError, setFirefliesError] = useState(null);
  const [lastFirefliesSync, setLastFirefliesSync] = useState(null);
  const [getFirefliessummary, setGetFirefliessummary] = useState(null);
  const [getFirefliestranscript, setGetFirefliestranscript] = useState(null);
  const [processingFirefliesId, setProcessingFirefliesId] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [prospects, setProspects] = useState([]);
  const [selectedProspectId, setSelectedProspectId] = useState("");
  const [selectedProComStyles, setSelectedProComStyles] = useState([]);
  const {
    userProfileInfo,
    userRole,
    userRoleId,
    titleName,
    organizationDetails,
    user,
    hubspotIntegration,
  } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  // Load uploaded files, processed calls, and Fireflies data on component mount
  useEffect(() => {
    loadUploadedFiles();
    loadProcessedCalls();
    loadFirefliesTranscripts();

    // Track page visit
    trackFeatureUsage("sales_calls", "page_visit");
  }, []);
  // console.log(selectedCompanyId, "check selected company id");
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const data = await dbHelpers.getCompaniesByUserId(user?.id);
        setCompanies(data);
      } catch (err) {
        toast.error("Failed to load companies");
      }
    };
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (selectedCompanyId != "new" && selectedCompanyId != "") {
      const fetchProspects = async () => {
        try {
          const data = await dbHelpers.getProspectsByCompanyId(
            selectedCompanyId
          );
          setProspects(data);
        } catch (err) {
          toast.error("Failed to load prospects");
        }
      };
      fetchProspects();
    }
  }, [selectedCompanyId]);

  // Track tab changes
  useEffect(() => {
    trackFeatureUsage("sales_calls", "tab_change", { tab: activeTab });
  }, [activeTab]);

  const loadUploadedFiles = async () => {
    try {
      const files = await dbHelpers.getUploadedFiles(user?.id, 20);
      setUploadedFiles(files);
    } catch (error) {
      console.error("Error loading uploaded files:", error);
      toast.error("Failed to load uploaded files");
    }
  };

  const loadProcessedCalls = async () => {
    try {
      const insights = await dbHelpers.getInsightsByUserId(user?.id);
      // console.log(insights, "check insights 154");
      setProcessedCalls(
        insights.map((insight) => ({
          id: insight.id,
          callId: `Call ${insight.id.slice(-5)}`,
          companyName: insight.prospect?.company?.name || "Unknown Company",
          prospectName: insight.prospect?.name || "Unknown Prospect",
          prospect_id: insight.prospect?.id,
          company_id: insight?.prospect?.company_id,
          date: new Date(insight.created_at).toISOString().split("T")[0],
          duration: "N/A",
          status: insight.processing_status,
          source: "upload",
          hasInsights: true,
          transcript: insight.extracted_transcript || "",
          aiProcessedData: {
            call_summary: insight.call_summary,
            action_items: insight.action_items,
            follow_up_email: insight.follow_up_email,
            deck_prompt: insight.deck_prompt,
            sales_insights: insight.sales_insights,
            communication_styles: insight.communication_styles,
            call_analysis_overview: insight.call_analysis_overview,
          },
          uploaded_file_id: insight.uploaded_file_id,
          type: insight.type || "file_upload",
        }))
      );
    } catch (error) {
      console.error("Error loading processed calls:", error);
      toast.error("Failed to load processed calls");
    }
  };

  const loadFirefliesTranscripts = async () => {
    setIsLoadingFireflies(true);
    setFirefliesError(null);

    try {
      const records = await dbHelpers.getFirefliesFiles(user?.id);

      const transformed = records.map((file) => ({
        id: file.fireflies_id,
        callId: `Fireflies ${file.fireflies_id.slice(-6)}`,
        companyName:
          file.organizer_email?.split("@")[1]?.split(".")[0] || "Unknown",
        prospectName: file.organizer_email || "Unknown",
        date: new Date(file.datestring || file.created_at)
          .toISOString()
          .split("T")[0],
        duration: "N/A",
        status: file.is_processed ? "processed" : "unprocessed",
        participants: file.participants ? Object.values(file.participants) : [],
        meetingLink: file.meeting_link,
        hasSummary: false,
        hasTranscript: false,
      }));

      setFirefliesCalls(transformed);
      setLastFirefliesSync(new Date());
    } catch (error) {
      console.error("Error loading Fireflies transcripts:", error);
      setFirefliesError(error.message);
      toast.error("Failed to load Fireflies transcripts.");
    } finally {
      setIsLoadingFireflies(false);
    }
  };

  // const handleSyncFireflies = async () => {
  //   setIsLoadingFireflies(true);

  //   try {
  //     trackButtonClick("Sync Fireflies");

  //     await firefliesService.syncTranscripts({
  //       forceRefresh: true,
  //     });

  //     // Reload transcripts after sync
  //     await loadFirefliesTranscripts();

  //     toast.success("Fireflies transcripts synced successfully!");
  //   } catch (error) {
  //     console.error("Error syncing Fireflies:", error);
  //     toast.error("Failed to sync Fireflies transcripts. Please try again.");
  //   } finally {
  //     setIsLoadingFireflies(false);
  //   }
  // };

  const handleSyncFireflies = async () => {
    setIsLoadingFireflies(true);

    try {
      trackButtonClick("Sync Fireflies");

      // Call your external API directly
      const response = await fetch(
        "https://salesgenius.ainavi.co.uk/n8n/webhook/get-fireflies-transcript",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            forceRefresh: true,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const result = await response.json(); // Optional: log or use the response
      // console.log("Fireflies sync result:", result);

      // Then reload transcripts
      await loadFirefliesTranscripts();

      toast.success("Fireflies transcripts synced successfully!");
    } catch (error) {
      console.error("Error syncing Fireflies:", error);
      toast.error("Failed to sync Fireflies transcripts. Please try again.");
    } finally {
      setIsLoadingFireflies(false);
    }
  };

  // File upload handling
  const onDrop = async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    setIsUploading(true);
    const file = acceptedFiles[0];

    try {
      // Track file upload start
      trackFileUpload(file.name, file.size, file.type, "started");

      // Validate file type
      const validTypes = ["text/plain", "text/vtt", "application/pdf"];
      const validExtensions = [".txt", ".vtt", ".pdf"];
      const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();

      if (
        !validTypes.includes(file.type) &&
        !validExtensions.includes(fileExtension)
      ) {
        toast.error("Please upload only .txt, .vtt, or .pdf files");
        trackFileUpload(file.name, file.size, file.type, "failed");
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        // 10MB limit
        toast.error("File size must be less than 10MB");
        trackFileUpload(file.name, file.size, file.type, "failed");
        return;
      }

      // For text files, read content for database storage
      let content = "";
      const isPDF =
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf");

      if (!isPDF) {
        content = await file.text();
      } else {
        content = `PDF file: ${file.name} (${file.size} bytes)`;
      }

      // Save uploaded file to database with shareable link
      const savedFile = await dbHelpers.saveUploadedFile(
        user?.id,
        file,
        content
      );

      toast.success("File uploaded successfully!");
      trackFileUpload(file.name, file.size, file.type, "completed");
      await loadUploadedFiles(); // Refresh the list
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error(`Failed to upload file: ${error.message}`);
      trackFileUpload(file.name, file.size, file.type, "failed");
    } finally {
      setIsUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/plain": [".txt"],
      "text/vtt": [".vtt"],
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
    disabled: isUploading,
  });

  const handleViewSummary = async (call, type) => {
    if (type === "fireflies") {
      setGetFirefliessummary(true);
      setProcessingFirefliesId(call.id);
      try {
        const response = await fetch(
          "https://salesgenius.ainavi.co.uk/n8n/webhook/get-fireflies-transcripts-byid",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: call.id }),
          }
        );
        const json = await response.json();
        const shortSummary = json[0]?.data?.summary?.short_summary;
        setModalTitle(`Summary - ${json[0]?.data?.title || call.callId}`);
        setModalContent(shortSummary || "No summary available");
        setGetFirefliessummary(false);
      } catch (err) {
        setGetFirefliessummary(false);
        toast.error("Failed to load summary from Fireflies");
        return;
      }
    } else {
      setModalTitle(`Summary - ${call.callId}`);
      setModalContent(
        call.aiProcessedData?.call_summary || "No summary available"
      );
    }

    setShowSummaryModal(true);
  };

  const handleViewTranscript = async (call, type) => {
    if (type === "fireflies") {
      setGetFirefliestranscript(true);
      setProcessingFirefliesId(call.id);
      try {
        const response = await fetch(
          "https://salesgenius.ainavi.co.uk/n8n/webhook/get-fireflies-transcripts-byid",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: call.id }),
          }
        );
        const json = await response.json();
        const sentences = json[0]?.data?.sentences || [];
        const transcriptText = sentences
          .map(
            (s) => `${s.speaker_name} [${s.start_time.toFixed(2)}s]: ${s.text}`
          )
          .join("\n\n");
        setModalTitle(`Transcript - ${json[0]?.data?.title || call.callId}`);
        setModalContent(transcriptText);
        setGetFirefliestranscript(false);
      } catch (err) {
        toast.error("Failed to load transcript from Fireflies");
        setGetFirefliestranscript(false);
        return;
      }
    } else {
      setModalTitle(`Transcript - ${call.callId}`);
      setModalContent(call.transcript || "No transcript available");
    }

    setShowTranscriptModal(true);
  };

  const handleCopyTranscript = () => {
    navigator.clipboard.writeText(modalContent);
    toast.success("Transcript copied to clipboard");
    trackButtonClick("Copy Transcript");
  };

  const handleDownloadTranscriptPDF = () => {
    try {
      const doc = new jsPDF();

      // Set up the document
      doc.setFontSize(16);
      doc.text("Call Transcript", 20, 20);

      doc.setFontSize(12);
      doc.text(`Title: ${modalTitle}`, 20, 35);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 45);

      // Add the transcript content
      doc.setFontSize(10);
      const splitText = doc.splitTextToSize(modalContent, 170);
      doc.text(splitText, 20, 60);

      // Save the PDF
      doc.save(
        `${modalTitle.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_transcript.pdf`
      );
      toast.success("PDF downloaded successfully");
      trackButtonClick("Download PDF", { content_type: "transcript" });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    }
  };

  const handleDownloadTranscript = async (call) => {
    try {
      if (!call.uploaded_file_id) {
        toast.error("No uploaded file associated with this call.");
        return;
      }

      // Fetch the uploaded file metadata from Supabase
      const uploadedFile = await dbHelpers.getUploadedFileById(
        call.uploaded_file_id
      );

      if (!uploadedFile || !uploadedFile.file_url) {
        toast.error("Unable to fetch file URL.");
        return;
      }

      const response = await fetch(uploadedFile.file_url);

      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download =
        uploadedFile.filename || `${call.companyName}_${call.callId}.pdf`; // fallback name
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Transcript file downloaded.");
      trackButtonClick("Download Original File", {
        call_id: call.id,
        uploaded_file_id: call.uploaded_file_id,
      });
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download transcript file.");
    }
  };

  const handleProcessCall = async (call, source = "fireflies") => {
    trackButtonClick("Generate Insights", {
      call_id: call.id,
      company: call.companyName,
      source: source,
    });

    trackFeatureUsage("call_processing", "start_processing", {
      source: source,
      company: call.companyName,
    });

    // Navigate to Call Insights page with the selected call data
    navigate("/call-insights", {
      state: {
        selectedCall: call,
        source: source,
        aiProcessedData: call.aiProcessedData,
      },
    });
  };

  const handleProcessFile = async (file, source) => {
    if (!file) {
      toast.error("Please select a file to process");
      return;
    }

    // Show the processing modal
    setShowProcessingModal(true);
    setIsProcessing(true);
    setProcessingFileId(file.id);
    trackButtonClick(
      source == "fireflies" ? "Process Fireflies" : "Process File",
      {
        file_id: file.id,
        filename: file.filename,
      }
    );

    // }
    try {
      // Get file blob from URL

      let fileBlob = null;
      if (file.file_url && source != "fireflies") {
        try {
          const response = await fetch(file?.file_url);
          if (!response.ok) {
            throw new Error(
              `Failed to fetch file: ${response.status} ${response.statusText}`
            );
          }
          fileBlob = await response.blob();
        } catch (fetchError) {
          console.error("Error fetching file blob:", fetchError);
          toast.error("Failed to fetch file for sending");
          setShowProcessingModal(false);
          setIsProcessing(false);
          setProcessingFileId(null);
          return;
        }
      }

      if (!fileBlob && source != "fireflies") {
        toast.error("No file content available for processing");
        setShowProcessingModal(false);
        setIsProcessing(false);
        setProcessingFileId(null);
        return;
      }

      // Create FormData
      const formData = new FormData();
      const prospectCheck =
        selectedCompanyId == "new" ||
        selectedCompanyId == "" ||
        selectedProspectId == "new" ||
        selectedProspectId == ""
          ? true
          : false;
      const companyCheck =
        selectedCompanyId == "new" || selectedCompanyId == "";
      if (source != "fireflies") {
        formData.append("transcript", fileBlob, file.filename);
        // formData.append("user_id", CURRENT_USER.id);
        // formData.append("call_metadata", null);
        // formData.append("previous_interactions", null);
        formData.append("company_new", companyCheck);
        formData.append("sales_call_prospect_new", prospectCheck);
      } else {
        formData.append("transcript_id", file.id);
        formData.append("company_new", companyCheck);
        formData.append("sales_call_prospect_new", prospectCheck);
      }

      // Make API call to process the transcript file
      const response = await fetch(
        "https://salesgenius.ainavi.co.uk/n8n/webhook/process-call-data-ai-v2",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      // Determine file type and set data accordingly
      const isFireflies = source === "fireflies";

      if (isFireflies) {
        await dbHelpers.updateFirefliesFile(file.id, { is_processed: true });
      } else {
        await dbHelpers.updateUploadedFile(file.id, { is_processed: true });
      }

      if (data && data.length > 0) {
        const processedData = data[0];
        // console.log(processedData, "check processed data");
        const result = await dbHelpers.processSalesCall(
          user?.id,
          user?.organization_id,
          isFireflies,
          file,
          processedData,
          selectedCompanyId,
          selectedProspectId
        );
        // console.log(result, "check result");
        if (result?.status === "success") {
          const savedInsight = result.callInsight;

          try {
            const processedCall = {
              id: savedInsight?.id || "",
              callId: `Call ${savedInsight.id.slice(-5)}`,
              companyName:
                processedData?.company_details?.[0]?.name || "Company",
              prospectName: processedData?.sales_call_prospect || "Prospect",
              date: new Date().toISOString().split("T")[0],
              duration: "N/A",
              status: "processed",
              source: isFireflies ? "fireflies" : "upload",
              hasInsights: true,
              transcript:
                processedData?.extracted_transcript || file.file_content,
              aiProcessedData: processedData,
              uploaded_file_id: file.id,
            };

            setProcessedCalls((prev) => [processedCall, ...prev]);

            toast.success("File processed successfully!");

            navigate("/call-insights", {
              state: {
                selectedCall: {
                  id: savedInsight?.prospect_id,
                },
                source: processedCall.source,
                aiProcessedData: processedData,
              },
            });
            try {
              if (!prospectCheck) {
                dispatch(setCummulativeSpin(true));
                const [existingStyles, call_summariesRaw] = await Promise.all([
                  dbHelpers.getCommunicationStylesData(selectedProComStyles),
                  dbHelpers.getCallSummaryByProspectId(selectedProspectId),
                ]);

                const existing = existingStyles || [];
                const call_summaries =
                  call_summariesRaw?.length > 0
                    ? call_summariesRaw
                    : [processedData?.call_summary || ""];

                // 2. Call cumulative-comm API with existing + current styles
                const cumulativeRes = await fetch(
                  "https://salesgenius.ainavi.co.uk/n8n/webhook/cumulative-comm",
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      previous_communication_styles: existing,
                      current_communication_styles:
                        processedData?.communication_styles,
                      combined_calls_summary: call_summaries,
                    }),
                  }
                );

                if (!cumulativeRes.ok) {
                  dispatch(setCummulativeSpin(false));
                  throw new Error("Failed to call cumulative-comm API");
                }

                const rawText = await cumulativeRes.text();

                if (!rawText) {
                  throw new Error("Empty response from cumulative-comm API");
                }

                const cumulativeData = JSON.parse(rawText);
                const newStyles =
                  cumulativeData?.[0]?.communication_styles || [];

                // 3. Insert new styles into Supabase
                const newStyleIds = await dbHelpers.insertCommunicationStyles(
                  newStyles,
                  selectedProspectId
                );

                // 4. Update prospect with the new style IDs
                if (newStyleIds.length) {
                  await dbHelpers.updateProspectWithNewStyles(
                    selectedProspectId,
                    {
                      communication_style_ids: newStyleIds,
                      sales_play: cumulativeData?.[0]?.recommended_sales_play,
                      call_summary: cumulativeData?.[0]?.cumulative_summary,
                      secondary_objectives:
                        cumulativeData?.[0]?.recommended_objective,
                    }
                  );
                  dispatch(setCummulativeSpin(false));
                  // ✅ 5. Replace the styles in processedData for UI usage
                  processedData.communication_styles = newStyles.map(
                    (s, i) => ({
                      ...s,
                      id: newStyleIds[i],
                    })
                  );
                } else {
                  dispatch(setCummulativeSpin(false));
                }
              }
            } catch (err) {
              console.error("Invalid JSON response from cumulative-comm:");
              throw new Error("Failed to parse cumulative-comm API response");
              dispatch(setCummulativeSpin(false));
            }
          } catch (e) {
            console.error("Cumulative communication style handling failed:", e);
            toast.error("Failed to update communication styles");
          }
        } else {
          toast.error("Failed to store insight data.");
        }
      } else {
        toast.error("No insights generated from the file");
      }
    } catch (error) {
      console.error("Error processing file:", error);
      toast.error(`Failed to process file: ${error.message}`);
      setShowProcessingModal(false);
    } finally {
      setIsProcessing(false);
      setProcessingFileId(null);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getFileIcon = (fileType) => {
    if (fileType?.includes("pdf")) {
      return <FileIcon className="w-4 h-4 text-red-600" />;
    }
    return <FileText className="w-4 h-4 text-blue-600" />;
  };

  // Filter functions
  const filteredFirefliesCalls = firefliesCalls.filter(
    (call) =>
      call.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.prospectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.callId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProcessedCalls = processedCalls.filter(
    (call) =>
      call.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.prospectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.callId.toLowerCase().includes(searchTerm.toLowerCase())
  );
  // console.log(uploadedFiles, "check uploaded files");
  const filteredUploadedFiles = uploadedFiles.filter(
    (file) =>
      file.filename.toLowerCase().includes(searchTerm.toLowerCase()) &&
      file.is_processed == false
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Sales Calls</h1>
        <p className="text-muted-foreground">
          Your starting point for call data. Upload transcripts, import from
          Fireflies.ai, or select from past processed calls to generate
          insights.
        </p>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by company, prospect, or call ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <TrackedButton
              variant="outline"
              size="sm"
              trackingName="Filter Calls"
            >
              <Filter className="w-4 h-4 mr-1" />
              Filter
            </TrackedButton>
            <TrackedButton
              variant="outline"
              size="sm"
              onClick={() => {
                loadUploadedFiles();
                loadProcessedCalls();
              }}
              trackingName="Refresh Files"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </TrackedButton>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">Upload Transcript</TabsTrigger>
          <TabsTrigger value="fireflies">Fireflies.ai Imports</TabsTrigger>
          <TabsTrigger value="processed">Past Processed Calls</TabsTrigger>
        </TabsList>

        {/* Upload Transcript Tab */}
        <TabsContent value="upload" className="mt-6">
          {companies?.length > 0 && (
            <div className="flex justify-end gap-4 pb-5">
              <Select
                value={selectedCompanyId}
                onValueChange={(val) => setSelectedCompanyId(val)}
              >
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select Company" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCompanyId !== "" && selectedCompanyId !== "new" && (
                <Select
                  value={selectedProspectId}
                  onValueChange={(val) => {
                    const selected = prospects.find((p) => p.id === val);
                    setSelectedProspectId(val);
                    setSelectedProComStyles(
                      selected?.communication_style_ids || []
                    );
                  }}
                  disabled={!selectedCompanyId}
                >
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Select Prospect" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    {prospects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Upload Area */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="w-5 h-5" />
                  <span>Upload Call Transcript</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  {...getRootProps()}
                  className={cn(
                    "border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer",
                    isDragActive
                      ? "border-primary bg-primary/5"
                      : "border-border",
                    isUploading && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <input {...getInputProps()} />

                  <div className="space-y-4">
                    <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                      {isUploading ? (
                        <RefreshCw className="w-6 h-6 text-primary animate-spin" />
                      ) : (
                        <FileText className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>

                    <div>
                      <h3 className="font-medium text-foreground mb-2">
                        {isUploading
                          ? "Uploading..."
                          : "Drop your transcript here"}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {isUploading
                          ? "Please wait while we process your file"
                          : "Drag and drop your .txt, .vtt, or .pdf file, or click to browse"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Supported formats: TXT, VTT, PDF (Max 10MB)
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Uploads */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Uploads</CardTitle>
              </CardHeader>
              <CardContent>
                {filteredUploadedFiles.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="mb-2">No uploaded files yet</p>
                    <p className="text-sm">
                      Upload your first transcript to get started
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredUploadedFiles.slice(0, 5).map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-3 border border-border rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          {getFileIcon(file.content_type)}
                          <div>
                            <h4
                              className="font-medium text-sm truncate max-w-[350px]"
                              title={file.filename}
                            >
                              {file.filename}
                            </h4>

                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(file.file_size)} •{" "}
                              {formatDate(file.upload_date || file.created_at)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <TrackedButton
                            variant="ghost"
                            size="sm"
                            onClick={() => handleProcessFile(file)}
                            disabled={isProcessing}
                            trackingName="Process Uploaded File"
                            trackingContext={{
                              file_id: file.id,
                              filename: file.filename,
                            }}
                          >
                            {isProcessing && processingFileId === file.id ? (
                              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            ) : (
                              <ArrowRight className="w-3 h-3 mr-1" />
                            )}
                            {isProcessing && processingFileId === file.id
                              ? "Processing..."
                              : "Process"}
                          </TrackedButton>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Fireflies.ai Imports Tab */}
        <TabsContent value="fireflies" className="mt-6">
          {companies?.length > 0 && (
            <div className="flex justify-end gap-4 pb-5">
              <Select
                value={selectedCompanyId}
                onValueChange={(val) => setSelectedCompanyId(val)}
              >
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Select Company" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCompanyId != "" && selectedCompanyId != "new" && (
                <Select
                  value={selectedProspectId}
                  onValueChange={(val) => setSelectedProspectId(val)}
                  disabled={!selectedCompanyId}
                >
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Select Prospect" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New </SelectItem>
                    {prospects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ExternalLink className="w-5 h-5" />
                  <span>Fireflies.ai Imports</span>
                  {isLoadingFireflies ? (
                    <Badge
                      variant="secondary"
                      className="flex items-center space-x-1"
                    >
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Loading...</span>
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      {filteredFirefliesCalls.length} calls
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {lastFirefliesSync && (
                    <span className="text-xs text-muted-foreground">
                      Last sync: {lastFirefliesSync.toLocaleTimeString()}
                    </span>
                  )}
                  <TrackedButton
                    variant="outline"
                    size="sm"
                    onClick={handleSyncFireflies}
                    disabled={isLoadingFireflies}
                    trackingName="Sync Fireflies"
                  >
                    {isLoadingFireflies ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-1" />
                    )}
                    Sync from Fireflies
                  </TrackedButton>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {firefliesError && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-900">
                      Error loading Fireflies data
                    </h4>
                    <p className="text-sm text-red-700 mt-1">
                      {firefliesError}
                    </p>
                    <TrackedButton
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={loadFirefliesTranscripts}
                      trackingName="Retry Fireflies Load"
                    >
                      Try Again
                    </TrackedButton>
                  </div>
                </div>
              )}

              {isLoadingFireflies ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-primary" />
                  <p className="text-muted-foreground">
                    Loading Fireflies transcripts...
                  </p>
                </div>
              ) : filteredFirefliesCalls.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ExternalLink className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-2">No Fireflies.ai calls found</p>
                  <p className="text-sm">
                    Sync your Fireflies.ai account to import calls
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredFirefliesCalls.map((call) => (
                    <div
                      key={call.id}
                      className="border border-border rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold">{call.callId}</h3>
                            <Badge
                              variant={
                                call.status === "failed"
                                  ? "destructive"
                                  : "outline"
                              }
                            >
                              {call.status}
                            </Badge>
                            {call.status === "failed" && call.error && (
                              <Badge variant="secondary" className="text-xs">
                                {call.error}
                              </Badge>
                            )}
                          </div>
                          <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <Building className="w-3 h-3" />
                                <span>Company: {call.companyName}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <User className="w-3 h-3" />
                                <span>Prospect: {call.prospectName}</span>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-3 h-3" />
                                <span>Date: {call.date}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Clock className="w-3 h-3" />
                                <span>Duration: {call.duration}</span>
                              </div>
                            </div>
                          </div>
                          {call.participants &&
                            call.participants.length > 0 && (
                              <div className="mt-2 text-xs text-muted-foreground">
                                <span className="font-medium">
                                  Participants:
                                </span>{" "}
                                {call.participants.slice(0, 3).join(", ")}
                                {call.participants.length > 3 &&
                                  ` +${call.participants.length - 3} more`}
                              </div>
                            )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          {
                            // call.hasSummary &&
                            call.status !== "failed" && (
                              <TrackedButton
                                variant="outline"
                                size="sm"
                                disabled={
                                  getFirefliessummary &&
                                  processingFirefliesId == call?.id
                                }
                                onClick={() =>
                                  handleViewSummary(call, "fireflies")
                                }
                                trackingName="View Summary"
                                trackingContext={{
                                  call_id: call.id,
                                  company: call.companyName,
                                }}
                              >
                                {getFirefliessummary &&
                                processingFirefliesId == call?.id ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />{" "}
                                    Getting Summary ...
                                  </>
                                ) : (
                                  <>
                                    <Eye className="w-3 h-3 mr-1" />
                                    View Summary
                                  </>
                                )}
                              </TrackedButton>
                            )
                          }
                          {
                            // call.hasTranscript &&
                            call.status !== "failed" && (
                              <TrackedButton
                                variant="outline"
                                size="sm"
                                disabled={
                                  getFirefliestranscript &&
                                  processingFirefliesId == call?.id
                                }
                                onClick={() =>
                                  handleViewTranscript(call, "fireflies")
                                }
                                trackingName="View Transcript"
                                trackingContext={{
                                  call_id: call.id,
                                  company: call.companyName,
                                }}
                              >
                                {getFirefliestranscript &&
                                processingFirefliesId == call?.id ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />{" "}
                                    Getting transcript ...
                                  </>
                                ) : (
                                  <>
                                    <FileText className="w-3 h-3 mr-1" />
                                    View Transcript
                                  </>
                                )}
                              </TrackedButton>
                            )
                          }
                        </div>
                        {/* {console.log(
                          processingFileId,
                          call?.id,
                          call,
                          "check call data"
                        )} */}
                        {call.status !== "failed" && (
                          <TrackedButton
                            onClick={() => handleProcessFile(call, "fireflies")}
                            disabled={isProcessing}
                            trackingName="Generate Insights"
                            trackingContext={{
                              call_id: call?.id,
                              company: call.companyName,
                              source: "fireflies",
                            }}
                          >
                            {isProcessing && processingFileId === call?.id ? (
                              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            ) : (
                              <ArrowRight className="w-3 h-3 mr-1" />
                            )}
                            {/* <ArrowRight className="w-4 h-4 mr-1" /> */}
                            {isProcessing && processingFileId === call?.id
                              ? "Generating Insights..."
                              : "Generate Insights"}
                          </TrackedButton>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Past Processed Calls Tab */}
        <TabsContent value="processed" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Past Processed Calls</span>
                <Badge variant="secondary">
                  {filteredProcessedCalls.length} calls
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredProcessedCalls.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-2">No processed calls yet</p>
                  <p className="text-sm">
                    Process your first call to see it here
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredProcessedCalls.map((call) => (
                    <div
                      key={call.id}
                      className="border border-border rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold">{call.callId}</h3>
                            <Badge variant="default">Processed</Badge>
                            {call.hasInsights && (
                              <Badge
                                variant="outline"
                                className="bg-green-100 text-green-800 border-green-200"
                              >
                                Insights Available
                              </Badge>
                            )}
                          </div>
                          <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <Building className="w-3 h-3" />
                                <span>Company: {call.companyName}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <User className="w-3 h-3" />
                                <span>Prospect: {call.prospectName}</span>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-3 h-3" />
                                <span>Date: {call.date}</span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Clock className="w-3 h-3" />
                                <span>Duration: {call.duration}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <TrackedButton
                            variant="outline"
                            size="sm"
                            disabled={
                              call.type == "fireflies" &&
                              getFirefliestranscript &&
                              processingFirefliesId == call?.id
                            }
                            onClick={() =>
                              handleViewTranscript(call, call.type)
                            }
                            trackingName="View Original Transcript"
                            trackingContext={{
                              call_id: call.id,
                              company: call.companyName,
                            }}
                          >
                            <FileText className="w-3 h-3 mr-1" />
                            View Original Transcript
                          </TrackedButton>
                          {/* {console.log("check type", call)} */}
                          {call.type !== "fireflies" && (
                            <TrackedButton
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadTranscript(call)}
                              trackingName="Download Transcript PDF"
                              trackingContext={{
                                call_id: call.id,
                                company: call.companyName,
                              }}
                            >
                              <Download className="w-3 h-3 mr-1" />
                              Download PDF
                            </TrackedButton>
                          )}
                        </div>
                        {/* {console.log(call, "check selected call")} */}
                        <div className="flex items-center space-x-2">
                          {call.hasInsights && (
                            <TrackedButton
                              variant="outline"
                              onClick={() => {
                                trackButtonClick("View Insights", {
                                  call_id: call.id,
                                  company: call.companyName,
                                });
                                navigate("/call-insights", {
                                  state: {
                                    selectedCall: {
                                      id: call?.prospect_id,
                                    },
                                    source: call.source,
                                    aiProcessedData: call.aiProcessedData,
                                    viewMode: "insights",
                                  },
                                });
                              }}
                              trackingName="View Call Insights"
                              trackingContext={{
                                call_id: call.id,
                                company: call.companyName,
                              }}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View Insights
                            </TrackedButton>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Summary Modal */}
      <Dialog open={showSummaryModal} onOpenChange={setShowSummaryModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{modalTitle}</span>
              <TrackedButton
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(modalContent);
                  toast.success("Summary copied to clipboard");
                }}
                trackingName="Copy Summary"
              >
                <Copy className="w-4 h-4 mr-1" />
                Copy Text
              </TrackedButton>
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh] p-4 bg-muted rounded-lg">
            <pre className="whitespace-pre-wrap text-sm leading-relaxed">
              {modalContent}
            </pre>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transcript Modal */}
      <Dialog open={showTranscriptModal} onOpenChange={setShowTranscriptModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{modalTitle}</span>
              <div className="flex items-center space-x-2">
                <TrackedButton
                  variant="outline"
                  size="sm"
                  onClick={handleCopyTranscript}
                  trackingName="Copy Transcript"
                >
                  <Copy className="w-4 h-4 mr-1" />
                  Copy Text
                </TrackedButton>
                <TrackedButton
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadTranscriptPDF}
                  trackingName="Download Transcript PDF"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download PDF
                </TrackedButton>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh] p-4 bg-muted rounded-lg">
            <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">
              {modalContent}
            </pre>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Processing Modal */}
      <Dialog open={showProcessingModal} onOpenChange={setShowProcessingModal}>
        <DialogContent className="sm:max-w-md text-center">
          <div className="py-6 flex flex-col items-center">
            {/* Animated glowing circle with stars */}
            <div className="relative w-24 h-24 mb-6">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 opacity-20 animate-pulse"></div>
              <div className="absolute inset-2 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-white animate-bounce-soft" />
              </div>
              {/* Orbiting stars */}
              <div className="absolute w-full h-full animate-spin" style={{ animationDuration: '8s' }}>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-yellow-300 rounded-full"></div>
              </div>
              <div className="absolute w-full h-full animate-spin" style={{ animationDuration: '12s' }}>
                <div className="absolute top-1/2 right-0 -translate-y-1/2 w-2 h-2 bg-blue-300 rounded-full"></div>
              </div>
              <div className="absolute w-full h-full animate-spin" style={{ animationDuration: '10s', animationDirection: 'reverse' }}>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-purple-300 rounded-full"></div>
              </div>
            </div>
            
            <h2 className="text-xl font-bold mb-2">Analyzing File</h2>
            <p className="text-muted-foreground mb-6 max-w-xs">
              Our AI is processing the uploaded file, extracting insights, and generating results. Please hold on...
            </p>
            
            {/* Progress dots */}
            <div className="flex space-x-2 justify-center">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: '0s' }}></div>
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: '0.6s' }}></div>
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: '0.8s' }}></div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SalesCalls;
export { SalesCalls };
