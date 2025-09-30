import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UpgradePlanDialog } from "./UpgradePlanDialog";
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
import {
  setPlanDetails,
  setCurrentPlan,
  setShowUpgradeModal,
} from "../../store/slices/orgSlice";
import { dbHelpers } from "../../lib/supabase";

export const BillingComponent = () => {
  const { user, organizationDetails } = useSelector((state) => state.auth);
  const [isLoading, setIsLoading] = useState(true);
  // const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const dispatch = useDispatch();
  const { currentPlan, planDetails, availablePlans, showUpgradeModal } =
    useSelector((state) => state.org);

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
          const isDateExpired =
            endDate?.toLocaleDateString("en-CA") <
            today?.toLocaleDateString("en-CA");
          console.log(
            endDate,
            today,
            "check date",
            isDateExpired,
            endDate?.toLocaleDateString("en-CA") <
              today?.toLocaleDateString("en-CA")
          );
          const isStatusExpired =
            userPlan.status === "expired" ||
            userPlan.status === "cancelled" ||
            userPlan.is_active === false;
          const isExpired = isDateExpired || isStatusExpired;
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

  const getNextTierPlan = () => {
    // console.log(currentPlan, availablePlans, "get next tier");
    if (!currentPlan || !availablePlans.length) return null;

    // Find plans with higher price than current plan
    const higherPlans = availablePlans.filter(
      (plan) => plan.price > currentPlan.price
    );
    console.log(higherPlans, "higher plans");
    // Return the cheapest higher plan (next tier)
    return higherPlans.length > 0
      ? higherPlans.reduce((min, plan) => (plan.price < min.price ? plan : min))
      : null;
  };

  const handleUpgradeFromDialog = async (plan) => {
    // Reload plan data after successful upgrade
    await loadPlanData();
    dispatch(setShowUpgradeModal(false));
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
  const showUpgradeOption =
    (isFreePlan(currentPlan) && nextTierPlan) || planDetails?.isExpired;
  // console.log(isFreePlan(currentPlan), nextTierPlan, planDetails, currentPlan);
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

              {planDetails?.status == "canceled" && (
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
              {console.log(showUpgradeOption, planDetails, "show upgrade")}
              {/* Upgrade Button */}
              {showUpgradeOption && (
                <Button
                  onClick={() => dispatch(setShowUpgradeModal(true))}
                  className="w-full bg-white text-gray-900 hover:bg-gray-50 border border-gray-200 shadow-sm"
                  size="lg"
                >
                  <ArrowUp className="w-4 h-4 mr-2" />
                  {planDetails?.isExpired
                    ? "Renew Plan"
                    : nextTierPlan
                    ? `Upgrade to ${nextTierPlan.plan_name}`
                    : "Upgrade Plan"}
                </Button>
              )}

              {/* Cancel Subscription Button for Paid Plans */}
              {isPaidPlan(currentPlan) && planDetails?.status != "canceled" && (
                <Button
                  onClick={() => setShowCancelModal(true)}
                  variant="outline"
                  className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                  size="lg"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel Subscription
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade Modal */}
      <UpgradePlanDialog />

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
