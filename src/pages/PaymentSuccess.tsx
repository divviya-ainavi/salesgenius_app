import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Calendar,
  CreditCard,
  ArrowRight,
  Sparkles,
  Crown,
  Gift,
  Loader2,
  AlertCircle,
  Home,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useSelector } from "react-redux";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useSelector((state) => state.auth);
  
  const [isLoading, setIsLoading] = useState(true);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [planDetails, setPlanDetails] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    verifyPaymentAndLoadDetails();
  }, []);

  const verifyPaymentAndLoadDetails = async () => {
    try {
      const sessionId = searchParams.get('session_id');
      const planId = searchParams.get('plan_id');
      
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
            duration_days,
            features
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

      setPaymentDetails({
        sessionId,
        planId,
        amount: planMaster.price,
        currency: planMaster.currency,
        planName: planMaster.plan_name,
        duration: planMaster.duration_days,
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

  const getPlanIcon = (planName) => {
    const name = planName?.toLowerCase() || "";
    if (name.includes("free") || name.includes("trial")) return Gift;
    if (name.includes("pro") || name.includes("premium")) return Crown;
    if (name.includes("ultra") || name.includes("enterprise")) return Sparkles;
    return Crown;
  };

  const getPlanGradient = (planName) => {
    const name = planName?.toLowerCase() || "";
    if (name.includes("free") || name.includes("trial")) return "from-green-500 to-emerald-600";
    if (name.includes("pro") || name.includes("premium")) return "from-blue-500 to-indigo-600";
    if (name.includes("ultra") || name.includes("enterprise")) return "from-purple-500 to-violet-600";
    return "from-blue-500 to-indigo-600";
  };

  const getDurationText = (durationDays) => {
    if (durationDays === 30) return "Monthly";
    if (durationDays === 365) return "Annual";
    return `${durationDays} days`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Verifying Payment
              </h3>
              <p className="text-gray-600">
                Please wait while we confirm your payment and update your plan...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Payment Verification Failed
              </h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <div className="space-y-3">
                <Button onClick={() => navigate("/settings")} className="w-full">
                  <Settings className="w-4 h-4 mr-2" />
                  Go to Settings
                </Button>
                <Button onClick={() => navigate("/")} variant="outline" className="w-full">
                  <Home className="w-4 h-4 mr-2" />
                  Go to Dashboard
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const PlanIcon = getPlanIcon(planDetails?.plan_name);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Header */}
      <div className="pt-16 pb-8">
        <div className="max-w-4xl mx-auto text-center px-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full mb-6">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Payment Successful!
          </h1>
          <p className="text-xl text-gray-600">
            Welcome to your new {planDetails?.plan_name} plan
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 pb-16">
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Left Column - Payment Details */}
          <div className="space-y-6">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="w-5 h-5 text-green-600" />
                  <span>Payment Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Amount Paid</p>
                    <p className="text-lg font-semibold">
                      ₹{paymentDetails?.amount?.toLocaleString()} {paymentDetails?.currency?.toUpperCase()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Billing Cycle</p>
                    <p className="text-lg font-semibold">
                      {getDurationText(paymentDetails?.duration)}
                    </p>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      Next billing date: <span className="font-medium">{planDetails?.renewalDate}</span>
                    </span>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-800">
                      Payment processed successfully
                    </span>
                  </div>
                  <p className="text-xs text-green-700 mt-1">
                    Session ID: {paymentDetails?.sessionId}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Plan Features */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <span>Your New Plan Features</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {planDetails?.features && planDetails.features.length > 0 ? (
                  <div className="space-y-3">
                    {planDetails.features.map((feature, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <CheckCircle className="w-3 h-3 text-green-600" />
                        </div>
                        <span className="text-sm text-gray-700 leading-relaxed">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-600">
                    Enjoy all the features included in your {planDetails?.plan_name} plan!
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Plan Card */}
          <div className="space-y-6">
            <div 
              className={cn(
                "relative rounded-2xl p-8 text-white overflow-hidden shadow-2xl",
                `bg-gradient-to-br ${getPlanGradient(planDetails?.plan_name)}`
              )}
            >
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <Badge className="bg-white/20 text-white border-white/30">
                    Active Plan
                  </Badge>
                  <PlanIcon className="w-8 h-8 text-white/80" />
                </div>
                
                <h3 className="text-4xl font-bold mb-2">
                  {planDetails?.plan_name}
                </h3>
                <p className="text-white/90 text-xl mb-4">
                  {getDurationText(planDetails?.duration_days)}
                </p>
                
                <div className="bg-white/10 rounded-lg p-4 backdrop-blur-sm">
                  <p className="text-white/80 text-sm">Next renewal</p>
                  <p className="text-white font-semibold">
                    {planDetails?.renewalDate}
                  </p>
                </div>
              </div>
              
              {/* Background decoration */}
              <div className="absolute -top-4 -right-4 w-32 h-32 opacity-10">
                <PlanIcon className="w-full h-full" />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={() => navigate("/")}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
                size="lg"
              >
                <Home className="w-4 h-4 mr-2" />
                Go to Dashboard
              </Button>
              
              <Button
                onClick={() => navigate("/settings")}
                variant="outline"
                className="w-full"
                size="lg"
              >
                <Settings className="w-4 h-4 mr-2" />
                Manage Account
              </Button>
            </div>

            {/* Welcome Message */}
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <Sparkles className="w-8 h-8 mx-auto mb-3 text-purple-600" />
                <h3 className="text-lg font-semibold mb-2">Welcome to {planDetails?.plan_name}!</h3>
                <p className="text-sm text-gray-600">
                  You now have access to all premium features. Start exploring your enhanced SalesGenius AI experience.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;