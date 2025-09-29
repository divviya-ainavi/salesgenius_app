import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Calendar,
  CreditCard,
  Home,
  Settings,
  Crown,
  Loader2,
  AlertCircle,
  Sparkles,
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
    if (name.includes("pro") || name.includes("premium")) return Crown;
    if (name.includes("ultra") || name.includes("enterprise")) return Sparkles;
    return Crown;
  };

  const getDurationText = (durationDays) => {
    if (durationDays === 30) return "Monthly";
    if (durationDays === 365) return "Annual";
    return `${durationDays} days`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-6">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-8 h-8 animate-spin text-green-600" />
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        {/* Success Header */}
        <div className="text-center mb-8">
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

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Payment Details Card */}
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-2 text-lg">
                <CreditCard className="w-5 h-5 text-green-600" />
                <span>Payment Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Amount Paid</p>
                  <p className="text-xl font-bold text-gray-900">
                    ₹{paymentDetails?.amount?.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Billing Cycle</p>
                  <p className="text-xl font-bold text-gray-900">
                    {getDurationText(paymentDetails?.duration)}
                  </p>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>Next billing: {planDetails?.renewalDate}</span>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">
                    Payment processed successfully
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Plan Card */}
          <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-500 to-indigo-600 text-white overflow-hidden">
            <CardContent className="p-6 relative">
              <div className="relative z-10">
                <Badge className="bg-white/20 text-white border-white/30 mb-4">
                  Active Plan
                </Badge>
                
                <h3 className="text-3xl font-bold mb-2">
                  {planDetails?.plan_name}
                </h3>
                <p className="text-white/90 text-lg mb-4">
                  {getDurationText(planDetails?.duration_days)}
                </p>
                
                <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                  <p className="text-white/80 text-sm">Next renewal</p>
                  <p className="text-white font-semibold">
                    {planDetails?.renewalDate}
                  </p>
                </div>
              </div>
              
              {/* Background decoration */}
              <div className="absolute -top-4 -right-4 w-24 h-24 opacity-10">
                <PlanIcon className="w-full h-full" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={() => navigate("/calls")}
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
        <Card className="mt-6 shadow-lg border-0 bg-white/90 backdrop-blur-sm">
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
  );
};

export default PaymentSuccess;