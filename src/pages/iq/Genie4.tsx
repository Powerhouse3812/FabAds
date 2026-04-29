import { useState, useCallback, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Check, ArrowDown, RefreshCw, Rocket, Trash2, FolderPlus } from "lucide-react";
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
import { Genie3LeftPanel } from "@/components/genie3/Genie3LeftPanel";
import { Genie4Form } from "@/components/genie3/Genie4Form";
import { GenieLibraryView } from "@/components/genie3/GenieLibraryView";
import { BrandDetailPage } from "@/components/genie3/BrandDetailPage";
import { GenieTemplatesView } from "@/components/genie3/GenieTemplatesView";
import { Genie2FloatingGenerate } from "@/components/genie2/Genie2FloatingGenerate";
import { GenieImageGrid } from "@/components/genie/GenieImageGrid";
import { GenieVariationModal } from "@/components/genie/GenieVariationModal";
import { GenieEditDrawer } from "@/components/genie/GenieEditDrawer";
import { AdgroupLaunchModal } from "@/components/creative-library/AdgroupLaunchModal";
import type { AdgroupLaunchItem } from "@/hooks/use-adgroup-launch";
import type { Brand } from "@/hooks/use-brands";
import { format } from "date-fns";

export default function Genie4() {
  const workspaceId = useWorkspace();
  const { user } = useAuth();

  const [activeView, setActiveView] = useState<"generate" | "library" | "brand-detail" | "templates">("library");
  const [activeBrand, setActiveBrand] = useState<Brand | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [successBanner, setSuccessBanner] = useState<number | null>(null);

  const { data: generations = [], isLoading: loadingGens, refetch } = useGenieGenerations("my");
  const { generate: batchGenerate, activeBatches, dismissBatch } = useBatchGenerate();
  const deleteMutation = useDeleteGenieGeneration();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [variationModal, setVariationModal] = useState<{ gen: GenieGeneration; mode: "edit" | "variation" } | null>(null);
  const [launchItems, setLaunchItems] = useState<AdgroupLaunchItem[] | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editDrawerGen, setEditDrawerGen] = useState<GenieGeneration | null>(null);

  const promptBarRef = useRef<HTMLDivElement>(null);
  const [showFab, setShowFab] = useState(false);
  const zone2Ref = useRef<HTMLDivElement>(null);

  const handleGenerated = useCallback((count: number) => {
    setHasGenerated(true);
    setSuccessBanner(count);
    setTimeout(() => setSuccessBanner(null), 8000);
  }, []);

  const handleSelectChange = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => { const next = new Set(prev); if (checked) next.add(id); else next.delete(id); return next; });
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    setDeletingId(id);
    await deleteMutation.mutateAsync(id);
    setDeletingId(null);
    setSelectedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
  }, [deleteMutation]);

  const handleSaveToLibrary = useCallback(async (gen: GenieGeneration) => {
    if (!workspaceId || !user) return;
    try {
      const { error } = await supabase.from("creative_assets").insert({
        workspace_id: workspaceId, uploaded_by: user.id,
        file_name: `genie-${gen.id.slice(0, 8)}.png`, file_type: "image/png",
        storage_path: gen.storage_path, url: gen.output_url,
      });
      if (error) throw error;
      toast.success("Saved to Creative Library");
    } catch { toast.error("Failed to save"); }
  }, [workspaceId, user]);

  const handleLaunch = useCallback((gen: GenieGeneration) => {
    setLaunchItems([{ id: gen.id, type: "media", mediaUrls: [gen.output_url] }]);
  }, []);

  const handleBulkLaunch = useCallback(() => {
    const items: AdgroupLaunchItem[] = generations.filter((g) => selectedIds.has(g.id)).map((g) => ({ id: g.id, type: "media" as const, mediaUrls: [g.output_url] }));
    if (items.length) setLaunchItems(items);
  }, [generations, selectedIds]);

  const handleBulkDelete = useCallback(async () => {
    for (const id of selectedIds) await deleteMutation.mutateAsync(id);
    setSelectedIds(new Set());
  }, [selectedIds, deleteMutation]);

  const handleRetry = useCallback((gen: GenieGeneration) => {
    batchGenerate({ prompt: gen.prompt, settings: (gen.settings || {}) as GenieSettings, referenceImages: gen.reference_image_ids || [], referenceMode: (gen.reference_mode as "merge" | "separate") || "merge", parentId: gen.parent_id || undefined });
    deleteMutation.mutateAsync(gen.id);
  }, [batchGenerate, deleteMutation]);

  const handleClearFailed = useCallback(async () => {
    for (const g of generations.filter((g) => g.status !== "completed" || !g.output_url)) await deleteMutation.mutateAsync(g.id);
  }, [generations, deleteMutation]);

  const handleGenieGenerate = useCallback(
    (prompt: string, settings: GenieSettings, refImages: string[], refMode: "merge" | "separate", parentId?: string) => {
      batchGenerate({ prompt, settings, referenceImages: refImages, referenceMode: refMode, parentId });
    },
    [batchGenerate]
  );

  const handleBrandDetail = useCallback((brand: Brand) => {
    setActiveBrand(brand);
    setActiveView("brand-detail");
  }, []);

  const handleGenerateForBrand = useCallback((brand: Brand) => {
    setActiveBrand(brand);
    setActiveView("generate");
  }, []);

  const lastGen = generations[0];
  const lastBatchTime = lastGen ? format(new Date(lastGen.created_at), "MMM d, h:mm a") : null;
  const inProgressCount = activeBatches.filter((b) => b.status === "generating").length;

  return (
    <div className="flex h-full -m-4 2xl:-m-5">
      <Genie3LeftPanel
        activeBrandId={activeBrand?.id || null}
        onBrandSelect={(b) => { setActiveBrand(b); setActiveView("generate"); }}
        activeView={activeView}
        onViewChange={setActiveView}
        onBrandDetail={handleBrandDetail}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {activeView === "library" ? (
          <GenieLibraryView />
        ) : activeView === "templates" ? (
          <GenieTemplatesView />
        ) : activeView === "brand-detail" && activeBrand ? (
          <BrandDetailPage
            brand={activeBrand}
            onBack={() => setActiveView("library")}
            onGenerateForBrand={handleGenerateForBrand}
          />
        ) : (
          <>
            <ScrollArea className="flex-1">
              <div className="p-4 2xl:p-5 space-y-6 max-w-4xl mx-auto">
                <div>
                  <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Genie 4.0
                  </h1>
                  <p className="text-sm text-muted-foreground mt-0.5">AI-powered creative workspace — single form</p>
                </div>

                <Genie4Form
                  activeBrand={activeBrand}
                  onGenerated={handleGenerated}
                  hasGenerated={hasGenerated}
                  promptBarRef={promptBarRef}
                />

                {successBanner != null && (
                  <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5 animate-in fade-in-0 slide-in-from-top-2 duration-300">
                    <Check className="h-4 w-4 text-primary" />
                    <span className="text-sm">✓ {successBanner} creatives generated</span>
                    <button className="text-xs text-primary hover:underline ml-1 flex items-center gap-1"
                      onClick={() => zone2Ref.current?.scrollIntoView({ behavior: "smooth" })}>
                      View below <ArrowDown className="h-3 w-3" />
                    </button>
                    <button className="ml-auto text-xs text-muted-foreground hover:text-foreground" onClick={() => setSuccessBanner(null)}>Dismiss</button>
                  </div>
                )}

                <div ref={zone2Ref} className="space-y-3 pt-5">
                  <div className="flex items-center gap-3 py-2">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                    <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                      Your creations
                      {generations.length > 0 && <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{generations.length}</Badge>}
                    </span>
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {lastBatchTime && <span className="text-xs text-muted-foreground">Last batch: {lastBatchTime}</span>}
                      {inProgressCount > 0 && <Badge variant="secondary" className="text-[10px] h-5">{inProgressCount} in progress</Badge>}
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => refetch()} disabled={loadingGens}>
                      <RefreshCw className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {selectedIds.size > 0 && (
                    <div className="flex items-center gap-2 p-2 rounded-lg border bg-muted/50">
                      <Badge variant="secondary" className="text-xs">{selectedIds.size} selected</Badge>
                      <Button variant="outline" size="sm" className="text-xs h-7" onClick={handleBulkLaunch}><Rocket className="h-3 w-3 mr-1" />Launch</Button>
                      <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => { generations.filter((g) => selectedIds.has(g.id)).forEach(handleSaveToLibrary); }}><FolderPlus className="h-3 w-3 mr-1" />Save</Button>
                      <Button variant="outline" size="sm" className="text-xs h-7 text-destructive" onClick={handleBulkDelete}><Trash2 className="h-3 w-3 mr-1" />Delete</Button>
                      <Button variant="ghost" size="sm" className="text-xs h-7 ml-auto" onClick={() => setSelectedIds(new Set())}>Clear</Button>
                    </div>
                  )}

                  <GenieImageGrid
                    generations={generations} isLoading={loadingGens} onRefresh={() => refetch()}
                    selectedIds={selectedIds} onSelectChange={handleSelectChange}
                    onEdit={(gen) => setVariationModal({ gen, mode: "edit" })}
                    onVariation={(gen) => setVariationModal({ gen, mode: "variation" })}
                    onLaunch={handleLaunch} onDelete={handleDelete} onSaveToLibrary={handleSaveToLibrary}
                    onAIEdit={(gen) => setEditDrawerGen(gen)} deletingId={deletingId}
                    activeBatches={activeBatches} onRetry={handleRetry} onClearFailed={handleClearFailed} onDismissBatch={dismissBatch}
                  />
                </div>
              </div>
            </ScrollArea>

            <Genie2FloatingGenerate creditEstimate={4} generating={false} onGenerate={() => toast.info("Use the prompt bar above")} visible={showFab} />
            <GenieVariationModal open={!!variationModal} onOpenChange={(v) => !v && setVariationModal(null)} generation={variationModal?.gen || null} onGenerate={handleGenieGenerate} isGenerating={false} mode={variationModal?.mode || "variation"} />
            <AdgroupLaunchModal open={!!launchItems} onOpenChange={(v) => !v && setLaunchItems(null)} items={launchItems || []} />
            <GenieEditDrawer open={!!editDrawerGen} onOpenChange={(v) => !v && setEditDrawerGen(null)} generation={editDrawerGen} />
          </>
        )}
      </div>
    </div>
  );
}
