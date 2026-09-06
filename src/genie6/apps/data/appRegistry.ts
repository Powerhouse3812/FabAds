/**
 * Other Apps — the registry (Genie 2.0 §8).
 *
 * 15 apps, one array. 7 are live and fully declared (sections, cost, zero
 * state, stages); 8 stay "Coming soon" — a card only, no internal screen.
 * AppRunner (owned by the Apps UI agent) reads a live app's `sections` and
 * renders the shared 750px setup-column anatomy from them; nothing here
 * hand-builds a screen, so a 16th app is a registry entry, not a new file.
 *
 * RULES BAKED INTO THIS DATA (§8 "Rules that override the file")
 *  - Second inputs always come from a picker, never a second upload box.
 *    Product Placement's product is a `media-picker` with
 *    `sources: ["catalogue", "upload"]`; Face Swap's face is an
 *    `avatar-picker` (not upload) and its target video is a `media-picker`
 *    with `sources: ["library", "upload"]`.
 *  - §13 avatar + voice are decided together: every `avatar-picker` here
 *    carries `withVoice: true` except Face Swap, which swaps a face only —
 *    `withVoice: false, withTone: false`. `withTone` is otherwise only true
 *    where a spoken performance exists (Avatar Shots, PPT/PDF to Video);
 *    Product Placement's avatar appears in-scene without a scripted line,
 *    so it carries voice but not tone.
 *  - Every cost.unitLabel is quoted verbatim from §8's table so the copy on
 *    the primary action can never drift from the priced unit.
 *
 * A NOTE FOR WHOEVER BUILDS AppRunner (the quantity gap)
 * §8's table never gives Avatar Shots a "how many shots" field or Product
 * Placement a "how many scenes" field — only the per-unit rate. Rather than
 * invent a field kind that isn't in the locked appTypes.ts contract,
 * `appCost.ts` treats an optional numeric `values.count` (default 1) as the
 * shot/scene multiplier. If AppRunner adds a quantity stepper for those two
 * apps, wire it to the field id `"count"` so the live cost preview picks it
 * up for free. Every other app's multiplier is read straight off its
 * declared fields (languages picked, source duration, slide count) — see
 * appCost.ts for how.
 */
import type { AppKey, AppCategory, GenieApp } from "../appTypes";

export const GENIE_APPS: GenieApp[] = [
  // ───────────────────────────────────────────────────────────── Live ──
  {
    key: "translate-videos",
    name: "Translate Videos",
    tagline: "Dub one video into 175 languages, voice cloned.",
    subtitle:
      "Upload a video or pull one from the Library, choose your target languages, and Genie handles transcription, translation and voice cloning per track.",
    category: "enhance",
    icon: "Languages",
    state: "live",
    cost: { rate: 6, unitLabel: "6 credits / language / minute", unit: "language-minute" },
    sections: [
      {
        title: "Source",
        fields: [
          {
            kind: "media-picker",
            id: "video",
            label: "Video",
            hint: "Upload a video or choose one from your Library.",
            media: "video",
            sources: ["library", "upload"],
            accept: [".mp4", ".mov"],
            required: true,
          },
        ],
      },
      {
        title: "Output",
        fields: [
          {
            kind: "language-multiselect",
            id: "languages",
            label: "Target languages",
            hint: "175 languages available — voice cloned per language.",
            required: true,
          },
        ],
      },
    ],
    zeroState: {
      title: "Translate any video into new languages",
      line: "One upload becomes a translated, voice-cloned version for every language you pick.",
      steps: [
        "Pick a video from your Library or upload one",
        "Select the languages you want it translated into",
        "Generate — each language renders as its own tracked output",
      ],
    },
    stages: [
      "Extracting audio",
      "Transcribing",
      "Translating 4 languages",
      "Cloning voice",
      "Rendering tracks",
      "Muxing video",
    ],
  },
  {
    key: "avatar-shots",
    name: "Avatar Shots",
    tagline: "Cast a presenter or cinematic avatar shot in minutes.",
    subtitle:
      "Pick the framing, an avatar with its voice and tone, and Genie renders a fully performed on-camera shot.",
    category: "create",
    icon: "UserRound",
    state: "live",
    cost: { rate: 9, unitLabel: "9 credits / shot", unit: "shot" },
    sections: [
      {
        title: "Format",
        fields: [
          {
            kind: "segmented",
            id: "format",
            label: "Shot type",
            options: [
              { value: "presenter", label: "Presenter", desc: "Direct-to-camera, studio-style delivery." },
              { value: "cinematic", label: "Cinematic", desc: "Scene-staged, film-style framing." },
            ],
            required: true,
          },
        ],
      },
      {
        title: "Cast",
        fields: [
          {
            kind: "avatar-picker",
            id: "avatarVoice",
            label: "Avatar & voice",
            hint: "Pick a preset avatar, its voice and a tone — decided together.",
            withVoice: true,
            withTone: true,
            required: true,
          },
        ],
      },
      {
        title: "Output",
        fields: [
          // Priced "9 credits / shot" (§8), and nothing else on this form
          // carries a shot count — so the cost preview needs this field or it
          // can only ever quote for one. `previewCost` reads it by id.
          {
            kind: "stepper",
            id: "count",
            label: "Shots",
            hint: "Each shot is billed separately.",
            min: 1,
            max: 12,
            unitNoun: ["shot", "shots"],
            required: true,
          },
          { kind: "aspect-ratio", id: "aspectRatio", label: "Aspect ratio", required: true },
          {
            kind: "select",
            id: "resolution",
            label: "Resolution",
            options: [
              { value: "720p", label: "720p", desc: "Draft quality" },
              { value: "1080p", label: "1080p", desc: "Standard" },
              { value: "4K", label: "4K", desc: "Premium" },
            ],
            required: true,
          },
        ],
      },
    ],
    zeroState: {
      title: "Generate on-camera avatar shots",
      line: "Cast a preset avatar with a matching voice and get a presenter- or cinematic-style shot.",
      steps: [
        "Choose Presenter or Cinematic framing",
        "Pick an avatar, its voice and a tone",
        "Set aspect ratio and resolution, then generate",
      ],
    },
    stages: [
      "Casting avatar",
      "Generating voice track",
      "Rendering shot",
      "Compositing background",
      "Colour + finishing pass",
    ],
  },
  {
    key: "ppt-pdf-to-video",
    name: "PPT/PDF to Video",
    tagline: "Turn a slide deck into a narrated video.",
    subtitle:
      "Upload a PPTX, PPT or PDF and Genie scripts, voices and renders an avatar walkthrough of every slide.",
    category: "create",
    icon: "Presentation",
    state: "live",
    cost: { rate: 4, unitLabel: "4 credits / slide", unit: "slide" },
    sections: [
      {
        title: "Source",
        fields: [
          {
            kind: "media-picker",
            id: "document",
            label: "Document",
            hint: "Upload a deck or pick one from your Library. PPTX, PPT, PDF.",
            media: "document",
            sources: ["library", "upload"],
            accept: [".pptx", ".ppt", ".pdf"],
            required: true,
          },
          {
            kind: "media-picker",
            id: "additionalImages",
            label: "Additional images",
            hint: "Optional — extra product or brand shots to slot between slides.",
            media: "image",
            sources: ["library", "upload"],
            accept: [".jpg", ".png"],
            required: false,
          },
        ],
      },
      {
        title: "Cast",
        fields: [
          {
            kind: "avatar-picker",
            id: "avatarVoice",
            label: "Avatar & voice",
            hint: "The presenter who narrates the deck.",
            withVoice: true,
            withTone: true,
            required: true,
          },
        ],
      },
      {
        title: "Output",
        fields: [
          { kind: "aspect-ratio", id: "aspectRatio", label: "Aspect ratio", required: true },
          {
            kind: "select",
            id: "resolution",
            label: "Resolution",
            options: [
              { value: "720p", label: "720p", desc: "Draft quality" },
              { value: "1080p", label: "1080p", desc: "Standard" },
              { value: "4K", label: "4K", desc: "Premium" },
            ],
            required: true,
          },
        ],
      },
    ],
    zeroState: {
      title: "Turn a deck into a narrated video",
      line: "Your slides become a presenter-led video, one avatar walking through every page.",
      steps: [
        "Upload a PPTX, PPT or PDF, or pick one from your Library",
        "Add an avatar and voice to narrate it",
        "Set aspect ratio and resolution, then generate",
      ],
    },
    stages: [
      "Parsing slides",
      "Writing narration script",
      "Generating voiceover",
      "Rendering avatar per slide",
      "Assembling video",
    ],
  },
  {
    key: "upscale-video",
    name: "Upscale Video",
    tagline: "Upscale resolution and frame rate on any clip.",
    subtitle:
      "Take a lower-resolution video and raise it to 1080p or 4K at 24, 30 or 60 fps without a reshoot.",
    category: "enhance",
    icon: "ArrowUpNarrowWide",
    state: "live",
    cost: { rate: 11, unitLabel: "11 credits / minute", unit: "minute" },
    sections: [
      {
        title: "Source",
        fields: [
          {
            kind: "media-picker",
            id: "video",
            label: "Video",
            hint: "Upload a video or choose one from your Library.",
            media: "video",
            sources: ["library", "upload"],
            accept: [".mp4", ".mov"],
            required: true,
          },
        ],
      },
      {
        title: "Output",
        fields: [
          {
            kind: "select",
            id: "targetResolution",
            label: "Target resolution",
            options: [
              { value: "1080p", label: "1080p" },
              { value: "4K", label: "4K", desc: "Recommended for feed placements" },
            ],
            required: true,
          },
          {
            kind: "segmented",
            id: "frameRate",
            label: "Frame rate",
            options: [
              { value: "24", label: "24 fps" },
              { value: "30", label: "30 fps" },
              { value: "60", label: "60 fps" },
            ],
            required: true,
          },
        ],
      },
    ],
    zeroState: {
      title: "Upscale a video's resolution and frame rate",
      line: "Sharpen an existing clip for larger placements without re-shooting it.",
      steps: [
        "Pick a video from your Library or upload one",
        "Choose the target resolution and frame rate",
        "Generate — Genie upscales it minute by minute",
      ],
    },
    stages: [
      "Analysing source frames",
      "Upscaling resolution",
      "Interpolating frame rate",
      "Denoising",
      "Re-encoding",
    ],
  },
  {
    key: "product-placement",
    name: "Product Placement",
    tagline: "Place any product into a live-action scene.",
    subtitle:
      "Pull a product from Catalogue or upload a cutout, pick the avatar it appears with, and Genie composites the scene.",
    category: "create",
    icon: "Package",
    state: "live",
    cost: { rate: 16, unitLabel: "16 credits / scene", unit: "scene" },
    sections: [
      {
        title: "Source",
        fields: [
          {
            kind: "media-picker",
            id: "product",
            label: "Product",
            hint: "From Catalogue or upload. PNG with transparency, JPG.",
            media: "product",
            sources: ["catalogue", "upload"],
            accept: [".png", ".jpg"],
            required: true,
          },
        ],
      },
      {
        title: "Cast",
        fields: [
          {
            kind: "avatar-picker",
            id: "avatarVoice",
            label: "Avatar",
            hint: "The avatar the product appears with in-scene.",
            withVoice: true,
            withTone: false,
            required: true,
          },
        ],
      },
      {
        title: "Output",
        fields: [
          // Priced "16 credits / scene" (§8). Same reasoning as Avatar Shots'
          // shot count — the inputs don't imply how many scenes are wanted.
          {
            kind: "stepper",
            id: "count",
            label: "Scenes",
            hint: "Each scene is composited and billed separately.",
            min: 1,
            max: 8,
            unitNoun: ["scene", "scenes"],
            required: true,
          },
        ],
      },
    ],
    zeroState: {
      title: "Place a product inside a live-action scene",
      line: "Drop your product into a scene with an avatar — no reshoot or physical sample needed.",
      steps: [
        "Pick a product from Catalogue or upload one",
        "Choose the avatar the product appears with",
        "Generate — Genie composites the product into the scene",
      ],
    },
    stages: [
      "Segmenting product",
      "Matching scene lighting",
      "Compositing placement",
      "Rendering scene",
      "Finishing pass",
    ],
  },
  {
    key: "face-swap",
    name: "Face Swap",
    tagline: "Swap an avatar's face onto any video.",
    subtitle:
      "Pick the avatar and the target footage — Genie maps and blends the new face in, frame by frame.",
    category: "enhance",
    icon: "ScanFace",
    state: "live",
    cost: { rate: 13, unitLabel: "13 credits / minute", unit: "minute" },
    sections: [
      {
        title: "Cast",
        fields: [
          {
            kind: "avatar-picker",
            id: "face",
            label: "Face",
            hint: "The avatar whose face replaces the one in the target video.",
            withVoice: false,
            withTone: false,
            required: true,
          },
        ],
      },
      {
        title: "Source",
        fields: [
          {
            kind: "media-picker",
            id: "targetVideo",
            label: "Target video",
            hint: "The video the face gets swapped into.",
            media: "video",
            sources: ["library", "upload"],
            accept: [".mp4", ".mov"],
            required: true,
          },
        ],
      },
    ],
    zeroState: {
      title: "Swap a face into any video",
      line: "Apply an avatar's face onto footage you already have, frame by frame.",
      steps: [
        "Choose the avatar whose face you want to use",
        "Pick a target video from your Library or upload one",
        "Generate — Genie swaps the face in, minute by minute",
      ],
    },
    stages: [
      "Detecting facial landmarks",
      "Mapping face onto target",
      "Rendering per-frame swap",
      "Blending edges",
      "Re-encoding video",
    ],
  },
  {
    key: "speech-cleanup",
    name: "Speech Cleanup",
    tagline: "Clean up noisy voice recordings in minutes.",
    subtitle:
      "Upload a rough recording and Genie strips noise, levels volume and tightens pacing automatically.",
    category: "enhance",
    icon: "AudioWaveform",
    state: "live",
    badge: "New",
    cost: { rate: 2, unitLabel: "2 credits / minute", unit: "minute" },
    sections: [
      {
        title: "Source",
        fields: [
          {
            kind: "media-picker",
            id: "audio",
            label: "Audio",
            hint: "Upload audio or choose one from your Library. WAV, MP3, M4A.",
            media: "audio",
            sources: ["library", "upload"],
            accept: [".wav", ".mp3", ".m4a"],
            required: true,
          },
        ],
      },
    ],
    zeroState: {
      title: "Clean up noisy or rough audio",
      line: "Strip background noise, fix levels and tighten pacing on any voice recording.",
      steps: [
        "Upload an audio file or pick one from your Library",
        "Review the detected issues Genie will fix",
        "Generate — Genie returns a cleaned, level-matched track",
      ],
    },
    stages: [
      "Detecting noise profile",
      "Removing background noise",
      "Levelling volume",
      "Tightening pacing",
      "Rendering final track",
    ],
  },

  // ────────────────────────────────────────────────────────── Coming soon ──
  {
    key: "ai-studio",
    name: "AI Studio",
    tagline: "A full creative studio for AI-generated ad concepts.",
    subtitle: "Storyboard, generate and assemble a complete ad from a single brief, without leaving one screen.",
    category: "create",
    icon: "Sparkles",
    state: "coming-soon",
  },
  {
    key: "ai-video-generator",
    name: "AI Video Generator",
    tagline: "Generate original video from a text prompt alone.",
    subtitle: "Describe the scene, product and mood — Genie renders a fresh video with no source clip required.",
    category: "create",
    icon: "Clapperboard",
    state: "coming-soon",
  },
  {
    key: "ai-clipping",
    name: "AI Clipping",
    tagline: "Auto-cut long-form footage into scroll-stopping clips.",
    subtitle: "Feed in a long video and get the highlight-worthy moments cut to size for Reels and Shorts.",
    category: "edit",
    icon: "Scissors",
    state: "coming-soon",
  },
  {
    key: "batch-mode",
    name: "Batch Mode",
    tagline: "Run the same app across hundreds of inputs at once.",
    subtitle: "Queue a folder of products, videos or documents and let one batch clear the whole list.",
    category: "edit",
    icon: "Layers",
    state: "coming-soon",
  },
  {
    key: "generate-images",
    name: "Generate Images",
    tagline: "Generate static ad images from a text prompt.",
    subtitle: "Describe the product shot you need and get on-brand stills, no photographer required.",
    category: "create",
    icon: "ImagePlus",
    state: "coming-soon",
  },
  {
    key: "interactive-video",
    name: "Interactive Video",
    tagline: "Add clickable hotspots and branching paths to video ads.",
    subtitle: "Let viewers tap through product options or story branches inside a single video ad.",
    category: "edit",
    icon: "MousePointerClick",
    state: "coming-soon",
  },
  {
    key: "video-podcast",
    name: "Video Podcast",
    tagline: "Turn a script or recording into a two-host podcast video.",
    subtitle: "Genie casts two avatar hosts and renders a conversational, podcast-style ad from your notes.",
    category: "create",
    icon: "Mic",
    state: "coming-soon",
  },
  {
    key: "live-avatar",
    name: "LiveAvatar",
    tagline: "A real-time avatar that talks back, live.",
    subtitle: "Stream a responsive AI avatar into live sessions instead of a pre-rendered clip.",
    category: "live-avatar",
    icon: "Webcam",
    state: "coming-soon",
  },
];

/** Single lookup every consumer should use instead of `.find()` inline. */
export function getApp(key: AppKey): GenieApp | undefined {
  return GENIE_APPS.find((a) => a.key === key);
}

/** Powers the All Apps / Create / Enhance / Edit / LiveAvatar filter tabs. */
export function appsInCategory(c: AppCategory | "all"): GenieApp[] {
  if (c === "all") return GENIE_APPS;
  return GENIE_APPS.filter((a) => a.category === c);
}

/** One route-building function so no file hand-rolls the `/apps/:key` path. */
export const APP_PATH = (key: AppKey): string => `/iq/genie6/apps/${key}`;
