import { useState, useCallback, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Rocket, Trash2, FolderPlus, Check, ArrowDown, RefreshCw } from "lucide-react";
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
import { Genie2IntentModal, type IntentType, type PurposeType } from "@/components/genie2/Genie2IntentModal";
import { Genie2Form } from "@/components/genie2/Genie2Form";
import { Genie2FloatingGenerate } from "@/components/genie2/Genie2FloatingGenerate";
import { GenieImageGrid } from "@/components/genie/GenieImageGrid";
import { GenieVariationModal } from "@/components/genie/GenieVariationModal";
import { GenieEditDrawer } from "@/components/genie/GenieEditDrawer";
import { AdgroupLaunchModal } from "@/components/creative-library/AdgroupLaunchModal";
import { CREDIT_PER_OUTPUT, INSTANT_START_EXAMPLES, detectBrandFromUrl, EXISTING_PRODUCTS } from "@/lib/genie2-dummy-data";
import type { AdgroupLaunchItem } from "@/hooks/use-adgroup-launch";
import { format } from "date-fns";

/* ---- Animated rotating text for instant-start ---- */
function InstantStartLine({ onExampleClick }: { onExampleClick: (prompt: string, productKeyword: string) => void }) {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % INSTANT_START_EXAMPLES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 text-sm flex-wrap">
      <span className="text-muted-foreground flex items-center gap-1.5">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        Try:
      </span>
      {INSTANT_START_EXAMPLES.map((ex, i) => (
        <button
          key={ex.label}
          onClick={() => onExampleClick(ex.prompt, ex.productKeyword)}
          className={`text-sm transition-all duration-300 rounded-md px-2 py-0.5 ${
            i === activeIdx
              ? "text-primary font-medium bg-primary/10"
              : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
          }`}
        >
          "{ex.label}"
        </button>
      ))}
    </div>
  );
}

export default function Genie2() {
  const workspaceId = useWorkspace();
  const { user } = useAuth();

  // Intent state — defaults
  const [modalOpen, setModalOpen] = useState(false);
  const [intent, setIntent] = useState<IntentType>("creative-image");
  const [purpose, setPurpose] = useState<PurposeType>("ecommerce");

  // Generation state
  const [hasGenerated, setHasGenerated] = useState(false);
  const [successBanner, setSuccessBanner] = useState<number | null>(null);
  const [model, setModel] = useState("auto");
  const [numOutputs, setNumOutputs] = useState(4);

  // Zone 2 — real data
  const { data: generations = [], isLoading: loadingGens, refetch } = useGenieGenerations("my");
  const { generate: batchGenerate, activeBatches, dismissBatch } = useBatchGenerate();
  const deleteMutation = useDeleteGenieGeneration();

  // UI state for Zone 2
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [variationModal, setVariationModal] = useState<{ gen: GenieGeneration; mode: "edit" | "variation" } | null>(null);
  const [launchItems, setLaunchItems] = useState<AdgroupLaunchItem[] | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editDrawerGen, setEditDrawerGen] = useState<GenieGeneration | null>(null);

  // FAB visibility
  const promptBarRef = useRef<HTMLDivElement>(null);
  const [showFab, setShowFab] = useState(false);
  const zone2Ref = useRef<HTMLDivElement>(null);

  // Form ref for instant-start
  const formRef = useRef<{ setPrompt: (v: string) => void; setProductUrl: (v: string) => void; triggerDetect: (url: string) => void } | null>(null);

  useEffect(() => {
    const el = promptBarRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowFab(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Intent modal confirm
  const handleConfirm = useCallback((i: IntentType, p: PurposeType) => {
    setIntent(i);
    setPurpose(p);
    setModalOpen(false);
  }, []);

  // After generation callback
  const handleGenerated = useCallback((count: number) => {
    setHasGenerated(true);
    setSuccessBanner(count);
    setTimeout(() => setSuccessBanner(null), 8000);
  }, []);

  // Instant-start click
  const handleExampleClick = useCallback((prompt: string, productKeyword: string) => {
    // Find a matching existing product
    const product = EXISTING_PRODUCTS.find((p) => p.url.toLowerCase().includes(productKeyword));
    if (formRef.current) {
      formRef.current.setPrompt(prompt);
      if (product) {
        formRef.current.setProductUrl(product.url);
        formRef.current.triggerDetect(product.url);
      }
    }
  }, []);

  const creditEstimate = (CREDIT_PER_OUTPUT[model] || 1) * numOutputs;

  // ----- Zone 2 handlers (from old Genie) -----
  const handleSelectChange = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id); else next.delete(id);
      return next;
    });
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
  }, [workspaceId, user]);

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

  const handleRetry = useCallback((gen: GenieGeneration) => {
    const settings = (gen.settings || {}) as GenieSettings;
    batchGenerate({
      prompt: gen.prompt,
      settings,
      referenceImages: gen.reference_image_ids || [],
      referenceMode: (gen.reference_mode as "merge" | "separate") || "merge",
      parentId: gen.parent_id || undefined,
    });
    deleteMutation.mutateAsync(gen.id);
  }, [batchGenerate, deleteMutation]);

  const handleClearFailed = useCallback(async () => {
    const failedGens = generations.filter((g) => g.status !== "completed" || !g.output_url);
    for (const g of failedGens) {
      await deleteMutation.mutateAsync(g.id);
    }
  }, [generations, deleteMutation]);

  const handleGenieGenerate = useCallback(
    (prompt: string, settings: GenieSettings, refImages: string[], refMode: "merge" | "separate", parentId?: string) => {
      batchGenerate({ prompt, settings, referenceImages: refImages, referenceMode: refMode, parentId });
    },
    [batchGenerate]
  );

  // Last batch info for Zone 2 header
  const lastGen = generations[0];
  const lastBatchTime = lastGen ? format(new Date(lastGen.created_at), "MMM d, h:mm a") : null;
  const inProgressCount = activeBatches.filter((b) => b.status === "generating").length;

  return (
    <div className="flex flex-col h-full -m-4 2xl:-m-5">
      <ScrollArea className="flex-1">
        <div className="p-4 2xl:p-5 space-y-6 max-w-5xl mx-auto">

          {/* ===== ZONE 1 — Generation Workspace ===== */}
          <div className="space-y-4">
            {/* Header */}
            <div>
              <h1 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Genie 2.0
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">AI-powered creative & ad copy generation</p>
            </div>

            {/* Interactive title line — instant start */}
            <InstantStartLine onExampleClick={handleExampleClick} />

            {/* Form */}
            <Genie2Form
              ref={formRef}
              intent={intent}
              purpose={purpose}
              onChangeIntent={() => setModalOpen(true)}
              onGenerated={handleGenerated}
              hasGenerated={hasGenerated}
              promptBarRef={promptBarRef}
            />

            {/* Success Banner */}
            {successBanner != null && (
              <div className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2.5 animate-in fade-in-0 slide-in-from-top-2 duration-300">
                <Check className="h-4 w-4 text-primary" />
                <span className="text-sm text-foreground">
                  ✓ {successBanner} creatives generated
                </span>
                <button
                  className="text-xs text-primary hover:underline ml-1 flex items-center gap-1"
                  onClick={() => zone2Ref.current?.scrollIntoView({ behavior: "smooth" })}
                >
                  View below <ArrowDown className="h-3 w-3" />
                </button>
                <button
                  className="ml-auto text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setSuccessBanner(null)}
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>

          {/* ===== ZONE 2 — Continue Working ===== */}
          <div ref={zone2Ref} className="space-y-3 pt-5">
            {/* Softer zone divider */}
            <div className="flex items-center gap-3 py-2">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                Your creations
                {generations.length > 0 && (
                  <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{generations.length}</Badge>
                )}
              </span>
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
            </div>

            {/* Zone 2 sub-header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {lastBatchTime && (
                  <span className="text-xs text-muted-foreground">Last batch: {lastBatchTime}</span>
                )}
                {inProgressCount > 0 && (
                  <Badge variant="secondary" className="text-[10px] h-5">
                    {inProgressCount} in progress
                  </Badge>
                )}
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => refetch()} disabled={loadingGens}>
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            </div>

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

            {/* Real image grid */}
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
        </div>
      </ScrollArea>

      {/* Intent modal */}
      <Genie2IntentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={handleConfirm}
      />

      {/* Floating generate FAB */}
      <Genie2FloatingGenerate
        creditEstimate={creditEstimate}
        generating={false}
        onGenerate={() => toast.info("Use the prompt bar above to generate")}
        visible={showFab}
      />

      {/* Variation/Edit modal */}
      <GenieVariationModal
        open={!!variationModal}
        onOpenChange={(v) => !v && setVariationModal(null)}
        generation={variationModal?.gen || null}
        onGenerate={handleGenieGenerate}
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