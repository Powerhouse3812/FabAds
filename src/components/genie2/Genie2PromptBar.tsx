import { useRef, useEffect, forwardRef } from "react";
import { Paperclip } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  prompt: string;
  onPromptChange: (v: string) => void;
  placeholder?: string;
  themeCardClass?: string;
  // Legacy props kept for backward compatibility — ignored in new UI
  model?: string;
  onModelChange?: (v: string) => void;
  numOutputs?: number;
  onNumOutputsChange?: (v: number) => void;
  generating?: boolean;
  onGenerate?: () => void;
  creditEstimate?: number;
}

export const Genie2PromptBar = forwardRef<HTMLDivElement, Props>(function Genie2PromptBar({
  prompt, onPromptChange,
  placeholder = "Describe what you want to create (optional)",
  themeCardClass,
}, ref) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 160) + "px";
    }
  }, [prompt]);

  return (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border shadow-sm transition-all duration-300",
        "focus-within:ring-1 focus-within:ring-primary/30 focus-within:shadow-md focus-within:shadow-primary/5 focus-within:border-primary/40",
        themeCardClass || "border-border bg-card"
      )}
    >
      <div className="flex items-center gap-2 px-4 pt-3">
        <button
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-dashed text-muted-foreground hover:border-primary/40 hover:text-primary transition-all duration-200 hover:scale-105"
          onClick={() => toast.info("Reference media — coming soon")}
        >
          <Paperclip className="h-3.5 w-3.5" />
        </button>
        <span className="text-xs text-muted-foreground">Add reference</span>
        <span className="ml-auto text-[10px] text-muted-foreground/40 italic">optional</span>
      </div>

      <div className="px-4 py-3">
        <textarea
          ref={textareaRef}
          placeholder={placeholder}
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          rows={2}
          className="w-full min-h-[48px] resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none leading-relaxed"
        />
      </div>
    </div>
  );
});
