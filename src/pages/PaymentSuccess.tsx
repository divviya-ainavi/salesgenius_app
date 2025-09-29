import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  Loader2,
  AlertCircle,
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
      // Start crackers animation after a short delay
      setTimeout(() => {
        setShowCrackers(true);
      }, 500);
      
      // Stop crackers after 5 seconds
      setTimeout(() => {
        setShowCrackers(false);
      }, 5500);
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Payment Verification Failed
          </h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => navigate("/calls")} className="w-full">
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Brand Logo */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">SG</span>
          </div>
          <span className="text-xl font-bold text-gray-900">SalesGenius.ai</span>
        </div>
      </div>

      {/* Animated Crackers/Confetti */}
      {showCrackers && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(40)].map((_, i) => {
            const shapes = ['triangle', 'circle', 'rectangle', 'diamond'];
            const colors = ['#FF6B9D', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#FF8A80', '#81C784', '#64B5F6', '#FFB74D'];
            const shape = shapes[Math.floor(Math.random() * shapes.length)];
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            return (
              <div
                key={i}
                className="absolute animate-cracker-fall"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `-30px`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${4 + Math.random() * 2}s`,
                  zIndex: 60,
                }}
              >
                {shape === 'triangle' && (
                  <div
                    className="w-0 h-0"
                    style={{
                      borderLeft: '6px solid transparent',
                      borderRight: '6px solid transparent',
                      borderBottom: `10px solid ${color}`,
                    }}
                  />
                )}
                {shape === 'circle' && (
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                )}
                {shape === 'rectangle' && (
                  <div
                    className="w-2 h-5 rounded-sm"
                    style={{ backgroundColor: color }}
                  />
                )}
                {shape === 'diamond' && (
                  <div
                    className="w-3 h-3 transform rotate-45"
                    style={{ backgroundColor: color }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Success Notification Toast */}
      <div className="fixed bottom-6 right-6 z-50">
        <div className="bg-gray-900 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-green-400" />
          <span className="text-sm font-medium">Payment successful! Your plan has been upgraded.</span>
        </div>
      </div>

      {/* Main Success Card */}
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-auto text-center relative z-10">
        {/* Success Icon */}
        <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-white" />
        </div>

        {/* Success Message */}
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Payment succeeded!
        </h1>
        
        <p className="text-gray-600 mb-2">
          Thank you for processing your most recent payment.
        </p>
        
        <p className="text-gray-600 mb-6">
          Your premium subscription will expire on {planDetails?.renewalDate}.
        </p>

        {/* Trophy and Plan Info */}
        <div className="mb-6">
          <div className="text-2xl mb-2">🏆</div>
          <p className="text-gray-700 mb-1">
            You are now subscribed to the <span className="font-semibold text-blue-600">{planDetails?.plan_name}</span> plan.
          </p>
          <p className="text-gray-600 text-sm flex items-center justify-center">
            <span className="mr-1">💼</span>
            SalesGenius works while you close deals.
          </p>
        </div>

        {/* Total Payment */}
        <div className="mb-6">
          <p className="text-gray-500 text-sm mb-1">Total Payment</p>
          <p className="text-3xl font-bold text-gray-900">
            ₹{planDetails?.price?.toLocaleString() || '49'}
          </p>
        </div>

        {/* Features List */}
        <div className="mb-8 text-left">
          <div className="flex items-center mb-3">
            <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
            <span className="font-medium text-gray-700">{planDetails?.plan_name} includes:</span>
          </div>
          
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
              <span>Unlimited call transcript processing</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
              <span>Unlimited follow-up email generation</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
              <span>Advanced AI insights and recommendations</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
              <span>Priority Support</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
              <span>HubSpot CRM integration</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <Button
          onClick={() => navigate("/calls")}
          className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl py-3 text-base font-semibold shadow-lg"
        >
          Start Using SalesGenius
        </Button>
      </div>
    </div>
  );
};

export default PaymentSuccess;