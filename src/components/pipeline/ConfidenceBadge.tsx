import { cn } from "@/lib/utils";

interface ConfidenceBadgeProps {
  confidence: number;
  size?: 'sm' | 'md' | 'lg';
  showEmoji?: boolean;
}

export const ConfidenceBadge = ({ confidence, size = 'md', showEmoji = true }: ConfidenceBadgeProps) => {
  const getConfidenceLevel = () => {
    if (confidence >= 80) return { color: 'bg-green-100 text-green-700 border-green-300', emoji: '🔥' };
    if (confidence >= 50) return { color: 'bg-amber-100 text-amber-700 border-amber-300', emoji: '⚡' };
    return { color: 'bg-red-100 text-red-700 border-red-300', emoji: '⚠️' };
  };

  const { color, emoji } = getConfidenceLevel();
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full border font-medium",
      color,
      sizeClasses[size]
    )}>
      {showEmoji && <span>{emoji}</span>}
      <span>{confidence}%</span>
    </span>
  );
};
