import React, { useState } from 'react'
import { InsightCard } from '@/components/followups/InsightCard'
import { CRMConnectionStatus } from '@/components/followups/CRMConnectionStatus'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Mail, Search, Filter, Plus } from 'lucide-react'
import { toast } from 'sonner'

// Mock email templates
const mockEmailTemplates = [
  {
    id: '1',
    title: 'Discovery Call Follow-up',
    subject: 'Thank you for our conversation today',
    content: `Hi [Client Name],

Thank you for taking the time to speak with me today about [Company]'s [specific need/challenge]. I enjoyed learning more about your current [process/situation] and how we might be able to help.

Key points from our conversation:
• [Key point 1]
• [Key point 2]
• [Key point 3]

Next steps:
1. [Next step 1]
2. [Next step 2]
3. [Next step 3]

I'll follow up with [specific deliverable] by [date]. Please don't hesitate to reach out if you have any questions in the meantime.

Best regards,
[Your Name]`,
    category: 'follow-up',
    lastUsed: '2024-01-15',
    status: 'draft'
  },
  {
    id: '2',
    title: 'Demo Recap & Next Steps',
    subject: 'Demo recap and next steps - [Company Name]',
    content: `Hi [Client Name],

Thank you for attending our product demonstration today. I hope you found it valuable and that it gave you a clear picture of how [Product] can address [specific pain point].

Demo highlights:
• [Feature 1] - [Benefit]
• [Feature 2] - [Benefit]
• [Feature 3] - [Benefit]

Based on our discussion, I believe [specific solution] would be particularly valuable for [Company] because [reason].

Next steps:
1. [Action item 1]
2. [Action item 2]
3. [Action item 3]

I'll send over [deliverable] by [date]. Looking forward to continuing our conversation!

Best regards,
[Your Name]`,
    category: 'demo',
    lastUsed: '2024-01-14',
    status: 'success'
  }
]

export const EmailTemplates = () => {
  const [selectedTemplate, setSelectedTemplate] = useState(mockEmailTemplates[0])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [pushStatuses, setPushStatuses] = useState({})

  const categories = [
    { value: 'all', label: 'All Templates' },
    { value: 'follow-up', label: 'Follow-up' },
    { value: 'demo', label: 'Demo' },
    { value: 'proposal', label: 'Proposal' },
    { value: 'closing', label: 'Closing' }
  ]

  const filteredTemplates = mockEmailTemplates.filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleEditTemplate = (content) => {
    setSelectedTemplate(prev => ({ ...prev, content }))
    toast.success('Template updated')
  }

  const handlePushToHubSpot = async (content) => {
    const templateId = selectedTemplate.id
    setPushStatuses(prev => ({ ...prev, [templateId]: 'pending' }))
    
    try {
      // Simulate API call to HubSpot
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setPushStatuses(prev => ({ ...prev, [templateId]: 'success' }))
      toast.success('Email template saved to HubSpot!')
    } catch (error) {
      setPushStatuses(prev => ({ ...prev, [templateId]: 'error' }))
      toast.error('Failed to save template to HubSpot')
    }
  }

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(selectedTemplate.content)
    toast.success('Email template copied to clipboard')
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Email Templates</h1>
        <p className="text-muted-foreground">
          Create, manage, and customize follow-up email templates for different sales scenarios.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Template Library */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Template Library</CardTitle>
                <Button size="sm" variant="outline">
                  <Plus className="w-4 h-4 mr-1" />
                  New
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Category Filter */}
              <div>
                <Label className="text-sm font-medium">Category</Label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full mt-1 p-2 border border-border rounded-md bg-background"
                >
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Template List */}
              <div className="space-y-2">
                {filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer transition-colors",
                      selectedTemplate.id === template.id 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:bg-accent"
                    )}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">{template.title}</h4>
                        <Badge 
                          variant={template.status === 'success' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {template.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Last used: {template.lastUsed}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        {template.category}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="editor" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="editor">Template Editor</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
            
            <TabsContent value="editor" className="mt-6">
              {/* Template Metadata */}
              <Card className="mb-6">
                <CardContent className="p-4 space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="template-title">Template Title</Label>
                      <Input
                        id="template-title"
                        value={selectedTemplate.title}
                        onChange={(e) => setSelectedTemplate(prev => ({ ...prev, title: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email-subject">Email Subject</Label>
                      <Input
                        id="email-subject"
                        value={selectedTemplate.subject}
                        onChange={(e) => setSelectedTemplate(prev => ({ ...prev, subject: e.target.value }))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Template Content */}
              <InsightCard
                title="Email Content"
                content={selectedTemplate.content}
                type="email_template"
                onEdit={handleEditTemplate}
                onPush={handlePushToHubSpot}
                onCopy={handleCopyTemplate}
                status={pushStatuses[selectedTemplate.id] || selectedTemplate.status}
                showExportButton={false}
              />
            </TabsContent>
            
            <TabsContent value="preview" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Mail className="w-5 h-5" />
                    <span>Email Preview</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="border-b border-border pb-4">
                      <div className="text-sm text-muted-foreground mb-1">Subject:</div>
                      <div className="font-medium">{selectedTemplate.subject}</div>
                    </div>
                    <div className="bg-muted rounded-lg p-4">
                      <pre className="whitespace-pre-wrap text-sm leading-relaxed">
                        {selectedTemplate.content}
                      </pre>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Sidebar */}
      <div className="lg:col-span-1">
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
      </div>
    </div>
  )
}