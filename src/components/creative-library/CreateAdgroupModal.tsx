import { useState, useMemo } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Search, Filter, ArrowUpDown, Plus, Loader2 } from "lucide-react";
import { useCreativeAssets, type CreativeAsset } from "@/hooks/use-creative-assets";
import { useTextItems, type ClTextItem } from "@/hooks/use-cl-text-items";
import { useCreateAdgroup } from "@/hooks/use-cl-adgroups";
import { AddTextItemModal } from "./AddTextItemModal";
import { AdPreviewPanel } from "./AdPreviewPanel";
import { useAddTextItem } from "@/hooks/use-cl-text-items";
import { toast } from "@/hooks/use-toast";
import { DialogTitle } from "@/components/ui/dialog";

// Dummy media for fallback
const DUMMY_MEDIA: (CreativeAsset & { isDummy: true })[] = [
  { id: "dm-1", workspace_id: "", folder_id: null, file_name: "mountain.jpg", file_type: "image", file_size: 2400000, width: 400, height: 600, storage_path: "", url: "https://picsum.photos/seed/mountain1/400/600", thumbnail_url: null, uploaded_by: "", created_at: "2024-11-15T10:30:00Z", isDummy: true },
  { id: "dm-2", workspace_id: "", folder_id: null, file_name: "sunset.jpg", file_type: "image", file_size: 1800000, width: 600, height: 400, storage_path: "", url: "https://picsum.photos/seed/sunset2/600/400", thumbnail_url: null, uploaded_by: "", created_at: "2024-11-10T08:15:00Z", isDummy: true },
  { id: "dm-3", workspace_id: "", folder_id: null, file_name: "product.jpg", file_type: "image", file_size: 980000, width: 500, height: 500, storage_path: "", url: "https://picsum.photos/seed/product3/500/500", thumbnail_url: null, uploaded_by: "", created_at: "2024-11-08T14:00:00Z", isDummy: true },
  { id: "dm-4", workspace_id: "", folder_id: null, file_name: "cityscape.jpg", file_type: "image", file_size: 3200000, width: 800, height: 450, storage_path: "", url: "https://picsum.photos/seed/city4/800/450", thumbnail_url: null, uploaded_by: "", created_at: "2024-10-28T09:45:00Z", isDummy: true },
  { id: "dm-5", workspace_id: "", folder_id: null, file_name: "flowers.jpg", file_type: "image", file_size: 1500000, width: 400, height: 550, storage_path: "", url: "https://picsum.photos/seed/flowers5/400/550", thumbnail_url: null, uploaded_by: "", created_at: "2024-10-25T16:20:00Z", isDummy: true },
  { id: "dm-6", workspace_id: "", folder_id: null, file_name: "forest.jpg", file_type: "image", file_size: 2800000, width: 700, height: 500, storage_path: "", url: "https://picsum.photos/seed/forest7/700/500", thumbnail_url: null, uploaded_by: "", created_at: "2024-10-18T13:30:00Z", isDummy: true },
];

// Dummy text items for fallback
const DUMMY_HEADLINES: (ClTextItem & { isDummy: true })[] = [
  { id: "dh-1", workspace_id: "", text: "Transform Your Health Today — Discover the Natural Way!", categories: [], tags: ["Health"], platforms: ["Facebook"], is_favourite: false, created_by: "", created_at: "", isDummy: true },
  { id: "dh-2", workspace_id: "", text: "Limited Time Offer: 50% Off Premium Plans", categories: [], tags: ["Offer"], platforms: ["Facebook"], is_favourite: false, created_by: "", created_at: "", isDummy: true },
  { id: "dh-3", workspace_id: "", text: "Join 10,000+ Happy Customers Who Made the Switch", categories: [], tags: ["Testimonial"], platforms: ["Instagram"], is_favourite: false, created_by: "", created_at: "", isDummy: true },
  { id: "dh-4", workspace_id: "", text: "Your Dream Home Awaits — Book a Free Consultation", categories: [], tags: ["Real Estate"], platforms: ["Facebook"], is_favourite: false, created_by: "", created_at: "", isDummy: true },
];

const DUMMY_PTEXTS: (ClTextItem & { isDummy: true })[] = [
  { id: "dp-1", workspace_id: "", text: "💪 Get 20% off our premium whey protein! Limited time offer for new customers.", categories: [], tags: ["Fitness"], platforms: ["Facebook"], is_favourite: false, created_by: "", created_at: "", isDummy: true },
  { id: "dp-2", workspace_id: "", text: "🔥 New arrivals just dropped! Check out our latest streetwear collection.", categories: [], tags: ["Fashion"], platforms: ["Instagram"], is_favourite: false, created_by: "", created_at: "", isDummy: true },
  { id: "dp-3", workspace_id: "", text: "📱 The all-new SmartWatch X5 is here. Track your health, stay connected.", categories: [], tags: ["Tech"], platforms: ["Facebook"], is_favourite: false, created_by: "", created_at: "", isDummy: true },
];

const DUMMY_DESCS: (ClTextItem & { isDummy: true })[] = [
  { id: "dd-1", workspace_id: "", text: "Shop now and save big on your fitness journey. Free shipping on orders over $50.", categories: [], tags: ["Fitness"], platforms: ["Facebook"], is_favourite: false, created_by: "", created_at: "", isDummy: true },
  { id: "dd-2", workspace_id: "", text: "Express your unique style with our exclusive designs.", categories: [], tags: ["Fashion"], platforms: ["Instagram"], is_favourite: false, created_by: "", created_at: "", isDummy: true },
  { id: "dd-3", workspace_id: "", text: "Pre-order now and get a free charging dock. Limited stock available.", categories: [], tags: ["Tech"], platforms: ["Facebook"], is_favourite: false, created_by: "", created_at: "", isDummy: true },
];

// SegmentedControl
function SegmentedControl<T extends string>({
  options, value, onChange, labels,
}: { options: readonly T[]; value: T; onChange: (v: T) => void; labels: Record<T, string> }) {
  return (
    <div className="flex items-center rounded-full border border-border bg-muted/40 p-0.5">
      {options.map((v) => (
        <button key={v} onClick={() => onChange(v)}
          className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${value === v ? "bg-[hsl(68,100%,45%)] text-black shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
          {labels[v]}
        </button>
      ))}
    </div>
  );
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateAdgroupModal({ open, onOpenChange }: Props) {
  const [step, setStep] = useState<"media" | "headline" | "primary_text" | "description">("media");
  const [search, setSearch] = useState("");
  const [searchMode, setSearchMode] = useState<"text" | "tag">("text");
  const [ownerFilter, setOwnerFilter] = useState<"all" | "mine" | "favourites">("all");

  // Selections
  const [selectedMedia, setSelectedMedia] = useState<Set<string>>(new Set());
  const [selectedHeadline, setSelectedHeadline] = useState<string | null>(null);
  const [selectedPrimaryText, setSelectedPrimaryText] = useState<string | null>(null);
  const [selectedDescription, setSelectedDescription] = useState<string | null>(null);

  // Add modals
  const [addHeadlineOpen, setAddHeadlineOpen] = useState(false);
  const [addPrimaryTextOpen, setAddPrimaryTextOpen] = useState(false);
  const [addDescriptionOpen, setAddDescriptionOpen] = useState(false);

  // Data
  const { data: realMedia } = useCreativeAssets();
  const { data: realHeadlines } = useTextItems("headline");
  const { data: realPrimaryTexts } = useTextItems("primary_text");
  const { data: realDescs } = useTextItems("description");

  const addHeadline = useAddTextItem("headline");
  const addPText = useAddTextItem("primary_text");
  const addDesc = useAddTextItem("description");
  const createAdgroup = useCreateAdgroup();

  const media = useMemo(() => (realMedia && realMedia.length > 0 ? realMedia : DUMMY_MEDIA) as (CreativeAsset & { isDummy?: boolean })[], [realMedia]);
  const headlines = useMemo(() => (realHeadlines && realHeadlines.length > 0 ? realHeadlines : DUMMY_HEADLINES) as (ClTextItem & { isDummy?: boolean })[], [realHeadlines]);
  const primaryTexts = useMemo(() => (realPrimaryTexts && realPrimaryTexts.length > 0 ? realPrimaryTexts : DUMMY_PTEXTS) as (ClTextItem & { isDummy?: boolean })[], [realPrimaryTexts]);
  const descriptions = useMemo(() => (realDescs && realDescs.length > 0 ? realDescs : DUMMY_DESCS) as (ClTextItem & { isDummy?: boolean })[], [realDescs]);

  // Find selected items for preview
  const selectedMediaItem = media.find((m) => selectedMedia.has(m.id));
  const selectedHeadlineItem = headlines.find((h) => h.id === selectedHeadline);
  const selectedPrimaryTextItem = primaryTexts.find((p) => p.id === selectedPrimaryText);
  const selectedDescriptionItem = descriptions.find((d) => d.id === selectedDescription);

  const toggleMedia = (id: string) => {
    setSelectedMedia((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const handleCreate = async () => {
    try {
      await createAdgroup.mutateAsync({
        name: selectedHeadlineItem?.text?.slice(0, 40) || "New Adgroup",
        page_name: "My Page",
        media_ids: Array.from(selectedMedia).filter((id) => !id.startsWith("dm-")),
        headline_id: selectedHeadline && !selectedHeadline.startsWith("dh-") ? selectedHeadline : null,
        primary_text_id: selectedPrimaryText && !selectedPrimaryText.startsWith("dp-") ? selectedPrimaryText : null,
        description_id: selectedDescription && !selectedDescription.startsWith("dd-") ? selectedDescription : null,
      });
      toast({ title: "Adgroup created successfully!" });
      resetAndClose();
    } catch (e: any) {
      toast({ title: "Failed to create adgroup", description: e.message, variant: "destructive" });
    }
  };

  const resetAndClose = () => {
    setStep("media");
    setSelectedMedia(new Set());
    setSelectedHeadline(null);
    setSelectedPrimaryText(null);
    setSelectedDescription(null);
    setSearch("");
    onOpenChange(false);
  };

  const steps = ["media", "headline", "primary_text", "description"] as const;
  const stepIdx = steps.indexOf(step);
  const canNext = step === "media" ? selectedMedia.size > 0 : true;

  const SearchInput = (
    <div className="relative flex-1 min-w-[160px] max-w-xs">
      <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 z-10">
        <button onClick={() => setSearchMode("text")}
          className={`px-1.5 py-0.5 text-[9px] font-medium rounded-full transition-colors ${searchMode === "text" ? "bg-[hsl(68,100%,45%)] text-black" : "bg-muted text-muted-foreground"}`}>
          Text
        </button>
        <button onClick={() => setSearchMode("tag")}
          className={`px-1.5 py-0.5 text-[9px] font-medium rounded-full transition-colors ${searchMode === "tag" ? "bg-[hsl(68,100%,45%)] text-black" : "bg-muted text-muted-foreground"}`}>
          Tag
        </button>
      </div>
      <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
      <Input value={search} onChange={(e) => setSearch(e.target.value)} type="search" autoComplete="off"
        placeholder={searchMode === "text" ? "Search…" : "Search by tag…"} className="pl-[4.5rem] pr-8 h-8 text-xs" />
    </div>
  );

  // Filter text items
  const filterText = (items: (ClTextItem & { isDummy?: boolean })[]) => {
    if (!search) return items;
    const q = search.toLowerCase();
    if (searchMode === "text") return items.filter((i) => i.text.toLowerCase().includes(q));
    return items.filter((i) => i.tags.some((t) => t.toLowerCase().includes(q)));
  };

  // Filter media items
  const filteredMedia = useMemo(() => {
    if (!search) return media;
    const q = search.toLowerCase();
    return media.filter((m) => m.file_name.toLowerCase().includes(q));
  }, [media, search]);

  const renderTextList = (
    items: (ClTextItem & { isDummy?: boolean })[],
    selectedId: string | null,
    onSelect: (id: string) => void,
  ) => (
    <div className="space-y-2">
      {filterText(items).map((item) => (
        <div key={item.id}
          className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedId === item.id ? "border-primary ring-1 ring-primary/30 bg-primary/5" : "border-border hover:border-muted-foreground/40"}`}
          onClick={() => onSelect(item.id)}>
          <Checkbox checked={selectedId === item.id} onCheckedChange={() => onSelect(item.id)} className="mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-foreground line-clamp-2">{item.text}</p>
            {item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {item.tags.map((t) => <Badge key={t} variant="outline" className="text-[9px] px-1.5 py-0 font-normal rounded-full h-4">{t}</Badge>)}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => { if (!o) resetAndClose(); }}>
        <DialogContent className="max-w-5xl h-[85vh] p-0 flex flex-col overflow-hidden">
          <DialogTitle className="sr-only">Create New Adgroup</DialogTitle>
          <div className="flex flex-1 overflow-hidden">
            {/* Left panel */}
            <div className="flex-1 flex flex-col overflow-hidden border-r border-border">
              {/* Step tabs */}
              <div className="border-b border-border px-4">
                <Tabs value={step} onValueChange={(v) => { setStep(v as any); setSearch(""); }}>
                  <TabsList className="bg-transparent h-auto p-0 gap-0">
                    {(["media", "headline", "primary_text", "description"] as const).map((s) => (
                      <TabsTrigger key={s} value={s}
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:font-semibold px-3 py-2 text-xs capitalize">
                        {s === "primary_text" ? "Primary Text" : s.charAt(0).toUpperCase() + s.slice(1)}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>

              {/* Toolbar */}
              <div className="flex flex-wrap items-center gap-2 px-4 py-2 border-b border-border">
                {SearchInput}
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" disabled><Filter className="h-3.5 w-3.5" /></Button>
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" disabled><ArrowUpDown className="h-3.5 w-3.5" /></Button>
                <div className="flex-1" />
                <SegmentedControl options={["all", "mine", "favourites"] as const} value={ownerFilter} onChange={(v) => setOwnerFilter(v as "all" | "mine" | "favourites")}
                  labels={{ all: "All", mine: "Mine", favourites: "Favourites" }} />
                {step !== "media" && (
                  <Button size="sm" className="h-8 text-xs rounded-lg" onClick={() => {
                    if (step === "headline") setAddHeadlineOpen(true);
                    else if (step === "primary_text") setAddPrimaryTextOpen(true);
                    else setAddDescriptionOpen(true);
                  }}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add
                  </Button>
                )}
              </div>

              {/* Content area */}
              <div className="flex-1 overflow-y-auto p-4">
                {step === "media" && (
                  <div className="columns-2 sm:columns-3 gap-3 space-y-0">
                    {filteredMedia.map((m) => {
                      const isChecked = selectedMedia.has(m.id);
                      return (
                        <div key={m.id}
                          className={`break-inside-avoid mb-3 group relative rounded-xl border overflow-hidden cursor-pointer transition-all ${isChecked ? "border-primary ring-2 ring-primary/30" : "border-border/60 hover:border-muted-foreground/40"}`}
                          onClick={() => toggleMedia(m.id)}>
                          <img src={m.url} alt={m.file_name} className="w-full h-auto block bg-muted" loading="lazy" />
                          <div className={`absolute top-2 left-2 transition-opacity ${isChecked ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                            <Checkbox checked={isChecked} onCheckedChange={() => toggleMedia(m.id)}
                              className="h-5 w-5 rounded bg-white/80 backdrop-blur-sm border-border/50" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {step === "headline" && renderTextList(headlines, selectedHeadline, setSelectedHeadline)}
                {step === "primary_text" && renderTextList(primaryTexts, selectedPrimaryText, setSelectedPrimaryText)}
                {step === "description" && renderTextList(descriptions, selectedDescription, setSelectedDescription)}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <Button variant="outline" onClick={resetAndClose}>Cancel</Button>
                <div className="flex gap-2">
                  {stepIdx > 0 && (
                    <Button variant="outline" onClick={() => { setStep(steps[stepIdx - 1]); setSearch(""); }}>Back</Button>
                  )}
                  {step !== "description" ? (
                    <Button onClick={() => { setStep(steps[stepIdx + 1]); setSearch(""); }} disabled={!canNext}>Next</Button>
                  ) : (
                    <Button onClick={handleCreate} disabled={createAdgroup.isPending}>
                      {createAdgroup.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
                      Create
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Right panel - Ad Preview */}
            <div className="w-[340px] p-4 overflow-y-auto shrink-0 hidden md:block">
              <AdPreviewPanel
                pageName="My Page"
                primaryText={selectedPrimaryTextItem?.text}
                mediaUrl={selectedMediaItem?.url}
                headline={selectedHeadlineItem?.text}
                description={selectedDescriptionItem?.text}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add modals for inline creation */}
      <AddTextItemModal type="headline" open={addHeadlineOpen} onOpenChange={setAddHeadlineOpen}
        onSubmit={(d) => addHeadline.mutateAsync(d)} isPending={addHeadline.isPending} />
      <AddTextItemModal type="primary_text" open={addPrimaryTextOpen} onOpenChange={setAddPrimaryTextOpen}
        onSubmit={(d) => addPText.mutateAsync(d)} isPending={addPText.isPending} />
      <AddTextItemModal type="description" open={addDescriptionOpen} onOpenChange={setAddDescriptionOpen}
        onSubmit={(d) => addDesc.mutateAsync(d)} isPending={addDesc.isPending} />
    </>
  );
}
