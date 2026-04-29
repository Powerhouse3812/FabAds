import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Upload, X, Plus, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/use-workspace";
import { useBrands } from "@/hooks/use-brands";
import { useGenieCategories } from "@/hooks/use-genie-categories";
import { useCreateGenieTemplate } from "@/hooks/use-genie-templates";

interface PendingItem {
  id: string;
  file: File;
  url: string | null;
  progress: number;
  name: string;
  brandId: string;
  categoryId: string;
  tags: string[];
  tagInput: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UploadTemplatesModal({ open, onOpenChange }: Props) {
  const workspaceId = useWorkspace();
  const { data: brands = [] } = useBrands();
  const { data: categories = [] } = useGenieCategories();
  const createMutation = useCreateGenieTemplate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<PendingItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [dragging, setDragging] = useState(false);

  const uploadFile = useCallback(async (file: File): Promise<string> => {
    if (!workspaceId) throw new Error("No workspace");
    const ext = file.name.split(".").pop();
    const path = `${workspaceId}/templates/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("creative-assets").upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from("creative-assets").getPublicUrl(path);
    return data.publicUrl;
  }, [workspaceId]);

  const addFiles = useCallback(async (files: File[]) => {
    const imageFiles = files.filter(f => f.type.startsWith("image/"));
    if (!imageFiles.length) return;

    const newItems: PendingItem[] = imageFiles.map(f => ({
      id: crypto.randomUUID(),
      file: f,
      url: null,
      progress: 0,
      name: f.name.replace(/\.[^/.]+$/, ""),
      brandId: "",
      categoryId: "",
      tags: ["Custom"],
      tagInput: "",
    }));

    setItems(prev => [...prev, ...newItems]);

    for (const item of newItems) {
      try {
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, progress: 30 } : i));
        const url = await uploadFile(item.file);
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, url, progress: 100 } : i));
      } catch {
        toast.error(`Failed to upload ${item.file.name}`);
        setItems(prev => prev.filter(i => i.id !== item.id));
      }
    }
  }, [uploadFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      addFiles(Array.from(e.target.files));
      e.target.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) addFiles(Array.from(e.dataTransfer.files));
  };

  const updateItem = (id: string, patch: Partial<PendingItem>) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i));
  };

  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id));

  const addTag = (id: string) => {
    setItems(prev => prev.map(i => {
      if (i.id !== id) return i;
      const t = i.tagInput.trim();
      if (!t || i.tags.includes(t)) return { ...i, tagInput: "" };
      return { ...i, tags: [...i.tags, t], tagInput: "" };
    }));
  };

  const removeTag = (id: string, tag: string) => {
    setItems(prev => prev.map(i => i.id === id ? { ...i, tags: i.tags.filter(t => t !== tag) } : i));
  };

  const readyItems = items.filter(i => i.url);

  const handleSaveAll = async () => {
    if (!readyItems.length) return;
    setSaving(true);
    try {
      for (const item of readyItems) {
        await createMutation.mutateAsync({
          image_url: item.url!,
          tags: item.tags,
          name: item.name || "Untitled",
          brand_id: item.brandId || null,
          category_id: item.categoryId || null,
        });
      }
      toast.success(`${readyItems.length} template${readyItems.length > 1 ? "s" : ""} saved`);
      setItems([]);
      onOpenChange(false);
    } catch {
      toast.error("Failed to save templates");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-4 w-4" /> Upload Templates
          </DialogTitle>
        </DialogHeader>

        {/* Drop zone */}
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors",
            dragging ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
          )}
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <ImagePlus className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Drop images here or click to browse</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Multiple files supported</p>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
        </div>

        {/* Pending items list */}
        {items.length > 0 && (
          <ScrollArea className="flex-1 min-h-0 max-h-[40vh] -mx-6 px-6">
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="rounded-lg border bg-muted/30 p-3">
                  {item.progress < 100 ? (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground truncate">{item.file.name}</p>
                      <Progress value={item.progress} className="h-1.5" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-start gap-3">
                        <img src={item.url!} alt="" className="h-14 w-14 rounded object-cover border shrink-0" />
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <Input
                            value={item.name}
                            onChange={(e) => updateItem(item.id, { name: e.target.value })}
                            className="h-7 text-xs"
                            placeholder="Template name"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <Select value={item.brandId} onValueChange={(v) => updateItem(item.id, { brandId: v })}>
                              <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Brand" /></SelectTrigger>
                              <SelectContent>
                                {brands.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <Select value={item.categoryId} onValueChange={(v) => updateItem(item.id, { categoryId: v })}>
                              <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Category" /></SelectTrigger>
                              <SelectContent>
                                {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => removeItem(item.id)}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap items-center gap-1 pl-[68px]">
                        {item.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-[10px] h-5 gap-1 pr-1">
                            {tag}
                            <button onClick={() => removeTag(item.id, tag)} className="hover:text-destructive"><X className="h-2.5 w-2.5" /></button>
                          </Badge>
                        ))}
                        <div className="flex gap-1">
                          <Input
                            value={item.tagInput}
                            onChange={(e) => updateItem(item.id, { tagInput: e.target.value })}
                            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag(item.id))}
                            placeholder="Add tag…"
                            className="h-5 text-[10px] w-24 px-1.5"
                          />
                          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => addTag(item.id)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => { setItems([]); onOpenChange(false); }}>Cancel</Button>
          <Button size="sm" onClick={handleSaveAll} disabled={!readyItems.length || saving}>
            Save All{readyItems.length > 0 && ` (${readyItems.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
