import React, { useState, useEffect } from 'react';
import Joyride, { ACTIONS, EVENTS, STATUS } from 'react-joyride';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { dbHelpers } from '@/lib/supabase';
import { analytics } from '@/lib/analytics';
import { setHasSeenOnboardingTour } from '@/store/slices/authSlice';

// Sales Calls specific tour steps
const salesCallsTourSteps = [
  {
    target: 'body',
    content: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Welcome to Sales Calls! 📞</h3>
        <p>Let's walk through how to upload and process your call transcripts to get AI-powered insights.</p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="file-upload-area"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Step 2: Drop Your Transcript Here 📁</h3>
        <p>Drop your transcript file here or click to browse. This is where you upload your call recordings or transcript files.</p>
        <p className="text-sm text-gray-600 mt-2">Supported formats: TXT, VTT, PDF, and audio files</p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[data-tour="recent-uploads-tab"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Step 3: Process Uploaded Files 📋</h3>
        <p>After uploading, your files appear here. Click the "Process" button on any file to start AI analysis.</p>
      </div>
    ),
    placement: 'top',
  },
  {
    target: '[data-tour="process-button"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Step 4: Start Processing ⚡</h3>
        <p>Click "Process" to begin AI analysis. This will open a dialog where you'll associate the call with a company and prospect.</p>
      </div>
    ),
    placement: 'left',
     spotlightClicks: true,
  },
  {
    target: '[data-tour="company-selector"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Step 5: Create or Select Company 🏢</h3>
        <p>Search for the company this call was with. If it's new, click "Create New Company" to add it to your database.</p>
      </div>
    ),
    placement: 'right',
  },
  {
    target: '[data-tour="prospect-selector"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Step 6: Create or Select Prospect 👤</h3>
        <p>After selecting a company, choose the specific prospect (deal/opportunity). Click "Create New Prospect" if this is a new opportunity.</p>
      </div>
    ),
    placement: 'right',
  },
  {
    target: '[data-tour="fireflies-tab"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Step 7: Fireflies Integration 🔥</h3>
        <p>Alternative to manual uploads: Connect with Fireflies.ai to automatically import your recorded calls and transcripts.</p>
      </div>
    ),
    placement: 'top',
  },
  {
    target: '[data-tour="fireflies-connect"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Step 8: Connect Your Account 🔗</h3>
        <p>Click here to connect your Fireflies.ai account for automatic call import and processing.</p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: 'body',
    content: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Sales Calls Tour Complete! 🎉</h3>
        <p>You now know how to upload transcripts, process them with AI, and organize them by company and prospect. Start by uploading your first call transcript!</p>
      </div>
    ),
    placement: 'center',
  },
];

export const SalesCallsTour = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();
  
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  // Check if tour should run for first-time users
  useEffect(() => {
    const shouldRunTour = () => {
      // This tour is now manually triggered from login
      // Don't auto-run based on conditions
      return false;
    };

    if (shouldRunTour()) {
      // Small delay to ensure DOM elements are rendered
      const timer = setTimeout(() => {
        setRun(true);
      }, 1500); // Slightly longer delay for Sales Calls tour

      return () => clearTimeout(timer);
    }
  }, [user, location.pathname]);

  const handleJoyrideCallback = async (data) => {
    const { action, index, status, type } = data;

    // Track tour events
    analytics.track('sales_calls_tour_event', {
      action,
      step_index: index,
      status,
      type,
      step_target: salesCallsTourSteps[index]?.target,
    });

    if ([EVENTS.STEP_AFTER, EVENTS.TARGET_NOT_FOUND].includes(type)) {
      // Update step index
      setStepIndex(index + (action === ACTIONS.PREV ? -1 : 1));
    } else if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      // Tour completed or skipped
      await handleTourComplete(status === STATUS.SKIPPED);
    }
  };

  const handleTourComplete = async (wasSkipped = false) => {
    try {
      // Update database to mark tour as seen
      await dbHelpers.updateOnboardingTourStatus(user.id, true);
      
      // Stop the tour
      setRun(false);
      setStepIndex(0);
      
      // Track completion
      analytics.track('sales_calls_tour_completed', {
        was_skipped: wasSkipped,
        completed_steps: stepIndex + 1,
        total_steps: salesCallsTourSteps.length,
      });

      console.log('✅ Sales Calls tour completed and saved to database');
    } catch (error) {
      console.error('❌ Error completing Sales Calls tour:', error);
      setRun(false);
    }
  };

  // Manual tour start function
  const startTour = () => {
    setStepIndex(0);
    setRun(true);
    
    analytics.track('sales_calls_tour_restarted', {
      page: location.pathname,
      trigger: 'manual',
    });
  };

  // Expose start function globally
  useEffect(() => {
    window.startSalesCallsTour = startTour;
    
    return () => {
      delete window.startSalesCallsTour;
    };
  }, []);

  return (
    <Joyride
      steps={salesCallsTourSteps}
      run={run}
      stepIndex={stepIndex}
      continuous={true}
      showProgress={true}
      showSkipButton={true}
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#3b82f6',
          backgroundColor: '#ffffff',
          textColor: '#374151',
          overlayColor: 'rgba(0, 0, 0, 0.4)',
          spotlightShadow: '0 0 15px rgba(0, 0, 0, 0.5)',
          beaconSize: 36,
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: 8,
          padding: 20,
          fontSize: 14,
          maxWidth: 400,
        },
        tooltipContainer: {
          textAlign: 'left',
        },
        tooltipTitle: {
          fontSize: 18,
          fontWeight: 600,
          marginBottom: 8,
        },
        buttonNext: {
          backgroundColor: '#3b82f6',
          borderRadius: 6,
          padding: '8px 16px',
          fontSize: 14,
          fontWeight: 500,
        },
        buttonBack: {
          color: '#6b7280',
          marginRight: 10,
          fontSize: 14,
        },
        buttonSkip: {
          color: '#6b7280',
          fontSize: 14,
        },
        buttonClose: {
          color: '#6b7280',
          fontSize: 14,
        },
      }}
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Finish',
        next: 'Next',
        skip: 'Skip Tour',
      }}
    />
  );
};

export default SalesCallsTour;