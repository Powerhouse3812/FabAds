/**
 * Launch v2 — Floating feedback button.
 *
 * Fixed bottom-right pill that, on click, FIRST captures the current viewport
 * (await captureScreen()) BEFORE rendering the sheet — so the widget chrome
 * isn't in the shot — then opens FeedbackSheet with the screenshot pre-attached.
 *
 * The root element carries `data-feedback-widget="true"` so the screenshot
 * util filters it out. Strict FabFunnel design system: lime `primary` token,
 * dark-foreground text on lime, semantic tokens, lucide icons (no emojis).
 */
import { useState } from "react";
import { Loader2, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { captureScreen } from "./screenshot";
import FeedbackSheet from "./FeedbackSheet";

export default function FloatingFeedbackButton() {
  const [open, setOpen] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [captureFailed, setCaptureFailed] = useState(false);

  const handleClick = async () => {
    if (capturing || open) return;
    setCapturing(true);
    // Capture BEFORE the sheet mounts so widget chrome isn't in the shot.
    let shot: string | null = null;
    try {
      shot = await captureScreen();
    } catch {
      shot = null;
    }
    setScreenshot(shot);
    setCaptureFailed(shot === null);
    setCapturing(false);
    setOpen(true);
  };

  return (
    <div data-feedback-widget="true">
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={handleClick}
              disabled={capturing}
              aria-label="Feedback do"
              className={cn(
                "fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-lg",
                "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xl",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                "disabled:cursor-wait disabled:opacity-90",
              )}
            >
              {capturing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Capturing…</span>
                </>
              ) : (
                <>
                  <MessageSquare className="h-5 w-5" />
                  <span>Feedback</span>
                </>
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="left">Feedback do</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <FeedbackSheet
        open={open}
        onOpenChange={setOpen}
        initialScreenshot={screenshot}
        captureFailed={captureFailed}
      />
    </div>
  );
}
