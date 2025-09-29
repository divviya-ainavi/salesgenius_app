import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Crown, Zap, CheckCircle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const FeatureRestrictionModal = ({ 
  isOpen, 
  onClose, 
  featureName, 
  planName,
  isExpired 
}) => {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    onClose();
    navigate('/settings?tab=billing');
  };

  const features = [
    'Unlimited call transcript processing',
    'Unlimited follow-up email generation',
    'Advanced AI insights and recommendations',
    'HubSpot CRM integration',
    'Priority Support'
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="text-xl font-bold">
            {featureName} Restricted
          </DialogTitle>
          <DialogDescription className="text-base">
            {isExpired 
              ? `Your ${planName} has expired. Upgrade to continue using premium features.`
              : `This feature requires an active subscription.`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
            <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
              <Zap className="w-4 h-4 mr-2" />
              Unlock Premium Features
            </h4>
            <div className="space-y-2">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm text-blue-800">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
          <Button variant="outline" onClick={onClose} className="mt-2 sm:mt-0">
            Maybe Later
          </Button>
          <Button 
            onClick={handleUpgrade}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            <Crown className="w-4 h-4 mr-2" />
            Upgrade Now
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};