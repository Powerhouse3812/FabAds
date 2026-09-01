import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useInsightCompetitors, useCompetitorCounts } from "@/hooks/use-insight-competitors";
import { AddCompetitorModal } from "@/components/insights/AddCompetitorModal";
import { CompetitorDetailDrawer } from "@/components/insights/CompetitorDetailDrawer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Users, FileText, Radar, TrendingUp, Globe, Languages, Sparkles } from "lucide-react";
import { DUMMY_ADS } from "@/lib/insights-dummy-data";
import { markCompetitorAdded } from "@/lib/insights-setup";
import { CompetitorsDomainsView } from "@/components/insights/CompetitorsDomainsView";

// Fallback data matching DUMMY_ADS brands
const FALLBACK_COMPETITORS = [
  { id: "fb-1", name: "GlowSkin", competitor_type: "domain", identifier: "glowskin.com", country: "US", language: "English", status: "active", description: "Leading beauty & skincare domain", created_at: new Date(Date.now() - 30 * 86400000).toISOString() },
  { id: "fb-2", name: "TechPulse", competitor_type: "domain", identifier: "techpulse.io", country: "US", language: "English", status: "active", description: "Tech gadgets & SaaS platform", created_at: new Date(Date.now() - 25 * 86400000).toISOString() },
  { id: "fb-3", name: "FitZone", competitor_type: "page", identifier: "page-206274", country: "UK", language: "English", status: "active", description: "Fitness & wellness page", created_at: new Date(Date.now() - 20 * 86400000).toISOString() },
  { id: "fb-4", name: "UrbanStyle", competitor_type: "domain", identifier: "urbanstyle.com", country: "DE", language: "German", status: "active", description: "Fashion & streetwear retailer", created_at: new Date(Date.now() - 15 * 86400000).toISOString() },
  { id: "fb-5", name: "SnapBite", competitor_type: "domain", identifier: "snapbite.app", country: "IN", language: "English", status: "active", description: "Food delivery & restaurant discovery", created_at: new Date(Date.now() - 5 * 86400000).toISOString() },
];

const FALLBACK_PAGE_COUNTS: Record<string, number> = { "fb-1": 1, "fb-2": 2, "fb-3": 2, "fb-4": 1, "fb-5": 1 };

export default function InsightsCompetitors() {
  const { competitors: dbCompetitors, isLoading } = useInsightCompetitors();
  const [searchParams, setSearchParams] = useSearchParams();

  // A-12.179: URL-backed state. `?type=domain|page` (omit on "all"),
  // `?modal=add-competitor`, `?competitor=<id>`. Reloads/deep-links/back-
  // forward all preserve the exact open state — mirrors Genie 6.0 pattern.
  const typeFilter = searchParams.get("type") ?? "all";
  const modal = searchParams.get("modal");
  const competitorId = searchParams.get("competitor");

  // A-14: "Domains" is a VIEW of Competitors, not a separate nav item —
  // ?view=domains, derived straight from params at read time (no
  // normalising effect racing the other param writers on this page, per
  // the InsightsV2Feed lesson). Anything other than exactly "domains"
  // reads as the existing "competitors" view, unchanged in behaviour.
  const view = searchParams.get("view") === "domains" ? "domains" : "competitors";

  // FB-onboarding: a one-shot entry point. Anything linking in with
  // `?modal=add` (e.g. the setup checklist's "Add a competitor" step) pops
  // the modal open once, then the param is stripped immediately — unlike
  // `?modal=add-competitor` above, this isn't meant to be a durable,
  // deep-linkable open state, just a trigger.
  const [forceOpenAdd, setForceOpenAdd] = useState(false);
  useEffect(() => {
    if (searchParams.get("modal") !== "add") return;
    setForceOpenAdd(true);
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        sp.delete("modal");
        return sp;
      },
      { replace: true },
    );
  }, [searchParams, setSearchParams]);

  const addOpen = modal === "add-competitor" || forceOpenAdd;

  const setView = useCallback(
    (next: string) => {
      setSearchParams(
        (prev) => {
          const sp = new URLSearchParams(prev);
          if (!next || next === "competitors") sp.delete("view");
          else sp.set("view", next);
          return sp;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const setTypeFilter = useCallback(
    (next: string) => {
      setSearchParams(
        (prev) => {
          const sp = new URLSearchParams(prev);
          if (!next || next === "all") sp.delete("type");
          else sp.set("type", next);
          return sp;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const openAdd = useCallback(() => {
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        sp.set("modal", "add-competitor");
        return sp;
      },
      { replace: false },
    );
  }, [setSearchParams]);

  const closeAdd = useCallback(() => {
    setForceOpenAdd(false);
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        if (sp.get("modal") === "add-competitor") sp.delete("modal");
        return sp;
      },
      { replace: false },
    );
  }, [setSearchParams]);

  const openCompetitor = useCallback(
    (id: string) => {
      setSearchParams(
        (prev) => {
          const sp = new URLSearchParams(prev);
          sp.set("competitor", id);
          return sp;
        },
        { replace: false },
      );
    },
    [setSearchParams],
  );

  const closeCompetitor = useCallback(() => {
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        sp.delete("competitor");
        return sp;
      },
      { replace: false },
    );
  }, [setSearchParams]);

  const useDB = dbCompetitors.length > 0;
  const competitors = useDB ? dbCompetitors : FALLBACK_COMPETITORS;
  const competitorIds = useMemo(() => (useDB ? dbCompetitors.map((c: any) => c.id) : []), [dbCompetitors, useDB]);

  const { pageCounts: dbPageCounts, totalPages: dbTotalPages } = useCompetitorCounts(competitorIds);

  const pageCounts = useDB ? dbPageCounts : FALLBACK_PAGE_COUNTS;
  const totalPages = useDB ? dbTotalPages : Object.values(FALLBACK_PAGE_COUNTS).reduce((a, b) => a + b, 0);

  // Filter by type
  const filteredCompetitors = useMemo(() => {
    if (typeFilter === "all") return competitors;
    return competitors.filter((c: any) => c.competitor_type === typeFilter);
  }, [competitors, typeFilter]);

  // Count ads per competitor from DUMMY_ADS
  const adCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    competitors.forEach((c: any) => {
      counts[c.id] = DUMMY_ADS.filter(ad => ad.brand.toLowerCase() === c.name.toLowerCase()).length;
    });
    return counts;
  }, [competitors]);

  // Resolve the selected competitor object from the URL id. If the id
  // refers to a deleted/unknown competitor, silently strip the param so
  // the drawer doesn't get stuck open with no data.
  const selected = useMemo(() => {
    if (!competitorId) return null;
    return competitors.find((c: any) => c.id === competitorId) ?? null;
  }, [competitors, competitorId]);

  useEffect(() => {
    if (!competitorId || isLoading) return;
    const exists = competitors.some((c: any) => c.id === competitorId);
    if (!exists) {
      setSearchParams(
        (prev) => {
          const sp = new URLSearchParams(prev);
          sp.delete("competitor");
          return sp;
        },
        { replace: true },
      );
    }
  }, [competitorId, competitors, isLoading, setSearchParams]);

  return (
    <div className="v3-page-mesh space-y-3 p-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Competitors</h2>
          {!useDB && (
            <Badge variant="secondary" className="gap-1 text-xs font-normal text-muted-foreground">
              <Sparkles className="h-3 w-3" strokeWidth={2} aria-hidden /> Demo data
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3">
          {view === "competitors" && (
            <ToggleGroup type="single" value={typeFilter} onValueChange={(v) => v && setTypeFilter(v)} size="sm" variant="outline">
              <ToggleGroupItem value="all">All</ToggleGroupItem>
              <ToggleGroupItem value="domain">Domain</ToggleGroupItem>
              <ToggleGroupItem value="page">Page</ToggleGroupItem>
            </ToggleGroup>
          )}
          <Button size="sm" onClick={openAdd}>
            <Plus className="h-4 w-4 mr-1" /> Add Competitor
          </Button>
        </div>
      </div>

      {/* Competitors vs Domains — a view of the same competitor rows, not a
          separate module (Maalik's call). ?view=domains is URL-backed so
          reload/deep-link/back-forward preserve it, matching this page's
          other params. */}
      <Tabs value={view} onValueChange={setView}>
        <TabsList>
          <TabsTrigger value="competitors">Competitors</TabsTrigger>
          <TabsTrigger value="domains">Domains</TabsTrigger>
        </TabsList>
      </Tabs>

      {view === "domains" ? (
        <CompetitorsDomainsView onAddCompetitor={openAdd} />
      ) : (
        <>
          {/* Demo-data notice — these five rows are sample data, not anything the
              user tracked. Say so plainly and put the real action right next to
              it, rather than letting a populated-looking table pass as real. */}
          {!useDB && (
            <Card className="border-dashed bg-muted/30">
              <CardContent className="p-3 flex items-center justify-between gap-3 flex-wrap">
                <p className="text-xs text-muted-foreground">
                  You're viewing sample competitors so you can see how this page works. Add your own to start tracking real data.
                </p>
                <Button size="sm" onClick={openAdd}>
                  <Plus className="h-4 w-4 mr-1" /> Add Competitor
                </Button>
              </CardContent>
            </Card>
          )}

          {/* KPI Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Radar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{competitors.length}</p>
                  <p className="text-xs text-muted-foreground">Total Competitors</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalPages}</p>
                  <p className="text-xs text-muted-foreground">Pages Tracked</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Competitor Cards Grid */}
          {isLoading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : filteredCompetitors.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p className="mb-4">No competitors tracked yet. Add one to get started.</p>
              <Button size="sm" onClick={openAdd}>
                <Plus className="h-4 w-4 mr-1" /> Add Competitor
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredCompetitors.map((c: any) => {
                const pCount = pageCounts[c.id] ?? 0;
                const aCount = adCounts[c.id] ?? 0;
                const daysAgo = Math.floor((Date.now() - new Date(c.created_at).getTime()) / 86400000);

                return (
                  <Card
                    key={c.id}
                    className={
                      "cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200" +
                      (useDB ? "" : " border-dashed opacity-80 hover:opacity-100")
                    }
                    onClick={() => openCompetitor(c.id)}
                  >
                    <CardContent className="p-4 space-y-3">
                      {/* Name + badges */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-semibold text-sm truncate">{c.name}</span>
                          <Badge variant="outline" className="shrink-0 text-xs">{c.competitor_type}</Badge>
                          {!useDB && (
                            <Badge variant="secondary" className="shrink-0 gap-1 text-xs font-normal text-muted-foreground">
                              <Sparkles className="h-3 w-3" strokeWidth={2} aria-hidden /> Demo
                            </Badge>
                          )}
                        </div>
                        <Badge
                          variant={c.status === "active" ? "default" : "secondary"}
                          className="shrink-0 text-xs"
                        >
                          {c.status}
                        </Badge>
                      </div>

                      {/* Country + Language */}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {c.country && <span className="inline-flex items-center gap-1"><Globe className="h-3 w-3" strokeWidth={2} aria-hidden /> {c.country}</span>}
                        {c.language && <span className="inline-flex items-center gap-1"><Languages className="h-3 w-3" strokeWidth={2} aria-hidden /> {c.language}</span>}
                      </div>

                      {/* Stats row */}
                      <div className="flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <FileText className="h-3 w-3" /> {pCount} pages
                        </span>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <TrendingUp className="h-3 w-3" /> {aCount} ads
                        </span>
                      </div>

                      {/* Mini insight */}
                      <p className="text-xs text-muted-foreground">
                        {aCount > 0
                          ? `${aCount} ads detected • Added ${daysAgo}d ago`
                          : `Added ${daysAgo}d ago`}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      <AddCompetitorModal open={addOpen} onClose={closeAdd} onAdded={markCompetitorAdded} />
      <CompetitorDetailDrawer competitor={selected} open={!!selected} onClose={closeCompetitor} />
    </div>
  );
}
