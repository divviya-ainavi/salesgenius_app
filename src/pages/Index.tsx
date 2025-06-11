
import React, { useState, useEffect } from 'react';
import { TopNav } from '@/components/TopNav';
import { LeftStepper } from '@/components/LeftStepper';
import { Step1View } from '@/components/Step1View';
import { Step2View } from '@/components/Step2View';
import { Step3View } from '@/components/Step3View';
import { StickyFooterCTA } from '@/components/StickyFooterCTA';
import { ConnectHubSpotModal } from '@/components/ConnectHubSpotModal';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

export interface CallInsights {
  emailSummary: string;
  presentationPrompt: string;
  sentimentData: Array<{ time: number; sentiment: number }>;
  keyPoints: string[];
}

const ALLOWED_ORIGINS = [
  window.location.origin,
  'https://app.hubspot.com',
  'https://api.hubspot.com'
];

const Index = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [hubspotConnected, setHubspotConnected] = useState(true); // Assume connected
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [callInsights, setCallInsights] = useState<CallInsights | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Listen for HubSpot OAuth success with proper origin validation
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Validate message origin for security
      if (!ALLOWED_ORIGINS.includes(event.origin)) {
        console.warn('Received message from unauthorized origin:', event.origin);
        return;
      }

      // Validate message structure
      if (typeof event.data !== 'string') {
        console.warn('Received invalid message format');
        return;
      }

      if (event.data === 'hubspotConnected') {
        setHubspotConnected(true);
        setShowConnectModal(false);
        toast.success('Successfully connected to HubSpot!');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleFileUpload = (file: File) => {
    console.log('File uploaded:', file);
    setUploadedFile(file);
    setIsProcessing(true);
    setUploadProgress(0);
    
    // Simulate processing with progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90; // Stop at 90% until actual processing is done
        }
        return prev + 10;
      });
    }, 200);

    // Simulate API call delay
    setTimeout(() => {
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Generate mock insights with properly initialized arrays
      const mockInsights: CallInsights = {
        emailSummary: `Hi [Client Name],

Thank you for taking the time to speak with me today about your sales optimization needs. I wanted to follow up on our conversation and summarize the key points we discussed:

• Current pain points with lead qualification process
• Interest in automated scoring and prioritization
• Timeline for implementation: Q2 2024
• Budget considerations and ROI expectations

Next steps:
1. I'll send over the demo video we discussed
2. Schedule a technical deep-dive with your team
3. Prepare a customized proposal based on your requirements

Please let me know if you have any questions or if there's anything else I can help clarify.

Best regards,
[Your Name]`,
        presentationPrompt: `Create a sales presentation focusing on:

1. Pain Point Solutions:
   - Address their current lead qualification challenges
   - Show how our solution reduces manual work by 70%
   - Demonstrate ROI within 6 months

2. Technical Integration:
   - Seamless CRM integration capabilities
   - Real-time analytics and reporting
   - Custom workflow automation

3. Success Stories:
   - Similar company case studies
   - Specific metrics and outcomes
   - Implementation timeline examples

4. Next Steps:
   - Clear pricing structure
   - Implementation roadmap
   - Support and training plan`,
        sentimentData: [
          { time: 0, sentiment: 0.2 },
          { time: 10, sentiment: 0.5 },
          { time: 20, sentiment: 0.8 },
          { time: 30, sentiment: 0.6 },
          { time: 40, sentiment: 0.9 },
          { time: 50, sentiment: 0.7 },
          { time: 60, sentiment: 0.8 },
        ],
        keyPoints: [
          "Client expressed strong interest in automating lead qualification process",
          "Budget approved for Q2 2024 implementation",
          "Technical team needs to review integration requirements",
          "Competitor evaluation ongoing - need to differentiate on ease of use",
          "Decision maker confirmed, no additional stakeholders needed",
          "Follow-up demo scheduled for next week",
          "ROI requirements: 6-month payback period"
        ]
      };
      
      console.log('Generated insights:', mockInsights);
      setCallInsights(mockInsights);
      setCompletedSteps(prev => [...prev, 1]);
      setIsProcessing(false);
    }, 3000);
  };

  const handleNavigateToReview = () => {
    if (callInsights) {
      setCurrentStep(2);
    }
  };

  const handleNavigateToUpload = () => {
    setCurrentStep(1);
  };

  const handlePushToHubSpot = () => {
    // Since HubSpot is connected, proceed directly to Step 3
    setCompletedSteps(prev => [...prev, 2, 3]);
    setCurrentStep(3);
  };

  const handleStartNewAnalysis = () => {
    // Reset all state to start fresh
    setCurrentStep(1);
    setCompletedSteps([]);
    setCallInsights(null);
    setUploadedFile(null);
    setIsProcessing(false);
    setUploadProgress(0);
    toast.success('Ready for new call analysis!');
  };

  const handleRegenerateInsight = (type: string) => {
    console.log('Regenerating insight:', type);
    toast.success(`${type} regenerated successfully!`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <TopNav 
        hubspotConnected={hubspotConnected}
        onConnectClick={() => setShowConnectModal(true)}
      />
      
      <div className="flex flex-1">
        <LeftStepper 
          currentStep={currentStep}
          completedSteps={completedSteps}
        />
        
        <main className="flex-1 p-6">
          {currentStep === 1 && (
            <Step1View 
              onFileUpload={handleFileUpload}
              isProcessing={isProcessing}
              uploadProgress={uploadProgress}
              onNavigateToReview={handleNavigateToReview}
              hasInsights={!!callInsights}
            />
          )}
          
          {currentStep === 2 && callInsights && (
            <Step2View 
              insights={callInsights}
              onRegenerateInsight={handleRegenerateInsight}
              onNavigateBack={handleNavigateToUpload}
            />
          )}

          {currentStep === 3 && callInsights && (
            <Step3View 
              insights={callInsights}
              onNavigateBack={() => setCurrentStep(2)}
              onStartNew={handleStartNewAnalysis}
            />
          )}
        </main>
      </div>

      {currentStep === 2 && callInsights && (
        <StickyFooterCTA 
          onPushToHubSpot={handlePushToHubSpot}
          disabled={!callInsights}
          hubspotConnected={hubspotConnected}
        />
      )}

      <ConnectHubSpotModal 
        open={showConnectModal}
        onClose={() => setShowConnectModal(false)}
      />

      <Toaster position="top-right" />
    </div>
  );
};

export default Index;
