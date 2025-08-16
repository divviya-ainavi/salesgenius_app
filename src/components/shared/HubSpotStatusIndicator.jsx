import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Settings,
  Users,
  Calendar,
  Info,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

export const HubSpotStatusIndicator = ({ 
  showDetails = false, 
  variant = 'badge',
  onSetupClick = null 
}) => {
  const navigate = useNavigate();
  const { hubspotIntegration } = useSelector((state) => state.auth);

  const handleSetupClick = () => {
    if (onSetupClick) {
      onSetupClick();
    } else {
      navigate('/settings');
    }
  };

  if (variant === 'badge') {
    if (hubspotIntegration?.connected) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="default"
                className="bg-green-100 text-green-800 border-green-200 cursor-help"
              >
                <CheckCircle className="w-3 h-3 mr-1" />
                HubSpot Connected
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-sm">
                <p className="font-medium">HubSpot Integration Active</p>
                <p>Users: {hubspotIntegration.userCount}</p>
                {hubspotIntegration.lastSync && (
                  <p>Last sync: {new Date(hubspotIntegration.lastSync).toLocaleDateString()}</p>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    } else {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className="bg-yellow-100 text-yellow-800 border-yellow-200 cursor-help"
                onClick={handleSetupClick}
              >
                <AlertCircle className="w-3 h-3 mr-1" />
                HubSpot Setup Needed
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div className="text-sm">
                <p className="font-medium">HubSpot Not Connected</p>
                <p>{hubspotIntegration?.error || 'Integration not configured'}</p>
                <p className="text-blue-600 mt-1">Click to set up</p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
  }

  if (variant === 'card') {
    return (
      <Card className={hubspotIntegration?.connected ? 'border-green-200' : 'border-yellow-200'}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <div className="flex items-center space-x-2">
              <ExternalLink className="w-4 h-4" />
              <span>HubSpot Integration</span>
            </div>
            {hubspotIntegration?.connected ? (
              <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                <CheckCircle className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                <AlertCircle className="w-3 h-3 mr-1" />
                Not Connected
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {hubspotIntegration?.connected ? (
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className="text-green-600 font-medium">Active</span>
              </div>
              {hubspotIntegration.userCount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Connected Users:</span>
                  <span className="font-medium">{hubspotIntegration.userCount}</span>
                </div>
              )}
              {hubspotIntegration.lastSync && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Last Sync:</span>
                  <span className="font-medium">
                    {new Date(hubspotIntegration.lastSync).toLocaleDateString()}
                  </span>
                </div>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleSetupClick}
                className="w-full mt-2"
              >
                <Settings className="w-4 h-4 mr-1" />
                Manage Integration
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                {hubspotIntegration?.error || 'HubSpot integration is not configured for your organization.'}
              </div>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>Benefits of connecting HubSpot:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Sync companies and deals automatically</li>
                  <li>Push action items as HubSpot tasks</li>
                  <li>Send follow-up emails directly</li>
                  <li>Keep your CRM data up to date</li>
                </ul>
              </div>
              <Button
                onClick={handleSetupClick}
                className="w-full"
                size="sm"
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                Set Up HubSpot
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return null;
};

export default HubSpotStatusIndicator;