import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Crown,
  Gift,
  Star,
  Loader2,
  ArrowUp,
  Users,
  Shield,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSelector, useDispatch } from "react-redux";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { setShowPlanUpgradeModal } from "@/store/slices/authSlice";
import usePlanManagement from "@/hooks/usePlanManagement";

export const PlanUpgradeModal = () => {
  const dispatch = useDispatch();
  const { user, currentPlan, showPlanUpgradeModal } = useSelector((state) => state.auth);
  const { loadCurrentPlan } = usePlanManagement();
  
  const [availablePlans, setAvailablePlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  useEffect(() => {
    if (showPlanUpgradeModal) {
      loadAvailablePlans();
    }
  }, [showPlanUpgradeModal]);

  const loadAvailablePlans = async () => {
    try {
      setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    dispatch(setShowPlanUpgradeModal(false));
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
        dbplan_id: plan.id
      };

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Checkout session creation failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const checkoutData = await response.json();
      console.log("✅ Checkout session created:", checkoutData);

      // Handle the response array format
      if (Array.isArray(checkoutData) && checkoutData.length > 0 && checkoutData[0].checkoutUrl) {
        console.log("🔗 Redirecting to Stripe checkout:", checkoutData[0].checkoutUrl);
        window.location.href = checkoutData[0].checkoutUrl;
      } else if (checkoutData.checkoutUrl) {
        console.log("🔗 Redirecting to Stripe checkout:", checkoutData.checkoutUrl);
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

  const getPlanIcon = (plan) => {
    if (!plan) return Gift;
    if (plan.price === 0) return Gift;
    if (plan.plan_name?.toLowerCase().includes("pro")) return Crown;
    if (plan.plan_name?.toLowerCase().includes("business")) return Users;
    if (plan.plan_name?.toLowerCase().includes("enterprise")) return Shield;
    return Star;
  };

  const getPlanGradient = (plan) => {
    if (!plan) return "from-gray-500 to-gray-600";
    if (plan.price === 0) return "from-green-500 to-emerald-600";
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

  const isCurrentPlan = (plan) => {
    return plan.id === currentPlan?.plan_id || plan.plan_name === currentPlan?.plan_name;
  };

  const isUpgrade = (plan) => {
    return plan.price > (currentPlan?.price || 0);
  };

  const isPopular = (plan) => {
    return plan.plan_name?.toLowerCase().includes("pro") || 
           plan.plan_name?.toLowerCase().includes("standard");
  };

  return (
    <Dialog open={showPlanUpgradeModal} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-3xl font-bold text-center flex items-center justify-between">
            <span>Upgrade your plan</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </Button>
          </DialogTitle>
          <DialogDescription className="text-lg text-center mt-2 text-muted-foreground">
            Choose the plan that best fits your needs
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading available plans...</p>
          </div>
        ) : (
          <div className="flex justify-center py-8 px-4">
            <div className="grid md:grid-cols-3 gap-6 max-w-5xl w-full">
              {availablePlans.map((plan) => {
                const PlanIcon = getPlanIcon(plan);
                const currentPlanCheck = isCurrentPlan(plan);
                const upgradeCheck = isUpgrade(plan);
                const popularCheck = isPopular(plan);
                
                return (
                  <div
                    key={plan.id}
                    className={cn(
                      "relative bg-white rounded-2xl border-2 transition-all duration-300 hover:shadow-xl hover:scale-105 overflow-hidden",
                      currentPlanCheck 
                        ? "border-gray-400 shadow-lg" 
                        : popularCheck
                        ? "border-blue-400 shadow-lg ring-2 ring-blue-100"
                        : "border-gray-200 hover:border-blue-300"
                    )}
                  >
                    {/* Badges */}
                    {popularCheck && !currentPlanCheck && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                        <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-1.5 text-sm font-medium shadow-lg">
                          Most popular
                        </Badge>
                      </div>
                    )}

                    {currentPlanCheck && (
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
                          <span className="text-2xl font-bold text-gray-900 mr-1">₹</span>
                          <span className="text-6xl font-bold text-gray-900">
                            {plan.price.toLocaleString()}
                          </span>
                        </div>
                        <div className="text-gray-600 mt-2 text-base">
                          / {plan.duration_days === 30 ? "month" : plan.duration_days === 365 ? "year" : `${plan.duration_days} days`}
                          <span className="text-gray-500"> (inclusive of GST)</span>
                        </div>
                        <div className="text-sm text-blue-600 mt-1 font-medium">
                          Billed {plan.duration_days === 30 ? "monthly" : plan.duration_days === 365 ? "annually" : "per period"}
                        </div>
                      </div>

                      {/* Action Button */}
                      <Button
                        onClick={() => currentPlanCheck ? null : handleUpgrade(plan)}
                        disabled={currentPlanCheck || isProcessingPayment}
                        className={cn(
                          "w-full mb-8 h-12 text-base font-semibold rounded-xl transition-all duration-200",
                          currentPlanCheck
                            ? "bg-gray-100 text-gray-500 cursor-not-allowed border border-gray-300"
                            : popularCheck
                            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl"
                            : "bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 shadow-lg hover:shadow-xl"
                        )}
                      >
                        {isProcessingPayment ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : currentPlanCheck 
                          ? "Your current plan"
                          : upgradeCheck 
                          ? `Upgrade to ${plan.plan_name}`
                          : `Switch to ${plan.plan_name}`
                        }
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
                              <div key={index} className="flex items-start space-x-4">
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
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <DialogFooter className="flex justify-center pt-8 border-t border-gray-100">
          <Button
            variant="outline"
            onClick={handleClose}
            className="px-8 py-3 text-base font-medium rounded-xl border-gray-300 hover:bg-gray-50"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};