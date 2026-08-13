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
    // A-12.8+: the Old/New Studio "generate/product-ad/form" path was
    // retired — that URL now redirects to the plain GenerateLanding
    // 6-tile picker (routes.tsx ":mode/form" rule), not a form. Studio
    // Alpha (studio-alpha/*) is the current primary generation flow.
    // This stop now targets its Step 2 — the real "starting point" screen.
    route: "/iq/genie6/studio-alpha/product",
    eyebrow: "Stop 3 · Pick what you're creating for",
    title: "Brand, product, or category — your call.",
    description:
      "Three tabs — Brand / Product / Category — each a visual card grid (logo or photo, industry/brand chip, run count). Click a card and the wizard advances immediately; there's no separate confirm step. Picking a category optionally lets you refine down to one product before continuing.",
    tips: [
      "Fetch URL opens a paste-a-link popover on the Brand and Product tabs — auto-detects and drops you into a prefilled profile.",
      "Search plus an industry/brand filter narrow each grid live.",
      "There's no Quick/Advanced form anymore — every step in this wizard is click-to-advance.",
    ],
  },
  {
    kind: "walk",
    route: "/iq/genie6/studio-alpha/approach",
    eyebrow: "Stop 4 · Pick your approach",
    title: "Seven ways to make the ad — pick by what it looks like.",
    description:
      "UGC Video, Create Variations, Image to Video, B-Roll, BG Remover, Resize, or From scratch — each card leads with an autoplay video preview, not a label or icon. The three that branch (UGC Video, Create Variations, Image to Video) reveal a 'Choose a style' row of sub-type cards instead of advancing immediately.",
    tips: [
      "Picking a sub-type auto-fills the angle + starting concepts on the next step — no blank page.",
      "'From scratch' is the catch-all: full prompt, references, angle, model, and output count with nothing pre-decided.",
    ],
  },
  {
    kind: "walk",
    route: "/iq/genie6/studio-alpha/configure",
    eyebrow: "Stop 5 · Configure — the prompt bar leads",
    title: "One composer, docked at the top.",
    description:
      "The prompt bar now sits at the TOP of the step, not the bottom. A row of attached-reference chips (Library, Winner ads, Industry Insights, Seed image, Template…), a paperclip + auto-grow textarea, then a footer row with the model picker, a variation-count stepper, and Generate with credits inline. Below the bar: a collapsed 'Angle · Concept' summary — auto-filled from your approach pick — that expands into full visual angle tiles and a trending-concepts grid.",
    tips: [
      "Angle + Concept start auto-filled and collapsed; touching either stops future auto-fill so your manual pick survives back/forward navigation.",
      "The Generation-settings popover (⋮ next to Generate) holds aspect ratio, quality/resolution, the Vary slider, and audio — separate from the visible controls.",
    ],
  },
  {
    kind: "walk",
    // A-12.8+: the old "/generate/product-ad/progress/:batchId" screen is
    // gone — that path matches no route and 404s. Studio Alpha's Step 5
    // Results Queue is the current equivalent: one surface for queued /
    // generating / ready / failed batches, no separate progress screen.
    // batch-006 in the mock data is mid-generation (18/50) so this stop
    // lands on a real live-progress state, not a finished batch.
    route: "/iq/genie6/studio-alpha/results?batch=batch-006",
    eyebrow: "Stop 6 · Results queue",
    title: "Live progress, no more ring-and-stages loader.",
    description:
      "Every batch — queued, generating, ready, or failed — lives in one Results queue. A generating batch (like this one, 18 of 50 done) shows a lime progress fill with an animated shimmer and a live count, not the concentric-ring 6-stage loader from the old plan. Ready batches show their outputs grouped into concept rows (Hero Shot, Lifestyle, Social Proof…) with per-row Regenerate / Launch / Save / Download.",
    tips: [
      "No Cancel yet — Edit / Regenerate / Save / Launch stay disabled until a batch hits Ready or Failed. That's a real gap, not a shipped decision.",
      "Switch batches from the queue strip up top — the active batch drives everything below it.",
    ],
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
/**
 * Number of "stop"s — i.e. `kind: "walk"` steps only (each labelled
 * "Stop N · …" in its own eyebrow). Slide-phase steps (intro / overview /
 * decisions / end-of-tour) are narrative bookends, not "stops" — the copy
 * that says "N-stop walkthrough" means this number, not TOTAL_STEPS.
 * Derived so the count can never drift from the data again (was hardcoded
 * to a stale "12" in 4 places while the walk count is actually 9).
 */
export const WALK_COUNT = TOUR_STEPS.filter((s) => s.kind === "walk").length;
