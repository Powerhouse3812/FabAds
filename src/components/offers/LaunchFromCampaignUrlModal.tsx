import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useOfferFolders } from "@/hooks/use-offer-folders";
import { useCampaignUrlTargetingLinks } from "@/hooks/use-campaign-url-targeting";
import { useTargetingTemplates } from "@/hooks/use-targeting-templates";
import { useNavigate } from "react-router-dom";
import { Rocket, Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignUrlId: string;
  campaignUrlName: string;
}

export default function LaunchFromCampaignUrlModal({ open, onOpenChange, campaignUrlId, campaignUrlName }: Props) {
  const navigate = useNavigate();
  const { data: folders, isLoading: foldersLoading } = useOfferFolders(campaignUrlId);
  const { data: targetingLinks, isLoading: linksLoading } = useCampaignUrlTargetingLinks(campaignUrlId);
  const { data: allTemplates } = useTargetingTemplates();

  const [selectedFolderId, setSelectedFolderId] = useState<string>("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  // Pre-select default template
  useEffect(() => {
    if (targetingLinks?.length) {
      const defaultLink = targetingLinks.find((l) => l.is_default);
      if (defaultLink) setSelectedTemplateId(defaultLink.targeting_template_id);
      else setSelectedTemplateId(targetingLinks[0].targeting_template_id);
    }
  }, [targetingLinks]);

  // Pre-select first folder
  useEffect(() => {
    if (folders?.length && !selectedFolderId) {
      setSelectedFolderId(folders[0].id);
    }
  }, [folders]);

  const linkedTemplateIds = new Set((targetingLinks || []).map((l) => l.targeting_template_id));
  const linkedTemplates = (allTemplates || []).filter((t) => linkedTemplateIds.has(t.id));

  const handleLaunch = () => {
    const params = new URLSearchParams();
    params.set("campaignUrlId", campaignUrlId);
    if (selectedFolderId) params.set("folderId", selectedFolderId);
    if (selectedTemplateId) params.set("templateId", selectedTemplateId);
    navigate(`/launch/new?${params.toString()}`);
    onOpenChange(false);
  };

  const isLoading = foldersLoading || linksLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5" />
            Launch from {campaignUrlName}
          </DialogTitle>
          <DialogDescription>
            Select a folder and targeting template, then proceed to the launch flow.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Folder selector */}
            <div className="space-y-1.5">
              <Label className="text-sm">Asset Folder</Label>
              {!folders?.length ? (
                <p className="text-sm text-muted-foreground">No folders linked to this Campaign URL.</p>
              ) : (
                <Select value={selectedFolderId} onValueChange={setSelectedFolderId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a folder" />
                  </SelectTrigger>
                  <SelectContent>
                    {folders.map((f) => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.name} ({f.total_items || 0} assets)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Template selector */}
            <div className="space-y-1.5">
              <Label className="text-sm">Targeting Template</Label>
              {!linkedTemplates.length ? (
                <p className="text-sm text-muted-foreground">No targeting templates linked. You can select one in the launch flow.</p>
              ) : (
                <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {linkedTemplates.map((t) => {
                      const isDefault = targetingLinks?.find((l) => l.targeting_template_id === t.id)?.is_default;
                      return (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}{isDefault ? " (Default)" : ""}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleLaunch} disabled={isLoading}>
            <Rocket className="h-4 w-4 mr-1.5" />
            Launch
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
