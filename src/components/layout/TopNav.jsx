import React from 'react'

export const TopNav = () => {
  return (
    <header className="h-16 bg-card border-b border-border px-6 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        {/* Removed Dashboard text as requested */}
      </div>

      <div className="flex items-center space-x-4">
        {/* All icons and HubSpot badge moved to sidebar footer */}
      </div>
    </header>
  )
}