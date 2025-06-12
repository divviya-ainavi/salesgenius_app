import React, { useState, useEffect } from 'react'
import { StepBasedWorkflow } from '@/components/followups/StepBasedWorkflow'
import { TranscriptUpload } from '@/components/followups/TranscriptUpload'
import { ReviewInsights } from '@/components/followups/ReviewInsights'
import { InsightCard } from '@/components/followups/InsightCard'
import { CRMConnectionStatus } from '@/components/followups/CRMConnectionStatus'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowRight, CheckCircle, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { aiAgents, dbHelpers } from '@/lib/supabase'

export const CallWrapUp = () => {
  const [currentStep, setCurrentStep] = useState(1)
  const [completedSteps, setCompletedSteps] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [callData, setCallData] = useState(null)
  const [insights, setInsights] = useState(null)
  const [selectedInsights, setSelectedInsights] = useState([])
  const [pushStatuses, setPushStatuses] = useState({})
  const [activeTab, setActiveTab] = useState('insights')

  // Use a simple static user ID for now (ignoring authentication)
  const userId = '550e8400-e29b-41d4-a716-446655440000'

  const handleFileUpload = async (file) => {
    setIsProcessing(true)
    setUploadProgress(0)
    
    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      // Read file content
      const content = await file.text()
      
      // Create call note record with static user ID
      const callNote = await dbHelpers.createCallNote(
        userId,
        `call-${Date.now()}`,
        content
      )

      setCallData(callNote)

      // Call Follow Up Agent
      const response = await aiAgents.callFollowUpAgent({ transcript: content })
      
      if (response.success) {
        clearInterval(progressInterval)
        setUploadProgress(100)
        
        // Update call note with AI summary
        await dbHelpers.updateCallNote(callNote.id, {
          ai_summary: response.data.call_summary,
          status: 'completed'
        })

        // Store insights
        setInsights(response.data)
        setCompletedSteps([1])
        setCurrentStep(2)
        
        toast.success('Call analysis completed!')
      }
    } catch (error) {
      console.error('Error processing file:', error)
      toast.error('Failed to process file')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFathomSelect = async (recordingId) => {
    // Mock Fathom integration
    const mockTranscript = `Mock transcript from Fathom recording ${recordingId}...`
    const mockFile = new File([mockTranscript], 'fathom-recording.txt', { type: 'text/plain' })
    await handleFileUpload(mockFile)
  }

  const handleSaveInsights = (updatedInsights) => {
    setSelectedInsights(updatedInsights.filter(insight => insight.is_selected))
    // In real app, save to database
    console.log('Saving insights:', updatedInsights)
  }

  const handleEditInsight = (type, content) => {
    setInsights(prev => ({
      ...prev,
      [type]: content
    }))
  }

  const handlePushToHubSpot = async (type, content) => {
    setPushStatuses(prev => ({ ...prev, [type]: 'pending' }))
    
    try {
      // Simulate API call to HubSpot
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Log push action with static user ID
      await dbHelpers.logPushAction(
        userId,
        type,
        callData.id,
        'success',
        null,
        `hubspot-${Date.now()}`
      )
      
      setPushStatuses(prev => ({ ...prev, [type]: 'success' }))
      toast.success(`${type} pushed to HubSpot successfully!`)
      
      // Check if all items are pushed to complete step 3
      const allPushed = Object.values({ ...pushStatuses, [type]: 'success' })
        .every(status => status === 'success')
      
      if (allPushed) {
        setCompletedSteps([1, 2, 3])
        setCurrentStep(3)
      }
    } catch (error) {
      setPushStatuses(prev => ({ ...prev, [type]: 'error' }))
      toast.error(`Failed to push ${type} to HubSpot`)
    }
  }

  const handleContinueToReview = () => {
    setCurrentStep(2)
    setActiveTab('insights') // Ensure we start on the insights tab
  }

  const handleBackToUpload = () => {
    setCurrentStep(1)
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Call Wrap-Up</h1>
        <p className="text-muted-foreground">
          Upload your call transcript and get AI-powered insights for follow-up actions.
        </p>
      </div>

      {/* Step-Based Workflow */}
      <StepBasedWorkflow 
        currentStep={currentStep} 
        completedSteps={completedSteps} 
      />

      {/* Step 1: Upload */}
      {currentStep === 1 && (
        <div className="space-y-6">
          {/* Processing Status */}
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

          {/* Success State */}
          {completedSteps.includes(1) && !isProcessing && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 space-y-4">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-6 w-6 text-green-600" />
                <h3 className="text-lg font-semibold text-green-800">Processing Complete!</h3>
              </div>
              <p className="text-green-700">
                Your call has been successfully analyzed. Click below to review the AI-generated insights.
              </p>
              <Button onClick={handleContinueToReview} className="w-full">
                Review Insights
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Upload Interface */}
          <TranscriptUpload
            onFileUpload={handleFileUpload}
            onFathomSelect={handleFathomSelect}
            isProcessing={isProcessing}
            disabled={isProcessing}
          />
        </div>
      )}

      {/* Step 2: Review Insights */}
      {currentStep === 2 && insights && (
        <div className="space-y-6">
          {/* Back Button */}
          <Button variant="outline" onClick={handleBackToUpload}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Upload
          </Button>

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
                    callNotesId={callData?.id}
                    userId={userId}
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
                <div className="lg:col-span-2">
                  <InsightCard
                    title="Call Summary"
                    content={insights.call_summary}
                    type="call_summary"
                    onEdit={(content) => handleEditInsight('call_summary', content)}
                    onPush={(content) => handlePushToHubSpot('call_summary', content)}
                    status={pushStatuses.call_summary || 'draft'}
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
                    onEdit={(content) => handleEditInsight('follow_up_email', content)}
                    onPush={(content) => handlePushToHubSpot('follow_up_email', content)}
                    onCopy={() => toast.success('Email copied to clipboard')}
                    status={pushStatuses.follow_up_email || 'draft'}
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
                    onEdit={(content) => handleEditInsight('deck_prompt', content)}
                    onPush={(content) => handlePushToHubSpot('deck_prompt', content)}
                    onCopy={() => toast.success('Deck prompt copied to clipboard')}
                    onExport={() => toast.success('Exported to Gamma (coming soon)')}
                    status={pushStatuses.deck_prompt || 'draft'}
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
      )}

      {/* Step 3: Success */}
      {currentStep === 3 && completedSteps.includes(3) && (
        <div className="text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Successfully Pushed to HubSpot!
            </h2>
            <p className="text-muted-foreground">
              Your call insights have been added to your CRM and are ready for follow-up.
            </p>
          </div>
          <Button onClick={() => window.location.reload()}>
            Analyze Another Call
          </Button>
        </div>
      )}
    </div>
  )
}