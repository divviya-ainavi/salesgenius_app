import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { 
  Plus, 
  Edit, 
  Save, 
  X, 
  Trash2,
  Check,
  AlertCircle,
  Loader2
} from 'lucide-react'
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

export const CommitmentsCard = ({ 
  commitments = [], 
  onUpdate, 
  onPush, 
  status = 'draft' 
}) => {
  const [items, setItems] = useState(commitments)
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const [newItem, setNewItem] = useState('')
  const [isAddingNew, setIsAddingNew] = useState(false)

  const handleToggleSelect = (id) => {
    const updatedItems = items.map(item =>
      item.id === id ? { ...item, is_selected: !item.is_selected } : item
    )
    setItems(updatedItems)
    onUpdate?.(updatedItems)
  }

  const handleStartEdit = (item) => {
    setEditingId(item.id)
    setEditText(item.commitment_text)
  }

  const handleSaveEdit = () => {
    const updatedItems = items.map(item =>
      item.id === editingId ? { ...item, commitment_text: editText } : item
    )
    setItems(updatedItems)
    setEditingId(null)
    setEditText('')
    onUpdate?.(updatedItems)
    toast.success('Commitment updated')
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditText('')
  }

  const handleDelete = (id) => {
    const updatedItems = items.filter(item => item.id !== id)
    setItems(updatedItems)
    onUpdate?.(updatedItems)
    toast.success('Commitment removed')
  }

  const handleAddNew = () => {
    if (!newItem.trim()) return
    
    const newCommitment = {
      id: Date.now().toString(),
      commitment_text: newItem.trim(),
      is_selected: true,
      is_pushed: false
    }
    
    const updatedItems = [...items, newCommitment]
    setItems(updatedItems)
    setNewItem('')
    setIsAddingNew(false)
    onUpdate?.(updatedItems)
    toast.success('Commitment added')
  }

  const handlePush = () => {
    const selectedItems = items.filter(item => item.is_selected)
    onPush?.(selectedItems)
  }

  const selectedCount = items.filter(item => item.is_selected).length

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center space-x-3">
          <CardTitle className="text-lg font-semibold">Action Items & Commitments</CardTitle>
          <StatusChip status={status} />
          {selectedCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {selectedCount} selected
            </Badge>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setIsAddingNew(true)}
            disabled={isAddingNew}
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Item
          </Button>
          
          <Button 
            onClick={handlePush}
            disabled={status === 'pending' || selectedCount === 0}
            size="sm"
          >
            {status === 'pending' ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              `Push ${selectedCount} to HubSpot`
            )}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {/* Existing Items */}
        {items.map((item) => (
          <div key={item.id} className="flex items-start space-x-3 p-3 border border-border rounded-lg">
            <Checkbox
              checked={item.is_selected}
              onCheckedChange={() => handleToggleSelect(item.id)}
              className="mt-1"
            />
            
            <div className="flex-1 min-w-0">
              {editingId === item.id ? (
                <div className="flex items-center space-x-2">
                  <Input
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSaveEdit()
                      if (e.key === 'Escape') handleCancelEdit()
                    }}
                    autoFocus
                  />
                  <Button variant="outline" size="sm" onClick={handleSaveEdit}>
                    <Save className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className={cn(
                    "text-sm leading-relaxed",
                    !item.is_selected && "text-muted-foreground line-through"
                  )}>
                    {item.commitment_text}
                  </p>
                  
                  <div className="flex items-center space-x-1 ml-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleStartEdit(item)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDelete(item.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Add New Item */}
        {isAddingNew && (
          <div className="flex items-center space-x-3 p-3 border border-dashed border-primary rounded-lg">
            <Checkbox checked={true} disabled />
            <div className="flex-1 flex items-center space-x-2">
              <Input
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                placeholder="Enter new commitment or action item..."
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddNew()
                  if (e.key === 'Escape') {
                    setIsAddingNew(false)
                    setNewItem('')
                  }
                }}
                autoFocus
              />
              <Button variant="outline" size="sm" onClick={handleAddNew}>
                <Save className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setIsAddingNew(false)
                  setNewItem('')
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {items.length === 0 && !isAddingNew && (
          <div className="text-center py-8 text-muted-foreground">
            <p className="mb-2">No action items or commitments yet</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsAddingNew(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add First Item
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}