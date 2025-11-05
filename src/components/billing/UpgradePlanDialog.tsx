import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
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
import { config } from "../../lib/config";

interface UpgradePlanDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade?: (plan: any) => void;
}

export const UpgradePlanDialog: React.FC<UpgradePlanDialogProps> = ({}) => {
  const { user, organizationDetails } = useSelector((state) => state.auth);
  const { currentPlan, availablePlans, showUpgradeModal, planDetails } =
    useSelector((state) => state.org);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const dispatch = useDispatch();
  const [hasCoupon, setHasCoupon] = useState(false);
  const [expandedFeatures, setExpandedFeatures] = useState<{
    [key: string]: boolean;
  }>({});
  const [showOrgPlanDialog, setShowOrgPlanDialog] = useState(false);
  const [selectedOrgPlan, setSelectedOrgPlan] = useState<any>(null);
  const [orgUserQuantity, setOrgUserQuantity] = useState(2);

  // Organization plan stripe_price_id
  const ORG_PLAN_STRIPE_PRICE_ID = "price_1SPGu9DNBi73M7eXkf08ZKeu";

  // Check if a plan is an organization plan
  const isOrganizationPlan = (plan: any) => {
    return plan.stripe_price_id === ORG_PLAN_STRIPE_PRICE_ID;
  };

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

  const isProPlan = (plan: any) => {
    const planName = plan.plan_name?.toLowerCase() || "";
    return planName.includes("pro");
  };

  const sortPlans = (plans: any[]) => {
    return [...plans].sort((a, b) => {
      if (isFreePlan(a)) return -1;
      if (isFreePlan(b)) return 1;

      if (isProPlan(a) && !isProPlan(b) && !isOrganizationPlan(b)) return -1;
      if (isProPlan(b) && !isProPlan(a) && !isOrganizationPlan(a)) return 1;

      if (isOrganizationPlan(a)) return 1;
      if (isOrganizationPlan(b)) return -1;

      return a.price - b.price;
    });
  };

  const getDurationText = (durationDays: number) => {
    if (durationDays === 30) return "Monthly";
    if (durationDays === 365) return "Annual";
    if (durationDays <= 31) return "Trial";
    return `${durationDays} days`;
  };

  const handleOrgPlanSubmit = async () => {
    if (!selectedOrgPlan) return;

    setIsProcessingPayment(true);
    setShowOrgPlanDialog(false);

    try {
      console.log(
        "🔄 Creating organization plan checkout for:",
        selectedOrgPlan.plan_name,
        "with",
        orgUserQuantity,
        "users"
      );

      const payload = {
        userid: user.id,
        plan_id: selectedOrgPlan.stripe_price_id,
        emailid: user.email,
        dbplan_id: selectedOrgPlan.id,
        coupon_id: hasCoupon ? "50LIFE" : "",
        coupon: hasCoupon,
        organization_id: organizationDetails?.id,
        quantity: orgUserQuantity,
        is_organization_plan: true,
      };

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}${
          config.api.endpoints.organizationPlan
        }`,
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
          `Organization plan checkout failed: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const checkoutData = await response.json();
      console.log("✅ Organization plan checkout created:", checkoutData);

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
        throw new Error("No checkout URL received from server");
      }
    } catch (error: any) {
      console.error("❌ Organization plan checkout error:", error);
      toast.error(
        error.message || "Failed to create organization plan checkout"
      );
      setIsProcessingPayment(false);
    }
  };

  const handleUpgrade = async (plan: any) => {
    if (!plan.stripe_price_id) {
      toast.error("This plan is not available for purchase yet");
      return;
    }

    // Check if this is an organization plan
    if (isOrganizationPlan(plan)) {
      // Show organization plan dialog
      setSelectedOrgPlan(plan);
      setOrgUserQuantity(2); // Reset to minimum
      setShowOrgPlanDialog(true);
      return;
    }

    // For regular plans, proceed with normal checkout
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

      const endpoint = config.api.endpoints.checkoutSubscriptionDev;

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}${endpoint}`,
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
      // if (onUpgrade) {
      //   onUpgrade(plan);
      // }
    } catch (error) {
      console.error("❌ Error creating checkout session:", error);
      // toast.error("Failed to start checkout process: " + error?.message || "");
    } finally {
      setIsProcessingPayment(false);
      dispatch(setShowUpgradeModal(false));
    }
  };

  return (
    <>
      <Dialog open={showUpgradeModal} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl w-[90vw] max-h-[95vh] flex flex-col overflow-hidden no-scrollbar">
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

          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div
              className="flex-1 overflow-y-auto px-4 py-4 no-scrollbar"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
                {sortPlans(availablePlans).map((plan) => {
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
                        "relative bg-white rounded-lg border-2 transition-all duration-200 overflow-hidden h-auto w-full",
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
                      <div className="p-4 text-center flex flex-col">
                        {/* Plan Name */}
                        <h3 className="text-lg font-bold text-gray-900 mb-2 mt-1">
                          {plan.plan_name == "Pro 1" ? "Pro" : plan.plan_name}
                        </h3>

                        {/* Plan Description */}
                        {plan.description && (
                          <p className="text-gray-600 mb-3 text-sm leading-relaxed">
                            {plan.description}
                          </p>
                        )}

                        {/* Pricing */}
                        <div className="mb-3">
                          {hasCoupon && !isFreePlan(plan) ? (
                            <div className="space-y-2">
                              {/* Original Price - Strikethrough */}
                              <div className="flex items-baseline justify-center opacity-60">
                                <span className="text-sm font-bold text-gray-500 mr-1 line-through">
                                  $
                                </span>
                                <span className="text-xl font-bold text-gray-500 line-through">
                                  {plan.price.toLocaleString()}
                                </span>
                              </div>

                              {/* Discounted Price */}
                              <div className="flex items-baseline justify-center">
                                <span className="text-lg font-bold text-green-600 mr-1">
                                  $
                                </span>
                                <span className="text-xl font-bold text-green-600">
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
                              <span className="text-xl font-bold text-gray-900">
                                {plan.price.toLocaleString()}
                              </span>
                            </div>
                          )}
                          <div className="text-gray-600 mt-1 text-xs">
                            {isOrganizationPlan(plan)
                              ? "per user / month"
                              : plan.duration_days === 30
                              ? "/ month"
                              : plan.duration_days === 365
                              ? "/ year"
                              : `/ ${plan.duration_days} days`}
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
                            "w-full mb-3 h-10 text-sm font-semibold rounded-lg transition-all duration-200",
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
                            "Free Trail"
                          ) : isCurrentPlan && !canSelectExpiredPlan ? (
                            planDetails?.isExpired ? (
                              "Your expired plan"
                            ) : (
                              "Your current plan"
                            )
                          ) : canSelectExpiredPlan ? (
                            `Renew ${
                              plan.plan_name == "Pro 1" ? "Pro" : plan.plan_name
                            }`
                          ) : isUpgrade ? (
                            `Upgrade to ${
                              plan.plan_name == "Pro 1" ? "Pro" : plan.plan_name
                            }`
                          ) : isDowngrade ? (
                            `${
                              plan.plan_name == "Pro 1" ? "Pro" : plan.plan_name
                            }`
                          ) : (
                            `Switch to ${
                              plan.plan_name == "Pro 1" ? "Pro" : plan.plan_name
                            }`
                          )}
                        </Button>

                        {/* Features List - Full Display */}
                        {plan.features && plan.features.length > 0 && (
                          <div className="text-left">
                            <div className="space-y-1">
                              {plan.features.map((feature, index) => (
                                <div
                                  key={index}
                                  className="flex items-start space-x-2 text-xs"
                                >
                                  <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0 mt-0.5" />
                                  <span className="text-gray-700 leading-tight">
                                    {feature}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="flex justify-center pt-2 border-t border-gray-100 flex-shrink-0">
            <Button
              variant="outline"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-lg border-gray-300 hover:bg-gray-50"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Organization Plan User Quantity Dialog */}
      <Dialog open={showOrgPlanDialog} onOpenChange={setShowOrgPlanDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Number of Users</DialogTitle>
            <DialogDescription>
              {selectedOrgPlan?.plan_name} - Choose how many users you need for
              your organization
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* User Quantity Selector */}
            <div className="flex flex-col items-center space-y-4">
              <Label className="text-sm font-medium text-gray-700">
                Number of Users
              </Label>
              <div className="flex items-center justify-center space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="h-12 w-12 p-0 rounded-full"
                  onClick={() =>
                    setOrgUserQuantity(Math.max(2, orgUserQuantity - 1))
                  }
                  disabled={orgUserQuantity <= 2}
                >
                  -
                </Button>
                <div className="w-24 text-center">
                  <span className="text-4xl font-bold text-gray-900">
                    {orgUserQuantity}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">users</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="h-12 w-12 p-0 rounded-full"
                  onClick={() => setOrgUserQuantity(orgUserQuantity + 1)}
                >
                  +
                </Button>
              </div>
              <p className="text-xs text-gray-500">Minimum 2 users required</p>
            </div>

            {/* Price Breakdown */}
            {selectedOrgPlan && (
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Price per user:</span>
                  <span className="font-medium">
                    ${selectedOrgPlan.price.toLocaleString()}/month
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Number of users:</span>
                  <span className="font-medium">{orgUserQuantity}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-900">Total:</span>
                    <span className="text-xl font-bold text-gray-900">
                      $
                      {(
                        selectedOrgPlan.price * orgUserQuantity
                      ).toLocaleString()}
                      /month
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowOrgPlanDialog(false)}
              disabled={isProcessingPayment}
            >
              Cancel
            </Button>
            <Button
              onClick={handleOrgPlanSubmit}
              disabled={isProcessingPayment}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700"
            >
              {isProcessingPayment ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Continue to Payment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
