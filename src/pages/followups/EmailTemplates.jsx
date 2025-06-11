import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CRMConnectionStatus } from '@/components/followups/CRMConnectionStatus'
import { 
  Eye, 
  Ear, 
  Hand, 
  Brain, 
  Heart, 
  Zap,
  Send,
  Copy,
  RefreshCw,
  Plus,
  MessageSquare,
  User,
  Target,
  Sparkles,
  ArrowRight,
  Edit,
  Save,
  X
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// Mock personality analysis data
const mockPersonalityAnalysis = {
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
}

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

const personalityTypes = {
  ENTJ: { label: "The Commander", traits: ["Natural leader", "Strategic", "Decisive"] },
  ISTJ: { label: "The Logistician", traits: ["Practical", "Fact-minded", "Reliable"] },
  ENFP: { label: "The Campaigner", traits: ["Enthusiastic", "Creative", "Sociable"] },
  INTJ: { label: "The Architect", traits: ["Imaginative", "Strategic", "Independent"] },
  ESTP: { label: "The Entrepreneur", traits: ["Bold", "Practical", "Perceptive"] }
}

const quickPrompts = [
  "Make it more concise and direct",
  "Add more technical details", 
  "Include specific ROI metrics",
  "Make it more personal and warm",
  "Add urgency and next steps",
  "Focus on competitive advantages",
  "Include social proof and testimonials",
  "Emphasize integration capabilities"
]

export const EmailTemplates = () => {
  const [selectedInsights, setSelectedInsights] = useState([])
  const [generatedEmail, setGeneratedEmail] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [isRefining, setIsRefining] = useState(false)
  const [emailSubject, setEmailSubject] = useState('')
  const [pushStatus, setPushStatus] = useState('draft')

  // Initialize with some insights selected
  useEffect(() => {
    const defaultInsights = [
      { id: 'primary_contact', type: 'personality', selected: true },
      { id: 'communication_visual', type: 'communication', selected: true },
      { id: 'attendee_1', type: 'attendee', selected: true }
    ]
    setSelectedInsights(defaultInsights)
  }, [])

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
      // Simulate AI email generation
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      const email = `Subject: Following up on our sales automation discussion

Hi Sarah,

Thank you for taking the time to speak with me yesterday about your sales team's automation needs. I was impressed by your strategic vision for scaling your sales operations.

Based on our conversation and your preference for visual data, I've prepared a comprehensive ROI analysis that shows how our solution can deliver the 40% efficiency gains you're targeting. The visual dashboard I mentioned would give you real-time insights into your team's performance metrics.

For Mike, I've included detailed implementation timelines and hands-on training materials that address the process integration concerns he raised. Our step-by-step approach ensures smooth adoption without disrupting current workflows.

Lisa, I think you'll be excited about the collaboration features that enable seamless alignment between sales and marketing teams - exactly what you mentioned as a key priority.

Key next steps:
• Technical demo with Mike's team (Tuesday 2 PM)
• ROI presentation with visual metrics (Thursday 10 AM)  
• Pilot program proposal for Q2 implementation

I've attached the visual ROI analysis and implementation roadmap we discussed. Would you prefer a brief call to walk through the numbers, or shall we proceed directly to the technical demo?

Looking forward to helping you achieve your ambitious growth targets.

Best regards,
[Your Name]

P.S. The case study from TechCorp (similar size/industry) shows 6-month payback - happy to share those specific metrics if helpful.`

      setGeneratedEmail(email)
      setEmailSubject('Following up on our sales automation discussion')
      toast.success('Email generated successfully!')
      
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
      
      // Simple refinement logic based on prompt
      if (prompt.toLowerCase().includes('concise')) {
        refinedEmail = generatedEmail.replace(/\. [A-Z]/g, '.\n\n').slice(0, Math.floor(generatedEmail.length * 0.7)) + '\n\nBest regards,\n[Your Name]'
      } else if (prompt.toLowerCase().includes('technical')) {
        refinedEmail = generatedEmail + '\n\nTechnical specifications:\n• API integration capabilities\n• Real-time data synchronization\n• Advanced security protocols\n• Scalable cloud infrastructure'
      } else if (prompt.toLowerCase().includes('roi')) {
        refinedEmail = generatedEmail.replace('40% efficiency gains', '40% efficiency gains ($120K annual savings)')
      }
      
      setGeneratedEmail(refinedEmail)
      
      // Add AI response
      const aiMessage = { 
        role: 'assistant', 
        content: 'I\'ve updated the email based on your request. The changes have been applied to focus on ' + prompt.toLowerCase() + '.', 
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
    toast.success('Email copied to clipboard')
  }

  const handlePushToHubSpot = async () => {
    setPushStatus('pending')
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000))
      setPushStatus('success')
      toast.success('Email template saved to HubSpot!')
    } catch (error) {
      setPushStatus('error')
      toast.error('Failed to push to HubSpot')
    }
  }

  const selectedCount = selectedInsights.length

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Email Templates</h1>
        <p className="text-muted-foreground">
          Generate personalized follow-up emails based on personality analysis and communication preferences.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Decision Maker Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Decision Maker Analysis</span>
                <Badge variant="secondary">AI Analyzed</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Primary Contact */}
              <div className="border border-border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={selectedInsights.some(item => item.id === 'primary_contact')}
                      onCheckedChange={() => handleToggleInsight('primary_contact', 'personality')}
                    />
                    <div>
                      <h4 className="font-semibold">{mockPersonalityAnalysis.primary_contact.name}</h4>
                      <p className="text-sm text-muted-foreground">{mockPersonalityAnalysis.primary_contact.role}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {Math.round(mockPersonalityAnalysis.primary_contact.confidence * 100)}% confidence
                  </Badge>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {/* Communication Style */}
                  <div>
                    <h5 className="text-sm font-medium mb-2">Communication Style</h5>
                    <div className="flex items-center space-x-2">
                      {(() => {
                        const style = communicationStyles[mockPersonalityAnalysis.primary_contact.communication_style]
                        const Icon = style.icon
                        return (
                          <>
                            <Badge variant="outline" className={cn("text-xs", style.color)}>
                              <Icon className="w-3 h-3 mr-1" />
                              {style.label}
                            </Badge>
                            <span className="text-xs text-muted-foreground">{style.description}</span>
                          </>
                        )
                      })()}
                    </div>
                  </div>

                  {/* Personality Type */}
                  <div>
                    <h5 className="text-sm font-medium mb-2">Personality Type</h5>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs bg-orange-100 text-orange-800 border-orange-200">
                        <Brain className="w-3 h-3 mr-1" />
                        {mockPersonalityAnalysis.primary_contact.personality_type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {personalityTypes[mockPersonalityAnalysis.primary_contact.personality_type]?.label}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Key Traits */}
                <div>
                  <h5 className="text-sm font-medium mb-2">Key Traits</h5>
                  <div className="flex flex-wrap gap-1">
                    {mockPersonalityAnalysis.primary_contact.key_traits.map((trait, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {trait}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Communication Preferences */}
                <div>
                  <h5 className="text-sm font-medium mb-2">Communication Preferences</h5>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {mockPersonalityAnalysis.primary_contact.communication_preferences.map((pref, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <span className="text-primary mt-1">•</span>
                        <span>{pref}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Call Attendees Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5" />
                <span>Call Attendees</span>
                <Badge variant="secondary">{mockPersonalityAnalysis.attendees.length} analyzed</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockPersonalityAnalysis.attendees.map((attendee, index) => (
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
                    <Badge variant="outline" className="text-xs">
                      {Math.round(attendee.confidence * 100)}% confidence
                    </Badge>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        {(() => {
                          const style = communicationStyles[attendee.communication_style]
                          const Icon = style.icon
                          return (
                            <Badge variant="outline" className={cn("text-xs", style.color)}>
                              <Icon className="w-3 h-3 mr-1" />
                              {style.label}
                            </Badge>
                          )
                        })()}
                        <Badge variant="outline" className="text-xs bg-orange-100 text-orange-800 border-orange-200">
                          <Brain className="w-3 h-3 mr-1" />
                          {attendee.personality_type}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {attendee.key_traits.map((trait, traitIndex) => (
                          <Badge key={traitIndex} variant="secondary" className="text-xs">
                            {trait}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Email Generation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5" />
                  <span>Generated Email</span>
                  {selectedCount > 0 && (
                    <Badge variant="secondary">{selectedCount} insights selected</Badge>
                  )}
                </div>
                <div className="flex items-center space-x-2">
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
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {generatedEmail ? (
                <>
                  {/* Subject Line */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Subject Line</label>
                    <Input
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder="Enter email subject..."
                    />
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
                      Copy
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
                  <p className="text-sm">Select insights above and click "Generate Email" to create a personalized follow-up</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Chat Interface for Refinement */}
          {generatedEmail && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="w-5 h-5" />
                  <span>Refine Email</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Quick Prompts */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Quick Refinements</h4>
                  <div className="grid md:grid-cols-2 gap-2">
                    {quickPrompts.map((prompt, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendPrompt(prompt)}
                        disabled={isRefining}
                        className="justify-start text-left h-auto py-2"
                      >
                        <ArrowRight className="w-3 h-3 mr-2 flex-shrink-0" />
                        <span className="text-xs">{prompt}</span>
                      </Button>
                    ))}
                  </div>
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
                    placeholder="Ask for specific changes... (e.g., 'Add more urgency' or 'Include pricing details')"
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
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* CRM Connection Status */}
          <CRMConnectionStatus
            status="connected"
            lastSync="3 minutes ago"
            accountInfo={{
              name: "Acme Corp Sales",
              hubId: "12345678"
            }}
            onReconnect={() => toast.success('Connection refreshed')}
            onSettings={() => toast.info('Opening settings...')}
          />

          {/* Communication Styles Guide */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Communication Styles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(communicationStyles).map(([key, style]) => {
                const Icon = style.icon
                return (
                  <div key={key} className="flex items-start space-x-3">
                    <Badge variant="outline" className={cn("text-xs", style.color)}>
                      <Icon className="w-3 h-3 mr-1" />
                      {style.label}
                    </Badge>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {style.description}
                    </p>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Email Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Personalization Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <Eye className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Visual Learners</p>
                    <p className="text-xs text-muted-foreground">Include charts, infographics, and visual data</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <Ear className="w-4 h-4 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Auditory Learners</p>
                    <p className="text-xs text-muted-foreground">Mention calls, discussions, and verbal feedback</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <Hand className="w-4 h-4 text-purple-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Kinesthetic Learners</p>
                    <p className="text-xs text-muted-foreground">Focus on hands-on demos and practical examples</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}