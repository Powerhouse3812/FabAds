/**
 * ReviewTree — left pane of Step 5 (Review & Launch).
 *
 * Multi-select rules (Meta Ads Manager parity):
 *   • Single click       → replace selection with this node
 *   • Ctrl/Cmd/Shift+click → additive ONLY if same NodeKind
 *   • Different kind clicked → clears previous selection, selects new node
 *
 * Visual: Meta-style square checkbox on every selectable row. Chevron is
 * a separate button (expand/collapse only — never triggers selection).
 */
import { useMemo, useState } from "react";
import {
  Building2,
  ChevronRight,
  Image as ImageIcon,
  Layers,
  ListTree,
  Megaphone,
  Table2,
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
  nodeKindFromId,
  type NodeKind,
  type TreeNode,
} from "./reviewModel";

const KIND_ICON: Record<NodeKind, React.ElementType> = {
  account: Building2,
  campaign: Megaphone,
  adset: Layers,
  ad: ImageIcon,
};

/* ------------------------------------------------------------------ */
/*  ReviewTree                                                          */
/* ------------------------------------------------------------------ */

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

  /**
   * Toggle selection. Enforces same-NodeKind rule:
   *   – additive + same kind  → toggle this node in the set
   *   – single click OR diff kind → replace with this node (or deselect if sole)
   */
  const toggle = (id: string, additive: boolean, kind: NodeKind) => {
    const currentKind =
      selected.size > 0 ? nodeKindFromId([...selected][0]) : null;

    if (additive && (currentKind === null || currentKind === kind)) {
      const next = new Set(selected);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      onSelectedChange(next);
    } else {
      // Non-additive or type switch: replace selection
      onSelectedChange(selected.has(id) && selected.size === 1 ? new Set() : new Set([id]));
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header + view toggle */}
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
          <div className="space-y-0.5 px-2 pb-4">
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
                      onClick={(e) =>
                        toggle(r.id, e.metaKey || e.ctrlKey || e.shiftKey, "ad")
                      }
                      className="cursor-pointer"
                    >
                      <TableCell className="py-1.5 text-[12px] text-muted-foreground">
                        {r.campaign}
                      </TableCell>
                      <TableCell className="py-1.5 text-[12px] text-muted-foreground">
                        {r.adSet}
                      </TableCell>
                      <TableCell className="py-1.5 text-[12px] font-medium">
                        {r.ad}
                      </TableCell>
                      <TableCell className="py-1.5 text-[12px] text-muted-foreground">
                        {r.page}
                      </TableCell>
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

/* ------------------------------------------------------------------ */
/*  ViewBtn                                                             */
/* ------------------------------------------------------------------ */

function ViewBtn({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium transition-colors",
        active
          ? "bg-card text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  TreeBranch                                                          */
/* ------------------------------------------------------------------ */

function TreeBranch({
  node,
  depth,
  selected,
  onToggle,
}: {
  node: TreeNode;
  depth: number;
  selected: Set<string>;
  onToggle: (id: string, additive: boolean, kind: NodeKind) => void;
}) {
  const [open, setOpen] = useState(depth < 2);
  const Icon = KIND_ICON[node.kind];
  const active = selected.has(node.id);
  const hasChildren = !!node.children?.length;
  const selectable = !node.summary;

  const indentStyle = { paddingLeft: `${depth * 14 + 4}px` };

  const handleSelect = (e: React.MouseEvent) => {
    if (!selectable) return;
    onToggle(node.id, e.metaKey || e.ctrlKey || e.shiftKey, node.kind);
  };

  /**
   * The selectable row: Meta-style checkbox + kind icon + label + count.
   * The entire button is the click target for selection.
   */
  const selectionRow = (
    <button
      type="button"
      disabled={!selectable}
      onClick={handleSelect}
      className={cn(
        "group flex flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors",
        active
          ? "bg-primary/10 ring-1 ring-inset ring-primary/30"
          : selectable
            ? "hover:bg-muted/60"
            : "cursor-default opacity-60",
      )}
    >
      {/* Meta-style square checkbox */}
      {selectable ? (
        <div
          className={cn(
            "flex h-[14px] w-[14px] flex-shrink-0 items-center justify-center rounded-[3px] border transition-all",
            active
              ? "border-primary bg-primary"
              : "border-border group-hover:border-primary/50",
          )}
        >
          {active && (
            <svg
              width="9"
              height="7"
              viewBox="0 0 9 7"
              fill="none"
              className="shrink-0"
            >
              <path
                d="M1 3.5L3.2 6L8 1"
                stroke="#121212"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      ) : (
        <span className="h-[14px] w-[14px] flex-shrink-0" />
      )}

      <Icon
        className={cn(
          "h-4 w-4 shrink-0",
          active ? "text-primary" : "text-muted-foreground",
        )}
      />
      <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
        {node.label}
      </span>
      {node.sub && !node.summary && (
        <span className="shrink-0 truncate text-[10px] text-muted-foreground">
          {node.sub}
        </span>
      )}
      {typeof node.count === "number" && (
        <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-muted-foreground">
          {node.count}
        </span>
      )}
    </button>
  );

  /* Leaf node — no expand chevron */
  if (!hasChildren) {
    return (
      <div className="flex items-center" style={indentStyle}>
        {/* Spacer to align with chevron on parent rows */}
        <span className="h-7 w-5 shrink-0" />
        {selectionRow}
      </div>
    );
  }

  /* Parent node — separate chevron (Collapsible) + selection row */
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="flex items-center" style={indentStyle}>
        {/* Chevron: expand/collapse only — never triggers selection */}
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex h-7 w-5 shrink-0 items-center justify-center rounded transition-colors hover:bg-muted/60"
          >
            <ChevronRight
              className={cn(
                "h-3.5 w-3.5 text-muted-foreground transition-transform",
                open && "rotate-90",
              )}
            />
          </button>
        </CollapsibleTrigger>
        {selectionRow}
      </div>
      <CollapsibleContent className="space-y-0.5">
        {node.children!.map((c) => (
          <TreeBranch
            key={c.id}
            node={c}
            depth={depth + 1}
            selected={selected}
            onToggle={onToggle}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
