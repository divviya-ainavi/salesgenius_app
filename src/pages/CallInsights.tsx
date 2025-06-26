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
import { CallInsightsViewer } from "@/components/followups/CallInsightsViewer";
import { ProspectSelector } from "@/components/shared/ProspectSelector";
import {
  Sparkles,
  Search,
  Filter,
  Calendar,
  Clock,
  Building,
  User,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  ArrowRight,
  ExternalLink,
  MessageSquare,
  Mail,
  Presentation,
  CheckSquare,
  BarChart3,
  TrendingUp,
  Target,
  Zap,
  Phone,
  Download,
  Copy,
  Edit,
  Save,
  X,
  Eye,
  EyeOff,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { dbHelpers, CURRENT_USER } from "@/lib/supabase";
import { usePageTimer } from "@/hooks/usePageTimer";

// Mock data for demonstration
const mockInsightsData = [
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
    call_summary:
      "Discussed Q2 implementation timeline and budget allocation. Key stakeholders identified: Sarah (VP Sales), Mike (Sales Ops), Lisa (Marketing). Next steps: Technical demo scheduled for next week.",
    company_details: {
      name: "Acme Corp",
      industry: "Technology",
      size: "Enterprise",
      revenue: "$500M+",
      challenges: [
        "Legacy system integration",
        "Sales team efficiency",
        "Data silos",
      ],
    },
    prospect_details: [
      {
        name: "Sarah Johnson",
        title: "VP of Sales",
        influence: "Decision Maker",
        communication_style: "Direct",
        pain_points: ["Team productivity", "Reporting accuracy"],
      },
      {
        name: "Mike Chen",
        title: "Sales Operations Manager",
        influence: "Technical Evaluator",
        communication_style: "Analytical",
        pain_points: ["Process automation", "Data integration"],
      },
    ],
    action_items: [
      {
        task: "Send product demo video by Friday",
        owner: "Sales Team",
        deadline: "2024-01-19",
        priority: "high",
      },
      {
        task: "Schedule technical deep-dive with Mike's team",
        owner: "Technical Team",
        deadline: "2024-01-22",
        priority: "medium",
      },
      {
        task: "Prepare custom pricing proposal for Q2 implementation",
        owner: "Sales Team",
        deadline: "2024-01-25",
        priority: "high",
      },
    ],
    sales_insights: [
      {
        type: "pain_point",
        content:
          "Current sales process requires manual data entry across multiple systems",
        relevance: 90,
      },
      {
        type: "objection",
        content: "Concerned about implementation timeline and team adoption",
        relevance: 85,
      },
      {
        type: "buying_signal",
        content: "Mentioned Q2 budget allocation for sales technology",
        relevance: 95,
      },
      {
        type: "competitive_intel",
        content: "Currently evaluating Competitor X but unhappy with support",
        relevance: 80,
      },
    ],
    communication_styles: [
      {
        person: "Sarah Johnson",
        style: "Direct and results-oriented",
        preferences: "Values ROI and business impact",
      },
      {
        person: "Mike Chen",
        style: "Analytical and detail-focused",
        preferences: "Needs technical validation and proof points",
      },
    ],
    follow_up_email:
      "Hi Sarah,\n\nThank you for the productive discussion today about Acme Corp's sales automation needs. I appreciate you and Mike sharing insights into your current challenges with manual data entry and cross-system integration.\n\nAs promised, I've attached the product demo video that highlights how our solution addresses your specific pain points. I've also included case studies from similar enterprise technology companies that have achieved 30%+ efficiency gains after implementation.\n\nI'll reach out to Mike separately to schedule the technical deep-dive session for his team next week. In the meantime, I'll work on preparing the custom pricing proposal for your Q2 implementation timeline.\n\nPlease let me know if you have any questions or need additional information.\n\nBest regards,\n[Your Name]",
    deck_prompt:
      "# Acme Corp Sales Presentation\n\n## Slide 1: Introduction\n- Title: Transforming Sales Operations at Acme Corp\n- Subtitle: Driving Efficiency, Visibility, and Growth\n- Include: Acme Corp logo and our company logo\n\n## Slide 2: Understanding Your Challenges\n- Legacy system integration challenges\n- Manual data entry across multiple systems\n- Limited visibility into sales pipeline\n- Team adoption concerns\n\n## Slide 3: Solution Overview\n- Unified sales platform with seamless integrations\n- Automated data capture and entry\n- Real-time analytics and reporting\n- Intuitive user experience for rapid adoption\n\n## Slide 4: ROI Projection\n- 30% reduction in administrative tasks\n- 25% improvement in data accuracy\n- 15% increase in sales velocity\n- 3-month implementation timeline\n\n## Slide 5: Implementation Approach\n- Phased rollout strategy\n- Dedicated implementation team\n- Comprehensive training program\n- Ongoing support and optimization\n\n## Slide 6: Next Steps\n- Technical deep-dive session\n- Custom pricing proposal\n- Q2 implementation timeline\n- Decision milestones",
    reviewInsights: [
      {
        id: "insight-1",
        type: "pain_point",
        content:
          "Current sales process requires manual data entry across multiple systems",
        relevance: 90,
        isSelected: true,
      },
      {
        id: "insight-2",
        type: "objection",
        content: "Concerned about implementation timeline and team adoption",
        relevance: 85,
        isSelected: true,
      },
      {
        id: "insight-3",
        type: "buying_signal",
        content: "Mentioned Q2 budget allocation for sales technology",
        relevance: 95,
        isSelected: true,
      },
      {
        id: "insight-4",
        type: "competitive_intel",
        content: "Currently evaluating Competitor X but unhappy with support",
        relevance: 80,
        isSelected: true,
      },
    ],
    callAnalysisData: {
      company_details: {
        name: "Acme Corp",
        industry: "Technology",
        size: "Enterprise",
        revenue: "$500M+",
        challenges: [
          "Legacy system integration",
          "Sales team efficiency",
          "Data silos",
        ],
      },
      prospect_details: [
        {
          name: "Sarah Johnson",
          title: "VP of Sales",
          influence: "Decision Maker",
          communication_style: "Direct",
          pain_points: ["Team productivity", "Reporting accuracy"],
        },
        {
          name: "Mike Chen",
          title: "Sales Operations Manager",
          influence: "Technical Evaluator",
          communication_style: "Analytical",
          pain_points: ["Process automation", "Data integration"],
        },
      ],
      action_items: [
        {
          task: "Send product demo video by Friday",
          owner: "Sales Team",
          deadline: "2024-01-19",
          priority: "high",
        },
        {
          task: "Schedule technical deep-dive with Mike's team",
          owner: "Technical Team",
          deadline: "2024-01-22",
          priority: "medium",
        },
        {
          task: "Prepare custom pricing proposal for Q2 implementation",
          owner: "Sales Team",
          deadline: "2024-01-25",
          priority: "high",
        },
      ],
      sales_insights: [
        {
          type: "pain_point",
          content:
            "Current sales process requires manual data entry across multiple systems",
          relevance: 90,
        },
        {
          type: "objection",
          content: "Concerned about implementation timeline and team adoption",
          relevance: 85,
        },
        {
          type: "buying_signal",
          content: "Mentioned Q2 budget allocation for sales technology",
          relevance: 95,
        },
        {
          type: "competitive_intel",
          content: "Currently evaluating Competitor X but unhappy with support",
          relevance: 80,
        },
      ],
      communication_styles: [
        {
          person: "Sarah Johnson",
          style: "Direct and results-oriented",
          preferences: "Values ROI and business impact",
        },
        {
          person: "Mike Chen",
          style: "Analytical and detail-focused",
          preferences: "Needs technical validation and proof points",
        },
      ],
    },
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
    call_summary:
      "Initial discovery call with startup CEO. Discussed scaling challenges and integration requirements. Budget constraints noted. Follow-up: Send startup-specific pricing proposal.",
    company_details: {
      name: "TechStart Inc",
      industry: "SaaS",
      size: "Startup (25 employees)",
      revenue: "$2-5M",
      challenges: ["Scaling operations", "Limited budget", "Fast growth"],
    },
    prospect_details: [
      {
        name: "John Smith",
        title: "CEO",
        influence: "Decision Maker",
        communication_style: "Visionary",
        pain_points: ["Time management", "Resource allocation"],
      },
      {
        name: "Emma Wilson",
        title: "CTO",
        influence: "Technical Decision Maker",
        communication_style: "Technical",
        pain_points: ["Integration complexity", "Technical debt"],
      },
    ],
    action_items: [
      {
        task: "Send startup-friendly pricing options",
        owner: "Sales Team",
        deadline: "2024-01-18",
        priority: "high",
      },
      {
        task: "Schedule technical demo with Emma",
        owner: "Technical Team",
        deadline: "2024-01-20",
        priority: "medium",
      },
    ],
    sales_insights: [
      {
        type: "pain_point",
        content: "Struggling with scaling sales operations as they grow",
        relevance: 95,
      },
      {
        type: "objection",
        content: "Limited budget for enterprise solutions",
        relevance: 90,
      },
      {
        type: "buying_signal",
        content: "Looking to implement solution before next funding round",
        relevance: 85,
      },
    ],
    communication_styles: [
      {
        person: "John Smith",
        style: "Big picture thinker",
        preferences: "Values vision and growth potential",
      },
      {
        person: "Emma Wilson",
        style: "Detail-oriented and technical",
        preferences: "Needs technical specifications and integration details",
      },
    ],
    follow_up_email:
      "Hi John,\n\nThank you for taking the time to discuss TechStart's sales automation needs. I understand that as a growing startup, you're looking for a solution that can scale with your business while being mindful of budget constraints.\n\nAs promised, I've attached our startup-friendly pricing options that include flexible payment terms and a growth-scaled approach. I've also included a technical overview for Emma to review the integration capabilities.\n\nI'd like to schedule a technical demo with Emma next week to dive deeper into the implementation details. Please let me know what times work best for your team.\n\nLooking forward to helping TechStart streamline your sales operations as you prepare for your next funding round.\n\nBest regards,\n[Your Name]",
    deck_prompt:
      "# TechStart Inc Growth Solution\n\n## Slide 1: Introduction\n- Title: Scaling Sales Operations for TechStart's Growth Journey\n- Subtitle: Flexible, Scalable, Budget-Conscious Solutions\n- Include: TechStart logo and our company logo\n\n## Slide 2: Startup Challenges\n- Rapid growth requiring scalable systems\n- Limited resources and budget constraints\n- Need for quick implementation before funding round\n- Integration with existing tech stack\n\n## Slide 3: Tailored Solution\n- Modular approach - start small, scale as you grow\n- API-first architecture for seamless integration\n- Self-service implementation options\n- Pay-as-you-grow pricing model\n\n## Slide 4: Growth ROI\n- 40% reduction in manual sales tasks\n- 50% improvement in pipeline visibility\n- 20% faster sales cycle\n- Positive impact on investor metrics\n\n## Slide 5: Startup Success Stories\n- Case study: Similar SaaS startup growth\n- Testimonials from founders\n- Growth metrics before/after implementation\n\n## Slide 6: Next Steps\n- Technical demo with Emma's team\n- Flexible implementation timeline\n- Startup-friendly payment terms\n- 30-day free trial option",
    reviewInsights: [
      {
        id: "insight-5",
        type: "pain_point",
        content: "Struggling with scaling sales operations as they grow",
        relevance: 95,
        isSelected: true,
      },
      {
        id: "insight-6",
        type: "objection",
        content: "Limited budget for enterprise solutions",
        relevance: 90,
        isSelected: true,
      },
      {
        id: "insight-7",
        type: "buying_signal",
        content: "Looking to implement solution before next funding round",
        relevance: 85,
        isSelected: true,
      },
    ],
    callAnalysisData: {
      company_details: {
        name: "TechStart Inc",
        industry: "SaaS",
        size: "Startup (25 employees)",
        revenue: "$2-5M",
        challenges: ["Scaling operations", "Limited budget", "Fast growth"],
      },
      prospect_details: [
        {
          name: "John Smith",
          title: "CEO",
          influence: "Decision Maker",
          communication_style: "Visionary",
          pain_points: ["Time management", "Resource allocation"],
        },
        {
          name: "Emma Wilson",
          title: "CTO",
          influence: "Technical Decision Maker",
          communication_style: "Technical",
          pain_points: ["Integration complexity", "Technical debt"],
        },
      ],
      action_items: [
        {
          task: "Send startup-friendly pricing options",
          owner: "Sales Team",
          deadline: "2024-01-18",
          priority: "high",
        },
        {
          task: "Schedule technical demo with Emma",
          owner: "Technical Team",
          deadline: "2024-01-20",
          priority: "medium",
        },
      ],
      sales_insights: [
        {
          type: "pain_point",
          content: "Struggling with scaling sales operations as they grow",
          relevance: 95,
        },
        {
          type: "objection",
          content: "Limited budget for enterprise solutions",
          relevance: 90,
        },
        {
          type: "buying_signal",
          content: "Looking to implement solution before next funding round",
          relevance: 85,
        },
      ],
      communication_styles: [
        {
          person: "John Smith",
          style: "Big picture thinker",
          preferences: "Values vision and growth potential",
        },
        {
          person: "Emma Wilson",
          style: "Detail-oriented and technical",
          preferences: "Needs technical specifications and integration details",
        },
      ],
    },
  },
];

export const CallInsights = () => {
  // Track time spent on Call Insights page
  usePageTimer('Call Insights');

  const [insights, setInsights] = useState([]);
  const [selectedInsight, setSelectedInsight] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [pushStatuses, setPushStatuses] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [editType, setEditType] = useState("");
  const [selectedProspect, setSelectedProspect] = useState(null);

  // Use current authenticated user
  const userId = CURRENT_USER.id;

  // Load insights on component mount
  useEffect(() => {
    const loadInsights = async () => {
      if (!userId) {
        console.log("No user ID available, skipping insights load");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // In a real implementation, you would fetch from your database
        // const data = await dbHelpers.getUserCallInsights(userId);
        
        // For now, use mock data
        setInsights(mockInsightsData);
        
        if (mockInsightsData.length > 0) {
          setSelectedInsight(mockInsightsData[0]);
          setSelectedProspect({
            id: mockInsightsData[0].id,
            companyName: mockInsightsData[0].company_details.name,
            prospectName: mockInsightsData[0].prospect_details[0]?.name || "Unknown",
            title: mockInsightsData[0].prospect_details[0]?.title || "Unknown",
            prospect_details: mockInsightsData[0].prospect_details,
            status: "hot",
            dealValue: "$120K",
            probability: 85,
            nextAction: "Technical demo",
            stakeholders: mockInsightsData[0].prospect_details.map(p => ({
              name: p.name,
              role: p.title,
              style: p.communication_style,
            })),
          });
        }
      } catch (error) {
        console.error("Error loading insights:", error);
        toast.error("Failed to load call insights");
      } finally {
        setIsLoading(false);
      }
    };

    loadInsights();
  }, [userId]);

  // Filter insights based on search and filters
  const filteredInsights = insights.filter((insight) => {
    const matchesSearch =
      insight.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      insight.prospectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      insight.callId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDate =
      dateFilter === "all" ||
      (dateFilter === "today" &&
        new Date(insight.date).toDateString() === new Date().toDateString()) ||
      (dateFilter === "week" &&
        new Date(insight.date) >
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) ||
      (dateFilter === "month" &&
        new Date(insight.date) >
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

    const matchesStatus =
      statusFilter === "all" || insight.status === statusFilter;

    return matchesSearch && matchesDate && matchesStatus;
  });

  const handleSelectInsight = (insight) => {
    setSelectedInsight(insight);
    setSelectedProspect({
      id: insight.id,
      companyName: insight.company_details.name,
      prospectName: insight.prospect_details[0]?.name || "Unknown",
      title: insight.prospect_details[0]?.title || "Unknown",
      prospect_details: insight.prospect_details,
      status: "hot",
      dealValue: "$120K",
      probability: 85,
      nextAction: "Technical demo",
      stakeholders: insight.prospect_details.map(p => ({
        name: p.name,
        role: p.title,
        style: p.communication_style,
      })),
    });
  };

  const handleEditInsight = (type, content) => {
    setIsEditing(true);
    setEditType(type);
    setEditedContent(content);
  };

  const handleSaveEdit = () => {
    // In a real implementation, you would save to your database
    setSelectedInsight((prev) => ({
      ...prev,
      [editType]: editedContent,
    }));
    setIsEditing(false);
    setEditType("");
    setEditedContent("");
    toast.success(`${editType.replace("_", " ")} updated successfully`);
  };

  const handlePushToHubSpot = (type, content) => {
    setPushStatuses((prev) => ({
      ...prev,
      [type]: "pending",
    }));

    // Simulate API call
    setTimeout(() => {
      setPushStatuses((prev) => ({
        ...prev,
        [type]: "success",
      }));
      toast.success(`${type.replace("_", " ")} pushed to HubSpot successfully`);
    }, 1500);
  };

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
            Call Insights
          </h1>
          <p className="text-muted-foreground">
            AI-generated insights and analysis from your sales calls
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search insights..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>

          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>

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

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Sidebar - Insights List */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Call Insights</span>
                <Badge variant="outline" className="text-xs">
                  {filteredInsights.length} calls
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                  <p className="text-muted-foreground">Loading insights...</p>
                </div>
              ) : filteredInsights.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-2">No insights found</p>
                  <p className="text-sm">
                    Upload call transcripts to generate AI insights
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[calc(100vh-20rem)] overflow-y-auto">
                  {filteredInsights.map((insight) => (
                    <div
                      key={insight.id}
                      className={cn(
                        "border rounded-lg p-3 cursor-pointer transition-all hover:shadow-sm",
                        selectedInsight?.id === insight.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      )}
                      onClick={() => handleSelectInsight(insight)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-medium text-sm">
                            {insight.company_details.name}
                          </h3>
                          <Badge
                            variant={
                              insight.status === "completed"
                                ? "default"
                                : insight.status === "processing"
                                ? "secondary"
                                : "destructive"
                            }
                            className="text-xs"
                          >
                            {insight.status}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {insight.date}
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                        {insight.call_summary}
                      </p>

                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-1">
                          <User className="w-3 h-3 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {insight.prospect_details[0]?.name}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {insight.duration}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Insights Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-primary/5 p-3 rounded-lg">
                    <div className="flex items-center space-x-2 mb-1">
                      <MessageSquare className="w-4 h-4 text-primary" />
                      <span className="text-xs font-medium">Total Calls</span>
                    </div>
                    <p className="text-xl font-bold">{insights.length}</p>
                  </div>
                  <div className="bg-primary/5 p-3 rounded-lg">
                    <div className="flex items-center space-x-2 mb-1">
                      <CheckSquare className="w-4 h-4 text-primary" />
                      <span className="text-xs font-medium">Action Items</span>
                    </div>
                    <p className="text-xl font-bold">
                      {insights.reduce(
                        (total, insight) =>
                          total + (insight.action_items?.length || 0),
                        0
                      )}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Insights Generated
                    </span>
                    <span className="font-medium">
                      {insights.reduce(
                        (total, insight) =>
                          total + (insight.sales_insights?.length || 0),
                        0
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Follow-up Emails
                    </span>
                    <span className="font-medium">
                      {
                        insights.filter((i) => i.follow_up_email?.length > 0)
                          .length
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Presentation Prompts
                    </span>
                    <span className="font-medium">
                      {
                        insights.filter((i) => i.deck_prompt?.length > 0).length
                      }
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content - Selected Insight */}
        <div className="lg:col-span-2">
          {selectedInsight ? (
            <>
              {isEditing ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>
                        Editing{" "}
                        {editType
                          .replace("_", " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </span>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsEditing(false)}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Cancel
                        </Button>
                        <Button size="sm" onClick={handleSaveEdit}>
                          <Save className="w-4 h-4 mr-1" />
                          Save
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <textarea
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      className="w-full h-96 p-4 border border-border rounded-lg font-mono text-sm"
                    />
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Prospect Context */}
                  <div className="mb-6">
                    <ProspectSelector
                      selectedProspect={selectedProspect}
                      onProspectSelect={() => {}}
                      compact={true}
                      showStakeholders={false}
                    />
                  </div>

                  {/* Call Insights Viewer */}
                  <CallInsightsViewer
                    insights={selectedInsight}
                    callNotesId={selectedInsight.id}
                    userId={userId}
                    onNavigateBack={() => setSelectedInsight(null)}
                    onEditInsight={handleEditInsight}
                    onPushToHubSpot={handlePushToHubSpot}
                    pushStatuses={pushStatuses}
                    showBackButton={false}
                    isEditable={true}
                    title={`Insights for ${selectedInsight.company_details.name}`}
                  />
                </>
              )}
            </>
          ) : (
            <Card className="shadow-sm">
              <CardContent className="text-center py-12">
                <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No Insight Selected</h3>
                <p className="text-muted-foreground mb-4">
                  {filteredInsights.length === 0
                    ? "No insights available. Process some call transcripts first to generate insights."
                    : "Select a call from the sidebar to view detailed AI-generated insights."}
                </p>
                {filteredInsights.length > 0 && (
                  <Button
                    onClick={() => handleSelectInsight(filteredInsights[0])}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View First Insight
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default CallInsights;