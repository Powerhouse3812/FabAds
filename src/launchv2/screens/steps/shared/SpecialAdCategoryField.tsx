import { Shield, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { UseFlowV2 } from "../../../state/useFlowV2";
import type { SpecialAdCategory } from "../../../types";
import { SPECIAL_CATEGORIES } from "../../../data";
import { fieldPolicy, specialCategoryActive } from "../../../reducer";

export default function SpecialAdCategoryField({ flow }: { flow: UseFlowV2 }) {
  const { plan, patch } = flow;
  const policy = fieldPolicy(plan);
  if (policy.specialAdCategories.visibility === "hidden") return null;

  const declared = plan.specialAdDeclared;
  const active = specialCategoryActive(plan);

  const toggleDeclared = (on: boolean) => {
    if (on) {
      patch({ specialAdDeclared: true });
    } else {
      // turning off clears any picked categories
      patch({ specialAdDeclared: false, specialAdCategories: [] });
    }
  };

  const toggleCategory = (id: SpecialAdCategory) => {
    const on = plan.specialAdCategories.includes(id);
    patch({
      specialAdCategories: on
        ? plan.specialAdCategories.filter((c) => c !== id)
        : [...plan.specialAdCategories, id],
    });
  };

  return (
    <div className="space-y-3">
      {/* Master toggle */}
      <div className="flex items-start justify-between gap-3 rounded-2xl border border-border bg-card px-3 py-2.5">
        <div className="min-w-0">
          <Label className="flex items-center gap-1.5 text-sm font-medium text-foreground">
            <Shield className="h-4 w-4 text-muted-foreground" />
            Special ad category
          </Label>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Declare if this campaign promotes credit, employment, housing, or social/political issues. Meta restricts targeting for these.
          </p>
        </div>
        <Switch checked={declared} onCheckedChange={toggleDeclared} />
      </div>

      {/* Category picker — revealed when declared */}
      {declared && (
        <div className="space-y-2 pl-1">
          <Label className="text-xs text-muted-foreground">Select the category</Label>
          <div className="flex flex-wrap gap-2">
            {SPECIAL_CATEGORIES.map((c) => {
              const on = plan.specialAdCategories.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleCategory(c.id)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                    on
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border bg-card text-muted-foreground hover:bg-accent",
                  )}
                >
                  {c.label}
                </button>
              );
            })}
          </div>
          {active && (
            <p className="flex items-center gap-1.5 text-[11px] text-amber-600">
              <Lock className="h-3 w-3" /> Age, gender and lookalikes are locked for compliance.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
