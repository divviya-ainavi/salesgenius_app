import React, { useState, useEffect } from 'react';
import Joyride, { ACTIONS, EVENTS, STATUS } from 'react-joyride';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { dbHelpers } from '@/lib/supabase';
import { analytics } from '@/lib/analytics';
import { setHasSeenOnboardingTour } from '@/store/slices/authSlice';

// Tour steps configuration
const tourSteps = [
  {
    target: 'body',
    content: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Welcome to SalesGenius.ai! 🎉</h3>
        <p>Let's take a quick tour to help you get started with our AI-powered sales assistant.</p>
      </div>
    ),
    placement: 'center',
    disableBeacon: true,
  },
  {
    target: '[data-tour="research"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Research 🔍</h3>
        <p>Start here to research companies and prospects. Get AI-powered insights to prepare for your sales calls.</p>
      </div>
    ),
    placement: 'right',
  },
  {
    target: '[data-tour="sales-calls"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Sales Calls 📞</h3>
        <p>Upload call transcripts or connect with Fireflies.ai to automatically process your sales conversations.</p>
      </div>
    ),
    placement: 'right',
  },
  {
    target: '[data-tour="call-insights"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Call Insights ✨</h3>
        <p>View AI-generated insights from your calls, including summaries, action items, and communication styles.</p>
      </div>
    ),
    placement: 'right',
  },
  {
    target: '[data-tour="follow-ups"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Follow-ups 📧</h3>
        <p>Generate personalized follow-up emails, presentation prompts, and manage action items from your calls.</p>
      </div>
    ),
    placement: 'right',
  },
  {
    target: '[data-tour="analytics"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Analytics 📊</h3>
        <p>Track your sales performance, call metrics, and gain insights into your sales process.</p>
      </div>
    ),
    placement: 'right',
  },
  {
    target: '[data-tour="settings"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Settings ⚙️</h3>
        <p>Manage your profile, connect integrations like HubSpot and Fireflies, and customize your experience.</p>
      </div>
    ),
    placement: 'right',
  },
  {
    target: '[data-tour="user-dropdown"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold mb-2">User Menu 👤</h3>
        <p>Access your profile, account settings, and logout from here.</p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: 'body',
    content: (
      <div>
        <h3 className="text-lg font-semibold mb-2">You're all set! 🚀</h3>
        <p>You can restart this tour anytime from Settings → Profile → Reset Tour. Happy selling!</p>
      </div>
    ),
    placement: 'center',
  },
];

export const OnboardingTour = () => {
  const dispatch = useDispatch();
  const { user, hasSeenOnboardingTour } = useSelector((state) => state.auth);
  const location = useLocation();
  
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  // Check if tour should run
  useEffect(() => {
    const shouldRunTour = () => {
      // Don't run if user hasn't been loaded yet
      if (!user) {
        return false;
      }

      // Don't run if user has already seen the tour
      if (hasSeenOnboardingTour) {
        return false;
      }

      // Only run on main app pages (not auth pages)
      if (location.pathname.startsWith('/auth/')) {
        return false;
      }

      // Run the tour
      return true;
    };

    if (shouldRunTour()) {
      // Small delay to ensure DOM elements are rendered
      const timer = setTimeout(() => {
        setRun(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [user, hasSeenOnboardingTour, location.pathname]);

  const handleJoyrideCallback = async (data) => {
    const { action, index, status, type } = data;

    // Track tour events
    analytics.track('onboarding_tour_event', {
      action,
      step_index: index,
      status,
      type,
      step_target: tourSteps[index]?.target,
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
      // Update database
      await dbHelpers.updateOnboardingTourStatus(user.id, true);
      
      // Update Redux state
      dispatch(setHasSeenOnboardingTour(true));
      
      // Stop the tour
      setRun(false);
      setStepIndex(0);
      
      // Track completion
      analytics.track('onboarding_tour_completed', {
        was_skipped: wasSkipped,
        completed_steps: stepIndex + 1,
        total_steps: tourSteps.length,
      });

      console.log('✅ Onboarding tour completed and saved to database');
    } catch (error) {
      console.error('❌ Error completing onboarding tour:', error);
      // Still update Redux state even if database update fails
      dispatch(setHasSeenOnboardingTour(true));
      setRun(false);
    }
  };

  // Manual tour restart (called from Settings)
  const restartTour = () => {
    setStepIndex(0);
    setRun(true);
    
    analytics.track('onboarding_tour_restarted', {
      page: location.pathname,
    });
  };

  // Expose restart function globally for Settings page
  useEffect(() => {
    window.restartOnboardingTour = restartTour;
    
    return () => {
      delete window.restartOnboardingTour;
    };
  }, []);

  return (
    <Joyride
      steps={tourSteps}
      run={run}
      stepIndex={stepIndex}
      continuous={true}
      showProgress={true}
      showSkipButton={true}
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#3b82f6', // Blue color matching your theme
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

export default OnboardingTour;