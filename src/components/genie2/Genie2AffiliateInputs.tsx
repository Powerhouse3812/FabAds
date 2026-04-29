import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Search, Plus, ChevronDown, Check, Loader2, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { AFFILIATE_CATEGORIES } from "@/lib/genie2-dummy-data";
import { useGenieCategories, useCreateGenieCategory, type GenieCategory } from "@/hooks/use-genie-categories";
import { CategoryDetailModal } from "@/components/genie5/CategoryDetailModal";
import { toast } from "sonner";

interface Props {
  category: string;
  onCategoryChange: (v: string) => void;
  angle: string;
  onAngleChange: (v: string) => void;
  onCategoryIdChange?: (id: string | null) => void;
  selectedCategoryId?: string | null;
}

export function Genie2AffiliateInputs({ category, onCategoryChange, angle, onAngleChange, onCategoryIdChange, selectedCategoryId }: Props) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [inputValue, setInputValue] = useState(category);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [lastCreatedId, setLastCreatedId] = useState<string | null>(null);

  // Detail modal state
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailCategory, setDetailCategory] = useState<GenieCategory | null>(null);

  const { data: dbCategories = [] } = useGenieCategories();
  const createCategory = useCreateGenieCategory();

  // Merge DB categories + hardcoded defaults (deduped by name)
  const allCategories = (() => {
    const dbNames = new Set(dbCategories.map((c) => c.name.toLowerCase()));
    const hardcodedItems = AFFILIATE_CATEGORIES
      .filter((name) => !dbNames.has(name.toLowerCase()))
      .map((name) => ({ id: `hc-${name}`, name, icon: "📁", isHardcoded: true }));
    const dbItems = dbCategories.map((c) => ({ id: c.id, name: c.name, icon: c.icon || "📁", isHardcoded: false }));
    return [...dbItems, ...hardcodedItems];
  })();

  const filtered = inputValue
    ? allCategories.filter((c) => c.name.toLowerCase().includes(inputValue.toLowerCase()))
    : allCategories;

  const exactMatch = allCategories.some((c) => c.name.toLowerCase() === inputValue.toLowerCase());

  // Sort pills: newly created first, then rest
  const sortedDbCategories = (() => {
    if (!lastCreatedId) return dbCategories;
    const created = dbCategories.find((c) => c.id === lastCreatedId);
    if (!created) return dbCategories;
    return [created, ...dbCategories.filter((c) => c.id !== lastCreatedId)];
  })();

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Sync inputValue when category prop changes externally
  useEffect(() => {
    if (category && category !== inputValue) setInputValue(category);
  }, [category]);

  const handleSelect = (item: { id: string; name: string; isHardcoded: boolean }) => {
    setInputValue(item.name);
    onCategoryChange(item.name);
    onCategoryIdChange?.(item.isHardcoded ? null : item.id);
    setDropdownOpen(false);
  };

  const handleCreateNew = () => {
    if (!inputValue.trim()) return;
    createCategory.mutate({ name: inputValue.trim() }, {
      onSuccess: (newCat) => {
        onCategoryChange(newCat.name);
        onCategoryIdChange?.(newCat.id);
        setLastCreatedId(newCat.id);
        setDropdownOpen(false);
        toast.success(`Category "${newCat.name}" created`);
        setDetailCategory(newCat);
        setDetailModalOpen(true);
      },
    });
  };

  const handleInputChange = (val: string) => {
    setInputValue(val);
    setDropdownOpen(true);
    if (!val) {
      onCategoryChange("");
      onCategoryIdChange?.(null);
    }
  };

  const selectedItem = selectedCategoryId
    ? allCategories.find((c) => c.id === selectedCategoryId)
    : category ? allCategories.find((c) => c.name === category) : null;

  const selectedDbCategory = selectedCategoryId
    ? dbCategories.find((c) => c.id === selectedCategoryId) || null
    : null;

  const handleEditCategory = () => {
    if (selectedDbCategory) {
      setDetailCategory(selectedDbCategory);
      setDetailModalOpen(true);
    }
  };

  const handleDetailSaved = (updated: Partial<GenieCategory>) => {
    if (updated.name) {
      setInputValue(updated.name);
      onCategoryChange(updated.name);
    }
  };

  return (
    <div className="space-y-3">
      {/* Labeled search row */}
      <div className="space-y-1.5">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Category</p>
        <div ref={containerRef} className="relative">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <Input
              ref={inputRef}
              placeholder="Search or create category..."
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              onFocus={() => setDropdownOpen(true)}
              className={cn("pl-7 h-8 text-xs border-border/50", selectedDbCategory ? "pr-14" : "pr-8")}
            />
            {selectedDbCategory && (
              <button
                onClick={handleEditCategory}
                className="absolute right-7 top-1/2 -translate-y-1/2 p-0.5 rounded hover:bg-accent/50 transition-colors"
                title="Edit category details"
              >
                <Pencil className="h-3 w-3 text-muted-foreground hover:text-primary" />
              </button>
            )}
            {createCategory.isPending ? (
              <Loader2 className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-primary" />
            ) : (
              <ChevronDown className="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            )}
          </div>

          {dropdownOpen && (
            <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md animate-in fade-in-0 zoom-in-95 duration-150">
              <div className="max-h-[200px] overflow-y-auto py-1">
                {filtered.length === 0 && !inputValue.trim() && (
                  <p className="px-3 py-2 text-xs text-muted-foreground text-center">No categories yet</p>
                )}
                {filtered.map((item) => (
                  <button
                    key={item.id}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect(item)}
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent/50 transition-colors",
                      selectedItem?.id === item.id && "bg-accent/30"
                    )}
                  >
                    <span className="text-xs">{item.icon}</span>
                    <span className="flex-1 truncate font-medium">{item.name}</span>
                    {item.isHardcoded && <span className="text-[9px] text-muted-foreground bg-muted/50 rounded px-1 py-0.5">default</span>}
                    {selectedItem?.id === item.id && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                  </button>
                ))}
              </div>
              {inputValue.trim() && !exactMatch && (
                <div className="border-t">
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={handleCreateNew}
                    disabled={createCategory.isPending}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs text-primary hover:bg-accent/30 transition-colors disabled:opacity-50"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Create "{inputValue.trim()}"
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick-pick pills row */}
      {sortedDbCategories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto flex-nowrap pb-0.5 scrollbar-thin items-center">
          {sortedDbCategories.slice(0, 8).map((c) => {
            const active = selectedCategoryId === c.id || (!selectedCategoryId && category === c.name);
            const isNew = c.id === lastCreatedId;
            return (
              <button
                key={c.id}
                onClick={() => handleSelect({ id: c.id, name: c.name, isHardcoded: false })}
                className={cn(
                  "flex items-center gap-1.5 shrink-0 rounded-lg px-2.5 py-1 transition-all h-7 text-xs",
                  active
                    ? "bg-primary/10 border border-primary/40 shadow-sm font-medium"
                    : "border border-border/40 hover:bg-accent/30",
                  isNew && !active && "border-primary/30 bg-primary/5"
                )}
              >
                <span className="text-xs">{c.icon || "📁"}</span>
                <span className="truncate max-w-[80px]">{c.name}</span>
                {active && <Check className="h-3 w-3 shrink-0 text-primary" />}
              </button>
            );
          })}
        </div>
      )}

      {/* Angle / Prompt */}
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-muted-foreground">Angle / Prompt</Label>
        <Textarea
          placeholder="Describe the angle, hook, or specific idea you want to promote..."
          value={angle}
          onChange={(e) => onAngleChange(e.target.value)}
          rows={3}
        />
      </div>

      {/* Category Detail Modal */}
      <CategoryDetailModal
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        category={detailCategory}
        onSaved={handleDetailSaved}
      />
    </div>
  );
}
