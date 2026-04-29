
-- Make bucket private
UPDATE storage.buckets SET public = false WHERE id = 'launch-media';

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Anyone can read launch media" ON storage.objects;
DROP POLICY IF EXISTS "Workspace members can upload launch media" ON storage.objects;
DROP POLICY IF EXISTS "Workspace members can update launch media" ON storage.objects;
DROP POLICY IF EXISTS "Workspace members can delete launch media" ON storage.objects;

-- Workspace-scoped read
CREATE POLICY "Workspace members read launch media"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'launch-media' AND
    (storage.foldername(name))[1] IN (
      SELECT workspace_id::text FROM public.workspace_users WHERE user_id = auth.uid()
    )
  );

-- Workspace-scoped upload
CREATE POLICY "Workspace members upload launch media"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'launch-media' AND
    (storage.foldername(name))[1] IN (
      SELECT workspace_id::text FROM public.workspace_users WHERE user_id = auth.uid()
    )
  );

-- Workspace-scoped update
CREATE POLICY "Workspace members update launch media"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'launch-media' AND
    (storage.foldername(name))[1] IN (
      SELECT workspace_id::text FROM public.workspace_users WHERE user_id = auth.uid()
    )
  );

-- Workspace-scoped delete
CREATE POLICY "Workspace members delete launch media"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'launch-media' AND
    (storage.foldername(name))[1] IN (
      SELECT workspace_id::text FROM public.workspace_users WHERE user_id = auth.uid()
    )
  );
