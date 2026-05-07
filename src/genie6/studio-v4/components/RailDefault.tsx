import { FolderOpen, Package, Sparkles, Target } from "lucide-react";
import { getConceptById } from "../data/concepts";
import type { UseWizardReturn } from "../state/useWizard";

interface RailDefaultProps {
  wizard: UseWizardReturn;
}

const CATEGORY_LABEL: Record<string, string> = {
  asset: "Asset",
  ad: "Ad",
  social: "Social",
};

const FORMAT_LABEL: Record<string, string> = {
  image: "Image",
  video: "Video",
};

const ANGLE_LABEL: Record<string, string> = {
  hero: "Hero Shot",
  lifestyle: "Lifestyle",
  "social-proof": "Social Proof",
  urgency: "Urgency/Sale",
  comparison: "Comparison",
  "ugc-style": "UGC Style",
  unboxing: "Unboxing",
  infographic: "Infographic",
};

const SOURCE_ICON: Record<string, string> = {
  upload: "🖼",
  library: "🗂",
  pinterest: "📌",
  "brand-winner-ads": "🏆",
  "product-winner-ads": "📦",
  url: "🔗",
};

/**
 * RailDefault — default content of the right rail when no picker is active.
 * Live recipe summary so the user can see Step 4 state at a glance.
 */
export function RailDefault({ wizard }: RailDefaultProps) {
  const { state } = wizard;
  const concepts = state.selectedConceptIds
    .map((id) => getConceptById(id))
    .filter((c): c is NonNullable<typeof c> => c !== undefined);
  const totalOutputs = state.credits;

  return (
    <div className="flex h-full flex-col">
      <header className="shrink-0 border-b border-border px-4 py-3">
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Recipe
        </p>
        <h3 className="text-sm font-bold text-foreground">Active selections</h3>
      </header>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-3">
        {/* Context */}
        <Section icon={FolderOpen} label="Context">
          <p className="text-xs text-foreground">
            <span className="font-semibold">
              {state.category ? CATEGORY_LABEL[state.category] : "—"}
            </span>
            {" · "}
            <span className="font-semibold">
              {state.format ? FORMAT_LABEL[state.format] : "—"}
            </span>
          </p>
          {state.productId && (
            <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
              <Package className="h-3 w-3" />
              Product · {state.productId}
            </p>
          )}
          {state.categoryId && (
            <p className="mt-1 text-[11px] text-muted-foreground">
              Category · {state.categoryId}
            </p>
          )}
        </Section>

        {/* Angle */}
        <Section icon={Target} label="Angle">
          {state.angleId ? (
            <p className="text-xs font-semibold text-foreground">
              {ANGLE_LABEL[state.angleId] ?? state.angleId}
            </p>
          ) : (
            <p className="text-[11px] italic text-muted-foreground">
              Not picked — AI will choose.
            </p>
          )}
        </Section>

        {/* Concepts */}
        <Section icon={Sparkles} label={`Concepts · ${concepts.length}`}>
          {concepts.length === 0 ? (
            <p className="text-[11px] italic text-muted-foreground">
              None — AI will pick (single AI Pick row on Step 5).
            </p>
          ) : (
            <ul className="flex flex-wrap gap-1">
              {concepts.map((c) => (
                <li
                  key={c.id}
                  className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground"
                >
                  <span>{c.emoji}</span>
                  <span>{c.name}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* Attached refs */}
        <Section
          icon={FolderOpen}
          label={`Attached · ${state.attachedReferences.length}`}
        >
          {state.attachedReferences.length === 0 ? (
            <p className="text-[11px] italic text-muted-foreground">
              No references attached.
            </p>
          ) : (
            <ul className="space-y-1">
              {state.attachedReferences.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center gap-2 text-[11px] text-foreground"
                >
                  {r.thumbnail ? (
                    <img
                      src={r.thumbnail}
                      alt=""
                      className="h-6 w-6 shrink-0 rounded object-cover"
                    />
                  ) : (
                    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded bg-muted text-[10px]">
                      {SOURCE_ICON[r.source] ?? "•"}
                    </span>
                  )}
                  <span className="truncate">{r.label}</span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <footer className="shrink-0 border-t border-border px-4 py-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-mono uppercase tracking-wider text-muted-foreground">
            Total
          </span>
          <span className="font-mono font-bold text-foreground">
            {totalOutputs} {totalOutputs === 1 ? "output" : "outputs"} · {totalOutputs} cr
          </span>
        </div>
      </footer>
    </div>
  );
}

function Section({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-1.5 flex items-center gap-1.5">
        <Icon className="h-3 w-3 text-primary" />
        <h4 className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </h4>
      </div>
      {children}
    </section>
  );
}
