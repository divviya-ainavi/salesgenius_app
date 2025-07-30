import { createClient } from '@supabase/supabase-js'
import { fileStorage } from './fileStorage'
import { analytics } from './analytics'
import CryptoJS from 'crypto-js'
import api from './api'
import aiService from '@/services/aiService'
import fileService from '@/services/fileService'
import crmService from '@/services/crmService'
import userManagementService from '@/services/userManagementService'
import { config } from './config'
import { hashPassword } from './authHelpers'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
// console.log(supabaseUrl, "supabase url")
// Password hashing configuration
const ENCRYPTION_SECRET = 'SG_2025'; // In production, use environment variable

// Password hashing helper functions
const hashPassword = (password) => {
  // Use SHA256 with salt for consistent hashing
  const saltedPassword = password + config.passwordSalt;
  return CryptoJS.SHA256(saltedPassword).toString();
};

const verifyPassword = (plainPassword, hashedPassword) => {
  const hashedInput = hashPassword(plainPassword);
  return hashedInput === hashedPassword;
};


export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Helper function to get current authenticated user
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) {
    console.error('Error getting current user:', error);
    return null;
  }
  return user;
};

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

  // Get feedback with pagination and filters
  async getFeedbackWithPagination(params = {}) {
    try {
      const {
        limit = 5,
        offset = 0,
        page_route,
        username,
        from_date,
        to_date
      } = params;

      // Build the base query with joins
      let query = supabase
        .from('user_feedback')
        .select(`
          *,
          user:profiles!user_feedback_user_id_fkey(full_name, email),
          organization:organizations!user_feedback_organization_id_fkey(name)
        `, { count: 'exact' })
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      // Apply server-side filters
      if (page_route && page_route.trim() !== '') {
        query = query.eq('page_route', page_route);
      }

      if (from_date && from_date.trim() !== '') {
        const fromDateTime = new Date(from_date + 'T00:00:00.000Z').toISOString();
        query = query.gte('created_at', fromDateTime);
      }

      if (to_date && to_date.trim() !== '') {
        const toDateTime = new Date(to_date + 'T23:59:59.999Z').toISOString();
        query = query.lte('created_at', toDateTime);
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching feedback:', error);
        throw error;
      }

      let filteredData = data || [];

      // Apply client-side username filtering if provided
      if (username && username.trim() !== '') {
        const searchTerm = username.toLowerCase();
        filteredData = filteredData.filter(item => {
          const fullName = item.user?.full_name?.toLowerCase() || '';
          const email = item.user?.email?.toLowerCase() || '';
          return fullName.includes(searchTerm) || email.includes(searchTerm);
        });
      }

      return {
        data: filteredData,
        total: count || 0,
        hasMore: (offset + limit) < (count || 0)
      };
    } catch (error) {
      console.error('Error in getFeedbackWithPagination:', error);
      throw error;
    }
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
        title_id,
        fireflies_connected,
        timezone,
        language
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
        country,
        city,
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

  // Forgot Password functionality
  async forgotPassword(email) {
    try {
      // Check if user exists
      const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('email', email.toLowerCase())
        .single();

      // Always return success for security (don't reveal if email exists)
      if (userError || !user) {
        console.log('User not found for email:', email);
        return { success: false, message: "Please enter valid email" }; // Generic response
      }

      // Generate secure reset token
      const resetToken = this.generateResetToken(user.id, email);
      const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Store token in database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          reset_token: resetToken,
          reset_token_expires: tokenExpiry.toISOString(),
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error storing reset token:', updateError);
        return { success: false, message: "Something swent wrong" };
        throw updateError;
      }
      // Send reset email via API
      try {
        const formData = new FormData();
        formData.append("email", email.trim() || ""); //
        // Call your email API endpoint
        const emailResponse = await fetch(
          `${config.api.baseUrl}${config.api.endpoints.passwordReset}`,
          {
            method: "POST",
            body: formData,
          }
        );

        if (!emailResponse.ok) {
          console.error("Email API error:", await emailResponse.text());
          // Don't throw error - still return success for security
        }
      } catch (emailError) {
        console.error("Error sending reset email:", emailError);
        // Don't throw error - still return success for security
      }
      return { success: true };
    } catch (error) {
      console.error('Forgot password error:', error);
      return { success: false, message: "Please enter valid email" };
    }
  },

  // Generate secure reset token
  generateResetToken(userId, email) {
    const timestamp = Date.now();
    const randomBytes = Math.random().toString(36).substring(2, 15);
    const payload = {
      userId,
      email,
      timestamp,
      random: randomBytes,
    };

    // Encrypt the payload
    const payloadString = JSON.stringify(payload);
    const encrypted = CryptoJS.AES.encrypt(payloadString, config.jwtSecret).toString();

    // URL-safe base64 encoding
    return btoa(encrypted).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  },

  // Validate reset token
  async validateResetToken(token) {
    try {
      // Decode and decrypt token
      const decoded = this.decryptResetToken(token);
      if (!decoded) {
        return { valid: false, error: 'Invalid token format' };
      }

      // Check if user exists and token matches
      const { data: user, error: userError } = await supabase
        .from('profiles')
        .select('id, email, reset_token, reset_token_expires')
        .eq('id', decoded.userId)
        .eq('email', decoded.email)
        .single();

      if (userError || !user) {
        return { valid: false, error: 'User not found' };
      }

      // Check if token matches
      if (user.reset_token !== token) {
        return { valid: false, error: 'Token mismatch' };
      }

      // Check if token has expired
      const now = new Date();
      const expiry = new Date(user.reset_token_expires);
      if (now > expiry) {
        return { valid: false, error: 'Token expired' };
      }

      return { valid: true, userId: user.id, email: user.email };
    } catch (error) {
      console.error('Token validation error:', error);
      return { valid: false, error: 'Token validation failed' };
    }
  },

  // Decrypt reset token
  decryptResetToken(token) {
    try {
      // Decode from URL-safe base64
      const base64 = token.replace(/-/g, '+').replace(/_/g, '/');
      const padding = base64.length % 4;
      const paddedBase64 = base64 + '='.repeat(padding ? 4 - padding : 0);

      const encrypted = atob(paddedBase64);
      const decrypted = CryptoJS.AES.decrypt(encrypted, config.jwtSecret).toString(CryptoJS.enc.Utf8);

      if (!decrypted) {
        return null;
      }

      const payload = JSON.parse(decrypted);

      // Validate payload structure
      if (!payload.userId || !payload.email || !payload.timestamp) {
        return null;
      }

      return payload;
    } catch (error) {
      console.error('Token decryption error:', error);
      return null;
    }
  },

  // Reset password
  async resetPassword(token, newPassword) {
    try {
      // Validate token first
      const validation = await this.validateResetToken(token);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Hash the new password
      const hashedPassword = this.hashPassword(newPassword);

      // Update password and clear reset token
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          hashed_password: hashedPassword,
          reset_token: null,
          reset_token_expires: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', validation.userId);

      if (updateError) {
        console.error('Error updating password:', updateError);
        return { success: false, error: 'Failed to update password' };
      }

      return { success: true };
    } catch (error) {
      console.error('Reset password error:', error);
      return { success: false, error: 'Password reset failed' };
    }
  },

  // Hash password using existing method
  hashPassword(password) {
    const saltedPassword = password + config.passwordSalt;
    return CryptoJS.SHA256(saltedPassword).toString();
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
    // console.log('Updating user profile:', userId, updates);
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
          // updated_at: new Date().toISOString(),
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

// Feedback operations
export const saveFeedback = async (feedbackData) => {
  try {
    const { data, error } = await supabase
      .from('user_feedback')
      .insert([feedbackData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving feedback:', error);
    throw error;
  }
};

// Get user's own feedback
export const getUserFeedback = async (userId, filters = {}) => {
  try {
    let query = supabase
      .from('user_feedback')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.pageRoute && filters.pageRoute !== 'all') {
      query = query.eq('page_route', filters.pageRoute);
    }

    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }

    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo + 'T23:59:59');
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user feedback:', error);
    throw error;
  }
};

// Get all feedback (Super Admin only)
export const getAllUserFeedback = async (filters = {}) => {
  try {
    let query = supabase
      .from('user_feedback')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.pageRoute && filters.pageRoute !== 'all') {
      query = query.eq('page_route', filters.pageRoute);
    }

    if (filters.username && filters.username.trim()) {
      query = query.ilike('username', `%${filters.username.trim()}%`);
    }

    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }

    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo + 'T23:59:59');
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching all user feedback:', error);
    throw error;
  }
};

export const getFeedbackForAdmin = async (filters = {}) => {
  try {
    let query = supabase
      .from('user_feedback')
      .select(`
        *,
        user:profiles(full_name, email)
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    // Apply filters
    if (filters.pageRoute) {
      query = query.eq('page_route', filters.pageRoute);
    }

    if (filters.username) {
      query = query.ilike('username', `%${filters.username}%`);
    }

    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom);
    }

    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching feedback for admin:', error);
    throw error;
  }
};

// Enhanced authentication helpers that integrate with Supabase Auth
export const supabaseAuthHelpers = {
  // Sign up user in Supabase Auth and sync with profile
  async signUpWithProfile(email, password, profileData) {
    try {
      // Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/setup`,
          data: {
            full_name: profileData.full_name,
            organization_id: profileData.organization_id,
            title_id: profileData.title_id
          }
        }
      })

      if (authError) throw authError

      // Update profile table with Supabase Auth user ID
      if (authData.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            id: authData.user.id, // Use Supabase Auth user ID
            hashed_password: hashPassword(password) // Keep for backward compatibility
          })
          .eq('email', email)

        if (profileError) {
          console.error('Error updating profile with auth ID:', profileError)
          // Don't throw here as auth user is created
        }
      }

      return { success: true, user: authData.user }
    } catch (error) {
      console.error('Error in signUpWithProfile:', error)
      return { success: false, error: error.message }
    }
  },

  // Sign in with Supabase Auth
  async signInWithPassword(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      // Get profile data
      const profile = await this.getUserProfile(data.user.id)
      
      return { 
        success: true, 
        user: data.user, 
        session: data.session,
        profile 
      }
    } catch (error) {
      console.error('Error in signInWithPassword:', error)
      return { success: false, error: error.message }
    }
  },

  // Get user profile with organization details
  async getUserProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          organization_details:organizations(*)
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

  // Forgot password using Supabase Auth
  async forgotPassword(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) throw error

      return { 
        success: true, 
        message: 'Password reset email sent successfully' 
      }
    } catch (error) {
      console.error('Error in forgotPassword:', error)
      return { success: false, error: error.message }
    }
  },

  // Reset password using Supabase Auth
  async resetPassword(newPassword) {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      // Also update the hashed password in profile for backward compatibility
      if (data.user) {
        await supabase
          .from('profiles')
          .update({
            hashed_password: hashPassword(newPassword)
          })
          .eq('id', data.user.id)
      }

      return { success: true, user: data.user }
    } catch (error) {
      console.error('Error in resetPassword:', error)
      return { success: false, error: error.message }
    }
  },

  // Sign out
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Error in signOut:', error)
      return { success: false, error: error.message }
    }
  },

  // Get current session
  async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) throw error
      return session
    } catch (error) {
      console.error('Error getting session:', error)
      return null
    }
  },

  // Check if user is authenticated
  async isAuthenticated() {
    const session = await this.getSession()
    return !!session
  }
}

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

  async saveInternalUploadedFile(userId, file, orgId) {
    try {
      // First, upload file to Supabase Storage
      const timestamp = Date.now()
      const fileExtension = file.name.split('.').pop()
      const uniqueFileName = `${orgId}/${timestamp}_${file.name}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('business-knowledge')
        .upload(uniqueFileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('business-knowledge')
        .getPublicUrl(uniqueFileName)

      // Save file metadata to database
      const { data, error } = await supabase
        .from('business_knowledge_files')
        .insert([{
          uploaded_by: userId,
          filename: uniqueFileName,
          original_filename: file.name,
          // file_type: file.type,
          file_size: file.size,
          content_type: file.type,
          // file_content: content,
          file_url: urlData.publicUrl,
          storage_path: uploadData.path,
          organization_id: orgId,
          // is_processed: false,
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

  async getInternalUploadedFiles(orgId) {
    try {
      const { data, error } = await supabase
        .from('business_knowledge_files')
        .select('*')
        .eq('organization_id', orgId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      // .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching uploaded files:', error)
      throw error
    }
  },

  async updateInternalUploadedFileStatus(id, isActiveValue) {
    try {
      const { data, error } = await supabase
        .from('business_knowledge_files')
        .update({ is_active: isActiveValue })
        .eq('id', id);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating is_active status:', error);
      throw error;
    }
  },

  async updateIsActiveFalseByUploadedId(uploadedId) {
    try {
      // Step 1: Fetch matching documents based on uploaded_id inside metadata
      const { data: docs, error: fetchError } = await supabase
        .from('documents')
        .select('id, metadata')
        .filter('metadata->>file_id', 'eq', uploadedId);

      if (fetchError) throw fetchError;

      if (!docs.length) return [];

      // Step 2: Update is_active to false in each document
      const updatePromises = docs.map(doc => {
        const updatedMetadata = {
          ...doc.metadata,
          is_active: false,
        };

        return supabase
          .from('documents')
          .update({ metadata: updatedMetadata })
          .eq('id', doc.id);
      });

      // Step 3: Wait for all updates
      const results = await Promise.all(updatePromises);

      return results.map(res => res.data).flat();
    } catch (error) {
      console.error('Error updating is_active by uploaded_id:', error);
      throw error;
    }
  },


  async getFilteredFiles(file_id) {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .filter('metadata->>file_id', 'eq', file_id);
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching uploaded files:', error)
      throw error
    }
  },

  async updateIsActiveTrueForMultiple(documentIds) {
    try {
      // Step 1: Fetch metadata for given IDs
      const { data: docs, error: fetchError } = await supabase
        .from('documents')
        .select('id, metadata')
        .in('id', documentIds);

      if (fetchError) throw fetchError;

      // Step 2: Update metadata for each document
      const updatePromises = docs.map(doc => {
        const updatedMetadata = {
          ...doc.metadata,
          is_active: true,
        };

        return supabase
          .from('documents')
          .update({ metadata: updatedMetadata })
          .eq('id', doc.id);
      });

      // Step 3: Wait for all updates
      const updateResults = await Promise.all(updatePromises);

      // Step 4: Return updated document data
      return updateResults.map(result => result.data).flat();
    } catch (error) {
      console.error('Error updating is_active for multiple documents:', error);
      throw error;
    }
  },


  async getFirefliesSingleData(userId, firefliesId) {
    // console.log('Fetching Fireflies file for user:', userId, 'and ID:', firefliesId)
    try {
      const { data, error } = await supabase
        .from('fireflies_files')
        .select('*')
        .eq('user_id', userId)
        .eq('fireflies_id', firefliesId)
        .single(); // because you're expecting one record

      if (error) throw error;
      return data?.sentences || [];
    } catch (error) {
      console.error('Error fetching Fireflies file:', error);
      throw error;
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

  async bulkInsertFirefliesFiles(entries) {
    const { error } = await supabase
      .from("fireflies_files")
      .insert(entries);

    if (error) {
      throw new Error("Failed to insert Fireflies data");
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
        .eq('user_id', userId)
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

  async updateFirefliesFile(fileId, userId, updates) {
    try {
      const { data, error } = await supabase
        .from('fireflies_files')
        .update(updates)
        .eq('fireflies_id', fileId)
        .eq('user_id', userId)
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

  // Fireflies Integration Functions
  async saveUserFirefliesToken(userId, encryptedToken) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          fireflies_encrypted_token: encryptedToken,
          fireflies_connected: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving Fireflies token:', error);
      throw error;
    }
  },

  async deleteUserFirefliesToken(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          fireflies_encrypted_token: null,
          fireflies_connected: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error deleting Fireflies token:', error);
      throw error;
    }
  },

  async getUserFirefliesStatus(userId) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('fireflies_connected, fireflies_encrypted_token')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return {
        connected: data?.fireflies_connected || false,
        hasToken: !!data?.fireflies_encrypted_token
      };
    } catch (error) {
      console.error('Error getting Fireflies status:', error);
      return { connected: false, hasToken: false };
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

  async getRoleIdByTitleName(titleId, organizationId) {
    const { data, error } = await supabase
      .from("titles")
      .select("*")
      .eq("id", titleId)
      .eq("organization_id", organizationId)
      .single(); // ensures we get a single object, not an array

    if (error) {
      console.error("Error fetching role_id from titles:", error);
      throw error;
    }

    return data?.name;
  },

  async updateUserProfile(userId, updates) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: updates.name,
          email: updates.email,
          timezone: updates.timezone,
          language: updates.language
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
  },

  // Update organization location (country and city)
  async updateOrganizationLocation(organizationId, locationData) {
    try {
      const { data, error } = await supabase
        .from("organizations")
        .update({
          country: locationData.country,
          city: locationData.city,
          updated_at: new Date().toISOString(),
        })
        .eq("id", organizationId)
        .select("*")
        .single();

      if (error) {
        console.error("Error updating organization location:", error.message);
        return { success: false, error };
      }

      return { success: true, data };
    } catch (err) {
      console.error("Unexpected error in updateOrganizationLocation:", err);
      return { success: false, error: err };
    }
  },

  async getRoles() {
    try {
      const { data, error } = await supabase
        .from("roles")
        .select("id, key, label, description, is_assignable")
        .order("id", { ascending: true }); // optional ordering

      if (error) {
        throw error;
      }

      return data;
    } catch (err) {
      console.error("Error fetching roles:", err.message);
      return [];
    }
  },
  async getStatus() {
    try {
      const { data, error } = await supabase.from("user_status")
        .select("*")
      // .order("id", { ascending: true }); // optional ordering
      // console.log(data, "check get status data")
      if (error) {
        throw error;
      }

      return data;
    } catch (err) {
      console.error("Error fetching roles:", err.message);
      return [];
    }
  },
  async getTitles(organizationId) {
    try {
      const { data, error } = await supabase
        .from("titles")
        .select("id, name, role_id, organization_id")
        .eq("organization_id", organizationId)
        .order("id", { ascending: true });

      if (error) {
        throw error;
      }

      return data;
    } catch (err) {
      console.error("Error fetching titles:", err.message);
      return [];
    }
  },

  // Get all users if super admin
  async getAllOrganizations() {
    const { data, error } = await supabase
      .from("organizations")
      .select("name, domain, country, city, created_at, status_id, industry_id");

    if (error) throw error;
    return data;
  },

  // Get users for a specific organization (for org admin)
  async getUsersByOrganizationId(orgId) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("organization_id", orgId);

    if (error) throw error;
    return data;
  },

  async inviteUserByEmail(email, organizationId, roleId, token, invitedBy) {
    try {
      const trimmedEmail = email.trim().toLowerCase();
      const now = new Date();

      // Step 1: Check if invite already exists
      const { data: existingInvite, error: fetchError } = await supabase
        .from("invites")
        .select("*")
        .eq("email", trimmedEmail)
        .maybeSingle(); // <-- this is the fix


      if (fetchError && fetchError.code !== "PGRST116") {
        throw fetchError;
      }

      if (!existingInvite) {
        // Step 2: Insert new invite (id will be auto-generated by the DB)
        const { data: inserted, error: insertError } = await supabase
          .from("invites")
          .insert({
            email: trimmedEmail,
            organization_id: organizationId,
            title_id: roleId || null,
            token,
            invited_at: now.toISOString(),
            status: "pending",
            invited_by: invitedBy || null,
          })
          .select("id")
          .single();

        if (insertError) throw insertError;
        return { status: "invited", id: inserted.id };
      } else {

        if (existingInvite.status === "completed") {
          return { status: "registered", id: existingInvite.id };
        }
        const invitedAt = new Date(existingInvite.invited_at);
        const hoursSinceInvite = (now.getTime() - invitedAt.getTime()) / (1000 * 60 * 60);

        if (hoursSinceInvite >= 24) {
          // Step 3: Update token and invited_at
          const { data: updated, error: updateError } = await supabase
            .from("invites")
            .update({
              token,
              invited_at: now.toISOString(),
            })
            .eq("email", trimmedEmail)
            .select("id")
            .single();

          if (updateError) throw updateError;
          return { status: "re-invited", id: updated.id };
        } else {
          return { status: "already-invited", id: existingInvite.id };
        }
      }
    } catch (err) {
      console.error("Error inviting user:", err);
      return { status: "error", message: err.message };
    }
  },
  // Get all companies created by this user
  // async getCompaniesByUserId(userId) {
  //   const { data, error } = await supabase
  //     .from("company")
  //     .select("*")
  //     .eq("user_id", userId);
  //   if (error) throw error;
  //   return data;
  // },

  async getCompaniesByUserId(userId, companySearch = "") {
    let query = supabase
      .from("company")
      .select("*")
      .eq("user_id", userId)
      .order("name", { ascending: true })
      .limit(10);

    if (companySearch.trim()) {
      query = query.ilike("name", `%${companySearch.trim()}%`);
    }

    const { data, error } = await query;
    // console.log(data, "check company data from user id",)
    if (error) throw error;
    return data;
  },

  // Get prospects for a specific company
  async getProspectsByCompanyId(companyId) {
    const { data, error } = await supabase
      .from("prospect")
      .select("*")
      .eq("company_id", companyId);
    if (error) throw error;
    return data;
  },

  // async processSalesCall(userId, organizationId, isFireflies, file, data, company_id, prospect_id) {
  //   // console.log("check response from company", userId, organizationId, isFireflies, file, data, company_id, prospect_id)
  //   const {
  //     company_details = [],
  //     sales_call_prospect = "",
  //     Attendees = [],
  //     call_summary = "",
  //     action_items = [],
  //     sales_insights = [],
  //     communication_styles = [],
  //     call_analysis_overview = {},
  //     extracted_transcript = "",
  //     processing_status = "completed",
  //     recommended_sales_play = "",
  //     recommended_objectives = []
  //   } = data || {};
  //   const companyName = company_details?.[0]?.name;
  //   // console.log(company_details, companyName, "check response from company", data)
  //   // 1. Handle Company
  //   const { data: existingCompany } = await supabase
  //     .from("company")
  //     .select("id")
  //     .eq("name", companyName)
  //     .eq("user_id", userId)
  //     .maybeSingle();

  //   let companyId = company_id;
  //   if (companyId == "" || company_id == "new") {
  //     const { data: newCompany } = await supabase
  //       .from("company")
  //       .insert({ name: companyName, user_id: userId, organization_id: organizationId })
  //       .select("id")
  //       .single();
  //     companyId = newCompany.id;
  //   }
  //   // console.log(sales_call_prospect?.split('_')?.[0], "sales call prospect")
  //   // 2. Handle Prospect
  //   const { data: existingProspect } = await supabase
  //     .from("prospect")
  //     .select("id, calls")
  //     .eq("name", sales_call_prospect?.split('_')?.[0])
  //     .eq("company_id", companyId)
  //     .maybeSingle();

  //   let prospectId;
  //   if (companyId == "" || company_id == "new" || prospect_id == "" || prospect_id == "new") {
  //     const { data: newProspect } = await supabase
  //       .from("prospect")
  //       .insert({
  //         name: sales_call_prospect?.split('_')?.[0],
  //         company_id: companyId,
  //         user_id: userId,
  //         deal_value: null,
  //         calls: 1,
  //         call_summary: call_summary,
  //         sales_play: recommended_sales_play,
  //         secondary_objectives: recommended_objectives
  //       })
  //       .select("id")
  //       .single();
  //     prospectId = newProspect.id;
  //   } else {
  //     prospectId = prospect_id;
  //   }

  //   // 3. Handle People
  //   const peopleIds = [];
  //   for (const person of Attendees) {
  //     const { data: existingPerson } = await supabase
  //       .from("peoples")
  //       .select("id")
  //       .eq("prospect_id", prospectId)
  //       .eq("name", person.name)
  //       .maybeSingle();

  //     if (!existingPerson) {
  //       const { data: newPerson } = await supabase
  //         .from("peoples")
  //         .insert({
  //           name: person.name,
  //           title: person.title,
  //           prospect_id: prospectId,
  //         })
  //         .select("id")
  //         .single();
  //       peopleIds.push(newPerson.id);
  //     } else {
  //       peopleIds.push(existingPerson.id);
  //     }
  //   }

  //   // 4. Handle Action Items
  //   const actionItemIds = [];
  //   for (const item of action_items) {
  //     // const { data: person } = await supabase
  //     //   .from("peoples")
  //     //   .select("id")
  //     //   .eq("name", item.owner)
  //     //   .eq("prospect_id", prospectId)
  //     //   .single();

  //     // const { data: insertedItem } = await supabase
  //     //   .from("action_items")
  //     //   .insert({
  //     //     task: item.task,
  //     //     owner: item.owner,
  //     //     deadline: item.deadline,
  //     //     priority: item.priority,
  //     //     people_id: person?.id,
  //     //   })
  //     //   .select("id")
  //     //   .single();
  //     const { data: person } = await supabase
  //       .from("peoples")
  //       .select("id")
  //       .eq("name", item.owner)
  //       .eq("prospect_id", prospectId)
  //       .maybeSingle();

  //     const { data: insertedItem } = await supabase
  //       .from("action_items")
  //       .insert({
  //         task: item.task,
  //         owner: item.owner,
  //         deadline: item.deadline,
  //         priority: item.priority,
  //         people_id: person?.id || null, // handle null safely
  //       })
  //       .select("id")
  //       .single();

  //     actionItemIds.push(insertedItem.id);
  //   }

  //   // 5. Handle Sales Insights
  //   const salesInsightIds = [];
  //   for (const insight of sales_insights) {
  //     const { data: type } = await supabase
  //       .from("sales_insight_types")
  //       .select("id")
  //       .eq("key", insight.type)
  //       .maybeSingle(); // safer than .single()

  //     if (type) {
  //       const { data: insertedInsight } = await supabase
  //         .from("sales_insights")
  //         .insert({
  //           type_id: type.id,
  //           content: insight.content,
  //           relevance_score: insight.relevance_score,
  //           is_selected: insight.is_selected,
  //           source: insight.source,
  //           timestamp: insight.timestamp,
  //           trend: insight.trend,
  //           speaker: insight.speaker,
  //         })
  //         .select("id")
  //         .single();

  //       salesInsightIds.push(insertedInsight.id);
  //     } else {
  //       console.warn(`Insight type "${insight.type}" not found — skipping insert.`);
  //     }
  //   }

  //   // console.log(call_analysis_overview, "check call analysis overview")
  //   // 6. Handle Call Analysis Overview
  //   const { data: analysis } = await supabase
  //     .from("call_analysis_overview")
  //     .insert({
  //       specific_user: call_analysis_overview?.specific_user,
  //       sentiment_score: call_analysis_overview.sentiment_score,
  //       key_points: call_analysis_overview.key_points,
  //       processing_status: call_analysis_overview.processing_status,
  //       error_message: call_analysis_overview.error_message,
  //     })
  //     .select("id")
  //     .single();
  //   const analysisId = analysis?.id;

  //   // 7. Handle Communication Styles
  //   const communicationStyleIds = [];
  //   for (const style of communication_styles) {
  //     const { data: person } = await supabase
  //       .from("peoples")
  //       .select("id")
  //       .eq("name", style.stakeholder)
  //       .eq("prospect_id", prospectId)
  //       .single();

  //     const { data: insertedStyle } = await supabase
  //       .from("communication_styles")
  //       .insert({
  //         stakeholder: style.stakeholder,
  //         role: style.role,
  //         is_primary: style.is_primary,
  //         style: style.style,
  //         confidence: style.confidence,
  //         evidence: style.evidence,
  //         preferences: style.preferences,
  //         communication_tips: style.communication_tips,
  //         personality_type: style.personality_type,
  //         people_id: person?.id || null,
  //       })
  //       .select("id")
  //       .single();
  //     communicationStyleIds.push(insertedStyle.id);
  //   }

  //   // 8. Final: Insert into Call Insights
  //   const { data: callInsight } = await supabase
  //     .from("insights")
  //     .insert({
  //       prospect_id: prospectId,
  //       peoples_id: peopleIds,
  //       call_summary,
  //       action_item_ids: actionItemIds,
  //       call_analysis_overview_id: analysisId,
  //       sales_insight_ids: salesInsightIds,
  //       extracted_transcript,
  //       processing_status,
  //       communication_style_ids: communicationStyleIds,
  //       user_id: userId,
  //       uploaded_file_id: isFireflies ? null : file.id,
  //       fireflies_id: isFireflies ? file.id : null,
  //       type: isFireflies ? "fireflies" : "file_upload",
  //     })
  //     .select()
  //     .single();

  //   // 9. Update Prospect call count and comm style ids
  //   const { data: insightsCount } = await supabase
  //     .from("insights")
  //     .select("id", { count: "exact" })
  //     .eq("prospect_id", prospectId);

  //   await supabase
  //     .from("prospect")
  //     .update({
  //       calls: insightsCount?.length || 1,
  //       communication_style_ids: communicationStyleIds,
  //     })
  //     .eq("id", prospectId);
  //   // console.log("data will be stored properly")
  //   return {
  //     status: "success",
  //     callInsight
  //   };
  // },

  async processSalesCall(userId, organizationId, isFireflies, file, data, company_id, prospect_id) {
    const {
      company_details = [],
      sales_call_prospect = "",
      Attendees = [],
      call_summary = "",
      action_items = [],
      sales_insights = [],
      communication_styles = [],
      call_analysis_overview = {},
      extracted_transcript = "",
      processing_status = "completed",
      recommended_sales_play = "",
      recommended_objectives = [],
      recommended_objectives_reason = "",
      recommended_sales_play_reason = ""
    } = data || {};
    // console.log(recommended_sales_play,
    //   recommended_objectives,
    //   recommended_objectives_reason,
    //   recommended_sales_play_reason, "check recommended data", data)
    const companyName = company_details?.[0]?.name || "";

    // 1. Handle Company
    let companyId = company_id;
    if (!companyId || company_id === "new") {
      const { data: existingCompany } = await supabase
        .from("company")
        .select("id")
        .eq("name", companyName)
        .eq("user_id", userId)
        .maybeSingle();

      if (existingCompany) {
        companyId = existingCompany.id;
      } else {
        const { data: newCompany } = await supabase
          .from("company")
          .insert({
            name: companyName,
            user_id: userId,
            organization_id: organizationId
          })
          .select("id")
          .single();
        companyId = newCompany.id;
      }
    }

    // 2. Handle Prospect
    const prospectName = sales_call_prospect?.split('_')?.[0] || "";
    let prospectId = prospect_id;

    if (!prospectId || prospect_id === "new") {
      const { data: existingProspect } = await supabase
        .from("prospect")
        .select("id")
        .eq("name", prospectName)
        .eq("company_id", companyId)
        .maybeSingle();

      if (existingProspect) {
        prospectId = existingProspect.id;
      } else {
        const { data: newProspect } = await supabase
          .from("prospect")
          .insert({
            name: prospectName,
            company_id: companyId,
            user_id: userId,
            deal_value: null,
            calls: 1,
          })
          .select("id")
          .single();
        prospectId = newProspect.id;
      }
    }

    // 3. Handle Attendees (People)
    const peopleIds = await Promise.all(Attendees.map(async (person) => {
      const { data: existing } = await supabase
        .from("peoples")
        .select("id")
        .eq("prospect_id", prospectId)
        .eq("name", person.name)
        .maybeSingle();

      if (existing) return existing.id;

      const { data: created } = await supabase
        .from("peoples")
        .insert({
          name: person.name,
          title: person.title,
          prospect_id: prospectId
        })
        .select("id")
        .single();

      return created.id;
    }));

    // 4. Handle Action Items
    const actionItemIds = await Promise.all(action_items.map(async (item) => {
      const { data: owner } = await supabase
        .from("peoples")
        .select("id")
        .eq("name", item.owner)
        .eq("prospect_id", prospectId)
        .maybeSingle();

      const { data: inserted } = await supabase
        .from("action_items")
        .insert({
          task: item.task,
          owner: item.owner,
          deadline: item.deadline,
          priority: item.priority,
          people_id: owner?.id || null
        })
        .select("id")
        .single();

      return inserted.id;
    }));

    // 5. Handle Sales Insights
    const salesInsightIds = (await Promise.all(sales_insights.map(async (insight) => {
      const { data: type } = await supabase
        .from("sales_insight_types")
        .select("id")
        .eq("key", insight.type)
        .maybeSingle();

      if (!type) return null;

      const { data: inserted } = await supabase
        .from("sales_insights")
        .insert({
          type_id: type.id,
          content: insight.content,
          relevance_score: insight.relevance_score,
          is_selected: insight?.is_selected || false,
          source: insight?.source || "Call Transcript",
          timestamp: insight?.timestamp || "",
          trend: insight?.trend || "new",
          speaker: insight.speaker
        })
        .select("id")
        .single();

      return inserted.id;
    }))).filter(Boolean);

    // 6. Handle Call Analysis Overview
    // const { data: analysis } = await supabase
    //   .from("call_analysis_overview")
    //   .insert({
    //     specific_user: call_analysis_overview?.specific_user,
    //     sentiment_score: call_analysis_overview?.sentiment_score,
    //     key_points: call_analysis_overview?.key_points,
    //     processing_status: call_analysis_overview?.processing_status,
    //     error_message: call_analysis_overview?.error_message
    //   })
    //   .select("id")
    //   .single();
    // const analysisId = analysis?.id;

    // 7. Handle Communication Styles
    const communicationStyleIds = await Promise.all(communication_styles.map(async (style) => {
      const { data: person } = await supabase
        .from("peoples")
        .select("id")
        .eq("name", style.stakeholder)
        .eq("prospect_id", prospectId)
        .maybeSingle();

      const { data: inserted } = await supabase
        .from("communication_styles")
        .insert({
          stakeholder: style.stakeholder,
          role: style.role,
          is_primary: style.is_primary,
          style: style.style,
          confidence: style.confidence,
          evidence: style.evidence,
          preferences: style.preferences,
          communication_tips: style.communication_tips,
          personality_type: style.personality_type,
          people_id: person?.id || null
        })
        .select("id")
        .single();

      return inserted.id;
    }));

    // 8. Create Final Insight
    const { data: callInsight } = await supabase
      .from("insights")
      .insert({
        prospect_id: prospectId,
        peoples_id: peopleIds,
        call_summary,
        action_item_ids: actionItemIds,
        call_analysis_overview_id: null,
        sales_insight_ids: salesInsightIds,
        extracted_transcript,
        processing_status: "completed",
        communication_style_ids: communicationStyleIds,
        user_id: userId,
        uploaded_file_id: isFireflies ? null : file?.id,
        fireflies_id: isFireflies ? file?.id : null,
        type: isFireflies ? "fireflies" : "file_upload"
      })
      .select()
      .single();

    // 9. Update Prospect Call Count and Communication Styles
    const { count } = await supabase
      .from("insights")
      .select("id", { count: "exact" })
      .eq("prospect_id", prospectId);

    await supabase
      .from("prospect")
      .update({
        calls: count || 1,
        communication_style_ids: communicationStyleIds,
        call_summary,
        sales_play: recommended_sales_play,
        secondary_objectives: recommended_objectives,
        recommended_objectives_reason: recommended_objectives_reason,
        recommended_sales_play_reason: recommended_sales_play_reason
      })
      .eq("id", prospectId);

    return {
      status: "success",
      callInsight
    };
  },

  async getProspectData(userId) {
    const { data, error } = await supabase
      .from("prospect")
      .select("*, company(id, name)") // ✅ Include company.id and company.name
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data;
  },


  async getCommunicationStylesData(communication_style_ids) {
    const { data, error } = await supabase
      .from("communication_styles")
      .select("*")
      .in("id", communication_style_ids);
    if (error) throw error;
    return data;
  },

  async getPeopleByProspectId(prospectId) {
    const { data, error } = await supabase
      .from("peoples")
      .select("*")
      .eq("prospect_id", prospectId);

    if (error) throw error;
    return data;
  },

  // Get communication styles for a given prospect
  async getCommunicationStylesForProspect(prospectId) {
    const { data: prospect, error } = await supabase
      .from("prospect")
      .select("communication_style_ids")
      .eq("id", prospectId)
      .single();

    if (error || !prospect?.communication_style_ids?.length) return [];

    const { data: styles, error: styleError } = await supabase
      .from("communication_styles")
      .select("*")
      .in("id", prospect.communication_style_ids);

    if (styleError) {
      console.error("Error fetching styles:", styleError);
      return [];
    }

    return styles;
  },

  // Insert new communication styles returned by cumulative-comm API
  async insertCommunicationStyles(commStyles, prospectId) {
    const insertedIds = [];

    for (const style of commStyles) {
      const { data, error } = await supabase
        .from("communication_styles")
        .insert({
          stakeholder: style.stakeholder,
          role: style.role,
          is_primary: style.is_primary === "true",
          style: style.style,
          confidence: style.confidence,
          evidence: style.evidence,
          preferences: style.preferences,
          communication_tips: style.communication_tips,
          personality_type: style.personality_type,
          // prospect_id: prospectId,
        })
        .select()
        .single();

      if (!error && data?.id) {
        insertedIds.push(data.id);
      }
    }

    return insertedIds;
  },

  // Update a prospect with new communication style IDs
  async updateProspectWithNewStyles(prospectId, data) {
    const { error } = await supabase
      .from("prospect")
      .update(data)
      .eq("id", prospectId);

    if (error) {
      console.error("Failed to update prospect:", error);
      throw error;
    }

    return true;
  },

  async getExtractedTranscriptByProspectId(prospectId) {
    try {
      const { data, error } = await supabase
        .from("insights")
        .select("extracted_transcript")
        .eq("prospect_id", prospectId);

      if (error) throw error;

      // Return all transcripts (array) or filter further as needed
      return data.map((item) => item.extracted_transcript);
    } catch (err) {
      console.error("Error fetching transcripts:", err);
      return [];
    }
  },

  async getCallSummaryByProspectId(prospectId) {
    try {
      const { data, error } = await supabase
        .from("insights")
        .select("call_summary")
        .eq("prospect_id", prospectId);

      if (error) throw error;

      // Return all transcripts (array) or filter further as needed
      return data.map((item) => item.call_summary);
    } catch (err) {
      console.error("Error fetching transcripts:", err);
      return [];
    }
  },

  async getTasksAndSalesInsightsByProspectId(prospectId) {
    // 1. Get insight data for the given prospect
    const { data: insightsData, error: insightsError } = await supabase
      .from("insights")
      .select("action_item_ids, sales_insight_ids")
      .eq("prospect_id", prospectId);

    if (insightsError) {
      console.error("Error fetching insight IDs", insightsError);
      return null;
    }

    // Flatten and dedupe all IDs from all insight rows
    const allActionItemIds = insightsData
      .flatMap((entry) => entry.action_item_ids || [])
      .filter((id) => id);

    const allSalesInsightIds = insightsData
      .flatMap((entry) => entry.sales_insight_ids || [])
      .filter((id) => id);

    let tasks = [];
    let contents = [];

    // 2. Get tasks from action_items
    if (allActionItemIds.length > 0) {
      const { data: actionItems, error: actionError } = await supabase
        .from("action_items")
        .select("task")
        .in("id", allActionItemIds);

      if (actionError) {
        console.error("Error fetching action_items", actionError);
        return null;
      }

      tasks = actionItems.map((item) => item.task);
    }

    // 3. Get contents from sales_insights
    if (allSalesInsightIds.length > 0) {
      const { data: salesInsights, error: salesError } = await supabase
        .from("sales_insights")
        .select("content")
        .in("id", allSalesInsightIds)
        .eq("is_active", true);

      if (salesError) {
        console.error("Error fetching sales_insights", salesError);
        return null;
      }

      contents = salesInsights.map((item) => item.content);
    }

    // 4. Return result
    return {
      tasks,
      contents,
    };
  },


  async upsertEmailTemplate(id, inputData) {
    try {
      let query = await supabase
        .from("email_templates");

      if (id) {
        // UPDATE existing record
        const { data, error } = await query
          .update(inputData)
          .eq("id", id)
          .select()
          .single();

        if (error) {
          console.error("Error updating deck_prompt:", error.message);
          return null;
        }

        return data;
      } else {
        // INSERT new record
        const { data, error } = await query
          .insert([inputData])
          .select()
          .single();

        if (error) {
          console.error("Error inserting deck_prompt:", error.message);
          return null;
        }

        return data;
      }
    } catch (err) {
      console.error("Unexpected error in upsertDeckPrompt:", err);
      return null;
    }
  },

  async upsertDeckPrompt(id, inputData) {
    try {
      let query = await supabase
        .from("presentation_prompt");

      if (id) {
        // UPDATE existing record
        const { data, error } = await query
          .update(inputData)
          .eq("id", id)
          .select()
          .single();

        if (error) {
          console.error("Error updating deck_prompt:", error.message);
          return null;
        }

        return data;
      } else {
        // INSERT new record
        const { data, error } = await query
          .insert([inputData])
          .select()
          .single();

        if (error) {
          console.error("Error inserting deck_prompt:", error.message);
          return null;
        }

        return data;
      }
    } catch (err) {
      console.error("Unexpected error in upsertDeckPrompt:", err);
      return null;
    }
  },

  // async getSalesInsightsByProspectId(prospectId) {
  //   console.log("called get sales insights 1647")
  //   // Step 1: Get all insights for the given prospect_id
  //   const { data: insightsData, error: insightsError } = await supabase
  //     .from("insights")
  //     .select("sales_insight_ids")
  //     .eq("prospect_id", prospectId);
  //   console.log(insightsData, "get insights data in supabase", insightsError)
  //   if (insightsError) {
  //     console.error("Error fetching insights", insightsError);
  //     return null;
  //   }

  //   // Collect all sales_insight_ids from all matching rows
  //   const allInsightIds = insightsData
  //     ?.flatMap((entry) => entry.sales_insight_ids || [])
  //     .filter((id) => id); // remove null/undefined

  //   if (!allInsightIds.length) return [];

  //   // Step 2: Get full sales insights data
  //   const { data: salesInsights, error: insightsDetailError } = await supabase
  //     .from("sales_insights")
  //     .select("*, type_id")
  //     .in("id", allInsightIds);

  //   if (insightsDetailError) {
  //     console.error("Error fetching sales insights", insightsDetailError);
  //     return null;
  //   }
  //   console.log(salesInsights, "get sales insights from 1832")
  //   // Step 3: Fetch all sales insight types
  //   const { data: insightTypes, error: typeError } = await supabase
  //     .from("sales_insight_types")
  //     .select("id, key");

  //   if (typeError) {
  //     console.error("Error fetching insight types", typeError);
  //     return null;
  //   }
  //   console.log(insightTypes, "insight types 1842")
  //   // Step 4: Group insights by type
  //   const grouped = {};
  //   for (const insight of salesInsights) {
  //     const typeKey =
  //       insightTypes.find((t) => t.id === insight.type_id)?.key ||
  //       "my_insights";
  //     console.log(typeKey, "1849")
  //     if (!grouped[typeKey]) grouped[typeKey] = [];

  //     grouped[typeKey].push(insight);
  //   }

  //   // Step 5: Prepare final sorted result
  //   const result = Object.entries(grouped).map(([type, insights]) => {
  //     const average =
  //       insights.reduce((sum, i) => sum + (i.relevance_score || 0), 0) /
  //       insights.length;
  //     return {
  //       type,
  //       average_score: Number(average.toFixed(2)),
  //       insights,
  //     };
  //   });

  //   return result.sort((a, b) => b.average_score - a.average_score);
  // },

  async getSalesInsightsByProspectId(prospectId) {
    // console.log("called get sales insights");

    // Step 1: Get all insights for the given prospect_id
    const { data: insightsData, error: insightsError } = await supabase
      .from("insights")
      .select("sales_insight_ids")
      .eq("prospect_id", prospectId);

    if (insightsError) {
      console.error("Error fetching insights", insightsError);
      return null;
    }

    const allInsightIds = insightsData
      .flatMap((entry) => entry.sales_insight_ids || [])
      .filter((id) => id);

    // Step 2: Get all insight types
    const { data: insightTypes, error: typeError } = await supabase
      .from("sales_insight_types")
      .select("id, key");

    if (typeError) {
      console.error("Error fetching insight types", typeError);
      return null;
    }

    const typeMap = Object.fromEntries(insightTypes.map((t) => [t.id, t.key]));

    // Step 3: Get full insights if any
    let salesInsights = [];
    if (allInsightIds.length > 0) {
      const { data: insightsData, error: insightsDetailError } = await supabase
        .from("sales_insights")
        .select("*, type_id")
        .in("id", allInsightIds)
        .eq("is_active", true);

      if (insightsDetailError) {
        console.error("Error fetching sales insights", insightsDetailError);
        return null;
      }
      salesInsights = insightsData;
    }

    // Step 4: Group all types, even if no insights present
    const grouped = {};
    for (const type of insightTypes) {
      grouped[type.key] = []; // initialize all
    }

    for (const insight of salesInsights) {
      const typeKey = typeMap[insight.type_id] || "my_insights";
      grouped[typeKey].push(insight);
    }

    // Step 5: Prepare full results (with average score)
    const computed = Object.entries(grouped).map(([type, insights]) => {
      const average =
        insights.reduce((sum, i) => sum + (i.relevance_score || 0), 0) /
        (insights.length || 1); // avoid NaN

      const typeId = insightTypes.find((t) => t.key === type)?.id || null;

      return {
        type,
        type_id: typeId,
        average_score: Number(average.toFixed(2)),
        insights,
      };
    });

    // Step 6: Get prospect priority list
    const { data: prospectData, error: prospectError } = await supabase
      .from("prospect")
      .select("sales_insight_priority_list")
      .eq("id", prospectId)
      .single();

    if (prospectError) {
      console.error("Error fetching prospect priority list:", prospectError);
      return null;
    }

    let sortedResults = [];
    // console.log(prospectData, Array.isArray(prospectData?.sales_insight_priority_list), "check prospect data 1956")
    if (
      Array.isArray(prospectData?.sales_insight_priority_list) &&
      prospectData.sales_insight_priority_list.length > 0
    ) {
      // console.log("1961")
      const parsedPriorityList = prospectData.sales_insight_priority_list.map((item) =>
        typeof item === "string" ? JSON.parse(item) : item
      );
      const priorityMap = Object.fromEntries(
        parsedPriorityList.map((item) => [item.type_id, item.priority])
      );
      // console.log(priorityMap, "check priority map 1965")
      sortedResults = [...computed].sort((a, b) => {
        const aPriority = priorityMap[a.type_id] || Infinity;
        const bPriority = priorityMap[b.type_id] || Infinity;
        return aPriority - bPriority;
      });
    } else {
      sortedResults = [...computed].sort((a, b) => b.average_score - a.average_score);

      const priorityList = sortedResults.map((item, index) => ({
        type_id: item.type_id,
        priority: index + 1,
        average_score: item.average_score,
      }));

      const { error: updateError } = await supabase
        .from("prospect")
        .update({ sales_insight_priority_list: priorityList })
        .eq("id", prospectId);

      if (updateError) {
        console.error("Error updating sales_insight_priority_list:", updateError);
      }
    }

    return sortedResults;
  },

  async updateSalesInsightContent(id, newContent) {
    try {
      const { data, error } = await supabase
        .from("sales_insights")
        .update({ content: newContent })
        .eq("id", id)
        .eq("is_active", true)
        .select()
        .single();


      if (error) {
        console.error("Error updating sales_insight content:", error);
        return null;
      }

      return data;
    } catch (err) {
      console.error("Unexpected error:", err);
      return null;
    }
  },

  async updateSalesInsightPriorityList(prospectId, updatedPriorityList) {
    try {
      const { error } = await supabase
        .from("prospect")
        .update({ sales_insight_priority_list: updatedPriorityList })
        .eq("id", prospectId)
        .select() // 👈 This ensures the updated data is returned
        .single();

      if (error) {
        console.error("Failed to update sales_insight_priority_list:", error);
        return false;
      }

      return true;
    } catch (err) {
      console.error("Unexpected error updating priority list:", err);
      return false;
    }
  },

  async getSalesInsightPriorityList(prospectId) {
    try {
      const { data, error } = await supabase
        .from("prospect")
        .select("sales_insight_priority_list")
        .eq("id", prospectId)
        .single();

      if (error) {
        console.error("Failed to fetch sales_insight_priority_list:", error);
        return null;
      }

      return data.sales_insight_priority_list || [];
    } catch (err) {
      console.error("Unexpected error fetching priority list:", err);
      return null;
    }
  },

  async getSalesInsightTypes() {
    const { data, error } = await supabase.from("sales_insight_types").select("*");
    if (error) {
      console.error("Error fetching sales_insight_types:", error);
      return [];
    }
    return data;
  },

  async getCommunicationStyleTypes() {
    const { data, error } = await supabase.from("communication_style_type").select("*");
    if (error) {
      console.error("Error fetching sales_insight_types:", error);
      return [];
    }
    return data;
  },

  async insertSalesInsight(insight) {
    const { data, error } = await supabase
      .from("sales_insights")
      .insert([insight])
      .select()
      .single()

    if (error) {
      console.error("Insert error:", error.message);
      return null;
    }
    return data;
  },

  async getProspectSummary(prospectId) {
    const { data, error } = await supabase
      .from("prospect")
      .select("call_summary")
      .eq("id", prospectId)
      .single(); // assuming prospectId is unique
    if (error) {
      console.error("Supabase get prospect summary error:", error);
      throw error;
    }

    return data;
  },

  async deleteSalesInsightContent(insightId, updateFields = {}) {
    const { data, error } = await supabase
      .from("sales_insights")
      .update(updateFields)
      .eq("id", insightId)
      .select()
      .single();

    if (error) {
      console.error("Supabase deleteSalesInsightContent error:", error);
      throw error;
    }

    return data;
  },


  // Add this inside your dbHelpers or utils file
  async updateInsightWithNewSalesInsightId(prospectId, salesInsightId) {
    if (!prospectId || !salesInsightId) return;

    // Step 1: Fetch the latest insights row for this prospect
    const { data: recentInsight, error: fetchError } = await supabase
      .from("insights")
      .select("*")
      .eq("prospect_id", prospectId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !recentInsight) {
      console.warn("No insights found to update:", fetchError);
      return;
    }

    const existingIds = Array.isArray(recentInsight.sales_insight_ids)
      ? recentInsight.sales_insight_ids
      : [];

    // Step 2: Merge and deduplicate IDs
    const updatedIds = [...new Set([...existingIds, salesInsightId])];

    // Step 3: Update the insight row
    const { error: updateError } = await supabase
      .from("insights")
      .update({ sales_insight_ids: updatedIds })
      .eq("id", recentInsight.id);

    if (updateError) {
      console.error("Failed to update communication_style_ids:", updateError);
      throw updateError;
    }

    return true;
  },

  // Update action item status (active/inactive)
  updateActionItemStatus: async (actionItemId, isActive = true) => {
    try {
      const { data, error } = await supabase
        .from('action_items')
        .update({ is_active: isActive })
        .eq('id', actionItemId);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating action item status:', error);
      throw error;
    }
  },

  async updateCommunicationStyleRole(styleId, newRole, prospectId) {
    try {
      // Step 1: Get the current communication style entry (to get the name)
      const { data: styleData, error: fetchError } = await supabase
        .from("communication_styles")
        .select("stakeholder")
        .eq("id", styleId)
        .single();

      if (fetchError) throw fetchError;
      const name = styleData?.stakeholder;

      // Step 2: Update the communication_styles table with new role
      const { data: updatedStyle, error: updateError } = await supabase
        .from("communication_styles")
        .update({ role: newRole })
        .eq("id", styleId);

      if (updateError) throw updateError;

      // Step 3: Update the peoples table (title) where name and prospect_id match
      const { data: updatedPeople, error: peopleError } = await supabase
        .from("peoples")
        .update({ title: newRole })
        .eq("name", name)
        .eq("prospect_id", prospectId);

      if (peopleError) throw peopleError;

      // console.log("Updated peoples:", updatedPeople);
      return updatedStyle;
    } catch (error) {
      console.error("Error updating communication style role and peoples title:", error);
      throw error;
    }
  },


  async getActionItemsByProspectId(prospectId) {
    try {
      // Step 1: Fetch all action_item_ids from insights table for the prospect
      const { data: insightRows, error: insightsError } = await supabase
        .from("insights")
        .select("action_item_ids")
        .eq("prospect_id", prospectId);

      if (insightsError) {
        console.error("Error fetching insights:", insightsError.message);
        return [];
      }

      // Step 2: Flatten all action_item_ids across rows
      const allActionItemIds = insightRows
        .flatMap((row) => row.action_item_ids || [])
        .filter(Boolean);

      if (allActionItemIds.length === 0) {
        return [];
      }

      // Step 3: Fetch action item details using the IDs
      const { data: actionItems, error: actionItemsError } = await supabase
        .from("action_items")
        .select("*")
        .eq("is_active", true)
        .in("id", allActionItemIds);

      if (actionItemsError) {
        console.error("Error fetching action items:", actionItemsError.message);
        return [];
      }

      return actionItems;
    } catch (err) {
      console.error("Unexpected error in getActionItemsByProspectId:", err);
      return [];
    }
  },

  async updateCompanyName(companyId, newName) {
    const { data, error } = await supabase
      .from("company")
      .update({ name: newName })
      .eq("id", companyId)
      .select(); // optional: remove if you don't need the updated row

    if (error) {
      console.error("Error updating company name:", error);
      throw error;
    }

    return data;
  },
  async getInsightsByUserId(userId) {
    if (!userId) {
      console.error("User ID is required to fetch insights.");
      return [];
    }

    const { data, error } = await supabase
      .from("insights")
      .select(`
      *,
      prospect:prospect_id (
        id,
        name,
        company_id,
        company:company_id (
          id,
          name
        )
      )
    `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching insights with joins:", error.message);
      return [];
    }

    return data;
  },

  saveFeedback,
  getUserFeedback,
  getAllUserFeedback,
  getFeedbackForAdmin,
}

// User helpers for backward compatibility
export const userHelpers = {
  getCurrentUser: () => CURRENT_USER,
  isAuthenticated: authHelpers.isAuthenticated,
  signOut: authHelpers.signOut,
}