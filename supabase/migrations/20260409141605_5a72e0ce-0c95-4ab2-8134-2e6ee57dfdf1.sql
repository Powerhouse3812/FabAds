
-- Create genie_categories table
CREATE TABLE public.genie_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL,
  created_by UUID NOT NULL,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '📁',
  niche TEXT,
  system_prompt TEXT,
  reference_urls JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.genie_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read genie_categories"
  ON public.genie_categories FOR SELECT
  TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Members can insert genie_categories"
  ON public.genie_categories FOR INSERT
  TO authenticated
  WITH CHECK (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Members can update genie_categories"
  ON public.genie_categories FOR UPDATE
  TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Members can delete genie_categories"
  ON public.genie_categories FOR DELETE
  TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id));

CREATE TRIGGER update_genie_categories_updated_at
  BEFORE UPDATE ON public.genie_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create genie_category_winners table
CREATE TABLE public.genie_category_winners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.genie_categories(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  storage_path TEXT NOT NULL DEFAULT '',
  tags TEXT[] NOT NULL DEFAULT '{}',
  source TEXT DEFAULT 'upload',
  notes TEXT,
  is_cross_niche BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.genie_category_winners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read genie_category_winners"
  ON public.genie_category_winners FOR SELECT
  TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Members can insert genie_category_winners"
  ON public.genie_category_winners FOR INSERT
  TO authenticated
  WITH CHECK (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Members can update genie_category_winners"
  ON public.genie_category_winners FOR UPDATE
  TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Members can delete genie_category_winners"
  ON public.genie_category_winners FOR DELETE
  TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id));
