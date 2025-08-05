import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { HelpCircle } from "lucide-react";
import {
  Upload,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Phone,
  Calendar,
  Users,
  Building,
  Search,
  RefreshCw,
  ExternalLink,
  Download,
  Trash2,
  Eye,
  Play,
  Pause,
  Volume2,
  MoreVertical,
  Filter,
  SortAsc,
  FileAudio,
  Mic,
  Video,
  User,
  DollarSign,
  Target,
  TrendingUp,
  MessageSquare,
  Mail,
  Sparkles,
  ArrowRight,
  Plus,
  X,
  Copy,
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { dbHelpers, CURRENT_USER } from "@/lib/supabase";
import firefliesService from "@/services/firefliesService";
import { usePageTimer } from "../hooks/userPageTimer";
import { ProcessCallModal } from "@/components/calls/ProcessCallModal";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useDispatch, useSelector } from "react-redux";
import { TrackedButton } from "@/components/ui/tracked-button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { jsPDF } from "jspdf";
import { useNavigate } from "react-router-dom";
import { setCummulativeSpin } from "../store/slices/prospectSlice";
import { config } from "../lib/config";
import {
  setFirefliesData,
  setIshavefirefliesData,
} from "../store/slices/authSlice";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

export const SalesCalls = () => {
  usePageTimer("Sales Calls");
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("upload");
  const [uploadedFiles, setUploadedFiles] = useState([]);
  // const [firefliesData, setFirefliesData] = useState([]);
  const [pastCalls, setPastCalls] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingFireflies, setIsLoadingFireflies] = useState(false);
  const [isLoadingPastCalls, setIsLoadingPastCalls] = useState(false);

  // Process modal state
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [currentProcessingFile, setCurrentProcessingFile] = useState(null);
  const [processingFileId, setProcessingFileId] = useState(null);

  // Tab-specific search states
  const [firefliesSearch, setFirefliesSearch] = useState("");
  const [pastCallsSearch, setPastCallsSearch] = useState("");
  const [firefliesCalls, setFirefliesCalls] = useState([]);
  const [firefliesError, setFirefliesError] = useState(null);
  const [lastFirefliesSync, setLastFirefliesSync] = useState(null);
  const [getFirefliessummary, setGetFirefliessummary] = useState(null);
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [getFirefliestranscript, setGetFirefliestranscript] = useState(null);
  const [processingFirefliesId, setProcessingFirefliesId] = useState(null);
  const [modalContent, setModalContent] = useState("");
  const [modalTitle, setModalTitle] = useState("");
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recentUploadRefresh, setRecentUploadRefresh] = useState(false);
  const [source, setSource] = useState("upload");
  const [firefliesSummary, setFirefliesSummary] = useState(null);
  const dispatch = useDispatch();

  const userId = CURRENT_USER.id;
  const { trackButtonClick, trackFeatureUsage, trackFileUpload } =
    useAnalytics();
  const {
    userProfileInfo,
    userRole,
    userRoleId,
    titleName,
    organizationDetails,
    user,
    hubspotIntegration,
    ishavefirefliesData,
    firefliesData,
  } = useSelector((state) => state.auth);

  // Load initial data
  useEffect(() => {
    loadUploadedFiles();
    if (
      activeTab === "fireflies" &&
      user?.fireflies_connected &&
      !ishavefirefliesData
    ) {
      loadFirefliesData();
    } else if (activeTab === "past") {
      loadPastCalls();
    }
  }, [activeTab]);

  const loadUploadedFiles = async () => {
    setRecentUploadRefresh(true);
    try {
      // Only load unprocessed files for the staging queue
      const files = await dbHelpers.getUploadedFiles(userId);
      const unprocessedFiles = files.filter((file) => !file.is_processed);

      const enrichedFiles = files.map((file) => ({
        ...file,
        uploadTime: new Date(file.upload_date).toLocaleString(),
        size: formatFileSize(file.file_size),
      }));

      setUploadedFiles(enrichedFiles.filter((file) => !file.is_processed));
      setRecentUploadRefresh(false);
    } catch (error) {
      console.error("Error loading uploaded files:", error);
      toast.error("Failed to load uploaded files");
      setRecentUploadRefresh(false);
    }
  };
  // console.log(firefliesData, "check user in SalesCalls");

  const loadFirefliesData = async () => {
    setIsLoadingFireflies(true);
    const formData = new FormData();

    formData.append("id", user?.id);

    try {
      const [existingRecords, response] = await Promise.all([
        dbHelpers.getFirefliesFiles(user?.id),
        await fetch(
          `${config.api.baseUrl}${config.api.endpoints.getFirefliesFiles}`,
          {
            method: "POST",
            body: formData,
          }
        ),
        [],
      ]);

      // Create a Set of existing composite keys: `${user_id}_${fireflies_id}`
      const existingKeys = new Set(
        existingRecords.map((r) => `${r.user_id}_${r.fireflies_id}`)
      );

      // const existingIds = new Set(existingRecords.map((r) => r.fireflies_id));
      const json = await response.json();
      const transcripts = json?.[0]?.data?.transcripts || [];
      // Then filter transcripts using that composite key
      const newTranscripts = transcripts.filter(
        (t) => !existingKeys.has(`${user?.id}_${t.id}`)
      );
      // const newTranscripts = transcripts.filter((t) => !existingIds.has(t.id));
      // console.log(json, "check json response from Fireflies API");
      // console.log(response, "check response from Fireflies API");
      // console.log(newTranscripts, "check new transcripts");
      // console.log(existingRecords, "check existing records");
      // console.log(existingIds, "check existing ids");

      // Prepare new entries
      const insertPayload = newTranscripts.map((t) => ({
        fireflies_id: t.id,
        title: t.title,
        organizer_email: t.organizer_email,
        participants: t.participants,
        meeting_link: t?.meeting_link || null,
        datestring: new Date(t.date).toISOString(),
        duration: parseInt(t.duration),
        summary: t.summary,
        sentences: t.sentences,
        user_id: user?.id,
        is_processed: false,
      }));
      // console.log(insertPayload, "check insert payload");
      // Bulk insert if there are new entries
      if (insertPayload.length > 0) {
        await dbHelpers.bulkInsertFirefliesFiles(insertPayload); // You must implement this
      }

      // Transform both new + existing records for display
      const combinedRecords = [...existingRecords, ...insertPayload];

      const transformed = combinedRecords.map((file) => ({
        id: file.fireflies_id,
        callId: `Fireflies ${file.fireflies_id.slice(-6)}`,
        companyName: "-",
        prospectName: file.organizer_email || "Unknown",
        date: new Date(file.datestring || file.created_at)
          .toISOString()
          .split("T")[0],
        duration: file.duration || "N/A",
        status: file.is_processed ? "processed" : "unprocessed",
        participants: file.participants ? Object.values(file.participants) : [],
        meetingLink: file.meeting_link,
        hasSummary: file.summary,
        hasTranscript: file.sentences,
        title: file?.title,
      }));

      dispatch(setFirefliesData(transformed));
      dispatch(setIshavefirefliesData(true));
    } catch (error) {
      console.error("Error loading Fireflies data:", error);
      toast.error("Failed to sync Fireflies transcripts.");
      dispatch(setFirefliesData([]));
      dispatch(setIshavefirefliesData(false));
    } finally {
      setIsLoadingFireflies(false);
    }
  };

  const refreshFireflies = async () => {
    setIsLoadingFireflies(true);

    try {
      const getData = await dbHelpers.getFirefliesFiles(user?.id);

      const transformed = getData.map((file) => ({
        id: file.fireflies_id,
        callId: `Fireflies ${file.fireflies_id.slice(-6)}`,
        companyName: "-",
        prospectName: file.organizer_email || "Unknown",
        date: new Date(file.datestring || file.created_at)
          .toISOString()
          .split("T")[0],
        duration: file.duration || "N/A",
        status: file.is_processed ? "processed" : "unprocessed",
        participants: file.participants ? Object.values(file.participants) : [],
        meetingLink: file.meeting_link,
        hasSummary: file.summary,
        hasTranscript: file.sentences,
        title: file?.title,
      }));

      dispatch(setFirefliesData(transformed));
      dispatch(setIshavefirefliesData(true));
    } catch (error) {
      console.error("Error loading Fireflies data:", error);
      toast.error("Failed to sync Fireflies transcripts.");
      dispatch(setFirefliesData([]));
      dispatch(setIshavefirefliesData(false));
    } finally {
      setIsLoadingFireflies(false);
    }
  };

  const loadPastCalls = async () => {
    setIsLoadingPastCalls(true);
    try {
      // Only load processed files for past calls
      const insights = await dbHelpers.getInsightsByUserId(user?.id);
      // console.log(insights, "check insights 154");
      setPastCalls(
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
          fireflies_id: insight.fireflies_id || null,
        }))
      );
    } catch (error) {
      console.error("Error loading past calls:", error);
      toast.error("Failed to load past calls");
      setPastCalls([]);
    } finally {
      setIsLoadingPastCalls(false);
    }
  };

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

  const handleProcessClick = (file, source) => {
    setProcessingFileId(file.id);
    setCurrentProcessingFile(file);
    setShowProcessModal(true);
    setSource(source);
    if (source == "fireflies") {
      setFirefliesSummary(file.hasSummary);
    } else {
      setFirefliesSummary(null);
    }
  };

  // console.log(processingFileId, "processing file id");
  // console.log(processingFileId, "processing file id");
  const handleConfirmAssociation = async (
    file,
    companyId,
    prospectId,
    prospectDetails
  ) => {
    // console.log(
    //   file,
    //   companyId,
    //   prospectId,
    //   prospectDetails,
    //   "check file and company and prospect"
    // );
    if (!file) {
      toast.error("Please select a file to process");
      return;
    }

    // Show the processing modal
    setShowProcessingModal(true);
    setIsProcessing(true);
    setProcessingFileId(file.id);
    // trackButtonClick(
    //   source == "fireflies" ? "Process Fireflies" : "Process File",
    //   {
    //     file_id: file.id,
    //     filename: file.filename,
    //   }
    // );

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

      if (source != "fireflies") {
        formData.append("transcript", fileBlob, file.filename);
        // formData.append("user_id", CURRENT_USER.id);
        // formData.append("call_metadata", null);
        // formData.append("previous_interactions", null);
        formData.append("company_new", "");
        formData.append("sales_call_prospect_new", "");
      } else {
        formData.append("transcript_id", processingFileId);
        formData.append("company_new", "");
        formData.append("sales_call_prospect_new", "");
      }

      // Make API call to process the transcript file
      const response = await fetch(
        `${config.api.baseUrl}${config.api.endpoints.processSalesCall}`,
        {
          method: "POST",

          headers:
            source == "fireflies"
              ? {
                  "Content-Type": "application/json",
                }
              : undefined, // Let browser handle headers for FormData
          body:
            source == "fireflies"
              ? JSON.stringify({
                  data: {
                    summary: firefliesSummary,
                  },
                })
              : formData,
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      // Determine file type and set data accordingly
      const isFireflies = source === "fireflies";

      if (isFireflies) {
        await dbHelpers.updateFirefliesFile(processingFileId, user?.id, {
          is_processed: true,
        });
        refreshFireflies();
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
          companyId,
          prospectId
        );
        // console.log(result, "check result");
        if (result?.status === "success") {
          const savedInsight = result.callInsight;
          // console.log(result, "check result after processing");
          // console.log(savedInsight, "check saved insight");
          try {
            const processedCall = {
              id: savedInsight?.id || "",
              callId: `Call ${savedInsight?.id?.slice(-5)}`,
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

            setPastCalls((prev) => [pastCalls, ...prev]);

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
              if (prospectDetails?.communication_style_ids != null) {
                dispatch(setCummulativeSpin(true));
                const [existingStyles, call_summariesRaw] = await Promise.all([
                  dbHelpers.getCommunicationStylesData(
                    prospectDetails?.communication_style_ids,
                    user?.id
                  ),
                  dbHelpers.getCallSummaryByProspectId(prospectId),
                ]);

                const existing = existingStyles || [];
                const call_summaries =
                  call_summariesRaw?.length > 0
                    ? call_summariesRaw
                    : [processedData?.call_summary || ""];

                // 2. Call cumulative-comm API with existing + current styles
                const cumulativeRes = await fetch(
                  `${config.api.baseUrl}${config.api.endpoints.cummulativeSalesData}`,
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
                  prospectId,
                  user?.id
                );

                // 4. Update prospect with the new style IDs
                if (newStyleIds.length) {
                  await dbHelpers.updateProspectWithNewStyles(prospectId, {
                    communication_style_ids: newStyleIds,
                    sales_play: cumulativeData?.[0]?.recommended_sales_play,
                    call_summary: cumulativeData?.[0]?.cumulative_summary,
                    secondary_objectives:
                      cumulativeData?.[0]?.recommended_objective,
                  });
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
              } else {
                dispatch(setCummulativeSpin(false));
              }
            } catch (err) {
              dispatch(setCummulativeSpin(false));
              console.error("Invalid JSON response from cumulative-comm:");
              throw new Error("Failed to parse cumulative-comm API response");
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

  const getFileIcon = (fileType) => {
    if (fileType?.includes("audio")) return <FileAudio className="w-4 h-4" />;
    if (fileType?.includes("video")) return <Video className="w-4 h-4" />;
    if (fileType?.includes("pdf")) return <FileText className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Complete":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "Awaiting Association...":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case "Processing":
        return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
      case "Error":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Complete":
        return "bg-green-100 text-green-800 border-green-200";
      case "Awaiting Association...":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Processing":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Error":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // console.log(firefliesData, "fireflies data");
  // Filter functions for tab-specific searches
  const filteredFirefliesData = firefliesData.filter((call) => {
    if (!firefliesSearch.trim()) return true;
    const searchTerm = firefliesSearch.toLowerCase();
    return (
      call.callId?.toLowerCase().includes(searchTerm) ||
      call.participants?.some((p) => p.toLowerCase().includes(searchTerm)) ||
      call.companyName?.toLowerCase().includes(searchTerm)
    );
  });

  // console.log(pastCalls, "past calls");
  const filteredPastCalls = pastCalls.filter((call) => {
    if (!pastCallsSearch.trim()) return true;
    const searchTerm = pastCallsSearch.toLowerCase();
    return (
      call.companyName?.toLowerCase().includes(searchTerm) ||
      call.prospectName?.toLowerCase().includes(searchTerm) ||
      call.summary?.toLowerCase().includes(searchTerm) ||
      call.filename?.toLowerCase().includes(searchTerm)
    );
  });

  const handleViewTranscript = async (call, type, tab) => {
    // console.log(type, call, "view transcript called");
    if (type === "fireflies") {
      // console.log(call, "check call in handleViewTranscript");
      // setGetFirefliestranscript(true);
      setProcessingFirefliesId(call.id);

      const sentences =
        tab == "past"
          ? await dbHelpers?.getFirefliesSingleData(
              user?.id,
              call?.fireflies_id
            )
          : call.hasTranscript || [];

      // console.log(sentences, "check sentences in handleViewTranscript");
      const transcriptText = sentences
        .map(
          (s) => `${s.speaker_name} [${s.start_time.toFixed(2)}s]: ${s.text}`
        )
        .join("\n\n");
      setModalTitle(`Transcript - ${call?.title || call.callId}`);
      setModalContent(transcriptText);
      // setGetFirefliestranscript(false);s
    } else {
      setModalTitle(`Transcript - ${call.callId}`);
      setModalContent(call.transcript || "No transcript available");
    }

    setShowTranscriptModal(true);
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

  const handleViewSummary = async (call, type) => {
    if (type === "fireflies") {
      // setGetFirefliessummary(true);
      setProcessingFirefliesId(call.id);

      const shortSummary = call?.hasSummary?.short_summary;
      setModalTitle(`Summary - ${call?.title || call.callId}`);
      setModalContent(shortSummary || "No summary available");
      // setGetFirefliessummary(false);
    } else {
      setModalTitle(`Summary - ${call.callId}`);
      setModalContent(
        call.aiProcessedData?.call_summary || "No summary available"
      );
    }

    setShowSummaryModal(true);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Sales Calls</h1>
        <p className="text-muted-foreground">
          Upload call transcripts, sync from Fireflies.ai, and review past
          processed calls
        </p>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload" className="flex items-center space-x-2">
            <Upload className="w-4 h-4" />
            <span>Upload Transcript</span>
          </TabsTrigger>
          <TabsTrigger
            value="fireflies"
            className="flex items-center space-x-2"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Fireflies.ai Imports</span>
          </TabsTrigger>
          <TabsTrigger value="past" className="flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>Past Processed Calls</span>
          </TabsTrigger>
        </TabsList>

        {/* Upload Transcript Tab */}
        <TabsContent value="upload" className="mt-6">
          <div className="flex gap-6">
            {/* Upload Drop Zone */}
            <Card className="flex-1">
              <CardHeader>
                <CardTitle>Upload Call Transcript</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  {...getRootProps()}
                  className={cn(
                    "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                    isDragActive
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50 hover:bg-primary/5"
                  )}
                >
                  <input {...getInputProps()} />
                  <div className="space-y-4">
                    <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                      {isUploading ? (
                        <Loader2 className="w-6 h-6 text-primary animate-spin" />
                      ) : (
                        <Upload className="w-6 h-6 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="text-lg font-medium">
                        {isUploading
                          ? "Uploading..."
                          : isDragActive
                          ? "Drop your file here"
                          : "Drop your transcript here"}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Drag and drop your .txt, .vtt, or .pdf file, or click to
                        browse
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Supported formats are TXT, VTT or PDF (Max 10MB)
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Uploads */}
            <Card className="flex-1">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Uploads</CardTitle>
                <Button variant="outline" size="sm" onClick={loadUploadedFiles}>
                  {recentUploadRefresh ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-1" />
                  )}
                  Refresh
                </Button>
              </CardHeader>
              <CardContent>
                {recentUploadRefresh ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-primary" />
                    <p className="text-muted-foreground">
                      Loading recent uploaded files...
                    </p>
                  </div>
                ) : uploadedFiles.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No files uploaded yet</p>
                    <p className="text-sm">
                      Upload your first call transcript to get started
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {uploadedFiles.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between p-3 border border-border rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          {getFileIcon(file.content_type)}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">{file.filename}</p>
                            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                              <span>{file.size}</span>
                              <span>{file.uploadTime}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleProcessClick(file, "upload")}
                            disabled={processingFileId === file.id}
                            data-tour="process-button"
                          >
                            {processingFileId === file.id ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <ArrowRight className="w-4 h-4 ml-1" />
                                Process
                              </>
                            )}
                          </Button>
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
          <div className="space-y-6">
            {/* Tab-specific search bar */}
            <div className="flex items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search synced calls by title or attendee..."
                  value={firefliesSearch}
                  onChange={(e) => setFirefliesSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              {user?.fireflies_connected && (
                <Button
                  variant="outline"
                  onClick={loadFirefliesData}
                  disabled={isLoadingFireflies}
                  data-tour="fireflies-connect"
                >
                  {isLoadingFireflies ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-1" />
                  )}
                  Sync Fireflies
                </Button>
              )}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Fireflies.ai Synced Calls</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingFireflies ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-primary" />
                    <p className="text-muted-foreground">
                      Loading Fireflies data...
                    </p>
                  </div>
                ) : !user?.fireflies_connected ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ExternalLink className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No Fireflies integration found</p>
                    <p className="text-sm">
                      Connect your Fireflies account to automatically sync and
                      view your meeting transcripts here.
                    </p>
                    <p className="text-sm">
                      To set up the integration, go to the Settings menu and
                      navigate to the Profile tab.
                    </p>
                  </div>
                ) : filteredFirefliesData.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ExternalLink className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No Fireflies calls found</p>
                    <p className="text-sm">
                      {firefliesSearch
                        ? "Try adjusting your search terms"
                        : "Sync your Fireflies account to see calls here"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredFirefliesData.map((call) => (
                      <div
                        key={call.id}
                        className="border border-border rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="font-semibold">{call.title}</h3>
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
                                  <span>Duration: {call.duration} minutes</span>
                                </div>
                              </div>
                            </div>
                            {call.participants &&
                              call.participants.length > 0 && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="mt-2 text-xs text-muted-foreground cursor-pointer">
                                      <span className="font-medium">
                                        Participants:
                                      </span>{" "}
                                      {call.participants.slice(0, 3).join(", ")}
                                      {call.participants.length > 3 &&
                                        ` +${
                                          call.participants.length - 3
                                        } more`}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent
                                    className="bg-white text-gray-800 border border-gray-200 shadow-lg max-w-xs p-3 rounded-md"
                                    side="top"
                                  >
                                    <ul className="list-disc pl-4 space-y-1 text-sm">
                                      {call.participants.map((email, index) => (
                                        <li key={index}>{email}</li>
                                      ))}
                                    </ul>
                                  </TooltipContent>
                                </Tooltip>
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
                              onClick={() =>
                                handleProcessClick(call, "fireflies")
                              }
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
          </div>
        </TabsContent>

        {/* Past Processed Calls Tab */}
        <TabsContent value="past" className="mt-6">
          <div className="space-y-6">
            {/* Tab-specific search bar */}
            <div className="flex items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search past calls by Company, Prospect, or keyword..."
                  value={pastCallsSearch}
                  onChange={(e) => setPastCallsSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={loadPastCalls}
                disabled={isLoadingPastCalls}
              >
                {isLoadingPastCalls ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-1" />
                )}
                Refresh
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Past Processed Calls</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingPastCalls ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-primary" />
                    <p className="text-muted-foreground">
                      Loading past calls...
                    </p>
                  </div>
                ) : filteredPastCalls.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No processed calls found</p>
                    <p className="text-sm">
                      {pastCallsSearch
                        ? "Try adjusting your search terms"
                        : "Process some call transcripts to see them here"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredPastCalls.map((call, index) => (
                      <div
                        key={call.id}
                        className="border border-border rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="font-semibold">
                                Call - {index + 1}
                              </h3>
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
                                handleViewTranscript(call, call.type, "past")
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
          </div>
        </TabsContent>
      </Tabs>

      {/* Process Call Modal */}
      {showProcessModal && currentProcessingFile && (
        <ProcessCallModal
          isOpen={showProcessModal}
          onClose={() => {
            setShowProcessModal(false);
            setCurrentProcessingFile(null);
            setProcessingFileId(null);
          }}
          file={currentProcessingFile}
          onConfirm={handleConfirmAssociation}
        />
      )}

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
                className="mt-4"
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
              <div className="flex items-center space-x-2 mt-4">
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
    </div>
  );
};

export default SalesCalls;