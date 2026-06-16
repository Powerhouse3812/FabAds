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
import { useMemo, useState } from "react";
import { RotateCcw, Settings2, SlidersHorizontal } from "lucide-react";
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
import { FieldRenderer } from "./FieldRenderer";
import { AdvancedSettingsModal } from "./AdvancedSettingsModal";
import { PlacementCropModal } from "./PlacementCropModal";

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
      fields: common.filter((f) => f.section === s.id),
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

        {/* ── Sections ────────────────────────────────────────────── */}
        {grouped.map((g) => (
          <div key={g.section.id} className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-mono text-[10px] uppercase tracking-[0.06em] text-muted-foreground/70">
                {g.section.label}
              </h4>
              {g.hasAdvanced && (
                <button
                  type="button"
                  onClick={() => setAdvSection(g.section.id)}
                  className="fab-focus inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <SlidersHorizontal className="h-3 w-3" /> More
                </button>
              )}
            </div>
            {g.fields.map((field) => (
              <EditField
                key={field.id}
                field={field}
                plan={plan}
                nodeIds={nodeIds}
                currency={currency}
                onChange={(v) => setField(field, v)}
                onReset={() => reset(field)}
                onOpenCrop={() => setCropOpen(true)}
              />
            ))}
          </div>
        ))}

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
  currency,
  onChange,
  onReset,
  onOpenCrop,
}: {
  field: SettingField;
  plan: PlanV2;
  /** All selected node ids — length 1 for single-select. */
  nodeIds: string[];
  currency: string;
  onChange: (v: unknown) => void;
  onReset: () => void;
  onOpenCrop: () => void;
}) {
  const planDefault = planDefaultFor(plan, field);
  // Overridden accent if ANY selected node overrides this field.
  const overridden = nodeIds.some((id) => isOverridden(plan, id, field.id));
  const resolved = valueAcross(plan, nodeIds, field.id, planDefault);
  const mixed = resolved === MIXED;
  // In a mixed state we feed the renderer the plan default but flag a "Mixed"
  // placeholder so the user knows values vary.
  const value = mixed ? planDefault : resolved;

  return (
    <div
      className={cn(
        "space-y-1.5 pl-2.5 transition-colors",
        overridden ? "border-l-2 border-primary" : "border-l-2 border-transparent",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <label
          className={cn(
            "flex items-center gap-1.5 text-[12px]",
            overridden ? "font-semibold text-foreground" : "font-medium text-muted-foreground",
          )}
        >
          {field.label}
          {mixed && (
            <span className="rounded bg-muted px-1 py-0.5 font-mono text-[9px] uppercase tracking-wide text-muted-foreground/70">
              Mixed
            </span>
          )}
        </label>
        {overridden && (
          <button
            type="button"
            onClick={onReset}
            className="fab-focus inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <RotateCcw className="h-3 w-3" /> Reset
          </button>
        )}
      </div>
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
      {field.help && <p className="text-[10px] text-muted-foreground/70">{field.help}</p>}
    </div>
  );
}
