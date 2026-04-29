
CREATE TABLE public.genie_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  user_id uuid NOT NULL,
  feedback_type text NOT NULL CHECK (feedback_type IN ('up', 'down')),
  comment text,
  target_type text NOT NULL,
  target_id text NOT NULL,
  strategy_angle text,
  strategy_title text,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_genie_feedback_user_target ON public.genie_feedback (user_id, target_id, target_type);
CREATE INDEX idx_genie_feedback_workspace ON public.genie_feedback (workspace_id);
CREATE INDEX idx_genie_feedback_strategy ON public.genie_feedback (workspace_id, strategy_angle);

ALTER TABLE public.genie_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can read genie_feedback"
  ON public.genie_feedback FOR SELECT TO authenticated
  USING (is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Users can insert own genie_feedback"
  ON public.genie_feedback FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND is_workspace_member(auth.uid(), workspace_id));

CREATE POLICY "Users can update own genie_feedback"
  ON public.genie_feedback FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own genie_feedback"
  ON public.genie_feedback FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
