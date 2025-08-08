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

  // Enhanced error handler for Supabase operations
  handleSupabaseError: (error, operation = 'unknown') => {
    console.error(`Supabase ${operation} error:`, error);
    
    // Check for token expiry related errors
    const isTokenExpired = 
      error?.message?.includes('JWT') ||
      error?.message?.includes('expired') ||
      error?.message?.includes('invalid') ||
      error?.code === 'PGRST301' ||
      error?.code === 'PGRST302';
    
    if (isTokenExpired) {
      console.log("🔄 Token expired detected, triggering auto-logout");
      // Trigger auto-logout
      if (window.handleAutoLogout) {
        window.handleAutoLogout();
      } else {
        // Fallback if global handler not available
        window.location.href = '/auth/login';
      }
    }
    
    return error;
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
  async