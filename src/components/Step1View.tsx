
import React from 'react';
import { DragDropZone } from './DragDropZone';
import { FathomSelect } from './FathomSelect';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle } from 'lucide-react';

interface Step1ViewProps {
  onFileUpload: (file: File) => void;
  isProcessing: boolean;
  uploadProgress: number;
  onNavigateToReview: () => void;
  hasInsights: boolean;
}

export const Step1View: React.FC<Step1ViewProps> = ({ 
  onFileUpload, 
  isProcessing, 
  uploadProgress, 
  onNavigateToReview, 
  hasInsights 
}) => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Upload Call Recording</h1>
        <p className="text-muted-foreground">
          Upload your call transcript or select from Fathom recordings to get AI-powered insights.
        </p>
      </div>

      {isProcessing && (
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <h3 className="text-lg font-semibold">Processing your call...</h3>
          </div>
          <Progress value={uploadProgress} className="w-full" />
          <p className="text-sm text-muted-foreground">
            {uploadProgress < 30 ? 'Uploading file...' : 
             uploadProgress < 60 ? 'Analyzing content...' : 
             uploadProgress < 90 ? 'Generating insights...' : 
             'Finalizing results...'}
          </p>
        </div>
      )}

      {hasInsights && !isProcessing && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 space-y-4">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <h3 className="text-lg font-semibold text-green-800">Processing Complete!</h3>
          </div>
          <p className="text-green-700">
            Your call has been successfully analyzed. Click below to review the AI-generated insights.
          </p>
          <Button onClick={onNavigateToReview} className="w-full">
            Review Insights
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Upload File</h2>
          <DragDropZone onFileUpload={onFileUpload} disabled={isProcessing} />
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Or Select from Fathom</h2>
          <FathomSelect 
            onSelect={(recordingId) => {
              // Mock file creation for demo
              const mockFile = new File(['mock content'], 'fathom-recording.txt', { type: 'text/plain' });
              onFileUpload(mockFile);
            }}
            disabled={isProcessing}
          />
        </div>
      </div>
    </div>
  );
};
