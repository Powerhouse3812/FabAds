import { useState, useRef, useCallback } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchableMultiSelectProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
  chipVariant?: "default" | "destructive" | "secondary" | "outline";
}

export function SearchableMultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Search...",
  className,
  chipVariant = "default",
}: SearchableMultiSelectProps) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = options.filter(
    (o) =>
      o.toLowerCase().includes(search.toLowerCase()) && !selected.includes(o)
  );

  const addItem = useCallback(
    (item: string) => {
      if (!selected.includes(item)) {
        onChange([...selected, item]);
      }
      setSearch("");
    },
    [selected, onChange]
  );

  const removeItem = useCallback(
    (item: string) => {
      onChange(selected.filter((s) => s !== item));
    },
    [selected, onChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && search.trim()) {
      e.preventDefault();
      // If there's an exact or first match in filtered, add it
      const match = filtered.find(
        (o) => o.toLowerCase() === search.toLowerCase()
      );
      if (match) {
        addItem(match);
      } else if (filtered.length > 0) {
        addItem(filtered[0]);
      }
    }
    if (e.key === "Backspace" && !search && selected.length > 0) {
      removeItem(selected[selected.length - 1]);
    }
    if (e.key === "Escape") {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div
        className="flex flex-wrap items-center gap-1.5 min-h-[40px] rounded-md border border-input bg-background px-2 py-1.5 cursor-text"
        onClick={() => {
          inputRef.current?.focus();
          setOpen(true);
        }}
      >
        {selected.map((item) => (
          <Badge
            key={item}
            variant={chipVariant}
            className="text-xs h-6 gap-1 pr-1"
          >
            {item}
            <button
              type="button"
              className="ml-0.5 rounded-full hover:bg-background/20 p-0.5"
              onClick={(e) => {
                e.stopPropagation();
                removeItem(item);
              }}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <Input
          ref={inputRef}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            // Delay to allow click on dropdown item
            setTimeout(() => setOpen(false), 200);
          }}
          onKeyDown={handleKeyDown}
          placeholder={selected.length === 0 ? placeholder : ""}
          className="border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 h-7 min-w-[80px] flex-1 px-1 text-xs"
        />
      </div>

      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-full max-h-[200px] overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md">
          {filtered.map((item) => (
            <button
              key={item}
              type="button"
              className="w-full text-left px-3 py-1.5 text-xs hover:bg-accent hover:text-accent-foreground cursor-default"
              onMouseDown={(e) => {
                e.preventDefault();
                addItem(item);
              }}
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
