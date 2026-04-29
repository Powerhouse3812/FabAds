import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { X, Plus, Search } from "lucide-react";
import { INSIGHT_INDUSTRIES, INSIGHT_INTERESTS, DUMMY_ADS } from "@/lib/insights-dummy-data";
import { useInsightPreferences } from "@/hooks/use-insight-preferences";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  initialIndustries?: string[];
  initialInterests?: string[];
  initialBrands?: string[];
}

const KNOWN_BRANDS = [...new Set(DUMMY_ADS.map((a) => a.brand))].sort();

export function OnboardingModal({ open, onClose, initialIndustries, initialInterests, initialBrands }: Props) {
  const [tab, setTab] = useState<string>("industries");
  const [industries, setIndustries] = useState<string[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [brandSearch, setBrandSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const isEdit = !!initialIndustries;

  useEffect(() => {
    if (open) {
      setTab("industries");
      setIndustries(initialIndustries ?? []);
      setInterests(initialInterests ?? []);
      setBrands(initialBrands ?? []);
      setBrandSearch("");
    }
  }, [open, initialIndustries, initialInterests, initialBrands]);

  const { upsert } = useInsightPreferences();

  const toggleItem = (arr: string[], setArr: (a: string[]) => void, item: string) => {
    setArr(arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item]);
  };

  const filteredBrands = useMemo(() => {
    if (!brandSearch.trim()) return KNOWN_BRANDS.filter((b) => !brands.includes(b));
    const q = brandSearch.toLowerCase();
    return KNOWN_BRANDS.filter((b) => b.toLowerCase().includes(q) && !brands.includes(b));
  }, [brandSearch, brands]);

  const addBrand = (name: string) => {
    const trimmed = name.trim();
    if (trimmed && !brands.includes(trimmed)) {
      setBrands([...brands, trimmed]);
    }
    setBrandSearch("");
    setShowSuggestions(false);
  };

  const removeBrand = (name: string) => {
    setBrands(brands.filter((b) => b !== name));
  };

  const handleSave = () => {
    upsert.mutate({ industries, interests, followed_brands: brands, onboarded: true }, {
      onSuccess: () => { toast.success("Preferences saved!"); onClose(); },
      onError: () => toast.error("Failed to save preferences"),
    });
  };

  const canSave = industries.length > 0 || interests.length > 0 || brands.length > 0;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Preferences" : "Set Up Your Feed"}</DialogTitle>
        </DialogHeader>

        {/* Segmented Tabs */}
        <ToggleGroup type="single" value={tab} onValueChange={(v) => v && setTab(v)} className="w-full">
          <ToggleGroupItem value="industries" className="flex-1 text-xs">Industries{industries.length > 0 && ` (${industries.length})`}</ToggleGroupItem>
          <ToggleGroupItem value="interests" className="flex-1 text-xs">Interests{interests.length > 0 && ` (${interests.length})`}</ToggleGroupItem>
          <ToggleGroupItem value="brands" className="flex-1 text-xs">Brands{brands.length > 0 && ` (${brands.length})`}</ToggleGroupItem>
        </ToggleGroup>

        {/* Industries Tab */}
        {tab === "industries" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Choose industries to personalize your feed.</p>
            <div className="flex flex-wrap gap-2">
              {INSIGHT_INDUSTRIES.map((ind) => (
                <Badge
                  key={ind}
                  variant={industries.includes(ind) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleItem(industries, setIndustries, ind)}
                >
                  {ind}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Interests Tab */}
        {tab === "interests" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Pick interests to fine-tune your feed.</p>
            <div className="flex flex-wrap gap-2">
              {INSIGHT_INTERESTS.map((int) => (
                <Badge
                  key={int}
                  variant={interests.includes(int) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleItem(interests, setInterests, int)}
                >
                  {int}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Brands Tab */}
        {tab === "brands" && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Follow brands to always see their ads in your feed.</p>
            
            {/* Followed brands chips */}
            {brands.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {brands.map((b) => (
                  <Badge key={b} variant="default" className="gap-1 pr-1">
                    {b}
                    <button
                      onClick={() => removeBrand(b)}
                      className="ml-0.5 rounded-full p-0.5 hover:bg-primary-foreground/20"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            {/* Searchable brand input */}
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={brandSearch}
                  onChange={(e) => { setBrandSearch(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Search or type a brand name..."
                  className="pl-8 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && brandSearch.trim()) {
                      e.preventDefault();
                      addBrand(brandSearch);
                    }
                  }}
                />
              </div>
              {showSuggestions && (brandSearch.trim() || filteredBrands.length > 0) && (
                <div className="absolute z-10 top-full mt-1 w-full bg-popover border border-border rounded-md shadow-md max-h-40 overflow-y-auto">
                  {filteredBrands.slice(0, 8).map((b) => (
                    <button
                      key={b}
                      className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent transition-colors"
                      onClick={() => addBrand(b)}
                    >
                      {b}
                    </button>
                  ))}
                  {brandSearch.trim() && !KNOWN_BRANDS.some((b) => b.toLowerCase() === brandSearch.trim().toLowerCase()) && (
                    <button
                      className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent transition-colors flex items-center gap-1.5 text-primary"
                      onClick={() => addBrand(brandSearch)}
                    >
                      <Plus className="h-3.5 w-3.5" /> Add "{brandSearch.trim()}"
                    </button>
                  )}
                  {filteredBrands.length === 0 && !brandSearch.trim() && (
                    <p className="px-3 py-2 text-xs text-muted-foreground">All known brands are added.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={upsert.isPending || (!isEdit && !canSave)}>
            {upsert.isPending ? "Saving..." : isEdit ? "Save Changes" : "Save & Continue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
