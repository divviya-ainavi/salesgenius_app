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
  AlertTriangle,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSelector } from "react-redux";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useDispatch } from "react-redux";
import { setPlanDetails, setCurrentPlan } from "../../store/slices/orgSlice";
import { dbHelpers } from "../../lib/supabase";
// import config from "@/lib/config";

export const BillingComponent = () => {
  const { user, organizationDetails } = useSelector((state) => state.auth);
  // const [currentPlan, setCurrentPlan] = useState(null);
  // const [planDetails, setPlanDetails] = useState(null);
  // const [availablePlans, setAvailablePlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const dispatch = useDispatch();
  const { currentPlan, planDetails, availablePlans } = useSelector(
    (state) => state.org
  );

  useEffect(() => {
    loadPlanData();
  }, [user]);

  const loadPlanData = async () => {
    try {
      setIsLoading(true);

      if (user?.id) {
        // Get user's current plan from user_plan table with plan_master details
        const userPlanData = await dbHelpers.getUserPlanAndPlanMasters(user.id);

        if (userPlanData && userPlanData.length > 0) {
          // console.log(userPlanData, "user plan data");
          const userPlan = userPlanData[0];
          const planMaster = userPlan.plan_master;

          const endDate = new Date(userPlan.end_date);
          const canceled_at = new Date(userPlan.canceled_at);
          const today = new Date();
          const isExpired = endDate < today;
          const daysRemaining = Math.max(
            0,
            Math.ceil((endDate - today) / (1000 * 60 * 60 * 24))
          );
          // console.log(userPlan, "user plan 109");
          dispatch(setCurrentPlan(planMaster));
          dispatch(
            setPlanDetails({
              ...userPlan,
              // ...planMaster,
              isExpired,
              daysRemaining,
              renewalDate: endDate.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              }),
              canceled_at: canceled_at.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              }),
            })
          );
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

  const isPaidPlan = (plan) => {
    return !isFreePlan(plan);
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
    if (plan.plan_name?.toLowerCase().includes("pro"))
      return "from-blue-500 to-indigo-600";
    if (plan.plan_name?.toLowerCase().includes("business"))
      return "from-purple-500 to-violet-600";
    if (plan.plan_name?.toLowerCase().includes("enterprise"))
      return "from-gray-800 to-black";
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
    const higherPlans = availablePlans.filter(
      (plan) => plan.price > currentPlan.price
    );

    // Return the cheapest higher plan (next tier)
    return higherPlans.length > 0
      ? higherPlans.reduce((min, plan) => (plan.price < min.price ? plan : min))
      : null;
  };

  const handleUpgrade = async (plan) => {
    if (!plan.stripe_price_id) {
      toast.error("This plan is not available for purchase yet");
      return;
    }

    setIsProcessingPayment(true);

    try {
      console.log("🔄 Creating checkout session for plan:", plan.plan_name);

      const payload = {
        userid: user.id,
        plan_id: plan.stripe_price_id,
        emailid: user.email,
        dbplan_id: plan.id,
      };

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}checkout-session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Checkout session creation failed: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const checkoutData = await response.json();
      console.log("✅ Checkout session created:", checkoutData);

      // Handle the response array format
      if (
        Array.isArray(checkoutData) &&
        checkoutData.length > 0 &&
        checkoutData[0].checkoutUrl
      ) {
        console.log(
          "🔗 Redirecting to Stripe checkout:",
          checkoutData[0].checkoutUrl
        );
        window.location.href = checkoutData[0].checkoutUrl;
      } else if (checkoutData.checkoutUrl) {
        console.log(
          "🔗 Redirecting to Stripe checkout:",
          checkoutData.checkoutUrl
        );
        window.location.href = checkoutData.checkoutUrl;
      } else {
        console.error("❌ Invalid checkout response format:", checkoutData);
        throw new Error("No checkout URL received from server");
      }
    } catch (error) {
      console.error("❌ Error creating checkout session:", error);
      toast.error("Failed to start checkout process: " + error.message);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  console.log(planDetails, "check plan details", currentPlan);
  const handleCancelSubscription = async () => {
    setIsCancelling(true);

    try {
      console.log("🔄 Cancelling subscription for user:", user.id);

      // Call the cancellation API first
      const cancellationPayload = {
        subscription_Id: planDetails?.stripe_subscription_id,
        cancel_at_period_end: true,
        userid: user.id,
        name: user.full_name || user.email,
        email: user.email,
        dbid: planDetails?.id,
      };

      console.log(
        "📤 Sending cancellation request to API:",
        cancellationPayload
      );

      const apiResponse = await fetch(
        `https://salesgenius.ainavi.co.uk/n8n/webhook/Cancle-sub`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(cancellationPayload),
        }
      );

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        throw new Error(
          `Cancellation API failed: ${apiResponse.status} ${apiResponse.statusText} - ${errorText}`
        );
      }

      const apiResult = await apiResponse.json();
      console.log("✅ Cancellation API response:", apiResult);

      // Update user_plan to mark as cancelled
      // const { error: updateError } = await supabase
      //   .from("user_plan")
      //   .update({
      //     status: "cancelled",
      //     canceled_at: new Date().toISOString(),
      //     // Keep is_active true until period ends
      //     is_active: true,
      //   })
      //   .eq("user_id", user.id)
      //   .eq("is_active", true);

      // if (updateError) {
      //   throw updateError;
      // }

      // Reload plan data to reflect changes
      await loadPlanData();

      setShowCancelModal(false);
      toast.success(
        "Subscription cancelled successfully. You'll retain access until your current billing period ends."
      );
    } catch (error) {
      console.error("❌ Error cancelling subscription:", error);
      toast.error("Failed to cancel subscription: " + error.message);
    } finally {
      setIsCancelling(false);
    }
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
                    {planDetails.isExpired ? "Expired" : "Renews"} on{" "}
                    {planDetails.renewalDate}.
                  </span>
                </div>
              )}

              {planDetails && (
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />

                  {planDetails?.status == "canceled" && (
                    <span className="text-sm">
                      {planDetails.status == "canceled" ? "Canceled" : "Renews"}{" "}
                      at {planDetails.canceled_at}.
                    </span>
                  )}
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
                    className: "w-full h-full",
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

              {/* Cancel Subscription Button for Paid Plans */}
              {isPaidPlan(currentPlan) && planDetails?.status != "canceled" ? (
                <Button
                  onClick={() => setShowCancelModal(true)}
                  variant="outline"
                  className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                  size="lg"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel Subscription
                </Button>
              ) : planDetails?.status != "canceled" ? (
                <>Plan cancelled at {planDetails?.canceled_at}</>
              ) : (
                ""
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade Modal */}
      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-3xl font-bold text-center">
              Upgrade your plan
            </DialogTitle>
            <DialogDescription className="text-lg text-center mt-2 text-muted-foreground">
              Choose the plan that best fits your needs
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-center py-8 px-4">
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl w-full">
              {availablePlans.map((plan) => {
                const PlanIcon = getPlanIcon(plan);
                const isCurrentPlan = plan.id === currentPlan?.id;
                const isUpgrade = plan.price > (currentPlan?.price || 0);
                const isPopular =
                  plan.plan_name?.toLowerCase().includes("pro") ||
                  plan.plan_name?.toLowerCase().includes("standard");
                const isIntroductory =
                  plan.plan_name?.toLowerCase().includes("plus") ||
                  plan.plan_name?.toLowerCase().includes("starter");

                return (
                  <div
                    key={plan.id}
                    className={cn(
                      "relative bg-white rounded-2xl border-2 transition-all duration-300 hover:shadow-xl hover:scale-105 overflow-hidden",
                      isCurrentPlan
                        ? "border-gray-400 shadow-lg"
                        : isPopular
                        ? "border-blue-400 shadow-lg ring-2 ring-blue-100"
                        : "border-gray-200 hover:border-blue-300"
                    )}
                  >
                    {/* Badges */}
                    {isPopular && !isCurrentPlan && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                        <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-1.5 text-sm font-medium shadow-lg">
                          Most popular
                        </Badge>
                      </div>
                    )}

                    {isIntroductory && !isCurrentPlan && (
                      <div className="absolute -top-3 right-4 z-10">
                        <Badge className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1 text-xs font-medium shadow-lg">
                          Introductory price
                        </Badge>
                      </div>
                    )}

                    {isCurrentPlan && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                        <Badge className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-4 py-1.5 text-sm font-medium shadow-lg">
                          Your current plan
                        </Badge>
                      </div>
                    )}

                    {/* Card Content */}
                    <div className="p-8 text-center">
                      {/* Plan Name */}
                      <h3 className="text-3xl font-bold text-gray-900 mb-3">
                        {plan.plan_name}
                      </h3>

                      {/* Plan Description */}
                      {plan.description && (
                        <p className="text-gray-600 mb-6 leading-relaxed text-base">
                          {plan.description}
                        </p>
                      )}

                      {/* Pricing */}
                      <div className="mb-8">
                        <div className="flex items-baseline justify-center">
                          <span className="text-2xl font-bold text-gray-900 mr-1">
                            ₹
                          </span>
                          <span className="text-6xl font-bold text-gray-900">
                            {plan.price.toLocaleString()}
                          </span>
                        </div>
                        <div className="text-gray-600 mt-2 text-base">
                          /{" "}
                          {plan.duration_days === 30
                            ? "month"
                            : plan.duration_days === 365
                            ? "year"
                            : `${plan.duration_days} days`}
                          <span className="text-gray-500">
                            {" "}
                            (inclusive of GST)
                          </span>
                        </div>
                        <div className="text-sm text-blue-600 mt-1 font-medium">
                          Billed{" "}
                          {plan.duration_days === 30
                            ? "monthly"
                            : plan.duration_days === 365
                            ? "annually"
                            : "per period"}
                        </div>
                      </div>

                      {/* Action Button */}
                      <Button
                        onClick={() =>
                          isCurrentPlan ? null : handleUpgrade(plan)
                        }
                        disabled={isCurrentPlan}
                        loading={isProcessingPayment}
                        className={cn(
                          "w-full mb-8 h-12 text-base font-semibold rounded-xl transition-all duration-200",
                          isCurrentPlan
                            ? "bg-gray-100 text-gray-500 cursor-not-allowed border border-gray-300"
                            : isPopular
                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl"
                            : "bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 shadow-lg hover:shadow-xl"
                        )}
                      >
                        {isProcessingPayment ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : isCurrentPlan ? (
                          "Your current plan"
                        ) : isUpgrade ? (
                          `Upgrade to ${plan.plan_name}`
                        ) : (
                          `Switch to ${plan.plan_name}`
                        )}
                      </Button>
                    </div>

                    {/* Features Section */}
                    <div className="px-8 pb-8">
                      {/* Features Section */}
                      {plan.features && plan.features.length > 0 && (
                        <div className="space-y-6">
                          <div className="text-lg font-semibold text-gray-900 text-left">
                            Everything in {plan.plan_name}, and:
                          </div>

                          <div className="space-y-4 text-left">
                            {plan.features.map((feature, index) => (
                              <div
                                key={index}
                                className="flex items-start space-x-4"
                              >
                                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <CheckCircle className="w-4 h-4 text-blue-600" />
                                </div>
                                <span className="text-base text-gray-700 leading-relaxed">
                                  {feature}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Additional Info for specific plans */}
                      {plan.plan_name?.toLowerCase().includes("business") && (
                        <div className="mt-8 pt-6 border-t border-gray-100">
                          <p className="text-sm text-gray-500 text-center">
                            For 2+ users, billed annually.
                            <br />
                            GST excluded at checkout with a valid GST ID.
                          </p>
                        </div>
                      )}

                      {plan.plan_name?.toLowerCase().includes("go") && (
                        <div className="mt-8 pt-6 border-t border-gray-100">
                          <p className="text-sm text-gray-500 text-center">
                            Only available in certain regions. Limits apply.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <DialogFooter className="flex justify-center pt-8 border-t border-gray-100">
            <Button
              variant="outline"
              onClick={() => setShowUpgradeModal(false)}
              className="px-8 py-3 text-base font-medium rounded-xl border-gray-300 hover:bg-gray-50"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Subscription Modal */}
      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              <span>Cancel Subscription</span>
            </DialogTitle>
            <DialogDescription className="text-base leading-relaxed">
              Are you sure you want to cancel your {currentPlan?.plan_name}{" "}
              subscription?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Current Plan Info */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <CreditCard className="w-5 h-5 text-red-600" />
                <span className="font-medium text-red-800">
                  Current Plan Details
                </span>
              </div>
              <div className="space-y-2 text-sm text-red-700">
                <div className="flex justify-between">
                  <span>Plan:</span>
                  <span className="font-medium">{currentPlan?.plan_name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Price:</span>
                  <span className="font-medium">
                    ₹{currentPlan?.price?.toLocaleString()} /{" "}
                    {getDurationText(currentPlan?.duration_days)}
                  </span>
                </div>
                {planDetails && (
                  <div className="flex justify-between">
                    <span>Access until:</span>
                    <span className="font-medium">
                      {planDetails.renewalDate}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Cancellation Info */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-800 mb-2">
                What happens when you cancel:
              </h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• You'll retain access until {planDetails?.renewalDate}</li>
                <li>• No further charges will be made</li>
                <li>• You can reactivate anytime before expiration</li>
                <li>• Your data will be preserved</li>
              </ul>
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowCancelModal(false)}
              disabled={isCancelling}
              className="mt-2 sm:mt-0"
            >
              Keep Subscription
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelSubscription}
              disabled={isCancelling}
              className="bg-red-600 hover:bg-red-700"
            >
              {isCancelling ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                <>
                  <X className="w-4 h-4 mr-2" />
                  Cancel Subscription
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
