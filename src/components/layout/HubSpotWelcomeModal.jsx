import React, { useState, useEffect } from 'react';
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
import {
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Settings,
  Users,
  Building,
  Zap,
  ArrowRight,
  X,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export const HubSpotWelcomeModal = () => {
  const navigate = useNavigate();
  const { hubspotIntegration, user, organizationDetails } = useSelector((state) => state.auth);
  const [showModal, setShowModal] = useState(false);
  const [hasShownModal, setHasShownModal] = useState(false);

  // Check if we should show the modal
  useEffect(() => {
    const shouldShowModal = () => {
      // Don't show if already shown in this session
      if (hasShownModal) return false;
      
      // Don't show if user or organization data isn't loaded
      if (!user || !organizationDetails) return false;
      
      // Don't show if HubSpot integration data isn't loaded yet
      if (!hubspotIntegration) return false;
      
      // Show modal if HubSpot is not connected
      return !hubspotIntegration.connected;
    };

    if (shouldShowModal()) {
      // Small delay to ensure the main UI has loaded
      const timer = setTimeout(() => {
        setShowModal(true);
        setHasShownModal(true);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [hubspotIntegration, user, organizationDetails, hasShownModal]);

  const handleSetupHubSpot = () => {
    setShowModal(false);
    navigate('/settings');
    toast.info('Navigate to the Integrations section to set up HubSpot');
  };

  const handleRemindLater = () => {
    setShowModal(false);
    toast.info('You can set up HubSpot integration anytime from Settings');
  };

  const handleDismiss = () => {
    setShowModal(false);
    // Store in localStorage to not show again for this session
    localStorage.setItem('hubspot_welcome_dismissed', 'true');
  };

  // Don't render if integration is already connected
  if (hubspotIntegration?.connected) {
    return null;
  }

  return (
    <Dialog open={showModal} onOpenChange={setShowModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <ExternalLink className="w-4 h-4 text-orange-600" />
            </div>
            <span>Enhance Your Sales Workflow</span>
          </DialogTitle>
          <DialogDescription>
            Connect HubSpot to unlock powerful CRM integration features for your organization.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Organization Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <Building className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-blue-900">
                {organizationDetails?.name || 'Your Organization'}
              </span>
            </div>
            <p className="text-sm text-blue-800">
              HubSpot integration is not currently configured for your organization.
            </p>
          </div>

          {/* Benefits */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">What you'll get with HubSpot:</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-3 h-3 text-green-600" />
                <span>Sync companies and deals automatically</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-3 h-3 text-green-600" />
                <span>Push action items as HubSpot tasks</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-3 h-3 text-green-600" />
                <span>Send follow-up emails directly to CRM</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle className="w-3 h-3 text-green-600" />
                <span>Keep your sales data synchronized</span>
              </li>
            </ul>
          </div>

          {/* Current Status */}
          {hubspotIntegration && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <h4 className="font-medium text-sm mb-2">Current Status:</h4>
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span>Access Token:</span>
                  <Badge variant={hubspotIntegration.hasToken ? 'default' : 'secondary'}>
                    {hubspotIntegration.hasToken ? 'Available' : 'Missing'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Connected Users:</span>
                  <Badge variant={hubspotIntegration.hasUsers ? 'default' : 'secondary'}>
                    {hubspotIntegration.userCount || 0}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
          <Button
            variant="ghost"
            onClick={handleDismiss}
            className="mt-2 sm:mt-0 text-xs"
          >
            Don't show again
          </Button>
          <Button
            variant="outline"
            onClick={handleRemindLater}
            className="mt-2 sm:mt-0"
          >
            Remind me later
          </Button>
          <Button
            onClick={handleSetupHubSpot}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <Settings className="w-4 h-4 mr-1" />
            Set Up HubSpot
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default HubSpotWelcomeModal;