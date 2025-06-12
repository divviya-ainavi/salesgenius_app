import React from 'react';
import { Phone } from 'lucide-react';

const SalesCalls = () => {
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2 flex items-center space-x-3">
          <Phone className="w-5 h-5 text-primary" />
          <span>Sales Calls</span>
        </h1>
        <p className="text-muted-foreground">
          Call management and recordings page content will be implemented here.
        </p>
      </div>
    </div>
  );
};

export default SalesCalls;

export { SalesCalls }