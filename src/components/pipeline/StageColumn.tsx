import { PipelineStage, LAPSPhase } from "@/types/pipeline";
import { DealCardCompact } from "./DealCardCompact";
import { DealCard } from "@/types/pipeline";
import { useDroppable } from '@dnd-kit/core';
import { cn } from "@/lib/utils";
import { Target, Calendar, CheckCircle, Presentation, FileText, DollarSign } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useRef } from 'react';

interface StageColumnProps {
  stage: PipelineStage;
  onDealClick: (deal: DealCard) => void;
  phase?: LAPSPhase;
}

export const StageColumn = ({ stage, onDealClick, phase }: StageColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const parentRef = useRef<HTMLDivElement>(null);

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `£${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `£${(value / 1000).toFixed(0)}K`;
    return `£${value}`;
  };

  // Virtual scrolling setup with dynamic measurement
  const virtualizer = useVirtualizer({
    count: stage.deals.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 140, // safe initial estimate
    measureElement: (el) => el?.getBoundingClientRect().height || 140,
    getItemKey: (index) => stage.deals[index].id,
    overscan: 3, // render 3 extra items above/below viewport
  });

  return (
    <div 
      ref={setNodeRef}
      className={cn(
        "flex-shrink-0 flex-basis-[280px] min-w-[260px] max-w-[300px] flex flex-col h-full transition-all duration-200",
        isOver && "shadow-[inset_0_0_0_2px_rgba(0,122,255,0.2)] bg-blue-50/40 scale-[1.01]"
      )}
    >
      {/* Column Header */}
      <div className="p-2.5 bg-white border-b border-[rgba(0,0,0,0.06)] sticky top-0 z-10">
        <div className="flex items-center justify-between mb-1.5">
          <h3 className="font-semibold text-[15px] text-[#1D1D1F]">
            {stage.name}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-[13px] text-[#86868B] font-medium">
              {stage.dealCount}
            </span>
            {stage.totalDeals > stage.dealCount && (
              <span className="text-[11px] text-[#86868B] bg-blue-50 px-1.5 py-0.5 rounded">
                of {stage.totalDeals}
              </span>
            )}
          </div>
        </div>
        
        <div className="text-[13px] text-[#6E6E73] font-medium">
          {formatCurrency(stage.totalValue)}
        </div>
      </div>

      {/* Deals List */}
      <div ref={parentRef} className="flex-1 p-2.5 overflow-y-auto">
        {stage.deals.length === 0 ? (
          <div className="text-center py-8">
            <div className="mb-2 flex justify-center">
              {stage.id === 'leads' && <Target className="w-6 h-6 text-blue-400" strokeWidth={1.5} />}
              {stage.id === 'appointment-set' && <Calendar className="w-6 h-6 text-green-400" strokeWidth={1.5} />}
              {stage.id === 'qualified' && <CheckCircle className="w-6 h-6 text-green-500" strokeWidth={1.5} />}
              {stage.id === 'presentation' && <Presentation className="w-6 h-6 text-purple-400" strokeWidth={1.5} />}
              {stage.id === 'proposal-sent' && <FileText className="w-6 h-6 text-orange-400" strokeWidth={1.5} />}
              {stage.id === 'negotiation-started' && <DollarSign className="w-6 h-6 text-orange-500" strokeWidth={1.5} />}
            </div>
            <p className="text-xs text-[#86868B] font-medium">
              {stage.id === 'leads' && 'Add your first lead'}
              {stage.id === 'appointment-set' && 'Book a meeting'}
              {stage.id === 'qualified' && 'Qualify prospects'}
              {stage.id === 'presentation' && 'Run discovery call'}
              {stage.id === 'proposal-sent' && 'Send proposal'}
              {stage.id === 'negotiation-started' && 'Close the deal'}
            </p>
          </div>
        ) : (
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const deal = stage.deals[virtualItem.index];
              return (
                <div
                  key={deal.id}
                  ref={virtualizer.measureElement}
                  data-index={virtualItem.index}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualItem.start}px)`,
                  }}
                >
                  <DealCardCompact
                    deal={deal}
                    onClick={() => onDealClick(deal)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
