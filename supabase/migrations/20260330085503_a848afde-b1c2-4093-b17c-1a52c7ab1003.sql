
CREATE TABLE public.genie_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  created_by uuid NOT NULL,
  parent_id uuid REFERENCES public.genie_generations(id) ON DELETE SET NULL,
  prompt text NOT NULL,
  reference_image_ids text[] NOT NULL DEFAULT '{}',
  reference_mode text NOT NULL DEFAULT 'merge',
  output_url text NOT NULL,
  storage_path text NOT NULL,
  settings jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'completed',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.genie_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read genie_generations"
  ON public.genie_generations FOR SELECT TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Members can insert genie_generations"
  ON public.genie_generations FOR INSERT TO authenticated
  WITH CHECK (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Admins can delete genie_generations"
  ON public.genie_generations FOR DELETE TO authenticated
  USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));

CREATE POLICY "Users can update own genie_generations"
  ON public.genie_generations FOR UPDATE TO authenticated
  USING (created_by = auth.uid());
