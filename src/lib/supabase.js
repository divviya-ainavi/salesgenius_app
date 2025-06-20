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
  // HubSpot Credentials Management
  async getUserHubSpotCredentials(userId) {
    const startTime = Date.now()

    try {
      const { data, error } = await supabase
        .from('user_hubspot_credentials')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error
      }

      analytics.trackApiResponse('/api/get-hubspot-credentials', 'GET', 200, Date.now() - startTime)
      return data
    } catch (error) {
      analytics.trackApiResponse('/api/get-hubspot-credentials', 'GET', 500, Date.now() - startTime, error.message)
      throw error
    }
  },

  async saveUserHubSpotCredentials(userId, credentials) {
    const startTime = Date.now()

    try {
      // First, deactivate any existing credentials
      await supabase
        .from('user_hubspot_credentials')
        .update({ is_active: false })
        .eq('user_id', userId)

      // Insert new credentials
      const { data, error } = await supabase
        .from('user_hubspot_credentials')
        .insert({
          user_id: userId,
          client_id: credentials.client_id,
          client_secret: credentials.client_secret,
          access_token: credentials.access_token,
          refresh_token: credentials.refresh_token,
          expires_at: credentials.expires_at,
          scope: credentials.scope,
          hub_domain: credentials.hub_domain,
          hub_id: credentials.hub_id,
          is_active: true
        })
        .select()
        .single()

      if (error) throw error

      analytics.track('hubspot_credentials_saved', {
        user_id: userId,
        hub_id: credentials.hub_id
      })
      analytics.trackApiResponse('/api/save-hubspot-credentials', 'POST', 200, Date.now() - startTime)

      return data
    } catch (error) {
      analytics.trackApiResponse('/api/save-hubspot-credentials', 'POST', 500, Date.now() - startTime, error.message)
      throw error
    }
  },

  async updateUserHubSpotTokens(userId, tokens) {
    const startTime = Date.now()

    try {
      const { data, error } = await supabase
        .from('user_hubspot_credentials')
        .update({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: tokens.expires_at
        })
        .eq('user_id', userId)
        .eq('is_active', true)
        .select()
        .single()

      if (error) throw error

      analytics.track('hubspot_tokens_updated', {
        user_id: userId
      })
      analytics.trackApiResponse('/api/update-hubspot-tokens', 'PUT', 200, Date.now() - startTime)

      return data
    } catch (error) {
      analytics.trackApiResponse('/api/update-hubspot-tokens', 'PUT', 500, Date.now() - startTime, error.message)
      throw error
    }
  },

  async deleteUserHubSpotCredentials(userId) {
    const startTime = Date.now()

    try {
      const { error } = await supabase
        .from('user_hubspot_credentials')
        .update({ is_active: false })
        .eq('user_id', userId)

      if (error) throw error

      analytics.track('hubspot_credentials_deleted', {
        user_id: userId
      })
      analytics.trackApiResponse('/api/delete-hubspot-credentials', 'DELETE', 200, Date.now() - startTime)

      return true
    } catch (error) {
      analytics.trackApiResponse('/api/delete-hubspot-credentials', 'DELETE', 500, Date.now() - startTime, error.message)
      throw error
    }
  },

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

  async getUploadedFileById(fileId) {
    const startTime = Date.now()

    try {
      const { data, error } = await supabase
        .from('uploaded_files')
        .select('*')
        .eq('id', fileId)
        .single()

      if (error) throw error

      analytics.trackApiResponse('/api/get-file-by-id', 'GET', 200, Date.now() - startTime)
      return data
    } catch (error) {
      analytics.trackApiResponse('/api/get-file-by-id', 'GET', 500, Date.now() - startTime, error.message)
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

      if (analysisData.action_items && analysisData.action_items.length > 0) {
        const commitments = await this.createCommitments(
          callNote.id,
          userId,
          analysisData.action_items,
          processingSessionId
        )
        contentIds.commitmentsIds = commitments.map(c => c.id)
      }

      if (analysisData.follow_up_email) {
        const email = await this.createFollowUpEmail(
          callNote.id,
          userId,
          analysisData.follow_up_email,
          processingSessionId
        )
        contentIds.followUpEmailId = email.id
      }

      if (analysisData.deck_prompt) {
        const deck = await this.createDeckPrompt(
          callNote.id,
          userId,
          analysisData.deck_prompt,
          processingSessionId
        )
        contentIds.deckPromptId = deck.id
      }

      if (analysisData.sales_insights && analysisData.sales_insights.length > 0) {
        const insights = await this.saveCallInsights(
          callNote.id,
          userId,
          analysisData.sales_insights,
          processingSessionId
        )
        contentIds.insightsIds = insights.map(i => i.id)
      }

      await this.linkContentToSession(processingSessionId, contentIds)

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

  async updateFirefliesFile(fileId, updates) {
    const startTime = Date.now();

    try {
      const { data, error } = await supabase
        .from('fireflies_files')
        .update(updates)
        .eq('fireflies_id', fileId)
        .select()
        .single();

      if (error) throw error;

      analytics.track('fireflies_file_updated', {
        file_id: fileId,
        updated_fields: Object.keys(updates),
      });

      analytics.trackApiResponse('/api/update-fireflies-file', 'PUT', 200, Date.now() - startTime);

      return data;
    } catch (error) {
      analytics.trackApiResponse('/api/update-fireflies-file', 'PUT', 500, Date.now() - startTime, error.message);
      throw error;
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
  },

  // Create a new call insights record
  async createCallInsight(userId, fileId, insightData) {
    const companyInfo = insightData.company_details?.[0] || { name: "Company" };
    const prospects = insightData.prospect_details || [];
    let companyId = null;
    console.log(companyInfo, "check company info")
    // 1. Handle Company Insert or Lookup
    if (companyInfo?.name) {
      try {
        console.log("called company try")
        const { data: existingCompany, error: checkError } = await supabase
          .from("company")
          .select("id")
          .eq("name", companyInfo.name)
          .maybeSingle();

        if (checkError) {
          console.log("checkError", checkError)
          console.error("Company lookup error:", checkError.message);
        }

        if (existingCompany) {
          console.log("existingCompany", existingCompany)
          companyId = existingCompany.id;
          console.log("Found existing company ID:", companyId);
        } else {
          console.log("Inserting new company:", companyInfo.name)
          const { data: insertedCompany, error: insertError } = await supabase
            .from("company")
            .insert({
              name: companyInfo.name,
              mention_context: companyInfo.mention_context || null,
            })
            .select()
            .single();

          if (insertError) {
            console.log("insertError", insertError)
            console.error("Company insert error:", insertError.message);
          } else if (!insertedCompany) {
            console.log("insertedCompany", insertedCompany)
            console.error("Company insert returned no data, check RLS or table schema.");
          } else {
            companyId = insertedCompany.id;
            console.log("Inserted new company ID:", companyId);
          }
        }
      } catch (err) {
        console.log("err 1284", err)
        console.error("Company block exception:", err);
      }
    }

    // 2. Insert all Prospects with companyId
    const insertedProspectIds = [];
    for (const person of prospects) {
      if (person?.name) {
        try {
          const { data: newProspect, error: insertError } = await supabase
            .from("prospect")
            .insert({
              name: person.name,
              title: person.title || "",
              company_id: companyId,
            })
            .select()
            .single();

          if (insertError) {
            console.error("Prospect insert error:", insertError.message);
          } else if (newProspect?.id) {
            insertedProspectIds.push(newProspect.id);
          }
        } catch (err) {
          console.error("Prospect block exception:", err);
        }
      }
    }

    // 3. Insert into call_insights
    try {
      const { data, error } = await supabase
        .from("call_insights")
        .insert({
          user_id: userId,
          uploaded_file_id: insightData.uploaded_file_id || null,
          fireflies_id: insightData.fireflies_id || null,
          type: insightData.type || null,
          company_id: companyId,
          company_details: insightData.company_details || null,
          prospect_details: insightData.prospect_details || null,
          call_summary: insightData.call_summary || null,
          action_items: insightData.action_items || null,
          sales_insights: insightData.sales_insights || null,
          communication_styles: insightData.communication_styles || null,
          call_analysis_overview: insightData.call_analysis_overview || null,
          processing_status: insightData.processing_status || "completed",
          error_message: insightData.error_message || null,
          extracted_transcript: insightData.extracted_transcript || null,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();



      if (error) {
        console.error("Call insight insert error:", error.message);
        throw error;
      }

      console.log("Call insight stored successfully with company ID:", companyId);
      return data;
    } catch (err) {
      console.error("Call insight block exception:", err);
      throw err;
    }
  },

  async getGroupedCallInsightsByCompany(userId) {
    const { data: insights, error } = await supabase
      .from("call_insights")
      .select("*")
      .eq("user_id", userId);

    if (error) throw error;

    // Group by company_id
    const companyMap = new Map();

    for (const insight of insights) {
      const { company_id, prospect_ids, sales_insights = [], communication_styles = [] } = insight;

      if (!companyMap.has(company_id)) {
        companyMap.set(company_id, {
          company_id,
          call_count: 0,
          sales_insights: [],
          communication_styles: [],
          prospect_ids: new Set(),
          raw_call_insights: [],
        });
      }

      const entry = companyMap.get(company_id);
      entry.call_count += 1;
      entry.sales_insights.push(...sales_insights);
      entry.communication_styles.push(...communication_styles);
      prospect_ids?.forEach((id) => entry.prospect_ids.add(id));
      entry.raw_call_insights.push(insight);
    }

    // Enrich with company and prospect info
    const results = [];
    for (const [companyId, group] of companyMap.entries()) {
      const { data: company, error: companyError } = await supabase
        .from("company")
        .select("*")
        .eq("id", companyId)
        .maybeSingle();

      const { data: prospects, error: prospectError } = await supabase
        .from("prospect")
        .select("*")
        .in("id", Array.from(group.prospect_ids));

      results.push({
        ...group,
        company_details: company,
        prospect_details: prospects,
      });
    }

    return results;
  },


  // Get all call insights for a user - Fixed to use the correct relationship
  async getUserCallInsights(userId, limit = 20) {
    const startTime = Date.now()

    try {
      const { data, error } = await supabase
        .from('call_insights')
        .select(`
          *,
          uploaded_files!call_insights_uploaded_file_id_fkey (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      analytics.trackApiResponse('/api/get-user-call-insights', 'GET', 200, Date.now() - startTime)
      return data || []
    } catch (error) {
      analytics.trackApiResponse('/api/get-user-call-insights', 'GET', 500, Date.now() - startTime, error.message)
      throw error
    }
  },
  async getEmailProspectInsights(userId) {
    const { data, error } = await supabase
      .from('call_insights')
      .select(`
      id,
      company_id,
      prospect_ids,
      company_details,
      prospect_details,
      sales_insights,
      communication_styles,
      created_at,
      call_summary,
      extracted_transcript,
email_template_id,
presentation_prompt_id,
action_items
    `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async savePresentationPrompt({ body, prospectId }) {
    const { data, error } = await supabase
      .from("presentation_prompt")
      .insert([{ body }])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updatePresentationPrompt({ id, prompt }) {
    const { error } = await supabase
      .from("presentation_prompt")
      .update({ body: prompt })
      .eq("id", id);

    if (error) throw error;
  },

  async getPresentationPromptById(id) {
    const { data, error } = await supabase
      .from("presentation_prompt")
      .select("*")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  },

  async updateCallInsightsPresentationId({ insightId, presentationId }) {
    const { error } = await supabase
      .from("call_insights")
      .update({ presentation_prompt_id: presentationId })
      .eq("id", insightId);
    if (error) throw error;
  },

  async saveOrFetchEmailTemplate(insightId, subject, body) {
    // First check if email already exists
    const { data: insight, error: fetchError } = await supabase
      .from('call_insights')
      .select('email_template_id')
      .eq('id', insightId)
      .single();

    if (fetchError) throw fetchError;

    if (insight?.email_template_id) {
      const { data: emailTemplate, error: emailError } = await supabase
        .from('email_templates')
        .select('*')
        .eq('id', insight.email_template_id)
        .single();

      if (emailError) throw emailError;
      return emailTemplate;
    }

    // If not, insert and link
    const { data: newEmail, error: insertError } = await supabase
      .from('email_templates')
      .insert({
        subject,
        body,
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Link to call_insight
    const { error: updateError } = await supabase
      .from('call_insights')
      .update({ email_template_id: newEmail.id })
      .eq('id', insightId);

    if (updateError) throw updateError;

    return newEmail;
  },

  // async savePresentationPrompt({ prompt, prospectId }) {
  //   const { data: inserted, error } = await supabase
  //     .from("presentation_prompt")
  //     .insert({ body: prompt })
  //     .select()
  //     .single();

  //   if (error) throw error;

  //   const { error: updateError } = await supabase
  //     .from("call_insights")
  //     .update({ presentation_prompt_id: inserted.id })
  //     .eq("id", prospectId);

  //   if (updateError) throw updateError;

  //   return inserted;
  // },
  async createEmailTemplate(subject, body) {
    const { data, error } = await supabase
      .from('email_templates')
      .insert({ subject, body })
      .select()
      .single();

    if (error) throw error;
    return data;
  },


  async getFirefliesFiles(userId) {
    const { data, error } = await supabase
      .from("fireflies_files")
      .select("*")
      // .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return data;
  },

  async updateEmailTemplate(templateId, subject, body) {
    const { data, error } = await supabase
      .from("email_templates")
      .update({ subject, body })
      .eq("id", templateId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Fetch email template by ID
  async getEmailTemplateById(templateId) {
    const { data, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (error) throw error;
    return data;
  },

  // Update call_insights to link email template
  async linkEmailTemplateToCallInsight(callInsightId, templateId) {
    const { data, error } = await supabase
      .from('call_insights')
      .update({ email_template_id: templateId })
      .eq('id', callInsightId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get a specific call insight by ID
  async getCallInsightById(insightId) {
    const startTime = Date.now()

    try {
      const { data, error } = await supabase
        .from('call_insights')
        .select(`
          *,
          uploaded_files!call_insights_uploaded_file_id_fkey (*)
        `)
        .eq('id', insightId)
        .single()

      if (error) throw error

      analytics.trackApiResponse('/api/get-call-insight', 'GET', 200, Date.now() - startTime)
      return data
    } catch (error) {
      analytics.trackApiResponse('/api/get-call-insight', 'GET', 500, Date.now() - startTime, error.message)
      throw error
    }
  },

  // Update company name in call insights
  async updateCompanyName(insightId, companyName) {
    const startTime = Date.now()

    try {
      // First, get the current insight to access company_id
      const { data: currentInsight, error: fetchError } = await supabase
        .from('call_insights')
        .select('company_id, company_details')
        .eq('id', insightId)
        .single()

      if (fetchError) throw fetchError

      // Update the company table if company_id exists
      if (currentInsight.company_id) {
        const { error: companyUpdateError } = await supabase
          .from('company')
          .update({ name: companyName })
          .eq('id', currentInsight.company_id)

        if (companyUpdateError) {
          console.warn('Failed to update company table:', companyUpdateError.message)
        }
      }

      // Update the company_details in call_insights
      const updatedCompanyDetails = {
        ...currentInsight.company_details,
        name: companyName
      }

      const { data, error } = await supabase
        .from('call_insights')
        .update({ company_details: updatedCompanyDetails })
        .eq('id', insightId)
        .select()
        .single()

      if (error) throw error

      analytics.track('company_name_updated', {
        insight_id: insightId,
        new_company_name: companyName
      })
      analytics.trackApiResponse('/api/update-company-name', 'PUT', 200, Date.now() - startTime)

      return data
    } catch (error) {
      analytics.trackApiResponse('/api/update-company-name', 'PUT', 500, Date.now() - startTime, error.message)
      throw error
    }
  }
}




// Export centralized services for easy access
export { api, aiService, fileService, crmService, userManagementService }