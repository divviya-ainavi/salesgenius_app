/*
  # Create tour steps management system

  1. New Tables
    - `tour_steps`
      - `id` (uuid, primary key)
      - `step_order` (integer, for ordering steps)
      - `target` (text, CSS selector for the step)
      - `title` (text, step title)
      - `content` (text, step content/description)
      - `placement` (text, tooltip placement)
      - `disable_beacon` (boolean, whether to disable beacon)
      - `is_active` (boolean, whether step is active)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `tour_steps` table
    - Add policy for public read access
    - Add policy for super admin write access

  3. Default Data
    - Insert default tour steps from current hardcoded data
*/

-- Create tour_steps table
CREATE TABLE IF NOT EXISTS tour_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  step_order integer NOT NULL,
  target text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  placement text DEFAULT 'right',
  disable_beacon boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE tour_steps ENABLE ROW LEVEL SECURITY;

-- Policy for public read access (all users can read tour steps)
CREATE POLICY "Anyone can read active tour steps"
  ON tour_steps
  FOR SELECT
  TO public
  USING (is_active = true);

-- Policy for super admin full access
CREATE POLICY "Super admin full access to tour steps"
  ON tour_steps
  FOR ALL
  TO public
  USING (
    EXISTS (
      SELECT 1
      FROM profiles p
      JOIN titles t ON p.title_id = t.id
      JOIN roles r ON t.role_id = r.id
      WHERE p.auth_user_id = auth.uid()
      AND r.key = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM profiles p
      JOIN titles t ON p.title_id = t.id
      JOIN roles r ON t.role_id = r.id
      WHERE p.auth_user_id = auth.uid()
      AND r.key = 'super_admin'
    )
  );

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_tour_steps_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tour_steps_updated_at
  BEFORE UPDATE ON tour_steps
  FOR EACH ROW
  EXECUTE FUNCTION update_tour_steps_updated_at();

-- Insert default tour steps
INSERT INTO tour_steps (step_order, target, title, content, placement, disable_beacon) VALUES
(1, 'body', 'Welcome to SalesGenius.ai! 🎉', 'Let''s take a complete tour of your AI-powered sales assistant and learn how to maximize your sales success!', 'center', true),
(2, '[data-tour="research"]', 'Step 1: Research 🔍', 'Enter a company name and website to generate AI-powered research. You can also add LinkedIn URLs for prospect insights.\n\nSalesGenius will validate the domain, analyze the company, recommend talking points, and summarize key details.\n\nSave to CRM or copy insights for follow-ups — all in one place.', 'right', false),
(3, '[data-tour="sales-calls"]', 'Step 2: Sales Calls 📞', 'Upload your call transcripts or connect with Fireflies.ai to automatically process your sales conversations.\n\nUpload files, process them by selecting company and prospect, then get Sales Insights and Communication Styles.', 'right', false),
(4, '[data-tour="file-upload-area"]', 'Drop Your Transcript Here 📁', 'Drop your transcript file here or click to browse. This is where you upload your call recordings or transcript files.\n\nSupported formats: TXT, VTT, PDF, and audio files', 'bottom', false),
(5, '[data-tour="recent-uploads-tab"]', 'Process Uploaded Calls 📋', 'Once you upload a file, it will appear here. Click the **Process** button to begin AI analysis. A dialog will open where you can:\n\n• **Select or create a company 🏢** – Search for the company the call was with, or add a new one.\n• **Select or create a prospect 👤** – Choose the relevant deal or create a new opportunity.\n\nAfter setting these, the AI will start processing the call and extracting insights.', 'top', false),
(6, '[data-tour="recent-uploads-process"]', 'Process Uploaded Call 📁', 'Click **Process** on any uploaded transcript to begin analysis. You''ll select the company and prospect in the next step.\n\nThis triggers AI to generate insights, summaries, and action items from your sales call.', 'left', false),
(7, '[data-tour="call-insights"]', 'Step 3: Call Insights ✨', 'After processing your calls, view AI-generated insights including call summaries, sales insights, and communication styles for each prospect.\n\nUnderstand your prospects better with detailed analysis and recommendations.', 'right', false),
(8, '[data-tour="cumulative-intelligence"]', 'Cumulative Intelligence 🧠', 'This AI-generated summary captures the key moments, themes, and updates discussed during the call.\n\nUse it to quickly recall what was said — no need to reread the full transcript.', 'top', false),
(9, '[data-tour="sales-insights-section"]', 'Sales Insights 💡', 'These are the most important takeaways — like decision makers, objections, and buying timelines.\n\n• Edit or delete AI suggestions\n• Add your own insights manually\n• Track scoring to prioritize follow-ups', 'top', false),
(10, '[data-tour="communication-style-section"]', 'Behavioral & Communication Insights 🗣️', 'Understand each stakeholder''s personality type and communication preferences.\n\nUse this to tailor your follow-up style — whether it''s analytical, direct, or collaborative.', 'top', false),
(11, '[data-tour="menu-email"]', 'Email Templates ✉️', 'Generate and refine AI-powered follow-up emails tailored to each prospect''s behavior and conversation history.', 'right', false),
(12, '[data-tour="chosen-prospect"]', 'Step 1: Prospect Selected', 'The prospect is pre-selected based on your previous actions. All follow-up materials will be personalized for this contact.', 'right', false),
(13, '[data-tour="email-recipients"]', 'Step 2: Select Recipients', 'Choose stakeholders who should receive the email. You can target individuals or multiple contacts.', 'right', false),
(14, '[data-tour="sales-play"]', 'Step 3: Sales Play', 'Pick the most relevant sales strategy to apply. SalesGenius will use this to shape tone, content, and intent.', 'right', false),
(15, '[data-tour="objectives"]', 'Step 4: Add Objectives', 'Select secondary goals to include in your follow-up—such as urgency, ROI, or purchase closure.', 'right', false),
(16, '[data-tour="generate-email"]', 'Step 5: Generate Email', 'Once ready, click here to instantly generate a personalized email based on your selections.', 'top', false),
(17, '[data-tour="menu-presentation"]', 'Presentation Builder 📊', 'Generate tailored slide outlines based on call insights using AI. Perfect for Gamma.app or any sales deck workflow.\n\nStructure, tone, and content align with the selected sales methodology.', 'right', false),
(18, '[data-tour="chosen-prospect-presentation"]', 'Step 1: Prospect Selected', 'The prospect is pre-selected based on your previous actions. All follow-up materials will be personalized for this contact.', 'right', false),
(19, '[data-tour="sales-play-presentation"]', 'Step 2: Sales Play', 'Pick the strategic sales play that best suits your current deal status. Recommended plays are highlighted.', 'right', false),
(20, '[data-tour="objectives-presentation"]', 'Step 3: Add Objectives', 'Boost your strategy with optional objectives like ROI demonstration or urgency building', 'right', false),
(21, '[data-tour="presentation-generate"]', 'Generate Presentation', 'Once you''ve selected your play and objectives, click here to generate the tailored presentation framework.', 'top', false),
(22, '[data-tour="menu-actions"]', 'Action Items ✅', 'Review and manage commitments from your calls. These are automatically extracted tasks that can be pushed to your CRM.', 'right', false),
(23, '[data-tour="analytics"]', 'Step 5: Analytics 📊', 'Track your sales performance with detailed analytics including time spent on different activities, call metrics, and sales insights.\n\nMonitor your progress and optimize your sales process with data-driven insights.', 'right', false),
(24, '[data-tour="settings"]', 'Step 6: Settings ⚙️', 'Manage your profile, update organization details, connect integrations like HubSpot and Fireflies, and customize your experience.\n\nConfigure your account to match your sales workflow and preferences.', 'right', false),
(25, 'body', 'Tour Complete! 🚀', 'You''re now ready to use SalesGenius.ai! Start with research, process your calls, and leverage AI to close more deals. You can replay this tour anytime from the guidelines icon.', 'center', false);