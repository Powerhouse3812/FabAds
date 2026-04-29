import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { VideoSageAnalysis } from "@/lib/video-sage-dummy-data";

interface Props {
  analysis: VideoSageAnalysis;
}

export default function StoryboardTab({ analysis }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Storyboard</h3>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Download className="w-3.5 h-3.5" /> Export
        </Button>
      </div>

      <div className="rounded-lg border overflow-auto max-h-[500px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px] text-xs">Timeline</TableHead>
              <TableHead className="w-[140px] text-xs">Scene</TableHead>
              <TableHead className="text-xs">Visuals</TableHead>
              <TableHead className="text-xs">Dialogue / Audio</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {analysis.storyboard.map((row, i) => (
              <TableRow key={i}>
                <TableCell className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                  {row.time}
                </TableCell>
                <TableCell className="text-xs font-medium">{row.scene}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{row.visuals}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{row.dialogue}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
