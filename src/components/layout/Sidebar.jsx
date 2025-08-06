import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Search,
  Phone,
  Sparkles,
  BarChart3,
  FileText,
  CheckSquare,
  MessageSquare,
  Presentation,
  Mail,
  Settings,
  Users,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CURRENT_USER } from "@/lib/supabase";

const mainNavItems = [
  {
    title: "Research",
    href: "/research",
    icon: Search,
    description: "Customer research and insights",
  },
  {
    title: "Sales Calls",
    href: "/calls",
    icon: Phone,
    description: "Call data loading and management",
  },
  {
    title: "Call Insights",
    href: "/call-insights",
    icon: Sparkles,
    description: "AI-driven prospect understanding",
  },
  {
    title: "Follow Ups",
    href: null, // Make non-clickable
    icon: FileText,
    description: "Post-call follow-up automation",
    subItems: [
      {
        title: "Email",
        href: "/follow-ups/emails",
        icon: Mail,
        description: "Follow-up email generation",
      },
      {
        title: "Presentation",
        href: "/follow-ups/decks",
        icon: Presentation,
        description: "Sales presentation prompts",
      },
      {
        title: "Actions",
        href: "/follow-ups/actions",
        icon: CheckSquare,
        description: "Commitments and tasks",
      },
    ],
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    description: "Performance metrics and insights",
  },
  {
    title: "Settings",
    href: "/settings",
    icon: Settings,
    description: "Account and application settings",
  },
];

// Admin navigation items - only shown to admin users
const adminNavItems = [
  {
    title: "User Management",
    href: "/admin/users",
    icon: Users,
    description: "Manage users, roles, and organizations",
    requiredRoles: ["super_admin", "org_admin"],
  },
];

export const Sidebar = () => {
  const location = useLocation();
  const userRole = CURRENT_USER.role_key;

  const isActiveRoute = (href) => {
    if (!href) return false; // For non-clickable items
    return (
      location.pathname === href || location.pathname.startsWith(href + "/")
    );
  };

  const isActiveSubRoute = (href) => {
    return location.pathname === href;
  };

  const shouldShowSubItems = (item) => {
    if (!item.subItems) return false;

    if (item.title === "Follow Ups") {
      // Always show Follow Ups sub-items
      return true;
    }

    return false;
  };

  const isFollowUpsSectionActive = () => {
    return location.pathname.startsWith("/follow-ups");
  };

  // Filter admin items based on user role
  const filteredAdminItems = adminNavItems.filter((item) => {
    if (!item.requiredRoles) return true;
    return item.requiredRoles.includes(userRole);
  });

  const hasAdminAccess = filteredAdminItems.length > 0;

  return (
    <div className="w-64 bg-card border-r border-border flex flex-col">
      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {mainNavItems.map((item) => (
          <div key={item.title}>
            {item.href ? (
              <NavLink
                to={item.href}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActiveRoute(item.href)
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
                data-tour={
                  item.title === "Research"
                    ? "research"
                    : item.title === "Sales Calls"
                    ? "sales-calls"
                    : item.title === "Call Insights"
                    ? "call-insights"
                    : item.title === "Analytics"
                    ? "analytics"
                    : item.title === "Settings"
                    ? "settings"
                    : undefined
                }
              >
                <item.icon className="w-5 h-5" />
                <span>{item.title}</span>
              </NavLink>
            ) : (
              // Non-clickable Follow Ups header
              <div
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium",
                  isFollowUpsSectionActive()
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground"
                )}
                data-tour="follow-ups"
              >
                <item.icon className="w-5 h-5" />
                <span>{item.title}</span>
              </div>
            )}

            {/* Sub-navigation for Follow Ups */}
            {item.subItems && shouldShowSubItems(item) && (
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
                    data-tour={
                      subItem.title === "Email"
                        ? "menu-email"
                        : subItem.title === "Presentation"
                        ? "menu-presentation"
                        : subItem.title === "Actions"
                        ? "menu-actions"
                        : undefined
                    }
                  >
                    <subItem.icon className="w-4 h-4" />
                    <span>{subItem.title}</span>
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Admin Section - Only shown to users with admin roles */}
        {hasAdminAccess && (
          <>
            <div className="pt-2 pb-2">
              <div className="px-3 py-2">
                <div className="h-px bg-border" />
              </div>
            </div>

            <div className="px-3 py-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Administration
              </p>
            </div>

            {filteredAdminItems.map((item) => (
              <NavLink
                key={item.title}
                to={item.href}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActiveRoute(item.href)
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.title}</span>
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="text-xs text-muted-foreground text-center">
          <p>© 2025 SalesGenius.ai</p>
          <p>Version 1.1.0</p>
        </div>
      </div>
    </div>
  );
};
