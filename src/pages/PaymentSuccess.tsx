import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Home,
  Loader2,
  AlertCircle,
  X,
  Download,
  Receipt,
  CreditCard,
  Calendar,
  Crown,
  Gift,
  Users,
  Shield,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useSelector } from "react-redux";
import { dbHelpers } from "../lib/supabase";
import { setCurrentPlan, setPlanDetails } from "../store/slices/orgSlice";
import { useDispatch } from "react-redux";
import { cn } from "@/lib/utils";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useSelector((state) => state.auth);
  const { planDetails } = useSelector((state) => state.org);
  const dispatch = useDispatch();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCrackers, setShowCrackers] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [downloadingReceipt, setDownloadingReceipt] = useState(false);

  useEffect(() => {
    verifyPaymentAndLoadDetails();
  }, []);

  // Crackers animation effect
  useEffect(() => {
    if (planDetails && !isLoading) {
      // Start crackers animation immediately
      setShowCrackers(true);

      // Stop crackers after 4 seconds
      setTimeout(() => {
        setShowCrackers(false);
      }, 4000);
    }
  }, [planDetails, isLoading]);

  const verifyPaymentAndLoadDetails = async () => {
    try {
      const sessionId = searchParams.get("session_id");

      if (!sessionId) {
        setError("No payment session found");
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 5000));

      const userPlanData = await dbHelpers.getUserPlanAndPlanMasters(user?.id);

      if (userPlanData && userPlanData.length > 0) {
        const userPlan = userPlanData[0];
        const planMaster = userPlan.plan_master;

        const endDate = new Date(userPlan.end_date);
        const canceled_at = new Date(userPlan.canceled_at);
        const today = new Date();
        const isDateExpired =
          endDate?.toLocaleDateString("en-CA") <
          today?.toLocaleDateString("en-CA");
        const isStatusExpired =
          userPlan.status === "expired" ||
          userPlan.status === "cancelled" ||
          userPlan.is_active === false;
        const isExpired = isDateExpired || isStatusExpired;
        const daysRemaining = Math.max(
          0,
          Math.ceil((endDate - today) / (1000 * 60 * 60 * 24))
        );

        dispatch(setCurrentPlan(planMaster));
        dispatch(
          setPlanDetails({
            ...userPlan,
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

        setIsLoading(false);

        const { data: paymentData, error: paymentError } = await supabase
          .from("user_plan")
          .select(
            "id, plan_name, amount, currency, invoice_number, start_date, created_at, invoice_pdf, hosted_invoice_url, receipt_url"
          )
          .eq("user_id", user.id)
          .eq("is_active", true)
          .maybeSingle();

        if (paymentError) {
          console.error("Error fetching payment details:", paymentError);
        } else if (paymentData) {
          setPaymentDetails({
            ...paymentData,
            planMaster,
          });
        }
      } else {
        setIsLoading(false);
      }

      toast.success("Payment successful! Your plan has been upgraded.");
    } catch (error) {
      console.error("Error verifying payment:", error);
      setError(error.message);
      toast.error("Error verifying payment: " + error.message);
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-8 h-8 animate-spin text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Verifying Payment
          </h3>
          <p className="text-gray-600">
            Please wait while we confirm your payment...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Payment Verification Failed
          </h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => navigate("/")} className="w-full">
            <Home className="w-4 h-4 mr-2" />
            Go to Sales Call
          </Button>
        </div>
      </div>
    );
  }

  const getPlanIcon = (plan) => {
    if (!plan) return Gift;
    const planName = plan.plan_name?.toLowerCase() || "";
    if (
      planName.includes("free") ||
      planName.includes("trial") ||
      planName.includes("beta") ||
      plan.price === 0
    )
      return Gift;
    if (planName.includes("pro")) return Crown;
    if (planName.includes("business")) return Users;
    if (planName.includes("enterprise")) return Shield;
    return Star;
  };

  const getPlanGradient = (plan) => {
    if (!plan) return "from-gray-500 to-gray-600";
    const planName = plan.plan_name?.toLowerCase() || "";
    if (
      planName.includes("free") ||
      planName.includes("trial") ||
      planName.includes("beta") ||
      plan.price === 0
    )
      return "from-green-500 to-emerald-600";
    if (planName.includes("pro")) return "from-blue-500 to-blue-600";
    if (planName.includes("business")) return "from-slate-700 to-slate-800";
    if (planName.includes("enterprise")) return "from-gray-800 to-black";
    return "from-blue-500 to-blue-600";
  };

  const getPlanBorderColor = (plan) => {
    if (!plan) return "border-gray-300";
    const planName = plan.plan_name?.toLowerCase() || "";
    if (
      planName.includes("free") ||
      planName.includes("trial") ||
      planName.includes("beta") ||
      plan.price === 0
    )
      return "border-green-300";
    if (planName.includes("pro")) return "border-blue-400";
    if (planName.includes("business")) return "border-slate-400";
    if (planName.includes("enterprise")) return "border-gray-600";
    return "border-blue-400";
  };

  const getDurationText = (durationDays) => {
    if (durationDays === 30) return "month";
    if (durationDays === 365) return "year";
    if (durationDays <= 31) return "trial";
    return `${durationDays} days`;
  };

  const formatCurrency = (amount, currency) => {
    const currencySymbols = {
      usd: "$",
      eur: "€",
      gbp: "£",
      inr: "₹",
    };
    const symbol = currencySymbols[currency?.toLowerCase()] || "$";
    return `${symbol}${parseFloat(amount || 0).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleDownloadReceipt = () => {
    setDownloadingReceipt(true);

    try {
      const receiptUrl =
        paymentDetails?.receipt_url ||
        paymentDetails?.invoice_pdf ||
        paymentDetails?.hosted_invoice_url;

      if (receiptUrl) {
        window.open(receiptUrl, "_blank");
        toast.success("Opening receipt in new tab...");
      } else {
        toast.error("Receipt not available");
      }
    } catch (error) {
      console.error("Error downloading receipt:", error);
      toast.error("Failed to download receipt");
    } finally {
      setTimeout(() => setDownloadingReceipt(false), 1000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Animated Crackers/Confetti */}
      {showCrackers && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {/* Colorful geometric shapes - triangles, circles, rectangles */}
          {[...Array(25)].map((_, i) => {
            const shapes = ["triangle", "circle", "rectangle"];
            const colors = [
              "#FF6B9D",
              "#4ECDC4",
              "#45B7D1",
              "#96CEB4",
              "#FFEAA7",
              "#DDA0DD",
              "#98D8C8",
              "#F7DC6F",
            ];
            const shape = shapes[Math.floor(Math.random() * shapes.length)];
            const color = colors[Math.floor(Math.random() * colors.length)];

            return (
              <div
                key={i}
                className="absolute animate-cracker-fall"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `-20px`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${3 + Math.random() * 2}s`,
                }}
              >
                {shape === "triangle" && (
                  <div
                    className="w-0 h-0"
                    style={{
                      borderLeft: "8px solid transparent",
                      borderRight: "8px solid transparent",
                      borderBottom: `12px solid ${color}`,
                    }}
                  />
                )}
                {shape === "circle" && (
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                )}
                {shape === "rectangle" && (
                  <div
                    className="w-2 h-6 rounded-sm"
                    style={{ backgroundColor: color }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Close Button */}
      <button
        onClick={() => navigate("/calls")}
        className="absolute top-6 right-6 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow-sm transition-all duration-200 z-10"
      >
        <X className="w-4 h-4 text-gray-600" />
      </button>

      {/* Main Success Card */}
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-2xl w-full mx-auto relative z-10">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <CheckCircle className="w-10 h-10 text-white" />
        </div>

        {/* Success Message */}
        <h1 className="text-3xl font-bold text-gray-900 mb-3 text-center">
          Payment Successful! 🎉
        </h1>

        <p className="text-base text-gray-600 mb-6 text-center leading-relaxed">
          Thank you for upgrading your subscription.
        </p>

        {/* Plan Details Card */}
        {paymentDetails?.planMaster && (
          <Card
            className={cn(
              "mb-6 border-2 overflow-hidden",
              getPlanBorderColor(paymentDetails.planMaster)
            )}
          >
            <div
              className={cn(
                "p-6 text-white relative overflow-hidden",
                `bg-gradient-to-br ${getPlanGradient(
                  paymentDetails.planMaster
                )}`
              )}
            >
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <Badge className="bg-white/20 text-white border-white/30 mb-2">
                      Your New Plan
                    </Badge>
                    <h2 className="text-2xl font-bold">
                      {paymentDetails.planMaster.plan_name}
                    </h2>
                  </div>
                  {React.createElement(getPlanIcon(paymentDetails.planMaster), {
                    className: "w-12 h-12 opacity-80",
                  })}
                </div>

                <div className="flex items-baseline mb-4">
                  <span className="text-3xl font-bold">
                    {formatCurrency(
                      paymentDetails.amount || paymentDetails.planMaster.price,
                      paymentDetails.currency ||
                        paymentDetails.planMaster.currency
                    )}
                  </span>
                  <span className="text-white/80 ml-2">
                    / {getDurationText(paymentDetails.planMaster.duration_days)}
                  </span>
                </div>

                {paymentDetails.planMaster.features &&
                  paymentDetails.planMaster.features.length > 0 && (
                    <div className="space-y-2">
                      {paymentDetails.planMaster.features
                        .slice(0, 3)
                        .map((feature, index) => (
                          <div
                            key={index}
                            className="flex items-start space-x-2 text-sm"
                          >
                            <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      {paymentDetails.planMaster.features.length > 3 && (
                        <p className="text-sm text-white/80 mt-2">
                          +{paymentDetails.planMaster.features.length - 3} more
                          features
                        </p>
                      )}
                    </div>
                  )}
              </div>

              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                {React.createElement(getPlanIcon(paymentDetails.planMaster), {
                  className: "w-full h-full",
                })}
              </div>
            </div>
          </Card>
        )}

        {/* Payment Summary */}
        {paymentDetails && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Payment Details
              </h3>

              <div className="space-y-3 text-sm">
                {paymentDetails.invoice_number && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Invoice Number</span>
                    <span className="font-medium text-gray-900">
                      {paymentDetails.invoice_number}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Amount Paid</span>
                  <span className="font-semibold text-gray-900 text-base">
                    {formatCurrency(
                      paymentDetails.amount,
                      paymentDetails.currency
                    )}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Payment Date</span>
                  <span className="font-medium text-gray-900">
                    {formatDate(paymentDetails.created_at)}
                  </span>
                </div>

                {planDetails?.renewalDate && (
                  <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                    <span className="text-gray-600 flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      Next Renewal
                    </span>
                    <span className="font-medium text-gray-900">
                      {planDetails.renewalDate}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Download Receipt Button */}
          {paymentDetails &&
            (paymentDetails.receipt_url ||
              paymentDetails.invoice_pdf ||
              paymentDetails.hosted_invoice_url) && (
              <Button
                onClick={handleDownloadReceipt}
                disabled={downloadingReceipt}
                variant="outline"
                className="w-full border-2 border-green-500 text-green-700 hover:bg-green-50 rounded-xl py-3 text-base font-semibold transition-all duration-200"
                size="lg"
              >
                {downloadingReceipt ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Loading Receipt...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5 mr-2" />
                    Download Receipt
                  </>
                )}
              </Button>
            )}

          {/* Continue Button */}
          <Button
            onClick={() => navigate("/calls")}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-xl py-3 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            size="lg"
          >
            Continue to Sales Call
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
