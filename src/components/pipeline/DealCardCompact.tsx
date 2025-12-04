import { DealCard } from "@/types/pipeline";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow } from "date-fns";
import { useDraggable } from '@dnd-kit/core';
import { Target, Calendar, CheckCircle, TrendingUp } from 'lucide-react';

interface DealCardCompactProps {
  deal: DealCard;
  onClick: () => void;
  variant?: 'default' | 'archived';
}

export const DealCardCompact = ({ deal, onClick, variant = 'default' }: DealCardCompactProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: deal.id,
    disabled: variant === 'archived',
  });

  const isLeadsStage = deal.stage === 'leads';
  const isAppointmentStage = deal.stage === 'appointment-set';

  const formatCurrency = (value: number) => {
    if (value >= 1000000) return `£${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `£${(value / 1000).toFixed(0)}K`;
    return `£${value}`;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };

  const isClosedDeal = deal.status === 'closed-won' || deal.status === 'closed-lost';

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={variant === 'default' ? setNodeRef : undefined}
      style={variant === 'default' ? style : undefined}
      {...(variant === 'default' ? listeners : {})}
      {...(variant === 'default' ? attributes : {})}
      onClick={onClick}
      className={cn(
        "w-full mb-3 p-3 rounded-xl border border-[rgba(0,0,0,0.06)] bg-white cursor-pointer flex-shrink-0 relative",
        "transition-all duration-300 ease-out",
        "hover:scale-[1.02] hover:shadow-apple hover:border-[rgba(0,0,0,0.12)]",
        "active:scale-[0.99]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
        deal.health === 'at-risk' && variant === 'default' && "!border-red-300 !border-2",
        variant === 'archived' && "opacity-75 bg-gray-50/50",
        isDragging && "opacity-50"
      )}
    >
      {/* AI Nudge Indicator */}
      {!isClosedDeal && deal.aiNudge && !deal.aiNudge.dismissed && (
        <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-blue-500 rounded-full animate-pulse border-2 border-white" />
      )}
      {/* Deal Name + Value Row */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <h3 className="font-medium text-sm text-[#1D1D1F] truncate leading-tight">
          {deal.dealName || deal.companyName}
        </h3>
        <span className="text-[13px] font-medium text-[#636366] flex-shrink-0 leading-tight">
          {formatCurrency(deal.value)}
        </span>
      </div>

      {/* Company + Contact */}
      <div className="flex items-center gap-2 mb-1.5">
        <div className="w-4 h-4 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-600 text-[9px] font-medium shadow-sm flex-shrink-0">
          {getInitials(deal.companyName)}
        </div>
        <p className="text-xs text-[#636366] truncate">
          {deal.companyName} • {deal.contactName}
        </p>
      </div>

      {/* Stage-Specific Info or Archived Info */}
      {variant === 'archived' ? (
        <div className="space-y-1.5">
          {/* Close Date */}
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <Calendar className="w-3 h-3" />
            <span>
              Closed {(deal.wonDate || deal.lostDate) && formatDistanceToNow(deal.wonDate || deal.lostDate!, { addSuffix: true })}
            </span>
          </div>
          
          {/* Close Reason Preview */}
          {deal.closeReason && (
            <div className="text-xs text-gray-500 line-clamp-2 italic">
              "{deal.closeReason}"
            </div>
          )}
          
          {/* Status Badge */}
          <div className="flex items-center gap-2 pt-1">
            <div className={cn(
              "px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide",
              deal.status === 'closed-won' && "bg-green-100 text-green-700",
              deal.status === 'closed-lost' && "bg-red-100 text-red-700"
            )}>
              {deal.status === 'closed-won' ? '✓ Won' : '✗ Lost'}
            </div>
          </div>
        </div>
      ) : (
        <>
          {isLeadsStage ? (
            <div className="mb-1.5 p-1.5 bg-[rgba(0,122,255,0.08)] rounded-lg border border-[rgba(0,122,255,0.15)]">
              <div className="flex items-center gap-2">
                <Target className="w-3 h-3 text-blue-600" strokeWidth={2} />
                <p className="text-xs text-blue-600 font-medium line-clamp-1">
                  {deal.leadSource || 'New Lead'} • {format(deal.createdAt, 'MMM dd')}
                </p>
              </div>
            </div>
          ) : isAppointmentStage ? (
            <div className="mb-1.5 p-1.5 bg-[rgba(52,199,89,0.08)] rounded-lg border border-[rgba(52,199,89,0.15)]">
              <div className="flex items-center gap-2">
                <Calendar className="w-3 h-3 text-green-700" strokeWidth={2} />
                <p className="text-xs text-green-700 font-medium line-clamp-1">
                  {deal.appointmentDate ? format(deal.appointmentDate, 'MMM dd, h:mm a') : 'Date TBD'}
                </p>
              </div>
              {deal.calendarIntegrated && (
                <div className="flex items-center gap-1 mt-1">
                  <CheckCircle className="w-2.5 h-2.5 text-green-600" strokeWidth={2} />
                  <p className="text-[10px] text-green-600">Synced</p>
                </div>
              )}
            </div>
          ) : !isClosedDeal && deal.nextBestMove ? (
            <div className="mb-1.5 p-1.5 bg-gray-50 rounded-lg border border-gray-100">
              <div className="flex items-start gap-2">
                <TrendingUp className="w-3 h-3 text-gray-500 mt-0.5 flex-shrink-0" strokeWidth={2} />
                <p className="text-xs text-gray-600 line-clamp-2">
                  {deal.nextBestMove.action}
                </p>
              </div>
            </div>
          ) : null}

          {/* Health Indicator with Gradient */}
          <div className="flex items-center justify-between text-[13px] text-[#86868B]">
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-3 h-3 rounded-full shadow-sm",
                deal.health === 'healthy' && "bg-gradient-to-br from-green-400 to-green-600",
                deal.health === 'at-risk' && "bg-gradient-to-br from-red-400 to-red-600",
                deal.health === 'stalled' && "bg-gradient-to-br from-amber-400 to-amber-600"
              )} />
              {!isClosedDeal && deal.nextBestMove && (
                <span className="font-medium text-[#636366]">
                  {format(deal.nextBestMove.dueDate, 'MMM dd')}
                </span>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
