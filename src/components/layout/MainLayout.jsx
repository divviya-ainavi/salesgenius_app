import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { UserDropdown } from './UserDropdown'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell } from 'lucide-react'

export const MainLayout = () => {
  const location = useLocation()

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Unified Application Header */}
      <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
        <div className="flex items-center space-x-6">
          {/* Application Logo/Brand */}
          <div>
            <h1 className="text-xl font-bold text-foreground">SalesGenius.ai</h1>
            <p className="text-sm text-muted-foreground">AI-Powered Sales Assistant</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* HubSpot Connection Status */}
          <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
            HubSpot Connected
          </Badge>

          {/* Action Icons */}
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" aria-label="Notifications">
              <Bell className="w-4 h-4" />
            </Button>
            {/* User Dropdown Menu */}
            <UserDropdown />
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}