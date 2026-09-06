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
import {
  LIBRARY_MEDIA,
  LIBRARY_ADGROUPS,
  LIBRARY_HEADLINES,
  LIBRARY_PRIMARY_TEXTS,
  LIBRARY_DESCRIPTIONS,
  LIBRARY_BRANDS,
  type LibraryAsset,
  type LibraryAdgroup,
} from "@/mocks/shared/library-items";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import {
  Upload, Search, Trash2, Loader2, MoreVertical, Download, Link2,
  Play, Bookmark, X, Sparkles, Rocket, CloudUpload, Type, AlignLeft, FileText,
  Filter, ArrowUpDown, Shuffle, Plus, Music, Layers, FolderPlus,
  BookmarkCheck, Copy, Trash, Package, Wand2,
} from "lucide-react";
import { TextItemList } from "@/components/creative-library/TextItemList";
import { BrandFilterBar } from "@/components/creative-library/BrandFilterBar";
import { filterByBrand } from "@/mocks/shared/library-items";
import { useSearchParams } from "react-router-dom";
import { SendToGenieMenu } from "@/genie6/flows/SendToGenieMenu";
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

// Media dummy data comes from the central shared mock at
// /src/mocks/shared/library-items.ts so other surfaces (Genie library,
// Industry Insights, Reports) can read from the same pool.
type DummyAsset = LibraryAsset;
const DUMMY_ASSETS: DummyAsset[] = LIBRARY_MEDIA;

// ─── Adgroup Dummy Data ─────────────────────────────────────────────────────────

// Adgroup dummy data also comes from the central shared mock — so a
// Mamaearth adgroup here matches Mamaearth media on the Media tab.
type DummyAdgroup = LibraryAdgroup;
const DUMMY_ADGROUPS: DummyAdgroup[] = LIBRARY_ADGROUPS;

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

type DisplayAsset = (CreativeAsset & { is_dummy?: false; tags?: string[] }) | DummyAsset;

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

  // URL-backed cross-tab brand filter (Maalik: "filter persistence across
  // tab switches"). `?brand=<id>` sticks across Tab changes; `?brand=orphan`
  // shows library/no-brand items.
  const [searchParams] = useSearchParams();
  const urlBrand = searchParams.get("brand");
  const brandFilter: string | null = urlBrand && urlBrand.length > 0 ? urlBrand : null;
  const applyBrandFilter = useCallback(
    <T extends { brand_id?: string | null }>(items: T[]): T[] => {
      if (!brandFilter) return items;
      if (brandFilter === "orphan") {
        return items.filter((it) => it.brand_id == null);
      }
      return items.filter((it) => it.brand_id === brandFilter);
    },
    [brandFilter],
  );

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
  const [moveToFolderItem, setMoveToFolderItem] = useState<{ ids: string[]; type: "media" | "adgroup" } | null>(null);

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

  // Merge dummy data when no real assets, then apply cross-tab brand filter.
  const allAssets: DisplayAsset[] = useMemo(() => {
    const real = (assets || []).map((a) => ({
      ...a,
      is_dummy: false as const,
      tags: [] as string[],
      brand_id: null as string | null, // real items currently have no brand attribution
    }));
    const merged: DisplayAsset[] = real.length > 0 ? real : DUMMY_ASSETS;
    // applyBrandFilter is generic over { brand_id?: string | null }; DisplayAsset
    // is a union whose members don't cleanly satisfy that constraint, so assert
    // the brand_id shape for the call and restore DisplayAsset[] on the result
    // (filtering only ever returns a subset of the same objects).
    return applyBrandFilter(
      merged as { brand_id?: string | null }[],
    ) as DisplayAsset[];
  }, [assets, applyBrandFilter]);

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
          brand_id: null as string | null,
        };
      });
    }
    // Dummy adgroups now follow the same ClAdgroup shape (refs into the
    // shared mock pool) — resolve refs the same way as the real branch.
    return DUMMY_ADGROUPS.map((ag) => {
      const headline = LIBRARY_HEADLINES.find((h) => h.id === ag.headline_id);
      const primaryText = LIBRARY_PRIMARY_TEXTS.find((p) => p.id === ag.primary_text_id);
      const desc = LIBRARY_DESCRIPTIONS.find((d) => d.id === ag.description_id);
      const firstMediaId = ag.media_ids?.[0];
      const mediaAsset = LIBRARY_MEDIA.find((m) => m.id === firstMediaId);
      return {
        id: ag.id,
        pageName: ag.page_name || "My Page",
        pageAvatar: ag.page_avatar_url || "",
        type: ag.ad_type as "Static",
        primaryText: primaryText?.text || "",
        media: {
          url: mediaAsset?.url || "https://picsum.photos/seed/placeholder/500/500",
          type: (mediaAsset?.file_type === "video" ? "video" : "image") as "image" | "video",
        },
        secondaryText: desc?.text || "",
        headline: headline?.text,
        destinationUrl: ag.destination_url ?? undefined,
        displayLink: ag.display_link ?? undefined,
        cta: ag.cta ?? undefined,
        isReal: false,
        brand_id: ag.brand_id,
      };
    });
  }, [realAdgroups, realHeadlines, realPrimaryTexts, realDescs, realMediaAssets]);

  // Filtered adgroups — includes cross-tab brand filter.
  const filteredAdgroups = useMemo(() => {
    let list = displayAdgroups;
    // Cross-tab brand filter (must run BEFORE other filters so the count is right)
    list = applyBrandFilter(list);
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
  }, [displayAdgroups, search, searchMode, ownerFilter, adgroupBookmarks, selectedFolderFilters, allowedItemIds, applyBrandFilter]);

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
    if (!deleteTarget || deleteTarget.is_dummy) return;
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
    const toDelete = allAssets.filter((a) => selected.has(a.id) && !a.is_dummy);
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
      {/* Cross-tab brand filter — URL-backed, persists across tab switches. */}
      <div className="px-4 pt-3">
        <BrandFilterBar />
      </div>
      <Tabs value={activeTab} className="flex flex-col flex-1 overflow-hidden mt-2" onValueChange={handleTabChange}>
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
          {/* ─── Adaptive Toolbar — morphs between default + selection state ─── */}
          <div className="relative h-[52px] shrink-0 border-b border-border overflow-hidden">
            {/* Default state: search / filters / upload — slides left on selection */}
            <div className={`absolute inset-0 flex flex-nowrap items-center gap-3 px-4 transition-all duration-200 ease-out${selected.size > 0 ? " opacity-0 -translate-x-4 pointer-events-none" : ""}`}>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {SearchInput}
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg shrink-0" disabled>
                  <ArrowUpDown className="h-3.5 w-3.5" />
                </Button>
              </div>
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

            {/* Selection state: bulk actions — slides in from right */}
            <div className={`absolute inset-0 flex items-center gap-2 px-4 transition-all duration-200 ease-out${selected.size === 0 ? " opacity-0 translate-x-4 pointer-events-none" : ""}`}>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={clearSelection}>
                <X className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs font-medium text-foreground shrink-0">{selected.size} selected</span>
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
                <TooltipContent><p className="inline-flex items-center gap-1"><Package className="h-3 w-3" strokeWidth={2} aria-hidden /> Bulk download — coming soon!</p></TooltipContent>
              </Tooltip>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleLaunchFromMedia([...selected])}>
                <Rocket className="h-3 w-3 mr-1" /> Launch Adgroup
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setMoveToFolderItem({ ids: [...selected], type: "media" })}>
                <FolderPlus className="h-3 w-3 mr-1" /> Move to Folder
              </Button>
              <Button variant="destructive" size="sm" className="h-7 text-xs" disabled={isReadOnly || deleteAsset.isPending} onClick={() => setBulkDeleteOpen(true)}>
                <Trash2 className="h-3 w-3 mr-1" /> Delete
              </Button>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex items-center gap-1 px-4 py-1.5 border-b border-border shrink-0">
              <button onClick={clearAllFilters} className="text-[10px] text-muted-foreground hover:text-foreground underline">
                Clear all filters
              </button>
            </div>
          )}

          {/* Upload progress */}
          {uploading && (
            <div className="px-4 pt-2 shrink-0">
              <Progress value={progress} className="h-1.5" />
              <p className="text-[10px] text-muted-foreground mt-0.5">Uploading…</p>
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
                              <DropdownMenuItem onClick={() => setMoveToFolderItem({ ids: [asset.id], type: "media" })}>
                                <FolderPlus className="h-4 w-4 mr-2" /> Add to folder
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {/* §7.6 — a single Ad (this media asset) redirects
                                  into Genie; folders never do. §7.6 also says
                                  non-Genie assets (uploaded/imported/pinned)
                                  get the SAME actions as Genie-made ones — no
                                  gate on `asset.source` here. SendToGenieMenu's
                                  own action list for "creative-library"
                                  already includes "Send to Other Apps" (§6
                                  Rule 6) — no separate item needed here. */}
                              <SendToGenieMenu
                                module="creative-library"
                                refId={asset.id}
                                align="end"
                                trigger={
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <Wand2 className="h-4 w-4 mr-2" /> Send to Genie
                                  </DropdownMenuItem>
                                }
                              />
                              {!asset.is_dummy && (
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
          {/* ─── Adaptive Toolbar — morphs between default + selection state ─── */}
          <div className="relative h-[52px] shrink-0 border-b border-border overflow-hidden">
            {/* Default state: search / filters / create — slides left on selection */}
            <div className={`absolute inset-0 flex flex-nowrap items-center gap-3 px-4 transition-all duration-200 ease-out${selectedAdgroups.size > 0 ? " opacity-0 -translate-x-4 pointer-events-none" : ""}`}>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {SearchInput}
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg shrink-0" disabled>
                  <ArrowUpDown className="h-3.5 w-3.5" />
                </Button>
              </div>
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

            {/* Selection state: bulk actions — slides in from right */}
            <div className={`absolute inset-0 flex items-center gap-2 px-4 transition-all duration-200 ease-out${selectedAdgroups.size === 0 ? " opacity-0 translate-x-4 pointer-events-none" : ""}`}>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setSelectedAdgroups(new Set())}>
                <X className="h-3.5 w-3.5" />
              </Button>
              <span className="text-xs font-medium text-foreground shrink-0">
                {selectedAdgroups.size} adgroup{selectedAdgroups.size !== 1 ? "s" : ""} selected
              </span>
              <div className="flex-1" />
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleLaunchFromAdgroups([...selectedAdgroups])}>
                <Rocket className="h-3 w-3 mr-1" /> Launch Adgroup
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setMoveToFolderItem({ ids: [...selectedAdgroups], type: "adgroup" })}>
                <FolderPlus className="h-3 w-3 mr-1" /> Move to Folder
              </Button>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex items-center gap-1 px-4 py-1.5 border-b border-border shrink-0">
              <button onClick={clearAllFilters} className="text-[10px] text-muted-foreground hover:text-foreground underline">
                Clear all filters
              </button>
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
                      <DropdownMenuItem onClick={() => setMoveToFolderItem({ ids: [ag.id], type: "adgroup" })}>
                        <FolderPlus className="h-4 w-4 mr-2" /> Add to folder
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleLaunchFromAdgroups([ag.id]); }}>
                        <Rocket className="h-4 w-4 mr-2" /> Launch Adgroup
                      </DropdownMenuItem>
                      {/* §7.6 — this adgroup IS the single Ad that redirects
                          into Genie; folders never get this. Same actions
                          regardless of `source` (uploaded/generated/imported).
                          SendToGenieMenu's own "creative-library" action list
                          already includes "Send to Other Apps" (§6 Rule 6). */}
                      <SendToGenieMenu
                        module="creative-library"
                        refId={ag.id}
                        align="end"
                        trigger={
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <Wand2 className="h-4 w-4 mr-2" /> Send to Genie
                          </DropdownMenuItem>
                        }
                      />
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
                            <span onClick={(e) => e.stopPropagation()}>
                              <SendToGenieMenu
                                module="creative-library"
                                refId={ag.id}
                                trigger={
                                  <Button variant="ghost" size="icon" className="h-7 w-7" aria-label="Send to Genie">
                                    <Wand2 className="h-3.5 w-3.5" />
                                  </Button>
                                }
                              />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent><p>Send to Genie</p></TooltipContent>
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
          <TextItemList type="headline" isReadOnly={isReadOnly} brandFilter={brandFilter} />
        </TabsContent>
        <TabsContent value="primary-text" className="mt-0 overflow-hidden data-[state=active]:flex data-[state=active]:flex-1 data-[state=active]:flex-col">
          <TextItemList type="primary_text" isReadOnly={isReadOnly} brandFilter={brandFilter} />
        </TabsContent>
        <TabsContent value="description" className="mt-0 overflow-hidden data-[state=active]:flex data-[state=active]:flex-1 data-[state=active]:flex-col">
          <TextItemList type="description" isReadOnly={isReadOnly} brandFilter={brandFilter} />
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
        itemIds={moveToFolderItem?.ids || []}
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
