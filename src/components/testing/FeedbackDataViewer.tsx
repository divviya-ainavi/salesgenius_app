import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Shield,
  User,
  Crown,
  RefreshCw,
  Eye,
  Loader2,
  MessageSquare,
  Calendar,
  Building,
  AlertTriangle,
  CheckCircle,
  Database,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useSelector } from 'react-redux';

interface FeedbackItem {
  id: string;
  user_id: string;
  auth_user_id: string;
  organization_id: string;
  page_route: string;
  page_url: string;
  what_you_like: string;
  what_needs_improving: string;
  new_features_needed: string;
  session_id: string;
  user_agent: string;
  created_at: string;
  is_active: boolean;
}

interface QueryResult {
  success: boolean;
  data?: FeedbackItem[];
  error?: string;
  count: number;
}

export const FeedbackDataViewer = () => {
  const { user, organizationDetails, userRole } = useSelector((state) => state.auth);
  const [feedbackData, setFeedbackData] = useState<FeedbackItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [queryResults, setQueryResults] = useState<{
    allFeedback: QueryResult;
    ownFeedback: QueryResult;
    orgFeedback: QueryResult;
  }>({
    allFeedback: { success: false, count: 0 },
    ownFeedback: { success: false, count: 0 },
    orgFeedback: { success: false, count: 0 },
  });

  // Get current auth status
  const [authStatus, setAuthStatus] = useState({
    supabaseUser: null,
    profileUser: null,
    userRole: null,
  });

  useEffect(() => {
    checkAuthStatus();
    runAllQueries();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Get Supabase Auth user
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
      
      // Get profile data with role information
      let profileUser = null;
      let userRoleKey = null;
      
      if (supabaseUser) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select(`
            *,
            title:titles(
              name,
              role:roles(key, label)
            )
          `)
          .eq('auth_user_id', supabaseUser.id);
        
        profileUser = profiles?.[0] || null;
        userRoleKey = profileUser?.title?.role?.key || 'unknown';
      }

      setAuthStatus({
        supabaseUser,
        profileUser,
        userRole: userRoleKey,
      });
    } catch (error) {
      console.error('Error checking auth status:', error);
    }
  };

  const runAllQueries = async () => {
    setIsLoading(true);
    
    const results = {
      allFeedback: await queryAllFeedback(),
      ownFeedback: await queryOwnFeedback(),
      orgFeedback: await queryOrgFeedback(),
    };
    
    setQueryResults(results);
    
    // Set the data from the most successful query
    if (results.allFeedback.success) {
      setFeedbackData(results.allFeedback.data || []);
    } else if (results.orgFeedback.success) {
      setFeedbackData(results.orgFeedback.data || []);
    } else if (results.ownFeedback.success) {
      setFeedbackData(results.ownFeedback.data || []);
    }
    
    setIsLoading(false);
  };

  // Query 1: Try to get ALL feedback (should only work for super_admin)
  const queryAllFeedback = async (): Promise<QueryResult> => {
    try {
      console.log('🔍 Querying ALL feedback...');
      
      const { data, error } = await supabase
        .from('user_feedback_testing')
        .select(`
          *,
          profile:profiles!user_feedback_testing_user_id_fkey(
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Query ALL feedback failed:', error);
        return {
          success: false,
          error: error.message,
          count: 0,
        };
      }

      console.log('✅ Query ALL feedback succeeded:', data?.length || 0, 'records');
      return {
        success: true,
        data: data || [],
        count: data?.length || 0,
      };
    } catch (error) {
      console.error('❌ Query ALL feedback error:', error);
      return {
        success: false,
        error: error.message,
        count: 0,
      };
    }
  };

  // Query 2: Try to get OWN feedback only
  const queryOwnFeedback = async (): Promise<QueryResult> => {
    try {
      console.log('🔍 Querying OWN feedback...');
      
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        throw new Error('No authenticated user');
      }

      const { data, error } = await supabase
        .from('user_feedback_testing')
        .select(`
          *,
          profile:profiles!user_feedback_testing_user_id_fkey(
            full_name,
            email
          )
        `)
        .eq('auth_user_id', authUser.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Query OWN feedback failed:', error);
        return {
          success: false,
          error: error.message,
          count: 0,
        };
      }

      console.log('✅ Query OWN feedback succeeded:', data?.length || 0, 'records');
      return {
        success: true,
        data: data || [],
        count: data?.length || 0,
      };
    } catch (error) {
      console.error('❌ Query OWN feedback error:', error);
      return {
        success: false,
        error: error.message,
        count: 0,
      };
    }
  };

  // Query 3: Try to get ORGANIZATION feedback (should work for org_admin)
  const queryOrgFeedback = async (): Promise<QueryResult> => {
    try {
      console.log('🔍 Querying ORGANIZATION feedback...');
      
      if (!organizationDetails?.id) {
        throw new Error('No organization ID available');
      }

      const { data, error } = await supabase
        .from('user_feedback_testing')
        .select(`
          *,
          profile:profiles!user_feedback_testing_user_id_fkey(
            full_name,
            email
          )
        `)
        .eq('organization_id', organizationDetails.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Query ORGANIZATION feedback failed:', error);
        return {
          success: false,
          error: error.message,
          count: 0,
        };
      }

      console.log('✅ Query ORGANIZATION feedback succeeded:', data?.length || 0, 'records');
      return {
        success: true,
        data: data || [],
        count: data?.length || 0,
      };
    } catch (error) {
      console.error('❌ Query ORGANIZATION feedback error:', error);
      return {
        success: false,
        error: error.message,
        count: 0,
      };
    }
  };

  const getRoleIcon = (roleKey: string) => {
    switch (roleKey) {
      case 'super_admin':
        return Crown;
      case 'org_admin':
        return Shield;
      default:
        return User;
    }
  };

  const getRoleColor = (roleKey: string) => {
    switch (roleKey) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'org_admin':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getQueryResultBadge = (result: QueryResult) => {
    if (result.success) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Success ({result.count})
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Failed
        </Badge>
      );
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="w-5 h-5" />
            <span>Feedback Data Access Test</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current User Status */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Current User</span>
                </div>
                <p className="text-sm font-semibold">{authStatus.profileUser?.full_name || 'Not found'}</p>
                <p className="text-xs text-muted-foreground">{authStatus.profileUser?.email || 'No email'}</p>
                <p className="text-xs text-muted-foreground">
                  Profile ID: {authStatus.profileUser?.id?.substring(0, 8) || 'None'}...
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Supabase Auth</span>
                </div>
                <p className="text-sm">{authStatus.supabaseUser?.email || 'Not authenticated'}</p>
                <p className="text-xs text-muted-foreground">
                  Auth ID: {authStatus.supabaseUser?.id?.substring(0, 8) || 'None'}...
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-2">
                  {React.createElement(getRoleIcon(authStatus.userRole), {
                    className: "w-4 h-4 text-muted-foreground"
                  })}
                  <span className="text-sm font-medium">Role</span>
                </div>
                <Badge variant="outline" className={getRoleColor(authStatus.userRole)}>
                  {authStatus.userRole || 'Unknown'}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  Title: {authStatus.profileUser?.title?.name || 'None'}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Query Results Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Query Access Results</span>
                <Button
                  onClick={runAllQueries}
                  disabled={isLoading}
                  variant="outline"
                  size="sm"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Test Queries
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">All Feedback</span>
                    {getQueryResultBadge(queryResults.allFeedback)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Should only work for super_admin
                  </p>
                  {queryResults.allFeedback.error && (
                    <p className="text-xs text-red-600">{queryResults.allFeedback.error}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Own Feedback</span>
                    {getQueryResultBadge(queryResults.ownFeedback)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Should work for all authenticated users
                  </p>
                  {queryResults.ownFeedback.error && (
                    <p className="text-xs text-red-600">{queryResults.ownFeedback.error}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Org Feedback</span>
                    {getQueryResultBadge(queryResults.orgFeedback)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Direct org query (may work based on policies)
                  </p>
                  {queryResults.orgFeedback.error && (
                    <p className="text-xs text-red-600">{queryResults.orgFeedback.error}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Expected vs Actual Results */}
          <Card>
            <CardHeader>
              <CardTitle>Expected Access Levels</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <h4 className="font-medium flex items-center space-x-1 mb-2">
                    <Crown className="w-4 h-4 text-purple-600" />
                    <span>Super Admin</span>
                  </h4>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    <li>✅ Can see ALL feedback</li>
                    <li>✅ Can see own feedback</li>
                    <li>✅ Can see org feedback</li>
                    <li>✅ Full CRUD access</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium flex items-center space-x-1 mb-2">
                    <Shield className="w-4 h-4 text-blue-600" />
                    <span>Org Admin</span>
                  </h4>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    <li>❌ Cannot see ALL feedback</li>
                    <li>✅ Can see own feedback</li>
                    <li>❓ May see org feedback</li>
                    <li>✅ CRUD own data only</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium flex items-center space-x-1 mb-2">
                    <User className="w-4 h-4 text-gray-600" />
                    <span>Regular User</span>
                  </h4>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    <li>❌ Cannot see ALL feedback</li>
                    <li>✅ Can see own feedback</li>
                    <li>❌ Cannot see org feedback</li>
                    <li>✅ CRUD own data only</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feedback Data Display */}
          <Tabs defaultValue="data" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="data">Feedback Data</TabsTrigger>
              <TabsTrigger value="queries">Raw Queries</TabsTrigger>
            </TabsList>

            <TabsContent value="data" className="space-y-4">
              {isLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                  <p className="text-muted-foreground">Loading feedback data...</p>
                </div>
              ) : feedbackData.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
                    <p className="text-muted-foreground mb-2">No feedback data accessible</p>
                    <p className="text-sm text-muted-foreground">
                      This could mean policies are working correctly and limiting your access
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {feedbackData.map((feedback) => (
                    <Card key={feedback.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-medium">{feedback.page_route}</h4>
                            <p className="text-sm text-muted-foreground">
                              {feedback.profile?.full_name || 'Unknown User'} ({feedback.profile?.email || 'No email'})
                            </p>
                            <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-1">
                              <span>User ID: {feedback.user_id?.substring(0, 8)}...</span>
                              <span>Auth ID: {feedback.auth_user_id?.substring(0, 8)}...</span>
                              <span>
                                <Calendar className="w-3 h-3 inline mr-1" />
                                {new Date(feedback.created_at).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col space-y-1">
                            <Badge variant="outline">
                              {feedback.user_id === user?.id ? 'Your Feedback' : 'Other User'}
                            </Badge>
                            {feedback.organization_id === organizationDetails?.id && (
                              <Badge variant="outline" className="text-xs">
                                Same Org
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          {feedback.what_you_like && (
                            <div>
                              <span className="font-medium text-green-600">👍 Likes: </span>
                              <span>{feedback.what_you_like}</span>
                            </div>
                          )}
                          {feedback.what_needs_improving && (
                            <div>
                              <span className="font-medium text-orange-600">🔧 Improvements: </span>
                              <span>{feedback.what_needs_improving}</span>
                            </div>
                          )}
                          {feedback.new_features_needed && (
                            <div>
                              <span className="font-medium text-blue-600">💡 Features: </span>
                              <span>{feedback.new_features_needed}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="queries" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">SQL Queries You Can Run</h3>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Query 1: All Feedback (Super Admin Only)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`-- This should only work for super_admin
SELECT * FROM user_feedback_testing 
ORDER BY created_at DESC;

-- With user details
SELECT 
  uf.*,
  p.full_name,
  p.email
FROM user_feedback_testing uf
LEFT JOIN profiles p ON uf.user_id = p.id
ORDER BY uf.created_at DESC;`}
                    </pre>
                    <div className="mt-2">
                      {getQueryResultBadge(queryResults.allFeedback)}
                      {queryResults.allFeedback.error && (
                        <p className="text-xs text-red-600 mt-1">{queryResults.allFeedback.error}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Query 2: Own Feedback (All Users)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`-- This should work for all authenticated users
SELECT * FROM user_feedback_testing 
WHERE auth_user_id = auth.uid()
ORDER BY created_at DESC;`}
                    </pre>
                    <div className="mt-2">
                      {getQueryResultBadge(queryResults.ownFeedback)}
                      {queryResults.ownFeedback.error && (
                        <p className="text-xs text-red-600 mt-1">{queryResults.ownFeedback.error}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Query 3: Organization Feedback</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
{`-- This may work based on your role
SELECT * FROM user_feedback_testing 
WHERE organization_id = '${organizationDetails?.id || 'your-org-id'}'
ORDER BY created_at DESC;`}
                    </pre>
                    <div className="mt-2">
                      {getQueryResultBadge(queryResults.orgFeedback)}
                      {queryResults.orgFeedback.error && (
                        <p className="text-xs text-red-600 mt-1">{queryResults.orgFeedback.error}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Instructions */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>How to test:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                <li>Submit some feedback using the feedback widget</li>
                <li>Click "Test Queries" to see what data you can access</li>
                <li>Compare results with expected access levels above</li>
                <li>Try with different user roles to verify policies</li>
              </ol>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default FeedbackDataViewer;