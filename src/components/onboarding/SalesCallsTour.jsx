import React, { useState, useEffect } from "react";
import Joyride, { ACTIONS, EVENTS, STATUS } from "react-joyride";
import { useSelector, useDispatch } from "react-redux";
import { useLocation } from "react-router-dom";
import { dbHelpers } from "@/lib/supabase";
import { analytics } from "@/lib/analytics";
import { setHasSeenOnboardingTour } from "@/store/slices/authSlice";

import { supabase } from "@/lib/supabase";

export const SalesCallsTour = () => {
  const dispatch = useDispatch();
  const { user, userRole } = useSelector((state) => state.auth);
  const location = useLocation();

  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [tourSteps, setTourSteps] = useState([]);
  const [isLoadingSteps, setIsLoadingSteps] = useState(true);

  // Check if user is super admin
  const isSuperAdmin = userRole?.key === "super_admin";

  // Load tour steps from database
  useEffect(() => {
    loadTourSteps();
  }, []);

  const loadTourSteps = async () => {
    try {
      setIsLoadingSteps(true);

      const { data, error } = await supabase
        .from("tour_steps")
        .select("*")
        .eq("is_active", true)
        .order("step_order", { ascending: true });

      if (error) {
        console.error("Error loading tour steps:", error);
        // Fallback to empty array if database fails
        setTourSteps([]);
        return;
      }

      // Transform database data to Joyride format
      const transformedSteps = data.map((step) => ({
        target: step.target,
        content: (
          <div>
            <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
            <div
              className="prose prose-sm max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ __html: step.content }}
            />
            {/* <div 
              dangerouslySetInnerHTML={{ 
                __html: step.content.replace(/\n/g, '<br />') 
              }} 
            /> */}
          </div>
        ),
        placement: step.placement || "right",
        disableBeacon: step.disable_beacon || false,
      }));

      setTourSteps(transformedSteps);
    } catch (error) {
      console.error("Error loading tour steps:", error);
      setTourSteps([]);
    } finally {
      setIsLoadingSteps(false);
    }
  };

  // Tour should NOT auto-run - only manual trigger
  useEffect(() => {
    // This tour is only triggered manually - no auto-start
    // Auto-start is handled from LoginPage for first-time users only
  }, []);

  const handleJoyrideCallback = async (data) => {
    const { action, index, status, type } = data;

    // Track tour events
    analytics.track("complete_sales_flow_tour_event", {
      action,
      step_index: index,
      status,
      type,
      step_target: tourSteps[index]?.target,
    });

    if ([EVENTS.STEP_AFTER, EVENTS.TARGET_NOT_FOUND].includes(type)) {
      if (action === ACTIONS.PREV) {
        setStepIndex(index - 1);
      } else if (action === ACTIONS.NEXT) {
        setStepIndex(index + 1);
      } else {
        // Don't change stepIndex for other actions like 'close'
        setStepIndex(index);
      }
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
      analytics.track("complete_sales_flow_tour_completed", {
        was_skipped: wasSkipped,
        completed_steps: stepIndex + 1,
        total_steps: tourSteps.length,
      });

      console.log(
        "✅ Complete Sales Flow tour completed and saved to database"
      );
    } catch (error) {
      console.error("❌ Error completing Complete Sales Flow tour:", error);
      setRun(false);
    }
  };

  // Manual tour start function
  const startTour = () => {
    if (isLoadingSteps || tourSteps.length === 0) {
      console.warn("Tour steps not loaded yet or empty", {
        isLoadingSteps,
        stepsCount: tourSteps.length,
      });
      return;
    }

    console.log("🎯 Starting tour manually with steps:", tourSteps.length);
    setStepIndex(0);
    setRun(true);

    analytics.track("sales_calls_tour_restarted", {
      page: location.pathname,
      trigger: "manual",
    });
  };

  // Expose start function globally
  useEffect(() => {
    console.log("🔧 Exposing tour functions globally", {
      stepsLoaded: !isLoadingSteps,
      stepsCount: tourSteps.length,
    });
    window.startSalesCallsTour = startTour;
    window.replaySalesFlowTour = startTour;

    return () => {
      delete window.startSalesCallsTour;
      delete window.replaySalesFlowTour;
    };
  }, [isLoadingSteps, tourSteps.length]);

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
          primaryColor: "#3b82f6",
          backgroundColor: "#ffffff",
          textColor: "#374151",
          overlayColor: "rgba(0, 0, 0, 0.4)",
          spotlightShadow: "0 0 15px rgba(0, 0, 0, 0.5)",
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
          textAlign: "left",
        },
        tooltipTitle: {
          fontSize: 18,
          fontWeight: 600,
          marginBottom: 8,
        },
        buttonNext: {
          backgroundColor: "#3b82f6",
          borderRadius: 6,
          padding: "8px 16px",
          fontSize: 14,
          fontWeight: 500,
        },
        buttonBack: {
          color: "#6b7280",
          marginRight: 10,
          fontSize: 14,
        },
        buttonSkip: {
          color: "#6b7280",
          fontSize: 14,
        },
        buttonClose: {
          color: "#6b7280",
          fontSize: 14,
        },
      }}
      locale={{
        back: "Back",
        close: "Close",
        last: "Finish",
        next: "Next",
        skip: "Skip Tour",
      }}
    />
  );
};

export default SalesCallsTour;
