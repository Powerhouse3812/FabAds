# Hub design locks

## Layout — 6 zones top-to-bottom
1. **Ops bar** (sticky, 72px) — 5 KPI tiles
2. **Needs attention** (conditional, only shown if >0) — capped at 4 rows + "View all (N)" link
3. **Live launches** — 3-up card grid (max 6 with "View all" link to History)
4. **Start a launch** — strategy tag chips + "Blank launch" (lightly affordant)
5. **Drafts** — resume mid-wizard
6. **Recent (7 days)** — tag-filterable list

## Content rules
- Title: **"Launches"** (drop "v2" — internal noise)
- No subtitle under H1
- All values in **USD with `$` symbol** (e.g., `$1,240/day`)
- Conversion FX: daily-fetched, cached 24h. Tooltip: "Converted at $1 = ₹84 · updated 6h ago"

## Killed from current Hub
- "Quick actions" 4-tile row
- Auto launch · Soon tile
- Templates tile (redundant with sidebar + wizard step)
- History tile (redundant with sidebar)
- Subtitle "Build and ship Meta campaigns…"
- Big green "+ New launch" header button → demoted to smaller `+ Launch`

## Empty states
- **Zero launches ever:** single centered panel "No launches yet. Start your first — it'll show up here in real time." CTA: Start a launch / Browse strategies
- **Needs attention zero:** hide zone entirely (don't reserve space)
- **Live launches zero:** collapse to single line "No live launches. Last finished 2h ago — Q2-Scale-V3 →"

## Open
- Strategy tag chips on Zone 4: which 3 tags surface by default? (Recency × frequency vs user-pinned vs alphabetical?)
- Ops bar tile when only 1 currency in use: still show "$" symbol or drop?
