import React from 'react'
import { cn } from '@/lib/utils'

// Grid Container Component
export const GridContainer = ({ children, className, ...props }) => {
  return (
    <div 
      className={cn(
        "w-full max-w-7xl mx-auto px-6",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// Grid Row Component
export const GridRow = ({ children, className, gap = "24px", ...props }) => {
  return (
    <div 
      className={cn(
        "grid grid-cols-12 w-full",
        className
      )}
      style={{ gap }}
      {...props}
    >
      {children}
    </div>
  )
}

// Grid Column Component
export const GridCol = ({ 
  children, 
  className, 
  span = 12, 
  spanMd = null, 
  spanLg = null, 
  spanXl = null,
  offset = 0,
  offsetMd = null,
  offsetLg = null,
  offsetXl = null,
  ...props 
}) => {
  // Build responsive classes
  const getColClass = (size, value) => {
    if (value === null) return ''
    if (size === 'base') return `col-span-${value}`
    return `${size}:col-span-${value}`
  }

  const getOffsetClass = (size, value) => {
    if (value === null || value === 0) return ''
    if (size === 'base') return `col-start-${value + 1}`
    return `${size}:col-start-${value + 1}`
  }

  const colClasses = cn(
    getColClass('base', span),
    getColClass('md', spanMd),
    getColClass('lg', spanLg),
    getColClass('xl', spanXl),
    getOffsetClass('base', offset),
    getOffsetClass('md', offsetMd),
    getOffsetClass('lg', offsetLg),
    getOffsetClass('xl', offsetXl),
    className
  )

  return (
    <div className={colClasses} {...props}>
      {children}
    </div>
  )
}

// Card Component with consistent styling
export const GridCard = ({ 
  children, 
  className, 
  padding = "24px",
  elevation = "default",
  ...props 
}) => {
  const elevationClasses = {
    none: "",
    default: "shadow-sm hover:shadow-md transition-shadow duration-200",
    medium: "shadow-md hover:shadow-lg transition-shadow duration-200",
    high: "shadow-lg hover:shadow-xl transition-shadow duration-200"
  }

  return (
    <div 
      className={cn(
        "bg-card border border-border rounded-lg",
        elevationClasses[elevation],
        className
      )}
      style={{ padding }}
      {...props}
    >
      {children}
    </div>
  )
}

// Sidebar Layout Component
export const SidebarLayout = ({ 
  children, 
  sidebar, 
  sidebarWidth = 2,
  contentWidth = 10,
  className,
  ...props 
}) => {
  return (
    <GridContainer className={className} {...props}>
      <GridRow>
        <GridCol span={12} lg={sidebarWidth}>
          {sidebar}
        </GridCol>
        <GridCol span={12} lg={contentWidth}>
          {children}
        </GridCol>
      </GridRow>
    </GridContainer>
  )
}

// Vertical Spacer Component
export const VerticalSpacer = ({ size = "24px", className }) => {
  return (
    <div 
      className={cn("w-full", className)}
      style={{ height: size }}
    />
  )
}

// Section Component with consistent spacing
export const Section = ({ 
  children, 
  className, 
  spacing = "24px",
  ...props 
}) => {
  return (
    <section 
      className={cn("w-full", className)}
      style={{ marginBottom: spacing }}
      {...props}
    >
      {children}
    </section>
  )
}