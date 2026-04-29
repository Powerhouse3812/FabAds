
-- targeting_templates table
CREATE TABLE public.targeting_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  platform text NOT NULL DEFAULT 'facebook',
  template_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.targeting_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read targeting_templates"
  ON public.targeting_templates FOR SELECT
  USING (is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Owners/admins can insert targeting_templates"
  ON public.targeting_templates FOR INSERT
  WITH CHECK (is_workspace_owner_or_admin(auth.uid(), workspace_id));
CREATE POLICY "Owners/admins can update targeting_templates"
  ON public.targeting_templates FOR UPDATE
  USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));
CREATE POLICY "Owners/admins can delete targeting_templates"
  ON public.targeting_templates FOR DELETE
  USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));

CREATE TRIGGER update_targeting_templates_updated_at
  BEFORE UPDATE ON public.targeting_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add targeting_template_id to launches
ALTER TABLE public.launches
  ADD COLUMN targeting_template_id uuid REFERENCES public.targeting_templates(id) ON DELETE SET NULL;
