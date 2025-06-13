import React, { useState, useEffect } from 'react'
import { CommitmentsCard } from '@/components/followups/CommitmentsCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProspectSelector } from '@/components/shared/ProspectSelector'
import { Calendar, Clock, User, CheckSquare, Target, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import { dbHelpers, CURRENT_USER } from '@/lib/supabase'
import { cn } from '@/lib/utils'

// Mock data for action items based on selected prospect
const getActionItemsForProspect = (prospectId) => {
  const actionItemsData = {
    'acme_corp': [
      { 
        id: '1', 
        commitment_text: 'Send product demo video by Friday', 
        is_selected: true, 
        is_pushed: false,
        owner: 'Sarah Johnson',
        deadline: '2024-01-19',
        priority: 'high',
        source: 'Call 4 - Pilot Discussion'
      },
      { 
        id: '2', 
        commitment_text: 'Schedule technical deep-dive with Mike\'s team next week', 
        is_selected: true, 
        is_pushed: true,
        owner: 'Mike Chen',
        deadline: '2024-01-22',
        priority: 'high',
        source: 'Call 3 - Technical Requirements'
      },
      { 
        id: '3', 
        commitment_text: 'Prepare custom pricing proposal for Q2 implementation', 
        is_selected: false, 
        is_pushed: false,
        owner: 'Sales Team',
        deadline: '2024-01-25',
        priority: 'medium',
        source: 'Call 4 - Budget Discussion'
      },
      { 
        id: '4', 
        commitment_text: 'Provide HubSpot integration documentation', 
        is_selected: true, 
        is_pushed: false,
        owner: 'Technical Team',
        deadline: '2024-01-20',
        priority: 'high',
        source: 'Call 2 - Integration Requirements'
      }
    ],
    'techstart_inc': [
      { 
        id: '5', 
        commitment_text: 'Review integration requirements with CTO', 
        is_selected: true, 
        is_pushed: true,
        owner: 'Emma Wilson',
        deadline: '2024-01-18',
        priority: 'high',
        source: 'Call 2 - Technical Review'
      },
      { 
        id: '6', 
        commitment_text: 'Connect with their development team for API discussion', 
        is_selected: true, 
        is_pushed: false,
        owner: 'John Smith',
        deadline: '2024-01-21',
        priority: 'medium',
        source: 'Call 1 - Initial Discovery'
      },
      { 
        id: '7', 
        commitment_text: 'Prepare startup-specific pricing model', 
        is_selected: true, 
        is_pushed: false,
        owner: 'Sales Team',
        deadline: '2024-01-23',
        priority: 'medium',
        source: 'Call 2 - Budget Constraints'
      }
    ],
    'global_solutions': [
      { 
        id: '8', 
        commitment_text: 'Schedule process optimization workshop', 
        is_selected: true, 
        is_pushed: false,
        owner: 'Emma Wilson',
        deadline: '2024-01-24',
        priority: 'high',
        source: 'Call 3 - Process Review'
      },
      { 
        id: '9', 
        commitment_text: 'Provide enterprise security documentation', 
        is_selected: true, 
        is_pushed: true,
        owner: 'David Brown',
        deadline: '2024-01-20',
        priority: 'high',
        source: 'Call 2 - Security Requirements'
      },
      { 
        id: '10', 
        commitment_text: 'Create implementation timeline for Q2', 
        is_selected: false, 
        is_pushed: false,
        owner: 'Project Team',
        deadline: '2024-01-26',
        priority: 'low',
        source: 'Call 1 - Timeline Discussion'
      }
    ]
  };

  return actionItemsData[prospectId] || [];
};

// Mock prospects data
const mockProspects = [
  {
    id: 'acme_corp',
    companyName: 'Acme Corp',
    prospectName: 'Sarah Johnson',
    title: 'VP of Sales',
    status: 'hot',
    dealValue: '$120K',
    probability: 85,
    nextAction: 'Pilot program approval',
    stakeholders: [
      { name: 'Sarah Johnson', role: 'VP Sales', style: 'Visual' },
      { name: 'Mike Chen', role: 'Sales Ops', style: 'Kinesthetic' },
      { name: 'Lisa Rodriguez', role: 'Marketing Dir', style: 'Auditory' }
    ]
  },
  {
    id: 'techstart_inc',
    companyName: 'TechStart Inc',
    prospectName: 'John Smith',
    title: 'CEO',
    status: 'warm',
    dealValue: '$45K',
    probability: 65,
    nextAction: 'Technical demo',
    stakeholders: [
      { name: 'John Smith', role: 'CEO', style: 'Visual' },
      { name: 'Emma Wilson', role: 'CTO', style: 'Kinesthetic' }
    ]
  },
  {
    id: 'global_solutions',
    companyName: 'Global Solutions Ltd',
    prospectName: 'Emma Wilson',
    title: 'Director of Operations',
    status: 'warm',
    dealValue: '$85K',
    probability: 70,
    nextAction: 'Proposal review',
    stakeholders: [
      { name: 'Emma Wilson', role: 'Director Operations', style: 'Auditory' },
      { name: 'David Brown', role: 'IT Manager', style: 'Kinesthetic' }
    ]
  }
];

export const ActionItems = () => {
  const [selectedProspect, setSelectedProspect] = useState(mockProspects[0])
  const [commitments, setCommitments] = useState([])
  const [pushStatus, setPushStatus] = useState('draft')

  // Use predefined Sales Manager user
  const userId = CURRENT_USER.id

  // Load action items when prospect changes
  useEffect(() => {
    if (selectedProspect) {
      const prospectCommitments = getActionItemsForProspect(selectedProspect.id);
      setCommitments(prospectCommitments);
      setPushStatus('draft');
      toast.success(`Loaded action items for ${selectedProspect.companyName}`);
    }
  }, [selectedProspect]);

  const handleProspectSelect = (prospect) => {
    setSelectedProspect(prospect);
  };

  const handleUpdateCommitments = (updatedCommitments) => {
    setCommitments(updatedCommitments)
    // In real app, save to database
    toast.success(`Commitments updated for ${selectedProspect.companyName}`)
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
      toast.success(`${selectedCommitments.length} commitments for ${selectedProspect.companyName} pushed to HubSpot as tasks`)
    } catch (error) {
      setPushStatus('error')
      toast.error('Failed to push commitments to HubSpot')
    }
  }

  const totalCommitments = commitments.length
  const selectedCount = commitments.filter(c => c.is_selected).length
  const pushedCount = commitments.filter(c => c.is_pushed).length
  const highPriorityCount = commitments.filter(c => c.priority === 'high').length

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Page Header */}
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
              <CheckSquare className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total Items</span>
            </div>
            <p className="text-2xl font-bold mt-1">{totalCommitments}</p>
            <p className="text-xs text-muted-foreground">for {selectedProspect.companyName}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">High Priority</span>
            </div>
            <p className="text-2xl font-bold mt-1">{highPriorityCount}</p>
            <p className="text-xs text-muted-foreground">urgent actions</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Selected</span>
            </div>
            <p className="text-2xl font-bold mt-1">{selectedCount}</p>
            <p className="text-xs text-muted-foreground">ready to push</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Completion</span>
            </div>
            <p className="text-2xl font-bold mt-1">
              {totalCommitments > 0 ? Math.round((pushedCount / totalCommitments) * 100) : 0}%
            </p>
            <p className="text-xs text-muted-foreground">pushed to HubSpot</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Sidebar - Prospect Selector */}
        <div className="space-y-6">
          <ProspectSelector
            selectedProspect={selectedProspect}
            onProspectSelect={handleProspectSelect}
            compact={true}
            showStakeholders={false}
          />

          {/* Action Items Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Action Items Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Next Action:</span>
                  <Badge variant="default" className="text-xs">
                    {selectedProspect.nextAction}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Deal Value:</span>
                  <span className="text-sm font-medium">{selectedProspect.dealValue}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Probability:</span>
                  <span className="text-sm font-medium">{selectedProspect.probability}%</span>
                </div>
              </div>

              {/* Priority Breakdown */}
              <div className="pt-3 border-t border-border">
                <h4 className="text-sm font-medium mb-2">Priority Breakdown</h4>
                <div className="space-y-2">
                  {['high', 'medium', 'low'].map(priority => {
                    const count = commitments.filter(c => c.priority === priority).length;
                    return (
                      <div key={priority} className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className={cn("text-xs", getPriorityColor(priority))}>
                            {priority}
                          </Badge>
                        </div>
                        <span className="font-medium">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

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

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Enhanced Commitments Card with prospect context */}
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div className="flex items-center space-x-3">
                <CardTitle className="text-lg font-semibold">
                  Action Items for {selectedProspect.companyName}
                </CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {selectedCount} selected
                </Badge>
              </div>
              
              <div className="flex items-center space-x-2">
                <Button 
                  onClick={() => handlePushCommitments(commitments.filter(item => item.is_selected))}
                  disabled={pushStatus === 'pending' || selectedCount === 0}
                  size="sm"
                >
                  {pushStatus === 'pending' ? (
                    <>
                      <Clock className="w-4 h-4 mr-1 animate-spin" />
                      Pushing...
                    </>
                  ) : (
                    `Push ${selectedCount} to HubSpot`
                  )}
                </Button>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              {/* Enhanced Items List */}
              {commitments.map((item) => (
                <div key={item.id} className="flex items-start space-x-3 p-4 border border-border rounded-lg">
                  <input
                    type="checkbox"
                    checked={item.is_selected}
                    onChange={() => {
                      const updatedCommitments = commitments.map(c =>
                        c.id === item.id ? { ...c, is_selected: !c.is_selected } : c
                      );
                      handleUpdateCommitments(updatedCommitments);
                    }}
                    className="mt-1"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <p className={cn(
                        "text-sm leading-relaxed",
                        !item.is_selected && "text-muted-foreground line-through"
                      )}>
                        {item.commitment_text}
                      </p>
                      <div className="flex items-center space-x-2 ml-2">
                        <Badge variant="outline" className={cn("text-xs", getPriorityColor(item.priority))}>
                          {item.priority}
                        </Badge>
                        {item.is_pushed && (
                          <Badge variant="default" className="text-xs bg-green-100 text-green-800 border-green-200">
                            Pushed
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <User className="w-3 h-3" />
                        <span>Owner: {item.owner}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3" />
                        <span>Due: {item.deadline}</span>
                      </div>
                    </div>
                    
                    <div className="mt-2 text-xs text-muted-foreground">
                      <span className="font-medium">Source:</span> {item.source}
                    </div>
                  </div>
                </div>
              ))}

              {/* Empty State */}
              {commitments.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-2">No action items for {selectedProspect.companyName}</p>
                  <p className="text-sm">Action items will appear here after processing calls with this prospect</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}