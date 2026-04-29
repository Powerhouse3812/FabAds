import { X, Pin, PinOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCopilot } from "@/contexts/CopilotContext";
import { useCopilotChat } from "@/hooks/use-copilot-chat";
import { CopilotContextBar } from "./CopilotContextBar";
import { CopilotQuickActions } from "./CopilotQuickActions";
import { CopilotMessageList } from "./CopilotMessageList";
import { CopilotInput } from "./CopilotInput";

export function CopilotPanel() {
  const { isOpen, isPinned, close, togglePin } = useCopilot();
  const { messages, isLoading, sendMessage, generateImage, stopGeneration } = useCopilotChat();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop for overlay mode (non-pinned) */}
      {!isPinned && (
        <div
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={close}
        />
      )}

      <div
        className={`${
          isPinned
            ? "relative flex-shrink-0 border-l border-border"
            : "fixed right-0 top-0 h-full z-50 shadow-2xl border-l border-border"
        } bg-background flex flex-col`}
        style={{ width: 380 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Co-pilot</span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={togglePin}>
              {isPinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={close}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <CopilotContextBar />
        <CopilotQuickActions onAction={sendMessage} disabled={isLoading} />
        <CopilotMessageList messages={messages} isLoading={isLoading} />
        <CopilotInput
          onSend={sendMessage}
          onGenerateImage={generateImage}
          onStop={stopGeneration}
          isLoading={isLoading}
          hideImageGen
        />
      </div>
    </>
  );
}
