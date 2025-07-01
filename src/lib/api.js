import { useState, useCallback } from 'react';
import { useAnalytics } from '../hooks/useAnalytics.js';
import { supabase } from '@/lib/supabase.js';

// Custom hook for user management operations
export const useUserManagement = () => {
  // Roles management hook
  const useRoles = () => {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { trackFeatureUsage } = useAnalytics();

    const fetchRoles = useCallback(async (params = {}) => {
      setLoading(true);
      setError(null);

      try {
        trackFeatureUsage('user_management', 'fetch_roles');
        
        // Query roles table
        const { data, error } = await supabase
          .from('roles')
          .select('*')
          .order('id', { ascending: true });

        if (error) throw error;

        setRoles(data || []);
        return data;
      } catch (err) {
        console.error('Error fetching roles:', err);
        setError(err);
        trackFeatureUsage('user_management', 'fetch_roles_error', { error: err.message });
        throw err;
      } finally {
        setLoading(false);
      }
    }, [trackFeatureUsage]);

    const getRoleById = useCallback(async (id) => {
      try {
        const { data, error } = await supabase
          .from('roles')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        return data;
      } catch (err) {
        console.error('Error fetching role by ID:', err);
        throw err;
      }
    }, []);

    const createRole = useCallback(async (roleData) => {
      setLoading(true);
      setError(null);

      try {
        trackFeatureUsage('user_management', 'create_role');
        
        const { data, error } = await supabase
          .from('roles')
          .insert([{
            key: roleData.key,
            label: roleData.label,
            description: roleData.description,
            is_assignable: roleData.isAssignable !== false
          }])
          .select()
          .single();

        if (error) throw error;

        setRoles(prev => [...prev, data]);
        return data;
      } catch (err) {
        console.error('Error creating role:', err);
        setError(err);
        trackFeatureUsage('user_management', 'create_role_error', { error: err.message });
        throw err;
      } finally {
        setLoading(false);
      }
    }, [trackFeatureUsage]);

    const updateRole = useCallback(async (id, updates) => {
      setLoading(true);
      setError(null);

      try {
        trackFeatureUsage('user_management', 'update_role');
        
        const { data, error } = await supabase
          .from('roles')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        setRoles(prev => prev.map(role => 
          role.id === id ? data : role
        ));
        
        return data;
      } catch (err) {
        console.error('Error updating role:', err);
        setError(err);
        trackFeatureUsage('user_management', 'update_role_error', { error: err.message });
        throw err;
      } finally {
        setLoading(false);
      }
    }, [trackFeatureUsage]);

    const deleteRole = useCallback(async (id) => {
      setLoading(true);
      setError(null);

      try {
        trackFeatureUsage('user_management', 'delete_role');
        
        const { error } = await supabase
          .from('roles')
          .delete()
          .eq('id', id);

        if (error) throw error;

        setRoles(prev => prev.filter(role => role.id !== id));
        return true;
      } catch (err) {
        console.error('Error deleting role:', err);
        setError(err);
        trackFeatureUsage('user_management', 'delete_role_error', { error: err.message });
        throw err;
      } finally {
        setLoading(false);
      }
    }, [trackFeatureUsage]);

    return {
      roles,
      loading,
      error,
      fetchRoles,
      getRoleById,
      createRole,
      updateRole,
      deleteRole
    };
  };

  // Organizations management hook
  const useOrganizations = () => {
    const [organizations, setOrganizations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { trackFeatureUsage } = useAnalytics();

    const fetchOrganizations = useCallback(async (params = {}) => {
      setLoading(true);
      setError(null);

      try {
        trackFeatureUsage('user_management', 'fetch_organizations');
        
        // Query organizations table
        const { data, error } = await supabase
          .from('organizations')
          .select('*')
          .order('name', { ascending: true });

        if (error) throw error;

        setOrganizations(data || []);
        return data;
      } catch (err) {
        console.error('Error fetching organizations:', err);
        setError(err);
        trackFeatureUsage('user_management', 'fetch_organizations_error', { error: err.message });
        throw err;
      } finally {
        setLoading(false);
      }
    }, [trackFeatureUsage]);

    const getOrganizationById = useCallback(async (id) => {
      try {
        const { data, error } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        return data;
      } catch (err) {
        console.error('Error fetching organization by ID:', err);
        throw err;
      }
    }, []);

    const createOrganization = useCallback(async (orgData) => {
      setLoading(true);
      setError(null);

      try {
        trackFeatureUsage('user_management', 'create_organization');
        
        const { data, error } = await supabase
          .from('organizations')
          .insert([{
            name: orgData.name,
            domain: orgData.domain,
            industry: orgData.industry,
            company_size: orgData.companySize
          }])
          .select()
          .single();

        if (error) throw error;

        setOrganizations(prev => [...prev, data]);
        return data;
      } catch (err) {
        console.error('Error creating organization:', err);
        setError(err);
        trackFeatureUsage('user_management', 'create_organization_error', { error: err.message });
        throw err;
      } finally {
        setLoading(false);
      }
    }, [trackFeatureUsage]);

    const updateOrganization = useCallback(async (id, updates) => {
      setLoading(true);
      setError(null);

      try {
        trackFeatureUsage('user_management', 'update_organization');
        
        const { data, error } = await supabase
          .from('organizations')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        setOrganizations(prev => prev.map(org => 
          org.id === id ? data : org
        ));
        
        return data;
      } catch (err) {
        console.error('Error updating organization:', err);
        setError(err);
        trackFeatureUsage('user_management', 'update_organization_error', { error: err.message });
        throw err;
      } finally {
        setLoading(false);
      }
    }, [trackFeatureUsage]);

    const deleteOrganization = useCallback(async (id) => {
      setLoading(true);
      setError(null);

      try {
        trackFeatureUsage('user_management', 'delete_organization');
        
        const { error } = await supabase
          .from('organizations')
          .delete()
          .eq('id', id);

        if (error) throw error;

        setOrganizations(prev => prev.filter(org => org.id !== id));
        return true;
      } catch (err) {
        console.error('Error deleting organization:', err);
        setError(err);
        trackFeatureUsage('user_management', 'delete_organization_error', { error: err.message });
        throw err;
      } finally {
        setLoading(false);
      }
    }, [trackFeatureUsage]);

    const getUsersByOrganization = useCallback(async (organizationId, params = {}) => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('organization_id', organizationId);

        if (error) throw error;
        return data || [];
      } catch (err) {
        console.error('Error fetching users by organization:', err);
        throw err;
      }
    }, []);

    return {
      organizations,
      loading,
      error,
      fetchOrganizations,
      getOrganizationById,
      createOrganization,
      updateOrganization,
      deleteOrganization,
      getUsersByOrganization
    };
  };

  // Profiles management hook
  const useProfiles = () => {
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { trackFeatureUsage } = useAnalytics();

    const fetchProfiles = useCallback(async (params = {}) => {
      setLoading(true);
      setError(null);

      try {
        trackFeatureUsage('user_management', 'fetch_profiles');
        
        // Query profiles table
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('full_name', { ascending: true });

        if (error) throw error;

        setProfiles(data || []);
        return data;
      } catch (err) {
        console.error('Error fetching profiles:', err);
        setError(err);
        trackFeatureUsage('user_management', 'fetch_profiles_error', { error: err.message });
        throw err;
      } finally {
        setLoading(false);
      }
    }, [trackFeatureUsage]);

    const getProfileById = useCallback(async (id) => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        return data;
      } catch (err) {
        console.error('Error fetching profile by ID:', err);
        throw err;
      }
    }, []);

    const createProfile = useCallback(async (profileData) => {
      setLoading(true);
      setError(null);

      try {
        trackFeatureUsage('user_management', 'create_profile');
        
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
            language: profileData.language || 'en'
          }])
          .select()
          .single();

        if (error) throw error;

        setProfiles(prev => [...prev, data]);
        return data;
      } catch (err) {
        console.error('Error creating profile:', err);
        setError(err);
        trackFeatureUsage('user_management', 'create_profile_error', { error: err.message });
        throw err;
      } finally {
        setLoading(false);
      }
    }, [trackFeatureUsage]);

    const updateProfile = useCallback(async (id, updates) => {
      setLoading(true);
      setError(null);

      try {
        trackFeatureUsage('user_management', 'update_profile');
        
        const { data, error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        setProfiles(prev => prev.map(profile => 
          profile.id === id ? data : profile
        ));
        
        return data;
      } catch (err) {
        console.error('Error updating profile:', err);
        setError(err);
        trackFeatureUsage('user_management', 'update_profile_error', { error: err.message });
        throw err;
      } finally {
        setLoading(false);
      }
    }, [trackFeatureUsage]);

    const updateProfileRole = useCallback(async (id, roleId) => {
      return updateProfile(id, { role_id: roleId });
    }, [updateProfile]);

    const updateProfileStatus = useCallback(async (id, status) => {
      return updateProfile(id, { status });
    }, [updateProfile]);

    const deleteProfile = useCallback(async (id) => {
      setLoading(true);
      setError(null);

      try {
        trackFeatureUsage('user_management', 'delete_profile');
        
        const { error } = await supabase
          .from('profiles')
          .delete()
          .eq('id', id);

        if (error) throw error;

        setProfiles(prev => prev.filter(profile => profile.id !== id));
        return true;
      } catch (err) {
        console.error('Error deleting profile:', err);
        setError(err);
        trackFeatureUsage('user_management', 'delete_profile_error', { error: err.message });
        throw err;
      } finally {
        setLoading(false);
      }
    }, [trackFeatureUsage]);

    return {
      profiles,
      loading,
      error,
      fetchProfiles,
      getProfileById,
      createProfile,
      updateProfile,
      updateProfileRole,
      updateProfileStatus,
      deleteProfile
    };
  };

  // Invites management hook
  const useInvites = () => {
    const [invites, setInvites] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { trackFeatureUsage } = useAnalytics();

    const fetchInvites = useCallback(async (params = {}) => {
      setLoading(true);
      setError(null);

      try {
        trackFeatureUsage('user_management', 'fetch_invites');
        
        // Query invites table
        const { data, error } = await supabase
          .from('invites')
          .select('*')
          .order('invited_at', { ascending: false });

        if (error) throw error;

        setInvites(data || []);
        return data;
      } catch (err) {
        console.error('Error fetching invites:', err);
        setError(err);
        trackFeatureUsage('user_management', 'fetch_invites_error', { error: err.message });
        throw err;
      } finally {
        setLoading(false);
      }
    }, [trackFeatureUsage]);

    const sendInvite = useCallback(async (inviteData) => {
      setLoading(true);
      setError(null);

      try {
        trackFeatureUsage('user_management', 'send_invite');
        
        const { data, error } = await supabase
          .from('invites')
          .insert([{
            email: inviteData.email,
            organization_id: inviteData.organizationId,
            role_id: inviteData.roleId,
            invited_at: new Date().toISOString(),
            expires_at: inviteData.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            created_by: inviteData.createdBy
          }])
          .select()
          .single();

        if (error) throw error;

        setInvites(prev => [...prev, data]);
        return data;
      } catch (err) {
        console.error('Error sending invite:', err);
        setError(err);
        trackFeatureUsage('user_management', 'send_invite_error', { error: err.message });
        throw err;
      } finally {
        setLoading(false);
      }
    }, [trackFeatureUsage]);

    const deleteInvite = useCallback(async (email) => {
      setLoading(true);
      setError(null);

      try {
        trackFeatureUsage('user_management', 'delete_invite');
        
        const { error } = await supabase
          .from('invites')
          .delete()
          .eq('email', email);

        if (error) throw error;

        setInvites(prev => prev.filter(invite => invite.email !== email));
        return true;
      } catch (err) {
        console.error('Error deleting invite:', err);
        setError(err);
        trackFeatureUsage('user_management', 'delete_invite_error', { error: err.message });
        throw err;
      } finally {
        setLoading(false);
      }
    }, [trackFeatureUsage]);

    const resendInvite = useCallback(async (email) => {
      setLoading(true);
      setError(null);

      try {
        trackFeatureUsage('user_management', 'resend_invite');
        
        // Update the invited_at and expires_at timestamps
        const { data, error } = await supabase
          .from('invites')
          .update({
            invited_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          })
          .eq('email', email)
          .select()
          .single();

        if (error) throw error;

        setInvites(prev => prev.map(invite => 
          invite.email === email ? data : invite
        ));
        
        return data;
      } catch (err) {
        console.error('Error resending invite:', err);
        setError(err);
        trackFeatureUsage('user_management', 'resend_invite_error', { error: err.message });
        throw err;
      } finally {
        setLoading(false);
      }
    }, [trackFeatureUsage]);

    return {
      invites,
      loading,
      error,
      fetchInvites,
      sendInvite,
      deleteInvite,
      resendInvite
    };
  };

  // Search functionality across user management entities
  const useSearch = () => {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { trackFeatureUsage } = useAnalytics();

    const search = useCallback(async (query, entities = ['profiles', 'organizations']) => {
      if (!query || query.trim().length < 2) {
        setResults([]);
        return [];
      }

      setLoading(true);
      setError(null);

      try {
        trackFeatureUsage('user_management', 'search', { entities });
        
        const searchResults = [];
        
        // Search profiles
        if (entities.includes('profiles')) {
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('*')
            .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`);
          
          if (profilesError) throw profilesError;
          
          if (profilesData) {
            searchResults.push(...profilesData.map(profile => ({
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
            searchResults.push(...orgsData.map(org => ({
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
            searchResults.push(...invitesData.map(invite => ({
              ...invite,
              entityType: 'invite'
            })));
          }
        }

        setResults(searchResults);
        return searchResults;
      } catch (err) {
        console.error('Error searching:', err);
        setError(err);
        trackFeatureUsage('user_management', 'search_error', { error: err.message });
        throw err;
      } finally {
        setLoading(false);
      }
    }, [trackFeatureUsage]);

    const clearResults = useCallback(() => {
      setResults([]);
    }, []);

    return {
      results,
      loading,
      error,
      search,
      clearResults
    };
  };

  return {
    useRoles,
    useOrganizations,
    useProfiles,
    useInvites,
    useSearch
  };
};

export default useUserManagement;