/**
 * NodeTreeRail — the master pane of the Review master-detail editor.
 *
 * Renders buildReviewTree as a file-tree rail with:
 *   • COLOR-CODED levels — each level gets a tinted icon chip
 *     (account / campaign / adset / ad) so the hierarchy reads at a glance.
 *   • CONNECTOR LINES — vertical indentation guides per depth.
 *   • OVERRIDE BADGES — a lime "n changed" pill on any node with overrides
 *     (subtree count on parents, own count on leaves).
 *   • MULTI-SELECT — a row is selected when its id is in `selectedIds`.
 *     Plain click selects (non-additive); shift / cmd / ctrl click reports an
 *     additive click (the parent decides same-level + toggle semantics).
 *     Keyboard up/down moves selection; shift+up/down extends it (additive).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Building2,
  ChevronRight,
  Image as ImageIcon,
  Layers,
  ListTree,
  Megaphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PlanV2 } from "../../types";
import { nodeOverrideCount, subtreeOverrideCount } from "../../nodeOverrides";
import { buildReviewTree, type NodeKind, type TreeNode } from "./reviewModel";

/* Per-level icon + tinted chip color. Lime stays reserved for overrides. */
const LEVEL_STYLE: Record<
  NodeKind,
  { Icon: React.ElementType; chip: string; icon: string }
> = {
  account: { Icon: Building2, chip: "bg-sky-500/15", icon: "text-sky-500" },
  campaign: { Icon: Megaphone, chip: "bg-violet-500/15", icon: "text-violet-500" },
  adset: { Icon: Layers, chip: "bg-amber-500/15", icon: "text-amber-500" },
  ad: { Icon: ImageIcon, chip: "bg-teal-500/15", icon: "text-teal-500" },
};

/** Collect every node id under a node (inclusive) — for subtree override count. */
function collectIds(node: TreeNode): string[] {
  const out = [node.id];
  node.children?.forEach((c) => out.push(...collectIds(c)));
  return out;
}

export function NodeTreeRail({
  plan,
  selectedIds,
  onSelect,
}: {
  plan: PlanV2;
  /** Currently selected node ids — a row renders selected if it's included. */
  selectedIds: string[];
  /** Report a click; `additive` = shift/cmd/ctrl was held. Parent owns the rest. */
  onSelect: (id: string, additive: boolean) => void;
}) {
  const tree = useMemo(() => buildReviewTree(plan), [plan]);
  const selected = useMemo(() => new Set(selectedIds), [selectedIds]);

  // Expanded state — default-open the first account + its first campaign.
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const s = new Set<string>();
    const a = tree[0];
    if (a) {
      s.add(a.id);
      const c = a.children?.[0];
      if (c) s.add(c.id);
    }
    return s;
  });

  const toggle = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Flatten currently-visible rows (respecting expand state) for keyboard nav.
  const visibleRows = useMemo(() => {
    const rows: { node: TreeNode; depth: number }[] = [];
    const walk = (nodes: TreeNode[], depth: number) => {
      for (const n of nodes) {
        rows.push({ node: n, depth });
        if (n.children?.length && expanded.has(n.id)) walk(n.children, depth + 1);
      }
    };
    walk(tree, 0);
    return rows;
  }, [tree, expanded]);

  const containerRef = useRef<HTMLDivElement>(null);

  // The "anchor" for keyboard movement — the last id the parent reports back.
  const lastSelected = selectedIds[selectedIds.length - 1] ?? null;

  const move = useCallback(
    (dir: 1 | -1, additive: boolean) => {
      const idx = visibleRows.findIndex((r) => r.node.id === lastSelected);
      let next = idx + dir;
      // Skip non-selectable summary rows.
      while (next >= 0 && next < visibleRows.length && visibleRows[next].node.summary) {
        next += dir;
      }
      if (next < 0 || next >= visibleRows.length) return;
      onSelect(visibleRows[next].node.id, additive);
    },
    [visibleRows, lastSelected, onSelect],
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      move(1, e.shiftKey);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      move(-1, e.shiftKey);
    } else if ((e.key === "ArrowRight" || e.key === "ArrowLeft") && lastSelected) {
      const row = visibleRows.find((r) => r.node.id === lastSelected);
      if (row?.node.children?.length) {
        e.preventDefault();
        const isOpen = expanded.has(lastSelected);
        if ((e.key === "ArrowRight" && !isOpen) || (e.key === "ArrowLeft" && isOpen)) {
          toggle(lastSelected);
        }
      }
    }
  };

  // Auto-select the first account if nothing is selected.
  useEffect(() => {
    if (selectedIds.length === 0 && tree[0]) onSelect(tree[0].id, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tree]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-shrink-0 items-center gap-1.5 px-3 py-2.5 text-xs font-semibold text-foreground">
        <ListTree className="h-4 w-4 text-muted-foreground" />
        Structure
        <span className="ml-auto font-mono text-[10px] font-normal text-muted-foreground/60">
          ⇧-click to multi-select
        </span>
      </div>

      <div
        ref={containerRef}
        tabIndex={0}
        onKeyDown={onKeyDown}
        className="fab-focus min-h-0 flex-1 overflow-y-auto outline-none"
      >
        <div className="px-2 pb-4">
          {tree.length === 0 ? (
            <p className="px-2 py-8 text-center text-sm text-muted-foreground">
              Pick a destination in Setup to see the structure.
            </p>
          ) : (
            tree.map((node) => (
              <Branch
                key={node.id}
                node={node}
                depth={0}
                plan={plan}
                selected={selected}
                expanded={expanded}
                onToggle={toggle}
                onSelect={onSelect}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function Branch({
  node,
  depth,
  plan,
  selected,
  expanded,
  onToggle,
  onSelect,
}: {
  node: TreeNode;
  depth: number;
  plan: PlanV2;
  selected: Set<string>;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onSelect: (id: string, additive: boolean) => void;
}) {
  const style = LEVEL_STYLE[node.kind];
  const Icon = style.Icon;
  const open = expanded.has(node.id);
  const hasChildren = !!node.children?.length;
  const isSelected = selected.has(node.id);
  const selectable = !node.summary;

  // Override count — subtree for parents, own for leaves.
  const overrideCount = useMemo(() => {
    if (!selectable) return 0;
    if (hasChildren) return subtreeOverrideCount(plan, collectIds(node));
    return nodeOverrideCount(plan, node.id);
  }, [plan, node, hasChildren, selectable]);

  const handleClick = (e: React.MouseEvent) => {
    if (!selectable) return;
    const additive = e.shiftKey || e.metaKey || e.ctrlKey;
    onSelect(node.id, additive);
  };

  return (
    <div>
      <div
        className="relative flex items-center"
        style={{ paddingLeft: `${depth * 16}px` }}
      >
        {/* Connector guides — one vertical line per ancestor depth. */}
        {Array.from({ length: depth }).map((_, i) => (
          <span
            key={i}
            aria-hidden
            className="absolute top-0 bottom-0 w-px bg-border"
            style={{ left: `${i * 16 + 13}px` }}
          />
        ))}

        {/* Chevron (parents) or spacer (leaves). */}
        {hasChildren ? (
          <button
            type="button"
            onClick={() => onToggle(node.id)}
            aria-label={open ? "Collapse" : "Expand"}
            className="z-10 flex h-7 w-5 shrink-0 items-center justify-center rounded hover:bg-muted/60"
          >
            <ChevronRight
              className={cn(
                "h-3.5 w-3.5 text-muted-foreground transition-transform",
                open && "rotate-90",
              )}
            />
          </button>
        ) : (
          <span className="h-7 w-5 shrink-0" />
        )}

        <button
          type="button"
          disabled={!selectable}
          aria-pressed={selectable ? isSelected : undefined}
          onClick={handleClick}
          className={cn(
            "group flex flex-1 items-center gap-2 rounded-lg px-1.5 py-1.5 text-left transition-colors",
            isSelected
              ? "bg-primary/15 ring-1 ring-inset ring-primary/40"
              : selectable
                ? "hover:bg-muted/60"
                : "cursor-default opacity-60",
          )}
        >
          {/* Tinted level chip with icon. */}
          <span
            className={cn(
              "flex h-5 w-5 shrink-0 items-center justify-center rounded-md",
              node.summary ? "bg-muted" : style.chip,
            )}
          >
            <Icon className={cn("h-3 w-3", node.summary ? "text-muted-foreground" : style.icon)} />
          </span>

          <span
            className={cn(
              "min-w-0 flex-1 truncate text-[13px]",
              isSelected ? "font-semibold text-foreground" : "font-medium",
            )}
            title={node.label}
          >
            {node.label}
          </span>

          {/* Override badge (lime). */}
          {overrideCount > 0 && (
            <span className="shrink-0 rounded-full bg-primary/20 px-1.5 py-0.5 font-mono text-[10px] tabular-nums font-semibold text-primary">
              {overrideCount} changed
            </span>
          )}

          {/* Count badge (when no override badge). */}
          {overrideCount === 0 && typeof node.count === "number" && (
            <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-muted-foreground">
              {node.count}
            </span>
          )}
        </button>
      </div>

      {hasChildren && open && (
        <div>
          {node.children!.map((c) => (
            <Branch
              key={c.id}
              node={c}
              depth={depth + 1}
              plan={plan}
              selected={selected}
              expanded={expanded}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
