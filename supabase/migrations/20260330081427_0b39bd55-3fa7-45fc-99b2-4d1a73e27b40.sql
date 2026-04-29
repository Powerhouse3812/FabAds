
-- 1. copilot_conversations table
CREATE TABLE public.copilot_conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL,
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'New conversation',
  module_context text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.copilot_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read copilot_conversations"
  ON public.copilot_conversations FOR SELECT
  TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Users can insert own copilot_conversations"
  ON public.copilot_conversations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Users can update own copilot_conversations"
  ON public.copilot_conversations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own copilot_conversations"
  ON public.copilot_conversations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 2. copilot_messages table
CREATE TABLE public.copilot_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid NOT NULL REFERENCES public.copilot_conversations(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'user',
  content text NOT NULL DEFAULT '',
  images text[] NOT NULL DEFAULT '{}'::text[],
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.copilot_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read copilot_messages"
  ON public.copilot_messages FOR SELECT
  TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Members can insert copilot_messages"
  ON public.copilot_messages FOR INSERT
  TO authenticated
  WITH CHECK (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Members can update copilot_messages"
  ON public.copilot_messages FOR UPDATE
  TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id));

-- Enable realtime for streaming indicator
ALTER PUBLICATION supabase_realtime ADD TABLE public.copilot_messages;

-- Updated_at trigger for conversations
CREATE TRIGGER update_copilot_conversations_updated_at
  BEFORE UPDATE ON public.copilot_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
