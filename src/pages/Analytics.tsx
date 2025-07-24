import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  Target,
  Zap,
  Brain,
  AlertTriangle,
  CheckCircle,
  Star,
  Award,
  Lightbulb,
  ArrowRight,
  RefreshCw,
  Download,
  Filter,
  Calendar,
  DollarSign,
  Activity,
  Gauge,
  LineChart as LineChartIcon,
  PieChart,
  Eye,
  MessageSquare,
  FileText,
  Presentation,
  Mail,
  Phone,
  Settings,
  Info,
  ExternalLink,
  User,
  ThumbsUp,
  Loader2,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Cell,
  Area,
  AreaChart,
} from "recharts";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CURRENT_USER } from "../lib/supabase";
import { config } from "@/lib/config";
import { dbHelpers } from "@/lib/supabase";
import { useSelector } from "react-redux";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Mock data for analytics
const mockAnalyticsData = {
  superAdmin: {
    platformHealth: {
      uptime: 99.97,
      avgResponseTime: 1.2,
      errorRate: 0.03,
      activeUsers: 2847,
      totalOrganizations: 156,
    },
    featureAdoption: [
      {
        feature: "AI Email Generation",
        adoption: 87,
        trend: "up",
        impact: "high",
      },
      { feature: "Call Analysis", adoption: 92, trend: "up", impact: "high" },
      {
        feature: "Presentation Builder",
        adoption: 73,
        trend: "up",
        impact: "medium",
      },
      {
        feature: "CRM Integration",
        adoption: 68,
        trend: "down",
        impact: "high",
      },
      {
        feature: "Analytics Dashboard",
        adoption: 45,
        trend: "up",
        impact: "medium",
      },
    ],
    organizationBenchmarks: [
      { name: "Top 10%", winRate: 78, timesSaved: 15.2, aiUtilization: 94 },
      { name: "Average", winRate: 62, timesSaved: 8.7, aiUtilization: 71 },
      { name: "Bottom 25%", winRate: 45, timesSaved: 4.1, aiUtilization: 52 },
    ],
    roiMetrics: {
      totalRevenue: 2400000,
      timeSavings: 45600,
      pipelineAcceleration: 1800000,
      customerSatisfaction: 4.7,
    },
  },
  orgAdmin: {
    teamProductivity: {
      avgTimeSaved: 12.4,
      emailEfficiency: 85,
      presentationSpeed: 67,
      followUpRate: 91,
    },
    individualPerformance: [
      {
        name: "Sarah Johnson",
        timeSaved: 18.2,
        aiAcceptance: 92,
        efficiency: "high",
      },
      {
        name: "Mike Chen",
        timeSaved: 15.7,
        aiAcceptance: 88,
        efficiency: "high",
      },
      {
        name: "Lisa Rodriguez",
        timeSaved: 8.3,
        aiAcceptance: 74,
        efficiency: "medium",
      },
      {
        name: "Tom Wilson",
        timeSaved: 6.1,
        aiAcceptance: 65,
        efficiency: "low",
      },
    ],
    contentOptimization: {
      knowledgeGaps: [
        "Product X Documentation",
        "Competitive Analysis",
        "ROI Templates",
      ],
      topPerformingContent: ["Case Studies", "Demo Videos", "Pricing Guides"],
      uploadRecommendations: 3,
    },
    revenueImpact: {
      dealsInfluenced: 47,
      pipelineVelocity: 23,
      winRateImprovement: 15,
      avgDealSize: 125000,
    },
  },
  individual: {
    personalProductivity: {
      weeklyTimeSaved: 8.5,
      emailTime: 2.3,
      presentationTime: 3.1,
      researchTime: 3.1,
    },
    featureMastery: [
      { feature: "Email Generation", proficiency: 92, status: "mastered" },
      { feature: "Call Analysis", proficiency: 87, status: "proficient" },
      { feature: "Presentation Builder", proficiency: 64, status: "learning" },
      { feature: "CRM Integration", proficiency: 45, status: "beginner" },
    ],
    revenueContribution: {
      dealsAssisted: 12,
      winRate: 68,
      avgDealSize: 95000,
      personalROI: 2400,
    },
    skillDevelopment: {
      completedTraining: 7,
      recommendedCourses: ["Advanced Prompt Engineering", "CRM Optimization"],
      achievements: ["50 AI Emails", "First Closed Deal", "Efficiency Expert"],
    },
  },
};

// Time series data for charts
const timeSeriesData = [
  { date: "2024-01-01", productivity: 65, adoption: 45, revenue: 180000 },
  { date: "2024-01-08", productivity: 72, adoption: 52, revenue: 195000 },
  { date: "2024-01-15", productivity: 78, adoption: 58, revenue: 210000 },
  { date: "2024-01-22", productivity: 85, adoption: 65, revenue: 225000 },
  { date: "2024-01-29", productivity: 91, adoption: 71, revenue: 240000 },
];

const COLORS = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];

const Analytics = () => {
  const { userRoleId } = useSelector((state) => state.auth);
  const [userRole, setUserRole] = useState("individual"); // super_admin, org_admin, individual
  const [timeRange, setTimeRange] = useState("30d");
  const [selectedMetric, setSelectedMetric] = useState("productivity");
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackData, setFeedbackData] = useState([]);
  const [feedbackFilters, setFeedbackFilters] = useState({
    pageRoute: '',
    username: '',
    dateFrom: '',
    dateTo: '',
  });
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  // Check if user is super admin (userRoleId is null)
  const isSuperAdmin = userRoleId === null;

  // Simulate data refresh
  const handleRefresh = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);
    toast.success("Analytics data refreshed");
  };

  // Load feedback data for super admin
  const loadFeedbackData = async () => {
    if (!isSuperAdmin) return;

    setLoadingFeedback(true);
    try {
      const feedback = await dbHelpers.getFeedbackForAdmin(feedbackFilters);
      setFeedbackData(feedback);
    } catch (error) {
      console.error('Error loading feedback data:', error);
      toast.error('Failed to load feedback data');
    } finally {
      setLoadingFeedback(false);
    }
  };

  // Load feedback data on component mount for super admin
  useEffect(() => {
    if (isSuperAdmin) {
      loadFeedbackData();
    }
  }, [isSuperAdmin]);

  // Reload feedback when filters change
  useEffect(() => {
    if (isSuperAdmin) {
      const debounceTimer = setTimeout(() => {
        loadFeedbackData();
      }, 300);
      return () => clearTimeout(debounceTimer);
    }
  }, [feedbackFilters, isSuperAdmin]);

  const handleFeedbackFilterChange = (field, value) => {
    setFeedbackFilters(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const clearFeedbackFilters = () => {
    setFeedbackFilters({
      pageRoute: '',
      username: '',
      dateFrom: '',
      dateTo: '',
    });
  };

  const getUniquePageRoutes = () => {
    const routes = [...new Set(feedbackData.map(f => f.page_route))];
    return routes.sort();
  };

  // Super Admin Dashboard
  const SuperAdminDashboard = () => (
    <div className="space-y-6">
      {/* Platform Health Overview */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Platform Uptime</p>
                <p className="text-2xl font-bold text-green-600">
                  {mockAnalyticsData.superAdmin.platformHealth.uptime}%
                </p>
              </div>
              <Activity className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Avg Response Time
                </p>
                <p className="text-2xl font-bold">
                  {mockAnalyticsData.superAdmin.platformHealth.avgResponseTime}s
                </p>
              </div>
              <Gauge className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold">
                  {mockAnalyticsData.superAdmin.platformHealth.activeUsers.toLocaleString()}
                </p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Organizations</p>
                <p className="text-2xl font-bold">
                  {
                    mockAnalyticsData.superAdmin.platformHealth
                      .totalOrganizations
                  }
                </p>
              </div>
              <Target className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI-Driven Insights & Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="w-5 h-5" />
            <span>AI-Driven Strategic Insights</span>
            <Badge variant="default">Live Intelligence</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-blue-900">
                  Optimization Opportunity Detected
                </h4>
                <p className="text-sm text-blue-700 mt-1">
                  CRM Integration feature has 15% lower adoption among
                  enterprise clients. Analysis shows they need enhanced security
                  documentation.
                </p>
                <div className="mt-3 flex items-center space-x-4">
                  <Button size="sm" variant="outline">
                    <ArrowRight className="w-4 h-4 mr-1" />
                    Implement Security Guide
                  </Button>
                  <span className="text-xs text-blue-600">
                    Predicted Impact: +12% adoption, +£180K ARR
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-green-900">
                  Growth Acceleration Identified
                </h4>
                <p className="text-sm text-green-700 mt-1">
                  Top 10% organizations leverage 'AI Objection Handling' 90%
                  more than average. Curating best practices guide.
                </p>
                <div className="mt-3 flex items-center space-x-4">
                  <Button size="sm" variant="outline">
                    <ArrowRight className="w-4 h-4 mr-1" />
                    Create Best Practices Guide
                  </Button>
                  <span className="text-xs text-green-600">
                    Predicted Impact: +18% win rates for bottom quartile
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Adoption Intelligence */}
      <Card>
        <CardHeader>
          <CardTitle>Feature Adoption & Engagement Intelligence</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockAnalyticsData.superAdmin.featureAdoption.map(
              (feature, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border border-border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={cn(
                        "w-3 h-3 rounded-full",
                        feature.impact === "high"
                          ? "bg-red-500"
                          : feature.impact === "medium"
                          ? "bg-yellow-500"
                          : "bg-green-500"
                      )}
                    />
                    <span className="font-medium">{feature.feature}</span>
                    <Badge
                      variant={
                        feature.trend === "up" ? "default" : "destructive"
                      }
                      className="text-xs"
                    >
                      {feature.trend === "up" ? (
                        <TrendingUp className="w-3 h-3 mr-1" />
                      ) : (
                        <TrendingDown className="w-3 h-3 mr-1" />
                      )}
                      {feature.trend}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Progress value={feature.adoption} className="w-24" />
                    <span className="text-sm font-medium w-12">
                      {feature.adoption}%
                    </span>
                  </div>
                </div>
              )
            )}
          </div>
        </CardContent>
      </Card>

      {/* ROI & Business Impact */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Comprehensive ROI Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Total Revenue Impact
                </span>
                <span className="text-lg font-bold text-green-600">
                  £
                  {mockAnalyticsData.superAdmin.roiMetrics.totalRevenue.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Time Savings (Hours)
                </span>
                <span className="text-lg font-bold">
                  {mockAnalyticsData.superAdmin.roiMetrics.timeSavings.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Pipeline Acceleration
                </span>
                <span className="text-lg font-bold text-blue-600">
                  £
                  {mockAnalyticsData.superAdmin.roiMetrics.pipelineAcceleration.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Customer Satisfaction
                </span>
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="text-lg font-bold">
                    {
                      mockAnalyticsData.superAdmin.roiMetrics
                        .customerSatisfaction
                    }
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="productivity"
                  stackId="1"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="adoption"
                  stackId="1"
                  stroke="#06b6d4"
                  fill="#06b6d4"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* User Feedback Section - Only for Super Admin */}
      {isSuperAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5" />
                <span>User Feedback & Insights</span>
              </div>
              <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                Super Admin Only
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Feedback Filters */}
            <div className="grid md:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="page-filter" className="text-xs font-medium">Page Route</Label>
                <Select
                  value={feedbackFilters.pageRoute}
                  onValueChange={(value) => handleFeedbackFilterChange('pageRoute', value)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="All Pages" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Pages</SelectItem>
                    {getUniquePageRoutes().map(route => (
                      <SelectItem key={route} value={route}>{route}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username-filter" className="text-xs font-medium">Username</Label>
                <Input
                  id="username-filter"
                  placeholder="Filter by username..."
                  value={feedbackFilters.username}
                  onChange={(e) => handleFeedbackFilterChange('username', e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date-from" className="text-xs font-medium">From Date</Label>
                <Input
                  id="date-from"
                  type="date"
                  value={feedbackFilters.dateFrom}
                  onChange={(e) => handleFeedbackFilterChange('dateFrom', e.target.value)}
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date-to" className="text-xs font-medium">To Date</Label>
                <Input
                  id="date-to"
                  type="date"
                  value={feedbackFilters.dateTo}
                  onChange={(e) => handleFeedbackFilterChange('dateTo', e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {feedbackData.length} feedback entries found
              </p>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={clearFeedbackFilters}>
                  Clear Filters
                </Button>
                <Button variant="outline" size="sm" onClick={loadFeedbackData} disabled={loadingFeedback}>
                  {loadingFeedback ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Feedback List */}
            {loadingFeedback ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading feedback...</p>
              </div>
            ) : feedbackData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="mb-2">No feedback entries found</p>
                <p className="text-sm">Feedback from users will appear here</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {feedbackData.map((feedback) => (
                  <div key={feedback.id} className="border border-border rounded-lg p-4 space-y-3">
                    {/* Feedback Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{feedback.username}</p>
                          <p className="text-xs text-muted-foreground">{feedback.user?.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-xs mb-1">
                          {feedback.page_route}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          {new Date(feedback.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Feedback Content */}
                    <div className="space-y-3">
                      {feedback.what_you_like && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                          <div className="flex items-center space-x-2 mb-2">
                            <ThumbsUp className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-800">What they like:</span>
                          </div>
                          <p className="text-sm text-green-700 leading-relaxed">
                            {feedback.what_you_like}
                          </p>
                        </div>
                      )}

                      {feedback.what_needs_improving && (
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                          <div className="flex items-center space-x-2 mb-2">
                            <AlertTriangle className="w-4 h-4 text-orange-600" />
                            <span className="text-sm font-medium text-orange-800">Needs improving:</span>
                          </div>
                          <p className="text-sm text-orange-700 leading-relaxed">
                            {feedback.what_needs_improving}
                          </p>
                        </div>
                      )}

                      {feedback.new_features_needed && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <div className="flex items-center space-x-2 mb-2">
                            <Lightbulb className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-800">Feature requests:</span>
                          </div>
                          <p className="text-sm text-blue-700 leading-relaxed">
                            {feedback.new_features_needed}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );

  // Organization Admin Dashboard
  const OrgAdminDashboard = () => (
    <div className="space-y-6">
      {/* Team Performance Overview */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Time Saved</p>
                <p className="text-2xl font-bold">
                  {mockAnalyticsData.orgAdmin.teamProductivity.avgTimeSaved}
                  h/week
                </p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Email Efficiency
                </p>
                <p className="text-2xl font-bold">
                  {mockAnalyticsData.orgAdmin.teamProductivity.emailEfficiency}%
                </p>
              </div>
              <Mail className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Presentation Speed
                </p>
                <p className="text-2xl font-bold">
                  {
                    mockAnalyticsData.orgAdmin.teamProductivity
                      .presentationSpeed
                  }
                  %
                </p>
              </div>
              <Presentation className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Follow-up Rate</p>
                <p className="text-2xl font-bold">
                  {mockAnalyticsData.orgAdmin.teamProductivity.followUpRate}%
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Coaching Intelligence */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Team Performance & Coaching Intelligence</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-yellow-900">
                  Coaching Opportunity Identified
                </h4>
                <p className="text-sm text-yellow-700 mt-1">
                  Lisa Rodriguez shows 30% lower presentation efficiency.
                  Analysis suggests underutilization of 'AI Slide Generation'
                  feature.
                </p>
                <div className="mt-3 flex items-center space-x-4">
                  <Button size="sm" variant="outline">
                    <ArrowRight className="w-4 h-4 mr-1" />
                    Schedule Training Session
                  </Button>
                  <span className="text-xs text-yellow-600">
                    Predicted Impact: +20% faster presentations
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Individual Performance Table */}
          <div className="space-y-3">
            <h4 className="font-medium">Individual Performance Analysis</h4>
            {mockAnalyticsData.orgAdmin.individualPerformance.map(
              (person, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border border-border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={cn(
                        "w-3 h-3 rounded-full",
                        person.efficiency === "high"
                          ? "bg-green-500"
                          : person.efficiency === "medium"
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      )}
                    />
                    <span className="font-medium">{person.name}</span>
                    <Badge
                      variant={
                        person.efficiency === "high"
                          ? "default"
                          : person.efficiency === "medium"
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {person.efficiency}
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-4 text-sm">
                    <span>{person.timeSaved}h saved</span>
                    <span>{person.aiAcceptance}% AI acceptance</span>
                  </div>
                </div>
              )
            )}
          </div>
        </CardContent>
      </Card>

      {/* Revenue Impact */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Impact & Pipeline Acceleration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Deals Influenced
                </span>
                <span className="text-lg font-bold">
                  {mockAnalyticsData.orgAdmin.revenueImpact.dealsInfluenced}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Pipeline Velocity
                </span>
                <span className="text-lg font-bold text-green-600">
                  +{mockAnalyticsData.orgAdmin.revenueImpact.pipelineVelocity}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Win Rate Improvement
                </span>
                <span className="text-lg font-bold text-blue-600">
                  +{mockAnalyticsData.orgAdmin.revenueImpact.winRateImprovement}
                  %
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Avg Deal Size
                </span>
                <span className="text-lg font-bold">
                  £
                  {mockAnalyticsData.orgAdmin.revenueImpact.avgDealSize.toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Content & Knowledge Optimization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">
                  Knowledge Gaps Identified
                </h4>
                <div className="space-y-1">
                  {mockAnalyticsData.orgAdmin.contentOptimization.knowledgeGaps.map(
                    (gap, index) => (
                      <Badge
                        key={index}
                        variant="destructive"
                        className="mr-1 mb-1 text-xs"
                      >
                        {gap}
                      </Badge>
                    )
                  )}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">
                  Top Performing Content
                </h4>
                <div className="space-y-1">
                  {mockAnalyticsData.orgAdmin.contentOptimization.topPerformingContent.map(
                    (content, index) => (
                      <Badge
                        key={index}
                        variant="default"
                        className="mr-1 mb-1 text-xs"
                      >
                        {content}
                      </Badge>
                    )
                  )}
                </div>
              </div>
              <Button size="sm" className="w-full">
                <ArrowRight className="w-4 h-4 mr-1" />
                Upload Missing Content (
                {
                  mockAnalyticsData.orgAdmin.contentOptimization
                    .uploadRecommendations
                }{" "}
                recommended)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Individual User Dashboard
  const IndividualDashboard = () => {
    const [durations, setDurations] = useState({});
    const [error, setError] = useState(null);
    const posthogToken = config.posthog.apiKey;
    const analyticsKey = config.posthog.analyticsKey;
    const userEmail = CURRENT_USER.email || "";
    // console.log("User Email:", userEmail, posthogToken);
    useEffect(() => {
      const fetchPageTimes = async () => {
        try {
          if (!posthogToken) {
            throw new Error("PostHog API key not configured");
          }

          const res = await fetch(
            `https://eu.posthog.com/api/event?distinct_id=${userEmail}&event=page_time_spent`,
            {
              headers: {
                Authorization: `Bearer ${analyticsKey}`,
              },
            }
          );

          const data = await res.json();
          // console.log(data);
          const pageDurations = {};
          for (let event of data.results) {
            const page = event.properties?.page || "Unknown";
            const duration = parseFloat(event.properties?.duration || 0);
            pageDurations[page] = (pageDurations[page] || 0) + duration;
          }
          // console.log(pageDurations);
          setDurations(pageDurations);
        } catch (err) {
          console.error(err);
          setError("Failed to fetch PostHog data");
        }
      };

      fetchPageTimes();
    }, [userEmail]);

    if (error) return <div>{error}</div>;
    if (!Object.keys(durations).length) return <div>Loading...</div>;

    const totalSeconds = Object.values(durations).reduce(
      (sum, d) => sum + d,
      0
    );

    // console.log("Total Seconds:", totalSeconds, durations);

    return (
      <div className="space-y-6">
        {/* Personal Productivity */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Call Insights</p>
                  <p className="text-2xl font-bold">
                    {
                      // mockAnalyticsData.individual.personalProductivity
                      //   .weeklyTimeSaved
                      (durations["Call Insights"] / 3600).toFixed(1)
                    }
                    h
                  </p>
                </div>
                <Clock className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Email Time</p>
                  <p className="text-2xl font-bold">
                    {/* {
                      mockAnalyticsData.individual.personalProductivity
                        .emailTime
                    } */}
                    {((durations["Email Templates"] || 0) / 3600).toFixed(1)}h
                  </p>
                </div>
                <Mail className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Presentation Time
                  </p>
                  <p className="text-2xl font-bold">
                    {/* {
                      mockAnalyticsData.individual.personalProductivity
                        .presentationTime
                    } */}
                    {(
                      (durations["Presentation Prompt Builder"] || 0) / 3600
                    ).toFixed(1)}{" "}
                    h
                  </p>
                </div>
                <Presentation className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Research Time</p>
                  <p className="text-2xl font-bold">
                    {/* {
                      mockAnalyticsData.individual.personalProductivity
                        .researchTime
                    } */}
                    {((durations["Research"] || 0) / 3600).toFixed(1)}h
                  </p>
                </div>
                <FileText className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Personal ROI Visualization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5" />
                <span>Personal ROI & Impact Visualization</span>
              </div>
              <Badge
                variant="outline"
                className="bg-orange-50 text-orange-700 border-orange-200"
              >
                Coming Soon for Your Organization
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-green-900">
                    Excellent Progress This Month!
                  </h4>
                  <p className="text-sm text-green-700 mt-1">
                    You've saved{" "}
                    {mockAnalyticsData.individual.personalProductivity
                      .weeklyTimeSaved * 4}{" "}
                    hours this month, translating to £
                    {
                      mockAnalyticsData.individual.revenueContribution
                        .personalROI
                    }{" "}
                    in productivity gains!
                  </p>
                  <div className="mt-3 flex items-center space-x-4">
                    <Badge variant="default" className="text-xs">
                      <Star className="w-3 h-3 mr-1" />
                      Top 20% Performer
                    </Badge>
                    <span className="text-xs text-green-600">
                      You've closed{" "}
                      {
                        mockAnalyticsData.individual.revenueContribution
                          .dealsAssisted
                      }{" "}
                      AI-assisted deals
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-medium">Revenue Contribution</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Deals Assisted</span>
                    <span className="font-medium">
                      {
                        mockAnalyticsData.individual.revenueContribution
                          .dealsAssisted
                      }
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Win Rate</span>
                    <span className="font-medium">
                      {mockAnalyticsData.individual.revenueContribution.winRate}
                      %
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Avg Deal Size</span>
                    <span className="font-medium">
                      £
                      {mockAnalyticsData.individual.revenueContribution.avgDealSize.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Achievements</h4>
                <div className="space-y-1">
                  {mockAnalyticsData.individual.skillDevelopment.achievements.map(
                    (achievement, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="mr-1 mb-1 text-xs"
                      >
                        <Award className="w-3 h-3 mr-1" />
                        {achievement}
                      </Badge>
                    )
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feature Mastery & Skill Development */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Feature Mastery & Skill Development</span>
              <Badge
                variant="outline"
                className="bg-orange-50 text-orange-700 border-orange-200"
              >
                Coming Soon for Your Organization
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-blue-900">
                    Skill Development Opportunity
                  </h4>
                  <p className="text-sm text-blue-700 mt-1">
                    Your CRM Integration proficiency could be improved. Consider
                    completing the 'CRM Optimization' course (15 min).
                  </p>
                  <div className="mt-3 flex items-center space-x-4">
                    <Button size="sm" variant="outline">
                      <ArrowRight className="w-4 h-4 mr-1" />
                      Start Course
                    </Button>
                    <span className="text-xs text-blue-600">
                      Predicted Impact: +25% efficiency in CRM tasks
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {mockAnalyticsData.individual.featureMastery.map(
                (feature, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border border-border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <span className="font-medium">{feature.feature}</span>
                      <Badge
                        variant={
                          feature.status === "mastered"
                            ? "default"
                            : feature.status === "proficient"
                            ? "secondary"
                            : feature.status === "learning"
                            ? "outline"
                            : "destructive"
                        }
                      >
                        {feature.status}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Progress value={feature.proficiency} className="w-24" />
                      <span className="text-sm font-medium w-12">
                        {feature.proficiency}%
                      </span>
                    </div>
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Analytics Intelligence Hub
          </h1>
          <p className="text-muted-foreground">
            Transform raw data into strategic intelligence with actionable
            insights and measurable impact.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            {isLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>

          <Button variant="outline">
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Role Selector (for demo purposes) */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium">View Dashboard As:</span>
            <Select value={userRole} onValueChange={setUserRole} disabled>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="super_admin">Super Admin</SelectItem>
                <SelectItem value="org_admin">Organization Admin</SelectItem>
                <SelectItem value="individual">Individual User</SelectItem>
              </SelectContent>
            </Select>
            <Badge variant="outline" className="text-xs">
              <Info className="w-3 h-3 mr-1" />
              Demo Mode
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Role-Based Dashboard Content */}
      {userRole === "super_admin" && <SuperAdminDashboard />}
      {userRole === "org_admin" && <OrgAdminDashboard />}
      {userRole === "individual" && <IndividualDashboard />}

      {/* Success Metrics Framework */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5" />
              <span>Success Metrics Framework</span>
            </div>
            <Badge
              variant="outline"
              className="bg-orange-50 text-orange-700 border-orange-200"
            >
              Coming Soon for Your Organization
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4 border border-border rounded-lg">
              <Eye className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <h4 className="font-medium mb-1">Engagement & Adoption</h4>
              <p className="text-sm text-muted-foreground">
                Analytics usage frequency and feature adoption rates
              </p>
            </div>
            <div className="text-center p-4 border border-border rounded-lg">
              <Zap className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <h4 className="font-medium mb-1">Action Rate & Change</h4>
              <p className="text-sm text-muted-foreground">
                Recommendation implementation and behavioral shifts
              </p>
            </div>
            <div className="text-center p-4 border border-border rounded-lg">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <h4 className="font-medium mb-1">Business Impact & ROI</h4>
              <p className="text-sm text-muted-foreground">
                Measurable productivity gains and revenue acceleration
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;
export { Analytics };