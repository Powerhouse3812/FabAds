import { useState } from "react";
import { X, Filter, Search, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { INSIGHT_INDUSTRIES, TRENDING_TAGS } from "@/lib/insights-dummy-data";

export interface InsightsFilters {
  search: string;
  industry: string;
  platform: string;
  status: string;
  country: string;
}

const DEFAULT_FILTERS: InsightsFilters = { search: "", industry: "", platform: "", status: "", country: "" };

const FILTER_LABELS: Record<string, string> = {
  search: "Search",
  industry: "Industry",
  platform: "Platform",
  status: "Status",
  country: "Country",
};

interface Props {
  filters: InsightsFilters;
  onChange: (f: InsightsFilters) => void;
  showTrending?: boolean;
}

export function InsightsFilterBar({ filters, onChange, showTrending }: Props) {
  const setField = (key: keyof InsightsFilters, val: string) => onChange({ ...filters, [key]: val });
  const activeCount = Object.values(filters).filter(Boolean).length;
  const activeEntries = Object.entries(filters).filter(([, v]) => Boolean(v)) as [keyof InsightsFilters, string][];

  return (
    <div className="space-y-3 sticky top-0 z-20 bg-background/90 backdrop-blur-sm pb-3 border-b border-border/30 transition-shadow duration-200">
      {/* Filter row */}
      <div className="flex items-center gap-2 flex-wrap overflow-hidden">
        {/* Left: Search + Filter */}
        <div className="flex items-center gap-2">
          <div className="relative max-w-[240px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by page, keywor..."
              value={filters.search}
              onChange={(e) => setField("search", e.target.value)}
              className="pl-8 h-9 text-sm"
            />
          </div>
          <Button variant="outline" size="icon" className="h-9 w-9 shrink-0">
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {/* Right: All selects */}
        <div className="flex items-center gap-2 ml-auto">

        <Select value={filters.status || "active"} onValueChange={(v) => setField("status", v === "all" ? "" : v)}>
          <SelectTrigger className="w-[100px] h-9 text-sm font-medium"><SelectValue placeholder="Active" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.platform} onValueChange={(v) => setField("platform", v === "all" ? "" : v)}>
          <SelectTrigger className="w-[110px] h-9 text-sm font-medium"><SelectValue placeholder="Platform" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="Meta">Meta</SelectItem>
            <SelectItem value="Instagram">Instagram</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.country} onValueChange={(v) => setField("country", v === "all" ? "" : v)}>
          <SelectTrigger className="w-[110px] h-9 text-sm font-medium"><SelectValue placeholder="Country" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="us">United States</SelectItem>
            <SelectItem value="uk">United Kingdom</SelectItem>
            <SelectItem value="de">Germany</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filters.industry} onValueChange={(v) => setField("industry", v === "all" ? "" : v)}>
          <SelectTrigger className="w-[110px] h-9 text-sm font-medium"><SelectValue placeholder="Language" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {INSIGHT_INDUSTRIES.map((ind) => <SelectItem key={ind} value={ind}>{ind}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select defaultValue="15">
          <SelectTrigger className="w-[100px] h-9 text-sm font-medium"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 days</SelectItem>
            <SelectItem value="15">15 days</SelectItem>
            <SelectItem value="30">30 days</SelectItem>
          </SelectContent>
        </Select>
        </div>
      </div>

      {/* Applied filters chips */}
      {activeCount > 0 && (
        <div className="bg-muted/30 rounded-lg px-3 py-1.5 flex items-center gap-2 flex-wrap">
          {activeEntries.map(([key, val]) => (
            <Badge key={key} variant="secondary" className="text-xs gap-1 pr-1">
              {FILTER_LABELS[key]}: {val}
              <button className="ml-0.5 hover:text-foreground" onClick={() => setField(key, "")}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          <button
            className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline ml-auto"
            onClick={() => onChange(DEFAULT_FILTERS)}
          >
            Reset filters
          </button>
        </div>
      )}

      {/* Trending tags row */}
      {showTrending && (
        <div
          className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide"
          style={{ maskImage: "linear-gradient(to right, transparent, black 24px, black calc(100% - 24px), transparent)" }}
        >
          <span className="text-sm font-medium text-muted-foreground flex items-center gap-1 whitespace-nowrap shrink-0">
            <Filter className="h-3 w-3" /> Trending tags<span className="text-[10px]">(AI)</span>
          </span>
          {TRENDING_TAGS.map((tag) => {
            const label = tag.replace("#", "");
            const isActive = filters.search === tag;
            return (
              <Badge
                key={tag}
                variant={isActive ? "default" : "outline"}
                className={`text-xs cursor-pointer whitespace-nowrap px-3 py-1 rounded-full shrink-0 transition-colors duration-150 ${
                  isActive ? "" : "hover:bg-muted"
                }`}
                onClick={() => setField("search", isActive ? "" : tag)}
              >
                {label}
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}

export { DEFAULT_FILTERS };
