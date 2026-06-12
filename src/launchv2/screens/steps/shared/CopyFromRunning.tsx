import { useState } from "react";
import { Copy } from "lucide-react";
import type { UseFlowV2 } from "../../../state/useFlowV2";
import type { CreativeRef } from "../../../types";
import { RUNNING_CAMPAIGNS, RUNNING_ADSETS, RUNNING_ADS } from "../../../data";
import RunningPickerModal, { type PickerType } from "./RunningPickerModal";

export interface CopyItem {
  id: string;
  name: string;
  meta?: string;     // small secondary line (e.g. "CBO · ₹5,000/day")
  thumbnail?: string;
}

/** Trigger button that opens the RunningPickerModal dialog. */
export default function CopyFromRunning({
  triggerLabel,
  items: _items,
  onPick,
  pickedId,
  pickerType,
}: {
  triggerLabel: string;
  /** Legacy list kept for API compat — picker uses data directly from data.ts */
  items: CopyItem[];
  onPick: (id: string) => void;
  pickedId?: string | null;
  pickerType: PickerType;
}) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <Copy className="h-3 w-3" />
        {triggerLabel}
      </button>

      <RunningPickerModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        type={pickerType}
        onPick={(id) => {
          onPick(id);
          setModalOpen(false);
        }}
        pickedId={pickedId}
      />
    </>
  );
}

/* ── Apply helpers — shared patch logic for V1 & V2 ─────────────────── */

export function runningCampaignItems(): CopyItem[] {
  return RUNNING_CAMPAIGNS.map((c) => ({
    id: c.id,
    name: c.name,
    meta: `${c.budgetMode} · ${c.budgetAmount.toLocaleString("en-IN")}/day${c.advantagePlus ? " · Advantage+" : ""}`,
  }));
}
export function applyRunningCampaign(flow: UseFlowV2, id: string) {
  const c = RUNNING_CAMPAIGNS.find((x) => x.id === id);
  if (!c) return;
  flow.patch({
    budgetMode: c.budgetMode,
    budgetAmount: c.budgetAmount,
    bidStrategy: c.bidStrategy,
    advantagePlus: c.advantagePlus,
  });
}

export function runningAdSetItems(): CopyItem[] {
  return RUNNING_ADSETS.map((a) => ({
    id: a.id,
    name: a.name,
    meta: `${a.campaignName} · ${a.audienceName}`,
  }));
}
export function applyRunningAdSet(flow: UseFlowV2, id: string) {
  const a = RUNNING_ADSETS.find((x) => x.id === id);
  if (!a) return;
  flow.patch({
    optimizationGoal: a.optimizationGoal,
    advantagePlus: a.placements === "Automatic" ? true : flow.plan.advantagePlus,
  });
}

export function runningAdItems(): CopyItem[] {
  return RUNNING_ADS.map((a) => ({
    id: a.id,
    name: a.name,
    meta: `${a.pageName} · post ${a.postId.slice(-6)}`,
    thumbnail: a.thumbnail,
  }));
}
/** "Use existing post" — pushes a post_id CreativeRef into plan.creatives. */
export function applyRunningAd(flow: UseFlowV2, id: string) {
  const a = RUNNING_ADS.find((x) => x.id === id);
  if (!a) return;
  const ref: CreativeRef = {
    id: `post_${a.id}`,
    name: a.name,
    format: a.format,
    source: "post_id",
    thumbnail: a.thumbnail,
    savedAd: true,
    itemType: "ad",
  };
  // replace creatives with this single existing post
  flow.patch({ creatives: [ref], mediaScope: "whole_ads" });
}
