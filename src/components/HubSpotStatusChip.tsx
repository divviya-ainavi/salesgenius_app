
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle } from 'lucide-react';

interface HubSpotStatusChipProps {
  connected: boolean;
  onClick: () => void;
}

export const HubSpotStatusChip: React.FC<HubSpotStatusChipProps> = ({ connected, onClick }) => {
  return (
    <Badge 
      variant={connected ? "default" : "destructive"}
      className="cursor-pointer hover:opacity-80 transition-opacity px-3 py-1"
      onClick={onClick}
    >
      {connected ? (
        <CheckCircle className="w-4 h-4 mr-1" />
      ) : (
        <XCircle className="w-4 h-4 mr-1" />
      )}
      HubSpot {connected ? 'Connected' : 'Disconnected'}
    </Badge>
  );
};
