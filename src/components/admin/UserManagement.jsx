import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users,
  Building,
  Shield,
  UserPlus,
  Mail,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Crown,
  Settings,
  Plus,
  RefreshCw,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import useUserManagement from '@/hooks/useUserManagement';
import { config } from '@/lib/config';

const UserManagement = () => {
  const [activeTab, setActiveTab] = useState('profiles');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrg, setSelectedOrg] = useState('all');
  const [selectedRole, setSelectedRole] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Hooks for data management
  const { useRoles, useOrganizations, useProfiles, useInvites } = useUserManagement();
  const { roles, loading: rolesLoading, loadRoles } = useRoles();
  const { organizations, loading: orgsLoading, loadOrganizations } = useOrganizations();
  const { profiles, loading: profilesLoading, loadProfiles } = useProfiles();
  const { invites, loading: invitesLoading, loadInvites } = useInvites();

  // Load initial data
  useEffect(() => {
    loadRoles();
    loadOrganizations();
    loadProfiles();
    loadInvites();
  }, []);

  // Filter profiles based on search and filters
  const filteredProfiles = profiles.filter(profile => {
    const matchesSearch = profile.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         profile.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesOrg = selectedOrg === 'all' || profile.organization_id === selectedOrg;
    const matchesRole = selectedRole === 'all' || profile.role_id === selectedRole;
    const matchesStatus = selectedStatus === 'all' || profile.status === selectedStatus;
    
    return matchesSearch && matchesOrg && matchesRole && matchesStatus;
  });

  // Filter invites based on search
  const filteredInvites = invites.filter(invite =>
    invite.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleName = (roleId) => {
    const role = roles.find(r => r.id === roleId);
    return role?.label || 'Unknown Role';
  };

  const getOrgName = (orgId) => {
    const org = organizations.find(o => o.id === orgId);
    return org?.name || 'No Organization';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'suspended': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRoleIcon = (roleKey) => {
    switch (roleKey) {
      case 'super_admin': return Crown;
      case 'org_admin': return Shield;
      case 'sales_manager': return Users;
      default: return Users;
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
            loadRoles();
            loadOrganizations();
            loadProfiles();
            loadInvites();
          }}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="w-4 h-4 mr-1" />
                Invite User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite New User</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input placeholder="Email address" />
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map(role => (
                      <SelectItem key={role.id} value={role.id}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select organization" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map(org => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button className="w-full">
                  <Mail className="w-4 h-4 mr-1" />
                  Send Invitation
                </Button>
              </div>
            </DialogContent>
          </Dialog>
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
            
            <div className="flex gap-2">
              <Select value={selectedOrg} onValueChange={setSelectedOrg}>
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
                    <SelectItem key={role.id} value={role.id}>
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
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profiles">
            <Users className="w-4 h-4 mr-1" />
            Users ({filteredProfiles.length})
          </TabsTrigger>
          <TabsTrigger value="invites">
            <Mail className="w-4 h-4 mr-1" />
            Invites ({filteredInvites.length})
          </TabsTrigger>
          <TabsTrigger value="organizations">
            <Building className="w-4 h-4 mr-1" />
            Organizations ({organizations.length})
          </TabsTrigger>
          <TabsTrigger value="roles">
            <Shield className="w-4 h-4 mr-1" />
            Roles ({roles.length})
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="profiles" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>User Profiles</CardTitle>
            </CardHeader>
            <CardContent>
              {profilesLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-primary" />
                  <p className="text-muted-foreground">Loading users...</p>
                </div>
              ) : filteredProfiles.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-2">No users found</p>
                  <p className="text-sm">Try adjusting your search or filters</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredProfiles.map((profile) => {
                    const role = roles.find(r => r.id === profile.role_id);
                    const RoleIcon = getRoleIcon(role?.key);
                    
                    return (
                      <div key={profile.id} className="border border-border rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                              <RoleIcon className="w-5 h-5 text-primary" />
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <h3 className="font-semibold">{profile.full_name || 'Unnamed User'}</h3>
                                <Badge variant="outline" className={cn("text-xs", getStatusColor(profile.status))}>
                                  {profile.status}
                                </Badge>
                              </div>
                              
                              <p className="text-sm text-muted-foreground mb-2">{profile.email}</p>
                              
                              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                                <span className="flex items-center space-x-1">
                                  <Shield className="w-3 h-3" />
                                  <span>{getRoleName(profile.role_id)}</span>
                                </span>
                                <span className="flex items-center space-x-1">
                                  <Building className="w-3 h-3" />
                                  <span>{getOrgName(profile.organization_id)}</span>
                                </span>
                                <span>Joined: {new Date(profile.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
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

        {/* Invites Tab */}
        <TabsContent value="invites" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Pending Invitations</CardTitle>
            </CardHeader>
            <CardContent>
              {invitesLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-primary" />
                  <p className="text-muted-foreground">Loading invitations...</p>
                </div>
              ) : filteredInvites.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-2">No pending invitations</p>
                  <p className="text-sm">Send an invitation to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredInvites.map((invite) => (
                    <div key={invite.email} className="border border-border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                            <Mail className="w-5 h-5 text-orange-600" />
                          </div>
                          
                          <div>
                            <h3 className="font-semibold">{invite.email}</h3>
                            <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-1">
                              <span>{getRoleName(invite.role_id)}</span>
                              <span>{getOrgName(invite.organization_id)}</span>
                              <span>Sent: {new Date(invite.invited_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-800 border-yellow-200">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                          <Button variant="outline" size="sm">
                            Resend
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
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
                <Button size="sm">
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
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {organizations.map((org) => (
                    <div key={org.id} className="border border-border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Building className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{org.name}</h3>
                            <p className="text-sm text-muted-foreground">{org.domain}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex justify-between">
                          <span>Industry:</span>
                          <span>{org.industry || 'Not specified'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Size:</span>
                          <span>{org.company_size || 'Not specified'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Created:</span>
                          <span>{new Date(org.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roles Tab */}
        <TabsContent value="roles" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>User Roles</span>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Role
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {rolesLoading ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-primary" />
                  <p className="text-muted-foreground">Loading roles...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {roles.map((role) => {
                    const RoleIcon = getRoleIcon(role.key);
                    
                    return (
                      <div key={role.id} className="border border-border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                              <RoleIcon className="w-5 h-5 text-purple-600" />
                            </div>
                            
                            <div>
                              <h3 className="font-semibold">{role.label}</h3>
                              <p className="text-sm text-muted-foreground">{role.description}</p>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {role.key}
                                </Badge>
                                {role.is_assignable && (
                                  <Badge variant="outline" className="text-xs bg-green-100 text-green-800 border-green-200">
                                    Assignable
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
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
      </Tabs>
    </div>
  );
};

export default UserManagement;