import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Globe,
  Search,
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
import { usePageTimer } from "../hooks/userPageTimer";

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

// Mock data for charts
const callVolumeData = [
  { month: "Jan", calls: 120, conversions: 24 },
  { month: "Feb", calls: 135, conversions: 28 },
  { month: "Mar", calls: 148, conversions: 32 },
  { month: "Apr", calls: 162, conversions: 38 },
  { month: "May", calls: 178, conversions: 42 },
  { month: "Jun", calls: 195, conversions: 48 },
];

const prospectData = [
  { name: "Qualified", value: 45, color: "#8884d8" },
  { name: "Contacted", value: 30, color: "#82ca9d" },
  { name: "Interested", value: 15, color: "#ffc658" },
  { name: "Converted", value: 10, color: "#ff7300" },
];

const conversionData = [
  { stage: "Leads", count: 1000 },
  { stage: "Qualified", count: 450 },
  { stage: "Proposal", count: 180 },
  { stage: "Negotiation", count: 90 },
  { stage: "Closed", count: 45 },
];

const teamPerformanceData = [
  { name: "Alice Johnson", role: "Senior Sales Rep", calls: 45, revenue: 125 },
  { name: "Bob Smith", role: "Sales Rep", calls: 38, revenue: 98 },
  { name: "Carol Davis", role: "Sales Rep", calls: 42, revenue: 110 },
  { name: "David Wilson", role: "Junior Sales Rep", calls: 28, revenue: 65 },
];

const COLORS = ["#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];

export const Analytics = () => {
  usePageTimer("Analytics");
  const { userRoleId, user } = useSelector((state) => state.auth);
  
  // Feedback state
  const [feedbackData, setFeedbackData] = useState([]);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  const [feedbackFilters, setFeedbackFilters] = useState({
    pageRoute: 'all',
    username: '',
    dateFrom: '',
    dateTo: '',
  });
  const [availableRoutes, setAvailableRoutes] = useState([]);
  
  // Check if user should see feedback section
  const shouldShowFeedback = userRoleId === null; // Super Admin or user with null roleId
  const isSuperAdmin = userRoleId === null; // Super Admin can see all feedback
  
  // Load feedback data
  useEffect(() => {
    if (shouldShowFeedback) {
      loadFeedbackData();
    }
  }, [shouldShowFeedback, feedbackFilters]);
  
  const loadFeedbackData = async () => {
    setIsLoadingFeedback(true);
    try {
      let feedback;
      
      if (isSuperAdmin) {
        // Super Admin sees all feedback
        feedback = await dbHelpers.getAllUserFeedback(feedbackFilters);
      } else {
        // Regular user with null roleId sees only their own feedback
        feedback = await dbHelpers.getUserFeedback(user?.id, feedbackFilters);
      }
      
      setFeedbackData(feedback || []);
      
      // Extract unique routes for filter dropdown
      const routes = [...new Set(feedback?.map(f => f.page_route) || [])];
      setAvailableRoutes(routes);
      
    } catch (error) {
      console.error('Error loading feedback:', error);
      toast.error('Failed to load feedback data');
    } finally {
      setIsLoadingFeedback(false);
    }
  };
  
  const handleFilterChange = (field, value) => {
    setFeedbackFilters(prev => ({
      ...prev,
      [field]: value,
    }));
  };
  
  const clearFilters = () => {
    setFeedbackFilters({
      pageRoute: 'all',
      username: '',
      dateFrom: '',
      dateTo: '',
    });
  };
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };
  
  const getRouteDisplayName = (route) => {
    const routeNames = {
      '/research': 'Research',
      '/calls': 'Sales Calls',
      '/call-insights': 'Call Insights',
      '/follow-ups/actions': 'Action Items',
      '/follow-ups/emails': 'Email Templates',
      '/follow-ups/decks': 'Deck Builder',
      '/analytics': 'Analytics',
      '/settings': 'Settings',
      '/admin/users': 'User Management',
    };
    return routeNames[route] || route;
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Track your sales performance and insights
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Calls
                </p>
                <p className="text-2xl font-bold">1,234</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +12% from last month
                </p>
              </div>
              <Phone className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Conversion Rate
                </p>
                <p className="text-2xl font-bold">24.5%</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +3.2% from last month
                </p>
              </div>
              <Target className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Active Prospects
                </p>
                <p className="text-2xl font-bold">456</p>
                <p className="text-xs text-blue-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +8% from last month
                </p>
              </div>
              <Users className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Revenue
                </p>
                <p className="text-2xl font-bold">£89.2k</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +15% from last month
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="calls">Call Analytics</TabsTrigger>
          <TabsTrigger value="prospects">Prospect Insights</TabsTrigger>
          {shouldShowFeedback ? (
            <TabsTrigger value="feedback">User Feedback</TabsTrigger>
          ) : (
            <TabsTrigger value="performance">Performance</TabsTrigger>
          )}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Call Volume Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Call Volume & Conversions</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={callVolumeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="calls" fill="#8884d8" name="Calls" />
                    <Bar dataKey="conversions" fill="#82ca9d" name="Conversions" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Prospect Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Prospect Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={prospectData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {prospectData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Call Analytics Tab */}
        <TabsContent value="calls" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Call Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Call Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={callVolumeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="calls"
                      stroke="#8884d8"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Call Quality Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Call Quality Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Average Call Duration</span>
                  <span className="font-medium">12:34</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Talk Time Ratio</span>
                  <span className="font-medium">65%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Questions Asked</span>
                  <span className="font-medium">8.2 avg</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Follow-up Rate</span>
                  <span className="font-medium">78%</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Prospect Insights Tab */}
        <TabsContent value="prospects" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Prospect Sources */}
            <Card>
              <CardHeader>
                <CardTitle>Prospect Sources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { source: "LinkedIn", count: 145, percentage: 32 },
                    { source: "Cold Email", count: 98, percentage: 22 },
                    { source: "Referrals", count: 87, percentage: 19 },
                    { source: "Website", count: 76, percentage: 17 },
                    { source: "Events", count: 45, percentage: 10 },
                  ].map((item) => (
                    <div key={item.source} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{item.source}</span>
                        <span>{item.count} prospects</span>
                      </div>
                      <Progress value={item.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Prospect Engagement */}
            <Card>
              <CardHeader>
                <CardTitle>Engagement Levels</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { level: "High", count: 89, color: "bg-green-500" },
                    { level: "Medium", count: 156, color: "bg-yellow-500" },
                    { level: "Low", count: 211, color: "bg-red-500" },
                  ].map((item) => (
                    <div
                      key={item.level}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${item.color}`} />
                        <span className="font-medium">{item.level} Engagement</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {item.count} prospects
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* User Feedback Tab - Only for users with null roleId */}
        {shouldShowFeedback && (
          <TabsContent value="feedback" className="space-y-6">
            {/* Feedback Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">User Feedback</h2>
                <p className="text-muted-foreground">
                  {isSuperAdmin 
                    ? "View and analyze feedback from all users across the platform"
                    : "View your submitted feedback and track responses"
                  }
                </p>
              </div>
              <Button onClick={loadFeedbackData} disabled={isLoadingFeedback}>
                <RefreshCw className={cn("w-4 h-4 mr-2", isLoadingFeedback && "animate-spin")} />
                Refresh
              </Button>
            </div>

            {/* Feedback Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Filter className="w-5 h-5" />
                  <span>Filters</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-4 gap-4">
                  {/* Page Route Filter */}
                  <div className="space-y-2">
                    <Label htmlFor="page-filter">Page</Label>
                    <Select 
                      value={feedbackFilters.pageRoute} 
                      onValueChange={(value) => handleFilterChange('pageRoute', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All Pages" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Pages</SelectItem>
                        {availableRoutes.map(route => (
                          <SelectItem key={route} value={route}>
                            {getRouteDisplayName(route)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Username Filter - Only for Super Admin */}
                  {isSuperAdmin && (
                    <div className="space-y-2">
                      <Label htmlFor="username-filter">Username</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          id="username-filter"
                          placeholder="Search by username..."
                          value={feedbackFilters.username}
                          onChange={(e) => handleFilterChange('username', e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Date From Filter */}
                  <div className="space-y-2">
                    <Label htmlFor="date-from">From Date</Label>
                    <Input
                      id="date-from"
                      type="date"
                      value={feedbackFilters.dateFrom}
                      onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                    />
                  </div>
                  
                  {/* Date To Filter */}
                  <div className="space-y-2">
                    <Label htmlFor="date-to">To Date</Label>
                    <Input
                      id="date-to"
                      type="date"
                      value={feedbackFilters.dateTo}
                      onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button variant="outline" onClick={clearFilters} size="sm">
                    Clear Filters
                  </Button>
                  <Badge variant="secondary" className="text-xs">
                    {feedbackData.length} feedback entries
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Feedback List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5" />
                  <span>Feedback Entries</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingFeedback ? (
                  <div className="text-center py-8">
                    <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-primary" />
                    <p className="text-muted-foreground">Loading feedback...</p>
                  </div>
                ) : feedbackData.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="mb-2">No feedback found</p>
                    <p className="text-sm">
                      {isSuperAdmin 
                        ? "No users have submitted feedback yet" 
                        : "You haven't submitted any feedback yet"
                      }
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {feedbackData.map((feedback) => (
                      <div key={feedback.id} className="border border-border rounded-lg p-6 space-y-4">
                        {/* Feedback Header */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{feedback.username}</h3>
                              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                <span className="flex items-center space-x-1">
                                  <Globe className="w-3 h-3" />
                                  <span>{getRouteDisplayName(feedback.page_route)}</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{formatDate(feedback.created_at)}</span>
                                </span>
                              </div>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            ID: {feedback.id.slice(0, 8)}
                          </Badge>
                        </div>
                        
                        {/* Feedback Content */}
                        <div className="space-y-4">
                          {/* What you like */}
                          {feedback.what_you_like && (
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <ThumbsUp className="w-4 h-4 text-green-600" />
                                <span className="font-medium text-sm">What they like:</span>
                              </div>
                              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                <p className="text-sm leading-relaxed">{feedback.what_you_like}</p>
                              </div>
                            </div>
                          )}
                          
                          {/* What needs improving */}
                          {feedback.what_needs_improving && (
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <AlertTriangle className="w-4 h-4 text-orange-600" />
                                <span className="font-medium text-sm">What needs improving:</span>
                              </div>
                              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                                <p className="text-sm leading-relaxed">{feedback.what_needs_improving}</p>
                              </div>
                            </div>
                          )}
                          
                          {/* New features needed */}
                          {feedback.new_features_needed && (
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <Lightbulb className="w-4 h-4 text-blue-600" />
                                <span className="font-medium text-sm">Feature requests:</span>
                              </div>
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <p className="text-sm leading-relaxed">{feedback.new_features_needed}</p>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Feedback Metadata */}
                        <div className="pt-3 border-t border-border">
                          <div className="grid md:grid-cols-2 gap-4 text-xs text-muted-foreground">
                            <div>
                              <span className="font-medium">Page URL:</span>
                              <p className="truncate">{feedback.page_url}</p>
                            </div>
                            <div>
                              <span className="font-medium">Session ID:</span>
                              <p className="truncate">{feedback.session_id}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Performance Tab - Only show if feedback tab is not available */}
        {!shouldShowFeedback && (
          <TabsContent value="performance" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Conversion Funnel */}
              <Card>
                <CardHeader>
                  <CardTitle>Conversion Funnel</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={conversionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="stage" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Team Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Team Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {teamPerformanceData.map((member) => (
                      <div
                        key={member.name}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{member.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {member.role}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{member.calls} calls</p>
                          <p className="text-sm text-muted-foreground">
                            ${member.revenue}k revenue
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default Analytics;