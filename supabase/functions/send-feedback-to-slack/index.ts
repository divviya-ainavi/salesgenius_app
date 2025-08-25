const SLACK_WEBHOOK_URL = "https://hooks.slack.com/services/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";

interface FeedbackPayload {
  user_name: string;
  user_email: string;
  organization_name: string;
  page_route: string;
  page_url: string;
  what_you_like?: string;
  what_needs_improving?: string;
  new_features_needed?: string;
  user_agent: string;
  timestamp: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Only allow POST requests
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    // Parse the request body
    const feedbackData: FeedbackPayload = await req.json();

    // Validate required fields
    if (!feedbackData.user_name || !feedbackData.user_email || !feedbackData.page_route) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    // Format timestamp for display
    const formattedTime = new Date(feedbackData.timestamp).toLocaleString('en-GB', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    // Extract browser info from user agent
    const getBrowserInfo = (userAgent: string) => {
      if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) return 'Chrome';
      if (userAgent.includes('Firefox')) return 'Firefox';
      if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
      if (userAgent.includes('Edg')) return 'Edge';
      if (userAgent.includes('Opera')) return 'Opera';
      return 'Unknown';
    };

    const browserInfo = getBrowserInfo(feedbackData.user_agent);

    // Construct Slack message payload with clean formatting similar to analytics screen
    const slackPayload = {
      text: `📝 New feedback from ${feedbackData.user_name}`,
      blocks: [
        // Header with user info and status
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: `👤 *${feedbackData.user_name}* • 📧 ${feedbackData.user_email} • 🏢 ${feedbackData.organization_name}`
            },
            {
              type: "mrkdwn",
              text: `🗓️ ${formattedTime} • 📱 ${browserInfo} • 📄 Page: ${feedbackData.page_route}`
            }
          ]
        },
        // Divider
        {
          type: "divider"
        }
      ]
    };

    // Add feedback sections with clean formatting
    if (feedbackData.what_you_like) {
      slackPayload.blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*👍 What they like*\n${feedbackData.what_you_like}`
        }
      });
    }

    if (feedbackData.what_needs_improving) {
      slackPayload.blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*⚠️ What needs improving*\n${feedbackData.what_needs_improving}`
        }
      });
    }

    if (feedbackData.new_features_needed) {
      slackPayload.blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*💡 New features needed*\n${feedbackData.new_features_needed}`
        }
      });
    }

    // Add footer with URL
    slackPayload.blocks.push(
      {
        type: "divider"
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `🔗 Full URL: ${feedbackData.page_url}`
          }
        ]
      }
    );

    // Send to Slack
    const slackResponse = await fetch(SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(slackPayload),
    });

    if (!slackResponse.ok) {
      const errorText = await slackResponse.text();
      console.error("Slack webhook error:", errorText);
      return new Response(
        JSON.stringify({ 
          error: "Failed to send to Slack",
          details: errorText 
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        }
      );
    }

    console.log("Feedback sent to Slack successfully");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Feedback sent to Slack successfully" 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );

  } catch (error) {
    console.error("Error in send-feedback-to-slack function:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        details: error.message 
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }
});