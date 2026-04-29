import type { Audience, Angle, Hook, Concept, Avatar, Voice } from "../types/entities";

export const audiences: Audience[] = [
  { id: "aud-aff-w-30-45", label: "Affluent women 30-45", segment: "F · 30-45 · HHI 12L+ · metro", brandId: "mamaearth" },
  { id: "aud-mom-25-35", label: "Mom 25-35", segment: "F · 25-35 · with toddler", brandId: "mamaearth" },
  { id: "aud-genz-fit", label: "Gen Z fitness", segment: "M+F · 18-26 · gym-active", brandId: "noise" },
  { id: "aud-male-22-30", label: "Urban male 22-30", segment: "M · 22-30 · tier 1-2 · earphone heavy", brandId: "boat" },
  { id: "aud-couple-30-45", label: "Settling-in couple", segment: "30-45 · first-home · DTC-curious", brandId: "sleepyhead" },
  { id: "aud-haircare-25-40", label: "Haircare 25-40", segment: "F · 25-40 · pro-clean ingredient", brandId: "plum" },
];

export const angles: Angle[] = [
  { id: "ang-fomo", label: "FOMO", description: "Limited time / running out / others already bought" },
  { id: "ang-asp-lifestyle", label: "Aspirational lifestyle", description: "Identity, transformation, future-self" },
  { id: "ang-comparison", label: "Comparison", description: "Side-by-side vs competitor or before/after" },
  { id: "ang-social-proof", label: "Social proof", description: "Customer count, reviews, testimonials" },
  { id: "ang-urgency", label: "Urgency", description: "Last 24 hours / today only / first 100" },
  { id: "ang-authority", label: "Authority", description: "Expert / dermatologist / clinical" },
  { id: "ang-bundle", label: "Bundle / upsell", description: "Combine with X for Y discount" },
  { id: "ang-retargeting", label: "Retargeting", description: "Welcome back / left in cart / saw this earlier" },
];

export const hooks: Hook[] = [
  { id: "hook-1", text: "Hair fall is real. This is not.", brandId: "mamaearth", angleId: "ang-comparison", performance: { ctr: 4.73, impressions: 142_840 } },
  { id: "hook-2", text: "Stop scrolling if you've ever had AirPods die at 6pm.", brandId: "boat", angleId: "ang-fomo", performance: { ctr: 3.92, impressions: 88_120 } },
  { id: "hook-3", text: "10 reasons your hair gummy isn't working.", brandId: "plum", angleId: "ang-authority", performance: { ctr: 2.87, impressions: 45_220 } },
  { id: "hook-4", text: "POV: you finally found the smartwatch that survives squat day.", brandId: "noise", angleId: "ang-asp-lifestyle", performance: { ctr: 5.18, impressions: 201_447 } },
  { id: "hook-5", text: "Sleep that earns its place in your day.", brandId: "sleepyhead", angleId: "ang-asp-lifestyle", performance: { ctr: 1.94, impressions: 28_660 } },
  { id: "hook-6", text: "Tested 3 smartwatches. This one stayed.", brandId: "noise", angleId: "ang-comparison", performance: { ctr: 4.42, impressions: 117_890 } },
  { id: "hook-7", text: "Made for the back you don't think about anymore.", brandId: "sleepyhead", angleId: "ang-asp-lifestyle" },
  { id: "hook-8", text: "5 founders. 11 brands. ₹2,499 starter kit.", brandId: "mensa-brands", angleId: "ang-bundle" },
];

export const concepts: Concept[] = [
  {
    id: "concept-mamaearth-asp-haircare",
    name: "Aspirational hair journey",
    brandId: "mamaearth",
    angle: "Aspirational lifestyle",
    hook: "Hair fall is real. This is not.",
    tone: "Premium, mom-friendly",
    format: "4:5 static",
    visualDirection: "Soft daylight bathroom · woman 30-40 · long shiny hair · golden-hour palette",
    generationCount: 24,
  },
  {
    id: "concept-noise-perf-comparison",
    name: "ColorFit Pro 5 vs the field",
    brandId: "noise",
    angle: "Comparison",
    hook: "Tested 3 smartwatches. This one stayed.",
    tone: "Sharp, performance-led",
    format: "9:16 video",
    visualDirection: "30s reel · 3 watches lined up · third one zoom · aggressive cuts on beat",
    generationCount: 18,
  },
  {
    id: "concept-boat-fomo-budget",
    name: "Lowest ever — 161 buds",
    brandId: "boat",
    angle: "FOMO",
    hook: "Stop scrolling if you've ever had AirPods died at 6pm.",
    tone: "Bold, energetic",
    format: "1:1 static",
    visualDirection: "Close-up earbud · battery icon · fast-charge motion lines",
    generationCount: 31,
  },
  {
    id: "concept-sleepyhead-premium-calm",
    name: "Premium calm, ₹17,999 mattress",
    brandId: "sleepyhead",
    angle: "Aspirational lifestyle",
    hook: "Sleep that earns its place in your day.",
    tone: "Calm, design-led",
    format: "16:9 static",
    visualDirection: "Soft morning light · linen bedding · neutral palette · empty room",
    generationCount: 6,
  },
];

export const avatars: Avatar[] = [
  { id: "ava-priya", name: "Priya", demographic: "F · 28-34 · South Asian", language: ["en-IN", "hi-IN"] },
  { id: "ava-aarav", name: "Aarav", demographic: "M · 25-31 · South Asian", language: ["en-IN", "hi-IN"] },
  { id: "ava-naina", name: "Naina", demographic: "F · 21-26 · South Asian", language: ["en-IN", "hi-IN"] },
  { id: "ava-rohan", name: "Rohan", demographic: "M · 30-38 · Pan-Asian", language: ["en-IN", "en-US"] },
  { id: "ava-zara", name: "Zara", demographic: "F · 32-38 · MENA", language: ["en-US", "ar"] },
  { id: "ava-emily", name: "Emily", demographic: "F · 24-30 · Caucasian", language: ["en-US", "en-GB"] },
  { id: "ava-marcus", name: "Marcus", demographic: "M · 28-34 · African-American", language: ["en-US"] },
  { id: "ava-yuki", name: "Yuki", demographic: "F · 26-32 · East Asian", language: ["ja", "en-US"] },
];

export const voices: Voice[] = [
  { id: "voice-priya-warm", name: "Priya — Warm Hindi", language: "hi-IN", description: "Warm, motherly, conversational. Best for haircare/skincare." },
  { id: "voice-aarav-energetic", name: "Aarav — Energetic Hinglish", language: "en-IN", description: "Sharp Gen Z, energetic. Best for tech/wearables." },
  { id: "voice-naina-confidente", name: "Naina — Confident Hinglish", language: "en-IN", description: "Direct, confident, no-nonsense. Best for ratio products." },
  { id: "voice-emily-calm", name: "Emily — Calm US English", language: "en-US", description: "Premium, calm, design-led. Best for mattress/wellness." },
  { id: "voice-marcus-bold", name: "Marcus — Bold US English", language: "en-US", description: "Bold, confident, performance copy. Best for tech." },
  { id: "voice-yuki-bright", name: "Yuki — Bright Japanese", language: "ja", description: "Bright, polite, optimistic. Best for global expansion." },
];
