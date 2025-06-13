import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { ProspectSelector } from '@/components/shared/ProspectSelector'
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

// Mock company content library based on prospect
const getContentLibrary = (prospectId) => {
  const baseContent = [
    { id: '1', title: 'ROI Calculator Template', type: 'template', lastUsed: '2024-01-10' },
    { id: '2', title: 'Customer Success Stories', type: 'case_study', lastUsed: '2024-01-08' },
    { id: '3', title: 'Technical Integration Guide', type: 'technical', lastUsed: '2024-01-05' },
    { id: '4', title: 'Competitive Comparison', type: 'competitive', lastUsed: '2024-01-03' }
  ];

  // Add prospect-specific content
  const prospectSpecific = {
    'acme_corp': [
      { id: '5', title: 'Sales Team Scaling Playbook', type: 'playbook', lastUsed: '2024-01-12' },
      { id: '6', title: 'HubSpot Integration Demo', type: 'demo', lastUsed: '2024-01-11' }
    ],
    'techstart_inc': [
      { id: '7', title: 'Startup Growth Framework', type: 'framework', lastUsed: '2024-01-09' },
      { id: '8', title: 'API Documentation', type: 'technical', lastUsed: '2024-01-07' }
    ],
    'global_solutions': [
      { id: '9', title: 'Enterprise Security Overview', type: 'security', lastUsed: '2024-01-06' },
      { id: '10', title: 'Process Optimization Guide', type: 'process', lastUsed: '2024-01-04' }
    ]
  };

  return [...baseContent, ...(prospectSpecific[prospectId] || [])];
};

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

export function DeckBuilder() {
  const [selectedProspect, setSelectedProspect] = useState(mockProspects[0])
  const [selectedMethodology, setSelectedMethodology] = useState('spin')
  const [selectedObjective, setSelectedObjective] = useState('educate')
  const [selectedContent, setSelectedContent] = useState([])
  const [contentLibrary, setContentLibrary] = useState([])
  const [generatedPrompt, setGeneratedPrompt] = useState('')
  const [promptBlocks, setPromptBlocks] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [qualityScore, setQualityScore] = useState(0)
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [isRefining, setIsRefining] = useState(false)
  const [editingBlock, setEditingBlock] = useState(null)
  const [editText, setEditText] = useState('')

  // Update content library when prospect changes
  useEffect(() => {
    if (selectedProspect) {
      const library = getContentLibrary(selectedProspect.id);
      setContentLibrary(library);
      setSelectedContent([]); // Reset selected content
      setGeneratedPrompt(''); // Clear previous prompt
      setPromptBlocks([]);
      setChatMessages([]);
      setQualityScore(0);
      toast.success(`Loaded content library for ${selectedProspect.companyName}`);
    }
  }, [selectedProspect]);

  const handleProspectSelect = (prospect) => {
    setSelectedProspect(prospect);
  };

  // Generate initial prompt when setup is complete
  const handleGeneratePrompt = async () => {
    if (!selectedProspect || !selectedMethodology || !selectedObjective) {
      toast.error('Please complete the setup before generating prompt')
      return
    }

    setIsGenerating(true)
    
    try {
      // Simulate AI prompt generation
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      const methodology = salesMethodologies[selectedMethodology]
      const objective = presentationObjectives.find(obj => obj.value === selectedObjective)
      
      const prompt = `# AI-Generated Presentation Prompt for Gamma - ${selectedProspect.companyName}

## Presentation Overview
**Objective**: ${objective.label}
**Methodology**: ${methodology.name}
**Target Audience**: ${selectedProspect.stakeholders.map(s => s.name).join(', ')}
**Company Context**: ${selectedProspect.companyName} (${selectedProspect.dealValue} opportunity)
**Next Action**: ${selectedProspect.nextAction}

## Slide Structure & Content

### Slide 1: Executive Summary for ${selectedProspect.companyName}
Create an executive summary slide that immediately captures attention with:
- Bold headline addressing ${selectedProspect.companyName}'s primary challenge
- Key statistic relevant to their ${selectedProspect.dealValue} investment
- Value proposition aligned with their ${selectedProspect.nextAction}
- Visual element: Include a before/after comparison chart

### Slide 2: Problem Statement (${methodology.name}: ${methodology.stages[0]})
Based on our discovery with ${selectedProspect.companyName}:
- Current state challenges specific to their industry
- Impact on ${selectedProspect.prospectName}'s team and objectives
- Consequence of inaction for their ${selectedProspect.nextAction}
- Visual: Process flow diagram showing current inefficiencies

### Slide 3: Implications & Cost Analysis
Quantify the impact using insights from ${selectedProspect.companyName}:
- Financial impact relevant to their ${selectedProspect.dealValue} budget
- Opportunity cost specific to their business model
- Competitive disadvantage in their market
- Visual: ROI calculator showing current losses

### Slide 4: Solution Overview Tailored for ${selectedProspect.companyName}
Present our solution addressing their specific needs:
- Features most relevant to ${selectedProspect.prospectName}'s priorities
- Integration capabilities for their existing systems
- Scalability for their growth plans
- Visual: Solution architecture diagram

### Slide 5: Personalized ROI Analysis for ${selectedProspect.companyName}
Based on their ${selectedProspect.dealValue} investment and requirements:
- Cost savings specific to their operation size
- Revenue impact aligned with their growth targets
- Payback period for their ${selectedProspect.nextAction} timeline
- Visual: Interactive ROI dashboard mockup

### Slide 6: Implementation Roadmap
Address their ${selectedProspect.nextAction} requirements:
- Phase-by-phase implementation plan
- Timeline aligned with their business calendar
- Resource requirements and support structure
- Ongoing optimization and success metrics
- Visual: Timeline with key milestones

### Slide 7: Success Stories from Similar Companies
Include relevant case studies:
- Companies similar to ${selectedProspect.companyName}
- Results achieved in comparable timeframes
- Testimonials from similar roles to ${selectedProspect.prospectName}
- Visual: Customer testimonial quotes with logos

### Slide 8: Addressing ${selectedProspect.companyName}'s Specific Concerns
Based on their evaluation criteria:
- Technical requirements and capabilities
- Security and compliance considerations
- Support and training provisions
- Visual: Security and compliance badges

### Slide 9: Next Steps & Call to Action
Clear path forward for ${selectedProspect.companyName}:
- Immediate next steps for their ${selectedProspect.nextAction}
- Timeline for decision and implementation
- Contact information and follow-up schedule
- Visual: Clear next steps flowchart

### Slide 10: Investment Summary for ${selectedProspect.companyName}
Final value reinforcement:
- Investment details for their ${selectedProspect.dealValue} budget
- Expected returns and timeline
- Risk mitigation and guarantees
- Visual: Value summary infographic

## Presentation Notes for ${selectedProspect.companyName}
- Tailor communication style to each stakeholder:
${selectedProspect.stakeholders.map(s => `  • ${s.name} (${s.role}): ${s.style} learner - use appropriate presentation techniques`).join('\n')}
- Emphasize elements most relevant to their ${selectedProspect.nextAction}
- Include specific metrics and data points relevant to their industry
- End each section with clear transitions maintaining flow

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
      setQualityScore(92) // Higher score for personalized content
      
      toast.success(`Presentation prompt generated for ${selectedProspect.companyName}!`)
      
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
      
      // Simple refinement logic with prospect context
      let refinedPrompt = generatedPrompt
      if (prompt.toLowerCase().includes('executive')) {
        refinedPrompt = generatedPrompt.replace(/detailed/g, `high-level strategic for ${selectedProspect.companyName}`)
      } else if (prompt.toLowerCase().includes('technical')) {
        refinedPrompt = generatedPrompt + `\n\n### Additional Technical Slide for ${selectedProspect.companyName}: Integration Architecture\nDetailed technical specifications and API documentation tailored to their existing systems...`
      }
      
      setGeneratedPrompt(refinedPrompt)
      setQualityScore(prev => Math.min(100, prev + 3))
      
      // Add AI response
      const aiMessage = { 
        role: 'assistant', 
        content: `I've refined the presentation prompt for ${selectedProspect.companyName} based on your request. The changes focus on ${prompt.toLowerCase()} while maintaining personalization for their ${selectedProspect.dealValue} opportunity.`, 
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
      let targetIndex
      if (direction === 'up') {
        targetIndex = currentIndex - 1
      } else {
        targetIndex = currentIndex + 1
      }
      
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
    toast.success(`Prompt for ${selectedProspect.companyName} exported to Gamma successfully!`)
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">AI-Powered Presentation Strategist</h1>
        <p className="text-muted-foreground">
          Transform prospect insights into persuasive, context-aware presentation prompts designed to accelerate your sales cycle.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Sidebar - Prospect Selector */}
        <div className="space-y-6">
          <ProspectSelector
            selectedProspect={selectedProspect}
            onProspectSelect={handleProspectSelect}
            compact={true}
            showStakeholders={true}
          />

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
                      <span>Prospect Relevance</span>
                      <Badge variant="default" className="text-xs">Excellent</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Gamma Compatibility</span>
                      <Badge variant="default" className="text-xs">Optimized</Badge>
                    </div>
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
                      Excellent personalization for {selectedProspect.companyName}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

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

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Setup Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>Contextual Setup for {selectedProspect.companyName}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
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
                <label className="text-sm font-medium mb-3 block">
                  Content Library for {selectedProspect.companyName}
                </label>
                <div className="grid md:grid-cols-2 gap-2">
                  {contentLibrary.map((content) => (
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
                disabled={isGenerating || !selectedProspect || !selectedMethodology || !selectedObjective}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Generating Strategic Prompt for {selectedProspect.companyName}...
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
                    <span>Strategic Canvas for {selectedProspect.companyName}</span>
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
                  <span>Co-Pilot Refinement for {selectedProspect.companyName}</span>
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
                    placeholder={`Refine the presentation for ${selectedProspect.companyName}... (e.g., 'Add more competitive analysis' or 'Make it more technical')`}
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
      </div>
    </div>
  )
}