import { useState } from "react";
import { Check, Lightbulb, Bookmark, Wand2, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useSavedConcepts, useCreateSavedConcept, useDeleteSavedConcept, type SavedConcept } from "@/hooks/use-saved-concepts";

interface ConceptCard {
  id: string;
  title: string;
  scene: string;
  composition: string;
  background: string;
  lighting: string;
  thumbnail: string;
}

const DEMO_CONCEPTS: ConceptCard[] = [
  { id: "c1", title: "Morning Vanity", scene: "Product placed on a marble vanity top with morning light streaming through sheer curtains", composition: "Hero product center-frame, soft botanical accents left", background: "White marble surface, blurred bathroom interior", lighting: "Warm golden hour side-light with soft fill", thumbnail: "/strategy-thumbs/c1-morning-vanity.jpg" },
  { id: "c2", title: "Botanical Garden", scene: "Product nestled among lush green foliage and fresh flowers in an outdoor setting", composition: "Product at lower third, greenery framing top and sides", background: "Vivid natural greens, soft bokeh depth", lighting: "Dappled sunlight, natural diffused overhead", thumbnail: "/strategy-thumbs/c2-botanical.jpg" },
  { id: "c3", title: "Studio Minimalist", scene: "Clean studio environment with seamless backdrop and precise product placement", composition: "Centered hero shot, geometric shadow play", background: "Seamless white or light grey cyclorama", lighting: "Key light 45°, subtle rim light, no harsh shadows", thumbnail: "/strategy-thumbs/c3-studio.jpg" },
  { id: "c4", title: "Luxury Lifestyle", scene: "Premium setting with rich textures — velvet, gold accents, dark wood surfaces", composition: "Product on dark surface, luxury props at edges", background: "Deep moody tones, dark mahogany or black marble", lighting: "Dramatic chiaroscuro, warm accent highlights", thumbnail: "/strategy-thumbs/c4-luxury.jpg" },
];

const TUNED_CONCEPTS: ConceptCard[] = [
  { id: "tc1", title: "Beach Sunset", scene: "Product on sand with sunset glow", composition: "Low angle, waves in background", background: "Golden sand, ocean horizon", lighting: "Warm sunset backlight", thumbnail: "" },
  { id: "tc2", title: "Urban Rooftop", scene: "Product on concrete ledge with city skyline", composition: "Product left-third, skyline right", background: "Blurred city lights at dusk", lighting: "Cool ambient with neon accents", thumbnail: "" },
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
  activeCategoryId?: string | null;
}

export function Genie5ConceptCards({
  selectedIds,
  onSelectionChange,
  activeCategoryId,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>("saved");
  const [tuneOpen, setTuneOpen] = useState(false);
  const [tunePrompt, setTunePrompt] = useState("");
  const [tuneScene, setTuneScene] = useState("");
  const [tuneComposition, setTuneComposition] = useState("");
  const [tuneBg, setTuneBg] = useState("");
  const [tuneLighting, setTuneLighting] = useState("");
  const [tunedResults, setTunedResults] = useState<ConceptCard[]>([]);

  const { data: savedConcepts = [] } = useSavedConcepts(activeCategoryId);
  const saveMutation = useCreateSavedConcept();
  const deleteMutation = useDeleteSavedConcept();

  const toggle = (id: string) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    onSelectionChange(next);
  };

  const handleTuneGenerate = () => {
    setTunedResults(TUNED_CONCEPTS);
    setTuneOpen(false);
    setActiveTab("tune");
    toast.success("Generated 2 custom concepts");
  };

  const hasSelection = selectedIds.size > 0;

  // ── Save Popover ──
  function SavePopover({ card, isTuned }: { card: ConceptCard; isTuned?: boolean }) {
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState(card.title);
    const [tags, setTags] = useState("");

    const doSave = () => {
      saveMutation.mutate({
        category_id: activeCategoryId || null,
        title,
        scene: card.scene,
        composition: card.composition,
        background: card.background,
        lighting: card.lighting,
        is_custom: !!isTuned,
        custom_prompt: isTuned ? tunePrompt : null,
        tags: tags.split(",").map(t => t.trim()).filter(Boolean),
      }, {
        onSuccess: () => { toast.success(`Concept "${title}" saved`); setOpen(false); },
        onError: () => toast.error("Failed to save"),
      });
    };

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            onClick={(e) => { e.stopPropagation(); setOpen(true); }}
            className="ml-1 hover:text-primary text-muted-foreground transition-all"
            title="Save concept"
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

  // ── Concept card renderer ──
  const renderCard = (c: ConceptCard, opts?: { isTuned?: boolean }) => {
    const selected = selectedIds.has(c.id);
    return (
      <button
        key={c.id}
        onClick={() => toggle(c.id)}
        className={cn(
          "group relative flex flex-col rounded-lg border overflow-hidden text-left transition-all duration-200 w-[150px] shrink-0",
          selected
            ? "border-primary/60 bg-primary/5 ring-1 ring-primary/20"
            : "border-transparent bg-muted/50 hover:border-border hover:bg-muted/70"
        )}
      >
        {c.thumbnail ? (
          <img src={c.thumbnail} alt="" loading="lazy" className="h-20 w-full object-cover" />
        ) : (
          <div className="h-14 w-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center"><Wand2 className="h-5 w-5 text-primary/40" /></div>
        )}
        {selected && (
          <div className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary shadow-sm">
            <Check className="h-2.5 w-2.5 text-primary-foreground" />
          </div>
        )}
        <div className="p-2 space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <Lightbulb className="h-3 w-3 text-primary shrink-0" />
              <span className="text-[11px] font-semibold line-clamp-1">{c.title}</span>
            </div>
            <SavePopover card={c} isTuned={opts?.isTuned} />
          </div>
          <p className="text-[10px] text-muted-foreground leading-snug line-clamp-2">{c.scene}</p>
          <div className="flex flex-wrap gap-1 pt-0.5">
            <span className="text-[9px] bg-muted rounded px-1.5 py-0.5 text-muted-foreground truncate max-w-[70px]">🎨 {c.background}</span>
            <span className="text-[9px] bg-muted rounded px-1.5 py-0.5 text-muted-foreground truncate max-w-[70px]">💡 {c.lighting}</span>
          </div>
        </div>
      </button>
    );
  };

  // ── Saved card renderer ──
  const renderSavedCard = (c: SavedConcept) => {
    const selected = selectedIds.has(`saved-${c.id}`);
    return (
      <button
        key={c.id}
        onClick={() => toggle(`saved-${c.id}`)}
        className={cn(
          "group relative flex flex-col rounded-lg border overflow-hidden text-left transition-all duration-200 w-[160px] shrink-0 p-2",
          selected
            ? "border-primary/60 bg-primary/5 ring-1 ring-primary/20"
            : "border-transparent bg-muted/50 hover:border-border hover:bg-muted/70"
        )}
      >
        {selected && (
          <div className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary shadow-sm">
            <Check className="h-2.5 w-2.5 text-primary-foreground" />
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <Lightbulb className="h-3 w-3 text-primary shrink-0" />
            <span className="text-[11px] font-semibold line-clamp-1">{c.title}</span>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(c.id, { onSuccess: () => toast.success("Deleted") }); }}
            className="ml-1 opacity-0 group-hover:opacity-100 hover:text-destructive text-muted-foreground transition-all"
          >
            <Trash2 className="h-2.5 w-2.5" />
          </button>
        </div>
        {c.scene && <p className="text-[10px] text-muted-foreground leading-snug line-clamp-2 mt-0.5">{c.scene}</p>}
        <div className="flex flex-wrap gap-1 pt-1">
          {c.is_custom && <Badge variant="secondary" className="text-[8px] h-3.5 px-1">Custom</Badge>}
          {(c.tags || []).map(t => <Badge key={t} variant="secondary" className="text-[8px] h-3.5 px-1">{t}</Badge>)}
        </div>
      </button>
    );
  };

  const tabItems: { key: TabKey; label: string }[] = [
    { key: "saved", label: "Saved" },
    { key: "new", label: "New" },
    { key: "tune", label: "Tune" },
  ];

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-1.5">
          <Lightbulb className="h-3 w-3 text-primary" />
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Concepts</span>
          {selectedIds.size > 0 && (
            <span className="ml-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
              {selectedIds.size}
            </span>
          )}
          {!hasSelection && (
            <span className="text-[10px] text-destructive/70 ml-1">Select at least 1</span>
          )}
        </div>
        {/* Tab pills */}
        <div className="flex gap-0.5 rounded-md border border-border bg-muted/30 p-0.5">
          {tabItems.map(t => (
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

      {/* Tab content */}
      {activeTab === "saved" && (
        savedConcepts.length > 0 ? (
          <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-none">
            {savedConcepts.map(renderSavedCard)}
          </div>
        ) : (
          <div className="flex items-center justify-center py-6 text-center">
            <p className="text-[11px] text-muted-foreground">No saved concepts yet. Use <strong>New</strong> or <strong>Tune</strong> to create and save.</p>
          </div>
        )
      )}

      {activeTab === "new" && (
        <div className="flex overflow-x-auto gap-2.5 pb-1 scrollbar-none">
          {DEMO_CONCEPTS.map(c => renderCard(c))}
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
              {tunedResults.map(c => renderCard(c, { isTuned: true }))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 gap-2">
            <p className="text-[11px] text-muted-foreground">Describe your ideal concept and we'll generate options.</p>
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setTuneOpen(true)}>
              <Wand2 className="h-3 w-3 mr-1" /> Tune & Generate
            </Button>
          </div>
        )
      )}

      {/* Tune Dialog */}
      <Dialog open={tuneOpen} onOpenChange={setTuneOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">Tune Concept</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea
              value={tunePrompt}
              onChange={e => setTunePrompt(e.target.value)}
              placeholder="Describe the concept you want — scene, mood, setting…"
              className="min-h-[60px] text-xs"
            />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-muted-foreground mb-0.5 block">Scene</label>
                <Input value={tuneScene} onChange={e => setTuneScene(e.target.value)} placeholder="e.g. Beach setting" className="h-7 text-xs" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground mb-0.5 block">Composition</label>
                <Input value={tuneComposition} onChange={e => setTuneComposition(e.target.value)} placeholder="e.g. Center frame" className="h-7 text-xs" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground mb-0.5 block">Background</label>
                <Input value={tuneBg} onChange={e => setTuneBg(e.target.value)} placeholder="e.g. Marble surface" className="h-7 text-xs" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground mb-0.5 block">Lighting</label>
                <Input value={tuneLighting} onChange={e => setTuneLighting(e.target.value)} placeholder="e.g. Golden hour" className="h-7 text-xs" />
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
