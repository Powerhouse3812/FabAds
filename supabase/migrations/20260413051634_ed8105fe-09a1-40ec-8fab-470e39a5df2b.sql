
-- Create saved_strategies table
CREATE TABLE public.saved_strategies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL,
  created_by UUID NOT NULL,
  brand_id UUID,
  title TEXT NOT NULL,
  angle TEXT,
  hook TEXT,
  layout TEXT,
  visual_direction TEXT,
  is_custom BOOLEAN NOT NULL DEFAULT false,
  custom_prompt TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_strategies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read saved_strategies"
  ON public.saved_strategies FOR SELECT TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Members can insert saved_strategies"
  ON public.saved_strategies FOR INSERT TO authenticated
  WITH CHECK (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Members can update saved_strategies"
  ON public.saved_strategies FOR UPDATE TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Members can delete saved_strategies"
  ON public.saved_strategies FOR DELETE TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id));

-- Create saved_concepts table
CREATE TABLE public.saved_concepts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID NOT NULL,
  created_by UUID NOT NULL,
  category_id UUID,
  title TEXT NOT NULL,
  scene TEXT,
  composition TEXT,
  background TEXT,
  lighting TEXT,
  is_custom BOOLEAN NOT NULL DEFAULT false,
  custom_prompt TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.saved_concepts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read saved_concepts"
  ON public.saved_concepts FOR SELECT TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Members can insert saved_concepts"
  ON public.saved_concepts FOR INSERT TO authenticated
  WITH CHECK (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Members can update saved_concepts"
  ON public.saved_concepts FOR UPDATE TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Members can delete saved_concepts"
  ON public.saved_concepts FOR DELETE TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id));

-- Add brand_id and category_id to genie_templates
ALTER TABLE public.genie_templates
  ADD COLUMN brand_id UUID,
  ADD COLUMN category_id UUID;
