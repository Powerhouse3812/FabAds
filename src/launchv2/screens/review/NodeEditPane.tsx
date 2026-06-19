/**
 * NodeEditPane — the detail pane of the Review master-detail editor.
 *
 * Accepts the array of currently-selected nodes:
 *   • 0 selected  → empty state.
 *   • 1 selected  → single-node edit (each field: effective value via
 *     resolveNodeValue, edit → setNodeOverride, inherited = muted, overridden =
 *     lime left-bar + bold + Reset, per-section Advanced modal, ad crop modal).
 *   • >1 selected → BULK EDIT mode (parent guarantees all same kind). Common
 *     fields render once; a field shows its shared value when every node agrees,
 *     or a muted "Mixed" placeholder when they differ. Editing writes to ALL
 *     selected nodes via setManyNodesOverride; the lime accent + Reset appear if
 *     ANY selected node overrides the field, and Reset clears it on all of them.
 *     The Advanced + crop modals also fan out to every selected node.
 */
import { useMemo, useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Lock, Monitor, RotateCcw, Settings2, SlidersHorizontal } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { AssetCustomizationRule, PlanV2 } from "../../types";
import type { UseFlowV2 } from "../../state/useFlowV2";
import {
  SETTINGS_REGISTRY,
  advancedFields,
  commonFields,
  planDefaultFor,
  type SettingField,
} from "../../settingsRegistry";
import {
  ASSET_CUSTOMIZATION_KEY,
  isOverridden,
  resetNodeField,
  resetNode,
  resolveNodeValue,
  setManyNodesOverride,
} from "../../nodeOverrides";
import type { NodeKind, TreeNode } from "./reviewModel";
import { baselineAdCountForAdSet } from "./reviewModel";
import { FieldRenderer } from "./FieldRenderer";
import { AdvancedSettingsModal } from "./AdvancedSettingsModal";
import { PlacementCropModal } from "./PlacementCropModal";
import AudienceEditor from "../steps/audience/AudienceEditor";
import type { TargetingSpec } from "../../types";
import { PlacementPreviewTabs } from "./PlacementPreviewTabs";
import { AccountDetailPane } from "./AccountDetailPane";
import { fieldGateAcross, type FieldGate } from "./fieldGating";

const KIND_LABEL: Record<NodeKind, string> = {
  account: "Account",
  campaign: "Campaign",
  adset: "Ad set",
  ad: "Ad",
};

/** Plural label for the bulk header ("3 Campaigns selected"). */
const KIND_LABEL_PLURAL: Record<NodeKind, string> = {
  account: "accounts",
  campaign: "campaigns",
  adset: "ad sets",
  ad: "ads",
};

/** Sentinel returned by the cross-node value reducer when nodes disagree. */
const MIXED = Symbol("mixed");

/**
 * Resolve a field's value across many nodes:
 *   • all equal → that value
 *   • differ    → MIXED
 */
function valueAcross(
  plan: PlanV2,
  nodeIds: string[],
  fieldId: string,
  planDefault: unknown,
): unknown | typeof MIXED {
  let first: unknown;
  let seen = false;
  for (const id of nodeIds) {
    const v = resolveNodeValue(plan, id, fieldId, planDefault);
    if (!seen) {
      first = v;
      seen = true;
    } else if (!Object.is(v, first) && JSON.stringify(v) !== JSON.stringify(first)) {
      return MIXED;
    }
  }
  return first;
}

export function NodeEditPane({
  flow,
  nodes,
}: {
  flow: UseFlowV2;
  /** Currently-selected nodes (parent guarantees same kind when length > 1). */
  nodes: TreeNode[];
}) {
  const { plan } = flow;
  const [advSection, setAdvSection] = useState<string | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  // Audience accordion open state (D30)
  const [audienceOpen, setAudienceOpen] = useState(false);
  // Preview accordion open state (D25) — ad-level only
  const [previewOpen, setPreviewOpen] = useState(false);

  // Multi-open accordion: Set of expanded section ids — all open by default.
  const [openSection, setOpenSection] = useState<Set<string>>(new Set());
  const selectionKey = nodes.map((n) => n.id).join(",");
  useEffect(() => {
    const reg = SETTINGS_REGISTRY[nodes[0]?.kind];
    setOpenSection(new Set(reg ? reg.sections.map((s) => s.id) : []));
    // audienceOpen intentionally left alone — it's a separate accordion (D30).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectionKey]);

  const currency = plan.targets[0]?.currency ?? "USD";

  if (nodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center text-sm text-muted-foreground">
        Select a node in the tree to edit its settings.
      </div>
    );
  }

  const bulk = nodes.length > 1;
  const kind = nodes[0].kind;
  const nodeIds = nodes.map((n) => n.id);
  // The node whose values the modal reads from (its writers fan out to all).
  const headId = nodeIds[0];

  // Account nodes get a bespoke read-only detail panel (identity is set in Setup,
  // not editable here) + a collapsed per-account distribution control. Account
  // detail is single-account only — its one editable control (per-account page
  // split) writes to a single accountId, so a multi-account selection would
  // silently edit just the first. Show an honest hint instead of pretending.
  if (kind === "account") {
    if (bulk) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
          <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground/70">
            {nodes.length} accounts selected
          </span>
          <p className="max-w-xs text-sm text-muted-foreground">
            Account details and per-account distribution are edited one account at
            a time. Select a single account in the tree to view it.
          </p>
        </div>
      );
    }
    return <AccountDetailPane flow={flow} node={nodes[0]} />;
  }

  const reg = SETTINGS_REGISTRY[kind];
  const common = commonFields(kind, plan);
  const advanced = advancedFields(kind, plan);
  // How many of the selected nodes carry any override (drives the header pill).
  const overriddenNodes = nodeIds.filter(
    (id) => !!plan.nodeOverrides[id] && Object.keys(plan.nodeOverrides[id]).length > 0,
  ).length;

  // Common fields grouped by section, in registry order.
  const grouped = reg.sections
    .map((s) => ({
      section: s,
      fields: common.filter(
        (f) => f.section === s.id && !fieldGateAcross(plan, kind, nodeIds, f.id).hidden,
      ),
      hasAdvanced: advanced.some((f) => f.section === s.id),
    }))
    .filter((g) => g.fields.length > 0 || g.hasAdvanced);

  /* --- writers — always fan out across every selected node id --- */
  const setField = (field: SettingField, value: unknown) => {
    flow.patch({
      nodeOverrides: setManyNodesOverride(plan.nodeOverrides, nodeIds, field.id, value),
    });
  };
  const reset = (field: SettingField) => {
    let next = plan.nodeOverrides;
    for (const id of nodeIds) next = resetNodeField(next, id, field.id);
    flow.patch({ nodeOverrides: next });
  };
  const resetSelectedNodes = () => {
    let next = plan.nodeOverrides;
    for (const id of nodeIds) next = resetNode(next, id);
    flow.patch({ nodeOverrides: next });
  };

  const cropRules = (resolveNodeValue(
    plan,
    headId,
    ASSET_CUSTOMIZATION_KEY,
    [] as AssetCustomizationRule[],
  ) ?? []) as AssetCustomizationRule[];

  return (
    <ScrollArea className="h-full">
      <div className="space-y-5 p-4">
        {/* ── Pane header ─────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.08em] text-muted-foreground/70">
                {KIND_LABEL[kind]}
              </span>
              {overriddenNodes > 0 && (
                <span className="rounded-full bg-primary/20 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-primary">
                  {bulk ? `${overriddenNodes} changed` : `${nodeOverrideCountOf(plan, headId)} changed`}
                </span>
              )}
            </div>
            {bulk ? (
              <h3 className="text-base font-semibold text-foreground">
                {nodes.length} {KIND_LABEL_PLURAL[kind]} selected
                <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                  — editing all
                </span>
              </h3>
            ) : (
              <>
                <h3
                  className="truncate text-base font-semibold text-foreground"
                  title={nodes[0].label}
                >
                  {nodes[0].label}
                </h3>
                {nodes[0].sub && (
                  <p className="truncate text-xs text-muted-foreground">{nodes[0].sub}</p>
                )}
              </>
            )}
          </div>
          {overriddenNodes > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 shrink-0 text-muted-foreground"
              onClick={resetSelectedNodes}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {bulk ? "Reset all" : "Reset node"}
            </Button>
          )}
        </div>

        {/* ── Sections — multi-open accordion ─────────────────────── */}
        {grouped.map((g) => {
          const isOpen = openSection.has(g.section.id);
          return (
            <div key={g.section.id} className="overflow-hidden rounded-2xl border border-border">
              {/* Accordion trigger */}
              <button
                type="button"
                onClick={() =>
                  setOpenSection((prev) => {
                    const next = new Set(prev);
                    isOpen ? next.delete(g.section.id) : next.add(g.section.id);
                    return next;
                  })
                }
                className="flex w-full items-center justify-between px-4 py-3 cursor-pointer hover:bg-accent/30 transition-colors"
                aria-expanded={isOpen}
              >
                <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-foreground">
                  {g.section.label}
                </span>
                <span className="flex items-center gap-2">
                  {g.hasAdvanced && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setAdvSection(g.section.id);
                      }}
                      className="fab-focus inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <SlidersHorizontal className="h-3 w-3" /> More
                    </button>
                  )}
                  {isOpen ? (
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </span>
              </button>

              {/* Accordion body */}
              {isOpen && (
                <div className="space-y-3 border-t border-border px-4 py-3">
                  {g.fields.map((field) => {
                    const gate = fieldGateAcross(plan, kind, nodeIds, field.id);
                    return (
                      <EditField
                        key={field.id}
                        field={field}
                        plan={plan}
                        nodeIds={nodeIds}
                        headId={headId}
                        bulk={bulk}
                        currency={currency}
                        gate={gate}
                        onChange={(v) => setField(field, v)}
                        onReset={() => reset(field)}
                        onOpenCrop={() => setCropOpen(true)}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* ── Audience section — adset level only (D30) ────────────── */}
        {kind === "adset" && (() => {
          const specialAdCategoryActive =
            plan.specialAdDeclared && plan.specialAdCategories.length > 0;
          // Per-node targeting override if present, else fall back to plan.targeting
          const targeting: TargetingSpec =
            (plan.nodeOverrides[headId]?.["__targeting__"] as TargetingSpec | undefined) ??
            plan.targeting;
          const handleTargetingChange = (t: TargetingSpec) => {
            flow.patch({
              nodeOverrides: setManyNodesOverride(
                plan.nodeOverrides,
                nodeIds,
                "__targeting__",
                t,
              ),
            });
          };
          const audienceOverridden = nodeIds.some(
            (id) => !!plan.nodeOverrides[id]?.["__targeting__"],
          );
          return (
            <div className="overflow-hidden rounded-2xl border border-border">
              {/* Accordion trigger */}
              <button
                type="button"
                onClick={() => setAudienceOpen((prev) => !prev)}
                className="flex w-full items-center justify-between px-4 py-3 cursor-pointer hover:bg-accent/30 transition-colors"
                aria-expanded={audienceOpen}
              >
                <span className="flex items-center gap-2">
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-foreground">
                    Audience
                  </span>
                  {audienceOverridden && (
                    <span className="rounded-full bg-primary/20 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-primary">
                      overridden
                    </span>
                  )}
                </span>
                <Settings2
                  className={cn(
                    "h-3.5 w-3.5 text-muted-foreground transition-transform",
                    audienceOpen ? "rotate-90" : "",
                  )}
                />
              </button>

              {/* Accordion body */}
              {audienceOpen && (
                <div className="border-t border-border px-4 py-3">
                  <AudienceEditor
                    targeting={targeting}
                    onChange={handleTargetingChange}
                    specialAdCategoryActive={specialAdCategoryActive}
                    compact
                  />
                </div>
              )}
            </div>
          );
        })()}

        {/* ── Preview section — ad level, single-select only (D25) ─── */}
        {kind === "ad" && !bulk && (() => {
          // Find the TreeNode for the selected ad so PlacementPreviewTabs can
          // resolve the representative creative / copy correctly.
          const headNode = nodes[0] ?? null;
          return (
            <div className="overflow-hidden rounded-2xl border border-border">
              {/* Accordion trigger */}
              <button
                type="button"
                onClick={() => setPreviewOpen((prev) => !prev)}
                className="flex w-full items-center justify-between px-4 py-3 cursor-pointer hover:bg-accent/30 transition-colors"
                aria-expanded={previewOpen}
              >
                <span className="flex items-center gap-2">
                  <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-foreground">
                    Preview
                  </span>
                </span>
                {previewOpen ? (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </button>

              {/* Accordion body */}
              {previewOpen && (
                <div className="border-t border-border">
                  <PlacementPreviewTabs plan={plan} node={headNode} />
                </div>
              )}
            </div>
          );
        })()}

        {/* Whole-level advanced fallback (sections with only advanced fields,
            or levels that want one general "Advanced" entry). */}
        {advanced.length > 0 && grouped.every((g) => !g.hasAdvanced) && (
          <Button
            variant="outline"
            size="sm"
            className="h-9 w-full"
            onClick={() => setAdvSection("")}
          >
            <Settings2 className="h-4 w-4" />
            Advanced settings
          </Button>
        )}
      </div>

      {/* Advanced modal — reads from headId, writers fan out to all selected. */}
      <AdvancedSettingsModal
        open={advSection !== null}
        onOpenChange={(o) => !o && setAdvSection(null)}
        level={kind}
        nodeId={headId}
        plan={plan}
        currency={currency}
        section={advSection || undefined}
        onField={setField}
        onReset={reset}
        onOpenCrop={() => {
          setAdvSection(null);
          setCropOpen(true);
        }}
      />

      {/* Per-placement crop matrix (ad level) — applies to all selected. */}
      <PlacementCropModal
        open={cropOpen}
        onOpenChange={setCropOpen}
        rules={cropRules}
        creatives={plan.creatives}
        onSave={(rules) =>
          flow.patch({
            nodeOverrides: setManyNodesOverride(
              plan.nodeOverrides,
              nodeIds,
              ASSET_CUSTOMIZATION_KEY,
              rules,
            ),
          })
        }
      />
    </ScrollArea>
  );
}

/** Own override count for a single node (header pill in single-select). */
function nodeOverrideCountOf(plan: PlanV2, nodeId: string): number {
  const bag = plan.nodeOverrides[nodeId];
  return bag ? Object.keys(bag).length : 0;
}

function EditField({
  field,
  plan,
  nodeIds,
  headId,
  bulk,
  currency,
  gate,
  onChange,
  onReset,
  onOpenCrop,
}: {
  field: SettingField;
  plan: PlanV2;
  /** All selected node ids — length 1 for single-select. */
  nodeIds: string[];
  /** The first (or only) selected node id — used for per-node baseline lookups. */
  headId: string;
  /** True when multiple nodes are selected simultaneously. */
  bulk: boolean;
  currency: string;
  gate?: FieldGate;
  onChange: (v: unknown) => void;
  onReset: () => void;
  onOpenCrop: () => void;
}) {
  // For adsPerAdSet (adset level, single-select), show the per-slot baseline
  // as the inherited default instead of the flat plan.structure.adsPerAdSet,
  // which is misleading because slots receive unequal counts when the total
  // doesn't divide evenly. For multi-select (bulk) we fall back to the flat
  // planDefaultFor value — showing per-node baselines across heterogeneous
  // selections would need a per-node UI that we don't have yet.
  const planDefault = useMemo(
    () =>
      field.id === "adsPerAdSet" && !bulk
        ? baselineAdCountForAdSet(plan, headId)
        : planDefaultFor(plan, field),
    // field is stable (from static registry); plan + headId + bulk are the real deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [plan, headId, bulk, field.id],
  );
  // Overridden accent if ANY selected node overrides this field.
  const overridden = useMemo(
    () => nodeIds.some((id) => isOverridden(plan, id, field.id)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [plan, nodeIds, field.id],
  );
  // valueAcross may call JSON.stringify for object-valued fields — memoize to
  // avoid re-running the comparison on every parent re-render.
  const resolved = useMemo(
    () => valueAcross(plan, nodeIds, field.id, planDefault),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [plan, nodeIds, field.id, planDefault],
  );
  const mixed = resolved === MIXED;
  // In a mixed state we feed the renderer the plan default but flag a "Mixed"
  // placeholder so the user knows values vary.
  const value = mixed ? planDefault : resolved;

  // A locked field is owned by a parent decision — suppress the override accent
  // and Reset button so it reads as inherited/fixed, not user-overridden.
  const showOverride = overridden && !gate?.locked;

  return (
    <div
      className={cn(
        "space-y-1.5 pl-2.5 transition-colors",
        showOverride ? "border-l-2 border-primary" : "border-l-2 border-transparent",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <label
          className={cn(
            "flex items-center gap-1.5 text-[12px]",
            showOverride ? "font-semibold text-foreground" : "font-medium text-muted-foreground",
          )}
        >
          {field.label}
          {mixed && (
            <span className="rounded bg-muted px-1 py-0.5 font-mono text-[9px] uppercase tracking-wide text-muted-foreground/70">
              Mixed
            </span>
          )}
        </label>
        {showOverride && (
          <button
            type="button"
            onClick={onReset}
            className="fab-focus inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
        )}
      </div>
      {gate?.locked ? (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-2.5 py-1.5 text-[13px] text-muted-foreground">
          <Lock className="h-3.5 w-3.5 shrink-0" />
          <span>{gate.reason ?? "Set on a parent level"}</span>
          {gate.badge && (
            <span className="ml-auto rounded-full bg-foreground/[0.08] px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
              {gate.badge}
            </span>
          )}
        </div>
      ) : (
        <div
          className={cn(
            !overridden && field.kind === "readonly" && "opacity-90",
            mixed && "opacity-70",
          )}
        >
          <FieldRenderer
            field={field}
            value={value}
            currency={currency}
            onChange={onChange}
            onOpenCrop={onOpenCrop}
          />
        </div>
      )}
      {field.help && <p className="text-[10px] text-muted-foreground/70">{field.help}</p>}
    </div>
  );
}
