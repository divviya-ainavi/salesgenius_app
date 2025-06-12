import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { 
  Search, 
  Phone, 
  Mail, 
  BarChart3, 
  FileText,
  CheckSquare,
  MessageSquare,
  Presentation,
  History
} from 'lucide-react'
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

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="text-xs text-muted-foreground text-center">
          <p>© 2024 SalesGenius.ai</p>
          <p>Version 1.0.0</p>
        </div>
      </div>
    </div>
  )
}