import { PromptBar, type PromptBarModel } from "@/components/PromptBar";

/**
 * PromptBarFooter — page-level sticky footer wrapping the shared PromptBar.
 *
 * Mirrors the FormSkeleton footer pattern (full-width row, glass card
 * inside max-w-3xl) so Flow's prompt bar matches every other Studio
 * surface. Spans both columns of the 55/45 grid so the user always sees
 * the same Generate CTA regardless of which column is active.
 *
 * Caller owns prompt + count + model state — this is purely a wrapper
 * with the same v3 glass chrome FormSkeleton emits.
 */

export interface PromptBarFooterProps {
  prompt: string;
  onPromptChange: (next: string) => void;
  count: number;
  onCountChange: (next: number) => void;
  selectedModelId?: string;
  onModelChange?: (id: string) => void;
  models?: PromptBarModel[];
  onGenerate: (testFirst: boolean) => void;
  generateLabel?: string;
  disabled?: boolean;
}

export function PromptBarFooter({
  prompt,
  onPromptChange,
  count,
  onCountChange,
  selectedModelId,
  onModelChange,
  models = [],
  onGenerate,
  generateLabel = "Generate",
  disabled = false,
}: PromptBarFooterProps) {
  return (
    <footer className="shrink-0 border-t border-foreground/8 bg-transparent px-3 py-2.5 sm:px-6">
      <div className="mx-auto max-w-3xl rounded-2xl v3-glass overflow-hidden shadow-[0_-8px_30px_-12px_rgba(0,0,0,0.18)]">
        <PromptBar
          prompt={prompt}
          onPromptChange={onPromptChange}
          count={count}
          onCountChange={onCountChange}
          onGenerate={onGenerate}
          generateLabel={generateLabel}
          models={models}
          selectedModelId={selectedModelId}
          onModelChange={onModelChange}
          disabled={disabled}
        />
      </div>
    </footer>
  );
}
