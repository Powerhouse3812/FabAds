
-- Create rrm_global_settings table
CREATE TABLE public.rrm_global_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL UNIQUE REFERENCES public.workspaces(id) ON DELETE CASCADE,
  auto_launch_enabled boolean NOT NULL DEFAULT false,
  auto_launch_delay_minutes integer NOT NULL DEFAULT 0,
  ad_name_append text NOT NULL DEFAULT '',
  default_dilution_offer_id uuid REFERENCES public.offers(id) ON DELETE SET NULL,
  default_replacement_offer_id uuid REFERENCES public.offers(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rrm_global_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read rrm_global_settings"
  ON public.rrm_global_settings FOR SELECT
  USING (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Admins can insert rrm_global_settings"
  ON public.rrm_global_settings FOR INSERT
  WITH CHECK (is_workspace_owner_or_admin(auth.uid(), workspace_id));

CREATE POLICY "Admins can update rrm_global_settings"
  ON public.rrm_global_settings FOR UPDATE
  USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));

CREATE POLICY "Admins can delete rrm_global_settings"
  ON public.rrm_global_settings FOR DELETE
  USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));

CREATE TRIGGER update_rrm_global_settings_updated_at
  BEFORE UPDATE ON public.rrm_global_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Extend rrm_account_settings with override columns
ALTER TABLE public.rrm_account_settings
  ADD COLUMN auto_launch_override boolean NOT NULL DEFAULT false,
  ADD COLUMN auto_launch_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN ad_name_append text;
