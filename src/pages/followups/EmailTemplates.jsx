import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { ProspectSelector } from '@/components/shared/ProspectSelector'
import { 
  Eye, 
  Ear, 
  Hand, 
  Brain, 
  Zap,
  Send,
  Copy,
  RefreshCw,
  MessageSquare,
  User,
  Sparkles,
  ArrowRight,
  Mail,
  Crown,
  Star
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// Mock personality analysis data based on selected prospect
const getPersonalityAnalysis = (prospectId) => {
  const analysisData = {
    'acme_corp': {
      primary_contact: {
        name: "Sarah Johnson",
        role: "VP of Sales",
        communication_style: "visual",
        personality_type: "ENTJ",
        confidence: 0.85,
        key_traits: ["Direct", "Results-oriented", "Strategic thinker"],
        communication_preferences: [
          "Prefers visual data and charts",
          "Values efficiency and quick decisions", 
          "Responds well to ROI-focused messaging"
        ]
      },
      attendees: [
        {
          name: "Mike Chen",
          role: "Sales Operations Manager", 
          communication_style: "kinesthetic",
          personality_type: "ISTJ",
          confidence: 0.78,
          key_traits: ["Detail-oriented", "Process-focused", "Analytical"],
          communication_preferences: [
            "Prefers hands-on demonstrations",
            "Values detailed implementation plans",
            "Needs concrete examples and case studies"
          ]
        },
        {
          name: "Lisa Rodriguez",
          role: "Director of Marketing",
          communication_style: "auditory", 
          personality_type: "ENFP",
          confidence: 0.72,
          key_traits: ["Creative", "Collaborative", "Enthusiastic"],
          communication_preferences: [
            "Enjoys verbal discussions and calls",
            "Values team collaboration features",
            "Responds to emotional and inspirational messaging"
          ]
        }
      ]
    },
    'techstart_inc': {
      primary_contact: {
        name: "John Smith",
        role: "CEO",
        communication_style: "visual",
        personality_type: "INTJ",
        confidence: 0.88,
        key_traits: ["Analytical", "Strategic", "Independent"],
        communication_preferences: [
          "Prefers data-driven presentations",
          "Values long-term strategic thinking",
          "Responds to innovation and efficiency"
        ]
      },
      attendees: [
        {
          name: "Emma Wilson",
          role: "CTO",
          communication_style: "kinesthetic",
          personality_type: "ISTP",
          confidence: 0.82,
          key_traits: ["Technical", "Practical", "Problem-solver"],
          communication_preferences: [
            "Prefers technical demonstrations",
            "Values hands-on testing",
            "Needs detailed technical specifications"
          ]
        }
      ]
    },
    'global_solutions': {
      primary_contact: {
        name: "Emma Wilson",
        role: "Director of Operations",
        communication_style: "auditory",
        personality_type: "ESFJ",
        confidence: 0.79,
        key_traits: ["Collaborative", "Process-oriented", "People-focused"],
        communication_preferences: [
          "Prefers verbal communication",
          "Values team consensus",
          "Responds to relationship-building"
        ]
      },
      attendees: [
        {
          name: "David Brown",
          role: "IT Manager",
          communication_style: "kinesthetic",
          personality_type: "ISTJ",
          confidence: 0.85,
          key_traits: ["Methodical", "Reliable", "Detail-focused"],
          communication_preferences: [
            "Prefers step-by-step processes",
            "Values practical implementation",
            "Needs comprehensive documentation"
          ]
        }
      ]
    }
  };

  return analysisData[prospectId] || {
    primary_contact: {
      name: "Unknown Contact",
      role: "Unknown Role",
      communication_style: "visual",
      personality_type: "UNKNOWN",
      confidence: 0.5,
      key_traits: ["To be determined"],
      communication_preferences: ["Analysis pending"]
    },
    attendees: []
  };
};

const communicationStyles = {
  visual: {
    icon: Eye,
    label: "Visual",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    description: "Prefers charts, graphs, and visual demonstrations"
  },
  auditory: {
    icon: Ear, 
    label: "Auditory",
    color: "bg-green-100 text-green-800 border-green-200",
    description: "Learns through listening and verbal communication"
  },
  kinesthetic: {
    icon: Hand,
    label: "Kinesthetic", 
    color: "bg-purple-100 text-purple-800 border-purple-200",
    description: "Prefers hands-on experiences and practical examples"
  }
}

const quickPrompts = [
  "Make it more concise",
  "Add technical details", 
  "Include ROI metrics",
  "Add urgency",
  "Focus on benefits",
  "Include social proof"
]

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

export const EmailTemplates = () => {
  const [selectedProspect, setSelectedProspect] = useState(mockProspects[0])
  const [personalityAnalysis, setPersonalityAnalysis] = useState(null)
  const [selectedInsights, setSelectedInsights] = useState([])
  const [generatedEmail, setGeneratedEmail] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [isRefining, setIsRefining] = useState(false)
  const [emailSubject, setEmailSubject] = useState('')
  const [pushStatus, setPushStatus] = useState('draft')

  // Load personality analysis when prospect changes
  useEffect(() => {
    if (selectedProspect) {
      const analysis = getPersonalityAnalysis(selectedProspect.id);
      setPersonalityAnalysis(analysis);
      
      // Auto-select primary contact and first attendee
      const defaultInsights = [
        { id: 'primary_contact', type: 'personality', selected: true },
        { id: 'attendee_1', type: 'attendee', selected: true }
      ];
      setSelectedInsights(defaultInsights);
      
      // Clear previous email content
      setGeneratedEmail('');
      setEmailSubject('');
      setChatMessages([]);
      setPushStatus('draft');
      
      toast.success(`Loaded analysis for ${selectedProspect.companyName}`);
    }
  }, [selectedProspect]);

  const handleProspectSelect = (prospect) => {
    setSelectedProspect(prospect);
  };

  const handleToggleInsight = (insightId, type) => {
    setSelectedInsights(prev => {
      const exists = prev.find(item => item.id === insightId)
      if (exists) {
        return prev.filter(item => item.id !== insightId)
      } else {
        return [...prev, { id: insightId, type, selected: true }]
      }
    })
  }

  const handleGenerateEmail = async () => {
    if (selectedInsights.length === 0) {
      toast.error('Please select at least one insight to generate email')
      return
    }

    setIsGenerating(true)
    
    try {
      // Simulate AI email generation based on selected prospect
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      const primaryContact = personalityAnalysis.primary_contact;
      const companyName = selectedProspect.companyName;
      
      // Generate subject line separately
      const subject = `Following up on our ${companyName} automation discussion`;
      
      // Generate email body without subject line
      const emailBody = `Hi ${primaryContact.name},

Thank you for taking the time to speak with me about ${companyName}'s sales automation needs. I was impressed by your ${primaryContact.key_traits[0].toLowerCase()} approach to scaling your operations.

Based on our conversation and your ${primaryContact.communication_style} communication preference, I've prepared a comprehensive analysis that shows how our solution can deliver the results you're targeting for ${companyName}.

${personalityAnalysis.attendees.length > 0 ? `For ${personalityAnalysis.attendees[0].name}, I've included detailed implementation materials that address the ${personalityAnalysis.attendees[0].key_traits[0].toLowerCase()} requirements discussed during our call.` : ''}

Key next steps aligned with your ${selectedProspect.nextAction.toLowerCase()}:
• Technical demonstration tailored to your team's needs
• ROI analysis specific to ${companyName}'s current metrics
• Implementation timeline for your target deployment

I've attached the analysis we discussed. Given your preference for ${primaryContact.communication_style === 'visual' ? 'visual data presentations' : primaryContact.communication_style === 'auditory' ? 'verbal discussions' : 'hands-on demonstrations'}, would you prefer a brief call to walk through the details, or shall we proceed directly to the next phase?

Looking forward to helping ${companyName} achieve your ambitious growth targets.

Best regards,
[Your Name]

P.S. The case study from a similar ${selectedProspect.dealValue} implementation shows excellent results - happy to share those specific metrics if helpful.`;

      setEmailSubject(subject);
      setGeneratedEmail(emailBody);
      toast.success('Personalized email generated successfully!')
      
    } catch (error) {
      toast.error('Failed to generate email')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSendPrompt = async (prompt) => {
    if (!prompt.trim() || !generatedEmail) return
    
    setIsRefining(true)
    setChatInput('')
    
    // Add user message
    const userMessage = { role: 'user', content: prompt, timestamp: new Date() }
    setChatMessages(prev => [...prev, userMessage])
    
    try {
      // Simulate AI refinement
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      let refinedEmail = generatedEmail
      
      // Simple refinement logic based on prompt and prospect context
      if (prompt.toLowerCase().includes('concise')) {
        refinedEmail = generatedEmail.replace(/\. [A-Z]/g, '.\n\n').slice(0, Math.floor(generatedEmail.length * 0.7)) + '\n\nBest regards,\n[Your Name]'
      } else if (prompt.toLowerCase().includes('technical')) {
        refinedEmail = generatedEmail + `\n\nTechnical specifications for ${selectedProspect.companyName}:\n• API integration capabilities\n• Real-time data synchronization\n• Advanced security protocols\n• Scalable cloud infrastructure`
      } else if (prompt.toLowerCase().includes('roi')) {
        refinedEmail = generatedEmail.replace('results you\'re targeting', `results you're targeting (projected ${selectedProspect.dealValue} annual value)`)
      }
      
      setGeneratedEmail(refinedEmail)
      
      // Add AI response
      const aiMessage = { 
        role: 'assistant', 
        content: `Updated email for ${selectedProspect.companyName} with ${prompt.toLowerCase()} focus.`, 
        timestamp: new Date() 
      }
      setChatMessages(prev => [...prev, aiMessage])
      
      toast.success('Email refined successfully!')
      
    } catch (error) {
      toast.error('Failed to refine email')
    } finally {
      setIsRefining(false)
    }
  }

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(generatedEmail)
    toast.success('Email body copied to clipboard')
  }

  const handleCopySubject = () => {
    navigator.clipboard.writeText(emailSubject)
    toast.success('Subject line copied to clipboard')
  }

  const handlePushToHubSpot = async () => {
    setPushStatus('pending')
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))
      setPushStatus('success')
      toast.success(`Email template for ${selectedProspect.companyName} saved to HubSpot!`)
    } catch (error) {
      setPushStatus('error')
      toast.error('Failed to push to HubSpot')
    }
  }

  const selectedCount = selectedInsights.length

  return (
    <TooltipProvider>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Streamlined Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">AI Email Personalization</h1>
          <p className="text-muted-foreground">
            Generate personalized emails using prospect insights and communication preferences.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Sidebar - Only Prospect Selector */}
          <div>
            <ProspectSelector
              selectedProspect={selectedProspect}
              onProspectSelect={handleProspectSelect}
              compact={true}
              showStakeholders={true}
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="insights" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="insights">Insights</TabsTrigger>
                <TabsTrigger value="email">Email</TabsTrigger>
              </TabsList>

              {/* Insights Tab */}
              <TabsContent value="insights" className="mt-6">
                {personalityAnalysis && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <User className="w-5 h-5" />
                        <span>Stakeholder Analysis - {selectedProspect.companyName}</span>
                        <Badge variant="secondary">AI Analyzed</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Primary Decision Maker - Simplified */}
                      <div className="border-2 border-amber-200 bg-amber-50 rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Checkbox
                              checked={selectedInsights.some(item => item.id === 'primary_contact')}
                              onCheckedChange={() => handleToggleInsight('primary_contact', 'personality')}
                            />
                            <div className="flex items-center space-x-2">
                              <Crown className="w-4 h-4 text-amber-600" />
                              <div>
                                <h4 className="font-semibold text-amber-900">{personalityAnalysis.primary_contact.name}</h4>
                                <p className="text-sm text-amber-700">{personalityAnalysis.primary_contact.role}</p>
                                <Badge variant="outline" className="mt-1 bg-amber-100 text-amber-800 border-amber-300 text-xs">
                                  Decision Maker
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          {/* Communication Style with Tooltip */}
                          <div>
                            <h5 className="text-sm font-medium mb-2">Communication Style</h5>
                            <div className="flex items-center space-x-2">
                              {(() => {
                                const style = communicationStyles[personalityAnalysis.primary_contact.communication_style]
                                const Icon = style.icon
                                return (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Badge variant="outline" className={cn("text-xs cursor-help", style.color)}>
                                        <Icon className="w-3 h-3 mr-1" />
                                        {style.label}
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>{style.description}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                )
                              })()}
                            </div>
                          </div>

                          {/* Personality Type - Simplified */}
                          <div>
                            <h5 className="text-sm font-medium mb-2">Personality</h5>
                            <Badge variant="outline" className="text-xs bg-orange-100 text-orange-800 border-orange-200">
                              <Brain className="w-3 h-3 mr-1" />
                              {personalityAnalysis.primary_contact.personality_type}
                            </Badge>
                          </div>
                        </div>

                        {/* Key Traits - Condensed */}
                        <div>
                          <h5 className="text-sm font-medium mb-2">Key Traits</h5>
                          <div className="flex flex-wrap gap-1">
                            {personalityAnalysis.primary_contact.key_traits.slice(0, 3).map((trait, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {trait}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Key Stakeholders - Simplified */}
                      {personalityAnalysis.attendees.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="font-medium flex items-center space-x-2">
                            <Star className="w-4 h-4 text-blue-600" />
                            <span>Key Stakeholders</span>
                          </h4>
                          {personalityAnalysis.attendees.map((attendee, index) => (
                            <div key={index} className="border border-border rounded-lg p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                  <Checkbox
                                    checked={selectedInsights.some(item => item.id === `attendee_${index + 1}`)}
                                    onCheckedChange={() => handleToggleInsight(`attendee_${index + 1}`, 'attendee')}
                                  />
                                  <div>
                                    <h4 className="font-semibold">{attendee.name}</h4>
                                    <p className="text-sm text-muted-foreground">{attendee.role}</p>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center space-x-4">
                                {/* Communication Style with Tooltip */}
                                {(() => {
                                  const style = communicationStyles[attendee.communication_style]
                                  const Icon = style.icon
                                  return (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Badge variant="outline" className={cn("text-xs cursor-help", style.color)}>
                                          <Icon className="w-3 h-3 mr-1" />
                                          {style.label}
                                        </Badge>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>{style.description}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  )
                                })()}

                                {/* Key Traits - First 2 only */}
                                <div className="flex gap-1">
                                  {attendee.key_traits.slice(0, 2).map((trait, traitIndex) => (
                                    <Badge key={traitIndex} variant="secondary" className="text-xs">
                                      {trait}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Email Generator Tab */}
              <TabsContent value="email" className="mt-6 space-y-6">
                {/* Email Generation */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Mail className="w-5 h-5" />
                        <span>Email for {selectedProspect.companyName}</span>
                        {selectedCount > 0 && (
                          <Badge variant="secondary">{selectedCount} insights</Badge>
                        )}
                      </div>
                      <Button 
                        onClick={handleGenerateEmail}
                        disabled={isGenerating || selectedCount === 0}
                      >
                        {isGenerating ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-1" />
                            Generate Email
                          </>
                        )}
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {generatedEmail ? (
                      <>
                        {/* Subject Line */}
                        <div>
                          <label className="text-sm font-medium mb-2 block">Subject Line</label>
                          <div className="flex items-center space-x-2">
                            <Input
                              value={emailSubject}
                              onChange={(e) => setEmailSubject(e.target.value)}
                              placeholder="Enter email subject..."
                              className="flex-1"
                            />
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={handleCopySubject}
                            >
                              <Copy className="w-4 h-4 mr-1" />
                              Copy
                            </Button>
                          </div>
                        </div>

                        {/* Email Content */}
                        <div>
                          <label className="text-sm font-medium mb-2 block">Email Content</label>
                          <Textarea
                            value={generatedEmail}
                            onChange={(e) => setGeneratedEmail(e.target.value)}
                            className="min-h-96 font-mono text-sm"
                          />
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-2">
                          <Button onClick={handleCopyEmail} variant="outline">
                            <Copy className="w-4 h-4 mr-1" />
                            Copy Email
                          </Button>
                          <Button 
                            onClick={handlePushToHubSpot}
                            disabled={pushStatus === 'pending'}
                          >
                            {pushStatus === 'pending' ? (
                              <>
                                <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                                Pushing...
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4 mr-1" />
                                Push to HubSpot
                              </>
                            )}
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p className="mb-2">No email generated yet</p>
                        <p className="text-sm">Select insights and click "Generate Email"</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Chat Interface for Refinement - Streamlined */}
                {generatedEmail && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Zap className="w-5 h-5" />
                        <span>Refine Email</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Quick Prompts - Condensed */}
                      <div className="grid grid-cols-3 gap-2">
                        {quickPrompts.map((prompt, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            onClick={() => handleSendPrompt(prompt)}
                            disabled={isRefining}
                            className="text-xs"
                          >
                            {prompt}
                          </Button>
                        ))}
                      </div>

                      {/* Chat Messages */}
                      {chatMessages.length > 0 && (
                        <div className="border border-border rounded-lg p-4 max-h-64 overflow-y-auto space-y-3">
                          {chatMessages.map((message, index) => (
                            <div
                              key={index}
                              className={cn(
                                "flex",
                                message.role === 'user' ? "justify-end" : "justify-start"
                              )}
                            >
                              <div
                                className={cn(
                                  "max-w-xs px-3 py-2 rounded-lg text-sm",
                                  message.role === 'user'
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted text-foreground"
                                )}
                              >
                                {message.content}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Chat Input */}
                      <div className="flex items-center space-x-2">
                        <Input
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          placeholder="Ask for specific changes..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault()
                              handleSendPrompt(chatInput)
                            }
                          }}
                          disabled={isRefining}
                        />
                        <Button 
                          onClick={() => handleSendPrompt(chatInput)}
                          disabled={!chatInput.trim() || isRefining}
                        >
                          {isRefining ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}