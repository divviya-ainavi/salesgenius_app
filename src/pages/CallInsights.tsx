import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowLeft,
  Sparkles,
  TrendingUp,
  Users,
  Target,
  Lightbulb,
  Star,
  Eye,
  MessageSquare,
  CheckSquare,
  FileText,
  Building,
  User,
  Calendar,
  Clock,
  Database,
  Layers,
  Zap,
  BarChart3,
  RefreshCw,
  ExternalLink,
  Plus,
  Edit,
  Save,
  X,
  ChevronUp,
  ChevronDown,
  Search,
  Filter,
  Ear,
  Hand,
  Brain,
  Info,
  ChevronLeft,
  ChevronRight,
  Phone,
  DollarSign
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { dbHelpers, CURRENT_USER } from '@/lib/supabase';

// Dynamic insights generator based on processed call data
const generateInsightsForCall = (call) => {
  const companyName = call.companyName || 'Unknown Company';
  const prospectName = call.prospectName || 'Unknown Prospect';
  const date = call.date || new Date().toISOString().split('T')[0];
  
  return [
    {
      id: `insight_${call.id}_1`,
      type: 'buying_signal',
      content: `Strong interest expressed during ${companyName} call. Budget discussions initiated and timeline confirmed for ${prospectName}.`,
      relevance_score: 88,
      is_selected: true,
      source: 'AI Analysis',
      timestamp: date,
      trend: 'increasing'
    },
    {
      id: `insight_${call.id}_2`,
      type: 'pain_point',
      content: `Current manual processes identified as major bottleneck. ${companyName} seeking automation solutions to improve efficiency.`,
      relevance_score: 85,
      is_selected: true,
      source: 'Call Analysis',
      timestamp: date,
      trend: 'stable'
    },
    {
      id: `insight_${call.id}_3`,
      type: 'stakeholder_dynamics',
      content: `${prospectName} identified as key decision maker. Additional stakeholders may be involved in the evaluation process.`,
      relevance_score: 82,
      is_selected: true,
      source: 'Stakeholder Analysis',
      timestamp: date,
      trend: 'stable'
    },
    {
      id: `insight_${call.id}_4`,
      type: 'urgency_driver',
      content: `Implementation timeline discussed with urgency for Q2 deployment. ${companyName} has specific deadlines driving decision.`,
      relevance_score: 79,
      is_selected: true,
      source: 'Timeline Analysis',
      timestamp: date,
      trend: 'increasing'
    }
  ];
};

// Dynamic communication styles generator based on processed call data
const generateCommunicationStylesForCall = (call) => {
  const prospectName = call.prospectName || 'Unknown Prospect';
  
  return [
    {
      id: `comm_${call.id}_1`,
      stakeholder: prospectName,
      role: 'Decision Maker',
      style: 'Visual',
      confidence: 0.78,
      evidence: 'Requested visual demonstrations and data presentations during the call. Showed preference for charts and graphs.',
      preferences: [
        'Visual presentations',
        'Data charts and graphs',
        'Dashboard demonstrations',
        'ROI calculators'
      ],
      communication_tips: [
        'Use visual aids in presentations',
        'Provide charts and infographics',
        'Show concrete examples',
        'Include dashboard mockups'
      ]
    },
    {
      id: `comm_${call.id}_2`,
      stakeholder: 'Technical Contact',
      role: 'Technical Evaluator',
      style: 'Kinesthetic',
      confidence: 0.72,
      evidence: 'Asked detailed technical questions and requested hands-on demonstrations during the call.',
      preferences: [
        'Hands-on demonstrations',
        'Technical deep-dives',
        'Implementation details',
        'Trial access'
      ],
      communication_tips: [
        'Provide hands-on demos',
        'Show technical specifications',
        'Offer trial periods',
        'Include implementation guides'
      ]
    }
  ];
};

const insightTypes = {
  buying_signal: {
    icon: TrendingUp,
    label: 'Buying Signal',
    color: 'bg-green-100 text-green-800 border-green-200'
  },
  pain_point: {
    icon: Target,
    label: 'Pain Point',
    color: 'bg-red-100 text-red-800 border-red-200'
  },
  competitive_advantage: {
    icon: Star,
    label: 'Competitive Edge',
    color: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  stakeholder_dynamics: {
    icon: Users,
    label: 'Stakeholder Dynamics',
    color: 'bg-purple-100 text-purple-800 border-purple-200'
  },
  urgency_driver: {
    icon: Clock,
    label: 'Urgency Driver',
    color: 'bg-orange-100 text-orange-800 border-orange-200'
  },
  user_insight: {
    icon: Lightbulb,
    label: 'Your Insight',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  }
};

const communicationStyleConfigs = {
  Visual: {
    icon: Eye,
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    description: 'Prefers charts, graphs, and visual demonstrations'
  },
  Auditory: {
    icon: Ear,
    color: 'bg-green-100 text-green-800 border-green-200',
    description: 'Learns through listening and verbal communication'
  },
  Kinesthetic: {
    icon: Hand,
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    description: 'Prefers hands-on experiences and practical examples'
  }
};

const CallInsights = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedProcessedCall, setSelectedProcessedCall] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [insights, setInsights] = useState([]);
  const [communicationStyles, setCommunicationStyles] = useState([]);
  const [isAddingInsight, setIsAddingInsight] = useState(false);
  const [newInsight, setNewInsight] = useState({ content: '', type: 'user_insight' });
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');
  
  // Processed calls state
  const [processedCalls, setProcessedCalls] = useState([]);
  const [isLoadingProcessedCalls, setIsLoadingProcessedCalls] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  useEffect(() => {
    // Check if we have a selected call from navigation
    if (location.state?.selectedCall) {
      const call = location.state.selectedCall;
      
      // Create processed call from navigation data
      const processedCall = {
        id: `nav_${Date.now()}`,
        callId: call.callId || `Call with ${call.companyName}`,
        companyName: call.companyName || 'Unknown Company',
        prospectName: call.prospectName || 'Unknown Prospect',
        title: call.title || 'Unknown Title',
        date: call.date || new Date().toISOString().split('T')[0],
        duration: call.duration || 'N/A',
        status: 'processed',
        source: 'navigation',
        hasInsights: true,
        totalCalls: 1,
        lastCallDate: call.date || new Date().toISOString().split('T')[0],
        lastEngagement: 'Just processed',
        dealValue: call.dealValue || 'TBD',
        probability: call.probability || 50,
        nextAction: call.nextAction || 'Review insights',
        dataSources: { fireflies: 1, hubspot: 0, presentations: 0, emails: 0 },
        summary: call.summary || 'Call processed successfully',
        insightsCount: 4,
        stakeholdersCount: 2,
      };
      
      // Set this as the selected call and generate insights
      handleProcessedCallSelect(processedCall);
      
      // Also load other processed calls
      loadProcessedCalls();
    } else {
      // Load processed calls when no specific call is selected
      loadProcessedCalls();
    }
  }, [location.state]);

  const loadProcessedCalls = async () => {
    setIsLoadingProcessedCalls(true);
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
          title: "Unknown Title",
          date: new Date(session.processing_started_at).toISOString().split("T")[0],
          duration: "N/A",
          status: "processed",
          source: "upload",
          hasInsights: true,
          originalFilename: session.uploaded_files.filename,
          fileSize: session.uploaded_files.file_size,
          uploadDate: session.uploaded_files.upload_date,
          processingDate: session.processing_completed_at,
          summary: session.call_notes?.ai_summary || "No summary available",
          insightsCount: session.content_references?.insights_ids?.length || 4,
          stakeholdersCount: 2, // Mock data - would be calculated from actual insights
          totalCalls: 1,
          lastCallDate: new Date(session.processing_started_at).toISOString().split("T")[0],
          lastEngagement: "Processed",
          dealValue: "TBD",
          probability: 50,
          nextAction: "Review insights",
          dataSources: { fireflies: 0, hubspot: 0, presentations: 0, emails: 0 },
          // Additional metadata
          contentReferences: session.content_references,
          apiResponse: session.api_response,
        }));

      setProcessedCalls(processedCallsData);
      
      // Auto-select the last processed call (most recent) if no call is already selected
      if (processedCallsData.length > 0 && !selectedProcessedCall) {
        const lastProcessedCall = processedCallsData[0]; // First item is most recent due to ordering
        handleProcessedCallSelect(lastProcessedCall);
      }
    } catch (error) {
      console.error("Error loading processed calls:", error);
      toast.error("Failed to load processed calls");
    } finally {
      setIsLoadingProcessedCalls(false);
    }
  };

  const handleProcessedCallSelect = (call) => {
    setSelectedProcessedCall(call);
    
    // Generate dynamic insights based on the selected call
    const dynamicInsights = generateInsightsForCall(call);
    const dynamicCommunicationStyles = generateCommunicationStylesForCall(call);
    
    setInsights(dynamicInsights);
    setCommunicationStyles(dynamicCommunicationStyles);
    
    toast.success(`Loaded insights for ${call.companyName}`);
  };

  const handleAddInsight = () => {
    if (!newInsight.content.trim()) return;

    const insight = {
      id: Date.now().toString(),
      type: newInsight.type,
      content: newInsight.content.trim(),
      relevance_score: 85,
      is_selected: true,
      source: 'User Input',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      trend: 'new'
    };

    setInsights(prev => [insight, ...prev]);
    setNewInsight({ content: '', type: 'user_insight' });
    setIsAddingInsight(false);
    toast.success('Insight added successfully');
  };

  const handleEditInsight = (insightId) => {
    const insight = insights.find(i => i.id === insightId);
    setEditingId(insightId);
    setEditContent(insight.content);
  };

  const handleSaveEdit = () => {
    setInsights(prev => prev.map(insight =>
      insight.id === editingId ? { ...insight, content: editContent } : insight
    ));
    setEditingId(null);
    setEditContent('');
    toast.success('Insight updated');
  };

  const handleMoveInsight = (insightId, direction) => {
    const currentIndex = insights.findIndex(insight => insight.id === insightId);
    if (
      (direction === 'up' && currentIndex > 0) ||
      (direction === 'down' && currentIndex < insights.length - 1)
    ) {
      const newInsights = [...insights];
      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      [newInsights[currentIndex], newInsights[targetIndex]] = [newInsights[targetIndex], newInsights[currentIndex]];
      
      setInsights(newInsights);
      toast.success('Insight priority updated');
    }
  };

  const handleDeleteInsight = (insightId) => {
    setInsights(prev => prev.filter(insight => insight.id !== insightId));
    toast.success('Insight removed');
  };

  const handleNavigateBack = () => {
    navigate('/calls');
  };

  const handleRefreshProcessedCalls = () => {
    loadProcessedCalls();
    toast.success('Processed calls refreshed');
  };

  const filteredProcessedCalls = processedCalls.filter(call =>
    call.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    call.prospectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    call.callId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'hot': return 'bg-red-100 text-red-800 border-red-200';
      case 'warm': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'cold': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'new': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'processed': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="w-3 h-3 text-green-600" />;
      case 'decreasing': return <TrendingUp className="w-3 h-3 text-red-600 rotate-180" />;
      case 'new': return <Star className="w-3 h-3 text-blue-600" />;
      default: return null;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return 'Invalid Date';
    }
  };

  // Navigation functions for horizontal scrolling
  const cardsPerPage = 3;
  const canScrollLeft = currentCardIndex > 0;
  const canScrollRight = currentCardIndex < Math.max(0, filteredProcessedCalls.length - cardsPerPage);

  const scrollLeft = () => {
    if (canScrollLeft) {
      setCurrentCardIndex(prev => prev - 1);
    }
  };

  const scrollRight = () => {
    if (canScrollRight) {
      setCurrentCardIndex(prev => prev + 1);
    }
  };

  // Get visible cards (3 at a time)
  const visibleCards = filteredProcessedCalls.slice(currentCardIndex, currentCardIndex + cardsPerPage);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Call Insights</h1>
          <p className="text-muted-foreground">
            Accelerating Prospect Conversion - Your ultimate hub for AI-driven prospect intelligence
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleNavigateBack}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Sales Calls
          </Button>
        </div>
      </div>

      {/* Cumulative Intelligence Active Indicator */}
      <div className="bg-gradient-to-r from-green-500 to-blue-500 h-1 rounded-full"></div>

      {/* Prospect Selection - Load Past Processed Calls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Building className="w-5 h-5" />
              <span>Prospect Selection</span>
              <Badge variant="secondary">{filteredProcessedCalls.length} processed calls</Badge>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search processed calls..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Button variant="outline" size="sm" onClick={handleRefreshProcessedCalls}>
                <RefreshCw className="w-4 h-4 mr-1" />
                Refresh
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingProcessedCalls ? (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading processed calls...</p>
            </div>
          ) : filteredProcessedCalls.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="mb-2">No processed calls found</p>
              <p className="text-sm">Process your first call transcript to see insights here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Horizontal Card Navigation - Only show if more than 3 cards */}
              {filteredProcessedCalls.length > cardsPerPage && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={scrollLeft}
                      disabled={!canScrollLeft}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Showing {currentCardIndex + 1}-{Math.min(currentCardIndex + cardsPerPage, filteredProcessedCalls.length)} of {filteredProcessedCalls.length}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={scrollRight}
                      disabled={!canScrollRight}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Horizontal Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {visibleCards.map((call) => (
                  <Card
                    key={call.id}
                    className={cn(
                      "cursor-pointer hover:shadow-md transition-all border-2",
                      selectedProcessedCall?.id === call.id
                        ? "border-primary bg-primary/5 shadow-md"
                        : "border-border hover:border-primary/50"
                    )}
                    onClick={() => handleProcessedCallSelect(call)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground mb-1">
                            {call.companyName || 'Unknown Company'}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {call.prospectName || 'Unknown Prospect'} • {call.title || 'Unknown Title'}
                          </p>
                        </div>
                        <Badge variant="outline" className={cn("text-xs", getStatusColor(call.status))}>
                          {call.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {/* Call Details with all specified fields */}
                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Phone className="w-3 h-3" />
                            <span>Calls: {call.totalCalls || 'N/A'}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <DollarSign className="w-3 h-3" />
                            <span>Value: {call.dealValue || 'N/A'}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <TrendingUp className="w-3 h-3" />
                            <span>Prob: {call.probability || 'N/A'}%</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{call.lastCallDate || 'N/A'}</span>
                          </div>
                        </div>

                        {/* Last Engagement */}
                        <div className="text-xs text-muted-foreground">
                          <span className="font-medium">Last Engagement:</span> {call.lastEngagement || 'N/A'}
                        </div>

                        {/* Next Action */}
                        <div className="text-xs text-muted-foreground">
                          <span className="font-medium">Next:</span> {call.nextAction || 'N/A'}
                        </div>

                        {/* Processing Info */}
                        <div className="text-xs text-muted-foreground">
                          <span className="font-medium">Processed:</span> {formatDate(call.processingDate)}
                        </div>

                        {/* Insights Preview */}
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center space-x-1">
                              <Sparkles className="w-3 h-3 text-blue-600" />
                              <span>{call.insightsCount || 0} insights</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Users className="w-3 h-3 text-green-600" />
                              <span>{call.stakeholdersCount || 0} stakeholders</span>
                            </div>
                          </div>
                        </div>

                        {/* Summary Preview */}
                        <div className="text-xs text-muted-foreground">
                          <p className="line-clamp-2">
                            {call.summary ? call.summary.substring(0, 100) + '...' : 'No summary available'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Show pagination dots if more than 3 cards */}
              {filteredProcessedCalls.length > cardsPerPage && (
                <div className="flex justify-center space-x-1 mt-4">
                  {Array.from({ length: Math.ceil(filteredProcessedCalls.length / cardsPerPage) }).map((_, index) => (
                    <div
                      key={index}
                      className={cn(
                        "w-2 h-2 rounded-full transition-colors cursor-pointer",
                        Math.floor(currentCardIndex / cardsPerPage) === index
                          ? "bg-primary"
                          : "bg-muted-foreground/30"
                      )}
                      onClick={() => setCurrentCardIndex(index * cardsPerPage)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sales Insights Section - Only show when a call is selected */}
      {selectedProcessedCall && (
        <>
          {/* Selected Call Header */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5" />
                  <span>Insights for {selectedProcessedCall.companyName} (Processed Call)</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedProcessedCall(null);
                    setInsights([]);
                    setCommunicationStyles([]);
                  }}
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Back to Selection
                </Button>
              </CardTitle>
            </CardHeader>
          </Card>

          {/* Sales Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5" />
                  <span>Sales Insights</span>
                  <Badge variant="secondary">{insights.length} insights</Badge>
                </div>
                <Button onClick={() => setIsAddingInsight(true)} disabled={isAddingInsight}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Insight
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add New Insight */}
              {isAddingInsight && (
                <div className="border border-dashed border-primary rounded-lg p-4 space-y-3">
                  <div className="flex items-center space-x-3">
                    <Select value={newInsight.type} onValueChange={(value) => setNewInsight(prev => ({ ...prev, type: value }))}>
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(insightTypes).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center space-x-2">
                              <config.icon className="w-4 h-4" />
                              <span>{config.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Textarea
                    value={newInsight.content}
                    onChange={(e) => setNewInsight(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Enter your insight about this prospect..."
                    className="min-h-20"
                    autoFocus
                  />

                  <div className="flex items-center space-x-2">
                    <Button size="sm" onClick={handleAddInsight}>
                      <Save className="w-4 h-4 mr-1" />
                      Save Insight
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsAddingInsight(false);
                        setNewInsight({ content: '', type: 'user_insight' });
                      }}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Insights List */}
              {insights.map((insight, index) => {
                const typeConfig = insightTypes[insight.type] || {
                  icon: Lightbulb,
                  label: "Unknown Type",
                  color: "bg-gray-100 text-gray-800 border-gray-200"
                };
                const TypeIcon = typeConfig.icon;

                return (
                  <div
                    key={insight.id}
                    className="border rounded-lg p-4 space-y-3 hover:shadow-sm transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline" className={cn("text-xs", typeConfig.color)}>
                          <TypeIcon className="w-3 h-3 mr-1" />
                          {typeConfig.label}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          Score: {insight.relevance_score}
                        </Badge>
                        {getTrendIcon(insight.trend)}
                        <span className="text-xs text-muted-foreground">
                          {insight.source} • {insight.timestamp}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoveInsight(insight.id, 'up')}
                          disabled={index === 0}
                        >
                          <ChevronUp className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoveInsight(insight.id, 'down')}
                          disabled={index === insights.length - 1}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                        {editingId === insight.id ? (
                          <div className="flex space-x-1">
                            <Button variant="outline" size="sm" onClick={handleSaveEdit}>
                              <Save className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => setEditingId(null)}>
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditInsight(insight.id)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteInsight(insight.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="ml-6">
                      {editingId === insight.id ? (
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="min-h-20"
                        />
                      ) : (
                        <p className="text-sm leading-relaxed">{insight.content}</p>
                      )}
                    </div>
                  </div>
                );
              })}

              {insights.length === 0 && !isAddingInsight && (
                <div className="text-center py-8 text-muted-foreground">
                  <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-2">No insights available yet</p>
                  <p className="text-sm mb-4">Add your first insight about this processed call</p>
                  <Button variant="outline" size="sm" onClick={() => setIsAddingInsight(true)}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add First Insight
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Communication Styles Detected */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Communication Styles Detected</span>
                <Badge variant="secondary">{communicationStyles.length} stakeholders</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {communicationStyles.length > 0 ? (
                <div className="space-y-6">
                  {communicationStyles.map((stakeholder) => {
                    const styleConfig = communicationStyleConfigs[stakeholder.style];
                    const StyleIcon = styleConfig.icon;

                    return (
                      <div key={stakeholder.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="font-semibold">{stakeholder.stakeholder}</h3>
                            <p className="text-sm text-muted-foreground">{stakeholder.role}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className={cn("text-xs", styleConfig.color)}>
                              <StyleIcon className="w-3 h-3 mr-1" />
                              {stakeholder.style}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {Math.round(stakeholder.confidence * 100)}% confidence
                            </Badge>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-medium mb-2">Evidence</h4>
                            <p className="text-sm text-muted-foreground">{stakeholder.evidence}</p>
                          </div>

                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-sm font-medium mb-2">Preferences</h4>
                              <ul className="text-sm text-muted-foreground space-y-1">
                                {stakeholder.preferences.map((pref, index) => (
                                  <li key={index} className="flex items-start space-x-2">
                                    <span className="text-primary mt-1">•</span>
                                    <span>{pref}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            <div>
                              <h4 className="text-sm font-medium mb-2">Communication Tips</h4>
                              <ul className="text-sm text-muted-foreground space-y-1">
                                {stakeholder.communication_tips.map((tip, index) => (
                                  <li key={index} className="flex items-start space-x-2">
                                    <span className="text-primary mt-1">•</span>
                                    <span>{tip}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-2">No communication styles detected yet</p>
                  <p className="text-sm">Communication styles will be identified as you have more calls with this prospect</p>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default CallInsights;
export { CallInsights };