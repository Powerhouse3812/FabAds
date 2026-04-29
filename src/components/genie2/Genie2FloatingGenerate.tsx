import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  creditEstimate: number;
  generating: boolean;
  onGenerate: () => void;
  visible: boolean;
}

export function Genie2FloatingGenerate({ creditEstimate, generating, onGenerate, visible }: Props) {
  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50 transition-all duration-300",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      )}
    >
      <Button
        size="lg"
        className="rounded-full shadow-lg shadow-primary/20 gap-2 px-5"
        onClick={onGenerate}
        disabled={generating}
      >
        {generating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        <span className="text-sm font-medium">Generate creatives</span>
        <span className="text-xs opacity-70">~{creditEstimate} cr</span>
      </Button>
    </div>
  );
}
