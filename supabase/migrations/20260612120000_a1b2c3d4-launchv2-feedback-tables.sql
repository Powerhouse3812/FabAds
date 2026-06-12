-- Launch v2 — feedback subsystem tables.
--
-- The FeedbackSheet (src/launchv2/feedback/) writes to two tables that
-- exist in the TypeScript schema (src/integrations/supabase/types.ts) but
-- were never actually created in the database. Testers see submissions
-- fail silently because the relations don't exist.
--
-- This migration creates both tables + RLS policies that allow shared
-- prototype testers (authenticated via auto-login OR anon for fallback)
-- to INSERT rows. The dashboard at /launchv2/feedback-panel reads via
-- authenticated SELECT.

-- ─────────────────────────────────────────────────────────────────────────
-- 1. launchv2_feedback — every submitted bug / problem / suggestion / praise.
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.launchv2_feedback (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id      text          NOT NULL,
  email           text,
  tester_name     text,
  tester_email    text,
  category        text          NOT NULL,
  severity        text,
  answers         jsonb         NOT NULL DEFAULT '{}'::jsonb,
  message         text,
  screenshot      text,
  screen_path     text,
  deep_link       text,
  step            text,
  variant         text,
  ip              text,
  geo             jsonb,
  device          jsonb,
  user_agent      text,
  timezone        text,
  language        text,
  session_seconds numeric,
  page_seconds    numeric,
  status          text          NOT NULL DEFAULT 'new',
  created_at      timestamptz   NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS launchv2_feedback_visitor_idx
  ON public.launchv2_feedback (visitor_id);
CREATE INDEX IF NOT EXISTS launchv2_feedback_created_idx
  ON public.launchv2_feedback (created_at DESC);
CREATE INDEX IF NOT EXISTS launchv2_feedback_status_idx
  ON public.launchv2_feedback (status);

ALTER TABLE public.launchv2_feedback ENABLE ROW LEVEL SECURITY;

-- Anyone (anon or authenticated) can submit. Prototype testers may not
-- always have an authenticated session — the FeedbackSheet still needs to
-- work for them.
CREATE POLICY "launchv2_feedback_insert_public"
  ON public.launchv2_feedback
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Read + triage update — authenticated only (dashboard surface).
CREATE POLICY "launchv2_feedback_select_authenticated"
  ON public.launchv2_feedback
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "launchv2_feedback_update_authenticated"
  ON public.launchv2_feedback
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────
-- 2. launchv2_tester — roster of everyone who opened the prototype link.
-- ─────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.launchv2_tester (
  visitor_id  text         PRIMARY KEY,
  name        text,
  email       text,
  source      text,
  first_seen  timestamptz  NOT NULL DEFAULT now(),
  last_seen   timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS launchv2_tester_last_seen_idx
  ON public.launchv2_tester (last_seen DESC);

ALTER TABLE public.launchv2_tester ENABLE ROW LEVEL SECURITY;

-- Anyone can upsert their tester row (called from IdentityGate / identity.ts).
CREATE POLICY "launchv2_tester_insert_public"
  ON public.launchv2_tester
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "launchv2_tester_update_public"
  ON public.launchv2_tester
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- Read — authenticated only (dashboard).
CREATE POLICY "launchv2_tester_select_authenticated"
  ON public.launchv2_tester
  FOR SELECT
  TO authenticated
  USING (true);
