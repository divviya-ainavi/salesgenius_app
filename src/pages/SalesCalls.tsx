import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
} from "lucide-react";
import { toast } from "sonner";
import { useDropzone } from "react-dropzone";
import { dbHelpers, CURRENT_USER } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { jsPDF } from "jspdf";
import { useAnalytics } from "@/hooks/useAnalytics";
import firefliesService from "@/services/firefliesService";

const SalesCalls = () => {
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
  const [isProcessingFileId, setIsProcessingFileId] = useState(null);

  // Fireflies state
  const [firefliesCalls, setFirefliesCalls] = useState([]);
  const [isLoadingFireflies, setIsLoadingFireflies] = useState(false);
  const [firefliesError, setFirefliesError] = useState(null);
  const [lastFirefliesSync, setLastFirefliesSync] = useState(null);

  // Load uploaded files and Fireflies data on component mount
  useEffect(() => {
    loadUploadedFiles();
    loadFirefliesTranscripts();

    // Track page visit
    trackFeatureUsage("sales_calls", "page_visit");
  }, []);

  // Track tab changes
  useEffect(() => {
    trackFeatureUsage("sales_calls", "tab_change", { tab: activeTab });
  }, [activeTab]);

  const loadUploadedFiles = async () => {
    try {
      const files = await dbHelpers.getUploadedFiles(CURRENT_USER.id, 20);
      setUploadedFiles(files);
    } catch (error) {
      console.error("Error loading uploaded files:", error);
    }
  };

  const loadFirefliesTranscripts = async () => {
    setIsLoadingFireflies(true);
    setFirefliesError(null);

    try {
      trackFeatureUsage("fireflies", "fetch_transcripts");

      const transcripts = await firefliesService.getTranscripts({
        limit: 50,
      });

      setFirefliesCalls(transcripts);
      setLastFirefliesSync(new Date());

      trackFeatureUsage("fireflies", "fetch_transcripts_success", {
        transcripts_count: transcripts.length,
      });
    } catch (error) {
      console.error("Error loading Fireflies transcripts:", error);
      setFirefliesError(error.message);

      trackFeatureUsage("fireflies", "fetch_transcripts_error", {
        error: error.message,
      });

      // Show user-friendly error message
      toast.error("Failed to load Fireflies transcripts. Please try again.");
    } finally {
      setIsLoadingFireflies(false);
    }
  };

  const handleSyncFireflies = async () => {
    setIsLoadingFireflies(true);

    try {
      trackButtonClick("Sync Fireflies");

      await firefliesService.syncTranscripts({
        forceRefresh: true,
      });

      // Reload transcripts after sync
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
      const savedFile = await dbHelpers.saveUploadedFile(CURRENT_USER.id, file, content);

      toast.success("File uploaded successfully!");
      trackFileUpload(file.name, file.size, file.type, "completed");
      await loadUploadedFiles(); // Refresh the list
      
      // Automatically process the file after upload
      await handleProcessFile(savedFile);
      
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

  const handleViewSummary = (call) => {
    trackButtonClick("View Summary", {
      call_id: call.id,
      company: call.companyName,
    });
    setModalTitle(`Call Summary - ${call.companyName}`);
    setModalContent(call.firefliesSummary);
    setShowSummaryModal(true);
  };

  const handleViewTranscript = (call) => {
    trackButtonClick("View Transcript", {
      call_id: call.id,
      company: call.companyName,
    });
    setModalTitle(`Full Transcript - ${call.companyName}`);
    setModalContent(call.transcript);
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

  const handleDownloadTranscript = (call) => {
    const blob = new Blob([call.transcript], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${call.companyName}_${call.callId}_transcript.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Transcript downloaded");
    trackButtonClick("Download Transcript", {
      call_id: call.id,
      company: call.companyName,
    });
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
      },
    });
  };

  const handleProcessFile = async (file) => {
    if (!file) {
      toast.error("Please select a file to process");
      return;
    }

    setIsProcessingFileId(file.id);
    trackButtonClick("Process File", {
      file_id: file.id,
      filename: file.filename,
    });

    try {
      // Fetch the file as a Blob from file_url
      let fileBlob = null;
      if (file.file_url) {
        try {
          const response = await fetch(file.file_url);
          if (!response.ok) {
            throw new Error(
              `Failed to fetch file: ${response.status} ${response.statusText}`
            );
          }
          fileBlob = await response.blob();
        } catch (fetchError) {
          console.error("Error fetching file blob:", fetchError);
          toast.error("Failed to fetch file for sending");
          setIsProcessingFileId(null);
          return;
        }
      }

      if (!fileBlob) {
        toast.error("No file available for sending");
        setIsProcessingFileId(null);
        return;
      }

      // Prepare FormData to send the file
      const formData = new FormData();
      formData.append("transcript", fileBlob, file.filename);
      formData.append("user_id", CURRENT_USER.id);
      formData.append("call_metadata", null);
      formData.append("previous_interactions", null);

      // Make API call to process the transcript file
      const response = await fetch(
        "https://salesgenius.ainavi.co.uk/webhook/process-call-data-ai",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data && data.length > 0) {
        // Store the processed data in the database
        const processingSession = await dbHelpers.createProcessingSession(CURRENT_USER.id, file.id);
        
        // Create a call note entry
        const callNote = await dbHelpers.createCallNote(
          CURRENT_USER.id,
          `call-${Date.now()}`,
          fileBlob ? await fileBlob.text() : '',
          file.id,
          processingSession.id
        );
        
        // Update the processing session with the completed status and API response
        await dbHelpers.updateProcessingSession(processingSession.id, {
          processing_status: 'completed',
          api_response: data[0],
          call_notes_id: callNote.id
        });
        
        // Create content entries from the API response
        const contentIds = await dbHelpers.createCompleteCallAnalysis(
          CURRENT_USER.id,
          file.id,
          processingSession.id,
          data[0]
        );

        toast.success("File processed successfully!");

        // Create a mock call object with the processed data
        const processedCall = {
          id: file.id,
          callId: `Upload ${file.id.slice(-5)}`,
          companyName: file.filename.replace(/\.[^/.]+$/, ""), // Remove file extension
          prospectName: "AI Processed",
          date: new Date().toISOString().split("T")[0],
          duration: "N/A",
          status: "processed",
          source: "upload",
          hasInsights: true,
          transcript: fileBlob,
          aiProcessedData: data[0], // Store the AI processed data
        };

        // Navigate to Call Insights with the processed data
        navigate("/call-insights", {
          state: {
            selectedCall: processedCall,
            source: "upload",
            aiProcessedData: data[0],
          },
        });
      } else {
        toast.error("No insights generated from the file");
      }
    } catch (error) {
      console.error("Error processing file:", error);
      toast.error(`Failed to process file: ${error.message}`);
    } finally {
      setIsProcessingFileId(null);
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

  // Mock processed calls (keeping existing functionality)
  const mockProcessedCalls = [
    {
      id: "proc_001",
      callId: "Call 3",
      companyName: "Global Solutions Ltd",
      prospectName: "Emma Wilson",
      date: "2024-01-10",
      duration: "35 min",
      status: "processed",
      source: "upload",
      hasInsights: true,
      transcript: `[00:00] Emma Wilson: We're looking to scale our sales operations significantly this year...

[02:00] Sales Rep: What's driving this need for scaling?

[02:15] Emma Wilson: We've just secured Series B funding and plan to double our sales team by Q3...

[Continue with full transcript...]`,
    },
    {
      id: "proc_002",
      callId: "Call 4",
      companyName: "Innovation Hub",
      prospectName: "David Brown",
      date: "2024-01-08",
      duration: "50 min",
      status: "processed",
      source: "fireflies",
      hasInsights: true,
      transcript: `[00:00] David Brown: Our current lead qualification process is completely manual and it's killing our productivity...

[Continue with full transcript...]`,
    },
  ];

  const filteredProcessedCalls = mockProcessedCalls.filter(
    (call) =>
      call.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.prospectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.callId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUploadedFiles = uploadedFiles.filter((file) =>
    file.filename.toLowerCase().includes(searchTerm.toLowerCase())
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
              onClick={loadUploadedFiles}
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
                            <h4 className="font-medium text-sm">
                              {file.filename}
                            </h4>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(file.file_size)} •{" "}
                              {formatDate(file.upload_date)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <TrackedButton
                            variant="ghost"
                            size="sm"
                            onClick={() => handleProcessFile(file)}
                            disabled={isProcessingFileId === file.id}
                            trackingName="Process Uploaded File"
                            trackingContext={{
                              file_id: file.id,
                              filename: file.filename,
                            }}
                          >
                            {isProcessingFileId === file.id ? (
                              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                            ) : (
                              <ArrowRight className="w-3 h-3 mr-1" />
                            )}
                            {isProcessingFileId === file.id
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
                          {call.hasSummary && call.status !== "failed" && (
                            <TrackedButton
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewSummary(call)}
                              trackingName="View Summary"
                              trackingContext={{
                                call_id: call.id,
                                company: call.companyName,
                              }}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              View Summary
                            </TrackedButton>
                          )}
                          {call.hasTranscript && call.status !== "failed" && (
                            <TrackedButton
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewTranscript(call)}
                              trackingName="View Transcript"
                              trackingContext={{
                                call_id: call.id,
                                company: call.companyName,
                              }}
                            >
                              <FileText className="w-3 h-3 mr-1" />
                              View Transcript
                            </TrackedButton>
                          )}
                        </div>
                        {call.status !== "failed" && (
                          <TrackedButton
                            onClick={() => handleProcessCall(call, "fireflies")}
                            trackingName="Generate Insights"
                            trackingContext={{
                              call_id: call.id,
                              company: call.companyName,
                              source: "fireflies",
                            }}
                          >
                            <ArrowRight className="w-4 h-4 mr-1" />
                            Generate Insights
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
                            onClick={() => handleViewTranscript(call)}
                            trackingName="View Original Transcript"
                            trackingContext={{
                              call_id: call.id,
                              company: call.companyName,
                            }}
                          >
                            <FileText className="w-3 h-3 mr-1" />
                            View Original Transcript
                          </TrackedButton>
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
                        </div>
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
                                    selectedCall: call,
                                    source: call.source,
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
    </div>
  );
};

export default SalesCalls;
export { SalesCalls };