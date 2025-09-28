import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CreditCard,
  DollarSign,
  Calendar,
  CheckCircle,
  AlertCircle,
  Crown,
  Zap,
  Users,
  Clock,
  Download,
  Receipt,
  TrendingUp,
  Shield,
  Star,
  Plus,
  BarChart3,
  ExternalLink,
  X,
  Sparkles,
  Gift,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSelector } from "react-redux";
import { dbHelpers, supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const BillingComponent = () => {
  const { user, organizationDetails, isBetaUser } = useSelector((state) => state.auth);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [planDetails, setPlanDetails] = useState(null);
  const [planFeatures, setPlanFeatures] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);
  const [availablePlans, setAvailablePlans] = useState([]);

  useEffect(() => {
    loadPlanData();
  }, [user, isBetaUser]);

  const loadPlanData = async () => {
    try {
      setIsLoading(true);
      
      // Get user's current plan from user_plan table with plan_master details
      if (user?.id) {
        console.log('🔍 Loading plan data for user:', user.id);
        
        const { data: userPlanData, error: userPlanError } = await supabase
          .from("user_plan")
          .select(`
            *,
            plan_master (
              id,
              plan_name,
              description,
              price,
              currency,
              duration_days
            )
          `)
          .eq("user_id", user.id)
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(1);

        if (!userPlanError && userPlanData && userPlanData.length > 0) {
          const userPlan = userPlanData[0];
          const planMaster = userPlan.plan_master;
          
          console.log('📊 User plan data:', userPlan);
          console.log('📋 Plan master data:', planMaster);
          
          const endDate = new Date(userPlan.end_date);
          const today = new Date();
          const isExpired = endDate < today;
          const daysRemaining = Math.max(0, Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)));

          setPlanDetails({
            ...userPlan,
            ...planMaster,
            isExpired,
            daysRemaining,
            renewalDate: endDate.toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })
          });

          // Set current plan type based on plan_name
          if (planMaster.plan_name.toLowerCase().includes("free")) {
            setCurrentPlan("free");
            console.log('📋 User is on Free Plan');
          } else if (planMaster.plan_name.toLowerCase().includes("pro")) {
            setCurrentPlan("pro");
            console.log('📋 User is on Pro Plan');
          }
        } else {
          // Check old plan table for backward compatibility
          console.log('⚠️ No user_plan found, checking old plan table...');
          const { data: oldPlanData, error: oldPlanError } = await supabase
            .from("plan")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(1);

          if (!oldPlanError && oldPlanData && oldPlanData.length > 0) {
            const plan = oldPlanData[0];
            const endDate = new Date(plan.end_date);
            const today = new Date();
            const isExpired = endDate < today;
            const daysRemaining = Math.max(0, Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)));

            setPlanDetails({
              ...plan,
              isExpired,
              daysRemaining,
              renewalDate: endDate.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })
            });

            // Determine current plan type based on plan_name
            if (plan.plan_name === "Beta Trial" || plan.plan_name === "Free Plan") {
              setCurrentPlan("free");
              console.log('📋 User is on Free Plan (from old table)');
            } else {
              setCurrentPlan("pro");
              console.log('📋 User is on Pro Plan (from old table)');
            }
          } else {
            // Default to free plan if no plan found
            console.log('⚠️ No plan found, defaulting to free');
            setCurrentPlan("free");
          }
        }
      }
    } catch (error) {
      console.error("Error loading plan data:", error);
      setCurrentPlan("free");
    } finally {
      setIsLoading(false);
    }
  };

  const loadPlanFeatures = async (planMasterData) => {
    try {
      console.log('📊 Loading plan features from data:', planMasterData);
      
      if (planMasterData && planMasterData.length > 0) {
        setPlanFeatures(planMasterData);
        console.log('✅ Plan features loaded:', planMasterData);
      } else {
        console.warn('⚠️ No plan features data available');
        setPlanFeatures([]);
      }
    } catch (error) {
      console.error("Error loading plan features:", error);
      setPlanFeatures([]);
    }
  };

  // Load plan features when component mounts
  useEffect(() => {
    const fetchPlanFeatures = async () => {
      try {
        console.log('🔄 Fetching plan features from database...');
        
        const { data: planMasterData, error: planError } = await supabase
          .from("plan_master")
          .select(`
            id,
            plan_name,
            description,
            price,
            currency,
            duration_days,
            plan_features (
              feature_name,
              feature_description,
              is_included,
              feature_limit,
              display_order
            )
          `)
          .order("plan_name", { ascending: true });

        if (planError) {
          console.error('❌ Error fetching plan features:', planError);
          return;
        }

        console.log('📊 Raw plan data from database:', planMasterData);
        setAvailablePlans(planMasterData || []);
        await loadPlanFeatures(planMasterData || []);
      } catch (error) {
        console.error('❌ Error in fetchPlanFeatures:', error);
      }
    };

    fetchPlanFeatures();
  }, []);

  // Helper function to get features for a specific plan
  const getFeaturesForPlan = (planName) => {
    console.log('🔍 Getting features for plan:', planName);
    console.log('📊 Available plan features:', planFeatures);
    
    const plan = planFeatures.find(p => p.plan_name === planName);
    if (!plan || !plan.plan_features) {
      console.warn(`⚠️ No features found for plan: ${planName}`);
      return [];
    }
    
    console.log('✅ Found features for plan:', plan.plan_features);
    
    return plan.plan_features
      .sort((a, b) => a.display_order - b.display_order)
      .map(feature => ({
        name: feature.feature_name,
        description: feature.feature_description,
        included: feature.is_included,
        limit: feature.feature_limit
      }));
  };

  const handleUpgradeToPro = () => {
    console.log("Upgrade to Pro clicked");
    toast.info("Stripe integration coming soon!");
  };

  const handleManageSubscription = () => {
    console.log("Manage subscription clicked");
    toast.info("Stripe customer portal coming soon!");
  };

  const handleCancelSubscription = async () => {
    setIsCanceling(true);
    try {
      console.log("Cancel subscription clicked");
      // TODO: Implement actual cancellation logic with Stripe
      // This would typically:
      // 1. Cancel the Stripe subscription
      // 2. Update user_plan status to 'canceled'
      // 3. Set canceled_at timestamp
      toast.success("Subscription cancellation initiated");
      setShowCancelDialog(false);
    } catch (error) {
      console.error("Error canceling subscription:", error);
      toast.error("Failed to cancel subscription");
    } finally {
      setIsCanceling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading billing information...</p>
        </div>
      </div>
    );
  }

  const isPro = currentPlan === "pro";
  const isFree = currentPlan === "free";

  // Get plan data from available plans
  const freePlanData = availablePlans.find(p => p.plan_name.toLowerCase().includes("free"));
  const proPlanData = availablePlans.find(p => p.plan_name.toLowerCase().includes("pro"));

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Billing and subscription</h2>
      </div>

      {/* Workspace Subscription Section */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Workspace subscription</h3>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-muted-foreground mb-1">
                Your workspace is currently subscribed to the{" "}
                <span className="font-semibold text-foreground">
                  {planDetails?.plan_name || (isPro ? "Pro" : "Free Plan")}
                </span>{" "}
                plan.
              </p>
              {planDetails && (
                <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {planDetails.isExpired ? "Expired" : (isPro ? "Renews" : "Expires")} on {planDetails.renewalDate}.
                  </span>
                </div>
              )}
            </div>

            {/* Plan Card */}
            <div className="ml-8">
              <Card className="w-80 overflow-hidden border-0 shadow-lg">
                <div className={cn(
                  "h-32 flex items-center justify-center text-white relative",
                  isPro 
                    ? "bg-gradient-to-br from-blue-500 to-indigo-600"
                    : "bg-gradient-to-br from-green-500 to-emerald-600"
                )}>
                  <div className="text-center">
                    <h2 className="text-3xl font-bold mb-1">
                      {planDetails?.plan_name || (isPro ? "Pro" : "Free Plan")}
                    </h2>
                    {isPro && <p className="text-lg opacity-90">per user/month</p>}
                    {isFree && planDetails && (
                      <div className="flex items-center justify-center space-x-2">
                        <Sparkles className="w-5 h-5" />
                        <p className="text-lg opacity-90">{planDetails.daysRemaining} days left</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Plan Icon */}
                  <div className="absolute top-4 right-4">
                    {isPro ? (
                      <Crown className="w-8 h-8 opacity-80" />
                    ) : (
                      <Gift className="w-8 h-8 opacity-80" />
                    )}
                  </div>
                </div>

                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Plan Status */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <Badge className={cn(
                        "text-xs",
                        planDetails?.isExpired 
                          ? "bg-red-100 text-red-800 border-red-200"
                          : "bg-green-100 text-green-800 border-green-200"
                      )}>
                        {planDetails?.isExpired ? "Expired" : "Active"}
                      </Badge>
                    </div>

                    {/* Price */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Price</span>
                      <span className="font-semibold">
                        {planDetails?.price === 0 ? "Free" : `$${planDetails?.price || 49}/user/month`}
                      </span>
                    </div>

                    {/* Days Remaining / Next Billing */}
                    {planDetails && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          {isFree ? "Days remaining" : "Next billing"}
                        </span>
                        <span className={cn(
                          "font-semibold",
                          isFree && planDetails.daysRemaining <= 7 && "text-orange-600"
                        )}>
                          {isFree 
                            ? `${planDetails.daysRemaining} days`
                            : planDetails.renewalDate
                          }
                        </span>
                      </div>
                    )}

                    {/* Action Button */}
                    {isFree ? (
                      <Button 
                        onClick={handleUpgradeToPro}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                      >
                        <Crown className="w-4 h-4 mr-2" />
                        Upgrade to Pro
                      </Button>
                    ) : (
                      <Button 
                        onClick={handleManageSubscription}
                        variant="outline"
                        className="w-full"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Manage subscription in Stripe
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Trial Expiration Warning */}
        {isFree && planDetails?.daysRemaining <= 7 && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-orange-900 mb-2">
                    Your trial expires in {planDetails.daysRemaining} days
                  </h4>
                  <p className="text-sm text-orange-800 mb-4">
                    After your trial expires, you'll still be able to view your existing data, but you won't be able to process new transcripts, generate emails, or create presentations. Upgrade to Pro to continue using all features.
                  </p>
                  <Button 
                    onClick={handleUpgradeToPro}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade to Pro - $49/month
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Plan Comparison for Free Users */}
        {isFree && (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Available Plans</h4>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Free Plan Card */}
              <Card className="relative border-2 border-green-200 bg-green-50/50">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-green-100 text-green-800 border-green-200 px-3 py-1">
                    Current Plan
                  </Badge>
                </div>
                <CardHeader className="text-center pt-8">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Gift className="w-6 h-6 text-green-600" />
                  </div>
                  <CardTitle className="text-xl">{freePlanData?.plan_name || "Free Plan"}</CardTitle>
                  <div className="text-2xl font-bold text-green-600">
                    ${freePlanData?.price || 0}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {freePlanData?.duration_days || 30}-day trial
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {(() => {
                      const features = getFeaturesForPlan(freePlanData?.plan_name || "Free Plan");
                      console.log('🎯 Free plan features to display:', features);
                      return features.map((feature, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        {feature.included ? (
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        ) : (
                          <X className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <span className={cn(
                            "text-sm",
                            !feature.included && "text-orange-700"
                          )}>
                            {feature.name}
                          </span>
                          {feature.limit && (
                            <p className="text-xs text-muted-foreground">
                              {feature.limit}
                            </p>
                          )}
                          {feature.description && (
                            <p className="text-xs text-muted-foreground">
                              {feature.description}
                            </p>
                          )}
                        </div>
                      </div>
                      ));
                    })()}
                  </div>

                  <Button variant="outline" className="w-full" disabled>
                    Current Plan
                  </Button>
                </CardContent>
              </Card>

              {/* Pro Plan Card */}
              <Card className="relative border-2 border-blue-200 bg-blue-50/50">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200 px-3 py-1">
                    Upgrade Available
                  </Badge>
                </div>
                <CardHeader className="text-center pt-8">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Crown className="w-6 h-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">{proPlanData?.plan_name || "Pro"}</CardTitle>
                  <div className="text-2xl font-bold text-blue-600">
                    ${proPlanData?.price || 49}
                  </div>
                  <p className="text-sm text-muted-foreground">per user/month</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {(() => {
                      const features = getFeaturesForPlan(proPlanData?.plan_name || "Pro Plan");
                      console.log('🎯 Pro plan features to display:', features);
                      return features.map((feature, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm">{feature.name}</span>
                          {feature.limit && (
                            <p className="text-xs text-muted-foreground">
                              {feature.limit}
                            </p>
                          )}
                          {feature.description && (
                            <p className="text-xs text-muted-foreground">
                              {feature.description}
                            </p>
                          )}
                        </div>
                      </div>
                      ));
                    })()}
                  </div>

                  <Button 
                    onClick={handleUpgradeToPro}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade to Pro - ${proPlanData?.price || 49}/month
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>

        {/* Pro Plan Features for Pro Users */}
        {isPro && (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Your Pro Plan Features</h4>
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Crown className="w-5 h-5 text-blue-600" />
                  <span>Pro Plan Benefits</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {(() => {
                    const features = getFeaturesForPlan(proPlanData?.plan_name || "Pro Plan");
                    console.log('🎯 Pro user features to display:', features);
                    return features.map((feature, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium">{feature.name}</span>
                          {feature.limit && (
                            <p className="text-xs text-muted-foreground">
                              {feature.limit}
                            </p>
                          )}
                          {feature.description && (
                            <p className="text-xs text-muted-foreground">
                              {feature.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

      {/* Manage Subscription Section */}
      <div className="space-y-6">
        <Separator />
        
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Manage subscription</h3>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {isPro ? (
                <p className="text-muted-foreground mb-4">
                  You can get invoices, update your payment method, and adjust your subscription in Stripe.
                </p>
              ) : (
                <p className="text-muted-foreground mb-4">
                  Upgrade to Pro to unlock unlimited access to all features and remove trial limitations.
                </p>
              )}
            </div>
            
            <div className="ml-8 space-y-3">
              {isPro ? (
                <>
                  <Button 
                    onClick={handleManageSubscription}
                    variant="outline" 
                    className="w-full min-w-[200px]"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Manage subscription in Stripe
                  </Button>
                  
                  <Button 
                    onClick={() => setShowCancelDialog(true)}
                    variant="ghost" 
                    className="w-full text-muted-foreground hover:text-red-600"
                  >
                    Cancel subscription
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={handleUpgradeToPro}
                  className="w-full min-w-[200px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                >
                  <Crown className="w-4 h-4 mr-2" />
                  Upgrade to Pro - ${proPlanData?.price || 49}/month
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cancel Subscription Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span>Cancel Subscription</span>
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your Pro subscription? You'll lose access to all Pro features and return to the Free Plan at the end of your current billing period.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-medium text-red-900 mb-2">What happens when you cancel:</h4>
              <ul className="text-sm text-red-800 space-y-1">
                <li>• You'll keep Pro access until {planDetails?.renewalDate}</li>
                <li>• After that, you'll return to the Free Plan</li>
                <li>• Limited access to transcript processing</li>
                <li>• Limited email and presentation generation</li>
                <li>• You can resubscribe anytime</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
              disabled={isCanceling}
            >
              Keep Subscription
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelSubscription}
              disabled={isCanceling}
            >
              {isCanceling ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Canceling...
                </>
              ) : (
                "Cancel Subscription"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};