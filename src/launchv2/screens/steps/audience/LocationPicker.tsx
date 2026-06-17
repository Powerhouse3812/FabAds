/**
 * LocationPicker — search-based location picker with GeoLocations write-back.
 *
 * Supports: countries, cities (with radius), regions, DMA (geoMarkets).
 * Excluded locations toggle → separate excluded section.
 *
 * Special ad category constraints:
 *   - Zip/postal entries are disabled (greyed out + tooltip)
 *   - Minimum radius 15 miles (smaller options disabled)
 *   - Shows amber restriction banner
 *
 * Writes to: targeting.geoLocations and targeting.excludedGeoLocations
 */

import { useState, useRef, useEffect } from "react";
import { Search, X, AlertTriangle, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GeoLocations, GeoEntry } from "../../../types";

interface LocationPickerProps {
  geoLocations: GeoLocations;
  excludedGeoLocations?: Partial<GeoLocations>;
  onChangeIncluded: (g: GeoLocations) => void;
  onChangeExcluded: (g: Partial<GeoLocations>) => void;
  specialAdCategoryActive?: boolean;
}

type LocationType = "country" | "city" | "region" | "dma";

interface LocationOption {
  key: string;
  name: string;
  type: LocationType;
  countryCode?: string;
}

const MOCK_LOCATIONS: LocationOption[] = [
  // Countries
  { key: "IN", name: "India", type: "country" },
  { key: "US", name: "United States", type: "country" },
  { key: "GB", name: "United Kingdom", type: "country" },
  { key: "AU", name: "Australia", type: "country" },
  { key: "CA", name: "Canada", type: "country" },
  { key: "DE", name: "Germany", type: "country" },
  { key: "FR", name: "France", type: "country" },
  { key: "BR", name: "Brazil", type: "country" },
  { key: "AE", name: "UAE", type: "country" },
  { key: "SG", name: "Singapore", type: "country" },
  // Cities
  { key: "1062439", name: "Mumbai", type: "city", countryCode: "IN" },
  { key: "1061755", name: "Delhi", type: "city", countryCode: "IN" },
  { key: "1062334", name: "Bangalore", type: "city", countryCode: "IN" },
  { key: "1062070", name: "Chennai", type: "city", countryCode: "IN" },
  { key: "1062297", name: "Hyderabad", type: "city", countryCode: "IN" },
  { key: "2459115", name: "New York", type: "city", countryCode: "US" },
  { key: "2420379", name: "Los Angeles", type: "city", countryCode: "US" },
  { key: "2643743", name: "London", type: "city", countryCode: "GB" },
  { key: "2147714", name: "Sydney", type: "city", countryCode: "AU" },
  { key: "6167865", name: "Toronto", type: "city", countryCode: "CA" },
  // Regions
  { key: "3382255", name: "Maharashtra", type: "region", countryCode: "IN" },
  { key: "3383534", name: "Karnataka", type: "region", countryCode: "IN" },
  { key: "5332921", name: "California", type: "region", countryCode: "US" },
  { key: "2155400", name: "New South Wales", type: "region", countryCode: "AU" },
  // DMA
  { key: "dma_501", name: "New York DMA", type: "dma" },
  { key: "dma_803", name: "Los Angeles DMA", type: "dma" },
  { key: "dma_602", name: "Chicago DMA", type: "dma" },
];

const RADIUS_OPTIONS_KM = [10, 17, 25, 50];
const RADIUS_OPTIONS_KM_SAC = [25, 50]; // minimum 25km (~15mi) for special ad category

const TYPE_LABEL: Record<LocationType, string> = {
  country: "Country",
  city: "City",
  region: "Region",
  dma: "DMA",
};

const TYPE_COLOR: Record<LocationType, string> = {
  country: "text-blue-600 dark:text-blue-400",
  city: "text-[#5B7611] dark:text-[#C3E165]",
  region: "text-purple-600 dark:text-purple-400",
  dma: "text-orange-600 dark:text-orange-400",
};

interface SelectedLocation {
  option: LocationOption;
  radius?: number; // km, only for cities
}

function buildGeoLocations(selected: SelectedLocation[]): GeoLocations {
  const base: GeoLocations = {
    countries: [],
    regions: [],
    cities: [],
    zips: [],
    customLocations: [],
    geoMarkets: [],
    locationTypes: ["home", "recent"],
  };
  for (const s of selected) {
    if (s.option.type === "country") {
      base.countries.push(s.option.key);
    } else if (s.option.type === "city") {
      const entry: GeoEntry = {
        key: s.option.key,
        name: s.option.name,
        radius: s.radius ?? 25,
        distanceUnit: "kilometer",
      };
      base.cities.push(entry);
    } else if (s.option.type === "region") {
      base.regions.push({ key: s.option.key, name: s.option.name });
    } else if (s.option.type === "dma") {
      base.geoMarkets.push({ key: s.option.key, name: s.option.name });
    }
  }
  return base;
}

function geoToSelected(geo: GeoLocations): SelectedLocation[] {
  const result: SelectedLocation[] = [];
  for (const key of geo.countries) {
    const opt = MOCK_LOCATIONS.find((l) => l.key === key && l.type === "country");
    if (opt) result.push({ option: opt });
  }
  for (const entry of geo.cities) {
    const opt = MOCK_LOCATIONS.find((l) => l.key === entry.key && l.type === "city");
    if (opt) result.push({ option: opt, radius: entry.radius });
  }
  for (const entry of geo.regions) {
    const opt = MOCK_LOCATIONS.find((l) => l.key === entry.key && l.type === "region");
    if (opt) result.push({ option: opt });
  }
  for (const entry of geo.geoMarkets) {
    const opt = MOCK_LOCATIONS.find((l) => l.key === entry.key && l.type === "dma");
    if (opt) result.push({ option: opt });
  }
  return result;
}

function SearchBox({
  selected,
  onAdd,
  onRemove,
  onRadiusChange,
  specialAdCategoryActive,
  placeholder,
}: {
  selected: SelectedLocation[];
  onAdd: (loc: LocationOption) => void;
  onRemove: (key: string) => void;
  onRadiusChange: (key: string, radius: number) => void;
  specialAdCategoryActive?: boolean;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const locked = specialAdCategoryActive === true;

  const selectedKeys = new Set(selected.map((s) => s.option.key));
  const radiusOptions = locked ? RADIUS_OPTIONS_KM_SAC : RADIUS_OPTIONS_KM;

  const filtered = MOCK_LOCATIONS.filter(
    (l) =>
      !selectedKeys.has(l.key) &&
      l.name.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={wrapRef} className="relative">
      {/* Input */}
      <div className="flex items-center gap-2 rounded-[28px] border border-border bg-background px-3 py-1.5">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder ?? "Search countries, cities, regions…"}
          className="w-full bg-transparent text-[13px] text-foreground placeholder-muted-foreground focus:outline-none"
        />
      </div>

      {/* Dropdown */}
      {open && query.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-52 overflow-y-auto rounded-2xl border border-border bg-[#FFFFFF] dark:bg-[#1E1E23] shadow-md">
          {filtered.length === 0 ? (
            <p className="px-3 py-3 text-[12px] font-mono text-muted-foreground">No results for "{query}"</p>
          ) : (
            filtered.map((loc) => (
              <button
                key={loc.key}
                type="button"
                onClick={() => {
                  onAdd(loc);
                  setQuery("");
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate text-[13px]">{loc.name}</span>
                  {loc.countryCode && (
                    <span className="text-[10px] font-mono text-muted-foreground">({loc.countryCode})</span>
                  )}
                </div>
                <span className={cn("shrink-0 text-[10px] font-mono font-semibold uppercase tracking-wide", TYPE_COLOR[loc.type])}>
                  {TYPE_LABEL[loc.type]}
                </span>
              </button>
            ))
          )}
        </div>
      )}

      {/* Selected chips */}
      {selected.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {selected.map((s) => (
            <div
              key={s.option.key}
              className="flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-sm"
            >
              <span className="text-[12px]">{s.option.name}</span>
              <span className={cn("text-[10px] font-mono font-semibold uppercase", TYPE_COLOR[s.option.type])}>
                {TYPE_LABEL[s.option.type]}
              </span>

              {/* Radius control for cities */}
              {s.option.type === "city" && (
                <select
                  value={s.radius ?? 25}
                  onChange={(e) => onRadiusChange(s.option.key, Number(e.target.value))}
                  className="ml-1 rounded-full border border-border bg-background px-1.5 py-0.5 text-[11px] font-mono focus:outline-none"
                  title="Radius"
                >
                  {radiusOptions.map((r) => {
                    const disabled = locked && r < 25;
                    return (
                      <option key={r} value={r} disabled={disabled}>
                        {r}km
                      </option>
                    );
                  })}
                </select>
              )}

              <button
                type="button"
                onClick={() => onRemove(s.option.key)}
                className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-border hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function LocationPicker({
  geoLocations,
  excludedGeoLocations,
  onChangeIncluded,
  onChangeExcluded,
  specialAdCategoryActive,
}: LocationPickerProps) {
  const locked = specialAdCategoryActive === true;
  const [showExcluded, setShowExcluded] = useState(false);

  const includedSelected = geoToSelected(geoLocations);
  const excludedSelected = geoToSelected({
    countries: excludedGeoLocations?.countries ?? [],
    regions: excludedGeoLocations?.regions ?? [],
    cities: excludedGeoLocations?.cities ?? [],
    zips: excludedGeoLocations?.zips ?? [],
    customLocations: excludedGeoLocations?.customLocations ?? [],
    geoMarkets: excludedGeoLocations?.geoMarkets ?? [],
    locationTypes: excludedGeoLocations?.locationTypes ?? [],
  });

  function addIncluded(loc: LocationOption) {
    const next = [...includedSelected, { option: loc, radius: loc.type === "city" ? (locked ? 25 : 25) : undefined }];
    onChangeIncluded(buildGeoLocations(next));
  }

  function removeIncluded(key: string) {
    const next = includedSelected.filter((s) => s.option.key !== key);
    onChangeIncluded(buildGeoLocations(next));
  }

  function changeIncludedRadius(key: string, radius: number) {
    const minRadius = locked ? 25 : 10;
    const clampedRadius = Math.max(minRadius, radius);
    const next = includedSelected.map((s) =>
      s.option.key === key ? { ...s, radius: clampedRadius } : s
    );
    onChangeIncluded(buildGeoLocations(next));
  }

  function addExcluded(loc: LocationOption) {
    const next = [...excludedSelected, { option: loc, radius: loc.type === "city" ? 25 : undefined }];
    onChangeExcluded(buildGeoLocations(next));
  }

  function removeExcluded(key: string) {
    const next = excludedSelected.filter((s) => s.option.key !== key);
    onChangeExcluded(buildGeoLocations(next));
  }

  function changeExcludedRadius(key: string, radius: number) {
    const next = excludedSelected.map((s) =>
      s.option.key === key ? { ...s, radius } : s
    );
    onChangeExcluded(buildGeoLocations(next));
  }

  return (
    <div className="space-y-3">
      {locked && (
        <div className="flex items-start gap-2 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-3 py-2">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <p className="text-[11px] font-mono text-amber-600 dark:text-amber-400">
            Location targeting is limited for Special Ad Categories. Zip codes are unavailable and city radius minimum is 25km (15 miles).
          </p>
        </div>
      )}

      {/* Included locations */}
      <SearchBox
        selected={includedSelected}
        onAdd={addIncluded}
        onRemove={removeIncluded}
        onRadiusChange={changeIncludedRadius}
        specialAdCategoryActive={specialAdCategoryActive}
        placeholder="Search countries, cities, regions, or DMA…"
      />

      {/* Excluded locations toggle */}
      <div>
        <button
          type="button"
          onClick={() => setShowExcluded((p) => !p)}
          className="text-[12px] font-mono text-[#5B7611] dark:text-[#C3E165] underline-offset-2 hover:underline transition-colors"
        >
          {showExcluded ? "Hide excluded locations" : "+ Exclude locations"}
        </button>
      </div>

      {showExcluded && (
        <div className="rounded-2xl border border-border/60 bg-muted/30 px-3 py-3 space-y-2">
          <p className="text-[11px] font-mono uppercase tracking-wide text-muted-foreground">Excluded locations</p>
          <SearchBox
            selected={excludedSelected}
            onAdd={addExcluded}
            onRemove={removeExcluded}
            onRadiusChange={changeExcludedRadius}
            specialAdCategoryActive={specialAdCategoryActive}
            placeholder="Exclude countries, cities, regions…"
          />
        </div>
      )}
    </div>
  );
}
