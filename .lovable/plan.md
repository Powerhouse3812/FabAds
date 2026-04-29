

## Industry Insights AI Research Assistant

### Overview
Add an AI-powered research assistant inside Industry Insights that helps users analyse ads, brands, domains, and pages. It lives inside the Ad Detail Drawer (on-demand) and also has a standalone entry point on Insights pages for independent brand research.

### Architecture

```text
┌─────────────────────────────────────────────────────────┐
│  Ad Detail Drawer (existing)                            │
│  ┌──────────────┬──────────────────────────────────────┐ │
│  │  Ad Preview   │  Data Panel                         │ │
│  │  (40%)        │  Stats / Tags / Demographics        │ │
│  │               │  ...                                │ │
│  │               │  [🤖 Ask AI] button                 │ │
│  │               │  ┌────────────────────────────────┐ │ │
│  │               │  │ AI Chat Section (collapsible)  │ │ │
│  │               │  │ Fixed chips: Save | Download   │ │ │
│  │               │  │   | Generate Variation | Copy  │ │ │
│  │               │  │ + Contextual chips from AI     │ │ │
│  │               │  │ [Chat messages]                │ │ │
│  │               │  │ [Input bar]                    │ │ │
│  │               │  └────────────────────────────────┘ │ │
│  └──────────────┴──────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘

Standalone entry (Intelligence / Discover page header):
┌──────────────────────────────────────────┐
│ [🔍 Research a Brand...] button/search   │
│ Opens a slide-over panel with:           │
│  - Brand/domain search input             │
│  - AI chat (same component, no ad ctx)   │
│  - Fixed chips: Top Ads | Report | Excel │
└──────────────────────────────────────────┘
```

### Feature Breakdown

**1. AI Chat Inside Ad Detail Drawer**
- "Ask AI" button in the DataPanel action row
- Clicking reveals a collapsible chat section at the bottom of the right column
- AI has full context of the ad being viewed (brand, domain, stats, copy, media type)
- For video ads: "Analyse Video" chip → shows quick AI summary in chat → "Open in Video Sage" link navigates to `/iq/video-sage` with video URL pre-filled

**2. Suggestion Chips**
- **Fixed row (always visible):** Save to Board, Download Ad, Generate Variation, Copy Ad Text
- **Contextual (AI appends after responses):** e.g. "Show similar ads", "Compare with competitor", "Analyse video" (video only), "Export as Excel"

**3. Chip Actions**
- **Save to Board** → opens existing `SaveToBoardModal`
- **Download** → downloads the ad media
- **Generate Variation** → opens Genie 5.0 in new tab at `/iq/genie5?ref_url={mediaUrl}&category={industry}&mode=affiliate`
- **Copy Ad Text** → copies headline + primary text + description to clipboard
- **Analyse Video** (video ads only) → AI gives quick summary in chat, then offers link to Video Sage

**4. Standalone Brand Research**
- "Research a Brand" button on Intelligence and Discover page headers
- Opens a `Sheet` (slide-over panel) with the same AI chat component but no ad context
- User types any brand/domain name
- AI can: show top spending ads, generate reports inline (tables/charts), offer Excel/PDF download
- Uses existing Insights dummy data + can reference "external search" results (dummy for now)

**5. Research Outputs**
- Inline preview in chat: formatted tables, mini cards, stats
- Download button on each output for full Excel/PDF file (dummy/toast for now — "Download started")

### Technical Approach

- **New edge function `insights-ai-chat`**: Calls Lovable AI Gateway with Insights-specific system prompt containing ad context, brand data, and available actions
- **New component `InsightsAIChat.tsx`**: Reusable chat section with fixed + contextual chips, message list, input bar
- **New component `InsightsBrandResearchPanel.tsx`**: Sheet wrapper for standalone brand research
- **New hook `use-insights-ai.ts`**: Manages chat state, streaming, chip actions, and context injection
- Uses same streaming pattern as existing `copilot-chat` but with Insights-specific system prompt

### Files

| File | Change |
|------|--------|
| `src/components/insights/InsightsAIChat.tsx` | **New** — reusable AI chat with fixed + contextual chips, message rendering, inline tables |
| `src/components/insights/InsightsAIChatChips.tsx` | **New** — fixed action chips row + contextual suggestion chips from AI |
| `src/components/insights/InsightsBrandResearchPanel.tsx` | **New** — Sheet wrapper for standalone brand research entry |
| `src/components/insights/InsightAdDetailDrawer.tsx` | Add "Ask AI" button + collapsible `InsightsAIChat` section in DataPanel |
| `src/pages/insights/InsightsIntelligence.tsx` | Add "Research a Brand" button in header |
| `src/pages/insights/InsightsDiscover.tsx` | Add "Research a Brand" button in header |
| `src/hooks/use-insights-ai.ts` | **New** — chat state, streaming, context builder, action handlers |
| `supabase/functions/insights-ai-chat/index.ts` | **New** — edge function with Insights system prompt, streaming via Lovable AI Gateway |

