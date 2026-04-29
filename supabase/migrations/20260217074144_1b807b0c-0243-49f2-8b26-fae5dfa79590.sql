ALTER TABLE public.insight_user_preferences 
  ADD COLUMN IF NOT EXISTS followed_brands text[] NOT NULL DEFAULT '{}';