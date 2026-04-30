/**
 * Mock AI-model catalog (Q-2). Real wiring lands when the model-routing
 * service exists. The picker filters by the active draft's outputType so
 * users only see models that can produce the deliverable.
 */

import type { OutputType } from "../../types/output";

export interface AiModel {
  id: string;
  label: string;
  vendor: string;
  /** Which output types this model can produce. */
  supports: OutputType[];
  /** Quick tag — speed / quality / cost vibe. */
  tag: "fast" | "quality" | "premium";
}

export const AI_MODELS: AiModel[] = [
  // Image
  { id: "flux-pro-1.1", label: "Flux Pro 1.1", vendor: "Black Forest Labs", supports: ["image", "motion-static", "carousel"], tag: "quality" },
  { id: "imagen-4", label: "Imagen 4", vendor: "Google", supports: ["image", "carousel"], tag: "premium" },
  { id: "ideogram-3", label: "Ideogram 3", vendor: "Ideogram", supports: ["image", "carousel"], tag: "fast" },
  // Video
  { id: "kling-2.0", label: "Kling 2.0", vendor: "Kuaishou", supports: ["video", "motion-static"], tag: "quality" },
  { id: "sora-2", label: "Sora 2", vendor: "OpenAI", supports: ["video"], tag: "premium" },
  { id: "runway-gen4", label: "Runway Gen-4", vendor: "Runway", supports: ["video", "motion-static"], tag: "quality" },
  // Copy
  { id: "claude-opus-4.7", label: "Claude Opus 4.7", vendor: "Anthropic", supports: ["adcopy", "text-only"], tag: "premium" },
  { id: "gpt-5", label: "GPT-5", vendor: "OpenAI", supports: ["adcopy", "text-only"], tag: "quality" },
  { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro", vendor: "Google", supports: ["adcopy", "text-only"], tag: "fast" },
];

export function modelsFor(outputType: OutputType | null | undefined): AiModel[] {
  if (!outputType) return AI_MODELS;
  return AI_MODELS.filter((m) => m.supports.includes(outputType));
}

export function defaultModelFor(outputType: OutputType | null | undefined): AiModel {
  const list = modelsFor(outputType);
  return list[0] ?? AI_MODELS[0];
}
