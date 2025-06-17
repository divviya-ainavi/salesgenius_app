import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { 
  Copy, 
  MoreVertical, 
  Edit, 
  Save, 
  X, 
  ExternalLink,
  Check,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const StatusChip = ({ status }) => {
  const statusConfig = {
    success: { icon: Check, color: 'bg-green-100 text-green-800 border-green-200', label: 'Pushed' },
    error: { icon: AlertCircle, color: 'bg-red-100 text-red-800 border-red-200', label: 'Failed' },
    pending: { icon: Loader2, color: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'Pushing...' },
    draft: { icon: Edit, color: 'bg-gray-100 text-gray-800 border-gray-200', label: 'Draft' }
  }

  const config = statusConfig[status] || statusConfig.draft
  const Icon = config.icon

  return (
    <Badge variant="outline" className={cn("text-xs", config.color)}>
      <Icon className={cn("w-3 h-3 mr-1", status === 'pending' && "animate-spin")} />
      {config.label}
    </Badge>
  )
}

export const InsightCard = ({ 
  title, 
  content, 
  type, 
  onEdit, 
  onPush, 
  onCopy, 
  onExport,
  status = 'draft',
  isEditable = true,
  showPushButton = true,
  showExportButton = false
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState(content)

  const handleSave = () => {
    onEdit(editedContent)
    setIsEditing(false)
    toast.success(`${title} updated successfully`)
  }

  const handleCancel = () => {
    setEditedContent(content)
    setIsEditing(false)
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(isEditing ? editedContent : content)
    onCopy?.()
    toast.success(`${title} copied to clipboard`)
  }

  const handlePush = () => {
    onPush?.(isEditing ? editedContent : content)
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center space-x-3">
          <CardTitle className="text-lg font-semibold">{title}</CardTitle>
          <StatusChip status={status} />
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Copy Button */}
          <Button variant="outline" size="sm" onClick={handleCopy}>
            <Copy className="w-4 h-4 mr-1" />
            Copy
          </Button>

          {/* Export Button */}
          {showExportButton && (
            <Button variant="outline" size="sm" onClick={onExport}>
              <ExternalLink className="w-4 h-4 mr-1" />
              Export
            </Button>
          )}

          {/* Push Button */}
          {showPushButton && !isEditing && (
            <Button 
              onClick={handlePush}
              disabled={status === 'pending'}
              size="sm"
            >
              {status === 'pending' ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                'Push to HubSpot'
              )}
            </Button>
          )}

          {/* Edit Controls */}
          {isEditable && (
            <>
              {isEditing ? (
                <div className="flex space-x-1">
                  <Button variant="outline" size="sm" onClick={handleSave}>
                    <Save className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleCancel}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="px-6 py-5">
        {isEditing ? (
          <Textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="min-h-32 font-mono text-sm"
            placeholder={`Edit ${title.toLowerCase()}...`}
          />
        ) : (
          <div className="bg-muted rounded-lg p-5">
            <pre className="whitespace-pre-wrap text-sm text-foreground font-mono leading-relaxed">
              {content}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}