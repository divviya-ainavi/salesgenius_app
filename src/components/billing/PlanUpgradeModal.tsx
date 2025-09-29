import { useSelector, useDispatch } from "react-redux";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { setShowPlanUpgradeModal } from "@/store/slices/authSlice";
import { UpgradePlanDialog } from "./UpgradePlanDialog";

export const PlanUpgradeModal = () => {
  const dispatch = useDispatch();
  const { user, showPlanUpgradeModal } = useSelector((state) => state.auth);
  const { currentPlan, availablePlans } = useSelector((state) => state.org);

  const handleClose = () => {
    dispatch(setShowPlanUpgradeModal(false));
  };

  const handleUpgrade = async (plan) => {
    // Close modal after successful upgrade initiation
    handleClose();
  };

  return (
    <UpgradePlanDialog
      isOpen={showPlanUpgradeModal}
      onClose={handleClose}
      onUpgrade={handleClose}
    />
  );
};