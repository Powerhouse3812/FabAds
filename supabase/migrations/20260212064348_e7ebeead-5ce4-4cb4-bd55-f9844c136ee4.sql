CREATE POLICY "Owners and admins can delete workspaces"
  ON public.workspaces FOR DELETE
  USING (is_workspace_owner_or_admin(auth.uid(), id));