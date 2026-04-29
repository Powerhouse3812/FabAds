import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { useCategoryWinners, useCreateCategoryWinner, useDeleteCategoryWinner } from "@/hooks/use-category-winners";
import type { GenieCategory } from "@/hooks/use-genie-categories";

interface Props {
  category: GenieCategory;
}

export function CategoryWinnersTab({ category }: Props) {
  const { data: winners = [], isLoading } = useCategoryWinners(category.id);
  const createMutation = useCreateCategoryWinner();
  const deleteMutation = useDeleteCategoryWinner();

  const sameNiche = winners.filter((w) => !w.is_cross_niche);
  const crossNiche = winners.filter((w) => w.is_cross_niche);

  const handleAddDemo = async (crossNiche: boolean) => {
    const demoUrl = `https://picsum.photos/seed/${Date.now()}/400/400`;
    await createMutation.mutateAsync({
      category_id: category.id,
      image_url: demoUrl,
      is_cross_niche: crossNiche,
      tags: [category.niche || "general"],
    });
    toast.success("Winner added");
  };

  const renderGrid = (items: typeof winners, isCross: boolean) => (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium">{isCross ? "Cross Niche Winners" : "Same Niche Winners"}</h3>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => handleAddDemo(isCross)}>
          <Upload className="h-3 w-3" /> Upload
        </Button>
      </div>
      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed p-6 text-center">
          <p className="text-xs text-muted-foreground">No {isCross ? "cross-niche" : "same-niche"} winners yet. Upload winning ad images.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {items.map((w) => (
            <div key={w.id} className="group relative rounded-lg overflow-hidden border">
              <img src={w.image_url} alt="" className="w-full aspect-square object-cover" />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button variant="destructive" size="icon" className="h-7 w-7" onClick={() => deleteMutation.mutateAsync(w.id)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              {w.tags.length > 0 && (
                <div className="absolute bottom-1 left-1 flex gap-0.5 flex-wrap">
                  {w.tags.slice(0, 2).map((t) => (
                    <Badge key={t} variant="secondary" className="text-[9px] h-4 px-1 bg-black/60 text-white border-0">{t}</Badge>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {renderGrid(sameNiche, false)}
      {renderGrid(crossNiche, true)}
    </div>
  );
}
