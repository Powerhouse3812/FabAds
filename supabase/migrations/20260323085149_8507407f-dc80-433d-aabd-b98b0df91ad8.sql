
CREATE TABLE public.clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  name text NOT NULL,
  logo_url text,
  industry text,
  status text NOT NULL DEFAULT 'active',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read clients" ON public.clients FOR SELECT USING (is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Admins can insert clients" ON public.clients FOR INSERT WITH CHECK (is_workspace_owner_or_admin(auth.uid(), workspace_id));
CREATE POLICY "Admins can update clients" ON public.clients FOR UPDATE USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));
CREATE POLICY "Admins can delete clients" ON public.clients FOR DELETE USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));

CREATE TABLE public.client_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  workspace_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(client_id, user_id)
);
ALTER TABLE public.client_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read client_users" ON public.client_users FOR SELECT USING (is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Admins can insert client_users" ON public.client_users FOR INSERT WITH CHECK (is_workspace_owner_or_admin(auth.uid(), workspace_id));
CREATE POLICY "Admins can update client_users" ON public.client_users FOR UPDATE USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));
CREATE POLICY "Admins can delete client_users" ON public.client_users FOR DELETE USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
