import { useState, useRef, KeyboardEvent } from "react";
import { Send, Square, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface CopilotInputProps {
  onSend: (message: string) => void;
  onGenerateImage: (prompt: string) => void;
  onStop: () => void;
  isLoading: boolean;
  hideImageGen?: boolean;
}

export function CopilotInput({ onSend, onGenerateImage, onStop, isLoading, hideImageGen }: CopilotInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    onSend(trimmed);
    setValue("");
    // Reset textarea height
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageGen = () => {
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    onGenerateImage(trimmed);
    setValue("");
  };

  return (
    <div className="border-t border-border p-3 space-y-2">
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            // Auto-resize
            e.target.style.height = "auto";
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
          }}
          onKeyDown={handleKeyDown}
          placeholder="Ask Co-pilot anything..."
          className="min-h-[40px] max-h-[120px] pr-20 resize-none text-sm border-border/50"
          rows={1}
        />
        <div className="absolute bottom-1.5 right-1.5 flex gap-1">
          {!hideImageGen && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={handleImageGen}
                  disabled={!value.trim() || isLoading}
                >
                  <ImagePlus className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top"><p>Generate image</p></TooltipContent>
            </Tooltip>
          )}
          {isLoading ? (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onStop}>
              <Square className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleSend}
              disabled={!value.trim()}
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
