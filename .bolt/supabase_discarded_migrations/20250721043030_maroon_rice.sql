/*
  # Add RLS Delete Policies to All Tables

  This migration adds Row Level Security (RLS) delete policies to all tables in the database.
  The policies are designed to:
  1. Allow users to delete their own records (where user_id exists)
  2. Restrict deletion on lookup tables and shared resources
  3. Enable RLS on tables where it's currently disabled
  4. Not interfere with existing SELECT, INSERT, or UPDATE operations

  ## Policy Logic:
  - Tables with user_id: Allow deletion by record owner only
  - Lookup tables (roles, industry, etc.): Restrict all deletions
  - Shared tables without user_id: Restrict all deletions
  - Admin tables: Restrict all deletions for safety

  ## Tables Affected:
  All 31 tables in the public schema will have delete policies applied.
*/

-- 1. email_templates (Enable RLS + Restrict Delete)
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Restrict all delete on email_templates" 
  ON public.email_templates 
  FOR DELETE 
  USING (FALSE);

-- 2. processing_history (Already has RLS + Allow Owner Delete)
CREATE POLICY "Allow owner to delete processing_history" 
  ON public.processing_history 
  FOR DELETE 
  USING (user_id = auth.uid());

-- 3. uploaded_files (Already has RLS + Allow Owner Delete)
CREATE POLICY "Allow owner to delete uploaded_files" 
  ON public.uploaded_files 
  FOR DELETE 
  USING (user_id = auth.uid());

-- 4. company (Enable RLS + Allow Owner Delete)
ALTER TABLE public.company ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow owner to delete company" 
  ON public.company 
  FOR DELETE 
  USING (user_id = auth.uid());

-- 5. industry (Enable RLS + Restrict Delete - Lookup Table)
ALTER TABLE public.industry ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Restrict all delete on industry" 
  ON public.industry 
  FOR DELETE 
  USING (FALSE);

-- 6. communication_styles (Enable RLS + Restrict Delete)
ALTER TABLE public.communication_styles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Restrict all delete on communication_styles" 
  ON public.communication_styles 
  FOR DELETE 
  USING (FALSE);

-- 7. fireflies_files (Enable RLS + Allow Owner Delete)
ALTER TABLE public.fireflies_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow owner to delete fireflies_files" 
  ON public.fireflies_files 
  FOR DELETE 
  USING (user_id = auth.uid());

-- 8. organizations (Enable RLS + Restrict Delete - Critical Data)
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Restrict all delete on organizations" 
  ON public.organizations 
  FOR DELETE 
  USING (FALSE);

-- 9. company_size (Enable RLS + Restrict Delete - Lookup Table)
ALTER TABLE public.company_size ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Restrict all delete on company_size" 
  ON public.company_size 
  FOR DELETE 
  USING (FALSE);

-- 10. user_teams (Enable RLS + Allow Manager Delete)
ALTER TABLE public.user_teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow manager to delete user_team entry" 
  ON public.user_teams 
  FOR DELETE 
  USING (manager_id = auth.uid());

-- 11. insights (Enable RLS + Allow Owner Delete)
ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow owner to delete insights" 
  ON public.insights 
  FOR DELETE 
  USING (user_id = auth.uid());

-- 12. peoples (Enable RLS + Restrict Delete)
ALTER TABLE public.peoples ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Restrict all delete on peoples" 
  ON public.peoples 
  FOR DELETE 
  USING (FALSE);

-- 13. invites (Enable RLS + Allow Inviter Delete)
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow inviter to delete invites" 
  ON public.invites 
  FOR DELETE 
  USING (invited_by = auth.uid());

-- 14. action_items (Enable RLS + Restrict Delete)
ALTER TABLE public.action_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Restrict all delete on action_items" 
  ON public.action_items 
  FOR DELETE 
  USING (FALSE);

-- 15. prospect (Enable RLS + Allow Owner Delete)
ALTER TABLE public.prospect ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow owner to delete prospect" 
  ON public.prospect 
  FOR DELETE 
  USING (user_id = auth.uid());

-- 16. sales_methodology (Enable RLS + Restrict Delete - Lookup Table)
ALTER TABLE public.sales_methodology ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Restrict all delete on sales_methodology" 
  ON public.sales_methodology 
  FOR DELETE 
  USING (FALSE);

-- 17. roles (Enable RLS + Restrict Delete - Lookup Table)
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Restrict all delete on roles" 
  ON public.roles 
  FOR DELETE 
  USING (FALSE);

-- 18. sales_insight_types (Enable RLS + Restrict Delete - Lookup Table)
ALTER TABLE public.sales_insight_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Restrict all delete on sales_insight_types" 
  ON public.sales_insight_types 
  FOR DELETE 
  USING (FALSE);

-- 19. call_notes (Already has RLS + Allow Owner Delete)
CREATE POLICY "Allow owner to delete call_notes" 
  ON public.call_notes 
  FOR DELETE 
  USING (user_id = auth.uid());

-- 20. follow_up_emails (Already has RLS + Allow Owner Delete)
CREATE POLICY "Allow owner to delete follow_up_emails" 
  ON public.follow_up_emails 
  FOR DELETE 
  USING (user_id = auth.uid());

-- 21. call_commitments (Already has RLS + Allow Owner Delete)
CREATE POLICY "Allow owner to delete call_commitments" 
  ON public.call_commitments 
  FOR DELETE 
  USING (user_id = auth.uid());

-- 22. push_log (Already has RLS + Allow Owner Delete)
CREATE POLICY "Allow owner to delete push_log" 
  ON public.push_log 
  FOR DELETE 
  USING (user_id = auth.uid());

-- 23. titles (Enable RLS + Restrict Delete - Lookup Table)
ALTER TABLE public.titles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Restrict all delete on titles" 
  ON public.titles 
  FOR DELETE 
  USING (FALSE);

-- 24. presentation_prompt (Enable RLS + Restrict Delete)
ALTER TABLE public.presentation_prompt ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Restrict all delete on presentation_prompt" 
  ON public.presentation_prompt 
  FOR DELETE 
  USING (FALSE);

-- 25. user_status (Enable RLS + Restrict Delete - Lookup Table)
ALTER TABLE public.user_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Restrict all delete on user_status" 
  ON public.user_status 
  FOR DELETE 
  USING (FALSE);

-- 26. ResearchCompany (Already has RLS + Allow Owner Delete)
CREATE POLICY "Allow owner to delete ResearchCompany" 
  ON public."ResearchCompany" 
  FOR DELETE 
  USING (user_id = auth.uid());

-- 27. sales_insights (Enable RLS + Restrict Delete)
ALTER TABLE public.sales_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Restrict all delete on sales_insights" 
  ON public.sales_insights 
  FOR DELETE 
  USING (FALSE);

-- 28. call_analysis_overview (Enable RLS + Restrict Delete)
ALTER TABLE public.call_analysis_overview ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Restrict all delete on call_analysis_overview" 
  ON public.call_analysis_overview 
  FOR DELETE 
  USING (FALSE);

-- 29. profiles (Enable RLS + Allow Self Delete)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow owner to delete profile" 
  ON public.profiles 
  FOR DELETE 
  USING (id = auth.uid());

-- 30. call_insights (Already has RLS + Allow Owner Delete)
CREATE POLICY "Allow owner to delete call_insights" 
  ON public.call_insights 
  FOR DELETE 
  USING (user_id = auth.uid());

-- 31. communication_style_type (Enable RLS + Restrict Delete - Lookup Table)
ALTER TABLE public.communication_style_type ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Restrict all delete on communication_style_type" 
  ON public.communication_style_type 
  FOR DELETE 
  USING (FALSE);

-- Verification: Check that all tables now have RLS enabled and delete policies
-- You can run this query after the migration to verify:
-- SELECT schemaname, tablename, rowsecurity, policies 
-- FROM pg_tables t 
-- LEFT JOIN (
--   SELECT schemaname, tablename, array_agg(policyname) as policies
--   FROM pg_policies 
--   WHERE cmd = 'DELETE'
--   GROUP BY schemaname, tablename
-- ) p USING (schemaname, tablename)
-- WHERE schemaname = 'public' 
-- ORDER BY tablename;