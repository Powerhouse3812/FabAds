
-- 1. Create workspace-scoped helper function
CREATE OR REPLACE FUNCTION public.is_workspace_member(_user_id uuid, _workspace_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_users
    WHERE user_id = _user_id AND workspace_id = _workspace_id
  )
$$;

CREATE OR REPLACE FUNCTION public.is_workspace_owner_or_admin(_user_id uuid, _workspace_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_users
    WHERE user_id = _user_id AND workspace_id = _workspace_id AND role IN ('owner', 'admin')
  )
$$;

-- Helper: get user's workspace IDs
CREATE OR REPLACE FUNCTION public.get_user_workspace_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT workspace_id FROM public.workspace_users WHERE user_id = _user_id
$$;

-- 2. Fix profiles: only see profiles of users in your workspaces
DROP POLICY IF EXISTS "Authenticated users can read all profiles" ON public.profiles;
CREATE POLICY "Users can read profiles in their workspaces"
ON public.profiles FOR SELECT
USING (
  id = auth.uid()
  OR id IN (
    SELECT wu.user_id FROM public.workspace_users wu
    WHERE wu.workspace_id IN (SELECT public.get_user_workspace_ids(auth.uid()))
  )
);

-- 3. Fix activity_logs: workspace-scoped read
DROP POLICY IF EXISTS "Workspace members can read activity logs" ON public.activity_logs;
CREATE POLICY "Members can read their workspace activity logs"
ON public.activity_logs FOR SELECT
USING (
  workspace_id IN (SELECT public.get_user_workspace_ids(auth.uid()))
);

-- Fix activity_logs insert: workspace-scoped
DROP POLICY IF EXISTS "Owners and admins can insert activity logs" ON public.activity_logs;
CREATE POLICY "Owners and admins can insert workspace activity logs"
ON public.activity_logs FOR INSERT
WITH CHECK (
  is_workspace_owner_or_admin(auth.uid(), workspace_id)
);

-- 4. Fix team_invites: workspace-scoped
DROP POLICY IF EXISTS "Owners and admins can read invites" ON public.team_invites;
CREATE POLICY "Owners and admins can read workspace invites"
ON public.team_invites FOR SELECT
USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "Owners and admins can create invites" ON public.team_invites;
CREATE POLICY "Owners and admins can create workspace invites"
ON public.team_invites FOR INSERT
WITH CHECK (is_workspace_owner_or_admin(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "Owners and admins can update invites" ON public.team_invites;
CREATE POLICY "Owners and admins can update workspace invites"
ON public.team_invites FOR UPDATE
USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "Owners and admins can delete invites" ON public.team_invites;
CREATE POLICY "Owners and admins can delete workspace invites"
ON public.team_invites FOR DELETE
USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));

-- 5. Fix workspace_users: workspace-scoped
DROP POLICY IF EXISTS "Members can view workspace users" ON public.workspace_users;
CREATE POLICY "Members can view their workspace users"
ON public.workspace_users FOR SELECT
USING (workspace_id IN (SELECT public.get_user_workspace_ids(auth.uid())));

DROP POLICY IF EXISTS "Owners and admins can insert workspace users" ON public.workspace_users;
CREATE POLICY "Owners and admins can insert workspace users"
ON public.workspace_users FOR INSERT
WITH CHECK (is_workspace_owner_or_admin(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "Owners and admins can update workspace users" ON public.workspace_users;
CREATE POLICY "Owners and admins can update workspace users"
ON public.workspace_users FOR UPDATE
USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));

DROP POLICY IF EXISTS "Owners and admins can delete workspace users" ON public.workspace_users;
CREATE POLICY "Owners and admins can delete workspace users"
ON public.workspace_users FOR DELETE
USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));

-- 6. Fix user_roles: scope to workspace members only
DROP POLICY IF EXISTS "Authenticated users can read all roles" ON public.user_roles;
CREATE POLICY "Users can read roles of workspace members"
ON public.user_roles FOR SELECT
USING (
  user_id IN (
    SELECT wu.user_id FROM public.workspace_users wu
    WHERE wu.workspace_id IN (SELECT public.get_user_workspace_ids(auth.uid()))
  )
);

-- 7. Fix workspaces: scope to membership
DROP POLICY IF EXISTS "Members can view their workspaces" ON public.workspaces;
CREATE POLICY "Members can view their own workspaces"
ON public.workspaces FOR SELECT
USING (id IN (SELECT public.get_user_workspace_ids(auth.uid())));
