ALTER TABLE public.saved_strategies ADD COLUMN tags text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.saved_concepts ADD COLUMN tags text[] NOT NULL DEFAULT '{}';