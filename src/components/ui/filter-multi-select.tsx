import { useState, useRef, useCallback } from "react";
import { X, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface FilterOption {
  id: string;
  name: string;
}

interface FilterMultiSelectProps {
  label: string;
  options: FilterOption[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  className?: string;
}

export function FilterMultiSelect({
  label,
  options,
  selected,
  onToggle,
  className,
}: FilterMultiSelectProps) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = options.filter(
    (o) =>
      o.name.toLowerCase().includes(search.toLowerCase()) && !selected.has(o.id)
  );

  const selectedItems = options.filter((o) => selected.has(o.id));

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !search && selectedItems.length > 0) {
      onToggle(selectedItems[selectedItems.length - 1].id);
    }
    if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div className={cn("flex flex-col", className)}>
      <div ref={containerRef} className="relative">
        <div
          className="flex flex-wrap items-center gap-1.5 min-h-[40px] rounded-md border border-input bg-background px-2 py-1.5 pr-8 cursor-text"
          onClick={() => {
            inputRef.current?.focus();
            setOpen(true);
          }}
        >
          {selectedItems.map((item) => (
            <Badge
              key={item.id}
              variant="secondary"
              className="text-xs h-6 gap-1 pr-1 shrink-0"
            >
              {item.name}
              <button
                type="button"
                className="ml-0.5 rounded-full hover:bg-background/20 p-0.5"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle(item.id);
                }}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <input
            ref={inputRef}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => {
              setTimeout(() => setOpen(false), 200);
            }}
            onKeyDown={handleKeyDown}
            placeholder={selectedItems.length === 0 ? `Select ${label.toLowerCase()}…` : ""}
            className="border-0 shadow-none outline-none ring-0 h-6 min-w-[60px] flex-1 px-1 text-xs bg-transparent placeholder:text-muted-foreground"
          />
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>

        {open && (
          <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md">
            <ScrollArea className="max-h-[200px]">
              <div className="p-1">
                {filtered.length === 0 ? (
                  <p className="text-xs text-muted-foreground px-2 py-3 text-center">
                    {options.length === 0 ? `No ${label.toLowerCase()} available` : "No results"}
                  </p>
                ) : (
                  filtered.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className="w-full flex items-center gap-2 text-left px-2 py-1.5 text-xs rounded-sm hover:bg-accent hover:text-accent-foreground cursor-default"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        onToggle(item.id);
                        setSearch("");
                      }}
                    >
                      {item.name}
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  );
}
