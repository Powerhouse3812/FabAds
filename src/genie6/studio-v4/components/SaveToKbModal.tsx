import { useMemo, useState } from "react";
import { BookmarkPlus, Building2, Check, Package, Search, Tag, X } from "lucide-react";
import { brands, products, categories } from "@/mocks/shared";
import type { EntityType, EntityId } from "@/mocks/shared";
import { cn } from "@/lib/utils";

interface SaveToKbModalProps {
  /** Output ID (or any opaque source identifier) being saved as a Winner Ad. */
  sourceLabel?: string;
  onClose: () => void;
  onSave: (payload: { entityType: EntityType; entityId: EntityId; entityName: string }) => void;
}

/**
 * SaveToKbModal — cross-app save flow for Genie outputs.
 *
 * Maalik's spec: "Winner Ads — upload, save from anywhere in FabAds, but
 * have to ask kiske liye? Brand/Product/Category, and then which one."
 *
 * Two-step modal:
 *   1. Pick entity type (Brand / Product / Category)
 *   2. Pick the specific entity from a search-filterable list
 *
 * Stub — on save, fires `onSave` with the picked target. Persistence
 * (pushing into the WINNER_ADS list) is a follow-up.
 */
export function SaveToKbModal({ sourceLabel, onClose, onSave }: SaveToKbModalProps) {
  const [entityType, setEntityType] = useState<EntityType | null>(null);
  const [pickedId, setPickedId] = useState<EntityId | null>(null);
  const [query, setQuery] = useState("");

  const list = useMemo(() => {
    if (!entityType) return [];
    const src =
      entityType === "brand"
        ? brands.map((b) => ({ id: b.id, name: b.name, hint: b.domain }))
        : entityType === "product"
          ? products.map((p) => ({ id: p.id, name: p.name, hint: p.price }))
          : categories.map((c) => ({ id: c.id, name: c.name, hint: c.instruction.slice(0, 60) }));
    if (!query.trim()) return src;
    const q = query.trim().toLowerCase();
    return src.filter((it) => it.name.toLowerCase().includes(q) || it.hint?.toLowerCase().includes(q));
  }, [entityType, query]);

  const pickedEntity = useMemo(() => {
    if (!pickedId) return null;
    return list.find((it) => it.id === pickedId) ?? null;
  }, [pickedId, list]);

  const canSave = entityType && pickedId;

  const handleSave = () => {
    if (!entityType || !pickedId) return;
    const entity = list.find((it) => it.id === pickedId);
    if (!entity) return;
    onSave({ entityType, entityId: pickedId, entityName: entity.name });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-labelledby="save-to-kb-title"
        className="flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
      >
        {/* Header */}
        <header className="flex shrink-0 items-center justify-between border-b border-border/40 px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
              <BookmarkPlus className="h-3.5 w-3.5" />
            </div>
            <div>
              <h3 id="save-to-kb-title" className="text-sm font-semibold text-foreground">
                Save to Knowledge Base
              </h3>
              {sourceLabel && (
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {sourceLabel}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </header>

        {/* Body */}
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          {/* Step 1 — entity type */}
          <section>
            <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Step 1 — Save for
            </p>
            <div className="grid grid-cols-3 gap-2">
              <TypeBtn
                label="Brand"
                icon={Building2}
                active={entityType === "brand"}
                onClick={() => {
                  setEntityType("brand");
                  setPickedId(null);
                  setQuery("");
                }}
              />
              <TypeBtn
                label="Product"
                icon={Package}
                active={entityType === "product"}
                onClick={() => {
                  setEntityType("product");
                  setPickedId(null);
                  setQuery("");
                }}
              />
              <TypeBtn
                label="Category"
                icon={Tag}
                active={entityType === "category"}
                onClick={() => {
                  setEntityType("category");
                  setPickedId(null);
                  setQuery("");
                }}
              />
            </div>
          </section>

          {/* Step 2 — entity picker */}
          <section>
            <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Step 2 — Which {entityType ?? "one"}?
            </p>
            {!entityType ? (
              <div className="flex items-center justify-center rounded-lg border border-dashed border-border/50 bg-muted/20 px-3 py-8">
                <p className="text-[11px] italic text-muted-foreground">
                  Pick a type above first.
                </p>
              </div>
            ) : (
              <>
                <div className="relative mb-2">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={`Search ${entityType}s…`}
                    className="w-full rounded-full border border-border/60 bg-background py-1.5 pl-8 pr-3 text-xs outline-none focus:border-foreground/30"
                  />
                </div>
                <div className="max-h-56 overflow-y-auto rounded-lg border border-border/40 bg-background">
                  {list.length === 0 ? (
                    <p className="px-3 py-6 text-center text-[11px] italic text-muted-foreground">
                      No {entityType}s match.
                    </p>
                  ) : (
                    <ul>
                      {list.map((it) => {
                        const active = pickedId === it.id;
                        return (
                          <li key={it.id}>
                            <button
                              type="button"
                              onClick={() => setPickedId(it.id)}
                              className={cn(
                                "flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors",
                                active
                                  ? "bg-primary/10 text-foreground"
                                  : "text-foreground hover:bg-muted/40",
                              )}
                            >
                              <div
                                className={cn(
                                  "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                                  active
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-border",
                                )}
                              >
                                {active && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
                              </div>
                              <span className="min-w-0 flex-1 truncate font-medium">{it.name}</span>
                              {it.hint && (
                                <span className="truncate font-mono text-[10px] text-muted-foreground">
                                  {it.hint.length > 32 ? `${it.hint.slice(0, 32)}…` : it.hint}
                                </span>
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </>
            )}
          </section>

          {pickedEntity && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
              <p className="font-mono text-[10px] uppercase tracking-wider text-primary">
                Saving to
              </p>
              <p className="mt-0.5 text-sm font-semibold text-foreground">
                {pickedEntity.name}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Knowledge Base · Winner Ads
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-border/40 bg-muted/20 px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-border/60 bg-background px-3.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-foreground/30"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <BookmarkPlus className="h-3 w-3" />
            Save winner ad
          </button>
        </footer>
      </div>
    </div>
  );
}

function TypeBtn({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string;
  icon: React.ElementType;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 rounded-lg border px-3 py-2.5 text-xs font-semibold transition-colors",
        active
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-background text-foreground hover:border-foreground/30",
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}
