
-- =============================================
-- Launch Phase 1: All tables + storage bucket
-- =============================================

-- 1. launches
CREATE TABLE public.launches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  platform text NOT NULL DEFAULT 'facebook',
  launch_config jsonb DEFAULT '{}'::jsonb,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.launches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read launches" ON public.launches FOR SELECT USING (is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Owners/admins can insert launches" ON public.launches FOR INSERT WITH CHECK (is_workspace_owner_or_admin(auth.uid(), workspace_id));
CREATE POLICY "Owners/admins can update launches" ON public.launches FOR UPDATE USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));
CREATE POLICY "Owners/admins can delete launches" ON public.launches FOR DELETE USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));

-- 2. launch_ad_accounts
CREATE TABLE public.launch_ad_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  launch_id uuid NOT NULL REFERENCES public.launches(id) ON DELETE CASCADE,
  fb_ad_account_id uuid NOT NULL REFERENCES public.fb_ad_accounts(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  setup_config jsonb DEFAULT '{}'::jsonb
);

ALTER TABLE public.launch_ad_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read launch_ad_accounts" ON public.launch_ad_accounts FOR SELECT USING (is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Owners/admins can insert launch_ad_accounts" ON public.launch_ad_accounts FOR INSERT WITH CHECK (is_workspace_owner_or_admin(auth.uid(), workspace_id));
CREATE POLICY "Owners/admins can update launch_ad_accounts" ON public.launch_ad_accounts FOR UPDATE USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));
CREATE POLICY "Owners/admins can delete launch_ad_accounts" ON public.launch_ad_accounts FOR DELETE USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));

-- 3. launch_campaigns
CREATE TABLE public.launch_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  launch_id uuid NOT NULL REFERENCES public.launches(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Campaign 1',
  objective text,
  budget_type text,
  budget_period text,
  budget_value numeric,
  bid_strategy text,
  delivery_type text,
  special_ad_category text[] DEFAULT '{}',
  sort_order int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active'
);

ALTER TABLE public.launch_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read launch_campaigns" ON public.launch_campaigns FOR SELECT USING (is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Owners/admins can insert launch_campaigns" ON public.launch_campaigns FOR INSERT WITH CHECK (is_workspace_owner_or_admin(auth.uid(), workspace_id));
CREATE POLICY "Owners/admins can update launch_campaigns" ON public.launch_campaigns FOR UPDATE USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));
CREATE POLICY "Owners/admins can delete launch_campaigns" ON public.launch_campaigns FOR DELETE USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));

-- 4. launch_adsets
CREATE TABLE public.launch_adsets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  launch_id uuid NOT NULL REFERENCES public.launches(id) ON DELETE CASCADE,
  campaign_id uuid NOT NULL REFERENCES public.launch_campaigns(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Adset 1',
  schedule_start timestamptz,
  schedule_end timestamptz,
  targeting jsonb DEFAULT '{}'::jsonb,
  placements jsonb DEFAULT '{"type":"automatic"}'::jsonb,
  performance_goal text,
  budget_value numeric,
  budget_period text,
  bid_strategy text,
  bid_amount numeric,
  delivery_type text,
  sort_order int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active'
);

ALTER TABLE public.launch_adsets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read launch_adsets" ON public.launch_adsets FOR SELECT USING (is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Owners/admins can insert launch_adsets" ON public.launch_adsets FOR INSERT WITH CHECK (is_workspace_owner_or_admin(auth.uid(), workspace_id));
CREATE POLICY "Owners/admins can update launch_adsets" ON public.launch_adsets FOR UPDATE USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));
CREATE POLICY "Owners/admins can delete launch_adsets" ON public.launch_adsets FOR DELETE USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));

-- 5. launch_ads
CREATE TABLE public.launch_ads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  launch_id uuid NOT NULL REFERENCES public.launches(id) ON DELETE CASCADE,
  adset_id uuid NOT NULL REFERENCES public.launch_adsets(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Ad 1',
  primary_text text,
  headline text,
  description text,
  cta text,
  destination_url text,
  display_link text,
  media_urls text[] DEFAULT '{}',
  media_type text,
  sort_order int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active'
);

ALTER TABLE public.launch_ads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read launch_ads" ON public.launch_ads FOR SELECT USING (is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Owners/admins can insert launch_ads" ON public.launch_ads FOR INSERT WITH CHECK (is_workspace_owner_or_admin(auth.uid(), workspace_id));
CREATE POLICY "Owners/admins can update launch_ads" ON public.launch_ads FOR UPDATE USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));
CREATE POLICY "Owners/admins can delete launch_ads" ON public.launch_ads FOR DELETE USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));

-- 6. Updated_at trigger function (reuse if exists)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_launches_updated_at
  BEFORE UPDATE ON public.launches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Storage bucket for launch media
INSERT INTO storage.buckets (id, name, public) VALUES ('launch-media', 'launch-media', true);

CREATE POLICY "Anyone can read launch media" ON storage.objects FOR SELECT USING (bucket_id = 'launch-media');
CREATE POLICY "Workspace members can upload launch media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'launch-media' AND auth.role() = 'authenticated');
CREATE POLICY "Workspace members can update launch media" ON storage.objects FOR UPDATE USING (bucket_id = 'launch-media' AND auth.role() = 'authenticated');
CREATE POLICY "Workspace members can delete launch media" ON storage.objects FOR DELETE USING (bucket_id = 'launch-media' AND auth.role() = 'authenticated');
