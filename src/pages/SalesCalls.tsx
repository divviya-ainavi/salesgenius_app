import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, 
  FileText, 
  Phone, 
  Calendar, 
  Clock, 
  Users, 
  TrendingUp,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Search,
  Filter,
  Download,
  Play,
  Pause,
  Eye,
  BarChart3,
  Target,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowRight,
  Building,
  User,
  MessageSquare,
  FileAudio,
  Video,
  Mic,
  Headphones,
  Database,
  Zap,
  Brain,
  Star,
  ChevronRight,
  Plus,
  Settings,
  Info
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { dbHelpers, CURRENT_USER } from '@/lib/supabase';
import firefliesService from '@/services/firefliesService';

// Mock data for demonstration
const mockFirefliesData = [
  {
    id: 'ff_001',
    callId: 'Demo Call - TechCorp',
    companyName: 'TechCorp Solutions',
    prospectName: 'Sarah Johnson',
    date: '2024-01-15',
    duration: '45 min',
    status: 'completed',
    hasTranscript: true,
    hasSummary: true,
    participants: ['sarah.johnson@techcorp.com', 'mike.chen@techcorp.com'],
    meeting_link: 'https://zoom.us/j/123456789',
    organizer_email: 'sales@company.com',
  },
  {
    id: 'ff_002',
    callId: 'Follow-up Call - InnovateLabs',
    companyName: 'InnovateLabs Inc',
    prospectName: 'David Brown',
    date: '2024-01-12',
    duration: '30 min',
    status: 'completed',
    hasTranscript: true,
    hasSummary: true,
    participants: ['david.brown@innovatelabs.com'],
    meeting_link: 'https://meet.google.com/abc-defg-hij',
    organizer_email: 'sales@company.com',
  }
];

const SalesCalls = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('upload');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [firefliesData, setFirefliesData] = useState([]);
  const [isLoadingFireflies, setIsLoadingFireflies] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [processingStatus, setProcessingStatus] = useState({});

  // Load uploaded files on component mount
  useEffect(() => {
    loadUploadedFiles();
    loadFirefliesData();
  }, []);

  const loadUploadedFiles = async () => {
    try {
      const files = await dbHelpers.getUploadedFiles(CURRENT_USER.id, 20);
      setUploadedFiles(files);
    } catch (error) {
      console.error('Error loading uploaded files:', error);
      toast.error('Failed to load uploaded files');
    }
  };

  const loadFirefliesData = async () => {
    setIsLoadingFireflies(true);
    try {
      const data = await firefliesService.getTranscripts();
      setFirefliesData(data);
    } catch (error) {
      console.error('Error loading Fireflies data:', error);
      // Use mock data as fallback
      setFirefliesData(mockFirefliesData);
      toast.info('Using demo Fireflies data');
    } finally {
      setIsLoadingFireflies(false);
    }
  };

  // File upload handling
  const onDrop = async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      setProcessingProgress(0);
      setSelectedFile(file);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProcessingProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      // Step 1: Upload file to database
      toast.info('Uploading file...');
      const uploadedFile = await dbHelpers.saveUploadedFile(CURRENT_USER.id, file);
      
      // Step 2: Create processing session
      const processingSession = await dbHelpers.createProcessingSession(CURRENT_USER.id, uploadedFile.id);
      
      // Step 3: Simulate AI processing (replace with actual API call)
      toast.info('Processing with AI...');
      
      // Mock API response - replace with actual API call
      const mockApiResponse = {
        "deck_prompt": "Create a slide outlining the integration process and objection handling strategies discussed in the meeting.",
        "action_items": [
          {
            "task": "Resolve integration & compliance concerns",
            "owner": null,
            "deadline": null,
            "priority": "high"
          },
          {
            "task": "Clarify objection on licensing model",
            "owner": null,
            "deadline": null,
            "priority": "high"
          },
          {
            "task": "Complete proof-of-concept deployment",
            "owner": null,
            "deadline": null,
            "priority": "high"
          }
        ],
        "call_summary": "The meeting focused on discussing technical integration, addressing objections, and exploring setup processes. Participants shared frustrations regarding current workflows and the potential for automation to save time. Key concerns included scaling solutions across multiple sales pods and ensuring effective tagging of insights.",
        "error_message": null,
        "sales_insights": [
          {
            "id": "si-1",
            "type": "pain_point",
            "trend": null,
            "source": "Call Transcript",
            "content": "We've had some frustrations with our CRM and post-call documentation lately.",
            "timestamp": "14:01:00",
            "is_selected": true,
            "relevance_score": 85
          },
          {
            "id": "si-2",
            "type": "buying_signal",
            "trend": null,
            "source": "Call Transcript",
            "content": "That would save hours each week.",
            "timestamp": "14:05:30",
            "is_selected": true,
            "relevance_score": 90
          },
          {
            "id": "si-3",
            "type": "user_insight",
            "trend": null,
            "source": "Call Transcript",
            "content": "Can we restrict push rights by role?",
            "timestamp": "14:15:00",
            "is_selected": true,
            "relevance_score": 80
          }
        ],
        "company_details": [],
        "follow_up_email": "Hi Rachel,\\n\\nThank you for the insightful discussion today on integration and objection handling. I appreciate your input regarding the potential benefits for your SDRs and the challenges you've faced with your current workflows. I will summarize our action items and send follow-ups shortly.\\n\\nBest,\\nJames",
        "prospect_details": [
          {
            "name": "Rachel",
            "title": "CIO",
            "company": null
          },
          {
            "name": "James",
            "title": "AE",
            "company": null
          },
          {
            "name": "Derek",
            "title": "SalesLead Solutions Engineer",
            "company": null
          }
        ],
        "processing_status": "completed",
        "communication_styles": [
          {
            "id": "cs-1",
            "role": "CIO",
            "style": "collaborative",
            "evidence": "That could really help our SDRs.",
            "confidence": 0.85,
            "preferences": [
              "interactivity",
              "problem-solving"
            ],
            "stakeholder": "Rachel",
            "communication_tips": [
              "Encourage questions",
              "Provide clear examples"
            ]
          },
          {
            "id": "cs-2",
            "role": "AE",
            "style": "directive",
            "evidence": "Let me show how SalesGenius handles that.",
            "confidence": 0.8,
            "preferences": [
              "structured presentations",
              "clear instructions"
            ],
            "stakeholder": "James",
            "communication_tips": [
              "Be concise",
              "Summarize key points"
            ]
          },
          {
            "id": "cs-3",
            "role": "SalesLead Solutions Engineer",
            "style": "analytical",
            "evidence": "Could this be scaled across 5 sales pods?",
            "confidence": 0.75,
            "preferences": [
              "data-driven insights",
              "detailed explanations"
            ],
            "stakeholder": "Derek",
            "communication_tips": [
              "Use metrics",
              "Encourage feedback"
            ]
          }
        ],
        "call_analysis_overview": {
          "key_points": [
            "Discussion on technical integration",
            "Concerns over current workflows",
            "Potential to save time with automation"
          ],
          "error_message": null,
          "specific_user": "Rachel",
          "sentiment_score": 0.75,
          "processing_status": "completed"
        },
        "extracted_transcript": `[00:00] Rachel: Hi everyone, thanks for joining today's call about our CRM integration needs.

[00:30] James: Thanks for having us, Rachel. I'm excited to show you how SalesGenius can help streamline your post-call documentation process.

[01:00] Derek: Before we dive in, could you tell us about your current workflow challenges?

[01:15] Rachel: We've had some frustrations with our CRM and post-call documentation lately. Our SDRs are spending way too much time on manual data entry.

[02:00] James: That's exactly what we help solve. Let me show you our automated insights feature.

[02:30] Rachel: That could really help our SDRs. How does the integration work with our existing systems?

[03:00] Derek: Could this be scaled across 5 sales pods? We have different teams with different processes.

[03:30] James: Absolutely. Let me show how SalesGenius handles that with role-based permissions.

[04:00] Rachel: Can we restrict push rights by role? We need to maintain data governance.

[04:30] James: Yes, that's built into our platform. You can set granular permissions for each role.

[05:00] Rachel: That would save hours each week. What's the implementation timeline?

[05:30] Derek: We'd need to complete a proof-of-concept deployment first to validate the integration.

[06:00] James: I can help coordinate that. Let me also clarify any objections about our licensing model.

[06:30] Rachel: We do have some concerns about compliance and how this integrates with our existing security protocols.

[07:00] James: I'll make sure to resolve those integration & compliance concerns in our follow-up documentation.

[End of transcript]`
      };

      // Step 4: Store API response in database
      await dbHelpers.storeApiResponseData(
        CURRENT_USER.id,
        uploadedFile.id,
        processingSession.id,
        mockApiResponse
      );

      clearInterval(progressInterval);
      setProcessingProgress(100);

      // Step 5: Update UI and navigate
      await loadUploadedFiles();
      toast.success('File processed successfully!');
      
      // Navigate to Call Insights with the processing session ID
      setTimeout(() => {
        navigate('/call-insights', {
          state: {
            processingSessionId: processingSession.id,
            selectedCall: {
              companyName: file.name.replace(/\.[^/.]+$/, ''),
              prospectName: 'AI Processed',
              callId: `Upload ${file.name}`,
              date: new Date().toISOString().split('T')[0],
              summary: mockApiResponse.call_summary
            }
          }
        });
      }, 1000);

    } catch (error) {
      console.error('Error processing file:', error);
      toast.error('Failed to process file');
    } finally {
      setIsProcessing(false);
      setProcessingProgress(0);
      setSelectedFile(null);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'text/vtt': ['.vtt'],
      'application/pdf': ['.pdf'],
      'audio/*': ['.mp3', '.wav', '.m4a'],
      'video/*': ['.mp4', '.mov', '.avi']
    },
    maxFiles: 1,
    disabled: isProcessing
  });

  const handleFirefliesCallSelect = (call) => {
    // Navigate to Call Insights with Fireflies call data
    navigate('/call-insights', {
      state: {
        selectedCall: {
          companyName: call.companyName,
          prospectName: call.prospectName,
          callId: call.callId,
          date: call.date,
          duration: call.duration,
          summary: call.firefliesSummary || 'Fireflies call summary'
        }
      }
    });
  };

  const handleViewInsights = (file) => {
    // Navigate to Call Insights with the file's processing session
    navigate('/call-insights', {
      state: {
        processingSessionId: file.processing_session_id,
        selectedCall: {
          companyName: file.filename.replace(/\.[^/.]+$/, ''),
          prospectName: 'AI Processed',
          callId: `Upload ${file.filename}`,
          date: new Date(file.upload_date).toISOString().split('T')[0],
          summary: 'Processed file insights'
        }
      }
    });
  };

  const filteredFiles = uploadedFiles.filter(file =>
    file.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredFirefliesData = firefliesData.filter(call =>
    call.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    call.prospectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    call.callId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getFileIcon = (fileType) => {
    if (fileType.includes('audio')) return FileAudio;
    if (fileType.includes('video')) return Video;
    if (fileType.includes('pdf')) return FileText;
    return FileText;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Sales Calls</h1>
          <p className="text-muted-foreground">
            Upload call transcripts or sync from Fireflies.ai to generate AI-powered insights and follow-up content.
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={loadFirefliesData}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Sync Fireflies
          </Button>
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-1" />
            Settings
          </Button>
        </div>
      </div>

      {/* Processing Status */}
      {isProcessing && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="flex-shrink-0">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-primary mb-2">
                  Processing {selectedFile?.name}
                </h3>
                <Progress value={processingProgress} className="mb-2" />
                <p className="text-sm text-muted-foreground">
                  {processingProgress < 30 && "Uploading file..."}
                  {processingProgress >= 30 && processingProgress < 60 && "Extracting transcript..."}
                  {processingProgress >= 60 && processingProgress < 90 && "Analyzing with AI..."}
                  {processingProgress >= 90 && "Finalizing insights..."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">
            <Upload className="w-4 h-4 mr-2" />
            Upload Transcripts
          </TabsTrigger>
          <TabsTrigger value="fireflies">
            <Database className="w-4 h-4 mr-2" />
            Fireflies.ai Sync
          </TabsTrigger>
        </TabsList>

        {/* Upload Tab */}
        <TabsContent value="upload" className="mt-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Upload Area */}
            <div className="lg:col-span-1">
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
                      "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                      isDragActive ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
                      isProcessing && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <input {...getInputProps()} />
                    <div className="space-y-4">
                      <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <Upload className="w-6 h-6 text-primary" />
                      </div>
                      
                      {isDragActive ? (
                        <p className="text-primary font-medium">Drop the file here...</p>
                      ) : (
                        <div>
                          <p className="font-medium mb-2">
                            {isProcessing ? "Processing..." : "Drop your transcript file here"}
                          </p>
                          <p className="text-sm text-muted-foreground mb-4">
                            or click to browse
                          </p>
                        </div>
                      )}
                      
                      <div className="text-xs text-muted-foreground">
                        <p>Supported formats:</p>
                        <p>TXT, VTT, PDF, MP3, WAV, MP4</p>
                        <p>Max file size: 10MB</p>
                      </div>
                    </div>
                  </div>

                  {/* Upload Tips */}
                  <div className="mt-6 space-y-3">
                    <h4 className="font-medium text-sm">Upload Tips:</h4>
                    <div className="space-y-2 text-xs text-muted-foreground">
                      <div className="flex items-start space-x-2">
                        <CheckCircle className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Text files (.txt, .vtt) process fastest</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <CheckCircle className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Audio/video files are transcribed automatically</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <CheckCircle className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>PDFs are analyzed for call content</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Uploaded Files List */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-5 h-5" />
                      <span>Uploaded Files</span>
                      <Badge variant="secondary">{filteredFiles.length}</Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          placeholder="Search files..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 w-64"
                        />
                      </div>
                      <Button variant="outline" size="sm" onClick={loadUploadedFiles}>
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {filteredFiles.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="mb-2">No files uploaded yet</p>
                      <p className="text-sm">Upload your first call transcript to get started</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredFiles.map((file) => {
                        const FileIcon = getFileIcon(file.file_type);
                        
                        return (
                          <div key={file.id} className="border border-border rounded-lg p-4 hover:shadow-sm transition-shadow">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <FileIcon className="w-5 h-5 text-muted-foreground" />
                                <div>
                                  <h4 className="font-medium">{file.filename}</h4>
                                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                    <span>{formatFileSize(file.file_size)}</span>
                                    <span>{formatDate(file.upload_date)}</span>
                                    <Badge variant={file.is_processed ? "default" : "secondary"} className="text-xs">
                                      {file.is_processed ? "Processed" : "Pending"}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                {file.is_processed && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleViewInsights(file)}
                                  >
                                    <Eye className="w-4 h-4 mr-1" />
                                    View Insights
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => dbHelpers.openFile(file.id)}
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Fireflies Tab */}
        <TabsContent value="fireflies" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Database className="w-5 h-5" />
                  <span>Fireflies.ai Integration</span>
                  <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                    Connected
                  </Badge>
                </div>
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
                  <Button variant="outline" size="sm" onClick={loadFirefliesData} disabled={isLoadingFireflies}>
                    {isLoadingFireflies ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingFireflies ? (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-primary" />
                  <p className="text-muted-foreground">Loading Fireflies data...</p>
                </div>
              ) : filteredFirefliesData.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-2">No Fireflies calls found</p>
                  <p className="text-sm">Connect your Fireflies account to sync call recordings</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredFirefliesData.map((call) => (
                    <div key={call.id} className="border border-border rounded-lg p-4 hover:shadow-sm transition-shadow cursor-pointer"
                         onClick={() => handleFirefliesCallSelect(call)}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Phone className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-medium">{call.callId}</h4>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <span>{call.companyName}</span>
                              <span>{call.prospectName}</span>
                              <span>{call.duration}</span>
                              <span>{formatDate(call.date)}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Badge variant="default" className="text-xs bg-blue-100 text-blue-800 border-blue-200">
                            <Headphones className="w-3 h-3 mr-1" />
                            Fireflies
                          </Badge>
                          <Button variant="outline" size="sm">
                            <ArrowRight className="w-4 h-4 mr-1" />
                            Process
                          </Button>
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

      {/* Quick Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total Files</span>
            </div>
            <p className="text-2xl font-bold mt-1">{uploadedFiles.length}</p>
            <p className="text-xs text-muted-foreground">uploaded this month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Brain className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Processed</span>
            </div>
            <p className="text-2xl font-bold mt-1">{uploadedFiles.filter(f => f.is_processed).length}</p>
            <p className="text-xs text-muted-foreground">with AI insights</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Fireflies Calls</span>
            </div>
            <p className="text-2xl font-bold mt-1">{firefliesData.length}</p>
            <p className="text-xs text-muted-foreground">available to sync</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Insights Generated</span>
            </div>
            <p className="text-2xl font-bold mt-1">{uploadedFiles.filter(f => f.is_processed).length * 3}</p>
            <p className="text-xs text-muted-foreground">actionable insights</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SalesCalls;
export { SalesCalls };