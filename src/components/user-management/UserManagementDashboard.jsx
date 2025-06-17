import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Users, 
  Building, 
  Shield, 
  Mail, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Crown,
  UserCheck,
  UserX,
  Settings,
  Filter,
  MoreVertical,
  Eye,
  RefreshCw
} from 'lucide-react';
import { useUserManagement } from '@/hooks/useUserManagement';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import InviteUserForm from './InviteUserForm';
import UserProfileCard from './UserProfileCard';
import UserRoleSelector from './UserRoleSelector';
import OrganizationSelector from './OrganizationSelector';
import UserStatusSelector from './UserStatusSelector';

const UserManagementDashboard = () => {
  const [activeTab, setActiveTab] = useState('profiles');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrganization, setSelectedOrganization] = useState('all');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [showProfileDetails, setShowProfileDetails] = useState(false);

  // Initialize hooks
  const userManagement = useUserManagement();
  
  const {
    roles,
    loading: rolesLoading,
    fetchRoles,
  } = userManagement.useRoles();

  const {
    organizations,
    loading: orgsLoading,
    fetchOrganizations,
  } = userManagement.useOrganizations();

  const {
    profiles,
    loading: profilesLoading,
    fetchProfiles,
    updateProfileRole,
    updateProfileStatus,
    deleteProfile,
  } = userManagement.useProfiles();

  const {
    invites,
    loading: invitesLoading,
    fetchInvites,
    sendInvite,
    resendInvite,
    deleteInvite,
  } = userManagement.useInvites();

  const {
    results: searchResults,
    loading: searchLoading,
    search,
    clearResults,
  } = userManagement.useSearch();

  // Load initial data
  useEffect(() => {
    fetchRoles();
    fetchOrganizations();
    fetchProfiles();
    fetchInvites();
  }, []);

  // Handle search
  useEffect(() => {
    if (searchTerm.trim()) {
      const entities = [];
      if (activeTab === 'profiles' || activeTab === 'search') entities.push('profiles');
      if (activeTab === 'organizations' || activeTab === 'search') entities.push('organizations');
      if (activeTab === 'invites' || activeTab === 'search') entities.push('invites');
      
      search(searchTerm, entities);
    } else {
      clearResults();
    }
  }, [searchTerm, activeTab]);

  // Filter profiles based on selected filters
  const filteredProfiles = profiles.filter(profile => {
    if (selectedOrganization !== 'all' && profile.organization_id !== selectedOrganization) return false;
    if (selectedRole !== 'all' && profile.role_id !== parseInt(selectedRole)) return false;
    if (selectedStatus !== 'all' && profile.status_id !== parseInt(selectedStatus)) return false;
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        (profile.full_name && profile.full_name.toLowerCase().includes(searchLower)) ||
        (profile.email && profile.email.toLowerCase().includes(searchLower))
      );
    }
    
    return true;
  });

  const getRoleLabel = (roleId) => {
    const role = roles.find(r => r.id === roleId);
    return role?.label || 'Unknown Role';
  };

  const getOrganizationName = (orgId) => {
    const org = organizations.find(o => o.id === orgId);
    return org?.name || 'No Organization';
  };

  const getStatusLabel = (statusId) => {
    const statuses = [
      { id: 1, key: 'active', label: 'Active' },
      { id: 2, key: 'invited', label: 'Invited' },
      { id: 3, key: 'suspended', label: 'Suspended' },
      { id: 4, key: 'deactivated', label: 'Deactivated' }
    ];
    const status = statuses.find(s => s.id === statusId);
    return status?.label || 'Unknown';
  };

  const getStatusColor = (statusId) => {
    switch (statusId) {
      case 1: return 'bg-green-100 text-green-800 border-green-200'; // active
      case 2: return 'bg-yellow-100 text-yellow-800 border-yellow-200'; // invited
      case 3: return 'bg-red-100 text-red-800 border-red-200'; // suspended
      case 4: return 'bg-gray-100 text-gray-800 border-gray-200'; // deactivated
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleIcon = (roleId) => {
    switch (roleId) {
      case 1: return Crown; // super_admin
      case 2: return Shield; // org_admin
      default: return UserCheck; // user
    }
  };

  const handleInviteSuccess = () => {
    setShowInviteForm(false);
    fetchInvites();
    toast.success('Invitation sent successfully');
  };

  const handleViewProfile = (profile) => {
    setSelectedProfile(profile);
    setShowProfileDetails(true);
  };

  const handleRoleChange = async (userId, roleId) => {
    try {
      await updateProfileRole(userId, roleId);
      fetchProfiles(); // Refresh the list
      toast.success('User role updated successfully');
    } catch (error) {
      toast.error('Failed to update user role');
    }
  };

  const handleStatusChange = async (userId, statusId) => {
    try {
      await updateProfileStatus(userId, statusId);
      fetchProfiles(); // Refresh the list
      toast.success('User status updated successfully');
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  const handleDeleteProfile = async (profile) => {
    if (window.confirm(`Are you sure you want to delete ${profile.full_name || profile.email}?`)) {
      try {
        await deleteProfile(profile.id);
        fetchProfiles(); // Refresh the list
        toast.success('User deleted successfully');
        if (showProfileDetails && selectedProfile?.id === profile.id) {
          setShowProfileDetails(false);
        }
      } catch (error) {
        toast.error('Failed to delete user');
      }
    }
  };

  const handleResendInvite = async (email) => {
    try {
      await resendInvite(email);
      fetchInvites(); // Refresh the list
      toast.success(`Invitation resent to ${email}`);
    } catch (error) {
      toast.error('Failed to resend invitation');
    }
  };

  const handleDeleteInvite = async (email) => {
    if (window.confirm(`Are you sure you want to delete the invitation to ${email}?`)) {
      try {
        await deleteInvite(email);
        fetchInvites(); // Refresh the list
        toast.success('Invitation deleted successfully');
      } catch (error) {
        toast.error('Failed to delete invitation');
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">User Management</h1>
          <p className="text-muted-foreground">
            Manage users, roles, organizations, and invitations across your platform.
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => {
            fetchRoles();
            fetchOrganizations();
            fetchProfiles();
            fetchInvites();
          }}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
          
          <Button onClick={() => setShowInviteForm(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Invite User
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {activeTab === 'profiles' && (
              <div className="flex gap-2">
                <Select value={selectedOrganization} onValueChange={setSelectedOrganization}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="All Organizations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Organizations</SelectItem>
                    {organizations.map(org => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {roles.map(role => (
                      <SelectItem key={role.id} value={role.id.toString()}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="1">Active</SelectItem>
                    <SelectItem value="2">Invited</SelectItem>
                    <SelectItem value="3">Suspended</SelectItem>
                    <SelectItem value="4">Deactivated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profiles">
            <Users className="w-4 h-4 mr-1" />
            Profiles ({profiles.length})
          </TabsTrigger>
          <TabsTrigger value="organizations">
            <Building className="w-4 h-4 mr-1" />
            Organizations ({organizations.length})
          </TabsTrigger>
          <TabsTrigger value="invites">
            <Mail className="w-4 h-4 mr-1" />
            Invites ({invites.length})
          </TabsTrigger>
        </TabsList>

        {/* Profiles Tab */}
        <TabsContent value="profiles" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>User Profiles</span>
                <Button onClick={() => setShowInviteForm(true)}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add User
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {profilesLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-primary" />
                  <p className="text-muted-foreground">Loading profiles...</p>
                </div>
              ) : filteredProfiles.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-2">No profiles found</p>
                  <p className="text-sm">Try adjusting your filters or search terms</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredProfiles.map((profile) => {
                    const RoleIcon = getRoleIcon(profile.role_id);
                    
                    return (
                      <div key={profile.id} className="border border-border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                              <RoleIcon className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{profile.full_name || 'Unnamed User'}</h3>
                              <p className="text-sm text-muted-foreground">{profile.email}</p>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {getRoleLabel(profile.role_id)}
                                </Badge>
                                <Badge variant="outline" className={cn("text-xs", getStatusColor(profile.status_id))}>
                                  {getStatusLabel(profile.status_id)}
                                </Badge>
                                {profile.organization_id && (
                                  <Badge variant="secondary" className="text-xs">
                                    {getOrganizationName(profile.organization_id)}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => handleViewProfile(profile)}>
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteProfile(profile)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Organizations Tab */}
        <TabsContent value="organizations" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Organizations</span>
                <Button>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Organization
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {orgsLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-primary" />
                  <p className="text-muted-foreground">Loading organizations...</p>
                </div>
              ) : organizations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Building className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-2">No organizations found</p>
                  <p className="text-sm">Create your first organization to get started</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {organizations.map((org) => {
                    const memberCount = profiles.filter(p => p.organization_id === org.id).length;
                    
                    return (
                      <div key={org.id} className="border border-border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <Building className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{org.name}</h3>
                              {org.domain && (
                                <p className="text-sm text-muted-foreground">{org.domain}</p>
                              )}
                            </div>
                          </div>
                          
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Industry:</span>
                            <span className="ml-2 font-medium">{org.industry || 'Not specified'}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Size:</span>
                            <span className="ml-2 font-medium">{org.company_size || 'Not specified'}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Members:</span>
                            <span className="ml-2 font-medium">{memberCount}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Status:</span>
                            <span className="ml-2 font-medium">{getStatusLabel(org.status_id)}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-end space-x-2 mt-4">
                          <Button variant="outline" size="sm">
                            <Users className="w-3 h-3 mr-1" />
                            View Members
                          </Button>
                          <Button variant="outline" size="sm">
                            <Edit className="w-3 h-3 mr-1" />
                            Edit
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Invites Tab */}
        <TabsContent value="invites" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Invitations</span>
                <Button onClick={() => setShowInviteForm(true)}>
                  <Plus className="w-4 h-4 mr-1" />
                  Send Invite
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {invitesLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-primary" />
                  <p className="text-muted-foreground">Loading invitations...</p>
                </div>
              ) : invites.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-2">No pending invitations</p>
                  <p className="text-sm">Invite new users to join your organization</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {invites.map((invite) => {
                    const isExpired = new Date(invite.expires_at) < new Date();
                    
                    return (
                      <div key={invite.email} className="border border-border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <Mail className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{invite.email}</h3>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {getRoleLabel(invite.role_id)}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {getOrganizationName(invite.organization_id)}
                                </Badge>
                                {isExpired ? (
                                  <Badge variant="outline" className="text-xs bg-red-100 text-red-800 border-red-200">
                                    Expired
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-800 border-yellow-200">
                                    Pending
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleResendInvite(invite.email)}>
                              <RefreshCw className="w-3 h-3 mr-1" />
                              Resend
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteInvite(invite.email)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="mt-3 text-xs text-muted-foreground">
                          <span>Invited: {new Date(invite.invited_at).toLocaleDateString()}</span>
                          <span className="mx-2">•</span>
                          <span>Expires: {new Date(invite.expires_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Invite User Dialog */}
      <Dialog open={showInviteForm} onOpenChange={setShowInviteForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite New User</DialogTitle>
          </DialogHeader>
          <InviteUserForm 
            onSuccess={handleInviteSuccess} 
            onCancel={() => setShowInviteForm(false)} 
          />
        </DialogContent>
      </Dialog>

      {/* User Profile Details Dialog */}
      <Dialog open={showProfileDetails} onOpenChange={setShowProfileDetails}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>User Profile</DialogTitle>
          </DialogHeader>
          {selectedProfile && (
            <UserProfileCard 
              profile={selectedProfile}
              roles={roles}
              organizations={organizations}
              onEdit={() => {}} // Implement edit functionality if needed
              onDelete={handleDeleteProfile}
              onRoleChange={handleRoleChange}
              onStatusChange={handleStatusChange}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagementDashboard;