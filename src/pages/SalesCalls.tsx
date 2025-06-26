import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Upload,
  FileText,
  Phone,
  Calendar,
  Clock,
  User,
  Building,
  Loader2,
  CheckCircle,
  AlertCircle,
  Play,
  Pause,
  RotateCcw,
  Download,
  Trash2,
  Eye,
  Search,
  Filter,
  RefreshCw,
  Plus,
  ExternalLink,
  Sparkles,
  ArrowRight,
  FileAudio,
  FileVideo,
  File,
  Zap,
  Target,
  MessageSquare,
  TrendingUp,
  Users,
  BarChart3,
  Mic,
  Video,
  FileImage,
  X,
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { dbHelpers, CURRENT_USER } from "@/lib/supabase";
import { fileStorage } from "@/lib/fileStorage";
import firefliesService from "@/services/firefliesService";
import { usePageTimer } from "@/hooks/usePageTimer";

// Mock data for demonstration
const mockCallData = [
  {
    id: "1",
    callId: "CALL-2024-001",
    companyName: "Acme Corp",
    prospectName: "Sarah Johnson",
    date: "2024-01-15",
    duration: "45 min",
    status: "completed",
    hasTranscript: true,
    hasSummary: true,
    firefliesSummary:
      "Discussed Q2 implementation timeline and budget allocation. Key stakeholders identified: Sarah (VP Sales), Mike (Sales Ops), Lisa (Marketing). Next steps: Technical demo scheduled for next week.",
    transcript:
      "Sarah: Thanks for joining today's call. We're looking at implementing a new sales automation platform for Q2...",
    audioUrl: null,
    participants: ["Sarah Johnson", "Mike Chen", "Lisa Rodriguez"],
    meeting_link: "https://zoom.us/j/123456789",
    organizer_email: "sarah.johnson@acmecorp.com",
  },
  {
    id: "2",
    callId: "CALL-2024-002",
    companyName: "TechStart Inc",
    prospectName: "John Smith",
    date: "2024-01-14",
    duration: "30 min",
    status: "completed",
    hasTranscript: true,
    hasSummary: true,
    firefliesSummary:
      "Initial discovery call with startup CEO. Discussed scaling challenges and integration requirements. Budget constraints noted. Follow-up: Send startup-specific pricing proposal.",
    transcript:
      "John: Hi there, thanks for reaching out. We're a growing startup and looking for solutions that can scale with us...",
    audioUrl: null,
    participants: ["John Smith", "Emma Wilson"],
    meeting_link: "https://meet.google.com/abc-defg-hij",
    organizer_email: "john@techstart.com",
  },
  {
    id: "3",
    callId: "CALL-2024-003",
    companyName: "Global Solutions Ltd",
    prospectName: "Emma Wilson",
    date: "2024-01-10",
    duration: "60 min",
    status: "processing",
    hasTranscript: false,
    hasSummary: false,
    firefliesSummary: "Processing call transcript and generating insights...",
    transcript: "",
    audioUrl: null,
    participants: ["Emma Wilson", "David Brown"],
    meeting_link: "https://teams.microsoft.com/l/meetup-join/xyz",
    organizer_email: "emma@globalsolutions.com",
  },
];

export const SalesCalls = () => {
  // Track time spent on Sales Calls page
  usePageTimer('Sales Calls');

  const [activeTab, setActiveTab] = useState("upload");
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [firefliesData, setFirefliesData] = useState([]);
  const [isLoadingFireflies, setIsLoadingFireflies] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedCall, setSelectedCall] = useState(null);
  const [showTranscriptDialog, setShowTranscriptDialog] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);

  // Use current authenticated user
  const userId = CURRENT_USER.id;

  // Load uploaded files on component mount
  useEffect(() => {
    const loadUploadedFiles = async () => {
      if (!userId) {
        console.log("No user ID available, skipping file load");
        setIsLoadingFiles(false);
        return;
      }

      setIsLoadingFiles(true);
      try {
        const files = await dbHelpers.getUploadedFiles(userId);
        setUploadedFiles(files);
      } catch (error) {
        console.error("Error loading uploaded files:", error);
        toast.error("Failed to load uploaded files");
      } finally {
        setIsLoadingFiles(false);
      }
    };

    loadUploadedFiles();
  }, [userId]);

  // Load Fireflies data
  const loadFirefliesData = async () => {
    setIsLoadingFireflies(true);
    try {
      const data = await firefliesService.getTranscripts();
      setFirefliesData(data);
      toast.success(`Loaded ${data.length} Fireflies transcripts`);
    } catch (error) {
      console.error("Error loading Fireflies data:", error);
      toast.error("Failed to load Fireflies data");
    } finally {
      setIsLoadingFireflies(false);
    }
  };

  // File upload handling
  const onDrop = async (acceptedFiles) => {
    if (!userId) {
      toast.error("Please log in to upload files");
      return;
    }

    for (const file of acceptedFiles) {
      try {
        // Validate file
        if (file.size > 50 * 1024 * 1024) {
          // 50MB limit
          toast.error(`File ${file.name} is too large (max 50MB)`);
          continue;
        }

        // Read file content for text files
        let content = null;
        if (file.type.startsWith("text/")) {
          content = await file.text();
        }

        // Save file metadata to database
        const savedFile = await dbHelpers.saveUploadedFile(userId, file, content);

        // Update local state
        setUploadedFiles((prev) => [savedFile, ...prev]);

        toast.success(`File ${file.name} uploaded successfully`);
      } catch (error) {
        console.error("Error uploading file:", error);
        toast.error(`Failed to upload ${file.name}`);
      }
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/plain": [".txt"],
      "text/vtt": [".vtt"],
      "application/pdf": [".pdf"],
      "audio/*": [".mp3", ".wav", ".m4a"],
      "video/*": [".mp4", ".mov"],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  // Process file with AI
  const handleProcessFile = async (file) => {
    if (!file.file_content && !file.file_url) {
      toast.error("No content available to process");
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(0);

    try {
      // Simulate processing progress
      const progressInterval = setInterval(() => {
        setProcessingProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      // Call AI processing API
      const response = await fetch(
        "https://salesgenius.ainavi.co.uk/n8n/webhook/process-call-transcript",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            transcript: file.file_content,
            filename: file.filename,
            userId: userId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`API returned status ${response.status}`);
      }

      const result = await response.json();
      clearInterval(progressInterval);
      setProcessingProgress(100);

      // Mark file as processed
      await dbHelpers.updateUploadedFile(file.id, { is_processed: true });

      // Update local state
      setUploadedFiles((prev) =>
        prev.map((f) => (f.id === file.id ? { ...f, is_processed: true } : f))
      );

      toast.success(`File ${file.filename} processed successfully`);

      // Navigate to call insights after a short delay
      setTimeout(() => {
        window.location.href = "/call-insights";
      }, 1500);
    } catch (error) {
      console.error("Error processing file:", error);
      toast.error(`Failed to process ${file.filename}`);
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
    }
  };

  // Delete file
  const handleDeleteFile = async (fileId) => {
    try {
      // In a real implementation, you would also delete from storage
      // await fileStorage.deleteFile(file.storage_path);

      // Remove from database (this will be implemented)
      // await dbHelpers.deleteUploadedFile(fileId);

      // Update local state
      setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));

      toast.success("File deleted successfully");
    } catch (error) {
      console.error("Error deleting file:", error);
      toast.error("Failed to delete file");
    }
  };

  // Get file icon based on type
  const getFileIcon = (fileType) => {
    if (fileType.startsWith("text/")) return FileText;
    if (fileType.startsWith("audio/")) return FileAudio;
    if (fileType.startsWith("video/")) return FileVideo;
    if (fileType === "application/pdf") return File;
    return File;
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Filter calls based on search and status
  const filteredCalls = [...mockCallData, ...firefliesData].filter((call) => {
    const matchesSearch =
      call.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.prospectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      call.callId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || call.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Show loading state while checking authentication
  if (!userId) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading user session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Sales Calls
          </h1>
          <p className="text-muted-foreground">
            Upload call transcripts or sync from Fireflies.ai to generate
            AI-powered insights
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={loadFirefliesData}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Sync Fireflies
          </Button>
          <Button onClick={() => setActiveTab("upload")}>
            <Upload className="w-4 h-4 mr-1" />
            Upload Transcript
          </Button>
        </div>
      </div>

      {/* Processing Progress */}
      {isProcessing && (
        <Card className="border-primary">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <div className="flex-1">
                <h3 className="font-medium mb-2">Processing Call Transcript</h3>
                <Progress value={processingProgress} className="h-2" />
                <p className="text-sm text-muted-foreground mt-2">
                  Analyzing transcript and generating insights... {processingProgress}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">
            <Upload className="w-4 h-4 mr-1" />
            Upload Files
          </TabsTrigger>
          <TabsTrigger value="calls">
            <Phone className="w-4 h-4 mr-1" />
            Call History ({filteredCalls.length})
          </TabsTrigger>
          <TabsTrigger value="fireflies">
            <ExternalLink className="w-4 h-4 mr-1" />
            Fireflies.ai ({firefliesData.length})
          </TabsTrigger>
        </TabsList>

        {/* Upload Tab */}
        <TabsContent value="upload" className="mt-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Upload Area */}
            <Card>
              <CardHeader>
                <CardTitle>Upload Call Transcripts</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  {...getRootProps()}
                  className={cn(
                    "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                    isDragActive
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <input {...getInputProps()} />
                  <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  {isDragActive ? (
                    <p className="text-primary">Drop files here...</p>
                  ) : (
                    <div>
                      <p className="text-lg font-medium mb-2">
                        Drop files here or click to browse
                      </p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Supports: TXT, VTT, PDF, MP3, WAV, MP4 (max 50MB)
                      </p>
                      <Button variant="outline">
                        <Plus className="w-4 h-4 mr-1" />
                        Choose Files
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Uploaded Files List */}
            <Card>
              <CardHeader>
                <CardTitle>Uploaded Files</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingFiles ? (
                  <div className="text-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                    <p className="text-muted-foreground">Loading files...</p>
                  </div>
                ) : uploadedFiles.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="mb-2">No files uploaded yet</p>
                    <p className="text-sm">
                      Upload your first call transcript to get started
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {uploadedFiles.map((file) => {
                      const FileIcon = getFileIcon(file.content_type);
                      return (
                        <div
                          key={file.id}
                          className="flex items-center justify-between p-3 border border-border rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <FileIcon className="w-5 h-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium text-sm">
                                {file.filename}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {formatFileSize(file.file_size)} •{" "}
                                {new Date(file.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            {file.is_processed ? (
                              <Badge
                                variant="default"
                                className="bg-green-100 text-green-800 border-green-200"
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Processed
                              </Badge>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => handleProcessFile(file)}
                                disabled={isProcessing}
                              >
                                <Sparkles className="w-4 h-4 mr-1" />
                                Process
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteFile(file.id)}
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

        {/* Call History Tab */}
        <TabsContent value="calls" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Call History</CardTitle>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search calls..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredCalls.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Phone className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-2">No calls found</p>
                  <p className="text-sm">
                    Upload transcripts or sync from Fireflies to see your calls
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredCalls.map((call) => (
                    <div
                      key={call.id}
                      className="border border-border rounded-lg p-4 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <Phone className="w-5 h-5 text-primary" />
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-semibold">{call.callId}</h3>
                              <Badge
                                variant={
                                  call.status === "completed"
                                    ? "default"
                                    : call.status === "processing"
                                    ? "secondary"
                                    : "destructive"
                                }
                                className="text-xs"
                              >
                                {call.status}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground mb-3">
                              <div className="flex items-center space-x-1">
                                <Building className="w-3 h-3" />
                                <span>{call.companyName}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <User className="w-3 h-3" />
                                <span>{call.prospectName}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3" />
                                <span>{call.date}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>{call.duration}</span>
                              </div>
                            </div>

                            {call.firefliesSummary && (
                              <p className="text-sm text-muted-foreground mb-3">
                                {call.firefliesSummary.substring(0, 150)}...
                              </p>
                            )}

                            <div className="flex items-center space-x-2">
                              {call.hasTranscript && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedCall(call);
                                    setShowTranscriptDialog(true);
                                  }}
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  View Transcript
                                </Button>
                              )}
                              {call.status === "completed" && (
                                <Button size="sm">
                                  <ArrowRight className="w-4 h-4 mr-1" />
                                  View Insights
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fireflies Tab */}
        <TabsContent value="fireflies" className="mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Fireflies.ai Integration</CardTitle>
                <Button
                  onClick={loadFirefliesData}
                  disabled={isLoadingFireflies}
                >
                  {isLoadingFireflies ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-1" />
                  )}
                  Sync Transcripts
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingFireflies ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                  <p className="text-muted-foreground">
                    Syncing transcripts from Fireflies.ai...
                  </p>
                </div>
              ) : firefliesData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ExternalLink className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-2">No Fireflies transcripts found</p>
                  <p className="text-sm">
                    Connect your Fireflies.ai account to sync call transcripts
                    automatically
                  </p>
                  <Button className="mt-4" onClick={loadFirefliesData}>
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Connect Fireflies.ai
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {firefliesData.map((call) => (
                    <div
                      key={call.id}
                      className="border border-border rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <ExternalLink className="w-5 h-5 text-blue-600" />
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-semibold">{call.callId}</h3>
                              <Badge variant="outline" className="text-xs">
                                Fireflies
                              </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground mb-3">
                              <div className="flex items-center space-x-1">
                                <Building className="w-3 h-3" />
                                <span>{call.companyName}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <User className="w-3 h-3" />
                                <span>{call.prospectName}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3" />
                                <span>{call.date}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>{call.duration}</span>
                              </div>
                            </div>

                            <p className="text-sm text-muted-foreground mb-3">
                              {call.firefliesSummary}
                            </p>

                            <div className="flex items-center space-x-2">
                              <Button variant="outline" size="sm">
                                <Download className="w-4 h-4 mr-1" />
                                Import to SalesGenius
                              </Button>
                              <Button variant="outline" size="sm">
                                <ExternalLink className="w-4 h-4 mr-1" />
                                View in Fireflies
                              </Button>
                            </div>
                          </div>
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

      {/* Transcript Dialog */}
      <Dialog open={showTranscriptDialog} onOpenChange={setShowTranscriptDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Call Transcript - {selectedCall?.callId}
            </DialogTitle>
            <DialogDescription>
              {selectedCall?.companyName} • {selectedCall?.date} •{" "}
              {selectedCall?.duration}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Transcript Content */}
            <div className="bg-muted p-4 rounded-lg">
              <pre className="whitespace-pre-wrap text-sm">
                {selectedCall?.transcript}
              </pre>
            </div>

            {/* Participants */}
            <div>
              <h4 className="text-sm font-medium mb-2">Participants</h4>
              <div className="flex flex-wrap gap-2">
                {selectedCall?.participants.map((participant, index) => (
                  <Badge key={index} variant="outline">
                    <User className="w-3 h-3 mr-1" />
                    {participant}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowTranscriptDialog(false)}>
                <X className="w-4 h-4 mr-1" />
                Close
              </Button>
              <Button>
                <Sparkles className="w-4 h-4 mr-1" />
                Generate Insights
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SalesCalls;