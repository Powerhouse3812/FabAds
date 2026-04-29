import { Copy, Download, RefreshCw, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import FrameworkTimeline from "./FrameworkTimeline";
import type { VideoSageAnalysis } from "@/lib/video-sage-dummy-data";
import { toast } from "@/hooks/use-toast";

interface Props {
  analysis: VideoSageAnalysis;
}

export default function FrameworkTab({ analysis }: Props) {
  const { framework, storyboard } = analysis;

  const copyBlock = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  return (
    <div className="space-y-6">
      {/* Detection banner */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <Badge className="bg-primary/10 text-primary border-primary/20 text-xs mb-1">Detected</Badge>
            <p className="text-sm font-semibold text-foreground">
              Framework: {framework.name} ({framework.fullName})
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Bookmark className="w-3.5 h-3.5" />
            Save framework
          </Button>
        </CardContent>
      </Card>

      {/* Timeline bar */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Timeline Breakdown</h3>
        <FrameworkTimeline segments={framework.segments} />
      </div>

      {/* Script structure */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Script Structure</h3>
        <div className="space-y-3">
          {storyboard.map((block, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-primary">Step {i + 1}</span>
                      <span className="text-xs font-medium text-foreground">{block.scene}</span>
                      <Badge variant="outline" className="text-[10px]">{block.time}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Visual:</span> {block.visuals}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">Dialog:</span> {block.dialogue}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => copyBlock(`${block.visuals}\n${block.dialogue}`)}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="gap-1.5">
          <Copy className="w-3.5 h-3.5" /> Copy All
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Download className="w-3.5 h-3.5" /> Download
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" /> Regenerate with AI
        </Button>
      </div>
    </div>
  );
}
