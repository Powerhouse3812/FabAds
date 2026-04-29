import { useState, useMemo, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FilterMultiSelect } from "@/components/ui/filter-multi-select";
import {
  useCreativeAssets, useUploadCreativeAsset, useDeleteCreativeAsset,
  type CreativeAsset,
} from "@/hooks/use-creative-assets";
import { useClAdgroups, useDeleteAdgroup, useUpdateAdgroup, type ClAdgroup } from "@/hooks/use-cl-adgroups";
import { useTextItems } from "@/hooks/use-cl-text-items";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import {
  Upload, Search, Trash2, Loader2, MoreVertical, Download, Link2,
  Play, Bookmark, X, Sparkles, Rocket, CloudUpload, Type, AlignLeft, FileText,
  Filter, ArrowUpDown, Shuffle, Plus, Music, Layers, FolderPlus,
  BookmarkCheck, Copy, Trash,
} from "lucide-react";
import { TextItemList } from "@/components/creative-library/TextItemList";
import { CreateAdgroupModal } from "@/components/creative-library/CreateAdgroupModal";
import { AdgroupPropertiesModal } from "@/components/creative-library/AdgroupPropertiesModal";
import { useClFolders, useCreateClFolder, useUpdateClFolder, useReorderClFolders } from "@/hooks/use-cl-folders";
import { useClFolderStats } from "@/hooks/use-cl-folder-stats";
import { FolderListPanel } from "@/components/creative-library/FolderListPanel";
import { FolderFormModal } from "@/components/creative-library/FolderFormModal";
import { MoveToFolderModal } from "@/components/creative-library/MoveToFolderModal";
import { FolderContentsView } from "@/components/creative-library/FolderContentsView";
import { AdgroupLaunchModal } from "@/components/creative-library/AdgroupLaunchModal";
import { useOffers } from "@/hooks/use-offers";
import { useOfferFolderLinks, useFilteredFolderItemIds } from "@/hooks/use-offer-folder-links";
import { useWorkspace } from "@/hooks/use-workspace";
import type { AdgroupLaunchItem } from "@/hooks/use-adgroup-launch";

// ─── Dummy Data ─────────────────────────────────────────────────────────────────

interface DummyAsset extends CreativeAsset {
  isDummy: true;
  tags: string[];
}

const DUMMY_ASSETS: DummyAsset[] = [
  { id: "dummy-1", workspace_id: "", folder_id: null, file_name: "mountain-landscape.jpg", file_type: "image", file_size: 2400000, width: 400, height: 600, storage_path: "", url: "https://picsum.photos/seed/mountain1/400/600", thumbnail_url: null, uploaded_by: "", created_at: "2024-11-15T10:30:00Z", isDummy: true, tags: ["Mountains", "Ice", "Cold"] },
  { id: "dummy-2", workspace_id: "", folder_id: null, file_name: "sunset-beach.jpg", file_type: "image", file_size: 1800000, width: 600, height: 400, storage_path: "", url: "https://picsum.photos/seed/sunset2/600/400", thumbnail_url: null, uploaded_by: "", created_at: "2024-11-10T08:15:00Z", isDummy: true, tags: ["Beach", "Sunset", "Warm"] },
  { id: "dummy-3", workspace_id: "", folder_id: null, file_name: "product-shot-01.jpg", file_type: "image", file_size: 980000, width: 500, height: 500, storage_path: "", url: "https://picsum.photos/seed/product3/500/500", thumbnail_url: null, uploaded_by: "", created_at: "2024-11-08T14:00:00Z", isDummy: true, tags: ["Product", "Studio"] },
  { id: "dummy-4", workspace_id: "", folder_id: null, file_name: "urban-cityscape.jpg", file_type: "image", file_size: 3200000, width: 800, height: 450, storage_path: "", url: "https://picsum.photos/seed/city4/800/450", thumbnail_url: null, uploaded_by: "", created_at: "2024-10-28T09:45:00Z", isDummy: true, tags: ["City", "Urban", "Night"] },
  { id: "dummy-5", workspace_id: "", folder_id: null, file_name: "spring-flowers.jpg", file_type: "image", file_size: 1500000, width: 400, height: 550, storage_path: "", url: "https://picsum.photos/seed/flowers5/400/550", thumbnail_url: null, uploaded_by: "", created_at: "2024-10-25T16:20:00Z", isDummy: true, tags: ["Flowers", "Spring", "Red"] },
  { id: "dummy-6", workspace_id: "", folder_id: null, file_name: "promo-video-01.mp4", file_type: "video", file_size: 15000000, width: 1920, height: 1080, storage_path: "", url: "https://picsum.photos/seed/video6/600/340", thumbnail_url: null, uploaded_by: "", created_at: "2024-10-20T11:00:00Z", isDummy: true, tags: ["Promo", "Ad"] },
  { id: "dummy-7", workspace_id: "", folder_id: null, file_name: "forest-aerial.jpg", file_type: "image", file_size: 2800000, width: 700, height: 500, storage_path: "", url: "https://picsum.photos/seed/forest7/700/500", thumbnail_url: null, uploaded_by: "", created_at: "2024-10-18T13:30:00Z", isDummy: true, tags: ["Forest", "Aerial", "Green"] },
  { id: "dummy-8", workspace_id: "", folder_id: null, file_name: "food-photography.jpg", file_type: "image", file_size: 1100000, width: 450, height: 600, storage_path: "", url: "https://picsum.photos/seed/food8/450/600", thumbnail_url: null, uploaded_by: "", created_at: "2024-10-15T07:00:00Z", isDummy: true, tags: ["Food", "Close-up"] },
  { id: "dummy-9", workspace_id: "", folder_id: null, file_name: "behind-the-scenes.mp4", file_type: "video", file_size: 22000000, width: 1080, height: 1920, storage_path: "", url: "https://picsum.photos/seed/bts9/400/700", thumbnail_url: null, uploaded_by: "", created_at: "2024-10-12T10:00:00Z", isDummy: true, tags: ["BTS", "Team"] },
  { id: "dummy-10", workspace_id: "", folder_id: null, file_name: "ocean-waves.jpg", file_type: "image", file_size: 1900000, width: 800, height: 530, storage_path: "", url: "https://picsum.photos/seed/ocean10/800/530", thumbnail_url: null, uploaded_by: "", created_at: "2024-10-05T15:45:00Z", isDummy: true, tags: ["Ocean", "Waves", "Blue"] },
  { id: "dummy-11", workspace_id: "", folder_id: null, file_name: "minimalist-desk.jpg", file_type: "image", file_size: 750000, width: 500, height: 400, storage_path: "", url: "https://picsum.photos/seed/desk11/500/400", thumbnail_url: null, uploaded_by: "", created_at: "2024-09-30T12:00:00Z", isDummy: true, tags: ["Minimal", "Workspace"] },
  { id: "dummy-12", workspace_id: "", folder_id: null, file_name: "testimonial-reel.mp4", file_type: "video", file_size: 18000000, width: 1080, height: 1080, storage_path: "", url: "https://picsum.photos/seed/reel12/500/500", thumbnail_url: null, uploaded_by: "", created_at: "2024-09-25T09:30:00Z", isDummy: true, tags: ["Testimonial", "UGC"] },
];

// ─── Adgroup Dummy Data ─────────────────────────────────────────────────────────

interface DummyAdgroup {
  id: string;
  pageName: string;
  pageAvatar: string;
  type: "Static";
  primaryText: string;
  media: { url: string; type: "image" | "video" };
  secondaryText: string;
}

const DUMMY_ADGROUPS: DummyAdgroup[] = [
  { id: "ag-1", pageName: "FitLife Supplements", pageAvatar: "https://picsum.photos/seed/face1/80/80", type: "Static", primaryText: "💪 Get 20% off our premium whey protein! Limited time offer for new customers. Build muscle faster with clean ingredients.", media: { url: "https://picsum.photos/seed/ad1/500/500", type: "image" }, secondaryText: "Shop now and save big on your fitness journey. Free shipping on orders over $50." },
  { id: "ag-2", pageName: "Urban Style Co.", pageAvatar: "https://picsum.photos/seed/face2/80/80", type: "Static", primaryText: "🔥 New arrivals just dropped! Check out our latest streetwear collection. Stand out from the crowd.", media: { url: "https://picsum.photos/seed/ad2/600/400", type: "image" }, secondaryText: "Express your unique style with our exclusive designs. Available in all sizes." },
  { id: "ag-3", pageName: "TechGadget Pro", pageAvatar: "https://picsum.photos/seed/face3/80/80", type: "Static", primaryText: "📱 The all-new SmartWatch X5 is here. Track your health, stay connected, look great.", media: { url: "https://picsum.photos/seed/ad3/500/700", type: "image" }, secondaryText: "Pre-order now and get a free charging dock. Limited stock available." },
  { id: "ag-4", pageName: "Green Earth Organics", pageAvatar: "https://picsum.photos/seed/face4/80/80", type: "Static", primaryText: "🌿 100% organic, farm-to-table goodness. Subscribe to our weekly veggie box and eat fresh every day.", media: { url: "https://picsum.photos/seed/ad4/600/600", type: "video" }, secondaryText: "Join 10,000+ families eating healthier. Cancel anytime, no commitment." },
  { id: "ag-5", pageName: "DreamHome Realty", pageAvatar: "https://picsum.photos/seed/face5/80/80", type: "Static", primaryText: "🏠 Find your dream home today! Browse 500+ listings in your area. Virtual tours available.", media: { url: "https://picsum.photos/seed/ad5/700/450", type: "image" }, secondaryText: "Get pre-approved in minutes. Our agents are ready to help you move." },
  { id: "ag-6", pageName: "PetPaws Plus", pageAvatar: "https://picsum.photos/seed/face6/80/80", type: "Static", primaryText: "🐾 Your pets deserve the best! Premium pet food made with real ingredients, no fillers.", media: { url: "https://picsum.photos/seed/ad6/500/500", type: "image" }, secondaryText: "Free sample pack with your first order. Vet recommended formula." },
  { id: "ag-7", pageName: "LearnCode Academy", pageAvatar: "https://picsum.photos/seed/face7/80/80", type: "Static", primaryText: "👨‍💻 Master coding in 90 days. Our bootcamp has a 95% job placement rate. Start your tech career now.", media: { url: "https://picsum.photos/seed/ad7/500/600", type: "video" }, secondaryText: "Flexible online schedule. Mentorship included. Payment plans available." },
  { id: "ag-8", pageName: "SunGlow Skincare", pageAvatar: "https://picsum.photos/seed/face8/80/80", type: "Static", primaryText: "✨ Glow up with our new vitamin C serum. Dermatologist tested, visible results in 2 weeks.", media: { url: "https://picsum.photos/seed/ad8/450/550", type: "image" }, secondaryText: "Cruelty-free and vegan. Use code GLOW25 for 25% off." },
];

// ─── Helpers ────────────────────────────────────────────────────────────────────

function formatSize(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

type DisplayAsset = (CreativeAsset & { isDummy?: false; tags?: string[] }) | DummyAsset;

// ─── Segmented Control Component ────────────────────────────────────────────────

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  labels,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  labels: Record<T, string>;
}) {
  return (
    <div className="flex items-center rounded-full border border-border bg-muted/40 p-0.5">
      {options.map((v) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={`px-3 py-1 text-xs font-medium rounded-full transition-all ${
            value === v
              ? "bg-[hsl(68,100%,45%)] text-black shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {labels[v]}
        </button>
      ))}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export default function CreativeLibrary() {
  const { user, role } = useAuth();
  const isReadOnly = role === "member";

  // Shared state
  const [activeTab, setActiveTab] = useState("media");
  const [search, setSearch] = useState("");
  const [searchMode, setSearchMode] = useState<"text" | "tag">("text");
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [ownerFilter, setOwnerFilter] = useState<"all" | "mine" | "favourites">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<DisplayAsset | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [propertiesTarget, setPropertiesTarget] = useState<DisplayAsset | null>(null);
  const [dragging, setDragging] = useState(false);

  // Adgroup state
  const [adgroupBookmarks, setAdgroupBookmarks] = useState<Set<string>>(new Set());
  const [selectedAdgroups, setSelectedAdgroups] = useState<Set<string>>(new Set());
  const [adgroupLaunchOpen, setAdgroupLaunchOpen] = useState(false);
  const [adgroupLaunchItems, setAdgroupLaunchItems] = useState<AdgroupLaunchItem[]>([]);
  // Folder state
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [folderFormOpen, setFolderFormOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<any>(null);
  const [moveToFolderItem, setMoveToFolderItem] = useState<{ id: string; type: "media" | "adgroup" } | null>(null);

  const { data: folders = [] } = useClFolders();
  const { data: folderStats } = useClFolderStats();
  const createFolder = useCreateClFolder();
  const updateFolder = useUpdateClFolder();
  const reorderFolders = useReorderClFolders();

  const handleReorderFolders = useCallback((reordered: any[]) => {
    const items = reordered.map((f: any, i: number) => ({ id: f.id, sort_order: i + 1 }));
    reorderFolders.mutate(items);
  }, [reorderFolders]);

  const selectedFolder = useMemo(() => folders.find((f) => f.id === selectedFolderId) || null, [folders, selectedFolderId]);

  // ─── Filter state ─────────────────────────────────────────────────────────────
  const [selectedFolderFilters, setSelectedFolderFilters] = useState<Set<string>>(new Set());
  const [selectedOfferFilters, setSelectedOfferFilters] = useState<Set<string>>(new Set());

  const workspaceId = useWorkspace();
  const { data: offers = [] } = useOffers(workspaceId);
  const { data: offerFolderLinks = [] } = useOfferFolderLinks();
  const folderFilterIds = useMemo(() => [...selectedFolderFilters], [selectedFolderFilters]);
  const { data: allowedItemIds } = useFilteredFolderItemIds(folderFilterIds);

  const handleFolderFilterToggle = useCallback((folderId: string) => {
    setSelectedFolderFilters((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId); else next.add(folderId);
      return next;
    });
  }, []);

  const handleOfferFilterToggle = useCallback((offerId: string) => {
    setSelectedOfferFilters((prev) => {
      const next = new Set(prev);
      if (next.has(offerId)) {
        next.delete(offerId);
      } else {
        next.add(offerId);
        // Auto-select linked folders
        const linkedFolderIds = offerFolderLinks
          .filter((l) => l.offer_id === offerId)
          .map((l) => l.cl_folder_id);
        if (linkedFolderIds.length > 0) {
          setSelectedFolderFilters((fp) => {
            const fn = new Set(fp);
            linkedFolderIds.forEach((id) => fn.add(id));
            return fn;
          });
        }
      }
      return next;
    });
  }, [offerFolderLinks]);

  const clearAllFilters = useCallback(() => {
    setSelectedFolderFilters(new Set());
    setSelectedOfferFilters(new Set());
  }, []);

  const hasActiveFilters = selectedFolderFilters.size > 0 || selectedOfferFilters.size > 0;

  // Reset filters when entering a folder view
  const handleSelectFolder = useCallback((id: string | null) => {
    setSelectedFolderId(id);
    if (id) clearAllFilters();
  }, [clearAllFilters]);


  const [createAdgroupOpen, setCreateAdgroupOpen] = useState(false);
  const [adgroupPropsTarget, setAdgroupPropsTarget] = useState<any>(null);

  const uploadInputRef = useRef<HTMLInputElement>(null);

  const { data: assets, isLoading } = useCreativeAssets();
  const { upload, uploading, progress } = useUploadCreativeAsset();
  const deleteAsset = useDeleteCreativeAsset();

  // Real adgroup data
  const { data: realAdgroups } = useClAdgroups();
  const { data: realHeadlines } = useTextItems("headline");
  const { data: realPrimaryTexts } = useTextItems("primary_text");
  const { data: realDescs } = useTextItems("description");
  const { data: realMediaAssets } = useCreativeAssets();
  const deleteAdgroup = useDeleteAdgroup();
  const updateAdgroup = useUpdateAdgroup();

  // Merge dummy data when no real assets
  const allAssets: DisplayAsset[] = useMemo(() => {
    const real = (assets || []).map((a) => ({ ...a, isDummy: false as const, tags: [] as string[] }));
    if (real.length > 0) return real;
    return DUMMY_ASSETS;
  }, [assets]);

  // Filtered list for media tab
  const filtered = useMemo(() => {
    let list = allAssets;
    list = list.filter((a) => a.file_type === mediaType);
    if (ownerFilter === "mine" && user) list = list.filter((a) => a.uploaded_by === user.id);
    if (ownerFilter === "favourites") list = [];
    if (search) {
      const q = search.toLowerCase();
      if (searchMode === "text") {
        list = list.filter((a) => a.file_name.toLowerCase().includes(q));
      } else {
        list = list.filter((a) => (a.tags || []).some((t) => t.toLowerCase().includes(q)));
      }
    }
    // Apply folder filter
    if (selectedFolderFilters.size > 0 && allowedItemIds) {
      list = list.filter((a) => allowedItemIds.has(a.id));
    }
    return list;
  }, [allAssets, mediaType, ownerFilter, search, searchMode, user, selectedFolderFilters, allowedItemIds]);

  // Build displayable adgroups from real data + dummy fallback
  const displayAdgroups = useMemo(() => {
    if (realAdgroups && realAdgroups.length > 0) {
      return realAdgroups.map((ag) => {
        const headline = realHeadlines?.find((h) => h.id === ag.headline_id);
        const primaryText = realPrimaryTexts?.find((p) => p.id === ag.primary_text_id);
        const desc = realDescs?.find((d) => d.id === ag.description_id);
        const firstMediaId = ag.media_ids?.[0];
        const mediaAsset = realMediaAssets?.find((m) => m.id === firstMediaId);
        return {
          id: ag.id,
          pageName: ag.page_name || "My Page",
          pageAvatar: ag.page_avatar_url || "",
          type: ag.ad_type as "Static",
          primaryText: primaryText?.text || "",
          media: { url: mediaAsset?.url || "https://picsum.photos/seed/placeholder/500/500", type: (mediaAsset?.file_type === "video" ? "video" : "image") as "image" | "video" },
          secondaryText: desc?.text || "",
          headline: headline?.text,
          destinationUrl: ag.destination_url,
          displayLink: ag.display_link,
          cta: ag.cta,
          isReal: true,
        };
      });
    }
    return DUMMY_ADGROUPS.map((ag) => ({ ...ag, headline: undefined as string | undefined, destinationUrl: undefined as string | undefined, displayLink: undefined as string | undefined, cta: undefined as string | undefined, isReal: false }));
  }, [realAdgroups, realHeadlines, realPrimaryTexts, realDescs, realMediaAssets]);

  // Filtered adgroups
  const filteredAdgroups = useMemo(() => {
    let list = displayAdgroups;
    if (ownerFilter === "favourites") {
      list = list.filter((ag) => adgroupBookmarks.has(ag.id));
    }
    if (search) {
      const q = search.toLowerCase();
      if (searchMode === "text") {
        list = list.filter((ag) => ag.primaryText.toLowerCase().includes(q) || ag.pageName.toLowerCase().includes(q));
      }
    }
    // Apply folder filter
    if (selectedFolderFilters.size > 0 && allowedItemIds) {
      list = list.filter((ag) => allowedItemIds.has(ag.id));
    }
    return list;
  }, [displayAdgroups, search, searchMode, ownerFilter, adgroupBookmarks, selectedFolderFilters, allowedItemIds]);

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const clearSelection = () => setSelected(new Set());

  // Upload handlers
  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList?.length) return;
    try {
      const uploaded = await upload({ files: Array.from(fileList) });
      toast({ title: `${uploaded.length} file(s) uploaded` });
      setUploadOpen(false);
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    }
  };

  const handleDeleteSingle = async () => {
    if (!deleteTarget || deleteTarget.isDummy) return;
    try {
      await deleteAsset.mutateAsync({ id: deleteTarget.id, storage_path: deleteTarget.storage_path });
      toast({ title: "Asset deleted" });
      setDeleteTarget(null);
      setSelected((p) => { const n = new Set(p); n.delete(deleteTarget.id); return n; });
    } catch (err: any) {
      toast({ title: "Delete failed", description: err.message, variant: "destructive" });
    }
  };

  const handleBulkDelete = async () => {
    const toDelete = allAssets.filter((a) => selected.has(a.id) && !a.isDummy);
    let success = 0;
    for (const asset of toDelete) {
      try {
        await deleteAsset.mutateAsync({ id: asset.id, storage_path: asset.storage_path });
        success++;
      } catch { /* continue */ }
    }
    toast({ title: `${success} asset(s) deleted` });
    clearSelection();
    setBulkDeleteOpen(false);
  };

  const handleDownload = (url: string, fileName: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.target = "_blank";
    a.click();
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({ title: "Link copied to clipboard" });
  };

  const toggleAdgroupBookmark = (id: string) => {
    setAdgroupBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        toast({ title: "Removed from favourites" });
      } else {
        next.add(id);
        toast({ title: "Saved to favourites" });
      }
      return next;
    });
  };

  // Drag & drop for upload dialog
  const onDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);
  const onDrop = (e: React.DragEvent) => { e.preventDefault(); setDragging(false); handleUpload(e.dataTransfer.files); };

  // Reset selection on tab change
  const handleTabChange = (val: string) => { clearSelection(); setSelectedAdgroups(new Set()); setActiveTab(val); setSearch(""); };

  const toggleAdgroupSelect = useCallback((id: string) => {
    setSelectedAdgroups((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const buildLaunchItems = useCallback((ids: string[], source: "adgroup" | "media"): AdgroupLaunchItem[] => {
    if (source === "adgroup") {
      return ids.map((id) => {
        const ag = displayAdgroups.find((a) => a.id === id);
        const realAg = realAdgroups?.find((a) => a.id === id);
        const mediaUrls: string[] = [];
        if (realAg?.media_ids) {
          for (const mid of realAg.media_ids) {
            const asset = realMediaAssets?.find((a) => a.id === mid);
            if (asset) mediaUrls.push(asset.url);
          }
        }
        if (mediaUrls.length === 0 && ag?.media.url) mediaUrls.push(ag.media.url);
        return {
          id,
          type: "adgroup" as const,
          primaryText: ag?.primaryText || "",
          headline: ag?.headline || "",
          description: ag?.secondaryText || "",
          cta: ag?.cta || "",
          destinationUrl: ag?.destinationUrl || "",
          displayLink: ag?.displayLink || "",
          mediaUrls,
          mediaType: ag?.media.type || "image",
        };
      });
    }
    // Media items
    return ids.map((id) => {
      const asset = allAssets.find((a) => a.id === id);
      return {
        id,
        type: "media" as const,
        mediaUrls: asset ? [asset.url] : [],
        mediaType: asset?.file_type || "image",
      };
    });
  }, [displayAdgroups, realAdgroups, realMediaAssets, allAssets]);

  const handleLaunchFromAdgroups = useCallback((ids: string[]) => {
    const items = buildLaunchItems(ids, "adgroup");
    setAdgroupLaunchItems(items);
    setAdgroupLaunchOpen(true);
  }, [buildLaunchItems]);

  const handleLaunchFromMedia = useCallback((ids: string[]) => {
    const items = buildLaunchItems(ids, "media");
    setAdgroupLaunchItems(items);
    setAdgroupLaunchOpen(true);
  }, [buildLaunchItems]);

  // ─── Search input with Text|Tag toggle ────────────────────────────────────────
  const SearchInput = (
    <div className="relative flex-1 min-w-[180px] max-w-xs">
      <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 z-10">
        <button
          onClick={() => setSearchMode("text")}
          className={`px-1.5 py-0.5 text-[9px] font-medium rounded-full transition-colors ${searchMode === "text" ? "bg-[hsl(68,100%,45%)] text-black" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
        >
          Text
        </button>
        <button
          onClick={() => setSearchMode("tag")}
          className={`px-1.5 py-0.5 text-[9px] font-medium rounded-full transition-colors ${searchMode === "tag" ? "bg-[hsl(68,100%,45%)] text-black" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
        >
          Tag
        </button>
      </div>
      <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        type="search"
        autoComplete="off"
        data-1p-ignore
        data-lpignore="true"
        placeholder={searchMode === "text" ? "Search by name…" : "Search by tag…"}
        className="pl-[4.5rem] pr-8 h-8 text-xs"
      />
    </div>
  );

  return (
    <TooltipProvider>
    <div className="absolute inset-0 flex flex-row">
      {/* ═══════════ FOLDER SIDEBAR ═══════════ */}
      <FolderListPanel
        folders={folders}
        selectedFolderId={selectedFolderId}
        onSelect={handleSelectFolder}
        onCreateClick={() => { setEditingFolder(null); setFolderFormOpen(true); }}
        isReadOnly={isReadOnly}
        onReorder={handleReorderFolders}
        folderStats={folderStats}
      />

      {/* ═══════════ MAIN CONTENT ═══════════ */}
      {selectedFolder ? (
        <FolderContentsView
          folder={selectedFolder}
          onEdit={() => { setEditingFolder(selectedFolder); setFolderFormOpen(true); }}
          onClose={() => setSelectedFolderId(null)}
          isReadOnly={isReadOnly}
        />
      ) : (
      <div className="flex-1 flex flex-col overflow-hidden">
      <Tabs value={activeTab} className="flex flex-col flex-1 overflow-hidden" onValueChange={handleTabChange}>
        <div className="px-4 border-b border-border">
          <TabsList className="bg-transparent h-auto p-0 gap-0">
            <TabsTrigger value="media" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:font-semibold px-3 py-2 text-xs">
              Media
            </TabsTrigger>
            <TabsTrigger value="adgroup" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:font-semibold px-3 py-2 text-xs">
              Adgroup
            </TabsTrigger>
            <TabsTrigger value="headline" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:font-semibold px-3 py-2 text-xs">
              Headline
            </TabsTrigger>
            <TabsTrigger value="primary-text" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:font-semibold px-3 py-2 text-xs">
              Primary Text
            </TabsTrigger>
            <TabsTrigger value="description" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:font-semibold px-3 py-2 text-xs">
              Description
            </TabsTrigger>
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <TabsTrigger value="audio" disabled className="rounded-none border-b-2 border-transparent px-3 py-2 text-xs opacity-40 cursor-not-allowed">
                    Audio <Badge variant="secondary" className="ml-1 text-[9px] px-1 py-0 h-3.5">Soon</Badge>
                  </TabsTrigger>
                </span>
              </TooltipTrigger>
              <TooltipContent><p>🎵 Audio management is coming soon — stay tuned!</p></TooltipContent>
            </Tooltip>
          </TabsList>
        </div>

        {/* ═══════════ MEDIA TAB ═══════════ */}
        <TabsContent value="media" className="mt-0 overflow-hidden data-[state=active]:flex data-[state=active]:flex-1 data-[state=active]:flex-col">
          {/* Toolbar */}
          <div className="flex flex-nowrap items-center gap-3 px-4 py-2.5 border-b border-border">
            {/* LEFT: Search + Sort */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {SearchInput}
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg shrink-0" disabled>
                <ArrowUpDown className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* RIGHT: Filters + Controls */}
            <div className="flex flex-nowrap items-center gap-2 shrink-0">
              <FilterMultiSelect
                label="Offers"
                options={offers.map((o) => ({ id: o.id, name: o.name }))}
                selected={selectedOfferFilters}
                onToggle={handleOfferFilterToggle}
                className="w-[140px] lg:w-[170px] xl:w-[200px]"
              />

              <FilterMultiSelect
                label="Folders"
                options={folders.map((f) => ({ id: f.id, name: f.name }))}
                selected={selectedFolderFilters}
                onToggle={handleFolderFilterToggle}
                className="w-[140px] lg:w-[170px] xl:w-[200px]"
              />

              <SegmentedControl
                options={["image", "video"] as const}
                value={mediaType}
                onChange={(v) => setMediaType(v)}
                labels={{ image: "Images", video: "Videos" }}
              />

              <Button size="sm" className="h-8 text-xs rounded-lg" disabled={isReadOnly || uploading} onClick={() => setUploadOpen(true)}>
                <Upload className="h-3.5 w-3.5 mr-1" /> Upload
              </Button>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex items-center gap-1 px-4 py-1.5 border-b border-border">
              <button onClick={clearAllFilters} className="text-[10px] text-muted-foreground hover:text-foreground underline">
                Clear all filters
              </button>
            </div>
          )}

          {/* Upload progress */}
          {uploading && (
            <div className="px-4 pt-2">
              <Progress value={progress} className="h-1.5" />
              <p className="text-[10px] text-muted-foreground mt-0.5">Uploading…</p>
            </div>
          )}

          {/* Bulk action bar */}
          {selected.size > 0 && (
            <div className="flex items-center gap-3 px-4 py-2 bg-muted/50 border-b border-border">
              <span className="text-xs font-medium text-foreground">{selected.size} media selected</span>
              <div className="flex-1" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <span><Button variant="outline" size="sm" className="h-7 text-xs" disabled><Sparkles className="h-3 w-3 mr-1" /> Send to Genie</Button></span>
                </TooltipTrigger>
                <TooltipContent><p>✨ Send to Genie — coming soon!</p></TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span><Button variant="outline" size="sm" className="h-7 text-xs" disabled><Download className="h-3 w-3 mr-1" /> Download</Button></span>
                </TooltipTrigger>
                <TooltipContent><p>📦 Bulk download — coming soon!</p></TooltipContent>
              </Tooltip>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleLaunchFromMedia([...selected])}>
                <Rocket className="h-3 w-3 mr-1" /> Launch Adgroup
              </Button>
              <Button variant="destructive" size="sm" className="h-7 text-xs" disabled={isReadOnly || deleteAsset.isPending} onClick={() => setBulkDeleteOpen(true)}>
                <Trash2 className="h-3 w-3 mr-1" /> Delete
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={clearSelection}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}

          {/* Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Upload className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">No assets found</p>
                <p className="text-xs text-muted-foreground mt-1">Try adjusting your filters or upload new creatives.</p>
              </div>
            ) : (
              <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6 gap-3 space-y-0">
                {filtered.map((asset) => {
                  const isChecked = selected.has(asset.id);
                  const isVideo = asset.file_type === "video";
                  return (
                    <div
                      key={asset.id}
                      className={`break-inside-avoid mb-3 group relative rounded-xl border overflow-hidden transition-all hover:shadow-sm ${isChecked ? "border-primary ring-2 ring-primary/30" : "border-border/60 hover:border-muted-foreground/40"}`}
                    >
                      <div className="relative cursor-pointer" onClick={() => toggleSelect(asset.id)}>
                        <img src={asset.url} alt={asset.file_name} className="w-full h-auto block bg-muted" loading="lazy" />
                        {isVideo && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="h-10 w-10 rounded-full bg-background/80 flex items-center justify-center">
                              <Play className="h-5 w-5 text-foreground fill-foreground" />
                            </div>
                          </div>
                        )}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent px-2.5 pb-2 pt-6">
                          <p className="text-[11px] text-white truncate font-medium">{asset.file_name}</p>
                        </div>
                        <div className={`absolute top-2 left-2 transition-opacity duration-150 ${isChecked ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                          <Checkbox checked={isChecked} onCheckedChange={() => toggleSelect(asset.id)} className="h-5 w-5 rounded bg-white/80 backdrop-blur-sm border-border/50" />
                        </div>
                        <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                          <button className="h-7 w-7 rounded-md bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors"
                            onClick={(e) => { e.stopPropagation(); toast({ title: "Bookmarks coming soon" }); }}>
                            <Bookmark className="h-3.5 w-3.5 text-foreground" />
                          </button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <button className="h-7 w-7 rounded-md bg-white/80 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors">
                                <MoreVertical className="h-3.5 w-3.5 text-foreground" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              <DropdownMenuItem onClick={() => handleDownload(asset.url, asset.file_name)}>
                                <Download className="h-4 w-4 mr-2" /> Download
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleCopyLink(asset.url)}>
                                <Link2 className="h-4 w-4 mr-2" /> Copy Link
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setPropertiesTarget(asset)}>
                                <Layers className="h-4 w-4 mr-2" /> Properties
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setMoveToFolderItem({ id: asset.id, type: "media" })}>
                                <FolderPlus className="h-4 w-4 mr-2" /> Add to folder
                              </DropdownMenuItem>
                              {!asset.isDummy && (
                                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setDeleteTarget(asset)}>
                                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      {asset.tags && asset.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 px-2.5 py-1.5">
                          {asset.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-[9px] px-2 py-0.5 font-normal rounded-full">{tag}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ═══════════ ADGROUP TAB ═══════════ */}
        <TabsContent value="adgroup" className="mt-0 overflow-hidden data-[state=active]:flex data-[state=active]:flex-1 data-[state=active]:flex-col">
          {/* Toolbar */}
          <div className="flex flex-nowrap items-center gap-3 px-4 py-2.5 border-b border-border">
            {/* LEFT: Search + Sort */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {SearchInput}
              <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg shrink-0" disabled>
                <ArrowUpDown className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* RIGHT: Filters + Controls */}
            <div className="flex flex-nowrap items-center gap-2 shrink-0">
              <FilterMultiSelect
                label="Offers"
                options={offers.map((o) => ({ id: o.id, name: o.name }))}
                selected={selectedOfferFilters}
                onToggle={handleOfferFilterToggle}
                className="w-[140px] lg:w-[170px] xl:w-[200px]"
              />

              <FilterMultiSelect
                label="Folders"
                options={folders.map((f) => ({ id: f.id, name: f.name }))}
                selected={selectedFolderFilters}
                onToggle={handleFolderFilterToggle}
                className="w-[140px] lg:w-[170px] xl:w-[200px]"
              />

              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <Button variant="outline" size="sm" className="h-8 text-xs rounded-lg" disabled>
                      <CloudUpload className="h-3.5 w-3.5 mr-1" /> Import from FB ad account
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent><p>📥 Import from FB ad account — coming soon!</p></TooltipContent>
              </Tooltip>

              <Button size="sm" className="h-8 text-xs rounded-lg" disabled={isReadOnly} onClick={() => setCreateAdgroupOpen(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Create new
              </Button>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex items-center gap-1 px-4 py-1.5 border-b border-border">
              <button onClick={clearAllFilters} className="text-[10px] text-muted-foreground hover:text-foreground underline">
                Clear all filters
              </button>
            </div>
          )}

          {/* Adgroup Bulk action bar */}
          {selectedAdgroups.size > 0 && (
            <div className="flex items-center gap-3 px-4 py-2 bg-muted/50 border-b border-border">
              <span className="text-xs font-medium text-foreground">{selectedAdgroups.size} adgroup{selectedAdgroups.size !== 1 ? "s" : ""} selected</span>
              <div className="flex-1" />
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleLaunchFromAdgroups([...selectedAdgroups])}>
                <Rocket className="h-3 w-3 mr-1" /> Launch Adgroup
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedAdgroups(new Set())}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}

          {/* Adgroup Grid */}
          <div className="flex-1 overflow-y-auto p-4">
            {filteredAdgroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Layers className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-sm font-medium text-muted-foreground">No adgroups found</p>
                <p className="text-xs text-muted-foreground mt-1">Try adjusting your search or filters.</p>
              </div>
            ) : (
              <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6 gap-3 space-y-0">
                {filteredAdgroups.map((ag) => {
                  const isBookmarked = adgroupBookmarks.has(ag.id);
                  const isVideo = ag.media.type === "video";
                  const isAgSelected = selectedAdgroups.has(ag.id);

                  const AdgroupMenu = (
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem onClick={() => toggleAdgroupBookmark(ag.id)}>
                        <BookmarkCheck className="h-4 w-4 mr-2" /> {isBookmarked ? "Remove favourite" : "Save to favourites"}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownload(ag.media.url, `${ag.pageName}-ad.jpg`)}>
                        <Download className="h-4 w-4 mr-2" /> Download
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setMoveToFolderItem({ id: ag.id, type: "adgroup" })}>
                        <FolderPlus className="h-4 w-4 mr-2" /> Add to folder
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleLaunchFromAdgroups([ag.id]); }}>
                        <Rocket className="h-4 w-4 mr-2" /> Launch Adgroup
                      </DropdownMenuItem>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <DropdownMenuItem disabled><Copy className="h-4 w-4 mr-2" /> Duplicate</DropdownMenuItem>
                        </TooltipTrigger>
                        <TooltipContent side="left"><p>Coming Soon</p></TooltipContent>
                      </Tooltip>
                      {ag.isReal && (
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => {
                          deleteAdgroup.mutateAsync(ag.id).then(() => toast({ title: "Adgroup deleted" }));
                        }}>
                          <Trash className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      )}
                      {!ag.isReal && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <DropdownMenuItem disabled className="text-destructive"><Trash className="h-4 w-4 mr-2" /> Delete</DropdownMenuItem>
                          </TooltipTrigger>
                          <TooltipContent side="left"><p>Coming Soon</p></TooltipContent>
                        </Tooltip>
                      )}
                    </DropdownMenuContent>
                  );

                  return (
                    <div key={ag.id} className={`break-inside-avoid mb-3 rounded-xl border overflow-hidden bg-card hover:shadow-sm transition-all cursor-pointer group ${isAgSelected ? "border-primary ring-2 ring-primary/30" : "border-border/60"}`}
                      onClick={() => setAdgroupPropsTarget({
                        id: ag.id,
                        pageName: ag.pageName,
                        pageAvatar: ag.pageAvatar,
                        type: ag.type,
                        primaryText: ag.primaryText,
                        mediaUrl: ag.media.url,
                        mediaType: ag.media.type,
                        headline: ag.headline,
                        description: ag.secondaryText,
                        destinationUrl: ag.destinationUrl,
                        cta: ag.cta,
                      })}>
                      {/* Header */}
                      <div className="flex items-center gap-2 px-2.5 py-1.5">
                        <div className={`transition-opacity duration-150 ${isAgSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                          <Checkbox checked={isAgSelected} onCheckedChange={(e) => { toggleAdgroupSelect(ag.id); }} onClick={(e) => e.stopPropagation()} className="h-4 w-4 rounded bg-background border-border/50" />
                        </div>
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={ag.pageAvatar} alt={ag.pageName} />
                          <AvatarFallback className="text-[10px]">{ag.pageName[0]}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium text-foreground truncate flex-1">{ag.pageName}</span>
                        <Badge variant="secondary" className="text-[9px] px-1.5 py-0 shrink-0 h-4">{ag.type}</Badge>
                        <button onClick={(e) => { e.stopPropagation(); toggleAdgroupBookmark(ag.id); }} className="h-6 w-6 rounded-md flex items-center justify-center hover:bg-muted transition-colors shrink-0">
                          <Bookmark className={`h-3 w-3 ${isBookmarked ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                        </button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <button className="h-6 w-6 rounded-md flex items-center justify-center hover:bg-muted transition-colors shrink-0">
                              <MoreVertical className="h-3 w-3 text-muted-foreground" />
                            </button>
                          </DropdownMenuTrigger>
                          {AdgroupMenu}
                        </DropdownMenu>
                      </div>

                      {/* Primary text */}
                      <div className="px-2.5 pb-1.5">
                        <p className="text-xs text-foreground line-clamp-2">{ag.primaryText}</p>
                      </div>

                      {/* Media */}
                      <div className="relative">
                        <img src={ag.media.url} alt="" className="w-full h-auto block bg-muted" loading="lazy" />
                        {isVideo && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="h-10 w-10 rounded-full bg-background/80 flex items-center justify-center">
                              <Play className="h-5 w-5 text-foreground fill-foreground" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Secondary text */}
                      <div className="px-2.5 py-1.5">
                        <p className="text-[11px] text-muted-foreground line-clamp-2">{ag.secondaryText}</p>
                      </div>

                      {/* Bottom action bar */}
                      <div className="flex items-center justify-between px-1.5 py-1 border-t border-border/60">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); toggleAdgroupBookmark(ag.id); }}>
                          <Bookmark className={`h-3.5 w-3.5 ${isBookmarked ? "fill-primary text-primary" : ""}`} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleDownload(ag.media.url, `${ag.pageName}-ad.jpg`); }}>
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span><Button variant="ghost" size="icon" className="h-7 w-7" disabled><Shuffle className="h-3.5 w-3.5" /></Button></span>
                          </TooltipTrigger>
                          <TooltipContent><p>Coming Soon</p></TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span><Button variant="ghost" size="icon" className="h-7 w-7" disabled><Sparkles className="h-3.5 w-3.5" /></Button></span>
                          </TooltipTrigger>
                          <TooltipContent><p>Coming Soon</p></TooltipContent>
                        </Tooltip>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          {AdgroupMenu}
                        </DropdownMenu>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </TabsContent>

        {/* ═══════════ TEXT TABS ═══════════ */}
        <TabsContent value="headline" className="mt-0 overflow-hidden data-[state=active]:flex data-[state=active]:flex-1 data-[state=active]:flex-col">
          <TextItemList type="headline" isReadOnly={isReadOnly} />
        </TabsContent>
        <TabsContent value="primary-text" className="mt-0 overflow-hidden data-[state=active]:flex data-[state=active]:flex-1 data-[state=active]:flex-col">
          <TextItemList type="primary_text" isReadOnly={isReadOnly} />
        </TabsContent>
        <TabsContent value="description" className="mt-0 overflow-hidden data-[state=active]:flex data-[state=active]:flex-1 data-[state=active]:flex-col">
          <TextItemList type="description" isReadOnly={isReadOnly} />
        </TabsContent>
        <TabsContent value="audio" className="mt-0">
          <ComingSoonPlaceholder icon={Music} title="Audio" description="Manage your audio creatives in one place." />
        </TabsContent>
      </Tabs>
      </div>
      )}

      {/* ═══════════ CREATE ADGROUP MODAL ═══════════ */}
      <CreateAdgroupModal open={createAdgroupOpen} onOpenChange={setCreateAdgroupOpen} />

      {/* ═══════════ ADGROUP LAUNCH MODAL ═══════════ */}
      <AdgroupLaunchModal
        open={adgroupLaunchOpen}
        onOpenChange={(o) => { setAdgroupLaunchOpen(o); if (!o) { setSelectedAdgroups(new Set()); clearSelection(); } }}
        items={adgroupLaunchItems}
      />

      {/* ═══════════ ADGROUP PROPERTIES MODAL ═══════════ */}
      <AdgroupPropertiesModal
        adgroup={adgroupPropsTarget}
        open={!!adgroupPropsTarget}
        onOpenChange={(o) => { if (!o) setAdgroupPropsTarget(null); }}
        onDelete={(id) => {
          const ag = displayAdgroups.find((a) => a.id === id);
          if (ag?.isReal) {
            deleteAdgroup.mutateAsync(id).then(() => toast({ title: "Adgroup deleted" }));
          }
        }}
      />

      {/* ═══════════ UPLOAD DIALOG ═══════════ */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Media</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => uploadInputRef.current?.click()}
              className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-10 px-4 cursor-pointer transition-colors ${dragging ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/40"}`}
            >
              <CloudUpload className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm font-medium text-foreground">Click or drag file to this area to upload</p>
              <p className="text-xs text-muted-foreground mt-1">Support for single or bulk upload</p>
            </div>
            <input ref={uploadInputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={(e) => handleUpload(e.target.files)} />

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-foreground">Category</label>
                <Input placeholder="Select categories…" disabled className="mt-1 h-9" />
                <p className="text-[10px] text-muted-foreground mt-0.5">Coming soon</p>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Platform</label>
                <Input placeholder="Facebook, TikTok…" disabled className="mt-1 h-9" />
                <p className="text-[10px] text-muted-foreground mt-0.5">Coming soon</p>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Tags</label>
                <Input placeholder="Add tags…" disabled className="mt-1 h-9" />
                <p className="text-[10px] text-muted-foreground mt-0.5">Coming soon</p>
              </div>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <Checkbox disabled /> Override AI metadata <span className="text-[10px]">(Coming soon)</span>
              </label>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button disabled={uploading} onClick={() => uploadInputRef.current?.click()}>
              {uploading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
              Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══════════ PROPERTIES DIALOG ═══════════ */}
      <Dialog open={!!propertiesTarget} onOpenChange={(o) => { if (!o) setPropertiesTarget(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Properties</DialogTitle>
          </DialogHeader>
          {propertiesTarget && (
            <div className="space-y-3 text-sm">
              <div className="rounded-lg overflow-hidden border border-border">
                <img src={propertiesTarget.url} alt="" className="w-full h-auto max-h-48 object-contain bg-muted" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-muted-foreground text-xs">File Name</span><p className="font-medium text-foreground truncate">{propertiesTarget.file_name}</p></div>
                <div><span className="text-muted-foreground text-xs">Type</span><p className="font-medium text-foreground capitalize">{propertiesTarget.file_type}</p></div>
                {propertiesTarget.width && propertiesTarget.height && (
                  <div><span className="text-muted-foreground text-xs">Dimensions</span><p className="font-medium text-foreground">{propertiesTarget.width} × {propertiesTarget.height}</p></div>
                )}
                <div><span className="text-muted-foreground text-xs">File Size</span><p className="font-medium text-foreground">{formatSize(propertiesTarget.file_size)}</p></div>
                <div><span className="text-muted-foreground text-xs">Uploaded</span><p className="font-medium text-foreground">{formatDate(propertiesTarget.created_at)}</p></div>
              </div>
              {propertiesTarget.tags && propertiesTarget.tags.length > 0 && (
                <div>
                  <span className="text-muted-foreground text-xs">Tags</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {propertiesTarget.tags.map((t) => <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>)}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ═══════════ DELETE DIALOGS ═══════════ */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Asset</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete "{deleteTarget?.file_name}"? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSingle} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selected.size} Asset{selected.size !== 1 ? "s" : ""}</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete the selected assets. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete All</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ═══════════ FOLDER MODALS ═══════════ */}
      <FolderFormModal
        open={folderFormOpen}
        onOpenChange={setFolderFormOpen}
        folder={editingFolder}
        onSave={async (data) => {
          if (editingFolder) {
            await updateFolder.mutateAsync({ id: editingFolder.id, ...data });
            toast({ title: "Folder updated" });
          } else {
            await createFolder.mutateAsync(data);
            toast({ title: "Folder created" });
          }
        }}
      />

      <MoveToFolderModal
        open={!!moveToFolderItem}
        onOpenChange={(o) => { if (!o) setMoveToFolderItem(null); }}
        itemId={moveToFolderItem?.id || ""}
        itemType={moveToFolderItem?.type || "media"}
      />
    </div>
    </TooltipProvider>
  );
}

// ─── Coming Soon Placeholder ────────────────────────────────────────────────────

function ComingSoonPlaceholder({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-20 text-center">
      <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <Badge variant="secondary" className="mb-2">Coming Soon</Badge>
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-xs">{description}</p>
    </div>
  );
}
