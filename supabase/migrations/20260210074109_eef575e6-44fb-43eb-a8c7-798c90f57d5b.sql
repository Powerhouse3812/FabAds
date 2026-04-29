
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    -- Case-insensitive email matching to prevent missed invite links
    SELECT * INTO _invite
    FROM public.team_invites
    WHERE LOWER(email) = LOWER(NEW.email) AND status = 'pending'
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
$function$;
