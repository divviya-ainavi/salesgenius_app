import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { User, UserCircle, Settings, LogOut } from 'lucide-react'
import { toast } from 'sonner'
import { CURRENT_USER } from '@/lib/supabase'

export const UserDropdown = () => {
  const navigate = useNavigate()
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)

  const handleProfileClick = () => {
    // Navigate to profile page (to be implemented)
    toast.info('Profile page coming soon')
    // navigate('/profile')
  }

  const handleSettingsClick = () => {
    navigate('/settings')
  }

  const handleLogoutClick = () => {
    setShowLogoutDialog(true)
  }

  const handleConfirmLogout = () => {
    // Implement logout logic here
    toast.success('Logged out successfully')
    setShowLogoutDialog(false)
    // In a real app, this would clear auth tokens and redirect to login
    // For demo purposes, we'll just show a toast
  }

  const handleCancelLogout = () => {
    setShowLogoutDialog(false)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm"
            className="h-9 w-9 rounded-full hover:bg-accent focus:bg-accent focus:ring-2 focus:ring-ring focus:ring-offset-2"
            aria-label="User menu"
          >
            <User className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent 
          className="w-56 mr-4" 
          align="end" 
          sideOffset={8}
          aria-label="User account menu"
        >
          {/* User Info Header */}
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{CURRENT_USER.name}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {CURRENT_USER.email}
              </p>
              <p className="text-xs leading-none text-muted-foreground capitalize">
                {CURRENT_USER.role.replace('_', ' ')}
              </p>
            </div>
          </DropdownMenuLabel>
          
          <DropdownMenuSeparator />
          
          {/* Menu Items */}
          <DropdownMenuItem 
            onClick={handleProfileClick}
            className="cursor-pointer focus:bg-accent hover:bg-accent"
            aria-label="View profile"
          >
            <UserCircle className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            onClick={handleSettingsClick}
            className="cursor-pointer focus:bg-accent hover:bg-accent"
            aria-label="Account settings"
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>Account Settings</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={handleLogoutClick}
            className="cursor-pointer focus:bg-accent hover:bg-accent text-destructive focus:text-destructive"
            aria-label="Sign out"
          >
            <LogOut className="mr-2 h-4 w-4" />
            <span>Logout</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Logout</DialogTitle>
            <DialogDescription>
              Are you sure you want to sign out of your account? You'll need to sign in again to access your data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
            <Button 
              variant="outline" 
              onClick={handleCancelLogout}
              className="mt-2 sm:mt-0"
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}