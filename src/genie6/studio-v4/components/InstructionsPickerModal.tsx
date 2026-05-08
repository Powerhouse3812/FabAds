import { useMemo, useState } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AttachedRef } from "../state/useWizard";
import {
  brands,
  products,
  categories,
  getInstructionsForEntity,
  type KbInstruction,
  type EntityType,
  type EntityId,
} from "@/mocks/shared";

/**
 * InstructionsPickerModal — pick KB instructions to attach as reference pills.
 *
 * Maalik's directive (A-12.19): KB toggle stays dumb on/off. The user attaches
 * specific instructions explicitly via the paperclip → "Instruction" entry,
 * which opens this modal. Each picked instruction lands in
 * `wizard.state.attachedReferences` as a closable pill.
 *
 * Resolves entity context (priority: product → brand → category) and lists:
 *   - Main instruction (the entity's primary rule, 1)
 *   - Custom instructions (per-entity user rule sets, multi)
 *   - Angle-specific instructions (tagged for specific angles, multi)
 */
interface InstructionsPickerModalProps {
  /** Resolves entity from wizard state. */
  brandId: string | null;
  productId: string | null;
  categoryId: string | null;
  /** Custom user-created instructions (from wizard state). */
  customInstructions: KbInstruction[];
  /** Called with selected instructions as AttachedRef[]. */
  onSave: (refs: AttachedRef[]) => void;
  onClose: () => void;
}

export function InstructionsPickerModal({
  brandId,
  productId,
  categoryId,
  customInstructions,
  onSave,
  onClose,
}: InstructionsPickerModalProps) {
  // Resolve active entity (priority: product → brand → category).
  const entity = useMemo(() => {
    if (productId) {
      const p = products.find((x) => x.id === productId);
      if (p) {
        return {
          type: "product" as EntityType,
          id: p.id as EntityId,
          name: p.name,
        };
      }
    }
    if (brandId) {
      const b = brands.find((x) => x.id === brandId);
      if (b) {
        return {
          type: "brand" as EntityType,
          id: b.id as EntityId,
          name: b.name,
        };
      }
    }
    if (categoryId) {
      const c = categories.find((x) => x.id === categoryId);
      if (c) {
        return {
          type: "category" as EntityType,
          id: c.id as EntityId,
          name: c.name,
        };
      }
    }
    return null;
  }, [brandId, productId, categoryId]);

  const groups = useMemo(() => {
    if (!entity) return { main: null, custom: [], angles: [] };
    return getInstructionsForEntity(entity.type, entity.id, customInstructions);
  }, [entity, customInstructions]);

  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const handleSave = () => {
    const all: KbInstruction[] = [
      ...(groups.main ? [groups.main] : []),
      ...groups.custom,
      ...groups.angles,
    ];
    const refs: AttachedRef[] = all
      .filter((i) => selected.has(i.id))
      .map((i) => ({
        id: `instr-${i.id}`,
        source: "instruction",
        label: i.name,
      }));
    onSave(refs);
  };

  const n = selected.size;

  // Empty state — no entity context.
  if (!entity) {
    return (
      <div className="flex h-full flex-col">
        <header className="shrink-0 flex items-center justify-between border-b border-border/40 px-3 py-2.5">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              Knowledge Base
            </p>
            <h3 className="text-sm font-semibold text-foreground">
              Pick instructions
            </h3>
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
        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          <p className="text-center text-[12px] text-muted-foreground">
            Pick a brand / product / category first to see its KB instructions.
          </p>
        </div>
        <footer className="shrink-0 flex items-center justify-end border-t border-border/40 px-3 py-2.5">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground hover:opacity-90"
          >
            Close
          </button>
        </footer>
      </div>
    );
  }

  const totalAvailable =
    (groups.main ? 1 : 0) + groups.custom.length + groups.angles.length;

  return (
    <div className="flex h-full flex-col">
      {/* Header — eyebrow + title + close X (mirrors ScriptRail chassis) */}
      <header className="shrink-0 flex items-center justify-between border-b border-border/40 px-3 py-2.5">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Knowledge Base · {entity.name}
          </p>
          <h3 className="text-sm font-semibold text-foreground">
            Pick instructions
          </h3>
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
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {totalAvailable === 0 ? (
          <p className="py-12 text-center text-[12px] text-muted-foreground">
            No instructions saved yet for {entity.name}.
          </p>
        ) : (
          <div className="space-y-4">
            {/* Main instruction */}
            {groups.main && (
              <Group label="Main instruction" hint="entity's primary rule">
                <InstructionRow
                  instruction={groups.main}
                  selected={selected.has(groups.main.id)}
                  onToggle={() => toggle(groups.main!.id)}
                />
              </Group>
            )}

            {/* Custom instructions */}
            {groups.custom.length > 0 && (
              <Group
                label="Custom instructions"
                hint={`${groups.custom.length} saved`}
              >
                <div className="space-y-1.5">
                  {groups.custom.map((i) => (
                    <InstructionRow
                      key={i.id}
                      instruction={i}
                      selected={selected.has(i.id)}
                      onToggle={() => toggle(i.id)}
                    />
                  ))}
                </div>
              </Group>
            )}

            {/* Angle-specific instructions */}
            {groups.angles.length > 0 && (
              <Group
                label="Angle-specific instructions"
                hint={`${groups.angles.length} angle override${groups.angles.length === 1 ? "" : "s"}`}
              >
                <div className="space-y-1.5">
                  {groups.angles.map((i) => (
                    <InstructionRow
                      key={i.id}
                      instruction={i}
                      selected={selected.has(i.id)}
                      onToggle={() => toggle(i.id)}
                    />
                  ))}
                </div>
              </Group>
            )}
          </div>
        )}
      </div>

      {/* Footer — Cancel / Attach */}
      <footer className="shrink-0 flex items-center justify-end gap-2 border-t border-border/40 px-3 py-2.5">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={n === 0}
          className={cn(
            "inline-flex items-center gap-1 rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-primary-foreground transition-opacity",
            "hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          {n === 0
            ? "Attach instructions"
            : `Attach ${n} instruction${n === 1 ? "" : "s"}`}
        </button>
      </footer>
    </div>
  );
}

/* ────────────────────────────────────────────────────────── *
 *  Group — sub-section with label + hint + content.
 * ────────────────────────────────────────────────────────── */
function Group({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        {hint && (
          <span className="font-mono text-[9px] text-muted-foreground/60">
            · {hint}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

/* ────────────────────────────────────────────────────────── *
 *  InstructionRow — checkbox + name + description (truncated).
 * ────────────────────────────────────────────────────────── */
function InstructionRow({
  instruction,
  selected,
  onToggle,
}: {
  instruction: KbInstruction;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-start gap-2.5 rounded-xl border bg-card/40 px-3 py-2 text-left backdrop-blur-sm transition-all",
        selected
          ? "border-primary/50 bg-primary/5 ring-2 ring-primary/30"
          : "border-border/40 hover:border-foreground/20 hover:bg-card/60",
      )}
    >
      {/* Checkbox visual */}
      <span
        aria-hidden
        className={cn(
          "mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
          selected
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-background",
        )}
      >
        {selected && <Check className="h-3 w-3" strokeWidth={3} />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-semibold leading-tight text-foreground">
          {instruction.name}
        </p>
        <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-muted-foreground">
          {instruction.description}
        </p>
      </div>
    </button>
  );
}
