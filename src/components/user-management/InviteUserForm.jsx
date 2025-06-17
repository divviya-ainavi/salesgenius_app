import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Mail, Building, Shield, Calendar, X } from 'lucide-react';
import { useUserManagement } from '@/hooks/useUserManagement';
import { CURRENT_USER } from '@/lib/supabase';
import { cn } from '@/lib/utils';

const InviteUserForm = ({ onSuccess, onCancel, organizationId = null }) => {
  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedOrg, setSelectedOrg] = useState(organizationId || '');
  const [expiryDays, setExpiryDays] = useState(7);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  // Get roles and organizations
  const userManagement = useUserManagement();
  const { roles, loading: rolesLoading, fetchRoles } = userManagement.useRoles();
  const { organizations, loading: orgsLoading, fetchOrganizations } = userManagement.useOrganizations();
  const { sendInvite } = userManagement.useInvites();

  // Load roles and organizations if not already loaded
  useEffect(() => {
    if (roles.length === 0) {
      fetchRoles();
    }
    if (organizations.length === 0) {
      fetchOrganizations();
    }
  }, []);

  // Filter roles to only show assignable ones
  const assignableRoles = roles.filter(role => role.is_assignable);

  // Set default role when roles are loaded
  useEffect(() => {
    if (assignableRoles.length > 0 && !selectedRole) {
      // Default to user role or first available role
      const defaultRole = assignableRoles.find(r => r.key === 'user') || assignableRoles[0];
      setSelectedRole(defaultRole.id.toString());
    }
  }, [assignableRoles]);

  // Set default organization when orgs are loaded
  useEffect(() => {
    if (organizations.length > 0 && !selectedOrg && !organizationId) {
      // If user is not super_admin, default to their organization
      if (CURRENT_USER.organization_id) {
        setSelectedOrg(CURRENT_USER.organization_id);
      } else {
        setSelectedOrg(organizations[0].id);
      }
    }
  }, [organizations, organizationId]);

  const validateForm = () => {
    const newErrors = {};
    
    // Validate email
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }
    
    // Validate role
    if (!selectedRole) {
      newErrors.role = 'Role is required';
    }
    
    // Validate organization
    if (!selectedOrg) {
      newErrors.organization = 'Organization is required';
    }
    
    // Validate expiry days
    if (!expiryDays || expiryDays < 1) {
      newErrors.expiryDays = 'Expiry days must be at least 1';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Calculate expiry date
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + expiryDays);
      
      await sendInvite({
        email,
        organizationId: selectedOrg,
        roleId: parseInt(selectedRole),
        createdBy: CURRENT_USER.id,
        expiresAt: expiryDate.toISOString(),
      });
      
      toast.success(`Invitation sent to ${email}`);
      
      if (onSuccess) {
        onSuccess();
      }
      
      // Reset form
      setEmail('');
      setSelectedRole('');
      setExpiryDays(7);
    } catch (error) {
      toast.error('Failed to send invitation');
      console.error('Error sending invitation:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Mail className="w-5 h-5" />
          <span>Invite New User</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Input */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={cn("pl-10", errors.email && "border-red-500")}
              />
            </div>
            {errors.email && (
              <p className="text-xs text-red-500">{errors.email}</p>
            )}
          </div>

          {/* Role Selection */}
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger id="role" className={cn("pl-10", errors.role && "border-red-500")}>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {rolesLoading ? (
                    <div className="p-2 text-center">Loading roles...</div>
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
            {errors.role && (
              <p className="text-xs text-red-500">{errors.role}</p>
            )}
          </div>

          {/* Organization Selection */}
          <div className="space-y-2">
            <Label htmlFor="organization">Organization</Label>
            <div className="relative">
              <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Select 
                value={selectedOrg} 
                onValueChange={setSelectedOrg}
                disabled={!!organizationId} // Disable if org is pre-selected
              >
                <SelectTrigger id="organization" className={cn("pl-10", errors.organization && "border-red-500")}>
                  <SelectValue placeholder="Select an organization" />
                </SelectTrigger>
                <SelectContent>
                  {orgsLoading ? (
                    <div className="p-2 text-center">Loading organizations...</div>
                  ) : (
                    organizations.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            {errors.organization && (
              <p className="text-xs text-red-500">{errors.organization}</p>
            )}
          </div>

          {/* Expiry Days */}
          <div className="space-y-2">
            <Label htmlFor="expiryDays">Invitation Expires After (Days)</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                id="expiryDays"
                type="number"
                min="1"
                max="30"
                value={expiryDays}
                onChange={(e) => setExpiryDays(parseInt(e.target.value) || 0)}
                className={cn("pl-10", errors.expiryDays && "border-red-500")}
              />
            </div>
            {errors.expiryDays && (
              <p className="text-xs text-red-500">{errors.expiryDays}</p>
            )}
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          <X className="w-4 h-4 mr-1" />
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Mail className="w-4 h-4 mr-1 animate-pulse" />
              Sending...
            </>
          ) : (
            <>
              <Mail className="w-4 h-4 mr-1" />
              Send Invitation
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default InviteUserForm;