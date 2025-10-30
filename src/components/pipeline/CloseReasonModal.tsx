import { useState, useEffect } from "react";
import { DealCard, DealStatus } from "@/types/pipeline";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface CloseReasonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal: DealCard | null;
  status: 'closed-won' | 'closed-lost' | null;
  onConfirm: (reason: string) => void;
}

const generateCloseSuggestions = (deal: DealCard | null, status: 'closed-won' | 'closed-lost' | null): string[] => {
  if (!status) return [];
  
  if (status === 'closed-won') {
    return [
      'Strong champion + compelling ROI',
      'Timing was perfect (budget approved)',
      'Outperformed competitors on key features',
      'Solved a critical pain point',
    ];
  } else {
    return [
      'Lost to competitor (pricing)',
      'Lost to competitor (features)',
      'Budget constraints / timing',
      'Champion left or lost influence',
      'No decision made (status quo)',
    ];
  }
};

export const CloseReasonModal = ({ open, deal, status, onConfirm, onOpenChange }: CloseReasonModalProps) => {
  const [reason, setReason] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  
  useEffect(() => {
    if (open && deal) {
      const suggestions = generateCloseSuggestions(deal, status);
      setAiSuggestions(suggestions);
      // Pre-fill with first suggestion
      setReason(suggestions[0] || '');
    } else {
      setReason('');
    }
  }, [open, deal, status]);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {status === 'closed-won' ? '🎉 Deal Won!' : '😔 Deal Lost'}
          </DialogTitle>
          <DialogDescription>
            Help us learn: Why did this deal {status === 'closed-won' ? 'succeed' : 'not close'}?
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* AI Suggested Reasons */}
          <div>
            <label className="text-sm font-medium">Quick Select (AI Suggested)</label>
            <div className="grid grid-cols-1 gap-2 mt-2">
              {aiSuggestions.map(suggestion => (
                <button
                  key={suggestion}
                  onClick={() => setReason(suggestion)}
                  className={cn(
                    "p-3 text-left text-sm border rounded-lg hover:border-primary transition-colors",
                    reason === suggestion && "border-primary bg-primary/5"
                  )}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
          
          {/* Custom Reason */}
          <div>
            <label className="text-sm font-medium">Or write your own:</label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="What was the key factor?"
              className="mt-2"
              rows={3}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={() => {
              onConfirm(reason);
              setReason('');
            }}
            disabled={!reason.trim()}
          >
            Save & Close Deal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
