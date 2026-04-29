import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Pencil, ExternalLink } from "lucide-react";

interface AdgroupData {
  id: string;
  pageName: string;
  pageAvatar?: string;
  type: string;
  primaryText: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  headline?: string;
  description?: string;
  destinationUrl?: string;
  displayLink?: string;
  cta?: string;
}

interface Props {
  adgroup: AdgroupData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete?: (id: string) => void;
}

export function AdgroupPropertiesModal({ adgroup, open, onOpenChange, onDelete }: Props) {
  if (!adgroup) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adgroup Properties</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Page info */}
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              {adgroup.pageAvatar && <AvatarImage src={adgroup.pageAvatar} />}
              <AvatarFallback>{adgroup.pageName[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{adgroup.pageName}</p>
              <Badge variant="secondary" className="text-[10px] px-1.5 h-4 mt-0.5">{adgroup.type}</Badge>
            </div>
          </div>

          {/* Primary text */}
          {adgroup.primaryText && (
            <div>
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1">Primary Text</p>
              <p className="text-sm text-foreground">{adgroup.primaryText}</p>
            </div>
          )}

          {/* Media */}
          <div className="rounded-lg overflow-hidden border border-border">
            <img src={adgroup.mediaUrl} alt="" className="w-full h-auto max-h-64 object-contain bg-muted" />
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {adgroup.headline && (
              <div>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Headline</p>
                <p className="text-foreground">{adgroup.headline}</p>
              </div>
            )}
            {adgroup.description && (
              <div>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Description</p>
                <p className="text-foreground">{adgroup.description}</p>
              </div>
            )}
            {adgroup.destinationUrl && (
              <div className="col-span-2">
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Destination URL</p>
                <a href={adgroup.destinationUrl} target="_blank" rel="noopener noreferrer" className="text-primary text-xs flex items-center gap-1 hover:underline">
                  {adgroup.destinationUrl} <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
            {adgroup.cta && (
              <div>
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">CTA</p>
                <p className="text-foreground">{adgroup.cta}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-border">
            <Button variant="outline" size="sm" disabled className="text-xs"><Pencil className="h-3.5 w-3.5 mr-1" /> Edit</Button>
            {onDelete && (
              <Button variant="destructive" size="sm" className="text-xs" onClick={() => { onDelete(adgroup.id); onOpenChange(false); }}>
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
