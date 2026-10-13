# Industry Insights v3 — build pack

Everything the build session needs. Read in this order.

| File | What it is | Authority |
|---|---|---|
| `00-BUILD-PROMPT.md` | How the build runs: orchestrator, agents, phases, rules | Process |
| `01-prd-and-ia.md` | What and why: goals, scope, IA, flows, data rules, surfaces that change | **Source of truth** |
| `02-page-specs.md` | What sits on each screen, in what order, how it behaves | **Source of truth** |
| `img/` | Diagrams from the docs (sitemap, user flows, shared page pattern) | Visual aid |
| `reference/advault-*.md` | Raw inventory of AdVault (data model, AI score, vocabularies, pages) | Reference only |

Live versions (may be newer than these files):

- PRD & IA: https://claude.ai/code/artifact/8a68017f-86fe-4369-a3df-ba501d0f10df
- Page Specs: https://claude.ai/code/artifact/734e12a8-8e72-4173-a40c-e52cedfb857e

Rules for using this pack:

- **Docs beat reference.** If AdVault does it differently, the docs win.
- **Reference is for data, not UI.** Use it for vocabularies (industries, categories, frameworks, hooks, angles, concepts), the AI score model and field names. Don't copy AdVault screens.
- **Spy-tool / source names in `reference/` never reach the UI** (AdSpy, ForePlay, BigSpy, Meta Ad Library etc.).
- **All open questions are decided** (see `02-page-specs.md` → Open questions). Anything the docs don't cover → ask Maalik, don't guess.
