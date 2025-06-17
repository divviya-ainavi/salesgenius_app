import { supabase } from '@/lib/supabase';
import { analytics } from '@/lib/analytics';

// User Management Service for handling all user-related operations
class UserManagementService {
  // ============================================
  // ROLES API
  // ============================================
  
  async getRoles(params = {}) {
    try {
      const query = supabase
        .from('roles')
        .select('*');
      
      // Apply filters if provided
      if (params.isAssignable !== undefined) {
        query.eq('is_assignable', params.isAssignable);
      }
      
      // Apply pagination
      if (params.limit) {
        query.limit(params.limit);
      }
      
      if (params.offset) {
        query.range(params.offset, params.offset + (params.limit || 10) - 1);
      }
      
      // Apply sorting
      const sortBy = params.sortBy || 'id';
      const sortOrder = params.sortOrder || { ascending: true };
      query.order(sortBy, sortOrder);
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      analytics.track('roles_fetched', {
        count: data.length,
        filters: Object.keys(params),
      });
      
      return data || [];
    } catch (error) {
      analytics.track('roles_fetch_failed', { error: error.message });
      console.error('Error fetching roles:', error);
      throw error;
    }
  }
  
  async getRoleById(id) {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      analytics.track('role_fetched', { role_id: id });
      
      return data;
    } catch (error) {
      analytics.track('role_fetch_failed', { role_id: id, error: error.message });
      console.error('Error fetching role by ID:', error);
      throw error;
    }
  }
  
  async createRole(roleData) {
    try {
      const { data, error } = await supabase
        .from('roles')
        .insert([{
          key: roleData.key,
          label: roleData.label,
          description: roleData.description,
          is_assignable: roleData.isAssignable !== false,
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      analytics.track('role_created', {
        role_key: roleData.key,
        role_label: roleData.label,
      });
      
      return data;
    } catch (error) {
      analytics.track('role_creation_failed', {
        role_key: roleData.key,
        error: error.message,
      });
      console.error('Error creating role:', error);
      throw error;
    }
  }
  
  async updateRole(id, updates) {
    try {
      const { data, error } = await supabase
        .from('roles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      analytics.track('role_updated', {
        role_id: id,
        updated_fields: Object.keys(updates),
      });
      
      return data;
    } catch (error) {
      analytics.track('role_update_failed', {
        role_id: id,
        error: error.message,
      });
      console.error('Error updating role:', error);
      throw error;
    }
  }
  
  async deleteRole(id) {
    try {
      const { error } = await supabase
        .from('roles')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      analytics.track('role_deleted', { role_id: id });
      
      return true;
    } catch (error) {
      analytics.track('role_deletion_failed', {
        role_id: id,
        error: error.message,
      });
      console.error('Error deleting role:', error);
      throw error;
    }
  }
  
  // ============================================
  // USER STATUS API
  // ============================================
  
  async getUserStatuses() {
    try {
      const { data, error } = await supabase
        .from('user_status')
        .select('*')
        .order('key', { ascending: true });
      
      if (error) throw error;
      
      analytics.track('user_statuses_fetched', {
        count: data.length,
      });
      
      return data || [];
    } catch (error) {
      analytics.track('user_statuses_fetch_failed', { error: error.message });
      console.error('Error fetching user statuses:', error);
      throw error;
    }
  }
  
  async getUserStatusByKey(key) {
    try {
      const { data, error } = await supabase
        .from('user_status')
        .select('*')
        .eq('key', key)
        .single();
      
      if (error) throw error;
      
      return data;
    } catch (error) {
      console.error('Error fetching user status by key:', error);
      throw error;
    }
  }
  
  // ============================================
  // ORGANIZATIONS API
  // ============================================
  
  async getOrganizations(params = {}) {
    try {
      const query = supabase
        .from('organizations')
        .select('*');
      
      // Apply filters if provided
      if (params.industry) {
        query.eq('industry', params.industry);
      }
      
      if (params.companySize) {
        query.eq('company_size', params.companySize);
      }
      
      // Apply pagination
      if (params.limit) {
        query.limit(params.limit);
      }
      
      if (params.offset) {
        query.range(params.offset, params.offset + (params.limit || 10) - 1);
      }
      
      // Apply sorting
      const sortBy = params.sortBy || 'name';
      const sortOrder = params.sortOrder || { ascending: true };
      query.order(sortBy, sortOrder);
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      analytics.track('organizations_fetched', {
        count: data.length,
        filters: Object.keys(params),
      });
      
      return data || [];
    } catch (error) {
      analytics.track('organizations_fetch_failed', { error: error.message });
      console.error('Error fetching organizations:', error);
      throw error;
    }
  }
  
  async getOrganizationById(id) {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      analytics.track('organization_fetched', { org_id: id });
      
      return data;
    } catch (error) {
      analytics.track('organization_fetch_failed', {
        org_id: id,
        error: error.message,
      });
      console.error('Error fetching organization by ID:', error);
      throw error;
    }
  }
  
  async createOrganization(orgData) {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .insert([{
          name: orgData.name,
          domain: orgData.domain,
          industry: orgData.industry,
          company_size: orgData.companySize,
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      analytics.track('organization_created', {
        org_name: orgData.name,
        org_domain: orgData.domain,
      });
      
      return data;
    } catch (error) {
      analytics.track('organization_creation_failed', {
        org_name: orgData.name,
        error: error.message,
      });
      console.error('Error creating organization:', error);
      throw error;
    }
  }
  
  async updateOrganization(id, updates) {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      analytics.track('organization_updated', {
        org_id: id,
        updated_fields: Object.keys(updates),
      });
      
      return data;
    } catch (error) {
      analytics.track('organization_update_failed', {
        org_id: id,
        error: error.message,
      });
      console.error('Error updating organization:', error);
      throw error;
    }
  }
  
  async deleteOrganization(id) {
    try {
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      analytics.track('organization_deleted', { org_id: id });
      
      return true;
    } catch (error) {
      analytics.track('organization_deletion_failed', {
        org_id: id,
        error: error.message,
      });
      console.error('Error deleting organization:', error);
      throw error;
    }
  }
  
  async getUsersByOrganization(organizationId, params = {}) {
    try {
      const query = supabase
        .from('profiles')
        .select('*')
        .eq('organization_id', organizationId);
      
      // Apply filters if provided
      if (params.roleId) {
        query.eq('role_id', params.roleId);
      }
      
      if (params.status) {
        query.eq('status', params.status);
      }
      
      // Apply pagination
      if (params.limit) {
        query.limit(params.limit);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return data || [];
    } catch (error) {
      console.error('Error fetching users by organization:', error);
      throw error;
    }
  }
  
  // ============================================
  // PROFILES API
  // ============================================
  
  async getProfiles(params = {}) {
    try {
      const query = supabase
        .from('profiles')
        .select('*');
      
      // Apply filters if provided
      if (params.organizationId) {
        query.eq('organization_id', params.organizationId);
      }
      
      if (params.roleId) {
        query.eq('role_id', params.roleId);
      }
      
      if (params.status) {
        query.eq('status', params.status);
      }
      
      // Apply pagination
      if (params.limit) {
        query.limit(params.limit);
      }
      
      if (params.offset) {
        query.range(params.offset, params.offset + (params.limit || 10) - 1);
      }
      
      // Apply sorting
      const sortBy = params.sortBy || 'full_name';
      const sortOrder = params.sortOrder || { ascending: true };
      query.order(sortBy, sortOrder);
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      analytics.track('profiles_fetched', {
        count: data.length,
        filters: Object.keys(params),
      });
      
      return data || [];
    } catch (error) {
      analytics.track('profiles_fetch_failed', { error: error.message });
      console.error('Error fetching profiles:', error);
      throw error;
    }
  }
  
  async getProfileById(id) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      analytics.track('profile_fetched', { profile_id: id });
      
      return data;
    } catch (error) {
      analytics.track('profile_fetch_failed', {
        profile_id: id,
        error: error.message,
      });
      console.error('Error fetching profile by ID:', error);
      throw error;
    }
  }
  
  async createProfile(profileData) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert([{
          id: profileData.id,
          full_name: profileData.fullName,
          email: profileData.email,
          role_id: profileData.roleId,
          organization_id: profileData.organizationId,
          status: profileData.status || 'active',
          timezone: profileData.timezone || 'UTC',
          language: profileData.language || 'en',
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      analytics.track('profile_created', {
        profile_id: profileData.id,
        role_id: profileData.roleId,
        organization_id: profileData.organizationId,
      });
      
      return data;
    } catch (error) {
      analytics.track('profile_creation_failed', {
        profile_id: profileData.id,
        error: error.message,
      });
      console.error('Error creating profile:', error);
      throw error;
    }
  }
  
  async updateProfile(id, updates) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      analytics.track('profile_updated', {
        profile_id: id,
        updated_fields: Object.keys(updates),
      });
      
      return data;
    } catch (error) {
      analytics.track('profile_update_failed', {
        profile_id: id,
        error: error.message,
      });
      console.error('Error updating profile:', error);
      throw error;
    }
  }
  
  async updateProfileRole(id, roleId) {
    return this.updateProfile(id, { role_id: roleId });
  }
  
  async updateProfileStatus(id, status) {
    return this.updateProfile(id, { status });
  }
  
  async deleteProfile(id) {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      analytics.track('profile_deleted', { profile_id: id });
      
      return true;
    } catch (error) {
      analytics.track('profile_deletion_failed', {
        profile_id: id,
        error: error.message,
      });
      console.error('Error deleting profile:', error);
      throw error;
    }
  }
  
  // ============================================
  // INVITES API
  // ============================================
  
  async getInvites(params = {}) {
    try {
      const query = supabase
        .from('invites')
        .select('*');
      
      // Apply filters if provided
      if (params.organizationId) {
        query.eq('organization_id', params.organizationId);
      }
      
      if (params.roleId) {
        query.eq('role_id', params.roleId);
      }
      
      if (params.status) {
        if (params.status === 'pending') {
          query.is('accepted_at', null);
        } else if (params.status === 'accepted') {
          query.not('accepted_at', 'is', null);
        } else if (params.status === 'expired') {
          query.lt('expires_at', new Date().toISOString());
        }
      }
      
      // Apply pagination
      if (params.limit) {
        query.limit(params.limit);
      }
      
      // Apply sorting
      query.order('invited_at', { ascending: false });
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      analytics.track('invites_fetched', {
        count: data.length,
        filters: Object.keys(params),
      });
      
      return data || [];
    } catch (error) {
      analytics.track('invites_fetch_failed', { error: error.message });
      console.error('Error fetching invites:', error);
      throw error;
    }
  }
  
  async sendInvite(inviteData) {
    try {
      const { data, error } = await supabase
        .from('invites')
        .insert([{
          email: inviteData.email,
          organization_id: inviteData.organizationId,
          role_id: inviteData.roleId,
          invited_at: new Date().toISOString(),
          expires_at: inviteData.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          created_by: inviteData.invitedBy || inviteData.createdBy,
        }])
        .select()
        .single();
      
      if (error) throw error;
      
      analytics.track('invite_sent', {
        email: inviteData.email,
        organization_id: inviteData.organizationId,
        role_id: inviteData.roleId,
      });
      
      return data;
    } catch (error) {
      analytics.track('invite_send_failed', {
        email: inviteData.email,
        error: error.message,
      });
      console.error('Error sending invite:', error);
      throw error;
    }
  }
  
  async deleteInvite(email) {
    try {
      const { error } = await supabase
        .from('invites')
        .delete()
        .eq('email', email);
      
      if (error) throw error;
      
      analytics.track('invite_deleted', { email });
      
      return true;
    } catch (error) {
      analytics.track('invite_deletion_failed', {
        email,
        error: error.message,
      });
      console.error('Error deleting invite:', error);
      throw error;
    }
  }
  
  async resendInvite(email) {
    try {
      const { data, error } = await supabase
        .from('invites')
        .update({
          invited_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq('email', email)
        .select()
        .single();
      
      if (error) throw error;
      
      analytics.track('invite_resent', { email });
      
      return data;
    } catch (error) {
      analytics.track('invite_resend_failed', {
        email,
        error: error.message,
      });
      console.error('Error resending invite:', error);
      throw error;
    }
  }
  
  // ============================================
  // SEARCH API
  // ============================================
  
  async search(query, entities = ['profiles', 'organizations', 'invites']) {
    try {
      const results = [];
      
      // Search profiles
      if (entities.includes('profiles')) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`);
        
        if (profilesError) throw profilesError;
        
        if (profilesData) {
          results.push(...profilesData.map(profile => ({
            ...profile,
            entityType: 'profile'
          })));
        }
      }
      
      // Search organizations
      if (entities.includes('organizations')) {
        const { data: orgsData, error: orgsError } = await supabase
          .from('organizations')
          .select('*')
          .or(`name.ilike.%${query}%,domain.ilike.%${query}%,industry.ilike.%${query}%`);
        
        if (orgsError) throw orgsError;
        
        if (orgsData) {
          results.push(...orgsData.map(org => ({
            ...org,
            entityType: 'organization'
          })));
        }
      }
      
      // Search invites
      if (entities.includes('invites')) {
        const { data: invitesData, error: invitesError } = await supabase
          .from('invites')
          .select('*')
          .ilike('email', `%${query}%`);
        
        if (invitesError) throw invitesError;
        
        if (invitesData) {
          results.push(...invitesData.map(invite => ({
            ...invite,
            entityType: 'invite'
          })));
        }
      }
      
      analytics.track('search_performed', {
        query,
        entities,
        results_count: results.length,
      });
      
      return results;
    } catch (error) {
      analytics.track('search_failed', {
        query,
        entities,
        error: error.message,
      });
      console.error('Error performing search:', error);
      throw error;
    }
  }
}

// Create and export singleton instance
const userManagementService = new UserManagementService();
export default userManagementService;