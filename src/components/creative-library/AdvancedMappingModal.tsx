import { useState, useCallback, useMemo } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DndContext, pointerWithin, DragOverlay, PointerSensor, useSensor, useSensors,
  type DragStartEvent, type DragEndEvent,
  useDroppable,
} from "@dnd-kit/core";
import {
  SortableContext, rectSortingStrategy, useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical, Plus, X, Copy, Layers, AlertTriangle, ToggleLeft, ToggleRight,
} from "lucide-react";
import type { AdgroupLaunchItem } from "@/hooks/use-adgroup-launch";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface CustomMapping {
  assignments: Record<string, string[]>; // "campaignIdx-adsetIdx" → itemIds[]
  campaigns: number;
  adsetCounts: number[]; // adsets per campaign
}

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  items: AdgroupLaunchItem[];
  campaigns: number;
  adsetsPerCampaign: number;
  adsPerAdset: number;
  onApply: (mapping: CustomMapping) => void;
}

/* Unique instance id for each placed item (supports duplicates) */
interface PlacedItem {
  uid: string;        // unique drag id
  itemId: string;     // original item id
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

let _uid = 0;
const uid = () => `mi_${++_uid}_${Date.now()}`;

function buildIdenticalPerAdset(
  items: AdgroupLaunchItem[],
  campaigns: number,
  adsetsPerCampaign: number,
  adsPerAdset: number,
): { adsets: Record<string, PlacedItem[]>; unassigned: PlacedItem[] } {
  const adsets: Record<string, PlacedItem[]> = {};
  const slotCount = Math.min(adsPerAdset, items.length);
  for (let c = 0; c < campaigns; c++) {
    for (let s = 0; s < adsetsPerCampaign; s++) {
      const key = `${c}-${s}`;
      adsets[key] = [];
      for (let a = 0; a < slotCount; a++) {
        const item = items[a % items.length];
        adsets[key].push({ uid: uid(), itemId: item.id });
      }
    }
  }
  return { adsets, unassigned: [] };
}

function buildEmpty(
  items: AdgroupLaunchItem[],
  campaigns: number,
  adsetsPerCampaign: number,
): { adsets: Record<string, PlacedItem[]>; unassigned: PlacedItem[] } {
  const adsets: Record<string, PlacedItem[]> = {};
  for (let c = 0; c < campaigns; c++) {
    for (let s = 0; s < adsetsPerCampaign; s++) {
      adsets[`${c}-${s}`] = [];
    }
  }
  const unassigned = items.map((i) => ({ uid: uid(), itemId: i.id }));
  return { adsets, unassigned };
}

/* ------------------------------------------------------------------ */
/*  Sortable Card                                                      */
/* ------------------------------------------------------------------ */

function SortableCard({
  placed, item, onDuplicate, onRemove,
}: {
  placed: PlacedItem;
  item: AdgroupLaunchItem | undefined;
  onDuplicate?: () => void;
  onRemove?: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: placed.uid,
  });
  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative flex items-center gap-1.5 rounded-md border border-border bg-card p-1.5 text-xs select-none"
    >
      <button {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground shrink-0">
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <div className="h-8 w-8 rounded border border-border bg-muted overflow-hidden shrink-0">
        {item?.mediaUrls[0] && (
          <img src={item.mediaUrls[0]} alt="" className="h-full w-full object-cover" />
        )}
      </div>
      <span className="truncate max-w-[100px] text-foreground">
        {item?.headline || item?.primaryText || "Ad"}
      </span>
      <div className="ml-auto flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {onDuplicate && (
          <button onClick={onDuplicate} className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground" title="Duplicate">
            <Copy className="h-3 w-3" />
          </button>
        )}
        {onRemove && (
          <button onClick={onRemove} className="p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive" title="Remove">
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Drag overlay card (follows cursor)                                 */
/* ------------------------------------------------------------------ */

function OverlayCard({ item }: { item: AdgroupLaunchItem | undefined }) {
  return (
    <div className="flex items-center gap-1.5 rounded-md border border-primary bg-card p-1.5 text-xs shadow-lg">
      <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
      <div className="h-8 w-8 rounded border border-border bg-muted overflow-hidden shrink-0">
        {item?.mediaUrls[0] && <img src={item.mediaUrls[0]} alt="" className="h-full w-full object-cover" />}
      </div>
      <span className="truncate max-w-[100px]">{item?.headline || item?.primaryText || "Ad"}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Droppable Container                                                */
/* ------------------------------------------------------------------ */

function DroppableContainer({ id, children, label, onRemove, isEmpty, className }: {
  id: string; children: React.ReactNode; label: string;
  onRemove?: () => void; isEmpty?: boolean; className?: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`rounded-lg border-2 border-dashed p-2 min-h-[60px] transition-colors ${
        isOver ? "border-primary bg-primary/5" : isEmpty ? "border-destructive/30 bg-destructive/5" : "border-border bg-muted/30"
      } ${className || ""}`}
    >
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
          {onRemove && (
            <button onClick={onRemove} className="p-0.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive" title="Remove adset">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}
      <div className="flex flex-wrap gap-1.5">
        {children}
      </div>
      {isEmpty && (
        <p className="text-[10px] text-muted-foreground mt-1 italic">Drop items here</p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Modal                                                         */
/* ------------------------------------------------------------------ */

export function AdvancedMappingModal({
  open, onOpenChange, items, campaigns, adsetsPerCampaign, adsPerAdset, onApply,
}: Props) {
  const [adsets, setAdsets] = useState<Record<string, PlacedItem[]>>({});
  const [unassigned, setUnassigned] = useState<PlacedItem[]>([]);
  const [activeUid, setActiveUid] = useState<string | null>(null);
  const [isManualMode, setIsManualMode] = useState(false);

  const itemMap = useMemo(() => {
    const m = new Map<string, AdgroupLaunchItem>();
    items.forEach((i) => m.set(i.id, i));
    return m;
  }, [items]);

  const campaignStructure = useMemo(() => {
    const structure: Record<number, number[]> = {};
    Object.keys(adsets).forEach((key) => {
      const [c, s] = key.split("-").map(Number);
      if (!structure[c]) structure[c] = [];
      if (!structure[c].includes(s)) structure[c].push(s);
    });
    Object.values(structure).forEach((arr) => arr.sort((a, b) => a - b));
    return structure;
  }, [adsets]);

  const campaignCount = useMemo(() => {
    const keys = Object.keys(campaignStructure).map(Number);
    return keys.length > 0 ? Math.max(...keys) + 1 : campaigns;
  }, [campaignStructure, campaigns]);

  const handleOpenChange = useCallback((o: boolean) => {
    if (o) {
      _uid = 0;
      const { adsets: a, unassigned: u } = buildIdenticalPerAdset(items, campaigns, adsetsPerCampaign, adsPerAdset);
      setAdsets(a);
      setUnassigned(u);
      setIsManualMode(false);
      setActiveUid(null);
    }
    onOpenChange(o);
  }, [items, campaigns, adsetsPerCampaign, adsPerAdset, onOpenChange]);

  const handleToggle = useCallback(() => {
    if (isManualMode) {
      const { adsets: a, unassigned: u } = buildIdenticalPerAdset(items, campaigns, adsetsPerCampaign, adsPerAdset);
      setAdsets(a);
      setUnassigned(u);
    } else {
      const { adsets: a, unassigned: u } = buildEmpty(items, campaigns, adsetsPerCampaign);
      setAdsets(a);
      setUnassigned(u);
    }
    setIsManualMode(!isManualMode);
  }, [isManualMode, items, campaigns, adsetsPerCampaign, adsPerAdset]);

  const findContainer = useCallback((uidVal: string): string | null => {
    if (unassigned.some((p) => p.uid === uidVal)) return "unassigned";
    for (const [key, arr] of Object.entries(adsets)) {
      if (arr.some((p) => p.uid === uidVal)) return key;
    }
    return null;
  }, [adsets, unassigned]);

  const activeItem = useMemo(() => {
    if (!activeUid) return undefined;
    const placed = unassigned.find((p) => p.uid === activeUid) ||
      Object.values(adsets).flat().find((p) => p.uid === activeUid);
    return placed ? itemMap.get(placed.itemId) : undefined;
  }, [activeUid, unassigned, adsets, itemMap]);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragStart = (e: DragStartEvent) => setActiveUid(e.active.id as string);

  const handleDragEnd = (e: DragEndEvent) => {
    setActiveUid(null);
    const { active, over } = e;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const fromContainer = findContainer(activeId);
    if (!fromContainer) return;

    let toContainer = findContainer(overId);
    if (!toContainer) {
      if (overId === "unassigned" || adsets[overId]) {
        toContainer = overId;
      } else return;
    }

    if (fromContainer === toContainer) {
      if (fromContainer === "unassigned") {
        setUnassigned((prev) => {
          const oldIdx = prev.findIndex((p) => p.uid === activeId);
          const newIdx = prev.findIndex((p) => p.uid === overId);
          if (oldIdx === -1 || newIdx === -1) return prev;
          const copy = [...prev];
          const [item] = copy.splice(oldIdx, 1);
          copy.splice(newIdx, 0, item);
          return copy;
        });
      } else {
        setAdsets((prev) => {
          const arr = [...(prev[fromContainer] || [])];
          const oldIdx = arr.findIndex((p) => p.uid === activeId);
          const newIdx = arr.findIndex((p) => p.uid === overId);
          if (oldIdx === -1 || newIdx === -1) return prev;
          const [item] = arr.splice(oldIdx, 1);
          arr.splice(newIdx, 0, item);
          return { ...prev, [fromContainer]: arr };
        });
      }
      return;
    }

    let placedItem: PlacedItem | undefined;

    if (fromContainer === "unassigned") {
      const idx = unassigned.findIndex((p) => p.uid === activeId);
      if (idx === -1) return;
      placedItem = unassigned[idx];
      setUnassigned((prev) => prev.filter((p) => p.uid !== activeId));
    } else {
      const arr = adsets[fromContainer] || [];
      const idx = arr.findIndex((p) => p.uid === activeId);
      if (idx === -1) return;
      placedItem = arr[idx];
      setAdsets((prev) => ({
        ...prev,
        [fromContainer]: prev[fromContainer].filter((p) => p.uid !== activeId),
      }));
    }

    if (!placedItem) return;

    if (toContainer === "unassigned") {
      setUnassigned((prev) => [...prev, placedItem!]);
    } else {
      setAdsets((prev) => ({
        ...prev,
        [toContainer!]: [...(prev[toContainer!] || []), placedItem!],
      }));
    }
  };

  const handleDuplicate = (container: string, placed: PlacedItem) => {
    const newPlaced: PlacedItem = { uid: uid(), itemId: placed.itemId };
    if (container === "unassigned") {
      setUnassigned((prev) => {
        const idx = prev.findIndex((p) => p.uid === placed.uid);
        const copy = [...prev];
        copy.splice(idx + 1, 0, newPlaced);
        return copy;
      });
    } else {
      setAdsets((prev) => {
        const arr = [...(prev[container] || [])];
        const idx = arr.findIndex((p) => p.uid === placed.uid);
        arr.splice(idx + 1, 0, newPlaced);
        return { ...prev, [container]: arr };
      });
    }
  };

  const handleRemoveFromAdset = (container: string, placed: PlacedItem) => {
    setAdsets((prev) => ({
      ...prev,
      [container]: prev[container].filter((p) => p.uid !== placed.uid),
    }));
    setUnassigned((prev) => [...prev, placed]);
  };

  const handleAddAdset = (campaignIdx: number) => {
    const existingAdsets = Object.keys(adsets)
      .filter((k) => k.startsWith(`${campaignIdx}-`))
      .map((k) => parseInt(k.split("-")[1]));
    const nextIdx = existingAdsets.length > 0 ? Math.max(...existingAdsets) + 1 : 0;
    setAdsets((prev) => ({ ...prev, [`${campaignIdx}-${nextIdx}`]: [] }));
  };

  const handleRemoveAdset = (key: string) => {
    const items = adsets[key] || [];
    setUnassigned((prev) => [...prev, ...items]);
    setAdsets((prev) => {
      const copy = { ...prev };
      delete copy[key];
      return copy;
    });
  };

  const emptyAdsets = Object.entries(adsets).filter(([, arr]) => arr.length === 0);
  const hasEmptyAdsets = emptyAdsets.length > 0;
  const totalAdsetCount = Object.keys(adsets).length;

  const handleApply = () => {
    const assignments: Record<string, string[]> = {};
    const adsetCountsMap: Record<number, number> = {};

    Object.entries(adsets).forEach(([key, arr]) => {
      assignments[key] = arr.map((p) => p.itemId);
      const campIdx = parseInt(key.split("-")[0]);
      adsetCountsMap[campIdx] = (adsetCountsMap[campIdx] || 0) + 1;
    });

    const maxCamp = Math.max(...Object.keys(adsetCountsMap).map(Number), 0);
    const adsetCounts: number[] = [];
    for (let i = 0; i <= maxCamp; i++) {
      adsetCounts.push(adsetCountsMap[i] || 0);
    }

    onApply({ assignments, campaigns: adsetCounts.length, adsetCounts });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              Advanced Mapping
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggle}
              className="text-xs gap-1.5"
            >
              {isManualMode ? <ToggleRight className="h-3.5 w-3.5" /> : <ToggleLeft className="h-3.5 w-3.5" />}
              {isManualMode ? "Manual Mode" : "Pre-assigned"}
            </Button>
          </div>
        </DialogHeader>

        <DndContext
          sensors={sensors}
          collisionDetection={pointerWithin}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-3 flex-1 min-h-0 overflow-hidden">
            <SortableContext items={unassigned.map((p) => p.uid)} strategy={rectSortingStrategy}>
              <DroppableContainer id="unassigned" label="" isEmpty={unassigned.length === 0} className="w-[220px] shrink-0 flex flex-col overflow-auto">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    Unassigned
                  </span>
                  {unassigned.length > 0 && (
                    <Badge variant="secondary" className="text-[10px] h-4">{unassigned.length}</Badge>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {unassigned.map((p) => (
                    <SortableCard
                      key={p.uid}
                      placed={p}
                      item={itemMap.get(p.itemId)}
                      onDuplicate={() => handleDuplicate("unassigned", p)}
                    />
                  ))}
                </div>
              </DroppableContainer>
            </SortableContext>

            <ScrollArea className="flex-1">
              <div className="space-y-4 pr-2">
                {Array.from({ length: campaignCount }, (_, c) => {
                  const adsetKeys = Object.keys(adsets)
                    .filter((k) => k.startsWith(`${c}-`))
                    .sort((a, b) => parseInt(a.split("-")[1]) - parseInt(b.split("-")[1]));

                  return (
                    <div key={c} className="space-y-2">
                      <h4 className="text-xs font-semibold text-foreground">Campaign {c + 1}</h4>
                      {adsetKeys.map((key) => {
                        const arr = adsets[key] || [];
                        const adsetIdx = parseInt(key.split("-")[1]);
                        return (
                          <SortableContext key={key} items={arr.map((p) => p.uid)} strategy={rectSortingStrategy}>
                            <DroppableContainer
                              id={key}
                              label={`Adset ${adsetIdx + 1} (${arr.length} ads)`}
                              onRemove={adsetKeys.length > 1 ? () => handleRemoveAdset(key) : undefined}
                              isEmpty={arr.length === 0}
                            >
                              {arr.map((p) => (
                                <SortableCard
                                  key={p.uid}
                                  placed={p}
                                  item={itemMap.get(p.itemId)}
                                  onDuplicate={() => handleDuplicate(key, p)}
                                  onRemove={() => handleRemoveFromAdset(key, p)}
                                />
                              ))}
                            </DroppableContainer>
                          </SortableContext>
                        );
                      })}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs gap-1 text-muted-foreground h-7"
                        onClick={() => handleAddAdset(c)}
                      >
                        <Plus className="h-3 w-3" /> Add Adset
                      </Button>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          <DragOverlay>
            {activeUid ? <OverlayCard item={activeItem} /> : null}
          </DragOverlay>
        </DndContext>

        <div className="space-y-1">
          {unassigned.length > 0 && (
            <p className="text-xs flex items-center gap-1.5 text-accent-foreground">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              {unassigned.length} item{unassigned.length !== 1 ? "s" : ""} remain unassigned
            </p>
          )}
          {hasEmptyAdsets && (
            <p className="text-xs flex items-center gap-1.5 text-destructive">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              {emptyAdsets.length} adset{emptyAdsets.length !== 1 ? "s" : ""} ha{emptyAdsets.length !== 1 ? "ve" : "s"} no ads
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleApply} disabled={hasEmptyAdsets || totalAdsetCount === 0}>
            Apply Mapping
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
