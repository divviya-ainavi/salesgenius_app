import React from 'react';
import { Search } from 'lucide-react';

const Research = () => {
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-2 flex items-center space-x-3">
          <Search className="w-5 h-5 text-primary" />
          <span>Research</span>
        </h1>
        <p className="text-muted-foreground">
          Customer research and insights page content will be implemented here.
        </p>
      </div>
    </div>
  );
};

export default Research;

export { Research }