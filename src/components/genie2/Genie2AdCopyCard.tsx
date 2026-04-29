import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, RefreshCw, Sparkles, Rocket } from "lucide-react";
import { toast } from "sonner";
import type { AdCopySet } from "@/lib/genie2-dummy-data";

interface Props {
  adCopy: AdCopySet;
}

export function Genie2AdCopyCard({ adCopy }: Props) {
  const handleCopy = () => {
    const text = `${adCopy.headline}\n\n${adCopy.primaryText}\n\n${adCopy.description}`;
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <Card className="group relative overflow-hidden transition-shadow hover:shadow-md">
      {/* Creative image preview */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        <img
          src={adCopy.imageUrl}
          alt={adCopy.headline}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>

      <CardContent className="p-4 space-y-3">
        <div className="space-y-1">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Headline</p>
          <p className="text-sm font-semibold text-foreground leading-snug">{adCopy.headline}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Primary Text</p>
          <p className="text-xs text-foreground/80 leading-relaxed">{adCopy.primaryText}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Description</p>
          <p className="text-xs text-muted-foreground">{adCopy.description}</p>
        </div>
        <div className="flex items-center gap-1 pt-2 border-t opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={handleCopy}>
            <Copy className="h-3 w-3 mr-1" /> Copy
          </Button>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
            <RefreshCw className="h-3 w-3 mr-1" /> Regenerate
          </Button>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
            <Sparkles className="h-3 w-3 mr-1" /> Variations
          </Button>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs ml-auto">
            <Rocket className="h-3 w-3 mr-1" /> Launch
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
