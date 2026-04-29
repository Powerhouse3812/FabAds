import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  brandFilter: string;
  onBrandChange: (next: string) => void;
  perfFilter: string;
  onPerfChange: (next: string) => void;
  search: string;
  onSearchChange: (next: string) => void;
  brandOptions: { value: string; label: string }[];
  className?: string;
};

export function FilterBar({
  brandFilter,
  onBrandChange,
  perfFilter,
  onPerfChange,
  search,
  onSearchChange,
  brandOptions,
  className,
}: Props) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <Select value={brandFilter} onValueChange={onBrandChange}>
        <SelectTrigger className="h-8 w-[140px] border-g6-border-secondary bg-g6-bg-container font-g6-sans text-g6-sm">
          <SelectValue placeholder="Brand" />
        </SelectTrigger>
        <SelectContent className="g6-root border-g6-border bg-g6-bg-elevated font-g6-sans text-g6-sm">
          <SelectItem value="all">All brands</SelectItem>
          {brandOptions.map((b) => (
            <SelectItem key={b.value} value={b.value}>
              {b.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={perfFilter} onValueChange={onPerfChange}>
        <SelectTrigger className="h-8 w-[120px] border-g6-border-secondary bg-g6-bg-container font-g6-sans text-g6-sm">
          <SelectValue placeholder="Performance" />
        </SelectTrigger>
        <SelectContent className="g6-root border-g6-border bg-g6-bg-elevated font-g6-sans text-g6-sm">
          <SelectItem value="all">All</SelectItem>
          <SelectItem value="top">Top performing</SelectItem>
          <SelectItem value="recent">Recent</SelectItem>
        </SelectContent>
      </Select>

      <div className="relative flex-1 min-w-[180px]">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-g6-text-tertiary" />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search the library..."
          className="h-8 w-full rounded-g6-base border border-g6-border-secondary bg-g6-bg-container pl-8 pr-3 font-g6-sans text-g6-sm text-g6-text placeholder:text-g6-text-tertiary focus:border-g6-primary-border focus:outline-none focus:shadow-g6-input-active"
        />
      </div>
    </div>
  );
}
