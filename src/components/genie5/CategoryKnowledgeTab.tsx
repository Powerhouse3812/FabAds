import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Link, FileText } from "lucide-react";
import { toast } from "sonner";
import { useUpdateGenieCategory, type GenieCategory } from "@/hooks/use-genie-categories";

interface Props {
  category: GenieCategory;
}

export function CategoryKnowledgeTab({ category }: Props) {
  const updateMutation = useUpdateGenieCategory();
  const [systemPrompt, setSystemPrompt] = useState(category.system_prompt || "");
  const [newUrl, setNewUrl] = useState("");
  const refUrls: string[] = Array.isArray(category.reference_urls) ? category.reference_urls : [];

  const handleSavePrompt = async () => {
    await updateMutation.mutateAsync({ id: category.id, system_prompt: systemPrompt });
    toast.success("System prompt saved");
  };

  const handleAddUrl = async () => {
    if (!newUrl.trim()) return;
    const updated = [...refUrls, newUrl.trim()];
    await updateMutation.mutateAsync({ id: category.id, reference_urls: updated });
    setNewUrl("");
    toast.success("URL added");
  };

  const handleRemoveUrl = async (idx: number) => {
    const updated = refUrls.filter((_, i) => i !== idx);
    await updateMutation.mutateAsync({ id: category.id, reference_urls: updated });
    toast.success("URL removed");
  };

  return (
    <div className="space-y-6">
      {/* System Prompt */}
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <FileText className="h-4 w-4" />
          System Prompt
        </Label>
        <p className="text-xs text-muted-foreground">Define the AI's context and rules for this category.</p>
        <Textarea
          value={systemPrompt}
          onChange={(e) => setSystemPrompt(e.target.value)}
          rows={6}
          placeholder="You are an expert at creating high-converting ad creatives for..."
          className="text-sm"
        />
        <Button size="sm" onClick={handleSavePrompt} disabled={updateMutation.isPending}>
          Save Prompt
        </Button>
      </div>

      {/* Reference URLs */}
      <div className="space-y-2">
        <Label className="text-sm font-medium flex items-center gap-2">
          <Link className="h-4 w-4" />
          Reference URLs
        </Label>
        <p className="text-xs text-muted-foreground">Add URLs for research, competitor pages, landing pages, etc.</p>
        <div className="space-y-1.5">
          {refUrls.map((url, i) => (
            <div key={i} className="flex items-center gap-2 rounded-md border px-3 py-1.5">
              <span className="text-xs text-foreground truncate flex-1">{url}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => handleRemoveUrl(i)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input placeholder="https://..." value={newUrl} onChange={(e) => setNewUrl(e.target.value)} className="h-8 text-xs" />
          <Button size="sm" variant="outline" className="h-8 gap-1" onClick={handleAddUrl}>
            <Plus className="h-3 w-3" /> Add
          </Button>
        </div>
      </div>

      {/* Learning log placeholder */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Learning Log</Label>
        <div className="rounded-lg border border-dashed p-6 text-center">
          <p className="text-xs text-muted-foreground">AI learning log will appear here as you generate more ads for this category.</p>
        </div>
      </div>
    </div>
  );
}
