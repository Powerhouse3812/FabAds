
ALTER TABLE public.insight_board_items
  ADD COLUMN note TEXT;

ALTER TABLE public.insight_board_items
  ADD CONSTRAINT insight_board_items_board_source_unique
  UNIQUE (board_id, source_ad_id);
