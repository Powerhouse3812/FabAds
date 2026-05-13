import { useState } from "react";
import { ArrowRight, Zap, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StepNav } from "../components/StepNav";

interface AffiliateInputProps {
  onBack: () => void;
  onContinue: (data: { category: string; refUrls: string[] }) => void;
}

/**
 * Step 2 — Affiliate input. Two fields only: Category name + Reference
 * URLs (list). The wizard infers description, target audience,
 * suggested angles, target keywords, and competitors from these in
 * Step 3.
 */
export function AffiliateInput({ onBack, onContinue }: AffiliateInputProps) {
  const [category, setCategory] = useState("");
  const [refUrls, setRefUrls] = useState<string[]>([""]);

  const updateUrl = (idx: number, val: string) => {
    setRefUrls((prev) => prev.map((u, i) => (i === idx ? val : u)));
  };

  const removeUrl = (idx: number) => {
    setRefUrls((prev) =>
      prev.length === 1 ? [""] : prev.filter((_, i) => i !== idx),
    );
  };

  const addUrl = () => setRefUrls((prev) => [...prev, ""]);

  const submit = () => {
    onContinue({
      category: category.trim() || "Auto Insurance",
      refUrls: refUrls.map((u) => u.trim()).filter(Boolean),
    });
  };

  return (
    <div className="bg-background">
      <StepNav active={1} onBack={onBack} backLabel="Back to Quick Start" />
      <div className="max-w-[640px] mx-auto px-6 pt-2 pb-10">
        <Badge
          variant="outline"
          className="text-[10px] uppercase tracking-wider font-mono mb-3 bg-primary/10 border-primary/30 text-foreground"
        >
          Step 2 · Input
        </Badge>
        <div className="flex items-start gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-foreground shrink-0">
            <Zap className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
              Tell us what you're{" "}
              <span className="bg-primary/30 px-1.5 rounded">promoting</span>
            </h1>
            <p className="text-[14px] text-muted-foreground mt-1.5">
              We'll build a knowledge base for your category and tailor ad
              angles to your audience.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-7 mt-7 space-y-6">
          {/* Category */}
          <div>
            <label
              htmlFor="aff-category"
              className="block text-[13px] font-semibold text-foreground"
            >
              Category name <span className="text-rose-500">*</span>
            </label>
            <Input
              id="aff-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g., Auto Insurance"
              className="mt-2 h-10"
            />
            <p className="text-[11px] text-muted-foreground mt-1.5">
              Type your own or pick from suggestions.
            </p>
          </div>

          {/* Reference URLs */}
          <div>
            <label className="block text-[13px] font-semibold text-foreground mb-2">
              Reference URLs{" "}
              <span className="text-[11px] font-normal text-muted-foreground">
                (optional — competitor pages, your content, offer pages)
              </span>
            </label>
            <div className="space-y-2">
              {refUrls.map((u, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    value={u}
                    onChange={(e) => updateUrl(i, e.target.value)}
                    placeholder="https://..."
                    className="h-9 flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removeUrl(i)}
                    className="h-9 w-9 shrink-0"
                    aria-label="Remove URL"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={addUrl}
                className="gap-1 text-[12px] h-7"
              >
                <Plus className="h-3.5 w-3.5" />
                Add another URL
              </Button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mt-7">
          <Button variant="outline" size="sm" onClick={onBack}>
            ← Back
          </Button>
          <Button onClick={submit} className="gap-1.5">
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
