import React, { useState, useEffect } from 'react'
import { StepBasedWorkflow } from '@/components/followups/StepBasedWorkflow'
import { TranscriptUpload } from '@/components/followups/TranscriptUpload'
import { CallInsightsViewer } from '@/components/followups/CallInsightsViewer'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { ArrowRight, CheckCircle, ArrowLeft, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { aiAgents, dbHelpers, CURRENT_USER } from '@/lib/supabase'

export const CallWrapUp = () => {
  const [currentStep, setCurrentStep] = useState(1)
  const [completedSteps, setCompletedSteps] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [callData, setCallData] = useState(null)
  const [insights, setInsights] = useState(null)
  const [pushStatuses, setPushStatuses] = useState({})
  const [processingSession, setProcessingSession] = useState(null)
  const [contentIds, setContentIds] = useState({})

  // Use predefined Sales Manager user
  const userId = CURRENT_USER.id

  const handleFileUpload = async (file) => {
    setIsProcessing(true)
    setUploadProgress(0)
    
    // Declare progressInterval at function scope
    let progressInterval = null
    let uploadedFile = null
    let session = null
    
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

      // For text files, read content for database storage and API processing
      let content = ''
      const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
      
      if (!isPDF) {
        content = await file.text()
      } else {
        // For PDFs, we'll store a placeholder since we're sending the file directly
        content = `PDF file: ${file.name} (${file.size} bytes)`
      }

      // Save uploaded file to database with shareable link
      uploadedFile = await dbHelpers.saveUploadedFile(userId, file, content)
      
      // Create processing session
      session = await dbHelpers.createProcessingSession(userId, uploadedFile.id)
      setProcessingSession(session)

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

        // Create complete call analysis using normalized structure
        const analysisData = {
          transcript: content,
          call_summary: transformedInsights.call_summary,
          follow_up_email: transformedInsights.follow_up_email,
          deck_prompt: transformedInsights.deck_prompt,
          action_items: transformedInsights.action_items,
          insights: reviewInsights
        }

        // Create all content and get their IDs for linking
        const createdContentIds = await dbHelpers.createCompleteCallAnalysis(
          userId,
          uploadedFile.id,
          session.id,
          analysisData
        )

        setContentIds(createdContentIds)

        // Update processing session with completion status and API response
        await dbHelpers.updateProcessingSession(session.id, {
          processing_status: 'completed',
          api_response: responseData
        })

        // Get the created call note for state
        const callNote = await dbHelpers.getCallNote(createdContentIds.callNotesId)
        setCallData(callNote)

        // Store insights and set state
        setInsights({
          ...transformedInsights,
          reviewInsights: reviewInsights,
          callAnalysisData: {
            specific_user: transformedInsights.specific_user,
            sentiment_score: transformedInsights.sentiment_score,
            action_items: transformedInsights.action_items,
            communication_styles: transformedInsights.communication_styles,
            key_points: responseData.reviewinsights?.call_summary?.key_points || []
          }
        })
        setCompletedSteps([1])
        setCurrentStep(2)
        
        toast.success('Call analysis completed! File stored with shareable link.')
      } else {
        throw new Error('Invalid API response format')
      }
    } catch (error) {
      console.error('Error processing file:', error)
      toast.error(`Failed to process file: ${error.message}`)
      
      // Update processing session with error
      if (session) {
        await dbHelpers.updateProcessingSession(session.id, {
          processing_status: 'failed',
          error_message: error.message
        })
      }
      
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

  const handleEditInsight = async (type, content) => {
    // Update content in the normalized database structure
    try {
      let contentId
      let contentType
      let updateField

      switch (type) {
        case 'call_summary':
          contentId = contentIds.callNotesId
          contentType = 'call_summary'
          updateField = 'edited_summary'
          break
        case 'follow_up_email':
          contentId = contentIds.followUpEmailId
          contentType = 'follow_up_email'
          updateField = 'edited_content'
          break
        case 'deck_prompt':
          contentId = contentIds.deckPromptId
          contentType = 'deck_prompt'
          updateField = 'edited_content'
          break
        default:
          console.warn('Unknown content type for editing:', type)
          return
      }

      if (contentId) {
        // Update in database
        await dbHelpers.updateContentById(contentType, contentId, {
          [updateField]: content
        })

        // Update local state
        setInsights(prev => ({
          ...prev,
          [type]: content
        }))

        toast.success(`${type.replace('_', ' ')} updated successfully`)
      }
    } catch (error) {
      console.error('Error updating content:', error)
      toast.error('Failed to update content')
    }
  }

  const handlePushToHubSpot = async (type, content) => {
    setPushStatuses(prev => ({ ...prev, [type]: 'pending' }))
    
    try {
      // Simulate API call to HubSpot
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Determine content ID for logging
      let contentId
      switch (type) {
        case 'call_summary':
          contentId = contentIds.callNotesId
          break
        case 'follow_up_email':
          contentId = contentIds.followUpEmailId
          break
        case 'deck_prompt':
          contentId = contentIds.deckPromptId
          break
        default:
          contentId = callData?.id || processingSession?.id
      }

      // Log push action with Sales Manager user ID
      await dbHelpers.logPushAction(
        userId,
        type,
        contentId,
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
  }

  const handleBackToUpload = () => {
    setCurrentStep(1)
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Call Wrap-Up</h1>
        <p className="text-muted-foreground">
          Upload your call transcript and get AI-powered insights for follow-up actions. Files are stored with shareable links for easy access.
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
                {uploadProgress < 30 ? 'Uploading file and creating shareable link...' : 
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
                Your call has been successfully analyzed and stored with a shareable link. Click below to review the AI-generated insights.
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

      {/* Step 2: Review Insights - Use Reusable Component */}
      {currentStep === 2 && insights && (
        <CallInsightsViewer
          insights={insights}
          callNotesId={callData?.id}
          userId={userId}
          onNavigateBack={handleBackToUpload}
          onEditInsight={handleEditInsight}
          onPushToHubSpot={handlePushToHubSpot}
          pushStatuses={pushStatuses}
          showBackButton={true}
          isEditable={true}
          title="Post-Call Insights"
        />
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
              Your call insights have been added to your CRM and are ready for follow-up. Files are stored with shareable links for easy access.
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