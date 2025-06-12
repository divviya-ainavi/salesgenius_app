import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Predefined user IDs for development/testing (simulating hierarchy)
export const DEMO_USERS = {
  SUPER_ADMIN: '00000000-0000-0000-0000-000000000001',
  ORG_ADMIN: '00000000-0000-0000-0000-000000000002', 
  SALES_MANAGER: '00000000-0000-0000-0000-000000000003' // Current logged-in user
}

// Current user context (Sales Manager for all operations)
export const CURRENT_USER = {
  id: DEMO_USERS.SALES_MANAGER,
  email: 'sales.manager@company.com',
  role: 'sales_manager',
  name: 'Sarah Johnson',
  organization_id: 'demo-org-001'
}

// API placeholder functions for AI agents
export const aiAgents = {
  // Research Agent API placeholder
  async callResearchAgent(data) {
    console.log('Calling Research Agent with:', data)
    // TODO: Replace with actual API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: {
            research_summary: 'Research insights will be generated here',
            key_findings: ['Finding 1', 'Finding 2', 'Finding 3']
          }
        })
      }, 1000)
    })
  },

  // Follow Up Agent API placeholder
  async callFollowUpAgent(transcriptData) {
    console.log('Calling Follow Up Agent with:', transcriptData)
    // TODO: Replace with actual API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: {
            call_summary: `AI-generated summary of the call based on transcript analysis...`,
            commitments: [
              'Send product demo video by end of week',
              'Schedule technical deep-dive with engineering team',
              'Prepare customized proposal with pricing',
              'Follow up on integration requirements'
            ],
            follow_up_email: `Hi [Client Name],

Thank you for taking the time to speak with me today. I wanted to follow up on our conversation and summarize the key points we discussed:

• Current challenges with lead qualification
• Interest in automated scoring features
• Timeline for Q2 implementation
• Budget considerations and ROI expectations

Next steps:
1. I'll send the demo video we discussed
2. Schedule technical review with your team
3. Prepare customized proposal

Best regards,
[Your Name]`,
            deck_prompt: `Create a sales presentation focusing on:

1. Problem Statement:
   - Current lead qualification challenges
   - Manual process inefficiencies
   - Time and resource constraints

2. Solution Overview:
   - Automated lead scoring
   - Real-time analytics
   - CRM integration capabilities

3. Value Proposition:
   - 70% reduction in manual work
   - 6-month ROI timeline
   - Improved conversion rates

4. Implementation Plan:
   - Phase 1: Setup and integration
   - Phase 2: Training and optimization
   - Phase 3: Full deployment

5. Next Steps:
   - Technical requirements review
   - Pilot program proposal
   - Timeline and pricing discussion`
          }
        })
      }, 2000)
    })
  }
}

// Database helper functions
export const dbHelpers = {
  async createCallNote(userId, callId, transcriptContent) {
    const { data, error } = await supabase
      .from('call_notes')
      .insert({
        user_id: userId,
        call_id: callId,
        transcript_content: transcriptContent,
        status: 'processing'
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updateCallNote(id, updates) {
    const { data, error } = await supabase
      .from('call_notes')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async createCommitments(callNotesId, userId, commitments) {
    const commitmentRecords = commitments.map(text => ({
      call_notes_id: callNotesId,
      user_id: userId,
      commitment_text: text,
      is_selected: true
    }))

    const { data, error } = await supabase
      .from('call_commitments')
      .insert(commitmentRecords)
      .select()

    if (error) throw error
    return data
  },

  async createFollowUpEmail(callNotesId, userId, emailContent) {
    const { data, error } = await supabase
      .from('follow_up_emails')
      .insert({
        call_notes_id: callNotesId,
        user_id: userId,
        email_content: emailContent
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async createDeckPrompt(callNotesId, userId, promptContent) {
    const { data, error } = await supabase
      .from('deck_prompts')
      .insert({
        call_notes_id: callNotesId,
        user_id: userId,
        prompt_content: promptContent
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async saveCallInsights(callNotesId, userId, insights) {
    const insightRecords = insights.map(insight => ({
      call_notes_id: callNotesId,
      user_id: userId,
      insight_type: insight.type,
      content: insight.content,
      relevance_score: insight.relevance_score,
      is_selected: insight.is_selected,
      source: insight.source,
      timestamp: insight.timestamp
    }))

    const { data, error } = await supabase
      .from('call_insights')
      .insert(insightRecords)
      .select()

    if (error) throw error
    return data
  },

  async updateCallInsight(id, updates) {
    const { data, error } = await supabase
      .from('call_insights')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async getCallInsights(callNotesId, userId) {
    const { data, error } = await supabase
      .from('call_insights')
      .select('*')
      .eq('call_notes_id', callNotesId)
      .eq('user_id', userId)
      .order('relevance_score', { ascending: false })

    if (error) throw error
    return data
  },

  async logPushAction(userId, contentType, contentId, status, errorMessage = null, hubspotId = null) {
    const { data, error } = await supabase
      .from('push_log')
      .insert({
        user_id: userId,
        content_type: contentType,
        content_id: contentId,
        push_status: status,
        error_message: errorMessage,
        hubspot_id: hubspotId
      })
      .select()
      .single()

    if (error) throw error
    return data
  }
}