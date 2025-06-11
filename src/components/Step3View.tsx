
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, ExternalLink, ArrowLeft, RotateCcw } from 'lucide-react';
import { CallInsights } from '@/pages/Index';

interface Step3ViewProps {
  insights: CallInsights;
  onNavigateBack: () => void;
  onStartNew: () => void;
}

export const Step3View: React.FC<Step3ViewProps> = ({ 
  insights, 
  onNavigateBack, 
  onStartNew 
}) => {
  const handleViewInHubSpot = () => {
    // Secure external link opening with noopener and noreferrer
    const hubspotWindow = window.open('https://app.hubspot.com', '_blank', 'noopener,noreferrer');
    
    // Additional security: clear reference
    if (hubspotWindow) {
      hubspotWindow.opener = null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-3">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">Successfully Pushed to HubSpot!</h1>
        <p className="text-muted-foreground">
          Your call insights have been added to your HubSpot CRM
        </p>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Contact Updated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Contact: John Smith at Acme Corp</p>
              <p className="text-sm text-muted-foreground">Added call summary and notes</p>
              <p className="text-sm text-muted-foreground">Updated last activity timestamp</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Key Insights Added
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">• {insights.keyPoints.length} key points documented</p>
              <p className="text-sm text-muted-foreground">• Sentiment analysis data recorded</p>
              <p className="text-sm text-muted-foreground">• Follow-up email template created</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
        <Button onClick={handleViewInHubSpot} className="flex items-center gap-2">
          <ExternalLink className="w-4 h-4" />
          View in HubSpot
        </Button>
        <Button variant="outline" onClick={onStartNew} className="flex items-center gap-2">
          <RotateCcw className="w-4 h-4" />
          Analyze Another Call
        </Button>
        <Button variant="outline" onClick={onNavigateBack} className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Insights
        </Button>
      </div>
    </div>
  );
};
