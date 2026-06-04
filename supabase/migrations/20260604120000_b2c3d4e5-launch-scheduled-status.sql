-- =====================================================================
-- DO NOT AUTO-APPLY — apply manually after review.
-- =====================================================================
-- Bulk Launch Distribution — Scheduled-status schema (follow-up to the
-- Slice-3 launch-distribution migration). Ad status is now
-- active / scheduled / paused; ACTIVE *and* SCHEDULED both consume a Page
-- slot (a scheduled ad will go live), PAUSED is free.
--
-- Adds:
--   - launches.scheduled_count    — rollup of scheduled created ads.
--   - launch_ads.scheduled_at     — absolute go-live instant (per created ad).
--   - launch_ads.ad_timezone      — IANA timezone the schedule was picked in.
--   - fb_ad_accounts.timezone     — default IANA timezone for the ad account.
--
-- RLS: launches / launch_ads / fb_ad_accounts already carry policies; new
-- columns inherit them — NO new policies, NO RLS changes here.
--
-- All ADDs are IF NOT EXISTS so a partial re-run is safe.
-- =====================================================================

-- ── 1. launches: scheduled rollup column ────────────────────────────
ALTER TABLE public.launches
  ADD COLUMN IF NOT EXISTS scheduled_count int NOT NULL DEFAULT 0;

-- ── 2. launch_ads: per-created-ad schedule columns ──────────────────
ALTER TABLE public.launch_ads
  ADD COLUMN IF NOT EXISTS scheduled_at timestamptz,
  ADD COLUMN IF NOT EXISTS ad_timezone  text;

-- ── 3. fb_ad_accounts: default timezone for scheduling ──────────────
ALTER TABLE public.fb_ad_accounts
  ADD COLUMN IF NOT EXISTS timezone text;
