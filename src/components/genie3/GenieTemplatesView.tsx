import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Upload, Trash2, X, Plus, Tag } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  useGenieTemplates,
  useDeleteGenieTemplate,
  useUpdateGenieTemplateTags,
  type GenieTemplate,
} from "@/hooks/use-genie-templates";
import { UploadTemplatesModal } from "./UploadTemplatesModal";

function TagEditor({ template, onClose }: { template: GenieTemplate; onClose: () => void }) {
  const [tags, setTags] = useState<string[]>(template.tags);
  const [newTag, setNewTag] = useState("");
  const updateMutation = useUpdateGenieTemplateTags();

  const addTag = () => {
    const t = newTag.trim();
    if (t && !tags.includes(t)) {
      const next = [...tags, t];
      setTags(next);
      setNewTag("");
      updateMutation.mutate({ id: template.id, tags: next });
    }
  };

  const removeTag = (tag: string) => {
    const next = tags.filter((t) => t !== tag);
    setTags(next);
    updateMutation.mutate({ id: template.id, tags: next });
  };

  return (
    <div className="absolute inset-0 z-10 bg-background/95 backdrop-blur-sm rounded-lg p-3 flex flex-col" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-foreground flex items-center gap-1"><Tag className="h-3 w-3" /> Edit Tags</span>
        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={onClose}><X className="h-3 w-3" /></Button>
      </div>
      <div className="flex flex-wrap gap-1 mb-2 flex-1 overflow-auto">
        {tags.map((tag) => (
          <Badge key={tag} variant="secondary" className="text-[10px] h-5 gap-1 pr-1">
            {tag}
            <button onClick={() => removeTag(tag)} className="hover:text-destructive"><X className="h-2.5 w-2.5" /></button>
          </Badge>
        ))}
      </div>
      <div className="flex gap-1">
        <Input
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTag()}
          placeholder="Add tag…"
          className="h-7 text-xs"
        />
        <Button variant="secondary" size="sm" className="h-7 text-xs px-2" onClick={addTag}><Plus className="h-3 w-3" /></Button>
      </div>
    </div>
  );
}

function TemplateCard({ template }: { template: GenieTemplate }) {
  const [editing, setEditing] = useState(false);
  const deleteMutation = useDeleteGenieTemplate();

  return (
    <div className="relative group rounded-lg overflow-hidden border border-border bg-card break-inside-avoid mb-3">
      {editing && <TagEditor template={template} onClose={() => setEditing(false)} />}
      <img src={template.image_url} alt={template.name} className="w-full object-cover" loading="lazy" />
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); setEditing(true); }}>
            <Tag className="h-3 w-3 mr-1" /> Tags
          </Button>
          <Button variant="destructive" size="sm" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(template.id, { onSuccess: () => toast.success("Template deleted") }); }}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <div className="p-2 space-y-1">
        <p className="text-xs font-medium text-foreground truncate">{template.name}</p>
        <div className="flex flex-wrap gap-1">
          {template.tags.slice(0, 4).map((tag) => (
            <Badge key={tag} variant="outline" className="text-[9px] h-4 px-1.5 font-normal">{tag}</Badge>
          ))}
          {template.tags.length > 4 && (
            <Badge variant="outline" className="text-[9px] h-4 px-1.5 font-normal">+{template.tags.length - 4}</Badge>
          )}
        </div>
      </div>
    </div>
  );
}

export function GenieTemplatesView() {
  const { data: templates = [], isLoading } = useGenieTemplates();
  const [search, setSearch] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);

  const filtered = search
    ? templates.filter(
        (t) =>
          t.name.toLowerCase().includes(search.toLowerCase()) ||
          t.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()))
      )
    : templates;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="px-4 pt-4 pb-3 space-y-3 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">Templates</h2>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">{filtered.length}</Badge>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5" onClick={() => setUploadOpen(true)}>
              <Upload className="h-3.5 w-3.5" /> Upload
            </Button>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or tag…" className="h-8 text-xs pl-8" />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 columns-2 md:columns-3 lg:columns-4 gap-3">
          {isLoading ? (
            Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="rounded-lg bg-muted animate-pulse h-48 mb-3 break-inside-avoid" />
            ))
          ) : filtered.length === 0 ? (
            <div className="col-span-full text-center py-12 text-sm text-muted-foreground">
              {search ? "No templates match your search" : "No templates yet"}
            </div>
          ) : (
            filtered.map((t) => <TemplateCard key={t.id} template={t} />)
          )}
        </div>
      </ScrollArea>

      <UploadTemplatesModal open={uploadOpen} onOpenChange={setUploadOpen} />
    </div>
  );
}
