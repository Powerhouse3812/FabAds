import { sampleOutputs } from "../../mocks/sample-outputs";
import type { QueueBatch } from "../types/queue";

/**
 * Mock queue batches — the seed state for the Results Queue screen.
 *
 * Chosen to cover the full status spectrum on first paint:
 *   - 1 × ready   (the default active batch, has outputs + concepts wired)
 *   - 2 × ready   (older batches, can be re-activated)
 *   - 1 × generating (live, will show animated state in the card)
 *   - 1 × queued  (waiting on the 10-concurrent throttle — demo of cap)
 *
 * The active batch's outputs are sliced from `sampleOutputs` so the result
 * rows below render with real-looking ad chrome via OutputCardHybrid. Concept
 * grouping is derived from `angleId` so the same outputs land in the same
 * concept row deterministically across reloads.
 */

const today = new Date();
const at = (hour: number, min: number) => {
  const d = new Date(today);
  d.setHours(hour, min, 0, 0);
  return d;
};

// Active batch — 12 outputs split into 3 concepts × 4 variations.
const activeOutputs = sampleOutputs.slice(0, 12);
const activeConcepts = [
  { id: "concept-1", label: "Hero Shot", variationCount: 4 },
  { id: "concept-2", label: "Lifestyle", variationCount: 4 },
  { id: "concept-3", label: "Social Proof", variationCount: 4 },
];

export const queueBatches: QueueBatch[] = [
  {
    id: "batch-001",
    title: "Home insurance",
    submittedAt: at(14, 30),
    status: "ready",
    tags: ["Performance", "Story Ad"],
    generationCount: 12,
    brandId: "brand-mamaearth",
    outputs: activeOutputs,
    concepts: activeConcepts,
    prompt:
      "Generate Story-ad creatives for home insurance — emphasise affordability + family security. Story format, 9:16, with hook in first 1.5s.",
  },
  {
    id: "batch-002",
    title: "Home insurance",
    submittedAt: at(14, 30),
    status: "ready",
    tags: ["Performance", "Story Ad"],
    generationCount: 12,
    brandId: "brand-mamaearth",
    outputs: sampleOutputs.slice(12, 24),
    concepts: [
      { id: "concept-1", label: "Hero Shot", variationCount: 4 },
      { id: "concept-2", label: "Urgency", variationCount: 4 },
      { id: "concept-3", label: "Comparison", variationCount: 4 },
    ],
    prompt: "Variant on yesterday's batch — push urgency + comparison angles.",
  },
  {
    id: "batch-003",
    title: "Home insurance",
    submittedAt: at(14, 30),
    status: "ready",
    tags: ["Performance", "Story Ad"],
    generationCount: 12,
    brandId: "brand-mamaearth",
    outputs: sampleOutputs.slice(24, 36),
    concepts: [
      { id: "concept-1", label: "Hero Shot", variationCount: 4 },
      { id: "concept-2", label: "Lifestyle", variationCount: 4 },
      { id: "concept-3", label: "Feature Highlight", variationCount: 4 },
    ],
    prompt: "Feature-led iteration — emphasise the 24×7 claim assistance benefit.",
  },
  {
    id: "batch-004",
    title: "Festive bundle",
    submittedAt: at(14, 35),
    status: "generating",
    tags: ["Awareness", "Image Ad"],
    generationCount: 8,
    brandId: "brand-boat",
    prompt: "Festive Diwali bundle — gifting angle, warm tones, 1:1 image ads.",
  },
  {
    id: "batch-005",
    title: "Winter skincare",
    submittedAt: at(14, 38),
    status: "queued",
    tags: ["Performance", "UGC"],
    generationCount: 10,
    brandId: "brand-mamaearth",
    prompt:
      "UGC-style winter skincare push — 10 testimonial-led variations across 2 angles.",
  },
];

export const defaultActiveBatchId = queueBatches[0].id;
