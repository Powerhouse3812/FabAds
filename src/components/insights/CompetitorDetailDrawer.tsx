import { useState, useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, UserPlus, UserMinus, TrendingUp, DollarSign, Clock, Video, Image, LayoutGrid } from "lucide-react";
import { useCompetitorPages } from "@/hooks/use-insight-competitors";
import { useInsightFollows } from "@/hooks/use-insight-follows";
import { InsightAdCard } from "./InsightAdCard";
import { DUMMY_ADS } from "@/lib/insights-dummy-data";
import { toast } from "sonner";
import { Bar, BarChart, XAxis, YAxis, ResponsiveContainer } from "recharts";

interface Props {
  competitor: any | null;
  open: boolean;
  onClose: () => void;
}

// Dummy insights per competitor
function getCompetitorInsights(name: string) {
  const ads = DUMMY_ADS.filter(ad => ad.brand.toLowerCase() === name.toLowerCase());
  const activeAds = ads.filter(a => a.status === "active").length;
  const videoCount = ads.filter(a => a.adType === "Video").length;
  const imageCount = ads.filter(a => a.adType === "Image").length;
  const carouselCount = ads.filter(a => a.adType === "Carousel").length;
  const topCta = ads.length > 0 ? ads[0].cta : "Shop Now";

  return {
    totalAds: ads.length > 0 ? ads.length + 35 : 47,
    activeAds: activeAds > 0 ? activeAds + 12 : 23,
    monthlySpend: `$${(12400 + ads.length * 200).toLocaleString()}`,
    topFormat: videoCount >= imageCount ? "Video" : "Image",
    topFormatPct: videoCount >= imageCount ? Math.round((videoCount / Math.max(ads.length, 1)) * 100) : Math.round((imageCount / Math.max(ads.length, 1)) * 100),
    topCta,
    avgDuration: `${14 + (ads.length % 10)} days`,
    formatChart: [
      { name: "Image", count: imageCount || 12 },
      { name: "Video", count: videoCount || 18 },
      { name: "Carousel", count: carouselCount || 8 },
    ],
    timeline: [
      { time: "2 hours ago", event: "New video ad detected" },
      { time: "1 day ago", event: `${activeAds || 2} ads went inactive` },
      { time: "3 days ago", event: "Spend increase detected (+15%)" },
      { time: "5 days ago", event: "New carousel ad launched" },
      { time: "1 week ago", event: "Brand page updated" },
    ],
  };
}

export function CompetitorDetailDrawer({ competitor, open, onClose }: Props) {
  const [addModal, setAddModal] = useState<"page" | null>(null);
  const { pages, addPage } = useCompetitorPages(competitor?.id?.startsWith("fb-") ? undefined : competitor?.id);
  const { isFollowing, follow, unfollow } = useInsightFollows();

  const [pageName, setPageName] = useState("");
  const [pageId, setPageId] = useState("");

  const competitorAds = useMemo(() => {
    if (!competitor) return [];
    return DUMMY_ADS.filter(ad => ad.brand.toLowerCase() === competitor.name.toLowerCase());
  }, [competitor]);

  if (!competitor) return null;

  const insights = getCompetitorInsights(competitor.name);
  const following = competitor.id?.startsWith("fb-") ? false : isFollowing(competitor.id);

  const handleAddPage = () => {
    addPage.mutate({ name: pageName, page_id: pageId }, {
      onSuccess: () => { toast.success("Page added"); setPageName(""); setPageId(""); setAddModal(null); },
    });
  };

  const isFallback = competitor.id?.startsWith("fb-");

  return (
    <>
      <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
        <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 flex-wrap">
              {competitor.name}
              <Badge variant="outline">{competitor.competitor_type === "brand" ? "domain" : competitor.competitor_type}</Badge>
              <Badge variant={competitor.status === "active" ? "default" : "secondary"}>{competitor.status}</Badge>
              {!isFallback && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto"
                  onClick={() =>
                    following
                      ? unfollow.mutate({ id: competitor.id, name: competitor.name })
                      : follow.mutate({ id: competitor.id, name: competitor.name })
                  }
                >
                  {following ? <><UserMinus className="h-3.5 w-3.5 mr-1" /> Unfollow</> : <><UserPlus className="h-3.5 w-3.5 mr-1" /> Follow</>}
                </Button>
              )}
            </SheetTitle>
          </SheetHeader>

          <Tabs defaultValue="overview" className="mt-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="pages">Pages ({isFallback ? 0 : pages.length})</TabsTrigger>
              <TabsTrigger value="ads">Ads ({competitorAds.length})</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-5 mt-4">
              {/* Info grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Identifier</span><p className="font-medium">{competitor.identifier}</p></div>
                <div><span className="text-muted-foreground">Country</span><p className="font-medium">{competitor.country ?? "—"}</p></div>
                <div><span className="text-muted-foreground">Language</span><p className="font-medium">{competitor.language ?? "—"}</p></div>
                <div><span className="text-muted-foreground">Added</span><p className="font-medium">{new Date(competitor.created_at).toLocaleDateString()}</p></div>
              </div>
              {competitor.description && <p className="text-sm text-muted-foreground">{competitor.description}</p>}

              {/* Insights KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Card><CardContent className="p-3 text-center">
                  <TrendingUp className="h-4 w-4 mx-auto mb-1 text-primary" />
                  <p className="text-lg font-bold">{insights.totalAds}</p>
                  <p className="text-[11px] text-muted-foreground">Total Ads Detected</p>
                </CardContent></Card>
                <Card><CardContent className="p-3 text-center">
                  <TrendingUp className="h-4 w-4 mx-auto mb-1 text-primary" />
                  <p className="text-lg font-bold">{insights.activeAds}</p>
                  <p className="text-[11px] text-muted-foreground">Active Ads</p>
                </CardContent></Card>
                <Card><CardContent className="p-3 text-center">
                  <DollarSign className="h-4 w-4 mx-auto mb-1 text-primary" />
                  <p className="text-lg font-bold">{insights.monthlySpend}</p>
                  <p className="text-[11px] text-muted-foreground">Est. Monthly Spend</p>
                </CardContent></Card>
                <Card><CardContent className="p-3 text-center">
                  <Video className="h-4 w-4 mx-auto mb-1 text-primary" />
                  <p className="text-lg font-bold">{insights.topFormat} ({insights.topFormatPct}%)</p>
                  <p className="text-[11px] text-muted-foreground">Top Ad Format</p>
                </CardContent></Card>
                <Card><CardContent className="p-3 text-center">
                  <LayoutGrid className="h-4 w-4 mx-auto mb-1 text-primary" />
                  <p className="text-lg font-bold">"{insights.topCta}"</p>
                  <p className="text-[11px] text-muted-foreground">Most Used CTA</p>
                </CardContent></Card>
                <Card><CardContent className="p-3 text-center">
                  <Clock className="h-4 w-4 mx-auto mb-1 text-primary" />
                  <p className="text-lg font-bold">{insights.avgDuration}</p>
                  <p className="text-[11px] text-muted-foreground">Avg Ad Duration</p>
                </CardContent></Card>
              </div>

              {/* Ad Format Distribution Chart */}
              <div>
                <h4 className="text-sm font-medium mb-2">Ad Format Distribution</h4>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={insights.formatChart}>
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Recent Activity Timeline */}
              <div>
                <h4 className="text-sm font-medium mb-2">Recent Activity</h4>
                <div className="space-y-2">
                  {insights.timeline.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 text-xs">
                      <span className="text-muted-foreground shrink-0 w-20">{item.time}</span>
                      <div className="h-1.5 w-1.5 rounded-full bg-primary mt-1 shrink-0" />
                      <span>{item.event}</span>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Pages Tab */}
            <TabsContent value="pages" className="mt-4">
              {!isFallback && (
                <div className="flex justify-end mb-2">
                  <Button size="sm" variant="outline" onClick={() => setAddModal("page")}><Plus className="h-3.5 w-3.5 mr-1" /> Add Page</Button>
                </div>
              )}
              <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Page ID</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {(isFallback || pages.length === 0) && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No pages yet</TableCell></TableRow>}
                  {!isFallback && pages.map((p: any) => (
                    <TableRow key={p.id}><TableCell>{p.name}</TableCell><TableCell className="text-xs">{p.page_id}</TableCell><TableCell><Badge variant="outline">{p.status}</Badge></TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            {/* Ads Tab */}
            <TabsContent value="ads" className="mt-4">
              {competitorAds.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Image className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p>No ads detected yet for this competitor.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {competitorAds.map(ad => (
                    <InsightAdCard key={ad.id} ad={ad} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      {/* Add Page Modal */}
      <Dialog open={addModal === "page"} onOpenChange={(o) => !o && setAddModal(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Page</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Page Name</Label><Input value={pageName} onChange={(e) => setPageName(e.target.value)} placeholder="Page name" /></div>
            <div><Label>Page ID</Label><Input value={pageId} onChange={(e) => setPageId(e.target.value)} placeholder="External page ID" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddModal(null)}>Cancel</Button>
            <Button onClick={handleAddPage} disabled={!pageName.trim() || !pageId.trim()}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
