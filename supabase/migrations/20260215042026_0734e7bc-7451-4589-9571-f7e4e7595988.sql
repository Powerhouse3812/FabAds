
-- ═══════════ cl_headlines ═══════════
CREATE TABLE public.cl_headlines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  text text NOT NULL,
  categories text[] NOT NULL DEFAULT '{}',
  tags text[] NOT NULL DEFAULT '{}',
  platforms text[] NOT NULL DEFAULT '{}',
  is_favourite boolean NOT NULL DEFAULT false,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cl_headlines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read cl_headlines" ON public.cl_headlines FOR SELECT USING (is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Admins can insert cl_headlines" ON public.cl_headlines FOR INSERT WITH CHECK (is_workspace_owner_or_admin(auth.uid(), workspace_id));
CREATE POLICY "Admins can update cl_headlines" ON public.cl_headlines FOR UPDATE USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));
CREATE POLICY "Admins can delete cl_headlines" ON public.cl_headlines FOR DELETE USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));

-- ═══════════ cl_primary_texts ═══════════
CREATE TABLE public.cl_primary_texts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  text text NOT NULL,
  categories text[] NOT NULL DEFAULT '{}',
  tags text[] NOT NULL DEFAULT '{}',
  platforms text[] NOT NULL DEFAULT '{}',
  is_favourite boolean NOT NULL DEFAULT false,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cl_primary_texts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read cl_primary_texts" ON public.cl_primary_texts FOR SELECT USING (is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Admins can insert cl_primary_texts" ON public.cl_primary_texts FOR INSERT WITH CHECK (is_workspace_owner_or_admin(auth.uid(), workspace_id));
CREATE POLICY "Admins can update cl_primary_texts" ON public.cl_primary_texts FOR UPDATE USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));
CREATE POLICY "Admins can delete cl_primary_texts" ON public.cl_primary_texts FOR DELETE USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));

-- ═══════════ cl_descriptions ═══════════
CREATE TABLE public.cl_descriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  text text NOT NULL,
  categories text[] NOT NULL DEFAULT '{}',
  tags text[] NOT NULL DEFAULT '{}',
  platforms text[] NOT NULL DEFAULT '{}',
  is_favourite boolean NOT NULL DEFAULT false,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cl_descriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read cl_descriptions" ON public.cl_descriptions FOR SELECT USING (is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Admins can insert cl_descriptions" ON public.cl_descriptions FOR INSERT WITH CHECK (is_workspace_owner_or_admin(auth.uid(), workspace_id));
CREATE POLICY "Admins can update cl_descriptions" ON public.cl_descriptions FOR UPDATE USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));
CREATE POLICY "Admins can delete cl_descriptions" ON public.cl_descriptions FOR DELETE USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));

-- ═══════════ cl_adgroups ═══════════
CREATE TABLE public.cl_adgroups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Untitled Adgroup',
  page_name text NOT NULL DEFAULT '',
  page_avatar_url text,
  ad_type text NOT NULL DEFAULT 'Static',
  primary_text_id uuid REFERENCES public.cl_primary_texts(id) ON DELETE SET NULL,
  headline_id uuid REFERENCES public.cl_headlines(id) ON DELETE SET NULL,
  description_id uuid REFERENCES public.cl_descriptions(id) ON DELETE SET NULL,
  media_ids uuid[] NOT NULL DEFAULT '{}',
  destination_url text,
  display_link text,
  cta text NOT NULL DEFAULT 'CTA button',
  is_favourite boolean NOT NULL DEFAULT false,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cl_adgroups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read cl_adgroups" ON public.cl_adgroups FOR SELECT USING (is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Admins can insert cl_adgroups" ON public.cl_adgroups FOR INSERT WITH CHECK (is_workspace_owner_or_admin(auth.uid(), workspace_id));
CREATE POLICY "Admins can update cl_adgroups" ON public.cl_adgroups FOR UPDATE USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));
CREATE POLICY "Admins can delete cl_adgroups" ON public.cl_adgroups FOR DELETE USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));
