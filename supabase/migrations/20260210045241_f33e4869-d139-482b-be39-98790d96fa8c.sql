
-- fb_connections: one per workspace, stores OAuth token server-side
CREATE TABLE public.fb_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  fb_user_id text NOT NULL,
  fb_user_name text NOT NULL,
  access_token text NOT NULL,
  token_expires_at timestamptz,
  status text NOT NULL DEFAULT 'connected',
  connected_by uuid NOT NULL,
  connected_at timestamptz NOT NULL DEFAULT now(),
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fb_connections_workspace_unique UNIQUE (workspace_id)
);

ALTER TABLE public.fb_connections ENABLE ROW LEVEL SECURITY;

-- RLS: members can read (but we'll use the safe view for client queries)
CREATE POLICY "Members can read fb_connections"
  ON public.fb_connections FOR SELECT
  USING (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Owners/admins can insert fb_connections"
  ON public.fb_connections FOR INSERT
  WITH CHECK (is_workspace_owner_or_admin(auth.uid(), workspace_id));

CREATE POLICY "Owners/admins can update fb_connections"
  ON public.fb_connections FOR UPDATE
  USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));

CREATE POLICY "Owners/admins can delete fb_connections"
  ON public.fb_connections FOR DELETE
  USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));

-- Safe view: excludes access_token and token_expires_at
CREATE VIEW public.fb_connections_safe AS
  SELECT id, workspace_id, fb_user_id, fb_user_name, status,
         connected_by, connected_at, last_synced_at, created_at
  FROM public.fb_connections;

-- fb_business_managers
CREATE TABLE public.fb_business_managers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  fb_connection_id uuid NOT NULL REFERENCES public.fb_connections(id) ON DELETE CASCADE,
  fb_business_id text NOT NULL,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.fb_business_managers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read fb_business_managers"
  ON public.fb_business_managers FOR SELECT
  USING (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Owners/admins can insert fb_business_managers"
  ON public.fb_business_managers FOR INSERT
  WITH CHECK (is_workspace_owner_or_admin(auth.uid(), workspace_id));

CREATE POLICY "Owners/admins can update fb_business_managers"
  ON public.fb_business_managers FOR UPDATE
  USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));

CREATE POLICY "Owners/admins can delete fb_business_managers"
  ON public.fb_business_managers FOR DELETE
  USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));

-- fb_ad_accounts
CREATE TABLE public.fb_ad_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  fb_connection_id uuid NOT NULL REFERENCES public.fb_connections(id) ON DELETE CASCADE,
  fb_business_manager_id uuid REFERENCES public.fb_business_managers(id) ON DELETE SET NULL,
  fb_account_id text NOT NULL,
  name text NOT NULL,
  currency text,
  account_status integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.fb_ad_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read fb_ad_accounts"
  ON public.fb_ad_accounts FOR SELECT
  USING (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Owners/admins can insert fb_ad_accounts"
  ON public.fb_ad_accounts FOR INSERT
  WITH CHECK (is_workspace_owner_or_admin(auth.uid(), workspace_id));

CREATE POLICY "Owners/admins can update fb_ad_accounts"
  ON public.fb_ad_accounts FOR UPDATE
  USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));

CREATE POLICY "Owners/admins can delete fb_ad_accounts"
  ON public.fb_ad_accounts FOR DELETE
  USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));
