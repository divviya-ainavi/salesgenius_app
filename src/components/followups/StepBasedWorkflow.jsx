import React from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const steps = [
  { number: 1, title: 'Upload / Select Call', description: 'Upload transcript or select from Fathom' },
  { number: 2, title: 'Review Insights', description: 'Review and edit AI-generated content' },
  { number: 3, title: 'Push to HubSpot', description: 'Send approved content to CRM' }
]

export const StepBasedWorkflow = ({ currentStep, completedSteps }) => {
  return (
    <div className="bg-card border border-border rounded-lg p-6 mb-6">
      <h3 className="text-lg font-semibold mb-4">Call Wrap-Up Workflow</h3>
      
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center">
            {/* Step Circle */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-10 h-10 rounded-full border-2 flex items-center justify-center transition-colors",
                  completedSteps.includes(step.number)
                    ? "bg-green-500 border-green-500 text-white"
                    : currentStep === step.number
                    ? "bg-primary border-primary text-primary-foreground"
                    : "bg-background border-border text-muted-foreground"
                )}
              >
                {completedSteps.includes(step.number) ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-medium">{step.number}</span>
                )}
              </div>
              
              {/* Step Info */}
              <div className="mt-2 text-center max-w-32">
                <p className={cn(
                  "text-sm font-medium",
                  currentStep >= step.number ? "text-foreground" : "text-muted-foreground"
                )}>
                  {step.title}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {step.description}
                </p>
              </div>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-0.5 mx-4 transition-colors",
                  completedSteps.includes(step.number) ? "bg-green-500" : "bg-border"
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}