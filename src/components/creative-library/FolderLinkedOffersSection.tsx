import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { useFolderLinkedCampaignUrls, useUnlinkFolderFromCampaignUrl, type FolderLinkedCampaignUrl } from "@/hooks/use-cl-folders";
import { toast } from "@/hooks/use-toast";
import { ChevronDown, ExternalLink, Unlink, Package, Building2, Rocket } from "lucide-react";
import { useState } from "react";
import { DUMMY_FOLDER_AUTOPILOT_USAGE, type DummyAutoPilotUsage } from "@/components/autopilot/autopilot-dummy-data";

interface Props {
  folderId: string;
  folderName?: string;
  isReadOnly?: boolean;
}

export function FolderLinkedOffersSection({ folderId, folderName, isReadOnly }: Props) {
  const [open, setOpen] = useState(true);
  const [apOpen, setApOpen] = useState(true);
  const { data: linkedCampaignUrls = [], isLoading } = useFolderLinkedCampaignUrls(folderId);
  const unlinkMutation = useUnlinkFolderFromCampaignUrl();

  // Dummy AutoPilot usage based on folder name
  const autopilotUsage: DummyAutoPilotUsage[] = folderName ? (DUMMY_FOLDER_AUTOPILOT_USAGE[folderName] || []) : [];

  const handleUnlink = async (link: FolderLinkedCampaignUrl) => {
    try {
      await unlinkMutation.mutateAsync(link.id);
      toast({ title: `Removed link to "${link.campaign_url.name}"` });
    } catch {
      toast({ title: "Failed to remove link", variant: "destructive" });
    }
  };

  const openCampaignUrl = (cuId: string) => {
    window.open(`/launch/campaign-urls?editCampaignUrl=${cuId}`, "_blank");
  };

  if (isLoading) return null;

  return (
    <div className="border-t border-border">
      {/* Campaign URLs section */}
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-muted/50 transition-colors">
          <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${open ? "" : "-rotate-90"}`} />
          <Package className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-foreground">Linked Campaign URLs</span>
          <span className="text-[10px] text-muted-foreground">({linkedCampaignUrls.length})</span>
        </CollapsibleTrigger>

        <CollapsibleContent>
          {linkedCampaignUrls.length === 0 ? (
            <p className="px-4 pb-3 text-[11px] text-muted-foreground">No campaign URLs linked to this folder yet.</p>
          ) : (
            <div className="px-4 pb-3 space-y-2">
              {linkedCampaignUrls.map((link) => (
                <div key={link.id} className="rounded-lg border border-border bg-card p-2.5 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-foreground flex-1 truncate">{link.campaign_url.name}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      {!isReadOnly && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-[10px] px-2 text-destructive hover:text-destructive"
                          onClick={() => handleUnlink(link)}
                          disabled={unlinkMutation.isPending}
                        >
                          <Unlink className="h-3 w-3 mr-1" />
                          Remove
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[10px] px-2"
                        onClick={() => openCampaignUrl(link.campaign_url_id)}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Open
                      </Button>
                    </div>
                  </div>

                  {link.ad_accounts.length > 0 && (
                    <div className="flex items-start gap-1.5 pl-1">
                      <Building2 className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="flex flex-wrap gap-1">
                        {link.ad_accounts.map((acct) => (
                          <span
                            key={acct.id}
                            className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded"
                          >
                            {acct.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* AutoPilot Strategies section */}
      {autopilotUsage.length > 0 && (
        <Collapsible open={apOpen} onOpenChange={setApOpen}>
          <CollapsibleTrigger className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-muted/50 transition-colors border-t border-border">
            <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${apOpen ? "" : "-rotate-90"}`} />
            <Rocket className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-foreground">Used in AutoPilot</span>
            <span className="text-[10px] text-muted-foreground">({autopilotUsage.length})</span>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="px-4 pb-3 space-y-2">
              {autopilotUsage.map((usage, i) => (
                <div key={i} className="rounded-lg border border-border bg-card p-2.5 flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{usage.strategyName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">{usage.strategyAlias}</Badge>
                      <span className="text-[10px] text-muted-foreground">{usage.accountCount} account{usage.accountCount > 1 ? "s" : ""}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px] px-2 shrink-0"
                    onClick={() => window.open("/launch/autopilot", "_blank")}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Open
                  </Button>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}
