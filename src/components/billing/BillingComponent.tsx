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
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSelector } from "react-redux";
import { dbHelpers, supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const BillingComponent = () => {
  const { user, organizationDetails, isBetaUser } = useSelector(
    (state) => state.auth
  );
  const [currentPlan, setCurrentPlan] = useState(null);
  const [planDetails, setPlanDetails] = useState(null);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

  useEffect(() => {
    loadPlanData();
    loadAvailablePlans();
  }, [user, isBetaUser]);

  const loadAvailablePlans = async () => {
    try {
      console.log("🔍 Loading all available plans from plan_master...");
      
      const { data: plansData, error: plansError } = await supabase
        .from("plan_master")
        .select("*")
        .order("price", { ascending: true });
      
      if (plansError) {
        console.error("❌ Error loading plans:", plansError);
        return;
      }
      
      console.log("✅ Available plans loaded:", plansData);
      setAvailablePlans(plansData || []);
    } catch (error) {
      console.error("Error loading available plans:", error);
      setAvailablePlans([]);
    }
  };

  const loadPlanData = async () => {
    try {
      setIsLoading(true);

      // Get user's current plan from user_plan table with plan_master and features
      if (user?.id) {
        console.log("🔍 Loading plan data for user:", user.id);

        const { data: userPlanData, error: userPlanError } = await supabase
          .from("user_plan")
          .select(
            `
            *,
            plan_master (
              id,
              plan_name,
              description,
              price,
              currency,
              duration_days,
              features
            )
          `
          )
          .eq("user_id", user.id)
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(1);

        if (!userPlanError && userPlanData && userPlanData.length > 0) {
          const userPlan = userPlanData[0];
          const planMaster = userPlan.plan_master;

          console.log("📊 User plan data:", userPlan);
          console.log("📋 Plan master data:", planMaster);
          console.log("🎯 Current plan features:", planMaster?.features);

          const endDate = new Date(userPlan.end_date);
          const today = new Date();
          const isExpired = endDate < today;
          const daysRemaining = Math.max(
            0,
            Math.ceil((endDate - today) / (1000 * 60 * 60 * 24))
          );

          setPlanDetails({
            ...userPlan,
            ...planMaster,
            isExpired,
            daysRemaining,
            renewalDate: endDate.toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
            features: planMaster?.features || [],
            planMasterId: planMaster?.id,
          });

          // Set current plan to the actual plan master data
          setCurrentPlan(planMaster);
          console.log("📋 Current plan set to:", planMaster?.plan_name);
        } else {
          // Check old plan table for backward compatibility
          console.log("⚠️ No user_plan found, checking old plan table...");
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
            const daysRemaining = Math.max(
              0,
              Math.ceil((endDate - today) / (1000 * 60 * 60 * 24))
            );

            setPlanDetails({
              ...plan,
              plan_name: plan.plan_name,
              isExpired,
              daysRemaining,
              renewalDate: endDate.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              }),
              features: [],
              planMasterId: null,
            });

            // For old plan table, create a mock plan object
            setCurrentPlan({
              plan_name: plan.plan_name,
              price: 0,
              features: [],
            });
            console.log("📋 Current plan set from old table:", plan.plan_name);
          } else {
            // No plan found
            console.log("⚠️ No plan found");
            setCurrentPlan(null);
          }
        }
      }
    } catch (error) {
      console.error("Error loading plan data:", error);
      setCurrentPlan(null);
    } finally {
      setIsLoading(false);
    }
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

  const isFreePlan = (plan) => {
    if (!plan) return true;
    const planName = plan.plan_name?.toLowerCase() || "";
    return planName.includes("free") || 
           planName.includes("trial") || 
           planName.includes("beta");
  };

  const isProPlan = (plan) => {
    if (!plan) return false;
    const planName = plan.plan_name?.toLowerCase() || "";
    return planName.includes("pro") || 
           planName.includes("standard") || 
           planName.includes("premium");
  };

  const getPlanIcon = (plan) => {
    if (isFreePlan(plan)) return Gift;
    if (isProPlan(plan)) return Crown;
    return Star;
  };

  const getPlanGradient = (plan) => {
    if (isFreePlan(plan)) return "from-green-500 to-emerald-600";
    if (isProPlan(plan)) return "from-blue-500 to-indigo-600";
    return "from-purple-500 to-pink-600";
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-primary" />
          <p className="text-muted-foreground">
            Loading billing information...
          </p>
        </div>
      </div>
    );
  }

  const isPro = isProPlan(currentPlan);
  const isFree = isFreePlan(currentPlan);
  
  // Get other available plans (excluding current plan)
  const otherPlans = availablePlans.filter(plan => 
    plan.id !== planDetails?.planMasterId
  );

  console.log("🎯 Current plan:", currentPlan);
  console.log("🎯 Available plans:", availablePlans);
  console.log("🎯 Other plans:", otherPlans);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Billing and subscription
        </h2>
      </div>

      {/* Workspace Subscription Section */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Workspace subscription
          </h3>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-muted-foreground mb-1">
                Your workspace is currently subscribed to the{" "}
                <span className="font-semibold text-foreground">
                  {currentPlan?.plan_name || "No Plan"}
                </span>{" "}
                plan.
              </p>
              {planDetails && (
                <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>
                    {planDetails.isExpired
                      ? "Expired"
                      : isProPlan(currentPlan)
                        ? "Renews"
                        : "Expires"}{" "}
                    on {planDetails.renewalDate}.
                  </span>
                </div>
              )}
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
                    After your trial expires, you'll still be able to view your
                    existing data, but you won't be able to process new
                    transcripts, generate emails, or create presentations.
                    Upgrade to Pro to continue using all features.
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

        {/* Available Plans Section */}
        {otherPlans.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">
              {isFree ? "Available Plans" : "Other Plans"}
            </h4>
            <div className={cn(
              "grid gap-6",
              otherPlans.length === 1 ? "md:grid-cols-1 max-w-md mx-auto" : "md:grid-cols-2"
            )}>
              {otherPlans.map((plan) => {
                const PlanIcon = getPlanIcon(plan);
                const isUpgrade = plan.price > (currentPlan?.price || 0);
                
                return (
                  <Card 
                    key={plan.id} 
                    className={cn(
                      "relative border-2",
                      isFreePlan(plan) ? "border-green-200 bg-green-50/50" : 
                      isProPlan(plan) ? "border-blue-200 bg-blue-50/50" :
                      "border-purple-200 bg-purple-50/50"
                    )}
                  >
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className={cn(
                        "px-3 py-1",
                        isFreePlan(plan) ? "bg-green-100 text-green-800 border-green-200" :
                        isProPlan(plan) ? "bg-blue-100 text-blue-800 border-blue-200" :
                        "bg-purple-100 text-purple-800 border-purple-200"
                      )}>
                        {isUpgrade ? "Upgrade Available" : "Downgrade Option"}
                      </Badge>
                    </div>
                    
                    <CardHeader className="text-center pt-8">
                      <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3",
                        isFreePlan(plan) ? "bg-green-100" :
                        isProPlan(plan) ? "bg-blue-100" :
                        "bg-purple-100"
                      )}>
                        <PlanIcon className={cn(
                          "w-6 h-6",
                          isFreePlan(plan) ? "text-green-600" :
                          isProPlan(plan) ? "text-blue-600" :
                          "text-purple-600"
                        )} />
                      </div>
                      <CardTitle className="text-xl">
                        {plan.plan_name}
                      </CardTitle>
                      <div className={cn(
                        "text-2xl font-bold",
                        isFreePlan(plan) ? "text-green-600" :
                        isProPlan(plan) ? "text-blue-600" :
                        "text-purple-600"
                      )}>
                        ${plan.price}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {plan.price === 0 ? 
                          `${plan.duration_days}-day trial` : 
                          `per user/${plan.duration_days === 30 ? 'month' : 'year'}`
                        }
                      </p>
                      {plan.description && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {plan.description}
                        </p>
                      )}
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        {plan.features?.map((feature, index) => (
                          <div key={index} className="flex items-start space-x-2">
                            <CheckCircle className={cn(
                              "w-4 h-4 mt-0.5 flex-shrink-0",
                              isFreePlan(plan) ? "text-green-600" :
                              isProPlan(plan) ? "text-blue-600" :
                              "text-purple-600"
                            )} />
                            <span className="text-sm">{feature}</span>
                          </div>
                        )) || (
                          <div className="text-center py-4 text-muted-foreground">
                            <p className="text-sm">No features listed</p>
                          </div>
                        )}
                      </div>

                      <Button
                        onClick={isUpgrade ? handleUpgradeToPro : handleManageSubscription}
                        className={cn(
                          "w-full",
                          isUpgrade ? 
                            "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700" :
                            "bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800"
                        )}
                      >
                        {isUpgrade ? (
                          <>
                            <Crown className="w-4 h-4 mr-2" />
                            Upgrade to {plan.plan_name} - ${plan.price}/{plan.duration_days === 30 ? 'month' : 'year'}
                          </>
                        ) : (
                          <>
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Change to {plan.plan_name}
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Current Plan Features */}
        {currentPlan?.features && currentPlan.features.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">
              Your {currentPlan.plan_name} Features
            </h4>
            <Card className={cn(
              isFreePlan(currentPlan) ? "border-green-200 bg-green-50/50" :
              isProPlan(currentPlan) ? "border-blue-200 bg-blue-50/50" :
              "border-purple-200 bg-purple-50/50"
            )}>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {React.createElement(getPlanIcon(currentPlan), {
                    className: cn(
                      "w-5 h-5",
                      isFreePlan(currentPlan) ? "text-green-600" :
                      isProPlan(currentPlan) ? "text-blue-600" :
                      "text-purple-600"
                    )
                  })}
                  <span>{currentPlan.plan_name} Benefits</span>
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Everything included in your {currentPlan.plan_name} subscription
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-3">
                  {currentPlan.features.map((feature, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <CheckCircle className={cn(
                        "w-4 h-4 mt-0.5 flex-shrink-0",
                        isFreePlan(currentPlan) ? "text-green-600" :
                        isProPlan(currentPlan) ? "text-blue-600" :
                        "text-purple-600"
                      )} />
                      <span className="text-sm font-medium">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Current Plan Card - Moved to the end */}
        {currentPlan && (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Current Plan Details</h4>
            <div className="flex justify-center">
              <Card className="w-80 overflow-hidden border-0 shadow-lg">
                <div
                  className={cn(
                    "h-32 flex items-center justify-center text-white relative bg-gradient-to-br",
                    getPlanGradient(currentPlan)
                  )}
                >
                  <div className="text-center">
                    <h2 className="text-3xl font-bold mb-1">
                      {currentPlan.plan_name}
                    </h2>
                    {isProPlan(currentPlan) && (
                      <p className="text-lg opacity-90">per user/month</p>
                    )}
                    {isFreePlan(currentPlan) && planDetails && (
                      <div className="flex items-center justify-center space-x-2">
                        <Sparkles className="w-5 h-5" />
                        <p className="text-lg opacity-90">
                          {planDetails.daysRemaining} days left
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Plan Icon */}
                  <div className="absolute top-4 right-4">
                    {React.createElement(getPlanIcon(currentPlan), {
                      className: "w-8 h-8 opacity-80"
                    })}
                  </div>
                </div>

                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Plan Status */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Status
                      </span>
                      <Badge
                        className={cn(
                          "text-xs",
                          planDetails?.isExpired
                            ? "bg-red-100 text-red-800 border-red-200"
                            : "bg-green-100 text-green-800 border-green-200"
                        )}
                      >
                        {planDetails?.isExpired ? "Expired" : "Active"}
                      </Badge>
                    </div>

                    {/* Price */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Price
                      </span>
                      <span className="font-semibold">
                        {currentPlan.price === 0
                          ? "Free"
                          : `$${currentPlan.price}/${currentPlan.duration_days === 30 ? 'month' : 'year'}`}
                      </span>
                    </div>

                    {/* Days Remaining / Next Billing */}
                    {planDetails && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          {isFreePlan(currentPlan) ? "Days remaining" : "Next billing"}
                        </span>
                        <span
                          className={cn(
                            "font-semibold",
                            isFreePlan(currentPlan) &&
                              planDetails.daysRemaining <= 7 &&
                              "text-orange-600"
                          )}
                        >
                          {isFreePlan(currentPlan)
                            ? `${planDetails.daysRemaining} days`
                            : planDetails.renewalDate}
                        </span>
                      </div>
                    )}

                    {/* Action Button */}
                    {isFreePlan(currentPlan) ? (
                      <Button
                        onClick={handleUpgradeToPro}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                      >
                        <Crown className="w-4 h-4 mr-2" />
                        Upgrade to Pro
                      </Button>
                    ) : (
                      <div className="space-y-2">
                        <Button
                          onClick={handleManageSubscription}
                          variant="outline"
                          className="w-full"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Manage subscription in Stripe
                        </Button>
                        <Button
                          onClick={() => setShowCancelDialog(true)}
                          variant="outline"
                          className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          Cancel Subscription
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
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
              Are you sure you want to cancel your Pro subscription? You'll lose
              access to all Pro features and return to the Free Plan at the end
              of your current billing period.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-medium text-red-900 mb-2">
                What happens when you cancel:
              </h4>
              <ul className="text-sm text-red-800 space-y-1">
                <li>
                  • You'll keep Pro access until {planDetails?.renewalDate}
                </li>
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