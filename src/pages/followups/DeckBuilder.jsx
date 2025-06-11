import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { CRMConnectionStatus } from '@/components/followups/CRMConnectionStatus'
import { 
  Presentation,
  Target,
  Brain,
  Lightbulb,
  MessageSquare,
  Settings,
  Sparkles,
  Copy,
  Send,
  RefreshCw,
  Plus,
  Edit,
  Save,
  X,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Users,
  FileText,
  Zap,
  Eye,
  Star,
  Clock,
  BarChart3,
  Shield,
  Rocket
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// Mock data for recent calls
const mockRecentCalls = [
  {
    id: '1',
    title: 'Discovery Call - Acme Corp',
    date: '2024-01-15',
    duration: '45 min',
    attendees: ['Sarah Johnson (VP Sales)', 'Mike Chen (Sales Ops)', 'Lisa Rodriguez (Marketing Dir)'],
    keyInsights: 8,
    sentiment: 'positive'
  },
  {
    id: '2',
    title: 'Follow-up - TechStart Inc',
    date: '2024-01-14',
    duration: '30 min',
    attendees: ['John Smith (CEO)', 'Emma Wilson (CTO)'],
    keyInsights: 5,
    sentiment: 'neutral'
  }
]

// Sales methodologies
const salesMethodologies = {
  sandler: {
    name: 'Sandler Selling System',
    description: 'Pain-focused methodology with upfront contracts',
    stages: ['Bonding & Rapport', 'Up-Front Contract', 'Pain', 'Budget', 'Decision', 'Fulfillment', 'Post-Sell']
  },
  spin: {
    name: 'SPIN Selling',
    description: 'Question-based approach focusing on situation, problem, implication, need-payoff',
    stages: ['Situation Questions', 'Problem Questions', 'Implication Questions', 'Need-Payoff Questions']
  },
  meddic: {
    name: 'MEDDIC',
    description: 'Qualification methodology for complex B2B sales',
    stages: ['Metrics', 'Economic Buyer', 'Decision Criteria', 'Decision Process', 'Identify Pain', 'Champion']
  },
  custom: {
    name: 'Custom Playbook',
    description: 'Your company-specific sales methodology',
    stages: ['Discovery', 'Qualification', 'Proposal', 'Negotiation', 'Close']
  }
}

// Presentation objectives
const presentationObjectives = [
  { value: 'educate', label: 'Educate on Solution', icon: Brain },
  { value: 'address_objections', label: 'Address Objections', icon: Shield },
  { value: 'propose_next_steps', label: 'Propose Next Steps', icon: Rocket },
  { value: 'close_deal', label: 'Close Deal', icon: Target },
  { value: 'build_urgency', label: 'Build Urgency', icon: Clock },
  { value: 'demonstrate_roi', label: 'Demonstrate ROI', icon: TrendingUp }
]

// Mock company content library
const mockContentLibrary = [
  { id: '1', title: 'ROI Calculator Template', type: 'template', lastUsed: '2024-01-10' },
  { id: '2', title: 'Customer Success Stories', type: 'case_study', lastUsed: '2024-01-08' },
  { id: '3', title: 'Technical Integration Guide', type: 'technical', lastUsed: '2024-01-05' },
  { id: '4', title: 'Competitive Comparison', type: 'competitive', lastUsed: '2024-01-03' }
]

// Quick refinement prompts
const quickPrompts = [
  'Make it more executive-focused',
  'Add more technical details',
  'Include specific ROI metrics',
  'Address competitive concerns',
  'Emphasize urgency and timeline',
  'Focus on implementation ease',
  'Add social proof and testimonials',
  'Strengthen the call-to-action'
]

export function DeckBuilder() {
  const [selectedCall, setSelectedCall] = useState(mockRecentCalls[0])
  const [selectedMethodology, setSelectedMethodology] = useState('spin')
  const [selectedObjective, setSelectedObjective] = useState('educate')
  const [selectedContent, setSelectedContent] = useState([])
  const [generatedPrompt, setGeneratedPrompt] = useState('')
  const [promptBlocks, setPromptBlocks] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [qualityScore, setQualityScore] = useState(0)
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [isRefining, setIsRefining] = useState(false)
  const [editingBlock, setEditingBlock] = useState(null)
  const [editText, setEditText] = useState('')

  // Generate initial prompt when setup is complete
  const handleGeneratePrompt = async () => {
    if (!selectedCall || !selectedMethodology || !selectedObjective) {
      toast.error('Please complete the setup before generating prompt')
      return
    }

    setIsGenerating(true)
    
    try {
      // Simulate AI prompt generation
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      const methodology = salesMethodologies[selectedMethodology]
      const objective = presentationObjectives.find(obj => obj.value === selectedObjective)
      
      const prompt = `# AI-Generated Presentation Prompt for Gamma

## Presentation Overview
**Objective**: ${objective.label}
**Methodology**: ${methodology.name}
**Target Audience**: ${selectedCall.attendees.join(', ')}
**Call Context**: ${selectedCall.title} (${selectedCall.date})

## Slide Structure & Content

### Slide 1: Executive Summary
Create an executive summary slide that immediately captures attention with:
- Bold headline addressing the primary pain point discussed: "Streamline Your Lead Qualification Process"
- Key statistic from our conversation: "Currently spending 15+ hours weekly on manual lead scoring"
- Value proposition: "Reduce manual work by 70% while improving lead quality"
- Visual element: Include a before/after comparison chart

### Slide 2: Problem Statement (SPIN: Situation Questions)
Based on our discovery call insights:
- Current state: Manual lead qualification taking 2-3 hours daily per team member
- Impact: Sales team spending 40% of time on administrative tasks instead of selling
- Consequence: Missing qualified leads due to delayed response times
- Visual: Process flow diagram showing current inefficiencies

### Slide 3: Implications & Cost (SPIN: Problem & Implication Questions)
Quantify the impact using insights from our call:
- Time cost: 15 hours/week × £50/hour = £750 weekly loss per team member
- Opportunity cost: 30% of leads go cold due to delayed follow-up
- Competitive disadvantage: Slower response times vs. competitors
- Visual: ROI calculator showing current losses

### Slide 4: Solution Overview (SPIN: Need-Payoff Questions)
Present our solution addressing specific needs mentioned:
- Automated lead scoring based on 50+ data points
- Real-time alerts for high-priority prospects
- CRM integration with existing HubSpot setup
- Visual: Solution architecture diagram

### Slide 5: Personalized ROI Analysis
Based on their team size (8 sales reps) and current metrics:
- Time savings: 12 hours/week per rep = 96 hours total
- Cost savings: £4,800 monthly in productivity gains
- Revenue impact: 25% increase in qualified lead conversion
- Payback period: 4.2 months
- Visual: Interactive ROI dashboard mockup

### Slide 6: Implementation Roadmap
Address their Q2 timeline requirement:
- Phase 1 (Week 1-2): Setup and CRM integration
- Phase 2 (Week 3-4): Team training and pilot program
- Phase 3 (Week 5-6): Full deployment and optimization
- Ongoing: Monthly optimization reviews
- Visual: Timeline with milestones

### Slide 7: Success Stories
Include relevant case studies:
- TechCorp (similar size): 60% reduction in qualification time
- SalesForce Inc: 40% increase in lead conversion
- Growth Ltd: 6-month ROI of 300%
- Visual: Customer testimonial quotes with logos

### Slide 8: Addressing Concerns
Based on objections raised in our call:
- Integration complexity: "Seamless HubSpot integration in 24 hours"
- Team adoption: "Intuitive interface with 2-hour training requirement"
- Data security: "SOC 2 Type II certified with enterprise-grade security"
- Visual: Security and compliance badges

### Slide 9: Next Steps & Call to Action
Clear path forward aligned with their decision process:
- Technical demo with Mike's team (proposed: Tuesday 2 PM)
- Pilot program proposal for 2 team members
- Contract terms and pricing discussion
- Decision timeline: End of Q1 as discussed
- Visual: Clear next steps flowchart

### Slide 10: Investment & Value Summary
Final value reinforcement:
- Monthly investment: £X per user
- Annual savings: £57,600 in productivity gains
- Additional revenue: £120,000 from improved conversion
- Net ROI: 400% in first year
- Visual: Value summary infographic

## Presentation Notes
- Use visual learning elements throughout (charts, diagrams, infographics) to match Sarah's preference
- Include hands-on demonstration elements for Mike's kinesthetic learning style
- Emphasize collaboration benefits for Lisa's team-focused approach
- Maintain professional, results-oriented tone throughout
- Include specific metrics and data points from our conversation
- End each section with a clear transition to maintain flow

## Gamma-Specific Instructions
- Use modern, professional template with company brand colors
- Ensure all charts and graphs are interactive where possible
- Include speaker notes for each slide with key talking points
- Add smooth transitions between slides
- Optimize for both presentation and leave-behind document formats`

      setGeneratedPrompt(prompt)
      
      // Parse into blocks for editing
      const blocks = prompt.split('### ').filter(block => block.trim()).map((block, index) => ({
        id: index,
        title: block.split('\n')[0].replace('Slide ', ''),
        content: block,
        type: index === 0 ? 'overview' : 'slide'
      }))
      
      setPromptBlocks(blocks)
      setQualityScore(87) // Mock quality score
      
      toast.success('Presentation prompt generated successfully!')
      
    } catch (error) {
      toast.error('Failed to generate prompt')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleContentToggle = (contentId) => {
    setSelectedContent(prev => 
      prev.includes(contentId) 
        ? prev.filter(id => id !== contentId)
        : [...prev, contentId]
    )
  }

  const handleSendPrompt = async (prompt) => {
    if (!prompt.trim() || !generatedPrompt) return
    
    setIsRefining(true)
    setChatInput('')
    
    // Add user message
    const userMessage = { role: 'user', content: prompt, timestamp: new Date() }
    setChatMessages(prev => [...prev, userMessage])
    
    try {
      // Simulate AI refinement
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Simple refinement logic
      let refinedPrompt = generatedPrompt
      if (prompt.toLowerCase().includes('executive')) {
        refinedPrompt = generatedPrompt.replace(/detailed/g, 'high-level strategic')
      } else if (prompt.toLowerCase().includes('technical')) {
        refinedPrompt = generatedPrompt + '\n\n### Additional Technical Slide: Integration Architecture\nDetailed technical specifications and API documentation...'
      }
      
      setGeneratedPrompt(refinedPrompt)
      setQualityScore(prev => Math.min(100, prev + 3))
      
      // Add AI response
      const aiMessage = { 
        role: 'assistant', 
        content: `I've refined the presentation prompt based on your request. The changes focus on ${prompt.toLowerCase()} and should improve the overall impact.`, 
        timestamp: new Date() 
      }
      setChatMessages(prev => [...prev, aiMessage])
      
      toast.success('Prompt refined successfully!')
      
    } catch (error) {
      toast.error('Failed to refine prompt')
    } finally {
      setIsRefining(false)
    }
  }

  const handleBlockEdit = (blockId) => {
    const block = promptBlocks.find(b => b.id === blockId)
    setEditingBlock(blockId)
    setEditText(block.content)
  }

  const handleSaveBlock = () => {
    const updatedBlocks = promptBlocks.map(block =>
      block.id === editingBlock ? { ...block, content: editText } : block
    )
    setPromptBlocks(updatedBlocks)
    
    // Update full prompt
    const updatedPrompt = updatedBlocks.map(block => block.content).join('\n\n### ')
    setGeneratedPrompt(updatedPrompt)
    
    setEditingBlock(null)
    setEditText('')
    toast.success('Block updated successfully')
  }

  const handleMoveBlock = (blockId, direction) => {
    const currentIndex = promptBlocks.findIndex(block => block.id === blockId)
    if (
      (direction === 'up' && currentIndex > 1) || 
      (direction === 'down' && currentIndex < promptBlocks.length - 1)
    ) {
      const newBlocks = [...promptBlocks]
      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
      
      [newBlocks[currentIndex], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[currentIndex]]
      setPromptBlocks(newBlocks)
      
      // Update full prompt
      const updatedPrompt = newBlocks.map(block => block.content).join('\n\n### ')
      setGeneratedPrompt(updatedPrompt)
      
      toast.success('Slide order updated')
    }
  }

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(generatedPrompt)
    toast.success('Presentation prompt copied to clipboard')
  }

  const handleExportToGamma = () => {
    // Simulate export to Gamma
    toast.success('Prompt exported to Gamma successfully!')
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center space-x-3">
          <Presentation className="w-8 h-8 text-primary" />
          <span>AI-Powered Presentation Strategist</span>
        </h1>
        <p className="text-muted-foreground">
          Transform call insights into persuasive, context-aware presentation prompts designed to accelerate your sales cycle.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Setup Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>Contextual Setup</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Call Selection */}
              <div>
                <label className="text-sm font-medium mb-3 block">Select Call</label>
                <div className="space-y-2">
                  {mockRecentCalls.map((call) => (
                    <div
                      key={call.id}
                      className={cn(
                        "p-4 rounded-lg border cursor-pointer transition-colors",
                        selectedCall.id === call.id 
                          ? "border-primary bg-primary/5" 
                          : "border-border hover:bg-accent"
                      )}
                      onClick={() => setSelectedCall(call)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{call.title}</h4>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary" className="text-xs">
                            {call.keyInsights} insights
                          </Badge>
                          <Badge 
                            variant={call.sentiment === 'positive' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {call.sentiment}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {call.date} • {call.duration}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Attendees: {call.attendees.join(', ')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Methodology & Objective */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Sales Methodology</label>
                  <Select value={selectedMethodology} onValueChange={setSelectedMethodology}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(salesMethodologies).map(([key, method]) => (
                        <SelectItem key={key} value={key}>
                          <div>
                            <div className="font-medium">{method.name}</div>
                            <div className="text-xs text-muted-foreground">{method.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Presentation Objective</label>
                  <Select value={selectedObjective} onValueChange={setSelectedObjective}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {presentationObjectives.map((objective) => {
                        const Icon = objective.icon
                        return (
                          <SelectItem key={objective.value} value={objective.value}>
                            <div className="flex items-center space-x-2">
                              <Icon className="w-4 h-4" />
                              <span>{objective.label}</span>
                            </div>
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Content Library */}
              <div>
                <label className="text-sm font-medium mb-3 block">Company Content Library</label>
                <div className="grid md:grid-cols-2 gap-2">
                  {mockContentLibrary.map((content) => (
                    <div
                      key={content.id}
                      className={cn(
                        "p-3 rounded-lg border cursor-pointer transition-colors text-sm",
                        selectedContent.includes(content.id)
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-accent"
                      )}
                      onClick={() => handleContentToggle(content.id)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{content.title}</span>
                        <Badge variant="outline" className="text-xs">
                          {content.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Last used: {content.lastUsed}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <Button 
                onClick={handleGeneratePrompt}
                disabled={isGenerating || !selectedCall || !selectedMethodology || !selectedObjective}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Generating Strategic Prompt...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Generate Presentation Prompt
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Generated Prompt Section */}
          {generatedPrompt && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-5 h-5" />
                    <span>Strategic Canvas</span>
                    <Badge variant="secondary" className="flex items-center space-x-1">
                      <Star className="w-3 h-3" />
                      <span>Quality: {qualityScore}/100</span>
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={handleCopyPrompt}>
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </Button>
                    <Button onClick={handleExportToGamma} size="sm">
                      <Send className="w-4 h-4 mr-1" />
                      Export to Gamma
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="blocks" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="blocks">Modular Blocks</TabsTrigger>
                    <TabsTrigger value="full">Full Prompt</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="blocks" className="mt-4">
                    <div className="space-y-4">
                      {promptBlocks.map((block, index) => (
                        <div key={block.id} className="border border-border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-sm">{block.title}</h4>
                            <div className="flex items-center space-x-1">
                              {index > 1 && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleMoveBlock(block.id, 'up')}
                                >
                                  <ArrowUp className="w-4 h-4" />
                                </Button>
                              )}
                              {index < promptBlocks.length - 1 && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleMoveBlock(block.id, 'down')}
                                >
                                  <ArrowDown className="w-4 h-4" />
                                </Button>
                              )}
                              {editingBlock === block.id ? (
                                <div className="flex space-x-1">
                                  <Button variant="outline" size="sm" onClick={handleSaveBlock}>
                                    <Save className="w-4 h-4" />
                                  </Button>
                                  <Button variant="outline" size="sm" onClick={() => setEditingBlock(null)}>
                                    <X className="w-4 h-4" />
                                  </Button>
                                </div>
                              ) : (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleBlockEdit(block.id)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                          
                          {editingBlock === block.id ? (
                            <Textarea
                              value={editText}
                              onChange={(e) => setEditText(e.target.value)}
                              className="min-h-32 font-mono text-sm"
                            />
                          ) : (
                            <div className="bg-muted rounded-lg p-3">
                              <pre className="whitespace-pre-wrap text-xs font-mono leading-relaxed">
                                {block.content.substring(0, 200)}...
                              </pre>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="full" className="mt-4">
                    <div className="bg-muted rounded-lg p-4">
                      <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed max-h-96 overflow-y-auto">
                        {generatedPrompt}
                      </pre>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}

          {/* Chat Refinement Interface */}
          {generatedPrompt && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Zap className="w-5 h-5" />
                  <span>Co-Pilot Refinement</span>
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
                        <Sparkles className="w-3 h-3 mr-2 flex-shrink-0" />
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
                    placeholder="Refine the presentation... (e.g., 'Add more competitive analysis' or 'Make it more technical')"
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
          {/* Strategic Compass */}
          {generatedPrompt && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Brain className="w-5 h-5" />
                  <span>Strategic Compass</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Quality Indicators */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Impact Preview</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Personalization</span>
                      <Badge variant="default" className="text-xs">High</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Call-to-Action Strength</span>
                      <Badge variant="default" className="text-xs">Strong</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Objection Handling</span>
                      <Badge variant="secondary" className="text-xs">Good</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Gamma Compatibility</span>
                      <Badge variant="default" className="text-xs">Optimized</Badge>
                    </div>
                  </div>
                </div>

                {/* Methodology Mapping */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Methodology Alignment</h4>
                  <div className="space-y-2">
                    {salesMethodologies[selectedMethodology].stages.slice(0, 4).map((stage, index) => (
                      <div key={index} className="flex items-center space-x-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-muted-foreground">{stage}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quality Score */}
                <div>
                  <h4 className="text-sm font-medium mb-3">Quality Score</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Overall Quality</span>
                      <span className="text-sm font-medium">{qualityScore}/100</span>
                    </div>
                    <Progress value={qualityScore} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      Excellent personalization and strategic alignment
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* CRM Connection Status */}
          <CRMConnectionStatus
            status="connected"
            lastSync="1 minute ago"
            accountInfo={{
              name: "Acme Corp Sales",
              hubId: "12345678"
            }}
            onReconnect={() => toast.success('Connection refreshed')}
            onSettings={() => toast.info('Opening settings...')}
          />

          {/* Presentation Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Presentation Best Practices</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-3">
                <div className="flex items-start space-x-2">
                  <Eye className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Visual Impact</p>
                    <p className="text-xs text-muted-foreground">Use charts and infographics for data-heavy slides</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <Users className="w-4 h-4 text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Audience Engagement</p>
                    <p className="text-xs text-muted-foreground">Include interactive elements and questions</p>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <Target className="w-4 h-4 text-purple-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Clear Objectives</p>
                    <p className="text-xs text-muted-foreground">Each slide should advance toward your goal</p>
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