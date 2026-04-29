import { useState, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Plus, FolderOpen, Layers, GripVertical } from "lucide-react";
import type { ClFolder } from "@/hooks/use-cl-folders";
import type { ClFolderStats } from "@/hooks/use-cl-folder-stats";

interface FolderListPanelProps {
  folders: ClFolder[];
  selectedFolderId: string | null;
  onSelect: (id: string | null) => void;
  onCreateClick: () => void;
  isReadOnly?: boolean;
  onReorder?: (reordered: ClFolder[]) => void;
  folderStats?: Record<string, ClFolderStats>;
}

export function FolderListPanel({ folders, selectedFolderId, onSelect, onCreateClick, isReadOnly, onReorder, folderStats }: FolderListPanelProps) {
  const [search, setSearch] = useState("");
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragIndexRef = useRef<number | null>(null);

  const filtered = search
    ? folders.filter((f) => f.name.toLowerCase().includes(search.toLowerCase()) || f.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())))
    : folders;

  const isDraggable = !isReadOnly && !search;

  const handleDragStart = useCallback((idx: number) => {
    dragIndexRef.current = idx;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(idx);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropIdx: number) => {
    e.preventDefault();
    const fromIdx = dragIndexRef.current;
    if (fromIdx === null || fromIdx === dropIdx) {
      setDragOverIndex(null);
      dragIndexRef.current = null;
      return;
    }
    const reordered = [...folders];
    const [moved] = reordered.splice(fromIdx, 1);
    reordered.splice(dropIdx, 0, moved);
    onReorder?.(reordered);
    setDragOverIndex(null);
    dragIndexRef.current = null;
  }, [folders, onReorder]);

  const handleDragEnd = useCallback(() => {
    setDragOverIndex(null);
    dragIndexRef.current = null;
  }, []);

  return (
    <div className="w-[220px] shrink-0 border-r border-border flex flex-col h-full bg-muted/20">
      {/* Header */}
      <div className="px-3 pt-3 pb-2 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground">Folders</span>
          {!isReadOnly && (
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onCreateClick}>
              <Plus className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search folders…"
            className="pl-7 h-7 text-xs"
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="px-2 pb-2 space-y-0.5">
          {/* All items — not draggable */}
          <button
            onClick={() => onSelect(null)}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors ${
              selectedFolderId === null
                ? "bg-accent text-accent-foreground font-medium"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Layers className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">All items</span>
          </button>

          {filtered.map((folder, idx) => (
            <div
              key={folder.id}
              className="relative"
              draggable={isDraggable}
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={(e) => handleDrop(e, idx)}
              onDragEnd={handleDragEnd}
            >
              {/* Drop indicator */}
              {dragOverIndex === idx && dragIndexRef.current !== idx && (
                <div className="absolute -top-[1px] left-2 right-2 h-0.5 bg-primary rounded-full z-10" />
              )}
              <button
                onClick={() => onSelect(folder.id)}
                className={`w-full flex flex-col gap-0.5 px-2 py-1.5 rounded-md text-xs transition-colors text-left group ${
                  selectedFolderId === folder.id
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <div className="flex items-center gap-1">
                  {isDraggable && (
                    <GripVertical className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-50 cursor-grab transition-opacity" />
                  )}
                  <FolderOpen className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate font-medium">{folder.name}</span>
                </div>
                {/* Stats line */}
                {folderStats && folderStats[folder.id] && (() => {
                  const s = folderStats[folder.id];
                  const parts: string[] = [];
                  if (s.mediaCount > 0) parts.push(`${s.mediaCount} media`);
                  if (s.adgroupCount > 0) parts.push(`${s.adgroupCount} adgroups`);
                  const cuPart = s.linkedCuCount > 0 ? `${s.linkedCuCount} CUs` : null;
                  if (parts.length > 0 || cuPart) {
                    return (
                      <p className={`text-[9px] text-muted-foreground truncate ${isDraggable ? 'pl-7' : 'pl-5'}`}>
                        {parts.join(", ")}{parts.length > 0 && cuPart ? " · " : ""}{cuPart || ""}
                      </p>
                    );
                  }
                  return null;
                })()}
                {folder.tags.length > 0 && (
                  <div className={`flex flex-wrap gap-0.5 ${isDraggable ? 'pl-7' : 'pl-5'}`}>
                    {folder.tags.slice(0, 2).map((t) => (
                      <Badge key={t} variant="secondary" className="text-[8px] px-1 py-0 h-3.5">{t}</Badge>
                    ))}
                    {folder.tags.length > 2 && (
                      <span className="text-[8px] text-muted-foreground">+{folder.tags.length - 2}</span>
                    )}
                  </div>
                )}
              </button>
            </div>
          ))}

          {filtered.length === 0 && folders.length > 0 && (
            <p className="text-[10px] text-muted-foreground px-2 py-3 text-center">No folders match your search</p>
          )}
          {folders.length === 0 && (
            <p className="text-[10px] text-muted-foreground px-2 py-3 text-center">No folders yet</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
