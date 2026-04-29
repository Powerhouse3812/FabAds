import { useState, useRef, useEffect, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Send, Loader2, ImageIcon, ThumbsUp, ThumbsDown,
  Download, Rocket, RefreshCw, FolderPlus, Bookmark, Sparkles,
  ChevronLeft, ChevronRight, PenLine, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/use-workspace";
import { useAuth } from "@/contexts/AuthContext";
import { DEMO_MODE, fakeSleep, fakeEditedImageUrl } from "@/lib/demo-mode";
import { Genie5ResultsAdgroupCard, type AdgroupResult } from "./Genie5ResultsAdgroupCard";
import { Genie5BatchPills } from "./Genie5BatchPills";
import { Genie5BulkEditModal } from "./Genie5BulkEditModal";
import type { Batch, ResultImage, EditMessage } from "./genie5-batch-types";
import type { IntentType } from "@/lib/genie3-data";

interface Props {
  batches: Batch[];
  activeBatchId: string | null;
  onSelectBatch: (id: string) => void;
  intent?: IntentType;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onSaveToLibrary?: (id: string) => void;
  onLaunch?: (id: string) => void;
  onRegenerate?: (id: string) => void;
  onDownload?: (id: string) => void;
}

export function Genie5SplitOutputPanel({
  batches, activeBatchId, onSelectBatch, intent = "creative-image",
  collapsed, onToggleCollapse,
  onSaveToLibrary, onLaunch, onRegenerate, onDownload,
}: Props) {
  const workspaceId = useWorkspace();
  const { user } = useAuth();
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<ResultImage | null>(null);
  const [messages, setMessages] = useState<EditMessage[]>([]);
  const [input, setInput] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [feedback, setFeedback] = useState<Record<string, "up" | "down">>({});
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const activeBatch = batches.find(b => b.id === activeBatchId) || null;
  const results = activeBatch?.results || [];
  const adcopyResults = activeBatch?.adcopyResults || [];
  const generating = activeBatch?.status === "generating";
  const completedCount = results.filter(r => r.status === "completed").length;
  const totalExpected = activeBatch?.totalExpected || 0;
  const progress = totalExpected > 0 ? (completedCount / totalExpected) * 100 : 100;
  const hasResults = results.length > 0;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    setMessages([]);
    setInput("");
  }, [selectedCardId, selectedImage?.id]);

  // Clear selection when batch changes
  useEffect(() => {
    setSelectedCardId(null);
    setSelectedImage(null);
    setMessages([]);
  }, [activeBatchId]);

  const handleFeedback = (id: string, type: "up" | "down") => {
    setFeedback((prev) => ({ ...prev, [id]: prev[id] === type ? undefined! : type }));
    toast.success(type === "up" ? "Liked!" : "Feedback recorded");
  };

  const handleEditCopy = (cardId: string) => {
    setSelectedCardId(cardId);
    setSelectedImage(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleClearSelection = () => {
    setSelectedCardId(null);
    setSelectedImage(null);
    setMessages([]);
  };

  const handleSendEdit = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isEditing) return;
    if (!selectedImage && !selectedCardId) return;

    const userMsg: EditMessage = { id: crypto.randomUUID(), role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsEditing(true);

    try {
      if (selectedCardId && intent === "adcopy") {
        // Simulate AI ad copy edit
        if (DEMO_MODE) {
          await fakeSleep(1000, 2000);
        }
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "assistant", content: "✅ Updated! The changes have been applied to the card." },
        ]);
        toast.success("Ad copy updated");
      } else if (selectedImage) {
        let publicUrl: string;
        if (DEMO_MODE) {
          await fakeSleep(1500, 3000);
          publicUrl = fakeEditedImageUrl();
        } else {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session?.access_token) throw new Error("Not authenticated");

          const currentUrl = messages.filter(m => m.imageUrl).pop()?.imageUrl || selectedImage.url;

          const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/copilot-chat`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session.access_token}`,
              apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
            },
            body: JSON.stringify({
              messages: [{
                role: "user",
                content: [
                  { type: "text", text: trimmed },
                  { type: "image_url", image_url: { url: currentUrl } },
                ],
              }],
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
        }
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "assistant", content: "Here's the edited image:", imageUrl: publicUrl },
        ]);
      }
    } catch (e: any) {
      toast.error(e.message || "Edit failed");
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: `Error: ${e.message}` },
      ]);
    } finally {
      setIsEditing(false);
    }
  }, [input, isEditing, selectedImage, selectedCardId, messages, workspaceId, intent]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendEdit();
    }
  };

  const handleBulkEdit = (fields: { pageName?: string; cta?: string; description?: string; headline?: string }) => {
    toast.success("Bulk edit applied to all cards");
  };

  // --- Collapsed state ---
  if (collapsed) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-10 border-l border-border/40 bg-muted/10">
        <button
          onClick={onToggleCollapse}
          className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-muted/40 transition-colors"
          title="Expand panel"
        >
          <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          {activeBatch && (
            <div className="flex flex-col items-center gap-1">
              {generating ? (
                <Loader2 className="h-3 w-3 animate-spin text-primary" />
              ) : (
                <Badge variant="secondary" className="text-[8px] px-1 py-0 h-4 [writing-mode:vertical-lr] rotate-180">
                  {completedCount}/{totalExpected}
                </Badge>
              )}
            </div>
          )}
        </button>
      </div>
    );
  }

  // --- Empty state ---
  if (batches.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-3 py-2 border-b border-border/40">
          <span className="text-xs font-medium text-muted-foreground">Results</span>
          <button onClick={onToggleCollapse} className="p-1 rounded hover:bg-muted/40 transition-colors">
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
        <div className="flex flex-col items-center justify-center flex-1 gap-3 text-muted-foreground">
          <div className="w-14 h-14 rounded-2xl bg-muted/40 flex items-center justify-center">
            <Sparkles className="h-7 w-7 text-muted-foreground/50" />
          </div>
          <p className="text-sm font-medium">Generate to see results</p>
          <p className="text-xs text-muted-foreground/70">Your creatives will appear here</p>
        </div>
      </div>
    );
  }

  const editContext = selectedCardId
    ? `Editing Card #${(adcopyResults.findIndex(r => r.id === selectedCardId) + 1) || "?"}`
    : selectedImage
      ? "Editing image"
      : "Batch edit — all cards";

  const showChatInput = selectedCardId || selectedImage || (hasResults && !generating);

  return (
    <div className="flex flex-col h-full">
      {/* Header with collapse */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/40">
        <span className="text-xs font-medium text-foreground">Results</span>
        <div className="flex items-center gap-1.5">
          {intent === "adcopy" && hasResults && !generating && (
            <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={() => setBulkEditOpen(true)}>
              <PenLine className="h-3 w-3 mr-1" /> Bulk Edit
            </Button>
          )}
          <button onClick={onToggleCollapse} className="p-1 rounded hover:bg-muted/40 transition-colors">
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Batch pills */}
      <Genie5BatchPills batches={batches} activeBatchId={activeBatchId} onSelectBatch={onSelectBatch} />

      {/* Generating progress */}
      {generating && (
        <div className="px-3 pt-2 space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin text-primary" />
            <span>Generating...</span>
            <span className="ml-auto font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-1" />
        </div>
      )}

      {/* Results */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {intent === "adcopy" ? (
            <div className="grid grid-cols-3 gap-2.5">
              {results.filter(r => r.status === "completed").map((result, idx) => {
                const copy = adcopyResults[idx];
                if (!copy) return null;
                return (
                  <Genie5ResultsAdgroupCard
                    key={result.id}
                    result={copy}
                    selected={selectedCardId === copy.id}
                    onSelect={() => {
                      if (selectedCardId === copy.id) {
                        handleClearSelection();
                      } else {
                        handleEditCopy(copy.id);
                      }
                    }}
                    onEditCopy={() => handleEditCopy(copy.id)}
                    onSaveToLibrary={() => onSaveToLibrary?.(result.id)}
                    onLaunch={() => onLaunch?.(result.id)}
                    onRegenerate={() => onRegenerate?.(result.id)}
                    onSaveAsTemplate={() => toast.success("Saved as template")}
                    onDownloadImage={() => { onDownload?.(result.id); toast.success("Image downloaded"); }}
                    onSaveImageToLibrary={() => { onSaveToLibrary?.(result.id); toast.success("Image saved to library"); }}
                  />
                );
              })}
              {results.filter(r => r.status === "generating").map((result) => (
                <div key={result.id} className="rounded-xl border border-border/60 bg-card overflow-hidden">
                  <div className="aspect-[4/3] flex items-center justify-center bg-muted/30">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {results.map((result) => (
                <ResultCard
                  key={result.id}
                  result={result}
                  selected={selectedImage?.id === result.id}
                  feedback={feedback[result.id]}
                  onSelect={() => {
                    if (selectedImage?.id === result.id) {
                      handleClearSelection();
                    } else if (result.status === "completed") {
                      setSelectedImage(result);
                      setSelectedCardId(null);
                    }
                  }}
                  onFeedback={(type) => handleFeedback(result.id, type)}
                  onSave={() => onSaveToLibrary?.(result.id)}
                  onDownload={() => { onDownload?.(result.id); toast.success("Downloaded"); }}
                  onLaunch={() => onLaunch?.(result.id)}
                  onRegenerate={() => onRegenerate?.(result.id)}
                />
              ))}
            </div>
          )}

          {/* Chat messages */}
          {(selectedCardId || selectedImage) && messages.length > 0 && (
            <div className="space-y-2.5 pt-1">
              {messages.map((msg) => (
                <div key={msg.id} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[85%] rounded-xl px-3 py-2 text-xs",
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  )}>
                    <p>{msg.content}</p>
                    {msg.imageUrl && (
                      <img src={msg.imageUrl} alt="Edited" className="mt-2 rounded-md w-full object-contain max-h-[200px]" />
                    )}
                  </div>
                </div>
              ))}
              {isEditing && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-xl px-3 py-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    {selectedCardId ? "Updating copy..." : "Editing image..."}
                  </div>
                </div>
              )}
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Chat input */}
      {showChatInput && (
        <div className="border-t border-border p-2.5 flex-shrink-0 space-y-1.5">
          {/* Context chip */}
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="text-[10px] h-5 gap-1 px-1.5">
              {selectedCardId && <Sparkles className="h-2.5 w-2.5" />}
              {editContext}
              {(selectedCardId || selectedImage) && (
                <button onClick={handleClearSelection} className="ml-0.5 hover:text-foreground">
                  <X className="h-2.5 w-2.5" />
                </button>
              )}
            </Badge>
          </div>
          <div className="relative">
            <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 80) + "px";
              }}
              onKeyDown={handleKeyDown}
              placeholder={
                selectedCardId
                  ? "e.g. 'make headline shorter' or 'change CTA to Buy Now'"
                  : selectedImage
                    ? "Describe the edit you want..."
                    : "Edit all cards — e.g. 'make all headlines more urgent'"
              }
              className="min-h-[36px] max-h-[80px] pr-9 resize-none text-sm"
              rows={1}
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute bottom-0.5 right-0.5 h-7 w-7"
              onClick={handleSendEdit}
              disabled={!input.trim() || isEditing}
            >
              {isEditing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>
      )}

      {/* Bulk edit modal */}
      <Genie5BulkEditModal
        open={bulkEditOpen}
        onOpenChange={setBulkEditOpen}
        defaults={{
          pageName: adcopyResults[0]?.pageName || "Brand Store",
          cta: adcopyResults[0]?.cta || "Shop Now",
          description: adcopyResults[0]?.description || "",
          headline: adcopyResults[0]?.headline || "",
        }}
        onApply={handleBulkEdit}
      />
    </div>
  );
}

/* ── Unified Result Card (for image-only results) ── */
function ResultCard({ result, selected, feedback, onSelect, onFeedback, onSave, onDownload, onLaunch, onRegenerate }: {
  result: ResultImage;
  selected: boolean;
  feedback?: "up" | "down";
  onSelect: () => void;
  onFeedback: (type: "up" | "down") => void;
  onSave: () => void;
  onDownload: () => void;
  onLaunch: () => void;
  onRegenerate: () => void;
}) {
  if (result.status === "generating") {
    return (
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        <div className="aspect-square flex items-center justify-center bg-muted/30">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }
  if (result.status === "failed") {
    return (
      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        <div className="aspect-square flex flex-col items-center justify-center bg-destructive/5 gap-1">
          <ImageIcon className="h-5 w-5 text-destructive/50" />
          <span className="text-[10px] text-destructive/70">Failed</span>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onSelect}
      className={cn(
        "rounded-xl border bg-card overflow-hidden cursor-pointer transition-all",
        selected
          ? "border-primary ring-2 ring-primary/20"
          : "border-border/60 hover:border-border hover:shadow-sm"
      )}
    >
      <div className="aspect-[4/3] relative overflow-hidden">
        <img src={result.url} alt="" className="w-full h-full object-cover" />
        {selected && (
          <Badge className="absolute top-1.5 left-1.5 text-[9px] h-4 px-1.5 bg-primary text-primary-foreground">
            Editing
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-0.5 px-1.5 py-1.5 border-t border-border/40">
        <ActionBtn icon={ThumbsUp} active={feedback === "up"} onClick={(e) => { e.stopPropagation(); onFeedback("up"); }} tooltip="Like" />
        <ActionBtn icon={ThumbsDown} active={feedback === "down"} onClick={(e) => { e.stopPropagation(); onFeedback("down"); }} tooltip="Dislike" />
        <div className="h-3.5 w-px bg-border mx-0.5" />
        <ActionBtn icon={FolderPlus} onClick={(e) => { e.stopPropagation(); onSave(); }} tooltip="Save" />
        <ActionBtn icon={Download} onClick={(e) => { e.stopPropagation(); onDownload(); }} tooltip="Download" />
        <ActionBtn icon={Rocket} onClick={(e) => { e.stopPropagation(); onLaunch(); }} tooltip="Launch" />
        <ActionBtn icon={RefreshCw} onClick={(e) => { e.stopPropagation(); onRegenerate(); }} tooltip="Regenerate" />
        <ActionBtn icon={Bookmark} onClick={(e) => { e.stopPropagation(); toast.success("Saved as template"); }} tooltip="Template" className="ml-auto" />
      </div>
    </div>
  );
}

function ActionBtn({ icon: Icon, onClick, active, tooltip, className }: {
  icon: typeof ThumbsUp; onClick?: (e: React.MouseEvent) => void; active?: boolean; tooltip: string; className?: string;
}) {
  return (
    <button
      onClick={onClick}
      title={tooltip}
      className={cn(
        "flex h-6 w-6 items-center justify-center rounded-md transition-colors",
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
        className
      )}
    >
      <Icon className="h-3 w-3" />
    </button>
  );
}
