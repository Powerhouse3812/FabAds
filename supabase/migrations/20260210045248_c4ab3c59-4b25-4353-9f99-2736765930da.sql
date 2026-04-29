
-- Fix: recreate the view with SECURITY INVOKER so RLS of the querying user applies
DROP VIEW IF EXISTS public.fb_connections_safe;
CREATE VIEW public.fb_connections_safe
  WITH (security_invoker = true)
  AS SELECT id, workspace_id, fb_user_id, fb_user_name, status,
            connected_by, connected_at, last_synced_at, created_at
     FROM public.fb_connections;
