import { useRef, useCallback, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type EntityType = "launch" | "launch_ad_accounts" | "launch_campaigns" | "launch_adsets" | "launch_ads";

const TABLE_MAP: Record<EntityType, string> = {
  launch: "launches",
  launch_ad_accounts: "launch_ad_accounts",
  launch_campaigns: "launch_campaigns",
  launch_adsets: "launch_adsets",
  launch_ads: "launch_ads",
};

const DEBOUNCE_MS = 800;

export function useCatalogueAutosave(launchId: string | undefined) {
  const qc = useQueryClient();
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const pendingRef = useRef<Map<string, { table: string; id: string; fields: Record<string, any> }>>(new Map());

  const mutation = useMutation({
    mutationFn: async ({ table, id, fields }: { table: string; id: string; fields: Record<string, any> }) => {
      const { error } = await (supabase as any).from(table).update(fields).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      if (launchId) {
        qc.invalidateQueries({ queryKey: ["launch-full", launchId] });
      }
    },
  });

  const flushOne = useCallback((key: string) => {
    const pending = pendingRef.current.get(key);
    if (pending) {
      mutation.mutate(pending);
      pendingRef.current.delete(key);
    }
    const timer = timersRef.current.get(key);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(key);
    }
  }, [mutation]);

  const flushAll = useCallback(() => {
    for (const key of Array.from(pendingRef.current.keys())) {
      flushOne(key);
    }
  }, [flushOne]);

  // Flush on unmount
  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      for (const key of Array.from(pendingRef.current.keys())) {
        const pending = pendingRef.current.get(key);
        if (pending) {
          // Fire and forget
          (supabase as any).from(pending.table).update(pending.fields).eq("id", pending.id);
        }
      }
      for (const timer of timersRef.current.values()) {
        clearTimeout(timer);
      }
    };
  }, []);

  const debouncedSave = useCallback((entityType: EntityType, entityId: string, fields: Record<string, any>) => {
    const key = `${entityType}:${entityId}`;
    const table = TABLE_MAP[entityType];

    // Merge with any pending fields
    const existing = pendingRef.current.get(key);
    const merged = existing ? { ...existing.fields, ...fields } : fields;
    pendingRef.current.set(key, { table, id: entityId, fields: merged });

    // Reset timer
    const oldTimer = timersRef.current.get(key);
    if (oldTimer) clearTimeout(oldTimer);
    timersRef.current.set(key, setTimeout(() => flushOne(key), DEBOUNCE_MS));
  }, [flushOne]);

  // Save UI state immediately (lightweight)
  const saveUiState = useCallback((uiState: Record<string, any>) => {
    if (!launchId) return;
    (supabase as any)
      .from("launches")
      .select("launch_config")
      .eq("id", launchId)
      .single()
      .then(({ data }: any) => {
        const config = data?.launch_config || {};
        const updated = {
          ...config,
          ui_state: { ...(config.ui_state || {}), catalogue_ads: uiState },
        };
        (supabase as any).from("launches").update({ launch_config: updated }).eq("id", launchId).then(() => {
          qc.invalidateQueries({ queryKey: ["launch-full", launchId] });
        });
      });
  }, [launchId, qc]);

  return { debouncedSave, flushAll, flushOne, saveUiState, isSaving: mutation.isPending };
}
