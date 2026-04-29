/**
 * Demo / Prototype Mode
 * Set DEMO_MODE = true to bypass real AI calls and use fake data instead.
 * All records still persist to the database for full history/retry support.
 */

export const DEMO_MODE = true;

/* ------------------------------------------------------------------ */
/*  Fake delay                                                         */
/* ------------------------------------------------------------------ */
export function fakeSleep(minMs = 1500, maxMs = 4000): Promise<void> {
  const ms = minMs + Math.random() * (maxMs - minMs);
  return new Promise((r) => setTimeout(r, ms));
}

/* ------------------------------------------------------------------ */
/*  Fake image URLs (Picsum — deterministic via seed)                   */
/* ------------------------------------------------------------------ */
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function aspectToDims(aspect?: string): [number, number] {
  switch (aspect) {
    case "1:1": return [1024, 1024];
    case "4:5": return [1024, 1280];
    case "9:16": return [720, 1280];
    case "16:9": return [1280, 720];
    case "4:3": return [1024, 768];
    case "3:4": return [768, 1024];
    default: return [1024, 1024];
  }
}

export function fakeImageUrl(prompt: string, aspect?: string): string {
  const seed = hashCode(prompt + Date.now().toString()).toString(36);
  const [w, h] = aspectToDims(aspect);
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}

export function fakeEditedImageUrl(): string {
  const seed = Math.random().toString(36).slice(2, 10);
  return `https://picsum.photos/seed/${seed}/1024/1024`;
}

/* ------------------------------------------------------------------ */
/*  Fake chat responses                                                */
/* ------------------------------------------------------------------ */
const CHAT_RESPONSES: Record<string, string[]> = {
  audience: [
    "Based on your current campaign data, I'd recommend targeting 25–44 year olds with interests in fitness and wellness. Your top-performing segments show 3.2x higher CTR in this demographic. Consider splitting ad sets by gender for even more granular optimization.",
    "Looking at your audience insights, there's an untapped opportunity in the 35–54 age bracket. Competitors in your vertical are under-indexing here, which means lower CPMs. I'd suggest creating a dedicated campaign with messaging tailored to this group's pain points.",
  ],
  copy: [
    "Here are a few high-converting headline variations:\n\n1. **\"Transform Your Results in 30 Days\"** — urgency + outcome\n2. **\"The Secret Top Brands Don't Share\"** — curiosity gap\n3. **\"Finally, a Solution That Actually Works\"** — frustration relief\n\nI'd A/B test #1 vs #3 first since they target different emotional triggers.",
    "Your current primary text is solid but could benefit from a stronger hook. Try leading with a statistic or question instead of a statement. For example:\n\n*\"Did you know 73% of marketers waste budget on audiences that will never convert?\"*\n\nThis creates an immediate knowledge gap that drives engagement.",
  ],
  creative: [
    "For your creative strategy, I'd recommend a 3-tier testing framework:\n\n• **Tier 1 (Volume):** 5–8 static images with varied backgrounds and CTAs\n• **Tier 2 (Engagement):** 2–3 short-form videos (6–15s) showcasing product benefits\n• **Tier 3 (Conversion):** 1–2 carousel ads with social proof elements\n\nStart with Tier 1 for broad testing, then allocate more budget to winning concepts.",
    "Your image ads are performing well, but I notice video content is significantly outperforming statics in your vertical (2.1x higher ROAS). Consider repurposing your top 3 static creatives into simple motion graphics with text overlays — this often bridges the performance gap without full video production.",
  ],
  budget: [
    "Based on your current ROAS targets, I'd recommend the following budget allocation:\n\n• **Prospecting:** 60% ($3,000/day) — focus on lookalike audiences\n• **Retargeting:** 25% ($1,250/day) — website visitors + cart abandoners\n• **Retention:** 15% ($750/day) — existing customer upsell\n\nYour CPA is currently $18.50; with this split, I project we can bring it down to ~$14.20 within 2 weeks.",
    "I've analyzed your spending patterns and found that your campaigns are most cost-effective between Tuesday and Thursday. Consider implementing dayparting to shift 20% of weekend budget to midweek. This alone could improve your ROAS by 15–20% based on historical performance data.",
  ],
  default: [
    "Great question! Let me break this down for you.\n\nYour campaign performance has been trending upward over the past 2 weeks, with a 12% improvement in CTR and 8% reduction in CPA. The main drivers are:\n\n1. **Better creative rotation** — your new ad variants are outperforming legacy ones by 2.3x\n2. **Audience refinement** — the lookalike audiences built from purchasers are delivering strong results\n3. **Bid optimization** — the automated bidding strategy is finding more efficient placements\n\nI'd recommend scaling the top 3 ad sets by 20% and pausing the bottom 2.",
    "I've reviewed your account structure and have a few recommendations:\n\n• Your campaign naming convention could be more consistent — this will help with reporting at scale\n• There are 3 ad sets with overlapping audiences causing self-competition\n• Your attribution window might be too short; consider testing a 7-day click, 1-day view model\n\nWould you like me to elaborate on any of these points?",
    "Here's a quick health check of your ad account:\n\n✅ **Budget utilization:** 94% (healthy)\n✅ **Learning phase:** 2/8 ad sets still in learning\n⚠️ **Creative fatigue:** 3 ads showing frequency > 4.0\n❌ **Rejected ads:** 1 ad flagged for policy review\n\nThe most impactful action right now would be refreshing the 3 fatigued creatives. I can help generate new variations if you'd like.",
    "Looking at your competitive landscape, your CPMs are 15% below the industry average, which is excellent. However, your conversion rate could use improvement.\n\nHere are three quick wins:\n1. Add social proof elements to your landing pages\n2. Implement urgency in your ad copy (limited time offers)\n3. Test shorter form content — under 15 seconds for video\n\nShall I draft some copy variations incorporating these strategies?",
  ],
};

export function fakeChatResponse(prompt: string): string {
  const lower = prompt.toLowerCase();
  let pool: string[] = CHAT_RESPONSES.default;

  if (lower.includes("audience") || lower.includes("target") || lower.includes("demographic")) {
    pool = CHAT_RESPONSES.audience;
  } else if (lower.includes("copy") || lower.includes("headline") || lower.includes("text") || lower.includes("write")) {
    pool = CHAT_RESPONSES.copy;
  } else if (lower.includes("creative") || lower.includes("image") || lower.includes("video") || lower.includes("design")) {
    pool = CHAT_RESPONSES.creative;
  } else if (lower.includes("budget") || lower.includes("spend") || lower.includes("cost") || lower.includes("roas")) {
    pool = CHAT_RESPONSES.budget;
  }

  return pool[Math.floor(Math.random() * pool.length)];
}
