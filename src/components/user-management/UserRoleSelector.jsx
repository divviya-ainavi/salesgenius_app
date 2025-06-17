import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Check, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useUserManagement } from '@/hooks/useUserManagement';
import { cn } from '@/lib/utils';

const UserRoleSelector = ({ 
  userId, 
  currentRoleId = null, 
  onRoleChange = () => {}, 
  disabled = false,
  showSaveButton = true,
  size = 'default' // 'default', 'sm', 'lg'
}) => {
  const [selectedRoleId, setSelectedRoleId] = useState(currentRoleId ? currentRoleId.toString() : '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasChanged, setHasChanged] = useState(false);

  const userManagement = useUserManagement();
  const { roles, loading: rolesLoading, fetchRoles } = userManagement.useRoles();
  const { updateProfileRole } = userManagement.useProfiles();

  // Update selected role when currentRoleId changes
  useEffect(() => {
    setSelectedRoleId(currentRoleId ? currentRoleId.toString() : '');
    setHasChanged(false);
  }, [currentRoleId]);

  // Load roles if not already loaded
  useEffect(() => {
    if (roles.length === 0 && !rolesLoading) {
      fetchRoles();
    }
  }, [roles.length, rolesLoading, fetchRoles]);

  // Filter roles to only show assignable ones
  const assignableRoles = roles.filter(role => role.is_assignable);

  const handleRoleChange = (roleId) => {
    setSelectedRoleId(roleId);
    setHasChanged(parseInt(roleId) !== currentRoleId);
    
    // If no save button, update immediately
    if (!showSaveButton) {
      handleSaveRole(parseInt(roleId));
    }
  };

  const handleSaveRole = async (roleIdToSave = parseInt(selectedRoleId)) => {
    if (!userId || !roleIdToSave || roleIdToSave === currentRoleId) {
      return;
    }
    
    setIsUpdating(true);
    
    try {
      await updateProfileRole(userId, roleIdToSave);
      toast.success('User role updated successfully');
      onRoleChange(userId, roleIdToSave);
      setHasChanged(false);
    } catch (error) {
      toast.error('Failed to update user role');
      console.error('Error updating user role:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Get current role object
  const currentRole = roles.find(r => r.id === currentRoleId);
  const selectedRole = roles.find(r => r.id === parseInt(selectedRoleId));

  return (
    <div className={cn(
      "flex items-center",
      showSaveButton ? "space-x-2" : ""
    )}>
      <div className="relative flex-1">
        <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Select 
          value={selectedRoleId} 
          onValueChange={handleRoleChange}
          disabled={disabled || isUpdating || rolesLoading}
        >
          <SelectTrigger className={cn(
            "pl-10",
            size === 'sm' ? "h-8 text-xs" : size === 'lg' ? "h-12 text-base" : "h-10 text-sm"
          )}>
            <SelectValue placeholder="Select a role">
              {selectedRole?.label || 'Select a role'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {rolesLoading ? (
              <div className="p-2 text-center">
                <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2" />
                Loading roles...
              </div>
            ) : assignableRoles.length === 0 ? (
              <div className="p-2 text-center text-muted-foreground">
                No assignable roles found
              </div>
            ) : (
              assignableRoles.map((role) => (
                <SelectItem key={role.id} value={role.id.toString()}>
                  <div className="flex flex-col">
                    <span>{role.label}</span>
                    {role.description && (
                      <span className="text-xs text-muted-foreground">{role.description}</span>
                    )}
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      {showSaveButton && hasChanged && (
        <Button 
          onClick={() => handleSaveRole()} 
          disabled={isUpdating || !selectedRoleId}
          size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'default'}
        >
          {isUpdating ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
        </Button>
      )}

      {currentRole && !hasChanged && (
        <Badge variant="outline" className={cn(
          "text-xs",
          size === 'sm' ? "px-1.5 py-0.5" : "px-2.5 py-0.5"
        )}>
          {currentRole.label}
        </Badge>
      )}
    </div>
  );
};

export default UserRoleSelector;