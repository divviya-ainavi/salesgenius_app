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
import { AlertTriangle, Crown, ArrowUp, X, Calendar, Zap } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import {
  setPlanExpiryModal,
  setShowUpgradeModal,
} from "@/store/slices/orgSlice";

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
    dispatch(
      setPlanExpiryModal({
        isOpen: false,
        featureName: "",
        featureDescription: "",
      })
    );
  };

  const handleUpgrade = () => {
    // Close this modal first
    handleClose();
    // Open upgrade modal
    dispatch(setShowUpgradeModal(true));
  };

  return (
    <Dialog open={planExpiryModal.isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">
            Your plan has expired
          </DialogTitle>
          <DialogDescription className="text-center text-base text-muted-foreground">
            Upgrade to continue using {planExpiryModal?.featureName}
          </DialogDescription>
        </DialogHeader>

        <div className="text-center py-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Access Restricted
          </h3>
          
          <p className="text-gray-600 mb-6">
            Your {currentPlan?.plan_name || "plan"} has expired. 
            Upgrade to continue using all features.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center space-x-2 text-blue-800">
              <Crown className="w-5 h-5" />
              <span className="font-medium">Upgrade to Pro Plan</span>
            </div>
            <p className="text-sm text-blue-700 mt-1">
              Get unlimited access to all features
            </p>
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-center sm:space-x-3">
          <Button
            variant="outline"
            onClick={handleClose}
            className="mt-2 sm:mt-0 px-6"
          >
            Maybe Later
          </Button>
          <Button
            onClick={handleUpgrade}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-6"
          >
            <ArrowUp className="w-4 h-4 mr-2" />
            Upgrade Plan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
