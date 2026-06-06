/**
 * ReviewTree — the left pane of Step 4's Meta two-pane review.
 *
 * A vertically-collapsible, multi-select Account → Campaign → AdSet → Ad tree
 * built from the representative model (reviewModel.buildReviewTree). Selecting
 * nodes drives the right pane (Edit / Preview). A "table view" toggle flips to
 * a flat Meta-style table of the same leaves. Counts summarise; we never render
 * every leaf — ad sets cap visible leaves and show "+N more".
 */
import { useMemo, useState } from "react";
import {
  ChevronRight,
  Layers,
  ListTree,
  Megaphone,
  Square,
  Table2,
  Image as ImageIcon,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { PlanV2 } from "../../types";
import {
  buildReviewTree,
  flattenTree,
  type NodeKind,
  type TreeNode,
} from "./reviewModel";

const KIND_ICON: Record<NodeKind, typeof Layers> = {
  account: Square,
  campaign: Megaphone,
  adset: Layers,
  ad: ImageIcon,
};

export function ReviewTree({
  plan,
  selected,
  onSelectedChange,
}: {
  plan: PlanV2;
  selected: Set<string>;
  onSelectedChange: (next: Set<string>) => void;
}) {
  const tree = useMemo(() => buildReviewTree(plan), [plan]);
  const rows = useMemo(() => flattenTree(tree), [tree]);
  const [view, setView] = useState<"tree" | "table">("tree");

  const toggle = (id: string, additive: boolean) => {
    const next = new Set(additive ? selected : []);
    if (selected.has(id) && (additive || selected.size === 1)) next.delete(id);
    else next.add(id);
    onSelectedChange(next);
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* header + view toggle */}
      <div className="flex flex-shrink-0 items-center justify-between gap-2 px-3 py-2.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <ListTree className="h-4 w-4 text-muted-foreground" />
          Structure
        </div>
        <div className="flex items-center rounded-full bg-muted p-0.5">
          <ViewBtn active={view === "tree"} onClick={() => setView("tree")} icon={ListTree} label="Tree" />
          <ViewBtn active={view === "table"} onClick={() => setView("table")} icon={Table2} label="Table" />
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        {view === "tree" ? (
          <div className="space-y-1 px-2 pb-4">
            {tree.length === 0 ? (
              <p className="px-2 py-8 text-center text-sm text-muted-foreground">
                Pick a destination in Setup to see the structure.
              </p>
            ) : (
              tree.map((node) => (
                <TreeBranch
                  key={node.id}
                  node={node}
                  depth={0}
                  selected={selected}
                  onToggle={toggle}
                />
              ))
            )}
          </div>
        ) : (
          <div className="px-2 pb-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="h-8 text-[11px]">Campaign</TableHead>
                  <TableHead className="h-8 text-[11px]">Ad set</TableHead>
                  <TableHead className="h-8 text-[11px]">Ad</TableHead>
                  <TableHead className="h-8 text-[11px]">Page</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const active = selected.has(r.id);
                  return (
                    <TableRow
                      key={r.id}
                      data-state={active ? "selected" : undefined}
                      onClick={(e) => toggle(r.id, e.metaKey || e.ctrlKey || e.shiftKey)}
                      className="cursor-pointer"
                    >
                      <TableCell className="py-1.5 text-[12px] text-muted-foreground">{r.campaign}</TableCell>
                      <TableCell className="py-1.5 text-[12px] text-muted-foreground">{r.adSet}</TableCell>
                      <TableCell className="py-1.5 text-[12px] font-medium">{r.ad}</TableCell>
                      <TableCell className="py-1.5 text-[12px] text-muted-foreground">{r.page}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

function ViewBtn({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Layers;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium transition-colors",
        active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function TreeBranch({
  node,
  depth,
  selected,
  onToggle,
}: {
  node: TreeNode;
  depth: number;
  selected: Set<string>;
  onToggle: (id: string, additive: boolean) => void;
}) {
  const [open, setOpen] = useState(depth < 2);
  const Icon = KIND_ICON[node.kind];
  const active = selected.has(node.id);
  const hasChildren = !!node.children?.length;

  const rowClass = cn(
    "group flex w-full items-center gap-2 rounded-lg py-1.5 pr-2 text-left transition-colors",
    active ? "bg-primary/10 ring-1 ring-inset ring-primary/30" : "hover:bg-muted/60",
    node.summary && "opacity-70",
  );
  const indent = { paddingLeft: `${depth * 14 + 8}px` };

  // a summarised "+N more" leaf is not selectable
  const selectable = !node.summary;

  const content = (
    <>
      {hasChildren ? (
        <ChevronRight
          className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-90")}
        />
      ) : (
        <span className="h-4 w-4 shrink-0" />
      )}
      <Icon className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-muted-foreground")} />
      <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{node.label}</span>
      {node.sub && !node.summary && (
        <span className="shrink-0 truncate text-[10px] text-muted-foreground">{node.sub}</span>
      )}
      {typeof node.count === "number" && (
        <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-muted-foreground">
          {node.count}
        </span>
      )}
    </>
  );

  if (!hasChildren) {
    return (
      <button
        type="button"
        disabled={!selectable}
        style={indent}
        className={rowClass}
        onClick={(e) => selectable && onToggle(node.id, e.metaKey || e.ctrlKey || e.shiftKey)}
      >
        {content}
      </button>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="flex items-center">
        <CollapsibleTrigger asChild>
          <button type="button" style={indent} className={cn(rowClass, "flex-1")}>
            {content}
          </button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="space-y-1">
        {node.children!.map((c) => (
          <TreeBranch key={c.id} node={c} depth={depth + 1} selected={selected} onToggle={onToggle} />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
