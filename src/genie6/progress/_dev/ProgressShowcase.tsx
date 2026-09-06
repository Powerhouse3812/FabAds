import { useState } from "react";
import { StageProgress, RunItemTile, BatchProgressHeader, FailureNotice } from "../index";
import type {
  FailureReason,
  RunBatch,
  RunItem,
  RunItemStatus,
} from "../../lib/genieRunTypes";

/**
 * ProgressShowcase — every state the progress/failure pattern (§18) has to
 * cover, side by side, so the monitor pass can verify this file without
 * hunting for it across Studio/Flows/Apps. Not routed by this agent — the
 * wiring agent mounts it at /iq/genie6/_dev/progress.
 *
 * Nothing here touches genieRunStore (owned elsewhere) — every fixture below
 * is a plain literal, and every onRetry/onCancel just appends to a local
 * action log so this page works standalone before the store exists.
 */

const STAGES_SHORT = ["Script", "Render"];
const STAGES_LONG = [
  "Queued",
  "Analysing brief",
  "Writing script",
  "Generating voice",
  "Rendering avatar",
  "Compositing B-roll",
  "Colour grading",
  "Final encode — 1080p H.264 with burned-in captions for accessibility",
];

const ALL_STATUSES: RunItemStatus[] = ["pending", "running", "done", "failed", "cancelling", "cancelled"];
const ALL_REASONS: FailureReason[] = [
  "model-unavailable",
  "content-policy",
  "timeout",
  "credits-exhausted",
  "brand-guideline-conflict",
  "render-error",
];

function makeItem(i: number, status: RunItemStatus, failure?: FailureReason): RunItem {
  return {
    id: `item-${i}-${status}`,
    status,
    progress: status === "done" ? 100 : status === "running" ? 42 : 0,
    stageIndex: status === "running" ? 2 : 0,
    etaSeconds: status === "running" ? 245 : undefined,
    title: `Mamaearth Onion Shampoo — UGC Video ${i}`,
    summary: "Hair fall is real. This is not.",
    tags: ["UGC", "Hindi"],
    failure,
    credits: 6,
    index: i,
  };
}

function makeBatch(id: string, label: string, items: RunItem[], stages: string[]): RunBatch {
  return {
    batchId: id,
    createdAt: Date.now(),
    origin: { kind: "studio" },
    provenance: "client-created",
    createdBy: "Rahul Saini",
    label,
    stages,
    items,
    credits: items.reduce((s, i) => s + i.credits, 0),
    config: { format: "video", approach: "UGC Video", model: "Genie Video v2" },
  };
}

const runningBatch = makeBatch(
  "BATCH-8F2K41",
  "Mamaearth Onion Oil · UGC Video",
  [makeItem(1, "done"), makeItem(2, "running"), makeItem(3, "pending"), makeItem(4, "pending")],
  STAGES_LONG,
);

const cancellingBatch = makeBatch(
  "BATCH-2K7P55",
  "Wakefit Mattress · Product Shoot",
  [makeItem(1, "done"), makeItem(2, "cancelling"), makeItem(3, "cancelling")],
  STAGES_SHORT,
);

const partialBatch = makeBatch(
  "BATCH-3M9X02",
  "Noise ColorFit Pro 5 · Product Ad",
  [makeItem(1, "done"), makeItem(2, "done"), makeItem(3, "failed", "timeout"), makeItem(4, "done")],
  STAGES_SHORT,
);

const failedBatch = makeBatch(
  "BATCH-7Q1L88",
  "boAt Airdopes 161 · Brand Ad",
  [makeItem(1, "failed", "credits-exhausted"), makeItem(2, "failed", "credits-exhausted")],
  STAGES_SHORT,
);

const cancelledBatch = makeBatch(
  "BATCH-5D4K10",
  "Plum Vitamin C Serum · Category Ad",
  [makeItem(1, "cancelled"), makeItem(2, "cancelled"), makeItem(3, "cancelled")],
  STAGES_SHORT,
);

export function ProgressShowcase() {
  const [log, setLog] = useState<string[]>([]);
  const note = (s: string) => setLog((l) => [s, ...l].slice(0, 8));

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-10 p-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-lg font-bold text-foreground">
          Progress + failure pattern — dev showcase
        </h1>
        <p className="text-[13px] text-muted-foreground">
          Every RunItemStatus, every FailureReason, every BatchStatus in one place.
          Retry/Cancel clicks append to the log below instead of touching a store.
        </p>
      </header>

      <Section title="StageProgress — edge cases">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card label="1 stage, no ETA">
            <StageProgress stages={["Rendering"]} stageIndex={0} progress={40} />
          </Card>
          <Card label="8 stages incl. a 60+ char label, updating ETA">
            <StageProgress stages={STAGES_LONG} stageIndex={6} progress={78} etaSeconds={245} />
          </Card>
          <Card label="ETA under a minute (soft copy, not a countdown)">
            <StageProgress stages={STAGES_SHORT} stageIndex={1} progress={92} etaSeconds={40} />
          </Card>
          <Card label="etaSeconds undefined — no fabricated number">
            <StageProgress stages={STAGES_SHORT} stageIndex={0} progress={10} />
          </Card>
        </div>
      </Section>

      <Section title="RunItemTile — all 6 RunItemStatus values">
        <div className="grid gap-4 sm:grid-cols-3">
          {ALL_STATUSES.map((status) => (
            <Card key={status} label={status}>
              <RunItemTile
                item={makeItem(1, status, status === "failed" ? "render-error" : undefined)}
                stages={STAGES_SHORT}
                onRetry={(s) => note(`retry (${status} tile) → ${s}`)}
              />
            </Card>
          ))}
        </div>
        <div className="mt-4 max-w-xs">
          <Card label="failed tile, onRetry undefined — no retry affordance at all">
            <RunItemTile item={makeItem(2, "failed", "content-policy")} stages={STAGES_SHORT} />
          </Card>
        </div>
      </Section>

      <Section title="FailureNotice — all 6 FailureReason values">
        <div className="grid gap-4 sm:grid-cols-2">
          {ALL_REASONS.map((reason) => (
            <FailureNotice
              key={reason}
              reason={reason}
              onRetry={(s) => note(`retry (${reason}) → ${s}`)}
              retryCredits={{ "this-item": 6, "different-model": 9 }}
            />
          ))}
        </div>
      </Section>

      <Section title="BatchProgressHeader — running / cancelling / partial / failed / cancelled">
        <div className="flex flex-col gap-4">
          <BatchProgressHeader batch={runningBatch} onCancel={() => note("cancel → running batch")} />
          <BatchProgressHeader
            batch={cancellingBatch}
            onCancel={() => note("cancel clicked again mid-cancel (should be inert)")}
          />
          <BatchProgressHeader batch={partialBatch} onRetry={(s) => note(`retry (partial batch) → ${s}`)} />
          <BatchProgressHeader batch={failedBatch} onRetry={(s) => note(`retry (failed batch) → ${s}`)} />
          <BatchProgressHeader batch={cancelledBatch} onRetry={(s) => note(`retry (cancelled batch) → ${s}`)} />
        </div>
      </Section>

      <Section title="Action log">
        <ul className="flex flex-col gap-1 rounded-2xl border border-border bg-card p-3 font-mono text-[11px] text-muted-foreground">
          {log.length === 0 && <li>Nothing yet — click a Retry or Cancel button above.</li>}
          {log.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ul>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

function Card({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}
