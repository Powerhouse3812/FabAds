
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _invite RECORD;
  _ws_id uuid;
BEGIN
  -- 1. Create profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');

  -- 2. Check for pending invite (case-insensitive)
  SELECT * INTO _invite
  FROM public.team_invites
  WHERE LOWER(email) = LOWER(NEW.email) AND status = 'pending'
  LIMIT 1;

  IF FOUND THEN
    -- 3a. Link to existing workspace via invite
    _ws_id := _invite.workspace_id;

    INSERT INTO public.workspace_users (workspace_id, user_id, role)
    VALUES (_ws_id, NEW.id, _invite.role);

    UPDATE public.team_invites SET status = 'accepted' WHERE id = _invite.id;

    INSERT INTO public.activity_logs (workspace_id, user_id, action, target_email, metadata)
    VALUES (_ws_id, NEW.id, 'invite_accepted', NEW.email, jsonb_build_object('role', _invite.role));
  ELSE
    -- 3b. Create new workspace for this user
    INSERT INTO public.workspaces (name, created_by)
    VALUES ('My Workspace', NEW.id)
    RETURNING id INTO _ws_id;

    INSERT INTO public.workspace_users (workspace_id, user_id, role)
    VALUES (_ws_id, NEW.id, 'owner');

    INSERT INTO public.activity_logs (workspace_id, user_id, action, target_email, metadata)
    VALUES (_ws_id, NEW.id, 'workspace_created', NEW.email, jsonb_build_object('role', 'owner'));
  END IF;

  RETURN NEW;
END;
$$;
