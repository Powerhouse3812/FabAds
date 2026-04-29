CREATE TABLE public.offer_replacement_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.offer_replacement_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage offer replacement links in their workspace"
  ON public.offer_replacement_links
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_users
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_users
      WHERE user_id = auth.uid()
    )
  );