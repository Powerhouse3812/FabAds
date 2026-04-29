import { useState, useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Check, Copy, Download, Loader2, RefreshCw, Send } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { ScriptConcept } from "@/lib/video-sage-dummy-data";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  concept: ScriptConcept | null;
  editing: boolean;
  onEdit: (conceptId: string, prompt: string) => Promise<{ explanation: string } | null>;
}

const MODES = ["Async Wins", "Fast-cut", "Modern", "SaaS Friendly"];

interface AiMessage {
  role: "user" | "ai";
  content: string;
}

export default function EditScriptDrawer({ open, onOpenChange, concept, editing, onEdit }: Props) {
  const [activeMode, setActiveMode] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!concept) return null;

  const handleSend = async () => {
    const text = prompt.trim();
    if (!text || editing) return;
    setPrompt("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);

    const result = await onEdit(concept.id, text);
    if (result) {
      setMessages((prev) => [...prev, { role: "ai", content: result.explanation }]);
    }
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 100);
  };

  const handleModeClick = async (mode: string) => {
    setActiveMode(mode);
    setMessages((prev) => [...prev, { role: "user", content: `Apply "${mode}" style` }]);
    const result = await onEdit(concept.id, mode);
    if (result) {
      setMessages((prev) => [...prev, { role: "ai", content: result.explanation }]);
    }
  };

  const copyScript = () => {
    const text = concept.script.map((r) => `[${r.time}] ${r.dialogue}`).join("\n\n");
    navigator.clipboard.writeText(text);
    toast({ title: "Script copied" });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[580px] flex flex-col p-0">
        <SheetHeader className="px-5 pt-5 pb-3 border-b">
          <SheetTitle className="text-sm">Edit Script with AI</SheetTitle>
          <Badge variant="secondary" className="w-fit text-[10px]">
            {concept.framework} · {concept.frameworkFull}
          </Badge>
        </SheetHeader>

        {/* Mode buttons */}
        <div className="flex gap-2 px-5 py-3 border-b flex-wrap">
          {MODES.map((m) => (
            <Button
              key={m}
              variant={activeMode === m ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => handleModeClick(m)}
              disabled={editing}
            >
              {m}
            </Button>
          ))}
        </div>

        {/* Script blocks */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div className="space-y-2">
            {concept.script.map((row, i) => (
              <div key={i} className="rounded-md border p-3 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-muted-foreground">{row.time}</span>
                  <span className="text-[10px] font-semibold text-foreground">{row.visual}</span>
                </div>
                <p className="text-xs text-muted-foreground">{row.dialogue}</p>
              </div>
            ))}
          </div>

          {/* Chat messages */}
          {messages.length > 0 && (
            <div className="space-y-3 pt-2 border-t">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`text-xs rounded-lg px-3 py-2 max-w-[85%] ${
                    msg.role === "user"
                      ? "ml-auto bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {msg.content}
                </div>
              ))}
              {editing && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="w-3 h-3 animate-spin" /> AI is editing…
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions bar */}
        <div className="flex items-center gap-2 px-5 py-2 border-t">
          <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs" onClick={copyScript}>
            <Copy className="w-3 h-3" /> Copy
          </Button>
          <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs">
            <Download className="w-3 h-3" /> Download
          </Button>
        </div>

        {/* Input */}
        <div className="flex items-end gap-2 px-5 pb-5 pt-2 border-t">
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe how to edit this script…"
            className="min-h-[40px] max-h-[80px] text-xs resize-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button
            size="icon"
            className="h-9 w-9 shrink-0"
            onClick={handleSend}
            disabled={!prompt.trim() || editing}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
