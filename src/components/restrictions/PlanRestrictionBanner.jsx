import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Crown, AlertTriangle, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

export const PlanRestrictionBanner = ({ 
  isVisible, 
  planName, 
  daysRemaining, 
  isExpired,
  className 
}) => {
  const navigate = useNavigate();

  if (!isVisible) return null;

  const handleUpgrade = () => {
    navigate('/settings?tab=billing');
  };

  return (
    <Alert 
      variant="destructive" 
      className={cn(
        "border-orange-200 bg-gradient-to-r from-orange-50 to-red-50 mb-6",
        className
      )}
    >
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertDescription className="flex items-center justify-between w-full">
        <div className="flex-1">
          {isExpired ? (
            <span className="text-orange-800 font-medium">
              Your {planName} has expired. Upgrade to continue using premium features.
            </span>
          ) : (
            <span className="text-orange-800 font-medium">
              Your {planName} expires in {daysRemaining} days. Upgrade to avoid service interruption.
            </span>
          )}
        </div>
        <Button 
          onClick={handleUpgrade}
          size="sm"
          className="ml-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white"
        >
          <Crown className="w-4 h-4 mr-1" />
          Upgrade Plan
        </Button>
      </AlertDescription>
    </Alert>
  );
};