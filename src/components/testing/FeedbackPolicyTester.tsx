import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Shield,
  User,
  Crown,
  TestTube,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Plus,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { useSelector } from 'react-redux';

interface TestResult {
  operation: string;
  success: boolean;
  error?: string;
  data?: any;
}

interface FeedbackItem {
  id: string;
  user_id: string;
  auth_user_id: string;
  organization_id: string;
  page_route: string;
  what_you_like: string;
  what_needs_improving: string;
  new_features_needed: string;
  created_at: string;
}

export const FeedbackPolicyTester = () => {
  const { user, organizationDetails, userRole, authUserId } = useSelector((state) => state.auth);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [feedbackData, setFeedbackData] = useState<FeedbackItem[]>([]);
  const [isLoadingFeedback, setIsLoadingFeedback] = useState(false);
  const [testFeedback, setTestFeedback] = useState({
    what_you_like: 'Testing what I like',
    what_needs_improving: 'Testing improvements',
    new_features_needed: 'Testing new features'
  });

  // Get current auth status
  const [authStatus, setAuthStatus] = useState({
    supabaseUser: null,
    profileUser: null,
    userRole: null,
  });

  useEffect(() => {
    checkAuthStatus();
    loadFeedbackData();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Get Supabase Auth user
      const { data: { user: supabaseUser } } = await supabase.auth.getUser();
      
      // Get profile data
      let profileUser = null;
      if (supabaseUser) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select(`
            *,
            title:titles(name, role:roles(key, label))
          `)
          .eq('auth_user_id', supabaseUser.id);
        
        profileUser = profiles?.[0] || null;
      }

      setAuthStatus({
        supabaseUser,
        profileUser,
        userRole: profileUser?.title?.role?.key || 'unknown',
      });
    } catch (error) {
      console.error('Error checking auth status:', error);
    }
  };

  const loadFeedbackData = async () => {
    setIsLoadingFeedback(true);
    try {
      const { data, error } = await supabase
        .from('user_feedback_testing')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading feedback:', error);
        toast.error('Failed to load feedback: ' + error.message);
      } else {
        setFeedbackData(data || []);
      }
    } catch (error) {
      console.error('Error loading feedback:', error);
      toast.error('Failed to load feedback');
    } finally {
      setIsLoadingFeedback(false);
    }
  };

  const runTest = async (testName: string, testFunction: () => Promise<any>) => {
    try {
      const result = await testFunction();
      return {
        operation: testName,
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        operation: testName,
        success: false,
        error: error.message,
      };
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    const results: TestResult[] = [];

    // Test 1: Insert feedback
    const insertResult = await runTest('INSERT Feedback', async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) throw new Error('No authenticated user');

      const feedbackData = {
        user_id: user?.id,
        auth_user_id: currentUser.id,
        organization_id: user?.organization_id || organizationDetails?.id,
        page_url: window.location.href,
        page_route: 'Policy Test',
        what_you_like: testFeedback.what_you_like,
        what_needs_improving: testFeedback.what_needs_improving,
        new_features_needed: testFeedback.new_features_needed,
        session_id: `test_${Date.now()}`,
        user_agent: navigator.userAgent,
      };

      const { data, error } = await supabase
        .from('user_feedback_testing')
        .insert([feedbackData])
        .select()
        .single();

      if (error) throw error;
      return data;
    });
    results.push(insertResult);

    // Test 2: Select own feedback
    const selectOwnResult = await runTest('SELECT Own Feedback', async () => {
      const { data, error } = await supabase
        .from('user_feedback_testing')
        .select('*')
        .eq('user_id', user?.id);

      if (error) throw error;
      return { count: data?.length || 0, data };
    });
    results.push(selectOwnResult);

    // Test 3: Select all feedback (should work for admins, fail for regular users)
    const selectAllResult = await runTest('SELECT All Feedback', async () => {
      const { data, error } = await supabase
        .from('user_feedback_testing')
        .select('*');

      if (error) throw error;
      return { count: data?.length || 0, data };
    });
    results.push(selectAllResult);

    // Test 4: Update own feedback
    if (insertResult.success && insertResult.data) {
      const updateResult = await runTest('UPDATE Own Feedback', async () => {
        const { data, error } = await supabase
          .from('user_feedback_testing')
          .update({ what_you_like: 'Updated: Testing what I like' })
          .eq('id', insertResult.data.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      });
      results.push(updateResult);
    }

    // Test 5: Try to update someone else's feedback (should fail for non-admins)
    const updateOthersResult = await runTest('UPDATE Others Feedback', async () => {
      // Find feedback from another user
      const { data: otherFeedback } = await supabase
        .from('user_feedback_testing')
        .select('*')
        .neq('user_id', user?.id)
        .limit(1);

      if (!otherFeedback || otherFeedback.length === 0) {
        throw new Error('No other user feedback found to test');
      }

      const { data, error } = await supabase
        .from('user_feedback_testing')
        .update({ what_you_like: 'Trying to update others feedback' })
        .eq('id', otherFeedback[0].id)
        .select();

      if (error) throw error;
      return data;
    });
    results.push(updateOthersResult);

    // Test 6: Try to delete feedback (should only work for super_admin)
    if (insertResult.success && insertResult.data) {
      const deleteResult = await runTest('DELETE Feedback', async () => {
        const { error } = await supabase
          .from('user_feedback_testing')
          .delete()
          .eq('id', insertResult.data.id);

        if (error) throw error;
        return { deleted: true };
      });
      results.push(deleteResult);
    }

    setTestResults(results);
    setIsRunning(false);
    
    // Reload feedback data to see changes
    await loadFeedbackData();
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

  const getTestResultIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="w-4 h-4 text-green-600" />
    ) : (
      <XCircle className="w-4 h-4 text-red-600" />
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TestTube className="w-5 h-5" />
            <span>Feedback Policy Tester</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current User Status */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Profile User</span>
                </div>
                <p className="text-sm">{authStatus.profileUser?.full_name || 'Not found'}</p>
                <p className="text-xs text-muted-foreground">{authStatus.profileUser?.email || 'No email'}</p>
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
                  ID: {authStatus.supabaseUser?.id?.substring(0, 8) || 'None'}...
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
                  {authStatus.userRole}
                </Badge>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="tests" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="tests">Policy Tests</TabsTrigger>
              <TabsTrigger value="feedback">View Feedback</TabsTrigger>
              <TabsTrigger value="manual">Manual Test</TabsTrigger>
            </TabsList>

            <TabsContent value="tests" className="space-y-4">
              {/* Test Controls */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Policy Test Results</h3>
                <Button
                  onClick={runAllTests}
                  disabled={isRunning || !authStatus.supabaseUser}
                  className="flex items-center space-x-2"
                >
                  {isRunning ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <TestTube className="w-4 h-4" />
                  )}
                  <span>{isRunning ? 'Running Tests...' : 'Run Policy Tests'}</span>
                </Button>
              </div>

              {!authStatus.supabaseUser && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    You need to be authenticated with Supabase to run these tests. Please log in first.
                  </AlertDescription>
                </Alert>
              )}

              {/* Test Results */}
              {testResults.length > 0 && (
                <div className="space-y-3">
                  {testResults.map((result, index) => (
                    <Card key={index} className={result.success ? 'border-green-200' : 'border-red-200'}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {getTestResultIcon(result.success)}
                            <div>
                              <h4 className="font-medium">{result.operation}</h4>
                              {result.error && (
                                <p className="text-sm text-red-600">{result.error}</p>
                              )}
                              {result.success && result.data && (
                                <p className="text-sm text-green-600">
                                  {typeof result.data === 'object' 
                                    ? `Success: ${JSON.stringify(result.data).substring(0, 100)}...`
                                    : `Success: ${result.data}`
                                  }
                                </p>
                              )}
                            </div>
                          </div>
                          <Badge variant={result.success ? 'default' : 'destructive'}>
                            {result.success ? 'PASS' : 'FAIL'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Expected Results Guide */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Expected Results by Role</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <h4 className="font-medium flex items-center space-x-1 mb-2">
                        <User className="w-4 h-4" />
                        <span>Regular User</span>
                      </h4>
                      <ul className="space-y-1 text-xs text-muted-foreground">
                        <li>✅ INSERT: Should work</li>
                        <li>✅ SELECT Own: Should work</li>
                        <li>❌ SELECT All: Should fail</li>
                        <li>✅ UPDATE Own: Should work</li>
                        <li>❌ UPDATE Others: Should fail</li>
                        <li>❌ DELETE: Should fail</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium flex items-center space-x-1 mb-2">
                        <Shield className="w-4 h-4" />
                        <span>Org Admin</span>
                      </h4>
                      <ul className="space-y-1 text-xs text-muted-foreground">
                        <li>✅ INSERT: Should work</li>
                        <li>✅ SELECT Own: Should work</li>
                        <li>✅ SELECT All (Org): Should work</li>
                        <li>✅ UPDATE Own: Should work</li>
                        <li>✅ UPDATE Others (Org): Should work</li>
                        <li>❌ DELETE: Should fail</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium flex items-center space-x-1 mb-2">
                        <Crown className="w-4 h-4" />
                        <span>Super Admin</span>
                      </h4>
                      <ul className="space-y-1 text-xs text-muted-foreground">
                        <li>✅ INSERT: Should work</li>
                        <li>✅ SELECT Own: Should work</li>
                        <li>✅ SELECT All: Should work</li>
                        <li>✅ UPDATE Own: Should work</li>
                        <li>✅ UPDATE Others: Should work</li>
                        <li>✅ DELETE: Should work</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="feedback" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Current Feedback Data</h3>
                <Button
                  onClick={loadFeedbackData}
                  disabled={isLoadingFeedback}
                  variant="outline"
                  size="sm"
                >
                  {isLoadingFeedback ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Refresh
                </Button>
              </div>

              {isLoadingFeedback ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                  <p className="text-muted-foreground">Loading feedback...</p>
                </div>
              ) : feedbackData.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-muted-foreground">No feedback data found</p>
                    <p className="text-sm text-muted-foreground">
                      This could mean policies are working correctly and you can only see your own feedback
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
                              User ID: {feedback.user_id?.substring(0, 8)}...
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Auth ID: {feedback.auth_user_id?.substring(0, 8)}...
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(feedback.created_at).toLocaleString()}
                            </p>
                          </div>
                          <Badge variant="outline">
                            {feedback.user_id === user?.id ? 'Your Feedback' : 'Other User'}
                          </Badge>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          {feedback.what_you_like && (
                            <div>
                              <span className="font-medium text-green-600">Likes: </span>
                              <span>{feedback.what_you_like}</span>
                            </div>
                          )}
                          {feedback.what_needs_improving && (
                            <div>
                              <span className="font-medium text-orange-600">Improvements: </span>
                              <span>{feedback.what_needs_improving}</span>
                            </div>
                          )}
                          {feedback.new_features_needed && (
                            <div>
                              <span className="font-medium text-blue-600">Features: </span>
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

            <TabsContent value="manual" className="space-y-4">
              <h3 className="text-lg font-semibold">Manual Policy Test</h3>
              <p className="text-sm text-muted-foreground">
                Manually test feedback submission to verify policies are working correctly.
              </p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">What you like:</label>
                  <Textarea
                    value={testFeedback.what_you_like}
                    onChange={(e) => setTestFeedback(prev => ({ ...prev, what_you_like: e.target.value }))}
                    placeholder="Enter test feedback..."
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">What needs improving:</label>
                  <Textarea
                    value={testFeedback.what_needs_improving}
                    onChange={(e) => setTestFeedback(prev => ({ ...prev, what_needs_improving: e.target.value }))}
                    placeholder="Enter test feedback..."
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">New features needed:</label>
                  <Textarea
                    value={testFeedback.new_features_needed}
                    onChange={(e) => setTestFeedback(prev => ({ ...prev, new_features_needed: e.target.value }))}
                    placeholder="Enter test feedback..."
                    rows={2}
                  />
                </div>

                <Button
                  onClick={async () => {
                    const result = await runTest('Manual Feedback Submit', async () => {
                      const { data: { user: currentUser } } = await supabase.auth.getUser();
                      if (!currentUser) throw new Error('No authenticated user');

                      const feedbackData = {
                        user_id: user?.id,
                        auth_user_id: currentUser.id,
                        organization_id: user?.organization_id || organizationDetails?.id,
                        page_url: window.location.href,
                        page_route: 'Manual Policy Test',
                        what_you_like: testFeedback.what_you_like || null,
                        what_needs_improving: testFeedback.what_needs_improving || null,
                        new_features_needed: testFeedback.new_features_needed || null,
                        session_id: `manual_test_${Date.now()}`,
                        user_agent: navigator.userAgent,
                      };

                      const { data, error } = await supabase
                        .from('user_feedback_testing')
                        .insert([feedbackData])
                        .select()
                        .single();

                      if (error) throw error;
                      return data;
                    });

                    if (result.success) {
                      toast.success('Manual feedback submitted successfully!');
                      await loadFeedbackData();
                    } else {
                      toast.error('Failed to submit feedback: ' + result.error);
                    }
                  }}
                  disabled={!authStatus.supabaseUser}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Submit Test Feedback
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};