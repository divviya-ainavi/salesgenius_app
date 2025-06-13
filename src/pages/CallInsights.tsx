import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft,
  Brain,
  TrendingUp,
  Users,
  Target,
  Lightbulb,
  Star,
  Eye,
  MessageSquare,
  CheckSquare,
  FileText,
  Presentation,
  Mail,
  Building,
  User,
  Calendar,
  Clock,
  Database,
  Layers,
  Zap,
  BarChart3,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { CallInsightsViewer } from '@/components/followups/CallInsightsViewer';
import { aiAgents, dbHelpers, CURRENT_USER } from '@/lib/supabase';
import { cn } from '@/lib/utils';

// Mock cumulative insights data that builds over multiple calls
const mockCumulativeInsights = {
  'Acme Corp': {
    prospectName: 'Sarah Johnson',
    totalCalls: 4,
    lastCallDate: '2024-01-15',
    dataSources: {
      fireflies: 3,
      hubspot: 1,
      presentations: 2,
      emails: 5
    },
    cumulativeInsights: {
      call_summary: `Comprehensive Prospect Analysis - Acme Corp (4 Calls)

EXECUTIVE SUMMARY:
Sarah Johnson (VP Sales) at Acme Corp represents a high-value opportunity with strong buying signals and clear pain points. Through 4 progressive calls, we've identified significant automation needs and budget approval for Q2 implementation.

CUMULATIVE PAIN POINTS:
• Manual lead qualification consuming 15+ hours weekly across 8-person sales team
• 40% of sales time spent on administrative tasks vs. selling activities  
• 30% lead leakage due to delayed response times (identified in calls 1-3)
• Lack of real-time lead scoring causing missed opportunities
• Integration challenges with existing HubSpot setup (technical deep-dive in call 2)

DECISION-MAKING DYNAMICS:
• Sarah Johnson: Primary decision maker with full budget authority (confirmed call 3)
• Mike Chen (Sales Ops): Technical influencer, concerned about integration complexity
• Lisa Rodriguez (Marketing): Collaborative stakeholder, focused on lead handoff process
• No additional stakeholders required for approval (major advantage)

COMPETITIVE LANDSCAPE:
• Evaluating 3 total vendors (us + 2 competitors)
• Price sensitivity: Budget approved but cost-conscious due to startup mentality
• Differentiation opportunity: Real-time scoring + seamless HubSpot integration

BUYING SIGNALS & MOMENTUM:
• Budget pre-approved for £50K annually (revealed in call 2)
• Urgent timeline: Decision required by end of Q1 for Q2 implementation
• Technical demo scheduled and completed successfully (call 3)
• ROI analysis requested and delivered (call 4)
• Strong positive sentiment throughout all interactions

NEXT STEPS & STRATEGY:
• Pilot program proposal for 2 team members (recommended approach from call 4)
• Final pricing discussion scheduled
• Implementation timeline: 6-week rollout plan prepared
• Success metrics defined: 70% reduction in manual qualification time`,

      follow_up_email: `Subject: Acme Corp Implementation Roadmap - Ready to Transform Your Sales Process

Hi Sarah,

Thank you for the productive conversation yesterday. After four comprehensive discussions with you, Mike, and Lisa, I'm excited to present our tailored implementation roadmap for Acme Corp.

WHAT WE'VE LEARNED TOGETHER:
Over our conversations, you've shared that your 8-person sales team is spending 40% of their time on manual tasks instead of selling. This translates to roughly £120K annually in lost productivity - a challenge we're uniquely positioned to solve.

PERSONALIZED SOLUTION APPROACH:
Based on your preference for visual data (noted in our first call), I've prepared comprehensive ROI dashboards that show real-time impact metrics. For Mike's technical requirements, we've designed a seamless HubSpot integration that requires zero disruption to current workflows. And for Lisa's collaboration needs, our solution includes automated lead handoff protocols that align sales and marketing perfectly.

CUMULATIVE VALUE PROPOSITION:
• 70% reduction in manual qualification time (saving 10.5 hours weekly per rep)
• Real-time lead scoring preventing the 30% leakage you mentioned
• £84K annual productivity savings based on your team size
• 6-month ROI timeline with measurable KPIs

PROVEN TRACK RECORD:
Since our first conversation, I've compiled case studies from similar companies:
• TechCorp (8-person team): 60% efficiency gain in 4 months
• GrowthCo (similar HubSpot setup): 40% increase in qualified leads
• ScaleUp Ltd: 300% ROI within 6 months

NEXT STEPS - PILOT PROGRAM:
As discussed, I recommend starting with a 2-person pilot:
• Week 1-2: Setup and integration (Mike's team involved throughout)
• Week 3-4: Training and optimization
• Week 5-6: Full team rollout based on pilot results

INVESTMENT & TIMELINE:
• Pilot investment: £2,500 monthly for 2 users
• Full team: £15,000 annually (well within your £50K budget)
• Implementation: 6 weeks to full deployment
• ROI realization: Month 3 based on similar deployments

I'm attaching the detailed implementation timeline, ROI calculator with your specific metrics, and technical integration guide for Mike's review.

Would you prefer a brief call to finalize the pilot details, or shall we proceed with the proposal documentation for your Q1 decision timeline?

Looking forward to helping Acme Corp achieve the 70% efficiency gains we've discussed.

Best regards,
[Your Name]

P.S. The HubSpot integration demo video I mentioned is ready - happy to share the private link when convenient.`,

      deck_prompt: `# Comprehensive Sales Presentation: Acme Corp Transformation Strategy

## Presentation Context
**Audience**: Sarah Johnson (VP Sales), Mike Chen (Sales Ops), Lisa Rodriguez (Marketing)
**Objective**: Secure pilot program approval and advance to full implementation
**Methodology**: Consultative selling with cumulative insight integration
**Data Sources**: 4 progressive calls + HubSpot analysis + competitive research

## Slide Structure & Strategic Narrative

### Slide 1: Executive Summary - The Acme Corp Opportunity
**Visual Focus**: Bold ROI dashboard showing £84K annual savings
- Headline: "Transforming Acme Corp's Sales Efficiency: From 40% Admin Time to 70% Selling Time"
- Key Metric Callout: "£120K Annual Productivity Loss → £84K Annual Savings"
- Cumulative Insight: "Based on 4 comprehensive discovery sessions with your team"
- Visual Element: Before/after productivity comparison chart

### Slide 2: The Cumulative Challenge (Insights from 4 Calls)
**Strategic Positioning**: Demonstrate deep understanding through progressive discovery
- Current State Analysis:
  • 8 sales reps × 15 hours weekly = 120 hours lost to manual processes
  • 30% lead leakage due to delayed response (quantified in call 2)
  • HubSpot underutilization creating data silos (technical review with Mike)
  • Sales-Marketing misalignment affecting lead quality (Lisa's concern from call 3)
- Visual: Process flow diagram showing current inefficiencies with time/cost annotations

### Slide 3: Decision-Making Dynamics & Stakeholder Alignment
**Personalization Strategy**: Address each stakeholder's specific concerns
- Sarah's Strategic Vision: "Scaling sales operations for aggressive growth targets"
- Mike's Technical Requirements: "Seamless integration without workflow disruption"  
- Lisa's Collaboration Goals: "Improved lead handoff and attribution tracking"
- Competitive Advantage: "Single solution addressing all three priorities"
- Visual: Stakeholder influence map with solution alignment

### Slide 4: Cumulative ROI Analysis (Data-Driven Approach)
**Sarah's Visual Learning Preference**: Interactive ROI calculator
- Time Savings Calculation:
  • Current: 120 hours weekly × £50/hour = £6,000 weekly cost
  • Post-Implementation: 36 hours weekly × £50/hour = £1,800 weekly cost
  • Net Savings: £4,200 weekly = £218,400 annually
- Investment vs. Return:
  • Annual Investment: £15,000 (full team)
  • Net Annual Benefit: £203,400
  • ROI: 1,356% in first year
- Visual: Interactive dashboard with adjustable parameters

### Slide 5: Technical Integration Roadmap (Mike's Requirements)
**Kinesthetic Learning Approach**: Hands-on implementation plan
- Phase 1 (Weeks 1-2): HubSpot API integration and data mapping
- Phase 2 (Weeks 3-4): Pilot program with 2 team members
- Phase 3 (Weeks 5-6): Full team deployment and optimization
- Technical Specifications:
  • Real-time data synchronization
  • Zero downtime implementation
  • Existing workflow preservation
- Visual: Technical architecture diagram with integration points

### Slide 6: Pilot Program Strategy (Risk Mitigation)
**Conservative Approach**: Address startup mentality and risk concerns
- Pilot Scope: 2 team members for 6 weeks
- Success Metrics:
  • 50% reduction in qualification time
  • 25% increase in lead response speed
  • 90% user adoption rate
- Investment: £2,500 monthly during pilot
- Go/No-Go Decision: Based on measurable KPIs
- Visual: Pilot timeline with success milestones

### Slide 7: Competitive Differentiation Matrix
**Strategic Positioning**: Address 3-vendor evaluation process
- Vendor Comparison Framework:
  • Integration Complexity: Us (Seamless) vs. Competitors (Complex)
  • Implementation Time: Us (6 weeks) vs. Competitors (3-6 months)
  • HubSpot Compatibility: Us (Native) vs. Competitors (Third-party)
  • Support Model: Us (Dedicated) vs. Competitors (Shared)
- Visual: Comparison matrix with clear advantage indicators

### Slide 8: Success Stories & Social Proof
**Credibility Building**: Relevant case studies from similar companies
- TechCorp Case Study:
  • Similar Profile: 8-person sales team, HubSpot users
  • Results: 60% efficiency gain, 4-month ROI
  • Testimonial: "Game-changing automation without disruption"
- GrowthCo Implementation:
  • Challenge: Lead leakage and response delays
  • Solution: Real-time scoring and automated workflows
  • Outcome: 40% increase in qualified leads
- Visual: Customer logos with key metrics and quotes

### Slide 9: Implementation Timeline & Milestones
**Project Management Focus**: Clear path forward with accountability
- Week 1: Technical setup and HubSpot integration
- Week 2: Pilot user training and initial configuration
- Week 3-4: Pilot execution with daily monitoring
- Week 5: Results analysis and optimization
- Week 6: Full team rollout decision and planning
- Success Checkpoints: Weekly reviews with measurable KPIs
- Visual: Gantt chart with milestone markers and success criteria

### Slide 10: Investment Summary & Next Steps
**Clear Call to Action**: Simplified decision framework
- Pilot Investment: £2,500 monthly (2 users, 6 weeks)
- Full Implementation: £15,000 annually (8 users)
- Expected ROI: 1,356% first year based on productivity gains
- Decision Timeline: Pilot approval by end of Q1 for Q2 implementation
- Immediate Next Steps:
  1. Pilot agreement and user selection
  2. Technical requirements finalization with Mike
  3. Success metrics definition with Sarah and Lisa
- Visual: Investment vs. return comparison with timeline

## Presentation Delivery Notes
- **Opening**: Reference specific insights from all 4 previous calls
- **Transitions**: Use cumulative learning to bridge between sections
- **Interaction**: Include Mike in technical discussions, engage Lisa on process improvements
- **Closing**: Emphasize partnership approach and long-term value creation
- **Follow-up**: Provide detailed pilot proposal within 24 hours

## Gamma-Specific Instructions
- Use professional template with Acme Corp brand colors if available
- Ensure all charts are interactive and data-driven
- Include speaker notes with specific talking points from each call
- Add smooth transitions emphasizing cumulative insight development
- Optimize for both live presentation and leave-behind reference document`,

      reviewInsights: [
        {
          id: 'cumulative_1',
          type: 'prospect_mention',
          content: 'Cumulative Analysis: Acme Corp has consistently mentioned budget approval across 3 calls, with final confirmation of £50K annual budget in call 4. This represents strong buying intent and removes a major qualification barrier.',
          relevance_score: 98,
          is_selected: true,
          source: 'Cumulative AI Analysis',
          timestamp: 'Calls 1-4'
        },
        {
          id: 'cumulative_2',
          type: 'sales_signal',
          content: 'Progressive Buying Signals: Sentiment analysis across 4 calls shows increasing positive sentiment (Call 1: 72% → Call 4: 91%). Key phrases evolved from "exploring options" to "ready to implement" indicating strong purchase intent.',
          relevance_score: 96,
          is_selected: true,
          source: 'Sentiment Tracking',
          timestamp: 'Progressive Analysis'
        },
        {
          id: 'cumulative_3',
          type: 'communication_style',
          content: 'Sarah Johnson Communication Profile: Consistently demonstrates visual learning preference across all interactions. Responds positively to charts, ROI dashboards, and data visualizations. Recommend maintaining visual-heavy approach in all future communications.',
          relevance_score: 94,
          is_selected: true,
          source: 'Communication Analysis',
          timestamp: 'Behavioral Pattern'
        },
        {
          id: 'cumulative_4',
          type: 'opportunity',
          content: 'Competitive Advantage Identified: Through progressive discovery, we\'ve learned that 2 competing vendors require 3-6 month implementations vs. our 6-week timeline. This speed advantage has become increasingly important to their Q2 deadline.',
          relevance_score: 92,
          is_selected: true,
          source: 'Competitive Intelligence',
          timestamp: 'Strategic Analysis'
        },
        {
          id: 'cumulative_5',
          type: 'agreed_action',
          content: 'Cumulative Commitment Tracking: Pilot program approach agreed upon in call 4, building on technical requirements from call 2 and stakeholder alignment from call 3. All parties aligned on 2-person pilot starting with Sarah\'s top performers.',
          relevance_score: 90,
          is_selected: true,
          source: 'Commitment Tracking',
          timestamp: 'Call 4 Agreement'
        }
      ],

      callAnalysisData: {
        specific_user: 'Sarah Johnson (VP Sales)',
        sentiment_score: 0.91,
        action_items: [
          {
            task: 'Finalize pilot program agreement with 2-person team selection',
            owner: 'Sarah Johnson',
            deadline: '2024-01-20'
          },
          {
            task: 'Complete technical integration requirements review',
            owner: 'Mike Chen',
            deadline: '2024-01-18'
          },
          {
            task: 'Prepare detailed ROI calculator with Acme-specific metrics',
            owner: 'Sales Rep',
            deadline: '2024-01-17'
          }
        ],
        communication_styles: [
          {
            role_name: 'Sarah Johnson',
            style: 'Visual',
            evidence: 'Consistently requests charts, dashboards, and visual data across all 4 calls'
          },
          {
            role_name: 'Mike Chen',
            style: 'Kinesthetic',
            evidence: 'Prefers hands-on technical demos and detailed implementation plans'
          }
        ],
        key_points: [
          'Budget approved for £50K annually with Q2 implementation timeline',
          'Technical requirements clearly defined through progressive discovery',
          'Pilot program approach reduces risk and accelerates decision-making',
          'Strong competitive positioning due to integration speed and HubSpot compatibility'
        ]
      }
    }
  }
};

const CallInsights = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [insights, setInsights] = useState(null);
  const [pushStatuses, setPushStatuses] = useState({});
  const [selectedCall, setSelectedCall] = useState(null);
  const [callSource, setCallSource] = useState('');

  useEffect(() => {
    // Get call data from navigation state
    if (location.state?.selectedCall) {
      setSelectedCall(location.state.selectedCall);
      setCallSource(location.state.source || 'unknown');
      
      // Check if we should show existing insights or process new ones
      if (location.state.viewMode === 'insights') {
        // Show existing insights for processed calls
        loadExistingInsights(location.state.selectedCall);
      } else {
        // Process new insights
        processCallInsights(location.state.selectedCall);
      }
    }
  }, [location.state]);

  const loadExistingInsights = (call) => {
    // Load cumulative insights for this prospect/company
    const companyInsights = mockCumulativeInsights[call.companyName];
    
    if (companyInsights) {
      setInsights(companyInsights.cumulativeInsights);
      toast.success('Cumulative insights loaded successfully');
    } else {
      toast.error('No insights found for this prospect');
    }
  };

  const processCallInsights = async (call) => {
    setIsProcessing(true);
    setProcessingProgress(0);

    try {
      // Simulate processing with progress updates
      const progressInterval = setInterval(() => {
        setProcessingProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      // Check if we have cumulative insights for this company
      const companyInsights = mockCumulativeInsights[call.companyName];
      
      if (companyInsights) {
        // Use cumulative insights
        await new Promise(resolve => setTimeout(resolve, 3000));
        clearInterval(progressInterval);
        setProcessingProgress(100);
        
        setInsights(companyInsights.cumulativeInsights);
        toast.success(`Cumulative insights loaded from ${companyInsights.totalCalls} previous calls`);
      } else {
        // Process new insights (for new prospects)
        await new Promise(resolve => setTimeout(resolve, 3000));
        clearInterval(progressInterval);
        setProcessingProgress(100);
        
        // Generate basic insights for new prospects
        const newInsights = {
          call_summary: `Initial Call Analysis - ${call.companyName}

This is the first interaction with ${call.prospectName} at ${call.companyName}. Based on the call transcript, we've identified initial pain points and opportunities for follow-up.

Key discussion points and next steps will be tracked as we build a cumulative understanding of this prospect's needs and decision-making process.`,
          
          follow_up_email: `Subject: Thank you for the productive conversation

Hi ${call.prospectName},

Thank you for taking the time to speak with me today about ${call.companyName}'s needs. I found our conversation very insightful and I'm excited about the potential to help your team.

Based on our discussion, I'll prepare some additional information that addresses the specific challenges you mentioned. I'll follow up within the next few days with relevant case studies and next steps.

Looking forward to continuing our conversation.

Best regards,
[Your Name]`,
          
          deck_prompt: `Create a presentation for ${call.companyName} focusing on their specific needs discussed in the call. Include relevant case studies and a clear value proposition tailored to their industry and company size.`,
          
          reviewInsights: [
            {
              id: 'new_1',
              type: 'prospect_mention',
              content: `First interaction with ${call.prospectName} at ${call.companyName}. Initial discovery call to understand their current challenges and potential fit for our solution.`,
              relevance_score: 85,
              is_selected: true,
              source: 'AI Analysis',
              timestamp: 'Initial Call'
            }
          ],
          
          callAnalysisData: {
            specific_user: call.prospectName,
            sentiment_score: 0.75,
            action_items: [
              {
                task: 'Send follow-up email with relevant case studies',
                owner: 'Sales Rep',
                deadline: '2024-01-18'
              }
            ],
            communication_styles: [],
            key_points: [
              'Initial discovery call completed',
              'Basic qualification and needs assessment conducted',
              'Follow-up scheduled to continue conversation'
            ]
          }
        };
        
        setInsights(newInsights);
        toast.success('Initial insights generated - cumulative analysis will improve with additional calls');
      }
    } catch (error) {
      console.error('Error processing insights:', error);
      toast.error('Failed to process call insights');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditInsight = async (type, content) => {
    // Update insights locally
    setInsights(prev => ({
      ...prev,
      [type]: content
    }));
    toast.success(`${type.replace('_', ' ')} updated successfully`);
  };

  const handlePushToHubSpot = async (type, content) => {
    setPushStatuses(prev => ({ ...prev, [type]: 'pending' }));
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setPushStatuses(prev => ({ ...prev, [type]: 'success' }));
      toast.success(`${type} pushed to HubSpot successfully!`);
    } catch (error) {
      setPushStatuses(prev => ({ ...prev, [type]: 'error' }));
      toast.error(`Failed to push ${type} to HubSpot`);
    }
  };

  const handleBackToSalesCalls = () => {
    navigate('/calls');
  };

  if (!selectedCall) {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="text-center py-12">
          <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h2 className="text-xl font-semibold mb-2">No Call Selected</h2>
          <p className="text-muted-foreground mb-4">
            Please select a call from the Sales Calls page to view insights.
          </p>
          <Button onClick={handleBackToSalesCalls}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Go to Sales Calls
          </Button>
        </div>
      </div>
    );
  }

  // Get company insights data for display
  const companyInsights = mockCumulativeInsights[selectedCall.companyName];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={handleBackToSalesCalls}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Sales Calls
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Call Insights</h1>
            <p className="text-muted-foreground">
              AI-driven prospect understanding and cumulative insights
            </p>
          </div>
        </div>
        
        {companyInsights && (
          <div className="flex items-center space-x-2">
            <Badge variant="default" className="bg-blue-100 text-blue-800 border-blue-200">
              <Database className="w-3 h-3 mr-1" />
              {companyInsights.totalCalls} Calls Analyzed
            </Badge>
            <Badge variant="outline">
              <Layers className="w-3 h-3 mr-1" />
              Cumulative Insights
            </Badge>
          </div>
        )}
      </div>

      {/* Call Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Call Information</span>
            </div>
            <Badge variant={callSource === 'fireflies' ? 'default' : 'secondary'}>
              {callSource === 'fireflies' ? 'Fireflies.ai' : callSource === 'upload' ? 'Uploaded' : 'Processed'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Building className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Company:</span>
                <span className="font-medium">{selectedCall.companyName}</span>
              </div>
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Prospect:</span>
                <span className="font-medium">{selectedCall.prospectName}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Date:</span>
                <span className="font-medium">{selectedCall.date}</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Duration:</span>
                <span className="font-medium">{selectedCall.duration}</span>
              </div>
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Call ID:</span>
                <span className="font-medium">{selectedCall.callId}</span>
              </div>
              {companyInsights && (
                <div className="flex items-center space-x-2">
                  <BarChart3 className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Total Interactions:</span>
                  <span className="font-medium">{companyInsights.totalCalls} calls</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Sources Indicator */}
      {companyInsights && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-blue-800">
              <Layers className="w-5 h-5" />
              <span>Cumulative Data Sources</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                <ExternalLink className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-700">Fireflies Calls:</span>
                <Badge variant="default" className="bg-blue-100 text-blue-800">
                  {companyInsights.dataSources.fireflies}
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-700">HubSpot Data:</span>
                <Badge variant="default" className="bg-blue-100 text-blue-800">
                  {companyInsights.dataSources.hubspot}
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <Presentation className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-700">Presentations:</span>
                <Badge variant="default" className="bg-blue-100 text-blue-800">
                  {companyInsights.dataSources.presentations}
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-700">Email Threads:</span>
                <Badge variant="default" className="bg-blue-100 text-blue-800">
                  {companyInsights.dataSources.emails}
                </Badge>
              </div>
            </div>
            <p className="text-sm text-blue-700 mt-3">
              These insights represent an amalgamation of data from all interactions with {selectedCall.companyName}, 
              providing a comprehensive and evolving understanding of the prospect relationship.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Processing Status */}
      {isProcessing && (
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                <div>
                  <h3 className="text-lg font-semibold">
                    {companyInsights ? 'Loading Cumulative Insights...' : 'Generating Initial Insights...'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {companyInsights 
                      ? `Analyzing data from ${companyInsights.totalCalls} previous calls with ${selectedCall.companyName}`
                      : 'Processing your first call with this prospect'
                    }
                  </p>
                </div>
              </div>
              <Progress value={processingProgress} className="w-full" />
              <p className="text-sm text-muted-foreground">
                {processingProgress < 30 ? 'Analyzing transcript content...' : 
                 processingProgress < 60 ? 'Generating insights...' : 
                 processingProgress < 90 ? 'Building cumulative analysis...' : 
                 'Finalizing results...'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights Display */}
      {insights && !isProcessing && (
        <div className="space-y-6">
          {/* Cumulative Insights Header */}
          {companyInsights && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Zap className="w-5 h-5 text-green-600" />
                  <div>
                    <h3 className="font-semibold text-green-800">Cumulative Intelligence Active</h3>
                    <p className="text-sm text-green-700">
                      These insights build upon {companyInsights.totalCalls} previous interactions with {selectedCall.companyName}, 
                      providing deep prospect understanding and strategic context.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Insights Viewer */}
          <CallInsightsViewer
            insights={insights}
            callNotesId={selectedCall.id}
            userId={CURRENT_USER.id}
            onNavigateBack={handleBackToSalesCalls}
            onEditInsight={handleEditInsight}
            onPushToHubSpot={handlePushToHubSpot}
            pushStatuses={pushStatuses}
            showBackButton={false}
            isEditable={true}
            title="Cumulative Prospect Insights"
            isProcessingHistory={false}
          />
        </div>
      )}
    </div>
  );
};

export default CallInsights;
export { CallInsights };