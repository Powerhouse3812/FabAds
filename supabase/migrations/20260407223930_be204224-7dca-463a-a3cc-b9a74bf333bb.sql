CREATE TABLE public.brand_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL,
  url text,
  image_url text,
  price text,
  sku text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.brand_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can manage brand_products in their workspace"
ON public.brand_products FOR ALL TO authenticated
USING (public.is_workspace_member(auth.uid(), workspace_id))
WITH CHECK (public.is_workspace_member(auth.uid(), workspace_id));

-- Add last_synced_at to brands table
ALTER TABLE public.brands ADD COLUMN IF NOT EXISTS last_synced_at timestamptz;