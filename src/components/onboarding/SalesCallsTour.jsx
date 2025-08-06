import React, { useState, useEffect } from "react";
import Joyride, { ACTIONS, EVENTS, STATUS } from "react-joyride";
import { useSelector, useDispatch } from "react-redux";
import { useLocation } from "react-router-dom";
import { dbHelpers } from "@/lib/supabase";
import { analytics } from "@/lib/analytics";
import { setHasSeenOnboardingTour } from "@/store/slices/authSlice";

// Sales Calls specific tour steps
const completeSalesFlowTourSteps = [
  {
    target: "body",
    content: (
      <div>
        <h3 className="text-lg font-semibold mb-2">
          Welcome to SalesGenius.ai! 🎉
        </h3>
        <p>
          Let's take a complete tour of your AI-powered sales assistant and
          learn how to maximize your sales success!
        </p>
      </div>
    ),
    placement: "center",
    disableBeacon: true,
  },
  {
    target: '[data-tour="research"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Step 1: Research 🔍</h3>
        <p>
          Start here to research companies and prospects. Get AI-powered
          insights about your target companies, key stakeholders, and strategic
          talking points before your sales calls.
        </p>
        <p className="text-sm text-gray-600 mt-2">
          Enter company name and website to get comprehensive analysis and
          recommendations.
        </p>
      </div>
    ),
    placement: "right",
  },
  {
    target: '[data-tour="sales-calls"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Step 2: Sales Calls 📞</h3>
        <p>
          Upload your call transcripts or connect with Fireflies.ai to
          automatically process your sales conversations.
        </p>
        <p>
          Upload files, process them by selecting company and prospect, then get
          AI-powered analysis.
        </p>
      </div>
    ),
    placement: "right",
  },
  {
    target: '[data-tour="file-upload-area"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold mb-2">
          Step 2: Drop Your Transcript Here 📁
        </h3>
        <p>
          Drop your transcript file here or click to browse. This is where you
          upload your call recordings or transcript files.
        </p>
        <p className="text-sm text-gray-600 mt-2">
          Supported formats: TXT, VTT, PDF, and audio files
        </p>
      </div>
    ),
    placement: "bottom",
  },
  {
    target: '[data-tour="recent-uploads-tab"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold mb-2">
          Steps 3–6: Process Uploaded Calls 📋
        </h3>
        <p>
          Once you upload a file, it will appear here. Click the{" "}
          <strong>"Process"</strong> button to begin AI analysis. A dialog will
          open where you can:
        </p>
        <ul className="list-disc pl-5 my-2">
          <li>
            <strong>Select or create a company 🏢</strong> – Search for the
            company the call was with, or add a new one.
          </li>
          <li>
            <strong>Select or create a prospect 👤</strong> – Choose the
            relevant deal or create a new opportunity.
          </li>
        </ul>
        <p>
          After setting these, the AI will start processing the call and
          extracting insights.
        </p>
      </div>
    ),
    placement: "top",
  },
  {
    target: '[data-tour="call-insights"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Step 3: Call Insights ✨</h3>
        <p>
          After processing your calls, view AI-generated insights including call
          summaries, sales insights, and communication styles for each prospect.
        </p>
        <p className="text-sm text-gray-600 mt-2">
          Understand your prospects better with detailed analysis and
          recommendations.
        </p>
      </div>
    ),
    placement: "right",
  },
  {
    target: '[data-tour="follow-ups"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Step 4: Follow-ups 📧</h3>
        <p>
          Generate personalized follow-up content based on your processed calls:
        </p>
        <ul className="list-disc pl-5 my-2 text-sm">
          <li>
            <strong>Email</strong> - AI-generated follow-up emails
          </li>
          <li>
            <strong>Presentation</strong> - Custom presentation prompts
          </li>
          <li>
            <strong>Actions</strong> - Track commitments and action items
          </li>
        </ul>
        <p className="text-sm text-gray-600">
          All content is personalized for your specific prospects and call
          context.
        </p>
      </div>
    ),
    placement: "right",
  },
  {
    target: '[data-tour="analytics"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Step 5: Analytics 📊</h3>
        <p>
          Track your sales performance with detailed analytics including time
          spent on different activities, call metrics, and sales insights.
        </p>
        <p className="text-sm text-gray-600 mt-2">
          Monitor your progress and optimize your sales process with data-driven
          insights.
        </p>
      </div>
    ),
    placement: "right",
  },
  {
    target: '[data-tour="settings"]',
    content: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Step 6: Settings ⚙️</h3>
        <p>
          Manage your profile, update organization details, connect integrations
          like HubSpot and Fireflies, and customize your experience.
        </p>
        <p className="text-sm text-gray-600 mt-2">
          Configure your account to match your sales workflow and preferences.
        </p>
      </div>
    ),
    placement: "right",
  },
  // {
  //   target: '.fixed.bottom-4.right-4',
  //   content: (
  //     <div>
  //       <h3 className="text-lg font-semibold mb-2">Step 7: Feedback 💬</h3>
  //       <p>
  //         Have feedback or issues? Click the feedback button to share your thoughts and help us improve SalesGenius.ai.
  //       </p>
  //       <p className="text-sm text-gray-600 mt-2">
  //         Your feedback is valuable and helps us make the platform better for everyone.
  //       </p>
  //     </div>
  //   ),
  //   placement: "left",
  // },
  {
    target: "body",
    content: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Tour Complete! 🚀</h3>
        <p>
          You're now ready to use SalesGenius.ai! Start with research, process
          your calls, and leverage AI to close more deals. You can replay this
          tour anytime from the guidelines icon.
        </p>
      </div>
    ),
    placement: "center",
  },
];

export const SalesCallsTour = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();

  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

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
      step_target: completeSalesFlowTourSteps[index]?.target,
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
      analytics.track("complete_sales_flow_tour_completed", {
        was_skipped: wasSkipped,
        completed_steps: stepIndex + 1,
        total_steps: completeSalesFlowTourSteps.length,
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
    setStepIndex(0);
    setRun(true);

    analytics.track("sales_calls_tour_restarted", {
      page: location.pathname,
      trigger: "guidelines_icon",
      trigger: "manual",
    });
  };

  // Expose start function globally
  useEffect(() => {
    window.startSalesCallsTour = startTour;
    window.replaySalesFlowTour = startTour;

    return () => {
      delete window.startSalesCallsTour;
      delete window.replaySalesFlowTour;
    };
  }, []);

  return (
    <Joyride
      steps={completeSalesFlowTourSteps}
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
