import { Building2, Compass, Lightbulb, Sparkles, Type } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LineageNode {
  id: string;
  label: string;
  type: "brand" | "concept" | "angle" | "hook" | "current";
}

interface ProvenanceLineageTreeProps {
  /** Typically 5: brand → concept → angle → hook → current. */
  nodes: LineageNode[];
  className?: string;
}

/**
 * ProvenanceLineageTree — horizontal flow visualisation of "how this was made".
 *
 * Distinctive anchor of Variant C's Provenance card. Nodes are small rounded
 * pills with an icon, mono-caps eyebrow ("BRAND" / "CONCEPT" / "ANGLE" / "HOOK"
 * / "THIS AD") and the node's label. Connectors between nodes are 1px lines;
 * the connector immediately BEFORE the current node renders lime.
 *
 * No SaaS detail screen visualises generation provenance as a flow diagram —
 * this is the not-generic signature element of Variant C.
 */
export function ProvenanceLineageTree({
  nodes,
  className,
}: ProvenanceLineageTreeProps) {
  return (
    <div
      className={cn(
        "flex items-stretch gap-1 overflow-x-auto pb-1",
        className,
      )}
      role="list"
      aria-label="Generation lineage"
    >
      {nodes.map((node, i) => {
        const isCurrent = node.type === "current";
        const Icon = iconFor(node.type);
        const eyebrow = eyebrowFor(node.type);
        const isConnectorToCurrent =
          i < nodes.length - 1 && nodes[i + 1].type === "current";

        return (
          <div key={node.id} className="flex items-center gap-1 shrink-0">
            {/* Node card */}
            <div
              role="listitem"
              className={cn(
                "rounded-xl border bg-card px-3 py-2 flex flex-col items-start gap-0.5 min-w-[100px]",
                isCurrent
                  ? "border-primary ring-2 ring-primary/20 bg-primary/[0.04]"
                  : "border-border/60",
              )}
            >
              <span className="flex items-center gap-1">
                <Icon
                  className={cn(
                    "h-3 w-3",
                    isCurrent ? "text-primary" : "text-muted-foreground/70",
                  )}
                  strokeWidth={2.2}
                  aria-hidden
                />
                <span
                  className={cn(
                    "font-mono text-[9px] uppercase tracking-[0.18em]",
                    isCurrent ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {eyebrow}
                </span>
              </span>
              <span
                className={cn(
                  "text-[12.5px] font-semibold leading-tight truncate max-w-[140px]",
                  isCurrent ? "text-foreground" : "text-foreground/85",
                )}
              >
                {node.label}
              </span>
            </div>
            {/* Connector to next node */}
            {i < nodes.length - 1 && (
              <div
                aria-hidden
                className={cn(
                  "h-px w-5 shrink-0",
                  isConnectorToCurrent ? "bg-primary" : "bg-border",
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function iconFor(type: LineageNode["type"]) {
  switch (type) {
    case "brand":
      return Building2;
    case "concept":
      return Lightbulb;
    case "angle":
      return Compass;
    case "hook":
      return Type;
    case "current":
      return Sparkles;
  }
}

function eyebrowFor(type: LineageNode["type"]): string {
  switch (type) {
    case "brand":
      return "Brand";
    case "concept":
      return "Concept";
    case "angle":
      return "Angle";
    case "hook":
      return "Hook";
    case "current":
      return "This ad";
  }
}
