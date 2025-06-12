import React, { useState, useEffect } from 'react'
import { StepBasedWorkflow } from '@/components/followups/StepBasedWorkflow'
import { TranscriptUpload } from '@/components/followups/TranscriptUpload'
import { ReviewInsights } from '@/components/followups/ReviewInsights'
import { InsightCard } from '@/components/followups/InsightCard'
import { CRMConnectionStatus } from '@/components/followups/CRMConnectionStatus'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight, CheckCircle, ArrowLeft, User, TrendingUp, Calendar, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { aiAgents, dbHelpers, CURRENT_USER } from '@/lib/supabase'

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

  // Use predefined Sales Manager user
  const userId = CURRENT_USER.id

  const handleFileUpload = async (file) => {
    setIsProcessing(true)
    setUploadProgress(0)
    
    // Declare progressInterval at function scope
    let progressInterval = null
    
    try {
      // Simulate upload progress
      progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      // For text files, read content for database storage
      let content = ''
      const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
      
      if (!isPDF) {
        content = await file.text()
      } else {
        // For PDFs, we'll store a placeholder since we're sending the file directly
        content = `PDF file: ${file.name} (${file.size} bytes)`
      }
      
      // Create call note record with Sales Manager user ID
      const callNote = await dbHelpers.createCallNote(
        userId,
        `call-${Date.now()}`,
        content
      )

      setCallData(callNote)

      // Call external Sales Insights API - send file directly
      const formData = new FormData()
      formData.append('data', file)

      const response = await fetch('https://salesgenius.ainavi.co.uk/webhook/sales-insigts', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }

      // Get response as text first, then try to parse as JSON
      const responseText = await response.text()
      let apiData
      
      try {
        apiData = JSON.parse(responseText)
      } catch (jsonError) {
        console.error('Failed to parse API response as JSON:', responseText)
        throw new Error(`Invalid JSON response from API: ${jsonError.message}`)
      }

      console.log('API Response:', apiData)
      
      if (apiData && apiData.length > 0) {
        const responseData = apiData[0]
        
        if (progressInterval) {
          clearInterval(progressInterval)
          progressInterval = null
        }
        setUploadProgress(100)
        
        // Transform API response to match our expected format
        const transformedInsights = {
          call_summary: responseData.reviewinsights?.call_summary?.key_points?.join('\n\n') || 'No summary available',
          follow_up_email: responseData.followupemail || 'No email template generated',
          deck_prompt: responseData.presentation || 'No presentation prompt generated',
          action_items: responseData.reviewinsights?.action_items || [],
          communication_styles: responseData.reviewinsights?.communication_styles || [],
          sentiment_score: responseData.reviewinsights?.call_summary?.sentiment_score || 0,
          specific_user: responseData.reviewinsights?.call_summary?.specific_user || 'Unknown'
        }

        // Update call note with AI summary
        await dbHelpers.updateCallNote(callNote.id, {
          ai_summary: transformedInsights.call_summary,
          status: 'completed'
        })

        // Store action items in database
        if (transformedInsights.action_items.length > 0) {
          const commitments = transformedInsights.action_items.map(item => item.task)
          await dbHelpers.createCommitments(callNote.id, userId, commitments)
        }

        // Store follow-up email in database
        if (transformedInsights.follow_up_email) {
          await dbHelpers.createFollowUpEmail(callNote.id, userId, transformedInsights.follow_up_email)
        }

        // Store deck prompt in database
        if (transformedInsights.deck_prompt) {
          await dbHelpers.createDeckPrompt(callNote.id, userId, transformedInsights.deck_prompt)
        }

        // Transform insights for ReviewInsights component
        const reviewInsights = []
        
        // Add call summary insights
        if (responseData.reviewinsights?.call_summary?.key_points) {
          responseData.reviewinsights.call_summary.key_points.forEach((point, index) => {
            reviewInsights.push({
              id: `key_point_${index}`,
              type: 'prospect_mention',
              content: point,
              relevance_score: 85 + (index * 2),
              is_selected: true,
              source: 'AI Analysis',
              timestamp: `${index * 5}:00`
            })
          })
        }

        // Add action items as insights with owner and deadline
        if (responseData.reviewinsights?.action_items) {
          responseData.reviewinsights.action_items.forEach((item, index) => {
            let actionContent = item.task
            
            // Add owner information if available
            if (item.owner) {
              actionContent += `\n\nOwner: ${item.owner}`
            }
            
            // Add deadline information if available
            if (item.deadline) {
              actionContent += `\nDeadline: ${item.deadline}`
            }
            
            reviewInsights.push({
              id: `action_${index}`,
              type: 'agreed_action',
              content: actionContent,
              relevance_score: 90 - (index * 2),
              is_selected: true,
              source: 'Call Transcript',
              timestamp: 'Throughout call',
              owner: item.owner || 'Unassigned',
              deadline: item.deadline || 'No deadline set'
            })
          })
        }

        // Add communication styles as insights
        if (responseData.reviewinsights?.communication_styles) {
          responseData.reviewinsights.communication_styles.forEach((style, index) => {
            reviewInsights.push({
              id: `comm_style_${index}`,
              type: 'communication_style',
              content: `${style.role_name} demonstrates ${style.style} communication style. Evidence: ${style.evidence}`,
              relevance_score: 80 - (index * 3),
              is_selected: true,
              source: 'Communication Analysis',
              timestamp: 'Throughout call'
            })
          })
        }

        // Store insights and set state
        setInsights({
          ...transformedInsights,
          reviewInsights: reviewInsights
        })
        setCompletedSteps([1])
        setCurrentStep(2)
        
        toast.success('Call analysis completed!')
      } else {
        throw new Error('Invalid API response format')
      }
    } catch (error) {
      console.error('Error processing file:', error)
      toast.error(`Failed to process file: ${error.message}`)
      if (progressInterval) {
        clearInterval(progressInterval)
      }
    } finally {
      setIsProcessing(false)
      if (progressInterval) {
        clearInterval(progressInterval)
      }
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
      
      // Log push action with Sales Manager user ID
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
        <div className="mt-2 text-sm text-muted-foreground">
          Logged in as: <span className="font-medium">{CURRENT_USER.name}</span> ({CURRENT_USER.role})
        </div>
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
                    initialInsights={insights.reviewInsights || []}
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
                  {/* Call Summary Metadata */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <User className="w-5 h-5" />
                        <span>Call Analysis Overview</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="flex items-center space-x-3">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">Specific User</p>
                            <p className="font-medium">{insights.specific_user}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <TrendingUp className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm text-muted-foreground">Sentiment Score</p>
                            <div className="flex items-center space-x-2">
                              <p className="font-medium">{insights.sentiment_score}</p>
                              <Badge 
                                variant={
                                  insights.sentiment_score >= 0.7 ? 'default' : 
                                  insights.sentiment_score >= 0.4 ? 'secondary' : 'destructive'
                                }
                                className="text-xs"
                              >
                                {insights.sentiment_score >= 0.7 ? 'Positive' : 
                                 insights.sentiment_score >= 0.4 ? 'Neutral' : 'Negative'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Action Items Summary */}
                  {insights.action_items && insights.action_items.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <CheckCircle className="w-5 h-5" />
                          <span>Action Items Summary</span>
                          <Badge variant="secondary">{insights.action_items.length} items</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {insights.action_items.map((item, index) => (
                            <div key={index} className="border border-border rounded-lg p-4 space-y-3">
                              <p className="font-medium text-sm">{item.task}</p>
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <div className="flex items-center space-x-4">
                                  {item.owner && (
                                    <div className="flex items-center space-x-1">
                                      <User className="w-3 h-3" />
                                      <span>Owner: {item.owner}</span>
                                    </div>
                                  )}
                                  {item.deadline && (
                                    <div className="flex items-center space-x-1">
                                      <Calendar className="w-3 h-3" />
                                      <span>Due: {item.deadline}</span>
                                    </div>
                                  )}
                                </div>
                                <Badge 
                                  variant={item.deadline ? 'default' : 'secondary'}
                                  className="text-xs"
                                >
                                  {item.deadline ? 'Scheduled' : 'Open'}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Call Summary Content */}
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