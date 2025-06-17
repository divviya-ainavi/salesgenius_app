import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserCheck, Check, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useUserManagement } from '@/hooks/useUserManagement';
import { cn } from '@/lib/utils';

const UserStatusSelector = ({ 
  userId, 
  currentStatusId = 1, // Default to active (1)
  onStatusChange = () => {}, 
  disabled = false,
  showSaveButton = true,
  size = 'default' // 'default', 'sm', 'lg'
}) => {
  const [selectedStatusId, setSelectedStatusId] = useState(currentStatusId ? currentStatusId.toString() : '1');
  const [isUpdating, setIsUpdating] = useState(false);
  const [hasChanged, setHasChanged] = useState(false);
  const [statuses, setStatuses] = useState([
    { id: 1, key: 'active', label: 'Active', color: 'bg-green-100 text-green-800 border-green-200' },
    { id: 2, key: 'invited', label: 'Invited', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    { id: 3, key: 'suspended', label: 'Suspended', color: 'bg-red-100 text-red-800 border-red-200' },
    { id: 4, key: 'deactivated', label: 'Deactivated', color: 'bg-gray-100 text-gray-800 border-gray-200' }
  ]);

  const userManagement = useUserManagement();
  const { updateProfile } = userManagement.useProfiles();

  // Update selected status when currentStatusId changes
  useEffect(() => {
    setSelectedStatusId(currentStatusId ? currentStatusId.toString() : '1');
    setHasChanged(false);
  }, [currentStatusId]);

  const handleStatusChange = (statusId) => {
    setSelectedStatusId(statusId);
    setHasChanged(parseInt(statusId) !== currentStatusId);
    
    // If no save button, update immediately
    if (!showSaveButton) {
      handleSaveStatus(parseInt(statusId));
    }
  };

  const handleSaveStatus = async (statusIdToSave = parseInt(selectedStatusId)) => {
    if (!userId || statusIdToSave === currentStatusId) {
      return;
    }
    
    setIsUpdating(true);
    
    try {
      await updateProfile(userId, { status_id: statusIdToSave });
      toast.success('User status updated successfully');
      onStatusChange(userId, statusIdToSave);
      setHasChanged(false);
    } catch (error) {
      toast.error('Failed to update user status');
      console.error('Error updating user status:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Get current status object
  const currentStatusObj = statuses.find(s => s.id === currentStatusId) || statuses[0];
  const selectedStatusObj = statuses.find(s => s.id === parseInt(selectedStatusId)) || statuses[0];

  return (
    <div className={cn(
      "flex items-center",
      showSaveButton ? "space-x-2" : ""
    )}>
      <div className="relative flex-1">
        <UserCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Select 
          value={selectedStatusId} 
          onValueChange={handleStatusChange}
          disabled={disabled || isUpdating}
        >
          <SelectTrigger className={cn(
            "pl-10",
            size === 'sm' ? "h-8 text-xs" : size === 'lg' ? "h-12 text-base" : "h-10 text-sm"
          )}>
            <SelectValue placeholder="Select status">
              {selectedStatusObj.label}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {statuses.map((status) => (
              <SelectItem key={status.id} value={status.id.toString()}>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className={cn("text-xs", status.color)}>
                    {status.label}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showSaveButton && hasChanged && (
        <Button 
          onClick={() => handleSaveStatus()} 
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

      {!hasChanged && (
        <Badge variant="outline" className={cn(
          "text-xs",
          currentStatusObj.color,
          size === 'sm' ? "px-1.5 py-0.5" : "px-2.5 py-0.5"
        )}>
          {currentStatusObj.label}
        </Badge>
      )}
    </div>
  );
};

export default UserStatusSelector;