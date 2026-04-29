import { useState, useCallback, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles, Columns, LayoutGrid } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/use-workspace";
import { useAuth } from "@/contexts/AuthContext";
import {
  useGenieGenerations, useBatchGenerate, useDeleteGenieGeneration,
  type GenieGeneration, type GenieSettings,
} from "@/hooks/use-genie-generations";
import { BrandsListView } from "@/components/genie5/BrandsListView";
import { CategoriesListView } from "@/components/genie5/CategoriesListView";
import { Genie5Form } from "@/components/genie5/Genie5Form";
import { Genie5Wizard } from "@/components/genie5/Genie5Wizard";
import { GenieLibraryView } from "@/components/genie3/GenieLibraryView";
import { BrandDetailPage } from "@/components/genie3/BrandDetailPage";
import { CategoryDetailPage } from "@/components/genie5/CategoryDetailPage";
import { GenieTemplatesView } from "@/components/genie3/GenieTemplatesView";
import { GenieVariationModal } from "@/components/genie/GenieVariationModal";
import { GenieEditDrawer } from "@/components/genie/GenieEditDrawer";
import { AdgroupLaunchModal } from "@/components/creative-library/AdgroupLaunchModal";
import { Genie5BottomBar } from "@/components/genie5/Genie5BottomBar";
import { Genie5ResultsDrawer } from "@/components/genie5/Genie5ResultsDrawer";
import { Genie5FeedbackStats } from "@/components/genie5/Genie5FeedbackStats";
import { Genie5ThemeProvider, useGenieTheme } from "@/components/genie5/Genie5ThemeProvider";
import type { AdgroupLaunchItem } from "@/hooks/use-adgroup-launch";
import type { Brand } from "@/hooks/use-brands";
import type { GenieCategory } from "@/hooks/use-genie-categories";
import { CREDIT_PER_OUTPUT } from "@/lib/genie2-dummy-data";
import { cn } from "@/lib/utils";
import type { IntentType, PurposeType, EcomFocusType } from "@/lib/genie3-data";
import type { Batch } from "@/components/genie5/genie5-batch-types";
import type { AdgroupResult } from "@/components/genie5/Genie5ResultsAdgroupCard";

type LayoutMode = "cards" | "split";

function deriveView(pathname: string): string {
  if (pathname.startsWith("/iq/genie5/studio")) return "library";
  if (pathname.startsWith("/iq/genie5/templates")) return "templates";
  if (pathname.startsWith("/iq/genie5/brands/")) return "brand-detail";
  if (pathname.startsWith("/iq/genie5/brands")) return "brands";
  if (pathname.startsWith("/iq/genie5/categories/")) return "category-detail";
  if (pathname.startsWith("/iq/genie5/categories")) return "categories";
  return "generate";
}

function Genie5Inner({ layout, setLayout }: { layout: LayoutMode; setLayout: (v: LayoutMode) => void }) {
  const workspaceId = useWorkspace();
  const { user } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { wrapperClass, pillActiveClass, pillInactiveClass, barClass } = useGenieTheme();

  const activeView = deriveView(pathname);

  const [activeBrand, setActiveBrand] = useState<Brand | null>(null);
  const [activeCategory, setActiveCategory] = useState<GenieCategory | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);

  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("auto");
  const [numOutputs, setNumOutputs] = useState(4);
  const [generating, setGenerating] = useState(false);

  const [purpose, setPurpose] = useState<PurposeType>("ecommerce");
  const [ecomFocus, setEcomFocus] = useState<EcomFocusType>("product");
  const [intent, setIntent] = useState<IntentType>("creative-image");

  const [resultsDrawerOpen, setResultsDrawerOpen] = useState(false);
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [activeBatchId, setActiveBatchId] = useState<string | null>(null);
  const { data: generations = [], refetch } = useGenieGenerations("my");
  const { generate: batchGenerate, activeBatches, dismissBatch } = useBatchGenerate();
  const deleteMutation = useDeleteGenieGeneration();

  const [variationModal, setVariationModal] = useState<{ gen: GenieGeneration; mode: "edit" | "variation" } | null>(null);
  const [launchItems, setLaunchItems] = useState<AdgroupLaunchItem[] | null>(null);
  const [editDrawerGen, setEditDrawerGen] = useState<GenieGeneration | null>(null);

  const promptBarRef = useRef<HTMLDivElement>(null);
  const creditEstimate = (CREDIT_PER_OUTPUT[model] || 1) * numOutputs;

  const DUMMY_IMAGES = [
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80",
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80",
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80",
    "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&q=80",
  ];

  const DUMMY_ADCOPY: Omit<AdgroupResult, "id" | "imageUrl">[] = [
    { pageName: "BrandX Store", pageAvatarColor: "#6366F1", headline: "Transform Your Skin in 30 Days", primaryText: "Discover our clinically-proven formula that delivers visible results.", description: "Free shipping on orders $50+", cta: "Shop Now", tags: ["skincare"], strategy: "Before/After" },
    { pageName: "BrandX Store", pageAvatarColor: "#6366F1", headline: "⭐ 4.9/5 from 12,000+ Reviews", primaryText: "\"This product changed my routine!\" — Sarah M., Verified Buyer", description: "Join thousands of happy customers", cta: "See Reviews", tags: ["social-proof"], strategy: "Social Proof" },
    { pageName: "BrandX Store", pageAvatarColor: "#6366F1", headline: "🔥 Flash Sale — 40% Off Today", primaryText: "Our best-selling bundle is almost gone!", description: "Use code FLASH40 • Ends midnight", cta: "Claim Offer", tags: ["urgency"], strategy: "Urgency" },
    { pageName: "BrandX Store", pageAvatarColor: "#6366F1", headline: "The Science Behind Radiant Skin", primaryText: "Powered by 3 patented peptides and Vitamin C complex.", description: "Clinically tested • Dermatologist recommended", cta: "Learn More", tags: ["feature"], strategy: "Feature Highlight" },
  ];

  const handleGenerate = useCallback(() => {
    setGenerating(true);
    setResultsDrawerOpen(true);
    setHasGenerated(true);

    const batchId = crypto.randomUUID();
    const resultImages = DUMMY_IMAGES.slice(0, numOutputs).map((url, i) => ({
      id: `${batchId}-r${i}`,
      url,
      status: "completed" as const,
    }));
    const adcopyCards: AdgroupResult[] = resultImages.map((r, i) => ({
      id: r.id,
      imageUrl: r.url,
      ...DUMMY_ADCOPY[i % DUMMY_ADCOPY.length],
    }));

    const newBatch: Batch = {
      id: batchId,
      strategy: DUMMY_ADCOPY[0].strategy || "Generation",
      status: "generating",
      createdAt: Date.now(),
      results: resultImages,
      adcopyResults: adcopyCards,
      totalExpected: numOutputs,
    };

    setBatches(prev => [newBatch, ...prev]);
    setActiveBatchId(batchId);

    const delay = 3000 + Math.random() * 2000;
    setTimeout(() => {
      setBatches(prev => prev.map(b => b.id === batchId ? { ...b, status: "completed" as const } : b));
      setGenerating(false);
    }, delay);
  }, [numOutputs]);

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

  const handleGenieGenerate = useCallback(
    (prompt: string, settings: GenieSettings, refImages: string[], refMode: "merge" | "separate", parentId?: string) => {
      batchGenerate({ prompt, settings, referenceImages: refImages, referenceMode: refMode, parentId });
    },
    [batchGenerate]
  );

  const handleBrandDetail = useCallback((brand: Brand) => {
    setActiveBrand(brand);
    setActiveCategory(null);
    navigate(`/iq/genie5/brands/${brand.id}`);
  }, [navigate]);

  const handleCategoryDetail = useCallback((cat: GenieCategory) => {
    setActiveCategory(cat);
    setActiveBrand(null);
    navigate(`/iq/genie5/categories/${cat.id}`);
  }, [navigate]);

  const handleGenerateForBrand = useCallback((brand: Brand) => {
    setActiveBrand(brand);
    navigate("/iq/genie5");
  }, [navigate]);

  const handleGenerateForCategory = useCallback((cat: GenieCategory) => {
    setActiveCategory(cat);
    navigate("/iq/genie5");
  }, [navigate]);

  const layoutOptions: { value: LayoutMode; label: string; icon: typeof LayoutGrid }[] = [
    { value: "cards", label: "Cards", icon: LayoutGrid },
    { value: "split", label: "Split", icon: Columns },
  ];

  const renderToggleGroup = () => (
    <div className="flex items-center gap-1.5">
      <div className={cn("flex items-center gap-0.5 rounded-xl border p-0.5", "bg-muted/20")}>
        {layoutOptions.map((opt) => {
          const Icon = opt.icon;
          return (
            <button
              key={opt.value}
              onClick={() => setLayout(opt.value)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all duration-200",
                layout === opt.value ? cn(pillActiveClass) : cn(pillInactiveClass)
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeView) {
      case "library": return <GenieLibraryView />;
      case "templates": return <GenieTemplatesView />;
      case "brands": return <BrandsListView onBrandDetail={handleBrandDetail} />;
      case "categories": return <CategoriesListView onCategoryDetail={handleCategoryDetail} />;
      case "brand-detail":
        return activeBrand
          ? <BrandDetailPage brand={activeBrand} onBack={() => navigate("/iq/genie5/brands")} onGenerateForBrand={handleGenerateForBrand} />
          : <BrandsListView onBrandDetail={handleBrandDetail} />;
      case "category-detail":
        return activeCategory
          ? <CategoryDetailPage category={activeCategory} onBack={() => navigate("/iq/genie5/categories")} onGenerateForCategory={handleGenerateForCategory} />
          : <CategoriesListView onCategoryDetail={handleCategoryDetail} />;
      default:
        return (
          <div className="flex flex-col h-full">
            {layout === "split" ? (
              <>
                <div className="flex items-center justify-between px-4 pt-3 pb-2 flex-shrink-0">
                  <h1 className="text-base font-semibold text-foreground flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Genie 5.0
                  </h1>
                  {renderToggleGroup()}
                </div>
                <div className="flex-1 min-h-0">
                  <Genie5Form
                    ref={null}
                    activeBrand={activeBrand}
                    activeCategory={activeCategory}
                    hasGenerated={hasGenerated}
                    promptBarRef={promptBarRef}
                    prompt={prompt}
                    onPromptChange={setPrompt}
                    layout={layout}
                    onPurposeChange={setPurpose}
                    onEcomFocusChange={setEcomFocus}
                    onIntentChange={setIntent}
                    batches={batches}
                    activeBatchId={activeBatchId}
                    onSelectBatch={setActiveBatchId}
                    panelCollapsed={panelCollapsed}
                    onTogglePanelCollapse={() => setPanelCollapsed(p => !p)}
                    onSplitSaveToLibrary={(id) => toast.success("Saved to library")}
                    onSplitLaunch={(id) => toast.info("Launch — coming soon")}
                    onSplitRegenerate={(id) => toast.info("Regenerating...")}
                    onSplitDownload={(id) => toast.success("Downloaded")}
                  />
                </div>
                <Genie5BottomBar
                  model={model} onModelChange={setModel}
                  numOutputs={numOutputs} onNumOutputsChange={setNumOutputs}
                  generating={generating} onGenerate={handleGenerate}
                  creditEstimate={creditEstimate}
                  barClass={barClass}
                  purpose={purpose} ecomFocus={ecomFocus} intent={intent}
                  prompt={prompt} onPromptChange={setPrompt}
                  category="General" hasGenerated={hasGenerated}
                  onChipClick={(snippet) => setPrompt(p => p ? `${p}. ${snippet}` : snippet)}
                />
              </>
            ) : (
              <>
                <ScrollArea className="flex-1">
                  <div className="p-4 2xl:p-5 max-w-4xl mx-auto space-y-4">
                    <div className="flex items-center justify-between">
                      <h1 className="text-base font-semibold text-foreground flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        Genie 5.0
                      </h1>
                      {renderToggleGroup()}
                    </div>

                    <Genie5Form
                      ref={null}
                      activeBrand={activeBrand}
                      activeCategory={activeCategory}
                      hasGenerated={hasGenerated}
                      promptBarRef={promptBarRef}
                      prompt={prompt}
                      onPromptChange={setPrompt}
                      layout={layout}
                      onPurposeChange={setPurpose}
                      onEcomFocusChange={setEcomFocus}
                      onIntentChange={setIntent}
                    />

                    <Genie5FeedbackStats />
                  </div>
                </ScrollArea>

                <Genie5BottomBar
                  model={model} onModelChange={setModel}
                  numOutputs={numOutputs} onNumOutputsChange={setNumOutputs}
                  generating={generating} onGenerate={handleGenerate}
                  creditEstimate={creditEstimate}
                  barClass={barClass}
                  purpose={purpose} ecomFocus={ecomFocus} intent={intent}
                  prompt={prompt} onPromptChange={setPrompt}
                  category="General" hasGenerated={hasGenerated}
                  onChipClick={(snippet) => setPrompt(p => p ? `${p}. ${snippet}` : snippet)}
                />

                <Genie5ResultsDrawer
                  open={resultsDrawerOpen} onOpenChange={setResultsDrawerOpen}
                  batches={batches} activeBatchId={activeBatchId} onSelectBatch={setActiveBatchId}
                  intent={intent}
                  onSaveToLibrary={(id) => toast.success("Saved to library")}
                  onLaunch={(id) => toast.info("Launch — coming soon")}
                  onRegenerate={(id) => toast.info("Regenerating...")}
                  onDownload={(id) => toast.success("Downloaded")}
                />
              </>
            )}

            <GenieVariationModal open={!!variationModal} onOpenChange={(v) => !v && setVariationModal(null)} generation={variationModal?.gen || null} onGenerate={handleGenieGenerate} isGenerating={false} mode={variationModal?.mode || "variation"} />
            <AdgroupLaunchModal open={!!launchItems} onOpenChange={(v) => !v && setLaunchItems(null)} items={launchItems || []} />
            <GenieEditDrawer open={!!editDrawerGen} onOpenChange={(v) => !v && setEditDrawerGen(null)} generation={editDrawerGen} />
          </div>
        );
    }
  };

  return (
    <div className={cn("flex h-full -m-4 2xl:-m-5 flex-col transition-colors duration-500", wrapperClass)}>
      <div className="flex-1 flex flex-col min-w-0">
        {renderContent()}
      </div>
    </div>
  );
}

export default function Genie5() {
  const [layout, setLayout] = useState<LayoutMode>("cards");
  return (
    <Genie5ThemeProvider layout={layout}>
      <Genie5Inner layout={layout} setLayout={setLayout} />
    </Genie5ThemeProvider>
  );
}
