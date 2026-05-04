import { useState, useMemo } from "react";
import { useWorkspace } from "@/hooks/use-workspace";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Trash2, Bookmark, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface SavedAd {
  id: string;
  source_ad_id: string;
  brand: string | null;
  domain: string | null;
  platform: string | null;
  thumb_url: string | null;
  note: string | null;
  status: string | null;
  created_at: string;
  board_id: string;
  metadata: any;
}

export function SavedAdsTab() {
  const workspaceId = useWorkspace();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState<string>("all");

  const { data: savedAds = [], isLoading } = useQuery({
    queryKey: ["saved-ads", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const { data, error } = await supabase
        .from("insight_board_items")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as SavedAd[];
    },
    enabled: !!workspaceId,
  });

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("insight_board_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved-ads"] });
      queryClient.invalidateQueries({ queryKey: ["insight-board-items"] });
      toast.success("Ad removed from saved");
    },
    onError: () => toast.error("Failed to remove ad"),
  });

  const filtered = useMemo(() => {
    let items = savedAds;
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (a) =>
          a.brand?.toLowerCase().includes(q) ||
          a.domain?.toLowerCase().includes(q) ||
          a.source_ad_id.toLowerCase().includes(q)
      );
    }
    if (platformFilter !== "all") {
      items = items.filter((a) => a.platform === platformFilter);
    }
    return items;
  }, [savedAds, search, platformFilter]);

  const platforms = useMemo(() => {
    const set = new Set(savedAds.map((a) => a.platform).filter(Boolean) as string[]);
    return Array.from(set);
  }, [savedAds]);

  if (isLoading) {
    return <p className="text-muted-foreground py-10 text-center">Loading saved ads...</p>;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by brand, domain, or ad ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={platformFilter} onValueChange={setPlatformFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Platform" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Platforms</SelectItem>
            {platforms.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">{filtered.length} saved</span>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        /* Phase C P1-I3: dual empty-state preserves filter context. Was a
           single message that lost the "filters too narrow" affordance after
           the user had filtered down from a populated set to zero. */
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Bookmark className="h-10 w-10 text-muted-foreground/40" />
          {savedAds.length === 0 ? (
            <>
              <p className="text-muted-foreground text-center max-w-sm">
                No saved ads yet. Save ads from Discover or Feed and they'll appear here.
              </p>
            </>
          ) : (
            <>
              <p className="text-muted-foreground text-center max-w-sm">
                No saved ads match your filters. Clear filters to see all {savedAds.length} saved ads.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setPlatformFilter("all");
                }}
              >
                Clear filters
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4">
          {filtered.map((ad) => (
            <Card key={ad.id} className="group overflow-hidden">
              <CardContent className="p-0">
                {/* Thumbnail */}
                <div className="aspect-video bg-muted relative">
                  {ad.thumb_url ? (
                    <img src={ad.thumb_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Bookmark className="h-8 w-8 text-muted-foreground/30" />
                    </div>
                  )}
                  {/* Remove overlay */}
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeMutation.mutate(ad.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {/* Info */}
                <div className="p-3 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium truncate">{ad.brand || "Unknown brand"}</span>
                    {ad.platform && (
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {ad.platform}
                      </Badge>
                    )}
                  </div>
                  {ad.domain && (
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1 truncate">
                      <ExternalLink className="h-3 w-3 shrink-0" /> {ad.domain}
                    </p>
                  )}
                  <p className="text-[10px] text-muted-foreground">
                    Saved {formatDistanceToNow(new Date(ad.created_at))} ago
                  </p>
                  {ad.note && (
                    <p className="text-[10px] text-muted-foreground italic truncate">"{ad.note}"</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
