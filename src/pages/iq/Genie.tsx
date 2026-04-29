import { useState, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Rocket, Trash2, FolderPlus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/use-workspace";
import { useAuth } from "@/contexts/AuthContext";
import {
  useGenieGenerations,
  useBatchGenerate,
  useDeleteGenieGeneration,
  type GenieGeneration,
  type GenieSettings,
} from "@/hooks/use-genie-generations";
import { GenieGenerationArea } from "@/components/genie/GenieGenerationArea";
import { GenieImageGrid } from "@/components/genie/GenieImageGrid";
import { GenieVariationModal } from "@/components/genie/GenieVariationModal";
import { GenieEditDrawer } from "@/components/genie/GenieEditDrawer";
import { AdgroupLaunchModal } from "@/components/creative-library/AdgroupLaunchModal";
import type { AdgroupLaunchItem } from "@/hooks/use-adgroup-launch";

export default function Genie() {
  const [searchParams] = useSearchParams();
  const workspaceId = useWorkspace();
  const { user } = useAuth();

  // Data
  const { data: generations = [], isLoading: loadingGens, refetch } = useGenieGenerations("my");
  const { generate: batchGenerate, activeBatches, dismissBatch } = useBatchGenerate();
  const deleteMutation = useDeleteGenieGeneration();

  // UI state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [variationModal, setVariationModal] = useState<{ gen: GenieGeneration; mode: "edit" | "variation" } | null>(null);
  const [launchItems, setLaunchItems] = useState<AdgroupLaunchItem[] | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editDrawerGen, setEditDrawerGen] = useState<GenieGeneration | null>(null);

  // Context-aware entry: refs from URL
  const initialRefs = useMemo(() => {
    const refs = searchParams.get("refs");
    return refs ? refs.split(",") : [];
  }, [searchParams]);

  // Handlers
  const handleGenerate = useCallback(
    (prompt: string, settings: GenieSettings, refImages: string[], refMode: "merge" | "separate", parentId?: string) => {
      batchGenerate({
        prompt,
        settings,
        referenceImages: refImages,
        referenceMode: refMode,
        parentId,
      });
    },
    [batchGenerate]
  );

  const handleSelectChange = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      setDeletingId(id);
      await deleteMutation.mutateAsync(id);
      setDeletingId(null);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    },
    [deleteMutation]
  );

  const handleSaveToLibrary = useCallback(
    async (gen: GenieGeneration) => {
      if (!workspaceId || !user) return;
      try {
        const { error } = await supabase.from("creative_assets").insert({
          workspace_id: workspaceId,
          uploaded_by: user.id,
          file_name: `genie-${gen.id.slice(0, 8)}.png`,
          file_type: "image/png",
          storage_path: gen.storage_path,
          url: gen.output_url,
        });
        if (error) throw error;
        toast.success("Saved to Creative Library");
      } catch {
        toast.error("Failed to save to library");
      }
    },
    [workspaceId, user]
  );

  const handleLaunch = useCallback((gen: GenieGeneration) => {
    setLaunchItems([{ id: gen.id, type: "media", mediaUrls: [gen.output_url] }]);
  }, []);

  const handleBulkLaunch = useCallback(() => {
    const items: AdgroupLaunchItem[] = generations
      .filter((g) => selectedIds.has(g.id))
      .map((g) => ({ id: g.id, type: "media" as const, mediaUrls: [g.output_url] }));
    if (items.length) setLaunchItems(items);
  }, [generations, selectedIds]);

  const handleBulkDelete = useCallback(async () => {
    for (const id of selectedIds) {
      await deleteMutation.mutateAsync(id);
    }
    setSelectedIds(new Set());
  }, [selectedIds, deleteMutation]);

  const handleRetry = useCallback(
    (gen: GenieGeneration) => {
      const settings = (gen.settings || {}) as GenieSettings;
      batchGenerate({
        prompt: gen.prompt,
        settings,
        referenceImages: gen.reference_image_ids || [],
        referenceMode: (gen.reference_mode as "merge" | "separate") || "merge",
        parentId: gen.parent_id || undefined,
      });
      // Delete the failed record
      deleteMutation.mutateAsync(gen.id);
    },
    [batchGenerate, deleteMutation]
  );

  const handleClearFailed = useCallback(async () => {
    const failedGens = generations.filter((g) => g.status !== "completed" || !g.output_url);
    for (const g of failedGens) {
      await deleteMutation.mutateAsync(g.id);
    }
  }, [generations, deleteMutation]);

  return (
    <div className="flex flex-col h-full -m-4 2xl:-m-5">
      <ScrollArea className="flex-1">
        <div className="p-4 2xl:p-5 space-y-5">
          {/* Generation area */}
          <GenieGenerationArea
            onGenerate={handleGenerate}
            isGenerating={false}
            initialRefs={initialRefs}
          />

          {/* Bulk actions bar */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 p-2 rounded-lg border border-border bg-muted/50">
              <Badge variant="secondary" className="text-xs">{selectedIds.size} selected</Badge>
              <Button variant="outline" size="sm" className="text-xs h-7" onClick={handleBulkLaunch}>
                <Rocket className="h-3 w-3 mr-1" />Launch
              </Button>
              <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => {
                generations.filter((g) => selectedIds.has(g.id)).forEach(handleSaveToLibrary);
              }}>
                <FolderPlus className="h-3 w-3 mr-1" />Save to library
              </Button>
              <Button variant="outline" size="sm" className="text-xs h-7 text-destructive" onClick={handleBulkDelete}>
                <Trash2 className="h-3 w-3 mr-1" />Delete
              </Button>
              <Button variant="ghost" size="sm" className="text-xs h-7 ml-auto" onClick={() => setSelectedIds(new Set())}>
                Clear
              </Button>
            </div>
          )}

          {/* Image grid */}
          <GenieImageGrid
            generations={generations}
            isLoading={loadingGens}
            onRefresh={() => refetch()}
            selectedIds={selectedIds}
            onSelectChange={handleSelectChange}
            onEdit={(gen) => setVariationModal({ gen, mode: "edit" })}
            onVariation={(gen) => setVariationModal({ gen, mode: "variation" })}
            onLaunch={handleLaunch}
            onDelete={handleDelete}
            onSaveToLibrary={handleSaveToLibrary}
            onAIEdit={(gen) => setEditDrawerGen(gen)}
            deletingId={deletingId}
            activeBatches={activeBatches}
            onRetry={handleRetry}
            onClearFailed={handleClearFailed}
            onDismissBatch={dismissBatch}
          />
        </div>
      </ScrollArea>

      {/* Variation/Edit modal */}
      <GenieVariationModal
        open={!!variationModal}
        onOpenChange={(v) => !v && setVariationModal(null)}
        generation={variationModal?.gen || null}
        onGenerate={handleGenerate}
        isGenerating={false}
        mode={variationModal?.mode || "variation"}
      />

      {/* Launch modal */}
      <AdgroupLaunchModal
        open={!!launchItems}
        onOpenChange={(v) => !v && setLaunchItems(null)}
        items={launchItems || []}
      />

      {/* AI Edit drawer */}
      <GenieEditDrawer
        open={!!editDrawerGen}
        onOpenChange={(v) => !v && setEditDrawerGen(null)}
        generation={editDrawerGen}
      />
    </div>
  );
}
