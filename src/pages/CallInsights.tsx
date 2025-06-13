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
  Brain
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Mock prospects data with cumulative insights
const mockProspects = [
  {
    id: 'acme_corp',
    companyName: 'Acme Corp',
    prospectName: 'Sarah Johnson',
    title: 'VP of Sales',
    totalCalls: 4,
    lastCallDate: '2024-01-15',
    lastEngagement: '2 hours ago',
    status: 'hot',
    dealValue: '$120K',
    probability: 85,
    nextAction: 'Pilot program approval',
    dataSources: {
      fireflies: 3,
      hubspot: 1,
      presentations: 2,
      emails: 5
    }
  },
  {
    id: 'techstart_inc',
    companyName: 'TechStart Inc',
    prospectName: 'John Smith',
    title: 'CEO',
    totalCalls: 2,
    lastCallDate: '2024-01-14',
    lastEngagement: '1 day ago',
    status: 'warm',
    dealValue: '$45K',
    probability: 65,
    nextAction: 'Technical demo',
    dataSources: {
      fireflies: 2,
      hubspot: 1,
      presentations: 1,
      emails: 3
    }
  },
  {
    id: 'global_solutions',
    companyName: 'Global Solutions Ltd',
    prospectName: 'Emma Wilson',
    title: 'Director of Operations',
    totalCalls: 3,
    lastCallDate: '2024-01-10',
    lastEngagement: '5 days ago',
    status: 'warm',
    dealValue: '$85K',
    probability: 70,
    nextAction: 'Proposal review',
    dataSources: {
      fireflies: 2,
      hubspot: 1,
      presentations: 1,
      emails: 4
    }
  }
];

// Mock cumulative insights for selected prospect
const mockCumulativeInsights = {
  'acme_corp': {
    salesInsights: [
      {
        id: 'insight_1',
        type: 'buying_signal',
        content: 'Strong budget approval confirmed across 3 calls. £50K annual budget pre-approved with Q2 implementation timeline. Decision authority confirmed with Sarah Johnson.',
        relevance_score: 98,
        is_selected: true,
        source: 'Cumulative Analysis',
        timestamp: 'Calls 1-4',
        trend: 'increasing'
      },
      {
        id: 'insight_2',
        type: 'pain_point',
        content: 'Manual lead qualification consuming 15+ hours weekly across 8-person sales team. 40% of time spent on admin vs. selling. 30% lead leakage due to delayed response.',
        relevance_score: 96,
        is_selected: true,
        source: 'Progressive Discovery',
        timestamp: 'Consistent across calls',
        trend: 'stable'
      },
      {
        id: 'insight_3',
        type: 'competitive_advantage',
        content: 'Speed advantage identified: 6-week implementation vs. competitors\' 3-6 months. Critical for Q2 deadline. HubSpot native integration is key differentiator.',
        relevance_score: 94,
        is_selected: true,
        source: 'Competitive Intelligence',
        timestamp: 'Call 3-4',
        trend: 'increasing'
      },
      {
        id: 'insight_4',
        type: 'stakeholder_dynamics',
        content: 'Sarah (decision maker), Mike (technical influencer), Lisa (process stakeholder). No additional approvals needed. Consensus building complete.',
        relevance_score: 92,
        is_selected: true,
        source: 'Stakeholder Mapping',
        timestamp: 'Progressive analysis',
        trend: 'stable'
      },
      {
        id: 'insight_5',
        type: 'urgency_driver',
        content: 'Q2 scaling plans driving urgency. Series B funding secured, doubling sales team. Automation critical for growth execution.',
        relevance_score: 90,
        is_selected: true,
        source: 'Business Context',
        timestamp: 'Call 2-4',
        trend: 'increasing'
      }
    ],
    communicationStyles: [
      {
        id: 'comm_1',
        stakeholder: 'Sarah Johnson',
        role: 'VP of Sales',
        style: 'Visual',
        confidence: 0.92,
        evidence: 'Consistently requests charts, dashboards, and visual data across all 4 calls. Responds positively to ROI visualizations.',
        preferences: [
          'Data-driven presentations',
          'Visual ROI calculators',
          'Dashboard mockups',
          'Infographic summaries'
        ],
        communication_tips: [
          'Lead with visual data',
          'Use charts and graphs',
          'Provide dashboard previews',
          'Include visual case studies'
        ]
      },
      {
        id: 'comm_2',
        stakeholder: 'Mike Chen',
        role: 'Sales Operations Manager',
        style: 'Kinesthetic',
        confidence: 0.87,
        evidence: 'Prefers hands-on technical demos, asks for implementation details, wants to "see it in action".',
        preferences: [
          'Live demonstrations',
          'Hands-on trials',
          'Technical deep-dives',
          'Implementation walkthroughs'
        ],
        communication_tips: [
          'Offer hands-on demos',
          'Provide trial access',
          'Show technical details',
          'Include implementation guides'
        ]
      },
      {
        id: 'comm_3',
        stakeholder: 'Lisa Rodriguez',
        role: 'Director of Marketing',
        style: 'Auditory',
        confidence: 0.83,
        evidence: 'Engages well in verbal discussions, asks clarifying questions, prefers phone calls over emails.',
        preferences: [
          'Verbal explanations',
          'Phone discussions',
          'Collaborative conversations',
          'Team meetings'
        ],
        communication_tips: [
          'Schedule regular calls',
          'Encourage questions',
          'Use storytelling',
          'Focus on collaboration'
        ]
      }
    ]
  }
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

const communicationStyles = {
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
  const [selectedProspect, setSelectedProspect] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [insights, setInsights] = useState([]);
  const [communicationStyles, setCommunicationStyles] = useState([]);
  const [isAddingInsight, setIsAddingInsight] = useState(false);
  const [newInsight, setNewInsight] = useState({ content: '', type: 'user_insight' });
  const [editingId, setEditingId] = useState(null);
  const [editContent, setEditContent] = useState('');

  useEffect(() => {
    // Check if we have a selected call from navigation
    if (location.state?.selectedCall) {
      const call = location.state.selectedCall;
      // Find matching prospect or create new one
      const prospect = mockProspects.find(p => p.companyName === call.companyName) || {
        id: call.companyName.toLowerCase().replace(/\s+/g, '_'),
        companyName: call.companyName,
        prospectName: call.prospectName,
        title: 'Unknown',
        totalCalls: 1,
        lastCallDate: call.date,
        lastEngagement: 'Just now',
        status: 'new',
        dealValue: 'TBD',
        probability: 50,
        nextAction: 'Initial follow-up',
        dataSources: { fireflies: 1, hubspot: 0, presentations: 0, emails: 0 }
      };
      setSelectedProspect(prospect);
      loadProspectInsights(prospect.id);
    } else {
      // Default to most recent prospect
      setSelectedProspect(mockProspects[0]);
      loadProspectInsights(mockProspects[0].id);
    }
  }, [location.state]);

  const loadProspectInsights = (prospectId) => {
    const prospectInsights = mockCumulativeInsights[prospectId];
    if (prospectInsights) {
      setInsights(prospectInsights.salesInsights);
      setCommunicationStyles(prospectInsights.communicationStyles);
    } else {
      // New prospect - minimal insights
      setInsights([
        {
          id: 'new_1',
          type: 'pain_point',
          content: 'Initial discovery call completed. Basic qualification and needs assessment conducted.',
          relevance_score: 75,
          is_selected: true,
          source: 'Initial Analysis',
          timestamp: 'First call',
          trend: 'new'
        }
      ]);
      setCommunicationStyles([]);
    }
  };

  const handleProspectSelect = (prospect) => {
    setSelectedProspect(prospect);
    loadProspectInsights(prospect.id);
    toast.success(`Loaded insights for ${prospect.companyName}`);
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

  const filteredProspects = mockProspects.filter(prospect =>
    prospect.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prospect.prospectName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'hot': return 'bg-red-100 text-red-800 border-red-200';
      case 'warm': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'cold': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'new': return 'bg-gray-100 text-gray-800 border-gray-200';
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
          <Button variant="outline" size="sm" onClick={() => navigate('/calls')}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Sales Calls
          </Button>
        </div>
      </div>

      {/* Cumulative Intelligence Active Indicator */}
      <div className="bg-gradient-to-r from-green-500 to-blue-500 h-1 rounded-full"></div>

      {/* Prospect Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building className="w-5 h-5" />
            <span>Prospect Selection</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search prospects by company or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Prospect List */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProspects.map((prospect) => (
              <div
                key={prospect.id}
                className={cn(
                  "border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md",
                  selectedProspect?.id === prospect.id
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-border hover:border-primary/50"
                )}
                onClick={() => handleProspectSelect(prospect)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-sm">{prospect.companyName}</h3>
                    <p className="text-xs text-muted-foreground">{prospect.prospectName} • {prospect.title}</p>
                  </div>
                  <Badge variant="outline" className={cn("text-xs", getStatusColor(prospect.status))}>
                    {prospect.status}
                  </Badge>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Calls:</span>
                    <span className="font-medium">{prospect.totalCalls}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Deal Value:</span>
                    <span className="font-medium">{prospect.dealValue}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Probability:</span>
                    <span className="font-medium">{prospect.probability}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Engagement:</span>
                    <span className="font-medium">{prospect.lastEngagement}</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">Next:</span> {prospect.nextAction}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedProspect && (
        <>
          {/* Sales Insights Section */}
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
                const typeConfig = insightTypes[insight.type];
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
                  <p className="text-sm mb-4">Add your first insight about this prospect</p>
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
                    const styleConfig = communicationStyles[stakeholder.style];
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

          {/* Cumulative Intelligence Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="w-5 h-5" />
                <span>Cumulative Intelligence</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center space-x-2">
                  <ExternalLink className={cn("w-4 h-4", selectedProspect.dataSources.fireflies > 0 ? "text-blue-600" : "text-gray-400")} />
                  <span className="text-sm">Fireflies Calls:</span>
                  <Badge variant={selectedProspect.dataSources.fireflies > 0 ? "default" : "secondary"}>
                    {selectedProspect.dataSources.fireflies}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Database className={cn("w-4 h-4", selectedProspect.dataSources.hubspot > 0 ? "text-orange-600" : "text-gray-400")} />
                  <span className="text-sm">HubSpot Data:</span>
                  <Badge variant={selectedProspect.dataSources.hubspot > 0 ? "default" : "secondary"}>
                    {selectedProspect.dataSources.hubspot}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <FileText className={cn("w-4 h-4", selectedProspect.dataSources.presentations > 0 ? "text-purple-600" : "text-gray-400")} />
                  <span className="text-sm">Presentations:</span>
                  <Badge variant={selectedProspect.dataSources.presentations > 0 ? "default" : "secondary"}>
                    {selectedProspect.dataSources.presentations}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <MessageSquare className={cn("w-4 h-4", selectedProspect.dataSources.emails > 0 ? "text-green-600" : "text-gray-400")} />
                  <span className="text-sm">Email Threads:</span>
                  <Badge variant={selectedProspect.dataSources.emails > 0 ? "default" : "secondary"}>
                    {selectedProspect.dataSources.emails}
                  </Badge>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground">
                These insights represent an amalgamation of data from all interactions with {selectedProspect.companyName}, 
                providing a comprehensive and evolving understanding of the prospect relationship.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default CallInsights;
export { CallInsights };