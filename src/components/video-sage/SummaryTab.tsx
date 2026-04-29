import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { VideoSageAnalysis } from "@/lib/video-sage-dummy-data";

interface Props {
  analysis: VideoSageAnalysis;
}

const FIELD_LABELS = [
  { key: "get" as const, label: "Get", subtitle: "Audience" },
  { key: "who" as const, label: "Who", subtitle: "Problem" },
  { key: "to" as const, label: "To", subtitle: "Intent" },
  { key: "by" as const, label: "By", subtitle: "Mechanism" },
];

export default function SummaryTab({ analysis }: Props) {
  const { summary, framework, metadata } = analysis;

  return (
    <div className="space-y-6">
      {/* What this video is really doing */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">What this video is really doing</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FIELD_LABELS.map(({ key, label, subtitle }) => (
            <Card key={key} className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-primary uppercase">{label}</span>
                  <span className="text-[10px] text-muted-foreground">({subtitle})</span>
                </div>
                <p className="text-sm text-foreground">{summary[key]}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Framework */}
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-muted-foreground">Framework Detected</span>
            <p className="text-sm font-semibold text-foreground">
              {framework.name} <span className="font-normal text-muted-foreground">— {framework.fullName}</span>
            </p>
          </div>
          <Button variant={framework.saved ? "default" : "outline"} size="sm" className="gap-1.5">
            <Bookmark className="w-3.5 h-3.5" />
            {framework.saved ? "Saved" : "Save"}
          </Button>
        </CardContent>
      </Card>

      {/* Metadata */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline" className="text-xs">{metadata.scriptingStyle}</Badge>
        <Badge variant="outline" className="text-xs">{metadata.captionTheme}</Badge>
        <Badge variant="outline" className="text-xs">{metadata.language}</Badge>
        <Badge variant="outline" className="text-xs">{metadata.duration}s</Badge>
      </div>
    </div>
  );
}
