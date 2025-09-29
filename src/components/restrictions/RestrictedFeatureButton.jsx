import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Crown, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDispatch } from "react-redux";
import { setShowPlanUpgradeModal } from "@/store/slices/authSlice";
import { toast } from "sonner";

export const RestrictedFeatureButton = ({
  children,
  featureName,
  className,
  variant = "default",
  size = "default",
  disabled = false,
  ...props
}) => {
  const dispatch = useDispatch();

  const handleUpgradeClick = () => {
    toast.info(`Upgrade your plan to access ${featureName}`);
    dispatch(setShowPlanUpgradeModal(true));
  };

  return (
    <div className="relative">
      <Button
        onClick={handleUpgradeClick}
        variant={variant}
        size={size}
        className={cn(
          "relative overflow-hidden",
          "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600",
          "text-white border-0 shadow-lg hover:shadow-xl",
          "transition-all duration-200",
          className
        )}
        {...props}
      >
        <div className="flex items-center space-x-2">
          <Lock className="w-4 h-4" />
          <span>Upgrade to Access</span>
          <ArrowUp className="w-4 h-4" />
        </div>
      </Button>
      
      {/* Premium Badge */}
      <Badge 
        variant="outline" 
        className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 text-xs font-bold shadow-lg"
      >
        <Crown className="w-3 h-3 mr-1" />
        PRO
      </Badge>
    </div>
  );
};