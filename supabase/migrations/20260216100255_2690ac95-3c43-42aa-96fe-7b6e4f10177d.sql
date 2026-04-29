ALTER TABLE public.cl_folders ADD COLUMN sort_order integer NOT NULL DEFAULT 0;

WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY workspace_id ORDER BY updated_at DESC) AS rn
  FROM public.cl_folders
)
UPDATE public.cl_folders SET sort_order = ordered.rn FROM ordered WHERE cl_folders.id = ordered.id;