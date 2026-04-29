import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Trash2, Pencil, Bookmark } from "lucide-react";
import { toast } from "sonner";
import { useUpdateGenieCategory, useDeleteGenieCategory, type GenieCategory } from "@/hooks/use-genie-categories";
import { CategoryKnowledgeTab } from "./CategoryKnowledgeTab";
import { CategoryWinnersTab } from "./CategoryWinnersTab";
import { Genie5ActivityLog } from "./Genie5ActivityLog";
import { useSavedConcepts, useDeleteSavedConcept } from "@/hooks/use-saved-concepts";

interface Props {
  category: GenieCategory;
  onBack: () => void;
  onGenerateForCategory?: (cat: GenieCategory) => void;
}

export function CategoryDetailPage({ category, onBack, onGenerateForCategory }: Props) {
  const updateMutation = useUpdateGenieCategory();
  const deleteMutation = useDeleteGenieCategory();
  const { data: savedConcepts = [] } = useSavedConcepts(category.id);
  const deleteConcept = useDeleteSavedConcept();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(category.name);
  const [niche, setNiche] = useState(category.niche || "");

  const handleSave = async () => {
    await updateMutation.mutateAsync({ id: category.id, name, niche: niche || null });
    setEditing(false);
    toast.success("Category updated");
  };

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(category.id);
    toast.success("Category deleted");
    onBack();
  };

  return (
    <ScrollArea className="flex-1">
      <div className="p-4 2xl:p-5 max-w-4xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 flex-1">
            <span className="text-2xl">{category.icon}</span>
            {editing ? (
              <div className="flex items-center gap-2 flex-1">
                <Input value={name} onChange={(e) => setName(e.target.value)} className="h-8 max-w-[200px]" />
                <Input value={niche} onChange={(e) => setNiche(e.target.value)} placeholder="Niche" className="h-8 max-w-[150px]" />
                <Button size="sm" onClick={handleSave}>Save</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
              </div>
            ) : (
              <>
                <h1 className="text-xl font-semibold">{category.name}</h1>
                {category.niche && <Badge variant="secondary" className="text-xs">{category.niche}</Badge>}
              </>
            )}
          </div>
          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" className="h-8 gap-1" onClick={() => setEditing(!editing)}>
              <Pencil className="h-3 w-3" /> Edit
            </Button>
            <Button variant="outline" size="sm" className="h-8 gap-1" onClick={() => onGenerateForCategory?.(category)}>
              Generate
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={handleDelete}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="knowledge">
          <TabsList>
            <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
            <TabsTrigger value="concepts">Concepts</TabsTrigger>
            <TabsTrigger value="winners">Winners</TabsTrigger>
            <TabsTrigger value="library">Library</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="knowledge" className="mt-4">
            <CategoryKnowledgeTab category={category} />
          </TabsContent>

          <TabsContent value="concepts" className="mt-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Bookmark className="h-4 w-4 text-primary" />
                  Saved Concepts
                  <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{savedConcepts.length}</Badge>
                </h3>
              </div>
              {savedConcepts.length === 0 ? (
                <div className="rounded-lg border border-dashed p-12 text-center">
                  <Bookmark className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No concepts saved for this category yet.</p>
                  <p className="text-xs text-muted-foreground mt-1">Save concepts from the generation form to see them here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {savedConcepts.map((c) => (
                    <div key={c.id} className="rounded-lg border p-3 space-y-2 hover:bg-accent/20 transition-colors">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium">{c.title}</p>
                          {c.scene && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{c.scene}</p>}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive shrink-0"
                          onClick={() => deleteConcept.mutate(c.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {c.background && <Badge variant="outline" className="text-[9px] h-4 px-1.5">🎨 {c.background}</Badge>}
                        {c.lighting && <Badge variant="outline" className="text-[9px] h-4 px-1.5">💡 {c.lighting}</Badge>}
                        {c.is_custom && <Badge variant="secondary" className="text-[9px] h-4 px-1.5">Custom</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="winners" className="mt-4">
            <CategoryWinnersTab category={category} />
          </TabsContent>

          <TabsContent value="library" className="mt-4">
            <div className="rounded-lg border border-dashed p-12 text-center">
              <p className="text-sm text-muted-foreground">Generated ad packages for this category will appear here.</p>
            </div>
          </TabsContent>

          <TabsContent value="logs" className="mt-4">
            <Genie5ActivityLog entityType="category" entityId={category.id} />
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  );
}
