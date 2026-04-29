
-- 1. Add offer_type to offers table
ALTER TABLE public.offers ADD COLUMN IF NOT EXISTS offer_type text NOT NULL DEFAULT 'standard';

-- 2. Create rrm_account_settings table
CREATE TABLE public.rrm_account_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  fb_ad_account_id uuid NOT NULL REFERENCES public.fb_ad_accounts(id) ON DELETE CASCADE,
  dilution_enabled boolean NOT NULL DEFAULT false,
  dilution_offer_id uuid REFERENCES public.offers(id) ON DELETE SET NULL,
  replacement_enabled boolean NOT NULL DEFAULT false,
  replacement_offer_id uuid REFERENCES public.offers(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, fb_ad_account_id)
);

-- Enable RLS
ALTER TABLE public.rrm_account_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Members can read rrm_account_settings"
  ON public.rrm_account_settings FOR SELECT
  USING (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Admins can insert rrm_account_settings"
  ON public.rrm_account_settings FOR INSERT
  WITH CHECK (is_workspace_owner_or_admin(auth.uid(), workspace_id));

CREATE POLICY "Admins can update rrm_account_settings"
  ON public.rrm_account_settings FOR UPDATE
  USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));

CREATE POLICY "Admins can delete rrm_account_settings"
  ON public.rrm_account_settings FOR DELETE
  USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));

-- Timestamp trigger
CREATE TRIGGER update_rrm_account_settings_updated_at
  BEFORE UPDATE ON public.rrm_account_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
