import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Check, Rocket, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGenieTemplates, type GenieTemplate } from "@/hooks/use-genie-templates";
import { Input } from "@/components/ui/input";

interface Props {
  approach: "templates" | "fresh";
  onApproachChange: (v: "templates" | "fresh") => void;
  selectedTemplateIds: Set<string>;
  onSelectedTemplateIdsChange: (ids: Set<string>) => void;
  variant?: "inline" | "cards";
  hideToggle?: boolean;
  themePillActiveClass?: string;
  themePillInactiveClass?: string;
}

export function Genie5ApproachPicker({
  approach, onApproachChange,
  selectedTemplateIds, onSelectedTemplateIdsChange,
  variant = "inline", hideToggle = false,
  themePillActiveClass = "", themePillInactiveClass = "",
}: Props) {
  const { data: templates = [] } = useGenieTemplates();
  const [search, setSearch] = useState("");

  const filteredTemplates = useMemo(() => {
    if (!search.trim()) return templates;
    const q = search.toLowerCase();
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.tags?.some((tag) => tag.toLowerCase().includes(q))
    );
  }, [templates, search]);

  const toggleTemplate = (id: string) => {
    const next = new Set(selectedTemplateIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectedTemplateIdsChange(next);
  };

  // Cards variant (wizard)
  if (variant === "cards") {
    return (
      <div className="space-y-5">
        <h3 className="text-sm font-semibold text-foreground">Choose generation approach</h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            { id: "fresh" as const, title: "🚀 Fresh AI Concepts", desc: "AI generates entirely new creative concepts from scratch" },
            { id: "templates" as const, title: "📋 Use My Templates", desc: "Apply your uploaded high-performing ad templates as the visual base" },
          ].map((a) => (
            <button
              key={a.id}
              onClick={() => onApproachChange(a.id)}
              className={cn(
                "rounded-xl border-2 p-6 text-center space-y-3 transition-all duration-200 hover:shadow-md",
                approach === a.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40"
              )}
            >
              <p className="text-[13px] font-semibold text-foreground">{a.title}</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{a.desc}</p>
              {approach === a.id && (
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center mx-auto">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
            </button>
          ))}
        </div>
        {approach === "templates" && (
          <>
            <SearchInput value={search} onChange={setSearch} />
            <TemplateScrollArea templates={filteredTemplates} selectedIds={selectedTemplateIds} onToggle={toggleTemplate} />
          </>
        )}
      </div>
    );
  }

  // Inline variant
  return (
    <div className="space-y-2">
      {!hideToggle && (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 rounded-xl border border-border/60 bg-muted/40 p-0.5 shrink-0">
            <button
              onClick={() => onApproachChange("templates")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 h-7 text-[11px] font-medium transition-all duration-200",
                approach === "templates"
                  ? cn(themePillActiveClass || "bg-primary text-primary-foreground shadow-[0_0_12px_hsl(var(--primary)/0.2)]")
                  : cn(themePillInactiveClass || "text-muted-foreground hover:text-foreground")
              )}
            >
              📋 Use My Templates
            </button>
            <button
              onClick={() => onApproachChange("fresh")}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 h-7 text-[11px] font-medium transition-all duration-200",
                approach === "fresh"
                  ? cn(themePillActiveClass || "bg-primary text-primary-foreground shadow-[0_0_12px_hsl(var(--primary)/0.2)]")
                  : cn(themePillInactiveClass || "text-muted-foreground hover:text-foreground")
              )}
            >
              🚀 Fresh AI Concepts
            </button>
          </div>

          {approach === "templates" && (
            <div className="flex-1 animate-in fade-in-0 duration-200">
              <SearchInput value={search} onChange={setSearch} />
            </div>
          )}

          {approach === "templates" && selectedTemplateIds.size > 0 && (
            <Badge variant="secondary" className="text-[10px] h-5 px-1.5 shrink-0 animate-in fade-in-0 duration-200">
              {selectedTemplateIds.size} selected
            </Badge>
          )}
        </div>
      )}

      {approach === "fresh" && (
        <div className="flex items-center gap-2 py-1 px-1 animate-in fade-in-0 slide-in-from-top-1 duration-200">
          <Rocket className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-[11px] text-muted-foreground">AI will generate fresh concepts from scratch</span>
        </div>
      )}

      {approach === "templates" && (
        <div className="animate-in fade-in-0 slide-in-from-top-1 duration-300">
          <TemplateScrollArea templates={filteredTemplates} selectedIds={selectedTemplateIds} onToggle={toggleTemplate} />
        </div>
      )}
    </div>
  );
}

function SearchInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search templates by name or tags..."
        className="h-8 pl-8 text-[11px] bg-muted/30 border-border/50"
      />
    </div>
  );
}

function TemplateScrollArea({
  templates, selectedIds, onToggle,
}: {
  templates: GenieTemplate[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
}) {
  if (templates.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-4 text-center">
        <p className="text-xs text-muted-foreground">No templates found.</p>
      </div>
    );
  }

  return (
    <div className="flex overflow-x-auto gap-2.5 pb-1 scrollbar-none">
      {templates.map((t) => {
        const selected = selectedIds.has(t.id);
        const tags = t.tags?.slice(0, 3) || [];
        return (
          <button
            key={t.id}
            onClick={() => onToggle(t.id)}
            className={cn(
              "relative rounded-lg overflow-hidden border-2 transition-all w-[160px] shrink-0 flex flex-col",
              selected ? "border-primary ring-1 ring-primary/30" : "border-transparent hover:border-border"
            )}
          >
            <div className="aspect-square w-full overflow-hidden">
              <img src={t.image_url} alt={t.name} className="w-full h-full object-cover" loading="lazy" />
            </div>
            {selected && (
              <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                <Check className="h-3 w-3 text-primary-foreground" />
              </div>
            )}
            <div className="p-1.5 bg-background/80 backdrop-blur-sm space-y-1">
              <p className="text-[10px] font-medium text-foreground truncate">{t.name}</p>
              {tags.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {tags.map((tag) => (
                    <span key={tag} className="text-[8px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
