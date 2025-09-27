import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CreditCard,
  DollarSign,
  Calendar,
  CheckCircle,
  AlertCircle,
  Crown,
  Zap,
  Users,
  Clock,
  Download,
  Receipt,
  TrendingUp,
  Shield,
  Star,
  Plus,
  BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSelector } from "react-redux";

export const BillingComponent = () => {
  const { user, organizationDetails, isBetaUser } = useSelector((state) => state.auth);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [billingHistory, setBillingHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mock data - will be replaced with real API calls
  const mockPlans = {
    beta: {
      name: "Beta Trial",
      price: 0,
      period: "30 days",
      features: [
        "Basic AI insights",
        "5 call transcripts per month",
        "Email templates",
        "Basic integrations",
      ],
      status: "active",
      expiresAt: "2024-02-15",
    },
    starter: {
      name: "Starter Plan",
      price: 29,
      period: "month",
      features: [
        "Advanced AI insights",
        "50 call transcripts per month",
        "Email & presentation templates",
        "HubSpot integration",
        "Basic analytics",
      ],
      status: "available",
    },
    professional: {
      name: "Professional Plan",
      price: 79,
      period: "month",
      features: [
        "Premium AI insights",
        "Unlimited call transcripts",
        "Advanced templates",
        "All integrations",
        "Advanced analytics",
        "Team collaboration",
        "Priority support",
      ],
      status: "available",
    },
    enterprise: {
      name: "Enterprise Plan",
      price: 199,
      period: "month",
      features: [
        "Custom AI training",
        "Unlimited everything",
        "Custom integrations",
        "Advanced security",
        "Dedicated support",
        "Custom onboarding",
        "SLA guarantee",
      ],
      status: "available",
    },
  };

  const mockBillingHistory = [
    {
      id: "inv_001",
      date: "2024-01-01",
      amount: 79,
      status: "paid",
      description: "Professional Plan - January 2024",
      downloadUrl: "#",
    },
    {
      id: "inv_002",
      date: "2023-12-01",
      amount: 79,
      status: "paid",
      description: "Professional Plan - December 2023",
      downloadUrl: "#",
    },
    {
      id: "inv_003",
      date: "2023-11-01",
      amount: 79,
      status: "paid",
      description: "Professional Plan - November 2023",
      downloadUrl: "#",
    },
  ];

  useEffect(() => {
    // Load billing data
    const loadBillingData = async () => {
      try {
        // Set current plan based on user type
        if (isBetaUser) {
          setCurrentPlan(mockPlans.beta);
        } else {
          setCurrentPlan(mockPlans.professional); // Default for non-beta users
        }

        setBillingHistory(mockBillingHistory);
      } catch (error) {
        console.error("Error loading billing data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadBillingData();
  }, [isBetaUser]);

  const getPlanIcon = (planName) => {
    switch (planName) {
      case "Beta Trial":
        return Star;
      case "Starter Plan":
        return Zap;
      case "Professional Plan":
        return Crown;
      case "Enterprise Plan":
        return Shield;
      default:
        return CreditCard;
    }
  };

  const getPlanColor = (planName) => {
    switch (planName) {
      case "Beta Trial":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "Starter Plan":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Professional Plan":
        return "bg-green-100 text-green-800 border-green-200";
      case "Enterprise Plan":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "failed":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground mt-2">Loading billing information...</p>
        </div>
      </div>
    );
  }

  const PlanIcon = currentPlan ? getPlanIcon(currentPlan.name) : CreditCard;

  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CreditCard className="w-5 h-5" />
              <span>Current Plan</span>
            </div>
            {currentPlan && (
              <Badge
                variant="outline"
                className={cn("text-sm", getPlanColor(currentPlan.name))}
              >
                <PlanIcon className="w-4 h-4 mr-2" />
                {currentPlan.name}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {currentPlan ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center",
                    currentPlan.name === "Beta Trial" ? "bg-purple-100" :
                    currentPlan.name === "Starter Plan" ? "bg-blue-100" :
                    currentPlan.name === "Professional Plan" ? "bg-green-100" :
                    "bg-orange-100"
                  )}>
                    <PlanIcon className={cn(
                      "w-6 h-6",
                      currentPlan.name === "Beta Trial" ? "text-purple-600" :
                      currentPlan.name === "Starter Plan" ? "text-blue-600" :
                      currentPlan.name === "Professional Plan" ? "text-green-600" :
                      "text-orange-600"
                    )} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{currentPlan.name}</h3>
                    <p className="text-muted-foreground">
                      {currentPlan.price === 0 
                        ? "Free trial" 
                        : `$${currentPlan.price}/${currentPlan.period}`
                      }
                    </p>
                    {currentPlan.expiresAt && (
                      <p className="text-sm text-muted-foreground">
                        {currentPlan.name === "Beta Trial" 
                          ? `Trial expires: ${new Date(currentPlan.expiresAt).toLocaleDateString()}`
                          : `Next billing: ${new Date(currentPlan.expiresAt).toLocaleDateString()}`
                        }
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <Badge
                    variant={currentPlan.status === "active" ? "default" : "secondary"}
                    className={cn(
                      "mb-2",
                      currentPlan.status === "active" 
                        ? "bg-green-100 text-green-800 border-green-200"
                        : "bg-gray-100 text-gray-800 border-gray-200"
                    )}
                  >
                    {currentPlan.status === "active" ? (
                      <>
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Active
                      </>
                    ) : (
                      <>
                        <Clock className="w-3 h-3 mr-1" />
                        Inactive
                      </>
                    )}
                  </Badge>
                  {currentPlan.name === "Beta Trial" ? (
                    <Button size="sm" className="block">
                      Upgrade Plan
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" className="block">
                      Manage Plan
                    </Button>
                  )}
                </div>
              </div>

              {/* Plan Features */}
              <div>
                <h4 className="font-medium mb-3">Plan Features</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {currentPlan.features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Usage Stats */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">12</p>
                  <p className="text-xs text-muted-foreground">Calls This Month</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">8</p>
                  <p className="text-xs text-muted-foreground">Emails Generated</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">5</p>
                  <p className="text-xs text-muted-foreground">Presentations Created</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No active plan found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Plans */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>Available Plans</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(mockPlans)
              .filter(([key]) => key !== "beta") // Don't show beta plan in available plans
              .map(([key, plan]) => {
                const PlanIcon = getPlanIcon(plan.name);
                const isCurrentPlan = currentPlan?.name === plan.name;
                
                return (
                  <Card key={key} className={cn(
                    "relative transition-all duration-200 hover:shadow-md",
                    isCurrentPlan && "ring-2 ring-primary"
                  )}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <PlanIcon className="w-5 h-5 text-primary" />
                          <CardTitle className="text-lg">{plan.name}</CardTitle>
                        </div>
                        {isCurrentPlan && (
                          <Badge className="bg-primary text-primary-foreground">
                            Current
                          </Badge>
                        )}
                      </div>
                      <div className="text-left">
                        <span className="text-3xl font-bold">${plan.price}</span>
                        <span className="text-muted-foreground">/{plan.period}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        {plan.features.map((feature, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm">{feature}</span>
                          </div>
                        ))}
                      </div>
                      <Button 
                        className="w-full" 
                        variant={isCurrentPlan ? "outline" : "default"}
                        disabled={isCurrentPlan}
                      >
                        {isCurrentPlan ? "Current Plan" : "Upgrade to This Plan"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        </CardContent>
      </Card>

      {/* Payment Method */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CreditCard className="w-5 h-5" />
                <span>Payment Method</span>
              </div>
              <Button variant="outline" size="sm">
                <CreditCard className="w-4 h-4 mr-1" />
                Update
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentPlan?.name === "Beta Trial" ? (
              <div className="text-center py-6">
                <CreditCard className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-2">No payment method required</p>
                <p className="text-sm text-muted-foreground">
                  You're currently on a free trial. Add a payment method to continue after trial expires.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 border border-border rounded-lg">
                  <CreditCard className="w-8 h-8 text-muted-foreground" />
                  <div>
                    <p className="font-medium">•••• •••• •••• 4242</p>
                    <p className="text-sm text-muted-foreground">Expires 12/25</p>
                  </div>
                  <Badge variant="outline" className="ml-auto">
                    Primary
                  </Badge>
                </div>
                <Button variant="outline" className="w-full">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Payment Method
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Billing History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Receipt className="w-5 h-5" />
              <span>Billing History</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentPlan?.name === "Beta Trial" ? (
              <div className="text-center py-6">
                <Receipt className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-2">No billing history</p>
                <p className="text-sm text-muted-foreground">
                  Billing history will appear here after your first payment.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {billingHistory.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-3 border border-border rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <Receipt className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{invoice.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(invoice.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">${invoice.amount}</span>
                      <Badge
                        variant="outline"
                        className={cn("text-xs", getStatusColor(invoice.status))}
                      >
                        {invoice.status}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full mt-4">
                  View All Invoices
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Usage & Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Usage & Limits</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Call Transcripts</span>
                <span className="text-sm text-muted-foreground">
                  {currentPlan?.name === "Beta Trial" ? "12/5" : 
                   currentPlan?.name === "Starter Plan" ? "12/50" : "12/∞"}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: currentPlan?.name === "Beta Trial" ? "100%" :
                           currentPlan?.name === "Starter Plan" ? "24%" : "5%"
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {currentPlan?.name === "Beta Trial" ? "Limit exceeded" :
                 currentPlan?.name === "Starter Plan" ? "38 remaining" : "Unlimited"}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">AI Insights</span>
                <span className="text-sm text-muted-foreground">8/∞</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full w-[10%] transition-all duration-300" />
              </div>
              <p className="text-xs text-muted-foreground">Unlimited</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Team Members</span>
                <span className="text-sm text-muted-foreground">
                  {currentPlan?.name === "Beta Trial" ? "1/1" :
                   currentPlan?.name === "Starter Plan" ? "1/5" : "1/∞"}
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: currentPlan?.name === "Beta Trial" ? "100%" :
                           currentPlan?.name === "Starter Plan" ? "20%" : "5%"
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {currentPlan?.name === "Beta Trial" ? "At limit" :
                 currentPlan?.name === "Starter Plan" ? "4 remaining" : "Unlimited"}
              </p>
            </div>
          </div>

          {currentPlan?.name === "Beta Trial" && (
            <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-800">
                  Trial Ending Soon
                </span>
              </div>
              <p className="text-sm text-orange-700 mb-3">
                Your beta trial expires on {new Date(currentPlan.expiresAt).toLocaleDateString()}. 
                Upgrade to continue using SalesGenius Ai.
              </p>
              <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
                <Crown className="w-4 h-4 mr-1" />
                Upgrade Now
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};