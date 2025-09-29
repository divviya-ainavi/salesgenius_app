import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  Loader2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useSelector } from "react-redux";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useSelector((state) => state.auth);
  
  const [isLoading, setIsLoading] = useState(true);
  const [planDetails, setPlanDetails] = useState(null);
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
      
      // Stop crackers after 5 seconds
      setTimeout(() => {
        setShowCrackers(false);
      }, 5000);
    }
  }, [planDetails, isLoading]);

  const verifyPaymentAndLoadDetails = async () => {
    try {
      const sessionId = searchParams.get('session_id');
      
      if (!sessionId) {
        setError("No payment session found");
        return;
      }

      // Load user's updated plan details
      const { data: userPlanData, error: userPlanError } = await supabase
        .from("user_plan")
        .select(`
          *,
          plan_master (
            id,
            plan_name,
            description,
            price,
            currency,
            duration_days
          )
        `)
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1);

      if (userPlanError || !userPlanData || userPlanData.length === 0) {
        throw new Error("Could not load updated plan details");
      }

      const userPlan = userPlanData[0];
      const planMaster = userPlan.plan_master;

      setPlanDetails({
        ...userPlan,
        ...planMaster,
        renewalDate: new Date(userPlan.end_date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      });

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Verifying payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md bg-white rounded-2xl p-8 shadow-lg">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Payment Verification Failed
          </h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => navigate("/")} className="w-full">
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center relative overflow-hidden">
      {/* Animated Confetti - Higher z-index to appear over card */}
      {showCrackers && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {/* Colorful confetti pieces */}
          {[...Array(40)].map((_, i) => {
            const shapes = ['triangle', 'circle', 'rectangle', 'diamond'];
            const colors = ['#FF6B9D', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#FF7675', '#74B9FF', '#FD79A8', '#00B894'];
            const shape = shapes[Math.floor(Math.random() * shapes.length)];
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            return (
              <div
                key={i}
                className="absolute animate-confetti-fall"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `-20px`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${4 + Math.random() * 2}s`,
                }}
              >
                {shape === 'triangle' && (
                  <div
                    className="w-0 h-0"
                    style={{
                      borderLeft: '8px solid transparent',
                      borderRight: '8px solid transparent',
                      borderBottom: `12px solid ${color}`,
                    }}
                  />
                )}
                {shape === 'circle' && (
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                )}
                {shape === 'rectangle' && (
                  <div
                    className="w-3 h-6 rounded-sm"
                    style={{ backgroundColor: color }}
                  />
                )}
                {shape === 'diamond' && (
                  <div
                    className="w-4 h-4 rotate-45"
                    style={{ backgroundColor: color }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Brand Logo at Top */}
      <div className="absolute top-12 left-1/2 transform -translate-x-1/2 z-40">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-gray-800">SalesGenius.ai</span>
        </div>
      </div>

      {/* Main Success Card */}
      <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-lg w-full mx-auto text-center relative z-30 border border-gray-100">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
          <CheckCircle className="w-10 h-10 text-white" />
        </div>

        {/* Success Message */}
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Payment succeeded!
        </h1>
        
        <p className="text-gray-600 mb-2 text-lg leading-relaxed">
          Thank you for processing your most recent payment.
        </p>
        
        <p className="text-gray-600 mb-8 text-lg leading-relaxed">
          Your premium subscription will expire on <span className="font-semibold text-gray-800">{planDetails?.renewalDate}</span>.
        </p>

        {/* Trophy Icon */}
        <div className="flex justify-center mb-6">
          <div className="text-4xl">🏆</div>
        </div>

        {/* Plan Information */}
        <div className="mb-8">
          <p className="text-gray-700 mb-3 text-lg">
            You are now subscribed to the <span className="font-bold text-blue-600">{planDetails?.plan_name || 'Pro'}</span> plan.
          </p>
          <p className="text-gray-600 text-base flex items-center justify-center">
            <span className="mr-2">💼</span>
            <span>SalesGenius works while <span className="font-semibold text-gray-800">you close deals</span>.</span>
          </p>
        </div>

        {/* Total Payment */}
        <div className="mb-8">
          <p className="text-gray-500 text-base mb-2">Total Payment</p>
          <p className="text-5xl font-bold text-gray-900">
            ${planDetails?.price || '49'}
          </p>
        </div>

        {/* Features List */}
        <div className="mb-10 text-left">
          <div className="flex items-center justify-center mb-6">
            <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
            <span className="font-semibold text-gray-800 text-lg">{planDetails?.plan_name || 'Pro'} includes:</span>
          </div>
          
          <div className="space-y-3 text-base text-gray-700">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-4 flex-shrink-0" />
              <span>Unlimited call transcript processing</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-4 flex-shrink-0" />
              <span>Unlimited follow-up email generation</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-4 flex-shrink-0" />
              <span>Advanced AI insights and recommendations</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-4 flex-shrink-0" />
              <span>Priority Support</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-4 flex-shrink-0" />
              <span>HubSpot CRM integration</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <Button
          onClick={() => navigate("/calls")}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
          size="lg"
        >
          <Sparkles className="w-5 h-5 mr-3" />
          Start Using SalesGenius
        </Button>
      </div>

      {/* Success Toast Notification */}
      <div className="fixed bottom-6 right-6 z-40">
        <div className="bg-gray-900 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-3">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <span className="font-medium">Payment successful! Your plan has been upgraded.</span>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;