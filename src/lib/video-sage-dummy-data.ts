import { fakeSleep } from "./demo-mode";

export interface VideoSageAnalysis {
  summary: {
    get: string;
    who: string;
    to: string;
    by: string;
  };
  framework: {
    name: string;
    fullName: string;
    saved: boolean;
    segments: { label: string; duration: number; color: string }[];
  };
  storyboard: { time: string; scene: string; visuals: string; dialogue: string }[];
  script: { time: string; visual: string; dialogue: string }[];
  metadata: {
    scriptingStyle: string;
    captionTheme: string;
    language: string;
    duration: number;
  };
}

export interface DummyVideo {
  id: string;
  title: string;
  thumbnail_url: string;
  video_url: string;
  duration_seconds: number;
  language: string;
  status: "pending" | "analysing" | "analysed" | "failed";
  analysis: VideoSageAnalysis | null;
  created_at: string;
  concepts_count: number;
}

const ANALYSES: VideoSageAnalysis[] = [
  {
    summary: {
      get: "Health-conscious adults aged 35-65 who actively seek wellness solutions",
      who: "People struggling with chronic joint pain and limited mobility",
      to: "Try a clinically-proven natural supplement for lasting relief",
      by: "Showcasing real patient testimonials and clinical trial results",
    },
    framework: {
      name: "PAS",
      fullName: "Problem-Agitate-Solution",
      saved: false,
      segments: [
        { label: "Hook", duration: 3, color: "hsl(45 93% 47%)" },
        { label: "Problem", duration: 8, color: "hsl(217 91% 60%)" },
        { label: "Agitate", duration: 12, color: "hsl(263 70% 50%)" },
        { label: "Solution", duration: 10, color: "hsl(160 84% 39%)" },
        { label: "CTA", duration: 3, color: "hsl(0 84% 60%)" },
      ],
    },
    storyboard: [
      { time: "00:00–00:03", scene: "Opening hook", visuals: "Close-up of person wincing while climbing stairs", dialogue: "Are you tired of joint pain holding you back?" },
      { time: "00:03–00:11", scene: "Problem setup", visuals: "Montage: person struggling with daily tasks, pills on counter", dialogue: "Millions suffer from chronic joint inflammation every day." },
      { time: "00:11–00:23", scene: "Agitation", visuals: "Split screen: before (pain) vs competitors failing", dialogue: "Over-the-counter solutions only mask the symptoms temporarily." },
      { time: "00:23–00:33", scene: "Solution reveal", visuals: "Product shot with clinical data overlay, happy testimonials", dialogue: "JointFlex uses patented BioAbsorb technology backed by 3 clinical trials." },
      { time: "00:33–00:36", scene: "CTA", visuals: "Product box with discount badge, URL overlay", dialogue: "Get 40% off your first order. Link in bio." },
    ],
    script: [
      { time: "00:00–00:03", visual: "Hook — pain close-up", dialogue: "Are you tired of joint pain holding you back?" },
      { time: "00:03–00:11", visual: "Problem montage", dialogue: "Millions suffer from chronic joint inflammation every day. The stiffness, the aching, the inability to do what you love." },
      { time: "00:11–00:23", visual: "Agitate — failed solutions", dialogue: "You've tried everything. Painkillers that wreck your stomach. Creams that don't penetrate deep enough. Physical therapy that costs a fortune." },
      { time: "00:23–00:33", visual: "Solution + testimonials", dialogue: "JointFlex is different. Our patented BioAbsorb formula delivers relief in 7 days — clinically proven in 3 peer-reviewed studies." },
      { time: "00:33–00:36", visual: "CTA card", dialogue: "Get 40% off today. Tap the link below." },
    ],
    metadata: { scriptingStyle: "Direct Response", captionTheme: "Bold Impact", language: "English", duration: 36 },
  },
  {
    summary: {
      get: "Fitness enthusiasts aged 18-34 looking for workout supplements",
      who: "Gym-goers frustrated with slow muscle recovery",
      to: "Switch to a faster-absorbing protein blend",
      by: "Showing side-by-side recovery comparisons and athlete endorsements",
    },
    framework: {
      name: "AIDA",
      fullName: "Attention-Interest-Desire-Action",
      saved: false,
      segments: [
        { label: "Attention", duration: 4, color: "hsl(45 93% 47%)" },
        { label: "Interest", duration: 10, color: "hsl(217 91% 60%)" },
        { label: "Desire", duration: 14, color: "hsl(263 70% 50%)" },
        { label: "Action", duration: 4, color: "hsl(0 84% 60%)" },
      ],
    },
    storyboard: [
      { time: "00:00–00:04", scene: "Attention grab", visuals: "Athlete mid-rep, sweat dripping, intense lighting", dialogue: "What if your recovery was as intense as your workout?" },
      { time: "00:04–00:14", scene: "Interest build", visuals: "Lab footage, molecule animations, split-screen comparison", dialogue: "ProRecover uses nano-encapsulation to deliver 3x faster protein absorption." },
      { time: "00:14–00:28", scene: "Desire", visuals: "Testimonials from 3 athletes, before/after physique shots", dialogue: "Over 50,000 athletes have made the switch. Here's what they say." },
      { time: "00:28–00:32", scene: "Action", visuals: "Product lineup with pricing, limited time badge", dialogue: "Join the movement. First bag free with subscription." },
    ],
    script: [
      { time: "00:00–00:04", visual: "Hero athlete shot", dialogue: "What if your recovery was as intense as your workout?" },
      { time: "00:04–00:14", visual: "Science breakdown", dialogue: "ProRecover uses nano-encapsulation technology for 3x faster protein absorption than standard whey." },
      { time: "00:14–00:28", visual: "Social proof montage", dialogue: "Over 50,000 athletes trust ProRecover. See the transformations for yourself." },
      { time: "00:28–00:32", visual: "Offer card", dialogue: "First bag free when you subscribe today. Link below." },
    ],
    metadata: { scriptingStyle: "Aspirational", captionTheme: "Clean Minimal", language: "English", duration: 32 },
  },
];

const VIDEO_TITLES = [
  "3 Brand | Will NOT DO NOT PUT IT DOWN",
  "FitPro Max — Recovery That Matches Your Hustle",
  "SkinGlow Serum — Before & After Real Results",
  "EcoClean Home — The 30-Second Kitchen Reset",
  "MindCalm App — Sleep Better Tonight",
  "PetFresh — Vet-Approved Nutrition Ad",
  "TechFlow CRM — Close Deals 2x Faster",
  "BabyStep Shoes — First Steps Campaign",
];

export function getDummyVideos(): DummyVideo[] {
  return VIDEO_TITLES.map((title, i) => ({
    id: `demo-video-${i + 1}`,
    title,
    thumbnail_url: `https://picsum.photos/seed/vsage${i + 1}/640/360`,
    video_url: "",
    duration_seconds: 28 + Math.floor(Math.random() * 20),
    language: i % 3 === 0 ? "Hindi" : "English",
    status: i === 0 ? "analysing" as const : i === 7 ? "failed" as const : "analysed" as const,
    analysis: i === 0 || i === 7 ? null : ANALYSES[i % ANALYSES.length],
    created_at: new Date(Date.now() - i * 86400000 * 2).toISOString(),
    concepts_count: i === 0 || i === 7 ? 0 : 1 + (i % 3),
  }));
}

export function getRandomAnalysis(): VideoSageAnalysis {
  return ANALYSES[Math.floor(Math.random() * ANALYSES.length)];
}

export async function fakeAnalyseVideo(): Promise<VideoSageAnalysis> {
  await fakeSleep(2500, 4500);
  return getRandomAnalysis();
}

/* ── Phase 3: Script Generation + Editing ── */

export interface ScriptConcept {
  id: string;
  framework: string;
  frameworkFull: string;
  script: { time: string; visual: string; dialogue: string }[];
  createdAt: string;
  status: "generating" | "ready";
}

const FRAMEWORK_MAP: Record<string, { name: string; fullName: string; segments: { label: string; duration: number; color: string }[] }> = {
  PAS: {
    name: "PAS",
    fullName: "Problem-Agitate-Solution",
    segments: [
      { label: "Hook", duration: 3, color: "hsl(45 93% 47%)" },
      { label: "Problem", duration: 8, color: "hsl(217 91% 60%)" },
      { label: "Agitate", duration: 12, color: "hsl(263 70% 50%)" },
      { label: "Solution", duration: 10, color: "hsl(160 84% 39%)" },
      { label: "CTA", duration: 3, color: "hsl(0 84% 60%)" },
    ],
  },
  AIDA: {
    name: "AIDA",
    fullName: "Attention-Interest-Desire-Action",
    segments: [
      { label: "Attention", duration: 4, color: "hsl(45 93% 47%)" },
      { label: "Interest", duration: 10, color: "hsl(217 91% 60%)" },
      { label: "Desire", duration: 14, color: "hsl(263 70% 50%)" },
      { label: "Action", duration: 4, color: "hsl(0 84% 60%)" },
    ],
  },
  BAB: {
    name: "BAB",
    fullName: "Before-After-Bridge",
    segments: [
      { label: "Before", duration: 10, color: "hsl(0 84% 60%)" },
      { label: "After", duration: 12, color: "hsl(160 84% 39%)" },
      { label: "Bridge", duration: 10, color: "hsl(217 91% 60%)" },
    ],
  },
  FAB: {
    name: "FAB",
    fullName: "Features-Advantages-Benefits",
    segments: [
      { label: "Features", duration: 10, color: "hsl(217 91% 60%)" },
      { label: "Advantages", duration: 10, color: "hsl(263 70% 50%)" },
      { label: "Benefits", duration: 12, color: "hsl(160 84% 39%)" },
    ],
  },
};

const SCRIPT_POOLS: Record<string, { time: string; visual: string; dialogue: string }[][]> = {
  PAS: [
    ANALYSES[0].script,
    [
      { time: "00:00–00:03", visual: "Hook — alarm clock smashing", dialogue: "Still waking up exhausted every single morning?" },
      { time: "00:03–00:10", visual: "Problem — sluggish routine montage", dialogue: "Low energy ruins your focus, your mood, your entire day." },
      { time: "00:10–00:22", visual: "Agitate — failed supplements on shelf", dialogue: "You've tried coffee, energy drinks, even those sketchy pills. Nothing sticks." },
      { time: "00:22–00:32", visual: "Solution + results", dialogue: "VitaBoost is a slow-release adaptogen stack that keeps you sharp for 10 hours — no crash." },
      { time: "00:32–00:36", visual: "CTA card", dialogue: "Try it risk-free. 60-day guarantee. Tap below." },
    ],
  ],
  AIDA: [
    ANALYSES[1].script,
    [
      { time: "00:00–00:04", visual: "Attention — drone shot of crowded gym", dialogue: "Everyone's working out. Almost nobody is recovering right." },
      { time: "00:04–00:14", visual: "Interest — science animation", dialogue: "Your muscles need 48 hours to rebuild — unless you accelerate the process." },
      { time: "00:14–00:28", visual: "Desire — transformation stories", dialogue: "RegenPro users report 40% faster recovery and 2x strength gains in 90 days." },
      { time: "00:28–00:32", visual: "Action — pricing card", dialogue: "Start your transformation today. First month half price." },
    ],
  ],
  BAB: [
    [
      { time: "00:00–00:10", visual: "Before — stressed marketer at desk", dialogue: "Before FabAds, we spent 6 hours building a single campaign. Exhausting." },
      { time: "00:10–00:22", visual: "After — same marketer, relaxed, dashboard glowing", dialogue: "After FabAds, we launch 20 campaigns in 30 minutes. Same team, 10x output." },
      { time: "00:22–00:32", visual: "Bridge — product walkthrough", dialogue: "The bridge? AI-powered automation that handles targeting, creatives, and budgets for you." },
    ],
  ],
  FAB: [
    [
      { time: "00:00–00:10", visual: "Features — product UI walkthrough", dialogue: "Smart scheduling, one-click A/B tests, and cross-platform publishing in a single dashboard." },
      { time: "00:10–00:20", visual: "Advantages — comparison chart", dialogue: "That means 80% less time switching tools and zero missed posting windows." },
      { time: "00:20–00:32", visual: "Benefits — happy customer testimonials", dialogue: "Our users grew their ROAS by 3.2x in the first quarter. Your turn." },
    ],
  ],
};

const EDIT_MODIFIERS: Record<string, (dialogue: string) => string> = {
  "Make it more urgent": (d) => d.replace(/\.$/, "!").replace(/\?$/, "?!") + " Act now — this won't last.",
  "Shorten it": (d) => d.split(". ").slice(0, 1).join(". ") + ".",
  "Add social proof": (d) => d + " Trusted by 100,000+ professionals worldwide.",
  "Make it conversational": (d) => "Look, " + d.charAt(0).toLowerCase() + d.slice(1),
};

export function getFrameworkMeta(fw: string) {
  return FRAMEWORK_MAP[fw] ?? FRAMEWORK_MAP.PAS;
}

export async function fakeGenerateScript(framework: string): Promise<ScriptConcept> {
  await fakeSleep(2000, 4000);
  const fw = framework.toUpperCase();
  const pool = SCRIPT_POOLS[fw] ?? SCRIPT_POOLS.PAS;
  const script = pool[Math.floor(Math.random() * pool.length)];
  const meta = getFrameworkMeta(fw);
  return {
    id: crypto.randomUUID(),
    framework: meta.name,
    frameworkFull: meta.fullName,
    script: [...script],
    createdAt: new Date().toISOString(),
    status: "ready",
  };
}

export async function fakeEditScript(
  script: { time: string; visual: string; dialogue: string }[],
  prompt: string
): Promise<{ script: { time: string; visual: string; dialogue: string }[]; explanation: string }> {
  await fakeSleep(1500, 3000);
  const modifier = Object.entries(EDIT_MODIFIERS).find(([k]) =>
    prompt.toLowerCase().includes(k.toLowerCase().split(" ")[0])
  );
  const modFn = modifier ? modifier[1] : (d: string) => d + " — enhanced by AI.";
  const modifiedIdx = Math.floor(Math.random() * script.length);
  const newScript = script.map((row, i) =>
    i === modifiedIdx ? { ...row, dialogue: modFn(row.dialogue) } : { ...row }
  );
  return {
    script: newScript,
    explanation: modifier
      ? `Applied "${modifier[0]}" to the ${script[modifiedIdx]?.visual?.split(" — ")[0] ?? "script"} block.`
      : `Modified the ${script[modifiedIdx]?.visual?.split(" — ")[0] ?? "script"} block based on your prompt.`,
  };
}
