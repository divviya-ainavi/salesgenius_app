import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, XCircle, AlertCircle, Settings, RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

const connectionStatuses = {
  connected: {
    icon: CheckCircle,
    color: 'bg-green-100 text-green-800 border-green-200',
    label: 'Connected',
    description: 'HubSpot integration is active and working'
  },
  disconnected: {
    icon: XCircle,
    color: 'bg-red-100 text-red-800 border-red-200',
    label: 'Disconnected',
    description: 'HubSpot integration is not connected'
  },
  error: {
    icon: AlertCircle,
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    label: 'Connection Error',
    description: 'There was an issue with the HubSpot connection'
  }
}

export const CRMConnectionStatus = ({ 
  status = 'connected', 
  lastSync = null,
  onReconnect,
  onSettings,
  accountInfo = null
}) => {
  const config = connectionStatuses[status]
  const Icon = config.icon

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-lg font-semibold">CRM Connection</CardTitle>
        <Badge variant="outline" className={cn("text-xs", config.color)}>
          <Icon className="w-3 h-3 mr-1" />
          {config.label}
        </Badge>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-2">
            {config.description}
          </p>
          
          {accountInfo && status === 'connected' && (
            <div className="bg-muted rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Account:</span>
                <span className="font-medium">{accountInfo.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Hub ID:</span>
                <span className="font-mono text-xs">{accountInfo.hubId}</span>
              </div>
              {lastSync && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Last Sync:</span>
                  <span className="text-xs">{lastSync}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex space-x-2">
          {status === 'connected' ? (
            <>
              <Button variant="outline" size="sm" onClick={onReconnect}>
                <RefreshCw className="w-4 h-4 mr-1" />
                Refresh
              </Button>
              <Button variant="outline" size="sm" onClick={onSettings}>
                <Settings className="w-4 h-4 mr-1" />
                Settings
              </Button>
            </>
          ) : (
            <Button onClick={onReconnect} size="sm" className="w-full">
              Connect to HubSpot
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}