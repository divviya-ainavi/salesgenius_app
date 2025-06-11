
import React from 'react';

interface TopNavProps {
  hubspotConnected: boolean;
  onConnectClick: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({ hubspotConnected, onConnectClick }) => {
  return (
    <nav className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold text-foreground">SalesGenius</h1>
        </div>
      </div>
    </nav>
  );
};
