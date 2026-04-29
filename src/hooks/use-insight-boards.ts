import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/use-workspace";

export function useInsightBoards() {
  const wsId = useWorkspace();
  const qc = useQueryClient();

  const boards = useQuery({
    queryKey: ["insight-boards", wsId],
    enabled: !!wsId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("insight_boards")
        .select("*, insight_board_items(count)")
        .eq("workspace_id", wsId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      // Fetch up to 4 most recent thumbnails per board for preview strip
      if (data && data.length > 0) {
        const boardIds = data.map((b) => b.id);
        const { data: thumbItems } = await supabase
          .from("insight_board_items")
          .select("board_id, thumb_url, created_at")
          .in("board_id", boardIds)
          .order("created_at", { ascending: false });
        const thumbMap = new Map<string, string[]>();
        thumbItems?.forEach((item) => {
          if (!item.thumb_url) return;
          const arr = thumbMap.get(item.board_id) ?? [];
          if (arr.length < 4) {
            arr.push(item.thumb_url);
            thumbMap.set(item.board_id, arr);
          }
        });
        return data.map((b) => ({ ...b, _thumbStrip: thumbMap.get(b.id) ?? [] }));
      }
      return data;
    },
  });

  const createBoard = useMutation({
    mutationFn: async (values: { name: string; description?: string; tags?: string[] }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !wsId) throw new Error("Not authenticated");
      const { error } = await supabase.from("insight_boards").insert({
        workspace_id: wsId,
        name: values.name,
        description: values.description ?? null,
        tags: values.tags ?? [],
        created_by: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["insight-boards", wsId] }),
  });

  const updateBoard = useMutation({
    mutationFn: async (values: { id: string; name?: string; description?: string; tags?: string[] }) => {
      const updates: Record<string, unknown> = {};
      if (values.name !== undefined) updates.name = values.name;
      if (values.description !== undefined) updates.description = values.description;
      if (values.tags !== undefined) updates.tags = values.tags;
      const { error } = await supabase.from("insight_boards").update(updates).eq("id", values.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["insight-boards", wsId] }),
  });

  const deleteBoard = useMutation({
    mutationFn: async (boardId: string) => {
      const { error } = await supabase.from("insight_boards").delete().eq("id", boardId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["insight-boards", wsId] }),
  });

  return { boards: boards.data ?? [], isLoading: boards.isLoading, createBoard, updateBoard, deleteBoard };
}

export function useSavedAdIds() {
  const wsId = useWorkspace();
  return useQuery({
    queryKey: ["insight-saved-ad-ids", wsId],
    enabled: !!wsId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("insight_board_items")
        .select("source_ad_id")
        .eq("workspace_id", wsId!);
      if (error) throw error;
      const map = new Map<string, number>();
      data?.forEach((d) => {
        map.set(d.source_ad_id, (map.get(d.source_ad_id) ?? 0) + 1);
      });
      return map;
    },
  });
}

export function useAdBoardMemberships(sourceAdId: string | undefined) {
  const wsId = useWorkspace();
  const qc = useQueryClient();
  
  const query = useQuery({
    queryKey: ["ad-board-memberships", wsId, sourceAdId],
    enabled: !!wsId && !!sourceAdId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("insight_board_items")
        .select("id, board_id, insight_boards(name)")
        .eq("workspace_id", wsId!)
        .eq("source_ad_id", sourceAdId!);
      if (error) throw error;
      return data;
    },
  });

  const removeFromBoard = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase.from("insight_board_items").delete().eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ad-board-memberships", wsId, sourceAdId] });
      qc.invalidateQueries({ queryKey: ["insight-saved-ad-ids", wsId] });
      qc.invalidateQueries({ queryKey: ["insight-boards", wsId] });
    },
  });

  return { memberships: query.data ?? [], isLoading: query.isLoading, removeFromBoard };
}

export function useInsightBoardItems(boardId: string | undefined) {
  const wsId = useWorkspace();
  const qc = useQueryClient();

  const items = useQuery({
    queryKey: ["insight-board-items", boardId],
    enabled: !!boardId && !!wsId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("insight_board_items")
        .select("*")
        .eq("board_id", boardId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["insight-board-items", boardId] });
    qc.invalidateQueries({ queryKey: ["insight-boards", wsId] });
    qc.invalidateQueries({ queryKey: ["insight-saved-ad-ids", wsId] });
  };

  const addItem = useMutation({
    mutationFn: async (item: { board_id: string; source_ad_id: string; thumb_url?: string; platform?: string; domain?: string; brand?: string; status?: string; metadata?: Record<string, unknown> }) => {
      if (!wsId) throw new Error("No workspace");
      const { data, error } = await supabase.from("insight_board_items").insert({
        board_id: item.board_id,
        source_ad_id: item.source_ad_id,
        workspace_id: wsId,
        thumb_url: item.thumb_url ?? null,
        platform: item.platform ?? null,
        domain: item.domain ?? null,
        brand: item.brand ?? null,
        status: item.status ?? null,
        metadata: (item.metadata ?? {}) as any,
      }).select("id").single();
      if (error) throw error;
      return data;
    },
    onSuccess: invalidate,
  });

  const removeItem = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase.from("insight_board_items").delete().eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const updateItemNote = useMutation({
    mutationFn: async ({ itemId, note }: { itemId: string; note: string }) => {
      const { error } = await supabase.from("insight_board_items").update({ note }).eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const bulkRemove = useMutation({
    mutationFn: async (itemIds: string[]) => {
      const { error } = await supabase.from("insight_board_items").delete().in("id", itemIds);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const moveItems = useMutation({
    mutationFn: async ({ itemIds, targetBoardId }: { itemIds: string[]; targetBoardId: string }) => {
      const { error } = await supabase.from("insight_board_items").update({ board_id: targetBoardId }).in("id", itemIds);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const bulkAddToQueue = useMutation({
    mutationFn: async (sourceAdIds: string[]) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !wsId) throw new Error("Not authenticated");
      const rows = sourceAdIds.map((id) => ({
        workspace_id: wsId,
        source_ad_id: id,
        action_type: "analyze",
        created_by: user.id,
      }));
      const { error } = await supabase.from("insight_queue_items").insert(rows);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["insight-queue", wsId] }),
  });

  return { items: items.data ?? [], isLoading: items.isLoading, addItem, removeItem, updateItemNote, bulkRemove, moveItems, bulkAddToQueue };
}
