/**
 * Industry Insights — Trends mock data.
 *
 * All values are hardcoded (mock-first, per project rules — no Supabase, no
 * new tables). Content is carried over from the reference prototype's
 * js/data/mockData.js, restructured to match ../types.ts and corrected
 * against the doc-mandated guardrails:
 *
 *  - bs-2 / meta-1 were the same Nike ad under two ids in the source. The
 *    breaking-story slot now carries a different story (Patagonia) so
 *    BREAKING_STORIES and META_ADS don't silently duplicate content.
 *  - meta's `industry` (string) and tiktok's `category` (string) are both
 *    normalised to `industries: string[]`.
 *  - `bodyHtml` raw HTML becomes structured `bodyBlocks` — no
 *    dangerouslySetInnerHTML anywhere downstream.
 *  - `confidence.score` (a 0-100 number) becomes { level, evidenceCount,
 *    evidenceType, refreshedAt }. No numeric confidence score anywhere.
 *  - google_trend `changePercent`/`direction` become `interestIndex`
 *    (0-100) + `region` + `timeframe`. sd-3 ("wireless earbuds under $50")
 *    had a declining term whose sparkline actually rose at the end in the
 *    source — fixed here so a declining term's series actually declines.
 *  - `testWindow` prose is split into a short bounded `testWindow` label
 *    and a separate `testWindowRationale`.
 *  - Every item has a fully populated `intelligence` block with at least 2
 *    evidence entries across varied ClaimLevels. Where the source item had
 *    no real evidence behind its score (several news/social items had a
 *    bare score + freshness and nothing else), confidence is marked
 *    'low' or 'insufficient' and says so, rather than inventing confident
 *    prose backing it.
 */

import type { TrendItem } from "../types";

// ═══════════════════════════════════════════════════════════════════════
// BREAKING STORIES — 5 items, mixed source types
// ═══════════════════════════════════════════════════════════════════════

export const BREAKING_STORIES: TrendItem[] = [
  {
    id: "bs-1",
    type: "news",
    title: "Meta's Advantage+ Suite Surpasses $10B in Managed Ad Spend",
    excerpt:
      "Meta announced that its AI-powered Advantage+ campaign suite has now surpassed $10 billion in managed annual ad spend, marking a milestone for automated advertising.",
    thumbnail: "https://picsum.photos/seed/bs1tech/800/450",
    publishedAt: "2026-08-11",
    industries: ["E-commerce", "Performance Marketing"],
    topics: ["Meta", "Advantage+", "AI Advertising", "Performance"],
    source: "TechCrunch",
    readTime: "5 min read",
    bodyBlocks: [
      {
        kind: "p",
        text: "Meta's Advantage+ advertising suite — which uses machine learning to automate audience targeting, creative selection, and bid management — has crossed the $10 billion mark in managed annual ad spend as of Q2 2026, the company disclosed in a briefing with select media partners.",
      },
      {
        kind: "h3",
        text: "What's driving adoption",
      },
      {
        kind: "p",
        text: "Advertisers using Advantage+ Shopping Campaigns report a meaningful reduction in cost-per-acquisition compared to manually managed campaigns, and the system now recommends creative from a pool of up to 150 variations per campaign, dynamically serving whichever combination the model predicts will convert for each viewer.",
      },
    ],
    intelligence: {
      trendStage: "growing",
      testWindow: "Next 30 days",
      testWindowRationale:
        "Category competitors adopting Advantage+ early may lock in algorithm advantage; the risk compounds the longer adoption is delayed.",
      confidence: {
        level: "high",
        evidenceCount: 5,
        evidenceType: "Meta briefing + 3 independent measurement firms + adoption-rate modeling",
        refreshedAt: "2026-08-11T10:00:00Z",
      },
      adaptationRisk: {
        level: "low",
        reason:
          "This is a platform-level shift — adoption risk is structural, not creative, and applies uniformly to all advertisers on the platform.",
      },
      bestFit: "Any DTC or e-commerce advertiser spending $10K+/mo on Meta.",
      opportunityRead: "opportunity",
      opportunityNote:
        "Adoption is still uneven — advertisers uploading 20+ creative variants are already seeing outsized gains, while most competitors upload only 3-5.",
      creativeWhitespace:
        "Most advertisers upload 3–5 creative variants; those uploading 20+ are seeing outsized model optimization benefits.",
      suggestedFirstTest:
        "Migrate one mid-performing campaign to Advantage+ Shopping with 12+ creative assets. Measure CPA vs. manual baseline over 14 days.",
      whatNotToCopy:
        "Do not apply Advantage+ to brand-awareness campaigns — the model optimizes for conversion signals, not reach.",
      evidence: [
        { level: "observed", text: "Meta confirmed the $10B AMS milestone in a July 31 media briefing — primary source." },
        { level: "corroborated", text: "Northbeam, Triple Whale, and MeasureMatch independently report positive CPA movement for Advantage+ adopters in Q2 2026." },
        { level: "inferred", text: "Adoption rate suggests category saturation could occur within 3-4 months for fashion/beauty segments." },
        { level: "suggested", text: "Prioritize product-centric video assets — the model appears to weight video higher than still images for purchase events." },
        { level: "forecast", text: "Expect Advantage+ to become the default campaign type for 60%+ of Meta ad spend by Q1 2027." },
      ],
    },
  },
  {
    id: "bs-2",
    type: "meta",
    title: 'Patagonia "Worn Wear" Trade-In Push',
    excerpt:
      "Patagonia is running a trade-in-focused carousel campaign that leads with used-gear resale rather than new product — an unusual sequencing choice for paid social.",
    thumbnail: "https://picsum.photos/seed/bs2patagonia/500/700",
    publishedAt: "2026-08-04",
    industries: ["Apparel", "Sustainability"],
    topics: ["Patagonia", "Resale", "Sustainability", "Trade-In"],
    advertiser: "Patagonia",
    isActive: true,
    activeDays: 9,
    platforms: ["Facebook", "Instagram"],
    format: "Carousel (4 cards)",
    headline: "Trade It In. Wear It Again.",
    ctaText: "Start a Trade-In",
    bodyBlocks: [
      {
        kind: "p",
        text: 'Patagonia\'s current carousel campaign for its "Worn Wear" resale program uses real customer-submitted photos of used gear rather than studio photography. Three of the four cards lead with a worn item; only the final card shows a new product.',
      },
      {
        kind: "h3",
        text: "Why it's worth watching",
      },
      {
        kind: "p",
        text: "Opening a paid carousel on a used product rather than a new one is a structural choice, not just a sustainability message — it trades an immediate sell for trust-building, a sequencing pattern almost no other apparel advertiser is currently running on Meta.",
      },
    ],
    intelligence: {
      trendStage: "emerging",
      testWindow: "Next 10-15 days",
      testWindowRationale:
        "Resale-led paid creative is still rare enough on Meta that early movers in adjacent categories can differentiate before the angle becomes common.",
      confidence: {
        level: "medium",
        evidenceCount: 3,
        evidenceType: "Meta Ad Library confirmation + category cross-check",
        refreshedAt: "2026-08-12T09:00:00Z",
      },
      adaptationRisk: {
        level: "medium",
        reason:
          "Leading with resale only works credibly for brands with an actual take-back or resale program already in place — borrowing the angle without one reads as greenwashing.",
      },
      bestFit: "Apparel or outdoor brands with an existing resale, repair, or trade-in program.",
      opportunityRead: "opportunity",
      opportunityNote:
        "No other outdoor or apparel advertiser is currently leading a Meta carousel with resale-first creative — the structural angle itself is the differentiator, not the product.",
      creativeWhitespace:
        "Nearly every apparel ad opens on new product. Opening on a used, worn item and delaying the new-product card to the end is unused outside this one campaign.",
      suggestedFirstTest:
        "If you already run a trade-in or repair program, build a 3-card carousel leading with a real customer's used item before showing anything new.",
      whatNotToCopy: "Do not copy the resale-first structure without a real program behind it — audiences check.",
      evidence: [
        { level: "observed", text: "Ad confirmed active in Meta Ad Library, running 9 days across Facebook and Instagram." },
        { level: "observed", text: "All 4 carousel cards reviewed directly — 3 of 4 lead with used-gear photography, only the last shows new product." },
        { level: "inferred", text: "Card sequencing (used-first) suggests a deliberate trust-building test, though click-through performance is not publicly available." },
      ],
    },
  },
  {
    id: "bs-3",
    type: "tiktok",
    title: '"Slow-Motion Unboxing" Hook Format Spreading Fast',
    excerpt:
      "A slow-motion unboxing hook pioneered by @unboxingwithkay has spawned thousands of duets and stitches in a week, spreading into branded content across fashion, beauty, and electronics.",
    thumbnail: "https://picsum.photos/seed/bs3tt/420/700",
    publishedAt: "2026-08-07",
    industries: ["Fashion", "Beauty", "Consumer Electronics"],
    topics: ["TikTok", "Unboxing", "Hook Format"],
    hook: "This box just arrived and I need you to see what's inside… (slow everything down)",
    creator: "@unboxingwithkay",
    followerCount: "2.1M",
    duration: "0:48",
    stats: { views: "8.4M", likes: "1.2M", shares: "91K" },
    bodyBlocks: [
      {
        kind: "p",
        text: "The hook builds anticipation through deliberate pacing during the unwrapping moment, rather than the fast-cut style that has dominated unboxing content for the past 18 months, creating an ASMR-adjacent sensory response.",
      },
      {
        kind: "p",
        text: "Brands adopting the format early include a mid-tier jewelry DTC label and two accessories brands. None are yet household names, which suggests the differentiation window remains open.",
      },
    ],
    intelligence: {
      trendStage: "emerging",
      testWindow: "Next 5-8 days",
      testWindowRationale:
        "Organic duet/stitch volume is climbing quickly; branded adoption typically compresses the differentiation window to under two weeks once a hook crosses into multiple verticals.",
      confidence: {
        level: "medium",
        evidenceCount: 5,
        evidenceType: "TikTok Creative Center trend data + engagement-ratio benchmarking",
        refreshedAt: "2026-08-07T12:00:00Z",
      },
      adaptationRisk: {
        level: "low",
        reason:
          "Format is pacing-based, not brand-specific — it adapts across most physical product categories without needing a specific aesthetic.",
      },
      bestFit: "Any brand selling physical products with premium or giftable positioning — jewelry, fashion, skincare, electronics accessories.",
      opportunityRead: "opportunity",
      opportunityNote:
        "Only a handful of mid-tier brands have adopted the format so far, and none are household names yet — the differentiation window is still open for early movers.",
      creativeWhitespace: "Every current execution uses music. Silent or ASMR-only audio is completely unexplored in this format.",
      suggestedFirstTest:
        "Shoot a 30-second slow-motion unboxing of your hero product with the same sound. Run as a Spark Ad with creator usage rights. Measure completion rate vs. your standard product demo.",
      whatNotToCopy:
        'Do not copy the "I need you to see this" caption style — it already appears on 200+ accounts. Develop your own verbal hook.',
      evidence: [
        { level: "observed", text: "4,100+ duets/stitches of the original video confirmed via TikTok Creative Center as of Aug 6, 2026." },
        { level: "observed", text: "8.4M views and 91K shares on the original, with no paid amplification detected." },
        { level: "corroborated", text: "Spike visible in both TikTok Creative Center trend data and Sprout Social's trending-sounds tracker." },
        { level: "inferred", text: "Like-to-view ratio benchmarking suggests a 65-75% completion rate — actual platform data is not publicly available." },
        { level: "forecast", text: "Format likely reaches brand-content saturation within 10-14 days; the organic differentiation window is shorter than that." },
      ],
    },
  },
  {
    id: "bs-4",
    type: "report",
    title: "Forrester: State of Performance Marketing 2026",
    excerpt:
      "Forrester's annual report finds AI-automated bidding now manages 61% of digital ad budgets in North America, and brands with cross-platform identity resolution outperform peers 2.1x on ROAS.",
    thumbnail: "https://picsum.photos/seed/bs4rep/800/450",
    publishedAt: "2026-08-05",
    industries: ["Performance Marketing", "Marketing Technology"],
    topics: ["Report", "Performance Marketing", "AI", "ROAS"],
    source: "Forrester Research",
    readTime: "9 min read",
    bodyBlocks: [
      {
        kind: "p",
        text: "Forrester Research's State of Performance Marketing 2026 is the most detailed primary-research look at how brands are allocating digital advertising budgets this year. The headline finding: AI-automated bidding now manages 61% of digital ad spend in North America, up from 44% in 2025.",
      },
      {
        kind: "h3",
        text: "Key findings",
      },
      {
        kind: "p",
        text: "Brands with a functioning cross-platform identity resolution layer outperform peers by 2.1x on ROAS, with the gap widest in the 35-55 age demographic. Separately, 68% of respondents said they would invest more in creative testing if they had more time or resources — and among brands that test 10+ creative variants per campaign, median ROAS is 1.8x higher.",
      },
    ],
    intelligence: {
      trendStage: "growing",
      testWindow: "No reliable window yet",
      testWindowRationale:
        "This describes a structural, multi-year market shift rather than a short-lived creative trend — a bounded test window does not apply.",
      confidence: {
        level: "high",
        evidenceCount: 5,
        evidenceType: "Primary survey (N=412) + cross-referenced third-party research",
        refreshedAt: "2026-08-05T08:00:00Z",
      },
      adaptationRisk: {
        level: "low",
        reason: "Primary research from a tier-1 analyst firm with a disclosed methodology — low interpretation risk.",
      },
      bestFit: "Marketing leaders and growth teams making budget allocation or technology investment decisions.",
      opportunityRead: "opportunity",
      opportunityNote:
        "Forrester identifies a specific gap: mid-market brands ($1M-$5M annual spend) have largely not adopted cross-platform identity resolution yet, leaving a first-mover window.",
      creativeWhitespace:
        "Mid-market brands with $1M–$5M annual ad spend are largely absent from cross-platform identity adoption — a clear gap versus enterprise advertisers.",
      suggestedFirstTest:
        "Audit your current attribution setup against Forrester's identity-readiness checklist. Identify your top 2 data gaps before committing budget.",
      whatNotToCopy:
        "Do not read AI-bidding adoption rate as proof of performance — adoption rate and marginal returns are not the same curve, and the latter is flattening.",
      evidence: [
        { level: "observed", text: "Forrester surveyed 412 performance-marketing decision-makers at brands with $10M+ annual revenue, conducted Q1 2026." },
        { level: "corroborated", text: "The 2.1x ROAS lift for cross-platform identity adopters aligns with similar findings in Nielsen's 2026 Annual Marketing Report." },
        { level: "inferred", text: 'The 68% of respondents who "would invest more in creative testing" implies systematic under-testing industry-wide.' },
        { level: "suggested", text: "Use this data point in internal budget conversations as third-party validation for increased creative production investment." },
        { level: "forecast", text: "Forrester's modeled projection expects AI-automated bidding to manage 75%+ of North American digital ad spend by 2028." },
      ],
    },
  },
  {
    id: "bs-5",
    type: "news",
    title: "Google Integrates AI Overviews Directly Into Shopping Ad Results",
    excerpt:
      "Google has begun rolling out AI-generated product summaries within Shopping ad placements, surfacing comparative product data alongside individual brand ads.",
    thumbnail: "https://picsum.photos/seed/bs5goog/800/450",
    publishedAt: "2026-08-10",
    industries: ["E-commerce", "Search Advertising"],
    topics: ["Google", "Shopping Ads", "AI Overviews", "Search"],
    source: "Search Engine Land",
    readTime: "4 min read",
    bodyBlocks: [
      {
        kind: "p",
        text: "Google has begun a limited rollout of AI Overviews within Shopping ad placements, surfacing AI-generated product comparison summaries directly adjacent to brand-paid Shopping ads for high-consideration product categories.",
      },
      {
        kind: "p",
        text: "Google's model draws from product feed data, reviews, and crawled site content to generate the summaries. Brands with richer, more structured product data appear to receive more favorable AI summary treatment.",
      },
    ],
    intelligence: {
      trendStage: "emerging",
      testWindow: "Next 30 days",
      testWindowRationale:
        "Rollout is still limited (~15% of US impressions); the window is for monitoring expansion and starting product-feed prep, not an urgent creative test.",
      confidence: {
        level: "medium",
        evidenceCount: 3,
        evidenceType: "Multi-outlet + independent-researcher confirmation, no official Google data yet",
        refreshedAt: "2026-08-10T15:00:00Z",
      },
      adaptationRisk: {
        level: "medium",
        reason: "Google's AI summary content is not directly controllable by advertisers — positioning risk is real even with a well-optimized feed.",
      },
      bestFit: "E-commerce brands running Google Shopping campaigns with $5K+/mo spend.",
      opportunityRead: "unclear",
      opportunityNote:
        "It is too early to tell whether richer product feeds reliably earn better AI-summary placement — the correlation is observed but not yet confirmed by Google.",
      creativeWhitespace:
        'No brand has publicly claimed a "Shopping AI-ready" product-feed strategy yet — an open positioning angle for a feed-optimization vendor or in-house team.',
      suggestedFirstTest:
        "Audit your top 20 Shopping SKUs for title length, description completeness, and review count. Compare against competitors who appear in AI summaries for your key queries.",
      whatNotToCopy: "Do not keyword-stuff product titles to try to influence AI summaries — practitioners report this backfires.",
      evidence: [
        { level: "observed", text: "AI Overviews in Shopping placements confirmed by Search Engine Land and multiple independent SEO practitioners on July 30, 2026." },
        { level: "corroborated", text: "Seen across electronics, home goods, and apparel category pages by independent researchers in 5 US states." },
        { level: "inferred", text: "Brands with 500+ reviews and structured product attributes appear to surface more often in summary panels — correlation, not a confirmed ranking factor." },
      ],
    },
  },
];

// ═══════════════════════════════════════════════════════════════════════
// META ADS — 5 items
// ═══════════════════════════════════════════════════════════════════════

export const META_ADS: TrendItem[] = [
  {
    id: "meta-1",
    type: "meta",
    title: 'Nike Air Max "Move Louder"',
    excerpt:
      "Nike's Move Louder campaign uses bold color-block visuals with zero on-screen text in the first 3 seconds, cutting between 6 athletes in distinct Air Max colorways.",
    thumbnail: "https://picsum.photos/seed/meta1nik/500/700",
    publishedAt: "2026-08-01",
    industries: ["Sportswear", "Footwear"],
    topics: ["Nike", "Video Ad", "Color Block"],
    advertiser: "Nike",
    isActive: true,
    activeDays: 12,
    platforms: ["Facebook", "Instagram"],
    format: "Video (15s)",
    headline: "Move Louder This Summer",
    ctaText: "Shop Now",
    metric1: "Est. reach: 18M-52M",
    bodyBlocks: [
      {
        kind: "p",
        text: "Nike's Move Louder campaign for the Air Max line runs across Facebook and Instagram feeds, Stories, and Reels placements. The 15-second hero asset cuts between 6 distinct athletes in urban settings, each in a different colorway of the new Air Max, with no on-screen text in the opening 3 seconds.",
      },
    ],
    intelligence: {
      trendStage: "peaking",
      testWindow: "Next 5 days or fewer",
      testWindowRationale:
        "The no-text-first-3-seconds structure is already present in 6 of the top 10 footwear ads this month; the differentiated-entry window is nearly closed.",
      confidence: {
        level: "medium",
        evidenceCount: 2,
        evidenceType: "Meta Ad Library confirmation + category cross-check (2 sources)",
        refreshedAt: "2026-08-07T14:00:00Z",
      },
      adaptationRisk: {
        level: "medium",
        reason: "The color-block aesthetic is Nike-specific; direct imitation reads as derivative for other brands.",
      },
      bestFit: "Footwear / sportswear brands with strong visual brand identity and video production resources.",
      opportunityRead: "unclear",
      opportunityNote:
        "The visual treatment is saturating, but the underlying structural choice — delaying the product reveal — is still rare outside major sportswear brands.",
      creativeWhitespace: "Delayed product reveal (athlete-first, product later) is underused outside major sportswear brands.",
      suggestedFirstTest: "Test a 6s clip opening on movement, revealing product at second 3. No text. Single colorway focus.",
      whatNotToCopy: "Do not copy the color-block visual treatment — take the delayed-reveal structure instead.",
      evidence: [
        { level: "observed", text: "Confirmed active in Meta Ad Library. Running 12 days as of this report." },
        { level: "corroborated", text: "No-text-first-3-seconds approach seen in 6 of the top 10 footwear ads this month." },
      ],
    },
  },
  {
    id: "meta-2",
    type: "meta",
    title: 'Levi\'s Denim "Yours Since 1873"',
    excerpt:
      "Levi's heritage campaign uses a 5-card carousel to showcase denim fits across body types, leaning on brand archive year rather than product specs.",
    thumbnail: "https://picsum.photos/seed/meta2lev/500/700",
    publishedAt: "2026-07-16",
    industries: ["Denim", "Apparel"],
    topics: ["Levi's", "Heritage", "Carousel"],
    advertiser: "Levi's",
    isActive: true,
    activeDays: 28,
    platforms: ["Facebook", "Instagram", "Audience Network"],
    format: "Carousel (5 cards)",
    headline: "Find Your Fit. Yours Since 1873.",
    ctaText: "See All Styles",
    metric1: "Est. reach: 12M-38M",
    bodyBlocks: [
      {
        kind: "p",
        text: "Levi's heritage-positioning campaign uses a 5-card carousel to showcase different denim fits across multiple body types. The copy leans on archive year (1873) — a nostalgia approach increasingly common in premium apparel.",
      },
    ],
    intelligence: {
      trendStage: "growing",
      testWindow: "Next 60+ days",
      testWindowRationale: "Heritage positioning is a brand-narrative play, not a fast-moving creative trend — the test window is inherently longer.",
      confidence: {
        level: "insufficient",
        evidenceCount: 2,
        evidenceType: "Meta Ad Library duration only — no independent corroboration available",
        refreshedAt: "2026-08-13T09:00:00Z",
      },
      adaptationRisk: { level: "low", reason: "Heritage narrative is adaptable to any brand with 5+ years of history." },
      bestFit: "Apparel or lifestyle brands with a founder story or brand history to draw from.",
      opportunityRead: "unclear",
      opportunityNote:
        "Long ad longevity is a decent signal but not proof of performance — this reading rests on one inferred signal, not confirmed results, so treat it as a lead worth testing rather than a validated play.",
      creativeWhitespace: "Most heritage campaigns lead with founding year. Few use a specific historical moment or customer milestone as the hook.",
      suggestedFirstTest:
        "Build a 3-card carousel: card 1 = brand origin story, card 2 = product, card 3 = modern-day customer. Compare against a product-only carousel.",
      whatNotToCopy: 'Do not copy the "Years Since" phrasing if your brand is under 5 years old — it reads as inauthentic.',
      evidence: [
        { level: "observed", text: "Active in Meta Ad Library for 28 days. Carousel format confirmed directly." },
        { level: "inferred", text: "28-day longevity suggests reasonable performance, since low-performing ads are typically pulled within 10-14 days — but this is an inference, not a confirmed metric." },
      ],
    },
  },
  {
    id: "meta-3",
    type: "meta",
    title: 'Glossier "Skin First. Always."',
    excerpt:
      "Glossier strips back to a single-image format with extreme close-up skin-texture photography and a 4-word brand philosophy as copy.",
    thumbnail: "https://picsum.photos/seed/meta3glos/500/700",
    publishedAt: "2026-08-07",
    industries: ["Beauty", "Skincare"],
    topics: ["Glossier", "Beauty", "Minimal Copy"],
    advertiser: "Glossier",
    isActive: true,
    activeDays: 6,
    platforms: ["Instagram", "Facebook"],
    format: "Single Image",
    headline: "Skin First. Makeup Second.",
    ctaText: "Shop Balm Dotcom",
    metric1: "Est. reach: 4M-14M",
    bodyBlocks: [
      {
        kind: "p",
        text: "Glossier's latest campaign strips back to a single-image format with extreme close-up skin-texture photography. The copy is minimal — a 4-word brand philosophy. The approach mirrors the skin-positive aesthetic dominating organic beauty content.",
      },
    ],
    intelligence: {
      trendStage: "emerging",
      testWindow: "Next 10-18 days",
      testWindowRationale:
        "The close-up skin-texture aesthetic is trending organically; a differentiated paid entry likely has 10-18 days before it becomes the beauty-category default.",
      confidence: {
        level: "low",
        evidenceCount: 4,
        evidenceType: "Ad Library confirmation + organic hashtag volume cross-check",
        refreshedAt: "2026-08-07T18:00:00Z",
      },
      adaptationRisk: { level: "low", reason: "Close-up texture photography is a universal beauty format, not brand-locked." },
      bestFit: "Beauty, skincare, and personal-care DTC brands targeting female-skewing 18-35 audiences.",
      opportunityRead: "opportunity",
      opportunityNote: "Male-skewing and gender-neutral skincare brands have not adopted this aesthetic yet, leaving clear differentiation room.",
      creativeWhitespace: "Male-skewing or gender-neutral skincare brands have not adopted this aesthetic yet — high differentiation potential.",
      suggestedFirstTest:
        "Shoot 3 extreme close-up product-on-skin images with under 6 words of copy. A/B test against your current lifestyle photography.",
      whatNotToCopy: "Do not copy Glossier's specific copy tone — their community expects it. Develop your own brand philosophy line.",
      evidence: [
        { level: "observed", text: "Ad active 6 days. Single-image format, Instagram and Facebook placements confirmed." },
        { level: "corroborated", text: "Close-up texture aesthetic is trending organically on Instagram under skincare-related tags this week." },
        { level: "inferred", text: "A 6-day run for a new Glossier ad suggests early-stage testing rather than a proven scale-up." },
        { level: "forecast", text: "This format is likely to appear in a meaningfully larger share of beauty-brand ads within 6 weeks if organic momentum holds." },
      ],
    },
  },
  {
    id: "meta-4",
    type: "meta",
    title: 'SKIMS "Move More. Worry Less."',
    excerpt:
      "SKIMS' activewear campaign uses real-movement footage — running, yoga, everyday tasks — to reposition the brand beyond shapewear.",
    thumbnail: "https://picsum.photos/seed/meta4skim/500/700",
    publishedAt: "2026-07-26",
    industries: ["Shapewear", "Activewear"],
    topics: ["SKIMS", "Activewear", "Real Movement"],
    advertiser: "SKIMS",
    isActive: true,
    activeDays: 18,
    platforms: ["Instagram", "Facebook", "Messenger"],
    format: "Video (30s)",
    headline: "Move More. Worry Less.",
    ctaText: "Shop Active",
    metric1: "Est. reach: 22M-65M",
    bodyBlocks: [
      {
        kind: "p",
        text: "SKIMS' activewear campaign mixes lifestyle moments with product close-ups, using real-movement footage rather than posed shots. The 30-second video runs on a large estimated reach, indicating significant budget behind it.",
      },
    ],
    intelligence: {
      trendStage: "growing",
      testWindow: "Next 3-4 weeks",
      testWindowRationale: "The real-movement aesthetic is accelerating but not yet peaked — a 3-4 week window before category adoption catches up.",
      confidence: {
        level: "high",
        evidenceCount: 4,
        evidenceType: "Ad Library confirmation + cross-brand pattern check (Lululemon, Gymshark, Alo)",
        refreshedAt: "2026-08-08T10:00:00Z",
      },
      adaptationRisk: { level: "medium", reason: "Real-movement content requires authentic footage — stock video reads poorly in this format." },
      bestFit: "Activewear, athleisure, or functional apparel brands with access to authentic movement footage.",
      opportunityRead: "opportunity",
      opportunityNote: "SKIMS' version targets women specifically; men's activewear brands running this same real-movement treatment are still rare.",
      creativeWhitespace: "SKIMS focuses on women. Men's activewear brands running real-movement content in this format is rare.",
      suggestedFirstTest: "Edit a 15s version from existing BTS or UGC footage showing product in motion. Compare against static lifestyle imagery.",
      whatNotToCopy: "Do not use slow motion for this format — real-speed movement is the visual signal that reads as authentic.",
      evidence: [
        { level: "observed", text: "18-day run confirmed. Estimated reach of 22M-65M signals a high-investment placement." },
        { level: "corroborated", text: 'The "real movement" aesthetic is trending simultaneously across Lululemon, Gymshark, and Alo Yoga creative.' },
        { level: "inferred", text: "The high reach estimate suggests automated audience-expansion targeting rather than a narrow manual audience." },
        { level: "forecast", text: "This format is likely to become the dominant activewear creative approach by Q4 2026 if the current adoption pace holds." },
      ],
    },
  },
  {
    id: "meta-5",
    type: "meta",
    title: 'Apple Watch Ultra 3 "Built for What Comes Next"',
    excerpt:
      "Apple's Watch Ultra 3 launch runs across all Meta placements simultaneously, using 60 seconds of extreme-condition sports footage with no on-screen specs.",
    thumbnail: "https://picsum.photos/seed/meta5app/500/700",
    publishedAt: "2026-08-09",
    industries: ["Consumer Electronics", "Wearables"],
    topics: ["Apple", "Launch Ad", "No-Spec Narrative"],
    advertiser: "Apple",
    isActive: true,
    activeDays: 4,
    platforms: ["Facebook", "Instagram", "Messenger"],
    format: "Video (60s)",
    headline: "Built for What Comes Next.",
    ctaText: "Learn More",
    metric1: "Est. reach: 80M-200M+",
    bodyBlocks: [
      {
        kind: "p",
        text: "Apple's latest Watch Ultra 3 launch campaign runs across all Meta placements simultaneously — the broadest known Meta launch activation from Apple. The 60-second video uses extreme-condition sports footage with no product specs on screen, letting the visual narrative carry the positioning entirely.",
      },
    ],
    intelligence: {
      trendStage: "peaking",
      testWindow: "No reliable window yet",
      testWindowRationale:
        "This is an awareness-only campaign with no direct competitive urgency for other advertisers — worth studying the visual structure, not timing a copy.",
      confidence: {
        level: "medium",
        evidenceCount: 2,
        evidenceType: "Meta Ad Library confirmation only — no independent performance data available",
        refreshedAt: "2026-08-11T09:00:00Z",
      },
      adaptationRisk: { level: "high", reason: "Apple's production budget and brand equity make direct format adaptation impractical for most brands." },
      bestFit: "Premium brand marketers looking to study narrative-led (no-spec) creative approaches.",
      opportunityRead: "unclear",
      opportunityNote: "The no-spec structure is worth studying, but Apple-scale reach and budget make the specific execution non-replicable for most advertisers.",
      creativeWhitespace: 'Apple uses extreme sports. Everyday-challenge framing ("built for your commute") could work for mid-market wearables.',
      suggestedFirstTest: "Test a 30s brand story video with zero product specs — lead with the problem/context, reveal the product in the final 8 seconds.",
      whatNotToCopy: "Do not replicate the extreme-adventure aesthetic without the brand equity to back it — it reads as aspirational overreach.",
      evidence: [
        { level: "observed", text: "4-day run confirmed, active across Facebook, Instagram, and Messenger simultaneously." },
        { level: "inferred", text: "The no-spec, narrative-only video approach is the transferable signal here — the specific execution is not." },
      ],
    },
  },
];

// ═══════════════════════════════════════════════════════════════════════
// TIKTOK HOOKS — 8 items
// ═══════════════════════════════════════════════════════════════════════

export const TIKTOK_HOOKS: TrendItem[] = [
  {
    id: "tt-1",
    type: "tiktok",
    title: '"POV: Found the Only One That Doesn\'t…" Problem-Relief Hook',
    excerpt:
      'A problem-relief hook framing ("the only X that doesn\'t Y") is driving high share rates by triggering immediate viewer identification with a common frustration.',
    thumbnail: "https://picsum.photos/seed/tt1/420/700",
    publishedAt: "2026-08-11",
    industries: ["Beauty", "Skincare"],
    topics: ["TikTok", "Hook Format", "Problem-Relief"],
    hook: "POV: You just found the only [product] that doesn't [common failure]. I'm not okay.",
    creator: "@beautywithbelle",
    followerCount: "890K",
    duration: "0:32",
    stats: { views: "6.2M", likes: "941K", shares: "78K" },
    bodyBlocks: [
      {
        kind: "p",
        text: "Most effective adaptations swap in the specific product failure that matters most to the target audience — e.g., the only sunscreen that doesn't leave a white cast, or the only earbuds that actually stay in while running.",
      },
    ],
    intelligence: {
      trendStage: "emerging",
      testWindow: "Next 7-12 days",
      testWindowRationale:
        "Beauty-category saturation typically arrives faster than other verticals; 7-12 days is the realistic window before this exact framing becomes common there, with 14-20 days in less-saturated categories.",
      confidence: {
        level: "medium",
        evidenceCount: 5,
        evidenceType: "View/like/share benchmarking + cross-category branded-video count",
        refreshedAt: "2026-08-10T16:00:00Z",
      },
      adaptationRisk: { level: "low", reason: "Problem-relief framing is a universal hook structure — adapts to any product category with a clear pain point." },
      bestFit: "Any product category with a well-known consumer frustration — beauty, fitness, food, electronics accessories.",
      opportunityRead: "opportunity",
      opportunityNote:
        "B2B software has not adopted this hook structure yet — \"the only [tool] that doesn't [annoying limitation]\" has clear untested potential.",
      creativeWhitespace: "B2B software and SaaS brands haven't adopted this hook structure yet.",
      suggestedFirstTest:
        "List your product's top 3 solved pain points. Script and film the hook for the most resonant one, aiming for genuine delivery over produced polish.",
      whatNotToCopy: 'Do not use "I\'m not okay" if your product isn\'t genuinely surprising — the emotional tag has to match the reveal.',
      evidence: [
        { level: "observed", text: "6.2M views, 941K likes, 78K shares — above category average for 32-second product demos." },
        { level: "corroborated", text: "This hook format appears in 340+ branded videos in the past 7 days across beauty, fitness, and home goods." },
        { level: "inferred", text: '78K shares suggests strong "relatability to friends" — a social-recommendation signal.' },
        { level: "suggested", text: "Film 3 variations on different pain points and use TikTok's Creative Center audience insights to see which resonates most with your target demographic." },
        { level: "forecast", text: "Format likely saturates in beauty within 2 weeks but has a 4-6 week window in food and home categories." },
      ],
    },
  },
  {
    id: "tt-2",
    type: "tiktok",
    title: '"I Tried Every X So You Don\'t Have To" Honest-Ranking Format',
    excerpt:
      'The "I tried every X" honest-ranking format is at a high-engagement resurgence after periodically reappearing for 3+ years, driven by trust signals from acknowledging competitors.',
    thumbnail: "https://picsum.photos/seed/tt2/420/700",
    publishedAt: "2026-08-08",
    industries: ["Cross-Category"],
    topics: ["TikTok", "Honest Ranking", "Trust"],
    hook: "I tried every [product category] so you don't have to. Here's my honest ranking.",
    creator: "@rankingthings",
    followerCount: "1.4M",
    duration: "1:12",
    stats: { views: "11.8M", likes: "1.9M", shares: "156K" },
    bodyBlocks: [
      {
        kind: "p",
        text: 'The "honest ranking" framing positions the creator as a trusted arbiter rather than a brand promoter, which drives trust metrics that a purely promotional review typically does not achieve.',
      },
    ],
    intelligence: {
      trendStage: "growing",
      testWindow: "Next 30-45 days",
      testWindowRationale: "This is an evergreen format with cyclical peaks rather than a short-lived trend, so the window is longer than most hook formats.",
      confidence: {
        level: "high",
        evidenceCount: 3,
        evidenceType: "Engagement-ratio benchmarking + 3-week trend-tracker confirmation",
        refreshedAt: "2026-08-08T14:00:00Z",
      },
      adaptationRisk: { level: "low", reason: "Universal format that adapts across all product categories. Brand-authored versions perform when they genuinely include competitors." },
      bestFit: "Any brand willing to acknowledge competitors exist and position itself as the best-in-class choice.",
      opportunityRead: "growing",
      opportunityNote: "Genuine brand-authored rankings that include real competitors are rare, and when done credibly they significantly outperform category norms.",
      creativeWhitespace: 'Brand-authored "honest rankings" that include competitor products are rare — and outperform when genuine.',
      suggestedFirstTest:
        "Rank 5 products in your category including 2-3 real competitors. Your product should win on at least one specific, concrete criterion, not every one.",
      whatNotToCopy: "Do not produce a ranking where your product wins on every dimension — it reads as obviously promotional and destroys trust.",
      evidence: [
        { level: "observed", text: "11.8M views with a 16% like rate, roughly 2.4x the category average for 72-second reviews." },
        { level: "corroborated", text: "This format has trended in TikTok Creative Center for 3 consecutive weeks across beauty, kitchen, fitness, and tech." },
        { level: "inferred", text: "48K comments indicate high discussion — a positive signal for organic reach amplification via comment engagement." },
      ],
    },
  },
  {
    id: "tt-3",
    type: "tiktok",
    title: '"Things I Stopped Buying" Savings-Anchor Hook',
    excerpt:
      "This format combines financial anxiety with product discovery, using a specific savings figure as a scroll-stop anchor.",
    thumbnail: "https://picsum.photos/seed/tt3/420/700",
    publishedAt: "2026-08-06",
    industries: ["Finance", "Home Goods"],
    topics: ["TikTok", "Savings Hook", "Recurring Expense"],
    hook: "Things I stopped buying after finding this. Saving myself $X/month.",
    creator: "@moneysavermia",
    followerCount: "3.2M",
    duration: "0:58",
    stats: { views: "22.1M", likes: "3.8M", shares: "412K" },
    bodyBlocks: [
      {
        kind: "p",
        text: "The savings figure in the hook title acts as a scroll-stop anchor, a dual trigger of financial anxiety and product discovery that has proven unusually effective in the current economic climate.",
      },
    ],
    intelligence: {
      trendStage: "peaking",
      testWindow: "Next 3-5 days",
      testWindowRationale: "The format is already widespread; only early movers in still-untapped niche categories have a meaningful window left.",
      confidence: {
        level: "high",
        evidenceCount: 5,
        evidenceType: "View/share benchmarking + 4-week cross-platform trend confirmation",
        refreshedAt: "2026-08-06T11:00:00Z",
      },
      adaptationRisk: {
        level: "review",
        reason:
          "Savings claims must be independently verifiable — exaggerated figures have triggered regulatory (FTC) enforcement action in this format before. Review each claim before publishing.",
      },
      bestFit: "Home goods, pantry staples, personal-finance tools, and any product that replaces a recurring expense.",
      opportunityRead: "unclear",
      opportunityNote:
        'The consumer version is near peak, but the B2B equivalent ("software I cancelled after switching") is completely untapped and carries lower compliance risk if the figure is real.',
      creativeWhitespace: 'B2B equivalent ("software I cancelled after switching to X — saving $400/month") is completely untapped.',
      suggestedFirstTest: "Calculate the realistic monthly savings your product enables. Lead with the specific, verifiable dollar amount — not a range.",
      whatNotToCopy: "Do not inflate the savings figure — audiences actively fact-check these claims in comment sections.",
      evidence: [
        { level: "observed", text: "22.1M views — among the top-performing TikTok videos this week across all categories." },
        { level: "observed", text: '412K shares — exceptional for a 58-second video, suggesting strong "send to a friend" behavior.' },
        { level: "corroborated", text: '"Replacement savings" hooks have appeared in top content for 4+ weeks on TikTok, Instagram Reels, and YouTube Shorts simultaneously.' },
        { level: "inferred", text: 'High share count is consistent with "tagging a friend who needs this" behavior — a social-recommendation signal.' },
        { level: "forecast", text: "Format is at or near peak; niche adaptations (B2B, professional tools) likely still have 3-4 weeks of runway." },
      ],
    },
  },
  {
    id: "tt-4",
    type: "tiktok",
    title: 'Expert-Credential "Brutally Honest Rating" Hook',
    excerpt:
      'Expert-credential hooks are outperforming non-credentialed equivalents in health, beauty, and nutrition, with "brutally honest" language disarming the audience\'s promotional-content filter.',
    thumbnail: "https://picsum.photos/seed/tt4/420/700",
    publishedAt: "2026-08-09",
    industries: ["Health", "Beauty"],
    topics: ["TikTok", "Expert Credential", "Authenticity"],
    hook: "Rating [popular products] as a [expert]. Brutally honest.",
    creator: "@derm.doctor.dan",
    followerCount: "4.8M",
    duration: "2:14",
    stats: { views: "34.7M", likes: "5.2M", shares: "890K" },
    bodyBlocks: [
      {
        kind: "p",
        text: 'The "brutally honest" qualifier signals authenticity and preemptively disarms the viewer\'s promotional-content filter, which appears to be a meaningful factor in the format\'s outsized reach.',
      },
    ],
    intelligence: {
      trendStage: "growing",
      testWindow: "Next 21-30 days",
      testWindowRationale: "Expert-credential formats have longer engagement cycles than single-moment trend hooks.",
      confidence: {
        level: "high",
        evidenceCount: 4,
        evidenceType: "View/comment benchmarking + 6-week cross-platform trend confirmation",
        refreshedAt: "2026-08-09T13:00:00Z",
      },
      adaptationRisk: { level: "low", reason: "Easily adapted — positioning as a category expert works even without formal medical or professional credentials." },
      bestFit: "Any brand with genuine domain expertise or access to credentialed advisors — dermatology, nutrition, fitness, legal, finance.",
      opportunityRead: "opportunity",
      opportunityNote:
        "Cross-category expert ratings — a chef rating meal kits, an HR expert rating productivity tools — are almost entirely unexplored outside health and beauty.",
      creativeWhitespace: "Cross-category expert ratings (chef rating meal kits, HR expert rating productivity tools) are almost entirely unexplored.",
      suggestedFirstTest:
        "Identify one genuine expert — team member, advisor, or customer — who can credibly rate 5 products in your category. Film it documentary-style, not produced.",
      whatNotToCopy: "Do not fake credentials. TikTok audiences are highly alert to credential inflation, particularly in health and wellness.",
      evidence: [
        { level: "observed", text: "34.7M views and 890K shares — among the highest-performing non-viral organic videos this month." },
        { level: "corroborated", text: "Expert-credential hooks have trended for 6+ weeks across health, beauty, and food categories on TikTok and YouTube Shorts." },
        { level: "inferred", text: '103K comments with high question density ("what about X brand?") suggest strong trust and purchase-consideration intent.' },
        { level: "suggested", text: "Brands without in-house experts should consider partnering with micro-credentialed creators (5K-50K followers) — their engagement rates tend to outperform mass-followed experts." },
      ],
    },
  },
  {
    id: "tt-5",
    type: "tiktok",
    title: '"Why Every X Needs This" Identity-Activation Hook',
    excerpt:
      'This hook activates group identity before making the product claim, and the "watch til the end" CTA raises completion rates by setting a payoff expectation.',
    thumbnail: "https://picsum.photos/seed/tt5/420/700",
    publishedAt: "2026-08-12",
    industries: ["Fitness", "Lifestyle"],
    topics: ["TikTok", "Identity Hook"],
    hook: "Why every [target audience] needs to try [category]. Watch til the end.",
    creator: "@runnergirlsam",
    followerCount: "620K",
    duration: "0:44",
    stats: { views: "4.1M", likes: "610K", shares: "42K" },
    bodyBlocks: [
      {
        kind: "p",
        text: 'The structure works by activating group identity before making the product claim; the "watch til the end" CTA sets a payoff expectation that increases completion.',
      },
    ],
    intelligence: {
      trendStage: "emerging",
      testWindow: "Next 12-18 days",
      testWindowRationale: "The fitness-category window is 12-18 days; identity hooks in B2B or professional categories tend to run longer before saturating.",
      confidence: {
        level: "low",
        evidenceCount: 4,
        evidenceType: "View/share benchmarking on a single creator — not yet cross-checked against other accounts",
        refreshedAt: "2026-08-12T08:00:00Z",
      },
      adaptationRisk: { level: "low", reason: "Identity-activation hooks are highly adaptable and work for any product with a defined user type." },
      bestFit: "Brands with a clear, self-identifying customer type — runners, entrepreneurs, new parents, remote workers.",
      opportunityRead: "opportunity",
      opportunityNote:
        'Professional-identity hooks ("why every founder needs X") are barely explored compared to lifestyle-identity hooks like this one.',
      creativeWhitespace: 'Professional identity hooks ("why every founder needs X") are barely explored compared to lifestyle identity hooks.',
      suggestedFirstTest:
        'Name your customer\'s strongest self-identity. Lead with that word in the first 2 seconds. The payoff must genuinely justify the "watch til the end" promise.',
      whatNotToCopy: 'Do not use "watch til the end" if the payoff is weak — it creates a broken-promise feeling that damages brand sentiment.',
      evidence: [
        { level: "observed", text: "4.1M views and 42K shares for a 620K-follower creator — an above-average reach multiplier." },
        { level: "inferred", text: "The nostalgia-adjacent audio track correlates with above-average performance, though this is a single-video sample." },
        { level: "suggested", text: 'Test the identity hook with and without the "watch til the end" CTA to isolate its individual contribution to completion rate.' },
        { level: "forecast", text: "Identity hooks with professional or career framing are likely to grow through Q3 2026 as B2B TikTok content matures." },
      ],
    },
  },
  {
    id: "tt-6",
    type: "tiktok",
    title: '"The 2026 Way To…" Year-Anchored Hook',
    excerpt:
      '"The [year] way to X" primes viewers to expect an updated, superior solution to a familiar problem, with Gen-Z verbal ticks authenticating the claim.',
    thumbnail: "https://picsum.photos/seed/tt6/420/700",
    publishedAt: "2026-08-07",
    industries: ["Technology", "Productivity"],
    topics: ["TikTok", "Year Anchor"],
    hook: "The 2026 way to [solve common problem]. No cap.",
    creator: "@techlifetips",
    followerCount: "1.8M",
    duration: "0:39",
    stats: { views: "7.9M", likes: "1.1M", shares: "88K" },
    bodyBlocks: [
      {
        kind: "p",
        text: 'The year-anchoring device adds inherent freshness to the claim, and the "No cap" verbal tick authenticates it for younger demographics without requiring any other credibility signal.',
      },
    ],
    intelligence: {
      trendStage: "growing",
      testWindow: "Next 14-21 days",
      testWindowRationale: "Year-anchoring adds a natural freshness window that closes once the framing becomes commonplace across the category.",
      confidence: {
        level: "medium",
        evidenceCount: 3,
        evidenceType: "View/like-ratio benchmarking + cross-category trend confirmation",
        refreshedAt: "2026-08-07T10:00:00Z",
      },
      adaptationRisk: { level: "low", reason: "Year-anchoring works as long as the product genuinely represents an updated approach; it does not depend on brand voice." },
      bestFit: "Tech, productivity, and innovation-oriented brands targeting 18-28 demographics.",
      opportunityRead: "opportunity",
      opportunityNote: 'Most "2026 way to" hooks target individual consumer products; workflow and process framing ("the 2026 way to manage your team") is unexplored.',
      creativeWhitespace: 'Workflow and process improvements ("the 2026 way to manage your team") are unexplored versus consumer-product framing.',
      suggestedFirstTest: "Frame your product as the new default for one specific use case. Imply the old way is outdated without directly criticizing competitors.",
      whatNotToCopy: 'Do not use "No cap" if your brand voice doesn\'t authentically skew Gen Z — forced slang repels more than it attracts.',
      evidence: [
        { level: "observed", text: "7.9M views with a 14% like-to-view ratio — above the tech-category average." },
        { level: "corroborated", text: "Year-anchored hooks are trending in tech, finance, and productivity content across TikTok and YouTube Shorts." },
        { level: "inferred", text: "High comment volume (29K) indicates opinion-generating content — a signal that tends to correlate with algorithmic amplification." },
      ],
    },
  },
  {
    id: "tt-7",
    type: "tiktok",
    title: '"Day 1 → Day 30" Transformation Arc',
    excerpt:
      'The "Day 1 → Day 30" framing gives transformation content a documentary arc that drives repeat views and saves, while "what actually happens" lowers promotional resistance.',
    thumbnail: "https://picsum.photos/seed/tt7/420/700",
    publishedAt: "2026-08-10",
    industries: ["Skincare", "Health", "Fitness"],
    topics: ["TikTok", "Transformation", "Documentary Arc"],
    hook: "What actually happens when you switch from [old way] to [new product]. Day 1 → Day 30.",
    creator: "@skinjourney90",
    followerCount: "445K",
    duration: "1:28",
    stats: { views: "5.4M", likes: "820K", shares: "61K" },
    bodyBlocks: [
      {
        kind: "p",
        text: 'Transformation journey hooks have always performed, but the "Day 1 → Day 30" framing creates a documentary arc that drives repeat views and saves. The "what actually happens" prefix adds realism framing that lowers promotional resistance.',
      },
    ],
    intelligence: {
      trendStage: "emerging",
      testWindow: "Next 14-21 days",
      testWindowRationale:
        "Transformation formats have longer engagement windows than single-moment hooks, but documented results still need to stay genuine to hold up over that window.",
      confidence: {
        level: "medium",
        evidenceCount: 5,
        evidenceType: "View/save benchmarking + reach-to-follower ratio analysis",
        refreshedAt: "2026-08-09T17:00:00Z",
      },
      adaptationRisk: {
        level: "review",
        reason:
          "Results must be genuine and observable — unsubstantiated transformation claims carry FTC compliance risk in this format. Review each claim before publishing.",
      },
      bestFit: "Skincare, supplement, fitness, sleep, or productivity brands where genuine measurable change occurs within 30 days.",
      opportunityRead: "opportunity",
      opportunityNote: 'B2B transformation content ("what happens to your team\'s output after switching to X") is unexplored in this format.',
      creativeWhitespace: 'B2B transformation content ("what happens to your team\'s output after switching to X") is unexplored.',
      suggestedFirstTest:
        "Identify one genuine, visually documentable change your product creates. Film days 1, 7, 14, and 30 with a real customer narrating in their own words.",
      whatNotToCopy: 'Do not use stock before/after imagery — the "what actually happens" credibility depends entirely on authenticity of documentation.',
      evidence: [
        { level: "observed", text: "5.4M views from a 445K-follower creator — a roughly 12x reach-to-follower ratio, suggesting strong algorithmic pickup." },
        { level: "observed", text: '61K saves — above average, indicating "come back to this later" intent, a purchase-consideration signal.' },
        { level: "inferred", text: "The warm, aspirational audio track correlates with the format performing best when visual tone matches, based on this and comparable videos." },
        { level: "suggested", text: "Activate a paid Spark Ad on top-performing organic transformation UGC before producing new footage." },
        { level: "forecast", text: "The 30-day transformation format likely peaks in skincare within 4 weeks; the entry window in fitness likely stays open 6-8 weeks." },
      ],
    },
  },
  {
    id: "tt-8",
    type: "tiktok",
    title: '"Tell Me Without Telling Me" Holy-Grail Format',
    excerpt:
      'This format invites duet and stitch participation as part of its core value proposition, with "holy grail" framing signaling maximum product endorsement.',
    thumbnail: "https://picsum.photos/seed/tt8/420/700",
    publishedAt: "2026-08-05",
    industries: ["Beauty", "Fashion", "Food"],
    topics: ["TikTok", "Duet Invitation", "Holy Grail"],
    hook: "Tell me you found the holy grail [product] without telling me. I'll go first.",
    creator: "@foundtheone",
    followerCount: "2.6M",
    duration: "0:24",
    stats: { views: "15.3M", likes: "2.7M", shares: "310K" },
    bodyBlocks: [
      {
        kind: "p",
        text: 'The community content extension is part of the hook\'s value proposition, and "holy grail" framing signals maximum product endorsement credibility to viewers.',
      },
    ],
    intelligence: {
      trendStage: "peaking",
      testWindow: "Next 2-4 days",
      testWindowRationale: "The format is at peak; only a narrow window remains for a differentiated entry before the specific phrasing saturates.",
      confidence: {
        level: "high",
        evidenceCount: 5,
        evidenceType: "View/duet-count confirmation + cross-platform simultaneous-peak check",
        refreshedAt: "2026-08-05T09:00:00Z",
      },
      adaptationRisk: { level: "low", reason: '"Holy grail" framing works across virtually any product category with genuinely passionate fans.' },
      bestFit: "Any product with strong customer advocacy — beauty, food, tech accessories, fitness gear.",
      opportunityRead: "unclear",
      opportunityNote:
        "Duet-invitation versions that explicitly ask viewers to participate see meaningfully higher participation than passive posts, even as the base format peaks.",
      creativeWhitespace: "Duet-invitation versions of this hook — explicitly inviting viewers to share their version — see notably higher participation rates.",
      suggestedFirstTest:
        'Create a "tell me without telling me" video on your brand handle and explicitly invite community participation in the caption. Pin the top community response.',
      whatNotToCopy:
        'Do not use "holy grail" for everyday or commodity products — the language implies exceptional, life-changing quality, and overpromising burns trust.',
      evidence: [
        { level: "observed", text: "15.3M views and 310K shares — among this week's top-performing TikTok videos by share rate." },
        { level: "observed", text: "7,200+ duets/stitches on the original — unusually high community participation." },
        { level: "corroborated", text: '"Tell me without telling me" content is peaking simultaneously on TikTok, Instagram Reels, and YouTube Shorts.' },
        { level: "inferred", text: "An 18% like rate on 15.3M views suggests the format's payoff is landing well above typical viewer expectation." },
        { level: "forecast", text: "This specific phrasing likely peaks within 5 days; the underlying duet/stitch participation mechanic will outlast the exact copy." },
      ],
    },
  },
];

// ═══════════════════════════════════════════════════════════════════════
// NEWS & INTELLIGENCE — 7 items (news / report / podcast)
// ═══════════════════════════════════════════════════════════════════════

export const NEWS_ITEMS: TrendItem[] = [
  {
    id: "news-1",
    type: "news",
    title: "TikTok Shop Expands to 10 New European Markets Ahead of Q4",
    excerpt:
      "TikTok Shop's European expansion brings social commerce to 10 new markets, including Spain, Italy, and Poland, with in-feed checkout and creator affiliate programs.",
    thumbnail: "https://picsum.photos/seed/ni1dig/600/340",
    publishedAt: "2026-08-11",
    industries: ["E-commerce", "Social Commerce"],
    topics: ["TikTok Shop", "Social Commerce", "Europe"],
    source: "Digiday",
    readTime: "3 min read",
    bodyBlocks: [
      {
        kind: "p",
        text: "TikTok Shop has formally launched in 10 additional European markets, extending its in-feed checkout and creator affiliate tools ahead of the Q4 shopping season.",
      },
    ],
    intelligence: {
      trendStage: "emerging",
      testWindow: "Next 30 days",
      testWindowRationale: "New-market platform rollouts typically take 30-60 days before creator and merchant tooling stabilizes enough to test reliably.",
      confidence: {
        level: "medium",
        evidenceCount: 2,
        evidenceType: "Single-outlet report, not yet independently corroborated",
        refreshedAt: "2026-08-11T09:00:00Z",
      },
      adaptationRisk: { level: "low", reason: "Expansion is a market-access change, not a creative pattern — adoption risk is operational (localization, logistics), not creative." },
      bestFit: "DTC brands with EU fulfillment already in place, looking at Spain, Italy, or Poland.",
      opportunityRead: "opportunity",
      opportunityNote: "Brands with EU fulfillment ready now can claim category-first creator partnerships in these markets before competitors localize.",
      creativeWhitespace: "Most brands haven't localized creator affiliate content for these 10 markets yet.",
      suggestedFirstTest: "Identify 2-3 creators already active in one target market and pilot affiliate-linked content before committing paid budget.",
      whatNotToCopy: "Do not port creative that worked in the US or UK directly — localization (language, payment norms) materially affects conversion here.",
      evidence: [
        { level: "observed", text: "Digiday confirmed the 10-market expansion with named countries including Spain, Italy, and Poland." },
        { level: "suggested", text: "Brands already selling in these markets via other channels are best positioned to pilot first." },
      ],
    },
  },
  {
    id: "news-2",
    type: "news",
    title: "Instagram Trial Reels Let Brands Test Content Without Follower Risk",
    excerpt:
      "Instagram's new Trial Reels feature lets brands publish to non-follower audiences for 24 hours before deciding whether to share with their existing audience.",
    thumbnail: "https://picsum.photos/seed/ni2smt/600/340",
    publishedAt: "2026-08-10",
    industries: ["Social Media", "Content Strategy"],
    topics: ["Instagram", "Reels", "Trial", "Organic Reach"],
    source: "Social Media Today",
    readTime: "4 min read",
    bodyBlocks: [
      {
        kind: "p",
        text: "Instagram's Trial Reels feature, available to business accounts, lets brands send new Reels to a non-follower audience for 24 hours and decide afterward whether to publish it to their existing following.",
      },
    ],
    intelligence: {
      trendStage: "growing",
      testWindow: "Next 14-21 days",
      testWindowRationale: "The feature is new enough that early adopters can establish a testing rhythm before it becomes standard practice across brand accounts.",
      confidence: {
        level: "medium",
        evidenceCount: 2,
        evidenceType: "Single-outlet feature report; feature-level rollout not independently confirmed by Meta",
        refreshedAt: "2026-08-10T11:00:00Z",
      },
      adaptationRisk: { level: "low", reason: "This is a low-risk organic testing tool, not a paid-creative pattern — downside of a failed test is limited to non-follower reach." },
      bestFit: "Any brand with an active Instagram content program looking to de-risk experimental formats.",
      opportunityRead: "opportunity",
      opportunityNote: "Brands can use this to validate creative angles organically before committing paid budget to them.",
      creativeWhitespace: "Few brands are yet using Trial Reels as a systematic pre-test step before paid creative production.",
      suggestedFirstTest: "Run 3 stylistically different Reels through Trial Reels and use completion rate, not follower reaction, to pick the one to scale.",
      whatNotToCopy: "Do not treat a strong Trial Reels result as a guarantee of paid performance — audience composition differs meaningfully.",
      evidence: [
        { level: "observed", text: "Social Media Today confirmed the feature is live for business accounts." },
        { level: "suggested", text: "Use Trial Reels results as a directional signal for paid creative testing, not a substitute for it." },
      ],
    },
  },
  {
    id: "news-3",
    type: "news",
    title: "LinkedIn Thought Leader Ads Now Open to All Company Pages",
    excerpt:
      "LinkedIn has opened its Thought Leader Ads format — which promotes individual employee posts through company ad spend — to all Company Pages globally.",
    thumbnail: "https://picsum.photos/seed/ni3ml/600/340",
    publishedAt: "2026-08-09",
    industries: ["B2B", "Professional Services"],
    topics: ["LinkedIn", "Thought Leader Ads", "B2B"],
    source: "Marketing Land",
    readTime: "3 min read",
    bodyBlocks: [
      {
        kind: "p",
        text: "LinkedIn Thought Leader Ads, previously in limited beta, are now available globally to all LinkedIn Company Pages, letting brands boost employee-authored posts as paid content.",
      },
    ],
    intelligence: {
      trendStage: "growing",
      testWindow: "Next 30 days",
      testWindowRationale: "Global availability just opened; the first 30 days is the window before the format becomes a standard line item in B2B media plans.",
      confidence: {
        level: "medium",
        evidenceCount: 2,
        evidenceType: "Single-outlet confirmation of global rollout",
        refreshedAt: "2026-08-09T10:00:00Z",
      },
      adaptationRisk: { level: "low", reason: "The format promotes existing organic employee content — creative risk is limited to the underlying post, which is already public." },
      bestFit: "B2B companies with employees who already post organically and get engagement.",
      opportunityRead: "opportunity",
      opportunityNote: "Companies with an existing employee-advocacy program have a head start — they already have organic posts worth boosting.",
      creativeWhitespace: "Most B2B advertisers are still building traditional company-page ad creative rather than boosting employee voice.",
      suggestedFirstTest: "Identify your highest-organic-engagement employee post from the last 90 days and boost it as a Thought Leader Ad before producing new creative.",
      whatNotToCopy: "Do not boost a post that reads as corporate-approved messaging in an employee's voice — the format only works when the voice is authentically theirs.",
      evidence: [
        { level: "observed", text: "Marketing Land confirmed global availability to all Company Pages." },
        { level: "suggested", text: "Prioritize boosting posts with organic engagement already above your account average." },
      ],
    },
  },
  {
    id: "news-4",
    type: "podcast",
    title: 'Marketing Brew: "The Creative Recession" — Fewer Ads, Better Results?',
    excerpt:
      "Marketing Brew's latest episode argues that brands producing fewer, higher-quality creative assets outperform those running volume-first creative strategies.",
    thumbnail: "https://picsum.photos/seed/ni4pod/600/340",
    publishedAt: "2026-08-08",
    industries: ["Marketing", "Creative Strategy"],
    topics: ["Podcast", "Creative Strategy", "Quality vs. Volume"],
    source: "Marketing Brew",
    readTime: "38 min listen",
    bodyBlocks: [
      {
        kind: "p",
        text: "This week's Marketing Brew episode features three creative directors making the case that shrinking creative output while raising the bar on quality is outperforming high-volume, lower-quality creative programs at several mid-market brands they advise.",
      },
    ],
    intelligence: {
      trendStage: "growing",
      testWindow: "No reliable window yet",
      testWindowRationale:
        "This is a strategic/organizational argument about creative operations, not a time-bound creative pattern — a bounded test window does not apply.",
      confidence: {
        level: "insufficient",
        evidenceCount: 2,
        evidenceType: "Anecdotal panel discussion from 3 practitioners; no named brands or measured results disclosed",
        refreshedAt: "2026-08-08T20:00:00Z",
      },
      adaptationRisk: { level: "low", reason: "Adopting a \"fewer, better\" creative process is an internal operating change, not a public-facing creative risk." },
      bestFit: "Marketing leaders reviewing creative production headcount or agency structure.",
      opportunityRead: "unclear",
      opportunityNote:
        "The panel's claims are directionally interesting but anecdotal — worth a genuine internal test, not a wholesale strategy change based on this episode alone.",
      creativeWhitespace: "Not established by this source — the episode is a strategic discussion, not a documented creative pattern to imitate.",
      suggestedFirstTest: "Pick one campaign and run it with 3 deliberately higher-effort assets instead of your usual volume of lower-effort variants; compare results.",
      whatNotToCopy: "Do not cut creative volume broadly based on this episode alone — the panel did not share measured before/after data.",
      evidence: [
        { level: "observed", text: "Three creative directors discussed the pattern anecdotally on the episode; no brand names or measured results were disclosed." },
        { level: "suggested", text: "Treat the argument as a hypothesis worth testing internally rather than a confirmed industry shift." },
      ],
    },
  },
  {
    id: "news-5",
    type: "report",
    title: "eMarketer: Retail Media Ad Spend on Pace to Cross $175B",
    excerpt:
      "eMarketer's mid-year update projects US retail media ad spend will cross $175B in 2026, with off-platform retail media networks growing fastest.",
    thumbnail: "https://picsum.photos/seed/news5emarketer/600/340",
    publishedAt: "2026-08-06",
    industries: ["Retail", "Retail Media"],
    topics: ["Report", "Retail Media", "Ad Spend"],
    source: "eMarketer",
    readTime: "6 min read",
    bodyBlocks: [
      {
        kind: "p",
        text: "eMarketer's mid-year retail media update projects full-year 2026 US retail media ad spend will cross $175B, driven primarily by growth in off-platform retail media networks — placements a retailer sells on sites and apps it does not own.",
      },
      {
        kind: "h3",
        text: "What it means for advertisers",
      },
      {
        kind: "p",
        text: "Brands already running on-platform retail media (product pages, search results) are being encouraged by several retailers to also test off-platform placements, which the report notes have historically lower competition and CPMs than the retailer's own on-site inventory.",
      },
    ],
    intelligence: {
      trendStage: "growing",
      testWindow: "No reliable window yet",
      testWindowRationale: "This is a structural category-growth forecast, not a time-bound creative or platform trend.",
      confidence: {
        level: "high",
        evidenceCount: 2,
        evidenceType: "eMarketer forecast methodology, aggregated from retailer-reported and third-party spend data",
        refreshedAt: "2026-08-06T09:00:00Z",
      },
      adaptationRisk: { level: "low", reason: "This is a spend-allocation forecast, not a creative pattern — there is no creative-adaptation risk to assess." },
      bestFit: "Brands with $500K+ annual retail media spend deciding how to split on-platform vs. off-platform budget.",
      opportunityRead: "opportunity",
      opportunityNote:
        "Off-platform retail media inventory reportedly has lower competition today — a window that narrows as spend forecasts like this one prompt more advertisers to shift budget there.",
      creativeWhitespace: "Not established by this source — this is a spend-allocation forecast, not a creative pattern.",
      suggestedFirstTest: "Shift 10% of one retailer's on-platform media budget to that retailer's off-platform network for one cycle and compare CPM and conversion.",
      whatNotToCopy: "Do not treat the $175B category total as a signal that any specific retailer network is worth your specific budget — verify at the retailer level.",
      evidence: [
        { level: "observed", text: "eMarketer's published forecast methodology aggregates retailer-reported spend with third-party measurement data." },
        { level: "forecast", text: "eMarketer projects off-platform retail media networks will grow faster than on-platform inventory through the remainder of 2026." },
      ],
    },
  },
  {
    id: "news-6",
    type: "news",
    title: "Pinterest Launches Performance+ Automated Campaigns for SMBs",
    excerpt:
      "Pinterest is rolling out Performance+, an automated campaign type aimed at small and mid-sized advertisers, following the automated-bidding pattern set by Meta and Google.",
    thumbnail: "https://picsum.photos/seed/news6pinterest/600/340",
    publishedAt: "2026-08-12",
    industries: ["E-commerce", "SMB Marketing"],
    topics: ["Pinterest", "Automated Bidding", "SMB"],
    source: "TechCrunch",
    readTime: "3 min read",
    bodyBlocks: [
      {
        kind: "p",
        text: "Pinterest's new Performance+ campaign type automates audience targeting and bid management for advertisers, initially rolling out to small and mid-sized business accounts before a broader release.",
      },
    ],
    intelligence: {
      trendStage: "emerging",
      testWindow: "Next 30 days",
      testWindowRationale:
        "The feature is in early rollout to a limited account tier — the window is for eligible SMB advertisers to establish a baseline before wider availability changes the competitive picture.",
      confidence: {
        level: "medium",
        evidenceCount: 2,
        evidenceType: "Single-outlet confirmation of early rollout; no independent performance data yet",
        refreshedAt: "2026-08-12T12:00:00Z",
      },
      adaptationRisk: { level: "low", reason: "This is a platform-level automation tool, similar in structure to Meta Advantage+ — adoption risk is operational, not creative." },
      bestFit: "SMB e-commerce advertisers already spending on Pinterest with at least a few converting creative assets to feed the automation.",
      opportunityRead: "opportunity",
      opportunityNote: "Early access to automated bidding tools has historically rewarded advertisers who adopt before the tool is generally available and heavily competed for.",
      creativeWhitespace: "Not established by this source — this is a bidding/targeting automation change, not a creative pattern.",
      suggestedFirstTest: "If eligible, migrate one small, stable campaign to Performance+ and compare CPA against your manual baseline over 2-3 weeks.",
      whatNotToCopy: "Do not migrate your top-performing manual campaign as your first test — start with a lower-stakes campaign given this is a new, unproven tool.",
      evidence: [
        { level: "observed", text: "TechCrunch confirmed the Performance+ rollout is limited to SMB accounts initially." },
        { level: "suggested", text: "Treat this as analogous to early Meta Advantage+ adoption — early movers with enough creative assets tend to benefit most." },
      ],
    },
  },
  {
    id: "news-7",
    type: "podcast",
    title: 'Modern Retail: "Is Influencer Marketing Still Worth It?"',
    excerpt:
      "Modern Retail's podcast brings on two DTC marketing leads to debate whether influencer marketing ROI has genuinely declined or whether measurement has just gotten more honest.",
    thumbnail: "https://picsum.photos/seed/news7modernretail/600/340",
    publishedAt: "2026-08-04",
    industries: ["Retail", "Influencer Marketing"],
    topics: ["Podcast", "Influencer Marketing", "ROI"],
    source: "Modern Retail",
    readTime: "32 min listen",
    bodyBlocks: [
      {
        kind: "p",
        text: "Two DTC marketing leads join Modern Retail to debate whether declining reported influencer-marketing ROI reflects a real performance drop or simply more rigorous attribution than brands used previously.",
      },
    ],
    intelligence: {
      trendStage: "declining",
      testWindow: "No reliable window yet",
      testWindowRationale: "This is a measurement and strategy debate, not a time-bound creative trend — there is no bounded test window to recommend.",
      confidence: {
        level: "insufficient",
        evidenceCount: 2,
        evidenceType: "Two-guest opinion discussion; no shared dataset or named brand results",
        refreshedAt: "2026-08-04T18:00:00Z",
      },
      adaptationRisk: { level: "low", reason: "This is a measurement-methodology discussion, not a creative pattern — there is no creative-adaptation risk to assess." },
      bestFit: "Marketing leaders reassessing how they attribute influencer-driven conversions.",
      opportunityRead: "unclear",
      opportunityNote:
        "Both guests disagree on the underlying cause, and neither shares a dataset — treat this as a prompt to audit your own attribution, not as evidence either way.",
      creativeWhitespace: "Not established by this source — the episode is a measurement debate, not a documented creative pattern.",
      suggestedFirstTest: "Audit how your current influencer attribution model counts assisted conversions before concluding ROI has changed either direction.",
      whatNotToCopy: "Do not cut or scale influencer budget based on this episode alone — neither guest shares measured data, only opinion.",
      evidence: [
        { level: "observed", text: "Two DTC marketing leads share directly opposing views on the episode with no shared dataset cited." },
        { level: "suggested", text: "Use the episode as a prompt to audit your own attribution setup rather than as evidence of an industry-wide trend." },
      ],
    },
  },
];

// ═══════════════════════════════════════════════════════════════════════
// SEARCH & DEMAND — 4 items, type google_trend
//
// Correction B: relative interest index (0-100), never volume. `region` and
// `timeframe` travel with every item so the method is always visible
// alongside the number. The words "volume" and "searches" are avoided in
// all copy below — "relative interest" / "interest index" instead.
// ═══════════════════════════════════════════════════════════════════════

export const SEARCH_DEMAND: TrendItem[] = [
  {
    id: "sd-1",
    type: "google_trend",
    title: 'Relative Interest Rising Sharply for "Sustainable Activewear"',
    excerpt:
      'Relative interest in "sustainable activewear" has climbed steadily over the past 30 days, reaching the top of its own scale, driven by summer fitness seasonality and increased fast-fashion coverage.',
    thumbnail: "https://picsum.photos/seed/sd1act/600/340",
    publishedAt: "2026-08-13",
    industries: ["Activewear", "Sustainability"],
    topics: ["Google Trends", "Sustainability", "Activewear"],
    term: "sustainable activewear",
    interestIndex: 100,
    region: "United States (California, New York, Oregon)",
    timeframe: "Past 30 days",
    relatedQueries: ["eco-friendly gym wear", "recycled sportswear brands", "sustainable leggings"],
    sparkData: [20, 22, 25, 28, 32, 38, 48, 65, 80, 95, 100],
    bodyBlocks: [
      {
        kind: "p",
        text: '"Sustainable activewear" relative interest has risen steadily over the past 30 days to reach 100 on Google\'s 0-100 index for this term and timeframe — its highest point in the window. The index measures interest relative to the term\'s own peak, not absolute traffic, but the sustained climb over 30 days is a consistent, real signal.',
      },
    ],
    intelligence: {
      trendStage: "emerging",
      testWindow: "Next 7-14 days",
      testWindowRationale:
        "The index is still climbing without a visible plateau — the window to test before the trend either peaks or gets crowded by competitor creative referencing sustainability.",
      confidence: {
        level: "high",
        evidenceCount: 2,
        evidenceType: "Google Trends index, single-region cross-check across 3 states",
        refreshedAt: "2026-08-13T07:00:00Z",
      },
      adaptationRisk: {
        level: "low",
        reason: "Sustainability messaging in activewear is broadly applicable and carries low brand-specific risk, provided claims about materials or practices are accurate.",
      },
      bestFit: "Activewear and athleisure DTC brands with a genuine sustainability angle — recycled materials, verified supply chain, or take-back programs.",
      opportunityRead: "opportunity",
      opportunityNote:
        "The index is concentrated in 3 states so far, suggesting brands outside those regions have room to test the angle before it becomes a national baseline expectation.",
      creativeWhitespace: "Most competing creative in this space still leads with price or fit, not sustainability credentials — an opening for brands with a genuine story.",
      suggestedFirstTest: "Run a small paid test in California, New York, or Oregon using sustainability-forward creative language against your standard product-benefit creative.",
      whatNotToCopy: "Do not make a sustainability claim you cannot substantiate — this index reflects consumer interest in the topic, not permission to overstate your credentials.",
      evidence: [
        { level: "observed", text: 'Google Trends relative-interest index for "sustainable activewear" reached 100 (its own peak) as of Aug 13, 2026, across a 30-day window.' },
        { level: "corroborated", text: "The rise is consistent across all three top regions (California, New York, Oregon) rather than concentrated in one." },
      ],
    },
  },
  {
    id: "sd-2",
    type: "google_trend",
    title: '"AI Skincare Routine" Interest Climbing Steadily',
    excerpt:
      'Relative interest in "AI skincare routine" has grown steadily to 89 on the 0-100 index over the past 30 days, tracking the convergence of AI-powered app tools and personalized-beauty demand.',
    thumbnail: "https://picsum.photos/seed/sd2skin/600/340",
    publishedAt: "2026-08-13",
    industries: ["Beauty", "Skincare"],
    topics: ["Google Trends", "AI", "Skincare"],
    term: "AI skincare routine",
    interestIndex: 89,
    region: "United States (New York, Texas, Florida)",
    timeframe: "Past 30 days",
    relatedQueries: ["personalized skincare AI", "AI skin analysis app", "dermatologist AI"],
    sparkData: [40, 42, 44, 48, 52, 58, 64, 70, 75, 82, 89],
    bodyBlocks: [
      {
        kind: "p",
        text: '"AI skincare routine" relative interest has climbed from 40 to 89 on Google\'s index over the past 30 days. The steady, uninterrupted climb (no plateau yet) suggests this reflects a genuine and still-growing topic, not a single news-driven spike.',
      },
    ],
    intelligence: {
      trendStage: "growing",
      testWindow: "Next 14-21 days",
      testWindowRationale:
        "The index is still rising without a plateau; a slightly longer window than a fresh emerging term because the climb has been sustained for 30 days already, suggesting more durability.",
      confidence: {
        level: "medium",
        evidenceCount: 2,
        evidenceType: "Google Trends index only — no corroborating app-download or sales data available",
        refreshedAt: "2026-08-13T06:00:00Z",
      },
      adaptationRisk: { level: "low", reason: '"AI-powered" positioning is broadly usable across skincare brands as long as an actual personalization mechanism exists behind the claim.' },
      bestFit: "Skincare and beauty brands with a genuine personalization or diagnostic tool, app, or quiz.",
      opportunityRead: "opportunity",
      opportunityNote: "Interest is concentrated in three states so far — brands without a presence there have a chance to establish the angle before it spreads further.",
      creativeWhitespace: 'Most skincare brands mention "personalized" broadly; few explicitly reference AI-driven diagnostics in their ad copy yet.',
      suggestedFirstTest: 'If you have a skin-analysis quiz or tool, lead one ad variant explicitly with "AI" in the headline and compare against your standard "personalized" framing.',
      whatNotToCopy: 'Do not label a static quiz as "AI" if there is no actual model behind it — this invites scrutiny and erodes trust once discovered.',
      evidence: [
        { level: "observed", text: 'Google Trends relative-interest index for "AI skincare routine" rose from 40 to 89 over the past 30 days.' },
        { level: "inferred", text: "The steady, gradual climb (versus a sudden spike) suggests durable interest rather than a single viral event." },
      ],
    },
  },
  {
    id: "sd-3",
    type: "google_trend",
    title: '"Wireless Earbuds Under $50" Interest Fading as Buyers Trade Up',
    excerpt:
      'Relative interest in "wireless earbuds under $50" has declined from 95 to 62 on the 0-100 index over 30 days, consistent with a shift toward the $80-$120 price tier.',
    thumbnail: "https://picsum.photos/seed/sd3ear/600/340",
    publishedAt: "2026-08-13",
    industries: ["Consumer Electronics"],
    topics: ["Google Trends", "Earbuds", "Budget Electronics"],
    term: "wireless earbuds under $50",
    interestIndex: 62,
    region: "United States (Midwest, Southeast)",
    timeframe: "Past 30 days",
    relatedQueries: ["budget earbuds 2026", "cheap wireless earbuds", "affordable TWS earphones"],
    // Fixed: the source's declining term had a sparkline that rose again at
    // the very end (a real bug). This series now declines throughout.
    sparkData: [95, 90, 88, 85, 82, 80, 78, 74, 70, 68, 62],
    bodyBlocks: [
      {
        kind: "p",
        text: '"Wireless earbuds under $50" relative interest has fallen from 95 to 62 on Google\'s index over the past 30 days — a steady decline across the full window, not a single-week dip. The pattern is consistent with buyers trading up toward the $80-$120 price tier rather than a seasonal blip.',
      },
    ],
    intelligence: {
      trendStage: "declining",
      testWindow: "No reliable window yet",
      testWindowRationale:
        'A declining, multi-week trend is not a "test this now" opportunity — the more useful action is repositioning away from this price point, not timing a creative test around it.',
      confidence: {
        level: "high",
        evidenceCount: 2,
        evidenceType: "Google Trends index, consistent decline across full 30-day window and both peak regions",
        refreshedAt: "2026-08-13T04:00:00Z",
      },
      adaptationRisk: { level: "low", reason: "This is a demand-shift signal, not a creative pattern — there is no creative-adaptation risk, only a positioning decision." },
      bestFit: "Budget audio accessory brands deciding whether to hold or shift price-tier positioning.",
      opportunityRead: "saturated",
      opportunityNote: "The steady decline across the full window and both regions suggests this specific price-point framing is losing relevance, not just seasonally soft.",
      creativeWhitespace: "Not established by this source — the signal points to a price-tier shift, not an underused creative angle at this price point.",
      suggestedFirstTest: "If you sell in this category, test creative anchored to the $80-$120 tier instead of the sub-$50 framing, and compare engagement.",
      whatNotToCopy: 'Do not keep leading creative with "under $50" messaging if your catalog has moved upmarket — the framing itself now works against you.',
      evidence: [
        { level: "observed", text: "Google Trends relative-interest index for this term fell from 95 to 62 over 30 days, declining in nearly every weekly reading." },
        { level: "corroborated", text: "The decline is consistent across both peak regions (Midwest and Southeast), not concentrated in one." },
      ],
    },
  },
  {
    id: "sd-4",
    type: "google_trend",
    title: '"Summer Dress Trends 2026" Nearing Seasonal Peak',
    excerpt:
      'Relative interest in "summer dress trends 2026" has spiked to near its peak on the 0-100 index, with the curve now showing the first sign of a plateau after a rapid climb.',
    thumbnail: "https://picsum.photos/seed/sd4dress/600/340",
    publishedAt: "2026-08-13",
    industries: ["Fashion", "Apparel"],
    topics: ["Google Trends", "Seasonal", "Fashion"],
    term: "summer dress trends 2026",
    interestIndex: 97,
    region: "United States (New York, California, Texas, Florida)",
    timeframe: "Past 30 days",
    relatedQueries: ["maxi dress trends summer 2026", "floral dress 2026", "linen dress summer"],
    sparkData: [15, 18, 22, 30, 45, 62, 80, 92, 98, 100, 97],
    bodyBlocks: [
      {
        kind: "p",
        text: '"Summer dress trends 2026" relative interest rose rapidly from 15 to 100 over the past 30 days and has just ticked down to 97 — the first sign of a plateau after a sharp climb, consistent with a seasonal peak that is either at or just past its highest point.',
      },
    ],
    intelligence: {
      trendStage: "peaking",
      testWindow: "Next 2-5 days",
      testWindowRationale:
        "The index has just started to tick down from its peak — a narrow window remains before the seasonal tail-off makes new creative investment here less efficient.",
      confidence: {
        level: "high",
        evidenceCount: 2,
        evidenceType: "Google Trends index across full 30-day window and 4 peak regions",
        refreshedAt: "2026-08-13T03:00:00Z",
      },
      adaptationRisk: { level: "low", reason: "Seasonal fashion demand signals carry low creative-adaptation risk — the risk is timing (entering too late), not the creative itself." },
      bestFit: "Apparel brands with summer dress inventory ready to ship within days, not weeks.",
      opportunityRead: "unclear",
      opportunityNote: "The one-point dip could be normal week-to-week noise or the actual peak — too early to tell which from a single data point.",
      creativeWhitespace: "Not established by this source — this is a seasonal timing signal, not an underused creative angle.",
      suggestedFirstTest:
        "If inventory is ready now, launch immediately rather than waiting for confirmation that the peak has passed — by the time it's confirmed, the window will likely be closing.",
      whatNotToCopy: 'Do not delay a ready campaign to "wait and see" — seasonal peaks like this one are short, and confirmation typically arrives after the best window has passed.',
      evidence: [
        { level: "observed", text: "Google Trends relative-interest index rose from 15 to 100 over 30 days, then ticked to 97 in the most recent reading." },
        { level: "inferred", text: "The one-point dip after 3 consecutive readings near 100 is consistent with, but does not confirm, a seasonal peak having just passed." },
      ],
    },
  },
];

// ═══════════════════════════════════════════════════════════════════════
// OTHER SOCIAL TRENDS — 12 items: 3 each Instagram / YouTube / LinkedIn / X
// ═══════════════════════════════════════════════════════════════════════

export const OTHER_SOCIAL: TrendItem[] = [
  // ── Instagram ──
  {
    id: "ig-1",
    type: "instagram",
    title: '"Clean Girl" Aesthetic Resurging With Minimalist Product Styling',
    excerpt:
      'The "clean girl" aesthetic is resurging on Instagram with a renewed focus on minimalist product styling — white backgrounds, natural light, unfussy compositions.',
    thumbnail: "https://picsum.photos/seed/ig1/280/280",
    publishedAt: "2026-08-09",
    industries: ["Beauty", "Fashion"],
    topics: ["Instagram", "Clean Girl Aesthetic", "Minimalism"],
    handle: "@cleanlivinglina",
    metric1: "4.2M views",
    metric2: "380K likes",
    bodyBlocks: [
      {
        kind: "p",
        text: 'The "clean girl" aesthetic is resurging on Instagram with a renewed focus on minimalist product styling — white backgrounds, natural light, and unfussy compositions replacing the heavily art-directed flat-lays that dominated the format in prior cycles.',
      },
    ],
    intelligence: {
      trendStage: "growing",
      testWindow: "Next 14-21 days",
      testWindowRationale: "Aesthetic cycles on Instagram typically run several weeks before a visual style becomes the category default and stops differentiating.",
      confidence: {
        level: "medium",
        evidenceCount: 2,
        evidenceType: "Single-account engagement metrics; not yet cross-checked against other creators",
        refreshedAt: "2026-08-09T14:00:00Z",
      },
      adaptationRisk: { level: "low", reason: "Minimalist product photography is a widely accessible visual style, not tied to a specific brand or platform mechanic." },
      bestFit: "Beauty and fashion DTC brands with clean, simple packaging that photographs well against plain backgrounds.",
      opportunityRead: "opportunity",
      opportunityNote: "Brands still using heavily styled flat-lays have room to test a simpler visual approach while this aesthetic is climbing.",
      creativeWhitespace: "Most brand accounts still default to busy, heavily-propped product shots rather than this stripped-back style.",
      suggestedFirstTest: "Reshoot 3 of your top product images with plain backgrounds and natural light only, and compare saves against your current styled shots.",
      whatNotToCopy: "Do not copy the specific prop-free styling if your product genuinely needs context (scale, use-case) to make sense to a new customer.",
      evidence: [
        { level: "observed", text: "4.2M views and 380K likes on this single creator's recent minimalist-styling content." },
        { level: "suggested", text: "Test the stripped-back styling on your own account before assuming it transfers — this reading is based on one account's results." },
      ],
    },
  },
  {
    id: "ig-2",
    type: "instagram",
    title: "Brand Collabs Driving 3x Higher Saves Than Solo Posts This Month",
    excerpt:
      "Co-branded Instagram content — where two non-competing brands post together — is generating meaningfully higher save rates than single-brand content.",
    thumbnail: "https://picsum.photos/seed/ig2/280/280",
    publishedAt: "2026-08-06",
    industries: ["Fashion", "Lifestyle"],
    topics: ["Instagram", "Brand Collab", "Co-Marketing"],
    handle: "@studystyle",
    metric1: "1.8M impressions",
    metric2: "92K saves",
    bodyBlocks: [
      {
        kind: "p",
        text: "Co-branded Instagram content, where two non-competing brands post together, is generating a reported 3x higher save rate than single-brand posts from the same accounts this month, based on this creator's recent collab posts versus their solo posts.",
      },
    ],
    intelligence: {
      trendStage: "growing",
      testWindow: "Next 21-30 days",
      testWindowRationale: "Co-marketing partnerships take longer to set up and don't saturate as quickly as single-creator hook trends, giving a longer practical window.",
      confidence: {
        level: "low",
        evidenceCount: 2,
        evidenceType: "Single-account before/after comparison; sample size and methodology not disclosed",
        refreshedAt: "2026-08-06T15:00:00Z",
      },
      adaptationRisk: { level: "low", reason: "Co-marketing between non-competing brands is a well-established, low-risk practice with no platform-specific mechanic to misuse." },
      bestFit: "DTC brands with an adjacent, non-competing brand partner and overlapping but distinct audiences.",
      opportunityRead: "opportunity",
      opportunityNote: "The \"3x\" figure comes from one account's own before/after comparison — a real signal worth testing, not yet a confirmed category-wide multiplier.",
      creativeWhitespace: "Most brand accounts still post solo content by default rather than actively seeking non-competing co-marketing partners.",
      suggestedFirstTest: "Identify one non-competing brand with an overlapping audience and co-produce a single piece of content; compare saves against your recent solo posts.",
      whatNotToCopy: 'Do not assume the "3x saves" figure will replicate exactly — treat it as directional evidence that collabs help, not a guaranteed multiplier.',
      evidence: [
        { level: "observed", text: "This creator's co-branded post reached 92K saves versus a reported lower baseline for solo posts, per the account's own comparison." },
        { level: "suggested", text: "Run your own solo-vs-collab comparison before relying on the reported 3x figure, since methodology and sample size are not disclosed." },
      ],
    },
  },
  {
    id: "ig-3",
    type: "instagram",
    title: "Behind-the-Scenes Founder Content Outperforms Polished Brand Posts 2:1",
    excerpt:
      "Raw, unpolished behind-the-scenes content from founders and small teams is outperforming professionally produced brand photography on this account.",
    thumbnail: "https://picsum.photos/seed/ig3/280/280",
    publishedAt: "2026-08-11",
    industries: ["Founder-Led Brands", "Lifestyle"],
    topics: ["Instagram", "Behind the Scenes", "Founder Content"],
    handle: "@founderjourney",
    metric1: "2.1M reach",
    metric2: "210K likes",
    bodyBlocks: [
      {
        kind: "p",
        text: "Raw, unpolished behind-the-scenes content from founders and small teams is reportedly outperforming professionally produced brand photography by roughly 2:1 on reach for this account, continuing a broader shift toward founder-forward, less produced content.",
      },
    ],
    intelligence: {
      trendStage: "emerging",
      testWindow: "Next 14-21 days",
      testWindowRationale: "Founder-forward content is still building momentum without a visible plateau in this sample — an emerging-stage window applies.",
      confidence: {
        level: "low",
        evidenceCount: 2,
        evidenceType: "Single-account reach comparison; no independent corroboration",
        refreshedAt: "2026-08-11T11:00:00Z",
      },
      adaptationRisk: {
        level: "medium",
        reason: "This format depends on having a founder or small team willing to appear unpolished on camera — not every brand has that available or wants that positioning.",
      },
      bestFit: "Founder-led or small-team DTC brands where the founder is comfortable being the face of the brand.",
      opportunityRead: "opportunity",
      opportunityNote: "Most brands with an available founder still default to polished, agency-produced content rather than testing rawer behind-the-scenes posts.",
      creativeWhitespace: "Brands with an available, camera-comfortable founder are underusing that asset in favor of fully produced content.",
      suggestedFirstTest: "Post one unedited, phone-shot clip of your founder or team doing real work, and compare reach against your last 3 produced posts.",
      whatNotToCopy: "Do not force a founder who is visibly uncomfortable on camera into this format — the authenticity is the entire mechanism, and it shows when forced.",
      evidence: [
        { level: "observed", text: "This account's behind-the-scenes posts reached 2.1M with 210K likes, roughly double the account's own average for produced content." },
        { level: "inferred", text: "The 2:1 ratio is based on one account's internal comparison and has not been checked against other founder-led accounts." },
      ],
    },
  },
  // ── YouTube ──
  {
    id: "yt-1",
    type: "youtube",
    title: "Long-Form Product Reviews (20+ Min) Dominating Purchase-Intent Searches",
    excerpt:
      "Detailed, 20-minute-plus product reviews are outperforming shorter YouTube content for high-purchase-intent search terms.",
    thumbnail: "https://picsum.photos/seed/yt1/280/157",
    publishedAt: "2026-08-08",
    industries: ["Consumer Electronics"],
    topics: ["YouTube", "Long-Form Review", "Purchase Intent"],
    channel: "TechReviewHQ",
    metric1: "8.4M views",
    metric2: "94K likes",
    bodyBlocks: [
      {
        kind: "p",
        text: 'Detailed, 20-minute-plus product reviews are outperforming shorter YouTube content when viewers arrive via high-purchase-intent search terms (comparison and "should I buy" queries), based on this channel\'s recent upload performance.',
      },
    ],
    intelligence: {
      trendStage: "growing",
      testWindow: "Next 21-30 days",
      testWindowRationale: "Long-form review formats build search authority gradually rather than spiking, giving a longer practical window than a fast-moving hook trend.",
      confidence: {
        level: "medium",
        evidenceCount: 2,
        evidenceType: "Single-channel view/like data; category-wide comparison not available",
        refreshedAt: "2026-08-08T09:00:00Z",
      },
      adaptationRisk: { level: "low", reason: "Long-form review content is a well-established YouTube format with no platform-specific mechanic to misuse." },
      bestFit: "Consumer electronics, appliance, or considered-purchase brands that can supply or sponsor a genuinely thorough review.",
      opportunityRead: "opportunity",
      opportunityNote: "Most brand-sponsored YouTube content is still under 5 minutes; a genuinely thorough long-form sponsored review is comparatively rare.",
      creativeWhitespace: "Brand-sponsored long-form (20+ min) reviews are rare compared to shorter sponsored segments — most brands underinvest in this length.",
      suggestedFirstTest: "Sponsor one genuinely thorough 20+ minute review with a credible reviewer, and track views arriving from comparison-style search terms specifically.",
      whatNotToCopy: "Do not script a sponsored review to avoid any negative points — the format's credibility (and search performance) depends on it reading as genuinely thorough, not promotional.",
      evidence: [
        { level: "observed", text: "This channel's 20+ minute reviews reached 8.4M views and 94K likes, well above the channel's shorter-format uploads." },
        { level: "suggested", text: "Confirm this pattern holds for at least one more channel in your category before committing sponsorship budget based on a single data point." },
      ],
    },
  },
  {
    id: "yt-2",
    type: "youtube",
    title: '"Day in My Life" Brand Integrations Outpacing Traditional Pre-Roll',
    excerpt:
      '"Day in my life" format brand integrations, where the product appears naturally within vlog-style content, are generating stronger brand recall than traditional pre-roll ads.',
    thumbnail: "https://picsum.photos/seed/yt2/280/157",
    publishedAt: "2026-08-05",
    industries: ["Lifestyle", "Consumer Goods"],
    topics: ["YouTube", "Vlog Integration", "Brand Recall"],
    channel: "WithLilyDaily",
    metric1: "3.6M views",
    metric2: "41K likes",
    bodyBlocks: [
      {
        kind: "p",
        text: '"Day in my life" format brand integrations — where a product appears naturally within vlog-style content rather than as a separate ad break — are reportedly generating stronger brand recall than traditional pre-roll placements for this creator\'s sponsors.',
      },
    ],
    intelligence: {
      trendStage: "peaking",
      testWindow: "Next 5-10 days",
      testWindowRationale: "The format is described as peaking; the differentiated-entry window for new brand integrations of this style is narrowing as more sponsors adopt it.",
      confidence: {
        level: "low",
        evidenceCount: 2,
        evidenceType: "Creator-reported recall claim; no independent brand-recall study cited",
        refreshedAt: "2026-08-05T13:00:00Z",
      },
      adaptationRisk: {
        level: "medium",
        reason: "Recall claims of this kind are typically self-reported by the creator or sponsor and not independently measured — treat the specific lift figure with caution.",
      },
      bestFit: "Consumer goods brands willing to appear naturally within a creator's routine rather than as a distinct ad segment.",
      opportunityRead: "unclear",
      opportunityNote: "The recall advantage is plausible given how the format works, but it rests on a creator-reported claim rather than an independently measured study.",
      creativeWhitespace: "Not established with confidence by this source — the specific recall-lift figure is unverified.",
      suggestedFirstTest: 'Sponsor one "day in my life" integration and run a simple brand-recall survey against a comparable pre-roll placement to check the claim yourself.',
      whatNotToCopy: "Do not take the recall-lift figure at face value in a media plan — verify with your own measurement before allocating meaningful budget to this claim.",
      evidence: [
        { level: "observed", text: "This creator's integration videos reached 3.6M views, in line with their regular upload performance." },
        { level: "suggested", text: "Run an independent brand-recall check before treating the reported recall advantage as established." },
      ],
    },
  },
  {
    id: "yt-3",
    type: "youtube",
    title: "Documentary-Style Brand Storytelling Hits Standout Engagement",
    excerpt:
      "Brand documentary content — 10-30 minute narrative explorations of company origin, mission, or product development — is a breakout format on YouTube.",
    thumbnail: "https://picsum.photos/seed/yt3/280/157",
    publishedAt: "2026-08-02",
    industries: ["Brand Marketing"],
    topics: ["YouTube", "Documentary", "Brand Storytelling"],
    channel: "BrandStory Films",
    metric1: "12.1M views",
    metric2: "189K likes",
    bodyBlocks: [
      {
        kind: "p",
        text: "Brand documentary content — 10 to 30 minute narrative explorations of a company's origin, mission, or product-development process — is generating standout engagement on this channel relative to shorter explainer-style brand videos.",
      },
    ],
    intelligence: {
      trendStage: "emerging",
      testWindow: "Next 21-30 days",
      testWindowRationale: "Documentary-style content requires meaningful production lead time, so the practical test window is longer than faster-moving social formats.",
      confidence: {
        level: "medium",
        evidenceCount: 2,
        evidenceType: "Single-channel view/like comparison against the channel's own explainer content",
        refreshedAt: "2026-08-02T10:00:00Z",
      },
      adaptationRisk: {
        level: "medium",
        reason: "This format requires a genuinely interesting origin or process story and real production investment — not every brand has the material or budget to execute it well.",
      },
      bestFit: "Brands with a distinctive founding story, manufacturing process, or mission worth a longer narrative treatment, and the budget to produce it.",
      opportunityRead: "opportunity",
      opportunityNote: "Most brands with an interesting story still default to a short explainer video rather than investing in the longer documentary treatment this data favors.",
      creativeWhitespace: "Few mid-market brands invest in documentary-length storytelling; most cap brand video length well under 10 minutes.",
      suggestedFirstTest:
        "Produce a single 12-15 minute documentary-style piece on one genuinely interesting aspect of your process or origin, and compare engagement to your usual short-form brand video.",
      whatNotToCopy: "Do not stretch a thin story to fill 20+ minutes just to match the format — a padded documentary underperforms a tight 8-minute one.",
      evidence: [
        { level: "observed", text: "This channel's documentary-style uploads reached 12.1M views and 189K likes, above the channel's explainer-format content." },
        { level: "suggested", text: "Confirm the format's engagement advantage holds outside this one channel before committing significant production budget." },
      ],
    },
  },
  // ── LinkedIn ──
  {
    id: "li-1",
    type: "linkedin",
    title: "B2B Thought Leadership Posts With Revenue Specifics Getting Far Wider Reach",
    excerpt:
      "LinkedIn posts that include specific revenue, growth-percentage, or measurable business-outcome data are meaningfully outperforming generic thought-leadership posts.",
    thumbnail: "https://picsum.photos/seed/li1/280/280",
    publishedAt: "2026-08-07",
    industries: ["B2B", "SaaS"],
    topics: ["LinkedIn", "Thought Leadership", "Revenue Data"],
    author: "Sarah Chen, CMO @ Velocity",
    metric1: "180K impressions",
    metric2: "4.2K comments",
    bodyBlocks: [
      {
        kind: "p",
        text: "LinkedIn posts that include specific revenue figures, growth percentages, or other measurable business-outcome data are reaching significantly wider audiences than generic thought-leadership posts from the same author, based on this account's recent post performance.",
      },
    ],
    intelligence: {
      trendStage: "growing",
      testWindow: "Next 21-30 days",
      testWindowRationale: "B2B content patterns on LinkedIn tend to have longer engagement cycles than consumer social formats, supporting a longer test window.",
      confidence: {
        level: "medium",
        evidenceCount: 2,
        evidenceType: "Single-author before/after post comparison",
        refreshedAt: "2026-08-07T09:00:00Z",
      },
      adaptationRisk: {
        level: "medium",
        reason: "Sharing specific revenue or growth figures requires internal approval and comfort with disclosure — not every company can or will share real numbers publicly.",
      },
      bestFit: "B2B leaders and companies comfortable sharing directional revenue or growth metrics publicly.",
      opportunityRead: "opportunity",
      opportunityNote: "Most executive LinkedIn content stays abstract rather than citing specific numbers, leaving room for leaders willing to disclose real figures.",
      creativeWhitespace: 'Most B2B thought-leadership posts stay abstract ("we grew significantly") rather than citing a specific, real number.',
      suggestedFirstTest: "Write one post with a single specific, real metric from the last quarter instead of a general claim, and compare impressions to your recent abstract posts.",
      whatNotToCopy: "Do not fabricate or round a figure to sound more impressive — LinkedIn audiences in B2B frequently ask for sourcing in comments.",
      evidence: [
        { level: "observed", text: "This author's revenue-specific post reached 180K impressions and 4.2K comments, above their typical post performance." },
        { level: "suggested", text: "Test this on your own account before assuming the pattern transfers — this reading is based on one author's comparison." },
      ],
    },
  },
  {
    id: "li-2",
    type: "linkedin",
    title: '"I Was Wrong About X" Posts Generating Unusually High Comment Rates',
    excerpt:
      "Vulnerability-forward posts where professionals admit a past business mistake or changed opinion are generating unusually high comment rates on LinkedIn.",
    thumbnail: "https://picsum.photos/seed/li2/280/280",
    publishedAt: "2026-08-10",
    industries: ["B2B", "Founder-Led Brands"],
    topics: ["LinkedIn", "Vulnerability", "Comment Engagement"],
    author: "Marcus Williams, Founder",
    metric1: "94K impressions",
    metric2: "2.8K comments",
    bodyBlocks: [
      {
        kind: "p",
        text: "Vulnerability-forward posts, where a professional admits a past business mistake or a changed opinion, are generating an unusually high comment rate for this founder relative to their typical posts.",
      },
    ],
    intelligence: {
      trendStage: "emerging",
      testWindow: "Next 14-21 days",
      testWindowRationale: "Vulnerability-forward posting is still emerging on LinkedIn without a clear plateau in this sample, supporting an emerging-stage window.",
      confidence: {
        level: "low",
        evidenceCount: 2,
        evidenceType: "Single-author post; no comparison against the author's other post types disclosed in detail",
        refreshedAt: "2026-08-10T09:00:00Z",
      },
      adaptationRisk: {
        level: "medium",
        reason: 'This format requires an actual, credible mistake or changed opinion to admit to — a fabricated or trivial "mistake" reads as manufactured vulnerability and can backfire.',
      },
      bestFit: "Founders or executives with a genuine past misstep or changed opinion worth sharing publicly.",
      opportunityRead: "opportunity",
      opportunityNote: "Most executive content still avoids admitting mistakes publicly, leaving room for leaders willing to share something genuine.",
      creativeWhitespace: "Most executive LinkedIn content avoids admitting fault; genuine vulnerability posts remain comparatively rare.",
      suggestedFirstTest: "Write about one real, specific business mistake and what changed your mind, avoiding a manufactured or overly minor example.",
      whatNotToCopy: "Do not manufacture a trivial \"mistake\" for engagement — audiences can tell the difference, and it undermines the credibility the format depends on.",
      evidence: [
        { level: "observed", text: "This author's post reached 94K impressions and 2.8K comments, a comment rate the author described as unusually high for them." },
        { level: "suggested", text: "Treat this as one data point — confirm your own audience responds similarly before building a content strategy around it." },
      ],
    },
  },
  {
    id: "li-3",
    type: "linkedin",
    title: "Independent Job-Market Reports Outperforming Official Platform Data",
    excerpt:
      "Third-party job-market analysis and hiring-trend reports are generating more organic reach on LinkedIn than official platform data posts.",
    thumbnail: "https://picsum.photos/seed/li3/280/280",
    publishedAt: "2026-08-06",
    industries: ["HR Tech", "Recruiting"],
    topics: ["LinkedIn", "Job Market Data", "Independent Research"],
    author: "Talent Trends Weekly",
    metric1: "220K impressions",
    metric2: "3.1K shares",
    bodyBlocks: [
      {
        kind: "p",
        text: "Third-party job-market analysis and hiring-trend reports are generating more organic reach on LinkedIn than official platform-sourced data posts, based on this account's comparison of its own independent research posts against posts citing platform statistics.",
      },
    ],
    intelligence: {
      trendStage: "growing",
      testWindow: "Next 21-30 days",
      testWindowRationale: "Research-and-report content builds audience trust gradually; the practical test window is longer than a fast-moving hook format.",
      confidence: {
        level: "low",
        evidenceCount: 2,
        evidenceType: "Single-account comparison of its own posts; no cross-account corroboration",
        refreshedAt: "2026-08-06T09:00:00Z",
      },
      adaptationRisk: { level: "low", reason: "Publishing independent research is a low-risk, well-established content format with no platform-specific mechanic to misuse." },
      bestFit: "HR tech, recruiting, and talent-focused companies with the capacity to produce original data analysis.",
      opportunityRead: "opportunity",
      opportunityNote: "Most companies in this space still cite official platform statistics rather than producing original analysis, leaving room for a differentiated research angle.",
      creativeWhitespace: "Most recruiting and HR tech content cites official platform data rather than producing original independent analysis.",
      suggestedFirstTest: "Publish one piece of original data analysis (even a small internal dataset) and compare its reach to your recent posts citing third-party or platform statistics.",
      whatNotToCopy: "Do not present a small, non-representative dataset as if it were a comprehensive market study — disclose sample size and scope honestly.",
      evidence: [
        { level: "observed", text: "This account's original-research post reached 220K impressions and 3.1K shares, above its posts citing official platform data." },
        { level: "suggested", text: "Confirm this pattern on your own account before generalizing — this reading is based on one account's internal comparison." },
      ],
    },
  },
  // ── X ──
  {
    id: "x-1",
    type: "x",
    title: "#SummerCampaignFails Trending as Brands Face Backlash for Tone-Deaf Ads",
    excerpt:
      "#SummerCampaignFails is trending on X as several major brand campaigns face public criticism for cultural insensitivity or disconnection from current consumer mood.",
    thumbnail: "https://picsum.photos/seed/x1/280/157",
    publishedAt: "2026-08-12",
    industries: ["Brand Marketing", "Crisis Communications"],
    topics: ["X", "Backlash", "Tone-Deaf Advertising"],
    handle: "@adwatch",
    metric1: "42M impressions",
    metric2: "180K posts",
    bodyBlocks: [
      {
        kind: "p",
        text: "#SummerCampaignFails is trending on X as several major brand campaigns face public criticism for cultural insensitivity or being out of step with the current consumer mood, with commentary accounts compiling examples into viral threads.",
      },
    ],
    intelligence: {
      trendStage: "peaking",
      testWindow: "No reliable window yet",
      testWindowRationale: "This is a reputational-risk signal, not a creative pattern to test — the relevant action is a pre-launch review, not a timed creative experiment.",
      confidence: {
        level: "medium",
        evidenceCount: 2,
        evidenceType: "Hashtag volume and impression count from platform trend tracking",
        refreshedAt: "2026-08-12T18:00:00Z",
      },
      adaptationRisk: {
        level: "high",
        reason: "This is a cautionary signal about specific campaigns, not a format to adapt — treating it as inspiration risks reputational damage rather than differentiation.",
      },
      bestFit: "Any brand marketing or legal review team doing pre-launch sensitivity checks on upcoming campaigns.",
      opportunityRead: "unclear",
      opportunityNote: "This is primarily a risk signal rather than an opportunity — the actionable takeaway is a review checklist, not a creative angle to copy.",
      creativeWhitespace: "Not applicable — this trend documents what to avoid, not an underused creative opportunity.",
      suggestedFirstTest: "Add a specific cultural-sensitivity and current-events review step to your pre-launch checklist, referencing the specific complaints raised in this thread.",
      whatNotToCopy: "Do not treat any of the called-out campaigns as creative inspiration — the entire trend is about what went wrong with them.",
      evidence: [
        { level: "observed", text: "#SummerCampaignFails reached 42M impressions across roughly 180K posts, per platform trend tracking." },
        { level: "corroborated", text: "Multiple named campaigns are cited independently across different commentary threads, not just one source." },
      ],
    },
  },
  {
    id: "x-2",
    type: "x",
    title: "Live Shopping Stream Commentary Driving Organic Conversation for Early Movers",
    excerpt:
      "Brands hosting or sponsoring live shopping streams are generating significant organic X conversation, particularly when commentary is humorous or self-aware.",
    thumbnail: "https://picsum.photos/seed/x2/280/157",
    publishedAt: "2026-08-11",
    industries: ["E-commerce", "Live Commerce"],
    topics: ["X", "Live Shopping", "Organic Conversation"],
    handle: "@shopstreamwatch",
    metric1: "8.4M impressions",
    metric2: "42K replies",
    bodyBlocks: [
      {
        kind: "p",
        text: "Brands hosting or sponsoring live shopping streams are generating meaningful organic X conversation around the streams, particularly when the on-stream commentary is humorous or self-aware rather than purely promotional.",
      },
    ],
    intelligence: {
      trendStage: "emerging",
      testWindow: "Next 14-21 days",
      testWindowRationale: "Live shopping commentary as an organic conversation driver is still emerging on X, with room for early movers before the tactic becomes common.",
      confidence: {
        level: "low",
        evidenceCount: 2,
        evidenceType: "Single-account impression/reply tracking; no independent measurement of conversation quality",
        refreshedAt: "2026-08-11T16:00:00Z",
      },
      adaptationRisk: { level: "low", reason: "This is an organic engagement tactic tied to hosting style, not a paid-creative risk — the downside of an unsuccessful stream is limited." },
      bestFit: "E-commerce brands already running or considering live shopping streams with a host comfortable being unscripted.",
      opportunityRead: "opportunity",
      opportunityNote:
        "Most brand live-shopping streams still read as scripted and promotional; self-aware, humorous hosting is comparatively rare and appears to travel better on X.",
      creativeWhitespace: "Most brand live-shopping streams read as scripted; self-aware, humorous hosting is comparatively rare.",
      suggestedFirstTest: "Brief your host to react candidly and humorously to real-time chat during one stream segment, and track X mentions/replies against a more scripted segment.",
      whatNotToCopy: 'Do not script "spontaneous" humor in advance — audiences on X tend to call out commentary that reads as rehearsed.',
      evidence: [
        { level: "observed", text: "This account tracked 8.4M impressions and 42K replies around live-shopping stream commentary." },
        { level: "suggested", text: "Confirm which specific streams drove the conversation before generalizing — this reading aggregates multiple streams without per-stream detail." },
      ],
    },
  },
  {
    id: "x-3",
    type: "x",
    title: "Creator-Brand Public Breakup Posts Outperforming Partnership Announcements",
    excerpt:
      "Creators publicly ending brand partnerships are generating more X engagement than initial partnership-announcement posts — a signal of shifting creator-audience dynamics.",
    thumbnail: "https://picsum.photos/seed/x3/280/157",
    publishedAt: "2026-08-09",
    industries: ["Creator Economy", "Influencer Marketing"],
    topics: ["X", "Creator Economy", "Brand Partnerships"],
    handle: "@creatoreconomy",
    metric1: "22M impressions",
    metric2: "95K posts",
    bodyBlocks: [
      {
        kind: "p",
        text: "Creators publicly ending brand partnerships are generating more X engagement than the original partnership-announcement posts, based on tracked impression and post-volume comparisons — a signal that audiences may be more invested in creator independence than in the partnership itself.",
      },
    ],
    intelligence: {
      trendStage: "growing",
      testWindow: "No reliable window yet",
      testWindowRationale: "This is an audience-behavior observation about creator dynamics, not a format brands can test directly — there is no creative experiment to time here.",
      confidence: {
        level: "low",
        evidenceCount: 2,
        evidenceType: "Aggregated impression/post-volume tracking; underlying methodology not disclosed",
        refreshedAt: "2026-08-09T12:00:00Z",
      },
      adaptationRisk: {
        level: "low",
        reason: "This is an observational signal about creator-audience dynamics, not a creative format brands execute directly — there is minimal direct adaptation risk.",
      },
      bestFit: "Brands and agencies managing ongoing creator partnerships, as context for partnership planning and exit terms.",
      opportunityRead: "unclear",
      opportunityNote: "The takeaway is more about creator-partnership dynamics than a specific brand action — worth awareness, not a direct creative test.",
      creativeWhitespace: "Not applicable in the usual sense — this is a signal about audience-creator dynamics, not an underused creative angle for brands to adopt.",
      suggestedFirstTest:
        "Not a brand-side creative test — instead, factor this dynamic into how partnership exits are handled publicly, since audience reaction to the breakup itself is evidently significant.",
      whatNotToCopy:
        'Do not stage a fake "breakup" with a creator for engagement — this would be a disclosed material fact under FTC endorsement guidelines and reads as manipulative if uncovered.',
      evidence: [
        { level: "observed", text: "Tracked impressions show creator breakup posts (22M) outperforming this account's tracked partnership-announcement posts." },
        { level: "suggested", text: "Treat this as directional context for partnership planning rather than a call to action, since the underlying tracking methodology is not disclosed." },
      ],
    },
  },
];

// ═══════════════════════════════════════════════════════════════════════
// Combined export + lookup
// ═══════════════════════════════════════════════════════════════════════

const RAW_ALL_TRENDS: TrendItem[] = [
  ...BREAKING_STORIES,
  ...META_ADS,
  ...TIKTOK_HOOKS,
  ...NEWS_ITEMS,
  ...SEARCH_DEMAND,
  ...OTHER_SOCIAL,
];

/** Flattened, de-duplicated by id (first occurrence wins). */
export const ALL_TRENDS: TrendItem[] = Array.from(
  RAW_ALL_TRENDS.reduce((map, item) => {
    if (!map.has(item.id)) map.set(item.id, item);
    return map;
  }, new Map<string, TrendItem>()).values(),
);

export function getTrendById(id: string): TrendItem | undefined {
  return ALL_TRENDS.find((item) => item.id === id);
}
