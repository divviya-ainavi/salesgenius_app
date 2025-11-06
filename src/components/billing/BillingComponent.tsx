import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UpgradePlanDialog } from "./UpgradePlanDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Calendar,
  CheckCircle,
  Crown,
  Gift,
  Star,
  Loader2,
  X,
  ArrowUp,
  Zap,
  Users,
  Shield,
  Sparkles,
  AlertTriangle,
  CreditCard,
  Download,
  ExternalLink,
  FileText,
  Receipt,
  MoreVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSelector } from "react-redux";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useDispatch } from "react-redux";
import {
  setPlanDetails,
  setCurrentPlan,
  setShowUpgradeModal,
} from "../../store/slices/orgSlice";
import { dbHelpers } from "../../lib/supabase";
import { config } from "../../lib/config";

export const BillingComponent = () => {
  const { user, organizationDetails, userRole, userRoleId } = useSelector(
    (state) => state.auth
  );
  const [isLoading, setIsLoading] = useState(true);
  // const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [billingHistory, setBillingHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const dispatch = useDispatch();
  const { currentPlan, planDetails, availablePlans, showUpgradeModal } =
    useSelector((state) => state.org);

  // console.log(userRole, "user role in billing");
  useEffect(() => {
    loadPlanData();
    loadBillingHistory();
  }, [user, organizationDetails]);

  const loadPlanData = async () => {
    try {
      setIsLoading(true);

      if (user?.id) {
        // Get user's current plan from user_plan table with plan_master details
        const userPlanData = await dbHelpers.getUserPlanAndPlanMasters(user.id);

        if (userPlanData && userPlanData.length > 0) {
          // console.log(userPlanData, "user plan data");
          const userPlan = userPlanData[0];
          const planMaster = userPlan.plan_master;

          const endDate = new Date(userPlan.end_date);
          const canceled_at = new Date(userPlan.canceled_at);
          const today = new Date();
          const isDateExpired =
            endDate?.toLocaleDateString("en-CA") <
            today?.toLocaleDateString("en-CA");
          console.log(
            endDate,
            today,
            "check date",
            isDateExpired,
            endDate?.toLocaleDateString("en-CA") <
              today?.toLocaleDateString("en-CA")
          );
          const isStatusExpired =
            userPlan.status === "expired" ||
            userPlan.status === "cancelled" ||
            userPlan.is_active === false;
          const isExpired = isDateExpired || isStatusExpired;
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
      }
    } catch (error) {
      console.error("Error loading plan data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadBillingHistory = async () => {
    try {
      setIsLoadingHistory(true);

      if (user?.id && organizationDetails?.id) {
        // Check if user is org admin by checking their title/role
        const { data: profileData } = await supabase
          .from("profiles")
          .select("title_id, titles(role_id, roles(key))")
          .eq("id", user.id)
          .single();

        const isOrgAdmin = profileData?.titles?.roles?.key === "org_admin";

        let allBillingData = [];

        if (isOrgAdmin) {
          // For org admin: get organization plan billing history
          const { data: orgPlanData, error: orgError } = await supabase
            .from("organization_plan")
            .select(
              "id, plan_id, amount, currency, invoice_number, start_date, status, invoice_pdf, hosted_invoice_url, receipt_url, created_at, plan_master(plan_name)"
            )
            .eq("organization_id", organizationDetails.id)
            .not("amount", "is", null)
            .gt("amount", 0)
            .order("created_at", { ascending: false });

          if (orgError) {
            console.error(
              "Error loading organization billing history:",
              orgError
            );
          } else {
            // Transform organization plan data to match expected format
            const transformedOrgData = (orgPlanData || []).map((item) => ({
              id: item.id,
              plan_name: item.plan_master?.plan_name || "Organization Plan",
              amount: item.amount,
              currency: item.currency,
              invoice_number: item.invoice_number,
              start_date: item.start_date,
              status: item.status,
              invoice_pdf: item.invoice_pdf,
              hosted_invoice_url: item.hosted_invoice_url,
              receipt_url: item.receipt_url,
              created_at: item.created_at,
              source: "organization_plan",
            }));
            allBillingData.push(...transformedOrgData);
          }

          // Also get user's personal Pro plan history (if any)
          const { data: userPlanData, error: userError } = await supabase
            .from("user_plan")
            .select(
              "id, plan_name, amount, currency, invoice_number, start_date, status, invoice_pdf, hosted_invoice_url, receipt_url, created_at"
            )
            .eq("user_id", user.id)
            .not("amount", "is", null)
            .gt("amount", 0)
            .order("created_at", { ascending: false });

          if (userError) {
            console.error("Error loading user billing history:", userError);
          } else {
            const transformedUserData = (userPlanData || []).map((item) => ({
              ...item,
              source: "user_plan",
            }));
            allBillingData.push(...transformedUserData);
          }

          // Sort all billing data by created_at descending
          allBillingData.sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          );
        } else {
          // For non-org admin: only get user_plan billing history
          // const { data: userPlanData, error: userError } = await supabase
          //   .from("user_plan")
          //   .select(
          //     "id, plan_name, amount, currency, invoice_number, start_date, status, invoice_pdf, hosted_invoice_url, receipt_url, created_at"
          //   )
          //   .eq("user_id", user.id)
          //   .not("amount", "is", null)
          //   .gt("amount", 0)
          //   .order("created_at", { ascending: false });
          const { data: userPlanData, error: userError } = await supabase
            .from("user_plan")
            .select(
              "id, plan_name, amount, currency, invoice_number, start_date, status, invoice_pdf, plan_id, hosted_invoice_url, receipt_url, created_at"
            )
            .eq("user_id", user.id)
            .not("amount", "is", null)
            .gt("amount", 0)
            .not("plan_name", "in", "(Organization)") // ✅ Exclude plan_id 1, 2, and 3
            .order("created_at", { ascending: false });

          if (userError) {
            console.error("Error loading billing history:", userError);
            toast.error("Failed to load billing history");
          } else {
            allBillingData = (userPlanData || []).map((item) => ({
              ...item,
              source: "user_plan",
            }));
          }
        }

        setBillingHistory(allBillingData);
      }
    } catch (error) {
      console.error("Error loading billing history:", error);
      toast.error("Failed to load billing history");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const isFreePlan = (plan) => {
    if (!plan) return true;
    const planName = plan.plan_name?.toLowerCase() || "";
    return (
      planName.includes("free") ||
      planName.includes("trial") ||
      planName.includes("beta") ||
      plan.price === 0
    );
  };

  const isPaidPlan = (plan) => {
    return !isFreePlan(plan);
  };

  const getPlanIcon = (plan) => {
    if (!plan) return Gift;
    if (isFreePlan(plan)) return Gift;
    if (plan.plan_name?.toLowerCase().includes("pro")) return Crown;
    if (plan.plan_name?.toLowerCase().includes("business")) return Users;
    if (plan.plan_name?.toLowerCase().includes("enterprise")) return Shield;
    return Star;
  };

  const getPlanGradient = (plan) => {
    if (!plan) return "from-gray-500 to-gray-600";
    if (isFreePlan(plan)) return "from-green-500 to-emerald-600";
    if (plan.plan_name?.toLowerCase().includes("pro"))
      return "from-blue-500 to-indigo-600";
    if (plan.plan_name?.toLowerCase().includes("business"))
      return "from-purple-500 to-violet-600";
    if (plan.plan_name?.toLowerCase().includes("enterprise"))
      return "from-gray-800 to-black";
    return "from-blue-500 to-indigo-600";
  };

  const getDurationText = (durationDays) => {
    if (durationDays === 30) return "Monthly";
    if (durationDays === 365) return "Annual";
    if (durationDays <= 31) return "Trial";
    return `${durationDays} days`;
  };

  const handleCancelSubscription = async () => {
    setIsCancelling(true);

    try {
      console.log("🔄 Cancelling subscription for user:", user.id);

      // Call the cancellation API first
      const cancellationPayload = {
        subscription_Id: planDetails?.stripe_subscription_id,
        cancel_at_period_end: true,
        userid: user.id,
        name: user.full_name || user.email,
        email: user.email,
        dbid: planDetails?.id,
      };

      console.log(
        "📤 Sending cancellation request to API:",
        cancellationPayload
      );

      const apiResponse = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}${
          config.api.endpoints.cancelSubscriptionDev
        }`,

        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(cancellationPayload),
        }
      );

      if (!apiResponse.ok) {
        const errorText = await apiResponse.text();
        throw new Error(
          `Cancellation API failed: ${apiResponse.status} ${apiResponse.statusText} - ${errorText}`
        );
      }

      const apiResult = await apiResponse.json();
      console.log("✅ Cancellation API response:", apiResult);

      // Update user_plan to mark as cancelled
      // const { error: updateError } = await supabase
      //   .from("user_plan")
      //   .update({
      //     status: "cancelled",
      //     canceled_at: new Date().toISOString(),
      //     // Keep is_active true until period ends
      //     is_active: true,
      //   })
      //   .eq("user_id", user.id)
      //   .eq("is_active", true);

      // if (updateError) {
      //   throw updateError;
      // }

      // Reload plan data to reflect changes
      await loadPlanData();

      setShowCancelModal(false);
      toast.success(
        "Subscription cancelled successfully. You'll retain access until your current billing period ends."
      );
    } catch (error) {
      console.error("❌ Error cancelling subscription:", error);
      toast.error("Failed to cancel subscription: " + error.message);
    } finally {
      setIsCancelling(false);
    }
  };

  const getNextTierPlan = () => {
    // console.log(currentPlan, availablePlans, "get next tier");
    if (!currentPlan || !availablePlans.length) return null;

    // Find plans with higher price than current plan
    const higherPlans = availablePlans.filter(
      (plan) => plan.price > currentPlan.price
    );
    console.log(higherPlans, "higher plans");
    // Return the cheapest higher plan (next tier)
    return higherPlans.length > 0
      ? higherPlans.reduce((min, plan) => (plan.price < min.price ? plan : min))
      : null;
  };

  const handleUpgradeFromDialog = async (plan) => {
    // Reload plan data after successful upgrade
    await loadPlanData();
    dispatch(setShowUpgradeModal(false));
  };

  const formatCurrency = (amount, currency) => {
    const currencySymbols = {
      usd: "$",
      eur: "€",
      gbp: "£",
      inr: "₹",
    };
    const symbol = currencySymbols[currency?.toLowerCase()] || "$";
    return `${symbol}${parseFloat(amount).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleDownload = (url, type) => {
    if (url) {
      window.open(url, "_blank");
    } else {
      toast.error(`${type} not available`);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-primary" />
          <p className="text-muted-foreground">
            Loading billing information...
          </p>
        </div>
      </div>
    );
  }

  const nextTierPlan = getNextTierPlan();
  const showUpgradeOption =
    (isFreePlan(currentPlan) && nextTierPlan) || planDetails?.isExpired;
  // console.log(isFreePlan(currentPlan), nextTierPlan, planDetails, currentPlan);
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Billing and subscription
        </h2>
      </div>

      {/* Workspace Subscription Section */}
      <div className="space-y-6">
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Left Column - Text Content */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">
              Workspace subscription
            </h3>
            <div>
              <p className="text-muted-foreground text-base">
                Your workspace is currently subscribed to the{" "}
                <span className="font-semibold text-foreground">
                  {currentPlan.plan_name == "Pro 1"
                    ? "Pro"
                    : currentPlan.plan_name || "Unknown Plan"}
                </span>{" "}
                plan.
              </p>
            </div>
            {console.log(planDetails, "plan details")}
            {planDetails && (
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">
                  {isFreePlan(planDetails)
                    ? "Upgrade"
                    : planDetails.isExpired
                    ? "Expired"
                    : "Renews"}{" "}
                  on {planDetails.renewalDate}.
                </span>
              </div>
            )}

            {planDetails?.status == "canceled" && (
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />

                {planDetails?.status == "canceled" && (
                  <span className="text-sm">
                    {planDetails.status == "canceled" ? "Canceled" : "Renews"}{" "}
                    at {planDetails.canceled_at}.
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Plan Card and Actions */}
          <div className="space-y-4">
            {/* Current Plan Card */}
            <div
              className={cn(
                "relative rounded-2xl p-8 text-white overflow-hidden",
                `bg-gradient-to-br ${getPlanGradient(currentPlan)}`
              )}
            >
              <div className="relative z-10">
                <h3 className="text-3xl font-bold mb-2">
                  {currentPlan.plan_name == "Pro 1"
                    ? "Pro"
                    : currentPlan.plan_name || "Unknown"}
                </h3>
                <p className="text-white/80 text-lg">
                  {getDurationText(currentPlan?.duration_days)}
                </p>
              </div>

              {/* Background decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                {React.createElement(getPlanIcon(currentPlan), {
                  className: "w-full h-full",
                })}
              </div>
            </div>

            {/* Upgrade Button */}
            {showUpgradeOption && (
              <Button
                onClick={() => dispatch(setShowUpgradeModal(true))}
                className="w-full bg-white text-gray-900 hover:bg-gray-50 border border-gray-200 shadow-sm"
                size="lg"
              >
                <ArrowUp className="w-4 h-4 mr-2" />
                {planDetails?.isExpired && !isFreePlan(currentPlan)
                  ? "Renew Plan"
                  : nextTierPlan
                  ? `Upgrade to ${
                      nextTierPlan.plan_name == "Pro 1"
                        ? "Pro"
                        : nextTierPlan.plan_name
                    }`
                  : "Upgrade Plan"}
              </Button>
            )}

            {console.log(planDetails, "plan details for cancel button")}
            {/* Cancel Subscription Button for Paid Plans */}
            {isPaidPlan(currentPlan) &&
              planDetails?.status !== "canceled" &&
              (planDetails?.plan_name !== "Organization" ||
                userRoleId === 2) && (
                <Button
                  onClick={() => setShowCancelModal(true)}
                  variant="outline"
                  className="w-full text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                  size="lg"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel Subscription
                </Button>
              )}
          </div>
        </div>
      </div>

      {/* Billing History Section */}
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-6">
            Billing History
          </h3>

          {isLoadingHistory ? (
            <div className="text-center py-8">
              <Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Loading billing history...
              </p>
            </div>
          ) : billingHistory.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">
                  No billing history available
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Your payment history will appear here once you make a purchase
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted border-b">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Invoice
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Plan
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-background divide-y divide-border">
                      {billingHistory.map((invoice) => (
                        <tr
                          key={invoice.id}
                          className="hover:bg-muted/30 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Receipt className="w-4 h-4 mr-2 text-muted-foreground" />
                              <span className="text-sm font-medium text-foreground">
                                {invoice.invoice_number || "N/A"}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              <div className="text-sm text-foreground max-w-xs truncate">
                                {invoice?.plan_name == "Pro 1"
                                  ? "Pro"
                                  : invoice?.plan_name || "Unknown Plan"}
                              </div>
                              {invoice.source && (
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-xs w-fit",
                                    invoice.source === "organization_plan"
                                      ? "bg-purple-50 text-purple-700 border-purple-200"
                                      : "bg-blue-50 text-blue-700 border-blue-200"
                                  )}
                                >
                                  {invoice.source === "organization_plan" ? (
                                    <>
                                      <Users className="w-3 h-3 mr-1" />
                                      Organization
                                    </>
                                  ) : (
                                    <>
                                      <Crown className="w-3 h-3 mr-1" />
                                      Personal
                                    </>
                                  )}
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-muted-foreground">
                              {formatDate(invoice.created_at)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-foreground">
                              {formatCurrency(invoice.amount, invoice.currency)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge
                              variant={
                                invoice.status === "active"
                                  ? "default"
                                  : invoice.status === "canceled"
                                  ? "secondary"
                                  : "outline"
                              }
                              className="capitalize"
                            >
                              {invoice.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {!invoice.invoice_pdf &&
                            !invoice.hosted_invoice_url &&
                            !invoice.receipt_url ? (
                              <span className="text-xs text-muted-foreground">
                                No documents
                              </span>
                            ) : (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {invoice.invoice_pdf && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleDownload(
                                          invoice.invoice_pdf,
                                          "Invoice PDF"
                                        )
                                      }
                                    >
                                      <Download className="w-4 h-4 mr-2" />
                                      Download PDF
                                    </DropdownMenuItem>
                                  )}
                                  {invoice.hosted_invoice_url && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleDownload(
                                          invoice.hosted_invoice_url,
                                          "Hosted Invoice"
                                        )
                                      }
                                    >
                                      <ExternalLink className="w-4 h-4 mr-2" />
                                      View Invoice
                                    </DropdownMenuItem>
                                  )}
                                  {invoice.receipt_url && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleDownload(
                                          invoice.receipt_url,
                                          "Receipt"
                                        )
                                      }
                                    >
                                      <Receipt className="w-4 h-4 mr-2" />
                                      View Receipt
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Upgrade Modal */}
      <UpgradePlanDialog />

      {/* Cancel Subscription Modal */}
      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              <span>Cancel Subscription</span>
            </DialogTitle>
            <DialogDescription className="text-base leading-relaxed">
              Are you sure you want to cancel your{" "}
              {currentPlan?.plan_name == "Pro 1"
                ? "Pro"
                : currentPlan?.plan_name}{" "}
              subscription?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Current Plan Info */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <CreditCard className="w-5 h-5 text-red-600" />
                <span className="font-medium text-red-800">
                  Current Plan Details
                </span>
              </div>
              <div className="space-y-2 text-sm text-red-700">
                <div className="flex justify-between">
                  <span>Plan:</span>
                  <span className="font-medium">{currentPlan?.plan_name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Price:</span>
                  <span className="font-medium">
                    ${currentPlan?.price?.toLocaleString()} /{" "}
                    {getDurationText(currentPlan?.duration_days)}
                  </span>
                </div>
                {planDetails && (
                  <div className="flex justify-between">
                    <span>Access until:</span>
                    <span className="font-medium">
                      {planDetails.renewalDate}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Cancellation Info */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-800 mb-2">
                What happens when you cancel:
              </h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                <li>• You'll retain access until {planDetails?.renewalDate}</li>
                <li>• No further charges will be made</li>
                <li>• You can reactivate anytime before expiration</li>
                <li>• Your data will be preserved</li>
              </ul>
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowCancelModal(false)}
              disabled={isCancelling}
              className="mt-2 sm:mt-0"
            >
              Keep Subscription
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelSubscription}
              disabled={isCancelling}
              className="bg-red-600 hover:bg-red-700"
            >
              {isCancelling ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                <>
                  <X className="w-4 h-4 mr-2" />
                  Cancel Subscription
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
