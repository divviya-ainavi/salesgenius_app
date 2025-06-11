import React, { useState, useEffect } from 'react'
import { CommitmentsCard } from '@/components/followups/CommitmentsCard'
import { CRMConnectionStatus } from '@/components/followups/CRMConnectionStatus'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Calendar, Clock, User } from 'lucide-react'
import { toast } from 'sonner'
import { dbHelpers } from '@/lib/supabase'
import { cn } from '@/lib/utils'

// Mock data for recent calls
const mockRecentCalls = [
  {
    id: '1',
    title: 'Discovery Call - Acme Corp',
    date: '2024-01-15',
    duration: '45 min',
    commitments: [
      { id: '1', commitment_text: 'Send product demo video by Friday', is_selected: true, is_pushed: false },
      { id: '2', commitment_text: 'Schedule technical deep-dive next week', is_selected: true, is_pushed: true },
      { id: '3', commitment_text: 'Prepare custom pricing proposal', is_selected: false, is_pushed: false }
    ]
  },
  {
    id: '2',
    title: 'Follow-up - TechStart Inc',
    date: '2024-01-14',
    duration: '30 min',
    commitments: [
      { id: '4', commitment_text: 'Review integration requirements', is_selected: true, is_pushed: true },
      { id: '5', commitment_text: 'Connect with their CTO', is_selected: true, is_pushed: false }
    ]
  }
]

export const ActionItems = () => {
  const [selectedCall, setSelectedCall] = useState(mockRecentCalls[0])
  const [commitments, setCommitments] = useState(selectedCall.commitments)
  const [pushStatus, setPushStatus] = useState('draft')

  // Mock user ID
  const userId = 'mock-user-id'

  useEffect(() => {
    setCommitments(selectedCall.commitments)
  }, [selectedCall])

  const handleUpdateCommitments = (updatedCommitments) => {
    setCommitments(updatedCommitments)
    // In real app, save to database
    toast.success('Commitments updated')
  }

  const handlePushCommitments = async (selectedCommitments) => {
    setPushStatus('pending')
    
    try {
      // Simulate API call to HubSpot
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Log each commitment push
      for (const commitment of selectedCommitments) {
        await dbHelpers.logPushAction(
          userId,
          'commitment',
          commitment.id,
          'success',
          null,
          `hubspot-task-${Date.now()}`
        )
      }
      
      // Update local state
      const updatedCommitments = commitments.map(item => 
        selectedCommitments.find(selected => selected.id === item.id)
          ? { ...item, is_pushed: true }
          : item
      )
      setCommitments(updatedCommitments)
      
      setPushStatus('success')
      toast.success(`${selectedCommitments.length} commitments pushed to HubSpot as tasks`)
    } catch (error) {
      setPushStatus('error')
      toast.error('Failed to push commitments to HubSpot')
    }
  }

  const totalCommitments = commitments.length
  const selectedCount = commitments.filter(c => c.is_selected).length
  const pushedCount = commitments.filter(c => c.is_pushed).length

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Action Items & Commitments</h1>
        <p className="text-muted-foreground">
          Manage and track commitments made during sales calls. Push selected items to HubSpot as tasks.
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total Items</span>
            </div>
            <p className="text-2xl font-bold mt-1">{totalCommitments}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Selected</span>
            </div>
            <p className="text-2xl font-bold mt-1">{selectedCount}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Pushed</span>
            </div>
            <p className="text-2xl font-bold mt-1">{pushedCount}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Completion</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {totalCommitments > 0 ? Math.round((pushedCount / totalCommitments) * 100) : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Calls Selector */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Calls</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {mockRecentCalls.map((call) => (
                  <div
                    key={call.id}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer transition-colors",
                      selectedCall.id === call.id 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:bg-accent"
                    )}
                    onClick={() => setSelectedCall(call)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{call.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {call.date} • {call.duration}
                        </p>
                      </div>
                      <Badge variant="secondary">
                        {call.commitments.length} items
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Commitments Card */}
          <CommitmentsCard
            commitments={commitments}
            onUpdate={handleUpdateCommitments}
            onPush={handlePushCommitments}
            status={pushStatus}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* CRM Connection Status */}
          <CRMConnectionStatus
            status="connected"
            lastSync="5 minutes ago"
            accountInfo={{
              name: "Acme Corp Sales",
              hubId: "12345678"
            }}
            onReconnect={() => toast.success('Connection refreshed')}
            onSettings={() => toast.info('Opening settings...')}
          />

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Calendar className="w-4 h-4 mr-2" />
                View All Tasks in HubSpot
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Clock className="w-4 h-4 mr-2" />
                Set Reminder
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <User className="w-4 h-4 mr-2" />
                Assign to Team Member
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}