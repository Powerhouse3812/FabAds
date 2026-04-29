
-- cl_folders table
CREATE TABLE public.cl_folders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  description text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cl_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read cl_folders" ON public.cl_folders FOR SELECT USING (is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Admins can insert cl_folders" ON public.cl_folders FOR INSERT WITH CHECK (is_workspace_owner_or_admin(auth.uid(), workspace_id));
CREATE POLICY "Admins can update cl_folders" ON public.cl_folders FOR UPDATE USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));
CREATE POLICY "Admins can delete cl_folders" ON public.cl_folders FOR DELETE USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));

CREATE TRIGGER update_cl_folders_updated_at BEFORE UPDATE ON public.cl_folders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- cl_folder_items join table
CREATE TABLE public.cl_folder_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  folder_id uuid NOT NULL REFERENCES public.cl_folders(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL,
  item_type text NOT NULL DEFAULT 'media',
  item_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (folder_id, item_id)
);

ALTER TABLE public.cl_folder_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read cl_folder_items" ON public.cl_folder_items FOR SELECT USING (is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Admins can insert cl_folder_items" ON public.cl_folder_items FOR INSERT WITH CHECK (is_workspace_owner_or_admin(auth.uid(), workspace_id));
CREATE POLICY "Admins can update cl_folder_items" ON public.cl_folder_items FOR UPDATE USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));
CREATE POLICY "Admins can delete cl_folder_items" ON public.cl_folder_items FOR DELETE USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));
