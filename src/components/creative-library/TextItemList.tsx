import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Search, Filter, ArrowUpDown, Plus, Copy, Bookmark, MoreVertical, Trash2, Pencil, Loader2, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { type ClTextItem, type TextItemType, useTextItems, useAddTextItem, useDeleteTextItem, useUpdateTextItem } from "@/hooks/use-cl-text-items";
import { AddTextItemModal } from "./AddTextItemModal";

// Dummy data for when DB is empty
const DUMMY_ITEMS: Record<TextItemType, Omit<ClTextItem, "id" | "workspace_id" | "created_by" | "created_at">[]> = {
  headline: [
    { text: "Transform Your Health Today — Discover the Natural Way!", categories: ["Health"], tags: ["Insurance", "debt"], platforms: ["Facebook"], is_favourite: false },
    { text: "Limited Time Offer: 50% Off Premium Plans", categories: ["Finance"], tags: ["Offer", "Promo"], platforms: ["Facebook", "TikTok"], is_favourite: true },
    { text: "Join 10,000+ Happy Customers Who Made the Switch", categories: ["E-commerce"], tags: ["Testimonial"], platforms: ["Instagram"], is_favourite: false },
    { text: "Your Dream Home Awaits — Book a Free Consultation", categories: ["Real Estate"], tags: ["English"], platforms: ["Facebook"], is_favourite: false },
    { text: "Learn to Code in 90 Days — Start Free Today", categories: ["Education"], tags: ["Promo"], platforms: ["YouTube"], is_favourite: true },
    { text: "Fresh Organic Produce Delivered to Your Door", categories: ["Health"], tags: ["Flower", "Rose"], platforms: ["Facebook", "Instagram"], is_favourite: false },
    { text: "Don't Miss Out — Sale Ends This Weekend!", categories: ["E-commerce"], tags: ["Urgent", "Offer"], platforms: ["TikTok"], is_favourite: false },
    { text: "Expert Financial Advice — Zero Hidden Fees", categories: ["Finance"], tags: ["Insurance", "debt", "English"], platforms: ["Google"], is_favourite: false },
  ],
  primary_text: [
    { text: "💪 Get 20% off our premium whey protein! Limited time offer for new customers. Build muscle faster with clean ingredients.", categories: ["Health"], tags: ["Fitness", "Protein"], platforms: ["Facebook"], is_favourite: false },
    { text: "🔥 New arrivals just dropped! Check out our latest streetwear collection. Stand out from the crowd.", categories: ["Fashion"], tags: ["Streetwear"], platforms: ["Instagram"], is_favourite: true },
    { text: "📱 The all-new SmartWatch X5 is here. Track your health, stay connected, look great.", categories: ["Tech"], tags: ["Smartwatch"], platforms: ["Facebook", "TikTok"], is_favourite: false },
    { text: "🌿 100% organic, farm-to-table goodness. Subscribe to our weekly veggie box and eat fresh every day.", categories: ["Health"], tags: ["Organic", "Food"], platforms: ["Facebook"], is_favourite: false },
    { text: "🏠 Find your dream home today! Browse 500+ listings in your area. Virtual tours available.", categories: ["Real Estate"], tags: ["Homes"], platforms: ["Google"], is_favourite: false },
    { text: "🐾 Your pets deserve the best! Premium pet food made with real ingredients, no fillers.", categories: ["E-commerce"], tags: ["Pets", "Food"], platforms: ["Facebook"], is_favourite: true },
    { text: "👨‍💻 Master coding in 90 days. Our bootcamp has a 95% job placement rate. Start your tech career now.", categories: ["Education"], tags: ["Coding", "Career"], platforms: ["YouTube"], is_favourite: false },
    { text: "✨ Glow up with our new vitamin C serum. Dermatologist tested, visible results in 2 weeks.", categories: ["Health"], tags: ["Skincare", "Beauty"], platforms: ["Instagram"], is_favourite: false },
  ],
  description: [
    { text: "Shop now and save big on your fitness journey. Free shipping on orders over $50.", categories: ["Health"], tags: ["Fitness"], platforms: ["Facebook"], is_favourite: false },
    { text: "Express your unique style with our exclusive designs. Available in all sizes.", categories: ["Fashion"], tags: ["Streetwear"], platforms: ["Instagram"], is_favourite: false },
    { text: "Pre-order now and get a free charging dock. Limited stock available.", categories: ["Tech"], tags: ["Smartwatch", "Launch"], platforms: ["Facebook"], is_favourite: true },
    { text: "Join 10,000+ families eating healthier. Cancel anytime, no commitment.", categories: ["Health"], tags: ["Organic"], platforms: ["Facebook"], is_favourite: false },
    { text: "Get pre-approved in minutes. Our agents are ready to help you move.", categories: ["Real Estate"], tags: ["Homes"], platforms: ["Google"], is_favourite: false },
    { text: "Free sample pack with your first order. Vet recommended formula.", categories: ["E-commerce"], tags: ["Pets"], platforms: ["Facebook"], is_favourite: false },
    { text: "Flexible online schedule. Mentorship included. Payment plans available.", categories: ["Education"], tags: ["Coding"], platforms: ["YouTube"], is_favourite: true },
    { text: "Cruelty-free and vegan. Use code GLOW25 for 25% off.", categories: ["Health"], tags: ["Skincare"], platforms: ["Instagram"], is_favourite: false },
  ],
};

// SegmentedControl same as main page
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
  type: TextItemType;
  isReadOnly: boolean;
  /**
   * Cross-tab brand filter from the parent's URL state.
   *   null      → show all
   *   "orphan"  → show only items without a brand attribution
   *   <id>      → show only items for that brand
   * Items whose `brand_id` is missing are treated as orphan.
   */
  brandFilter?: string | null;
}

export function TextItemList({ type, isReadOnly, brandFilter = null }: Props) {
  const { user } = useAuth();
  const { data: items, isLoading } = useTextItems(type);
  const addItem = useAddTextItem(type);
  const deleteItem = useDeleteTextItem(type);
  const updateItem = useUpdateTextItem(type);

  const [search, setSearch] = useState("");
  const [searchMode, setSearchMode] = useState<"text" | "tag">("text");
  const [ownerFilter, setOwnerFilter] = useState<"all" | "mine" | "favourites">("all");
  const [addOpen, setAddOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  // Use dummy data if no real items
  const displayItems = useMemo(() => {
    const real = items || [];
    const list: (ClTextItem & { isDummy?: boolean })[] = real.length > 0
      ? real
      : DUMMY_ITEMS[type].map((d, i) => ({
          ...d,
          id: `dummy-${type}-${i}`,
          workspace_id: "",
          created_by: "",
          created_at: new Date().toISOString(),
          isDummy: true,
        }));

    let filtered = list;
    // Cross-tab brand filter (Maalik: "filter persistence across tabs")
    if (brandFilter) {
      filtered = filtered.filter((i) => {
        const bid = (i as ClTextItem & { brand_id?: string | null }).brand_id ?? null;
        if (brandFilter === "orphan") return bid == null;
        return bid === brandFilter;
      });
    }
    if (ownerFilter === "mine" && user) filtered = filtered.filter((i) => i.created_by === user.id);
    if (ownerFilter === "favourites") filtered = filtered.filter((i) => i.is_favourite);
    if (search) {
      const q = search.toLowerCase();
      if (searchMode === "text") {
        filtered = filtered.filter((i) => i.text.toLowerCase().includes(q));
      } else {
        filtered = filtered.filter((i) => i.tags.some((t) => t.toLowerCase().includes(q)));
      }
    }
    return filtered;
  }, [items, type, ownerFilter, search, searchMode, user, brandFilter]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const clearSelection = () => setSelected(new Set());

  const handleBulkCopy = () => {
    const texts = displayItems
      .filter((i) => selected.has(i.id))
      .map((i) => i.text)
      .join("\n\n");
    navigator.clipboard.writeText(texts);
    toast({ title: `Copied ${selected.size} item${selected.size !== 1 ? "s" : ""} to clipboard` });
    clearSelection();
  };

  const handleBulkDelete = async () => {
    const realIds = displayItems
      .filter((i) => selected.has(i.id) && !(i as any).isDummy)
      .map((i) => i.id);
    if (realIds.length === 0) {
      toast({ title: "No real items to delete (dummy data cannot be deleted)" });
      setBulkDeleteOpen(false);
      return;
    }
    try {
      await Promise.all(realIds.map((id) => deleteItem.mutateAsync(id)));
      toast({ title: `Deleted ${realIds.length} item${realIds.length !== 1 ? "s" : ""}` });
      clearSelection();
    } catch (e: any) {
      toast({ title: "Delete failed", description: e.message, variant: "destructive" });
    }
    setBulkDeleteOpen(false);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const handleToggleFav = async (item: ClTextItem & { isDummy?: boolean }) => {
    if (item.isDummy) { toast({ title: "Favourites available with real data" }); return; }
    try {
      await updateItem.mutateAsync({ id: item.id, is_favourite: !item.is_favourite });
      toast({ title: item.is_favourite ? "Removed from favourites" : "Saved to favourites" });
    } catch { toast({ title: "Failed to update", variant: "destructive" }); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteItem.mutateAsync(deleteTarget);
      toast({ title: "Deleted" });
    } catch (e: any) {
      toast({ title: "Delete failed", description: e.message, variant: "destructive" });
    }
    setDeleteTarget(null);
  };

  const typeLabel = type === "headline" ? "Headline" : type === "primary_text" ? "Primary Text" : "Description";

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* ─── Adaptive Toolbar — morphs between default + selection state ─── */}
      <div className="relative h-[52px] shrink-0 border-b border-border overflow-hidden">
        {/* Default state: search / filters / add — slides left on selection */}
        <div className={`absolute inset-0 flex flex-nowrap items-center gap-2 px-4 transition-all duration-200 ease-out${selected.size > 0 ? " opacity-0 -translate-x-4 pointer-events-none" : ""}`}>
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 z-10">
              <button onClick={() => setSearchMode("text")}
                className={`px-1.5 py-0.5 text-[9px] font-medium rounded-full transition-colors ${searchMode === "text" ? "bg-[hsl(68,100%,45%)] text-black" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                Text
              </button>
              <button onClick={() => setSearchMode("tag")}
                className={`px-1.5 py-0.5 text-[9px] font-medium rounded-full transition-colors ${searchMode === "tag" ? "bg-[hsl(68,100%,45%)] text-black" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                Tag
              </button>
            </div>
            <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} type="search" autoComplete="off"
              placeholder={searchMode === "text" ? "Search by text…" : "Search by tag…"} className="pl-[4.5rem] pr-8 h-8 text-xs" />
          </div>
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg shrink-0" disabled><Filter className="h-3.5 w-3.5" /></Button>
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg shrink-0" disabled><ArrowUpDown className="h-3.5 w-3.5" /></Button>
          <div className="flex-1" />
          <SegmentedControl
            options={["all", "mine", "favourites"] as const}
            value={ownerFilter}
            onChange={(v) => setOwnerFilter(v as "all" | "mine" | "favourites")}
            labels={{ all: "All", mine: "Mine", favourites: "Favourites" }}
          />
          <Button size="sm" className="h-8 text-xs rounded-lg shrink-0" disabled={isReadOnly} onClick={() => setAddOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> Add
          </Button>
        </div>

        {/* Selection state: bulk actions — slides in from right */}
        <div className={`absolute inset-0 flex items-center gap-2 px-4 transition-all duration-200 ease-out${selected.size === 0 ? " opacity-0 translate-x-4 pointer-events-none" : ""}`}>
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={clearSelection}>
            <X className="h-3.5 w-3.5" />
          </Button>
          <span className="text-xs font-medium text-foreground shrink-0">{selected.size} selected</span>
          <div className="flex-1" />
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleBulkCopy}>
            <Copy className="h-3 w-3 mr-1" /> Copy all
          </Button>
          <Button variant="destructive" size="sm" className="h-7 text-xs" disabled={isReadOnly} onClick={() => setBulkDeleteOpen(true)}>
            <Trash2 className="h-3 w-3 mr-1" /> Delete
          </Button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : displayItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-sm font-medium text-muted-foreground">No {typeLabel.toLowerCase()}s found</p>
            <p className="text-xs text-muted-foreground mt-1">Try adjusting your search or add a new one.</p>
          </div>
        ) : (
          displayItems.map((item) => {
            const isChecked = selected.has(item.id);
            return (
              <div key={item.id}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${isChecked ? "border-primary ring-1 ring-primary/30 bg-primary/5" : "border-border hover:border-muted-foreground/40"}`}>
                <Checkbox checked={isChecked} onCheckedChange={() => toggleSelect(item.id)} className="mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground line-clamp-1">{item.text}</p>
                  {item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {item.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-[9px] px-2 py-0 font-normal rounded-full h-4">{tag}</Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCopy(item.text)}>
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Copy</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleToggleFav(item)}>
                        <Bookmark className={`h-3.5 w-3.5 ${item.is_favourite ? "fill-primary text-primary" : ""}`} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{item.is_favourite ? "Remove favourite" : "Save to favourites"}</TooltipContent>
                  </Tooltip>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="h-3.5 w-3.5" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                      <DropdownMenuItem disabled><Pencil className="h-4 w-4 mr-2" /> Edit</DropdownMenuItem>
                      {!item.isDummy && (
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteTarget(item.id)}>
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Modal */}
      <AddTextItemModal
        type={type}
        open={addOpen}
        onOpenChange={setAddOpen}
        onSubmit={(data) => addItem.mutateAsync(data)}
        isPending={addItem.isPending}
      />

      {/* Single Delete Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {typeLabel}</AlertDialogTitle>
            <AlertDialogDescription>Are you sure? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Dialog */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selected.size} {typeLabel}{selected.size !== 1 ? "s" : ""}</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the selected items. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete All</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
