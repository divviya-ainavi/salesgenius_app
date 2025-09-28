import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Calendar,
  CheckCircle,
  Crown,
  Gift,
  Star,
  Loader2,
  X,
  ArrowUp,
  Zap,
  Users,
  Shield,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSelector } from "react-redux";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export const BillingComponent = () => {
  const { user, organizationDetails } = useSelector((state) => state.auth);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [planDetails, setPlanDetails] = useState(null);
  const [availablePlans, setAvailablePlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    loadPlanData();
    loadAvailablePlans();
  }, [user]);

  const loadAvailablePlans = async () => {
    try {
      const { data: plansData, error: plansError } = await supabase
        .from("plan_master")
        .select("*")
        .order("price", { ascending: true });

      if (plansError) {
        console.error("Error loading plans:", plansError);
        return;
      }

      setAvailablePlans(plansData || []);
    } catch (error) {
      console.error("Error loading available plans:", error);
      setAvailablePlans([]);
    }
  };

  const loadPlanData = async () => {
    try {
      setIsLoading(true);

      if (user?.id) {
        // Get user's current plan from user_plan table with plan_master details
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

          const endDate = new Date(userPlan.end_date);
          const today = new Date();
          const isExpired = endDate < today;
          const daysRemaining = Math.max(
            0,
            Math.ceil((endDate - today) / (1000 * 60 * 60 * 24))
          );

          setCurrentPlan(planMaster);
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
          });
        } else {
          // Check old plan table for backward compatibility
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

            // Create a mock plan master object for old plans
            const mockPlanMaster = {
              id: null,
              plan_name: plan.plan_name,
              description: null,
              price: plan.plan_name === "Beta Trial" ? 0 : 49,
              currency: "usd",
              duration_days: plan.no_of_days,
              features: [],
            };

            setCurrentPlan(mockPlanMaster);
            setPlanDetails({
              ...plan,
              ...mockPlanMaster,
              isExpired,
              daysRemaining,
              renewalDate: endDate.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              }),
            });
          }
        }
      }
    } catch (error) {
      console.error("Error loading plan data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isFreePlan = (plan) => {
    if (!plan) return true;
    const planName = plan.plan_name?.toLowerCase() || "";
    return (
      planName.includes("free") ||
      planName.includes("trial") ||
      planName.includes("beta") ||
      plan.price === 0
    );
  };

  const getPlanIcon = (plan) => {
    if (!plan) return Gift;
    if (isFreePlan(plan)) return Gift;
    if (plan.plan_name?.toLowerCase().includes("pro")) return Crown;
    if (plan.plan_name?.toLowerCase().includes("business")) return Users;
    if (plan.plan_name?.toLowerCase().includes("enterprise")) return Shield;
    return Star;
  };

  const getPlanGradient = (plan) => {
    if (!plan) return "from-gray-500 to-gray-600";
    if (isFreePlan(plan)) return "from-green-500 to-emerald-600";
    if (plan.plan_name?.toLowerCase().includes("pro")) return "from-blue-500 to-indigo-600";
    if (plan.plan_name?.toLowerCase().includes("business")) return "from-purple-500 to-violet-600";
    if (plan.plan_name?.toLowerCase().includes("enterprise")) return "from-gray-800 to-black";
    return "from-blue-500 to-indigo-600";
  };

  const getDurationText = (durationDays) => {
    if (durationDays === 30) return "Monthly";
    if (durationDays === 365) return "Annual";
    if (durationDays <= 31) return "Trial";
    return `${durationDays} days`;
  };

  const getNextTierPlan = () => {
    if (!currentPlan || !availablePlans.length) return null;
    
    // Find plans with higher price than current plan
    const higherPlans = availablePlans.filter(plan => plan.price > currentPlan.price);
    
    // Return the cheapest higher plan (next tier)
    return higherPlans.length > 0 
      ? higherPlans.reduce((min, plan) => plan.price < min.price ? plan : min)
      : null;
  };

  const handleUpgrade = (plan) => {
    console.log("Upgrading to plan:", plan.plan_name);
    toast.info("Stripe integration coming soon!");
    setShowUpgradeModal(false);
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

  const nextTierPlan = getNextTierPlan();
  const showUpgradeOption = isFreePlan(currentPlan) && nextTierPlan;

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
          <h3 className="text-lg font-semibold text-foreground mb-6">
            Workspace subscription
          </h3>
          
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Left Column - Text Content */}
            <div className="space-y-4">
              <div>
                <p className="text-muted-foreground text-base">
                  Your workspace is currently subscribed to the{" "}
                  <span className="font-semibold text-foreground">
                    {currentPlan?.plan_name || "Unknown Plan"}
                  </span>{" "}
                  plan.
                </p>
              </div>
              
              {planDetails && (
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span className="text-sm">
                    {planDetails.isExpired ? "Expired" : "Renews"} on {planDetails.renewalDate}.
                  </span>
                </div>
              )}
            </div>

            {/* Right Column - Plan Card and Actions */}
            <div className="space-y-4">
              {/* Current Plan Card */}
              <div 
                className={cn(
                  "relative rounded-2xl p-8 text-white overflow-hidden",
                  `bg-gradient-to-br ${getPlanGradient(currentPlan)}`
                )}
              >
                <div className="relative z-10">
                  <h3 className="text-3xl font-bold mb-2">
                    {currentPlan?.plan_name || "Unknown"}
                  </h3>
                  <p className="text-white/80 text-lg">
                    {getDurationText(currentPlan?.duration_days)}
                  </p>
                </div>
                
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                  {React.createElement(getPlanIcon(currentPlan), {
                    className: "w-full h-full"
                  })}
                </div>
              </div>

              {/* Upgrade Button */}
              {showUpgradeOption && (
                <Button
                  onClick={() => setShowUpgradeModal(true)}
                  className="w-full bg-white text-gray-900 hover:bg-gray-50 border border-gray-200 shadow-sm"
                  size="lg"
                >
                  <ArrowUp className="w-4 h-4 mr-2" />
                  Upgrade to {nextTierPlan.plan_name}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade Modal */}
      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold text-center">
              Upgrade your plan
            </DialogTitle>
            <DialogDescription className="text-lg text-center mt-2 text-muted-foreground">
              Choose the plan that best fits your needs
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-center py-8">
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl w-full">
              {availablePlans.map((plan) => {
                const PlanIcon = getPlanIcon(plan);
                const isCurrentPlan = plan.id === currentPlan?.id;
                const isUpgrade = plan.price > (currentPlan?.price || 0);
                const isPopular = plan.plan_name?.toLowerCase().includes("pro");
                const isIntroductory = plan.plan_name?.toLowerCase().includes("go") || 
                                     plan.plan_name?.toLowerCase().includes("plus");
                
                return (
                  <Card
                    key={plan.id}
                    className={cn(
                      "relative border-2 transition-all duration-200 hover:shadow-lg",
                      isCurrentPlan 
                        ? "border-blue-500 bg-blue-50/30 shadow-md" 
                        : isPopular
                        ? "border-blue-300 shadow-md"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                  >
                    {/* Popular Badge */}
                    {isPopular && !isCurrentPlan && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-pink-500 text-white px-4 py-1.5 text-sm font-medium">
                          Most popular
                        </Badge>
                      </div>
                    )}

                    {/* Introductory Price Badge */}
                    {isIntroductory && !isCurrentPlan && (
                      <div className="absolute -top-3 right-4">
                        <Badge className="bg-blue-500 text-white px-3 py-1 text-xs font-medium">
                          Introductory price
                        </Badge>
                      </div>
                    )}

                    {/* Current Plan Badge */}
                    {isCurrentPlan && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-gray-500 text-white px-4 py-1.5 text-sm font-medium">
                          Your current plan
                        </Badge>
                      </div>
                    )}

                    <CardHeader className="text-center pb-6 pt-8">
                      
                      <CardTitle className="text-2xl font-bold mb-4">
                        {plan.plan_name}
                      </CardTitle>
                      
                      {plan.description && (
                        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                          {plan.description}
                        </p>
                      )}
                      
                      <div className="mb-6">
                        <div className="flex items-baseline justify-center">
                          <span className="text-sm text-muted-foreground mr-1">₹</span>
                          <span className="text-4xl font-bold">
                            {plan.price.toLocaleString()}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          / {plan.duration_days === 30 ? "month" : plan.duration_days === 365 ? "year" : `${plan.duration_days} days`}
                          {plan.duration_days === 30 && " (inclusive of GST)"}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Billed {plan.duration_days === 30 ? "monthly" : plan.duration_days === 365 ? "annually" : "per period"}
                        </div>
                      </div>

                      {/* Action Button */}
                      <Button
                        onClick={() => isCurrentPlan ? null : handleUpgrade(plan)}
                        disabled={isCurrentPlan}
                        className={cn(
                          "w-full mb-6",
                          isCurrentPlan
                            ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                            : isPopular
                            ? "bg-blue-600 text-white hover:bg-blue-700"
                            : "bg-white text-gray-900 border border-gray-300 hover:bg-gray-50"
                        )}
                        size="lg"
                      >
                        {isCurrentPlan 
                          ? "Your current plan"
                          : isUpgrade 
                          ? `Upgrade to ${plan.plan_name}`
                          : `Switch to ${plan.plan_name}`
                        }
                      </Button>
                    </CardHeader>

                    <CardContent className="pt-0">
                      {/* Features Section */}
                      {plan.features && plan.features.length > 0 && (
                        <div className="space-y-4">
                          <div className="text-sm font-medium text-gray-900 mb-3">
                            Everything in {plan.plan_name}, and:
                          </div>
                          
                          <div className="space-y-3">
                            {plan.features.map((feature, index) => (
                              <div key={index} className="flex items-start space-x-3">
                                <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <CheckCircle className="w-3 h-3 text-blue-600" />
                                </div>
                                <span className="text-sm text-gray-700 leading-relaxed">
                                  {feature}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Additional Info */}
                      {plan.plan_name?.toLowerCase().includes("business") && (
                        <div className="mt-6 pt-4 border-t border-gray-100">
                          <p className="text-xs text-muted-foreground text-center">
                            For 2+ users, billed annually.<br />
                            GST excluded at checkout with a valid GST ID.
                          </p>
                        </div>
                      )}

                      {plan.plan_name?.toLowerCase().includes("go") && (
                        <div className="mt-6 pt-4 border-t border-gray-100">
                          <p className="text-xs text-muted-foreground text-center">
                            Only available in certain regions. Limits apply.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          <DialogFooter className="flex justify-center pt-6 border-t">
            <Button
              variant="outline"
              onClick={() => setShowUpgradeModal(false)}
              size="lg"
              className="px-8"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};