import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrackedButton } from '@/components/ui/tracked-button';
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
  Copy
} from 'lucide-react';
import { toast } from 'sonner';
import { useDropzone } from 'react-dropzone';
import { dbHelpers, CURRENT_USER } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { useAnalytics } from '@/hooks/useAnalytics';

// Mock data for Fireflies.ai imports
const mockFirefliesCalls = [
  {
    id: 'ff_001',
    callId: 'Call 1',
    companyName: 'Acme Corp',
    prospectName: 'Sarah Johnson',
    date: '2024-01-15',
    duration: '45 min',
    status: 'completed',
    hasTranscript: true,
    hasSummary: true,
    firefliesSummary: `Key Discussion Points:
• Current lead qualification process taking 2-3 hours daily
• Team of 8 sales reps struggling with manual processes
• Budget approved for Q2 implementation
• Decision timeline: End of Q1
• Key stakeholders: Sarah (VP Sales), Mike (Sales Ops), Lisa (Marketing)

Pain Points Identified:
• 40% of time spent on administrative tasks
• 30% of leads going cold due to delayed response
• Lack of real-time lead scoring
• Manual CRM data entry

Next Steps:
• Technical demo scheduled for next Tuesday
• ROI analysis requested
• Integration requirements review`,
    transcript: `[00:00] Sarah Johnson: Thanks for joining today. I wanted to discuss our lead qualification challenges...

[02:15] Sales Rep: Can you tell me more about your current process?

[02:30] Sarah Johnson: Currently, each of our 8 sales reps spends about 2-3 hours daily on manual lead qualification. We're looking at implementing an automated solution by Q2.

[05:45] Mike Chen: From a technical perspective, we need something that integrates seamlessly with our existing HubSpot setup...

[Continue with full transcript...]`,
    audioUrl: null
  },
  {
    id: 'ff_002',
    callId: 'Call 2',
    companyName: 'TechStart Inc',
    prospectName: 'John Smith',
    date: '2024-01-14',
    duration: '30 min',
    status: 'completed',
    hasTranscript: true,
    hasSummary: true,
    firefliesSummary: `Discovery Call Summary:
• Startup with 15 employees, rapid growth phase
• Current CRM: Basic Salesforce setup
• Pain point: No lead scoring mechanism
• Budget: £2K-5K monthly
• Decision maker: John Smith (CEO)
• Timeline: Immediate need

Technical Requirements:
• API integration capabilities
• Real-time notifications
• Mobile accessibility
• Reporting dashboard

Competitive Landscape:
• Evaluating 2 other vendors
• Price sensitivity due to startup budget
• Looking for quick implementation`,
    transcript: `[00:00] John Smith: Hi, thanks for reaching out. We're a growing startup and really need help with lead management...

[01:30] Sales Rep: What's your current setup like?

[01:45] John Smith: We're using basic Salesforce but have no automated lead scoring. With our growth, we're missing opportunities...

[Continue with full transcript...]`,
    audioUrl: null
  }
];

// Mock data for past processed calls
const mockProcessedCalls = [
  {
    id: 'proc_001',
    callId: 'Call 3',
    companyName: 'Global Solutions Ltd',
    prospectName: 'Emma Wilson',
    date: '2024-01-10',
    duration: '35 min',
    status: 'processed',
    source: 'upload',
    hasInsights: true,
    transcript: `[00:00] Emma Wilson: We're looking to scale our sales operations significantly this year...

[02:00] Sales Rep: What's driving this need for scaling?

[02:15] Emma Wilson: We've just secured Series B funding and plan to double our sales team by Q3...

[Continue with full transcript...]`
  },
  {
    id: 'proc_002',
    callId: 'Call 4',
    companyName: 'Innovation Hub',
    prospectName: 'David Brown',
    date: '2024-01-08',
    duration: '50 min',
    status: 'processed',
    source: 'fireflies',
    hasInsights: true,
    transcript: `[00:00] David Brown: Our current lead qualification process is completely manual and it's killing our productivity...

[Continue with full transcript...]`
  }
];

const SalesCalls = () => {
  const navigate = useNavigate();
  const { trackButtonClick, trackFeatureUsage, trackFileUpload } = useAnalytics();
  const [activeTab, setActiveTab] = useState('upload');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCall, setSelectedCall] = useState(null);
  const [showTranscriptModal, setShowTranscriptModal] = useState(false);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [modalContent, setModalContent] = useState('');
  const [modalTitle, setModalTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  // Load uploaded files on component mount
  useEffect(() => {
    loadUploadedFiles();
    
    // Track page visit
    trackFeatureUsage('sales_calls', 'page_visit');
  }, []);

  // Track tab changes
  useEffect(() => {
    trackFeatureUsage('sales_calls', 'tab_change', { tab: activeTab });
  }, [activeTab]);

  const loadUploadedFiles = async () => {
    try {
      const files = await dbHelpers.getUploadedFiles(CURRENT_USER.id, 20);
      setUploadedFiles(files);
    } catch (error) {
      console.error('Error loading uploaded files:', error);
    }
  };

  // File upload handling
  const onDrop = async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;
    
    setIsUploading(true);
    const file = acceptedFiles[0];
    
    try {
      // Track file upload start
      trackFileUpload(file.name, file.size, file.type, 'started');
      
      // Validate file type
      const validTypes = ['text/plain', 'text/vtt', 'application/pdf'];
      const validExtensions = ['.txt', '.vtt', '.pdf'];
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      
      if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
        toast.error('Please upload only .txt, .vtt, or .pdf files');
        trackFileUpload(file.name, file.size, file.type, 'failed');
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error('File size must be less than 10MB');
        trackFileUpload(file.name, file.size, file.type, 'failed');
        return;
      }

      // For text files, read content for database storage
      let content = '';
      const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      
      if (!isPDF) {
        content = await file.text();
      } else {
        content = `PDF file: ${file.name} (${file.size} bytes)`;
      }

      // Save uploaded file to database with shareable link
      await dbHelpers.saveUploadedFile(CURRENT_USER.id, file, content);
      
      toast.success('File uploaded successfully!');
      trackFileUpload(file.name, file.size, file.type, 'completed');
      await loadUploadedFiles(); // Refresh the list
      
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error(`Failed to upload file: ${error.message}`);
      trackFileUpload(file.name, file.size, file.type, 'failed');
    } finally {
      setIsUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'text/vtt': ['.vtt'],
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    disabled: isUploading
  });

  const handleViewSummary = (call) => {
    trackButtonClick('View Summary', { call_id: call.id, company: call.companyName });
    setModalTitle(`Call Summary - ${call.companyName}`);
    setModalContent(call.firefliesSummary);
    setShowSummaryModal(true);
  };

  const handleViewTranscript = (call) => {
    trackButtonClick('View Transcript', { call_id: call.id, company: call.companyName });
    setModalTitle(`Full Transcript - ${call.companyName}`);
    setModalContent(call.transcript);
    setShowTranscriptModal(true);
  };

  const handleCopyTranscript = () => {
    navigator.clipboard.writeText(modalContent);
    toast.success('Transcript copied to clipboard');
    trackButtonClick('Copy Transcript');
  };

  const handleDownloadTranscriptPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Set up the document
      doc.setFontSize(16);
      doc.text('Call Transcript', 20, 20);
      
      doc.setFontSize(12);
      doc.text(`Title: ${modalTitle}`, 20, 35);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 45);
      
      // Add the transcript content
      doc.setFontSize(10);
      const splitText = doc.splitTextToSize(modalContent, 170);
      doc.text(splitText, 20, 60);
      
      // Save the PDF
      doc.save(`${modalTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_transcript.pdf`);
      toast.success('PDF downloaded successfully');
      trackButtonClick('Download PDF', { content_type: 'transcript' });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    }
  };

  const handleDownloadTranscript = (call) => {
    const blob = new Blob([call.transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${call.companyName}_${call.callId}_transcript.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Transcript downloaded');
    trackButtonClick('Download Transcript', { call_id: call.id, company: call.companyName });
  };

  const handleProcessCall = (call, source = 'fireflies') => {
    trackButtonClick('Generate Insights', { 
      call_id: call.id, 
      company: call.companyName, 
      source: source 
    });
    
    trackFeatureUsage('call_processing', 'start_processing', {
      source: source,
      company: call.companyName
    });

    // Navigate to Call Insights page with the selected call data
    navigate('/call-insights', { 
      state: { 
        selectedCall: call,
        source: source
      } 
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileIcon = (fileType) => {
    if (fileType?.includes('pdf')) {
      return <FileIcon className="w-4 h-4 text-red-600" />;
    }
    return <FileText className="w-4 h-4 text-blue-600" />;
  };

  // Filter functions
  const filteredFirefliesCalls = mockFirefliesCalls.filter(call =>
    call.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    call.prospectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    call.callId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProcessedCalls = mockProcessedCalls.filter(call =>
    call.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    call.prospectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    call.callId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUploadedFiles = uploadedFiles.filter(file =>
    file.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Sales Calls</h1>
        <p className="text-muted-foreground">
          Your starting point for call data. Upload transcripts, import from Fireflies.ai, or select from past processed calls to generate insights.
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
                    isDragActive ? "border-primary bg-primary/5" : "border-border",
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
                        {isUploading ? 'Uploading...' : 'Drop your transcript here'}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {isUploading 
                          ? 'Please wait while we process your file'
                          : 'Drag and drop your .txt, .vtt, or .pdf file, or click to browse'
                        }
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
                    <p className="text-sm">Upload your first transcript to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredUploadedFiles.slice(0, 5).map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div className="flex items-center space-x-3">
                          {getFileIcon(file.content_type)}
                          <div>
                            <h4 className="font-medium text-sm">{file.filename}</h4>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(file.file_size)} • {formatDate(file.upload_date)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <TrackedButton
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const mockCall = {
                                id: file.id,
                                callId: `Upload ${file.id.slice(-3)}`,
                                companyName: 'Uploaded File',
                                prospectName: 'Unknown',
                                date: file.upload_date,
                                duration: 'Unknown',
                                transcript: file.file_content || 'Content not available for preview',
                                source: 'upload'
                              };
                              handleProcessCall(mockCall, 'upload');
                            }}
                            trackingName="Process Uploaded File"
                            trackingContext={{ file_id: file.id, filename: file.filename }}
                          >
                            <ArrowRight className="w-3 h-3 mr-1" />
                            Process
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
                  <Badge variant="secondary">{filteredFirefliesCalls.length} calls</Badge>
                </div>
                <TrackedButton 
                  variant="outline" 
                  size="sm"
                  trackingName="Sync Fireflies"
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Sync from Fireflies
                </TrackedButton>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredFirefliesCalls.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ExternalLink className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-2">No Fireflies.ai calls found</p>
                  <p className="text-sm">Connect your Fireflies.ai account to import calls</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredFirefliesCalls.map((call) => (
                    <div key={call.id} className="border border-border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold">{call.callId}</h3>
                            <Badge variant="outline">{call.status}</Badge>
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
                          {call.hasSummary && (
                            <TrackedButton
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewSummary(call)}
                              trackingName="View Summary"
                              trackingContext={{ call_id: call.id, company: call.companyName }}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              View Summary
                            </TrackedButton>
                          )}
                          {call.hasTranscript && (
                            <TrackedButton
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewTranscript(call)}
                              trackingName="View Transcript"
                              trackingContext={{ call_id: call.id, company: call.companyName }}
                            >
                              <FileText className="w-3 h-3 mr-1" />
                              View Transcript
                            </TrackedButton>
                          )}
                        </div>
                        <TrackedButton 
                          onClick={() => handleProcessCall(call, 'fireflies')}
                          trackingName="Generate Insights"
                          trackingContext={{ call_id: call.id, company: call.companyName, source: 'fireflies' }}
                        >
                          <ArrowRight className="w-4 h-4 mr-1" />
                          Generate Insights
                        </TrackedButton>
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
                <Badge variant="secondary">{filteredProcessedCalls.length} calls</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredProcessedCalls.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-2">No processed calls yet</p>
                  <p className="text-sm">Process your first call to see it here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredProcessedCalls.map((call) => (
                    <div key={call.id} className="border border-border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold">{call.callId}</h3>
                            <Badge variant="default">Processed</Badge>
                            {call.hasInsights && (
                              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
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
                            trackingContext={{ call_id: call.id, company: call.companyName }}
                          >
                            <FileText className="w-3 h-3 mr-1" />
                            View Original Transcript
                          </TrackedButton>
                          <TrackedButton
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadTranscript(call)}
                            trackingName="Download Transcript PDF"
                            trackingContext={{ call_id: call.id, company: call.companyName }}
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
                                trackButtonClick('View Insights', { 
                                  call_id: call.id, 
                                  company: call.companyName 
                                });
                                navigate('/call-insights', { 
                                  state: { 
                                    selectedCall: call,
                                    source: call.source,
                                    viewMode: 'insights'
                                  } 
                                });
                              }}
                              trackingName="View Call Insights"
                              trackingContext={{ call_id: call.id, company: call.companyName }}
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
                  toast.success('Summary copied to clipboard');
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