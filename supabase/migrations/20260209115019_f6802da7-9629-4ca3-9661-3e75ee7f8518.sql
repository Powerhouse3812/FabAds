
-- 1. Create workspaces table
CREATE TABLE public.workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT 'My Workspace',
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid
);
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

-- 2. Create workspace_users table (the explicit mapping)
CREATE TABLE public.workspace_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  role app_role NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);
ALTER TABLE public.workspace_users ENABLE ROW LEVEL SECURITY;

-- 3. Update has_role to check workspace_users (not user_roles)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_users
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 4. Update has_any_role to check workspace_users
CREATE OR REPLACE FUNCTION public.has_any_role(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_users
    WHERE user_id = _user_id
  )
$$;

-- 5. RLS for workspaces
CREATE POLICY "Members can view their workspaces"
ON public.workspaces FOR SELECT
USING (has_any_role(auth.uid()));

-- 6. RLS for workspace_users
CREATE POLICY "Members can view workspace users"
ON public.workspace_users FOR SELECT
USING (has_any_role(auth.uid()));

CREATE POLICY "Admins can insert workspace users"
ON public.workspace_users FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update workspace users"
ON public.workspace_users FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete workspace users"
ON public.workspace_users FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- 7. Migrate existing user_roles data into workspace_users
DO $$
DECLARE
  _ws_id uuid;
  _ur RECORD;
BEGIN
  IF EXISTS (SELECT 1 FROM public.user_roles) THEN
    INSERT INTO public.workspaces (name) VALUES ('My Workspace') RETURNING id INTO _ws_id;
    FOR _ur IN SELECT * FROM public.user_roles LOOP
      INSERT INTO public.workspace_users (workspace_id, user_id, role)
      VALUES (_ws_id, _ur.user_id, _ur.role);
    END LOOP;
  END IF;
END $$;

-- 8. Update handle_new_user trigger to use workspace-scoped logic
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _invite RECORD;
  _is_first_user BOOLEAN;
  _ws_id uuid;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');

  -- First user = no workspaces exist yet
  SELECT NOT EXISTS (SELECT 1 FROM public.workspaces) INTO _is_first_user;

  IF _is_first_user THEN
    -- Create workspace and link user as admin/owner
    INSERT INTO public.workspaces (name, created_by)
    VALUES ('My Workspace', NEW.id)
    RETURNING id INTO _ws_id;

    INSERT INTO public.workspace_users (workspace_id, user_id, role)
    VALUES (_ws_id, NEW.id, 'admin');
  ELSE
    -- Check for pending invite
    SELECT * INTO _invite
    FROM public.team_invites
    WHERE email = NEW.email AND status = 'pending'
    LIMIT 1;

    IF FOUND THEN
      SELECT id INTO _ws_id FROM public.workspaces LIMIT 1;
      INSERT INTO public.workspace_users (workspace_id, user_id, role)
      VALUES (_ws_id, NEW.id, _invite.role);
      UPDATE public.team_invites SET status = 'accepted' WHERE id = _invite.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;
