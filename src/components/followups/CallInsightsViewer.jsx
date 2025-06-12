import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { ReviewInsights } from './ReviewInsights'
import { InsightCard } from './InsightCard'
import { CRMConnectionStatus } from './CRMConnectionStatus'
import { toast } from 'sonner'

export const CallInsightsViewer = ({
  insights,
  callNotesId,
  userId,
  onNavigateBack,
  onEditInsight,
  onPushToHubSpot,
  pushStatuses = {},
  showBackButton = false,
  isEditable = true,
  title = "Review Insights"
}) => {
  const [activeTab, setActiveTab] = useState('insights')

  const handleSaveInsights = (updatedInsights) => {
    // This is handled by the parent component
    console.log('Saving insights:', updatedInsights)
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      {showBackButton && onNavigateBack && (
        <Button variant="outline" onClick={onNavigateBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      )}

      {/* Tabbed Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="insights">Review Insights</TabsTrigger>
          <TabsTrigger value="summary">Call Summary</TabsTrigger>
          <TabsTrigger value="email">Follow-up Email</TabsTrigger>
          <TabsTrigger value="deck">Presentation</TabsTrigger>
        </TabsList>
        
        <TabsContent value="insights" className="mt-6">
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content - Review Insights Component */}
            <div className="lg:col-span-2">
              <ReviewInsights 
                onSaveInsights={handleSaveInsights}
                callNotesId={callNotesId}
                userId={userId}
                initialInsights={insights.reviewInsights || []}
                callAnalysisData={insights.callAnalysisData}
              />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* CRM Connection Status */}
              <CRMConnectionStatus
                status="connected"
                lastSync="2 minutes ago"
                accountInfo={{
                  name: "Acme Corp Sales",
                  hubId: "12345678"
                }}
                onReconnect={() => toast.success('Connection refreshed')}
                onSettings={() => toast.info('Opening settings...')}
              />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="summary" className="mt-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Call Summary Content */}
              <InsightCard
                title="Call Summary"
                content={insights.call_summary}
                type="call_summary"
                onEdit={onEditInsight}
                onPush={(content) => onPushToHubSpot('call_summary', content)}
                onCopy={() => toast.success('Call summary copied to clipboard')}
                status={pushStatuses.call_summary || 'draft'}
                isEditable={isEditable}
                showPushButton={true}
              />
            </div>
            <div className="space-y-6">
              <CRMConnectionStatus
                status="connected"
                lastSync="2 minutes ago"
                accountInfo={{
                  name: "Acme Corp Sales",
                  hubId: "12345678"
                }}
                onReconnect={() => toast.success('Connection refreshed')}
                onSettings={() => toast.info('Opening settings...')}
              />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="email" className="mt-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <InsightCard
                title="Follow-up Email"
                content={insights.follow_up_email}
                type="follow_up_email"
                onEdit={onEditInsight}
                onPush={(content) => onPushToHubSpot('follow_up_email', content)}
                onCopy={() => toast.success('Email copied to clipboard')}
                status={pushStatuses.follow_up_email || 'draft'}
                isEditable={isEditable}
                showPushButton={true}
              />
            </div>
            <div className="space-y-6">
              <CRMConnectionStatus
                status="connected"
                lastSync="2 minutes ago"
                accountInfo={{
                  name: "Acme Corp Sales",
                  hubId: "12345678"
                }}
                onReconnect={() => toast.success('Connection refreshed')}
                onSettings={() => toast.info('Opening settings...')}
              />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="deck" className="mt-6">
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <InsightCard
                title="Presentation Prompt"
                content={insights.deck_prompt}
                type="deck_prompt"
                onEdit={onEditInsight}
                onPush={(content) => onPushToHubSpot('deck_prompt', content)}
                onCopy={() => toast.success('Deck prompt copied to clipboard')}
                onExport={() => toast.success('Exported to Gamma (coming soon)')}
                status={pushStatuses.deck_prompt || 'draft'}
                isEditable={isEditable}
                showPushButton={true}
                showExportButton={true}
              />
            </div>
            <div className="space-y-6">
              <CRMConnectionStatus
                status="connected"
                lastSync="2 minutes ago"
                accountInfo={{
                  name: "Acme Corp Sales",
                  hubId: "12345678"
                }}
                onReconnect={() => toast.success('Connection refreshed')}
                onSettings={() => toast.info('Opening settings...')}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}