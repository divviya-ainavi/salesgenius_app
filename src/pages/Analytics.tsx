import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Target,
  Calendar,
  MessageSquare,
  RefreshCw,
  Filter,
  X,
  ChevronDown,
  ChevronRight,
  User,
  Loader2,
  AlertCircle,
  ThumbsUp,
  Lightbulb,
  AlertTriangle,
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { usePageTimer } from '@/hooks/userPageTimer';
import { dbHelpers, CURRENT_USER } from '@/lib/supabase';
import { useSelector } from 'react-redux';

interface FeedbackEntry {
  id: string;
  user_id: string;
  username: string;
  page_url: string;
  page_route: string;
  what_you_like: string | null;
  what_needs_improving: string | null;
  new_features_needed: string | null;
  created_at: string;
  is_active: boolean;
}

interface FeedbackFilters {
  pageRoute: string;
  username: string;
  fromDate: string;
  toDate: string;
}

export const Analytics = () => {
  usePageTimer('Analytics');

  // Get user role from Redux store
  const { userRoleId } = useSelector((state: any) => state.auth);
  const isSuperAdmin = userRoleId === null; // Super admin has null title_id

  // Feedback Management State
  const [feedbackData, setFeedbackData] = useState<FeedbackEntry[]>([]);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [expandedFeedback, setExpandedFeedback] = useState<string | null>(null);

  // Filter State
  const [filters, setFilters] = useState<FeedbackFilters>({
    pageRoute: '',
    username: '',
    fromDate: '',
    toDate: '',
  });

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // Available page routes for filter dropdown
  const [availableRoutes, setAvailableRoutes] = useState<string[]>([]);

  // Load feedback data
  const loadFeedbackData = async () => {
    if (!isSuperAdmin) return;

    setIsLoadingFeedback(true);
    setFeedbackError(null);

    try {
      // Calculate offset for pagination
      const offset = (currentPage - 1) * itemsPerPage;

      // Prepare filter parameters
      const filterParams = {
        pageRoute: filters.pageRoute || undefined,
        username: filters.username || undefined,
        fromDate: filters.fromDate || undefined,
        toDate: filters.toDate || undefined,
        limit: itemsPerPage,
        offset: offset,
      };

      // Load feedback data
      const data = await dbHelpers.getAllUserFeedback(filterParams);
      setFeedbackData(data || []);

      // Set total items (for now, we'll use the returned data length)
      // In a real implementation, you'd get the total count from a separate query
      setTotalItems(data?.length || 0);

      // Load available routes for filter dropdown
      if (availableRoutes.length === 0) {
        const routes = await dbHelpers.getUniquePageRoutes();
        setAvailableRoutes(routes || []);
      }

    } catch (error) {
      console.error('Error loading feedback data:', error);
      setFeedbackError(error instanceof Error ? error.message : 'Failed to load feedback data');
      toast.error('Failed to load feedback data');
    } finally {
      setIsLoadingFeedback(false);
    }
  };

  // Load data on component mount and when filters/pagination change
  useEffect(() => {
    if (isSuperAdmin) {
      loadFeedbackData();
    }
  }, [isSuperAdmin, currentPage, filters]);

  // Handle filter changes
  const handleFilterChange = (field: keyof FeedbackFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
    }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Handle clear filters
  const handleClearFilters = () => {
    setFilters({
      pageRoute: '',
      username: '',
      fromDate: '',
      toDate: '',
    });
    setCurrentPage(1);
  };

  // Handle refresh
  const handleRefresh = () => {
    loadFeedbackData();
  };

  // Handle feedback expansion
  const handleToggleFeedback = (feedbackId: string) => {
    setExpandedFeedback(prev => prev === feedbackId ? null : feedbackId);
  };

  // Pagination calculations
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Check if any filters are active
  const hasActiveFilters = Object.values(filters).some(value => value.trim() !== '');
  const activeFilterCount = Object.values(filters).filter(value => value.trim() !== '').length;

  // Get feedback category indicators
  const getFeedbackCategories = (feedback: FeedbackEntry) => {
    const categories = [];
    if (feedback.what_you_like) categories.push({ type: 'like', color: 'bg-green-500' });
    if (feedback.what_needs_improving) categories.push({ type: 'improve', color: 'bg-orange-500' });
    if (feedback.new_features_needed) categories.push({ type: 'feature', color: 'bg-blue-500' });
    return categories;
  };

  // Pagination component
  const PaginationControls = () => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
      const pages = [];
      const maxVisible = 5;
      
      if (totalPages <= maxVisible) {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        if (currentPage <= 3) {
          pages.push(1, 2, 3, 4, '...', totalPages);
        } else if (currentPage >= totalPages - 2) {
          pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
        } else {
          pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
        }
      }
      
      return pages;
    };

    return (
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
        <div className="text-sm text-muted-foreground">
          Showing {startItem}-{endItem} of {totalItems} entries
        </div>
        
        <div className="flex items-center space-x-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
          >
            <ChevronsLeft className="w-4 h-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          {getPageNumbers().map((page, index) => (
            <Button
              key={index}
              variant={currentPage === page ? "default" : "outline"}
              size="sm"
              onClick={() => typeof page === 'number' && setCurrentPage(page)}
              disabled={page === '...'}
              className="min-w-[32px]"
            >
              {page}
            </Button>
          ))}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
          >
            <ChevronsRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
        <p className="text-muted-foreground">
          Track performance metrics and user engagement across your sales activities
        </p>
      </div>

      {/* Dashboard Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Revenue</span>
            </div>
            <p className="text-2xl font-bold mt-1">$124,500</p>
            <p className="text-xs text-green-600">+12% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Deals Closed</span>
            </div>
            <p className="text-2xl font-bold mt-1">23</p>
            <p className="text-xs text-green-600">+8% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Active Prospects</span>
            </div>
            <p className="text-2xl font-bold mt-1">156</p>
            <p className="text-xs text-blue-600">+5% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Conversion Rate</span>
            </div>
            <p className="text-2xl font-bold mt-1">18.5%</p>
            <p className="text-xs text-green-600">+2.3% from last month</p>
          </CardContent>
        </Card>
      </div>

      {/* User Feedback Management - Only for Super Admin */}
      {isSuperAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-5 h-5" />
                <span>User Feedback Management</span>
                <Badge variant="outline" className="text-xs">
                  {totalItems} entries
                </Badge>
                {hasActiveFilters && (
                  <Badge variant="secondary" className="text-xs">
                    {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active
                  </Badge>
                )}
              </div>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Single Row Filters */}
            <div className="flex flex-wrap items-center gap-3 p-3 bg-gradient-to-r from-muted/30 to-muted/10 rounded-lg border">
              {/* Page Route Filter */}
              <div className="flex flex-col space-y-1">
                <label className="sr-only">Page Route</label>
                <span className="text-xs font-medium text-muted-foreground">Page Route</span>
                <Select value={filters.pageRoute} onValueChange={(value) => handleFilterChange('pageRoute', value)}>
                  <SelectTrigger className="w-32 h-8">
                    <SelectValue placeholder="All Pages" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Pages</SelectItem>
                    {availableRoutes.map((route) => (
                      <SelectItem key={route} value={route}>
                        <div className="flex items-center space-x-2">
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            route === '/analytics' ? 'bg-blue-500' :
                            route === '/calls' ? 'bg-green-500' :
                            route === '/research' ? 'bg-purple-500' :
                            route === '/settings' ? 'bg-orange-500' :
                            'bg-gray-500'
                          )} />
                          <span>{route}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Username Filter */}
              <div className="flex flex-col space-y-1">
                <label className="sr-only">Username</label>
                <span className="text-xs font-medium text-muted-foreground">Username</span>
                <div className="relative">
                  <User className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground w-3 h-3" />
                  <Input
                    placeholder="Search by username"
                    value={filters.username}
                    onChange={(e) => handleFilterChange('username', e.target.value)}
                    className="w-36 h-8 pl-7 text-xs"
                  />
                </div>
              </div>

              {/* From Date Filter */}
              <div className="flex flex-col space-y-1">
                <label className="sr-only">From Date</label>
                <span className="text-xs font-medium text-muted-foreground">From Date</span>
                <Input
                  type="date"
                  value={filters.fromDate}
                  onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                  className="w-36 h-8 text-xs"
                />
              </div>

              {/* To Date Filter */}
              <div className="flex flex-col space-y-1">
                <label className="sr-only">To Date</label>
                <span className="text-xs font-medium text-muted-foreground">To Date</span>
                <Input
                  type="date"
                  value={filters.toDate}
                  onChange={(e) => handleFilterChange('toDate', e.target.value)}
                  className="w-36 h-8 text-xs"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 ml-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isLoadingFeedback}
                  className="h-8 px-3"
                >
                  {isLoadingFeedback ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3 h-3" />
                  )}
                  <span className="ml-1 text-xs">Refresh</span>
                </Button>

                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearFilters}
                    className="h-8 px-3"
                  >
                    <X className="w-3 h-3" />
                    <span className="ml-1 text-xs">Clear Filters</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Feedback Entries */}
            {isLoadingFeedback ? (
              <div className="text-center py-8">
                <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading feedback data...</p>
              </div>
            ) : feedbackError ? (
              <div className="text-center py-8">
                <AlertCircle className="w-8 h-8 mx-auto mb-4 text-destructive" />
                <p className="text-destructive mb-2">Error loading feedback</p>
                <p className="text-sm text-muted-foreground">{feedbackError}</p>
                <Button variant="outline" onClick={handleRefresh} className="mt-4">
                  Try Again
                </Button>
              </div>
            ) : feedbackData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="mb-2">No feedback entries found</p>
                <p className="text-sm">
                  {hasActiveFilters ? 'Try adjusting your filters' : 'No user feedback has been submitted yet'}
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {feedbackData.map((feedback) => {
                  const categories = getFeedbackCategories(feedback);
                  const isExpanded = expandedFeedback === feedback.id;

                  return (
                    <Collapsible key={feedback.id} open={isExpanded} onOpenChange={() => handleToggleFeedback(feedback.id)}>
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-accent/50 cursor-pointer transition-colors">
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                              <User className="w-3 h-3 text-primary" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <h4 className="font-medium text-sm truncate">{feedback.username}</h4>
                                <div className="flex items-center space-x-1">
                                  {categories.map((cat, idx) => (
                                    <div key={idx} className={cn("w-2 h-2 rounded-full", cat.color)} />
                                  ))}
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                <span className="flex items-center space-x-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>{new Date(feedback.created_at).toLocaleDateString()}</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <div className={cn(
                                    "w-2 h-2 rounded-full",
                                    feedback.page_route === '/analytics' ? 'bg-blue-500' :
                                    feedback.page_route === '/calls' ? 'bg-green-500' :
                                    feedback.page_route === '/research' ? 'bg-purple-500' :
                                    feedback.page_route === '/settings' ? 'bg-orange-500' :
                                    'bg-gray-500'
                                  )} />
                                  <span>{feedback.page_route}</span>
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs bg-green-100 text-green-800 border-green-200">
                              Active
                            </Badge>
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </CollapsibleTrigger>

                      <CollapsibleContent className="px-3 pb-3">
                        <div className="mt-3 pt-3 border-t border-border space-y-3">
                          {feedback.what_you_like && (
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <ThumbsUp className="w-4 h-4 text-green-600" />
                                <span className="text-sm font-medium">What they like:</span>
                              </div>
                              <p className="text-sm text-muted-foreground pl-6 leading-relaxed">
                                {feedback.what_you_like}
                              </p>
                            </div>
                          )}

                          {feedback.what_needs_improving && (
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <AlertTriangle className="w-4 h-4 text-orange-600" />
                                <span className="text-sm font-medium">Needs improving:</span>
                              </div>
                              <p className="text-sm text-muted-foreground pl-6 leading-relaxed">
                                {feedback.what_needs_improving}
                              </p>
                            </div>
                          )}

                          {feedback.new_features_needed && (
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <Lightbulb className="w-4 h-4 text-blue-600" />
                                <span className="text-sm font-medium">Feature requests:</span>
                              </div>
                              <p className="text-sm text-muted-foreground pl-6 leading-relaxed">
                                {feedback.new_features_needed}
                              </p>
                            </div>
                          )}

                          <div className="pt-2 border-t border-border">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>Submitted: {new Date(feedback.created_at).toLocaleString()}</span>
                              <span>Page: {feedback.page_url}</span>
                            </div>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            <PaginationControls />
          </CardContent>
        </Card>
      )}

      {/* Additional Analytics Content */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Performance Trends</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Performance charts coming soon</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>User Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>User activity metrics coming soon</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};