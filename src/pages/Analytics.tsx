import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Target,
  Calendar,
  MessageSquare,
  ThumbsUp,
  AlertTriangle,
  Lightbulb,
  RefreshCw,
  ChevronDown,
  User,
  Globe,
  Monitor,
  Filter,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { usePageTimer } from "@/hooks/userPageTimer";
import { useSelector } from "react-redux";
import { dbHelpers } from "@/lib/supabase";

interface UserFeedback {
  id: string;
  user_id: string;
  username: string;
  page_url: string;
  page_route: string;
  what_you_like: string | null;
  what_needs_improving: string | null;
  new_features_needed: string | null;
  session_id: string;
  user_agent: string;
  created_at: string;
  is_active: boolean;
}

export const Analytics = () => {
  usePageTimer("Analytics");

  const { userRoleId } = useSelector((state: any) => state.auth);
  const isSuperAdmin = userRoleId === 1;

  // Feedback state
  const [feedbackData, setFeedbackData] = useState<UserFeedback[]>([]);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [expandedFeedback, setExpandedFeedback] = useState<string | null>(null);

  // Filter state
  const [filters, setFilters] = useState({
    pageRoute: "all",
    username: "",
    dateFrom: "",
    dateTo: "",
  });

  // Load feedback data
  const loadFeedbackData = async () => {
    if (!isSuperAdmin) return;

    setIsLoadingFeedback(true);
    setFeedbackError(null);

    try {
      const feedback = await dbHelpers.getAllUserFeedback();
      setFeedbackData(feedback || []);
    } catch (error) {
      console.error("Error loading feedback:", error);
      setFeedbackError("Failed to load feedback data");
      toast.error("Failed to load feedback data");
    } finally {
      setIsLoadingFeedback(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    if (isSuperAdmin) {
      loadFeedbackData();
    }
  }, [isSuperAdmin]);

  // Filter feedback data
  const filteredFeedback = feedbackData.filter((feedback) => {
    const matchesRoute = filters.pageRoute === "all" || feedback.page_route === filters.pageRoute;
    const matchesUsername = !filters.username || 
      feedback.username.toLowerCase().includes(filters.username.toLowerCase());
    
    let matchesDateRange = true;
    if (filters.dateFrom || filters.dateTo) {
      const feedbackDate = new Date(feedback.created_at);
      if (filters.dateFrom) {
        matchesDateRange = matchesDateRange && feedbackDate >= new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        matchesDateRange = matchesDateRange && feedbackDate <= new Date(filters.dateTo + "T23:59:59");
      }
    }

    return matchesRoute && matchesUsername && matchesDateRange;
  });

  // Get unique page routes for filter dropdown
  const uniquePageRoutes = Array.from(new Set(feedbackData.map(f => f.page_route))).sort();

  const toggleFeedbackExpansion = (feedbackId: string) => {
    setExpandedFeedback(expandedFeedback === feedbackId ? null : feedbackId);
  };

  const clearFilters = () => {
    setFilters({
      pageRoute: "all",
      username: "",
      dateFrom: "",
      dateTo: "",
    });
  };

  const hasActiveFilters = filters.pageRoute !== "all" || filters.username || filters.dateFrom || filters.dateTo;

  const getFeedbackIndicators = (feedback: UserFeedback) => {
    const indicators = [];
    if (feedback.what_you_like) indicators.push({ color: "bg-green-500", type: "likes" });
    if (feedback.what_needs_improving) indicators.push({ color: "bg-orange-500", type: "improvements" });
    if (feedback.new_features_needed) indicators.push({ color: "bg-blue-500", type: "features" });
    return indicators;
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
        <p className="text-muted-foreground">
          Performance insights and user feedback analytics
        </p>
      </div>

      {/* Dashboard Overview Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$45,231.89</div>
            <p className="text-xs text-muted-foreground">
              +20.1% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Deals</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+2350</div>
            <p className="text-xs text-muted-foreground">
              +180.1% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12.5%</div>
            <p className="text-xs text-muted-foreground">
              +19% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+573</div>
            <p className="text-xs text-muted-foreground">
              +201 since last hour
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Super Admin: User Feedback Section */}
      {isSuperAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5" />
                <span>User Feedback</span>
                <Badge variant="outline" className="text-xs">
                  {filteredFeedback.length} entries
                </Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadFeedbackData}
                disabled={isLoadingFeedback}
              >
                <RefreshCw className={cn("w-4 h-4 mr-1", isLoadingFeedback && "animate-spin")} />
                Refresh
              </Button>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Filters */}
            <div className="space-y-4">
              {/* Filter Controls Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Filters</span>
                  {hasActiveFilters && (
                    <Badge variant="secondary" className="text-xs">
                      {Object.values(filters).filter(v => v && v !== "all").length} active
                    </Badge>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {hasActiveFilters && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearFilters}
                      className="h-8 text-xs"
                    >
                      <X className="w-3 h-3 mr-1" />
                      Clear
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadFeedbackData}
                    disabled={isLoadingFeedback}
                    className="h-8 text-xs"
                  >
                    <RefreshCw className={cn("w-3 h-3 mr-1", isLoadingFeedback && "animate-spin")} />
                    Refresh
                  </Button>
                </div>
              </div>

              {/* Filter Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-gradient-to-r from-muted/40 to-muted/20 border border-border/50 rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="page-route-filter" className="text-xs font-medium text-foreground">
                    Page Route
                  </Label>
                  <Select
                    value={filters.pageRoute}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, pageRoute: value }))}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder="All pages" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Pages</SelectItem>
                      {uniquePageRoutes.map((route) => (
                        <SelectItem key={route} value={route}>
                          <span className="flex items-center space-x-2">
                            <span className="w-2 h-2 bg-blue-500 rounded-full" />
                            <span>{route}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username-filter" className="text-xs font-medium text-foreground">
                    Username
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-3 h-3" />
                    <Input
                      id="username-filter"
                      placeholder="Search users..."
                      value={filters.username}
                      onChange={(e) => setFilters(prev => ({ ...prev, username: e.target.value }))}
                      className="h-9 pl-9 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date-from-filter" className="text-xs font-medium text-foreground">
                    From Date
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-3 h-3" />
                    <Input
                      id="date-from-filter"
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                      className="h-9 pl-9 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date-to-filter" className="text-xs font-medium text-foreground">
                    To Date
                  </Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-3 h-3" />
                    <Input
                      id="date-to-filter"
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                      className="h-9 pl-9 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Active Filters Display */}
              {hasActiveFilters && (
                <div className="flex items-center space-x-2 text-xs">
                  <span className="text-muted-foreground">Active filters:</span>
                  {filters.pageRoute !== "all" && (
                    <Badge variant="secondary" className="text-xs">
                      Page: {filters.pageRoute}
                    </Badge>
                  )}
                  {filters.username && (
                    <Badge variant="secondary" className="text-xs">
                      User: {filters.username}
                    </Badge>
                  )}
                  {filters.dateFrom && (
                    <Badge variant="secondary" className="text-xs">
                      From: {filters.dateFrom}
                    </Badge>
                  )}
                  {filters.dateTo && (
                    <Badge variant="secondary" className="text-xs">
                      To: {filters.dateTo}
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* Feedback Entries */}
            {isLoadingFeedback ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading feedback...</p>
              </div>
            ) : feedbackError ? (
              <div className="text-center py-8 text-destructive">
                <p>{feedbackError}</p>
              </div>
            ) : filteredFeedback.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="mb-2">No feedback entries found</p>
                <p className="text-sm">
                  {hasActiveFilters ? "Try adjusting your filters" : "No user feedback available yet"}
                </p>
              </div>
            ) : (
              <div className="border rounded-lg max-h-80 overflow-y-auto">
                <div className="space-y-1 p-2">
                  {filteredFeedback.map((feedback) => {
                    const indicators = getFeedbackIndicators(feedback);
                    const isExpanded = expandedFeedback === feedback.id;

                    return (
                      <Collapsible
                        key={feedback.id}
                        open={isExpanded}
                        onOpenChange={() => toggleFeedbackExpansion(feedback.id)}
                      >
                        <CollapsibleTrigger asChild>
                          <div className="w-full p-3 hover:bg-accent/50 transition-colors cursor-pointer border-b border-border last:border-b-0">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3 flex-1 min-w-0">
                                <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                  <User className="w-3 h-3 text-primary" />
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2 text-sm">
                                    <span className="font-medium truncate max-w-40">
                                      {feedback.username}
                                    </span>
                                    <span className="text-muted-foreground">•</span>
                                    <span className="text-muted-foreground truncate max-w-24">
                                      {feedback.page_route}
                                    </span>
                                    <span className="text-muted-foreground">•</span>
                                    <span className="text-muted-foreground text-xs">
                                      {new Date(feedback.created_at).toLocaleDateString()}
                                    </span>
                                  </div>
                                  
                                  <div className="flex items-center space-x-1 mt-1">
                                    {indicators.map((indicator, index) => (
                                      <div
                                        key={index}
                                        className={cn("w-1.5 h-1.5 rounded-full", indicator.color)}
                                        title={indicator.type}
                                      />
                                    ))}
                                    {indicators.length === 0 && (
                                      <span className="text-xs text-muted-foreground">No feedback content</span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <ChevronDown
                                className={cn(
                                  "w-4 h-4 text-muted-foreground transition-transform flex-shrink-0",
                                  isExpanded && "rotate-180"
                                )}
                              />
                            </div>
                          </div>
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                          <div className="px-3 pb-3 space-y-2">
                            {/* Feedback Content */}
                            {feedback.what_you_like && (
                              <div className="bg-green-50 border border-green-200 rounded-md p-2">
                                <div className="flex items-center space-x-1 mb-1">
                                  <ThumbsUp className="w-3 h-3 text-green-600" />
                                  <span className="text-xs font-medium text-green-800">What they like:</span>
                                </div>
                                <p className="text-xs text-green-700 whitespace-pre-wrap leading-relaxed">
                                  {feedback.what_you_like}
                                </p>
                              </div>
                            )}

                            {feedback.what_needs_improving && (
                              <div className="bg-orange-50 border border-orange-200 rounded-md p-2">
                                <div className="flex items-center space-x-1 mb-1">
                                  <AlertTriangle className="w-3 h-3 text-orange-600" />
                                  <span className="text-xs font-medium text-orange-800">Needs improving:</span>
                                </div>
                                <p className="text-xs text-orange-700 whitespace-pre-wrap leading-relaxed">
                                  {feedback.what_needs_improving}
                                </p>
                              </div>
                            )}

                            {feedback.new_features_needed && (
                              <div className="bg-blue-50 border border-blue-200 rounded-md p-2">
                                <div className="flex items-center space-x-1 mb-1">
                                  <Lightbulb className="w-3 h-3 text-blue-600" />
                                  <span className="text-xs font-medium text-blue-800">Feature requests:</span>
                                </div>
                                <p className="text-xs text-blue-700 whitespace-pre-wrap leading-relaxed">
                                  {feedback.new_features_needed}
                                </p>
                              </div>
                            )}

                            {/* Technical Metadata */}
                            <div className="bg-gray-50 border border-gray-200 rounded-md p-2 mt-2">
                              <div className="grid grid-cols-1 gap-1 text-xs text-gray-600">
                                <div className="flex items-center space-x-1">
                                  <Globe className="w-3 h-3" />
                                  <span className="font-medium">URL:</span>
                                  <span className="truncate">{feedback.page_url}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Monitor className="w-3 h-3" />
                                  <span className="font-medium">Browser:</span>
                                  <span className="truncate" title={feedback.user_agent}>
                                    {feedback.user_agent.substring(0, 50)}...
                                  </span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Calendar className="w-3 h-3" />
                                  <span className="font-medium">Session:</span>
                                  <span>{feedback.session_id}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Additional Analytics Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Performance Metrics</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Call Processing</span>
                <span className="font-medium">94.2%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Email Generation</span>
                <span className="font-medium">87.8%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">CRM Integration</span>
                <span className="font-medium">91.5%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span>Usage Trends</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Daily Active Users</span>
                <span className="font-medium">+12.3%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Feature Adoption</span>
                <span className="font-medium">+8.7%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">User Satisfaction</span>
                <span className="font-medium">4.6/5.0</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Analytics;