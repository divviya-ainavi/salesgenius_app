import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle, Home, Loader2, AlertCircle, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useSelector } from "react-redux";
import { dbHelpers } from "../lib/supabase";
import { setCurrentPlan, setPlanDetails } from "../store/slices/orgSlice";
import { useDispatch } from "react-redux";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useSelector((state) => state.auth);
  const { planDetails } = useSelector((state) => state.org);
  const dispatch = useDispatch();

  const [isLoading, setIsLoading] = useState(true);
  // const [planDetails, setPlanDetails] = useState(null);
  const [error, setError] = useState(null);
  const [showCrackers, setShowCrackers] = useState(false);

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

      // Load user's updated plan details
      const userPlanData = await dbHelpers.getUserPlanAndPlanMasters(user?.id);

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

      toast.success("Payment successful! Your plan has been upgraded.");
    } catch (error) {
      console.error("Error verifying payment:", error);
      setError(error.message);
      toast.error("Error verifying payment: " + error.message);
    } finally {
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
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

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
      <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-md w-full mx-auto text-center relative z-10">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
          <CheckCircle className="w-10 h-10 text-white" />
        </div>

        {/* Success Message */}
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Payment Successful! 🎉
        </h1>

        <p className="text-lg text-gray-600 mb-8 leading-relaxed">
          Thank you for processing your most recent payment.
          <br />
          Your premium subscription will expire on {planDetails?.renewalDate}.
        </p>

        {/* Action Button */}
        <Button
          onClick={() => navigate("/calls")}
          className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-xl py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
          size="lg"
        >
          Visit dashboard
        </Button>
      </div>
    </div>
  );
};

export default PaymentSuccess;
