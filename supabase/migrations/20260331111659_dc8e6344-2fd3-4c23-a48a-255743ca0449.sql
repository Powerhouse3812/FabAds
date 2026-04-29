
-- Video Sage Videos table
CREATE TABLE public.video_sage_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  title text NOT NULL DEFAULT 'Untitled Video',
  thumbnail_url text,
  video_url text,
  storage_path text,
  duration_seconds integer DEFAULT 0,
  language text DEFAULT 'English',
  status text NOT NULL DEFAULT 'pending',
  analysis jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.video_sage_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read video_sage_videos"
  ON public.video_sage_videos FOR SELECT
  USING (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Members can insert video_sage_videos"
  ON public.video_sage_videos FOR INSERT
  WITH CHECK (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Members can update own video_sage_videos"
  ON public.video_sage_videos FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Admins can delete video_sage_videos"
  ON public.video_sage_videos FOR DELETE
  USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));

-- Video Sage Scripts table
CREATE TABLE public.video_sage_scripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL REFERENCES public.video_sage_videos(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  version integer NOT NULL DEFAULT 1,
  framework text NOT NULL DEFAULT 'PAS',
  source text NOT NULL DEFAULT 'original',
  script_data jsonb DEFAULT '{}'::jsonb,
  parent_script_id uuid REFERENCES public.video_sage_scripts(id),
  status text NOT NULL DEFAULT 'generating',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.video_sage_scripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read video_sage_scripts"
  ON public.video_sage_scripts FOR SELECT
  USING (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Members can insert video_sage_scripts"
  ON public.video_sage_scripts FOR INSERT
  WITH CHECK (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Members can update own video_sage_scripts"
  ON public.video_sage_scripts FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Admins can delete video_sage_scripts"
  ON public.video_sage_scripts FOR DELETE
  USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));

-- Updated_at trigger for videos
CREATE TRIGGER update_video_sage_videos_updated_at
  BEFORE UPDATE ON public.video_sage_videos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
