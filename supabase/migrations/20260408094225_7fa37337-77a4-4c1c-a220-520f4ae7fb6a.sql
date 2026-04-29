
CREATE TABLE public.genie_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  created_by uuid NOT NULL,
  image_url text NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.genie_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read genie_templates"
  ON public.genie_templates FOR SELECT TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Members can insert genie_templates"
  ON public.genie_templates FOR INSERT TO authenticated
  WITH CHECK (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Members can update genie_templates"
  ON public.genie_templates FOR UPDATE TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Members can delete genie_templates"
  ON public.genie_templates FOR DELETE TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id));
