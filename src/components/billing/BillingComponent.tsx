import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  Gift
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSelector } from "react-redux";
import { dbHelpers } from "@/lib/supabase";

export const BillingComponent = () => {
  const { user, organizationDetails, isBetaUser } = useSelector((state) => state.auth);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [planDetails, setPlanDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Plan configurations
  const planConfigs = {
    free: {
      name: "Free Plan",
      price: 0,
      period: "30 days",
      description: "Full access for 30 days, then view-only",
      color: "from-green-500 to-emerald-600",
      icon: Gift,
      features: [
        "All AI insights and analysis",
        "Unlimited call transcript processing",
        "Email & presentation generation", 
        "HubSpot integration",
        "Research capabilities",
        "Full feature access for 30 days"
      ],
      limitations: [
        "After 30 days: View-only access",
        "Cannot process new transcripts after trial",
        "Cannot generate new content after trial"
      ]
    },
    pro: {
      name: "Pro",
      price: 49,
      period: "user/month",
      description: "Unlimited access to all features",
      color: "from-blue-500 to-indigo-600", 
      icon: Crown,
      features: [
        "Unlimited AI insights and analysis",
        "Unlimited call transcript processing",
        "Unlimited email & presentation generation",
        "Advanced HubSpot integration",
        "Unlimited research capabilities",
        "Priority support",
        "Advanced analytics",
        "Team collaboration features"
      ]
    }
  };

  useEffect(() => {
    loadPlanData();
  }, [user, isBetaUser]);

  const loadPlanData = async () => {
    try {
      setIsLoading(true);
      
      // Get user's plan from database
      if (user?.id) {
        const { data: planData, error } = await supabase
          .from("plan")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1);

        if (!error && planData && planData.length > 0) {
          const plan = planData[0];
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

          // Determine current plan type
          if (plan.plan_name === "Beta Trial" || plan.plan_name === "Free Plan") {
            setCurrentPlan(planConfigs.free);
          } else {
            setCurrentPlan(planConfigs.pro);
          }
        } else {
          // Default to free plan if no plan found
          setCurrentPlan(planConfigs.free);
        }
      }
    } catch (error) {
      console.error("Error loading plan data:", error);
      setCurrentPlan(planConfigs.free);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgradeToPro = () => {
    // TODO: Implement Stripe integration
    console.log("Upgrade to Pro clicked");
  };

  const handleManageSubscription = () => {
    // TODO: Implement Stripe customer portal
    console.log("Manage subscription clicked");
  };

  const handleCancelSubscription = () => {
    // TODO: Implement subscription cancellation
    console.log("Cancel subscription clicked");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading billing information...</p>
        </div>
      </div>
    );
  }

  const isPro = currentPlan?.name === "Pro";
  const isFree = currentPlan?.name === "Free Plan";
  const PlanIcon = currentPlan?.icon || Gift;

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
                  {currentPlan?.name}
                </span>{" "}
                plan.
              </p>
              {planDetails && (
                <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {isPro ? "Renews" : "Expires"} on {planDetails.renewalDate}.
                  </span>
                </div>
              )}
            </div>

            {/* Plan Card */}
            <div className="ml-8">
              <Card className="w-80 overflow-hidden border-0 shadow-lg">
                <div className={cn(
                  "h-32 flex items-center justify-center text-white relative",
                  `bg-gradient-to-br ${currentPlan?.color}`
                )}>
                  <div className="text-center">
                    <h2 className="text-3xl font-bold mb-1">{currentPlan?.name}</h2>
                    {isPro && <p className="text-lg opacity-90">Monthly</p>}
                    {isFree && (
                      <div className="flex items-center justify-center space-x-2">
                        <Sparkles className="w-5 h-5" />
                        <p className="text-lg opacity-90">Trial</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Plan Icon */}
                  <div className="absolute top-4 right-4">
                    <PlanIcon className="w-8 h-8 opacity-80" />
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
                        {isFree ? "Free" : `$${currentPlan?.price}/${currentPlan?.period}`}
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

                    {/* Trial Warning */}
                    {isFree && planDetails?.daysRemaining <= 7 && (
                      <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <AlertCircle className="w-4 h-4 text-orange-600" />
                          <span className="text-sm font-medium text-orange-800">
                            Trial ending soon
                          </span>
                        </div>
                        <p className="text-xs text-orange-700">
                          Upgrade to Pro to continue processing new content after your trial expires.
                        </p>
                      </div>
                    )}

                    {/* Upgrade Button */}
                    {isFree && (
                      <Button 
                        onClick={handleUpgradeToPro}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                      >
                        <Crown className="w-4 h-4 mr-2" />
                        Upgrade to Pro
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Plan Comparison */}
        {isFree && (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Available Plans</h4>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Free Plan */}
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
                  <CardTitle className="text-xl">Free Plan</CardTitle>
                  <div className="text-2xl font-bold text-green-600">Free</div>
                  <p className="text-sm text-muted-foreground">30-day trial</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {planConfigs.free.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-orange-800">After 30 days:</p>
                    {planConfigs.free.limitations.map((limitation, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <X className="w-4 h-4 text-orange-600" />
                        <span className="text-sm text-orange-700">{limitation}</span>
                      </div>
                    ))}
                  </div>

                  <Button variant="outline" className="w-full" disabled>
                    Current Plan
                  </Button>
                </CardContent>
              </Card>

              {/* Pro Plan */}
              <Card className="relative border-2 border-blue-200 bg-blue-50/50">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200 px-3 py-1">
                    Recommended
                  </Badge>
                </div>
                <CardHeader className="text-center pt-8">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Crown className="w-6 h-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">Pro</CardTitle>
                  <div className="text-2xl font-bold text-blue-600">$49</div>
                  <p className="text-sm text-muted-foreground">per user/month</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {planConfigs.pro.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-blue-600" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button 
                    onClick={handleUpgradeToPro}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    Upgrade to Pro
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Current Usage */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold">Current Usage</h4>
          <Card>
            <CardContent className="p-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Call Transcripts</span>
                    <span className="text-sm text-muted-foreground">
                      {isFree ? "12 processed" : "12 this month"}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className={cn(
                        "h-2 rounded-full transition-all duration-300",
                        isFree ? "bg-green-500" : "bg-blue-500"
                      )}
                      style={{ width: isFree ? "80%" : "24%" }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isFree ? "Full access during trial" : "Unlimited"}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">AI Insights</span>
                    <span className="text-sm text-muted-foreground">8 generated</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className={cn(
                      "h-2 rounded-full transition-all duration-300",
                      isFree ? "bg-green-500" : "bg-blue-500"
                    )} style={{ width: "15%" }} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isFree ? "Full access during trial" : "Unlimited"}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Research Reports</span>
                    <span className="text-sm text-muted-foreground">3 created</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className={cn(
                      "h-2 rounded-full transition-all duration-300",
                      isFree ? "bg-green-500" : "bg-blue-500"
                    )} style={{ width: "10%" }} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {isFree ? "Full access during trial" : "Unlimited"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Manage Subscription Section */}
      <div className="space-y-6">
        <Separator />
        
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Manage subscription</h3>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-muted-foreground mb-4">
                You can get invoices, update your payment method, and adjust your subscription in Stripe.
              </p>
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
                    onClick={handleCancelSubscription}
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
                  Upgrade to Pro
                </Button>
              )}
            </div>
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

      {/* Features Comparison */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold">What's included</h4>
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Gift className="w-5 h-5 text-green-600" />
                <span>Free Plan (30 days)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {planConfigs.free.features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
              
              <Separator className="my-3" />
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-orange-800">After trial:</p>
                {planConfigs.free.limitations.map((limitation, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <X className="w-4 h-4 text-orange-600" />
                    <span className="text-sm text-orange-700">{limitation}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50/50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Crown className="w-5 h-5 text-blue-600" />
                <span>Pro Plan</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {planConfigs.pro.features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
              
              <div className="pt-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 mb-1">$49</div>
                  <p className="text-sm text-muted-foreground">per user/month</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};