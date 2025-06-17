import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  User, 
  Mail, 
  Building, 
  Shield, 
  Clock, 
  Globe, 
  Languages, 
  Edit, 
  Trash2, 
  MoreVertical,
  Crown,
  UserCheck,
  UserX
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import UserRoleSelector from './UserRoleSelector';
import OrganizationSelector from './OrganizationSelector';
import UserStatusSelector from './UserStatusSelector';
import { cn } from '@/lib/utils';

const UserProfileCard = ({ 
  profile, 
  roles = [], 
  organizations = [], 
  onEdit, 
  onDelete, 
  onRoleChange, 
  onOrgChange, 
  onStatusChange,
  isCurrentUser = false,
  compact = false
}) => {
  // Get role and organization details
  const role = roles.find(r => r.id === profile.role_id);
  const organization = organizations.find(o => o.id === profile.organization_id);

  // Determine role icon
  const getRoleIcon = (roleId) => {
    switch (roleId) {
      case 1: return Crown; // super_admin
      case 2: return Shield; // org_admin
      default: return UserCheck; // user
    }
  };
  
  const RoleIcon = getRoleIcon(profile.role_id);

  // Get status color
  const getStatusColor = (statusId) => {
    switch (statusId) {
      case 1: return 'bg-green-100 text-green-800 border-green-200'; // active
      case 2: return 'bg-yellow-100 text-yellow-800 border-yellow-200'; // invited
      case 3: return 'bg-red-100 text-red-800 border-red-200'; // suspended
      case 4: return 'bg-gray-100 text-gray-800 border-gray-200'; // deactivated
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Get status label
  const getStatusLabel = (statusId) => {
    const statuses = [
      { id: 1, label: 'Active' },
      { id: 2, label: 'Invited' },
      { id: 3, label: 'Suspended' },
      { id: 4, label: 'Deactivated' }
    ];
    const status = statuses.find(s => s.id === statusId);
    return status?.label || 'Unknown';
  };

  // Compact view for lists
  if (compact) {
    return (
      <div className="border border-border rounded-lg p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <RoleIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">{profile.full_name || 'Unnamed User'}</h3>
              <p className="text-sm text-muted-foreground">{profile.email}</p>
              <div className="flex items-center space-x-2 mt-1">
                {role && (
                  <Badge variant="outline" className="text-xs">
                    {role.label}
                  </Badge>
                )}
                <Badge variant="outline" className={cn("text-xs", getStatusColor(profile.status_id))}>
                  {getStatusLabel(profile.status_id)}
                </Badge>
                {organization && (
                  <Badge variant="secondary" className="text-xs">
                    {organization.name}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit?.(profile)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </DropdownMenuItem>
              {!isCurrentUser && (
                <DropdownMenuItem 
                  onClick={() => onDelete?.(profile)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Profile
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  }

  // Full detailed view
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>User Profile</span>
            {isCurrentUser && (
              <Badge variant="secondary" className="ml-2">You</Badge>
            )}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit?.(profile)}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </DropdownMenuItem>
              {!isCurrentUser && (
                <DropdownMenuItem 
                  onClick={() => onDelete?.(profile)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Profile
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* User Info */}
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
            <RoleIcon className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">{profile.full_name || 'Unnamed User'}</h2>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Mail className="w-4 h-4" />
              <span>{profile.email}</span>
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant="outline" className={cn("text-xs", getStatusColor(profile.status_id))}>
                {getStatusLabel(profile.status_id)}
              </Badge>
              {role && (
                <Badge variant="outline" className="text-xs">
                  {role.label}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Role, Organization, Status */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Role</label>
            <UserRoleSelector 
              userId={profile.id}
              currentRoleId={profile.role_id}
              onRoleChange={onRoleChange}
              disabled={isCurrentUser && profile.role_id === 1} // Disable for super_admin
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Organization</label>
            <OrganizationSelector 
              userId={profile.id}
              currentOrgId={profile.organization_id}
              onOrgChange={onOrgChange}
              allowNone={profile.role_id === 1} // Allow no org for super_admin
              disabled={isCurrentUser && profile.role_id === 1} // Disable for super_admin
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <UserStatusSelector 
              userId={profile.id}
              currentStatusId={profile.status_id}
              onStatusChange={onStatusChange}
              disabled={isCurrentUser}
            />
          </div>
        </div>

        {/* Additional Info */}
        <div className="grid md:grid-cols-3 gap-4 pt-4 border-t border-border">
          <div className="flex items-center space-x-2 text-sm">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Created:</span>
            <span>{new Date(profile.created_at).toLocaleDateString()}</span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Timezone:</span>
            <span>{profile.timezone || 'UTC'}</span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm">
            <Languages className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Language:</span>
            <span>{profile.language || 'en'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserProfileCard;