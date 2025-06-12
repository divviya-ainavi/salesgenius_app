import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
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
  Trash2
} from 'lucide-react'
import { toast } from 'sonner'
import { dbHelpers, CURRENT_USER } from '@/lib/supabase'
import { cn } from '@/lib/utils'

export const ProcessingHistory = ({ onSelectFile, selectedFileId }) => {
  const [history, setHistory] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

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
      onSelectFile?.(details)
    } catch (error) {
      console.error('Error loading session details:', error)
      toast.error('Failed to load session details')
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
            <FileText className="w-5 h-5" />
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
                  selectedFileId === session.id 
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
                      <Eye className="w-3 h-3" />
                    </Button>
                    {session.processing_status === 'completed' && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          // TODO: Implement download functionality
                          toast.info('Download feature coming soon')
                        }}
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                    )}
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