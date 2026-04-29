import { Copy, Download, RefreshCw, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import type { VideoSageAnalysis } from "@/lib/video-sage-dummy-data";

interface Props {
  analysis: VideoSageAnalysis;
  onEditWithAI?: () => void;
}

export default function ScriptTab({ analysis, onEditWithAI }: Props) {
  const copyAll = () => {
    const text = analysis.script.map((r) => `[${r.time}] ${r.dialogue}`).join("\n\n");
    navigator.clipboard.writeText(text);
    toast({ title: "Script copied to clipboard" });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Script</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={copyAll}>
            <Copy className="w-3.5 h-3.5" /> Copy
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="w-3.5 h-3.5" /> Download
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Regenerate
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={onEditWithAI}>
            <Pencil className="w-3.5 h-3.5" /> Edit with AI
          </Button>
        </div>
      </div>

      <div className="rounded-lg border overflow-auto max-h-[500px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[120px] text-xs">Timeline</TableHead>
              <TableHead className="w-[160px] text-xs">Visual</TableHead>
              <TableHead className="text-xs">Dialogue</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {analysis.script.map((row, i) => (
              <TableRow key={i}>
                <TableCell className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                  {row.time}
                </TableCell>
                <TableCell className="text-xs font-medium">{row.visual}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{row.dialogue}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
