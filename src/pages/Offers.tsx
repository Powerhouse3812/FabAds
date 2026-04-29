import { useState } from "react";
import { useWorkspace } from "@/hooks/use-workspace";
import { useOffers, useDeleteOffer } from "@/hooks/use-offers";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Link2, Search, SlidersHorizontal, Rocket, Zap } from "lucide-react";
import { DUMMY_CAMPAIGN_URL_AUTOPILOT_USAGE } from "@/components/autopilot/autopilot-dummy-data";
import { toast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import OfferSettingsDrawer from "@/components/offers/OfferSettingsDrawer";
import LaunchFromCampaignUrlModal from "@/components/offers/LaunchFromCampaignUrlModal";

export default function Offers() {
  const workspaceId = useWorkspace();
  const { data: offers, isLoading } = useOffers(workspaceId);
  const deleteOffer = useDeleteOffer();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editOfferId, setEditOfferId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Launch modal state
  const [launchModalOpen, setLaunchModalOpen] = useState(false);
  const [launchCampaignUrlId, setLaunchCampaignUrlId] = useState<string>("");
  const [launchCampaignUrlName, setLaunchCampaignUrlName] = useState<string>("");

  const filteredOffers = offers?.filter((o) =>
    o.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (id: string) => { setEditOfferId(id); setDrawerOpen(true); };
  const handleNew = () => { setEditOfferId(null); setDrawerOpen(true); };
  const handleLaunch = (id: string, name: string) => {
    setLaunchCampaignUrlId(id);
    setLaunchCampaignUrlName(name);
    setLaunchModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteOffer.mutateAsync(deleteId);
      toast({ title: "Campaign URL deleted" });
    } catch (err: any) {
      toast({ title: "Failed to delete", description: err.message, variant: "destructive" });
    }
    setDeleteId(null);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search campaign URLs..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon"><SlidersHorizontal className="h-4 w-4" /></Button>
        <Button className="ml-auto" onClick={handleNew}><Plus className="h-4 w-4 mr-1" /> New Campaign URL</Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading campaign URLs...</p>
      ) : !filteredOffers || filteredOffers.length === 0 ? (
        <p className="text-sm text-muted-foreground">{searchQuery ? "No matching campaign URLs." : "No campaign URLs yet. Create one to get started."}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Replacement</TableHead>
              <TableHead>Folders</TableHead>
              <TableHead>Assets</TableHead>
              <TableHead>Strategies</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOffers.map((o) => (
              <TableRow key={o.id}>
                <TableCell className="font-medium">{o.name}</TableCell>
                <TableCell>
                  {(o.replacement_links_count || 0) > 0 ? (
                    <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                      <Link2 className="h-3.5 w-3.5" />
                      {o.replacement_links_count} link{o.replacement_links_count !== 1 ? "s" : ""}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>{o.folders_count ?? "—"}</TableCell>
                <TableCell>{o.assets_count ?? "—"}</TableCell>
                <TableCell>
                  {(() => {
                    const strategies = DUMMY_CAMPAIGN_URL_AUTOPILOT_USAGE[o.id] || [];
                    return strategies.length > 0 ? (
                      <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                        <Zap className="h-3.5 w-3.5" />
                        {strategies.length}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    );
                  })()}
                </TableCell>
                <TableCell>
                  <Badge variant={o.status === "active" ? "default" : "secondary"}>{o.status}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleLaunch(o.id, o.name)} title="Launch">
                      <Rocket className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(o.id)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(o.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <OfferSettingsDrawer open={drawerOpen} onOpenChange={setDrawerOpen} workspaceId={workspaceId || ""} editOfferId={editOfferId} />

      <LaunchFromCampaignUrlModal
        open={launchModalOpen}
        onOpenChange={setLaunchModalOpen}
        campaignUrlId={launchCampaignUrlId}
        campaignUrlName={launchCampaignUrlName}
      />

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Campaign URL?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this campaign URL and all linked accounts, pages, and ad templates.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
