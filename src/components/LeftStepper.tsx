
import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeftStepperProps {
  currentStep: number;
  completedSteps: number[];
}

const steps = [
  { number: 1, title: 'Upload / Select Call' },
  { number: 2, title: 'Review Insights' },
  { number: 3, title: 'Push to HubSpot' },
];

export const LeftStepper: React.FC<LeftStepperProps> = ({ currentStep, completedSteps }) => {
  return (
    <div className="w-80 bg-card border-r border-border p-6 sticky top-0 h-screen overflow-y-auto">
      <div className="space-y-6">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.number);
          const isCurrent = currentStep === step.number;
          const isActive = currentStep >= step.number;

          return (
            <div key={step.number} className="flex items-start space-x-4">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors",
                    isCompleted
                      ? "bg-green-500 border-green-500 text-white"
                      : isActive
                      ? "bg-primary border-primary text-primary-foreground"
                      : "bg-background border-border text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span className="text-sm font-medium">{step.number}</span>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "w-0.5 h-12 mt-2 transition-colors",
                      isCompleted ? "bg-green-500" : "bg-border"
                    )}
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3
                  className={cn(
                    "text-sm font-medium transition-colors",
                    isActive ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {step.title}
                </h3>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
