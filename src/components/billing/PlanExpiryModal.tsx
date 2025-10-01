import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  Crown,
  ArrowUp,
  X,
  Calendar,
  Zap,
} from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { setPlanExpiryModal, setShowUpgradeModal } from "@/store/slices/orgSlice";

interface PlanExpiryModalProps {
  featureName: string;
  featureDescription: string;
  featureIcon?: React.ComponentType<{ className?: string }>;
}

export const PlanExpiryModal: React.FC<PlanExpiryModalProps> = ({
  featureName,
  featureDescription,
  featureIcon: FeatureIcon = Zap,
}) => {
  const dispatch = useDispatch();
  const { currentPlan, planDetails, planExpiryModal } = useSelector(
    (state) => state.org
  );

  const handleClose = () => {
    dispatch(setPlanExpiryModal({ isOpen: false, featureName: "", featureDescription: "" }));
  };

  const handleUpgrade = () => {
    // Close this modal first
    handleClose();
    // Open upgrade modal
    dispatch(setShowUpgradeModal(true));
  };

  const isFreePlan = (plan: any) => {
    if (!plan) return true;
    const planName = plan.plan_name?.toLowerCase() || "";
    return (
      planName.includes("free") ||
      planName.includes("trial") ||
      planName.includes("beta") ||
      plan.price === 0
    );
  };

  return (
    <Dialog open={planExpiryModal.isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            <span>Plan Expired</span>
          </DialogTitle>
          <DialogDescription className="text-base leading-relaxed">
            Your {currentPlan?.plan_name || "current plan"} has expired and you no longer have access to this feature.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Feature Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <FeatureIcon className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-800">
                {featureName}
              </span>
            </div>
            <p className="text-sm text-blue-700">
              {featureDescription}
            </p>
          </div>

          {/* Plan Status */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <Calendar className="w-5 h-5 text-red-600" />
              <span className="font-medium text-red-800">
                Plan Status
              </span>
            </div>
            <div className="space-y-2 text-sm text-red-700">
              <div className="flex justify-between">
                <span>Current Plan:</span>
                <span className="font-medium">{currentPlan?.plan_name}</span>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <Badge variant="destructive" className="text-xs">
                  Expired
                </Badge>
              </div>
              {planDetails && (
                <div className="flex justify-between">
                  <span>Expired on:</span>
                  <span className="font-medium">
                    {planDetails.renewalDate}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Call to Action */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
            <div className="text-center">
              <Crown className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <h4 className="font-medium text-blue-800 mb-2">
                Upgrade to Continue
              </h4>
              <p className="text-sm text-blue-700">
                Upgrade to a Pro plan to regain access to {featureName.toLowerCase()} and all premium features.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
          <Button
            variant="outline"
            onClick={handleClose}
            className="mt-2 sm:mt-0"
          >
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleUpgrade}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            <ArrowUp className="w-4 h-4 mr-2" />
            Upgrade Now
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};