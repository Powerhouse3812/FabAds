import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  BookOpen,
  ChevronRight,
  Sparkles,
  Wand2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { angles as ALL_ANGLES } from "@/mocks/shared/angles";
import {
  getInstructionsForEntity,
  type EntityType,
  type EntityId,
  type KbInstruction,
} from "@/mocks/shared";
import {
  useSavedInstructionsForEntity,
  addInstruction as savedAddInstruction,
} from "@/genie6/concepts/saved-store";

/**
 * AnglePlaybookPanel — 5th KB sub-section. Per-angle authoring rules:
 * for each of the top 30 angles, the user documents how Genie should treat
 * that angle for this specific entity (brand / product / category).
 *
 * Variant B (Maalik's pick A-12.59) — Category Accordion. 10 categories
 * collapsed by default; each expands to show its 3 angles. Single ✨ button
 * inside each editor merges manual + AI fill into one field. Per-angle cost
 * 1 credit; bulk-fill-category button discounted to 0.6×.
 *
 * Mocks: AI draft is stubbed (mockAiDraft below). Saved instructions persist
 * to the global saved-store and propagate to ContextRail / ConceptsLibrary.
 *
 * URL state:
 *   ?playbook-cat=<name>     which category is currently expanded
 *   ?playbook-angle=<id>     which angle's editor is open inside that category
 */

// ── Top 30 (Maalik: 3 per category × 10 categories) ─────────────────────

const CATEGORIES: { name: string; angleIds: string[] }[] = [
  { name: "Emotional",       angleIds: ["ang-asp-lifestyle", "ang-empowerment", "ang-emotional-story"] },
  { name: "Pressure",        angleIds: ["ang-fomo", "ang-urgency", "ang-scarcity"] },
  { name: "Comparison",      angleIds: ["ang-comparison", "ang-before-after", "ang-social-proof"] },
  { name: "Authority",       angleIds: ["ang-authority", "ang-clinical", "ang-certification"] },
  { name: "Value",           angleIds: ["ang-bundle", "ang-discount", "ang-free-trial"] },
  { name: "Problem-Solution",angleIds: ["ang-problem-solution", "ang-objection-buster", "ang-myth-busting"] },
  { name: "Lifestyle",       angleIds: ["ang-routine-led", "ang-gifting", "ang-self-care"] },
  { name: "Behavioral",      angleIds: ["ang-personalized", "ang-segment-specific", "ang-retargeting"] },
  { name: "Educational",     angleIds: ["ang-how-to", "ang-ingredient-deep-dive", "ang-myth-vs-fact"] },
  { name: "Contextual",      angleIds: ["ang-trend-jacking", "ang-seasonal", "ang-risk-reversal"] },
];

const TOTAL_ANGLES = CATEGORIES.reduce((n, c) => n + c.angleIds.length, 0);

// ── AI draft stub ───────────────────────────────────────────────────────

/**
 * Mock AI fill — deterministic-ish text based on entity + angle. Used by the
 * inline ✨ button + the bulk "fill all empties" action. Replace with a real
 * Anthropic API call later; for now returns a believable 2-3 line draft.
 */
function mockAiDraft(
  entityType: EntityType,
  entityId: string,
  angleId: string,
): string {
  const angle = ALL_ANGLES.find((a) => a.id === angleId);
  const label = angle?.label ?? angleId;
  const hint = angle?.description ?? "";
  const subject =
    entityType === "brand" ? "this brand"
    : entityType === "product" ? "this product"
    : "this category";
  return `AI draft for ${label} on ${subject} (${entityId}). ${hint}. Lead with the strongest hook for this angle, then a single proof point in the second line. Keep it 9:16-Reel ready.`;
}

// ── Component ───────────────────────────────────────────────────────────

interface AnglePlaybookPanelProps {
  entityType: EntityType;
  entityId: EntityId;
  entityLabel: string;
}

export function AnglePlaybookPanel({
  entityType,
  entityId,
  entityLabel,
}: AnglePlaybookPanelProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const openCategory = searchParams.get("playbook-cat") ?? "";
  const activeAngleId = searchParams.get("playbook-angle") ?? "";

  const setOpenCategory = (next: string) => {
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        if (!next) sp.delete("playbook-cat");
        else sp.set("playbook-cat", next);
        // closing the category also closes the angle editor
        sp.delete("playbook-angle");
        return sp;
      },
      { replace: true },
    );
  };

  const setActiveAngleId = (next: string) => {
    setSearchParams(
      (prev) => {
        const sp = new URLSearchParams(prev);
        if (!next) sp.delete("playbook-angle");
        else sp.set("playbook-angle", next);
        return sp;
      },
      { replace: true },
    );
  };

  // Pull seed + saved instructions, then merge into a per-angle map.
  const seed = getInstructionsForEntity(entityType, entityId);
  const saved = useSavedInstructionsForEntity(entityType, entityId);
  const allAngleInstr = useMemo(() => {
    return [...seed.angles, ...saved.filter((s) => s.kind === "angle")];
  }, [seed.angles, saved]);

  const byAngleId = useMemo(() => {
    const map = new Map<string, KbInstruction>();
    for (const i of allAngleInstr) {
      // Pick the most recent if multiple cover the same angle
      for (const ang of i.anglesCovered) {
        const existing = map.get(ang);
        if (!existing || +i.createdAt > +existing.createdAt) map.set(ang, i);
      }
    }
    return map;
  }, [allAngleInstr]);

  const filledCount = useMemo(() => {
    let n = 0;
    for (const cat of CATEGORIES) {
      for (const id of cat.angleIds) if (byAngleId.has(id)) n++;
    }
    return n;
  }, [byAngleId]);

  const emptyCount = TOTAL_ANGLES - filledCount;
  const bulkCost = Math.ceil(emptyCount * 0.6);

  const saveInstruction = (
    angleId: string,
    content: string,
    source: "manual" | "ai-generated",
  ) => {
    const angle = ALL_ANGLES.find((a) => a.id === angleId);
    if (!angle) return;
    const id = `kpb-${entityType}-${entityId}-${angleId}-${Date.now()}`;
    savedAddInstruction({
      id,
      entityType,
      entityId,
      kind: "angle",
      anglesCovered: [angleId],
      name: `${angle.label} — ${entityLabel}`,
      description: angle.description ?? "",
      content,
      source,
      createdAt: new Date(),
    });
  };

  const fillAllEmpty = () => {
    if (emptyCount === 0) return;
    for (const cat of CATEGORIES) {
      for (const id of cat.angleIds) {
        if (byAngleId.has(id)) continue;
        const draft = mockAiDraft(entityType, entityId, id);
        saveInstruction(id, draft, "ai-generated");
      }
    }
  };

  const fillCategory = (cat: { name: string; angleIds: string[] }) => {
    for (const id of cat.angleIds) {
      if (byAngleId.has(id)) continue;
      saveInstruction(id, mockAiDraft(entityType, entityId, id), "ai-generated");
    }
  };

  return (
    <div className="rounded-xl border border-border/60 bg-card/40 p-3.5">
      <header className="mb-3 flex flex-wrap items-center gap-2">
        <BookOpen className="h-3.5 w-3.5 text-muted-foreground" />
        <h4 className="text-[13px] font-semibold tracking-tight text-foreground">
          Angle Playbook
        </h4>
        <span className="inline-flex items-center rounded-full bg-foreground/[0.06] px-1.5 py-0.5 font-mono text-[9px] font-bold text-foreground">
          {filledCount} / {TOTAL_ANGLES}
        </span>
        <button
          type="button"
          onClick={fillAllEmpty}
          disabled={emptyCount === 0}
          className={cn(
            "ml-auto inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-transform",
            emptyCount === 0
              ? "cursor-not-allowed bg-muted text-muted-foreground"
              : "bg-primary text-primary-foreground hover:scale-[1.02]",
          )}
          title={emptyCount === 0 ? "All angles filled" : "AI-draft all empty angles"}
        >
          <Sparkles className="h-3 w-3" />
          {emptyCount === 0
            ? "All filled"
            : `Fill all empties · ${bulkCost} credits`}
        </button>
      </header>

      <p className="mb-2.5 text-[11px] text-muted-foreground">
        Per-angle rules Genie follows when generating ads for this {entityLabel}.
      </p>

      <ul className="space-y-1.5">
        {CATEGORIES.map((cat) => {
          const items = cat.angleIds.map((id) => ({
            id,
            angle: ALL_ANGLES.find((a) => a.id === id),
            instr: byAngleId.get(id) ?? null,
          }));
          const catFilled = items.filter((i) => i.instr).length;
          const catEmpty = cat.angleIds.length - catFilled;
          const open = openCategory === cat.name;
          return (
            <li
              key={cat.name}
              className="overflow-hidden rounded-lg border border-border/40 bg-background/40"
            >
              <button
                type="button"
                onClick={() => setOpenCategory(open ? "" : cat.name)}
                aria-expanded={open}
                className="flex w-full items-center gap-2 px-2.5 py-2 text-left transition-colors hover:bg-foreground/[0.04]"
              >
                <ChevronRight
                  className={cn(
                    "h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-300",
                    open && "rotate-90",
                  )}
                />
                <span className="text-[12px] font-semibold text-foreground">
                  {cat.name}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">
                  · {catFilled} / {cat.angleIds.length}
                </span>
                {catEmpty > 0 && (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      fillCategory(cat);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        fillCategory(cat);
                      }
                    }}
                    className="ml-auto inline-flex cursor-pointer items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[9px] font-semibold text-primary transition-colors hover:bg-primary/20"
                    title={`AI-draft ${catEmpty} empty angle${catEmpty === 1 ? "" : "s"} in ${cat.name}`}
                  >
                    <Sparkles className="h-2.5 w-2.5" />
                    fill {catEmpty}
                  </span>
                )}
              </button>
              {open && (
                <div className="space-y-1 border-t border-border/40 px-2 py-2">
                  {items.map(({ id, angle, instr }) => {
                    if (!angle) return null;
                    const isActive = activeAngleId === id;
                    const status: "manual" | "ai-drafted" | "empty" = !instr
                      ? "empty"
                      : instr.source === "ai-generated"
                        ? "ai-drafted"
                        : "manual";
                    return (
                      <div key={id}>
                        <button
                          type="button"
                          onClick={() => setActiveAngleId(isActive ? "" : id)}
                          className={cn(
                            "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[11px] transition-colors",
                            isActive && "bg-primary/10",
                            !isActive && "hover:bg-foreground/[0.04]",
                          )}
                        >
                          <StatusDot status={status} />
                          <span className="font-medium text-foreground">
                            {angle.label}
                          </span>
                          {instr ? (
                            <span className="ml-2 line-clamp-1 max-w-[420px] flex-1 text-muted-foreground">
                              {instr.content}
                            </span>
                          ) : (
                            <span className="ml-2 italic text-muted-foreground/60">
                              — empty —
                            </span>
                          )}
                        </button>
                        {isActive && (
                          <div className="pt-2 pb-1">
                            <AngleEditor
                              angle={angle}
                              instr={instr}
                              entityType={entityType}
                              entityId={entityId}
                              entityLabel={entityLabel}
                              onSave={(content, src) => {
                                saveInstruction(id, content, src);
                                setActiveAngleId("");
                              }}
                              onClose={() => setActiveAngleId("")}
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ── Bits ────────────────────────────────────────────────────────────────

function StatusDot({
  status,
}: {
  status: "manual" | "ai-drafted" | "empty";
}) {
  if (status === "manual")
    return (
      <span
        aria-label="Manual"
        className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
      />
    );
  if (status === "ai-drafted")
    return (
      <Sparkles aria-label="AI drafted" className="h-2.5 w-2.5 shrink-0 text-amber-500" />
    );
  return (
    <span
      aria-label="Empty"
      className="inline-block h-1.5 w-1.5 shrink-0 rounded-full border border-muted-foreground/50"
    />
  );
}

function AngleEditor({
  angle,
  instr,
  entityType,
  entityId,
  entityLabel,
  onSave,
  onClose,
}: {
  angle: { id: string; label: string; description?: string };
  instr: KbInstruction | null;
  entityType: EntityType;
  entityId: string;
  entityLabel: string;
  onSave: (content: string, source: "manual" | "ai-generated") => void;
  onClose: () => void;
}) {
  const [content, setContent] = useState(instr?.content ?? "");
  const [wasAiFilled, setWasAiFilled] = useState(
    (instr?.source as string | undefined) === "ai-generated",
  );

  const handleAiFill = () => {
    const draft = mockAiDraft(entityType, entityId, angle.id);
    setContent(draft);
    setWasAiFilled(true);
  };

  const handleSave = () => {
    if (!content.trim()) return;
    onSave(content.trim(), wasAiFilled ? "ai-generated" : "manual");
  };

  return (
    <div className="space-y-2 rounded-lg border border-border/40 bg-background p-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[12px] font-semibold tracking-tight text-foreground">
            {angle.label}
          </p>
          {angle.description && (
            <p className="text-[10px] italic text-muted-foreground">
              {angle.description}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground"
          title="Close"
        >
          <X className="h-3 w-3" />
        </button>
      </div>

      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            // user-edited an AI draft → reclassify on save
            if (wasAiFilled) setWasAiFilled(false);
          }}
          rows={3}
          placeholder={`Describe how Genie should generate ${angle.label} for this ${entityLabel}. Or click ✨ to draft with AI.`}
          className="w-full resize-none rounded-md border border-border/60 bg-background px-2.5 py-2 pr-16 text-[11px] leading-relaxed text-foreground placeholder:text-muted-foreground/60 outline-none transition-colors focus:border-primary/40"
        />
        <button
          type="button"
          onClick={handleAiFill}
          title="AI fill — 1 credit"
          className="absolute bottom-2 right-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 font-mono text-[9px] font-semibold text-primary transition-colors hover:bg-primary/20"
        >
          <Wand2 className="h-2.5 w-2.5" />
          AI · 1c
        </button>
      </div>

      <div className="flex items-center justify-end gap-1.5">
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-border/60 bg-background px-2.5 py-1 text-[10px] font-medium text-muted-foreground hover:border-foreground/30 hover:text-foreground"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!content.trim()}
          className={cn(
            "rounded-full px-2.5 py-1 text-[10px] font-semibold transition-transform",
            content.trim()
              ? "bg-primary text-primary-foreground hover:scale-[1.02]"
              : "cursor-not-allowed bg-muted text-muted-foreground",
          )}
        >
          Save
        </button>
      </div>
    </div>
  );
}
