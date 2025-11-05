import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertTriangle, Info, Users, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { config } from "@/lib/config";
import { supabase } from "@/lib/supabase";

interface UpdateTeamSizeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  organizationPlan: {
    id: string;
    buy_quantity: number;
    used_quantity: number;
    amount: number;
    currency: string;
    plan_id: string;
    stripe_subscription_id: string;
  } | null;
  onSuccess: () => void;
}

export const UpdateTeamSizeDialog: React.FC<UpdateTeamSizeDialogProps> = ({
  isOpen,
  onClose,
  organizationPlan,
  onSuccess,
}) => {
  const [newQuantity, setNewQuantity] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [planDetails, setPlanDetails] = useState<{
    plan_name: string;
    price: number;
    currency: string;
  } | null>(null);
  const [isLoadingPlan, setIsLoadingPlan] = useState(true);

  useEffect(() => {
    if (organizationPlan) {
      setNewQuantity(organizationPlan.buy_quantity);
      fetchPlanDetails();
    }
  }, [organizationPlan]);

  const fetchPlanDetails = async () => {
    if (!organizationPlan?.plan_id) return;

    setIsLoadingPlan(true);
    try {
      const { data, error } = await supabase
        .from("plan_master")
        .select("plan_name, price, currency")
        .eq("id", organizationPlan.plan_id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPlanDetails({
          plan_name: data.plan_name,
          price: parseFloat(data.price),
          currency: data.currency,
        });
      }
    } catch (error) {
      console.error("Error fetching plan details:", error);
      toast.error("Failed to load plan details");
    } finally {
      setIsLoadingPlan(false);
    }
  };

  if (!organizationPlan) return null;

  const currentQuantity = organizationPlan.buy_quantity;
  const usedQuantity = organizationPlan.used_quantity;
  const pricePerUser = planDetails?.price || organizationPlan.amount;
  const displayCurrency = planDetails?.currency || organizationPlan.currency;
  const availableSeats = currentQuantity - usedQuantity;
  const quantityChange = newQuantity - currentQuantity;
  const isUpgrade = quantityChange > 0;
  const isDowngrade = quantityChange < 0;
  const totalAmount = pricePerUser * newQuantity;
  const changeAmount = pricePerUser * Math.abs(newQuantity);

  const getCurrencySymbol = (currency: string) => {
    const symbols: { [key: string]: string } = {
      usd: "$",
      eur: "€",
      gbp: "£",
      inr: "₹",
    };
    return symbols[currency?.toLowerCase()] || "$";
  };

  const handleQuantityChange = (increment: boolean) => {
    const minQuantity = 2;
    const newValue = increment ? newQuantity + 1 : newQuantity - 1;

    if (newValue < minQuantity) {
      toast.error(`Minimum ${minQuantity} users required`);
      return;
    }

    if (!increment && newValue < usedQuantity) {
      const seatsToRemove = usedQuantity - newValue;
      setShowWarning(true);
      setWarningMessage(
        `You are trying to reduce below the used quantity (${usedQuantity}). This will require removing ${seatsToRemove} user(s) from the organization. Only unused seats can be removed without affecting active users.`
      );
    } else {
      setShowWarning(false);
      setWarningMessage("");
    }

    setNewQuantity(newValue);
  };

  const canSubmit = () => {
    if (quantityChange === 0) return false;
    if (isDowngrade && newQuantity < usedQuantity) return false;
    return true;
  };

  const handleSubmit = async () => {
    if (!canSubmit()) return;

    setIsProcessing(true);

    try {
      const payload = {
        // organization_plan_id: organizationPlan.id,
        quantity: newQuantity,
        // current_quantity: currentQuantity,
        // used_quantity: usedQuantity,
        stripe_subscription_id: organizationPlan.stripe_subscription_id,
        // plan_id: organizationPlan.plan_id,
        action: isUpgrade ? "upgrade" : "downgrade",
      };

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}${
          config.api.endpoints.updateTeamSizeDev
        }`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Team size update failed: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const result = await response.json();
      console.log("✅ Team size updated successfully:", result);

      toast.success(
        `Team size ${isUpgrade ? "increased" : "decreased"} successfully!`
      );

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("❌ Error updating team size:", error);
      toast.error(error.message || "Failed to update team size");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] p-0 flex flex-col overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-white z-10 flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Change team size</span>
            </DialogTitle>
            {!isLoadingPlan && planDetails && (
              <Badge variant="secondary" className="text-sm font-semibold">
                {planDetails.plan_name}
              </Badge>
            )}
          </div>
          <DialogDescription>
            Adjust the number of user licenses for your organization
            {!isLoadingPlan && planDetails && (
              <span className="block mt-1 font-medium text-gray-700">
                {getCurrencySymbol(displayCurrency)}
                {pricePerUser.toFixed(2)} per user/month
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6">
          <div className="grid grid-cols-2 gap-6 py-6">
            {/* Left Column - License Controls */}
            <div className="space-y-6">
              <div>
                <Label className="text-base font-semibold mb-4 block">
                  Licenses
                </Label>

                {/* Quantity Selector */}
                <div className="flex items-center justify-center space-x-4 mb-6">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="h-12 w-12 p-0 rounded-full"
                    onClick={() => handleQuantityChange(false)}
                    disabled={newQuantity <= 2 || isProcessing}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>

                  <div className="w-24 text-center">
                    <div className="text-4xl font-bold text-gray-900">
                      {newQuantity}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {newQuantity === 1 ? "member" : "members"}
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="h-12 w-12 p-0 rounded-full"
                    onClick={() => handleQuantityChange(true)}
                    disabled={isProcessing}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Current Plan Details */}
              <div className="space-y-3 pt-4 border-t">
                <Label className="text-sm font-medium text-gray-500">
                  Current plan
                </Label>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current licenses</span>
                    <span className="font-medium">{currentQuantity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Price per user</span>
                    <span className="font-medium">
                      {getCurrencySymbol(displayCurrency)}
                      {pricePerUser.toFixed(2)} / month
                    </span>
                  </div>
                </div>
              </div>

              {/* Updated Plan Details */}
              {quantityChange !== 0 && (
                <div className="space-y-3 pt-4 border-t">
                  <Label className="text-sm font-medium text-gray-500">
                    Updated
                  </Label>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">New licenses</span>
                      <span className="font-medium">{newQuantity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Price per user</span>
                      <span className="font-medium">
                        {getCurrencySymbol(displayCurrency)}
                        {pricePerUser.toFixed(2)} / month
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Order Summary */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-base font-semibold mb-4">Order summary</h3>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Change team size</span>
                  <span className="font-medium">
                    {getCurrencySymbol(displayCurrency)}
                    {changeAmount.toFixed(2)}
                  </span>
                </div>

                {/* <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax (21%)</span>
                  <span className="font-medium">
                    {getCurrencySymbol(displayCurrency)}
                    {(changeAmount * 0.21).toFixed(2)}
                  </span>
                </div> */}

                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between">
                    <span className="font-semibold">Total</span>
                    <span className="text-xl font-bold">
                      {getCurrencySymbol(displayCurrency)}
                      {changeAmount.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Usage Information */}
                <div className="mt-6 pt-6 border-t space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Current seats</span>
                    <span className="font-medium">{currentQuantity}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Used seats</span>
                    <span className="font-medium">{usedQuantity}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Available seats</span>
                    <span className="font-medium text-green-600">
                      {availableSeats}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Warning Messages */}
          {showWarning && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{warningMessage}</AlertDescription>
            </Alert>
          )}

          {isDowngrade && newQuantity >= usedQuantity && (
            <Alert className="mb-4 bg-yellow-50 border-yellow-200">
              <Info className="h-4 w-4 text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                You can only reduce to {usedQuantity} seats (currently used).
                You have {availableSeats} unused seat(s) that can be removed.
              </AlertDescription>
            </Alert>
          )}

          {quantityChange === 0 && (
            <Alert className="mb-4 bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                Please adjust the quantity to proceed with changes.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-white z-10 flex-shrink-0">
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit() || isProcessing}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              "Confirm"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
