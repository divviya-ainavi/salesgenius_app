import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  Home,
  Loader2,
  AlertCircle,
  X,
  Trophy,
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
      // Start crackers animation after a short delay
      setTimeout(() => {
        setShowCrackers(true);
      }, 500);
      
      // Stop crackers after 4 seconds
      setTimeout(() => {
        setShowCrackers(false);
      }, 4500);
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center p-6">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Animated Confetti */}
      {showCrackers && (
        <div className="fixed inset-0 pointer-events-none z-40">
          {/* Colorful confetti pieces */}
          {[...Array(30)].map((_, i) => {
            const shapes = ['triangle', 'circle', 'rectangle', 'diamond'];
            const colors = ['#FF6B9D', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#FF7675', '#74B9FF'];
            const shape = shapes[Math.floor(Math.random() * shapes.length)];
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            return (
              <div
                key={i}
                className="absolute animate-confetti-fall"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `-20px`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${3 + Math.random() * 2}s`,
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
                    className="w-3 h-3 rotate-45"
                    style={{ backgroundColor: color }}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Brand Logo */}
      <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-50">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-800">SalesGenius.ai</span>
        </div>
      </div>

      {/* Main Success Card */}
      <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-lg w-full mx-auto text-center relative z-50 border border-gray-100">
        {/* Success Icon */}
        <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
          <CheckCircle className="w-8 h-8 text-white" />
        </div>

        {/* Success Message */}
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          Payment succeeded!
        </h1>
        
        <p className="text-gray-600 mb-2 leading-relaxed">
          Thank you for processing your most recent payment.
        </p>
        
        <p className="text-gray-600 mb-8 leading-relaxed">
          Your premium subscription will expire on <span className="font-semibold">{planDetails?.renewalDate}</span>.
        </p>

        {/* Trophy Icon */}
        <div className="flex justify-center mb-6">
          <Trophy className="w-6 h-6 text-yellow-500" />
        </div>

        {/* Plan Information */}
        <div className="mb-8">
          <p className="text-gray-700 mb-2">
            You are now subscribed to the <span className="font-bold text-blue-600">{planDetails?.plan_name || 'Pro'}</span> plan.
          </p>
          <p className="text-gray-600 text-sm">
            <span className="text-blue-600">💼</span> SalesGenius works while <span className="font-semibold">you close deals</span>.
          </p>
        </div>

        {/* Total Payment */}
        <div className="mb-8">
          <p className="text-gray-500 text-sm mb-1">Total Payment</p>
          <p className="text-4xl font-bold text-gray-900">
            ${planDetails?.price || '49.00'}
          </p>
        </div>

        {/* Features List */}
        <div className="mb-8 text-left">
          <div className="flex items-center mb-4">
            <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
            <span className="font-semibold text-gray-800">{planDetails?.plan_name || 'Pro'} includes:</span>
          </div>
          
          <div className="space-y-2 text-sm text-gray-700">
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
              <span>Unlimited call transcript processing</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
              <span>Unlimited follow-up email generation</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
              <span>Advanced AI insights and recommendations</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
              <span>Priority Support</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-500 mr-3 flex-shrink-0" />
              <span>HubSpot CRM integration</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <Button
          onClick={() => navigate("/calls")}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
          size="lg"
        >
          <Sparkles className="w-5 h-5 mr-2" />
          Start Using SalesGenius
        </Button>
      </div>
    </div>
  );
};

export default PaymentSuccess;