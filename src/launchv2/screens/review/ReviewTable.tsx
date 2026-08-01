/**
 * ReviewTable — tabbed table variant for Step 4 Review (Decision 21).
 *
 * Tabs: Ad Accounts | Campaigns | Ad Sets | Ads
 * Each tab has its own column schema. Row click → slide-over drawer with
 * NodeEditPane. Bulk checkbox selection → floating bulk-edit toolbar.
 * Double-click name cell → inline rename (Decision 26).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Building2, Image as ImageIcon, Layers, Megaphone, Pencil, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMoney } from "@/launch2/utils/time";
import type { PlanV2 } from "../../types";
import type { UseFlowV2 } from "../../state/useFlowV2";
import { buildReviewTree, flattenAllNodes, nodeKindFromId, reviewSummary, type NodeKind, type TreeNode } from "./reviewModel";
import { NodeEditPane } from "./NodeEditPane";
import { setManyNodesOverride } from "../../nodeOverrides";

type TableTab = "accounts" | "campaigns" | "adsets" | "ads";

const TAB_DEFS: { id: TableTab; label: string; kind: NodeKind; Icon: React.ElementType }[] = [
  { id: "accounts", label: "Ad Accounts", kind: "account", Icon: Building2 },
  { id: "campaigns", label: "Campaigns", kind: "campaign", Icon: Megaphone },
  { id: "adsets", label: "Ad Sets", kind: "adset", Icon: Layers },
  { id: "ads", label: "Ads", kind: "ad", Icon: ImageIcon },
];

/* ------------------------------------------------------------------ */
/*  Inline rename cell                                                  */
/* ------------------------------------------------------------------ */
function InlineNameCell({
  node,
  onRename,
}: {
  node: TreeNode;
  onRename: (id: string, name: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(node.label);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      setDraft(node.label);
      requestAnimationFrame(() => inputRef.current?.select());
    }
  }, [editing, node.label]);

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== node.label) onRename(node.id, trimmed);
    setEditing(false);
  };

  const cancel = () => {
    setDraft(node.label);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); commit(); }
          if (e.key === "Escape") { e.preventDefault(); cancel(); }
        }}
        onClick={(e) => e.stopPropagation()}
        className="w-full rounded border border-primary/50 bg-background px-1.5 py-0.5 text-[13px] outline-none focus:ring-1 focus:ring-primary/40"
      />
    );
  }

  return (
    <span
      className="group/name flex items-center gap-1.5"
      onDoubleClick={(e) => { e.stopPropagation(); setEditing(true); }}
    >
      <span className="truncate">{node.label}</span>
      <button
        type="button"
        title="Rename"
        onClick={(e) => { e.stopPropagation(); setEditing(true); }}
        className="invisible shrink-0 rounded p-0.5 text-muted-foreground hover:text-foreground group-hover/name:visible"
      >
        <Pencil className="h-3 w-3" />
      </button>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Slide-over drawer                                                   */
/* ------------------------------------------------------------------ */
function NodeDrawer({
  nodes,
  flow,
  onClose,
}: {
  nodes: TreeNode[];
  flow: UseFlowV2;
  onClose: () => void;
}) {
  // Esc key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  if (nodes.length === 0) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]" />
      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-[480px] flex-col rounded-l-2xl border-l border-border bg-background shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-4">
          <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-muted-foreground/70">
            {nodes.length === 1 ? "Edit node" : `Edit ${nodes.length} nodes`}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="fab-focus flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <NodeEditPane flow={flow} nodes={nodes} />
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Bulk-edit toolbar                                                   */
/* ------------------------------------------------------------------ */
function BulkToolbar({
  count,
  onEditBulk,
  onDeselect,
}: {
  count: number;
  onEditBulk: () => void;
  onDeselect: () => void;
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center gap-4 border-t border-border bg-card px-6 py-3 shadow-lg">
      <span className="font-mono text-[13px] font-medium tabular-nums text-foreground">
        {count} item{count !== 1 ? "s" : ""} selected
      </span>
      <button
        type="button"
        onClick={onEditBulk}
        className="rounded-full bg-primary px-4 py-1.5 font-mono text-[12px] font-semibold text-[#121212] hover:bg-primary/90 transition-colors"
      >
        Edit in bulk
      </button>
      <button
        type="button"
        onClick={onDeselect}
        className="ml-auto rounded-full border border-border px-3 py-1.5 font-mono text-[12px] text-muted-foreground hover:bg-muted transition-colors"
      >
        Deselect all
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Table header cell                                                   */
/* ------------------------------------------------------------------ */
function TH({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th
      className={cn(
        "border-b border-border bg-muted/40 px-3 py-2 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/70",
        right ? "text-right" : "text-left",
      )}
    >
      {children}
    </th>
  );
}

/* ------------------------------------------------------------------ */
/*  Per-tab table renderers                                             */
/* ------------------------------------------------------------------ */

function AccountsTable({
  nodes,
  selected,
  onToggle,
  onSelectAll,
  onRowClick,
  onRename,
  plan,
}: {
  nodes: TreeNode[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onRowClick: (n: TreeNode) => void;
  onRename: (id: string, name: string) => void;
  plan: PlanV2;
}) {
  const allChecked = nodes.length > 0 && nodes.every((n) => selected.has(n.id));
  const indeterminate = !allChecked && nodes.some((n) => selected.has(n.id));
  const checkRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (checkRef.current) checkRef.current.indeterminate = indeterminate; }, [indeterminate]);

  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr>
          <TH>
            <input
              ref={checkRef}
              type="checkbox"
              checked={allChecked}
              onChange={onSelectAll}
              className="h-4 w-4 cursor-pointer rounded accent-primary"
            />
          </TH>
          <TH>Name</TH>
          <TH>Status</TH>
          <TH>Pages</TH>
          <TH right>Campaigns</TH>
          <TH right>Budget / day</TH>
          <TH>Actions</TH>
        </tr>
      </thead>
      <tbody>
        {nodes.map((node, i) => {
          const isSelected = selected.has(node.id);
          const campaigns = (node.children ?? []).length;
          const sum = reviewSummary(plan);
          return (
            <tr
              key={node.id}
              onClick={() => onRowClick(node)}
              className={cn(
                "h-10 cursor-pointer transition-colors",
                isSelected ? "bg-primary/8" : i % 2 === 0 ? "bg-background" : "bg-muted/20",
                "hover:bg-accent/50",
              )}
            >
              <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggle(node.id)}
                  className="h-4 w-4 cursor-pointer rounded accent-primary"
                />
              </td>
              <td className="max-w-[200px] px-3 py-2 text-[13px] font-medium text-foreground">
                {/* Account names are read-only — sourced from target.accountName, not nodeOverrides */}
                <span className="truncate">{node.label}</span>
              </td>
              <td className="px-3 py-2">
                <span className="rounded-full bg-success/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-success-text">
                  Active
                </span>
              </td>
              <td className="px-3 py-2 font-mono text-[12px] tabular-nums text-muted-foreground">
                {node.sub || "—"}
              </td>
              <td className="px-3 py-2 text-right font-mono text-[12px] tabular-nums text-muted-foreground">
                {campaigns}
              </td>
              <td className="px-3 py-2 text-right font-mono text-[12px] tabular-nums text-foreground">
                {formatMoney(sum.budgetPerDay / Math.max(sum.accounts, 1), sum.currency)}
              </td>
              <td className="px-3 py-2">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onRowClick(node); }}
                  className="rounded-full border border-border px-2 py-0.5 font-mono text-[10px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  Edit
                </button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function CampaignsTable({
  nodes,
  selected,
  onToggle,
  onSelectAll,
  onRowClick,
  onRename,
  plan,
}: {
  nodes: TreeNode[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onRowClick: (n: TreeNode) => void;
  onRename: (id: string, name: string) => void;
  plan: PlanV2;
}) {
  const allChecked = nodes.length > 0 && nodes.every((n) => selected.has(n.id));
  const indeterminate = !allChecked && nodes.some((n) => selected.has(n.id));
  const checkRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (checkRef.current) checkRef.current.indeterminate = indeterminate; }, [indeterminate]);
  const sum = reviewSummary(plan);

  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr>
          <TH><input ref={checkRef} type="checkbox" checked={allChecked} onChange={onSelectAll} className="h-4 w-4 cursor-pointer rounded accent-primary" /></TH>
          <TH>Name</TH>
          <TH>Status</TH>
          <TH>Objective</TH>
          <TH>Budget mode</TH>
          <TH right>Budget / day</TH>
          <TH right>Ad sets</TH>
          <TH right>Ads</TH>
          <TH>Actions</TH>
        </tr>
      </thead>
      <tbody>
        {nodes.map((node, i) => {
          const isSelected = selected.has(node.id);
          const adSets = (node.children ?? []).length;
          const ads = node.count ?? 0;
          const obj = (plan.objective ?? "").replace("OUTCOME_", "").replace(/_/g, " ");
          return (
            <tr
              key={node.id}
              onClick={() => onRowClick(node)}
              className={cn(
                "h-10 cursor-pointer transition-colors",
                isSelected ? "bg-primary/8" : i % 2 === 0 ? "bg-background" : "bg-muted/20",
                "hover:bg-accent/50",
              )}
            >
              <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                <input type="checkbox" checked={isSelected} onChange={() => onToggle(node.id)} className="h-4 w-4 cursor-pointer rounded accent-primary" />
              </td>
              <td className="max-w-[200px] px-3 py-2 text-[13px] font-medium text-foreground">
                <InlineNameCell node={node} onRename={onRename} />
              </td>
              <td className="px-3 py-2">
                <span className="rounded-full bg-success/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-success-text">Active</span>
              </td>
              <td className="px-3 py-2 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">{obj || "—"}</td>
              <td className="px-3 py-2">
                <span className={cn(
                  "rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide",
                  plan.budgetMode === "CBO" ? "bg-violet-500/10 text-violet-500" : "bg-amber-500/10 text-amber-500",
                )}>
                  {node.fields?.budgetMode ?? plan.budgetMode}
                </span>
              </td>
              <td className="px-3 py-2 text-right font-mono text-[12px] tabular-nums text-foreground">
                {formatMoney((node.fields?.budgetAmount ?? plan.budgetAmount) as number, sum.currency)}
              </td>
              <td className="px-3 py-2 text-right font-mono text-[12px] tabular-nums text-muted-foreground">{adSets}</td>
              <td className="px-3 py-2 text-right font-mono text-[12px] tabular-nums text-muted-foreground">{ads}</td>
              <td className="px-3 py-2">
                <button type="button" onClick={(e) => { e.stopPropagation(); onRowClick(node); }} className="rounded-full border border-border px-2 py-0.5 font-mono text-[10px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">Edit</button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function AdSetsTable({
  nodes,
  selected,
  onToggle,
  onSelectAll,
  onRowClick,
  onRename,
  plan,
}: {
  nodes: TreeNode[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onRowClick: (n: TreeNode) => void;
  onRename: (id: string, name: string) => void;
  plan: PlanV2;
}) {
  const allChecked = nodes.length > 0 && nodes.every((n) => selected.has(n.id));
  const indeterminate = !allChecked && nodes.some((n) => selected.has(n.id));
  const checkRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (checkRef.current) checkRef.current.indeterminate = indeterminate; }, [indeterminate]);
  const sum = reviewSummary(plan);

  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr>
          <TH><input ref={checkRef} type="checkbox" checked={allChecked} onChange={onSelectAll} className="h-4 w-4 cursor-pointer rounded accent-primary" /></TH>
          <TH>Name</TH>
          <TH>Status</TH>
          <TH>Optimization</TH>
          <TH>Audience</TH>
          <TH>Placement</TH>
          <TH right>Budget / day</TH>
          <TH right>Ads</TH>
          <TH>Actions</TH>
        </tr>
      </thead>
      <tbody>
        {nodes.map((node, i) => {
          const isSelected = selected.has(node.id);
          const opt = ((node.fields?.optimizationGoal ?? plan.optimizationGoal ?? "") as string).replace(/_/g, " ").toLowerCase();
          return (
            <tr
              key={node.id}
              onClick={() => onRowClick(node)}
              className={cn(
                "h-10 cursor-pointer transition-colors",
                isSelected ? "bg-primary/8" : i % 2 === 0 ? "bg-background" : "bg-muted/20",
                "hover:bg-accent/50",
              )}
            >
              <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                <input type="checkbox" checked={isSelected} onChange={() => onToggle(node.id)} className="h-4 w-4 cursor-pointer rounded accent-primary" />
              </td>
              <td className="max-w-[180px] px-3 py-2 text-[13px] font-medium text-foreground">
                <InlineNameCell node={node} onRename={onRename} />
              </td>
              <td className="px-3 py-2">
                <span className="rounded-full bg-success/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-success-text">Active</span>
              </td>
              <td className="px-3 py-2 text-[12px] capitalize text-muted-foreground">{opt || "—"}</td>
              <td className="max-w-[140px] truncate px-3 py-2 text-[12px] text-muted-foreground">{(node.fields?.audienceName as string) || "Broad"}</td>
              <td className="px-3 py-2">
                <span className={cn("rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide", plan.placementMode === "advantage" ? "bg-sky-500/10 text-sky-500" : "bg-border text-muted-foreground")}>
                  {plan.placementMode === "advantage" ? "Auto" : "Manual"}
                </span>
              </td>
              <td className="px-3 py-2 text-right font-mono text-[12px] tabular-nums text-foreground">
                {plan.budgetMode === "ABO" ? formatMoney(plan.budgetAmount, sum.currency) : "—"}
              </td>
              <td className="px-3 py-2 text-right font-mono text-[12px] tabular-nums text-muted-foreground">{node.count ?? 0}</td>
              <td className="px-3 py-2">
                <button type="button" onClick={(e) => { e.stopPropagation(); onRowClick(node); }} className="rounded-full border border-border px-2 py-0.5 font-mono text-[10px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">Edit</button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function AdsTable({
  nodes,
  selected,
  onToggle,
  onSelectAll,
  onRowClick,
  onRename,
  plan,
}: {
  nodes: TreeNode[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onRowClick: (n: TreeNode) => void;
  onRename: (id: string, name: string) => void;
  plan: PlanV2;
}) {
  const allChecked = nodes.length > 0 && nodes.every((n) => selected.has(n.id));
  const indeterminate = !allChecked && nodes.some((n) => selected.has(n.id));
  const checkRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (checkRef.current) checkRef.current.indeterminate = indeterminate; }, [indeterminate]);

  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr>
          <TH><input ref={checkRef} type="checkbox" checked={allChecked} onChange={onSelectAll} className="h-4 w-4 cursor-pointer rounded accent-primary" /></TH>
          <TH>Name</TH>
          <TH>Status</TH>
          <TH>Format</TH>
          <TH>Creative</TH>
          <TH>CTA</TH>
          <TH>Destination</TH>
          <TH>Actions</TH>
        </tr>
      </thead>
      <tbody>
        {nodes.map((node, i) => {
          if (node.summary) return null;
          const isSelected = selected.has(node.id);
          const creative = plan.creatives.find((c) => c.id === node.creativeId) ?? plan.creatives[0];
          const format = creative?.format?.replace(/_/g, " ") ?? "—";
          const cta = (node.fields?.cta ?? plan.adCopy.cta) as string;
          const ctaDisplay = cta ? cta.split("_").map((w: string) => w[0] + w.slice(1).toLowerCase()).join(" ") : "—";
          const dest = (node.fields?.destinationUrl ?? plan.adCopy.destinationUrl) as string;
          const destDisplay = dest ? (() => { try { return new URL(dest).hostname.replace(/^www\./, ""); } catch { return dest; } })() : "—";
          return (
            <tr
              key={node.id}
              onClick={() => onRowClick(node)}
              className={cn(
                "h-10 cursor-pointer transition-colors",
                isSelected ? "bg-primary/8" : i % 2 === 0 ? "bg-background" : "bg-muted/20",
                "hover:bg-accent/50",
              )}
            >
              <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                <input type="checkbox" checked={isSelected} onChange={() => onToggle(node.id)} className="h-4 w-4 cursor-pointer rounded accent-primary" />
              </td>
              <td className="max-w-[180px] px-3 py-2 text-[13px] font-medium text-foreground">
                <InlineNameCell node={node} onRename={onRename} />
              </td>
              <td className="px-3 py-2">
                <span className="rounded-full bg-success/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-success-text">Active</span>
              </td>
              <td className="px-3 py-2 text-[12px] capitalize text-muted-foreground">{format}</td>
              <td className="max-w-[120px] truncate px-3 py-2 text-[12px] text-muted-foreground">{creative?.name ?? "—"}</td>
              <td className="px-3 py-2 text-[12px] text-muted-foreground">{ctaDisplay}</td>
              <td className="max-w-[140px] truncate px-3 py-2 font-mono text-[11px] text-muted-foreground">{destDisplay}</td>
              <td className="px-3 py-2">
                <button type="button" onClick={(e) => { e.stopPropagation(); onRowClick(node); }} className="rounded-full border border-border px-2 py-0.5 font-mono text-[10px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">Edit</button>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/* ------------------------------------------------------------------ */
/*  Main ReviewTable component                                          */
/* ------------------------------------------------------------------ */

export function ReviewTable({
  flow,
  filterQuery,
}: {
  flow: UseFlowV2;
  filterQuery?: string;
}) {
  const { plan } = flow;
  const [activeTab, setActiveTab] = useState<TableTab>("accounts");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [drawerNodes, setDrawerNodes] = useState<TreeNode[]>([]);

  const tree = useMemo(() => buildReviewTree(plan), [plan]);
  const allNodes = useMemo(() => flattenAllNodes(tree), [tree]);

  // Nodes by kind for current tab
  const tabKind = TAB_DEFS.find((t) => t.id === activeTab)!.kind;
  const tabNodes = useMemo(() => {
    const base = allNodes.filter((n) => n.kind === tabKind && !n.summary);
    if (!filterQuery?.trim()) return base;
    const q = filterQuery.toLowerCase();
    return base.filter((n) =>
      n.label.toLowerCase().includes(q) ||
      n.sub?.toLowerCase().includes(q),
    );
  }, [allNodes, tabKind, filterQuery]);

  // Reset selection when tab changes
  useEffect(() => setSelectedIds(new Set()), [activeTab]);

  const toggleRow = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds((prev) => {
      const all = tabNodes.map((n) => n.id);
      if (all.every((id) => prev.has(id))) return new Set();
      return new Set(all);
    });
  }, [tabNodes]);

  const deselect = useCallback(() => setSelectedIds(new Set()), []);

  const openDrawer = useCallback((node: TreeNode) => {
    setDrawerNodes([node]);
  }, []);

  const openBulkDrawer = useCallback(() => {
    const nodes = tabNodes.filter((n) => selectedIds.has(n.id));
    setDrawerNodes(nodes);
  }, [tabNodes, selectedIds]);

  const closeDrawer = useCallback(() => setDrawerNodes([]), []);

  // Inline rename — saves to nodeOverrides[id][nameField] keyed per level.
  const handleRename = useCallback((id: string, name: string) => {
    const kind = nodeKindFromId(id);
    const nameField =
      kind === "campaign" ? "campaignName" :
      kind === "adset"    ? "adSetName"    :
      "name";
    flow.patch({
      nodeOverrides: setManyNodesOverride(plan.nodeOverrides, [id], nameField, name),
    });
  }, [flow, plan.nodeOverrides]);

  const showBulkBar = selectedIds.size >= 2;

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Tab bar */}
      <div className="flex shrink-0 items-center gap-0 border-b border-border px-4">
        {TAB_DEFS.map((tab) => {
          const count = allNodes.filter((n) => n.kind === tab.kind && !n.summary).length;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 border-b-2 px-4 py-3 font-mono text-[12px] font-medium transition-colors",
                active
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <tab.Icon className="h-3.5 w-3.5" />
              {tab.label}
              <span className={cn(
                "rounded-full px-1.5 py-0.5 font-mono text-[10px] tabular-nums",
                active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div className={cn("min-h-0 flex-1 overflow-auto", showBulkBar && "pb-14")}>
        {tabNodes.length === 0 ? (
          <div className="flex h-full items-center justify-center p-12 text-sm text-muted-foreground">
            {filterQuery ? "No matching rows for your filter." : "No nodes at this level."}
          </div>
        ) : activeTab === "accounts" ? (
          <AccountsTable
            nodes={tabNodes}
            selected={selectedIds}
            onToggle={toggleRow}
            onSelectAll={selectAll}
            onRowClick={openDrawer}
            onRename={handleRename}
            plan={plan}
          />
        ) : activeTab === "campaigns" ? (
          <CampaignsTable
            nodes={tabNodes}
            selected={selectedIds}
            onToggle={toggleRow}
            onSelectAll={selectAll}
            onRowClick={openDrawer}
            onRename={handleRename}
            plan={plan}
          />
        ) : activeTab === "adsets" ? (
          <AdSetsTable
            nodes={tabNodes}
            selected={selectedIds}
            onToggle={toggleRow}
            onSelectAll={selectAll}
            onRowClick={openDrawer}
            onRename={handleRename}
            plan={plan}
          />
        ) : (
          <AdsTable
            nodes={tabNodes}
            selected={selectedIds}
            onToggle={toggleRow}
            onSelectAll={selectAll}
            onRowClick={openDrawer}
            onRename={handleRename}
            plan={plan}
          />
        )}
      </div>

      {/* Bulk toolbar */}
      {showBulkBar && (
        <BulkToolbar
          count={selectedIds.size}
          onEditBulk={openBulkDrawer}
          onDeselect={deselect}
        />
      )}

      {/* Drawer */}
      {drawerNodes.length > 0 && (
        <NodeDrawer nodes={drawerNodes} flow={flow} onClose={closeDrawer} />
      )}
    </div>
  );
}
