
-- 1. Create rrm_global_links table
CREATE TABLE public.rrm_global_links (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL,
  link_type text NOT NULL,
  url text NOT NULL,
  label text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rrm_global_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read rrm_global_links"
  ON public.rrm_global_links FOR SELECT
  USING (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Admins can insert rrm_global_links"
  ON public.rrm_global_links FOR INSERT
  WITH CHECK (is_workspace_owner_or_admin(auth.uid(), workspace_id));

CREATE POLICY "Admins can update rrm_global_links"
  ON public.rrm_global_links FOR UPDATE
  USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));

CREATE POLICY "Admins can delete rrm_global_links"
  ON public.rrm_global_links FOR DELETE
  USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));

-- 2. Create rrm_account_links table
CREATE TABLE public.rrm_account_links (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL,
  fb_ad_account_id uuid NOT NULL,
  link_type text NOT NULL,
  url text NOT NULL,
  label text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rrm_account_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read rrm_account_links"
  ON public.rrm_account_links FOR SELECT
  USING (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Admins can insert rrm_account_links"
  ON public.rrm_account_links FOR INSERT
  WITH CHECK (is_workspace_owner_or_admin(auth.uid(), workspace_id));

CREATE POLICY "Admins can update rrm_account_links"
  ON public.rrm_account_links FOR UPDATE
  USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));

CREATE POLICY "Admins can delete rrm_account_links"
  ON public.rrm_account_links FOR DELETE
  USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));

-- 3. ALTER rrm_global_settings - add 11 new columns
ALTER TABLE public.rrm_global_settings
  ADD COLUMN IF NOT EXISTS dilution_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS replacement_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS dilution_ad_name_prefix text NOT NULL DEFAULT '[DILUTION]',
  ADD COLUMN IF NOT EXISTS replacement_ad_name_prefix text NOT NULL DEFAULT '[RECOVERY]',
  ADD COLUMN IF NOT EXISTS check_interval_minutes integer NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS warning_threshold numeric NOT NULL DEFAULT 0.8,
  ADD COLUMN IF NOT EXISTS rejection_threshold numeric NOT NULL DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS recovery_threshold numeric NOT NULL DEFAULT 0.5,
  ADD COLUMN IF NOT EXISTS pause_rate numeric NOT NULL DEFAULT 10.0,
  ADD COLUMN IF NOT EXISTS dilution_links_source text NOT NULL DEFAULT 'global',
  ADD COLUMN IF NOT EXISTS replacement_links_source text NOT NULL DEFAULT 'global';

-- 4. ALTER rrm_account_settings - add 7 new columns
ALTER TABLE public.rrm_account_settings
  ADD COLUMN IF NOT EXISTS ad_name_prefix_override text,
  ADD COLUMN IF NOT EXISTS warning_threshold_override numeric,
  ADD COLUMN IF NOT EXISTS rejection_threshold_override numeric,
  ADD COLUMN IF NOT EXISTS recovery_threshold_override numeric,
  ADD COLUMN IF NOT EXISTS pause_rate_override numeric,
  ADD COLUMN IF NOT EXISTS dilution_links_source text,
  ADD COLUMN IF NOT EXISTS replacement_links_source text;

-- 5. Validation trigger for rrm_global_settings thresholds
CREATE OR REPLACE FUNCTION public.validate_rrm_global_settings()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.warning_threshold < 0 OR NEW.warning_threshold > NEW.rejection_threshold THEN
    RAISE EXCEPTION 'warning_threshold must be between 0 and rejection_threshold';
  END IF;
  IF NEW.rejection_threshold < NEW.warning_threshold OR NEW.rejection_threshold > 100 THEN
    RAISE EXCEPTION 'rejection_threshold must be between warning_threshold and 100';
  END IF;
  IF NEW.recovery_threshold < 0 OR NEW.recovery_threshold > NEW.warning_threshold THEN
    RAISE EXCEPTION 'recovery_threshold must be between 0 and warning_threshold';
  END IF;
  IF NEW.pause_rate < 0 OR NEW.pause_rate > 100 THEN
    RAISE EXCEPTION 'pause_rate must be between 0 and 100';
  END IF;
  IF NEW.check_interval_minutes < 1 THEN
    RAISE EXCEPTION 'check_interval_minutes must be >= 1';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_rrm_global_settings_trigger
  BEFORE INSERT OR UPDATE ON public.rrm_global_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_rrm_global_settings();
