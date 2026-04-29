
-- offer_folders: stores folders linked to offers
CREATE TABLE public.offer_folders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL,
  offer_id uuid NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.offer_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read offer_folders" ON public.offer_folders FOR SELECT USING (is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Admins can insert offer_folders" ON public.offer_folders FOR INSERT WITH CHECK (is_workspace_owner_or_admin(auth.uid(), workspace_id));
CREATE POLICY "Admins can update offer_folders" ON public.offer_folders FOR UPDATE USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));
CREATE POLICY "Admins can delete offer_folders" ON public.offer_folders FOR DELETE USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));

CREATE TRIGGER update_offer_folders_updated_at BEFORE UPDATE ON public.offer_folders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- offer_folder_items: items inside folders (media now, adgroup later)
-- asset_id has NO FK for safety; source tracks origin
CREATE TABLE public.offer_folder_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  folder_id uuid NOT NULL REFERENCES public.offer_folders(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL,
  item_type text NOT NULL DEFAULT 'media',
  asset_id uuid,
  source text NOT NULL DEFAULT 'creative_library',
  media_type text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.offer_folder_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read offer_folder_items" ON public.offer_folder_items FOR SELECT USING (is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Admins can insert offer_folder_items" ON public.offer_folder_items FOR INSERT WITH CHECK (is_workspace_owner_or_admin(auth.uid(), workspace_id));
CREATE POLICY "Admins can update offer_folder_items" ON public.offer_folder_items FOR UPDATE USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));
CREATE POLICY "Admins can delete offer_folder_items" ON public.offer_folder_items FOR DELETE USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));
