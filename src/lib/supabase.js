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

// Database helper functions with normalized structure
export const dbHelpers = {
  // File management functions
  async saveUploadedFile(userId, file, content = null) {
    const fileData = {
      user_id: userId,
      filename: file.name,
      file_type: file.type,
      file_size: file.size,
      content_type: file.type,
      file_content: content // For text files
    }

    const { data, error } = await supabase
      .from('uploaded_files')
      .insert(fileData)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async getUploadedFiles(userId, limit = 10) {
    const { data, error } = await supabase
      .from('uploaded_files')
      .select('*')
      .eq('user_id', userId)
      .order('upload_date', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  },

  async getUploadedFile(fileId) {
    const { data, error } = await supabase
      .from('uploaded_files')
      .select('*')
      .eq('id', fileId)
      .single()

    if (error) throw error
    return data
  },

  // Processing session management with normalized references
  async createProcessingSession(userId, fileId) {
    const { data, error } = await supabase
      .from('processing_history')
      .insert({
        user_id: userId,
        file_id: fileId,
        processing_status: 'processing'
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updateProcessingSession(sessionId, updates) {
    const updateData = {
      ...updates,
      processing_completed_at: updates.processing_status === 'completed' ? new Date().toISOString() : undefined
    }

    const { data, error } = await supabase
      .from('processing_history')
      .update(updateData)
      .eq('id', sessionId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Link content IDs to processing session
  async linkContentToSession(sessionId, contentIds) {
    const { data, error } = await supabase
      .from('processing_history')
      .update({
        call_notes_id: contentIds.callNotesId || null,
        // Store content IDs as JSONB for flexible reference
        content_references: {
          call_notes_id: contentIds.callNotesId,
          commitments_ids: contentIds.commitmentsIds || [],
          follow_up_email_id: contentIds.followUpEmailId,
          deck_prompt_id: contentIds.deckPromptId,
          insights_ids: contentIds.insightsIds || []
        }
      })
      .eq('id', sessionId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async getProcessingHistory(userId, limit = 20) {
    const { data, error } = await supabase
      .from('processing_history')
      .select(`
        *,
        uploaded_files (
          filename,
          file_type,
          file_size,
          upload_date,
          content_type,
          file_content
        ),
        call_notes!processing_history_call_notes_id_fkey (
          id,
          ai_summary,
          status,
          edited_summary
        )
      `)
      .eq('user_id', userId)
      .order('processing_started_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  },

  async getProcessingSessionDetails(sessionId) {
    const { data: session, error } = await supabase
      .from('processing_history')
      .select(`
        *,
        uploaded_files (*),
        call_notes!processing_history_call_notes_id_fkey (*)
      `)
      .eq('id', sessionId)
      .single()

    if (error) throw error

    // Get all related content using the content_references
    const contentRefs = session.content_references || {}
    
    // Fetch commitments
    let commitments = []
    if (contentRefs.commitments_ids && contentRefs.commitments_ids.length > 0) {
      const { data: commitmentsData } = await supabase
        .from('call_commitments')
        .select('*')
        .in('id', contentRefs.commitments_ids)
        .order('created_at', { ascending: true })
      commitments = commitmentsData || []
    }

    // Fetch follow-up email
    let followUpEmail = null
    if (contentRefs.follow_up_email_id) {
      const { data: emailData } = await supabase
        .from('follow_up_emails')
        .select('*')
        .eq('id', contentRefs.follow_up_email_id)
        .single()
      followUpEmail = emailData
    }

    // Fetch deck prompt
    let deckPrompt = null
    if (contentRefs.deck_prompt_id) {
      const { data: deckData } = await supabase
        .from('deck_prompts')
        .select('*')
        .eq('id', contentRefs.deck_prompt_id)
        .single()
      deckPrompt = deckData
    }

    // Fetch insights
    let insights = []
    if (contentRefs.insights_ids && contentRefs.insights_ids.length > 0) {
      const { data: insightsData } = await supabase
        .from('call_insights')
        .select('*')
        .in('id', contentRefs.insights_ids)
        .order('relevance_score', { ascending: false })
      insights = insightsData || []
    }

    // Return session with all related content
    return {
      ...session,
      call_commitments: commitments,
      follow_up_emails: followUpEmail ? [followUpEmail] : [],
      deck_prompts: deckPrompt ? [deckPrompt] : [],
      call_insights: insights
    }
  },

  // Content creation functions that return IDs for linking
  async createCallNote(userId, callId, transcriptContent, fileId = null, processingSessionId = null) {
    const { data, error } = await supabase
      .from('call_notes')
      .insert({
        user_id: userId,
        call_id: callId,
        transcript_content: transcriptContent,
        status: 'processing',
        file_id: fileId,
        processing_session_id: processingSessionId
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

  async createCommitments(callNotesId, userId, commitments, processingSessionId = null) {
    const commitmentRecords = commitments.map((commitment, index) => ({
      call_notes_id: callNotesId,
      user_id: userId,
      commitment_text: typeof commitment === 'string' ? commitment : commitment.task,
      is_selected: true,
      processing_session_id: processingSessionId,
      // Add owner and deadline if available
      ...(typeof commitment === 'object' && {
        owner: commitment.owner,
        deadline: commitment.deadline
      })
    }))

    const { data, error } = await supabase
      .from('call_commitments')
      .insert(commitmentRecords)
      .select()

    if (error) throw error
    return data
  },

  async updateCommitment(id, updates) {
    const { data, error } = await supabase
      .from('call_commitments')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async createFollowUpEmail(callNotesId, userId, emailContent, processingSessionId = null) {
    const { data, error } = await supabase
      .from('follow_up_emails')
      .insert({
        call_notes_id: callNotesId,
        user_id: userId,
        email_content: emailContent,
        processing_session_id: processingSessionId
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updateFollowUpEmail(id, updates) {
    const { data, error } = await supabase
      .from('follow_up_emails')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async createDeckPrompt(callNotesId, userId, promptContent, processingSessionId = null) {
    const { data, error } = await supabase
      .from('deck_prompts')
      .insert({
        call_notes_id: callNotesId,
        user_id: userId,
        prompt_content: promptContent,
        processing_session_id: processingSessionId
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updateDeckPrompt(id, updates) {
    const { data, error } = await supabase
      .from('deck_prompts')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async saveCallInsights(callNotesId, userId, insights, processingSessionId = null) {
    const insightRecords = insights.map(insight => ({
      call_notes_id: callNotesId,
      user_id: userId,
      insight_type: insight.type,
      content: insight.content,
      relevance_score: insight.relevance_score,
      is_selected: insight.is_selected,
      source: insight.source,
      timestamp: insight.timestamp,
      processing_session_id: processingSessionId
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

  // Comprehensive content creation with automatic linking
  async createCompleteCallAnalysis(userId, fileId, processingSessionId, analysisData) {
    const contentIds = {}

    try {
      // Create call note
      const callNote = await this.createCallNote(
        userId,
        `call-${Date.now()}`,
        analysisData.transcript || '',
        fileId,
        processingSessionId
      )
      contentIds.callNotesId = callNote.id

      // Update call note with summary
      if (analysisData.call_summary) {
        await this.updateCallNote(callNote.id, {
          ai_summary: analysisData.call_summary,
          status: 'completed'
        })
      }

      // Create commitments/action items
      if (analysisData.action_items && analysisData.action_items.length > 0) {
        const commitments = await this.createCommitments(
          callNote.id,
          userId,
          analysisData.action_items,
          processingSessionId
        )
        contentIds.commitmentsIds = commitments.map(c => c.id)
      }

      // Create follow-up email
      if (analysisData.follow_up_email) {
        const email = await this.createFollowUpEmail(
          callNote.id,
          userId,
          analysisData.follow_up_email,
          processingSessionId
        )
        contentIds.followUpEmailId = email.id
      }

      // Create deck prompt
      if (analysisData.deck_prompt) {
        const deck = await this.createDeckPrompt(
          callNote.id,
          userId,
          analysisData.deck_prompt,
          processingSessionId
        )
        contentIds.deckPromptId = deck.id
      }

      // Create insights
      if (analysisData.insights && analysisData.insights.length > 0) {
        const insights = await this.saveCallInsights(
          callNote.id,
          userId,
          analysisData.insights,
          processingSessionId
        )
        contentIds.insightsIds = insights.map(i => i.id)
      }

      // Link all content to processing session
      await this.linkContentToSession(processingSessionId, contentIds)

      return contentIds
    } catch (error) {
      console.error('Error creating complete call analysis:', error)
      throw error
    }
  },

  // Update any content and automatically sync across all references
  async updateContentById(contentType, contentId, updates) {
    let table
    switch (contentType) {
      case 'call_summary':
        table = 'call_notes'
        break
      case 'commitment':
        table = 'call_commitments'
        break
      case 'follow_up_email':
        table = 'follow_up_emails'
        break
      case 'deck_prompt':
        table = 'deck_prompts'
        break
      case 'insight':
        table = 'call_insights'
        break
      default:
        throw new Error(`Unknown content type: ${contentType}`)
    }

    const { data, error } = await supabase
      .from(table)
      .update(updates)
      .eq('id', contentId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Get all processing sessions that reference a specific content item
  async getSessionsReferencingContent(contentType, contentId) {
    const { data, error } = await supabase
      .from('processing_history')
      .select('*')
      .contains('content_references', { [`${contentType}_id`]: contentId })

    if (error) throw error
    return data || []
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