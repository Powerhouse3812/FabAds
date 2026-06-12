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
 *
 * Accordion behavior:
 *   • Expanded state is lifted to ReviewTree (expandedIds: Set<string>).
 *   • Expanding a node collapses all its siblings (exclusive accordion per level).
 *   • Collapsing a node also removes all its descendants from expandedIds.
 *
 * Scroll-spy:
 *   • As the user scrolls DOWN, the closest visible account/campaign header
 *     auto-expands (siblings collapse).
 *   • Headers that scroll above the viewport auto-collapse on scroll UP.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Building2,
  ChevronRight,
  Image as ImageIcon,
  Layers,
  ListTree,
  Megaphone,
  X,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { PlanV2 } from "../../types";
import {
  buildReviewTree,
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
/*  Helpers — descendant removal + sibling lookup                      */
/* ------------------------------------------------------------------ */

function removeAllChildren(set: Set<string>, node: TreeNode): void {
  node.children?.forEach((c) => {
    set.delete(c.id);
    removeAllChildren(set, c);
  });
}

function removeDescendants(
  set: Set<string>,
  nodeId: string,
  allNodes: TreeNode[],
): void {
  function findAndRemove(nodes: TreeNode[]): boolean {
    for (const n of nodes) {
      if (n.id === nodeId) {
        removeAllChildren(set, n);
        return true;
      }
      if (n.children && findAndRemove(n.children)) return true;
    }
    return false;
  }
  findAndRemove(allNodes);
}

/** Returns the sibling array (same parent's children) that contains nodeId. */
function findSiblings(nodeId: string, roots: TreeNode[]): TreeNode[] | null {
  if (roots.some((r) => r.id === nodeId)) return roots;
  for (const r of roots) {
    if (r.children) {
      const found = findSiblings(nodeId, r.children);
      if (found) return found;
    }
  }
  return null;
}

/* ------------------------------------------------------------------ */
/*  KIND_LABEL                                                          */
/* ------------------------------------------------------------------ */

const KIND_LABEL: Record<NodeKind, string> = {
  account: "account",
  campaign: "campaign",
  adset: "ad set",
  ad: "ad",
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
  const [typeMismatchHint, setTypeMismatchHint] = useState(false);

  // ── Lifted expanded state ──────────────────────────────────────────
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    const set = new Set<string>();
    const firstAccount = tree[0];
    if (firstAccount) {
      set.add(firstAccount.id);
      const firstCampaign = firstAccount.children?.[0];
      if (firstCampaign) set.add(firstCampaign.id);
    }
    return set;
  });

  // ── Exclusive-accordion expand callback ───────────────────────────
  const toggleExpand = useCallback(
    (nodeId: string, siblings: TreeNode[]) => {
      setExpandedIds((prev) => {
        const next = new Set(prev);
        if (next.has(nodeId)) {
          // Collapsing: remove this node + all its descendants
          removeDescendants(next, nodeId, tree);
          next.delete(nodeId);
        } else {
          // Expanding: close siblings at the same level (exclusive accordion)
          siblings.forEach((s) => {
            if (s.id !== nodeId) {
              removeDescendants(next, s.id, tree);
              next.delete(s.id);
            }
          });
          next.add(nodeId);
        }
        return next;
      });
    },
    [tree],
  );

  // ── Node-ref registry for scroll-spy ──────────────────────────────
  const containerRef = useRef<HTMLDivElement>(null);
  const prevScrollTop = useRef(0);
  const nodeRefs = useRef<Map<string, HTMLElement>>(new Map());

  const registerNodeRef = useCallback(
    (id: string, el: HTMLElement | null) => {
      if (el) nodeRefs.current.set(id, el);
      else nodeRefs.current.delete(id);
    },
    [],
  );

  // ── Scroll-spy effect ─────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleScroll = () => {
      const scrollTop = el.scrollTop;
      const scrollingDown = scrollTop > prevScrollTop.current;
      prevScrollTop.current = scrollTop;

      const containerRect = el.getBoundingClientRect();
      const focusY = containerRect.top + containerRect.height * 0.35;

      // Only auto-expand account + campaign level to avoid over-triggering
      const isScrollSpyNode = (id: string): boolean => {
        const kind = nodeKindFromId(id);
        return kind === "account" || kind === "campaign";
      };

      if (scrollingDown) {
        // Find the node header closest to the focus zone
        let closestNode: { id: string; dist: number } | null = null;

        nodeRefs.current.forEach((headerEl, nodeId) => {
          if (!isScrollSpyNode(nodeId)) return;
          const rect = headerEl.getBoundingClientRect();
          if (rect.top >= containerRect.top && rect.top <= containerRect.bottom) {
            const dist = Math.abs(rect.top - focusY);
            if (!closestNode || dist < closestNode.dist) {
              closestNode = { id: nodeId, dist };
            }
          }
        });

        if (closestNode) {
          const { id: nodeId } = closestNode as { id: string; dist: number };
          if (!expandedIds.has(nodeId)) {
            const siblings = findSiblings(nodeId, tree);
            if (siblings) {
              toggleExpand(nodeId, siblings);
            }
          }
        }
      } else {
        // Scroll UP: collapse items whose header has exited above the viewport
        nodeRefs.current.forEach((headerEl, nodeId) => {
          if (!isScrollSpyNode(nodeId)) return;
          if (!expandedIds.has(nodeId)) return;
          const rect = headerEl.getBoundingClientRect();
          if (rect.bottom < containerRect.top) {
            const siblings = findSiblings(nodeId, tree) ?? [];
            toggleExpand(nodeId, siblings);
          }
        });
      }
    };

    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [expandedIds, toggleExpand, tree]);

  // ── Selection logic (unchanged) ───────────────────────────────────
  /**
   * Toggle selection. Enforces same-NodeKind rule:
   *   – additive + same kind  → toggle this node in the set
   *   – additive + diff kind  → show hint, do NOT select
   *   – single click OR diff kind → replace with this node (or deselect if sole)
   */
  const toggle = (id: string, additive: boolean, kind: NodeKind) => {
    const currentKind =
      selected.size > 0 ? nodeKindFromId([...selected][0]) : null;

    if (additive && currentKind !== null && currentKind !== kind) {
      // Type mismatch on ⌘+click — show hint, do not change selection
      setTypeMismatchHint(true);
      setTimeout(() => setTypeMismatchHint(false), 2000);
      return;
    }

    if (additive && (currentKind === null || currentKind === kind)) {
      const next = new Set(selected);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      onSelectedChange(next);
    } else {
      // Non-additive: replace selection (clear hint if visible)
      setTypeMismatchHint(false);
      onSelectedChange(
        selected.has(id) && selected.size === 1 ? new Set() : new Set([id]),
      );
    }
  };

  // Derive the selected kind for the count badge label
  const selectedKind: NodeKind | null =
    selected.size > 0 ? nodeKindFromId([...selected][0]) : null;

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header */}
      <div className="flex flex-shrink-0 flex-col gap-0.5 px-3 py-2.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <ListTree className="h-4 w-4 text-muted-foreground" />
          Structure
        </div>

        {/* Multi-select count badge + clear button */}
        {selected.size >= 2 && selectedKind ? (
          <div className="flex items-center gap-1.5">
            <span className="rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[10px] text-primary">
              {selected.size} {KIND_LABEL[selectedKind]}s selected
            </span>
            <button
              type="button"
              aria-label="Clear selection"
              onClick={() => onSelectedChange(new Set())}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          tree.length > 0 &&
          selected.size === 0 && (
            <p className="text-[10px] text-muted-foreground/60">
              ⌘+click to multi-select same type
            </p>
          )
        )}

        {/* Type mismatch hint */}
        {typeMismatchHint && (
          <p className="text-[10px] text-amber-600 dark:text-amber-400 pb-0.5">
            Only same-type items can be multi-selected
          </p>
        )}
      </div>

      {/* Scroll container — plain overflow-y-auto div for scroll-spy access */}
      <div ref={containerRef} className="min-h-0 flex-1 overflow-y-auto">
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
                siblings={tree}
                depth={0}
                selected={selected}
                onToggle={toggle}
                expandedIds={expandedIds}
                onExpand={toggleExpand}
                registerNodeRef={registerNodeRef}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  TreeBranch                                                          */
/* ------------------------------------------------------------------ */

function TreeBranch({
  node,
  siblings,
  depth,
  selected,
  onToggle,
  expandedIds,
  onExpand,
  registerNodeRef,
}: {
  node: TreeNode;
  siblings: TreeNode[];
  depth: number;
  selected: Set<string>;
  onToggle: (id: string, additive: boolean, kind: NodeKind) => void;
  expandedIds: Set<string>;
  onExpand: (nodeId: string, siblings: TreeNode[]) => void;
  registerNodeRef: (id: string, el: HTMLElement | null) => void;
}) {
  const open = expandedIds.has(node.id);
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
      <span
        className="min-w-0 flex-1 truncate text-[13px] font-medium"
        title={node.label}
      >
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
      <div
        ref={(el) => registerNodeRef(node.id, el)}
        className="flex items-center"
        style={indentStyle}
      >
        {/* Spacer to align with chevron on parent rows */}
        <span className="h-7 w-5 shrink-0" />
        {selectionRow}
      </div>
    );
  }

  /* Parent node — separate chevron (Collapsible) + selection row */
  return (
    <Collapsible open={open} onOpenChange={() => onExpand(node.id, siblings)}>
      <div
        ref={(el) => registerNodeRef(node.id, el)}
        className="flex items-center"
        style={indentStyle}
      >
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
        {node.children!.map((c, _i, arr) => (
          <TreeBranch
            key={c.id}
            node={c}
            siblings={arr}
            depth={depth + 1}
            selected={selected}
            onToggle={onToggle}
            expandedIds={expandedIds}
            onExpand={onExpand}
            registerNodeRef={registerNodeRef}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
