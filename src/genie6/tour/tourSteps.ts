/**
 * Genie 6.0 — Guided tour script (R-1).
 *
 * Two phases:
 *   1. Slides — pure narrative, full-page (intro / overview / decisions)
 *   2. Walkthrough — each step navigates to a real route + overlays a
 *      floating panel with explanation. User sees the actual UI, the
 *      panel narrates the why.
 *
 * Content sourced from /Users/powerhouse/Downloads/files/Genie_6.0_Planning_Deck_v2_Addendum.pptx
 * + IA / Modes Spec docs. Storytelling-first, not feature-list.
 */

export type TourStep =
  | {
      kind: "slide";
      eyebrow?: string;
      title: string;
      subtitle?: string;
      bullets?: string[];
      sections?: { title: string; bullets: string[] }[];
      footnote?: string;
    }
  | {
      kind: "walk";
      route: string;
      eyebrow: string;
      title: string;
      description: string;
      tips?: string[];
    };

export const TOUR_STEPS: TourStep[] = [
  /* ─────────────── Phase 1 · Intro slides (~5 min) ─────────────── */
  {
    kind: "slide",
    eyebrow: "Genie 6.0 · First UI draft",
    title: "What you're about to see is iteration zero.",
    subtitle:
      "It's a working prototype, not the final product — visuals will polish, copy will tighten, motion will land. Today we're aligning on shape: modes, IA, flows, and the decisions still open.",
    footnote: "Marketing · CEO · Engineering · Design — same room, same picture.",
  },
  {
    kind: "slide",
    eyebrow: "Brief · why we built this",
    title: "We studied the category for 4 months.",
    sections: [
      {
        title: "The competitors we mapped",
        bullets: [
          "AdCreative.ai — fast but recycled output, agencies churn",
          "Pencil — rich strategy library, weak generation",
          "Smartly.io — DPA strong, creative weak",
          "HeyGen / Synthesia / Arcads — UGC-only silos",
          "Krea / Midjourney — visual-first, no ad context",
          "Jasper / Copy.ai / Anyword — copy-only",
        ],
      },
      {
        title: "What users keep saying",
        bullets: [
          "'Output looks generic / off-brand' — top complaint",
          "'I have to leave one tool to use another'",
          "'No way to scale a winner without losing what worked'",
          "'I don't know which model / style to pick'",
          "'Onboarding is 15 forms before I see one ad'",
        ],
      },
    ],
  },
  {
    kind: "slide",
    eyebrow: "The wedge",
    title: "One engine. Six modes. Brand-true output.",
    bullets: [
      "Brand identity is the contract — not a setting buried in step 4.",
      "Modes match what users actually ship: brand · product · affiliate · UGC · variants · image-to-ad.",
      "Variants is the defensible layer — 2-axis (Intent × Scope), nobody else has this.",
      "AI fills 80% from context. Form asks only what's left.",
      "Quality scoring at output, never predicted CTR before-the-fact.",
    ],
  },

  /* ─────────────── Phase 2 · Overview slides (~2 min) ─────────────── */
  {
    kind: "slide",
    eyebrow: "What's already shipped",
    title: "The skeleton + the muscles.",
    sections: [
      {
        title: "Architecture",
        bullets: [
          "4 visual variants (Studio · Canvas · Command · Modular)",
          "Light + Dark first-class, system default + manual toggle",
          "FabAds shell-aware sub-nav with primary New Generation CTA",
          "Cmd+K palette + variant shortcuts (⌘1/2/3/4)",
        ],
      },
      {
        title: "Generation surface",
        bullets: [
          "6 modes with per-mode field allowlists",
          "Quick ↔ Advanced form toggle (persistent)",
          "Visual pickers — Brand · Angle · Tone · Format · Output",
          "G5 prompt bar — chips, refs, model, count, generate",
          "BrandFetchModal — paste URL → auto-fill brand profile",
        ],
      },
      {
        title: "Around the form",
        bullets: [
          "Workspace 3-view switcher (Tree / Master-detail / Cards)",
          "Library + Generations split, OutputCard 3-context actions",
          "Progress + Results variant screens (4 × 2)",
          "Settings hub with KB editor + Disclosure preference",
        ],
      },
    ],
  },
  {
    kind: "slide",
    eyebrow: "Open decisions for today",
    title: "We need your call on 4 things.",
    sections: [
      {
        title: "Modes & scope",
        bullets: [
          "Lock the 6 modes — anything we add or drop?",
          "Keep all 4 visual variants, or pick 1 as default?",
        ],
      },
      {
        title: "Onboarding",
        bullets: [
          "Solo vs Agency persona forks — keep, or auto-detect?",
          "First-generation: Quick form default vs guided flow?",
        ],
      },
      {
        title: "Data + flow",
        bullets: [
          "Real-time auto-categorize from URL paste — confidence threshold?",
          "Brand fetch — replace with backend service or stay mocked v1?",
        ],
      },
      {
        title: "Visual style",
        bullets: [
          "Lime accent restraint — too aggressive or just right?",
          "Density level — current is balanced, lock it?",
        ],
      },
    ],
    footnote: "After today's lock, we ship the final UI in 2 weeks.",
  },

  /* ─────────────── Phase 3 · Walkthrough — actual screens ─────────── */
  {
    kind: "walk",
    route: "/iq/genie6",
    eyebrow: "Stop 1 · Dashboard",
    title: "This is where the work starts.",
    description:
      "Greeting + 6 KPI tiles surface what matters today (generations, credits, top performer, trending finding, active brands, recent activity). Below: 6 mode cards as the primary verb-tiles. Below that, a Recent generations strip (Suno-style) so the user lands and immediately sees the last batch.",
    tips: [
      "Solo persona shows 3-4 KPI tiles + Product / Image-to-Ad prominent.",
      "Agency persona shows all 6 + Brand / UGC / Variants prominent.",
      "Empty state (new user) replaces with welcome carousel + setup nudges.",
    ],
  },
  {
    kind: "walk",
    route: "/iq/genie6",
    eyebrow: "Stop 2 · + New generation (universal CTA)",
    title: "Anywhere in Genie, this opens the same overlay.",
    description:
      "Top-of-sidebar primary lime button. Click it from Dashboard, Workspace, Library, Settings — same overlay opens with prompt + URL paste + 6 mode cards. If user is on a context page (Brand detail / Library item), context auto-prefills.",
    tips: [
      "URL paste auto-categorizes into the right mode.",
      "Cmd+K opens the same overlay with route-derived prefill.",
    ],
  },
  {
    kind: "walk",
    route: "/iq/genie6/generate/product-ad/form",
    eyebrow: "Stop 3 · Generate form (Quick mode)",
    title: "Three fields. AI handles the other 80%.",
    description:
      "Default Quick mode shows only must-fill fields per mode. Product Ad: starting point + brand + product + count. Audience, angle, tone, scene, format, output type, references — all auto-defaulted by the AI from brand context.",
    tips: [
      "Form-mode toggle in the header — flip to Advanced any time.",
      "BrandPicker 'Add' tile opens BrandFetchModal — URL paste auto-detects.",
      "Count is a free input now (default 5) — not locked to chip presets.",
    ],
  },
  {
    kind: "walk",
    route: "/iq/genie6/generate/product-ad/form",
    eyebrow: "Stop 4 · Advanced form",
    title: "Every lever a power user wants.",
    description:
      "Same form, Advanced toggle on — every field renders. Notice the visual pickers: brand cards (h-scroll), angle cards (real-ad samples + sample headline overlay), tone chips with sample-rewrite swatches, scene library for image modes, format frames at correct aspect ratio, animated output-type previews. User picks by what it LOOKS like, not by reading a label.",
    tips: [
      "Each picker reuses the same h-scroll snap-to-card pattern — single visual rhythm.",
      "Plain-language labels: 'How should it sound?' not 'Tone'. 'How many?' not 'Count'.",
    ],
  },
  {
    kind: "walk",
    route: "/iq/genie6/generate/product-ad/form",
    eyebrow: "Stop 5 · The prompt bar",
    title: "G5's killer composer, redrawn for each variant.",
    description:
      "Sticky 3-row composer at the form's bottom. Row 1: paperclip refs popover + suggestion chips (Try / Refine). Row 2: auto-grow prompt textarea (Cmd+Enter to fire). Row 3: mode + brand context pills, AI model picker (image / video / copy filtered by output type), count stepper, credits, Test 4, Generate.",
    tips: [
      "Studio: clean elevated card. Canvas: floating glass dock. Command: ops-strip with mono status. Modular: > module card. Same content, different chrome.",
      "Suggestion chips swap from Try: → Refine: post-generation.",
    ],
  },
  {
    kind: "walk",
    route: "/iq/genie6/generate/product-ad/progress/demo-batch?count=4",
    eyebrow: "Stop 6 · Progress",
    title: "Live tiles, never a black box.",
    description:
      "Concentric ring loader + 6 stages (brief → research → concepts → render → copy → finalize). Live preview tiles appear during the render stage — first variant lands in <10s. Cancel always available.",
  },
  {
    kind: "walk",
    route: "/iq/genie6/library",
    eyebrow: "Stop 7 · Generations",
    title: "Every batch you've shipped, queryable.",
    description:
      "Renamed from 'Generated outputs' to 'Generations'. Card grid with brand chip + Q-score + ellipsis. Per-card 3-context actions: primary (Save / Launch / Download) visible, ellipsis for secondary, right-rail preview pane on click, bulk toolbar slides in on multi-select. CSV export top-right of every batch — including the very first onboarding generation.",
  },
  {
    kind: "walk",
    route: "/iq/genie6/workspace/brands",
    eyebrow: "Stop 8 · Workspace",
    title: "Brands + Categories, three ways to browse.",
    description:
      "Master-detail cascading by default (Apple Settings pattern). Toggle to Tree (Notion / Figma) or Cards + drawer (Linear / Krea). Choice persists per user. Brand detail = profile + products + KB + competitors + connected variants.",
  },
  {
    kind: "walk",
    route: "/iq/genie6/settings",
    eyebrow: "Stop 9 · Settings",
    title: "Profiles, libraries, compliance — not a flat dump.",
    description:
      "Brand profiles · Category KB · Avatar library · Voice library · Templates · Disclosure preference (C2PA stamp on / regulated / off). Account / Plan / Billing routes back into FabAds settings — Genie doesn't reinvent payments.",
  },
  {
    kind: "slide",
    eyebrow: "End of tour",
    title: "Now — the open decisions.",
    subtitle:
      "Modes, onboarding, data flow, visual style. Pick your top 2, we build to that this sprint.",
    footnote: "System paad denge.",
  },
];

export const SLIDE_COUNT = TOUR_STEPS.filter((s) => s.kind === "slide").length;
export const TOTAL_STEPS = TOUR_STEPS.length;
