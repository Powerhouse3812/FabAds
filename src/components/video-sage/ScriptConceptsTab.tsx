import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Trash2, ChevronDown, ChevronUp, FileText } from "lucide-react";
import { format } from "date-fns";
import type { ScriptConcept } from "@/lib/video-sage-dummy-data";

interface Props {
  concepts: ScriptConcept[];
  onEdit: (concept: ScriptConcept) => void;
  onDelete: (id: string) => void;
}

export default function ScriptConceptsTab({ concepts, onEdit, onDelete }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (concepts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-3">
        <FileText className="w-10 h-10 opacity-40" />
        <p className="text-sm">No script concepts generated yet.</p>
        <p className="text-xs">Use "Generate New Script" to create your first concept.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {concepts.map((c) => {
        const isExpanded = expandedId === c.id;
        return (
          <Card key={c.id} className="overflow-hidden">
            <CardContent className="p-4">
              {/* Header row */}
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="text-[10px] font-semibold shrink-0">
                  {c.framework}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {c.frameworkFull}
                </span>
                <span className="text-[10px] text-muted-foreground ml-auto">
                  {format(new Date(c.createdAt), "MMM dd, HH:mm")}
                </span>
              </div>

              {/* Preview */}
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                "{c.script[0]?.dialogue}"
              </p>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 text-xs"
                  onClick={() => setExpandedId(isExpanded ? null : c.id)}
                >
                  {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  {isExpanded ? "Collapse" : "View Script"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 text-xs"
                  onClick={() => onEdit(c)}
                >
                  <Pencil className="w-3 h-3" /> Edit with AI
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 text-xs text-destructive hover:text-destructive"
                  onClick={() => onDelete(c.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>

              {/* Expanded script table */}
              {isExpanded && (
                <div className="mt-3 rounded-md border overflow-auto max-h-[300px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[110px] text-[10px]">Timeline</TableHead>
                        <TableHead className="w-[140px] text-[10px]">Visual</TableHead>
                        <TableHead className="text-[10px]">Dialogue</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {c.script.map((row, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-[10px] font-mono text-muted-foreground whitespace-nowrap">
                            {row.time}
                          </TableCell>
                          <TableCell className="text-[10px] font-medium">{row.visual}</TableCell>
                          <TableCell className="text-[10px] text-muted-foreground">{row.dialogue}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
