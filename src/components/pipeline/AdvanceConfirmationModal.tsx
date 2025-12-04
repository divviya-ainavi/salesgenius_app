import { DealCard, DealStage } from "@/types/pipeline";
import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/ui/alert-dialog";
import { Textarea } from "@/ui/textarea";
import { Label } from "@/ui/label";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { AlertTriangle } from "lucide-react";

interface AdvanceConfirmationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal: DealCard | null;
  targetStage: DealStage | null;
  aiConfidence: number;
  rationale: string;
  onConfirm: (editedReason: string) => void;
  onCancel: () => void;
}

export const AdvanceConfirmationModal = ({
  open,
  onOpenChange,
  deal,
  targetStage,
  aiConfidence,
  rationale,
  onConfirm,
  onCancel,
}: AdvanceConfirmationModalProps) => {
  const [editableReason, setEditableReason] = useState(rationale);

  useEffect(() => {
    setEditableReason(rationale);
  }, [rationale, open]);

  if (!deal || !targetStage) return null;

  const formatStage = (stage: DealStage) => {
    return stage
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Move to {formatStage(targetStage)}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            <div className="space-y-3 mt-2">
              <p className="text-sm">
                Advancing{" "}
                <span className="font-medium">{deal.companyName}</span> from{" "}
                <span className="font-medium">{formatStage(deal.stage)}</span>{" "}
                to{" "}
                <span className="font-medium">{formatStage(targetStage)}</span>
              </p>

              <div className="flex items-center justify-between mb-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <span className="text-sm font-medium text-gray-700">
                  AI Confidence
                </span>
                <ConfidenceBadge
                  confidence={Math.round(aiConfidence)}
                  size="md"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="move-reason">Reason for Move</Label>
                <Textarea
                  id="move-reason"
                  value={editableReason}
                  onChange={(e) => setEditableReason(e.target.value)}
                  className="min-h-[100px]"
                  placeholder="Add notes about why this deal is advancing..."
                />
                <p className="text-xs text-muted-foreground">
                  This will be added to the deal's notes timeline
                </p>
              </div>

              {aiConfidence < 60 && (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <p className="text-xs text-amber-800 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Low confidence - ensure stage criteria are met
                  </p>
                </div>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onConfirm(editableReason)}
            className="bg-[hsl(var(--peregrine-blue))] hover:bg-[hsl(var(--peregrine-blue))]/90 text-white"
          >
            Confirm Move
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
