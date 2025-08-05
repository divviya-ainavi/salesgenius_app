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
    target: '.react-dropzone',
    content: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Step 1: Upload Your Transcript 📁</h3>
        <p>Start by uploading your call transcript file here. You can drag and drop files or click to browse.</p>
        <p className="text-sm text-gray-600 mt-2">Supported formats: TXT, VTT, PDF, and audio files</p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '[role="tab"]:nth-child(2)',
    content: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Step 2: Check Recent Uploads 📋</h3>
        <p>After uploading, your files will appear in the "Recent Uploads" tab. This is where you'll manage and process your transcripts.</p>
      </div>
    ),
    placement: 'top',
  },
  {
    target: 'button:has-text("Process")',
    content: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Step 3: Process Your Transcript ⚡</h3>
        <p>Click the "Process" button to start AI analysis of your call transcript. This will extract insights, action items, and generate follow-up content.</p>
      </div>
    ),
    placement: 'left',
     spotlightClicks: true,
  },
  {
    target: 'input[placeholder*="Search for a company"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Step 4: Select or Create Company 🏢</h3>
        <p>Choose the company this call was with. If it's a new company, you can create it by typing the name and clicking "Create New Company".</p>
      </div>
    ),
    placement: 'right',
  },
  {
    target: 'input[placeholder*="Search for a prospect"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Step 5: Select or Create Prospect 👤</h3>
        <p>Now select the specific prospect (deal/opportunity) this call was about. You can create a new prospect if needed.</p>
      </div>
    ),
    placement: 'right',
  },
  {
    target: '[role="tab"]:nth-child(3)',
    content: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Step 6: Fireflies Integration 🔥</h3>
        <p>You can also connect with Fireflies.ai to automatically import your recorded calls and transcripts.</p>
      </div>
    ),
    placement: 'top',
  },
  {
    target: 'button:has-text("Connect Fireflies")',
    content: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Step 7: Connect Fireflies 🔗</h3>
        <p>Click here to connect your Fireflies.ai account and automatically sync your call recordings.</p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: 'body',
    content: (
      <div>
        <h3 className="text-lg font-semibold mb-2">You're Ready to Go! 🎉</h3>
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