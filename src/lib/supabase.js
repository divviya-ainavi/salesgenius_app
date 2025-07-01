import { createClient } from '@supabase/supabase-js'
import { fileStorage } from './fileStorage'
import { analytics } from './analytics'
import CryptoJS from 'crypto-js'
import api from './api'
import aiService from '@/services/aiService'
import fileService from '@/services/fileService'
import crmService from '@/services/crmService'
import userManagementService from '@/services/userManagementService'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Password hashing configuration
const ENCRYPTION_SECRET = 'SG_2025'; // In production, use environment variable

// Password hashing helper functions
const hashPassword = (password) => {
  // Use SHA256 with salt for consistent hashing
  const saltedPassword = password + ENCRYPTION_SECRET;
  return CryptoJS.SHA256(saltedPassword).toString();
};

const verifyPassword = (plainPassword, hashedPassword) => {
  const hashedInput = hashPassword(plainPassword);
  return hashedInput === hashedPassword;
};


export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Current user state - will be updated when user logs in
export let CURRENT_USER = {
  id: null,
  email: null,
  full_name: null,
  name: null,
  role_key: null,
  organization_id: null,
  hubspot_connected: false,
  hubspot_access_token: null,
  hubspot_refresh_token: null,
}

// Initialize user from localStorage on app start
const initializeUserFromStorage = () => {
  const storedUserId = localStorage.getItem("userId");
  const storedStatus = localStorage.getItem("status");

  if (storedUserId && storedStatus === "loggedin") {
    // Load user profile from database
    authHelpers.getUserProfile(storedUserId).then(profile => {
      if (profile) {
        authHelpers.setCurrentUser(profile);
      } else {
        // Clear invalid stored data
        localStorage.removeItem("userId");
        localStorage.removeItem("status");
      }
    }).catch(error => {
      console.error('Error loading user from storage:', error);
      localStorage.removeItem("userId");
      localStorage.removeItem("status");
    });
  }
};

// Authentication helpers
export const authHelpers = {

  async loginWithCustomPassword(email, plainPassword) {
    // 1. Fetch the profile with the stored hashed password
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, hashed_password')
      .eq('email', email)
      .single();

    if (error || !profile) {
      throw new Error('Invalid login credentials');
    }

    // 2. Hash the provided password and compare with stored hashed password
    const isPasswordValid = verifyPassword(plainPassword, profile.hashed_password);
    
    if (!isPasswordValid) {
      throw new Error('Invalid login credentials');
    }

    // 3. Return user ID if matched
    return profile.id;
  },

  // Get user profile from database
  async getUserProfile(userId) {
    try {
      // Step 1: Fetch the base profile + organization + title ID
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select(`
        id,
        email,
        full_name,
        organization_id,
        status_id,
        created_at,
        updated_at,
        title_id
      `)
        .eq("id", userId)
        .single();

      if (profileError || !profile) {
        console.error("Error fetching profile:", profileError);
        return null;
      }

      // Step 2: Fetch the organization with nested fields
      const { data: organization, error: orgError } = await supabase
        .from("organizations")
        .select(`
        id,
        name,
        domain,
        status_id,
        created_at,
        hubspot_access_token,
        company_size:company_size_id (
          id,
          key,
          label,
          description
        ),
        industry:industry_id (
          id,
          key,
          label,
          description
        ),
        sales_methodology:sales_methodology_id (
          id,
          key,
          label,
          description
        )
      `)
        .eq("id", profile.organization_id)
        .single();

      if (orgError) {
        console.warn("No organization found for profile:", orgError.message);
      }

      // Step 3: Fetch title and nested role
      const { data: title, error: titleError } = await supabase
        .from("titles")
        .select(`
        id,
        name,
        role_id,
        roles (
          id,
          key,
          label,
          description
        )
      `)
        .eq("id", profile.title_id)
        .single();

      if (titleError) {
        console.warn("No title found for profile:", titleError.message);
      }

      return {
        ...profile,
        organization_details: organization || null,
        title_name: title?.name || null,
        role_details: title?.roles || null,
      };
    } catch (error) {
      console.error("Error in getUserProfile:", error);
      return null;
    }
  },

  // Set current user state and identify with PostHog
  async setCurrentUser(profile) {
    CURRENT_USER = {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name || profile.email,
      name: profile.full_name || profile.email,
      role_key: 'sales_manager', // Default role, could be fetched from roles table
      organization_id: profile.organization_id,
      hubspot_connected: profile.hubspot_connected || false,
      hubspot_access_token: profile.hubspot_access_token,
      hubspot_refresh_token: profile.hubspot_refresh_token,
      status_id: profile.status_id,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    };

    // Store user ID in localStorage for persistence
    localStorage.setItem("userId", profile.id);
    localStorage.setItem("status", "loggedin");

    // Identify user with PostHog analytics
    analytics.identify(profile.id, {
      email: profile.email,
      full_name: profile.full_name,
      role: 'sales_manager',
      organization_id: profile.organization_id,
      hubspot_connected: profile.hubspot_connected || false,
      created_at: profile.created_at,
    });

    // Track login event
    analytics.track('user_logged_in', {
      user_id: profile.id,
      email: profile.email,
      login_method: 'custom_password',
    });
  },

  // Clear current user state and reset PostHog
  clearCurrentUser() {
    // Track logout event before clearing user data
    if (CURRENT_USER.id) {
      analytics.track('user_logged_out', {
        user_id: CURRENT_USER.id,
        session_duration: Date.now() - (localStorage.getItem('login_timestamp') || Date.now()),
      });
    }

    // Reset PostHog session
    analytics.reset();

    CURRENT_USER = {
      id: null,
      email: null,
      full_name: null,
      name: null,
      role_key: null,
      organization_id: null,
      hubspot_connected: false,
      hubspot_access_token: null,
      hubspot_refresh_token: null,
    };

    // Clear localStorage
    localStorage.removeItem("userId");
    localStorage.removeItem("status");
    localStorage.removeItem("login_timestamp");
  },

  // Check if user is authenticated
  async isAuthenticated() {
    // Check if we have a current user ID
    if (CURRENT_USER?.id) {
      return true;
    }

    // Check localStorage for persisted session
    const storedUserId = localStorage.getItem("userId");
    const storedStatus = localStorage.getItem("status");

    if (storedUserId && storedStatus === "loggedin") {
      // Try to load user profile
      try {
        const profile = await this.getUserProfile(storedUserId);
        if (profile) {
          await this.setCurrentUser(profile);
          return true;
        }
      } catch (error) {
        console.error('Error restoring user session:', error);
      }
    }

    return false;
  },

  // Sign out user
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      this.clearCurrentUser();
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return { success: false, error: error.message };
    }
  },

  // Create user profile after registration
  async createUserProfile(userId, userData) {
    try {
      // Hash the password before storing
      const hashedPassword = userData.password ? hashPassword(userData.password) : null;
      
      const { data, error } = await supabase
        .from('profiles')
        .insert([{
          id: userId,
          email: userData.email,
          full_name: userData.full_name,
          organization_id: userData.organization_id,
          status_id: 1, // Active status
          hashed_password: hashedPassword,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  },

  // Update user profile
  async updateUserProfile(userId, updates) {
    try {
      // If password is being updated, hash it
      if (updates.password) {
        updates.hashed_password = hashPassword(updates.password);
        delete updates.password; // Remove plain password from updates
      }
      
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      // Update current user state if it's the same user
      if (userId === CURRENT_USER.id) {
        await this.setCurrentUser(data);
      }

      return data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  },

  // Save HubSpot credentials
  async saveHubSpotCredentials(userId, credentials) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          hubspot_access_token: credentials.access_token,
          hubspot_refresh_token: credentials.refresh_token,
          hubspot_connected: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      // Update current user state
      if (userId === CURRENT_USER.id) {
        await this.setCurrentUser(data);
      }

      return data;
    } catch (error) {
      console.error('Error saving HubSpot credentials:', error);
      throw error;
    }
  },

  // Get HubSpot credentials
  async getHubSpotCredentials(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('hubspot_access_token, hubspot_refresh_token, hubspot_connected')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting HubSpot credentials:', error);
      return null;
    }
  },

  // Get organization HubSpot integration status
  async getOrganizationHubSpotStatus(organizationId) {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('hubspot_encrypted_token')
        .eq('id', organizationId)
        .single();

      if (error) throw error;
      
      return {
        connected: !!data.hubspot_encrypted_token,
        encryptedToken: data.hubspot_encrypted_token,
      };
    } catch (error) {
      console.error('Error getting organization HubSpot status:', error);
      return {
        connected: false,
        encryptedToken: null,
      };
    }
  },

  // Update organization HubSpot token
  async updateOrganizationHubSpotToken(organizationId, encryptedToken) {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .update({
          hubspot_encrypted_token: encryptedToken,
          updated_at: new Date().toISOString(),
        })
        .eq('id', organizationId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating organization HubSpot token:', error);
      throw error;
    }
  },
};

// Initialize user from storage when module loads
initializeUserFromStorage();

// Database helpers (existing code remains the same)
export const dbHelpers = {
  // File operations
  async saveUploadedFile(userId, file, content) {
    try {
      // First, upload file to Supabase Storage
      const timestamp = Date.now()
      const fileExtension = file.name.split('.').pop()
      const uniqueFileName = `${userId}/${timestamp}_${file.name}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('call-transcripts')
        .upload(uniqueFileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('call-transcripts')
        .getPublicUrl(uniqueFileName)

      // Save file metadata to database
      const { data, error } = await supabase
        .from('uploaded_files')
        .insert([{
          user_id: userId,
          filename: file.name,
          file_type: file.type,
          file_size: file.size,
          content_type: file.type,
          file_content: content,
          file_url: urlData.publicUrl,
          storage_path: uploadData.path,
          is_processed: false,
        }])
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
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching uploaded files:', error)
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
      console.error('Error fetching uploaded file by ID:', error)
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

  // Call insights operations
  async createCallInsight(userId, uploadedFileId, insightData) {
    try {
      const { data, error } = await supabase
        .from('call_insights')
        .insert([{
          user_id: userId,
          uploaded_file_id: insightData.uploaded_file_id || uploadedFileId,
          fireflies_id: insightData.fireflies_id || null,
          type: insightData.type || 'file_upload',
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
          email_template_id: insightData.email_template_id,
          presentation_prompt_id: insightData.presentation_prompt_id,
        }])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating call insight:', error)
      throw error
    }
  },

  async getUserCallInsights(userId, limit = 20) {
    try {
      const { data, error } = await supabase
        .from('call_insights')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching user call insights:', error)
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
      console.error('Error fetching email prospect insights:', error)
      throw error
    }
  },

  // Email template operations
  async saveEmailTemplate(templateData) {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .insert([{
          subject: templateData.subject,
          body: templateData.body,
        }])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error saving email template:', error)
      throw error
    }
  },

  async getEmailTemplateById(templateId) {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .select('*')
        .eq('id', templateId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching email template:', error)
      throw error
    }
  },

  async updateEmailTemplate(templateId, updates) {
    try {
      const { data, error } = await supabase
        .from('email_templates')
        .update(updates)
        .eq('id', templateId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating email template:', error)
      throw error
    }
  },

  async updateCallInsightsEmailId(insightId, emailId) {
    try {
      const { data, error } = await supabase
        .from('call_insights')
        .update({ email_template_id: emailId })
        .eq('id', insightId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating call insights email ID:', error)
      throw error
    }
  },

  // ResearchCompany operations
  async saveResearchCompany(data) {
    try {
      const { data: inserted, error } = await supabase
        .from("ResearchCompany")
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return inserted;
    } catch (error) {
      console.error("Error saving research company:", error);
      throw error;
    }
  },

  async getResearchCompanyCountByUser(userId) {
    try {
      const { count, error } = await supabase
        .from('ResearchCompany')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)

      if (error) throw error
      return count
    } catch (error) {
      console.error('Error getting research company count:', error)
      throw error
    }
  },

  // Presentation prompt operations
  async savePresentationPrompt(promptData) {
    try {
      const { data, error } = await supabase
        .from('presentation_prompt')
        .insert([{
          body: promptData.body,
          sales_methodology: promptData.sales_methodology,
          presentation_objective: promptData.presentation_objective,
        }])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error saving presentation prompt:', error)
      throw error
    }
  },

  async getPresentationPromptById(promptId) {
    try {
      const { data, error } = await supabase
        .from('presentation_prompt')
        .select('*')
        .eq('id', promptId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching presentation prompt:', error)
      throw error
    }
  },

  async updatePresentationPrompt(promptData) {
    try {
      const { data, error } = await supabase
        .from('presentation_prompt')
        .update({ body: promptData.body })
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

  async updateCallInsightsPresentationId(updateData) {
    try {
      const { data, error } = await supabase
        .from('call_insights')
        .update({ presentation_prompt_id: updateData.presentationId })
        .eq('id', updateData.insightId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating call insights presentation ID:', error)
      throw error
    }
  },

  // Fireflies operations
  async getFirefliesFiles(userId) {
    try {
      const { data, error } = await supabase
        .from('fireflies_files')
        .select('*')
        // .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching Fireflies files:', error)
      throw error
    }
  },

  async createEmailTemplate(subject, body) {
    const { data, error } = await supabase
      .from('email_templates')
      .insert({ subject, body })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

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

  async updateFirefliesFile(fileId, updates) {
    try {
      const { data, error } = await supabase
        .from('fireflies_files')
        .update(updates)
        .eq('fireflies_id', fileId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating Fireflies file:', error)
      throw error
    }
  },

  // Push log operations
  async logPushAction(userId, contentType, contentId, status, errorMessage = null, hubspotId = null) {
    try {
      const { data, error } = await supabase
        .from('push_log')
        .insert([{
          user_id: userId,
          content_type: contentType,
          content_id: contentId,
          push_status: status,
          error_message: errorMessage,
          hubspot_id: hubspotId,
        }])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error logging push action:', error)
      throw error
    }
  },

  // User management helpers
  async getUserHubSpotCredentials(userId) {
    return await authHelpers.getHubSpotCredentials(userId);
  },

  async saveUserHubSpotCredentials(userId, credentials) {
    return await authHelpers.saveHubSpotCredentials(userId, credentials);
  },

  async updateUserHubSpotTokens(userId, tokenData) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          hubspot_access_token: tokenData.access_token,
          hubspot_refresh_token: tokenData.refresh_token,
          hubspot_token_expires_at: tokenData.expires_at,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating HubSpot tokens:', error);
      throw error;
    }
  },

  async deleteUserHubSpotCredentials(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          hubspot_access_token: null,
          hubspot_refresh_token: null,
          hubspot_connected: false,
          hubspot_token_expires_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error deleting HubSpot credentials:', error);
      throw error;
    }
  },

  //get org dropdown details
  async getOrgDropdownOptions() {
    try {
      const [industryRes, companySizeRes, methodologyRes] = await Promise.all([
        supabase.from("industry").select("*"),
        supabase.from("company_size").select("*"),
        supabase.from("sales_methodology").select("*"),
      ]);

      const hasError = industryRes.error || companySizeRes.error || methodologyRes.error;
      if (hasError) {
        console.error("Error fetching dropdown options:", {
          industry: industryRes.error,
          companySize: companySizeRes.error,
          methodology: methodologyRes.error,
        });
        return null;
      }

      return {
        industry: industryRes.data,
        company_size: companySizeRes.data,
        sales_methodology: methodologyRes.data,
      };
    } catch (error) {
      console.error("Unexpected error:", error);
      return null;
    }
  },

  async getRoleIdByTitleId(titleId) {
    const { data, error } = await supabase
      .from("titles")
      .select("*")
      .eq("id", titleId)
      .single(); // ensures we get a single object, not an array

    if (error) {
      console.error("Error fetching role_id from titles:", error);
      throw error;
    }

    return data?.role_id;
  },

  async updateUserProfile(userId, updates) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: updates.name,
          email: updates.email
        })
        .eq('id', userId)
        .select();

      if (error) throw error;

      // Check if any rows were updated
      if (!data || data.length === 0) {
        throw new Error('No user found with the provided ID');
      }

      return data[0];
    } catch (err) {
      console.error('Error updating user profile:', err);
      throw err;
    }
  },

  async updateOrganizationSettings(
    organizationId,
    toUpdateData
  ) {
    try {
      const { data, error } = await supabase
        .from("organizations")
        .update(toUpdateData)
        .eq("id", organizationId)
        .select("*")
        .single();

      if (error) {
        console.error("Supabase update error:", error.message);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (err) {
      console.error("Unexpected error in updateOrganizationSettings:", err);
      return { success: false, error: err };
    }
  }
}

// User helpers for backward compatibility
export const userHelpers = {
  getCurrentUser: () => CURRENT_USER,
  isAuthenticated: authHelpers.isAuthenticated,
  signOut: authHelpers.signOut,
}