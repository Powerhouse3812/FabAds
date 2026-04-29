import { useState, useRef, useEffect, useCallback } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, Download, FolderPlus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/use-workspace";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import type { GenieGeneration } from "@/hooks/use-genie-generations";
import { DEMO_MODE, fakeSleep, fakeEditedImageUrl } from "@/lib/demo-mode";

interface EditMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  generation: GenieGeneration | null;
}

export function GenieEditDrawer({ open, onOpenChange, generation }: Props) {
  const workspaceId = useWorkspace();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [messages, setMessages] = useState<EditMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset when generation changes
  useEffect(() => {
    if (generation) {
      setMessages([]);
      setCurrentImageUrl(generation.output_url);
      setInput("");
    }
  }, [generation?.id]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading || !generation || !workspaceId || !user) return;

    const userMsg: EditMessage = { id: crypto.randomUUID(), role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      let publicUrl: string;

      if (DEMO_MODE) {
        // --- Demo mode ---
        await fakeSleep(1500, 3000);
        publicUrl = fakeEditedImageUrl();

        await supabase.from("genie_generations").insert({
          workspace_id: workspaceId,
          created_by: user.id,
          parent_id: generation.id,
          prompt: trimmed,
          reference_image_ids: [generation.output_url],
          reference_mode: "edit",
          output_url: publicUrl,
          storage_path: "demo",
          settings: generation.settings || {},
          status: "completed",
        } as any);
      } else {
        // --- Real mode ---
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) throw new Error("Not authenticated");

        const apiMessages = [
          {
            role: "user" as const,
            content: [
              { type: "text", text: trimmed },
              { type: "image_url", image_url: { url: currentImageUrl } },
            ],
          },
        ];

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const resp = await fetch(`${supabaseUrl}/functions/v1/copilot-chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            messages: apiMessages,
            generate_image: true,
            settings: { model: "google/gemini-3.1-flash-image-preview" },
          }),
        });

        if (!resp.ok) {
          const errData = await resp.json().catch(() => ({}));
          throw new Error(errData.error || "Edit failed");
        }

        const data = await resp.json();
        const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

        if (!imageUrl) throw new Error("No edited image was generated");

        const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, "");
        const bytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
        const fileName = `genie/${workspaceId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.png`;

        const { error: uploadError } = await supabase.storage
          .from("creative-assets")
          .upload(fileName, bytes, { contentType: "image/png", upsert: false });
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from("creative-assets").getPublicUrl(fileName);
        publicUrl = urlData.publicUrl;

        await supabase.from("genie_generations").insert({
          workspace_id: workspaceId,
          created_by: user.id,
          parent_id: generation.id,
          prompt: trimmed,
          reference_image_ids: [generation.output_url],
          reference_mode: "edit",
          output_url: publicUrl,
          storage_path: fileName,
          settings: generation.settings || {},
          status: "completed",
        } as any);
      }

      setCurrentImageUrl(publicUrl);

      const assistantMsg: EditMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Here's the edited image:",
        imageUrl: publicUrl,
      };
      setMessages((prev) => [...prev, assistantMsg]);
      qc.invalidateQueries({ queryKey: ["genie-generations"] });
    } catch (e: any) {
      toast.error(e.message || "Edit failed");
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: `Error: ${e.message}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, generation, currentImageUrl, workspaceId, user, qc]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDownloadCurrent = () => {
    const a = document.createElement("a");
    a.href = currentImageUrl;
    a.download = `genie-edit-${Date.now()}.png`;
    a.target = "_blank";
    a.click();
  };

  if (!generation) return null;

  const settings = generation.settings || {};

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[420px] sm:w-[420px] p-0 flex flex-col">
        <SheetHeader className="px-4 py-3 border-b border-border">
          <SheetTitle className="text-sm font-semibold">Edit with AI</SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div ref={scrollRef} className="p-4 space-y-4">
            {/* Current image preview */}
            <div className="rounded-lg overflow-hidden border border-border">
              <img
                src={currentImageUrl}
                alt="Current"
                className="w-full object-contain max-h-[280px] bg-muted"
              />
            </div>

            {/* Metadata */}
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground line-clamp-2">
                <span className="font-medium text-foreground">Prompt:</span> {generation.prompt}
              </p>
              <div className="flex flex-wrap gap-1">
                {settings.category && (
                  <Badge variant="secondary" className="text-[10px]">{settings.category}</Badge>
                )}
                {settings.aspect_ratio && settings.aspect_ratio !== "auto" && (
                  <Badge variant="secondary" className="text-[10px]">{settings.aspect_ratio}</Badge>
                )}
                {settings.model && settings.model !== "auto" && (
                  <Badge variant="outline" className="text-[10px]">{settings.model}</Badge>
                )}
              </div>
            </div>

            {/* Quick actions */}
            <div className="flex gap-1.5">
              <Button variant="outline" size="sm" className="text-xs h-7" onClick={handleDownloadCurrent}>
                <Download className="h-3 w-3 mr-1" />Download
              </Button>
            </div>

            {/* Chat messages */}
            {messages.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-border">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[90%] rounded-lg px-3 py-2 text-xs ${
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      <p>{msg.content}</p>
                      {msg.imageUrl && (
                        <img
                          src={msg.imageUrl}
                          alt="Edited"
                          className="mt-2 rounded-md w-full object-contain max-h-[200px]"
                        />
                      )}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg px-3 py-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Editing image...
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="border-t border-border p-3">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 100) + "px";
              }}
              onKeyDown={handleKeyDown}
              placeholder="Describe the edit you want..."
              className="min-h-[38px] max-h-[100px] pr-10 resize-none text-sm border-border/50"
              rows={1}
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute bottom-1 right-1 h-7 w-7"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
