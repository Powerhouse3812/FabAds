import { useState, useEffect } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PREDEFINED_TEMPLATES } from "@/lib/predefined-templates";
import { useTargetingTemplates } from "@/hooks/use-targeting-templates";
import type { CampaignUrlTargetingLink } from "@/hooks/use-campaign-url-targeting";
import { Check, Filter, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface TemplateSelectModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (payload: Record<string, any>, templateId?: string) => void;
  onSkip: () => void;
  campaignUrlId?: string | null;
  targetingLinks?: CampaignUrlTargetingLink[];
  campaignUrlName?: string | null;
  onLinkTemplate?: (templateId: string) => Promise<void>;
}

export function TemplateSelectModal({
  open, onClose, onSelect, onSkip,
  campaignUrlId, targetingLinks, campaignUrlName, onLinkTemplate,
}: TemplateSelectModalProps) {
  const { data: savedTemplates = [] } = useTargetingTemplates();
  const [selectedSaved, setSelectedSaved] = useState<string>("");
  const [selectedPredefined, setSelectedPredefined] = useState<string>("");
  const [filterByCampaignUrl, setFilterByCampaignUrl] = useState(!!campaignUrlId);

  const linkedTemplateIds = new Set((targetingLinks || []).map((l) => l.targeting_template_id));
  const defaultLink = (targetingLinks || []).find((l) => l.is_default);

  // Pre-select default template from campaign URL
  useEffect(() => {
    if (defaultLink && !selectedSaved) {
      setSelectedSaved(defaultLink.targeting_template_id);
    }
  }, [defaultLink?.targeting_template_id]);

  const filteredTemplates = filterByCampaignUrl && campaignUrlId
    ? savedTemplates.filter((t) => linkedTemplateIds.has(t.id))
    : savedTemplates;

  const handleContinue = async () => {
    if (selectedSaved) {
      const tpl = savedTemplates.find((t) => t.id === selectedSaved);
      if (tpl) {
        // If campaign URL is set and template is not linked, offer to link
        if (campaignUrlId && !linkedTemplateIds.has(tpl.id) && onLinkTemplate) {
          toast({
            title: `Template not linked to ${campaignUrlName || "Campaign URL"}`,
            description: "Linking it now...",
          });
          await onLinkTemplate(tpl.id);
        }
        onSelect(tpl.template_payload, tpl.id);
        return;
      }
    }
    if (selectedPredefined) {
      const tpl = PREDEFINED_TEMPLATES.find((t) => t.id === selectedPredefined);
      if (tpl) {
        onSelect(tpl.payload);
        return;
      }
    }
  };

  const handleSelectPredefined = (id: string) => {
    setSelectedPredefined(id === selectedPredefined ? "" : id);
    setSelectedSaved("");
  };

  const handleSelectSaved = (id: string) => {
    setSelectedSaved(id);
    setSelectedPredefined("");
  };

  const hasSelection = !!selectedSaved || !!selectedPredefined;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select Template</DialogTitle>
          <DialogDescription>
            Choose a targeting template to prefill your campaign and adset configuration, or start fresh.
          </DialogDescription>
        </DialogHeader>

        {/* Saved templates */}
        {filteredTemplates.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Saved Templates</label>
              {campaignUrlId && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs h-7"
                  onClick={() => setFilterByCampaignUrl(!filterByCampaignUrl)}
                >
                  {filterByCampaignUrl ? (
                    <><X className="h-3 w-3 mr-1" /> Show all</>
                  ) : (
                    <><Filter className="h-3 w-3 mr-1" /> Filter by Campaign URL</>
                  )}
                </Button>
              )}
            </div>
            <Select value={selectedSaved} onValueChange={handleSelectSaved}>
              <SelectTrigger>
                <SelectValue placeholder="Select a saved template" />
              </SelectTrigger>
              <SelectContent>
                {filteredTemplates.map((t) => {
                  const isLinked = linkedTemplateIds.has(t.id);
                  const isDefault = defaultLink?.targeting_template_id === t.id;
                  return (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                      {isDefault ? " ★ Default" : isLinked ? " ✓ Linked" : ""}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        )}

        {savedTemplates.length === 0 && campaignUrlId && (
          <p className="text-sm text-muted-foreground">No saved templates found.</p>
        )}

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <Separator className="flex-1" />
          <span>Or choose from predefined</span>
          <Separator className="flex-1" />
        </div>

        {/* Predefined templates grid */}
        <div className="grid grid-cols-3 gap-3">
          {PREDEFINED_TEMPLATES.map((tpl) => {
            const isSelected = selectedPredefined === tpl.id;
            const Icon = tpl.icon;
            return (
              <Card
                key={tpl.id}
                className={`cursor-pointer transition-all hover:border-primary/50 ${isSelected ? "border-primary ring-1 ring-primary" : ""}`}
                onClick={() => handleSelectPredefined(tpl.id)}
              >
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-muted">
                        <Icon className="h-4 w-4 text-foreground" />
                      </div>
                      <span className="text-sm font-medium text-foreground">{tpl.name}</span>
                    </div>
                    {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{tpl.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {tpl.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">{tag}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <Button variant="ghost" onClick={onSkip}>
            Skip and Start with new
          </Button>
          <Button onClick={handleContinue} disabled={!hasSelection}>
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
