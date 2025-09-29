import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  CheckCircle,
  Home,
  Loader2,
  AlertCircle,
  Crown,
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
      const timer = setTimeout(() => {
        setShowCrackers(true);
        
        // Stop crackers after 3 seconds
        setTimeout(() => {
          setShowCrackers(false);
        }, 3000);
      }, 500);

      return () => clearTimeout(timer);
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

  const getDurationText = (durationDays) => {
    if (durationDays === 30) return "Monthly";
    if (durationDays === 365) return "Annual";
    return `${durationDays} days`;
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Crackers Animation */}
      {showCrackers && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {/* Crackers particles */}
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            >
              <div
                className={`w-2 h-2 rounded-full ${
                  ['bg-yellow-400', 'bg-red-400', 'bg-blue-400', 'bg-green-400', 'bg-purple-400', 'bg-pink-400'][
                    Math.floor(Math.random() * 6)
                  ]
                }`}
              />
            </div>
          ))}
          
          {/* Confetti strips */}
          {[...Array(15)].map((_, i) => (
            <div
              key={`strip-${i}`}
              className="absolute animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                transform: `rotate(${Math.random() * 360}deg)`,
              }}
            >
              <div
                className={`w-1 h-6 ${
                  ['bg-yellow-300', 'bg-red-300', 'bg-blue-300', 'bg-green-300', 'bg-purple-300'][
                    Math.floor(Math.random() * 5)
                  ]
                }`}
              />
            </div>
          ))}
        </div>
      )}

      {/* Main Content */}
      <div className="text-center max-w-md mx-auto relative z-10">
        {/* Success Icon */}
        <div className="w-24 h-24 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
          <CheckCircle className="w-12 h-12 text-white" />
        </div>

        {/* Success Message */}
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Payment Successful!
        </h1>
        
        <p className="text-xl text-gray-600 mb-8">
          Welcome to your new {planDetails?.plan_name} plan
        </p>

        {/* Plan Card */}
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-8 text-white mb-8 shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <div className="inline-block bg-white/20 text-white px-3 py-1 rounded-full text-sm font-medium mb-4">
              Active Plan
            </div>
            
            <h3 className="text-3xl font-bold mb-2">
              {planDetails?.plan_name}
            </h3>
            
            <p className="text-white/90 text-lg mb-4">
              ₹{planDetails?.price?.toLocaleString()} / {getDurationText(planDetails?.duration_days)}
            </p>
            
            <p className="text-white/80 text-sm">
              Next renewal: {planDetails?.renewalDate}
            </p>
          </div>
          
          {/* Background decoration */}
          <div className="absolute -top-4 -right-4 w-20 h-20 opacity-10">
            <Crown className="w-full h-full" />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Button
            onClick={() => navigate("/calls")}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
            size="lg"
          >
            <Home className="w-5 h-5 mr-2" />
            Go to Dashboard
          </Button>
          
          <p className="text-sm text-gray-500">
            Start exploring your enhanced SalesGenius AI experience
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;