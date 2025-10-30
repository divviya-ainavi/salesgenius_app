import { Stakeholder } from "@/types/pipeline";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/ui/tooltip";
import { Avatar, AvatarFallback } from "@/ui/avatar";
import { cn } from "@/lib/utils";

interface StakeholderMapProps {
  stakeholders: Stakeholder[];
}

export const StakeholderMap = ({ stakeholders }: StakeholderMapProps) => {
  const getSentimentColor = (sentiment: Stakeholder['sentiment']) => {
    switch (sentiment) {
      case 'positive': return 'ring-green-500';
      case 'neutral': return 'ring-gray-400';
      case 'negative': return 'ring-red-500';
    }
  };

  const getRoleBadgeColor = (role: Stakeholder['role']) => {
    switch (role) {
      case 'champion': return 'bg-green-100 text-green-700';
      case 'decision-maker': return 'bg-blue-100 text-blue-700';
      case 'influencer': return 'bg-purple-100 text-purple-700';
      case 'blocker': return 'bg-red-100 text-red-700';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-foreground">Stakeholder Map</h3>
      <div className="grid grid-cols-2 gap-3">
        {stakeholders.map((stakeholder) => (
          <Tooltip key={stakeholder.id}>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 p-2 rounded-lg border border-border hover:bg-accent transition-colors cursor-pointer">
                <Avatar className={cn("h-10 w-10 ring-2", getSentimentColor(stakeholder.sentiment))}>
                  <AvatarFallback className="text-xs">
                    {getInitials(stakeholder.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{stakeholder.name}</p>
                  <span className={cn(
                    "inline-block text-xs px-2 py-0.5 rounded-full",
                    getRoleBadgeColor(stakeholder.role)
                  )}>
                    {stakeholder.role}
                  </span>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <div className="space-y-1">
                <p className="font-medium">{stakeholder.name}</p>
                <p className="text-xs text-muted-foreground">{stakeholder.title}</p>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-xs">Influence: {stakeholder.influence}/10</span>
                  <span className="text-xs">•</span>
                  <span className="text-xs capitalize">{stakeholder.sentiment}</span>
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </div>
  );
};
