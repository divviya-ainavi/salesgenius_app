import { DealCard, DealStage, PipelineStage, PipelineFilters, LAPSPhase } from "@/types/pipeline";
import { StageColumn } from "./StageColumn";
import { DealCardCompact } from "./DealCardCompact";
import { useMemo } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { DndContext, DragEndEvent, DragStartEvent, DragOverlay, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { cn } from "@/lib/utils";

interface PipelineBoardProps {
  deals: DealCard[];
  filters: PipelineFilters;
  onDealClick: (deal: DealCard) => void;
  onDragStart: (deal: DealCard) => void;
  onDragEnd: (dealId: string, newStage: DealStage) => void;
  activeDragDeal: DealCard | null;
}

export const PipelineBoard = ({ 
  deals, 
  filters, 
  onDealClick, 
  onDragStart,
  onDragEnd,
  activeDragDeal 
}: PipelineBoardProps) => {
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const stageDefinitions: Record<DealStage, { name: string; description: string }> = {
    'leads': { name: 'Leads', description: 'New prospects' },
    'appointment-set': { name: 'Appointment Set', description: 'Meeting scheduled' },
    'qualified': { name: 'Qualified', description: 'Real opportunity' },
    'presentation': { name: 'Discovery', description: 'Solution presented' },
    'proposal-sent': { name: 'Proposal Sent', description: 'Formal offer made' },
    'negotiation-started': { name: 'Negotiation Started', description: 'Closing in progress' },
  };

  const filteredDeals = useMemo(() => {
    return deals.filter(deal => {
      const statusFilter = filters.statuses.length === 0 ? ['active'] : filters.statuses;
      if (!statusFilter.includes(deal.status)) return false;
      if (deal.status !== 'active') return false;
      if (filters.search && !deal.companyName.toLowerCase().includes(filters.search.toLowerCase()) &&
          !deal.contactName.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }
      if (filters.owners.length > 0 && !filters.owners.includes(deal.owner)) return false;
      if (filters.stages.length > 0 && !filters.stages.includes(deal.stage)) return false;
      if (filters.healthStatuses.length > 0 && !filters.healthStatuses.includes(deal.health)) return false;
      if (deal.confidence < filters.confidenceRange[0] || deal.confidence > filters.confidenceRange[1]) return false;
      return true;
    });
  }, [deals, filters]);

  const pipelineStages = useMemo<PipelineStage[]>(() => {
    const stages: DealStage[] = ['leads', 'appointment-set', 'qualified', 'presentation', 'proposal-sent', 'negotiation-started'];
    
    return stages.map(stageId => {
      // Calculate unfiltered total for "X of Y" display
      const allStageDeals = deals.filter(d => d.stage === stageId && d.status === 'active');
      
      const stageDeals = filteredDeals
        .filter(d => d.stage === stageId)
        .sort((a, b) => {
          // Sort by health: at-risk first, then stalled, then healthy
          const healthOrder = { 'at-risk': 0, 'stalled': 1, 'healthy': 2 };
          return healthOrder[a.health] - healthOrder[b.health];
        });
      const totalValue = stageDeals.reduce((sum, d) => sum + d.value, 0);
      const avgConfidence = stageDeals.length > 0 
        ? Math.round(stageDeals.reduce((sum, d) => sum + d.confidence, 0) / stageDeals.length)
        : 0;
      
      return {
        id: stageId,
        name: stageDefinitions[stageId].name,
        description: stageDefinitions[stageId].description,
        dealCount: stageDeals.length,
        totalDeals: allStageDeals.length,
        totalValue,
        averageConfidence: avgConfidence,
        deals: stageDeals,
      };
    });
  }, [deals, filteredDeals]);

  const getPhaseForStage = (stageId: DealStage): LAPSPhase => {
    if (stageId === 'leads') return 'L';
    if (stageId === 'appointment-set' || stageId === 'qualified') return 'A';
    if (stageId === 'presentation') return 'P';
    return 'S';
  };

  const phaseColors: Record<LAPSPhase, string> = {
    L: 'bg-[rgba(0,122,255,0.03)]',
    A: 'bg-[rgba(52,199,89,0.03)]',
    P: 'bg-[rgba(175,82,222,0.03)]',
    S: 'bg-[rgba(255,149,0,0.03)]',
  };

  const phaseLabels: Record<LAPSPhase, string> = {
    L: 'LEADS',
    A: 'APPOINTMENTS',
    P: 'DISCOVERY',
    S: 'SALES',
  };

  const phaseFullNames: Record<LAPSPhase, string> = {
    L: 'Leads',
    A: 'Appointments',
    P: 'Discovery',
    S: 'Sales'
  };

  const phaseDescriptions: Record<LAPSPhase, string> = {
    L: 'Capture & qualify inbound leads',
    A: 'Book meetings & verify opportunity',
    P: 'Understand needs & present solution',
    S: 'Negotiate & close the deal'
  };

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `£${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `£${(value / 1000).toFixed(0)}K`;
    return `£${value}`;
  };

  const stagesByPhase = useMemo(() => {
    const groups: Record<LAPSPhase, PipelineStage[]> = { L: [], A: [], P: [], S: [] };
    pipelineStages.forEach(stage => {
      const phase = getPhaseForStage(stage.id);
      groups[phase].push(stage);
    });
    return groups;
  }, [pipelineStages]);

  const phaseMetrics = useMemo(() => {
    const metrics: Record<LAPSPhase, { totalValue: number; dealCount: number; conversionRate: number }> = {
      L: { totalValue: 0, dealCount: 0, conversionRate: 0 },
      A: { totalValue: 0, dealCount: 0, conversionRate: 0 },
      P: { totalValue: 0, dealCount: 0, conversionRate: 0 },
      S: { totalValue: 0, dealCount: 0, conversionRate: 0 }
    };
    
    pipelineStages.forEach(stage => {
      const phase = getPhaseForStage(stage.id);
      metrics[phase].totalValue += stage.totalValue;
      metrics[phase].dealCount += stage.dealCount;
    });
    
    // Calculate conversion rates (deals that moved to next phase)
    metrics.L.conversionRate = metrics.L.dealCount > 0 
      ? Math.round((metrics.A.dealCount / metrics.L.dealCount) * 100) 
      : 0;
    metrics.A.conversionRate = metrics.A.dealCount > 0
      ? Math.round((metrics.P.dealCount / metrics.A.dealCount) * 100)
      : 0;
    metrics.P.conversionRate = metrics.P.dealCount > 0
      ? Math.round((metrics.S.dealCount / metrics.P.dealCount) * 100)
      : 0;
      
    return metrics;
  }, [pipelineStages]);

  const handleDragStart = (event: DragStartEvent) => {
    const deal = deals.find(d => d.id === event.active.id);
    if (deal) onDragStart(deal);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onDragEnd(active.id as string, over.id as DealStage);
    }
  };

  return (
    <div className="flex-1 px-6 py-5 overflow-hidden">
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <ScrollArea className="h-full w-full">
          <div className="flex gap-6 pb-6">
            {(['L', 'A', 'P', 'S'] as LAPSPhase[]).map((phase) => {
              const stages = stagesByPhase[phase];
              if (stages.length === 0) return null;
              
              const phaseTotalValue = phaseMetrics[phase].totalValue;
              const phaseDealCount = phaseMetrics[phase].dealCount;
              const conversionRate = phaseMetrics[phase].conversionRate;
              
              return (
                <div key={phase} className={cn(
                  "flex flex-col gap-0 p-3 rounded-2xl border-2 relative mb-4",
                  phase === 'L' && "border-blue-200 bg-blue-50/60",
                  phase === 'A' && "border-green-200 bg-green-50/60",
                  phase === 'P' && "border-purple-200 bg-purple-50/60",
                  phase === 'S' && "border-orange-200 bg-orange-50/60"
                )}>
                  {/* LAPS Phase Header */}
                  <div className="mb-2 px-1">
                    <div className="flex items-center gap-3 mb-1.5">
                      {/* Phase Number Circle */}
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-sm",
                        phase === 'L' && "bg-blue-500",
                        phase === 'A' && "bg-green-500", 
                        phase === 'P' && "bg-purple-500",
                        phase === 'S' && "bg-orange-500"
                      )}>
                        {phase}
                      </div>
                      
                      {/* Phase Title */}
                      <div className="flex-1">
                        <h2 className="text-lg font-semibold text-[#1D1D1F]">
                          {phaseFullNames[phase]}
                        </h2>
                      </div>
                      
                      {/* Phase Metrics */}
                      <div className="text-right">
                        <div className="text-sm font-semibold text-[#1D1D1F]">
                          {formatCurrency(phaseTotalValue)}
                        </div>
                        <div className="text-xs text-[#86868B]">
                          {phaseDealCount} {phaseDealCount === 1 ? 'deal' : 'deals'}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Stages Row */}
                  <div className="flex gap-4">
                    {stages.map((stage) => (
                      <StageColumn key={stage.id} stage={stage} onDealClick={onDealClick} phase={phase} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" className="h-2.5" />
        </ScrollArea>
        <DragOverlay>
          {activeDragDeal ? (
            <div className="animate-wiggle scale-105 shadow-apple-lg opacity-90">
              <DealCardCompact deal={activeDragDeal} onClick={() => {}} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};
