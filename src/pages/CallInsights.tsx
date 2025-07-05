import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building,
  User,
  Calendar,
  TrendingUp,
  MessageSquare,
  Target,
  Lightbulb,
  Brain,
  Users,
  Clock,
  Star,
  ArrowRight,
  Search,
  Filter,
  RefreshCw,
  FileText,
  Phone,
  Mail,
  Presentation,
  CheckSquare,
  Eye,
  Edit,
  Share,
  MoreVertical,
  Sparkles,
  Zap,
  Heart,
  ThumbsUp,
  AlertCircle,
  CheckCircle,
  Loader2,
  DollarSign,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CallInsightsViewer } from "@/components/followups/CallInsightsViewer";
import { dbHelpers, CURRENT_USER } from "@/lib/supabase";
import { usePageTimer } from "../hooks/userPageTimer";

// Mock data for demonstration - this would come from your API
const mockInsights = [
  {
    id: "1",
    companyName: "Acme Corp",
    prospectName: "Sarah Johnson",
    title: "VP of Sales",
    callDate: "2024-01-15",
    callDuration: "45 min",
    status: "hot",
    dealValue: "$120K",
    nextAction: "Pilot program approval",
    aiScore: 92,
    keyInsights: [
      "Strong interest in automation features",
      "Budget approved for Q2 implementation",
      "Needs integration with existing CRM",
    ],
    communicationStyle: "Direct & Data-Driven",
    sentiment: "Very Positive",
    followUpGenerated: true,
    commitments: 4,
    lastEngagement: "2 hours ago",
  },
  {
    id: "2",
    companyName: "TechStart Inc",
    prospectName: "Mike Chen",
    title: "CTO",
    callDate: "2024-01-14",
    callDuration: "30 min",
    status: "warm",
    dealValue: "$45K",
    nextAction: "Technical demo",
    aiScore: 78,
    keyInsights: [
      "Concerned about implementation timeline",
      "Interested in API capabilities",
      "Needs security documentation",
    ],
    communicationStyle: "Technical & Analytical",
    sentiment: "Cautiously Optimistic",
    followUpGenerated: false,
    commitments: 2,
    lastEngagement: "1 day ago",
  },
  {
    id: "3",
    companyName: "Global Solutions Ltd",
    prospectName: "Emma Wilson",
    title: "Director of Operations",
    callDate: "2024-01-10",
    callDuration: "60 min",
    status: "warm",
    dealValue: "$85K",
    nextAction: "Proposal review",
    aiScore: 85,
    keyInsights: [
      "Scaling challenges with current solution",
      "Team buy-in is crucial",
      "ROI demonstration needed",
    ],
    communicationStyle: "Collaborative & Process-Oriented",
    sentiment: "Engaged",
    followUpGenerated: true,
    commitments: 3,
    lastEngagement: "5 days ago",
  },
];

export const CallInsights = () => {
  usePageTimer("Call Insights");

  const [selectedInsight, setSelectedInsight] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [viewMode, setViewMode] = useState("grid"); // grid or list
  const [prospects, setProspects] = useState([]);
  const [communicationStyles, setCommunicationStyles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingStyles, setIsLoadingStyles] = useState(false);

  // Use current authenticated user
  const userId = CURRENT_USER.id;

  // Load prospects data
  useEffect(() => {
    const fetchProspects = async () => {
      if (!userId) {
        console.log("No user ID available, skipping prospects fetch");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const data = await dbHelpers.getProspectData(CURRENT_USER.id);
        if (error) throw error;

        // Transform prospect data to match existing card structure
        const transformedProspects = (data || []).map((prospect) => ({
          id: prospect.id,
          companyName: prospect.company || "Unknown Company",
          prospectName: prospect.name,
          title: prospect.title || "Unknown Title",
          callDate: new Date(prospect.created_at).toISOString().split("T")[0],
          callDuration: "Unknown", // Not available in prospect table
          status: "warm", // Default status, could be enhanced
          dealValue: prospect.deal_value
            ? `$${prospect.deal_value.toLocaleString()}`
            : "TBD",
          nextAction: "Follow up required",
          aiScore: 85, // Default score, could be calculated
          keyInsights: [
            "Prospect analysis pending",
            "Communication style to be determined",
            "Follow-up strategy needed",
          ],
          communicationStyle: "To be analyzed",
          sentiment: "Neutral",
          followUpGenerated: false,
          commitments: prospect.calls || 0,
          lastEngagement: "Recently added",
          communication_style_ids: prospect.communication_style_ids || [],
          sales_insight_priority_list:
            prospect.sales_insight_priority_list || [],
          calls: prospect.calls || 0,
          company_id: prospect.company_id,
          user_id: prospect.user_id,
          created_at: prospect.created_at,
        }));

        setProspects(transformedProspects);

        // Auto-select first prospect if available
        if (transformedProspects.length > 0) {
          setSelectedInsight(transformedProspects[0]);
        }

        toast.success(`Loaded ${transformedProspects.length} prospects`);
      } catch (error) {
        console.error("Failed to load prospects:", error);
        toast.error("Could not fetch prospects");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProspects();
  }, [userId]);

  // Load communication styles for selected prospect
  useEffect(() => {
    const fetchCommunicationStyles = async () => {
      if (!selectedInsight?.communication_style_ids?.length) {
        setCommunicationStyles([]);
        return;
      }

      setIsLoadingStyles(true);
      try {
        const data = dbHelpers.getCommunicationStyles(
          selectedInsight.communication_style_ids
        );

        if (error) throw error;

        // Sort communication styles: primary first, then original order
        const sortedStyles = (data || []).sort((a, b) => {
          // Primary styles come first
          if (a.is_primary && !b.is_primary) return -1;
          if (!a.is_primary && b.is_primary) return 1;

          // For non-primary styles, maintain original order based on array index
          const aIndex = selectedInsight.communication_style_ids.indexOf(a.id);
          const bIndex = selectedInsight.communication_style_ids.indexOf(b.id);
          return aIndex - bIndex;
        });

        setCommunicationStyles(sortedStyles);
      } catch (error) {
        console.error("Failed to load communication styles:", error);
        toast.error("Could not fetch communication styles");
      } finally {
        setIsLoadingStyles(false);
      }
    };

    fetchCommunicationStyles();
  }, [selectedInsight?.communication_style_ids]);

  // Filter and sort prospects
  const filteredProspects = prospects
    .filter((prospect) => {
      const matchesSearch =
        prospect.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prospect.prospectName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || prospect.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "recent":
          return new Date(b.callDate) - new Date(a.callDate);
        case "score":
          return b.aiScore - a.aiScore;
        case "value":
          const aValue = parseFloat(a.dealValue.replace(/[$,]/g, "")) || 0;
          const bValue = parseFloat(b.dealValue.replace(/[$,]/g, "")) || 0;
          return bValue - aValue;
        case "company":
          return a.companyName.localeCompare(b.companyName);
        default:
          return 0;
      }
    });

  const handleInsightSelect = (prospect) => {
    setSelectedInsight(prospect);
    toast.success(
      `Selected ${prospect.companyName} - ${prospect.prospectName}`
    );
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    // Simulate refresh
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
    toast.success("Insights refreshed");
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "hot":
        return "bg-red-100 text-red-800 border-red-200";
      case "warm":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "cold":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    return "text-red-600";
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

  // If a specific insight is selected, show the detailed view
  if (selectedInsight) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <CallInsightsViewer
          insights={{
            reviewInsights: [],
            call_summary: `Call summary for ${selectedInsight.prospectName} at ${selectedInsight.companyName}`,
            follow_up_email: "Follow-up email content would be generated here",
            deck_prompt: "Presentation prompt would be generated here",
            callAnalysisData: {
              action_items: [],
              sales_insights: selectedInsight.sales_insight_priority_list || [],
              communication_styles: communicationStyles,
            },
          }}
          callNotesId={selectedInsight.id}
          userId={userId}
          onNavigateBack={() => setSelectedInsight(null)}
          onEditInsight={() => {}}
          onPushToHubSpot={() => {}}
          pushStatuses={{}}
          showBackButton={true}
          isEditable={true}
          title={`Insights for ${selectedInsight.companyName}`}
          isProcessingHistory={false}
        />
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
            AI-powered analysis of your sales conversations with actionable
            insights and next steps.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw
              className={cn("w-4 h-4 mr-1", isLoading && "animate-spin")}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by company or prospect name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="hot">Hot</SelectItem>
                  <SelectItem value="warm">Warm</SelectItem>
                  <SelectItem value="cold">Cold</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Most Recent</SelectItem>
                  <SelectItem value="score">AI Score</SelectItem>
                  <SelectItem value="value">Deal Value</SelectItem>
                  <SelectItem value="company">Company Name</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insights Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading prospects...</p>
        </div>
      ) : filteredProspects.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Brain className="w-16 h-16 mx-auto mb-4 opacity-50 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No Prospects Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your search or filters"
                : "No prospects available. Add some prospects to see insights here."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProspects.map((prospect) => (
            <Card
              key={prospect.id}
              className="cursor-pointer hover:shadow-lg transition-all duration-200 border-border hover:border-primary/50"
              onClick={() => handleInsightSelect(prospect)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold mb-1">
                      {prospect.companyName}
                    </CardTitle>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <User className="w-3 h-3" />
                      <span>{prospect.prospectName}</span>
                      <span>•</span>
                      <span>{prospect.title}</span>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn("text-xs", getStatusColor(prospect.status))}
                  >
                    {prospect.status}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-3 h-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Date:</span>
                    <span className="font-medium">{prospect.callDate}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <DollarSign className="w-3 h-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Value:</span>
                    <span className="font-medium">{prospect.dealValue}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Brain className="w-3 h-3 text-muted-foreground" />
                    <span className="text-muted-foreground">AI Score:</span>
                    <span
                      className={cn(
                        "font-medium",
                        getScoreColor(prospect.aiScore)
                      )}
                    >
                      {prospect.aiScore}%
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckSquare className="w-3 h-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Calls:</span>
                    <span className="font-medium">{prospect.calls}</span>
                  </div>
                </div>

                {/* Communication Style */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <MessageSquare className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      Communication Style:
                    </span>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {prospect.communicationStyle}
                  </Badge>
                </div>

                {/* Next Action */}
                <div className="pt-2 border-t border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Target className="w-3 h-3 text-primary" />
                      <span className="text-xs font-medium">Next Action:</span>
                    </div>
                    <ArrowRight className="w-3 h-3 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {prospect.nextAction}
                  </p>
                </div>

                {/* Engagement Indicators */}
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div className="flex items-center space-x-3">
                    {prospect.followUpGenerated && (
                      <div className="flex items-center space-x-1">
                        <Mail className="w-3 h-3 text-green-600" />
                        <span className="text-xs text-green-600">Email</span>
                      </div>
                    )}
                    {prospect.commitments > 0 && (
                      <div className="flex items-center space-x-1">
                        <CheckCircle className="w-3 h-3 text-blue-600" />
                        <span className="text-xs text-blue-600">
                          {prospect.commitments} items
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {prospect.lastEngagement}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
