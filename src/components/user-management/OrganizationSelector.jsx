import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building, Check, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useUserManagement } from '@/hooks/useUserManagement';
import { cn } from '@/lib/utils';

const OrganizationSelector = ({ 
  userId, 
  currentOrgId = null, 
  onOrgChange = () => {}, 
  disabled = false,
  showSaveButton = true,
  allowNone = false, // Allow selecting "No Organization"
  size = 'default' // 'default', 'sm', 'lg'
}) => {
  const [selectedOrgId, setSelectedOrgId] = useState(currentOrgId);
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasChanged, setHasChanged] = useState(false);

  const userManagement = useUserManagement();
  const { organizations, loading: orgsLoading, fetchOrganizations } = userManagement.useOrganizations();
  const { updateProfile } = userManagement.useProfiles();

  // Update selected org when currentOrgId changes
  useEffect(() => {
    setSelectedOrgId(currentOrgId);
    setHasChanged(false);
  }, [currentOrgId]);

  // Load organizations if not already loaded
  useEffect(() => {
    if (organizations.length === 0 && !orgsLoading) {
      fetchOrganizations();
    }
  }, [organizations.length, orgsLoading, fetchOrganizations]);

  const handleOrgChange = (orgId) => {
    setSelectedOrgId(orgId === 'none' ? null : orgId);
    setHasChanged(orgId === 'none' ? currentOrgId !== null : orgId !== currentOrgId);
    
    // If no save button, update immediately
    if (!showSaveButton) {
      handleSaveOrg(orgId === 'none' ? null : orgId);
    }
  };

  const handleSaveOrg = async (orgIdToSave = selectedOrgId) => {
    if (!userId || (orgIdToSave === currentOrgId)) {
      return;
    }
    
    setIsUpdating(true);
    
    try {
      await updateProfile(userId, { organization_id: orgIdToSave });
      toast.success('User organization updated successfully');
      onOrgChange(userId, orgIdToSave);
      setHasChanged(false);
    } catch (error) {
      toast.error('Failed to update user organization');
      console.error('Error updating user organization:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Get current organization name
  const currentOrg = organizations.find(o => o.id === currentOrgId);
  const selectedOrg = organizations.find(o => o.id === selectedOrgId);

  return (
    <div className={cn(
      "flex items-center",
      showSaveButton ? "space-x-2" : ""
    )}>
      <div className="relative flex-1">
        <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Select 
          value={selectedOrgId || (allowNone ? 'none' : '')} 
          onValueChange={handleOrgChange}
          disabled={disabled || isUpdating || orgsLoading}
        >
          <SelectTrigger className={cn(
            "pl-10",
            size === 'sm' ? "h-8 text-xs" : size === 'lg' ? "h-12 text-base" : "h-10 text-sm"
          )}>
            <SelectValue placeholder="Select an organization">
              {selectedOrgId ? selectedOrg?.name : allowNone ? 'No Organization' : 'Select an organization'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {orgsLoading ? (
              <div className="p-2 text-center">
                <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2" />
                Loading organizations...
              </div>
            ) : organizations.length === 0 ? (
              <div className="p-2 text-center text-muted-foreground">
                No organizations found
              </div>
            ) : (
              <>
                {allowNone && (
                  <SelectItem value="none">
                    <div className="flex flex-col">
                      <span>No Organization</span>
                      <span className="text-xs text-muted-foreground">User will not belong to any organization</span>
                    </div>
                  </SelectItem>
                )}
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    <div className="flex flex-col">
                      <span>{org.name}</span>
                      {org.industry && (
                        <span className="text-xs text-muted-foreground">{org.industry}</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </>
            )}
          </SelectContent>
        </Select>
      </div>

      {showSaveButton && hasChanged && (
        <Button 
          onClick={() => handleSaveOrg()} 
          disabled={isUpdating}
          size={size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'default'}
        >
          {isUpdating ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
        </Button>
      )}

      {currentOrg && !hasChanged && (
        <Badge variant="outline" className={cn(
          "text-xs",
          size === 'sm' ? "px-1.5 py-0.5" : "px-2.5 py-0.5"
        )}>
          {currentOrg.name}
        </Badge>
      )}

      {!currentOrg && !currentOrgId && !hasChanged && allowNone && (
        <Badge variant="outline" className={cn(
          "text-xs",
          size === 'sm' ? "px-1.5 py-0.5" : "px-2.5 py-0.5"
        )}>
          No Organization
        </Badge>
      )}
    </div>
  );
};

export default OrganizationSelector;