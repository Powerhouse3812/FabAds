import { Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCopilot } from "@/contexts/CopilotContext";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function CopilotTrigger() {
  const { toggle, isOpen } = useCopilot();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={isOpen ? "secondary" : "ghost"}
          size="icon"
          onClick={toggle}
          className="relative"
        >
          <Brain className="h-5 w-5" />
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary animate-pulse" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>Co-pilot AI Assistant</p>
      </TooltipContent>
    </Tooltip>
  );
}
