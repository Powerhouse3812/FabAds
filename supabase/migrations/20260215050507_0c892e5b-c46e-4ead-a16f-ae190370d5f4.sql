
-- Create offer_cl_folder_links table
CREATE TABLE public.offer_cl_folder_links (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  offer_id uuid NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  cl_folder_id uuid NOT NULL REFERENCES public.cl_folders(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (offer_id, cl_folder_id)
);

-- Enable RLS
ALTER TABLE public.offer_cl_folder_links ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Members can read offer_cl_folder_links"
  ON public.offer_cl_folder_links FOR SELECT
  USING (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Admins can insert offer_cl_folder_links"
  ON public.offer_cl_folder_links FOR INSERT
  WITH CHECK (is_workspace_owner_or_admin(auth.uid(), workspace_id));

CREATE POLICY "Admins can update offer_cl_folder_links"
  ON public.offer_cl_folder_links FOR UPDATE
  USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));

CREATE POLICY "Admins can delete offer_cl_folder_links"
  ON public.offer_cl_folder_links FOR DELETE
  USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));
