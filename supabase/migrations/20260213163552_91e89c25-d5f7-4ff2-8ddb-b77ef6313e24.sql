
-- ============================================================
-- Account Health + Offers Foundation v1
-- ============================================================

-- 1. account_health_config
CREATE TABLE public.account_health_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  fb_ad_account_id uuid NOT NULL REFERENCES public.fb_ad_accounts(id) ON DELETE CASCADE,
  guardrail_mode text NOT NULL DEFAULT 'off',
  rejection_threshold numeric NOT NULL DEFAULT 1.0,
  warning_threshold numeric NOT NULL DEFAULT 0.8,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, fb_ad_account_id)
);

ALTER TABLE public.account_health_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read account_health_config" ON public.account_health_config FOR SELECT USING (is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Admins can insert account_health_config" ON public.account_health_config FOR INSERT WITH CHECK (is_workspace_owner_or_admin(auth.uid(), workspace_id));
CREATE POLICY "Admins can update account_health_config" ON public.account_health_config FOR UPDATE USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));
CREATE POLICY "Admins can delete account_health_config" ON public.account_health_config FOR DELETE USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));

CREATE TRIGGER update_account_health_config_updated_at
  BEFORE UPDATE ON public.account_health_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. account_health_snapshots (time-series)
CREATE TABLE public.account_health_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  fb_ad_account_id uuid NOT NULL REFERENCES public.fb_ad_accounts(id) ON DELETE CASCADE,
  sync_status text NOT NULL DEFAULT 'pending',
  approved_ads integer,
  rejected_ads integer,
  total_ads integer,
  rejection_ratio numeric,
  health_state text NOT NULL DEFAULT 'unknown',
  last_synced_at timestamptz,
  snapshot_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.account_health_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read account_health_snapshots" ON public.account_health_snapshots FOR SELECT USING (is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Admins can insert account_health_snapshots" ON public.account_health_snapshots FOR INSERT WITH CHECK (is_workspace_owner_or_admin(auth.uid(), workspace_id));
CREATE POLICY "Admins can update account_health_snapshots" ON public.account_health_snapshots FOR UPDATE USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));
CREATE POLICY "Admins can delete account_health_snapshots" ON public.account_health_snapshots FOR DELETE USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));

CREATE INDEX idx_health_snapshots_account_time ON public.account_health_snapshots (fb_ad_account_id, snapshot_at DESC);

-- 3. account_health_events
CREATE TABLE public.account_health_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  fb_ad_account_id uuid NOT NULL REFERENCES public.fb_ad_accounts(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.account_health_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read account_health_events" ON public.account_health_events FOR SELECT USING (is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Admins can insert account_health_events" ON public.account_health_events FOR INSERT WITH CHECK (is_workspace_owner_or_admin(auth.uid(), workspace_id));
CREATE POLICY "Admins can update account_health_events" ON public.account_health_events FOR UPDATE USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));
CREATE POLICY "Admins can delete account_health_events" ON public.account_health_events FOR DELETE USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));

-- 4. offers
CREATE TABLE public.offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  name text NOT NULL,
  strategy text,
  tracking_url text,
  pixel_id text,
  flow text,
  lookalike jsonb NOT NULL DEFAULT '{}',
  targeting_template_id uuid REFERENCES public.targeting_templates(id) ON DELETE SET NULL,
  campaign_naming jsonb NOT NULL DEFAULT '{}',
  launch_type text NOT NULL DEFAULT 'flexible',
  creative_folder_id uuid,
  status text NOT NULL DEFAULT 'active',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read offers" ON public.offers FOR SELECT USING (is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Admins can insert offers" ON public.offers FOR INSERT WITH CHECK (is_workspace_owner_or_admin(auth.uid(), workspace_id));
CREATE POLICY "Admins can update offers" ON public.offers FOR UPDATE USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));
CREATE POLICY "Admins can delete offers" ON public.offers FOR DELETE USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));

CREATE TRIGGER update_offers_updated_at
  BEFORE UPDATE ON public.offers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. offer_ad_accounts
CREATE TABLE public.offer_ad_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  fb_ad_account_id uuid NOT NULL REFERENCES public.fb_ad_accounts(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL,
  UNIQUE(offer_id, fb_ad_account_id)
);

ALTER TABLE public.offer_ad_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read offer_ad_accounts" ON public.offer_ad_accounts FOR SELECT USING (is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Admins can insert offer_ad_accounts" ON public.offer_ad_accounts FOR INSERT WITH CHECK (is_workspace_owner_or_admin(auth.uid(), workspace_id));
CREATE POLICY "Admins can update offer_ad_accounts" ON public.offer_ad_accounts FOR UPDATE USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));
CREATE POLICY "Admins can delete offer_ad_accounts" ON public.offer_ad_accounts FOR DELETE USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));

-- 6. offer_pages
CREATE TABLE public.offer_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  page_id text NOT NULL,
  workspace_id uuid NOT NULL,
  UNIQUE(offer_id, page_id)
);

ALTER TABLE public.offer_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read offer_pages" ON public.offer_pages FOR SELECT USING (is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Admins can insert offer_pages" ON public.offer_pages FOR INSERT WITH CHECK (is_workspace_owner_or_admin(auth.uid(), workspace_id));
CREATE POLICY "Admins can update offer_pages" ON public.offer_pages FOR UPDATE USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));
CREATE POLICY "Admins can delete offer_pages" ON public.offer_pages FOR DELETE USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));
