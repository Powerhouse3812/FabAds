
-- 1. Create fb_tokens table — only accessible via service role (RLS denies all client access)
CREATE TABLE public.fb_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fb_connection_id uuid NOT NULL UNIQUE REFERENCES public.fb_connections(id) ON DELETE CASCADE,
  access_token text NOT NULL,
  token_expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.fb_tokens ENABLE ROW LEVEL SECURITY;

-- No SELECT/INSERT/UPDATE/DELETE policies — only service role can access
-- This means NO client (anon or authenticated) can read tokens

-- 2. Migrate existing tokens from fb_connections to fb_tokens
INSERT INTO public.fb_tokens (fb_connection_id, access_token, token_expires_at)
SELECT id, access_token, token_expires_at
FROM public.fb_connections
WHERE access_token IS NOT NULL AND access_token != '';

-- 3. Remove token columns from fb_connections
ALTER TABLE public.fb_connections DROP COLUMN access_token;
ALTER TABLE public.fb_connections DROP COLUMN token_expires_at;

-- 4. Restore fb_connections SELECT to workspace members (no sensitive data left)
DROP POLICY IF EXISTS "Owners/admins can read fb_connections" ON public.fb_connections;
CREATE POLICY "Members can read fb_connections"
  ON public.fb_connections FOR SELECT
  USING (is_workspace_member(auth.uid(), workspace_id));

-- 5. Recreate fb_connections_safe view with security_invoker (no tokens to hide anymore)
DROP VIEW IF EXISTS public.fb_connections_safe;
CREATE VIEW public.fb_connections_safe
  WITH (security_invoker = true)
AS SELECT
  id, workspace_id, fb_user_id, fb_user_name, status,
  connected_by, connected_at, last_synced_at, created_at
FROM public.fb_connections;
