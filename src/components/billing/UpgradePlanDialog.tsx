import React, { useEffect, useState } from "react";
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
  CheckCircle,
  Crown,
  Gift,
  Star,
  Users,
  Shield,
  Loader2,
  ArrowUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useSelector } from "react-redux";
import { useDispatch } from "react-redux";
import { setShowUpgradeModal } from "../../store/slices/orgSlice";

interface UpgradePlanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade?: (plan: any) => void;
}

export const UpgradePlanDialog: React.FC<UpgradePlanDialogProps> = ({}) => {
  const { user } = useSelector((state) => state.auth);
  const { currentPlan, availablePlans, showUpgradeModal, planDetails } =
    useSelector((state) => state.org);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const dispatch = useDispatch();
  const [hasCoupon, setHasCoupon] = useState(false);
  const [expandedFeatures, setExpandedFeatures] = useState<{
    [key: string]: boolean;
  }>({});

  // Check for coupon on component mount
  useEffect(() => {
    const couponFlag = localStorage.getItem("apply_coupon_50LIFE");
    setHasCoupon(!!couponFlag);
  }, [showUpgradeModal]);

  const onClose = () => {
    // Remove coupon flag when modal closes
    localStorage.removeItem("apply_coupon_50LIFE");
    setHasCoupon(false);
    dispatch(setShowUpgradeModal(false));
  };

  const getPlanIcon = (plan: any) => {
    if (!plan) return Gift;
    if (isFreePlan(plan)) return Gift;
    if (plan.plan_name?.toLowerCase().includes("pro")) return Crown;
    if (plan.plan_name?.toLowerCase().includes("business")) return Users;
    if (plan.plan_name?.toLowerCase().includes("enterprise")) return Shield;
    return Star;
  };

  const toggleFeatures = (planId: string) => {
    setExpandedFeatures((prev) => ({
      ...prev,
      [planId]: !prev[planId],
    }));
  };

  const getPlanBorderColor = (plan: any) => {
    if (!plan) return "border-gray-300";
    if (isFreePlan(plan)) return "border-green-300";
    if (plan.plan_name?.toLowerCase().includes("pro")) return "border-blue-400";
    if (plan.plan_name?.toLowerCase().includes("business"))
      return "border-purple-400";
    if (plan.plan_name?.toLowerCase().includes("enterprise"))
      return "border-gray-600";
    return "border-blue-400";
  };

  const isFreePlan = (plan: any) => {
    if (!plan) return true;
    const planName = plan.plan_name?.toLowerCase() || "";
    return (
      planName.includes("free") ||
      planName.includes("trial") ||
      planName.includes("beta") ||
      plan.price === 0
    );
  };

  const isPaidPlan = (plan: any) => {
    return !isFreePlan(plan);
  };

  const getDurationText = (durationDays: number) => {
    if (durationDays === 30) return "Monthly";
    if (durationDays === 365) return "Annual";
    if (durationDays <= 31) return "Trial";
    return `${durationDays} days`;
  };

  const handleUpgrade = async (plan: any) => {
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
        coupon_id: hasCoupon ? "50LIFE" : "",
        coupon: hasCoupon,
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

      // Call onUpgrade callback if provided
      if (onUpgrade) {
        onUpgrade(plan);
      }
    } catch (error) {
      console.error("❌ Error creating checkout session:", error);
      toast.error("Failed to start checkout process: " + error.message);
    } finally {
      setIsProcessingPayment(false);
      dispatch(setShowUpgradeModal(false));
    }
  };

  return (
    <Dialog open={showUpgradeModal} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-[95vw] max-h-[95vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Upgrade your plan
          </DialogTitle>
          {hasCoupon && (
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-3 rounded-lg mt-2">
              <div className="text-center">
                <div className="text-base font-bold mb-1">
                  🎉 Coupon Applied!
                </div>
                <div className="text-sm opacity-90">
                  Code{" "}
                  <span className="font-bold bg-white/20 px-2 py-1 rounded">
                    50LIFE
                  </span>{" "}
                  - Save 50% on all paid plans
                </div>
              </div>
            </div>
          )}
          <DialogDescription className="text-base text-center mt-2 text-muted-foreground">
            Choose the plan that best fits your needs
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 px-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
            {availablePlans.map((plan) => {
              const PlanIcon = getPlanIcon(plan);
              const isCurrentPlan = plan.id === currentPlan?.id;
              const isUpgrade = plan.price > (currentPlan?.price || 0);
              const isDowngrade = plan.price < (currentPlan?.price || 0);
              const isPopular =
                plan.plan_name?.toLowerCase().includes("pro") ||
                plan.plan_name?.toLowerCase().includes("standard");
              const isIntroductory =
                plan.plan_name?.toLowerCase().includes("plus") ||
                plan.plan_name?.toLowerCase().includes("starter");

              // For expired users, allow them to choose their current plan again
              const canSelectExpiredPlan =
                planDetails?.isExpired && plan.id === currentPlan?.id;

              // Disable free plans for expired users (but still show them)
              const isDisabledFreePlan =
                isFreePlan(plan) && planDetails?.isExpired;

              return (
                <div
                  key={plan.id}
                  className={cn(
                    "relative bg-white rounded-lg border-2 transition-all duration-200 overflow-hidden",
                    !isDisabledFreePlan && "hover:shadow-lg",
                    // isDisabledFreePlan
                    // ? "border-gray-300 opacity-50"
                    //   : "",
                    isCurrentPlan
                      ? planDetails?.isExpired && !isFreePlan(plan)
                        ? "border-red-400 shadow-lg ring-2 ring-red-100"
                        : "border-gray-400 shadow-md"
                      : isPopular
                      ? "border-blue-400 shadow-md ring-1 ring-blue-100"
                      : "border-gray-200 hover:border-blue-300"
                  )}
                >
                  {/* Disabled Overlay for Free Plans */}
                  {/* {isDisabledFreePlan && (
                    <div className="absolute inset-0 bg-gray-100/90 flex items-center justify-center z-20 rounded-lg">
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-600 mb-1">
                          Free plan not available
                        </div>
                        <div className="text-xs text-gray-500">
                          Choose a paid plan to continue
                        </div>
                      </div>
                    </div>
                  )} */}

                  {/* Badges */}
                  {isPopular && !isCurrentPlan && (
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 z-10">
                      <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-2 py-0.5 text-xs font-medium shadow-md">
                        Most popular
                      </Badge>
                    </div>
                  )}

                  {isCurrentPlan && (
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 z-10">
                      <Badge className="bg-gradient-to-r from-gray-500 to-gray-600 text-white px-2 py-0.5 text-xs font-medium shadow-md">
                        {planDetails?.isExpired
                          ? "Your expired plan"
                          : "Your current plan"}
                      </Badge>
                    </div>
                  )}

                  {/* Card Content */}
                  <div className="p-4 text-center">
                    {/* Plan Name */}
                    <h3 className="text-xl font-bold text-gray-900 mb-2 mt-2">
                      {plan.plan_name}
                    </h3>

                    {/* Plan Description */}
                    {plan.description && (
                      <p className="text-gray-600 mb-3 text-xs leading-relaxed">
                        {plan.description}
                      </p>
                    )}

                    {/* Pricing */}
                    <div className="mb-4">
                      {hasCoupon && !isFreePlan(plan) ? (
                        <div className="space-y-2">
                          {/* Original Price - Strikethrough */}
                          <div className="flex items-baseline justify-center opacity-60">
                            <span className="text-sm font-bold text-gray-500 mr-1 line-through">
                              $
                            </span>
                            <span className="text-2xl font-bold text-gray-500 line-through">
                              {plan.price.toLocaleString()}
                            </span>
                          </div>

                          {/* Discounted Price */}
                          <div className="flex items-baseline justify-center">
                            <span className="text-lg font-bold text-green-600 mr-1">
                              $
                            </span>
                            <span className="text-3xl font-bold text-green-600">
                              {(plan.price * 0.5).toLocaleString()}
                            </span>
                          </div>

                          {/* Savings Display */}
                          <div className="text-green-600 font-semibold text-sm">
                            Save $
                            {Math.round(plan.price * 0.5).toLocaleString()}!
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-baseline justify-center">
                          <span className="text-lg font-bold text-gray-900 mr-1">
                            $
                          </span>
                          <span className="text-3xl font-bold text-gray-900">
                            {plan.price.toLocaleString()}
                          </span>
                        </div>
                      )}
                      <div className="text-gray-600 mt-1 text-xs">
                        /{" "}
                        {plan.duration_days === 30
                          ? "month"
                          : plan.duration_days === 365
                          ? "year"
                          : `${plan.duration_days} days`}
                      </div>
                    </div>

                    {/* Action Button */}
                    <Button
                      onClick={() =>
                        (isCurrentPlan && !canSelectExpiredPlan) ||
                        isDisabledFreePlan
                          ? null
                          : handleUpgrade(plan)
                      }
                      disabled={
                        (isCurrentPlan && !canSelectExpiredPlan) ||
                        isDisabledFreePlan ||
                        (isDowngrade && planDetails?.isExpired)
                      }
                      className={cn(
                        "w-full mb-4 h-10 text-sm font-semibold rounded-lg transition-all duration-200",
                        (isCurrentPlan && !canSelectExpiredPlan) ||
                          isDisabledFreePlan ||
                          (isDowngrade && planDetails?.isExpired)
                          ? "bg-gray-100 text-gray-500 cursor-not-allowed border border-gray-300"
                          : canSelectExpiredPlan
                          ? "bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 shadow-lg hover:shadow-xl"
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
                      ) : isDisabledFreePlan ? (
                        "Not Available"
                      ) : isCurrentPlan && !canSelectExpiredPlan ? (
                        planDetails?.isExpired ? (
                          "Your expired plan"
                        ) : (
                          "Your current plan"
                        )
                      ) : canSelectExpiredPlan ? (
                        `Renew ${plan.plan_name}`
                      ) : isUpgrade ? (
                        `Upgrade to ${plan.plan_name}`
                      ) : isDowngrade ? (
                        `${plan.plan_name}`
                      ) : (
                        `Switch to ${plan.plan_name}`
                      )}
                    </Button>

                    {/* Simple Features List */}
                    {plan.features && plan.features.length > 0 && (
                      <div className="text-left">
                        <div className="space-y-1.5 max-h-32 overflow-y-auto">
                          {(expandedFeatures[plan.id]
                            ? plan.features
                            : plan.features.slice(0, 4)
                          ).map((feature, index) => (
                            <div
                              key={index}
                              className="flex items-center space-x-2"
                            >
                              <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0 mt-0.5" />
                              <span className="text-xs text-gray-700 leading-tight">
                                {feature.length > 35
                                  ? `${feature.substring(0, 35)}...`
                                  : feature}
                              </span>
                            </div>
                          ))}
                          {plan.features.length > 4 && (
                            <div
                              className="text-xs text-blue-600 font-medium mt-2 cursor-pointer hover:text-blue-800 transition-colors"
                              onClick={() => toggleFeatures(plan.id)}
                            >
                              {expandedFeatures[plan.id]
                                ? "Show less"
                                : `+${plan.features.length - 4} more features`}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <DialogFooter className="flex justify-center pt-4 border-t border-gray-100 flex-shrink-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="px-6 py-2 text-sm font-medium rounded-lg border-gray-300 hover:bg-gray-50"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
