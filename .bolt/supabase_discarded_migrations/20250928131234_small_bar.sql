/*
  # Add Pro Plan Features

  1. Features Added
    - Unlimited transcript processing
    - Advanced AI insights and analytics
    - Full HubSpot CRM integration
    - Unlimited email and presentation generation
    - Priority support and team collaboration
    - Custom branding and API access
    - Advanced security and data export

  2. Database Changes
    - Clear existing Pro plan features to avoid duplicates
    - Insert 12 comprehensive Pro plan features
    - Set proper display order and descriptions
    - All features marked as included for Pro plan
*/

DO $$
DECLARE
    pro_plan_id uuid;
BEGIN
    -- Get the Pro plan ID
    SELECT id INTO pro_plan_id 
    FROM plan_master 
    WHERE plan_name ILIKE '%pro%' 
    LIMIT 1;

    -- Only proceed if Pro plan exists
    IF pro_plan_id IS NOT NULL THEN
        -- Clear existing Pro plan features
        DELETE FROM plan_features WHERE plan_id = pro_plan_id;

        -- Insert comprehensive Pro plan features
        INSERT INTO plan_features (plan_id, feature_name, feature_description, is_included, feature_limit, display_order) VALUES
        (pro_plan_id, 'Unlimited Transcript Processing', 'Process unlimited call transcripts and audio files with AI analysis', true, 'Unlimited', 1),
        (pro_plan_id, 'Advanced AI Insights', 'Get deeper AI-powered insights, recommendations, and sales intelligence', true, 'Advanced algorithms', 2),
        (pro_plan_id, 'Full HubSpot Integration', 'Complete bidirectional sync with HubSpot CRM including deals, contacts, and tasks', true, 'Full access', 3),
        (pro_plan_id, 'Unlimited Email Generation', 'Generate unlimited personalized follow-up emails with AI assistance', true, 'Unlimited', 4),
        (pro_plan_id, 'Unlimited Presentation Prompts', 'Create unlimited sales presentation prompts and deck builders', true, 'Unlimited', 5),
        (pro_plan_id, 'Advanced Analytics & Reporting', 'Comprehensive performance analytics, custom reports, and data visualization', true, 'Full dashboard', 6),
        (pro_plan_id, 'Priority Support', '24/7 priority customer support via email and chat with dedicated account manager', true, '24/7 priority', 7),
        (pro_plan_id, 'Team Collaboration', 'Share insights, collaborate with team members, and manage user permissions', true, 'Unlimited users', 8),
        (pro_plan_id, 'Custom Branding', 'White-label emails and presentations with your company branding and logos', true, 'Full customization', 9),
        (pro_plan_id, 'API Access', 'Access to REST API for custom integrations and third-party connections', true, 'Full API access', 10),
        (pro_plan_id, 'Advanced Security', 'Enhanced security features, compliance tools, and data encryption', true, 'Enterprise-grade', 11),
        (pro_plan_id, 'Data Export', 'Export all your data in multiple formats (CSV, PDF, JSON) for backup and analysis', true, 'All formats', 12);

        RAISE NOTICE 'Pro plan features updated successfully for plan ID: %', pro_plan_id;
    ELSE
        RAISE NOTICE 'Pro plan not found in plan_master table';
    END IF;
END $$;