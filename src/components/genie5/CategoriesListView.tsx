import { useState } from "react";
import { useGenieCategories, type GenieCategory } from "@/hooks/use-genie-categories";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, ArrowRight, FolderOpen, Link2 } from "lucide-react";
import { AddCategoryModal } from "./AddCategoryModal";

interface Props {
  onCategoryDetail: (cat: GenieCategory) => void;
}

export function CategoriesListView({ onCategoryDetail }: Props) {
  const { data: categories = [], isLoading } = useGenieCategories();
  const [addOpen, setAddOpen] = useState(false);

  return (
    <ScrollArea className="flex-1">
      <div className="p-4 2xl:p-5 max-w-5xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FolderOpen className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-semibold text-foreground">Categories</h1>
            {categories.length > 0 && (
              <Badge variant="secondary" className="text-xs h-5 px-2">
                {categories.length}
              </Badge>
            )}
          </div>
          <Button size="sm" className="h-8 text-xs gap-1.5" onClick={() => setAddOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            Add Category
          </Button>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-5 space-y-3">
                  <div className="h-10 w-10 rounded-lg bg-muted" />
                  <div className="h-4 w-24 rounded bg-muted" />
                  <div className="h-3 w-16 rounded bg-muted" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : categories.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center space-y-3">
              <FolderOpen className="h-10 w-10 mx-auto text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No categories yet</p>
              <Button size="sm" variant="outline" className="text-xs" onClick={() => setAddOpen(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add your first category
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat) => {
              const refUrls = Array.isArray(cat.reference_urls) ? cat.reference_urls : [];
              return (
                <Card
                  key={cat.id}
                  className="group cursor-pointer transition-all hover:shadow-md hover:border-primary/20"
                  onClick={() => onCategoryDetail(cat)}
                >
                  <CardContent className="p-5 space-y-3">
                    {/* Icon */}
                    <div className="flex items-start justify-between">
                      <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center text-xl">
                        {cat.icon || "📁"}
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
                    </div>

                    {/* Name + Niche */}
                    <div>
                      <p className="text-sm font-medium text-foreground truncate">
                        {cat.name}
                      </p>
                      {cat.niche && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {cat.niche}
                        </p>
                      )}
                    </div>

                    {/* Reference URLs count */}
                    {refUrls.length > 0 && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Link2 className="h-3 w-3" />
                        <span className="text-[11px]">
                          {refUrls.length} reference URL{refUrls.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <AddCategoryModal open={addOpen} onOpenChange={setAddOpen} />
    </ScrollArea>
  );
}
