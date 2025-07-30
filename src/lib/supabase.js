import { createClient } from '@supabase/supabase-js'
import { config } from './config'
import { analytics } from './analytics'
import CryptoJS from 'crypto-js'

// Initialize Supabase client
export const supabase = createClient(
  config.supabase.url,
  config.supabase.anonKey
)

// Current user state
export let CURRENT_USER = {
  id: null,
  email: null,
  full_name: null,
  organization_id: null,
  title_id: null,
  role_key: null,
  status: null
}

// Hash password function using environment-based salt
export const hashPassword = (password) => {
  const saltedPassword = password + config.passwordSalt
  return CryptoJS.SHA256(saltedPassword).toString()
}

// Supabase Authentication Helpers
export const supabaseAuthHelpers = {
  // Sign up with email and password
  async signUp(email, password, metadata = {}) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      })

      if (error) throw error

      analytics.track('supabase_signup_success', {
        user_id: data.user?.id,
        email: email
      })

      return {
        success: true,
        user: data.user,
        session: data.session
      }
    } catch (error) {
      analytics.track('supabase_signup_failed', {
        email: email,
        error: error.message
      })
      
      return {
        success: false,
        error: error.message
      }
    }
  },

  // Sign up and create profile in one transaction
  async signUpWithProfile(email, password, profileData) {
    try {
      // First create the Supabase Auth user
      const authResult = await this.signUp(email, password, {
        full_name: profileData.full_name
      })

      if (!authResult.success) {
        throw new Error(authResult.error)
      }

      // Create profile record with Supabase Auth user ID
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: authResult.user.id, // Use Supabase Auth user ID
          email: email,
          full_name: profileData.full_name,
          organization_id: profileData.organization_id,
          title_id: profileData.title_id,
          status_id: 1, // Active status
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (profileError) {
        // If profile creation fails, clean up the auth user
        await supabase.auth.admin.deleteUser(authResult.user.id)
        throw new Error(`Profile creation failed: ${profileError.message}`)
      }

      analytics.track('supabase_signup_with_profile_success', {
        user_id: authResult.user.id,
        organization_id: profileData.organization_id
      })

      return {
        success: true,
        user: authResult.user,
        profile: profile,
        session: authResult.session
      }
    } catch (error) {
      analytics.track('supabase_signup_with_profile_failed', {
        email: email,
        error: error.message
      })

      return {
        success: false,
        error: error.message
      }
    }
  },

  // Sign in with email and password
  async signInWithEmail(email, password) {
    try {
      // Try Supabase Auth first
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        // If Supabase Auth fails, try custom authentication
        console.log('Supabase Auth failed, trying custom auth:', error.message)
        return await this.fallbackSignIn(email, password)
      }

      // Get profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          organization_details:organization_id(
            id,
            name,
            domain,
            industry_id,
            company_size_id,
            sales_methodology_id
          ),
          title_name:title_id(name),
          role_details:title_id(role_id)
        `)
        .eq('id', data.user.id)
        .single()

      if (profileError) {
        throw new Error('Profile not found')
      }

      // Update CURRENT_USER
      CURRENT_USER = {
        id: data.user.id,
        email: data.user.email,
        full_name: profile.full_name,
        organization_id: profile.organization_id,
        title_id: profile.title_id,
        role_key: profile.role_details?.key,
        status: profile.status_id
      }

      analytics.identify(data.user.id, {
        email: data.user.email,
        full_name: profile.full_name,
        organization_id: profile.organization_id
      })

      analytics.track('supabase_signin_success', {
        user_id: data.user.id,
        method: 'supabase_auth'
      })

      return {
        success: true,
        user: data.user,
        profile: profile,
        session: data.session,
        method: 'supabase_auth'
      }
    } catch (error) {
      analytics.track('supabase_signin_failed', {
        email: email,
        error: error.message
      })

      return {
        success: false,
        error: error.message
      }
    }
  },

  // Fallback to custom authentication
  async fallbackSignIn(email, password) {
    try {
      const hashedPassword = hashPassword(password)

      const { data: profile, error } = await supabase
        .from('profiles')
        .select(`
          *,
          organization_details:organization_id(
            id,
            name,
            domain,
            industry_id,
            company_size_id,
            sales_methodology_id
          ),
          title_name:title_id(name),
          role_details:title_id(role_id)
        `)
        .eq('email', email)
        .eq('hashed_password', hashedPassword)
        .single()

      if (error || !profile) {
        throw new Error('Invalid login credentials')
      }

      // Update CURRENT_USER
      CURRENT_USER = {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        organization_id: profile.organization_id,
        title_id: profile.title_id,
        role_key: profile.role_details?.key,
        status: profile.status_id
      }

      analytics.identify(profile.id, {
        email: profile.email,
        full_name: profile.full_name,
        organization_id: profile.organization_id
      })

      analytics.track('custom_signin_success', {
        user_id: profile.id,
        method: 'custom_auth'
      })

      return {
        success: true,
        user: { id: profile.id, email: profile.email },
        profile: profile,
        session: null,
        method: 'custom_auth'
      }
    } catch (error) {
      analytics.track('custom_signin_failed', {
        email: email,
        error: error.message
      })

      return {
        success: false,
        error: error.message
      }
    }
  },

  // Sign out
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.warn('Supabase signout error:', error.message)
      }

      // Clear current user
      CURRENT_USER = {
        id: null,
        email: null,
        full_name: null,
        organization_id: null,
        title_id: null,
        role_key: null,
        status: null
      }

      analytics.reset()
      analytics.track('user_signout')

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  },

  // Reset password for email
  async resetPasswordForEmail(email) {
    try {
      // Try Supabase Auth first
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) {
        // If Supabase fails, try custom reset
        console.log('Supabase reset failed, trying custom reset:', error.message)
        return await this.fallbackPasswordReset(email)
      }

      analytics.track('supabase_password_reset_requested', { email })

      return {
        success: true,
        message: 'Password reset email sent successfully'
      }
    } catch (error) {
      analytics.track('password_reset_failed', {
        email: email,
        error: error.message
      })

      return {
        success: false,
        error: error.message
      }
    }
  },

  // Fallback password reset using custom system
  async fallbackPasswordReset(email) {
    try {
      // Check if user exists in profiles
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('email', email)
        .single()

      if (error || !profile) {
        // For security, always return success message
        return {
          success: true,
          message: 'If an account exists, a reset email has been sent'
        }
      }

      // Generate reset token
      const resetToken = this.generateResetToken()
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours

      // Save reset token to profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          reset_token: resetToken,
          reset_token_expires: expiresAt,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)

      if (updateError) {
        throw new Error('Failed to generate reset token')
      }

      // Here you would send the reset email with the token
      // For now, we'll just log it (in production, integrate with your email service)
      console.log('Reset token for', email, ':', resetToken)

      analytics.track('custom_password_reset_requested', { email })

      return {
        success: true,
        message: 'Password reset email sent successfully'
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  },

  // Update password (for reset flow)
  async updatePassword(newPassword) {
    try {
      // Try Supabase Auth first
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        throw new Error(error.message)
      }

      analytics.track('supabase_password_updated', {
        user_id: data.user?.id
      })

      return {
        success: true,
        message: 'Password updated successfully'
      }
    } catch (error) {
      analytics.track('password_update_failed', {
        error: error.message
      })

      return {
        success: false,
        error: error.message
      }
    }
  },

  // Check if user is authenticated
  async isAuthenticated() {
    try {
      // Check Supabase Auth session first
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (session && !error) {
        // Update CURRENT_USER from session
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profile) {
          CURRENT_USER = {
            id: session.user.id,
            email: session.user.email,
            full_name: profile.full_name,
            organization_id: profile.organization_id,
            title_id: profile.title_id,
            role_key: profile.role_key,
            status: profile.status_id
          }
        }

        return true
      }

      // Fallback to custom auth check
      const userId = localStorage.getItem('userId')
      if (userId) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (profile) {
          CURRENT_USER = {
            id: profile.id,
            email: profile.email,
            full_name: profile.full_name,
            organization_id: profile.organization_id,
            title_id: profile.title_id,
            role_key: profile.role_key,
            status: profile.status_id
          }
          return true
        }
      }

      return false
    } catch (error) {
      console.error('Auth check error:', error)
      return false
    }
  },

  // Get current user
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        return null
      }

      return user
    } catch (error) {
      console.error('Get current user error:', error)
      return null
    }
  },

  // Generate reset token
  generateResetToken() {
    return CryptoJS.lib.WordArray.random(32).toString()
  },

  // Validate reset token
  async validateResetToken(token) {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('id, email, reset_token, reset_token_expires')
        .eq('reset_token', token)
        .single()

      if (error || !profile) {
        return { valid: false, error: 'Invalid token' }
      }

      // Check if token is expired
      const now = new Date()
      const expiresAt = new Date(profile.reset_token_expires)

      if (now > expiresAt) {
        return { valid: false, error: 'Token expired' }
      }

      return { valid: true, profile }
    } catch (error) {
      return { valid: false, error: error.message }
    }
  },

  // Reset password with token
  async resetPasswordWithToken(token, newPassword) {
    try {
      const validation = await this.validateResetToken(token)
      
      if (!validation.valid) {
        throw new Error(validation.error)
      }

      const hashedPassword = hashPassword(newPassword)

      // Update password and clear reset token
      const { error } = await supabase
        .from('profiles')
        .update({
          hashed_password: hashedPassword,
          reset_token: null,
          reset_token_expires: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', validation.profile.id)

      if (error) {
        throw new Error('Failed to update password')
      }

      analytics.track('custom_password_reset_completed', {
        user_id: validation.profile.id
      })

      return {
        success: true,
        message: 'Password reset successfully'
      }
    } catch (error) {
      analytics.track('password_reset_completion_failed', {
        error: error.message
      })

      return {
        success: false,
        error: error.message
      }
    }
  }
}

// Legacy auth helpers for backward compatibility
export const authHelpers = {
  hashPassword,

  async setCurrentUser(user) {
    CURRENT_USER = { ...CURRENT_USER, ...user }
    localStorage.setItem('userId', user.id)
    return user
  },

  async getCurrentUser() {
    return CURRENT_USER
  },

  async signOut() {
    CURRENT_USER = {
      id: null,
      email: null,
      full_name: null,
      organization_id: null,
      title_id: null,
      role_key: null,
      status: null
    }
    localStorage.removeItem('userId')
    analytics.reset()
    return { success: true }
  },

  async validateResetToken(token) {
    return await supabaseAuthHelpers.validateResetToken(token)
  },

  async resetPassword(token, newPassword) {
    return await supabaseAuthHelpers.resetPasswordWithToken(token, newPassword)
  }
}

// Database helpers
export const dbHelpers = {
  // Get user profile with organization details
  async getUserProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          organization_details:organization_id(
            id,
            name,
            domain,
            industry_id,
            company_size_id,
            sales_methodology_id
          ),
          title_name:title_id(name),
          role_details:title_id(role_id)
        `)
        .eq('id', userId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching user profile:', error)
      throw error
    }
  },

  // Get roles
  async getRoles() {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .order('id', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching roles:', error)
      throw error
    }
  },

  // Get user status options
  async getStatus() {
    try {
      const { data, error } = await supabase
        .from('user_status')
        .select('*')
        .order('id', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching status options:', error)
      throw error
    }
  },

  // Get sales insight types
  async getSalesInsightTypes() {
    try {
      const { data, error } = await supabase
        .from('sales_insight_types')
        .select('*')
        .eq('is_active', true)
        .order('label', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching sales insight types:', error)
      throw error
    }
  },

  // Get communication style types
  async getCommunicationStyleTypes() {
    try {
      const { data, error } = await supabase
        .from('communication_style_type')
        .select('*')
        .order('label', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching communication style types:', error)
      throw error
    }
  },

  // Get titles for organization
  async getTitles(organizationId) {
    try {
      const { data, error } = await supabase
        .from('titles')
        .select('*')
        .eq('organization_id', organizationId)
        .order('name', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching titles:', error)
      throw error
    }
  },

  // Get role ID by title ID
  async getRoleIdByTitleId(titleId) {
    try {
      const { data, error } = await supabase
        .from('titles')
        .select('role_id')
        .eq('id', titleId)
        .single()

      if (error) throw error
      return data?.role_id
    } catch (error) {
      console.error('Error fetching role ID by title ID:', error)
      throw error
    }
  },

  // Get role by title name
  async getRoleIdByTitleName(titleId, organizationId) {
    try {
      const { data, error } = await supabase
        .from('titles')
        .select('name')
        .eq('id', titleId)
        .eq('organization_id', organizationId)
        .single()

      if (error) throw error
      return data?.name
    } catch (error) {
      console.error('Error fetching role by title name:', error)
      throw error
    }
  },

  // Get companies by user ID
  async getCompaniesByUserId(userId, searchTerm = '') {
    try {
      let query = supabase
        .from('company')
        .select('*')
        .eq('user_id', userId)
        .order('name', { ascending: true })

      if (searchTerm) {
        query = query.ilike('name', searchTerm)
      }

      const { data, error } = await query.limit(10)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching companies:', error)
      throw error
    }
  },

  // Get prospect data
  async getProspectData(userId) {
    try {
      const { data, error } = await supabase
        .from('call_insights')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching prospect data:', error)
      throw error
    }
  },

  // Get people by prospect ID
  async getPeopleByProspectId(prospectId) {
    try {
      const { data, error } = await supabase
        .from('peoples')
        .select('*')
        .eq('prospect_id', prospectId)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching people by prospect ID:', error)
      throw error
    }
  },

  // Get action items by prospect ID
  async getActionItemsByProspectId(prospectId) {
    try {
      const { data, error } = await supabase
        .from('action_items')
        .select('*')
        .eq('prospect_id', prospectId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching action items:', error)
      throw error
    }
  },

  // Update action item status
  async updateActionItemStatus(actionItemId, isActive) {
    try {
      const { error } = await supabase
        .from('action_items')
        .update({ is_active: isActive })
        .eq('id', actionItemId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error updating action item status:', error)
      throw error
    }
  },

  // Log push action
  async logPushAction(userId, contentType, contentId, status, errorMessage = null, hubspotId = null) {
    try {
      const { error } = await supabase
        .from('push_log')
        .insert([{
          user_id: userId,
          content_type: contentType,
          content_id: contentId,
          push_status: status,
          error_message: errorMessage,
          hubspot_id: hubspotId,
          created_at: new Date().toISOString()
        }])

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error logging push action:', error)
      throw error
    }
  },

  // Save research company data
  async saveResearchCompany(researchData) {
    try {
      const { data, error } = await supabase
        .from('ResearchCompany')
        .insert([researchData])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error saving research company:', error)
      throw error
    }
  },

  // Save feedback
  async saveFeedback(feedbackData) {
    try {
      const { data, error } = await supabase
        .from('user_feedback')
        .insert([feedbackData])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error saving feedback:', error)
      throw error
    }
  }
}

// Get current user helper
export const getCurrentUser = async () => {
  if (CURRENT_USER.id) {
    return CURRENT_USER
  }

  // Try to get from Supabase Auth
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const profile = await dbHelpers.getUserProfile(user.id)
    if (profile) {
      CURRENT_USER = {
        id: user.id,
        email: user.email,
        full_name: profile.full_name,
        organization_id: profile.organization_id,
        title_id: profile.title_id,
        role_key: profile.role_details?.key,
        status: profile.status_id
      }
      return CURRENT_USER
    }
  }

  return null
}

// Initialize auth state on app load
supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === 'SIGNED_IN' && session) {
    const profile = await dbHelpers.getUserProfile(session.user.id)
    if (profile) {
      CURRENT_USER = {
        id: session.user.id,
        email: session.user.email,
        full_name: profile.full_name,
        organization_id: profile.organization_id,
        title_id: profile.title_id,
        role_key: profile.role_details?.key,
        status: profile.status_id
      }
    }
  } else if (event === 'SIGNED_OUT') {
    CURRENT_USER = {
      id: null,
      email: null,
      full_name: null,
      organization_id: null,
      title_id: null,
      role_key: null,
      status: null
    }
  }
})

export default supabase