import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Demo user for development
export const CURRENT_USER = {
  id: '00000000-0000-0000-0000-000000000003',
  email: 'sales.manager@company.com',
  name: 'Demo Sales Manager',
  full_name: 'Demo Sales Manager',
  role_key: 'sales_manager',
  organization_id: '00000000-0000-0000-0000-000000000001'
}

// Helper function to get current user ID
export const uid = () => CURRENT_USER.id

// Database helper functions
export const dbHelpers = {
  // HubSpot Credentials Management
  async saveUserHubSpotCredentials(userId, credentials) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          hubspot_access_token: credentials.access_token,
          hubspot_refresh_token: credentials.refresh_token,
          hubspot_token_expires_at: credentials.expires_at,
          hubspot_connected: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error saving HubSpot credentials:', error)
      throw error
    }
  },

  async getUserHubSpotCredentials(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('hubspot_access_token, hubspot_refresh_token, hubspot_token_expires_at, hubspot_connected')
        .eq('id', userId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error getting HubSpot credentials:', error)
      throw error
    }
  },

  async updateUserHubSpotTokens(userId, tokens) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          hubspot_access_token: tokens.access_token,
          hubspot_refresh_token: tokens.refresh_token || null,
          hubspot_token_expires_at: tokens.expires_at,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating HubSpot tokens:', error)
      throw error
    }
  },

  async deleteUserHubSpotCredentials(userId) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          hubspot_access_token: null,
          hubspot_refresh_token: null,
          hubspot_token_expires_at: null,
          hubspot_connected: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error deleting HubSpot credentials:', error)
      throw error
    }
  },

  // File Management
  async saveUploadedFile(userId, file, content) {
    try {
      const { data, error } = await supabase
        .from('uploaded_files')
        .insert({
          user_id: userId,
          filename: file.name,
          file_type: file.type,
          file_size: file.size,
          content_type: file.type,
          file_content: content,
          upload_date: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error saving uploaded file:', error)
      throw error
    }
  },

  async getUploadedFiles(userId, limit = 20) {
    try {
      const { data, error } = await supabase
        .from('uploaded_files')
        .select('*')
        .eq('user_id', userId)
        .order('upload_date', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting uploaded files:', error)
      throw error
    }
  },

  async getUploadedFileById(fileId) {
    try {
      const { data, error } = await supabase
        .from('uploaded_files')
        .select('*')
        .eq('id', fileId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error getting uploaded file by ID:', error)
      throw error
    }
  },

  async updateUploadedFile(fileId, updates) {
    try {
      const { data, error } = await supabase
        .from('uploaded_files')
        .update(updates)
        .eq('id', fileId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating uploaded file:', error)
      throw error
    }
  },

  // Call Insights Management
  async createCallInsight(userId, uploadedFileId, insightData) {
    try {
      const { data, error } = await supabase
        .from('call_insights')
        .insert({
          user_id: userId,
          uploaded_file_id: uploadedFileId,
          company_details: insightData.company_details,
          prospect_details: insightData.prospect_details,
          call_summary: insightData.call_summary,
          action_items: insightData.action_items,
          sales_insights: insightData.sales_insights,
          communication_styles: insightData.communication_styles,
          call_analysis_overview: insightData.call_analysis_overview,
          processing_status: insightData.processing_status || 'completed',
          error_message: insightData.error_message,
          extracted_transcript: insightData.extracted_transcript,
          fireflies_id: insightData.fireflies_id,
          type: insightData.type || 'file_upload'
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating call insight:', error)
      throw error
    }
  },

  async getUserCallInsights(userId) {
    try {
      const { data, error } = await supabase
        .from('call_insights')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting user call insights:', error)
      throw error
    }
  },

  async getEmailProspectInsights(userId) {
    try {
      const { data, error } = await supabase
        .from('call_insights')
        .select('*')
        .eq('user_id', userId)
        .not('company_details', 'is', null)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting email prospect insights:', error)
      throw error
    }
  },

  // Fireflies Integration
  async getFirefliesFiles(userId) {
    try {
      const { data, error } = await supabase
        .from('fireflies_files')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error getting Fireflies files:', error)
      throw error
    }
  },

  async updateFirefliesFile(firefliesId, updates) {
    try {
      const { data, error } = await supabase
        .from('fireflies_files')
        .update(updates)
        .eq('fireflies_id', firefliesId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating Fireflies file:', error)
      throw error
    }
  },

  // Presentation Prompts
  async savePresentationPrompt(promptData) {
    try {
      const { data, error } = await supabase
        .from('presentation_prompt')
        .insert({
          body: promptData.prompt
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error saving presentation prompt:', error)
      throw error
    }
  },

  async getPresentationPromptById(id) {
    try {
      const { data, error } = await supabase
        .from('presentation_prompt')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error getting presentation prompt by ID:', error)
      throw error
    }
  },

  async updatePresentationPrompt(promptData) {
    try {
      const { data, error } = await supabase
        .from('presentation_prompt')
        .update({
          body: promptData.prompt,
          updated_at: new Date().toISOString()
        })
        .eq('id', promptData.id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating presentation prompt:', error)
      throw error
    }
  },

  async updateCallInsightsPresentationId(data) {
    try {
      const { error } = await supabase
        .from('call_insights')
        .update({
          presentation_prompt_id: data.presentationId,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.insightId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error updating call insights presentation ID:', error)
      throw error
    }
  },

  // Push Log Management
  async logPushAction(userId, contentType, contentId, status, errorMessage = null, hubspotId = null) {
    try {
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
    } catch (error) {
      console.error('Error logging push action:', error)
      throw error
    }
  }
}

// User helper functions
export const userHelpers = {
  async getCurrentUser() {
    return CURRENT_USER
  },

  async updateUserProfile(userId, updates) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating user profile:', error)
      throw error
    }
  }
}