
import React from 'react';
import { EmailSummaryCard } from './EmailSummaryCard';
import { PresentationPromptCard } from './PresentationPromptCard';
import { SentimentChart } from './SentimentChart';
import { KeyPointsList } from './KeyPointsList';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { CallInsights } from '@/pages/Index';

interface Step2ViewProps {
  insights: CallInsights;
  onRegenerateInsight: (type: string) => void;
  onNavigateBack: () => void;
}

export const Step2View: React.FC<Step2ViewProps> = ({ insights, onRegenerateInsight, onNavigateBack }) => {
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Post-Call Insights</h1>
          <p className="text-muted-foreground">
            AI-generated insights from your call recording. Click any card menu to regenerate content.
          </p>
        </div>
        <Button variant="outline" onClick={onNavigateBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Upload
        </Button>
      </div>

      <Tabs defaultValue="analysis" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="email">Email Summary</TabsTrigger>
          <TabsTrigger value="presentation">Presentation Prompt</TabsTrigger>
        </TabsList>
        
        <TabsContent value="analysis" className="mt-6">
          <div className="grid lg:grid-cols-2 gap-8">
            <SentimentChart 
              data={insights.sentimentData}
              onRegenerate={() => onRegenerateInsight('Sentiment Analysis')}
            />
            <KeyPointsList 
              points={insights.keyPoints}
              onRegenerate={() => onRegenerateInsight('Key Points')}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="email" className="mt-6">
          <EmailSummaryCard 
            content={insights.emailSummary}
            onRegenerate={() => onRegenerateInsight('Email Summary')}
          />
        </TabsContent>
        
        <TabsContent value="presentation" className="mt-6">
          <PresentationPromptCard 
            content={insights.presentationPrompt}
            onRegenerate={() => onRegenerateInsight('Presentation Prompt')}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
