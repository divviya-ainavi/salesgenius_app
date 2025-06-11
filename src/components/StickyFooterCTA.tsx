
import React from 'react';
import { Button } from '@/components/ui/button';

interface StickyFooterCTAProps {
  onPushToHubSpot: () => void;
  disabled: boolean;
  hubspotConnected: boolean;
}

export const StickyFooterCTA: React.FC<StickyFooterCTAProps> = ({ 
  onPushToHubSpot, 
  disabled, 
  hubspotConnected 
}) => {
  return (
    <div className="sticky bottom-0 bg-card border-t border-border p-4 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-center">        
        <Button 
          onClick={onPushToHubSpot}
          disabled={disabled}
          size="lg"
          className="px-8"
        >
          Push to HubSpot
        </Button>
      </div>
    </div>
  );
};
