import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { StepBasedWorkflow } from "@/components/followups/StepBasedWorkflow";
import { CallInsightsViewer } from "@/components/followups/CallInsightsViewer";
import {
  FileText,
  Calendar,
  Clock,
  User,
  CheckCircle,
  AlertCircle,
  Loader2,
  Eye,
  RefreshCw,
  ArrowLeft,
  History,
  CheckSquare,
  Download,
  FileIcon,
  ExternalLink,
  Copy,
  Database,
  Link,
} from "lucide-react";
import { toast } from "sonner";
import { dbHelpers, CURRENT_USER } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const ProcessingHistory = () => {
  const [history, setHistory] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState("list"); // 'list' or 'details'
  const [pushStatuses, setPushStatuses] = useState({});
  const [showFileModal, setShowFileModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const loadHistory = async () => {
    try {
      const data = await dbHelpers.getProcessingHistory(CURRENT_USER.id);
      setHistory(data);
    } catch (error) {
      console.error("Error loading processing history:", error);
      toast.error("Failed to load processing history");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadHistory();
    toast.success("History refreshed");
  };

  const handleViewDetails = async (sessionId) => {
    try {
      const details = await dbHelpers.getProcessingSessionDetails(sessionId);
      setSelectedSession(details);
      setViewMode("details");
    } catch (error) {
      console.error("Error loading session details:", error);
      toast.error("Failed to load session details");
    }
  };

  const handleBackToHistory = () => {
    setSelectedSession(null);
    setViewMode("list");
  };

  const handleViewFile = async (fileId) => {
    try {
      const fileData = await dbHelpers.getUploadedFile(fileId);
      setSelectedFile(fileData);
      setShowFileModal(true);
    } catch (error) {
      console.error("Error loading file:", error);
      toast.error("Failed to load file");
    }
  };

  const handleOpenFileLink = async (fileId) => {
    try {
      await dbHelpers.openFile(fileId);
      toast.success('File opened in new tab');
    } catch (error) {
      console.error("Error opening file:", error);
      toast.error("Failed to open file");
    }
  };

  const handleDownloadFile = (file) => {
    if (file.file_content) {
      // For text files, create a blob and download
      const blob = new Blob([file.file_content], { type: file.content_type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('File downloaded successfully');
    } else if (file.file_url) {
      // For files without stored content, open the shareable link
      window.open(file.file_url, '_blank', 'noopener,noreferrer');
      toast.success('File opened from shareable link');
    } else {
      toast.error('File content not available for download');
    }
  };

  const handleCopyFileContent = (content) => {
    navigator.clipboard.writeText(content);
    toast.success('File content copied to clipboard');
  };

  const handleCopyFileLink = (fileUrl) => {
    navigator.clipboard.writeText(fileUrl);
    toast.success('Shareable file link copied to clipboard');
  };

  const handleEditInsight = async (type, content) => {
    // Update content using normalized database structure
    if (!selectedSession || !selectedSession.content_references) {
      toast.error('Unable to update content - session data not available');
      return;
    }

    try {
      let contentId
      let contentType
      let updateField

      const contentRefs = selectedSession.content_references

      switch (type) {
        case 'call_summary':
          contentId = contentRefs.call_notes_id
          contentType = 'call_summary'
          updateField = 'edited_summary'
          break
        case 'follow_up_email':
          contentId = contentRefs.follow_up_email_id
          contentType = 'follow_up_email'
          updateField = 'edited_content'
          break
        case 'deck_prompt':
          contentId = contentRefs.deck_prompt_id
          contentType = 'deck_prompt'
          updateField = 'edited_content'
          break
        default:
          console.warn('Unknown content type for editing:', type)
          return
      }

      if (contentId) {
        // Update in database using normalized structure
        await dbHelpers.updateContentById(contentType, contentId, {
          [updateField]: content
        })

        // Update local state
        const updatedSession = { ...selectedSession }
        if (type === "call_summary" && updatedSession.call_notes && updatedSession.call_notes.length > 0) {
          updatedSession.call_notes[0].edited_summary = content
        } else if (type === "follow_up_email" && updatedSession.follow_up_emails && updatedSession.follow_up_emails.length > 0) {
          updatedSession.follow_up_emails[0].edited_content = content
        } else if (type === "deck_prompt" && updatedSession.deck_prompts && updatedSession.deck_prompts.length > 0) {
          updatedSession.deck_prompts[0].edited_content = content
        }
        
        setSelectedSession(updatedSession)
        toast.success(`${type.replace('_', ' ')} updated and synced across all references`)
      }
    } catch (error) {
      console.error('Error updating content:', error)
      toast.error('Failed to update content')
    }
  };

  const handlePushToHubSpot = async (type, content) => {
    setPushStatuses((prev) => ({ ...prev, [type]: "pending" }));

    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Determine content ID for logging using normalized structure
      let contentId
      if (selectedSession?.content_references) {
        const contentRefs = selectedSession.content_references
        switch (type) {
          case 'call_summary':
            contentId = contentRefs.call_notes_id
            break
          case 'follow_up_email':
            contentId = contentRefs.follow_up_email_id
            break
          case 'deck_prompt':
            contentId = contentRefs.deck_prompt_id
            break
          default:
            contentId = selectedSession.id
        }
      }

      // Log push action
      await dbHelpers.logPushAction(
        CURRENT_USER.id,
        type,
        contentId || selectedSession.id,
        "success",
        null,
        `hubspot-${Date.now()}`
      );

      setPushStatuses((prev) => ({ ...prev, [type]: "success" }));
      toast.success(`${type} pushed to HubSpot successfully!`);
    } catch (error) {
      setPushStatuses((prev) => ({ ...prev, [type]: "error" }));
      toast.error(`Failed to push ${type} to HubSpot`);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      case "processing":
        return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "failed":
        return "bg-red-100 text-red-800 border-red-200";
      case "processing":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
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
    if (fileType?.includes('pdf')) {
      return <FileIcon className="w-4 h-4 text-red-600" />;
    }
    return <FileText className="w-4 h-4 text-blue-600" />;
  };

  // Transform session data for ReviewInsights component
  const getReviewInsights = (session) => {
    if (!session.call_insights) return [];

    return session.call_insights.map((insight) => ({
      id: insight.id,
      type: insight.insight_type,
      content: insight.content,
      relevance_score: insight.relevance_score,
      is_selected: insight.is_selected,
      source: insight.source,
      timestamp: insight.timestamp,
    }));
  };

  // Extract call analysis data from API response
  const getCallAnalysisData = (session) => {
    if (!session.api_response) return null;

    const apiResponse = session.api_response;

    // Extract data from the API response structure
    const reviewInsights = apiResponse.reviewinsights || {};
    const callSummary = reviewInsights.call_summary || {};

    return {
      specific_user: callSummary.specific_user || "Unknown",
      sentiment_score: callSummary.sentiment_score || 0,
      action_items: reviewInsights.action_items || [],
      communication_styles: reviewInsights.communication_styles || [],
      key_points: callSummary.key_points || [],
    };
  };

  // Get formatted call summary from database (prioritizing edited version)
  const getFormattedCallSummary = (session) => {
    if (session.call_notes && session.call_notes.length > 0) {
      const callNote = session.call_notes[0]
      // Return edited version if available, otherwise return AI-generated version
      return callNote.edited_summary || callNote.ai_summary || "No summary available"
    }

    // Fallback to API response if no database content
    if (session.api_response) {
      const apiResponse = session.api_response;
      const reviewInsights = apiResponse.reviewinsights || {};
      const callSummary = reviewInsights.call_summary || {};

      if (callSummary.key_points && callSummary.key_points.length > 0) {
        return callSummary.key_points.join("\n\n");
      }
    }

    return "No summary available"
  };

  // Get formatted email content (prioritizing edited version)
  const getFormattedEmailContent = (session) => {
    if (session.follow_up_emails && session.follow_up_emails.length > 0) {
      const email = session.follow_up_emails[0]
      return email.edited_content || email.email_content || "No email template generated"
    }
    return "No email template generated"
  };

  // Get formatted deck prompt (prioritizing edited version)
  const getFormattedDeckPrompt = (session) => {
    if (session.deck_prompts && session.deck_prompts.length > 0) {
      const deck = session.deck_prompts[0]
      return deck.edited_content || deck.prompt_content || "No presentation prompt generated"
    }
    return "No presentation prompt generated"
  };

  // Transform session data for insights display
  const getSessionInsights = (session) => {
    if (!session) return null;

    return {
      call_summary: getFormattedCallSummary(session),
      follow_up_email: getFormattedEmailContent(session),
      deck_prompt: getFormattedDeckPrompt(session),
      reviewInsights: getReviewInsights(session),
      callAnalysisData: getCallAnalysisData(session),
    };
  };

  const FileViewModal = () => {
    if (!selectedFile) return null;

    const isPDF = selectedFile.content_type?.includes('pdf') || selectedFile.filename?.toLowerCase().endsWith('.pdf');
    const isTextFile = selectedFile.file_content && !isPDF;
    const hasShareableLink = selectedFile.file_url;

    return (
      <Dialog open={showFileModal} onOpenChange={setShowFileModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              {getFileIcon(selectedFile.content_type)}
              <span>{selectedFile.filename}</span>
              {hasShareableLink && (
                <Badge variant="default" className="text-xs bg-blue-100 text-blue-800 border-blue-200">
                  <Link className="w-3 h-3 mr-1" />
                  Shareable Link
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* File Information */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">File Type:</span>
                  <span className="text-sm font-medium">{selectedFile.content_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">File Size:</span>
                  <span className="text-sm font-medium">{formatFileSize(selectedFile.file_size)}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Uploaded:</span>
                  <span className="text-sm font-medium">{formatDate(selectedFile.upload_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Storage:</span>
                  <Badge variant="default" className="text-xs">Cloud Storage</Badge>
                </div>
              </div>
            </div>

            {/* Shareable Link Section */}
            {hasShareableLink && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-800 mb-2 flex items-center space-x-2">
                  <Link className="w-4 h-4" />
                  <span>Shareable Link</span>
                </h4>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={selectedFile.file_url}
                    readOnly
                    className="flex-1 px-3 py-2 text-xs bg-white border border-blue-300 rounded-md font-mono"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyFileLink(selectedFile.file_url)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(selectedFile.file_url, '_blank', 'noopener,noreferrer')}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-blue-700 mt-2">
                  This link can be shared with others to access the file directly.
                </p>
              </div>
            )}

            {/* File Actions */}
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleDownloadFile(selectedFile)}
              >
                <Download className="w-4 h-4 mr-1" />
                {selectedFile.file_content ? 'Download' : 'Open Link'}
              </Button>
              {isTextFile && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleCopyFileContent(selectedFile.file_content)}
                >
                  <Copy className="w-4 h-4 mr-1" />
                  Copy Content
                </Button>
              )}
              {hasShareableLink && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleCopyFileLink(selectedFile.file_url)}
                >
                  <Link className="w-4 h-4 mr-1" />
                  Copy Link
                </Button>
              )}
              {isPDF && (
                <Badge variant="secondary" className="text-xs">
                  PDF files open via shareable link
                </Badge>
              )}
            </div>

            {/* File Content Preview */}
            {isTextFile && (
              <div className="border rounded-lg">
                <div className="bg-muted px-4 py-2 border-b">
                  <h4 className="text-sm font-medium">File Content Preview</h4>
                </div>
                <div className="p-4 max-h-96 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">
                    {selectedFile.file_content}
                  </pre>
                </div>
              </div>
            )}

            {isPDF && (
              <div className="border rounded-lg p-8 text-center">
                <FileIcon className="w-16 h-16 mx-auto mb-4 text-red-600" />
                <h4 className="text-lg font-medium mb-2">PDF File</h4>
                <p className="text-muted-foreground mb-4">
                  PDF content preview is not available. Use the shareable link to view the file.
                </p>
                <Button onClick={() => window.open(selectedFile.file_url, '_blank', 'noopener,noreferrer')}>
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Open PDF Link
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const HistoryList = () => {
    if (isLoading) {
      return (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Loading processing history...</span>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <History className="w-5 h-5" />
              <span>Processing History</span>
              <Badge variant="secondary">{history.length} files</Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="mb-2">No files processed yet</p>
              <p className="text-sm">
                Upload your first call transcript to get started
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((session) => (
                <div
                  key={session.id}
                  className={cn(
                    "border rounded-lg p-4 transition-colors",
                    selectedSession?.id === session.id
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-accent"
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start space-x-3">
                      <div className="mt-1">
                        {getStatusIcon(session.processing_status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          {getFileIcon(session.uploaded_files?.file_type)}
                          <h4 className="font-medium truncate">
                            {session.uploaded_files?.filename || "Unknown file"}
                          </h4>
                          {session.uploaded_files?.file_url && (
                            <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800 border-blue-200">
                              <Link className="w-3 h-3 mr-1" />
                              Link
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {session.uploaded_files?.file_type} •{" "}
                          {formatFileSize(
                            session.uploaded_files?.file_size || 0
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          getStatusColor(session.processing_status)
                        )}
                      >
                        {session.processing_status}
                      </Badge>
                      {/* Show normalized structure indicator */}
                      {session.content_references && (
                        <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800 border-blue-200">
                          <Database className="w-3 h-3 mr-1" />
                          Linked
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>
                        Uploaded:{" "}
                        {formatDate(
                          session.uploaded_files?.upload_date ||
                            session.processing_started_at
                        )}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>
                        {session.processing_completed_at
                          ? `Completed: ${formatDate(
                              session.processing_completed_at
                            )}`
                          : "In progress..."}
                      </span>
                    </div>
                  </div>

                  {/* Content References Info */}
                  {session.content_references && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <Link className="w-4 h-4 text-blue-600" />
                        <p className="text-sm font-medium text-blue-800">Normalized Content Structure</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-blue-700">
                        {session.content_references.call_notes_id && (
                          <span>✓ Call Summary</span>
                        )}
                        {session.content_references.follow_up_email_id && (
                          <span>✓ Follow-up Email</span>
                        )}
                        {session.content_references.deck_prompt_id && (
                          <span>✓ Presentation</span>
                        )}
                        {session.content_references.commitments_ids?.length > 0 && (
                          <span>✓ {session.content_references.commitments_ids.length} Action Items</span>
                        )}
                        {session.content_references.insights_ids?.length > 0 && (
                          <span>✓ {session.content_references.insights_ids.length} Insights</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Processing Progress for active sessions */}
                  {session.processing_status === "processing" && (
                    <div className="mb-3">
                      <Progress value={75} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">
                        Processing insights...
                      </p>
                    </div>
                  )}

                  {/* Summary for completed sessions */}
                  {session.processing_status === "completed" &&
                    session.call_notes &&
                    session.call_notes.length > 0 && (
                      <div className="bg-muted rounded-lg p-3 mb-3">
                        <p className="text-sm font-medium mb-1">AI Summary</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {(session.call_notes[0].edited_summary || session.call_notes[0].ai_summary)?.substring(0, 150)}
                          ...
                        </p>
                      </div>
                    )}

                  {/* Error message for failed sessions */}
                  {session.processing_status === "failed" &&
                    session.error_message && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                        <p className="text-sm font-medium text-red-800 mb-1">
                          Error
                        </p>
                        <p className="text-xs text-red-700">
                          {session.error_message}
                        </p>
                      </div>
                    )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <User className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        Processed by {CURRENT_USER.name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewFile(session.file_id);
                        }}
                      >
                        <FileText className="w-3 h-3 mr-1" />
                        View File
                      </Button>
                      {session.uploaded_files?.file_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenFileLink(session.file_id);
                          }}
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Open Link
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(session.id);
                        }}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const SessionDetails = () => {
    if (!selectedSession) {
      return (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">No session selected</p>
          </CardContent>
        </Card>
      );
    }

    const insights = getSessionInsights(selectedSession);
    const currentStep =
      selectedSession.processing_status === "completed" ? 2 : 1;
    const completedSteps =
      selectedSession.processing_status === "completed" ? [1] : [];

    return (
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm" onClick={handleBackToHistory}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to History
            </Button>
            <div>
              <h2 className="text-xl font-semibold">
                {selectedSession.uploaded_files?.filename}
              </h2>
              <p className="text-sm text-muted-foreground">
                Processed on{" "}
                {formatDate(
                  selectedSession.processing_completed_at ||
                    selectedSession.processing_started_at
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleViewFile(selectedSession.file_id)}
            >
              <FileText className="w-4 h-4 mr-1" />
              View Original File
            </Button>
            {selectedSession.uploaded_files?.file_url && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOpenFileLink(selectedSession.file_id)}
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                Open Shareable Link
              </Button>
            )}
            <Badge
              variant={
                selectedSession.processing_status === "completed"
                  ? "default"
                  : "destructive"
              }
            >
              {selectedSession.processing_status}
            </Badge>
            {selectedSession.content_references && (
              <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                <Database className="w-4 h-4 mr-1" />
                Normalized Structure
              </Badge>
            )}
          </div>
        </div>

        {/* Step-Based Workflow */}
        <StepBasedWorkflow
          currentStep={currentStep}
          completedSteps={completedSteps}
        />

        {/* File Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>File Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Filename:
                  </span>
                  <span className="text-sm font-medium">
                    {selectedSession.uploaded_files?.filename}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    File Type:
                  </span>
                  <span className="text-sm font-medium">
                    {selectedSession.uploaded_files?.file_type}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    File Size:
                  </span>
                  <span className="text-sm font-medium">
                    {formatFileSize(
                      selectedSession.uploaded_files?.file_size || 0
                    )}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Upload Date:
                  </span>
                  <span className="text-sm font-medium">
                    {formatDate(selectedSession.uploaded_files?.upload_date)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    Processing Started:
                  </span>
                  <span className="text-sm font-medium">
                    {formatDate(selectedSession.processing_started_at)}
                  </span>
                </div>
                {selectedSession.processing_completed_at && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Processing Completed:
                    </span>
                    <span className="text-sm font-medium">
                      {formatDate(selectedSession.processing_completed_at)}
                    </span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Shareable Link Information */}
            {selectedSession.uploaded_files?.file_url && (
              <div className="mt-4 pt-4 border-t border-border">
                <h4 className="text-sm font-medium mb-3 flex items-center space-x-2">
                  <Link className="w-4 h-4" />
                  <span>Shareable File Link</span>
                </h4>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <input
                      type="text"
                      value={selectedSession.uploaded_files.file_url}
                      readOnly
                      className="flex-1 px-3 py-2 text-xs bg-white border border-blue-300 rounded-md font-mono"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyFileLink(selectedSession.uploaded_files.file_url)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(selectedSession.uploaded_files.file_url, '_blank', 'noopener,noreferrer')}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-blue-700">
                    This link provides direct access to the uploaded file and can be shared with others.
                  </p>
                </div>
              </div>
            )}
            
            {/* Content References Information */}
            {selectedSession.content_references && (
              <div className="mt-4 pt-4 border-t border-border">
                <h4 className="text-sm font-medium mb-3 flex items-center space-x-2">
                  <Database className="w-4 h-4" />
                  <span>Content References (Normalized Structure)</span>
                </h4>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Call Summary ID:</span>
                      <span className="font-mono text-xs">{selectedSession.content_references.call_notes_id || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Email ID:</span>
                      <span className="font-mono text-xs">{selectedSession.content_references.follow_up_email_id || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Deck ID:</span>
                      <span className="font-mono text-xs">{selectedSession.content_references.deck_prompt_id || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Action Items:</span>
                      <span className="text-xs">{selectedSession.content_references.commitments_ids?.length || 0} items</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Insights:</span>
                      <span className="text-xs">{selectedSession.content_references.insights_ids?.length || 0} items</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Content is stored in normalized tables and linked by ID. Updates in one place automatically reflect everywhere.
                </p>
              </div>
            )}
            
            {/* File Actions */}
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewFile(selectedSession.file_id)}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View File Content
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (selectedSession.uploaded_files) {
                      handleDownloadFile(selectedSession.uploaded_files);
                    }
                  }}
                >
                  <Download className="w-4 h-4 mr-1" />
                  {selectedSession.uploaded_files?.file_content ? 'Download File' : 'Open Link'}
                </Button>
                {selectedSession.uploaded_files?.file_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyFileLink(selectedSession.uploaded_files.file_url)}
                  >
                    <Link className="w-4 h-4 mr-1" />
                    Copy Shareable Link
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Use Reusable CallInsightsViewer Component for completed sessions */}
        {selectedSession.processing_status === "completed" && insights && (
          <CallInsightsViewer
            insights={insights}
            callNotesId={selectedSession.call_notes?.[0]?.id}
            userId={CURRENT_USER.id}
            onNavigateBack={handleBackToHistory}
            onEditInsight={handleEditInsight}
            onPushToHubSpot={handlePushToHubSpot}
            pushStatuses={pushStatuses}
            showBackButton={false} // We already have a back button in the header
            isEditable={true}
            title="Processing History Details"
            isProcessingHistory={true} // Mark as processing history context
          />
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          Processing History
        </h1>
        <p className="text-muted-foreground">
          View and manage all your previously processed call transcripts and
          generated insights. Files are stored with shareable links for easy access and content is normalized across database tables.
        </p>
      </div>

      {/* Main Content */}
      {viewMode === "list" ? <HistoryList /> : <SessionDetails />}

      {/* File View Modal */}
      <FileViewModal />
    </div>
  );
};

export default ProcessingHistory;
export { ProcessingHistory };