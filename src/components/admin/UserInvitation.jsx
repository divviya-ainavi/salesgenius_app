import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  UserPlus,
  Mail,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  Shield,
  Users,
  Crown,
} from 'lucide-react';
import { toast } from 'sonner';
import { useSelector } from 'react-redux';
import { dbHelpers, CURRENT_USER } from '@/lib/supabase';
import jwt from 'jsonwebtoken';

const UserInvitation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [selectedTitleId, setSelectedTitleId] = useState('');
  const [titles, setTitles] = useState([]);
  const [existingInvites, setExistingInvites] = useState([]);

  // Get user data from Redux store
  const { user, userRoleId } = useSelector((state) => state.auth);
  const { allTitles } = useSelector((state) => state.org);

  // Determine user permissions
  const isSuperAdmin = !user?.title_id; // null title_id means Super Admin
  const isOrgAdmin = userRoleId === 2;
  const canInviteUsers = isSuperAdmin || isOrgAdmin;

  useEffect(() => {
    if (isOpen && canInviteUsers) {
      loadTitles();
      loadExistingInvites();
    }
  }, [isOpen, canInviteUsers]);

  const loadTitles = async () => {
    try {
      if (allTitles && allTitles.length > 0) {
        setTitles(allTitles);
      } else {
        const titlesData = await dbHelpers.getTitles();
        setTitles(titlesData);
      }
    } catch (error) {
      console.error('Error loading titles:', error);
      toast.error('Failed to load available titles');
    }
  };

  const loadExistingInvites = async () => {
    try {
      const invites = await dbHelpers.getInvites();
      setExistingInvites(invites);
    } catch (error) {
      console.error('Error loading existing invites:', error);
    }
  };

  const generateJWTToken = (email) => {
    const payload = {
      email,
      timestamp: Date.now(),
      invitedBy: CURRENT_USER.id,
    };
    
    // In production, use a proper secret from environment variables
    const secret = 'your-jwt-secret-key';
    return jwt.sign(payload, secret, { expiresIn: '7d' });
  };

  const checkExistingInvite = (email) => {
    return existingInvites.find(invite => 
      invite.email.toLowerCase() === email.toLowerCase()
    );
  };

  const isInviteExpired = (invitedAt) => {
    const inviteTime = new Date(invitedAt);
    const now = new Date();
    const hoursDiff = (now - inviteTime) / (1000 * 60 * 60);
    return hoursDiff > 24;
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSendInvite = async () => {
    setError('');

    // Validation
    if (!email.trim()) {
      setError('Email address is required');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (isOrgAdmin && !selectedTitleId) {
      setError('Please select a title for the user');
      return;
    }

    setIsLoading(true);

    try {
      // Check for existing invite
      const existingInvite = checkExistingInvite(email);

      if (existingInvite) {
        if (existingInvite.status === 'completed') {
          setError('This email has already been invited and the user has completed setup');
          setIsLoading(false);
          return;
        }

        if (existingInvite.status === 'accepted') {
          setError('This invitation has already been accepted');
          setIsLoading(false);
          return;
        }

        if (existingInvite.status === 'invited' && !isInviteExpired(existingInvite.invited_at)) {
          setError('An active invitation already exists for this email');
          setIsLoading(false);
          return;
        }
      }

      // Get role ID from selected title (for Org Admin)
      let roleId = null;
      if (isOrgAdmin && selectedTitleId) {
        roleId = await dbHelpers.getRoleIdByTitleId(selectedTitleId);
      }

      // Generate JWT token
      const token = generateJWTToken(email);

      // Prepare invite data
      const inviteData = {
        email: email.toLowerCase(),
        organization_id: isOrgAdmin ? user.organization_id : null,
        title_id: isOrgAdmin ? selectedTitleId : null,
        token: token,
        invited_by: CURRENT_USER.id,
        status: 'invited',
        invited_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };

      // Send invite (create entry in invites table)
      await dbHelpers.createInvite(inviteData);

      // TODO: Send actual email with invitation link
      // const inviteLink = `${window.location.origin}/auth/setup?token=${token}&email=${encodeURIComponent(email)}`;
      // await emailService.sendInvitationEmail(email, inviteLink, inviteData);

      toast.success(`Invitation sent successfully to ${email}`);
      
      // Reset form
      setEmail('');
      setSelectedTitleId('');
      setIsOpen(false);
      
      // Reload invites
      loadExistingInvites();

    } catch (error) {
      console.error('Error sending invite:', error);
      setError('Failed to send invitation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleIcon = (roleKey) => {
    switch (roleKey) {
      case 'super_admin': return Crown;
      case 'org_admin': return Shield;
      default: return Users;
    }
  };

  const getStatusBadge = (invite) => {
    const now = new Date();
    const invitedAt = new Date(invite.invited_at);
    const isExpired = isInviteExpired(invite.invited_at);

    if (invite.status === 'completed') {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Completed
        </Badge>
      );
    }

    if (invite.status === 'accepted') {
      return (
        <Badge variant="default" className="bg-blue-100 text-blue-800 border-blue-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Accepted
        </Badge>
      );
    }

    if (isExpired) {
      return (
        <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
          <AlertCircle className="w-3 h-3 mr-1" />
          Expired
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
        <Clock className="w-3 h-3 mr-1" />
        Pending
      </Badge>
    );
  };

  if (!canInviteUsers) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Invite User Button */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">User Invitations</h3>
          <p className="text-sm text-muted-foreground">
            Invite new users to join your {isSuperAdmin ? 'platform' : 'organization'}
          </p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Invite User
            </Button>
          </DialogTrigger>
          
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Mail className="w-5 h-5" />
                <span>Invite New User</span>
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Error Alert */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Email Input */}
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email Address</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="user@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              {/* Title Selection (Org Admin only) */}
              {isOrgAdmin && (
                <div className="space-y-2">
                  <Label htmlFor="invite-title">User Title</Label>
                  <Select value={selectedTitleId} onValueChange={setSelectedTitleId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a title for the user" />
                    </SelectTrigger>
                    <SelectContent>
                      {titles.map((title) => (
                        <SelectItem key={title.id} value={title.id.toString()}>
                          <div className="flex items-center space-x-2">
                            <span>{title.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    The user's role will be determined by their assigned title
                  </p>
                </div>
              )}

              {/* User Type Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">
                    {isSuperAdmin ? 'Super Admin Invitation' : 'Organization Invitation'}
                  </span>
                </div>
                <p className="text-xs text-blue-700 mt-1">
                  {isSuperAdmin 
                    ? 'You can invite users to any organization on the platform'
                    : `User will be added to ${user?.organization_details?.name || 'your organization'}`
                  }
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSendInvite}
                  disabled={isLoading || !email.trim() || (isOrgAdmin && !selectedTitleId)}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Send Invitation
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Existing Invitations */}
      {existingInvites.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Invitations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {existingInvites.slice(0, 5).map((invite) => (
                <div
                  key={invite.id || invite.email}
                  className="flex items-center justify-between p-3 border border-border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Mail className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{invite.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Invited {new Date(invite.invited_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(invite)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UserInvitation;