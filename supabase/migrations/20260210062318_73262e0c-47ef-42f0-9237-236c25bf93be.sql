
-- 2. Fix: Secure fb_connections — restrict SELECT to owners/admins only (not members)
DROP POLICY IF EXISTS "Members can read fb_connections" ON public.fb_connections;
CREATE POLICY "Owners/admins can read fb_connections"
  ON public.fb_connections FOR SELECT
  USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));

-- 3. Fix: Recreate fb_connections_safe view as security definer (default)
DROP VIEW IF EXISTS public.fb_connections_safe;
CREATE VIEW public.fb_connections_safe AS
  SELECT
    id, workspace_id, fb_user_id, fb_user_name, status,
    connected_by, connected_at, last_synced_at, created_at
  FROM public.fb_connections
  WHERE is_workspace_member(auth.uid(), workspace_id);
