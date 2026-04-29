
-- 2. Migrate workspace creator to 'owner'
UPDATE public.workspace_users
SET role = 'owner'
WHERE user_id = (
  SELECT created_by FROM public.workspaces ORDER BY created_at ASC LIMIT 1
);

-- 3. Add workspace_id to team_invites
ALTER TABLE public.team_invites
ADD COLUMN workspace_id uuid REFERENCES public.workspaces(id);

UPDATE public.team_invites
SET workspace_id = (SELECT id FROM public.workspaces LIMIT 1)
WHERE workspace_id IS NULL;

ALTER TABLE public.team_invites
ALTER COLUMN workspace_id SET NOT NULL;

DROP INDEX IF EXISTS team_invites_email_pending_idx;
CREATE UNIQUE INDEX team_invites_email_workspace_pending_idx
ON public.team_invites (email, workspace_id)
WHERE status = 'pending';

ALTER TABLE public.team_invites
ADD CONSTRAINT team_invites_role_check CHECK (role IN ('admin', 'member'));

-- 4. Create activity_logs table
CREATE TABLE public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id),
  user_id uuid NOT NULL,
  action text NOT NULL,
  target_email text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace members can read activity logs"
ON public.activity_logs FOR SELECT
USING (has_any_role(auth.uid()));

CREATE POLICY "Owners and admins can insert activity logs"
ON public.activity_logs FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'owner'::app_role) OR has_role(auth.uid(), 'admin'::app_role)
);

-- 5. Create is_owner_or_admin helper function
CREATE OR REPLACE FUNCTION public.is_owner_or_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_users
    WHERE user_id = _user_id AND role IN ('owner', 'admin')
  )
$$;

-- 6. Update RLS policies to include owner

-- team_invites
DROP POLICY IF EXISTS "Admins can create invites" ON public.team_invites;
CREATE POLICY "Owners and admins can create invites"
ON public.team_invites FOR INSERT
WITH CHECK (is_owner_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can delete invites" ON public.team_invites;
CREATE POLICY "Owners and admins can delete invites"
ON public.team_invites FOR DELETE
USING (is_owner_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can read invites" ON public.team_invites;
CREATE POLICY "Owners and admins can read invites"
ON public.team_invites FOR SELECT
USING (is_owner_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update invites" ON public.team_invites;
CREATE POLICY "Owners and admins can update invites"
ON public.team_invites FOR UPDATE
USING (is_owner_or_admin(auth.uid()));

-- user_roles
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
CREATE POLICY "Owners and admins can delete roles"
ON public.user_roles FOR DELETE
USING (is_owner_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
CREATE POLICY "Owners and admins can insert roles"
ON public.user_roles FOR INSERT
WITH CHECK (is_owner_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
CREATE POLICY "Owners and admins can update roles"
ON public.user_roles FOR UPDATE
USING (is_owner_or_admin(auth.uid()));

-- workspace_users
DROP POLICY IF EXISTS "Admins can delete workspace users" ON public.workspace_users;
CREATE POLICY "Owners and admins can delete workspace users"
ON public.workspace_users FOR DELETE
USING (is_owner_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can insert workspace users" ON public.workspace_users;
CREATE POLICY "Owners and admins can insert workspace users"
ON public.workspace_users FOR INSERT
WITH CHECK (is_owner_or_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can update workspace users" ON public.workspace_users;
CREATE POLICY "Owners and admins can update workspace users"
ON public.workspace_users FOR UPDATE
USING (is_owner_or_admin(auth.uid()));

-- 7. Update handle_new_user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _invite RECORD;
  _is_first_user BOOLEAN;
  _ws_id uuid;
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');

  SELECT NOT EXISTS (SELECT 1 FROM public.workspaces) INTO _is_first_user;

  IF _is_first_user THEN
    INSERT INTO public.workspaces (name, created_by)
    VALUES ('My Workspace', NEW.id)
    RETURNING id INTO _ws_id;

    INSERT INTO public.workspace_users (workspace_id, user_id, role)
    VALUES (_ws_id, NEW.id, 'owner');
  ELSE
    SELECT * INTO _invite
    FROM public.team_invites
    WHERE email = NEW.email AND status = 'pending'
    LIMIT 1;

    IF FOUND THEN
      _ws_id := _invite.workspace_id;

      INSERT INTO public.workspace_users (workspace_id, user_id, role)
      VALUES (_ws_id, NEW.id, _invite.role);

      UPDATE public.team_invites SET status = 'accepted' WHERE id = _invite.id;

      INSERT INTO public.activity_logs (workspace_id, user_id, action, target_email, metadata)
      VALUES (_ws_id, NEW.id, 'invite_accepted', NEW.email, jsonb_build_object('role', _invite.role));
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
