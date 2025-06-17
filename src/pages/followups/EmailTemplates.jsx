import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ProspectSelector } from '@/components/shared/ProspectSelector'
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
  X,
  Mail,
  Crown,
  Star,
  Info,
  ChevronDown,
  ChevronRight,
  Users
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

const personalityTypes = {
  ENTJ: { label: "The Commander", traits: ["Natural leader", "Strategic", "Decisive"] },
  ISTJ: { label: "The Logistician", traits: ["Practical", "Fact-minded", "Reliable"] },
  ENFP: { label: "The Campaigner", traits: ["Enthusiastic", "Creative", "Sociable"] },
  INTJ: { label: "The Architect", traits: ["Imaginative", "Strategic", "Independent"] },
  ISTP: { label: "The Virtuoso", traits: ["Practical", "Experimental", "Adaptable"] },
  ESFJ: { label: "The Consul", traits: ["Caring", "Social", "Popular"] },
  UNKNOWN: { label: "Analysis Pending", traits: ["To be determined"] }
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
  const location = useLocation()
  const [selectedProspect, setSelectedProspect] = useState(mockProspects[0])
  const [personalityAnalysis, setPersonalityAnalysis] = useState(null)
  const [selectedRecipients, setSelectedRecipients] = useState([])
  const [generatedEmail, setGeneratedEmail] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [isRefining, setIsRefining] = useState(false)
  const [emailSubject, setEmailSubject] = useState('')
  const [pushStatus, setPushStatus] = useState('draft')
  const [activeTab, setActiveTab] = useState('insights')
  const [recipientSidebarOpen, setRecipientSidebarOpen] = useState(false)

  // Collapsible states - all collapsed by default
  const [primaryTraitsOpen, setPrimaryTraitsOpen] = useState(false)
  const [primaryPrefsOpen, setPrimaryPrefsOpen] = useState(false)
  const [attendeeTraitsOpen, setAttendeeTraitsOpen] = useState({})
  const [attendeePrefsOpen, setAttendeePrefsOpen] = useState({})

  // Check for selected call from navigation
  useEffect(() => {
    if (location.state?.selectedCall) {
      const call = location.state.selectedCall;
      // Find matching prospect or create new one
      const prospect = mockProspects.find(p => p.companyName === call.companyName) || {
        id: call.companyName.toLowerCase().replace(/\s+/g, '_'),
        companyName: call.companyName,
        prospectName: call.prospectName,
        title: 'Unknown',
        status: 'new',
        dealValue: 'TBD',
        probability: 50,
        nextAction: 'Initial follow-up',
        stakeholders: []
      };
      setSelectedProspect(prospect);
    }
  }, [location.state]);

  // Load personality analysis when prospect changes
  useEffect(() => {
    if (selectedProspect) {
      const analysis = getPersonalityAnalysis(selectedProspect.id);
      setPersonalityAnalysis(analysis);
      
      // Auto-select ALL insights (primary contact + all attendees)
      const allInsights = [
        { id: 'primary_contact', type: 'personality', selected: true }
      ];
      
      // Add all attendees to insights
      analysis.attendees.forEach((_, index) => {
        allInsights.push({ id: `attendee_${index}`, type: 'attendee', selected: true });
      });
      
      // Auto-select primary contact and first attendee as recipients
      const defaultRecipients = ['primary_contact'];
      if (analysis.attendees.length > 0) {
        defaultRecipients.push('attendee_0');
      }
      setSelectedRecipients(defaultRecipients);
      
      // Clear previous email content
      setGeneratedEmail('');
      setEmailSubject('');
      setChatMessages([]);
      setPushStatus('draft');
      
      // Initialize collapsible states for new prospect (all collapsed)
      const newAttendeeTraitsOpen = {};
      const newAttendeePrefsOpen = {};
      analysis.attendees.forEach((_, index) => {
        newAttendeeTraitsOpen[index] = false;
        newAttendeePrefsOpen[index] = false;
      });
      setAttendeeTraitsOpen(newAttendeeTraitsOpen);
      setAttendeePrefsOpen(newAttendeePrefsOpen);
      
      toast.success(`Loaded analysis for ${selectedProspect.companyName}`);
    }
  }, [selectedProspect]);

  // Clear email when recipients change
  useEffect(() => {
    if (generatedEmail && selectedRecipients.length > 0) {
      // Only clear if we have an existing email and selections have changed
      // This prevents clearing on initial load
      setGeneratedEmail('');
      setEmailSubject('');
      setChatMessages([]);
      setPushStatus('draft');
    }
  }, [selectedRecipients]);

  const handleProspectSelect = (prospect) => {
    setSelectedProspect(prospect);
  };

  const handleToggleRecipient = (recipientId) => {
    setSelectedRecipients(prev => {
      if (prev.includes(recipientId)) {
        return prev.filter(id => id !== recipientId)
      } else {
        return [...prev, recipientId]
      }
    })
  }

  const getSelectedRecipientsData = () => {
    if (!personalityAnalysis) return [];
    
    const recipients = [];
    
    if (selectedRecipients.includes('primary_contact')) {
      recipients.push({
        id: 'primary_contact',
        ...personalityAnalysis.primary_contact,
        isPrimary: true
      });
    }
    
    selectedRecipients.forEach(recipientId => {
      if (recipientId.startsWith('attendee_')) {
        const index = parseInt(recipientId.split('_')[1]);
        if (personalityAnalysis.attendees[index]) {
          recipients.push({
            id: recipientId,
            ...personalityAnalysis.attendees[index],
            isPrimary: false
          });
        }
      }
    });
    
    return recipients;
  }

  const handleGenerateEmail = async () => {
    if (selectedRecipients.length === 0) {
      toast.error('Please select at least one recipient')
      return
    }

    setIsGenerating(true)
    
    try {
      // Simulate AI email generation based on selected prospect and recipients
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      const recipients = getSelectedRecipientsData();
      const primaryRecipient = recipients.find(r => r.isPrimary) || recipients[0];
      const companyName = selectedProspect.companyName;
      
      // Generate subject line
      const subject = `Following up on our ${companyName} automation discussion`;
      
      // Generate personalized email based on selected recipients
      const recipientNames = recipients.map(r => r.name).join(' and ');
      const recipientGreeting = recipients.length === 1 ? 
        `Hi ${recipients[0].name},` : 
        `Hi ${recipientNames},`;

      // Adapt content based on communication styles
      const visualRecipients = recipients.filter(r => r.communication_style === 'visual');
      const auditoryRecipients = recipients.filter(r => r.communication_style === 'auditory');
      const kinestheticRecipients = recipients.filter(r => r.communication_style === 'kinesthetic');

      let styleAdaptation = '';
      if (visualRecipients.length > 0) {
        styleAdaptation += 'I\'ve prepared visual ROI charts and dashboard mockups that clearly demonstrate the impact. ';
      }
      if (auditoryRecipients.length > 0) {
        styleAdaptation += 'I\'d love to schedule a call to discuss the details and answer any questions. ';
      }
      if (kinestheticRecipients.length > 0) {
        styleAdaptation += 'I can arrange a hands-on demonstration where you can test the features yourself. ';
      }

      const emailBody = `${recipientGreeting}

Thank you for taking the time to speak with me about ${companyName}'s sales automation needs. I was impressed by your ${primaryRecipient.key_traits[0].toLowerCase()} approach to scaling your operations.

Based on our conversation and your team's communication preferences, I've prepared a comprehensive analysis that shows how our solution can deliver the results you're targeting for ${companyName}.

${styleAdaptation}

Key next steps aligned with your ${selectedProspect.nextAction.toLowerCase()}:
• Technical demonstration tailored to your team's needs
• ROI analysis specific to ${companyName}'s current metrics  
• Implementation timeline for your target deployment

${recipients.length > 1 ? `For the team (${recipients.map(r => r.name).join(', ')}), I've included materials that address each of your specific requirements discussed during our call.` : ''}

Looking forward to helping ${companyName} achieve your ambitious growth targets.

Best regards,
[Your Name]

P.S. The case study from a similar ${selectedProspect.dealValue} implementation shows excellent results - happy to share those specific metrics if helpful.`;

      setEmailSubject(subject);
      setGeneratedEmail(emailBody);
      
      // Auto-switch to email tab after successful generation
      setActiveTab('generator');
      console.log('Generated email:', { subject, body: emailBody });
      
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
        content: `I've updated the email for ${selectedProspect.companyName} based on your request. The changes focus on ${prompt.toLowerCase()} while maintaining personalization for the selected recipients.`, 
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

  // Calculate total insights count (all insights are automatically included)
  const selectedCount = personalityAnalysis ? 
    1 + personalityAnalysis.attendees.length : 0;

  return (
    <TooltipProvider>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Personalized Emails with AI Insights</h1>
          <p className="text-muted-foreground">
            Generate personalized follow-up emails based on prospect personality analysis and communication preferences.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Sidebar - Prospect Selector */}
          <div className="space-y-6">
            <ProspectSelector
              selectedProspect={selectedProspect}
              onProspectSelect={handleProspectSelect}
              compact={false}
              showStakeholders={true}
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="insights">Prospect Profile & Insights</TabsTrigger>
                <TabsTrigger value="generator">Email Generator</TabsTrigger>
              </TabsList>

              {/* Insights Tab */}
              <TabsContent value="insights" className="mt-6">
                {personalityAnalysis && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <User className="w-5 h-5" />
                          <span>Personalization Insights for {selectedProspect.companyName}</span>
                          <Badge variant="secondary">AI Analyzed</Badge>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Primary Decision Maker */}
                      <div className="border-2 border-amber-200 bg-amber-50 rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Crown className="w-4 h-4 text-amber-600" />
                            <div>
                              <h4 className="font-semibold text-amber-900">{personalityAnalysis.primary_contact.name}</h4>
                              <p className="text-sm text-amber-700">{personalityAnalysis.primary_contact.role}</p>
                              <Badge variant="outline" className="mt-1 bg-amber-100 text-amber-800 border-amber-300 text-xs">
                                Primary Decision Maker
                              </Badge>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {Math.round(personalityAnalysis.primary_contact.confidence * 100)}% confidence
                          </Badge>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          {/* Communication Style */}
                          <div>
                            <h5 className="text-sm font-medium mb-2">Communication Style</h5>
                            <div className="flex items-center space-x-2">
                              {(() => {
                                const style = communicationStyles[personalityAnalysis.primary_contact.communication_style]
                                const Icon = style.icon
                                return (
                                  <div className="flex items-center space-x-2">
                                    <Badge variant="outline" className={cn("text-xs", style.color)}>
                                      <Icon className="w-3 h-3 mr-1" />
                                      {style.label}
                                    </Badge>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>{style.description}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </div>
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
                                {personalityAnalysis.primary_contact.personality_type}
                              </Badge>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div>
                                    <p className="font-medium">{personalityTypes[personalityAnalysis.primary_contact.personality_type]?.label}</p>
                                    <p className="text-xs mt-1">
                                      {personalityTypes[personalityAnalysis.primary_contact.personality_type]?.traits.join(', ')}
                                    </p>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                        </div>

                        {/* Key Traits - Collapsible */}
                        <Collapsible open={primaryTraitsOpen} onOpenChange={setPrimaryTraitsOpen}>
                          <CollapsibleTrigger className="flex items-center space-x-2 text-sm font-medium hover:text-primary transition-colors">
                            {primaryTraitsOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            <span>Key Traits</span>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-2">
                            <div className="flex flex-wrap gap-1">
                              {personalityAnalysis.primary_contact.key_traits.map((trait, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {trait}
                                </Badge>
                              ))}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>

                        {/* Communication Preferences - Collapsible */}
                        <Collapsible open={primaryPrefsOpen} onOpenChange={setPrimaryPrefsOpen}>
                          <CollapsibleTrigger className="flex items-center space-x-2 text-sm font-medium hover:text-primary transition-colors">
                            {primaryPrefsOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            <span>Communication Preferences</span>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-2">
                            <ul className="text-sm text-muted-foreground space-y-1">
                              {personalityAnalysis.primary_contact.communication_preferences.map((pref, index) => (
                                <li key={index} className="flex items-start space-x-2">
                                  <span className="text-primary mt-1">•</span>
                                  <span>{pref}</span>
                                </li>
                              ))}
                            </ul>
                          </CollapsibleContent>
                        </Collapsible>
                      </div>

                      {/* Key Stakeholders */}
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
                                  <Users className="w-4 h-4 text-blue-600" />
                                  <div>
                                    <h5 className="font-medium">{attendee.name}</h5>
                                    <p className="text-sm text-muted-foreground">{attendee.role}</p>
                                  </div>
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {Math.round(attendee.confidence * 100)}% confidence
                                </Badge>
                              </div>

                              <div className="grid md:grid-cols-2 gap-4">
                                {/* Communication Style */}
                                <div>
                                  <h6 className="text-sm font-medium mb-2">Communication Style</h6>
                                  <div className="flex items-center space-x-2">
                                    {(() => {
                                      const style = communicationStyles[attendee.communication_style]
                                      const Icon = style.icon
                                      return (
                                        <div className="flex items-center space-x-2">
                                          <Badge variant="outline" className={cn("text-xs", style.color)}>
                                            <Icon className="w-3 h-3 mr-1" />
                                            {style.label}
                                          </Badge>
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                                            </TooltipTrigger>
                                            <TooltipContent>
                                              <p>{style.description}</p>
                                            </TooltipContent>
                                          </Tooltip>
                                        </div>
                                      )
                                    })()}
                                  </div>
                                </div>

                                {/* Personality Type */}
                                <div>
                                  <h6 className="text-sm font-medium mb-2">Personality Type</h6>
                                  <div className="flex items-center space-x-2">
                                    <Badge variant="outline" className="text-xs bg-orange-100 text-orange-800 border-orange-200">
                                      <Brain className="w-3 h-3 mr-1" />
                                      {attendee.personality_type}
                                    </Badge>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <div>
                                          <p className="font-medium">{personalityTypes[attendee.personality_type]?.label}</p>
                                          <p className="text-xs mt-1">
                                            {personalityTypes[attendee.personality_type]?.traits.join(', ')}
                                          </p>
                                        </div>
                                      </TooltipContent>
                                    </Tooltip>
                                  </div>
                                </div>
                              </div>

                              {/* Key Traits - Collapsible */}
                              <Collapsible 
                                open={attendeeTraitsOpen[index]} 
                                onOpenChange={(open) => setAttendeeTraitsOpen(prev => ({ ...prev, [index]: open }))}
                              >
                                <CollapsibleTrigger className="flex items-center space-x-2 text-sm font-medium hover:text-primary transition-colors">
                                  {attendeeTraitsOpen[index] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                  <span>Key Traits</span>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="mt-2">
                                  <div className="flex flex-wrap gap-1">
                                    {attendee.key_traits.map((trait, traitIndex) => (
                                      <Badge key={traitIndex} variant="secondary" className="text-xs">
                                        {trait}
                                      </Badge>
                                    ))}
                                  </div>
                                </CollapsibleContent>
                              </Collapsible>

                              {/* Communication Preferences - Collapsible */}
                              <Collapsible 
                                open={attendeePrefsOpen[index]} 
                                onOpenChange={(open) => setAttendeePrefsOpen(prev => ({ ...prev, [index]: open }))}
                              >
                                <CollapsibleTrigger className="flex items-center space-x-2 text-sm font-medium hover:text-primary transition-colors">
                                  {attendeePrefsOpen[index] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                  <span>Communication Preferences</span>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="mt-2">
                                  <ul className="text-sm text-muted-foreground space-y-1">
                                    {attendee.communication_preferences.map((pref, prefIndex) => (
                                      <li key={prefIndex} className="flex items-start space-x-2">
                                        <span className="text-primary mt-1">•</span>
                                        <span>{pref}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </CollapsibleContent>
                              </Collapsible>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Insights Summary */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <Sparkles className="w-4 h-4 text-blue-600" />
                          <h4 className="font-medium text-blue-900">Insights Summary</h4>
                        </div>
                        <p className="text-sm text-blue-700">
                          All personality insights and communication preferences for {selectedProspect.companyName} are automatically included when generating personalized emails. 
                          This ensures maximum personalization based on the complete stakeholder analysis.
                        </p>
                        <div className="mt-3 flex items-center space-x-4">
                          <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800 border-blue-200">
                            {selectedCount} insights included
                          </Badge>
                          <span className="text-xs text-blue-600">
                            Ready for email generation
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Email Generator Tab */}
              <TabsContent value="generator" className="mt-6">
                <div className="space-y-6">
                  {/* Recipients Selection */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Mail className="w-5 h-5" />
                        <span>Email Recipients</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {personalityAnalysis && (
                        <div className="space-y-2">
                          {/* Primary Contact */}
                          <div className="flex items-center space-x-3 p-3 rounded-lg border">
                            <Checkbox
                              checked={selectedRecipients.includes('primary_contact')}
                              onCheckedChange={() => handleToggleRecipient('primary_contact')}
                            />
                            <Crown className="w-4 h-4 text-amber-600" />
                            <div className="flex-1">
                              <p className="font-medium text-sm">{personalityAnalysis.primary_contact.name}</p>
                              <p className="text-xs text-muted-foreground">{personalityAnalysis.primary_contact.role}</p>
                            </div>
                            <Badge variant="outline" className="text-xs bg-amber-100 text-amber-800 border-amber-300">
                              Primary
                            </Badge>
                          </div>

                          {/* Attendees */}
                          {personalityAnalysis.attendees.map((attendee, index) => (
                            <div key={index} className="flex items-center space-x-3 p-3 rounded-lg border">
                              <Checkbox
                                checked={selectedRecipients.includes(`attendee_${index}`)}
                                onCheckedChange={() => handleToggleRecipient(`attendee_${index}`)}
                              />
                              <Users className="w-4 h-4 text-blue-600" />
                              <div className="flex-1">
                                <p className="font-medium text-sm">{attendee.name}</p>
                                <p className="text-xs text-muted-foreground">{attendee.role}</p>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                Stakeholder
                              </Badge>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Generate Email Button */}
                      <div className="flex justify-center pt-4">
                        <Button 
                          onClick={handleGenerateEmail}
                          disabled={isGenerating || selectedRecipients.length === 0}
                          size="lg"
                          className="w-full max-w-md"
                        >
                          {isGenerating ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                              Generating Personalized Email...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 mr-2" />
                              Generate Personalized Email ({selectedRecipients.length} recipients)
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Generated Email Display */}
                  {generatedEmail ? (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Mail className="w-5 h-5" />
                            <span>Generated Email for {selectedProspect.companyName}</span>
                            <Badge variant="secondary">AI Generated</Badge>
                          </div>
                          <div className="flex items-center space-x-2">
                            {pushStatus === 'success' && (
                              <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                                Saved to HubSpot
                              </Badge>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handlePushToHubSpot}
                              disabled={pushStatus === 'pending'}
                            >
                              {pushStatus === 'pending' ? (
                                <>
                                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                  Saving...
                                </>
                              ) : pushStatus === 'success' ? (
                                <>
                                  <Zap className="w-4 h-4 mr-2" />
                                  Saved
                                </>
                              ) : (
                                <>
                                  <Send className="w-4 h-4 mr-2" />
                                  Save to HubSpot
                                </>
                              )}
                            </Button>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Subject Line */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium">Subject Line</label>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleCopySubject}
                            >
                              <Copy className="w-4 h-4 mr-1" />
                              Copy
                            </Button>
                          </div>
                          <Input
                            value={emailSubject}
                            onChange={(e) => setEmailSubject(e.target.value)}
                            className="font-medium"
                          />
                        </div>

                        {/* Email Body */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium">Email Body</label>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleCopyEmail}
                            >
                              <Copy className="w-4 h-4 mr-1" />
                              Copy
                            </Button>
                          </div>
                          <Textarea
                            value={generatedEmail}
                            onChange={(e) => setGeneratedEmail(e.target.value)}
                            rows={16}
                            className="font-mono text-sm"
                          />
                        </div>

                        {/* Recipients Summary */}
                        <div className="bg-muted/50 rounded-lg p-3">
                          <h4 className="text-sm font-medium mb-2">Email Recipients ({selectedRecipients.length})</h4>
                          <div className="flex flex-wrap gap-2">
                            {getSelectedRecipientsData().map((recipient, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {recipient.isPrimary && <Crown className="w-3 h-3 mr-1" />}
                                {recipient.name} - {recipient.role}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="text-center py-12">
                        <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No Email Generated Yet</h3>
                        <p className="text-muted-foreground mb-4">
                          Select recipients above and click "Generate Personalized Email" to create an AI-powered email using all available insights.
                        </p>
                      </CardContent>
                    </Card>
                  )}

                  {/* AI Refinement Chat */}
                  {generatedEmail && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                          <MessageSquare className="w-5 h-5" />
                          <span>Refine with AI</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Quick Prompts */}
                        <div>
                          <h4 className="text-sm font-medium mb-2">Quick Refinements</h4>
                          <div className="flex flex-wrap gap-2">
                            {quickPrompts.map((prompt, index) => (
                              <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                onClick={() => handleSendPrompt(prompt)}
                                disabled={isRefining}
                              >
                                {prompt}
                              </Button>
                            ))}
                          </div>
                        </div>

                        {/* Chat Messages */}
                        {chatMessages.length > 0 && (
                          <div className="space-y-3 max-h-64 overflow-y-auto">
                            {chatMessages.map((message, index) => (
                              <div
                                key={index}
                                className={cn(
                                  "p-3 rounded-lg text-sm",
                                  message.role === 'user'
                                    ? "bg-primary text-primary-foreground ml-8"
                                    : "bg-muted mr-8"
                                )}
                              >
                                <p>{message.content}</p>
                                <p className="text-xs opacity-70 mt-1">
                                  {message.timestamp.toLocaleTimeString()}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Chat Input */}
                        <div className="flex space-x-2">
                          <Input
                            placeholder="Ask AI to refine the email (e.g., 'Make it more technical' or 'Add urgency')"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                handleSendPrompt(chatInput)
                              }
                            }}
                            disabled={isRefining}
                          />
                          <Button
                            onClick={() => handleSendPrompt(chatInput)}
                            disabled={isRefining || !chatInput.trim()}
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
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}