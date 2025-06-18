import { createClient } from '@supabase/supabase-js'
import { fileStorage } from './fileStorage'
import { analytics } from './analytics'
import api from './api'
import aiService from '@/services/aiService'
import fileService from '@/services/fileService'
import crmService from '@/services/crmService'
import userManagementService from '@/services/userManagementService'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Updated user IDs and roles based on new schema
export const DEMO_USERS = {
  SUPER_ADMIN: '00000000-0000-0000-0000-000000000001',
  ORG_ADMIN: '00000000-0000-0000-0000-000000000002',
  SALES_MANAGER: '00000000-0000-0000-0000-000000000003' // Current logged-in user
}

export const DEMO_ROLES = {
  SUPER_ADMIN: '00000000-0000-0000-0000-000000000001',
  ORG_ADMIN: '00000000-0000-0000-0000-000000000002',
  SALES_MANAGER: '00000000-0000-0000-0000-000000000003',
  SALES_REP: '00000000-0000-0000-0000-000000000004',
  USER: '00000000-0000-0000-0000-000000000005'
}

export const DEMO_ORGANIZATION = 'demo-org-001'

// Current user context (Sales Manager for all operations)
export const CURRENT_USER = {
  id: DEMO_USERS.SALES_MANAGER,
  email: 'sales.manager@company.com',
  full_name: 'Sarah Johnson',
  role_id: DEMO_ROLES.SALES_MANAGER,
  role_key: 'sales_manager',
  organization_id: DEMO_ORGANIZATION,
  status: 'active',
  timezone: 'America/New_York',
  language: 'en'
}

// User management helper functions using the new service
export const userHelpers = {
  // Get user profile with role and organization info
  async getUserProfile(userId) {
    try {
      const profile = await userManagementService.getProfileById(userId);

      // Enhance with role and organization data
      if (profile.role_id) {
        profile.role = await userManagementService.getRoleById(profile.role_id);
      }

      if (profile.organization_id) {
        profile.organization = await userManagementService.getOrganizationById(profile.organization_id);
      }

      return profile;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  },

  // Get users in organization
  async getOrganizationUsers(organizationId, limit = 50) {
    try {
      const users = await userManagementService.getUsersByOrganization(organizationId, { limit });
      return users || [];
    } catch (error) {
      console.error('Error fetching organization users:', error);
      throw error;
    }
  },

  // Check if user has specific role
  async userHasRole(userId, roleKey) {
    try {
      const profile = await userManagementService.getProfileById(userId);
      if (!profile.role_id) return false;

      const role = await userManagementService.getRoleById(profile.role_id);
      return role?.key === roleKey;
    } catch (error) {
      console.error('Error checking user role:', error);
      return false;
    }
  },

  // Get user's role
  async getUserRole(userId) {
    try {
      const profile = await userManagementService.getProfileById(userId);
      if (!profile.role_id) return 'user';

      const role = await userManagementService.getRoleById(profile.role_id);
      return role?.key || 'user';
    } catch (error) {
      console.error('Error getting user role:', error);
      return 'user';
    }
  },

  // Get user's organization
  async getUserOrganization(userId) {
    try {
      const profile = await userManagementService.getProfileById(userId);
      return profile.organization_id || null;
    } catch (error) {
      console.error('Error getting user organization:', error);
      return null;
    }
  },

  // Update user profile
  async updateUserProfile(userId, updates) {
    try {
      const updatedProfile = await userManagementService.updateProfile(userId, updates);
      return updatedProfile;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  },

  // Get all roles
  async getRoles() {
    try {
      const roles = await userManagementService.getRoles({ is_assignable: true });
      return roles || [];
    } catch (error) {
      console.error('Error fetching roles:', error);
      throw error;
    }
  },

  // Get organization info
  async getOrganization(organizationId) {
    try {
      const organization = await userManagementService.getOrganizationById(organizationId);
      return organization;
    } catch (error) {
      console.error('Error fetching organization:', error);
      throw error;
    }
  },

  // Create invitation
  async createInvitation(email, organizationId, roleId, createdBy) {
    try {
      const invitation = await userManagementService.sendInvite({
        email,
        organizationId,
        roleId,
        invitedBy: createdBy
      });
      return invitation;
    } catch (error) {
      console.error('Error creating invitation:', error);
      throw error;
    }
  },

  // Get pending invitations
  async getPendingInvitations(organizationId) {
    try {
      const invitations = await userManagementService.getInvites({
        organizationId,
        status: 'pending'
      });
      return invitations || [];
    } catch (error) {
      console.error('Error fetching pending invitations:', error);
      throw error;
    }
  }
}

// API placeholder functions for AI agents - now using centralized API service
export const aiAgents = {
  // Research Agent API
  async callResearchAgent(data) {
    try {
      // Use centralized AI service
      return await aiService.callResearchAgent(data);
    } catch (error) {
      console.error('Research Agent Error:', error);

      // Fallback to mock data for development
      return {
        success: true,
        data: {
          research_summary: 'Research insights will be generated here',
          key_findings: ['Finding 1', 'Finding 2', 'Finding 3']
        }
      };
    }
  },

  // Follow Up Agent API
  async callFollowUpAgent(transcriptData) {
    try {
      // Use centralized AI service
      return await aiService.callFollowUpAgent(transcriptData);
    } catch (error) {
      console.error('Follow Up Agent Error:', error);

      // Fallback to mock data for development
      return {
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
      };
    }
  }
}

// Database helper functions with centralized API integration
export const dbHelpers = {
  // File management functions using centralized file service
  async saveUploadedFile(userId, file, content = null) {
    try {
      // Use centralized file service
      return await fileService.uploadFile(file, {
        userId,
        metadata: {
          content_type: file.type,
          file_content: content,
        }
      });
    } catch (error) {
      console.error('Error saving uploaded file:', error);

      // Fallback to direct Supabase for development
      const startTime = Date.now()

      try {
        analytics.trackFileUpload(file.name, file.size, file.type, 'started')

        const uploadResult = await fileStorage.uploadFile(file, userId)

        const fileData = {
          user_id: userId,
          filename: uploadResult.fileName,
          file_type: uploadResult.contentType,
          file_size: uploadResult.fileSize,
          content_type: uploadResult.contentType,
          file_content: content,
          file_url: uploadResult.publicUrl,
          storage_path: uploadResult.filePath
        }

        const { data, error } = await supabase
          .from('uploaded_files')
          .insert(fileData)
          .select()
          .single()

        if (error) throw error

        analytics.trackFileUpload(file.name, file.size, file.type, 'completed')
        analytics.trackApiResponse('/api/upload-file', 'POST', 200, Date.now() - startTime)

        return data
      } catch (fallbackError) {
        analytics.trackFileUpload(file.name, file.size, file.type, 'failed')
        analytics.trackApiResponse('/api/upload-file', 'POST', 500, Date.now() - startTime, fallbackError.message)
        throw fallbackError
      }
    }
  },

  async getUploadedFiles(userId, limit = 10) {
    const startTime = Date.now()

    try {
      const { data, error } = await supabase
        .from('uploaded_files')
        .select('*')
        .eq('user_id', userId)
        .order('upload_date', { ascending: false })
        .limit(limit)

      if (error) throw error

      analytics.trackApiResponse('/api/get-files', 'GET', 200, Date.now() - startTime)
      return data || []
    } catch (error) {
      analytics.trackApiResponse('/api/get-files', 'GET', 500, Date.now() - startTime, error.message)
      throw error
    }
  },

  async getUploadedFile(fileId) {
    const startTime = Date.now()

    try {
      const { data, error } = await supabase
        .from('uploaded_files')
        .select('*')
        .eq('id', fileId)
        .single()

      if (error) throw error

      analytics.trackApiResponse('/api/get-file', 'GET', 200, Date.now() - startTime)
      return data
    } catch (error) {
      analytics.trackApiResponse('/api/get-file', 'GET', 500, Date.now() - startTime, error.message)
      throw error
    }
  },

  // Get file content from shareable URL
  async getFileContent(fileId) {
    try {
      const fileData = await this.getUploadedFile(fileId)

      if (fileData.file_content) {
        return fileData.file_content
      }

      if (fileData.file_url) {
        const content = await fileStorage.downloadFileContent(fileData.file_url)

        if (content) {
          await supabase
            .from('uploaded_files')
            .update({ file_content: content })
            .eq('id', fileId)
        }

        return content
      }

      throw new Error('No file content or URL available')
    } catch (error) {
      console.error('Error getting file content:', error)
      throw error
    }
  },

  // Open file using shareable link
  async openFile(fileId) {
    try {
      const fileData = await this.getUploadedFile(fileId)

      if (fileData.file_url) {
        analytics.track('file_accessed', {
          file_id: fileId,
          file_name: fileData.filename,
          file_type: fileData.file_type,
          access_method: 'shareable_link'
        })

        window.open(fileData.file_url, '_blank', 'noopener,noreferrer')
        return true
      }

      throw new Error('No shareable URL available for this file')
    } catch (error) {
      console.error('Error opening file:', error)
      throw error
    }
  },

  // Update uploaded file metadata/content
  async updateUploadedFile(fileId, updates) {
    const startTime = Date.now()

    try {
      const { data, error } = await supabase
        .from('uploaded_files')
        .update(updates)
        .eq('id', fileId)
        .select()
        .single()

      if (error) throw error

      analytics.track('uploaded_file_updated', {
        file_id: fileId,
        updated_fields: Object.keys(updates)
      })
      analytics.trackApiResponse('/api/update-uploaded-file', 'PUT', 200, Date.now() - startTime)

      return data
    } catch (error) {
      analytics.trackApiResponse('/api/update-uploaded-file', 'PUT', 500, Date.now() - startTime, error.message)
      throw error
    }
  },

  // Delete file and clean up storage
  async deleteUploadedFile(fileId) {
    const startTime = Date.now()

    try {
      const fileData = await this.getUploadedFile(fileId)

      if (fileData.storage_path) {
        await fileStorage.deleteFile(fileData.storage_path)
      }

      const { error } = await supabase
        .from('uploaded_files')
        .delete()
        .eq('id', fileId)

      if (error) throw error

      analytics.track('file_deleted', {
        file_id: fileId,
        file_name: fileData.filename,
        file_type: fileData.file_type
      })
      analytics.trackApiResponse('/api/delete-file', 'DELETE', 200, Date.now() - startTime)

      return true
    } catch (error) {
      analytics.trackApiResponse('/api/delete-file', 'DELETE', 500, Date.now() - startTime, error.message)
      console.error('Error deleting file:', error)
      throw error
    }
  },

  // Processing session management with normalized references
  async createProcessingSession(userId, fileId) {
    const startTime = Date.now()

    try {
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

      analytics.track('processing_session_created', {
        session_id: data.id,
        user_id: userId,
        file_id: fileId
      })
      analytics.trackApiResponse('/api/create-session', 'POST', 200, Date.now() - startTime)

      return data
    } catch (error) {
      analytics.trackApiResponse('/api/create-session', 'POST', 500, Date.now() - startTime, error.message)
      throw error
    }
  },

  async updateProcessingSession(sessionId, updates) {
    const startTime = Date.now()

    try {
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

      analytics.track('processing_session_updated', {
        session_id: sessionId,
        status: updates.processing_status,
        success: updates.processing_status === 'completed'
      })
      analytics.trackApiResponse('/api/update-session', 'PUT', 200, Date.now() - startTime)

      return data
    } catch (error) {
      analytics.trackApiResponse('/api/update-session', 'PUT', 500, Date.now() - startTime, error.message)
      throw error
    }
  },

  // Link content IDs to processing session
  async linkContentToSession(sessionId, contentIds) {
    const startTime = Date.now()

    try {
      const { data, error } = await supabase
        .from('processing_history')
        .update({
          call_notes_id: contentIds.callNotesId || null,
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

      analytics.track('content_linked_to_session', {
        session_id: sessionId,
        content_types: Object.keys(contentIds).filter(key => contentIds[key])
      })
      analytics.trackApiResponse('/api/link-content', 'PUT', 200, Date.now() - startTime)

      return data
    } catch (error) {
      analytics.trackApiResponse('/api/link-content', 'PUT', 500, Date.now() - startTime, error.message)
      throw error
    }
  },

  async getProcessingHistory(userId, limit = 20) {
    const startTime = Date.now()

    try {
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
            file_content,
            file_url,
            storage_path
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

      analytics.trackApiResponse('/api/get-processing-history', 'GET', 200, Date.now() - startTime)
      return data || []
    } catch (error) {
      analytics.trackApiResponse('/api/get-processing-history', 'GET', 500, Date.now() - startTime, error.message)
      throw error
    }
  },

  async getProcessingSessionDetails(sessionId) {
    const startTime = Date.now()

    try {
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

      const contentRefs = session.content_references || {}

      let commitments = []
      if (contentRefs.commitments_ids && contentRefs.commitments_ids.length > 0) {
        const { data: commitmentsData } = await supabase
          .from('call_commitments')
          .select('*')
          .in('id', contentRefs.commitments_ids)
          .order('created_at', { ascending: true })
        commitments = commitmentsData || []
      }

      let followUpEmail = null
      if (contentRefs.follow_up_email_id) {
        const { data: emailData } = await supabase
          .from('follow_up_emails')
          .select('*')
          .eq('id', contentRefs.follow_up_email_id)
          .single()
        followUpEmail = emailData
      }

      let deckPrompt = null
      if (contentRefs.deck_prompt_id) {
        const { data: deckData } = await supabase
          .from('deck_prompts')
          .select('*')
          .eq('id', contentRefs.deck_prompt_id)
          .single()
        deckPrompt = deckData
      }

      let insights = []
      if (contentRefs.insights_ids && contentRefs.insights_ids.length > 0) {
        const { data: insightsData } = await supabase
          .from('call_insights')
          .select('*')
          .in('id', contentRefs.insights_ids)
          .order('relevance_score', { ascending: false })
        insights = insightsData || []
      }

      analytics.trackApiResponse('/api/get-session-details', 'GET', 200, Date.now() - startTime)

      return {
        ...session,
        call_commitments: commitments,
        follow_up_emails: followUpEmail ? [followUpEmail] : [],
        deck_prompts: deckPrompt ? [deckPrompt] : [],
        call_insights: insights
      }
    } catch (error) {
      analytics.trackApiResponse('/api/get-session-details', 'GET', 500, Date.now() - startTime, error.message)
      throw error
    }
  },

  // Content creation functions that return IDs for linking
  async createCallNote(userId, callId, transcriptContent, fileId = null, processingSessionId = null) {
    const startTime = Date.now()

    try {
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

      analytics.track('call_note_created', {
        call_note_id: data.id,
        user_id: userId,
        has_transcript: !!transcriptContent,
        processing_session_id: processingSessionId
      })
      analytics.trackApiResponse('/api/create-call-note', 'POST', 200, Date.now() - startTime)

      return data
    } catch (error) {
      analytics.trackApiResponse('/api/create-call-note', 'POST', 500, Date.now() - startTime, error.message)
      throw error
    }
  },

  async getCallNote(id) {
    const startTime = Date.now()

    try {
      const { data, error } = await supabase
        .from('call_notes')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      analytics.trackApiResponse('/api/get-call-note', 'GET', 200, Date.now() - startTime)
      return data
    } catch (error) {
      analytics.trackApiResponse('/api/get-call-note', 'GET', 500, Date.now() - startTime, error.message)
      throw error
    }
  },

  async updateCallNote(id, updates) {
    const startTime = Date.now()

    try {
      const { data, error } = await supabase
        .from('call_notes')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      analytics.track('call_note_updated', {
        call_note_id: id,
        updated_fields: Object.keys(updates)
      })
      analytics.trackApiResponse('/api/update-call-note', 'PUT', 200, Date.now() - startTime)

      return data
    } catch (error) {
      analytics.trackApiResponse('/api/update-call-note', 'PUT', 500, Date.now() - startTime, error.message)
      throw error
    }
  },

  async createCommitments(callNotesId, userId, commitments, processingSessionId = null) {
    const startTime = Date.now()

    try {
      const commitmentRecords = commitments.map((commitment, index) => ({
        call_notes_id: callNotesId,
        user_id: userId,
        commitment_text: typeof commitment === 'string' ? commitment : commitment.task,
        is_selected: true,
        processing_session_id: processingSessionId,
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

      analytics.track('commitments_created', {
        call_notes_id: callNotesId,
        user_id: userId,
        commitments_count: commitments.length,
        processing_session_id: processingSessionId
      })
      analytics.trackApiResponse('/api/create-commitments', 'POST', 200, Date.now() - startTime)

      return data
    } catch (error) {
      analytics.trackApiResponse('/api/create-commitments', 'POST', 500, Date.now() - startTime, error.message)
      throw error
    }
  },

  async updateCommitment(id, updates) {
    const startTime = Date.now()

    try {
      const { data, error } = await supabase
        .from('call_commitments')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      analytics.track('commitment_updated', {
        commitment_id: id,
        updated_fields: Object.keys(updates)
      })
      analytics.trackApiResponse('/api/update-commitment', 'PUT', 200, Date.now() - startTime)

      return data
    } catch (error) {
      analytics.trackApiResponse('/api/update-commitment', 'PUT', 500, Date.now() - startTime, error.message)
      throw error
    }
  },

  async createFollowUpEmail(callNotesId, userId, emailContent, processingSessionId = null) {
    const startTime = Date.now()

    try {
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

      analytics.track('follow_up_email_created', {
        email_id: data.id,
        call_notes_id: callNotesId,
        user_id: userId,
        processing_session_id: processingSessionId
      })
      analytics.trackApiResponse('/api/create-email', 'POST', 200, Date.now() - startTime)

      return data
    } catch (error) {
      analytics.trackApiResponse('/api/create-email', 'POST', 500, Date.now() - startTime, error.message)
      throw error
    }
  },

  async updateFollowUpEmail(id, updates) {
    const startTime = Date.now()

    try {
      const { data, error } = await supabase
        .from('follow_up_emails')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      analytics.track('follow_up_email_updated', {
        email_id: id,
        updated_fields: Object.keys(updates)
      })
      analytics.trackApiResponse('/api/update-email', 'PUT', 200, Date.now() - startTime)

      return data
    } catch (error) {
      analytics.trackApiResponse('/api/update-email', 'PUT', 500, Date.now() - startTime, error.message)
      throw error
    }
  },

  async createDeckPrompt(callNotesId, userId, promptContent, processingSessionId = null) {
    const startTime = Date.now()

    try {
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

      analytics.track('deck_prompt_created', {
        deck_prompt_id: data.id,
        call_notes_id: callNotesId,
        user_id: userId,
        processing_session_id: processingSessionId
      })
      analytics.trackApiResponse('/api/create-deck-prompt', 'POST', 200, Date.now() - startTime)

      return data
    } catch (error) {
      analytics.trackApiResponse('/api/create-deck-prompt', 'POST', 500, Date.now() - startTime, error.message)
      throw error
    }
  },

  async updateDeckPrompt(id, updates) {
    const startTime = Date.now()

    try {
      const { data, error } = await supabase
        .from('deck_prompts')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      analytics.track('deck_prompt_updated', {
        deck_prompt_id: id,
        updated_fields: Object.keys(updates)
      })
      analytics.trackApiResponse('/api/update-deck-prompt', 'PUT', 200, Date.now() - startTime)

      return data
    } catch (error) {
      analytics.trackApiResponse('/api/update-deck-prompt', 'PUT', 500, Date.now() - startTime, error.message)
      throw error
    }
  },

  async saveCallInsights(callNotesId, userId, insights, processingSessionId = null) {
    const startTime = Date.now()

    try {
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

      analytics.track('call_insights_created', {
        call_notes_id: callNotesId,
        user_id: userId,
        insights_count: insights.length,
        processing_session_id: processingSessionId
      })
      analytics.trackApiResponse('/api/save-insights', 'POST', 200, Date.now() - startTime)

      return data
    } catch (error) {
      analytics.trackApiResponse('/api/save-insights', 'POST', 500, Date.now() - startTime, error.message)
      throw error
    }
  },

  async updateCallInsight(id, updates) {
    const startTime = Date.now()

    try {
      const { data, error } = await supabase
        .from('call_insights')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      analytics.track('call_insight_updated', {
        insight_id: id,
        updated_fields: Object.keys(updates)
      })
      analytics.trackApiResponse('/api/update-insight', 'PUT', 200, Date.now() - startTime)

      return data
    } catch (error) {
      analytics.trackApiResponse('/api/update-insight', 'PUT', 500, Date.now() - startTime, error.message)
      throw error
    }
  },

  async getCallInsights(callNotesId, userId) {
    const startTime = Date.now()

    try {
      const { data, error } = await supabase
        .from('call_insights')
        .select('*')
        .eq('call_notes_id', callNotesId)
        .eq('user_id', userId)
        .order('relevance_score', { ascending: false })

      if (error) throw error

      analytics.trackApiResponse('/api/get-insights', 'GET', 200, Date.now() - startTime)
      return data
    } catch (error) {
      analytics.trackApiResponse('/api/get-insights', 'GET', 500, Date.now() - startTime, error.message)
      throw error
    }
  },

  // Comprehensive content creation with automatic linking
  async createCompleteCallAnalysis(userId, fileId, processingSessionId, analysisData) {
    const contentIds = {}

    try {
      analytics.track('complete_call_analysis_started', {
        user_id: userId,
        file_id: fileId,
        processing_session_id: processingSessionId
      })

      const callNote = await this.createCallNote(
        userId,
        `call-${Date.now()}`,
        analysisData.transcript || '',
        fileId,
        processingSessionId
      )
      contentIds.callNotesId = callNote.id

      if (analysisData.call_summary) {
        await this.updateCallNote(callNote.id, {
          ai_summary: analysisData.call_summary,
          status: 'completed'
        })
      }

      if (analysisData.action_items?.length) {
        const commitments = await this.createCommitments(
          callNote.id, userId, analysisData.action_items, processingSessionId
        )
        contentIds.commitmentsIds = commitments.map(c => c.id)
      }

      if (analysisData.follow_up_email) {
        const email = await this.createFollowUpEmail(
          callNote.id, userId, analysisData.follow_up_email, processingSessionId
        )
        contentIds.followUpEmailId = email.id
      }

      if (analysisData.deck_prompt) {
        const deck = await this.createDeckPrompt(
          callNote.id, userId, analysisData.deck_prompt, processingSessionId
        )
        contentIds.deckPromptId = deck.id
      }

      if (analysisData.sales_insights?.length) {
        const insights = await this.saveCallInsights(
          callNote.id, userId, analysisData.sales_insights, processingSessionId
        )
        contentIds.insightsIds = insights.map(i => i.id)
      }

      await this.linkContentToSession(processingSessionId, contentIds)

      // ✅ Store full structured response in call_insights
      await supabase.from('call_insights').insert([{
        call_notes_id: callNote.id,
        company_details: analysisData.company_details,
        prospect_details: analysisData.prospect_details,
        call_summary: analysisData.call_summary,
        action_items: analysisData.action_items,
        sales_insights: analysisData.sales_insights,
        communication_styles: analysisData.communication_styles,
        call_analysis_overview: analysisData.call_analysis_overview,
        processing_status: analysisData.processing_status,
        error_message: analysisData.error_message,
        extracted_transcript: analysisData.extracted_transcript,
        processing_session_id: processingSessionId
      }]).select().single();

      analytics.track('complete_call_analysis_completed', {
        user_id: userId,
        file_id: fileId,
        processing_session_id: processingSessionId,
        content_types_created: Object.keys(contentIds).filter(key => contentIds[key])
      })

      return contentIds
    } catch (error) {
      analytics.track('complete_call_analysis_failed', {
        user_id: userId,
        file_id: fileId,
        processing_session_id: processingSessionId,
        error: error.message
      })

      console.error('Error creating complete call analysis:', error)
      throw error
    }
  },

  // NEW: Store API Response Data in Database Tables
  async storeApiResponseData(userId, fileId, processingSessionId, apiResponse) {
    const startTime = Date.now()
    const contentIds = {}

    try {
      analytics.track('api_response_storage_started', {
        user_id: userId,
        file_id: fileId,
        processing_session_id: processingSessionId,
        response_keys: Object.keys(apiResponse)
      })

      // 1. Create Call Note with AI Summary
      let callNote = null
      if (apiResponse.call_summary || apiResponse.call_analysis_overview) {
        const callId = `processed-${Date.now()}`
        const transcriptContent = apiResponse.transcript || 'Processed from uploaded file'

        callNote = await this.createCallNote(
          userId,
          callId,
          transcriptContent,
          fileId,
          processingSessionId
        )
        contentIds.callNotesId = callNote.id

        // Update with AI summary
        if (apiResponse.call_summary) {
          await this.updateCallNote(callNote.id, {
            ai_summary: apiResponse.call_summary,
            status: 'completed'
          })
        }
      }

      // 2. Store Action Items/Commitments
      if (apiResponse.action_items && apiResponse.action_items.length > 0 && callNote) {
        const commitments = await this.createCommitments(
          callNote.id,
          userId,
          apiResponse.action_items.map(item => ({
            task: item.task,
            owner: item.owner,
            deadline: item.deadline,
            priority: item.priority || 'medium'
          })),
          processingSessionId
        )
        contentIds.commitmentsIds = commitments.map(c => c.id)
      }

      // 3. Store Follow-up Email
      if (apiResponse.follow_up_email && callNote) {
        const email = await this.createFollowUpEmail(
          callNote.id,
          userId,
          apiResponse.follow_up_email,
          processingSessionId
        )
        contentIds.followUpEmailId = email.id
      }

      // 4. Store Deck Prompt
      if (apiResponse.deck_prompt && callNote) {
        const deck = await this.createDeckPrompt(
          callNote.id,
          userId,
          apiResponse.deck_prompt,
          processingSessionId
        )
        contentIds.deckPromptId = deck.id
      }

      // 5. Store Sales Insights
      if (apiResponse.sales_insights && apiResponse.sales_insights.length > 0 && callNote) {
        const insights = await this.saveCallInsights(
          callNote.id,
          userId,
          apiResponse.sales_insights.map(insight => ({
            type: insight.type,
            content: insight.content,
            relevance_score: insight.relevance_score || 50,
            is_selected: insight.is_selected !== false,
            source: insight.source || 'AI Analysis',
            timestamp: insight.timestamp || new Date().toISOString()
          })),
          processingSessionId
        )
        contentIds.insightsIds = insights.map(i => i.id)
      }

      // 6. Store Communication Styles as Special Insights
      if (apiResponse.communication_styles && apiResponse.communication_styles.length > 0 && callNote) {
        const communicationInsights = await this.saveCallInsights(
          callNote.id,
          userId,
          apiResponse.communication_styles.map(style => ({
            type: 'communication_style',
            content: JSON.stringify({
              stakeholder: style.stakeholder,
              role: style.role,
              style: style.style,
              confidence: style.confidence,
              evidence: style.evidence,
              preferences: style.preferences,
              communication_tips: style.communication_tips
            }),
            relevance_score: Math.round((style.confidence || 0.5) * 100),
            is_selected: true,
            source: 'Communication Analysis',
            timestamp: new Date().toISOString()
          })),
          processingSessionId
        )

        // Add communication style insights to the insights array
        if (!contentIds.insightsIds) contentIds.insightsIds = []
        contentIds.insightsIds.push(...communicationInsights.map(i => i.id))
      }

      // 7. Update Processing Session with Content References and API Response
      await this.updateProcessingSession(processingSessionId, {
        processing_status: 'completed',
        api_response: apiResponse,
        call_notes_id: contentIds.callNotesId,
        content_references: {
          call_notes_id: contentIds.callNotesId,
          commitments_ids: contentIds.commitmentsIds || [],
          follow_up_email_id: contentIds.followUpEmailId,
          deck_prompt_id: contentIds.deckPromptId,
          insights_ids: contentIds.insightsIds || []
        }
      })

      // 8. Mark File as Processed
      if (fileId) {
        await this.updateUploadedFile(fileId, {
          is_processed: true
        })
      }

      analytics.track('api_response_storage_completed', {
        user_id: userId,
        file_id: fileId,
        processing_session_id: processingSessionId,
        content_types_created: Object.keys(contentIds).filter(key => contentIds[key]),
        total_insights: contentIds.insightsIds?.length || 0,
        total_commitments: contentIds.commitmentsIds?.length || 0,
        duration_ms: Date.now() - startTime
      })

      return {
        success: true,
        contentIds,
        processingSessionId,
        callNotesId: contentIds.callNotesId
      }

    } catch (error) {
      analytics.track('api_response_storage_failed', {
        user_id: userId,
        file_id: fileId,
        processing_session_id: processingSessionId,
        error: error.message,
        duration_ms: Date.now() - startTime
      })

      console.error('Error storing API response data:', error)
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

    const startTime = Date.now()

    try {
      const { data, error } = await supabase
        .from(table)
        .update(updates)
        .eq('id', contentId)
        .select()
        .single()

      if (error) throw error

      analytics.track('content_updated', {
        content_type: contentType,
        content_id: contentId,
        updated_fields: Object.keys(updates)
      })
      analytics.trackApiResponse(`/api/update-${contentType}`, 'PUT', 200, Date.now() - startTime)

      return data
    } catch (error) {
      analytics.trackApiResponse(`/api/update-${contentType}`, 'PUT', 500, Date.now() - startTime, error.message)
      throw error
    }
  },

  // Get all processing sessions that reference a specific content item
  async getSessionsReferencingContent(contentType, contentId) {
    const startTime = Date.now()

    try {
      const { data, error } = await supabase
        .from('processing_history')
        .select('*')
        .contains('content_references', { [`${contentType}_id`]: contentId })

      if (error) throw error

      analytics.trackApiResponse('/api/get-referencing-sessions', 'GET', 200, Date.now() - startTime)
      return data || []
    } catch (error) {
      analytics.trackApiResponse('/api/get-referencing-sessions', 'GET', 500, Date.now() - startTime, error.message)
      throw error
    }
  },

  async logPushAction(userId, contentType, contentId, status, errorMessage = null, hubspotId = null) {
    const startTime = Date.now()

    try {
      // Try using centralized CRM service first
      if (status === 'success') {
        // This would be called after a successful CRM push
        analytics.trackCrmIntegration(
          `push_${contentType}`,
          'hubspot',
          true,
          {
            content_id: contentId,
            hubspot_id: hubspotId
          }
        )
      }

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

      analytics.trackApiResponse('/api/log-push-action', 'POST', 200, Date.now() - startTime)

      return data
    } catch (error) {
      analytics.trackApiResponse('/api/log-push-action', 'POST', 500, Date.now() - startTime, error.message)
      throw error
    }
  }
}

// Export centralized services for easy access
export { api, aiService, fileService, crmService, userManagementService }