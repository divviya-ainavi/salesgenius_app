import React, { useState, useEffect } from 'react'
import { StepBasedWorkflow } from '@/components/followups/StepBasedWorkflow'
import { TranscriptUpload } from '@/components/followups/TranscriptUpload'
import { CallInsightsViewer } from '@/components/followups/CallInsightsViewer'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { ArrowRight, CheckCircle, ArrowLeft, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { aiAgents, dbHelpers, CURRENT_USER } from '@/lib/supabase'

// Import the new responsive component
import { ResponsiveCallWrapUp } from './ResponsiveCallWrapUp'

export const CallWrapUp = () => {
  // For now, we'll use the new responsive component
  // This maintains backward compatibility while providing the new layout
  return <ResponsiveCallWrapUp />
}