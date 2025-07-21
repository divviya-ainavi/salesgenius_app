import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CallAssociationSelector } from "./CallAssociationSelector";
import { Loader2, FileText, CheckCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";

export const ProcessCallModal = ({ isOpen, onClose, file, onConfirm }) => {
  const [selectedAssociation, setSelectedAssociation] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [processingError, setProcessingError] = useState(null);
  const [hasRetried, setHasRetried] = useState(false);

  const handleAssociationChange = (association) => {
    setSelectedAssociation(association);
    // Clear any previous errors when association changes
    setProcessingError(null);
    setHasRetried(false);
  };

  // console.log(selectedAssociation, "selected association");

  const handleAssociationReset = () => {
    setSelectedAssociation(null);
    setProcessingError(null);
    setHasRetried(false);
  };

  const handleCloseModal = () => {
    onClose();
    setIsProcessing(false);
    setIsComplete(false);
    setSelectedAssociation(null);
    setProcessingError(null);
    setHasRetried(false);
  };
  const handleConfirm = async () => {
    if (!selectedAssociation?.prospect) {
      toast.error("Please select a company and prospect first");
      return;
    }

    setIsProcessing(true);
    setProcessingError(null);

    try {
      // Call the parent's onConfirm function with the file ID and selected association
      await onConfirm(
        file,
        selectedAssociation.company.id,
        selectedAssociation.prospect.id,
        selectedAssociation?.prospect
      );

      setIsComplete(true);

      // Close the modal after a short delay to show the success state
      setTimeout(() => {
        handleCloseModal();
      }, 1500);
    } catch (error) {
      console.error("Error confirming association:", error);
      
      // Extract detailed error message
      const errorMessage = error.details?.message || error.message || "An unexpected error occurred";
      setProcessingError(errorMessage);
      
      // Show toast for immediate feedback
      toast.error("Failed to process call: " + errorMessage);
      setIsProcessing(false);
      setHasRetried(true);
    }
  };

  const handleRetry = () => {
    setProcessingError(null);
    setHasRetried(false);
    handleConfirm();
  };
  return (
    <Dialog open={isOpen} onOpenChange={handleCloseModal}>
      <DialogContent
        className="w-[480px] max-w-[90vw] min-w-[35vw]"
        onInteractOutside={(e) => e.preventDefault()}
        aria-describedby="process-call-description"
      >
        <DialogHeader>
          <DialogTitle>Process Call Transcript</DialogTitle>
          <DialogDescription id="process-call-description">
            Associate this call transcript with a company and prospect to
            process it.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 flex flex-col">
          {/* Error Display */}
          {processingError && (
            <div className="mb-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Processing Failed</AlertTitle>
                <AlertDescription>
                  {processingError}
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* File Information */}
          {/* {console.log(file, "file in process call modal")} */}
          {file != undefined && (
            <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg mb-4">
              <FileText className="w-5 h-5 text-muted-foreground" />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <p className="font-medium truncate max-w-[300px]">
                        {file?.filename || file?.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {file?.size} •{" "}
                        {new Date(
                          file?.upload_date || file?.date
                        ).toLocaleString()}
                      </p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{file?.filename}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
          {/* Association Selector */}
          {!isComplete && (
            <CallAssociationSelector
              onAssociationChange={handleAssociationChange}
              isProcessing={isProcessing}
              onAssociationReset={handleAssociationReset}
            />
          )}

          {/* Success State */}
          {isComplete && (
            <div className="flex flex-col items-center justify-center py-6">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-center mb-2">
                Processing Started
              </h3>
              <p className="text-sm text-center text-muted-foreground">
                Your call transcript is now being processed. You'll find the
                results in the "Past Processed Calls" tab.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          {processingError && hasRetried ? (
            <Button
              onClick={handleRetry}
              disabled={!selectedAssociation?.prospect || isProcessing}
              aria-label="Retry processing"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Retrying...
                </>
              ) : (
                "Retry"
              )}
            </Button>
          ) : (
          <Button
            onClick={handleConfirm}
            disabled={
              !selectedAssociation?.prospect || isProcessing || isComplete
            }
              aria-label="Process call transcript"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              "Process"
            )}
          </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
