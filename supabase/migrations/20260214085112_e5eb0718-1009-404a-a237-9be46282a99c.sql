
DO $$
DECLARE
  _user RECORD;
  _ws_id uuid;
BEGIN
  FOR _user IN
    SELECT au.id, au.email, au.raw_user_meta_data->>'full_name' AS full_name
    FROM auth.users au
    LEFT JOIN public.workspace_users wu ON wu.user_id = au.id
    WHERE wu.id IS NULL
  LOOP
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (_user.id, _user.email, COALESCE(_user.full_name, split_part(_user.email, '@', 1)))
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.workspaces (name, created_by)
    VALUES ('My Workspace', _user.id)
    RETURNING id INTO _ws_id;

    INSERT INTO public.workspace_users (workspace_id, user_id, role)
    VALUES (_ws_id, _user.id, 'owner');
  END LOOP;
END;
$$;
