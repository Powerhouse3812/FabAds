-- =====================================================================
-- DO NOT AUTO-APPLY — apply manually after review.
-- =====================================================================
-- Bulk Launch Distribution — Slice 3 (Reports) schema.
-- Adds distribution provenance columns to `launches` + `launch_ads`,
-- creates the `fb_pages` capacity table, and wires a GUARDED FK from
-- launch_ads.destination_fb_page_id -> fb_pages.id.
--
-- RLS: launches / launch_ads already have policies (is_workspace_member +
-- is_workspace_owner_or_admin). New columns inherit them — NO new policies
-- on those tables. fb_pages enables RLS and inherits the SAME workspace
-- helpers used everywhere else (read = member, write = owner/admin).
--
-- All ADDs are IF NOT EXISTS so a partial re-run is safe.
-- =====================================================================

-- ── 1. launches: distribution summary columns ───────────────────────
ALTER TABLE public.launches
  ADD COLUMN IF NOT EXISTS launch_batch_id     uuid,
  ADD COLUMN IF NOT EXISTS launch_strategy     text
    CHECK (launch_strategy IN ('fill_first', 'equal', 'duplicate')),
  ADD COLUMN IF NOT EXISTS selected_ads_count  int     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_ads_count   int     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS active_count        int     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS paused_count        int     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS target_pairs_count  int     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS unique_pages_count  int     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS budget_before       numeric,
  ADD COLUMN IF NOT EXISTS budget_after        numeric,
  ADD COLUMN IF NOT EXISTS budget_multiplier   numeric NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_launches_launch_batch_id
  ON public.launches (launch_batch_id);

-- ── 2. launch_ads: per-created-ad provenance columns ────────────────
ALTER TABLE public.launch_ads
  ADD COLUMN IF NOT EXISTS source_ad_id            uuid,
  ADD COLUMN IF NOT EXISTS created_ad_id           text,
  ADD COLUMN IF NOT EXISTS copy_group_id           uuid,
  ADD COLUMN IF NOT EXISTS target_pair_id          text,
  ADD COLUMN IF NOT EXISTS destination_fb_page_id  text,
  ADD COLUMN IF NOT EXISTS destination_ad_account_id uuid,
  ADD COLUMN IF NOT EXISTS budget_before           numeric,
  ADD COLUMN IF NOT EXISTS budget_after            numeric,
  ADD COLUMN IF NOT EXISTS budget_multiplier       numeric NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_launch_ads_source_ad_id
  ON public.launch_ads (source_ad_id);
CREATE INDEX IF NOT EXISTS idx_launch_ads_copy_group_id
  ON public.launch_ads (copy_group_id);
CREATE INDEX IF NOT EXISTS idx_launch_ads_destination_fb_page_id
  ON public.launch_ads (destination_fb_page_id);
CREATE INDEX IF NOT EXISTS idx_launch_ads_destination_ad_account_id
  ON public.launch_ads (destination_ad_account_id);

-- ── 3. fb_pages: Facebook Page capacity registry ────────────────────
-- A Facebook Page (`fb_page_id`) may be linked under MULTIPLE ad accounts;
-- the 250 active-ad cap is keyed on the page identity, not the link.
CREATE TABLE IF NOT EXISTS public.fb_pages (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id     uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  fb_ad_account_id uuid,
  fb_page_id       text NOT NULL,
  name             text,
  active_ad_count  int NOT NULL DEFAULT 0,
  status           text
);

CREATE INDEX IF NOT EXISTS idx_fb_pages_workspace_id
  ON public.fb_pages (workspace_id);
CREATE INDEX IF NOT EXISTS idx_fb_pages_fb_ad_account_id
  ON public.fb_pages (fb_ad_account_id);
CREATE INDEX IF NOT EXISTS idx_fb_pages_fb_page_id
  ON public.fb_pages (fb_page_id);

ALTER TABLE public.fb_pages ENABLE ROW LEVEL SECURITY;

-- fb_pages inherits the SAME workspace RLS shape as the launch_* tables.
CREATE POLICY "Members can read fb_pages"
  ON public.fb_pages FOR SELECT
  USING (is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Owners/admins can insert fb_pages"
  ON public.fb_pages FOR INSERT
  WITH CHECK (is_workspace_owner_or_admin(auth.uid(), workspace_id));
CREATE POLICY "Owners/admins can update fb_pages"
  ON public.fb_pages FOR UPDATE
  USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));
CREATE POLICY "Owners/admins can delete fb_pages"
  ON public.fb_pages FOR DELETE
  USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));

-- ── 4. Guarded FK: launch_ads.destination_fb_page_id -> fb_pages ─────
-- launch_ads.destination_fb_page_id stores the text Facebook Page identity
-- (fb_pages.fb_page_id). A page can be linked under multiple ad accounts, so
-- fb_page_id is NOT globally unique on its own — a Postgres FK requires a
-- UNIQUE/PK target. We therefore only wire the FK when a unique constraint on
-- fb_pages.fb_page_id actually exists (e.g. a single-account deployment that
-- chose to add one). The guard makes this a graceful no-op otherwise, so the
-- script never aborts whether or not fb_pages or that unique key is present.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'fb_pages'
  )
  AND NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema = 'public'
      AND constraint_name = 'launch_ads_destination_fb_page_id_fkey'
  )
  AND EXISTS (
    SELECT 1 FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    WHERE t.relname = 'fb_pages'
      AND c.contype IN ('u', 'p')
      AND (
        SELECT array_agg(a.attname ORDER BY a.attname)
        FROM unnest(c.conkey) AS k(attnum)
        JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.attnum
      ) = ARRAY['fb_page_id']
  ) THEN
    ALTER TABLE public.launch_ads
      ADD CONSTRAINT launch_ads_destination_fb_page_id_fkey
      FOREIGN KEY (destination_fb_page_id)
      REFERENCES public.fb_pages (fb_page_id);
  END IF;
END $$;
