import React from 'react'
import { Button } from '@/components/ui/button'
import { useAnalytics } from '@/hooks/useAnalytics'

// Enhanced Button component with automatic analytics tracking
export const TrackedButton = React.forwardRef(({ 
  children, 
  onClick, 
  trackingName,
  trackingContext = {},
  ...props 
}, ref) => {
  const { trackButtonClick } = useAnalytics()

  const handleClick = (event) => {
    // Track the button click
    if (trackingName) {
      trackButtonClick(trackingName, trackingContext)
    }

    // Call the original onClick handler
    if (onClick) {
      onClick(event)
    }
  }

  return (
    <Button ref={ref} onClick={handleClick} {...props}>
      {children}
    </Button>
  )
})

TrackedButton.displayName = "TrackedButton"