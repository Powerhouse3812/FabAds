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
 *   • CHECKBOX SELECTION — per-node checkbox (hover-show, always-show-when-checked)
 *     selects the node + all descendants. Select-all in header. Indeterminate on
 *     partial subtree selection.
 *   • LAZY "+N more" EXPAND — clicking a summary node fully expands the ad set,
 *     revealing all ad leaves as real, selectable, editable nodes.
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
import { buildReviewTree, expandAdSetLeaves, nodeKindFromId, type NodeKind, type TreeNode } from "./reviewModel";
import type { FilterKind } from "./ReviewFiltersPopover";

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

/** Collect all non-summary node ids under a node (inclusive). Used for checkbox selection. */
function collectSelectableIds(node: TreeNode): string[] {
  if (node.summary) return [];
  const out = [node.id];
  node.children?.forEach((c) => out.push(...collectSelectableIds(c)));
  return out;
}

/** Collect all non-summary node ids in the full tree — for select-all. */
function collectAllSelectableIds(tree: TreeNode[]): string[] {
  const out: string[] = [];
  tree.forEach((n) => out.push(...collectSelectableIds(n)));
  return out;
}

/**
 * An HTML checkbox that supports the `indeterminate` attribute which React
 * doesn't wire natively — we use a ref to set it imperatively.
 */
function Checkbox({
  checked,
  indeterminate,
  onChange,
  className,
  "aria-label": ariaLabel,
}: {
  checked: boolean;
  indeterminate: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  "aria-label"?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      aria-label={ariaLabel}
      className={cn(
        "h-3 w-3 cursor-pointer rounded-sm border border-border accent-primary",
        className,
      )}
    />
  );
}

/**
 * Render a node label with the matching substring highlighted.
 * Falls back to plain text when query is empty or not found.
 */
function HighlightedLabel({ label, query }: { label: string; query: string }) {
  if (!query) return <>{label}</>;
  const idx = label.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{label}</>;
  return (
    <>
      {label.slice(0, idx)}
      <mark className="rounded-sm bg-primary/25 text-foreground not-italic">{label.slice(idx, idx + query.length)}</mark>
      {label.slice(idx + query.length)}
    </>
  );
}

export function NodeTreeRail({
  plan,
  tree: treeProp,
  selectedIds,
  onSelect,
  onMultiSelect,
  onRename,
  highlightQuery,
  filterKind,
}: {
  plan: PlanV2;
  /**
   * Pre-built review tree from Step4Review (already memoized there).
   * Optional — falls back to building locally when omitted (e.g. standalone use).
   */
  tree?: TreeNode[];
  /** Currently selected node ids — a row renders selected if it's included. */
  selectedIds: string[];
  /** Report a click; `additive` = shift/cmd/ctrl was held. Parent owns the rest. */
  onSelect: (id: string, additive: boolean) => void;
  /**
   * Report a checkbox-driven multi-select: `ids` is the full subtree of the
   * checked node. `add=true` → add ids; `add=false` → remove ids.
   * Also used by select-all (ids = all selectable node ids in the tree).
   */
  onMultiSelect: (ids: string[], add: boolean) => void;
  /** Called when the user commits an inline rename for a campaign/adset/ad node. */
  onRename?: (id: string, nameField: string, value: string) => void;
  /**
   * When set, node labels containing this query are highlighted; non-matching
   * nodes are dimmed (still visible for hierarchy context).
   */
  highlightQuery?: string;
  /**
   * When set to something other than "all", nodes that don't match the kind
   * (or "overridden" for nodes with at least one override) are dimmed.
   */
  filterKind?: FilterKind;
}) {
  // Use the pre-computed tree from the parent when available — avoids a second
  // buildPlanUnits call since Step4Review already memoizes buildReviewTree(plan).
  const localTree = useMemo(() => buildReviewTree(plan), [plan]);
  const tree = treeProp ?? localTree;
  const selected = useMemo(() => new Set(selectedIds), [selectedIds]);

  // All selectable IDs (non-summary nodes) for select-all logic.
  const allSelectableIds = useMemo(() => collectAllSelectableIds(tree), [tree]);
  const allSelected = allSelectableIds.length > 0 && allSelectableIds.every((id) => selected.has(id));
  const someSelected = !allSelected && allSelectableIds.some((id) => selected.has(id));

  // Expanded state — default-open the first account + its first campaign only.
  // All other nodes start collapsed so the screen isn't overwhelming on open.
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

  /**
   * Ad sets whose "+N more" summary node has been clicked — we render ALL their
   * ad leaves (via expandAdSetLeaves) instead of the capped 4 + summary.
   * Keyed by adSetNodeId (e.g. "t0:fb_123:c0:s1").
   * Only the ad sets the user explicitly expands are populated — lazy by design.
   */
  const [fullyExpandedAdSets, setFullyExpandedAdSets] = useState<Set<string>>(
    () => new Set<string>(),
  );

  /** Toggle a node's expand/collapse state (chevron click). */
  const toggle = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  /**
   * Expand (or collapse) the full ad leaf set for an ad set node.
   * adSetNodeId is derived by stripping `:more` from the summary node id,
   * or passed directly when the caller already has it.
   */
  const toggleFullAdSet = useCallback((adSetNodeId: string) => {
    setFullyExpandedAdSets((prev) => {
      const next = new Set(prev);
      if (next.has(adSetNodeId)) next.delete(adSetNodeId);
      else next.add(adSetNodeId);
      return next;
    });
  }, []);

  /**
   * Resolve the effective children for an adset node:
   * - If fully expanded, replace capped children with all real ad leaves.
   * - Otherwise use the tree's default children (4 leaves + summary if any).
   */
  const resolvedChildren = useCallback(
    (node: TreeNode): TreeNode[] | undefined => {
      if (node.kind === "adset" && fullyExpandedAdSets.has(node.id)) {
        const allLeaves = expandAdSetLeaves(plan, node.id);
        return allLeaves.length > 0 ? allLeaves : node.children;
      }
      return node.children;
    },
    [plan, fullyExpandedAdSets],
  );

  // Flatten currently-visible rows (respecting expand state) for keyboard nav.
  // Uses resolvedChildren so fully-expanded ad sets show all leaf rows.
  const visibleRows = useMemo(() => {
    const rows: { node: TreeNode; depth: number }[] = [];
    const walk = (nodes: TreeNode[], depth: number) => {
      for (const n of nodes) {
        rows.push({ node: n, depth });
        const children = resolvedChildren(n);
        if (children?.length && expanded.has(n.id)) walk(children, depth + 1);
      }
    };
    walk(tree, 0);
    return rows;
  }, [tree, expanded, resolvedChildren]);

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
        <Checkbox
          checked={allSelected}
          indeterminate={someSelected}
          onChange={(e) => onMultiSelect(allSelectableIds, e.target.checked)}
          aria-label={allSelected ? "Deselect all nodes" : "Select all nodes"}
        />
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
                fullyExpandedAdSets={fullyExpandedAdSets}
                onToggle={toggle}
                onToggleFullAdSet={toggleFullAdSet}
                onSelect={onSelect}
                onMultiSelect={onMultiSelect}
                onRename={onRename}
                highlightQuery={highlightQuery}
                filterKind={filterKind}
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
  fullyExpandedAdSets,
  onToggle,
  onToggleFullAdSet,
  onSelect,
  onMultiSelect,
  onRename,
  highlightQuery,
  filterKind,
}: {
  node: TreeNode;
  depth: number;
  plan: PlanV2;
  selected: Set<string>;
  expanded: Set<string>;
  /** Ad set node ids that have been fully expanded past the MAX_LEAVES cap. */
  fullyExpandedAdSets: Set<string>;
  onToggle: (id: string) => void;
  /** Toggle full-leaf visibility for an ad set (called when summary node is clicked). */
  onToggleFullAdSet: (adSetNodeId: string) => void;
  onSelect: (id: string, additive: boolean) => void;
  onMultiSelect: (ids: string[], add: boolean) => void;
  onRename?: (id: string, nameField: string, value: string) => void;
  highlightQuery?: string;
  filterKind?: FilterKind;
}) {
  const style = LEVEL_STYLE[node.kind];
  const Icon = style.Icon;
  const open = expanded.has(node.id);

  /**
   * For adset nodes that are fully expanded, swap out the capped children
   * with the full set of real ad leaves from expandAdSetLeaves.
   * This memo only runs for adset-kind nodes.
   */
  const effectiveChildren = useMemo((): TreeNode[] | undefined => {
    if (node.kind === "adset" && fullyExpandedAdSets.has(node.id)) {
      const allLeaves = expandAdSetLeaves(plan, node.id);
      return allLeaves.length > 0 ? allLeaves : node.children;
    }
    return node.children;
  }, [node, plan, fullyExpandedAdSets]);

  const hasChildren = !!(effectiveChildren?.length);
  const isSelected = selected.has(node.id);
  const selectable = !node.summary;

  // Checkbox checked/indeterminate state for this node's subtree.
  const subtreeSelectableIds = useMemo(
    () => (selectable ? collectSelectableIds(node) : []),
    [node, selectable],
  );
  const checkboxChecked = selectable && subtreeSelectableIds.length > 0 && subtreeSelectableIds.every((id) => selected.has(id));
  const checkboxIndeterminate = !checkboxChecked && subtreeSelectableIds.some((id) => selected.has(id));

  const [rowHovered, setRowHovered] = useState(false);

  // Inline rename state — only for campaign / adset / ad nodes.
  const renameable = selectable && node.kind !== "account";
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");

  const commitRename = () => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== node.label && onRename) {
      const kind = nodeKindFromId(node.id);
      const nameField =
        kind === "campaign" ? "campaignName" :
        kind === "adset"    ? "adSetName"    :
        "name";
      onRename(node.id, nameField, trimmed);
    }
    setRenaming(false);
  };

  const cancelRename = () => setRenaming(false);

  const startRename = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    if (!renameable) return;
    setRenameValue(node.label);
    setRenaming(true);
  };

  // Override count — subtree for parents, own for leaves.
  // For summary nodes, skip (they're not real nodes).
  const overrideCount = useMemo(() => {
    if (!selectable) return 0;
    if (hasChildren) return subtreeOverrideCount(plan, collectIds(node));
    return nodeOverrideCount(plan, node.id);
  }, [plan, node, hasChildren, selectable]);

  /**
   * Dim this node when it doesn't match the active search/filter.
   * Never dim selected nodes to avoid confusing UX.
   */
  const isDimmed = useMemo(() => {
    if (isSelected || node.summary) return false;
    if (highlightQuery) {
      const q = highlightQuery.toLowerCase();
      if (!node.label.toLowerCase().includes(q)) return true;
    }
    if (filterKind && filterKind !== "all") {
      if (filterKind === "overridden") return overrideCount === 0;
      return node.kind !== filterKind;
    }
    return false;
  }, [isSelected, node.summary, node.label, node.kind, highlightQuery, filterKind, overrideCount]);

  const handleClick = (e: React.MouseEvent) => {
    if (node.summary) {
      // Summary "+N more" node: derive the adSetNodeId by stripping ":more"
      // and toggle full expansion for that ad set.
      const adSetNodeId = node.id.replace(/:more$/, "");
      onToggleFullAdSet(adSetNodeId);
      return;
    }
    const additive = e.shiftKey || e.metaKey || e.ctrlKey;
    onSelect(node.id, additive);
  };

  // For summary nodes, show whether the parent ad set is currently expanded.
  const parentAdSetId = node.summary ? node.id.replace(/:more$/, "") : null;
  const summaryIsExpanded = parentAdSetId ? fullyExpandedAdSets.has(parentAdSetId) : false;

  return (
    <div className={isDimmed ? "opacity-40 transition-opacity" : undefined}>
      <div
        className="relative flex items-center"
        style={{ paddingLeft: `${depth * 16}px` }}
        onMouseEnter={() => setRowHovered(true)}
        onMouseLeave={() => setRowHovered(false)}
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

        {/* Per-node checkbox — show on row hover or when checked/indeterminate. */}
        {selectable && (rowHovered || checkboxChecked || checkboxIndeterminate) ? (
          <span className="z-10 flex h-7 w-5 shrink-0 items-center justify-center">
            <Checkbox
              checked={checkboxChecked}
              indeterminate={checkboxIndeterminate}
              onChange={(e) => onMultiSelect(subtreeSelectableIds, e.target.checked)}
              aria-label={`${checkboxChecked ? "Deselect" : "Select"} ${node.label} and descendants`}
            />
          </span>
        ) : (
          /* Placeholder maintains layout when checkbox is hidden. */
          <span className="h-7 w-5 shrink-0" />
        )}

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
          // Summary nodes are clickable (to expand), but not aria-pressed selectable.
          disabled={false}
          aria-pressed={selectable ? isSelected : undefined}
          onClick={handleClick}
          onDoubleClick={renameable ? startRename : undefined}
          className={cn(
            "group flex flex-1 items-center gap-2 rounded-lg px-1.5 py-1.5 text-left transition-colors",
            isSelected
              ? "bg-primary/15 ring-1 ring-inset ring-primary/40"
              : node.summary
                // Summary node: looks like a clickable hint, not a real item.
                ? "cursor-pointer opacity-70 hover:opacity-100 hover:bg-muted/50"
                : "hover:bg-muted/60",
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

          {/* Inline rename input replaces the label text when active. */}
          {renaming && renameable ? (
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); commitRename(); }
                if (e.key === "Escape") { e.preventDefault(); cancelRename(); }
              }}
              onClick={(e) => e.stopPropagation()}
              className="text-[13px] bg-transparent border-b border-primary outline-none w-full"
            />
          ) : (
            <span
              className={cn(
                "min-w-0 flex-1 truncate text-[13px]",
                isSelected
                  ? "font-semibold text-foreground"
                  : node.summary
                    ? "font-mono text-[11px] text-muted-foreground"
                    : "font-medium",
              )}
              title={node.label}
            >
              {node.summary ? (
                summaryIsExpanded ? "Show fewer ads" : node.label
              ) : (
                <HighlightedLabel label={node.label} query={highlightQuery ?? ""} />
              )}
            </span>
          )}

          {/* Override badge (lime). */}
          {!renaming && overrideCount > 0 && (
            <span className="shrink-0 rounded-full bg-primary/20 px-1.5 py-0.5 font-mono text-[10px] tabular-nums font-semibold text-primary">
              {overrideCount} changed
            </span>
          )}

          {/* Count badge (when no override badge). */}
          {!renaming && overrideCount === 0 && typeof node.count === "number" && (
            <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-muted-foreground">
              {node.count}
            </span>
          )}
        </button>
      </div>

      {/* Only render children DOM when this node is expanded (lazy render). */}
      {hasChildren && open && (
        <div>
          {effectiveChildren!.map((c) => (
            <Branch
              key={c.id}
              node={c}
              depth={depth + 1}
              plan={plan}
              selected={selected}
              expanded={expanded}
              fullyExpandedAdSets={fullyExpandedAdSets}
              onToggle={onToggle}
              onToggleFullAdSet={onToggleFullAdSet}
              onSelect={onSelect}
              onMultiSelect={onMultiSelect}
              onRename={onRename}
              highlightQuery={highlightQuery}
              filterKind={filterKind}
            />
          ))}
        </div>
      )}
    </div>
  );
}
