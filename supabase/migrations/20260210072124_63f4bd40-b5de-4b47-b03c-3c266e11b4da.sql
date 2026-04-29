
-- Add invite_token column to team_invites
ALTER TABLE public.team_invites
ADD COLUMN invite_token uuid NOT NULL DEFAULT gen_random_uuid();

-- Add unique index on invite_token
CREATE UNIQUE INDEX idx_team_invites_token ON public.team_invites (invite_token);

-- Create a SECURITY DEFINER function to look up an invite by token (public, no auth needed)
CREATE OR REPLACE FUNCTION public.get_invite_by_token(_token uuid)
RETURNS TABLE(email text, role app_role, workspace_name text, status text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ti.email, ti.role, w.name AS workspace_name, ti.status
  FROM public.team_invites ti
  JOIN public.workspaces w ON w.id = ti.workspace_id
  WHERE ti.invite_token = _token
  LIMIT 1;
$$;
