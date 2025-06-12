import React from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bell, Settings, User } from 'lucide-react'

// Page title mapping
const getPageTitle = (pathname) => {
  if (pathname === '/research') return 'Research'
  if (pathname === '/calls') return 'Sales Calls'
  if (pathname.startsWith('/follow-ups/wrap-up')) return 'Call Wrap-Up'
  if (pathname.startsWith('/follow-ups/actions')) return 'Action Items'
  if (pathname.startsWith('/follow-ups/emails')) return 'Email Templates'
  if (pathname.startsWith('/follow-ups/decks')) return 'Deck Builder'
  if (pathname.startsWith('/follow-ups/processing-history')) return 'Processing History'
  if (pathname.startsWith('/follow-ups')) return 'Follow Ups'
  if (pathname === '/analytics') return 'Analytics'
  if (pathname === '/settings') return 'Settings'
  return 'Dashboard'
}

export const MainLayout = () => {
  const location = useLocation()
  const pageTitle = getPageTitle(location.pathname)

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Unified Application Header */}
      <header className="h-16 bg-card border-b border-border flex items-center justify-between px-6">
        <div className="flex items-center space-x-6">
          {/* Application Logo/Brand */}
          <div className="flex items-center space-x-3">
            <h1 className="text-xl font-bold text-foreground">SalesGenius.ai</h1>
            <div className="h-6 w-px bg-border" />
            <h2 className="text-lg font-semibold text-foreground">{pageTitle}</h2>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* HubSpot Connection Status */}
          <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
            HubSpot Connected
          </Badge>

          {/* Action Icons */}
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm">
              <Bell className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <User className="w-4 h-4" />
            </Button>
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