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

  const getPlanGradient = (plan: any) => {
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
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-center">
            Upgrade your plan
          </DialogTitle>
          {hasCoupon && (
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 rounded-lg mx-4 mt-4">
              <div className="text-center">
                <div className="text-lg font-bold mb-1">🎉 Coupon Applied!</div>
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
              const isDowngrade = plan.price < (currentPlan?.price || 0);
              const isPopular =
                plan.plan_name?.toLowerCase().includes("pro") ||
                plan.plan_name?.toLowerCase().includes("standard");
               const isIntroductory = plan.plan_name?.toLowerCase().includes("plus") ||
                plan.plan_name?.toLowerCase().includes("starter");

              // For expired users, allow them to choose their current plan again
              const canSelectExpiredPlan =
                planDetails?.isExpired && plan.id === currentPlan?.id;

              // Disable free plans for expired users (but still show them)
              const isDisabledFreePlan = isFreePlan(plan) && planDetails?.isExpired;

              return (
                <div
                  key={plan.id}
                  className={cn(
                    "relative bg-white rounded-2xl border-2 transition-all duration-300 hover:shadow-xl hover:scale-105 overflow-hidden",
                    // isDisabledFreePlan
                    //   ? "border-gray-300 opacity-60 cursor-not-allowed"
                    //   : "",
                    isCurrentPlan
                      ? planDetails?.isExpired && !isFreePlan(plan) 
                        ? "border-red-400 shadow-lg ring-2 ring-red-100"
                        : "border-gray-400 shadow-lg"
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
                        {planDetails?.isExpired
                          ? "Your expired plan"
                          : "Your current plan"}
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
                      {hasCoupon && !isFreePlan(plan) ? (
                        <div className="space-y-2">
                          {/* Original Price - Strikethrough */}
                          <div className="flex items-baseline justify-center opacity-60">
                            <span className="text-lg font-bold text-gray-500 mr-1 line-through">
                              $
                            </span>
                            <span className="text-4xl font-bold text-gray-500 line-through">
                              {plan.price.toLocaleString()}
                            </span>
                          </div>

                          {/* Discounted Price */}
                          <div className="flex items-baseline justify-center">
                            <span className="text-2xl font-bold text-green-600 mr-1">
                              $
                            </span>
                            <span className="text-6xl font-bold text-green-600">
                              {(plan.price * 0.5).toLocaleString()}
                            </span>
                          </div>

                          {/* Savings Display */}
                          <div className="text-green-600 font-semibold text-lg">
                            Save $
                            {Math.round(plan.price * 0.5).toLocaleString()}!
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-baseline justify-center">
                          <span className="text-2xl font-bold text-gray-900 mr-1">
                            $
                          </span>
                          <span className="text-6xl font-bold text-gray-900">
                            {plan.price.toLocaleString()}
                          </span>
                        </div>
                      )}
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
                        isCurrentPlan && !canSelectExpiredPlan || isDisabledFreePlan
                          ? null
                          : handleUpgrade(plan)
                      }
                      disabled={
                        (isCurrentPlan && !canSelectExpiredPlan) ||
                        isDisabledFreePlan ||
                        (isDowngrade && planDetails?.isExpired)
                      }
                      className={cn(
                        "w-full mb-8 h-12 text-base font-semibold rounded-xl transition-all duration-200",
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
                  </div>

                  {/* Features Section */}
                  <div className="px-8 pb-8">
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
            onClick={onClose}
            className="px-8 py-3 text-base font-medium rounded-xl border-gray-300 hover:bg-gray-50"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
