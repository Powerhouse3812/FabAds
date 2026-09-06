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
  /**
   * §10 source-module filter + §17 admin-only Created-By filter. Optional —
   * this component currently has no consumer (Canvas/Command/Modular build
   * their own filter chrome and call `GeneratedOutputsTab` directly), so
   * these only render when a future caller wires them, keeping this file's
   * existing zero-consumer state harmless.
   */
  moduleFilter?: string;
  onModuleChange?: (next: string) => void;
  moduleOptions?: { value: string; label: string }[];
  createdByFilter?: string;
  onCreatedByChange?: (next: string) => void;
  createdByOptions?: string[];
  /** Gate for the Created-By select — only admins see it (§17). */
  showCreatedByFilter?: boolean;
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
  moduleFilter,
  onModuleChange,
  moduleOptions,
  createdByFilter,
  onCreatedByChange,
  createdByOptions,
  showCreatedByFilter,
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

      {moduleOptions && onModuleChange && (
        <Select value={moduleFilter ?? "all"} onValueChange={onModuleChange}>
          <SelectTrigger className="h-8 w-[140px] border-g6-border-secondary bg-g6-bg-container font-g6-sans text-g6-sm">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent className="g6-root border-g6-border bg-g6-bg-elevated font-g6-sans text-g6-sm">
            <SelectItem value="all">All sources</SelectItem>
            {moduleOptions.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {showCreatedByFilter && createdByOptions && onCreatedByChange && (
        <Select value={createdByFilter ?? "all"} onValueChange={onCreatedByChange}>
          <SelectTrigger className="h-8 w-[140px] border-g6-border-secondary bg-g6-bg-container font-g6-sans text-g6-sm">
            <SelectValue placeholder="Created by" />
          </SelectTrigger>
          <SelectContent className="g6-root border-g6-border bg-g6-bg-elevated font-g6-sans text-g6-sm">
            <SelectItem value="all">Everyone</SelectItem>
            {createdByOptions.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

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
