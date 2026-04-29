import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Check, Bookmark, Wand2, Trash2, ThumbsUp, ThumbsDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { EcomFocusType } from "@/lib/genie3-data";
import { useSavedStrategies, useCreateSavedStrategy, useDeleteSavedStrategy, type SavedStrategy } from "@/hooks/use-saved-strategies";
import { useSubmitFeedback } from "@/hooks/use-genie-feedback";

import imgBeforeAfter from "@/assets/strategies/before-after.jpg";
import imgSocialProof from "@/assets/strategies/social-proof.jpg";
import imgUrgency from "@/assets/strategies/urgency.jpg";
import imgProblemSolution from "@/assets/strategies/problem-solution.jpg";
import imgLifestyle from "@/assets/strategies/lifestyle.jpg";
import imgFeatureHighlight from "@/assets/strategies/feature-highlight.jpg";
import imgBrandStory from "@/assets/strategies/brand-story.jpg";
import imgMissionValues from "@/assets/strategies/mission-values.jpg";
import imgCommunity from "@/assets/strategies/community.jpg";
import imgHeritageCraft from "@/assets/strategies/heritage-craft.jpg";
import imgBrandVsCompetitor from "@/assets/strategies/brand-vs-competitor.jpg";
import imgEmotional from "@/assets/strategies/emotional.jpg";
import imgRetargeting from "@/assets/strategies/retargeting.jpg";
import imgSeasonalTrend from "@/assets/strategies/seasonal-trend.jpg";
import imgVipAccess from "@/assets/strategies/vip-access.jpg";

interface StrategyCard {
  id: string;
  title: string;
  angle: string;
  hook: string;
  layout: string;
  visualDirection: string;
  thumbnail: string;
}

const PRODUCT_STRATEGIES: StrategyCard[] = [
  { id: "s1", title: "Before/After Transformation", angle: "Comparison", hook: "See the difference in just 7 days", layout: "Split screen", visualDirection: "Clean, high-contrast comparison", thumbnail: imgBeforeAfter },
  { id: "s2", title: "Social Proof Authority", angle: "Trust", hook: "Join 50K+ satisfied customers", layout: "Testimonial centered", visualDirection: "Real customer photos, warm tones", thumbnail: imgSocialProof },
  { id: "s3", title: "Urgency Scarcity", angle: "FOMO", hook: "Only 24 hours left — don't miss out", layout: "Bold countdown overlay", visualDirection: "Red accents, timer visuals", thumbnail: imgUrgency },
  { id: "s4", title: "Problem-Solution", angle: "Pain point", hook: "Tired of X? Here's the fix.", layout: "2-panel problem/solution", visualDirection: "Dark to light transition", thumbnail: imgProblemSolution },
  { id: "s5", title: "Lifestyle Aspiration", angle: "Desire", hook: "Live the life you deserve", layout: "Full bleed lifestyle", visualDirection: "Golden hour, aspirational setting", thumbnail: imgLifestyle },
  { id: "s6", title: "Feature Highlight", angle: "Education", hook: "3 reasons this works", layout: "Icon grid", visualDirection: "Minimal, icon-forward", thumbnail: imgFeatureHighlight },
];

const BRAND_STRATEGIES: StrategyCard[] = [
  { id: "b1", title: "Brand Story Origin", angle: "Narrative", hook: "How it all started — our journey", layout: "Editorial long-form", visualDirection: "Cinematic, founder imagery", thumbnail: imgBrandStory },
  { id: "b2", title: "Mission & Values", angle: "Purpose", hook: "We exist to make a difference", layout: "Statement centered", visualDirection: "Bold typography, brand colors", thumbnail: imgMissionValues },
  { id: "b3", title: "Community Spotlight", angle: "Social proof", hook: "Meet the people who love us", layout: "UGC collage grid", visualDirection: "Authentic, user-generated feel", thumbnail: imgCommunity },
  { id: "b4", title: "Heritage & Craft", angle: "Quality", hook: "Crafted with care, built to last", layout: "Process showcase", visualDirection: "Close-up textures, artisan tones", thumbnail: imgHeritageCraft },
  { id: "b5", title: "Brand vs Competitor", angle: "Differentiation", hook: "Why we're not like the rest", layout: "Comparison table", visualDirection: "Clean contrast, side-by-side", thumbnail: imgBrandVsCompetitor },
  { id: "b6", title: "Emotional Connection", angle: "Empathy", hook: "We understand what you need", layout: "Lifestyle montage", visualDirection: "Warm, human-centric imagery", thumbnail: imgEmotional },
];

const DEMO_SAVED_STRATEGIES: SavedStrategy[] = [
  { id: "demo-s1", workspace_id: "", created_by: "", brand_id: null, title: "Before/After Transformation", angle: "Comparison", hook: "See the difference in just 7 days", layout: "Split screen", visual_direction: "Clean, high-contrast comparison", is_custom: false, custom_prompt: null, tags: ["conversion", "proof"], created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: "demo-s2", workspace_id: "", created_by: "", brand_id: null, title: "Social Proof Authority", angle: "Trust", hook: "Join 50K+ satisfied customers", layout: "Testimonial centered", visual_direction: "Real customer photos, warm tones", is_custom: false, custom_prompt: null, tags: ["trust", "UGC"], created_at: new Date(Date.now() - 86400000 * 4).toISOString() },
  { id: "demo-s3", workspace_id: "", created_by: "", brand_id: null, title: "Urgency Flash Sale", angle: "FOMO", hook: "Only 24 hours left — don't miss out", layout: "Bold countdown overlay", visual_direction: "Red accents, timer visuals", is_custom: true, custom_prompt: "Create urgency-driven strategy", tags: ["sale", "urgency"], created_at: new Date(Date.now() - 86400000 * 7).toISOString() },
];

const ANGLE_IMAGE_MAP: Record<string, string> = {
  comparison: imgBeforeAfter,
  trust: imgSocialProof,
  fomo: imgUrgency,
  "pain point": imgProblemSolution,
  desire: imgLifestyle,
  education: imgFeatureHighlight,
  narrative: imgBrandStory,
  purpose: imgMissionValues,
  "social proof": imgCommunity,
  quality: imgHeritageCraft,
  differentiation: imgBrandVsCompetitor,
  empathy: imgEmotional,
  retargeting: imgRetargeting,
  trend: imgSeasonalTrend,
  exclusivity: imgVipAccess,
};

const getSavedCardImage = (angle: string | null) => {
  if (!angle) return imgFeatureHighlight;
  return ANGLE_IMAGE_MAP[angle.toLowerCase()] || imgFeatureHighlight;
};

const TUNED_DUMMY: StrategyCard[] = [
  { id: "t1", title: "Hyper-Personalized Retarget", angle: "Retargeting", hook: "We noticed you left something behind", layout: "Dynamic product grid", visualDirection: "Personalized, data-driven", thumbnail: imgRetargeting },
  { id: "t2", title: "Seasonal Trend Rider", angle: "Trend", hook: "This season's must-have", layout: "Trend collage", visualDirection: "Vibrant, seasonal palette", thumbnail: imgSeasonalTrend },
  { id: "t3", title: "Exclusive VIP Access", angle: "Exclusivity", hook: "For our inner circle only", layout: "Premium card", visualDirection: "Dark luxe, gold accents", thumbnail: imgVipAccess },
];

type TabKey = "saved" | "new" | "tune";

interface Props {
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  customPrompt?: string;
  onCustomPromptChange?: (v: string) => void;
  defaultCollapsed?: boolean;
  themeCardClass?: string;
  themePillActiveClass?: string;
  themePillInactiveClass?: string;
  variant?: "compact" | "cards";
  focusMode?: EcomFocusType;
  activeBrandId?: string | null;
}

function StrategyFeedbackRow({ strategyId, angle, title }: { strategyId: string; angle: string; title: string }) {
  const [fb, setFb] = useState<"up" | "down" | null>(null);
  const [popType, setPopType] = useState<"up" | "down" | null>(null);
  const [comment, setComment] = useState("");
  const submitFeedback = useSubmitFeedback();

  const handleClick = (type: "up" | "down", e: React.MouseEvent) => {
    e.stopPropagation();
    if (fb === type) { setFb(null); setPopType(null); return; }
    setPopType(type);
  };

  const handleSubmit = (e: React.MouseEvent) => {
    e.stopPropagation();
    const type = popType!;
    setFb(type);
    submitFeedback.mutate({
      targetId: strategyId,
      targetType: "strategy_card",
      feedbackType: type,
      comment: comment.trim() || undefined,
      strategyAngle: angle,
      strategyTitle: title,
    });
    toast.success("Feedback recorded");
    setComment("");
    setPopType(null);
  };

  return (
    <div className="flex items-center gap-0.5 px-2 py-1 border-t border-border/30" onClick={(e) => e.stopPropagation()}>
      <Popover open={popType === "up"} onOpenChange={(v) => !v && setPopType(null)}>
        <PopoverTrigger asChild>
          <button onClick={(e) => handleClick("up", e)} className={cn("h-5 w-5 flex items-center justify-center rounded transition-colors", fb === "up" ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground")}>
            <ThumbsUp className="h-2.5 w-2.5" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-2 space-y-1.5" align="start" onClick={(e) => e.stopPropagation()}>
          <p className="text-[10px] font-medium">What did you like?</p>
          <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Optional..." className="min-h-[36px] text-[10px] resize-none" />
          <Button size="sm" className="w-full h-6 text-[10px]" onClick={handleSubmit}>Submit</Button>
        </PopoverContent>
      </Popover>
      <Popover open={popType === "down"} onOpenChange={(v) => !v && setPopType(null)}>
        <PopoverTrigger asChild>
          <button onClick={(e) => handleClick("down", e)} className={cn("h-5 w-5 flex items-center justify-center rounded transition-colors", fb === "down" ? "text-destructive bg-destructive/10" : "text-muted-foreground hover:text-foreground")}>
            <ThumbsDown className="h-2.5 w-2.5" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-2 space-y-1.5" align="start" onClick={(e) => e.stopPropagation()}>
          <p className="text-[10px] font-medium">What went wrong?</p>
          <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Optional..." className="min-h-[36px] text-[10px] resize-none" />
          <Button size="sm" className="w-full h-6 text-[10px]" onClick={handleSubmit}>Submit</Button>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function Genie5StrategyCards({
  selectedIds, onSelectionChange,
  variant = "compact",
  focusMode = "product",
  activeBrandId,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>("saved");
  const [tuneOpen, setTuneOpen] = useState(false);
  const [tunePrompt, setTunePrompt] = useState("");
  const [tuneAngle, setTuneAngle] = useState("");
  const [tuneHook, setTuneHook] = useState("");
  const [tuneLayout, setTuneLayout] = useState("");
  const [tuneVisual, setTuneVisual] = useState("");
  const [tunedResults, setTunedResults] = useState<StrategyCard[]>([]);

  const strategies = focusMode === "brand" ? BRAND_STRATEGIES : PRODUCT_STRATEGIES;
  const { data: dbSavedStrategies = [] } = useSavedStrategies(activeBrandId);
  const savedStrategies = dbSavedStrategies.length > 0 ? dbSavedStrategies : DEMO_SAVED_STRATEGIES;
  const saveMutation = useCreateSavedStrategy();
  const deleteMutation = useDeleteSavedStrategy();

  const toggleCard = (id: string) => {
    if (selectedIds.has(id)) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set([id]));
    }
  };

  const handleTuneGenerate = () => {
    setTunedResults(TUNED_DUMMY);
    setTuneOpen(false);
    setActiveTab("tune");
    toast.success("Generated 3 custom strategies");
  };

  const hasSelection = selectedIds.size > 0;

  function SavePopover({ card, isTuned }: { card: StrategyCard; isTuned?: boolean }) {
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState(card.title);
    const [tags, setTags] = useState("");

    const doSave = () => {
      saveMutation.mutate({
        brand_id: activeBrandId || null,
        title,
        angle: card.angle,
        hook: card.hook,
        layout: card.layout,
        visual_direction: card.visualDirection,
        is_custom: !!isTuned,
        custom_prompt: isTuned ? tunePrompt : null,
        tags: tags.split(",").map(t => t.trim()).filter(Boolean),
      }, {
        onSuccess: () => { toast.success(`Strategy "${title}" saved`); setOpen(false); },
        onError: () => toast.error("Failed to save"),
      });
    };

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(true); }}
            className="ml-1 hover:text-primary text-muted-foreground transition-all"
            title="Save strategy"
          >
            <Bookmark className="h-3 w-3" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-3 space-y-2" align="end" onClick={(e) => e.stopPropagation()}>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" className="h-7 text-xs" />
          <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Tags (comma separated)" className="h-7 text-xs" />
          <Button size="sm" className="w-full h-7 text-xs" onClick={doSave} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? "Saving…" : "Save"}
          </Button>
        </PopoverContent>
      </Popover>
    );
  }

  const renderCard = (s: StrategyCard, opts?: { isTuned?: boolean }) => {
    const selected = selectedIds.has(s.id);
    return (
      <div key={s.id} className={cn(
        "group relative flex flex-col rounded-lg border overflow-hidden text-left transition-all duration-200 w-[150px] shrink-0",
        selected
          ? "border-primary bg-primary/10 ring-1 ring-primary/20"
          : "border-transparent bg-muted/50 hover:bg-muted/60"
      )}>
        <button onClick={() => toggleCard(s.id)} className="text-left">
          <div className="relative h-20 w-full overflow-hidden bg-muted/30">
            <img src={s.thumbnail} alt={s.title} className="w-full h-full object-cover" loading="lazy" />
          </div>
          {selected && (
            <div className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary shadow-sm">
              <Check className="h-2.5 w-2.5 text-primary-foreground" />
            </div>
          )}
          <div className="p-2 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-foreground line-clamp-1 flex-1">{s.title}</span>
            </div>
            <p className="text-[10px] text-muted-foreground leading-snug line-clamp-2">{s.hook}</p>
            <div className="flex gap-1 pt-0.5">
              <Badge variant="outline" className="text-[8px] h-3.5 px-1 border-border/50">{s.angle}</Badge>
              <Badge variant="outline" className="text-[8px] h-3.5 px-1 border-border/50">{s.layout}</Badge>
            </div>
          </div>
        </button>
        <StrategyFeedbackRow strategyId={s.id} angle={s.angle} title={s.title} />
        <div className="px-2 pb-1.5 flex justify-end">
          <SavePopover card={s} isTuned={opts?.isTuned} />
        </div>
      </div>
    );
  };

  const renderSavedCard = (s: SavedStrategy) => {
    const selected = selectedIds.has(`saved-${s.id}`);
    return (
      <button
        key={s.id}
        onClick={() => toggleCard(`saved-${s.id}`)}
        className={cn(
          "group relative flex flex-col rounded-lg border overflow-hidden text-left transition-all duration-200 w-[160px] shrink-0",
          selected
            ? "border-primary bg-primary/10 ring-1 ring-primary/20"
            : "border-transparent bg-muted/50 hover:bg-muted/60"
        )}
      >
        <div className="relative h-20 w-full overflow-hidden bg-muted/30">
          <img
            src={getSavedCardImage(s.angle)}
            alt={s.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
        {selected && (
          <div className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary shadow-sm">
            <Check className="h-2.5 w-2.5 text-primary-foreground" />
          </div>
        )}
        <div className="p-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-foreground line-clamp-1 flex-1">{s.title}</span>
            <button
              onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(s.id, { onSuccess: () => toast.success("Deleted") }); }}
              className="ml-1 opacity-0 group-hover:opacity-100 hover:text-destructive text-muted-foreground transition-all"
            >
              <Trash2 className="h-2.5 w-2.5" />
            </button>
          </div>
          {s.hook && <p className="text-[10px] text-muted-foreground leading-snug line-clamp-2 mt-0.5">{s.hook}</p>}
          <div className="flex flex-wrap gap-1 pt-1">
            {s.angle && <Badge variant="outline" className="text-[8px] h-3.5 px-1 border-border/50">{s.angle}</Badge>}
            {s.is_custom && <Badge variant="secondary" className="text-[8px] h-3.5 px-1">Custom</Badge>}
            {(s.tags || []).map(t => <Badge key={t} variant="secondary" className="text-[8px] h-3.5 px-1">{t}</Badge>)}
          </div>
        </div>
      </button>
    );
  };

  const tabs: { key: TabKey; label: string }[] = [
    { key: "saved", label: "Saved" },
    { key: "new", label: "New" },
    { key: "tune", label: "Tune" },
  ];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <Sparkles className="h-3 w-3 text-primary" />
          <span className="text-xs font-medium text-muted-foreground">Strategies</span>
          {selectedIds.size > 0 && (
            <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">{selectedIds.size} selected</Badge>
          )}
          {!hasSelection && (
            <span className="text-[10px] text-destructive/70 ml-1">Select at least 1</span>
          )}
        </div>
        <div className="flex gap-0.5 rounded-md border border-border bg-muted/30 p-0.5">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => {
                if (t.key === "tune" && tunedResults.length === 0) { setTuneOpen(true); return; }
                setActiveTab(t.key);
              }}
              className={cn(
                "px-2 py-0.5 rounded text-[10px] font-medium transition-all",
                activeTab === t.key
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "saved" && (
        savedStrategies.length > 0 ? (
          <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-none">
            {savedStrategies.map(renderSavedCard)}
          </div>
        ) : (
          <div className="flex items-center justify-center py-6 text-center">
            <p className="text-[11px] text-muted-foreground">No saved strategies yet. Use <strong>New</strong> or <strong>Tune</strong> to create and save.</p>
          </div>
        )
      )}

      {activeTab === "new" && (
        <div className="flex overflow-x-auto gap-2.5 pb-1 scrollbar-none">
          {strategies.map(s => renderCard(s))}
        </div>
      )}

      {activeTab === "tune" && (
        tunedResults.length > 0 ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">Custom tuned results</span>
              <button onClick={() => setTuneOpen(true)} className="text-[10px] text-primary hover:underline">Re-tune</button>
            </div>
            <div className="flex overflow-x-auto gap-2.5 pb-1 scrollbar-none">
              {tunedResults.map(s => renderCard(s, { isTuned: true }))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 gap-2">
            <p className="text-[11px] text-muted-foreground">Describe your ideal strategy and we'll generate options.</p>
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setTuneOpen(true)}>
              <Wand2 className="h-3 w-3 mr-1" /> Tune & Generate
            </Button>
          </div>
        )
      )}

      <Dialog open={tuneOpen} onOpenChange={setTuneOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">Tune Strategy</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea
              value={tunePrompt}
              onChange={e => setTunePrompt(e.target.value)}
              placeholder="Describe the strategy you want…"
              className="min-h-[60px] text-xs"
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-muted-foreground mb-0.5 block">Angle</label>
                <Input value={tuneAngle} onChange={e => setTuneAngle(e.target.value)} placeholder="e.g. Trust" className="h-7 text-xs" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground mb-0.5 block">Hook</label>
                <Input value={tuneHook} onChange={e => setTuneHook(e.target.value)} placeholder="e.g. See the results" className="h-7 text-xs" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground mb-0.5 block">Layout</label>
                <Input value={tuneLayout} onChange={e => setTuneLayout(e.target.value)} placeholder="e.g. Split screen" className="h-7 text-xs" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground mb-0.5 block">Visual Direction</label>
                <Input value={tuneVisual} onChange={e => setTuneVisual(e.target.value)} placeholder="e.g. Warm tones" className="h-7 text-xs" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setTuneOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleTuneGenerate}>
              <Wand2 className="h-3 w-3 mr-1" /> Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
