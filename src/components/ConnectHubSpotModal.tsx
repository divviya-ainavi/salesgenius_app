
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ConnectHubSpotModalProps {
  open: boolean;
  onClose: () => void;
}

export const ConnectHubSpotModal: React.FC<ConnectHubSpotModalProps> = ({ open, onClose }) => {
  const handleConnect = () => {
    // Open OAuth flow in new window with security attributes
    const authWindow = window.open(
      '/oauth/hubspot',
      'hubspot-auth',
      'width=600,height=700,scrollbars=yes,resizable=yes,noopener,noreferrer'
    );

    // Listen for auth completion
    const checkClosed = setInterval(() => {
      if (authWindow?.closed) {
        clearInterval(checkClosed);
        // Simulate successful auth for demo - send to specific origin
        setTimeout(() => {
          window.postMessage('hubspotConnected', window.location.origin);
        }, 1000);
      }
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect to HubSpot</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-muted-foreground">
            To push insights to HubSpot, we need to connect your account using OAuth. 
            This ensures secure access to your CRM data.
          </p>
          
          <div className="bg-muted rounded-lg p-4">
            <h4 className="font-medium mb-2">What we'll access:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Create and update contact records</li>
              <li>• Add notes and call summaries</li>
              <li>• Update deal information</li>
              <li>• Read contact and company data</li>
            </ul>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleConnect}>
              Connect to HubSpot
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
