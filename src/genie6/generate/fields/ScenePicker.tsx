import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDraft } from "../../stores/draftStore";

/**
 * ScenePicker — visual scene/composition library (iter-5 P-3, ports G5 Concept Cards).
 *
 * Image-mode-only field: picks the visual direction the AI should render
 * the ad in (composition / lighting / setting). Surfaces only when the
 * output type is image-led. Optional — users can skip and let AI pick.
 *
 * Pattern: G5 Genie5ConceptCards.tsx — visual cards, click selects, click
 * again deselects. Same horizontal-scroll layout as AnglePicker for
 * vertical compactness.
 */

interface Scene {
  id: string;
  label: string;
  hint: string;
  imageUrl: string;
}

const SCENES: Scene[] = [
  {
    id: "hero-product",
    label: "Hero product",
    hint: "Centered subject, studio backdrop, max focus on the SKU.",
    imageUrl:
      "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=400&q=70",
  },
  {
    id: "lifestyle",
    label: "Lifestyle moment",
    hint: "In-use shot, natural setting, real-context warmth.",
    imageUrl:
      "https://images.unsplash.com/photo-1631730486572-226d1f595b68?auto=format&fit=crop&w=400&q=70",
  },
  {
    id: "flat-lay",
    label: "Editorial flat lay",
    hint: "Top-down composition with props, magazine-style layout.",
    imageUrl:
      "https://images.unsplash.com/photo-1556228852-80b6e5eeff06?auto=format&fit=crop&w=400&q=70",
  },
  {
    id: "macro",
    label: "Texture macro",
    hint: "Tight close-up — show the surface, the ingredient, the detail.",
    imageUrl:
      "https://images.unsplash.com/photo-1617043786394-f977fa12eddf?auto=format&fit=crop&w=400&q=70",
  },
  {
    id: "aspirational",
    label: "Aspirational scene",
    hint: "Golden hour, mood-led, sells the feeling not the product.",
    imageUrl:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=400&q=70",
  },
  {
    id: "minimalist",
    label: "Minimalist studio",
    hint: "Clean negative space, single subject, premium read.",
    imageUrl:
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=400&q=70",
  },
  {
    id: "in-hand",
    label: "Hand-held / in-use",
    hint: "Hand holding, scale + interaction context, UGC-feel.",
    imageUrl:
      "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?auto=format&fit=crop&w=400&q=70",
  },
  {
    id: "workspace",
    label: "Workspace context",
    hint: "Desk, vanity, kitchen — placed where it lives.",
    imageUrl:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=70",
  },
];

export function ScenePicker() {
  const { draft, dispatch } = useDraft();

  return (
    <div className="space-y-2">
      <label className="text-g6-sm font-medium text-g6-text">
        Scene <span className="text-g6-text-tertiary">(optional)</span>
      </label>
      <p className="text-g6-xs text-g6-text-tertiary">
        How should the visual look? Leave blank to let AI pick.
      </p>
      <div className="scrollbar-none -mx-1 flex w-full snap-x snap-mandatory gap-2 overflow-x-auto px-1 pb-1">
        {SCENES.map((scene) => {
          const active = draft.sceneId === scene.id;
          return (
            <button
              key={scene.id}
              type="button"
              onClick={() =>
                dispatch({
                  type: "SET_SCENE",
                  sceneId: active ? null : scene.id,
                })
              }
              className={cn(
                "g6-lift relative flex w-[180px] shrink-0 snap-start flex-col overflow-hidden rounded-g6-base text-left transition-all",
                active
                  ? "border border-g6-primary bg-g6-primary-bg ring-1 ring-g6-primary/30"
                  : "border border-g6-border-secondary bg-g6-bg-container hover:border-g6-border"
              )}
            >
              {active && (
                <span className="absolute right-1.5 top-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-g6-primary text-g6-text-on-accent shadow-g6-sm">
                  <Check className="h-3 w-3" />
                </span>
              )}

              <div className="aspect-[5/3] w-full overflow-hidden bg-g6-bg-spotlight">
                <img
                  src={scene.imageUrl}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>

              <div className="space-y-0.5 p-2.5">
                <p
                  className={cn(
                    "text-g6-sm font-semibold leading-none",
                    active ? "text-g6-primary" : "text-g6-text"
                  )}
                >
                  {scene.label}
                </p>
                <p className="text-[11px] text-g6-text-tertiary leading-snug line-clamp-2">
                  {scene.hint}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
