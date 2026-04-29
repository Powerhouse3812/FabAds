import { useState, useCallback, useEffect, forwardRef, useImperativeHandle } from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { ImageIcon, FileText, ShoppingBag, Megaphone, Video, Check, Package, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";
import type { IntentType, PurposeType, EcomFocusType } from "@/lib/genie3-data";
import type { Batch } from "./genie5-batch-types";
import { Genie5SplitOutputPanel } from "./Genie5SplitOutputPanel";
import { Genie2EcomInputs } from "@/components/genie2/Genie2EcomInputs";
import { Genie2AffiliateInputs } from "@/components/genie2/Genie2AffiliateInputs";
import { Genie2PromptBar } from "@/components/genie2/Genie2PromptBar";
import { Genie2SuggestionChips } from "@/components/genie2/Genie2SuggestionChips";
import { Genie5StrategyCards } from "./Genie5StrategyCards";
import { Genie5ConceptCards } from "./Genie5ConceptCards";
import { Genie5ProductAssetInputs } from "./Genie5ProductAssetInputs";
import { Genie5ApproachPicker } from "./Genie5ApproachPicker";
import { Genie5WinnersSection } from "./Genie5WinnersSection";
import { Genie5EnrichmentSection } from "./Genie5EnrichmentSection";
import { useGenieTheme } from "./Genie5ThemeProvider";
import type { BrandProfile } from "@/lib/genie2-dummy-data";
import type { Brand } from "@/hooks/use-brands";
import type { GenieCategory } from "@/hooks/use-genie-categories";

export interface Genie5FormHandle {
  setPrompt: (v: string) => void;
}

interface Props {
  activeBrand: Brand | null;
  activeCategory: GenieCategory | null;
  hasGenerated: boolean;
  promptBarRef?: React.Ref<HTMLDivElement>;
  prompt: string;
  onPromptChange: (v: string) => void;
  layout: "cards" | "split";
  onPurposeChange?: (v: PurposeType) => void;
  onEcomFocusChange?: (v: EcomFocusType) => void;
  onIntentChange?: (v: IntentType) => void;
  // Split mode batch props
  batches?: Batch[];
  activeBatchId?: string | null;
  onSelectBatch?: (id: string) => void;
  panelCollapsed?: boolean;
  onTogglePanelCollapse?: () => void;
  onSplitSaveToLibrary?: (id: string) => void;
  onSplitLaunch?: (id: string) => void;
  onSplitRegenerate?: (id: string) => void;
  onSplitDownload?: (id: string) => void;
}

const intentLabel: Record<IntentType, { label: string; icon: typeof ImageIcon }> = {
  "creative-image": { label: "Image", icon: ImageIcon },
  "creative-video": { label: "Video", icon: Video },
  "adcopy": { label: "Ad Copy", icon: FileText },
};

export const Genie5Form = forwardRef<Genie5FormHandle, Props>(function Genie5Form(
  { activeBrand, activeCategory, hasGenerated, promptBarRef, prompt, onPromptChange, layout,
    onPurposeChange, onEcomFocusChange, onIntentChange,
    batches, activeBatchId, onSelectBatch, panelCollapsed, onTogglePanelCollapse,
    onSplitSaveToLibrary, onSplitLaunch, onSplitRegenerate, onSplitDownload }, ref
) {
  const { cardClass, pillActiveClass, pillInactiveClass } = useGenieTheme();

  const [intent, setIntent] = useState<IntentType>("creative-image");
  const [purpose, setPurpose] = useState<PurposeType>("ecommerce");
  const [ecomFocus, setEcomFocus] = useState<EcomFocusType>("product");

  const [productUrl, setProductUrl] = useState("");
  const [detectedBrand, setDetectedBrand] = useState<BrandProfile | null>(null);
  const [category, setCategory] = useState("");
  const [affiliateCategoryId, setAffiliateCategoryId] = useState<string | null>(null);
  const [angle, setAngle] = useState("");
  const [selectedWinnerIds, setSelectedWinnerIds] = useState<Set<string>>(new Set());
  const [enrichmentSelection, setEnrichmentSelection] = useState<Set<string>>(new Set());

  const [assetType, setAssetType] = useState("studio_shot");
  const [selectedStrategies, setSelectedStrategies] = useState<Set<string>>(new Set());
  const [selectedConcepts, setSelectedConcepts] = useState<Set<string>>(new Set());
  const [approach, setApproach] = useState<"templates" | "fresh">("fresh");
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<Set<string>>(new Set());

  useImperativeHandle(ref, () => ({ setPrompt: onPromptChange }), [onPromptChange]);

  const handlePurposeChange = (v: PurposeType) => {
    setPurpose(v);
    onPurposeChange?.(v);
  };
  const handleEcomFocusChange = (v: EcomFocusType) => {
    setEcomFocus(v);
    onEcomFocusChange?.(v);
  };
  const handleIntentChange = (v: IntentType) => {
    setIntent(v);
    onIntentChange?.(v);
  };

  // Auto-set intent based on focus mode
  useEffect(() => {
    if (purpose === "ecommerce") {
      if (ecomFocus === "product" || ecomFocus === "brand") {
        setIntent("adcopy");
        onIntentChange?.("adcopy");
      } else if (ecomFocus === "asset") {
        setIntent("creative-image");
        onIntentChange?.("creative-image");
      }
    }
  }, [ecomFocus, purpose]);

  const productCategory = purpose === "ecommerce"
    ? detectedBrand?.category || activeBrand?.category || "General"
    : category || activeCategory?.niche || "General";
  const hasProduct = purpose === "ecommerce" ? !!detectedBrand : !!(category || activeCategory);
  const handleChipClick = useCallback((snippet: string) => {
    onPromptChange(prompt ? `${prompt}. ${snippet}` : snippet);
  }, [prompt, onPromptChange]);
  const productName = purpose === "ecommerce" && detectedBrand ? detectedBrand.name
    : purpose === "affiliate" && (category || activeCategory?.name) ? (category || activeCategory?.name) : null;

  // --- Segmented control groups ---
  const purposeIntentSection = (
    <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide flex-nowrap pb-0.5">
      {/* Group 1: Purpose */}
      <div className="flex items-center gap-0.5 rounded-xl border border-border/60 bg-muted/40 p-0.5">
        {([
          { value: "ecommerce" as PurposeType, label: "E-com", Icon: ShoppingBag },
          { value: "affiliate" as PurposeType, label: "Affiliate", Icon: Megaphone },
        ]).map(({ value, label, Icon }) => (
          <button
            key={value}
            onClick={() => handlePurposeChange(value)}
            className={cn(
              "flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all duration-200",
              purpose === value ? cn(pillActiveClass) : cn(pillInactiveClass)
            )}
          >
            <Icon className="h-3 w-3" />
            {label}
          </button>
        ))}
      </div>

      {/* Group 2: Focus (conditional) */}
      {purpose === "ecommerce" && (
        <div className="flex items-center gap-0.5 rounded-xl border border-border/60 bg-muted/40 p-0.5">
          {([
            { value: "product" as EcomFocusType, label: "Product Ads", Icon: Package },
            { value: "brand" as EcomFocusType, label: "Brand Ads", Icon: ShoppingBag },
            { value: "asset" as EcomFocusType, label: "Product Asset Creative", Icon: ImageIcon },
          ]).map(({ value, label, Icon }) => (
            <button
              key={value}
              onClick={() => handleEcomFocusChange(value)}
              className={cn(
                "flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all duration-200",
                ecomFocus === value ? cn(pillActiveClass) : cn(pillInactiveClass)
              )}
            >
              <Icon className="h-3 w-3" />
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Group 3: Intent/Format — hidden for product/brand (auto adcopy), shown for asset with adcopy disabled */}
      {(purpose !== "ecommerce" || ecomFocus === "asset") && (
        <div className="flex items-center gap-0.5 rounded-xl border border-border/60 bg-muted/40 p-0.5">
          {(["creative-image", "creative-video", "adcopy"] as IntentType[]).map((v) => {
            const info = intentLabel[v];
            const Icon = info.icon;
            const isDisabled = purpose === "ecommerce" && ecomFocus === "asset" && v === "adcopy";
            return (
              <button
                key={v}
                onClick={() => !isDisabled && handleIntentChange(v)}
                disabled={isDisabled}
                className={cn(
                  "flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all duration-200",
                  isDisabled
                    ? "opacity-40 cursor-not-allowed text-muted-foreground"
                    : intent === v ? cn(pillActiveClass) : cn(pillInactiveClass)
                )}
              >
                <Icon className="h-3 w-3" />
                {info.label}
              </button>
            );
          })}
        </div>
      )}

      {productName && (
        <Badge variant="secondary" className="gap-1 text-[10px] ml-auto animate-in fade-in-0 duration-300">
          <Check className="h-3 w-3 text-primary" />
          {productName}
        </Badge>
      )}
    </div>
  );

  const contextSection = (
    <>
      {activeBrand && purpose === "ecommerce" && (
        <div className={cn("flex items-center gap-2 rounded-lg border px-3 py-1.5", cardClass)}>
          <div className="flex h-5 w-5 items-center justify-center rounded text-[9px] font-bold text-white"
            style={{ backgroundColor: activeBrand.colors?.[0] || "#6366F1" }}>
            {activeBrand.name.charAt(0)}
          </div>
          <span className="text-xs font-medium">{activeBrand.name}</span>
          {activeBrand.category && <span className="text-[11px] text-muted-foreground">• {activeBrand.category}</span>}
        </div>
      )}
      {activeCategory && purpose === "affiliate" && (
        <div className={cn("flex items-center gap-2 rounded-lg border px-3 py-1.5", cardClass)}>
          <span className="text-sm">{activeCategory.icon}</span>
          <span className="text-xs font-medium">{activeCategory.name}</span>
          {activeCategory.niche && <span className="text-[11px] text-muted-foreground">• {activeCategory.niche}</span>}
        </div>
      )}
      {purpose === "ecommerce" ? (
        <Genie2EcomInputs productUrl={productUrl} onProductUrlChange={setProductUrl} detectedBrand={detectedBrand} onBrandDetected={setDetectedBrand} variant="cards" showProducts={ecomFocus !== "brand"} />
      ) : (
        <Genie2AffiliateInputs category={category} onCategoryChange={setCategory} angle={angle} onAngleChange={setAngle} onCategoryIdChange={setAffiliateCategoryId} selectedCategoryId={affiliateCategoryId} />
      )}
    </>
  );

  const winnersAndEnrichment = (
    <>
      {purpose === "affiliate" && (
        <Genie5WinnersSection categoryId={affiliateCategoryId} selectedWinnerIds={selectedWinnerIds} onSelectionChange={setSelectedWinnerIds} />
      )}
      {ecomFocus === "asset" && purpose === "ecommerce" && (
        <Genie5ProductAssetInputs assetType={assetType} onAssetTypeChange={setAssetType} />
      )}
      <Genie5EnrichmentSection selected={enrichmentSelection} onSelectionChange={setEnrichmentSelection} />
    </>
  );

  const strategyOrConceptSection = ecomFocus === "asset" ? (
    <Genie5ConceptCards
      selectedIds={selectedConcepts}
      onSelectionChange={setSelectedConcepts}
      themeCardClass={cardClass}
      themePillActiveClass={pillActiveClass}
      themePillInactiveClass={pillInactiveClass}
      variant="cards"
    />
  ) : (
    <Genie5StrategyCards
      selectedIds={selectedStrategies}
      onSelectionChange={setSelectedStrategies}
      themeCardClass={cardClass}
      themePillActiveClass={pillActiveClass}
      themePillInactiveClass={pillInactiveClass}
      variant="cards"
      focusMode={ecomFocus}
    />
  );

  const approachSection = (
    <Genie5ApproachPicker
      approach={approach} onApproachChange={setApproach}
      selectedTemplateIds={selectedTemplateIds} onSelectedTemplateIdsChange={setSelectedTemplateIds}
      variant="inline"
      hideToggle
      themePillActiveClass={pillActiveClass}
      themePillInactiveClass={pillInactiveClass}
    />
  );

  const strategyApproachGrid = (
    <div className="space-y-2.5">
      <div className={cn("rounded-2xl border border-border/50 p-3 space-y-3", cardClass)}>
        {strategyOrConceptSection}
      </div>
      <div className={cn("rounded-2xl border border-border/50 p-3 space-y-3", cardClass)}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Approach</span>
            {approach === "templates" && selectedTemplateIds.size > 0 && (
              <Badge variant="secondary" className="text-[9px] h-4 px-1.5 animate-in fade-in-0 duration-200">
                {selectedTemplateIds.size} selected
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-0.5 rounded-md border border-border bg-muted/30 p-0.5">
            {(["templates", "fresh"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setApproach(v)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-[10px] font-medium transition-all duration-200",
                  approach === v
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {v === "fresh" ? "🚀 Fresh AI" : "📋 Templates"}
              </button>
            ))}
          </div>
        </div>
        {approachSection}
      </div>
    </div>
  );

  if (layout === "split") {
    return (
      <ResizablePanelGroup direction="horizontal" className="h-full rounded-lg">
        <ResizablePanel defaultSize={40} minSize={30}>
          <ScrollArea className="h-full">
            <div className="p-3 space-y-2.5 overflow-hidden min-w-0">
              <div className={cn("rounded-2xl border border-border/50 bg-muted/20 p-3 space-y-3", cardClass)}>
                {purposeIntentSection}
                {contextSection}
                {winnersAndEnrichment}
              </div>
              {strategyApproachGrid}
            </div>
          </ScrollArea>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={panelCollapsed ? 3 : 60} minSize={panelCollapsed ? 3 : 35}>
          <Genie5SplitOutputPanel
            batches={batches || []}
            activeBatchId={activeBatchId || null}
            onSelectBatch={onSelectBatch || (() => {})}
            intent={intent}
            collapsed={!!panelCollapsed}
            onToggleCollapse={onTogglePanelCollapse || (() => {})}
            onSaveToLibrary={onSplitSaveToLibrary}
            onLaunch={onSplitLaunch}
            onRegenerate={onSplitRegenerate}
            onDownload={onSplitDownload}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    );
  }

  return (
    <div className="space-y-2.5 overflow-hidden min-w-0">
      <div className={cn("rounded-2xl border border-border/50 bg-muted/20 p-3 space-y-3", cardClass)}>
        {purposeIntentSection}
        {contextSection}
        {winnersAndEnrichment}
      </div>
      {strategyApproachGrid}
    </div>
  );
});
