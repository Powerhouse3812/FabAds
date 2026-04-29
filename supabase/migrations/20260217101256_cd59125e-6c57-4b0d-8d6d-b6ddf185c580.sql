
-- =====================================================
-- Phase 1: Rename all 8 offer tables to campaign_url
-- =====================================================

-- 1. Rename tables
ALTER TABLE offers RENAME TO campaign_urls;
ALTER TABLE offer_ads RENAME TO campaign_url_ads;
ALTER TABLE offer_ad_accounts RENAME TO campaign_url_ad_accounts;
ALTER TABLE offer_folders RENAME TO campaign_url_folders;
ALTER TABLE offer_folder_items RENAME TO campaign_url_folder_items;
ALTER TABLE offer_pages RENAME TO campaign_url_pages;
ALTER TABLE offer_replacement_links RENAME TO campaign_url_replacement_links;
ALTER TABLE offer_cl_folder_links RENAME TO campaign_url_cl_folder_links;

-- 2. Rename offer_id columns in child tables
ALTER TABLE campaign_url_ads RENAME COLUMN offer_id TO campaign_url_id;
ALTER TABLE campaign_url_ad_accounts RENAME COLUMN offer_id TO campaign_url_id;
ALTER TABLE campaign_url_folders RENAME COLUMN offer_id TO campaign_url_id;
ALTER TABLE campaign_url_pages RENAME COLUMN offer_id TO campaign_url_id;
ALTER TABLE campaign_url_replacement_links RENAME COLUMN offer_id TO campaign_url_id;
ALTER TABLE campaign_url_cl_folder_links RENAME COLUMN offer_id TO campaign_url_id;

-- 3. Rename offer_type column on campaign_urls
ALTER TABLE campaign_urls RENAME COLUMN offer_type TO campaign_url_type;

-- 4. Rename RRM columns
ALTER TABLE rrm_account_settings RENAME COLUMN dilution_offer_id TO dilution_campaign_url_id;
ALTER TABLE rrm_account_settings RENAME COLUMN replacement_offer_id TO replacement_campaign_url_id;
ALTER TABLE rrm_global_settings RENAME COLUMN default_dilution_offer_id TO default_dilution_campaign_url_id;
ALTER TABLE rrm_global_settings RENAME COLUMN default_replacement_offer_id TO default_replacement_campaign_url_id;

-- =====================================================
-- Phase 2: Create campaign_url_targeting_links join table
-- =====================================================

CREATE TABLE public.campaign_url_targeting_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_url_id uuid NOT NULL REFERENCES public.campaign_urls(id) ON DELETE CASCADE,
  targeting_template_id uuid NOT NULL REFERENCES public.targeting_templates(id) ON DELETE CASCADE,
  is_default boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  workspace_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(campaign_url_id, targeting_template_id)
);

-- Enable RLS
ALTER TABLE public.campaign_url_targeting_links ENABLE ROW LEVEL SECURITY;

-- RLS policies (same pattern as other tables)
CREATE POLICY "Members can read campaign_url_targeting_links"
  ON public.campaign_url_targeting_links FOR SELECT
  USING (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Admins can insert campaign_url_targeting_links"
  ON public.campaign_url_targeting_links FOR INSERT
  WITH CHECK (is_workspace_owner_or_admin(auth.uid(), workspace_id));

CREATE POLICY "Admins can update campaign_url_targeting_links"
  ON public.campaign_url_targeting_links FOR UPDATE
  USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));

CREATE POLICY "Admins can delete campaign_url_targeting_links"
  ON public.campaign_url_targeting_links FOR DELETE
  USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));
