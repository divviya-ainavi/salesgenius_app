import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
  Users,
  MessageSquare,
  TrendingUp,
  Calendar,
  User,
  Building,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { dbHelpers } from "@/lib/supabase";
import { usePageTimer } from "@/hooks/userPageTimer";

interface FeedbackItem {
  id: string;
  user_id: string;
  organization_id: string;
  page_route: string;
  what_you_like: string;
  what_needs_improving: string;
  new_features_needed: string;
  created_at: string;
  is_active: boolean;
  user?: {
    full_name: string;
    email: string;
  };
  organization?: {
    name: string;
  };
}

interface FilterState {
  pageRoute: string;
  username: string;
  fromDate: string;
  toDate: string;
}

const Analytics = () => {
  usePageTimer("Analytics");

  // State management
  const [feedbackData, setFeedbackData] = useState<FeedbackItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedFeedback, setExpandedFeedback] = useState<string | null>(null);

  // Filter states
  const [filters, setFilters] = useState<FilterState>({
    pageRoute: "",
    username: "",
    fromDate: "",
    toDate: "",
  });
  
  // Separate input state for username to prevent page refresh
  const [usernameInput, setUsernameInput] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize] = useState(5); // Fixed page size of 5 as requested
  const [isFilterLoading, setIsFilterLoading] = useState(false);

  // Debounced username filter
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (usernameInput !== filters.username) {
        setFilters(prev => ({ ...prev, username: usernameInput }));
        setCurrentPage(1); // Reset to first page when filter changes
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [usernameInput, filters.username]);

  // Fetch feedback data
  const fetchFeedbackData = useCallback(async () => {
    try {
      setIsFilterLoading(true);
      setError(null);

      // Calculate offset for pagination
      const offset = (currentPage - 1) * pageSize;

      // Build query parameters
      const queryParams = {
        limit: pageSize,
        offset: offset,
        page_route: filters.pageRoute || undefined,
        username: filters.username || undefined,
        from_date: filters.fromDate || undefined,
        to_date: filters.toDate || undefined,
      };

      // Remove undefined values
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key] === undefined) {
          delete queryParams[key];
        }
      });

      console.log('Fetching feedback with params:', queryParams);

      // Fetch data using dbHelpers
      const result = await dbHelpers.getFeedbackWithPagination(queryParams);
      
      setFeedbackData(result.data || []);
      setTotalCount(result.total || 0);

    } catch (err) {
      console.error("Error fetching feedback data:", err);
      setError("Failed to load feedback data");
      toast.error("Failed to load feedback data");
    } finally {
      setIsFilterLoading(false);
      setIsLoading(false);
    }
  }, [currentPage, pageSize, filters]);

  // Load data when filters or page changes
  useEffect(() => {
    fetchFeedbackData();
  }, [fetchFeedbackData]);

  // Handle filter changes (except username which is handled separately)
  const handleFilterChange = (key: keyof FilterState, value: string) => {
    if (key === 'username') {
      setUsernameInput(value);
      return;
    }

    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filter changes
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilters({
      pageRoute: "",
      username: "",
      fromDate: "",
      toDate: "",
    });
    setUsernameInput("");
    setCurrentPage(1);
  };

  // Refresh data
  const handleRefresh = () => {
    fetchFeedbackData();
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleFirstPage = () => setCurrentPage(1);
  const handlePreviousPage = () => setCurrentPage(Math.max(1, currentPage - 1));
  const handleNextPage = () => setCurrentPage(Math.min(totalPages, currentPage + 1));
  const handleLastPage = () => setCurrentPage(totalPages);

  // Calculate pagination values
  const totalPages = Math.ceil(totalCount / pageSize);
  const startEntry = totalCount > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const endEntry = Math.min(currentPage * pageSize, totalCount);

  // Get active filter count
  const activeFilterCount = Object.values(filters).filter(value => value.trim() !== "").length;

  // Page route options
  const pageRoutes = [
    { value: "", label: "All Pages" },
    { value: "Research", label: "Research" },
    { value: "Sales Calls", label: "Sales Calls" },
    { value: "Call Insights", label: "Call Insights" },
    { value: "Emails", label: "Emails" },
    { value: "Presentation", label: "Presentation" },
    { value: "Actions", label: "Actions" },
    { value: "Analytics", label: "Analytics" },
    { value: "Settings", label: "Settings" },
  ];

  // Get route color
  const getRouteColor = (route: string) => {
    const colors = {
      "Research": "bg-blue-100 text-blue-800",
      "Sales Calls": "bg-green-100 text-green-800",
      "Call Insights": "bg-purple-100 text-purple-800",
      "Emails": "bg-orange-100 text-orange-800",
      "Presentation": "bg-indigo-100 text-indigo-800",
      "Actions": "bg-red-100 text-red-800",
      "Analytics": "bg-yellow-100 text-yellow-800",
      "Settings": "bg-gray-100 text-gray-800",
    };
    return colors[route] || "bg-gray-100 text-gray-800";
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="text-center py-8">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Analytics</h1>
          <p className="text-muted-foreground">
            Monitor platform usage and user feedback to improve the experience.
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total Feedback</span>
            </div>
            <p className="text-2xl font-bold mt-1">{totalCount}</p>
            <p className="text-xs text-muted-foreground">all time</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Active Users</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {new Set(feedbackData.map(f => f.user_id)).size}
            </p>
            <p className="text-xs text-muted-foreground">providing feedback</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">This Page</span>
            </div>
            <p className="text-2xl font-bold mt-1">{feedbackData.length}</p>
            <p className="text-xs text-muted-foreground">showing results</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Organizations</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {new Set(feedbackData.map(f => f.organization_id)).size}
            </p>
            <p className="text-xs text-muted-foreground">represented</p>
          </CardContent>
        </Card>
      </div>

      {/* User Feedback Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5" />
              <span>User Feedback Management</span>
              <Badge variant="secondary" className="text-xs">
                {totalCount} entries
              </Badge>
              {activeFilterCount > 0 && (
                <Badge variant="default" className="text-xs">
                  <Filter className="w-3 h-3 mr-1" />
                  {activeFilterCount} active
                </Badge>
              )}
            </CardTitle>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Filters - Single Row */}
          <form onSubmit={(e) => e.preventDefault()} className="flex flex-wrap items-end gap-4 p-4 bg-muted/30 rounded-lg">
            {/* Page Route Filter */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Page Route
              </label>
              <Select
                value={filters.pageRoute}
                onValueChange={(value) => handleFilterChange("pageRoute", value)}
              >
                <SelectTrigger className="w-32 h-8">
                  <SelectValue placeholder="All Pages" />
                </SelectTrigger>
                <SelectContent>
                  {pageRoutes.map((route) => (
                    <SelectItem key={route.value} value={route.value}>
                      {route.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Username Filter */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Username
              </label>
              <Input
                placeholder="Search by username"
                value={usernameInput}
                onChange={(e) => {
                  e.preventDefault();
                  setUsernameInput(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                  }
                }}
                className="w-36 h-8"
                autoComplete="off"
              />
            </div>

            {/* From Date Filter */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                From Date
              </label>
              <Input
                type="date"
                value={filters.fromDate}
                onChange={(e) => handleFilterChange("fromDate", e.target.value)}
                className="w-32 h-8"
              />
            </div>

            {/* To Date Filter */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                To Date
              </label>
              <Input
                type="date"
                value={filters.toDate}
                onChange={(e) => handleFilterChange("toDate", e.target.value)}
                className="w-32 h-8"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2 ml-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isFilterLoading}
                className="h-8"
              >
                <RefreshCw className={cn("w-4 h-4", isFilterLoading && "animate-spin")} />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
                disabled={activeFilterCount === 0}
                className="h-8"
              >
                <X className="w-4 h-4" />
                Clear Filters
              </Button>
            </div>
          </form>

          {/* Loading State */}
          {isFilterLoading && (
            <div className="text-center py-4">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Filtering feedback...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-8 text-red-600">
              <p className="mb-2">{error}</p>
              <Button variant="outline" onClick={handleRefresh}>
                Try Again
              </Button>
            </div>
          )}

          {/* Feedback List */}
          {!isFilterLoading && !error && (
            <>
              {feedbackData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-2">No feedback found</p>
                  <p className="text-sm">Try adjusting your filters</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {feedbackData.map((feedback) => (
                    <Collapsible
                      key={feedback.id}
                      open={expandedFeedback === feedback.id}
                      onOpenChange={(open) =>
                        setExpandedFeedback(open ? feedback.id : null)
                      }
                    >
                      <div className="border border-border rounded-lg overflow-hidden">
                        <CollapsibleTrigger asChild>
                          <div className="flex items-center justify-between p-4 hover:bg-muted/50 cursor-pointer">
                            <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                <User className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <h3 className="font-semibold">
                                  {feedback.user?.full_name || "Unknown User"}
                                </h3>
                                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                  <span className="flex items-center space-x-1">
                                    <Calendar className="w-3 h-3" />
                                    <span>
                                      {new Date(feedback.created_at).toLocaleDateString()}
                                    </span>
                                  </span>
                                  <span className="flex items-center space-x-1">
                                    <Building className="w-3 h-3" />
                                    <span>
                                      {feedback.organization?.name || "Unknown Organization"}
                                    </span>
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              <div className="flex space-x-1">
                                {feedback.what_you_like && (
                                  <div className="w-2 h-2 bg-green-500 rounded-full" title="Likes" />
                                )}
                                {feedback.what_needs_improving && (
                                  <div className="w-2 h-2 bg-orange-500 rounded-full" title="Improvements" />
                                )}
                                {feedback.new_features_needed && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full" title="Feature Requests" />
                                )}
                              </div>
                              <Badge
                                variant="outline"
                                className={cn("text-xs", getRouteColor(feedback.page_route))}
                              >
                                {feedback.page_route}
                              </Badge>
                              <Badge
                                variant="outline"
                                className="text-xs bg-green-100 text-green-800"
                              >
                                Active
                              </Badge>
                              {expandedFeedback === feedback.id ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </div>
                          </div>
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                          <div className="px-4 pb-4 space-y-4 border-t border-border bg-muted/20">
                            {feedback.what_you_like && (
                              <div>
                                <h4 className="font-medium text-sm text-green-700 mb-2">
                                  What they like:
                                </h4>
                                <p className="text-sm leading-relaxed">
                                  {feedback.what_you_like}
                                </p>
                              </div>
                            )}

                            {feedback.what_needs_improving && (
                              <div>
                                <h4 className="font-medium text-sm text-orange-700 mb-2">
                                  What needs improving:
                                </h4>
                                <p className="text-sm leading-relaxed">
                                  {feedback.what_needs_improving}
                                </p>
                              </div>
                            )}

                            {feedback.new_features_needed && (
                              <div>
                                <h4 className="font-medium text-sm text-blue-700 mb-2">
                                  Feature requests:
                                </h4>
                                <p className="text-sm leading-relaxed">
                                  {feedback.new_features_needed}
                                </p>
                              </div>
                            )}
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalCount > 0 && (
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="text-sm text-muted-foreground">
                    Showing {startEntry}-{endEntry} of {totalCount} entries
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleFirstPage}
                      disabled={currentPage === 1}
                    >
                      <ChevronsLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>

                    <div className="flex items-center space-x-1">
                      {getPageNumbers().map((page, index) => (
                        <React.Fragment key={index}>
                          {page === '...' ? (
                            <span className="px-2 py-1 text-sm text-muted-foreground">
                              ...
                            </span>
                          ) : (
                            <Button
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePageChange(page as number)}
                              className="w-8 h-8 p-0"
                            >
                              {page}
                            </Button>
                          )}
                        </React.Fragment>
                      ))}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLastPage}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronsRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;