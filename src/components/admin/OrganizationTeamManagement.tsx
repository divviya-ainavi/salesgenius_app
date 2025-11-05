import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, AlertCircle, Target, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { UpdateTeamSizeDialog } from "./UpdateTeamSizeDialog";
import { dbHelpers } from "@/lib/supabase";
import { useSelector } from "react-redux";

export const OrganizationTeamManagement: React.FC = () => {
  const { organizationDetails } = useSelector((state: any) => state.auth);
  const [organizationPlan, setOrganizationPlan] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);

  useEffect(() => {
    if (organizationDetails?.id) {
      loadOrganizationPlan();
    }
  }, [organizationDetails]);

  const loadOrganizationPlan = async () => {
    if (!organizationDetails?.id) return;

    setIsLoading(true);
    try {
      const plan = await dbHelpers.getOrganizationPlan(organizationDetails.id);

      if (plan) {
        setOrganizationPlan(plan);
      } else {
        console.log("No active organization plan found");
      }
    } catch (error) {
      console.error("Error loading organization plan:", error);
      toast.error("Failed to load organization plan");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateSuccess = () => {
    loadOrganizationPlan();
  };

  if (!organizationDetails) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No organization details found. Please ensure you're part of an organization.
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading organization plan...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!organizationPlan) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No active organization plan found. Please upgrade to an organization plan to manage team members.
        </AlertDescription>
      </Alert>
    );
  }

  const buyQuantity = organizationPlan.buy_quantity || 0;
  const usedQuantity = organizationPlan.used_quantity || 0;
  const availableSeats = buyQuantity - usedQuantity;
  const isLimitReached = availableSeats === 0;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Team Capacity</span>
            </CardTitle>
            <Button
              variant="outline"
              onClick={() => setShowUpdateDialog(true)}
              className="flex items-center space-x-2"
            >
              <Target className="w-4 h-4" />
              <span>Update Team Size</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6">
            {/* Team Size */}
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-2">Team Size</div>
              <div className="text-4xl font-bold text-foreground">{buyQuantity}</div>
            </div>

            {/* Used */}
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-2">Used</div>
              <div className="text-4xl font-bold text-blue-600">{usedQuantity}</div>
            </div>

            {/* Available */}
            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-2">Available</div>
              <div
                className={`text-4xl font-bold ${
                  availableSeats === 0 ? "text-red-600" : "text-green-600"
                }`}
              >
                {availableSeats}
              </div>
            </div>
          </div>

          {/* Warning Message */}
          {isLimitReached && (
            <Alert variant="destructive" className="mt-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Team size limit reached. All {buyQuantity} seats are currently in use.
                Please upgrade your team size to invite more users.
              </AlertDescription>
            </Alert>
          )}

          {/* Plan Details */}
          <div className="mt-6 pt-6 border-t">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plan Name:</span>
                <span className="font-medium">
                  {organizationPlan.plan_master?.plan_name || "Organization Plan"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <Badge
                  variant={organizationPlan.is_active ? "default" : "secondary"}
                  className="capitalize"
                >
                  {organizationPlan.status || "active"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Price per user:</span>
                <span className="font-medium">
                  ${organizationPlan.amount?.toFixed(2) || "0.00"} / month
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total cost:</span>
                <span className="font-medium">
                  ${((organizationPlan.amount || 0) * buyQuantity).toFixed(2)} / month
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <UpdateTeamSizeDialog
        isOpen={showUpdateDialog}
        onClose={() => setShowUpdateDialog(false)}
        organizationPlan={{
          id: organizationPlan.id,
          buy_quantity: buyQuantity,
          used_quantity: usedQuantity,
          amount: organizationPlan.amount || 0,
          currency: organizationPlan.currency || "usd",
          plan_id: organizationPlan.plan_id,
          stripe_subscription_id: organizationPlan.stripe_subscription_id,
        }}
        onSuccess={handleUpdateSuccess}
      />
    </>
  );
};
