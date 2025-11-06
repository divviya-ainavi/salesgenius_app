import { useState } from "react";
import { DealCard } from "@/types/pipeline";
import { DealCardCompact } from "./DealCardCompact";
import { Trophy, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/ui/tabs";

interface ClosedDealsGridProps {
  deals: DealCard[];
  onDealClick: (deal: DealCard) => void;
}

export const ClosedDealsGrid = ({ deals, onDealClick }: ClosedDealsGridProps) => {
  const [activeTab, setActiveTab] = useState<'won' | 'lost'>('won');
  
  const wonDeals = deals.filter(d => d.status === 'closed-won');
  const lostDeals = deals.filter(d => d.status === 'closed-lost');
  
  const wonValue = wonDeals.reduce((sum, d) => sum + d.value, 0);
  const lostValue = lostDeals.reduce((sum, d) => sum + d.value, 0);
  
  const displayDeals = activeTab === 'won' ? wonDeals : lostDeals;

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `£${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `£${(value / 1000).toFixed(0)}K`;
    return `£${value}`;
  };
  
  return (
    <div className="flex-1 overflow-auto bg-gray-50/40 px-8 py-6">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'won' | 'lost')} className="w-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-[#1D1D1F]">Closed Deals</h2>
          
          <TabsList>
            <TabsTrigger value="won" className="gap-2">
              <Trophy className="w-4 h-4" />
              Won: {wonDeals.length}
              <span className="text-xs ml-1 opacity-70">
                {formatCurrency(wonValue)}
              </span>
            </TabsTrigger>
            <TabsTrigger value="lost" className="gap-2">
              <X className="w-4 h-4" />
              Lost: {lostDeals.length}
              <span className="text-xs ml-1 opacity-70">
                {formatCurrency(lostValue)}
              </span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="won" className="mt-0">
          {wonDeals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {wonDeals.map(deal => (
                <DealCardCompact
                  key={deal.id}
                  deal={deal}
                  onClick={() => onDealClick(deal)}
                  variant="archived"
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-500">
              <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">No won deals yet</p>
              <p className="text-sm">Keep pushing! Your first win is coming.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="lost" className="mt-0">
          {lostDeals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lostDeals.map(deal => (
                <DealCardCompact
                  key={deal.id}
                  deal={deal}
                  onClick={() => onDealClick(deal)}
                  variant="archived"
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-500">
              <X className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">No lost deals</p>
              <p className="text-sm">Great work maintaining your pipeline!</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};