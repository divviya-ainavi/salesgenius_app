import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { 
  Search, 
  Phone, 
  Mail, 
  BarChart3, 
  Settings,
  FileText,
  CheckSquare,
  MessageSquare,
  Presentation,
  History,
  Bell,
  User
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const mainNavItems = [
  {
    title: 'Research',
    href: '/research',
    icon: Search,
    description: 'Customer research and insights'
  },
  {
    title: 'Sales Calls',
    href: '/calls',
    icon: Phone,
    description: 'Call management and recordings'
  },
  {
    title: 'Follow Ups',
    href: '/follow-ups',
    icon: Mail,
    description: 'Post-call follow-up automation',
    subItems: [
      {
        title: 'Call Wrap-Up',
        href: '/follow-ups/wrap-up',
        icon: FileText,
        description: 'AI-generated call summaries'
      },
      {
        title: 'Email Templates',
        href: '/follow-ups/emails',
        icon: MessageSquare,
        description: 'Follow-up email generation'
      },
      {
        title: 'Deck Builder',
        href: '/follow-ups/decks',
        icon: Presentation,
        description: 'Sales presentation prompts'
      },
      {
        title: 'Action Items',
        href: '/follow-ups/actions',
        icon: CheckSquare,
        description: 'Commitments and tasks'
      },
      {
        title: 'Processing History',
        href: '/follow-ups/processing-history',
        icon: History,
        description: 'View processed files and insights'
      }
    ]
  },
  {
    title: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    description: 'Performance metrics and insights'
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
    description: 'Account and integration settings'
  }
]

export const Sidebar = () => {
  const location = useLocation()

  const isActiveRoute = (href) => {
    if (href === '/follow-ups') {
      return location.pathname.startsWith('/follow-ups')
    }
    return location.pathname === href || location.pathname.startsWith(href + '/')
  }

  const isActiveSubRoute = (href) => {
    return location.pathname === href
  }

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col">
      {/* Logo - Aligned with main content */}
      <div className="h-24 p-6 border-b border-border flex flex-col justify-center">
        <h1 className="text-xl font-bold text-foreground">SalesGenius.ai</h1>
        <p className="text-sm text-muted-foreground mt-1">AI-Powered Sales Assistant</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {mainNavItems.map((item) => (
          <div key={item.href}>
            <NavLink
              to={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActiveRoute(item.href)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.title}</span>
            </NavLink>

            {/* Sub-navigation for Follow Ups */}
            {item.subItems && isActiveRoute(item.href) && (
              <div className="ml-8 mt-2 space-y-1">
                {item.subItems.map((subItem) => (
                  <NavLink
                    key={subItem.href}
                    to={subItem.href}
                    className={cn(
                      "flex items-center space-x-3 px-3 py-2 rounded-md text-sm transition-colors",
                      isActiveSubRoute(subItem.href)
                        ? "bg-accent text-accent-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    )}
                  >
                    <subItem.icon className="w-4 h-4" />
                    <span>{subItem.title}</span>
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Footer with moved icons and HubSpot status */}
      <div className="p-4 border-t border-border">
        <div className="flex flex-col items-center space-y-4">
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

        {/* Copyright */}
        <div className="text-xs text-muted-foreground text-center mt-4">
          <p>© 2024 SalesGenius.ai</p>
          <p>Version 1.0.0</p>
        </div>
      </div>
    </div>
  )
}