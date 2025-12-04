import { useState, useMemo } from "react";
import { DealCard, PipelineFilters, DealStage } from "@/types/pipeline";
import { PipelineHeader } from "@/components/pipeline/PipelineHeader";
import { PipelineBoard } from "@/components/pipeline/PipelineBoard";
import { DealDrawer } from "@/components/pipeline/DealDrawer";
import { AdvanceConfirmationModal } from "@/components/pipeline/AdvanceConfirmationModal";
import { CloseReasonModal } from "@/components/pipeline/CloseReasonModal";
import { AddDealModal, AddDealFormData } from "@/components/pipeline/AddDealModal";
import { ClosedDealsGrid } from "@/components/pipeline/ClosedDealsGrid";
import { mockDeals } from "@/lib/mockPipelineData";
import { mockCompanies, mockContacts } from "@/lib/mockContacts";
import { toast } from "sonner";
import { format } from "date-fns";

const DealHub = () => {
  const [deals, setDeals] = useState<DealCard[]>(mockDeals);
  const [selectedDeal, setSelectedDeal] = useState<DealCard | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'active' | 'closed'>('active');
  const [filters, setFilters] = useState<PipelineFilters>({
    search: '',
    owners: ['You'], // Default to "My Deals"
    stages: [],
    statuses: ['active'],
    healthStatuses: [],
    confidenceRange: [0, 100],
  });

  // Drag-drop state
  const [draggedDeal, setDraggedDeal] = useState<DealCard | null>(null);
  const [targetStage, setTargetStage] = useState<DealStage | null>(null);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);

  // Close reason modal state
  const [closeReasonModal, setCloseReasonModal] = useState<{
    open: boolean;
    deal: DealCard | null;
    status: 'closed-won' | 'closed-lost' | null;
  }>({ open: false, deal: null, status: null });
  const [addDealModalOpen, setAddDealModalOpen] = useState(false);

  // Separate active and closed deals
  const activeDeals = useMemo(() => 
    deals.filter(d => d.status === 'active'), 
    [deals]
  );

  const closedDeals = useMemo(() => 
    deals.filter(d => d.status !== 'active'), 
    [deals]
  );

  const handleDealClick = (deal: DealCard) => {
    setSelectedDeal(deal);
    setDrawerOpen(true);
  };

  const handleDragStart = (deal: DealCard) => {
    setDraggedDeal(deal);
  };

  const handleDragEnd = (dealId: string, newStage: DealStage) => {
    const deal = deals.find(d => d.id === dealId);
    if (!deal || deal.stage === newStage) {
      setDraggedDeal(null);
      return;
    }

    // Skip confirmation for Leads → Appointment
    if (deal.stage === 'leads' && newStage === 'appointment-set') {
      setDeals(prev => prev.map(d => 
        d.id === dealId 
          ? { ...d, stage: newStage, updatedAt: new Date() }
          : d
      ));
      toast.success(`${deal.companyName} moved to Appointment Set`);
      setDraggedDeal(null);
      return;
    }

    setDraggedDeal(deal);
    setTargetStage(newStage);
    setShowAdvanceModal(true);
  };

  const calculateMoveConfidence = (deal: DealCard, newStage: DealStage): number => {
    // Simulate AI validation for 6-stage pipeline
    let confidence = deal.confidence;
    
    const stageOrder: DealStage[] = [
      'leads',
      'appointment-set',
      'qualified',
      'presentation',
      'proposal-sent',
      'negotiation-started',
    ];
    
    const currentIndex = stageOrder.indexOf(deal.stage);
    const targetIndex = stageOrder.indexOf(newStage);
    
    // Prevent moving closed deals
    if (deal.status !== 'active') return 0;
    
    // Penalize skipping stages (stricter in 6-stage model)
    if (targetIndex - currentIndex > 1) {
      confidence -= 25;
    }
    
    // Boost for natural progression
    if (targetIndex === currentIndex + 1 && deal.health === 'healthy') {
      confidence += 10;
    }
    
    // Extra validation for key transitions
    if (deal.stage === 'appointment-set' && newStage === 'qualified') {
      // Ensure first meeting happened
      if (!deal.lastInteraction || deal.lastInteraction.type !== 'meeting') {
        confidence -= 20;
      }
    }
    
    return Math.max(0, Math.min(100, confidence));
  };

  const formatStageName = (stage: DealStage) => {
    const stageNames: Record<DealStage, string> = {
      'leads': 'Leads',
      'appointment-set': 'Appointment Set',
      'qualified': 'Qualified',
      'presentation': 'Discovery',
      'proposal-sent': 'Proposal Sent',
      'negotiation-started': 'Negotiation Started',
    };
    return stageNames[stage];
  };

  const handleConfirmMove = (editedReason: string) => {
    if (!draggedDeal || !targetStage) return;
    
    // Create timestamped note entry
    const timestamp = format(new Date(), 'MMMM d, yyyy • h:mm a');
    const noteEntry = `## Moved to ${formatStageName(targetStage)} - ${timestamp}\n${editedReason}\n\n---\n\n`;
    
    // Update deal with new stage and append to notes
    setDeals(prev => prev.map(d => 
      d.id === draggedDeal.id 
        ? { 
            ...d, 
            stage: targetStage, 
            notes: noteEntry + (d.notes || ''),
            updatedAt: new Date() 
          }
        : d
    ));
    
    // Show success toast
    toast.success(
      `${draggedDeal.companyName} moved to ${formatStageName(targetStage)}`,
      { duration: 3000 }
    );
    
    setShowAdvanceModal(false);
    setDraggedDeal(null);
    setTargetStage(null);
  };

  const handleCancelMove = () => {
    setShowAdvanceModal(false);
    setDraggedDeal(null);
    setTargetStage(null);
  };

  const handleStatusChange = (dealId: string, newStatus: 'closed-won' | 'closed-lost') => {
    const deal = deals.find(d => d.id === dealId);
    if (!deal) return;
    
    setCloseReasonModal({ open: true, deal, status: newStatus });
  };

  const handleConfirmClose = (reason: string) => {
    if (!closeReasonModal.deal || !closeReasonModal.status) return;
    
    setDeals(prev => prev.map(d => 
      d.id === closeReasonModal.deal!.id 
        ? { 
            ...d, 
            status: closeReasonModal.status!,
            closeReason: reason,
            [closeReasonModal.status === 'closed-won' ? 'wonDate' : 'lostDate']: new Date()
          }
        : d
    ));
    
    toast.success(`Deal marked as ${closeReasonModal.status === 'closed-won' ? 'Won' : 'Lost'}`);
    setCloseReasonModal({ open: false, deal: null, status: null });
  };

  const handleAddDeal = (data: AddDealFormData) => {
    // Find matching company and contact
    const company = mockCompanies.find(c => c.name === data.companyName);
    const contact = mockContacts.find(c => 
      c.name === data.contactName && 
      c.currentCompanyId === company?.id
    );

    const newDeal: DealCard = {
      id: `deal-${Date.now()}`,
      dealName: data.dealName || `${data.companyName} Deal`,
      status: 'active',
      stage: data.stage,
      companyName: data.companyName,
      companyId: company?.id,
      companyLogo: company?.domain ? `https://logo.clearbit.com/${company.domain}` : undefined,
      contactName: data.contactName,
      contactTitle: contact?.title || 'Contact',
      primaryContactId: contact?.id,
      value: data.dealValue || 50000,
      currency: 'GBP',
      confidence: 20,
      health: 'healthy',
      engagementScore: 50,
      leadSource: data.leadSource as any,
      appointmentDate: data.appointmentDate,
      sentiment: 'neutral',
      lastInteraction: { type: 'email', date: new Date(), summary: 'Initial contact' },
      stakeholders: [],
      painPoints: data.painPoints ? [data.painPoints] : [],
      objections: [],
      owner: 'You',
      createdAt: new Date(),
      updatedAt: new Date(),
      daysSinceLastActivity: 0,
      notes: data.notes || '',
    };
    setDeals([newDeal, ...deals]);
    toast.success(`Deal added successfully`);
    setTimeout(() => { setSelectedDeal(newDeal); setDrawerOpen(true); }, 300);
  };

  const handleUpdateDeal = (updatedDeal: DealCard) => {
    setDeals(prev => prev.map(d => d.id === updatedDeal.id ? updatedDeal : d));
    setSelectedDeal(updatedDeal);
    toast.success('Deal updated successfully');
  };

  const aiConfidence = draggedDeal && targetStage 
    ? calculateMoveConfidence(draggedDeal, targetStage)
    : 0;

  const generateStageRationale = (deal: DealCard, targetStage: DealStage): string => {
    const stageReasons: Record<DealStage, (d: DealCard) => string> = {
      'leads': () => '',
      'appointment-set': (d) => `Lead ${d.companyName} has shown interest. Book discovery call to qualify.`,
      'qualified': (d) => {
        const hasMetCriteria = d.lastInteraction?.type === 'meeting';
        return hasMetCriteria 
          ? `Discovery call completed. ${d.contactName} confirmed budget and decision timeline.`
          : `⚠️ Warning: No meeting recorded. Ensure discovery call happened before qualifying.`;
      },
      'presentation': (d) => `Qualified prospect ready for presentation. Key pain points: ${d.painPoints?.slice(0, 2).join(', ') || 'TBD'}.`,
      'proposal-sent': (d) => `Presentation delivered. Sending formal proposal with pricing.`,
      'negotiation-started': (d) => {
        const isAtRisk = d.health === 'at-risk';
        return isAtRisk
          ? `⚠️ Deal health is at-risk. Address objections: ${d.objections?.slice(0, 2).join(', ') || 'Unknown'}.`
          : `Proposal accepted. Entering final negotiations.`;
      }
    };
    
    return stageReasons[targetStage]?.(deal) || 'Moving deal forward based on progress indicators.';
  };

  const rationale = draggedDeal && targetStage
    ? generateStageRationale(draggedDeal, targetStage)
    : "";

  return (
    <div className="flex flex-col h-full overflow-hidden bg-background">
      <PipelineHeader 
        filters={filters} 
        onFiltersChange={setFilters} 
        onAddDeal={() => setAddDealModalOpen(true)}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
      
      {viewMode === 'active' ? (
        <PipelineBoard 
          deals={activeDeals}
          filters={filters}
          onDealClick={handleDealClick}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          activeDragDeal={draggedDeal}
        />
      ) : (
        <ClosedDealsGrid
          deals={closedDeals}
          onDealClick={handleDealClick}
        />
      )}
      
      <DealDrawer
        deal={selectedDeal}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onStatusChange={handleStatusChange}
        onUpdateDeal={handleUpdateDeal}
        onTriggerStageChange={(deal, newStage) => {
          setDraggedDeal(deal);
          setTargetStage(newStage);
          setDrawerOpen(false);
          setTimeout(() => setShowAdvanceModal(true), 300);
        }}
      />
      <AdvanceConfirmationModal
        open={showAdvanceModal}
        onOpenChange={setShowAdvanceModal}
        deal={draggedDeal}
        targetStage={targetStage}
        aiConfidence={aiConfidence}
        rationale={rationale}
        onConfirm={handleConfirmMove}
        onCancel={handleCancelMove}
      />
      <CloseReasonModal
        open={closeReasonModal.open}
        deal={closeReasonModal.deal}
        status={closeReasonModal.status}
        onConfirm={handleConfirmClose}
        onOpenChange={(open) => setCloseReasonModal(prev => ({ ...prev, open }))}
      />
      <AddDealModal open={addDealModalOpen} onOpenChange={setAddDealModalOpen} onSubmit={handleAddDeal} />
    </div>
  );
};

export default DealHub;
