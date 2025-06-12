import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StepBasedWorkflow } from '@/components/followups/StepBasedWorkflow'
import { ReviewInsights } from '@/components/followups/ReviewInsights'
import { InsightCard } from '@/components/followups/InsightCard'
import { CRMConnectionStatus } from '@/components/followups/CRMConnectionStatus'
import { 
  FileText, 
  Calendar, 
  Clock, 
  User, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Eye,
  RefreshCw,
  Download,
  ArrowLeft,
  MessageSquare,
  Mail,
  Presentation,
  CheckSquare,
  Copy,
  History,
  ArrowRight
} from 'lucide-react'
import { toast } from 'sonner'
import { dbHelpers, CURRENT_USER } from '@/lib/supabase'
import { cn } from '@/lib/utils'

const ProcessingHistory = () => {
  const [history, setHistory] = useState([])
  const [selectedSession, setSelectedSession] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [viewMode, setViewMode] = useState('list') // 'list' or 'details'
  const [activeTab, setActiveTab] = useState('insights')
  const [pushStatuses, setPushStatuses] = useState({})

  const loadHistory = async () => {
    try {
      const data = await dbHelpers.getProcessingHistory(CURRENT_USER.id)
      setHistory(data)
    } catch (error) {
      console.error('Error loading processing history:', error)
      toast.error('Failed to load processing history')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadHistory()
    toast.success('History refreshed')
  }

  const handleViewDetails = async (sessionId) => {
    try {
      const details = await dbHelpers.getProcessingSessionDetails(sessionId)
      setSelectedSession(details)
      setViewMode('details')
      setActiveTab('insights')
    } catch (error) {
      console.error('Error loading session details:', error)
      toast.error('Failed to load session details')
    }
  }

  const handleBackToHistory = () => {
    setSelectedSession(null)
    setViewMode('list')
  }

  const handleCopy = (content, type) => {
    navigator.clipboard.writeText(content)
    toast.success(`${type} copied to clipboard`)
  }

  const handleEditInsight = (type, content) => {
    // Update the selected session data
    if (selectedSession && selectedSession.call_notes && selectedSession.call_notes.length > 0) {
      const updatedSession = { ...selectedSession }
      if (type === 'call_summary') {
        updatedSession.call_notes[0].ai_summary = content
      }
      setSelectedSession(updatedSession)
    }
  }

  const handlePushToHubSpot = async (type, content) => {
    setPushStatuses(prev => ({ ...prev, [type]: 'pending' }))
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Log push action
      await dbHelpers.logPushAction(
        CURRENT_USER.id,
        type,
        selectedSession.call_notes[0]?.id || selectedSession.id,
        'success',
        null,
        `hubspot-${Date.now()}`
      )
      
      setPushStatuses(prev => ({ ...prev, [type]: 'success' }))
      toast.success(`${type} pushed to HubSpot successfully!`)
    } catch (error) {
      setPushStatuses(prev => ({ ...prev, [type]: 'error' }))
      toast.error(`Failed to push ${type} to HubSpot`)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />
      case 'processing':
        return <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
      default:
        return <Clock className="w-4 h-4 text-gray-600" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Transform session data for ReviewInsights component
  const getReviewInsights = (session) => {
    if (!session.call_insights) return []
    
    return session.call_insights.map(insight => ({
      id: insight.id,
      type: insight.insight_type,
      content: insight.content,
      relevance_score: insight.relevance_score,
      is_selected: insight.is_selected,
      source: insight.source,
      timestamp: insight.timestamp
    }))
  }

  // Transform session data for insights display
  const getSessionInsights = (session) => {
    if (!session) return null

    return {
      call_summary: session.call_notes?.[0]?.ai_summary || 'No summary available',
      follow_up_email: session.follow_up_emails?.[0]?.email_content || 'No email template generated',
      deck_prompt: session.deck_prompts?.[0]?.prompt_content || 'No presentation prompt generated',
      reviewInsights: getReviewInsights(session)
    }
  }

  const HistoryList = () => {
    if (isLoading) {
      return (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Loading processing history...</span>
            </div>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <History className="w-5 h-5" />
              <span>Processing History</span>
              <Badge variant="secondary">{history.length} files</Badge>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {history.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="mb-2">No files processed yet</p>
              <p className="text-sm">Upload your first call transcript to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((session) => (
                <div
                  key={session.id}
                  className={cn(
                    "border rounded-lg p-4 transition-colors cursor-pointer",
                    selectedSession?.id === session.id 
                      ? "border-primary bg-primary/5" 
                      : "border-border hover:bg-accent"
                  )}
                  onClick={() => handleViewDetails(session.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start space-x-3">
                      <div className="mt-1">
                        {getStatusIcon(session.processing_status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">
                          {session.uploaded_files?.filename || 'Unknown file'}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {session.uploaded_files?.file_type} • {formatFileSize(session.uploaded_files?.file_size || 0)}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className={cn("text-xs", getStatusColor(session.processing_status))}>
                      {session.processing_status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3" />
                      <span>Uploaded: {formatDate(session.uploaded_files?.upload_date || session.processing_started_at)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>
                        {session.processing_completed_at 
                          ? `Completed: ${formatDate(session.processing_completed_at)}`
                          : 'In progress...'
                        }
                      </span>
                    </div>
                  </div>

                  {/* Processing Progress for active sessions */}
                  {session.processing_status === 'processing' && (
                    <div className="mb-3">
                      <Progress value={75} className="h-2" />
                      <p className="text-xs text-muted-foreground mt-1">Processing insights...</p>
                    </div>
                  )}

                  {/* Summary for completed sessions */}
                  {session.processing_status === 'completed' && session.call_notes && session.call_notes.length > 0 && (
                    <div className="bg-muted rounded-lg p-3 mb-3">
                      <p className="text-sm font-medium mb-1">AI Summary</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {session.call_notes[0].ai_summary?.substring(0, 150)}...
                      </p>
                    </div>
                  )}

                  {/* Error message for failed sessions */}
                  {session.processing_status === 'failed' && session.error_message && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                      <p className="text-sm font-medium text-red-800 mb-1">Error</p>
                      <p className="text-xs text-red-700">{session.error_message}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <User className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        Processed by {CURRENT_USER.name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleViewDetails(session.id)
                        }}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  const SessionDetails = () => {
    if (!selectedSession) {
      return (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">No session selected</p>
          </CardContent>
        </Card>
      )
    }

    const insights = getSessionInsights(selectedSession)
    const currentStep = selectedSession.processing_status === 'completed' ? 2 : 1
    const completedSteps = selectedSession.processing_status === 'completed' ? [1] : []

    return (
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm" onClick={handleBackToHistory}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to History
            </Button>
            <div>
              <h2 className="text-xl font-semibold">{selectedSession.uploaded_files?.filename}</h2>
              <p className="text-sm text-muted-foreground">
                Processed on {formatDate(selectedSession.processing_completed_at || selectedSession.processing_started_at)}
              </p>
            </div>
          </div>
          <Badge variant={selectedSession.processing_status === 'completed' ? 'default' : 'destructive'}>
            {selectedSession.processing_status}
          </Badge>
        </div>

        {/* Step-Based Workflow */}
        <StepBasedWorkflow 
          currentStep={currentStep} 
          completedSteps={completedSteps} 
        />

        {/* File Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>File Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Filename:</span>
                  <span className="text-sm font-medium">{selectedSession.uploaded_files?.filename}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">File Type:</span>
                  <span className="text-sm font-medium">{selectedSession.uploaded_files?.file_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">File Size:</span>
                  <span className="text-sm font-medium">{formatFileSize(selectedSession.uploaded_files?.file_size || 0)}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Upload Date:</span>
                  <span className="text-sm font-medium">{formatDate(selectedSession.uploaded_files?.upload_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Processing Started:</span>
                  <span className="text-sm font-medium">{formatDate(selectedSession.processing_started_at)}</span>
                </div>
                {selectedSession.processing_completed_at && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Processing Completed:</span>
                    <span className="text-sm font-medium">{formatDate(selectedSession.processing_completed_at)}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reuse Call Wrap-Up Interface for completed sessions */}
        {selectedSession.processing_status === 'completed' && insights && (
          <div className="space-y-6">
            {/* Tabbed Interface - Same as Call Wrap-Up */}
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
                      onSaveInsights={() => {}} // Read-only for history
                      callNotesId={selectedSession.call_notes?.[0]?.id}
                      userId={CURRENT_USER.id}
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
                    <InsightCard
                      title="Call Summary"
                      content={insights.call_summary}
                      type="call_summary"
                      onEdit={(content) => handleEditInsight('call_summary', content)}
                      onPush={(content) => handlePushToHubSpot('call_summary', content)}
                      status={pushStatuses.call_summary || 'draft'}
                      isEditable={true}
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
                      onEdit={(content) => handleEditInsight('follow_up_email', content)}
                      onPush={(content) => handlePushToHubSpot('follow_up_email', content)}
                      onCopy={() => toast.success('Email copied to clipboard')}
                      status={pushStatuses.follow_up_email || 'draft'}
                      isEditable={true}
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
                      onEdit={(content) => handleEditInsight('deck_prompt', content)}
                      onPush={(content) => handlePushToHubSpot('deck_prompt', content)}
                      onCopy={() => toast.success('Deck prompt copied to clipboard')}
                      onExport={() => toast.success('Exported to Gamma (coming soon)')}
                      status={pushStatuses.deck_prompt || 'draft'}
                      isEditable={true}
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

            {/* Action Items */}
            {selectedSession.call_commitments && selectedSession.call_commitments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CheckSquare className="w-5 h-5" />
                    <span>Action Items</span>
                    <Badge variant="secondary">{selectedSession.call_commitments.length} items</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedSession.call_commitments.map((commitment, index) => (
                      <div key={commitment.id || index} className="flex items-start space-x-3 p-3 border border-border rounded-lg">
                        <div className={cn(
                          "w-3 h-3 rounded-full mt-1",
                          commitment.is_pushed ? 'bg-green-500' : 'bg-gray-300'
                        )} />
                        <div className="flex-1">
                          <p className="text-sm">{commitment.commitment_text}</p>
                          <div className="flex items-center space-x-4 mt-1 text-xs text-muted-foreground">
                            <span>Created: {formatDate(commitment.created_at)}</span>
                            {commitment.is_pushed && <span className="text-green-600">Pushed to HubSpot</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Processing History</h1>
        <p className="text-muted-foreground">
          View and manage all your previously processed call transcripts and generated insights.
        </p>
        <div className="mt-2 text-sm text-muted-foreground">
          Logged in as: <span className="font-medium">{CURRENT_USER.name}</span> ({CURRENT_USER.role})
        </div>
      </div>

      {/* Main Content */}
      {viewMode === 'list' ? <HistoryList /> : <SessionDetails />}
    </div>
  )
}

export default ProcessingHistory
export { ProcessingHistory }