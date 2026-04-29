
-- 1. insight_user_preferences
CREATE TABLE public.insight_user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  user_id UUID NOT NULL,
  industries TEXT[] NOT NULL DEFAULT '{}',
  interests TEXT[] NOT NULL DEFAULT '{}',
  followed_tags TEXT[] NOT NULL DEFAULT '{}',
  onboarded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.insight_user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can read insight_user_preferences" ON public.insight_user_preferences FOR SELECT USING (is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Users can insert own preferences" ON public.insight_user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id AND is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Users can update own preferences" ON public.insight_user_preferences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own preferences" ON public.insight_user_preferences FOR DELETE USING (auth.uid() = user_id);
CREATE UNIQUE INDEX idx_insight_user_prefs_unique ON public.insight_user_preferences (workspace_id, user_id);

-- 2. insight_competitors
CREATE TABLE public.insight_competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  name TEXT NOT NULL,
  competitor_type TEXT NOT NULL DEFAULT 'brand',
  identifier TEXT NOT NULL DEFAULT '',
  country TEXT,
  language TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.insight_competitors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can read insight_competitors" ON public.insight_competitors FOR SELECT USING (is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Admins can insert insight_competitors" ON public.insight_competitors FOR INSERT WITH CHECK (is_workspace_owner_or_admin(auth.uid(), workspace_id));
CREATE POLICY "Admins can update insight_competitors" ON public.insight_competitors FOR UPDATE USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));
CREATE POLICY "Admins can delete insight_competitors" ON public.insight_competitors FOR DELETE USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));

-- 3. insight_follows
CREATE TABLE public.insight_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  user_id UUID NOT NULL,
  competitor_id UUID NOT NULL REFERENCES public.insight_competitors(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, competitor_id)
);
ALTER TABLE public.insight_follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can read insight_follows" ON public.insight_follows FOR SELECT USING (is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Users can insert own follows" ON public.insight_follows FOR INSERT WITH CHECK (auth.uid() = user_id AND is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Users can delete own follows" ON public.insight_follows FOR DELETE USING (auth.uid() = user_id);

-- 4. insight_domains
CREATE TABLE public.insight_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  competitor_id UUID NOT NULL REFERENCES public.insight_competitors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  country TEXT,
  language TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.insight_domains ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can read insight_domains" ON public.insight_domains FOR SELECT USING (is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Admins can insert insight_domains" ON public.insight_domains FOR INSERT WITH CHECK (is_workspace_owner_or_admin(auth.uid(), workspace_id));
CREATE POLICY "Admins can update insight_domains" ON public.insight_domains FOR UPDATE USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));
CREATE POLICY "Admins can delete insight_domains" ON public.insight_domains FOR DELETE USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));

-- 5. insight_pages
CREATE TABLE public.insight_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  competitor_id UUID NOT NULL REFERENCES public.insight_competitors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  page_id TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.insight_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can read insight_pages" ON public.insight_pages FOR SELECT USING (is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Admins can insert insight_pages" ON public.insight_pages FOR INSERT WITH CHECK (is_workspace_owner_or_admin(auth.uid(), workspace_id));
CREATE POLICY "Admins can update insight_pages" ON public.insight_pages FOR UPDATE USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));
CREATE POLICY "Admins can delete insight_pages" ON public.insight_pages FOR DELETE USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));

-- 6. insight_keywords
CREATE TABLE public.insight_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  competitor_id UUID REFERENCES public.insight_competitors(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.insight_keywords ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can read insight_keywords" ON public.insight_keywords FOR SELECT USING (is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Admins can insert insight_keywords" ON public.insight_keywords FOR INSERT WITH CHECK (is_workspace_owner_or_admin(auth.uid(), workspace_id));
CREATE POLICY "Admins can update insight_keywords" ON public.insight_keywords FOR UPDATE USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));
CREATE POLICY "Admins can delete insight_keywords" ON public.insight_keywords FOR DELETE USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));

-- 7. insight_boards
CREATE TABLE public.insight_boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.insight_boards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can read insight_boards" ON public.insight_boards FOR SELECT USING (is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Admins can insert insight_boards" ON public.insight_boards FOR INSERT WITH CHECK (is_workspace_owner_or_admin(auth.uid(), workspace_id));
CREATE POLICY "Admins can update insight_boards" ON public.insight_boards FOR UPDATE USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));
CREATE POLICY "Admins can delete insight_boards" ON public.insight_boards FOR DELETE USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));

-- 8. insight_board_items
CREATE TABLE public.insight_board_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES public.insight_boards(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL,
  source_ad_id TEXT NOT NULL,
  thumb_url TEXT,
  platform TEXT,
  domain TEXT,
  brand TEXT,
  status TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.insight_board_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can read insight_board_items" ON public.insight_board_items FOR SELECT USING (is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Admins can insert insight_board_items" ON public.insight_board_items FOR INSERT WITH CHECK (is_workspace_owner_or_admin(auth.uid(), workspace_id));
CREATE POLICY "Admins can update insight_board_items" ON public.insight_board_items FOR UPDATE USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));
CREATE POLICY "Admins can delete insight_board_items" ON public.insight_board_items FOR DELETE USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));

-- 9. insight_queue_items
CREATE TABLE public.insight_queue_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  source_ad_id TEXT NOT NULL,
  action_type TEXT NOT NULL DEFAULT 'analyze',
  status TEXT NOT NULL DEFAULT 'pending',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.insight_queue_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can read insight_queue_items" ON public.insight_queue_items FOR SELECT USING (is_workspace_member(auth.uid(), workspace_id));
CREATE POLICY "Admins can insert insight_queue_items" ON public.insight_queue_items FOR INSERT WITH CHECK (is_workspace_owner_or_admin(auth.uid(), workspace_id));
CREATE POLICY "Admins can update insight_queue_items" ON public.insight_queue_items FOR UPDATE USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));
CREATE POLICY "Admins can delete insight_queue_items" ON public.insight_queue_items FOR DELETE USING (is_workspace_owner_or_admin(auth.uid(), workspace_id));

-- Trigger for updated_at on insight_user_preferences
CREATE TRIGGER update_insight_user_preferences_updated_at
  BEFORE UPDATE ON public.insight_user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
