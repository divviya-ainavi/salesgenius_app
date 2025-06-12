import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  FileText, 
  MessageSquare, 
  Mail, 
  Presentation, 
  CheckSquare,
  User,
  Calendar,
  Clock,
  Download,
  Copy,
  ArrowLeft
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export const ProcessingSessionDetails = ({ sessionData, onBack }) => {
  if (!sessionData) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No session selected</p>
        </CardContent>
      </Card>
    )
  }

  const handleCopy = (content, type) => {
    navigator.clipboard.writeText(content)
    toast.success(`${type} copied to clipboard`)
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

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <div>
            <h2 className="text-xl font-semibold">{sessionData.uploaded_files?.filename}</h2>
            <p className="text-sm text-muted-foreground">
              Processed on {formatDate(sessionData.processing_completed_at || sessionData.processing_started_at)}
            </p>
          </div>
        </div>
        <Badge variant={sessionData.processing_status === 'completed' ? 'default' : 'destructive'}>
          {sessionData.processing_status}
        </Badge>
      </div>

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
                <span className="text-sm font-medium">{sessionData.uploaded_files?.filename}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">File Type:</span>
                <span className="text-sm font-medium">{sessionData.uploaded_files?.file_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">File Size:</span>
                <span className="text-sm font-medium">{formatFileSize(sessionData.uploaded_files?.file_size || 0)}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Upload Date:</span>
                <span className="text-sm font-medium">{formatDate(sessionData.uploaded_files?.upload_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Processing Started:</span>
                <span className="text-sm font-medium">{formatDate(sessionData.processing_started_at)}</span>
              </div>
              {sessionData.processing_completed_at && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Processing Completed:</span>
                  <span className="text-sm font-medium">{formatDate(sessionData.processing_completed_at)}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generated Content */}
      {sessionData.processing_status === 'completed' && (
        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="summary">Call Summary</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="email">Email</TabsTrigger>
            <TabsTrigger value="presentation">Presentation</TabsTrigger>
          </TabsList>
          
          <TabsContent value="summary" className="mt-6">
            {sessionData.call_notes && sessionData.call_notes.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <MessageSquare className="w-5 h-5" />
                      <span>Call Summary</span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleCopy(sessionData.call_notes[0].ai_summary, 'Call Summary')}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted rounded-lg p-4">
                    <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                      {sessionData.call_notes[0].ai_summary}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  No call summary available
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="insights" className="mt-6">
            {sessionData.call_insights && sessionData.call_insights.length > 0 ? (
              <div className="space-y-4">
                {sessionData.call_insights.map((insight, index) => (
                  <Card key={insight.id || index}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant="outline" className="text-xs">
                          {insight.insight_type?.replace('_', ' ')}
                        </Badge>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary" className="text-xs">
                            Score: {insight.relevance_score}
                          </Badge>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleCopy(insight.content, 'Insight')}
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm leading-relaxed">{insight.content}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                        <span>Source: {insight.source}</span>
                        {insight.timestamp && <span>Time: {insight.timestamp}</span>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  No insights available
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="email" className="mt-6">
            {sessionData.follow_up_emails && sessionData.follow_up_emails.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-5 h-5" />
                      <span>Follow-up Email</span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleCopy(sessionData.follow_up_emails[0].email_content, 'Follow-up Email')}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted rounded-lg p-4">
                    <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                      {sessionData.follow_up_emails[0].email_content}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  No follow-up email available
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="presentation" className="mt-6">
            {sessionData.deck_prompts && sessionData.deck_prompts.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Presentation className="w-5 h-5" />
                      <span>Presentation Prompt</span>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleCopy(sessionData.deck_prompts[0].prompt_content, 'Presentation Prompt')}
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted rounded-lg p-4">
                    <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                      {sessionData.deck_prompts[0].prompt_content}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  No presentation prompt available
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Action Items */}
      {sessionData.call_commitments && sessionData.call_commitments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckSquare className="w-5 h-5" />
              <span>Action Items</span>
              <Badge variant="secondary">{sessionData.call_commitments.length} items</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sessionData.call_commitments.map((commitment, index) => (
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
  )
}