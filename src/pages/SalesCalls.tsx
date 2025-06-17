import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { TrackedButton } from '@/components/ui/tracked-button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  Upload,
  FileText,
  Phone,
  ExternalLink,
  RefreshCw,
  Search,
  Calendar,
  Clock,
  Building,
  User,
  Eye,
  Download,
  Copy,
  ArrowRight,
  Loader2,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { dbHelpers, aiAgents, CURRENT_USER } from '@/lib/supabase';
import { useAnalytics } from '@/hooks/useAnalytics';
import firefliesService from '@/services/firefliesService';
import jsPDF from 'jspdf';

const SalesCalls = () => {
  const navigate = useNavigate();
  const { trackButtonClick, trackFileUpload, trackFeatureUsage } = useAnalytics();

  // File upload state
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isProcessingFileId, setIsProcessingFileId] = useState(null);
  const [processedCalls, setProcessedCalls] = useState([]);

  // Fireflies state
  const [firefliesCalls, setFirefliesCalls] = useState([]);
  const [isLoadingFireflies, setIsLoadingFireflies] = useState(false);
  const [firefliesError, setFirefliesError] = useState(null);
  const [lastFirefliesSync, setLastFirefliesSync] = useState(null);

  // Load uploaded files, processed calls, and Fireflies data on component mount
  useEffect(() => {
    loadUploadedFiles();
    loadProcessedCalls();
    loadFirefliesTranscripts();

    // Set up periodic sync for Fireflies (every 5 minutes)
    const syncInterval = setInterval(() => {
      if (!isLoadingFireflies) {
        loadFirefliesTranscripts();
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(syncInterval);
  }, []);

  const loadUploadedFiles = async () => {
    try {
      const files = await dbHelpers.getUploadedFiles(CURRENT_USER.id, 20);
      // Only show unprocessed files in recent uploads
      const unprocessedFiles = files.filter(file => !file.is_processed);
      setUploadedFiles(unprocessedFiles);
    } catch (error) {
      console.error("Error loading uploaded files:", error);
    }
  };

  const loadProcessedCalls = async () => {
    try {
      // Get processing history with related data
      const processingHistory = await dbHelpers.getProcessingHistory(CURRENT_USER.id, 20);
      
      // Transform processing history into processed calls format
      const processedCallsData = processingHistory
        .filter(session => session.processing_status === 'completed' && session.uploaded_files)
        .map(session => ({
          id: session.id,
          callId: `Upload ${session.uploaded_files.filename}`,
          companyName: session.uploaded_files.filename.replace(/\.[^/.]+$/, "") || "Unknown Company",
          prospectName: session.call_notes?.ai_summary ? "AI Processed" : "Unknown Prospect",
          date: new Date(session.processing_started_at).toISOString().split("T")[0],
          duration: "N/A",
          status: "processed",
          source: "upload",
          hasInsights: true,
          transcript: session.uploaded_files.file_content || "Transcript not available",
          originalFilename: session.uploaded_files.filename,
          fileSize: session.uploaded_files.file_size,
          uploadDate: session.uploaded_files.upload_date,
          processingDate: session.processing_completed_at,
          summary: session.call_notes?.ai_summary || "No summary available",
          fileUrl: session.uploaded_files.file_url,
          contentType: session.uploaded_files.content_type,
          storagePath: session.uploaded_files.storage_path,
          // Additional metadata
          contentReferences: session.content_references,
          apiResponse: session.api_response,
        }));

      setProcessedCalls(processedCallsData);
    } catch (error) {
      console.error("Error loading processed calls:", error);
    }
  };

  const loadFirefliesTranscripts = async () => {
    setIsLoadingFireflies(true);
    setFirefliesError(null);
    
    try {
      const transcripts = await firefliesService.getTranscripts({
        limit: 20,
        dateFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Last 30 days
      });
      
      setFirefliesCalls(transcripts);
      setLastFirefliesSync(new Date());
      
      trackFeatureUsage('fireflies_integration', 'sync_transcripts', {
        transcripts_count: transcripts.length,
      });
    } catch (error) {
      console.error('Error loading Fireflies transcripts:', error);
      setFirefliesError(error.message);
    } finally {
      setIsLoadingFireflies(false);
    }
  };

  const handleSyncFireflies = async () => {
    trackButtonClick('Sync Fireflies', { source: 'manual' });
    await loadFirefliesTranscripts();
  };

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('recent');

  // Modal state
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalContent, setModalContent] = useState('');
  const [currentCall, setCurrentCall] = useState(null);

  // File upload handlers
  const onDrop = async (acceptedFiles) => {
    for (const file of acceptedFiles) {
      try {
        trackFileUpload(file.name, file.size, file.type, 'started');

        // Read file content for text files
        let content = null;
        if (file.type === 'text/plain' || file.type === 'text/vtt') {
          content = await file.text();
        }

        // Save file to database with content
        const savedFile = await dbHelpers.saveUploadedFile(
          CURRENT_USER.id,
          file,
          content
        );

        setUploadedFiles(prev => [savedFile, ...prev]);
        trackFileUpload(file.name, file.size, file.type, 'completed');
        toast.success(`${file.name} uploaded successfully`);
      } catch (error) {
        trackFileUpload(file.name, file.size, file.type, 'failed');
        toast.error(`Failed to upload ${file.name}: ${error.message}`);
      }
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'text/vtt': ['.vtt'],
      'application/pdf': ['.pdf'],
      'audio/mpeg': ['.mp3'],
      'audio/wav': ['.wav'],
      'video/mp4': ['.mp4'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  // Modal handlers
  const handleViewTranscript = async (call) => {
    setCurrentCall(call);
    setModalTitle(`Full Transcript - ${call.companyName}`);
    
    try {
      // For processed calls, check if it's a PDF file
      if (call.source === 'upload' && call.contentType === 'application/pdf') {
        // For PDF files, show a message and provide download option
        setModalContent(`PDF file: ${call.originalFilename} (${Math.round(call.fileSize / 1024)} KB)

This is a PDF file that cannot be displayed as text. Please use the "Download PDF" button to view the original file, or the "PDF" button below to download it directly.

File details:
- Original filename: ${call.originalFilename}
- File size: ${Math.round(call.fileSize / 1024)} KB
- Upload date: ${formatDate(call.uploadDate)}
- Processing date: ${formatDate(call.processingDate)}`);
      } else {
        // For text files or Fireflies calls, show the transcript content
        setModalContent(call.transcript || 'Transcript not available');
      }
    } catch (error) {
      console.error('Error loading transcript:', error);
      setModalContent('Error loading transcript content');
    }
    
    setShowTranscriptModal(true);
    
    trackButtonClick('View Transcript', {
      call_id: call.id,
      company: call.companyName,
      source: call.source,
      content_type: call.contentType || 'text'
    });
  };

  const handleViewSummary = (call) => {
    setModalTitle(`Call Summary - ${call.companyName}`);
    setModalContent(call.firefliesSummary || call.summary || 'Summary not available');
    setShowSummaryModal(true);
    
    trackButtonClick('View Summary', {
      call_id: call.id,
      company: call.companyName,
      source: call.source
    });
  };

  const handleCopyTranscript = () => {
    navigator.clipboard.writeText(modalContent);
    toast.success('Transcript copied to clipboard');
    trackButtonClick('Copy Transcript', { source: 'modal' });
  };

  const handleDownloadTranscriptPDF = (call) => {
    try {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(16);
      doc.text('Call Transcript', 20, 20);

      doc.setFontSize(12);
      doc.text(`Company: ${call.companyName}`, 20, 35);
      doc.text(`Call ID: ${call.callId}`, 20, 45);
      doc.text(`Date: ${call.date}`, 20, 55);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 65);

      // Add the transcript content
      doc.setFontSize(10);
      const splitText = doc.splitTextToSize(call.transcript, 170);
      doc.text(splitText, 20, 80);

      // Save the PDF
      const filename = `${call.companyName}_${call.callId}_transcript.pdf`.replace(/[^a-z0-9]/gi, "_").toLowerCase();
      doc.save(filename);
      
      toast.success("PDF downloaded successfully");
      trackButtonClick("Download PDF", { 
        content_type: "transcript",
        call_id: call.id,
        company: call.companyName 
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    }
  };

  const handleDownloadOriginalFile = async (call) => {
    try {
      if (call.fileUrl) {
        // Create a temporary link to download the file
        const link = document.createElement('a');
        link.href = call.fileUrl;
        link.download = call.originalFilename;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success(`Downloading ${call.originalFilename}`);
        trackButtonClick("Download Original File", { 
          call_id: call.id,
          filename: call.originalFilename,
          content_type: call.contentType
        });
      } else {
        toast.error("File URL not available");
      }
    } catch (error) {
      console.error("Error downloading original file:", error);
      toast.error("Failed to download file");
    }
  };

  // Process call handler
  const handleProcessCall = async (call, source) => {
    if (source === "upload") {
      setIsProcessingFileId(call.id);
    }

    try {
      trackFeatureUsage('ai_processing', 'process_call', {
        source,
        call_id: call.id,
        company: call.companyName
      });

      let transcriptContent = '';
      
      if (source === "upload") {
        // Get file content from database
        const fileContent = await dbHelpers.getFileContent(call.id);
        transcriptContent = fileContent || call.file_content || '';
      } else if (source === "fireflies") {
        transcriptContent = call.transcript || '';
      } else if (source === "processed") {
        // For processed calls, navigate directly to insights
        navigate("/call-insights", {
          state: {
            selectedCall: call,
            source: "processed",
            viewMode: "insights",
          },
        });
        return;
      }

      if (!transcriptContent) {
        toast.error("No transcript content available for processing");
        return;
      }

      // Create processing session
      const processingSession = await dbHelpers.createProcessingSession(
        CURRENT_USER.id,
        source === "upload" ? call.id : null
      );

      // Call AI agent for processing
      const aiResponse = await aiAgents.callFollowUpAgent(transcriptContent);

      if (aiResponse.success) {
        // Create call note
        const callNote = await dbHelpers.createCallNote(
          CURRENT_USER.id,
          call.callId || `${call.companyName}-${Date.now()}`,
          transcriptContent,
          source === "upload" ? call.id : null,
          processingSession.id
        );

        // Update call note with AI summary
        await dbHelpers.updateCallNote(callNote.id, {
          ai_summary: aiResponse.data.call_summary,
          status: 'completed'
        });

        // Create related content
        const contentIds = { callNotesId: callNote.id };

        if (aiResponse.data.commitments && aiResponse.data.commitments.length > 0) {
          const commitments = await dbHelpers.createCommitments(
            callNote.id,
            CURRENT_USER.id,
            aiResponse.data.commitments,
            processingSession.id
          );
          contentIds.commitmentsIds = commitments.map(c => c.id);
        }

        if (aiResponse.data.follow_up_email) {
          const email = await dbHelpers.createFollowUpEmail(
            callNote.id,
            CURRENT_USER.id,
            aiResponse.data.follow_up_email,
            processingSession.id
          );
          contentIds.followUpEmailId = email.id;
        }

        if (aiResponse.data.deck_prompt) {
          const deck = await dbHelpers.createDeckPrompt(
            callNote.id,
            CURRENT_USER.id,
            aiResponse.data.deck_prompt,
            processingSession.id
          );
          contentIds.deckPromptId = deck.id;
        }

        // Link content to session and mark as completed
        await dbHelpers.linkContentToSession(processingSession.id, contentIds);
        await dbHelpers.updateProcessingSession(processingSession.id, {
          processing_status: 'completed',
          api_response: aiResponse.data
        });

        // Mark the file as processed
        await dbHelpers.updateUploadedFile(call.id, { is_processed: true });

        toast.success("File processed successfully!");

        // Prepare data for navigation
        const processedData = {
          call_summary: aiResponse.data.call_summary,
          action_items: aiResponse.data.commitments || [],
          follow_up_email: aiResponse.data.follow_up_email,
          deck_prompt: aiResponse.data.deck_prompt,
          call_analysis_overview: {
            specific_user: call.companyName,
            sentiment_score: 0.8,
          },
          sales_insights: aiResponse.data.insights || [],
        };

        // Refresh the lists
        await loadUploadedFiles();
        await loadProcessedCalls();

        // Navigate to Call Insights with the processed data
        navigate("/call-insights", {
          state: {
            selectedCall: call,
            aiProcessedData: processedData,
            showAiInsights: true,
          },
        });
      } else {
        throw new Error(aiResponse.error || "AI processing failed");
      }
    } catch (error) {
      console.error("Error processing call:", error);
      toast.error(`Failed to process call: ${error.message}`);
      
      // Update processing session with error
      if (processingSession) {
        await dbHelpers.updateProcessingSession(processingSession.id, {
          processing_status: 'failed',
          error_message: error.message
        });
      }
    } finally {
      if (source === "upload") {
        setIsProcessingFileId(null);
      }
    }
  };

  // Helper function to format dates
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid Date';
    }
  };

  // Filter functions
  const filteredUploadedFiles = uploadedFiles.filter(
    (file) =>
      file.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Sales Calls</h1>
          <p className="text-muted-foreground">
            Upload call transcripts, sync from Fireflies.ai, and generate AI-powered insights.
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search calls..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          
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
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="recent">Recent Uploads</TabsTrigger>
          <TabsTrigger value="fireflies">Fireflies.ai</TabsTrigger>
          <TabsTrigger value="processed">Past Processed Calls</TabsTrigger>
        </TabsList>

        {/* Recent Uploads Tab */}
        <TabsContent value="recent" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="w-5 h-5" />
                <span>Upload Call Transcripts</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* File Upload Area */}
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
                <h3 className="text-lg font-medium mb-2">
                  {isDragActive ? "Drop files here" : "Upload call transcripts"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  Drag and drop files or click to browse
                </p>
                <p className="text-sm text-muted-foreground">
                  Supports: TXT, VTT, PDF, MP3, WAV, MP4 (max 10MB)
                </p>
              </div>

              {/* Uploaded Files List */}
              {filteredUploadedFiles.length > 0 && (
                <div className="mt-6 space-y-3">
                  <h4 className="font-medium">Recent Uploads</h4>
                  {filteredUploadedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 border border-border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">{file.filename}</p>
                          <p className="text-xs text-muted-foreground">
                            {Math.round(file.file_size / 1024)} KB • {formatDate(file.upload_date)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <TrackedButton
                          variant="outline"
                          size="sm"
                          onClick={() => handleProcessCall(file, "upload")}
                          disabled={isProcessingFileId === file.id}
                          trackingName="Process Uploaded File"
                          trackingContext={{
                            file_id: file.id,
                            filename: file.filename,
                          }}
                        >
                          {isProcessingFileId === file.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <ArrowRight className="w-4 h-4" />
                          )}
                        </TrackedButton>
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
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ExternalLink className="w-5 h-5" />
                  <span>Fireflies.ai Call Transcripts</span>
                  {lastFirefliesSync && (
                    <Badge variant="outline" className="text-xs">
                      Last sync: {lastFirefliesSync.toLocaleTimeString()}
                    </Badge>
                  )}
                </div>
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
                  Sync Fireflies
                </TrackedButton>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingFireflies ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-primary" />
                  <p className="text-muted-foreground">
                    Loading Fireflies transcripts...
                  </p>
                </div>
              ) : firefliesError ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-8 h-8 mx-auto mb-4 text-destructive" />
                  <p className="text-destructive mb-2">
                    Failed to load Fireflies transcripts
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    {firefliesError}
                  </p>
                  <TrackedButton
                    variant="outline"
                    onClick={loadFirefliesTranscripts}
                    trackingName="Retry Fireflies Load"
                  >
                    Try Again
                  </TrackedButton>
                </div>
              ) : filteredFirefliesCalls.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Phone className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-2">No Fireflies transcripts found</p>
                  <p className="text-sm">
                    Connect your Fireflies.ai account to import call transcripts
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredFirefliesCalls.map((call) => (
                    <div
                      key={call.id}
                      className="border border-border rounded-lg p-4 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-foreground">
                              {call.companyName}
                            </h3>
                            <Badge
                              variant={
                                call.status === "completed"
                                  ? "default"
                                  : "secondary"
                              }
                              className="text-xs"
                            >
                              {call.status}
                            </Badge>
                          </div>

                          <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground mb-3">
                            <div className="flex items-center space-x-2">
                              <User className="w-4 h-4" />
                              <span>{call.prospectName}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4" />
                              <span>{call.date}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Clock className="w-4 h-4" />
                              <span>{call.duration}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Building className="w-4 h-4" />
                              <span>{call.callId}</span>
                            </div>
                          </div>

                          {call.participants && call.participants.length > 0 && (
                            <div className="text-xs text-muted-foreground mb-3">
                              <span className="font-medium">Participants:</span>{" "}
                              {call.participants.join(", ")}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          {call.hasSummary && (
                            <TrackedButton
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewSummary(call)}
                              trackingName="View Fireflies Summary"
                              trackingContext={{
                                call_id: call.id,
                                company: call.companyName,
                              }}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Summary
                            </TrackedButton>
                          )}

                          {call.hasTranscript && (
                            <TrackedButton
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewTranscript(call)}
                              trackingName="View Fireflies Transcript"
                              trackingContext={{
                                call_id: call.id,
                                company: call.companyName,
                              }}
                            >
                              <FileText className="w-4 h-4 mr-1" />
                              Transcript
                            </TrackedButton>
                          )}

                          <TrackedButton
                            onClick={() => handleProcessCall(call, "fireflies")}
                            size="sm"
                            trackingName="Process Fireflies Call"
                            trackingContext={{
                              call_id: call.id,
                              company: call.companyName,
                            }}
                          >
                            <Sparkles className="w-4 h-4 mr-1" />
                            Generate Insights
                          </TrackedButton>
                        </div>
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
                <Badge variant="secondary" className="text-xs">
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
                    Upload and process your first transcript to see it here
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredProcessedCalls.map((call) => (
                    <div
                      key={call.id}
                      className="border border-border rounded-lg p-4 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-foreground">
                              {call.companyName}
                            </h3>
                            <Badge variant="default" className="text-xs bg-green-100 text-green-800 border-green-200">
                              Processed
                            </Badge>
                          </div>

                          <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground mb-3">
                            <div className="flex items-center space-x-2">
                              <User className="w-4 h-4" />
                              <span>{call.prospectName}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-4 h-4" />
                              <span>{call.date}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <FileText className="w-4 h-4" />
                              <span>{call.originalFilename}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Building className="w-4 h-4" />
                              <span>{call.callId}</span>
                            </div>
                          </div>

                          {call.processingDate && (
                            <div className="text-xs text-muted-foreground mb-3">
                              <span className="font-medium">Processed:</span>{" "}
                              {formatDate(call.processingDate)}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          {/* View Transcript Button */}
                          <TrackedButton
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewTranscript(call)}
                            trackingName="View Processed Transcript"
                            trackingContext={{
                              call_id: call.id,
                              company: call.companyName,
                            }}
                          >
                            <FileText className="w-4 h-4 mr-1" />
                            View Transcript
                          </TrackedButton>

                          {/* Download PDF Button */}
                          <TrackedButton
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // If it's a PDF file, download the original
                              if (call.contentType === 'application/pdf') {
                                handleDownloadOriginalFile(call);
                              } else {
                                // For text files, generate PDF from transcript
                                handleDownloadTranscriptPDF(call);
                              }
                            }}
                            trackingName="Download Processed Transcript PDF"
                            trackingContext={{
                              call_id: call.id,
                              company: call.companyName,
                            }}
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Download PDF
                          </TrackedButton>

                          {/* View Insights Button */}
                          <TrackedButton
                            onClick={() => handleProcessCall(call, "processed")}
                            size="sm"
                            trackingName="View Processed Call Insights"
                            trackingContext={{
                              call_id: call.id,
                              company: call.companyName,
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View Insights
                          </TrackedButton>
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
                  trackingName="Copy Transcript from Modal"
                >
                  <Copy className="w-4 h-4 mr-1" />
                  Copy
                </TrackedButton>
                <TrackedButton
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (currentCall && currentCall.contentType === 'application/pdf') {
                      // For PDF files, download the original
                      handleDownloadOriginalFile(currentCall);
                    } else {
                      // For text content, generate PDF
                      const doc = new jsPDF();
                      doc.setFontSize(16);
                      doc.text("Call Transcript", 20, 20);
                      doc.setFontSize(12);
                      doc.text(`Title: ${modalTitle}`, 20, 35);
                      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 45);
                      doc.setFontSize(10);
                      const splitText = doc.splitTextToSize(modalContent, 170);
                      doc.text(splitText, 20, 60);
                      doc.save(`${modalTitle.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_transcript.pdf`);
                      toast.success("PDF downloaded successfully");
                    }
                  }}
                  trackingName="Download PDF from Modal"
                >
                  <Download className="w-4 h-4 mr-1" />
                  PDF
                </TrackedButton>
              </div>
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-[60vh] p-4 bg-muted rounded-lg">
            {currentCall && currentCall.contentType === 'application/pdf' ? (
              <div className="text-center py-8">
                <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">PDF File Preview</h3>
                <p className="text-muted-foreground mb-4">
                  This is a PDF file that cannot be displayed as text in this modal.
                </p>
                <div className="space-y-2 text-sm text-muted-foreground mb-6">
                  <p><strong>Filename:</strong> {currentCall.originalFilename}</p>
                  <p><strong>Size:</strong> {Math.round(currentCall.fileSize / 1024)} KB</p>
                  <p><strong>Upload Date:</strong> {formatDate(currentCall.uploadDate)}</p>
                </div>
                <TrackedButton
                  onClick={() => handleDownloadOriginalFile(currentCall)}
                  trackingName="Download PDF from Preview"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Original PDF
                </TrackedButton>
              </div>
            ) : (
              <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                {modalContent}
              </pre>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Summary Modal */}
      <Dialog open={showSummaryModal} onOpenChange={setShowSummaryModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{modalTitle}</DialogTitle>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                {modalContent}
              </pre>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SalesCalls;
export { SalesCalls };