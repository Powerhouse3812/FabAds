
-- Creative folders (workspace-scoped)
CREATE TABLE public.creative_folders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.creative_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read creative_folders"
  ON public.creative_folders FOR SELECT
  USING (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Admins can insert creative_folders"
  ON public.creative_folders FOR INSERT
  WITH CHECK (is_workspace_owner_or_admin(auth.uid(), workspace_id));

CREATE POLICY "Admins can update creative_folders"
  ON public.creative_folders FOR UPDATE
  USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));

CREATE POLICY "Admins can delete creative_folders"
  ON public.creative_folders FOR DELETE
  USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));

-- Creative assets (workspace-scoped)
CREATE TABLE public.creative_assets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  folder_id uuid REFERENCES public.creative_folders(id) ON DELETE SET NULL,
  file_name text NOT NULL,
  file_type text NOT NULL DEFAULT 'image',
  file_size bigint,
  width integer,
  height integer,
  storage_path text NOT NULL,
  url text NOT NULL,
  thumbnail_url text,
  uploaded_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.creative_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read creative_assets"
  ON public.creative_assets FOR SELECT
  USING (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Admins can insert creative_assets"
  ON public.creative_assets FOR INSERT
  WITH CHECK (is_workspace_owner_or_admin(auth.uid(), workspace_id));

CREATE POLICY "Admins can update creative_assets"
  ON public.creative_assets FOR UPDATE
  USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));

CREATE POLICY "Admins can delete creative_assets"
  ON public.creative_assets FOR DELETE
  USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));

CREATE INDEX idx_creative_assets_workspace ON public.creative_assets(workspace_id);
CREATE INDEX idx_creative_assets_folder ON public.creative_assets(folder_id);

-- Storage bucket for creative assets (public for serving)
INSERT INTO storage.buckets (id, name, public) VALUES ('creative-assets', 'creative-assets', true);

-- Storage policies
CREATE POLICY "Anyone can view creative assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'creative-assets');

CREATE POLICY "Authenticated users can upload creative assets"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'creative-assets' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update creative assets"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'creative-assets' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete creative assets"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'creative-assets' AND auth.role() = 'authenticated');

-- Create default "Offer Uploads" folder per workspace via a function
-- (folders will be created on-demand in code instead)
