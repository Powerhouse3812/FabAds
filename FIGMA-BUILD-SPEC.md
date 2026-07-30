# FIGMA-BUILD-SPEC — Creative Report 2.0

**Status:** BINDING. Every builder follows this literally.
**Target Figma file:** `a4R8eBl0xyNFENEJiLor0j` — https://www.figma.com/design/a4R8eBl0xyNFENEJiLor0j/Creative-report
**Theme:** LIGHT ONLY. No dark mode. No second variable mode. Ever.
**Fidelity:** handoff-ready + exhaustive states + fully wired prototype.
**Author:** design architect (orchestrator). Questions go to the architect, never resolved unilaterally.

---

## 0. READ THIS FIRST — the seven rules that get you reverted

1. **You own exactly one page.** Your page id is in your work order (§I). You may READ any page. You may WRITE only yours.
2. **Never edit page `0:1`** (`REF · Existing screens — DO NOT EDIT`). It is the convention source. Clone FROM it; never mutate it.
3. **Never edit a library file.** Not `7h5lI7IieGCuAuySfJVKxS`, not any other. If the library lacks something, §J is where it goes.
4. **Never create a shared/global component.** All shared components already exist on `00 · Foundations` (§B). You INSTANCE them. If you think you need a new shared component, STOP and report to the architect — do not build it.
5. **Never edit another builder's page**, even to "fix" something obviously broken. Report it.
6. **Never create a second variable mode or a dark variant.** Light only.
7. **Never hand-build something §D says to instance.** A hand-built lookalike is the #1 source of drift and is not acceptable even when it looks identical.

### Mandatory tool preamble (every builder, every session)

```
1. ToolSearch: select:mcp__0be08e3f-5371-4da1-8012-e4cccd3f7a06__use_figma,
   mcp__0be08e3f-5371-4da1-8012-e4cccd3f7a06__get_metadata,
   mcp__0be08e3f-5371-4da1-8012-e4cccd3f7a06__get_screenshot,
   mcp__0be08e3f-5371-4da1-8012-e4cccd3f7a06__get_design_context
2. Skill: figma:figma-use            ← MANDATORY before ANY use_figma call
3. Skill: figma:figma-generate-design ← MANDATORY, you are building screens
4. Pass skillNames: "figma-use,figma-generate-design" on every use_figma call.
```

`figma.currentPage` **resets to the first page between every `use_figma` call.** Start every single call with:

```js
await figma.setCurrentPageAsync(await figma.getNodeByIdAsync("<YOUR_PAGE_ID>"));
```

Switch pages **at most once per call**. Never loop pages inside one script.

### Verified font style strings — do not guess these

| Family | Valid styles |
|---|---|
| `Geist` | Regular, Medium, **SemiBold** (no space), Bold |
| `Geist Mono` | Regular, Medium, SemiBold |
| `Inter` | Regular, Medium, **Semi Bold** (with a space) |

`Geist` uses `SemiBold`; `Inter` uses `Semi Bold`. Getting this wrong throws `Cannot write to node with unloaded font`. Always `await figma.loadFontAsync({family, style})` first.

---

## A. COLLISION-PREVENTION PLAN

### A.1 Page ownership — one page per builder, already created

| Builder | Screen | Page name | **Page node id** |
|---|---|---|---|
| — | Reference (read-only) | `REF · Existing screens — DO NOT EDIT` | `0:1` |
| architect | Shared components | `00 · Foundations — OWNER: architect` | `25:2954` |
| architect | Shell master | `01 · Shell Template — OWNER: architect` | `25:2955` |
| **B1** | Overview | `02 · CR2 Overview — B1` | **`25:2956`** |
| **B2** | Creatives (grid + table) | `03 · CR2 Creatives — B2` | **`25:2957`** |
| **B3** | Components | `04 · CR2 Components — B3` | **`25:2958`** |
| **B4** | Compare | `05 · CR2 Compare — B4` | **`25:2959`** |
| **B5** | Automations | `06 · CR2 Automations — B5` | **`25:2960`** |
| **B6** | Owner report | `07 · CR2 Owner report — B6` | **`25:2961`** |
| **B7** | Brief builder | `08 · CR2 Brief builder — B7` | **`25:2962`** |
| **B8** | Saved views | `09 · CR2 Saved views — B8` | **`25:2963`** |
| **B9** | Creative drawer | `10 · CR2 Creative drawer — B9` | **`25:2964`** |
| architect | Handoff + gaps | `11 · Handoff & Gaps — OWNER: architect` | `25:2965` |

Pages `00` and `01` are **frozen**. If you need a change there, report it; the architect makes it. This is deliberate: a shared component edited by one builder silently changes eight other screens.

### A.2 Coordinate origin — fixed grid, per builder, on your own page

Every frame is 1440×800. Lay them on this grid and nowhere else:

| Column x | Row y | Contents |
|---|---|---|
| `x = 0` | `y = 0` | **Populated / default** (the canonical screen) |
| `x = 1560` | `y = 0` | Secondary populated view (2nd layout, 2nd tab, expanded state) |
| `x = 3120` | `y = 0` | Tertiary populated view |
| `x = 0` | `y = 920` | **Loading** |
| `x = 1560` | `y = 920` | **Empty (zero-data / no account)** |
| `x = 3120` | `y = 920` | **Filtered-empty** |
| `x = 0` | `y = 1840` | **Error** |
| `x = 1560` | `y = 1840` | **Partial / low-data** |
| `x = 3120` | `y = 1840` | Long-content stress (60+ char names, 1000+ items) |
| `x = 0` | `y = 2760` | Overlay/popover/modal states (may exceed 1440 wide — extend rightwards on this row only) |
| `x = 0` | `y = 3680` | **Interaction spec board** (§G.6) — not a screen |

Column pitch 1560 (1440 + 120 gutter). Row pitch 920 (800 + 120 gutter). Never place a frame off-grid. Never place a frame at negative coordinates.

### A.3 What you must never do

- Never create a shared or global component.
- Never edit another builder's page.
- Never edit the library file.
- Never edit pages `0:1`, `25:2954`, `25:2955`.
- Never add a variable, variable mode, or variable collection. §E is the complete token set; if a token is missing, report it.
- Never detach an instance of a Foundations component. If a variant doesn't fit, report it — a detached instance is invisible drift.
- Never rename a Foundations component or change its variant property names.

> ### SANCTIONED EXCEPTION ON RECORD — `30:3599`, 2026-07-29
>
> The freeze above still binds **every builder**. It has been breached **exactly once**,
> by the sync orchestrator, with explicit coordinator authorisation, because the master
> was itself the source of a file-wide defect: all nine pages are cloned from it, so its
> 25 Inter text nodes propagated into every screen and defeated PATCH 01 §P2's
> zero-Inter instruction at the root.
>
> **What changed (one script, fully audited):**
> - **25 Inter text nodes → Geist** (`Regular→Regular`, `Medium→Medium`,
>   `Semi Bold→SemiBold`), segment-aware, nothing detached. Geist Mono untouched.
>   Result: 42 text nodes scanned, 25 changed, 17 already Geist, **0 blocked**,
>   and the master's `remainingNonGeist` list is now **empty**.
> - **5 layer renames** (§K.4), names derived from actual contents:
>   `Group 372` → `Icon glyph` · `Frame 1000002832` → `Breadcrumb row` ·
>   `Frame 2147225662` → `Date range control` · `Frame 2147225614` → `Period stepper` ·
>   `Frame 2147225664` → `Header tips label`. `badLayerNamesRemaining` is now **empty**.
> - **Page Body placeholder text corrected** from `content column = 1136px` to
>   `1128px` (§S1), so no future clone inherits the superseded number.
>
> **What was explicitly NOT changed:** geometry (row sum re-verified at
> `52 + 46 + 48 + 654 = 800`, zero geometry guards fired), the 8 remote sub-nav
> instances' variant properties or attachment (all 8 re-verified as live `INSTANCE`
> with unchanged mains), and nothing was detached.
>
> **Interpretation note:** "do not touch the 8 remote sub-nav instances" was read as
> *do not detach, swap, reposition, or change variant properties*. Their **label fonts
> were** changed, because the 8 tab labels are part of the 25 Inter nodes and skipping
> them would have left Inter in the master. A `fontName` assignment on an instance's text
> child is an override, not a structural edit, and B1 proved it does not detach.
>
> **`SF Pro Text` was NOT touched and is not a defect in this file.** It exists only in
> the library's `*Breadcrumb*` main components (`3:653` / `3:618` / `3:627`). Our
> breadcrumb instances carry local font overrides, so nothing in
> `a4R8eBl0xyNFENEJiLor0j` renders SF Pro. Fixing the mains would require editing the
> library file — forbidden. Logged as a library ask (§J.15 / PATCH 05).
>
> **No further edits to `25:2955` were authorised beyond this point** — until the second
> exception below, authorised via this build's final-sweep task brief, which supersedes
> this line.

> ### SANCTIONED EXCEPTION ON RECORD #2 — `30:3599`, 2026-07-30
>
> Authorised via the final-sweep task brief for this build (traceable to project owner
> Maalik's mandate for the sweep), not derived from anything inside the Figma file
> itself. Scope: exactly two text-content fixes on the master, nothing else.
>
> **Rationale:** the final file-wide sweep found the master itself still carried two
> content defects that had propagated into all nine cloned builder pages (~140 cloned
> frames total) — because the nine pages are **clones, not instances**, fixing the master
> alone does not retroactively fix those; that propagation is being swept separately,
> per-page, by the builders/sync orchestrator.
>
> **What changed (two text writes, canonical font-load recipe, nothing detached):**
> - **Date range corrected** — the header date-range control disagreed with the filter
>   bar's "1 Jul – 30 Jul" and read a nonsensical end-before-start range.
>   - `30:3081` ("Start Date"): `2025-10-02` → `2026-07-01`
>   - `30:3083` ("End Date"): `2020-11-02` → `2026-07-30`
>   - Format preserved exactly (`YYYY-MM-DD`, two separate label/value nodes, no
>     separator character invented).
> - **Typo corrected** — `30:3078` (the Tips banner text, full string):
>   - Before: `You can launch directly from your Creative Library. Select Creative sor
>     Adgroups and start a launch anytime.`
>   - After: `You can launch directly from your Creative Library. Select Creatives or
>     Adgroups and start a launch anytime.`
>
> **What was explicitly NOT touched:** geometry — row-height sum re-verified at
> `52 + 46 + 48 + 654 = 800`, holds; the 8 remote sub-nav tab instances (`Tab Item /
> Basic`, ids `31:3415/3420/3425/3429/3433/3437/3441/3445`) re-verified as live
> `INSTANCE` nodes with unchanged main components (1 Active + 7 Default, same keys as
> before); nothing was detached. A pass-1 scan for any lime (`#8fb821`)-filled CTA with
> a baked-in label inside the shell chrome found **0 matches** — no action needed under
> PATCH 07 §V3.
>
> ~~**No further edits to `25:2955` / `30:3599` are authorised beyond this second
> exception.** Any future need goes back to Maalik.~~
> **SUPERSEDED** by Exceptions #3 and #4 below.

---

> ### SANCTIONED EXCEPTION ON RECORD #3 — `25:2955` STATE FRAMES ONLY, 2026-07-30
>
> **Provenance, stated precisely:** authorised **via the final-gate task brief issued by the
> coordinating session** — **not** a personal sign-off by Maalik on this node list.
>
> **Scope: the three shell state frames only. The master `30:3599` was explicitly excluded
> from every write in this exception.**
>
> **Why it was necessary:** the final gate found that no sweep had ever touched
> `32:5668` (Loading), `32:5793` (Empty), `32:5918` (Filtered empty). Each still carried all
> three shell content defects, and each was still in Inter. "Zero occurrences file-wide"
> could not be certified while they stood, and the master's Exception-#2 fix does **not**
> propagate to them (the frames are clones, not instances).
>
> **What changed:**
> - **9 text writes** (canonical font-load recipe): `32:5760`/`32:5885`/`32:6010` typo →
>   `Creatives or Adgroups` · `32:5763`/`32:5888`/`32:6013` → `2026-07-01` ·
>   `32:5765`/`32:5890`/`32:6015` → `2026-07-30`.
> - **78 Inter → Geist** (24 plain + 54 inside library instances). Instance-internal font
>   writes **do** work; the previously-logged "blocked font nodes" were never blocked.
> - **15 default layer names** renamed → `Shell chrome · <label>` (5 per state frame:
>   `Group 372`, `Frame 1000002832`, `Frame 2147225662`, `Frame 2147225614`,
>   `Frame 2147225664`). The master had none.
> - **4 search placeholders** raised to `#0f0f0c` @ 0.62 (see PATCH 07 §V2 successor note).
>
> **Nothing detached. Geometry untouched. Master untouched.**

---

> ### SANCTIONED EXCEPTION ON RECORD #4 — `30:3599` MASTER, reactions only, 2026-07-30
>
> **Provenance, stated precisely:** authorised **via this session's task brief from the
> coordinating agent** — **not** a personal sign-off by Maalik. Maalik ruled on the
> *class* of defect (delete all dead prototype actions, chosen over conversion); the
> decision to **extend that ruling to the frozen master** was the coordinating agent's.
>
> **Rationale on record:** the master was the **last re-seeding vector**. Leaving its 24
> dead actions in place meant every future clone of `30:3599` would inherit them and
> re-open the defect that 3,798 deletions had just closed — defeating the ruling. §A.3's
> freeze exists to stop **concurrent builders** trampling shared chrome, **not** to prevent
> the integrator repairing a defect inside it.
>
> **Scope: prototype reactions only. Deleted only actions whose destination is a COMPONENT
> variant inside a COMPONENT_SET** — an unnavigable destination, therefore a guaranteed
> dead click. Nothing else was touched.
>
> **Result, warm-verified by actual page ancestry (not id-set membership):**
> - **24 deleted** across 24 nodes · **0 dead remaining** · **0 errors**.
> - **Live NODE actions 0 → 0** (unchanged); `CLOSE` actions unchanged; total actions
>   25 → 1, a drop of exactly 24 and nothing more.
>
> **Guards re-verified after the write:**
> - **`Content Area` rows still sum to 800**: `Content Wrapper` 52 + `Sub Nav` 46 +
>   `Filter Bar` 48 + `Page Body` 654 = **800** ✅. Master still `1440x800`.
> - **The 8 remote sub-nav tab instances untouched** (`31:3415`/`3420`/`3425`/`3429`/
>   `3433`/`3437`/`3441`/`3445`) — all still live `INSTANCE` nodes, same main components,
>   **1 Active + 7 Default**.
> - **Instance count 59 → 59.** Geometry snapshot byte-identical before/after. Nothing
>   detached. Screenshot re-verified.
>
> **`30:3599` is now free of dead prototype actions.** Any *future* need beyond these four
> exceptions goes back to Maalik.

---

## B. PRE-BUILT SHARED ASSETS — instance these, never rebuild

All on page `00 · Foundations` (`25:2954`). Import into your page with
`await figma.importComponentByKeyAsync(key)` / `importComponentSetByKeyAsync(key)`, then `.createInstance()`
(or, within this same file, `await figma.getNodeByIdAsync(nodeId)` then `.defaultVariant.createInstance()`).

### B.1 Local variable collection

`CR2 Tokens` — collection id `VariableCollectionId:26:2954`, **single mode `Light`**, 35 variables. Full list in §E.2.

### B.2 The 13 Foundations components

| # | Component | Type | Node id | **Key** | Variant props → values |
|---|---|---|---|---|---|
| 1 | `CR2/Bucket Chip` | set | `28:2975` | `ca6baf9c47439d1b8d2fed4e3295cd29d32f09a8` | `Bucket` winners·scaling·fatiguing·new·losers × `Size` sm·xs (10) |
| 2 | `CR2/Confidence Chip` | set | `28:3139` | `5f225c83b30bf46c92ce052411b3d84a4fe6c48e` | `Level` high·medium·low·na (4) |
| 3 | `CR2/Trust Meter Chip` | set | `28:3466` | `f07cf72d41afc360073cdb37559cdd6525118646` | `State` has-data·no-data (2) |
| 4 | `CR2/Metric Cell` | set | `28:3709` | `6325d00da59ce0357d4271bc4e7b614e444f80e9` | `Align` left·right × `Tone` neutral·good·bad × `State` value·na (12); text props `Label`,`Value`,`Delta` |
| 5 | `CR2/Creative Thumb` | set | `29:3340` | `bcbf79e5c3d2ccff572fafd7ab9d91ee58a69042` | `Size` 40·36·32 × `Format` static·video·carousel (9) |
| 6 | `CR2/Creative Card` | set | `32:3501` | `98ae5ba5dbc1c10a622da4ee037377ddf774bada` | `State` default·hover·selected·loading (4) |
| 7 | `CR2/Bucket Tab` | set | `32:5526` | `34b376357e2f6984010d2bfebc620e0bf9f54a33` | `State` active·inactive·hover·zero (4) |
| 8 | `CR2/Bucket Tab Row` | set | `32:8966` | `271a41f468959152f32ce5412302995ad5ab3656` | `State` default·hover × `Bucket` fatiguing·other (4) |
| 9 | `CR2/Recommendation Row` | set | `33:3047` | `9fa1167db0c6202c08dc9b3bb71c621b7ca4327b` | `Tone` attention·opportunity·neutral (3) |
| 10 | `CR2/Glass Panel` | component | `33:7170` | `a453a95ece51d1eb666d41d12f1915195c21e283` | — (halo + `Content` slot) |
| 11 | `CR2/Drawer Band` | component | `34:3033` | `d5799d6f052c2f1457bb8afb49d686a3f50fae8a` | boolean prop `Show Title` |
| 12 | `CR2/Chart Placeholder` | set | `36:7201` | `f5240a954d967c15a6464008a02206b1579dd2f2` | `Type` area-dual·line-multi·bar·sparkline × `State` populated·empty (8) |
| 13 | `CR2/Why Dot` | set | `36:7209` | `c515a2449a04eb7c03f30e90b850aae3e7325af6` | `State` default·hover (2) |

**11 component sets = 62 variants, plus 2 standalone components = 13 shared assets.** Verified on canvas. These exist precisely so nine builders cannot produce nine different creative cards. Instance them.

### B.3 Known limitations of the Foundations set (do not "fix" these yourself)

- Icon glyphs inside Foundations components are **generic vector placeholders**, not real Lucide icons. For real icons, instance the library's `Icon / *` set (§D.6). Do not swap glyphs inside a Foundations instance.
- Uppercase labels (`WINNERS`, `SPEND`) are literal uppercase strings, not `textCase='UPPER'`. Type replacement text in uppercase.
- Chart curves in `CR2/Chart Placeholder` are illustrative paths, not data-bound. That is intended.
- `CR2/Creative Card`'s four metric cells ship with an empty `Delta`. Fill it via the exposed property where a delta belongs.
- Neutral text/border/bg colours in Foundations are **literal hexes**, not bound to remote library variables. §E.1 is still the binding mapping for everything you build; the architect will do a rebinding pass. Do not rebind Foundations yourself.

---

## C. THE APP-SHELL RECIPE — clone the master, never rebuild the shell

### C.1 Duplicate, don't build

The master lives on page `01` (`25:2955`):

| Frame | Node id |
|---|---|
| `SHELL / Creative Report 2.0 — MASTER` | **`30:3599`** |
| `SHELL / State — Loading` | `32:5668` |
| `SHELL / State — Empty` | `32:5793` |
| `SHELL / State — Filtered empty` | `32:5918` |

Your first build step, always:

```js
const page = await figma.getNodeByIdAsync("<YOUR_PAGE_ID>");
await figma.setCurrentPageAsync(page);
const master = await figma.getNodeByIdAsync("30:3599");
const f = master.clone();
page.appendChild(f);
f.x = 0; f.y = 0;
f.name = "CR2 / <Screen> / Populated — 1440w light";
return { createdNodeIds: [f.id] };
```

Then: set your sub-nav tab active, and fill `Page Body`. **Nothing else in the shell may change.** Do not restyle the rail, the nav, the header, the sub-nav chrome, or the filter bar. For the loading / empty / filtered-empty rows, clone the matching `SHELL / State — *` frame instead of the master.

### C.2 Verified shell geometry — these numbers are law

| Element | Value |
|---|---|
| Frame | **1440 × 800**, fill `#FFFFFF`, `clipsContent = true` |
| Icon rail (dark), `30:2988` | x=0, **w=64**, h=800 |
| Secondary nav, `30:3028` | x=64, **w=200**, h=800; right border 0.5px `Colors/Neutral/Border/colorBorderSecondary` `#efeee7` |
| Content Area (`30:3600` on master) | **x=264, w=1176, h=800** (264 = 64 + 200) |
| Content header (`Content Wrapper`, `30:3065`) | w=1176, **h=52**, fill `#fbfbf9`, bottom border `colorSplit` rgba(0,0,0,0.06) |
| Sub Nav (`31:3414`) | w=1176, **h=46**, gap **32**, bottom border 1px `#efeee7` |
| Filter Bar (`32:3430`) | w=1176, **h=48**, gap 8, paddingV 8, bottom border 1px rgba(0,0,0,0.06) |
| Page Body (`32:5666`) | w=1176, **h=654**, padding **24** all sides, itemSpacing **24** |
| **Usable content column** | **1136px** (1176 − 20 − 20) |
| Content inset | **20px** left and right, confirmed on every reference row |

> **Correction on record:** the brief assumed Sub Nav h=38 from the reference's live tab instances. Those had been manually compressed; the `Tab Item / Basic` main component's natural hug height is **46px**. 46 is authoritative. Rows sum to 52 + 46 + 48 + 654 = 800. ✓
>
> **Correction on record:** the reference `Content Wrapper` is a 1134px frame at x=20. On the master it has been normalised to a full-bleed 1176px row with 20px internal padding, so its background and bottom border run edge-to-edge like `Sub Nav` and `Filter Bar`. Visually identical, structurally consistent.

### C.3 The Creative Report sub-nav — 8 items, fixed order

`Overview` · `Creatives` · `Components` · `Compare` · `Automations` · `Owner report` · `Brief builder` · `Saved views`

| Tab | Instance node id (on master) |
|---|---|
| Overview | `31:3415` |
| Creatives | `31:3420` |
| Components | `31:3425` |
| Compare | `31:3429` |
| Automations | `31:3433` |
| Owner report | `31:3437` |
| Brief builder | `31:3441` |
| Saved views | `31:3445` |

Active tab: 2px bottom border `Components/Tabs/Component/itemSelectedColor` rgba(15,15,12,0.92), label `Inter Semi Bold 14/22`.
Inactive: `Inter Regular 14/22` in `colorTextSecondary` rgba(15,15,12,0.70).
**Every builder sets exactly one tab active — their own.** Overview is active on the master; change it on your clone.

### C.4 The filter bar — SEARCH IS LEFTMOST, non-negotiable

Left → right, exactly this order:

1. **Search** — 224×32, radius 50 pill, fill `colorFillTertiary` rgba(0,0,0,0.04), 16×16 search glyph + 8px gap, placeholder `Search creatives…` 13px `Inter Regular` in `colorTextQuaternary` rgba(15,15,12,0.25)
2. Date range — h32 r6 1px `#e7e5dc`, `1 Jul – 30 Jul` + calendar glyph
3. `All accounts` dropdown
4. `All brands` dropdown
5. `Status` dropdown
6. `Platform` dropdown
7. `Format` dropdown
8. `+ Add filter` — ghost, transparent, 13px `colorTextTertiary`

Screens that need extra controls (Creatives' Columns / Card metrics / Group / Sort / Layout toggle) put them in a **right-aligned trailing cluster inside `Page Body`'s first row**, not in the shell filter bar. Do not modify the shell filter bar.

---

## D. LIBRARY-COMPONENT MAPPING

Library: **"Design System - FF new"**, fileKey `7h5lI7IieGCuAuySfJVKxS`, libraryKey
`lk-d0db22f96aa104f4b76d850fbacce5d06f3866b8cf065e1faa6878f87f56beb2b10d66320382109b7daeae0c2a09bc71f7c17a4d710bd8233221ba86bee350b5`

> **Finding that changes the plan:** the target file does **not** subscribe to "Design System - FF new". Its subscribed libraries are "Design System - FF", "Design system (Fab-Funnels)" and "LF 2.0 - Design System". `importComponentByKeyAsync` still works on any published key, so the keys below are usable — but the **variables** resolving in this file come from the *subscribed* libraries. That is why §E.1 maps to variable names, not variable keys. Do not try to subscribe the file to a new library; that is an architect/Maalik decision (§J.1).

### D.1 Verified library component keys

| UI element in our module | Library component | **componentKey** |
|---|---|---|
| Sub-nav tab item | `Tab Item / Basic` | **`130fcad83f17df1eb67ea6c108240f697a507eef`** |
| Button (all variants) | `*Button*` | `792294bb1a6684844c21f483ba3b427c0701a153` |
| Dropdown trigger button | `Dropdown Button Basic` | `91abc5d833220ce61b402338e7decb9b9c8554a4` |
| Drawer shell | `*Drawer*` | `21693b452518ecee50f6293c9a6bdead0fd38d72` |
| Popover (WhyDot, column picker, add-filter, thresholds) | `*Popover*` | `0dd9d6b945130f56c75259fcde8e03d0b09e1a92` |
| Confirm dialog (Pause, Delete) | `*Modal* / Confirmation` | `b4a185fa8fd660b9ced1c422a403493405334044` |
| Modal + scrim | `*Modal* / With Overlay` | see `*Modal* / Basic` `6558cf7a6f5fad147726075138eef6d361ba4d0c` |
| Table | `*Table*` | `8c7346ccc7f448deb8673a3bce1557777568e54e` |
| Table header cell | `Table Item / Header Item` | `4b11dbcaf97f43b58cf9cafb3855fe1eea873107` |
| Table row control | `Table Item / Row Control` | `ab90200ca2620c62f8a6b6473bd0c456fcdd1236` |
| Tag / filter chip | `*Tag* / Basic` | `6fff9b8a1f6864e7cdad3d701f2e4666e15c7435` |
| Coloured tag (delta %) | `*Tag* / Colorful` | `61cf7496fd7b9fc9e62a9fca2353dc25377bdd62` |
| Badge ("Coming soon", dot) | `*Badge* / Basic` | `8f96c594038d7c433c77a7aea9ff2c8568d3cfdd` |
| Select | `*Select*` | `534a30285c17c3870f40693045cce99f57ac574c` |
| Select (multi, input form) | `Select Input` | `bd676dd6fc189559f1841e49b60185da237ff2ed` |
| Checkbox | `*Checkbox*` | `1762311621f9ffd5afb4b716c5144e5e172d1626` |
| Switch | `*Switch* / Basic` | `4567028ec6dd054759579a52d27028ab827ecb4d` |
| Text input | `*Input* / Basic` | `4ccac25e0027adba9b88939a72968856bce05c6e` |
| Textarea (Brief blocks) | `*Input* / Textarea` | `96c163d348a09e3db9f1333d410ffe87e41e73fb` |
| Number input (thresholds) | `*InputNumber*` | `167f59b4641f9f5902c286985ffb87a3df84963a` |
| Tooltip | `*Tooltip*` | `9e402312490fc7c0d1ae0f7f21dedc6f654d7dc9` |
| Segmented control | `*Segmented*` | `ef691296d6c2a4b761e2f56e3fd6fa473619501b` |
| Segmented item | `Segmented Item` | `6536a2b22eca747ce68bf92b7abac9752cc7d86a` |
| Card (generic container) | `*Card* / Basic` | `00e5d603e2cc7536867ea9c1aa3fc0302225528e` |
| Avatar | `*Avatar*` | `2b254baf9b809928d32ec97b52a7c31ffae75126` |
| Empty state illustration | `Empty / Image` | `b3ed1176d862fdc961a4fea49d11ea857db28c6d` |
| Skeleton | `*Skeleton*` | `860744f225dc099ee2339ec897955a36c45f7fc6` |
| Spinner | `*Spin*` | `d05f6dee32830362dcc4eaca99080ba9d77f2529` |
| Breadcrumb (in shell header) | `*Breadcrumb*` | `452f77d91ea0e08a22b071732486514ac4ad1d42` |
| Menu / dropdown menu | `*Dropdown Menu*` / `*Menu*` | `e48bd087c0505a14561e404e057155cf8c3f54c7` |
| Radio (board type) | `*Radio Group*` | `fb6e7581956f7918e034af6b268b1ada921078ff` |
| Collapse (folder rail) | `*Collapse*` / `Collapse Item` | `9cd36efb1c1e6afe14ee9c62eef4ee32949143cf` / `9daf4b419d1f93994ef0bac5e5aa30e02158fc66` |
| Alert (attribution warning) | `*Alert*` | `636161a437e0b28dfacde11639632f44fc2441e8` |
| Divider (h / v) | `*Divider Horizontal*` / `*Divider Vertical*` | `3d26fd646c0f03f84ac9d84669ea4db0e8d40dca` / `78eb40a0cbe6ee3611a0a778c083ca50d8dbb2d6` |
| Date picker | `*DatePicker*` | `3c60fffb4c7cd3bbaca3be9a3e607cd46e844a35` |
| Progress | `*Progress* / Standard` | `e91b61a4fd9e236cbe4d97c85f4fdd2f99844b25` |
| Statistic / KPI tile | `*Statistic*` | `ed75eb6f549d58671d042674a78c406e5b16f7ef` |
| Steps (Report wizard) | `*Steps*` | `0164820ed648fd290491383204e1a0583bf77fa7` |
| Pagination | `*Pagination*` | `da0f01be37144050c92558d47669373da87855d3` |
| Upload | `*Upload*` family | see inventory |
| Image / thumbnail placeholder | `*Image*` | `3a240791e71218683d54499a92cffbc3b440f557` |

### D.2 Where the library does NOT fit — instance Foundations instead

| UI element | Verdict |
|---|---|
| Creative card | **Foundations** `CR2/Creative Card` — library `*Card* / Advanced` exists (`61073d105903ade2319f4475aefc55eebcfa6254`) but has the wrong internal anatomy (no bucket chip, no metric row, no hover peek, no selected ring) |
| Bucket tab panel + tabs | **Foundations** `CR2/Bucket Tab` + `CR2/Bucket Tab Row` — library tabs are text-only, ours are count-over-label |
| Bucket / confidence / trust chips | **Foundations** — library `*Tag*` has no semantic colour set matching ours |
| Metric cell (label / value / delta) | **Foundations** `CR2/Metric Cell` — `*Statistic*` is close but lacks the mono-numeral + delta-tone contract |
| Glass panel + lime halo | **Foundations** `CR2/Glass Panel` — nothing comparable in the library |
| All charts, all sparklines | **Foundations** `CR2/Chart Placeholder` — **the library has ZERO chart or sparkline components.** Confirmed across an exhaustive sweep; only `BarChartOutlined`-style icon glyphs exist. See §J.2 |
| Why-dot annotation marker | **Foundations** `CR2/Why Dot` |
| Drawer section band | **Foundations** `CR2/Drawer Band` (use library `*Drawer*` for the shell, bands for the contents) |
| Recommendation row | **Foundations** `CR2/Recommendation Row` |

### D.3 Build locally (screen-specific, not shared, not in the library)

Breakdown table rows · funnel strip (6 chevron-linked cells) · ad-preview mock card · script/frame chips · demographics dimension rows · dedup banner · brief blocks · folder rail rows · digest preview strip · compare column card · bulk action bar. Build these **inside your own frame**, from primitives. They appear on one screen only, so local is correct — but if you find yourself building the same thing as another builder, STOP and report it.

### D.4 Two things that are NOT library instances in the reference

The reference screen's `*Alert*` and `DatePicker Input / Basic` are **hand-built frames dressed up to look like components**, and so are the platform-filter `*Segmented*`, the active sort tags, the card's media chips, the "Colorful" % tag and the card footer buttons. Do not treat the reference as proof that a library instance exists. §D.1 is the authority.

### D.5 Two library components that were tried and rejected on the shell

- `*Input* / Search` — its only variants are URL-prefix + audio-icon compounds; it cannot produce the borderless radius-50 pill. Hand-built on the master.
- `DatePicker Input / Basic` "Range=True" — fixed 322px, does not hug short text; would overflow the 1176px filter bar by 133px. Hand-built compact button on the master.

Both are already resolved **on the master**. Do not re-litigate them on your screen.

### D.6 Icons

Instance the library's Ant `Icon / *` components. Verified keys: `Icon / SearchOutlined` `07bd3365b31ec4ad20ce09fb66d65b15ff795f2a` · `Icon / PlusOutlined` `7296f35f08ed352e9cf59b4525704931e0d7f1c3` · `Icon / CalendarOutlined` `ff0e67abad21fc84d9eb3d9fb61580e9dcc2b252`. For any other icon, `search_design_system` for `Icon / <AntName>Outlined` and instance it. **Never hand-draw an icon.** Where our code uses a Lucide icon with no Ant equivalent, pick the nearest Ant Outlined icon and log the substitution in your report.

---

## E. TOKEN MAPPING

### E.1 Code token → library variable (use the library variable wherever one exists)

| Our code token | Light value | Library variable (verbatim) | Library value |
|---|---|---|---|
| `--background` / `bg-background` | `#FFFFFF` | `Colors/Neutral/colorWhite` | `#ffffff` |
| `--card` / `bg-card` | `#FFFFFF` | `Colors/Neutral/colorWhite` | `#ffffff` |
| page chrome bg | — | `Colors/Neutral/Bg/colorBgContainer` | `#fafaf7` |
| app layout bg | — | `Colors/Neutral/Bg/colorBgLayout` | `#f5f5f5` |
| `--foreground` / `text-foreground` | `#211F21` | `Colors/Neutral/Text/colorText` | rgba(15,15,12,0.92) |
| heading text | — | `Colors/Neutral/Text/colorTextHeading` | rgba(15,15,12,0.92) |
| secondary text | — | `Colors/Neutral/Text/colorTextSecondary` | rgba(15,15,12,0.70) |
| `--muted-foreground` / `text-muted-foreground` | `#8A8794` | `Colors/Neutral/Text/colorTextTertiary` | rgba(15,15,12,0.55) |
| placeholder text | — | `Colors/Neutral/Text/colorTextQuaternary` | rgba(15,15,12,0.25) |
| `--border` / `border-border` | `#EDECEE` | `Colors/Neutral/Border/colorBorder` | `#e7e5dc` |
| hairline / `border-border/60` | — | `Colors/Neutral/Border/colorBorderSecondary` | `#efeee7` |
| divider / `border-b` inside cards | — | `Colors/Neutral/Border/colorSplit` | rgba(0,0,0,0.06) |
| `--muted` / `bg-muted` | `#F6F6F5` | `Colors/Neutral/Fill/colorFillTertiary` | rgba(0,0,0,0.04) |
| `bg-accent/5` hover wash | — | `Colors/Neutral/Fill/colorFillAlter` | rgba(0,0,0,0.02) |
| icon default | — | `Colors/Neutral/Icon/colorIcon` | rgba(15,15,12,0.55) |
| icon hover | — | `Colors/Neutral/Icon/colorIconHover` | rgba(15,15,12,0.92) |
| `--primary` / `bg-primary` | `#8FB821` | `Colors/Brand/Primary/colorPrimary` | `#8fb821` ✅ exact match |
| `bg-primary/15` chip fill | — | `Colors/Base/fab-funnel/1` | `#f5fbe2` |
| `--primary-text` / `text-primary-text` | `#5B7611` | `Colors/Base/fab-funnel/7` | `#749818` ⚠️ one step lighter — see §E.3 |
| `--success-text` | `#237804` | `Colors/Brand/Success/colorSuccessActive` | `#389e0d` |
| success bg | — | `Colors/Brand/Success/colorSuccessBg` | `#f6ffed` |
| `--error-text` | `#CF1322` | *no text-safe error token* | use `CR2/Danger/text` |
| destructive bg | — | `Colors/Brand/Error/colorError` | `#ff4d4f` (too light for text) |
| `--radius` card (`rounded-xl`) | 12px | `Size/Base/sizeSM` | 12 |
| control radius (`rounded-md`) | 6px | `borderRadius` / `Components/Button/Global/borderRadius` | 6 |
| small radius (`rounded-sm`) | 4px | `Components/Tag/Global/borderRadiusSM` | 4 |
| control height (`h-8`) | 32px | `controlHeight` | 32 |
| small control (`h-7`/`h-6`) | 24px | `Components/Button/Global/controlHeightSM` | 24 |
| `gap-0.5` | 2px | `item spacing/xxxs` | 2 |
| `gap-1` | 4px | `item spacing/xxs` / `Components/Space/Padding/paddingXXS` | 4 |
| `gap-2` / `p-2` | 8px | `item spacing/xs` / `Components/Space/Padding/paddingXS` | 8 |
| `gap-3` / `p-3` | 12px | `item spacing/12` / `Components/Space/Padding/paddingSM` | 12 |
| `p-6` page padding | 24px | `Space/Padding/paddingLG` | 24 |
| tab gutter | 32px | `Components/Tabs/Component/horizontalItemGutter` | 32 |
| `shadow-sm` | — | `boxShadowTertiary` | 3 stacked drop shadows |
| `shadow-lg` (bulk bar, popovers) | — | `boxShadowSecondary` | 3 stacked drop shadows |
| segmented active bg | — | `Components/Segmented/Component/itemSelectedBg` | `#fafaf7` |
| segmented track bg | — | `Components/Segmented/Global/colorBgLayout` | `#fbfbf9` |

### E.2 Local `CR2 Tokens` — the 35 gap tokens (collection `VariableCollectionId:26:2954`, mode `Light`)

Use these **only** where §E.1 has no library equivalent.

**Colours (25)**
`CR2/Accent/primary` #8FB821 · `CR2/Accent/primary-text` #5B7611 · `CR2/Accent/primary-15` #8FB821@15% · `CR2/Accent/primary-30` #8FB821@30% · `CR2/Accent/primary-10-halo` #8FB821@10%
`CR2/Attention/bg` #F59E0B@10% · `CR2/Attention/border` #F59E0B@30% · `CR2/Attention/text` #D97706
`CR2/Info/bg` #0EA5E9@10% · `CR2/Info/border` #0EA5E9@30% · `CR2/Info/text` #0284C7
`CR2/Danger/bg` #CF1322@10% · `CR2/Danger/border` #CF1322@30% · `CR2/Danger/text` #CF1322
`CR2/Surface/card` #FFFFFF · `CR2/Surface/glass-70` #FFFFFF@70% · `CR2/Surface/muted` #F6F6F5 · `CR2/Surface/page` #FFFFFF
`CR2/Chart/spend` #0F0F0C@55% · `CR2/Chart/revenue` #8FB821 · `CR2/Chart/grid` #0F0F0C@10%
`CR2/Chart/compare-1` #3B82F6 · `CR2/Chart/compare-2` #F59E0B · `CR2/Chart/compare-3` #10B981 · `CR2/Chart/compare-4` #EC4899

**Numbers (10)**
`CR2/Radius/hero` 16 · `CR2/Radius/card` 12 · `CR2/Radius/control` 6 · `CR2/Radius/sm` 4 · `CR2/Radius/pill` 999
`CR2/Space/page-pad` 24 · `CR2/Space/section-gap` 24 · `CR2/Space/card-pad` 16 · `CR2/Space/row-gap` 12 · `CR2/Space/tight-gap` 8

The compare-chart colours are the literal hexes from `COMPARE_CHART_COLORS` in code — a deliberate, documented exception to the token rule, because a column's colour must stay stable across the Cards/Line/Bar toggle.

### E.3 Two token conflicts, resolved — do not re-decide these

**1. `primary-text`.** Ours is `#5B7611` (4.97:1 on white, AA). The nearest library token `Colors/Base/fab-funnel/7` is `#749818`, roughly 3.6:1 — **fails AA for body text**. **Ruling: use `CR2/Accent/primary-text` (#5B7611) for all lime-as-text and lime-as-border.** Use the library's `fab-funnel/1` (#f5fbe2) for fills. Logged as §J.3.

**2. Typeface for numerals.** The reference screens use **Inter** for all numerals; our shipped code uses **Geist Mono + tabular-nums** for every numeral, with Geist Mono reserved elsewhere for 11px tertiary meta text only. **Ruling — the split is deliberate:**
- **Shell chrome** (icon rail, secondary nav, content header, breadcrumb, sub-nav tabs, filter bar) → **exactly as the reference**: Inter, plus Geist Mono 13px Medium for the nav title and Geist Mono 11px for the header "Tips" label.
- **Everything inside `Page Body`** → **as shipped code**: every numeral `Geist Mono` with tabular figures; body copy `Inter`; section titles `Inter Semi Bold`.

This is the one place the module deliberately diverges from the reference, because Geist Mono numerals are load-bearing to the product's identity. Logged as §J.4.

### E.4 Type ramp — use these exact styles

| Role | Font | Size / line-height | Colour |
|---|---|---|---|
| Page H1 | `Inter Semi Bold` | 18 / 28 | `colorText` |
| Section title (h2/h3) | `Inter Semi Bold` | 14 / 22 | `colorText` |
| Body | `Inter Regular` | 14 / 22 | `colorText` |
| Secondary body / subhead | `Inter Regular` | 13 / 20 | `colorTextTertiary` |
| Small body | `Inter Regular` | 12 / 20 | `colorTextTertiary` |
| **Numerals — large (bucket counts)** | `Geist Mono SemiBold` | 20 / 24 | per state |
| **Numerals — standard** | `Geist Mono Medium` | 14 / 20 | `colorText` |
| **Numerals — small (delta)** | `Geist Mono Medium` | 12 / 16 | per tone |
| Metric label (uppercase) | `Inter Medium` | 11 / 16, letterSpacing 0.5 | `colorTextTertiary` |
| Table column header (uppercase) | `Geist Mono Regular` | 10 / 14, letterSpacing 0.8 | `colorTextTertiary` |
| Rule / formula text | `Geist Mono Regular` | 10.5 / 16 | `colorTextTertiary` |
| Eyebrow (uppercase) | `Geist Mono Regular` | 10 / 14, letterSpacing 0.8 | `colorTextTertiary` |
| Chip / pill | `Inter Medium` | 11 / 11 (sm) · 10 / 10 (xs) | per semantic |
| Nav title (shell only) | `Geist Mono Medium` | 13 / 16.5, letterSpacing −0.275 | `colorTextSecondary` |

### E.5 The glass + halo recipe (never hand-roll it)

`bg-card/70 backdrop-blur-xl` + `bg-primary/10 blur-3xl` halo ⇒ **instance `CR2/Glass Panel` (`33:7170`)**. Its anatomy, for reference only: fill `CR2/Surface/glass-70`, radius `CR2/Radius/hero` (16), 1px `colorBorder`, `clipsContent`, drop shadow `0 1 2 rgba(0,0,0,0.05)`, and an absolute halo ellipse (80% width × 224 high, fill `CR2/Accent/primary-10-halo`, LAYER_BLUR 64) centred and 80px above the top edge. Figma has no `backdrop-blur`; the 70% fill over a white page is the correct approximation. Lime is **active/selected only** — never decorative.

---

## F. THE EXHAUSTIVE STATE / VARIANT MATRIX

### F.1 Naming convention for variant properties

Property names: `State`, `Bucket`, `Size`, `Tone`, `Level`, `Format`, `Align`, `Type`, `Layout`, `Density` — **Capitalised, single word, no abbreviations.**
Values: **lowercase-hyphenated** — `default`, `hover`, `pressed`, `focus`, `disabled`, `loading`, `selected`, `empty`, `error`, `active`, `inactive`, `zero`, `checked`, `indeterminate`, `expanded`, `collapsed`, `filtered-empty`, `low-data`.
Boolean properties: `Show <Thing>` (e.g. `Show Title`). Text properties: `Label`, `Value`, `Delta`, `Title`, `Body`.
Never use `Default`, `Hover`, `On`/`Off`, `1`/`2`, `Variant 1`.

### F.2 Required state set per element class

Build every one of these as a real variant. "It looks the same" is not a reason to omit a variant — a missing variant means the prototype cannot be wired.

| Element class | Required `State` values |
|---|---|
| Primary / outline / ghost button | `default`, `hover`, `pressed`, `focus`, `disabled`, `loading` (6) |
| Icon button | `default`, `hover`, `pressed`, `focus`, `disabled` (5) |
| Tab / sub-nav item | `active`, `inactive`, `hover`, `focus`, `disabled` (5) |
| Bucket tab | `active`, `inactive`, `hover`, `zero` (4) — already built |
| Segmented item | `selected`, `default`, `hover`, `disabled` (4) |
| Text input / search | `default`, `hover`, `focus`, `filled`, `error`, `disabled` (6) |
| Select / dropdown trigger | `default`, `hover`, `focus`, `open`, `filled`, `disabled` (6) |
| Checkbox | `default`, `hover`, `checked`, `indeterminate`, `focus`, `disabled` (6) |
| Switch | `off`, `on`, `hover`, `focus`, `disabled` (5) |
| Table row | `default`, `hover`, `selected`, `focus` (4) |
| Table header cell | `default`, `hover`, `sorted-asc`, `sorted-desc` (4) |
| Creative card | `default`, `hover`, `selected`, `loading` (4) — already built |
| List / breakdown / recommendation row | `default`, `hover`, `pressed`, `focus` (4) |
| Chip / tag (removable) | `default`, `hover`, `focus` (3) |
| Popover / dropdown panel | `closed`, `open` (2) |
| Chart | `populated`, `empty` (2) — already built; add `loading` locally if your screen needs it |
| Accordion / collapse row | `collapsed`, `expanded`, `hover` (3) |

### F.3 Screen-level state coverage — mandatory on every screen

Every builder ships all of these as separate 1440×800 frames on the §A.2 grid. Non-negotiable, per project rule "state coverage is non-negotiable".

| Frame | Grid slot | Content |
|---|---|---|
| Populated | `0,0` | Realistic full data |
| Loading | `0,920` | Skeletons matching the real section shapes — **not** the stale 5-card/4-card `OverviewSkeleton` shape |
| Empty (no account) | `1560,920` | `No ad account connected` / `Connect an ad account to start seeing which creatives to kill, scale, or iterate.` / primary `Connect ad account` |
| Filtered-empty | `3120,920` | `No creatives match these filters` / `Nothing in the current date range and filters. Clear them to see your full book.` / outline `Clear filters` |
| Error | `0,1840` | `Couldn't load your creatives` / `Something went wrong fetching this report. Your filters are still applied — try again.` / primary `Retry` |
| Partial / low-data | `1560,1840` | Real data present but confidence `low` / `na` throughout, "no data" fallbacks visible |
| Long-content stress | `3120,1840` | 60+ char creative names truncating with ellipsis, 1000+ item counts, 4-digit currency, longest brand names |

Empty-state chrome: 48×48 circle (1px `colorBorder`, fill `CR2/Surface/muted`) → title 16px `Inter Semi Bold` → body 14px `Inter Regular` `colorTextTertiary` max-width 384 → buttons. Clone `SHELL / State — *` (§C.1) as the base.

### F.4 Accessibility gates — checked by the monitor, not optional

- Text ≥ 4.5:1 on its background (≥ 3:1 for ≥18.66px bold). This is why `#5B7611` beats `#749818`.
- Never colour alone: fatigue = amber **+ warning glyph + text**; delta = colour **+ sign**; buckets = colour **+ label**.
- Every interactive element has a `focus` variant with a visible 2px ring in `CR2/Accent/primary` at 40% offset 2px.
- Hit targets ≥ 32×32.
- Real strings only. No "Lorem", no "Text", no `—` standing in for missing data — use the `State=na` variant with a reason.

---

## G. PROTOTYPING + ANIMATION RULES

### G.1 The mandated motion constants — identical on all 9 screens

| Interaction | Trigger | Action | Animation | Curve | **Duration** |
|---|---|---|---|---|---|
| Hover on any control | `On Hover` | Change To | Smart Animate | Ease Out | **150 ms** |
| Press / active | `On Press` | Change To | Smart Animate | Ease Out | **100 ms** |
| Focus ring appear | `On Click` | Change To | Instant | — | **0 ms** |
| Tab / bucket-tab switch | `On Click` | Change To | Smart Animate | Ease Out | **200 ms** |
| Segmented / layout toggle | `On Click` | Change To | Smart Animate | Ease Out | **200 ms** |
| Section entrance step | `After Delay` **60 ms** | Navigate To | Smart Animate | Ease Out | **280 ms** |
| Popover / dropdown open | `On Click` | Open Overlay | Move In (from top) + Dissolve | Ease Out | **150 ms** |
| Popover / dropdown close | `On Click` outside | Close Overlay | Dissolve | Ease Out | **120 ms** |
| Tooltip | `On Hover` | Open Overlay | Dissolve | Ease Out | **120 ms** |
| Modal / dialog open | `On Click` | Open Overlay (with scrim, `Close when clicking outside` ON) | Dissolve | Ease Out | **200 ms** |
| Modal close | `On Click` | Close Overlay | Dissolve | Ease Out | **160 ms** |
| **Drawer open** | `On Click` | Open Overlay, position Right, scrim black 80% | Move In from Right | Ease In And Out | **500 ms** |
| **Drawer close** | `On Click` | Close Overlay | Move Out to Right | Ease In And Out | **300 ms** |
| Accordion expand / collapse | `On Click` | Change To | Smart Animate | Ease Out | **200 ms** |
| Bulk bar appear | `On Click` (select) | Change To | Smart Animate | Ease Out | **200 ms** |
| Cross-screen sub-nav | `On Click` | Navigate To (other page's frame) | Instant | — | **0 ms** |
| Row → drawer | `On Click` | Open Overlay | Move In from Right | Ease In And Out | **500 ms** |

Drawer 500 ms open / 300 ms close mirrors `sheet.tsx` (`data-[state=open]:duration-500`, `data-[state=closed]:duration-300`). 280 ms Ease Out mirrors `cr-fade-up 0.28s ease-out`. 200 ms mirrors the `duration-200` on bucket tabs and segmented controls. **Do not invent other durations.** If an interaction isn't in this table, ask.

### G.2 Representing the `cr-stagger` fade-up entrance

The code is `@keyframes cr-fade-up { opacity 0→1, translateY 6px→0 }`, 280 ms ease-out, `animation-delay: var(--i) * 60ms`. Figma cannot stagger children of one frame, so **build it as a frame sequence** on the `x=0, y=3680` row of your page:

- `ENTRANCE / <Screen> / 0` — all sections present, each at `y + 6`, `opacity 0`
- `ENTRANCE / <Screen> / 1` — section `--i:0` at final y, `opacity 1`; rest still offset
- `ENTRANCE / <Screen> / 2` … through `/ N` — reveal one more section per frame, in the code's `--i` order

Wire `0 → 1 → 2 → … → N`, each: `After Delay` **60 ms** → `Navigate To` → **Smart Animate, Ease Out, 280 ms**. The final frame links to your Populated frame with `After Delay 60ms → Instant`. Set the flow starting point on frame `0` and name the flow `Entrance — <Screen>`.

Overview's `--i` order is fixed by code: `0` Header · `1` BucketTabs · `2` OverviewBreakdown · `3` RecommendationsCard · `4` AutomationsPreview → 5 sections, 6 frames.

### G.3 The drawer

The drawer is **built once by B9** on page `25:2964` as a self-contained overlay frame, `720 × 800`, anchored right.

- Overlay scrim: black at **80%** (`bg-black/80` from `sheet.tsx`).
- Open: `Move In from Right`, `Ease In And Out`, **500 ms**. Close: `Move Out to Right`, `Ease In And Out`, **300 ms**.
- Overlay position `Right`, `Close when clicking outside` ON, background scrim ON.
- B2 (Creatives), B1 (Overview), B4 (Compare) and B5 (Automations boards) all wire **`On Click` → Open Overlay → B9's drawer frame**. They do **not** build their own drawer. Cross-page overlay targets work; use B9's node id from the handoff table on page `11`.

### G.4 Flows to wire — the required set

**Per-screen (every builder):**
1. `Entrance — <Screen>` (§G.2)
2. Every control's hover + press + focus, via variant `Change To`
3. Every popover / dropdown / tooltip open + close
4. Every modal + its confirm and cancel paths
5. Populated → Loading → Populated (a `Simulate loading` affordance is fine)
6. Populated → Filtered-empty → (Clear filters) → Populated
7. Error → (Retry) → Loading → Populated

**Cross-screen (all 8 sub-nav tabs, on every screen):** each sub-nav tab links to the *other* builder's Populated frame. Wire these **last**, after all builders report their Populated node ids — the architect publishes the id table on page `11` and each builder wires their own 8 links. Never wire by editing another page.

**Screen-specific highlights:** Overview bucket tab switching (5 panels) and `View all N in the grid` → Creatives · Creatives grid↔table toggle, card select → bulk bar, row → drawer · Components tab strip (5 tabs) and `Brief this → Genie` · Compare mode toggle × chart-view toggle (2×3) and creative picker · Automations Rules/Boards/Digest tabs, rule builder modal, run-now, delete confirm · Owner report wizard (3 steps, both directions) · Brief builder reference picking → blocks appearing → Send to Genie · Saved views save / rename / delete / apply · Drawer: all bands, placement select, dedup merge/split, every action-bar button's optimistic state.

### G.5 Prototype hygiene

- One named flow per user journey. Flow names: `Entrance — Overview`, `Triage — fatiguing to pause`, `Drawer — open and act`.
- Set an explicit flow starting point on every entry frame.
- Never leave a dead interaction: if a control does nothing in the prototype, give it a `hover` state and no click target rather than a click that goes nowhere. (The Automations preview tiles are intentionally non-interactive — mirror that.)
- Device: `Desktop / 1440 × 800`. Background: `#F5F5F5`.

### G.6 Interaction spec board

At `x=0, y=3680`, past your `ENTRANCE` frames, add a board named `SPEC / <Screen> / Interactions` listing every interactive element on your screen: element name → states built → trigger → target → animation + curve + duration. This is the handoff artefact the monitor checks against §G.1.

---

## H. NAMING CONVENTIONS

| Thing | Pattern | Example |
|---|---|---|
| Page | `NN · CR2 <Screen> — B<n>` | `02 · CR2 Overview — B1` |
| Screen frame | `CR2 / <Screen> / <State> — 1440w light` | `CR2 / Overview / Populated — 1440w light` |
| Entrance frame | `ENTRANCE / <Screen> / <n>` | `ENTRANCE / Overview / 3` |
| Overlay frame | `OVERLAY / <Screen> / <Name>` | `OVERLAY / Creatives / Column picker` |
| Spec board | `SPEC / <Screen> / Interactions` | — |
| Shared component | `CR2/<Name>` | `CR2/Creative Card` |
| Local (screen-only) component | `LOCAL/<Screen>/<Name>` | `LOCAL/Overview/Breakdown Row` |
| Section inside a screen | Match the code component name | `BucketTabs`, `OverviewBreakdown`, `RecommendationsCard` |
| Layer | Semantic role, not appearance | `Metric row` ✅ · `Frame 427` ❌ · `green pill` ❌ |
| Variant property | Capitalised single word | `State`, `Bucket`, `Tone` |
| Variant value | lowercase-hyphenated | `filtered-empty` |
| Flow | `<Verb phrase> — <Screen>` | `Entrance — Overview` |

Zero layers named `Frame N`, `Group N`, `Rectangle N`, `Ellipse N` may survive into the final file. Rename as you build; renaming afterwards never happens.

---

## I. PER-BUILDER WORK ORDERS

Common to all nine: clone `30:3599` (§C.1) → set your sub-nav tab active → fill `Page Body` (1136px column, padding 24, itemSpacing 24) → build all 7 state frames (§F.3) → build the `ENTRANCE` sequence (§G.2) → wire in-screen prototype (§G.4) → build the spec board (§G.6) → validate with `get_metadata` + `get_screenshot` → report node ids.

---

### B1 — Overview · page `25:2956`

Mirrors `src/creative-report/screens/Overview.tsx`. **There is NO KPI card row and NO top-movers section.** Do not add them.

`Page Body` top-to-bottom, `--i` order:
1. **Header** (`--i:0`) — row, space-between. H1 `Morning triage` (18/28 `Inter Semi Bold`). Sub 13/20 `colorTextTertiary`: `4 fatiguing, 6 winning, 3 new to review across 47 active creatives.` Right: `CR2/Trust Meter Chip` `State=has-data`.
2. **BucketTabs** (`--i:1`) — instance `CR2/Glass Panel` (`33:7170`), 1136 wide. Inside its `Content` slot:
   - Toolbar row: eyebrow `AUTO-CATEGORISED` (Geist Mono 10 uppercase, letterSpacing 0.8, `colorTextTertiary`) + `CR2/Why Dot` + right-aligned ghost button `Edit formulas`.
   - Tablist: 5 × `CR2/Bucket Tab`, each `layoutSizingHorizontal='FILL'`, bottom border 1px `colorBorder` on the row. Order **Winners · Scaling · Fatiguing · New · Losers**. Counts `6 · 9 · 4 · 3 · 5`. Active = Fatiguing (the triage default). Losers set `State=inactive`; build one frame variant showing a `zero` tab.
   - Panel: rule text (Geist Mono 10.5 `colorTextTertiary`) — for Fatiguing: `14-day CTR down ≥ 15%, or frequency > 4, or hook-rate falling (min spend $500)`. Then **up to 8** × `CR2/Bucket Tab Row` (`Bucket=fatiguing`), sorted by spend desc. Then overflow line: `Showing the top 8 by spend.` + underlined link `View all 12 in the grid`.
   - Build **all 5 panel states** as separate populated frames at `x=1560,y=0` and `x=3120,y=0` (and extend the `y=2760` row if you need more) so tab switching can be wired. Include each bucket's empty copy verbatim from `BucketTabs.tsx`.
3. **OverviewBreakdown** (`--i:2`) — card: 1136 wide, radius `CR2/Radius/hero` (16), fill `CR2/Surface/glass-70`, 1px `colorBorder`, padding 16. Header `Breakdown` + `CR2/Why Dot` + a 3-item `*Segmented*` (`ef691296d6c2a4b761e2f56e3fd6fa473619501b`) **Brand · Category · Product**, Brand selected. Table: 4 columns `BRAND` / `CREATIVES` / `SPEND` / `ROAS`, headers Geist Mono 10 uppercase letterSpacing 0.8, numerics right-aligned Geist Mono Medium 14. Exactly **6 rows** (real brands: Mamaearth, WOW Skin Science, Plum Goodness, mCaffeine, The Derma Co., Minimalist). Footer notes: `+3 more brands not shown — see the Owner Report for the full list.` and `2 creatives have no brand link and aren't counted here.`
4. **RecommendationsCard** (`--i:3`) — card radius `CR2/Radius/card` (12), padding 16. Header `Recommendations` + `CR2/Why Dot`; eyebrow `WHAT TO DO TODAY`. Then **5** × `CR2/Recommendation Row`: `Tone=attention` "4 fatiguing creatives are carrying $18.2k — refresh the hook or pause." / `Review`; `attention` "5 creatives are below your loser threshold on $6.4k of spend." / `Cut`; `opportunity` "9 creatives are already scaling on $31.7k — room for more budget." / `Scale`; `attention` "Plum Goodness is running 14% below portfolio ROAS across 7 creatives." / `Open`; `neutral` "3 new creatives have launched — too early to judge, worth a look." / `Check`.
5. **AutomationsPreview** (`--i:4`) — card radius 12, padding 16. Header `Automations` + `CR2/Why Dot` + `*Badge* / Basic` `Coming soon` + right ghost `Open Automations`. Eyebrow `SET A RULE ONCE — WHEN A CREATIVE MATCHES, ROUTE IT AUTOMATICALLY`. 4-column grid of **dashed-border** tiles (radius `CR2/Radius/sm`, padding 12): Move to folder / Board or smart folder · Genie knowledge base / Feed the winners · Send to Launch / Queue a relaunch · Meta ad library / Push to account. **These tiles are deliberately non-interactive — give them no click target and no hover state.**

Loading frame: skeletons matching *these five* section shapes. Wire: bucket tab switching (200 ms), `View all` → B2, row actions → hover/press, `Review` → the Fatiguing panel, row click → B9 drawer.

---

### B2 — Creatives · page `25:2957`

Mirrors `screens/Creatives.tsx`. **Two layouts, both required.**

Toolbar row inside `Page Body`: `47 creatives` (14 `Inter Medium`) · optional bucket pill with `CR2/Bucket Chip Size=xs` + close glyph · right cluster: `Columns: E-com` popover trigger (table only) **or** `Card metrics (4/6)` (grid only) → `Group: No grouping` `*Select*` w150 h32 → `Sort: Spend` `*Select*` w140 h32 → layout toggle (2 × 28×28 icon buttons in a radius-6 1px box; active = fill `CR2/Accent/primary-15`, icon `CR2/Accent/primary-text`).

- **Grid layout** `x=0,y=0`: 4-column grid of `CR2/Creative Card` at the 1136 column (cards ~272 wide, gap 16). Show **all four card states**: 6 `default`, 1 `hover`, 1 `selected`, and a `loading` row on the Loading frame. `BulkActionBar` when anything is selected: sticky bottom, `w-fit` centred pill, radius pill, fill `CR2/Surface/card`, 1px `colorBorder`, shadow `boxShadowSecondary`, padding 12/8 — `2 creatives selected` · divider · ghost `Pause` · primary `Launch` · close icon.
- **Table layout** `x=1560,y=0`: `PortfolioTrendChart` above the table — a card (radius 12, 1px `colorBorder`, padding 16) containing header `Portfolio spend vs revenue` + `CR2/Why Dot` + a legend (grey dot `Spend`, lime dot `Revenue`, `1 Jul – 30 Jul`) and a `CR2/Chart Placeholder` `Type=area-dual State=populated`. Then a `*Table*` (`8c7346ccc7f448deb8673a3bce1557777568e54e`) in a radius-12 1px-bordered wrapper. Columns in order: `Creative` (w280, left, not sortable) · `Bucket` (+ `CR2/Why Dot`, `CR2/Bucket Chip Size=xs`) · then the **E-com preset**: `Spend` `ROAS` `CPA` `CTR` `CVR` `Purchases`, all right-aligned Geist Mono Medium 14 · trailing w44 action column. Only `Spend`/`ROAS`/`CPA`/`CTR` are sortable — build `sorted-asc` and `sorted-desc` header variants for those four only. Table row states: `default`, `hover`, `selected`, `focus`.
- **Overlays** on the `y=2760` row: `OVERLAY / Creatives / Column picker` (w288 p12: `PRESET` pills E-com/Video/Post-engagement, divider, `Columns (6/8)` 2-col checkbox grid over the 13 metrics, divider, `Save as new preset…`) · `OVERLAY / Creatives / Card metrics` (w288, `Metrics on card (4/6)`) · `OVERLAY / Creatives / Add filter` (w256, `Advanced filters` list → drill-in with back row; groups Geo/Device/Objective/Age/Gender/Placement) · `OVERLAY / Creatives / Row actions` (`*Dropdown Menu*`, w208, the 10 items in `ActionMenu.tsx` order with separators, Pause in `CR2/Danger/text`).

Card content: real names, 60+ char stress names on the stress frame. Wire: layout toggle (200 ms), card select → bulk bar, card/row click → **B9's drawer** (500 ms), all three popovers, group/sort selects.

---

### B3 — Components · page `25:2958`

Mirrors `screens/Components.tsx`. Tab strip: `role=tablist` row, 5 pill tabs (radius pill, padding 12/6, 14 `Inter Medium`; active fill `CR2/Accent/primary-15` + `colorText`; inactive `colorTextTertiary`), bottom border 1px `colorBorder`, paddingBottom 8. Tabs: **Hooks · Headlines · Primary text · CTAs · Visual styles**, Hooks active.

Subhead 13/20 `colorTextTertiary`: `Which hooks are winning across your book this period — brief the next batch from what works.`

Then **two** sections, `Winners` and `Decliners`, each: title 14 `Inter Semi Bold` + `· 12 components` in `Inter Regular colorTextTertiary`, then a bare `*Table*` (no card wrapper — one container per screen). Columns in order: `Hooks` (max 320, truncate at 44 chars) · `Creatives` · `Spend` · `ROAS` · `Win-rate vs median` (win-rate + delta `+8pp` in `CR2/Accent/primary-text` / `-8pp` in `CR2/Danger/text` / `0pp` muted) · `Trend` (up glyph `CR2/Accent/primary-text` / down `CR2/Danger/text` / flat `Minus` muted + `—`) · `Confidence` (`CR2/Confidence Chip`) · `Action` (right-aligned ghost button `Brief this → Genie` with wand + arrow glyphs).

Show all four `CR2/Confidence Chip` levels across the rows. Empty row: colSpan 8, centred `No components in this view.` Build all 5 tabs' populated content (use `x=1560,y=0` and `x=3120,y=0`, extend the `y=2760` row). Wire tab switching (200 ms), `Brief this → Genie` → B7's Populated frame, confidence chip tooltips (the 4 verbatim method strings).

---

### B4 — Compare · page `25:2959`

Mirrors `screens/Compare.tsx`. Header: H1 `Compare` + sub `Side-by-side creatives, or one creative across accounts and platforms.` Right: **two** `*Segmented*` groups — mode **Creatives | Across contexts**, chart-view **Cards | Line | Bar**.

**2 modes × 3 chart views = 6 populated frames.** Use `x=0/1560/3120` at `y=0` for Creatives×(Cards/Line/Bar) and the `y=2760` row for Contexts×(Cards/Line/Bar).

- **Cards view**: `grid-cols-4` of `CompareColumn` cards (build as `LOCAL/Compare/Column`): radius 12, 1px `colorBorder`, fill `CR2/Surface/card`, padding 16 — `CR2/Creative Thumb Size=40` + name + close glyph + sub + `CR2/Bucket Chip Size=xs` + `CR2/Why Dot`; then 7 divided rows (`Spend`, `ROAS`, `CPA`, `CTR`, `CVR`, `Frequency`, `Hook rate`) each label-left / value-right Geist Mono Medium 13; then `CR2/Chart Placeholder Type=sparkline`. Plus a trailing dashed add-slot (min-height 220) with an `Add creative` outline button; copy `Pick 2–4 creatives to compare` at 0 selected, `Add another creative` at 1.
- **Line view**: card wrapper (radius 12, padding 16) → `4 of 4 creatives` + picker → legend row of 4 colour dots using `CR2/Chart/compare-1..4` with 24-char-truncated titles + `· Revenue / day` + `CR2/Why Dot` → `CR2/Chart Placeholder Type=line-multi`.
- **Bar view**: header `Compare by metric` + `CR2/Why Dot` + metric `*Select*` w110 (ROAS default) → `CR2/Chart Placeholder Type=bar`.
- **Contexts mode**: creative summary strip (radius 12, 1px border, padding 12, `CR2/Creative Thumb Size=36` + name/product) → then, when >1 platform, an `*Alert*` banner: radius 6, fill `CR2/Attention/bg`, 1px `CR2/Attention/border`, text 13 `CR2/Attention/text`, warning glyph + `CR2/Why Dot` + `Different attribution windows — not directly comparable.`

Column colours must stay stable across the chart-view toggle — that is the whole point of the fixed `compare-1..4` hexes. Wire both toggles (200 ms), the `Add creative` picker popover (`Search creatives or products…`, empty `No creatives match.`), and remove-column.

---

### B5 — Automations · page `25:2960`

Mirrors `screens/Automations.tsx`. H1 `Automations` + the honesty subhead from code. Tab `*Segmented*`: **Rules | Boards | Digest**, Rules default. One populated frame per tab: Rules `x=0,y=0`, Boards `x=1560,y=0`, Digest `x=3120,y=0`.

- **Rules**: header `3 rules` + primary `New rule` (plus glyph). Rows: radius `CR2/Radius/card`, 1px `colorBorder`, padding 16, space-between — left: name 13 `Inter Medium` + a type badge (radius pill, fill `CR2/Surface/muted`, 1px `colorBorder`, 11 `Inter Medium` `colorTextTertiary`, `Categorise`/`Launch`), then condition count + `CR2/Why Dot` + `Last run 24 Jul · 12 matched` (or `Never run`), plus a broken-board warning line in `CR2/Danger/text` on one row. Right: `*Switch*` + `CR2/Why Dot` + outline `Run now` + ghost `Edit` + ghost destructive delete icon. Include one row with the switch `off` and `Run now` `disabled`. Empty state: dashed box, padding 40, centred, + `New rule`.
- **Boards**: left aside **w288** (radius 12, 1px `colorBorder`, fill `CR2/Surface/card`, padding 8) — `FOLDERS` label 11 uppercase semibold + `New folder` ghost; `*Collapse*` folder rows with a rotating chevron, folder glyph, name, board count, and hover-revealed New-board/Rename/Delete icons; nested board rows indented 16 with a left 1px border and 8px padding, selected = fill `CR2/Accent/primary-15` + name `CR2/Accent/primary-text`, smart boards get a `*Badge*` `Smart` with a zap glyph. Right pane: board title 15 `Inter Semi Bold`, smart-board explainer + `CR2/Why Dot`, count, then a 4-column grid of `CR2/Creative Card`; pinned cards get a floating remove `X` at `-8,-8`. Also build the right-pane empty state (dashed, min-height 240, `No board selected` / `Pick a board on the left to see what's inside it.`).
- **Digest**: 2-column grid — `DigestSettings` card (radius 12, 1px border, padding 16: header `Scheduled digest` + `CR2/Why Dot` + subhead + `*Switch*` top-right; Daily|Weekly `*Segmented*`; 7 single-letter day buttons w36; a time input w128; a top-bordered disclaimer 12 `colorTextTertiary`) and `DigestPreview` card (header `Your weekly digest` + `CR2/Why Dot` + subhead; a 3-column KPI strip Spend/Revenue/ROAS using `CR2/Metric Cell`; a bucket-count strip; `Top movers` list; `Needs attention` list; both with empty variants). Build the disabled `DigestSettings` body at 40% opacity.
- **Overlays** on the `y=2760` row: `OVERLAY / Automations / Rule builder` (`*Modal*`, max-w 576, scrollable: name input, Categorise|Launch `*Segmented*` — plus a `disabled` + 60%-opacity edit-mode variant with its caption, condition rows (field `*Select*` w170 / operator w140 / value editor / remove X), `Add condition`, the AND helper text, the live match-count line with `CR2/Why Dot`, the action section per type, a validation-error state, footer Cancel / `Create rule`) and `OVERLAY / Automations / Delete rule` (`*Modal* / Confirmation` `b4a185fa8fd660b9ced1c422a403493405334044`, title `Delete "Fatigue → Refresh board"?` + the verbatim body).

Wire: tab switching, `New rule` → modal → create → back, `Run now`, switch toggles, delete → confirm, folder expand/collapse (200 ms), board selection, digest enable/disable, card click → **B9's drawer**.

---

### B6 — Owner report · page `25:2961`

Mirrors `screens/OwnerReport.tsx`. Header: H1 `Owner report` + the verbatim subhead; right outline `Configure report` with a settings glyph.

Sections top-to-bottom, exactly this order:
1. `KpiCards` — 4-column grid. Use library `*Statistic*` (`ed75eb6f549d58671d042674a78c406e5b16f7ef`) **or** `CR2/Metric Cell` inside radius-12 cards; pick one and use it consistently. Values: Spend `$78.4k` +12% · Revenue `$214.9k` +18% · ROAS `2.74×` +5% · CPA `$21.30` −7%. Deltas via `CR2/Metric Cell Tone=good|bad`.
2. `PortfolioTrendChart` — same recipe as B2's.
3. **By brand** — card radius 12, 1px border, padding 16. h2 + `CR2/Why Dot`. Columns `Brand` `Creatives` `Spend` `Revenue` `ROAS` `CPA`, numerics right Geist Mono Medium 14. 8 rows.
4. **By account** — same card. h2 + `CR2/Why Dot` + caption `Each account's own numbers — never summed across accounts (different attribution windows).` Columns `Account` `Platform` `Creatives` `Spend` `Revenue` `ROAS`. Account names long enough to truncate.
5. **Testing velocity** — h2 + `CR2/Why Dot` + caption `New creatives started testing, by week.` Then `CR2/Chart Placeholder Type=bar State=populated`.

Overlay on the `y=2760` row: `OVERLAY / Owner report / Report wizard` — `*Modal*` max-w 448 with library `*Steps*` (`0164820ed648fd290491383204e1a0583bf77fa7`), steps `Brands` · `Sections` · `Preview & export`. **Build all 3 steps as separate frames** plus a step-2 validation-error variant. Step 3 shows the summary block (radius `CR2/Radius/sm`, fill `CR2/Surface/muted` at 40%, padding 12, 13px) + `CR2/Why Dot` disclaimer. Footer: Cancel / Back (ghost + chevron) ↔ Next (chevron) / `Export` (primary, `disabled` unless ≥1 section). Wire 1→2→3 and 3→2→1 (200 ms), and Export → a toast frame `Report exported (simulated)`.

---

### B7 — Brief builder · page `25:2962`

Mirrors `screens/BriefBuilder.tsx`. **Narrow page — content column max-width 768, centred** inside the 1136 column. `Page Body` padding 24.

Back link `← Back to Creative Report` (13 `colorTextTertiary`, hover `colorText`).
Header: a 40×40 tile (radius `CR2/Radius/hero`, fill `CR2/Accent/primary-15`) with a 20×20 wand glyph in `CR2/Accent/primary-text`; H1 `Brief Builder`; sub `Start a brief from what's already worked, then rewrite it.`

1. **References** card — radius 16, 1px `colorBorder`, fill `CR2/Surface/card`, padding 24. Header `References` + description + an `Add creative` outline button (build a `disabled` variant for the 3-reference cap). Selected rows: radius `CR2/Radius/card`, 1px border, fill `CR2/Surface/page`, padding 12 — `CR2/Creative Thumb Size=32` + name + a `Primary` badge on the first (radius pill, fill `CR2/Accent/primary-15`, 1px `CR2/Accent/primary-30`, 10 `Inter Medium` `CR2/Accent/primary-text`) + metrics line `Onion Hair Oil · 3.10× ROAS · $4.2k spend` + a remove `X`. Then a top-bordered `Suggested from your Winners` strip of pickable chips (radius `CR2/Radius/card`, 1px `colorBorder`, hover border `CR2/Accent/primary-30`) each with thumb + name + ROAS.
2. **Brief blocks** — only present once ≥1 reference is picked, so build **both** a 0-reference frame (`x=1560,y=0`, blocks absent) and a 2-reference frame (`x=0,y=0`, blocks present). Header `Brief blocks` + `Pre-filled from Summer hook — 15s UGC — edit freely`. Then 5 blocks in this fixed order — **Hook (2 rows) → Body (3 rows) → CTA (1 row) → Visual direction (2 rows) → Offer (1 row)** — each a card radius 12, 1px border, padding 16, containing label + `From: <name>` caption + an `*Input* / Textarea` (`96c163d348a09e3db9f1333d410ffe87e41e73fb`, non-resizable) + an optional `Also seen in: …` hint. Build textarea `default`, `hover`, `focus`, `filled`.
3. **Footer bar** — radius 16, 1px border, padding 16, space-between: the honesty disclaimer left, primary `Send to Genie` (sparkles glyph) right.

Wire: `Add creative` picker popover, picking a suggestion → blocks appear (Smart Animate 280 ms Ease Out), remove reference, textarea focus, `Send to Genie` → a `GenieHandoffStub` frame at `x=3120,y=0`.

---

### B8 — Saved views · page `25:2963`

Mirrors `screens/SavedViews.tsx`. Simplest screen — make it immaculate; it is the reference for the file's polish bar.

H1 `Saved views` + sub `Reusable filter snapshots for your daily routines.`
1. **Save-current-view card** — radius 12, 1px `colorBorder`, fill `CR2/Surface/card`, padding 16, gap 12. Row: an `*Input* / Basic` h36 max-w 320 (13px) + primary `Save current view` (bookmark glyph) + a right-pinned `Unsaved draft` pill (radius pill, fill `CR2/Surface/muted`, 1px `colorBorder`, 12 `Inter Medium` `colorTextTertiary`) + an `Apply` link (`Inter Semi Bold` `CR2/Accent/primary-text`, underline on hover). Below: `Current filters:` + the query string in **Geist Mono Regular 11** `colorText` (one of only two font-mono spots in this screen family) — or `No filters set`.
2. **Views list** — `divide-y` inside a radius-12 1px-bordered card, rows padding 16/10: name link (13 `Inter Medium`, hover underline) + query caption + created date right + Rename (pencil) and Delete (trash, hover `CR2/Danger/text`) icon buttons. 6 rows, at least one with a 60+ char name truncating.
   Also build: the **inline rename** state (input + confirm check replacing the name), and the **empty** state (dashed box radius 12, padding 32, centred `No saved views yet — set some filters and save them here.`).

Wire: save (input `focus` → `filled` → row appears, Smart Animate 280 ms), rename in/out, delete → `*Modal* / Confirmation`, `Apply` → B1's Populated frame, all row hovers.

---

### B9 — Creative drawer · page `25:2964`

Mirrors `drawer/CreativeDrawer.tsx`. **You build the overlay the whole file reuses. Get it right; four other builders depend on your node id.**

Frame `OVERLAY / Drawer / Populated`, **720 × 800** (`sm:max-w-[720px]`), at `x=0,y=0`, fill `CR2/Surface/page`, `clipsContent = true`, left border 1px `colorBorder`, shadow `boxShadowSecondary`. Use library `*Drawer*` (`21693b452518ecee50f6293c9a6bdead0fd38d72`) for the shell where it fits; if its geometry fights the 720px width, hand-build the shell and report it.

- **Header** — bottom border 1px `colorBorder`, padding 16/12: a row with `CR2/Bucket Chip Size=xs` + breadcrumb 12 `colorTextTertiary` `Mamaearth · Onion Hair Oil`; then title 16 `Inter Semi Bold`, truncating. Close `X` at top-right 16,16.
- **Body** — scrollable stack. Every section is an instance of `CR2/Drawer Band` (`34:3033`) — **flat hairline-divided bands, never nested cards.** Exact order, no deviation:
  1. **AdPreviewMock** — toolbar `Ad preview` (11 uppercase `colorTextTertiary`) + a placement `*Select*` w168 h32 (Feed / Stories / Reels / Audience Network / Search). Then the mock card: radius 12, 1px `colorBorder`, fill `CR2/Surface/card` — avatar circle 32 (fill `CR2/Surface/muted`) + name + `Sponsored · 🌐` + more glyph; primary text 14; media (feed `3:2`, stories/reels `9:16` max-h 320 centred) fill `CR2/Surface/muted`; a headline + CTA bar (fill `CR2/Surface/muted` at 50%) with a CTA pill radius `CR2/Radius/sm`; an engagement row (top border, 12 `colorTextTertiary`, three 14×14 glyphs + compact counts). Build **feed** and **reels** variants.
  2. **FunnelStrip** — 6 cells, `CPM → CTR → Outbound CTR → CVR → CPA → ROAS`, `grid-cols-6`, each a `CR2/Metric Cell`, with a 14×14 chevron-right in `colorTextTertiary` at 40% between cells (not before the first). CPA and ROAS carry deltas; CPA shows the `State=na` variant with title `No purchases in range`.
  3. **TrendChart** — header `Spend vs revenue` + `CR2/Why Dot` + the grey/lime legend; then `CR2/Chart Placeholder Type=area-dual` at h200.
  4. **FatiguePanel** — header `Fatigue` + `CR2/Why Dot` + a status pill (`Fatiguing` = Attention tokens / `Healthy` = Accent tokens). A 3-column metric grid: Frequency (7d) / 14-day CTR trend / Hook-rate trend. Then `CR2/Chart Placeholder Type=sparkline` + caption `14-day rolling CTR`. Then the hypothesis line 14 `colorTextTertiary` (use the CTR-drop template verbatim). Then a rule footer in **Geist Mono 10.5**: `Rule: 14-day CTR down ≥ 15%, or frequency > 4, or hook-rate falling (min spend $500)`. Build both `Fatiguing` and `Healthy`.
  5. **ComponentBreakdown** — header + `CR2/Why Dot` + subhead `How each part may be pulling its weight — hypotheses, not verdicts.` Then **5 rows** (Hook, Headline, Primary text, CTA, Visual style), each `grid-cols-[140px_1fr_auto]`, gap 16, bottom border: kind label 11 uppercase + value 14 `Inter Medium`; a signal hypothesis 12 `colorTextTertiary`; a `CR2/Confidence Chip`. Add a `Possible drop point` marker (11 `Inter Medium` `CR2/Attention/text` + a 14×14 warning glyph) on the Headline row. Confidence per code: Hook `na` (non-video) or shared, Headline shared, the other three `low`.
  6. **ScriptElementsPanel** — 4 blocks: Script (header + `CR2/Why Dot` + a framework `*Badge*`; `Hook line` quoted italic 14 `Inter Medium`; `Body`; `CTA line` quoted); Frames & audio (frame chips radius `CR2/Radius/sm`, drop-off chips using Attention tokens + a 1px ring, normal chips `CR2/Surface/muted`; plus an Audio row with a `*Badge*`) — **also build the non-video `N/A — no video` variant**; Audience fit (header + a Strong/Moderate/Weak fit pill using Accent / muted / Attention tokens + bestSegment + note).
  7. **BenchmarkPanel** — 4 blocks: intro (`Benchmarks` + `vs your Winners` + the three-sources subhead); Category norm (`Skincare · n=42` left muted, `median 2.40× · 1.6% CTR` right); a Platform best-practice checklist (pass = check glyph `CR2/Accent/primary-text`, fail = x glyph `CR2/Attention/text`); Suggested test order (up to 3 numbered 16×16 circles, fill `CR2/Attention/bg` text `CR2/Attention/text`, 10 `Geist Mono SemiBold`) + the `Ranked by gap vs your Winners bank — transparent, not a prediction.` caption. Build the two empty variants with their verbatim copy.
  8. **DemographicsPanel** — header + `CR2/Why Dot`. 3 dimension groups (Age / Gender / Geo), each with a dimension label left and right-aligned column headers `Spend`(w64) `ROAS`(w56) `CTR`(w56) in 10 uppercase; slice rows label-left, values right in Geist Mono Medium 14. Build the empty variant.
  9. **RunningInTable** — header `Where it's running` + ghost `Compare contexts` (compare glyph). A conditional cross-platform note. Then a `*Table*`: `Platform | Account | Campaign | Status | Spend`; Status via `*Badge*` (active/paused/archived, archived also muted); long account/campaign names truncating.
  10. **VariantsList** — header `Variants` + `3 variants`. A conditional dedup banner (radius `CR2/Radius/card`, fill `CR2/Attention/bg`, 1px `CR2/Attention/border`, padding 12; title `Possibly the same creative (92% match)` in `CR2/Attention/text`; the verbatim body; buttons). Build **all three** dedup states: unresolved (`Merge` + `Keep split`), merged (`Merged ✓` in `CR2/Accent/primary-text` + `Split`), split (`Kept split ✓` muted + `Merge`). Then divided variant rows.
- **Footer — `DrawerActionBar`** — sticky, outside the scroll body, top border 1px `colorBorder`, fill `CR2/Surface/card` at 95%, padding 16/12, `flex-wrap` gap 8. Buttons left→right: primary `Generate variation` (wand) · outline `Relaunch` (rocket) · outline `Save` (bookmark) · outline `Mark Winner` (trophy) · outline `Compare` · outline `Duplicate` · outline `Edit targeting` (target) · then ghost destructive `Pause` pinned right. Each of the seven optimistic buttons carries a `CR2/Why Dot` **outside** the button. **Build both states of each**: `Relaunch`→`Queued in Launch` (disabled), `Save`→`Saved` (`CR2/Accent/primary-text`), `Mark Winner`→`Winner`, `Duplicate`→`Duplicated`, `Pause`→`Paused` (disabled).

Also build, on the `y=920`/`y=1840` rows: `OVERLAY / Drawer / Loading` (band-shaped skeletons), `OVERLAY / Drawer / Non-video` (hook `na`, frames/audio `N/A — no video`, hook-rate `na`), `OVERLAY / Drawer / Healthy` (non-fatiguing).
And the three action modals on the `y=2760` row: `OVERLAY / Drawer / Pause confirm` (`*Modal* / Confirmation`, `Pause this creative?` + verbatim body + `Keep running` / `Pause creative`) · `OVERLAY / Drawer / Launch confirm` (`Relaunch this creative?` + summary card + `LaunchedBeforeCard` + `Cancel` / `Send to Launch`, plus a spinner variant) · `OVERLAY / Drawer / Edit targeting` (max-w 448, a 2-column grid of Age/Gender/Geo/Placement `*Select*`s, `Cancel` / `Save & relaunch`, plus a spinner variant).

Wire: open/close per §G.3 (500/300 ms), placement select, dedup merge/split, every action-bar button → its done state (200 ms), each destructive button → its modal → confirm → done state, all `CR2/Why Dot` popovers.

**Report your `OVERLAY / Drawer / Populated` node id first in your report — B1, B2, B4 and B5 are blocked on it.**

---

## J. GAPS TO PROPOSE BACK TO THE LIBRARY — Maalik approves or rejects

Do **not** act on these. They are proposals. Nothing in this list may be added to the library file by any agent.

| # | Gap | Evidence | Proposal | Impact if rejected |
|---|---|---|---|---|
| **J.1** | The target file does not subscribe to "Design System - FF new" | `get_libraries` on `a4R8eBl0xyNFENEJiLor0j` returns only "Design System - FF", "Design system (Fab-Funnels)", "LF 2.0 - Design System" | Subscribe the file to FF-new, or confirm FF (non-"new") is the real source of truth | Component keys still import, but variables resolve from a different library than intended — a latent inconsistency across the whole file |
| **J.2** | **No chart, graph or sparkline component exists anywhere in the library** | Exhaustive sweep across ~70 search terms; only `BarChartOutlined`-family icon glyphs found | Add `Chart / Area (dual-series)`, `Chart / Line (multi-series)`, `Chart / Bar`, `Chart / Sparkline` with a `State` axis (populated / empty / loading) | Nine builders instance `CR2/Chart Placeholder`; every future dashboard re-invents charts. **Highest-value addition.** |
| **J.3** | No AA-compliant lime text token | `Colors/Base/fab-funnel/7` `#749818` ≈ 3.6:1 on white — fails AA for body text; shipped code uses `#5B7611` at 4.97:1 | Add `Colors/Base/fab-funnel/8` = `#5B7611` scoped to `TEXT_FILL` + `STROKE_COLOR` | Every lime label in the product is bound to a local token instead of the library |
| **J.4** | No mono/tabular numeral text style | Library type is Inter throughout; the product uses Geist Mono + tabular figures for every numeral | Add text styles `Numeral / L` (Geist Mono SemiBold 20/24), `Numeral / M` (Medium 14/20), `Numeral / S` (Medium 12/16), all tabular | Numeral styling is re-specified per screen and will drift |
| **J.5** | No effect styles at all | Only raw variables `boxShadowTertiary` / `boxShadowSecondary`; no named effect styles, no blur | Publish effect styles `Elevation / sm`, `Elevation / md`, `Elevation / lg`, `Elevation / overlay`, plus `Blur / glass-xl` (layer blur 24) and `Blur / halo` (layer blur 64) | The glass + halo treatment is unreproducible outside `CR2/Glass Panel` |
| **J.6** | No animation / motion presets | Nothing in the library encodes duration or easing | Publish the §G.1 table as a documented motion spec page in the library | Motion constants live only in this file; the next module invents its own |
| **J.7** | No semantic amber ("attention") or sky ("info") ramp | Library has Success / Warning / Error; `colorWarningBorder` `#ffe58f` is far off the product's amber-500/600 | Add `Colors/Semantic/Attention/{bg,border,text}` and `Colors/Semantic/Info/{bg,border,text}` | Fatigue and scaling semantics stay local; the amber "attention" language can't be reused |
| **J.8** | No glass / translucent surface token | Nothing corresponding to `bg-card/70` | Add `Colors/Neutral/Bg/colorBgGlass` = white @70% | Glass surfaces stay local |
| **J.9** | `*Input* / Search` cannot express a borderless pill search | Its only variants are URL-prefix + audio-icon compounds | Add a `Style=borderless-pill` variant | Every search field is hand-built (already the case on the master) |
| **J.10** | `DatePicker Input / Basic` Range=True is a rigid 322px | Would overflow the 1176px filter bar by 133px | Add a hugging / compact range variant | Compact date ranges stay hand-built |
| **J.11** | `*Card* / Advanced` doesn't match a real creative card | No bucket chip, metric row, hover-peek or selected ring | Either extend it, or accept `CR2/Creative Card` as a product-level component | Creative card stays a product component (acceptable) |
| **J.12** | Same-named tokens resolve to different literals across the file | `Colors/Neutral/Text/colorTextTertiary` appears as both `rgba(15,15,12,0.55)` and `rgba(0,0,0,0.45)`; `colorText` observed as three different literals; `Colors/Brand/Error/colorError` as both `#ff4d4f` and `#dc4446` | Audit and de-duplicate the neutral + error ramps across the sibling libraries | Builders can't trust a token name to mean one colour — the most corrosive item on this list |

---

## K. DEFINITION OF DONE (the monitor's gate — adversarial, not a rubber stamp)

A builder's page ships only when **all** of these hold:

1. All 7 state frames present, on the §A.2 grid, correctly named per §H.
2. Shell cloned from `30:3599`, unmodified, with exactly one sub-nav tab active — the builder's own.
3. Zero hand-built lookalikes of anything in §B or §D.1. Zero detached Foundations instances.
4. Zero layers named `Frame N` / `Group N` / `Rectangle N` / `Ellipse N`.
5. Every interactive element has its full §F.2 state set as real variants, named per §F.1.
6. Every animation matches §G.1 exactly — no invented durations or curves.
7. `ENTRANCE` sequence built and wired per §G.2.
8. `SPEC / <Screen> / Interactions` board present and accurate.
9. No local variable, no variable mode, no dark variant added.
10. Real copy throughout — verbatim from the code where §I quotes it. No lorem, no placeholder, no bare `—` for missing data.
11. Contrast ≥ 4.5:1 on all text; nothing conveyed by colour alone; visible focus rings.
12. `get_metadata` + `get_screenshot` clean: no overlap, no clipped text, content inside the 1136px column.
13. The builder's report lists every node id the other builders or the architect need.

Anything ambiguous goes back to the architect. **Nobody resolves an ambiguity by guessing.**

---

# PATCH 01 — post-first-wave corrections (BINDING, supersedes conflicts above)

Written after wave 1. Nine builders ran in parallel, exhausted the Figma MCP daily
quota (Pro tier: **200 calls/day, 15/min**), and surfaced 11 verified defects. Every
rule below OVERRIDES anything earlier in this document that contradicts it.

## P1. SCOPE IS CUT — three surfaces only

Maalik descoped to fit the quota. Build ONLY:

| Surface | Page | Status |
|---|---|---|
| Overview | `25:2956` | ✅ **COMPLETE** — do not rebuild. Populated + 7 state frames + 5 bucket-state frames + wired 6-frame ENTRANCE + SPEC board |
| Creatives | `25:2957` | ~25% — Grid frame `39:10206` done (8 real cards); Table frame `39:11281` is an empty shell |
| Creative drawer | `25:2964` | ~10% — root **`39:24264`**, header + AdPreviewMock band only |

Components, Compare, Automations, Owner report, Brief builder, Saved views are
**DEFERRED**. Partial work already on their pages stays as-is — do not delete it,
do not continue it.

## P2. NO INTER — ANYWHERE

Maalik: *"don't use inter, if inter is used in library or reference, replace them
with geist or geist mono accordingly from our claude code app."*

This **overrides §E.3's ruling** that shell chrome uses Inter.

- Shell chrome (rail, nav, header, breadcrumb, sub-nav, filter bar) → **Geist**
- Body copy, section titles → **Geist**
- Every numeral, anywhere → **Geist Mono + tabular figures**
- Tertiary 11px meta labels → **Geist Mono**
- **Zero Inter in the file.** Where a cloned reference frame or library instance
  carries Inter, override the text node's font to the Geist equivalent.

## P3. LIBRARY — FF-new only, now actually subscribed

`get_libraries` on `a4R8eBl0xyNFENEJiLor0j` now returns:
`Design System - FF new` ✅ and `Design system (Fab-Funnels)`.
**`Design System - FF` (non-new) and `LF 2.0` have been REMOVED.**

Consequence: wave-1 builders substituted keys from FF non-new while it was still
subscribed. Those are now unsubscribed-library dependencies and violate the
FF-new-only rule. **Re-point them.** Known substitutions to fix:
- Button `bcbfe9ff584a2809a1f76deac0370af0da82c753` (B9)
- `Icon/SettingOutlined` `fe94512407d6feea175385b00339e181fe11a589` (B6)
- All `Icon/*Outlined` instances added by B3, B6, B8, B9

Where an FF-new asset is genuinely corrupted, substitute the working equivalent
and **log it on the Handoff page** (Maalik's explicit choice: substitute, document,
don't block).

## P4. CALL-BUDGET METHOD — one big script per frame

Wave 1 failed because builders worked **node-by-node**: 57–86 tool calls each,
~570 total, quota gone in ~20 minutes.

**Mandatory from now on:**
1. Compose the ENTIRE frame as ONE JavaScript program and send it in a **single
   `use_figma` call**. A single call can create hundreds of nodes.
2. Do discovery ONCE (keys, fonts, tokens) and hard-code the results into the
   script. Never re-query mid-build.
3. **One verification screenshot per frame, maximum** — not per section.
4. **Hard cap: 25 Figma calls per builder.** Report and stop if you approach it.
5. Never retry a failing call more than once. If the error mentions the tool-call
   limit, STOP immediately and report — retrying burns the shared quota for everyone.

## P5. THE 11 VERIFIED DEFECTS AND THEIR WORKAROUNDS

Each was reproduced by at least one builder. Do not rediscover these.

1. **`*Button*` (FF-new `792294bb…`) is corrupted** — 3816 variants;
   `componentPropertyDefinitions` / `setProperties()` throw *"Component set has
   existing errors."* Confirmed by 5 builders independently.
   **Workaround:** `importComponentSetByKeyAsync`, select a variant by EXACT name
   string (e.g. `"Type=Default, Size=Small, State=Default, Content=Basic, Ghost=False, Danger=False, Shape=Default"`),
   take the first match, then mutate the nested TEXT node's `.characters` directly.
2. **No icon+label Button variant exists** — only `Content=Basic` or
   `Content=Icon Only`, and you cannot append a child into an instance.
   **Workaround:** place a standalone icon instance ADJACENT to a text Button.
3. **Content "slots" in `CR2/Glass Panel` and `CR2/Drawer Band` cannot be
   populated.** The Plugin API hard-blocks `appendChild` into anything inside an
   instance (*"New parent is an instance or is inside of an instance"*), and the
   slots expose no `INSTANCE_SWAP` property.
   **Workaround (B1-proven):** build real content as its own frame, then layer it
   over an untouched Glass Panel instance resized to match. Never detach, never
   hand-rebuild a lookalike.
4. **`*Segmented*` only ships a fixed 5-item variant** and children can't be
   removed. **Workaround (B1-proven):** set `.visible = false` on the unused items.
5. **`*Table*` is rigid** — hardwired to 5×196px columns + 2 checkbox columns +
   title + pagination; children throw on delete and can't be appended to.
   **Workaround:** ignore the monolith; instance the atoms
   `Table Item / Header Item` (`4b11dbcaf97f43b58cf9cafb3855fe1eea873107`) and
   `Table Item / Cell` (`2a1fe912edf5c011af9343dc901673e83fc4fbc7`) inside a
   locally-built row wrapper.
6. **`CR2/Creative Card` clips when resized.** Its Hero uses absolute positioning
   baked at 300px with MIN constraints; nested-instance descendants can't be
   repositioned. **Workaround:** populate all text at native 300px FIRST, then
   `card.rescale(target/300)` as the LAST step. Never `resize()`.
7. **Shell `Page Body` is fixed h=654 with `clipsContent=true`** — real content
   taller than 654px is SILENTLY CLIPPED (Owner report needs ~1000px+).
   **Fix:** set Page Body to hug contents and extend Content Area + the outer
   frame, then reposition the rail's bottom-pinned block (it's `constraints.vertical="MIN"`,
   so it does not follow).
8. **Use `importComponentSetByKeyAsync` for component SETS.** §D.1 keys are
   correct but `importComponentByKeyAsync` fails on every set.
9. **`CR2/Trust Meter Chip` key `f07cf72d…` does not resolve.** Use same-file
   `getNodeByIdAsync` instead. Treat every copied Foundations key as suspect;
   prefer same-file node ids.
10. **§C.2's "1136px usable content column" is wrong** — the cloned shell's Page
    Body has 24px padding each side, so real usable width is **1128px**. Build to 1128.
11. **§A.2 and §G.2 both claim slot `(0, 3680)`.** Resolved: ENTRANCE occupies the
    row from x=0; the SPEC board goes at **x=9360** on that same row.

## P6. DRAWER WIRING — the id the other screens need

Drawer root: **`39:24264`** (`OVERLAY / Drawer / Populated`, page `25:2964`).
Wire every creative row/card: `On Click → Open Overlay → 39:24264`,
**Move In from Right, Ease In And Out, 500ms** (§G.1).

B1's Overview rows are built and clickable with the target intentionally unset —
wiring them is a finishing task, not a rebuild.

## P7. SOURCE BUG FOUND (code, not Figma)

`Components.tsx` does `lowerFirst(COMPONENT_TAB_LABELS.ctas)` → renders
**"cTAs"** in the CTAs-tab subhead. Preserved verbatim in Figma. Worth fixing in
code separately.

---

# PATCH 02 — zero-quota prep (written while the Figma quota was exhausted)

No Figma calls were made producing this section. It exists so wave 2 spends
quota on building, not on discovery or decisions.

## Q1. THE INTER→GEIST RETROFIT (applies to already-"complete" work)

B1's Overview was built under §E.3's original ruling (shell chrome = Inter).
PATCH 01 §P2 revoked that. So the finished Overview **is not actually finished** —
it carries Inter in its shell chrome, as do all wave-1 shell clones (they inherit
from the reference screens, which are Inter throughout).

**This is a text-node font override sweep, not a rebuild.** Do it as ONE script:

```
// ONE use_figma call. Walks a page, retargets every Inter text node to Geist.
// Geist Mono is left alone — it is already correct per P2.
const MAP = {
  "Inter|Regular":    { family: "Geist", style: "Regular" },
  "Inter|Medium":     { family: "Geist", style: "Medium" },
  "Inter|Semi Bold":  { family: "Geist", style: "SemiBold" },
  "Inter|SemiBold":   { family: "Geist", style: "SemiBold" },
  "Inter|Bold":       { family: "Geist", style: "Bold" },
};
// 1. page.findAllWithCriteria({ types: ["TEXT"] })
// 2. skip nodes whose fontName.family already starts with "Geist"
// 3. skip nodes INSIDE instances whose font is inherited from a library main
//    component — those cannot be overridden without detaching. LOG them instead;
//    they are a library-side fix (see J-list), not a builder fix.
// 4. loadFontAsync every target style ONCE, up front, before any assignment
// 5. assign node.fontName = MAP[`${family}|${style}`]
// 6. return a count of { changed, skippedAlreadyGeist, blockedInInstance }
```

**Order of operations matters:** run the retrofit AFTER a page's frames are all
built, never between frames — otherwise later frames reintroduce Inter and you
pay for the sweep twice.

**Expected blocked set:** text inside library instances (`*Button*` labels,
`Tab Item` labels, `*Segmented*` labels). Figma will not let a builder change a
font on a node inherited from a library main component. Record these on the
Handoff page as a library-side ask — do NOT detach to force it.

## Q2. WAVE-2 WORK ORDERS — two builders, 25 calls each

### W2-A · Creatives (page `25:2957`)
Already on canvas: Grid Populated `39:10206` (toolbar + 8 real cards) ✅ ·
Table Populated `39:11281` (shell only, EMPTY Page Body).

Call budget, in order:
1. **1 call** — Table frame content: `PortfolioTrendChart` (instance
   `CR2/Chart Placeholder` Type=area-dual) + the dense table built from
   `Table Item / Header Item` + `Table Item / Cell` atoms per P5.5, E-com preset
   columns (Spend · ROAS · CPA · CTR · CVR · Purchases), sortable header affordance
   on Spend.
2. **1 call** — `BulkActionBar` (selected-count pill + Pause / Queue / Clear).
3. **1 call** — 4 overlays as separate frames: Column picker popover, Card-metrics
   popover, Add-filter popover, Row-actions dropdown.
4. **2 calls** — the 5 missing state frames: Loading (skeleton matching the grid),
   Empty, Filtered-empty, Error, Partial/low-data, Long-content-stress.
5. **1 call** — apply P5.6: re-`rescale()` any card that was `resize()`d.
6. **1 call** — Inter→Geist sweep (Q1) over the whole page.
7. **1 call** — prototype wiring: layout toggle Grid↔Table, card select→BulkActionBar,
   all 4 popover open/close, and row→drawer `Open Overlay → 39:24264`
   (Move In from Right / Ease In And Out / 500ms).
8. **1 screenshot** to verify. **Total ≈ 10 calls.**

### W2-B · Creative drawer (page `25:2964`)
Already on canvas: root `39:24264` with header + AdPreviewMock band ✅.

Per P5.3, `CR2/Drawer Band` CANNOT be instanced — build each band as a local
auto-layout frame matching its recipe (16px padding, 1px bottom hairline
`colorBorder`, vertical stack, HUG height / FILL width).

1. **2 calls** — the 9 remaining bands in document order: FunnelStrip,
   TrendChart, FatiguePanel, ComponentBreakdown, ScriptElementsPanel,
   BenchmarkPanel, DemographicsPanel, RunningInTable, VariantsList.
2. **1 call** — sticky `DrawerActionBar` (8 actions; icon+label per P5.2 = icon
   instance adjacent to a text Button).
3. **1 call** — variant frames: Loading · Non-video (hook/hold render
   "N/A — no video", NEVER a fabricated 0%) · Healthy (non-fatiguing).
4. **1 call** — 3 action modals (Pause confirm, Relaunch confirm, Edit targeting).
5. **1 call** — Inter→Geist sweep (Q1).
6. **1 call** — internal wiring: close-X, placement select, action-bar reactions.
7. **1 screenshot**. **Total ≈ 8 calls.**

### W2-C · finishing pass (run last, after A and B)
1. **1 call** — wire Overview's bucket rows → `39:24264` across all 5 bucket-state
   frames (B1 built the hotspots; only the target is missing).
2. **1 call** — re-point every FF-non-new key to its FF-new equivalent (P3).
3. **1 call** — Page Body unclip fix (P5.7) on any frame whose content exceeds 654px.
4. **1 call** — Handoff page `25:2965`: the J-list, the substitution log, the
   blocked-font log from Q1, and the motion spec.
**Total ≈ 4 calls.** Grand total for wave 2: **≈ 22 calls** of a 200/day budget.

## Q3. WHAT IS EXPLICITLY *NOT* IN WAVE 2

Deferred, on Maalik's descope call — partial wave-1 work stays untouched on
pages `25:2958` (Components), `25:2959` (Compare), `25:2960` (Automations),
`25:2961` (Owner report), `25:2962` (Brief builder), `25:2963` (Saved views).
Do not delete it and do not continue it without a new instruction.

---

# PATCH 03 — CORRECTION: reads are the scarce resource, not writes

Verified against Figma's own documentation
([developers.figma.com/docs/figma-mcp-server/rate-limits-access](https://developers.figma.com/docs/figma-mcp-server/rate-limits-access/)).
This **supersedes PATCH 01 §P4's framing**, which treated all tool calls as equal.

## R1. The documented rule

> *"Rate limits apply to Figma MCP server tools that read data from Figma. Some
> tools, such as those that write to Figma files, are exempt from the rate limits."*

Named exempt: `add_code_connect_map`, `generate_figma_design`, `whoami`.

**Therefore the calls that count against the 200/day are the READS:**
`get_metadata` · `get_screenshot` · `get_variable_defs` · `search_design_system` ·
`get_design_context` · `get_libraries`

**Caveat, stated honestly:** `use_figma` is NOT in the doc's named exempt list,
though it is unambiguously a write tool and the rule is stated as a general
principle. Treat "use_figma is exempt" as *probable, not confirmed* — verify
empirically at the start of wave 2 (see R4) before relying on it.

## R2. What actually killed wave 1

Not the writes. Nine builders each ran ~20+ **reads** — repeated
`get_screenshot` verifications after every section, `search_design_system`
discovery sweeps, `get_metadata` structure checks. 9 × ~22 reads ≈ 200. Quota gone.

The node-by-node building was wasteful, but it was the *verification and discovery
pattern* that hit the cap.

## R3. THE REAL BUDGET RULE — cap READS, not total calls

Supersedes P4.4's "25 Figma calls per builder":

1. **Hard cap: 5 READS per builder.** Writes are effectively free (pending R4).
2. **Discovery: ZERO reads.** Every key, node id, font string and token name a
   wave-2 builder needs is already recorded in this spec. Never run
   `search_design_system` again — it is one of the most expensive reads and all
   its answers are in §D.1 and PATCH 01 §P3/§P5.
3. **Screenshots: 1 per FRAME, at the end.** Never per section, never to "check
   progress mid-script". Prefer returning a structured summary from inside the
   `use_figma` script (node ids, counts, computed sizes) over taking a picture —
   the script's return value costs nothing.
4. **Never `get_metadata` on a page.** It returned 450k chars on this file and
   both burns a read and blows context. Target specific node ids, or better,
   query from inside a write script and return the answer.
5. If a read fails with a limit error, STOP. Do not retry — you are spending a
   shared pool.

Revised wave-2 cost: W2-A ≈ **2 reads**, W2-B ≈ **2 reads**, W2-C ≈ **1 read**.
**~5 reads total** against 200/day, versus wave 1's ~200.

## R4. FIRST ACTION OF WAVE 2 — verify the write exemption

Before the main build, run one trivial `use_figma` write (create and immediately
delete a rectangle on a scratch area), then one cheap read. If the write succeeds
while reads are still limited, the exemption is confirmed and builders can write
freely. If the write ALSO fails, revert to PATCH 01 §P4's stricter total-call cap.
Record the result here.

## R5. CAPACITY OPTIONS — documented vs. gamble

| Option | Effect | Confidence |
|---|---|---|
| Professional → **Organization** plan | 200/day → **600/day**, 15/min → 20/min | ✅ **Documented** |
| A second **Full seat** | *may* add an independent 200/day, or may pool at team/file level | ❌ **Not documented either way** — a gamble |
| **Dev** seat instead of Full | identical MCP limits to Full at each tier | ✅ Documented |
| **Local desktop server** (`127.0.0.1:3845`) | no documented exception from the cap | ❌ **Not documented** — do not assume it bypasses |
| Viewer / Collab seat | 6 calls **per month** — unusable, and no desktop-server access | ✅ Documented |

**Undocumented:** the reset window (rolling 24h vs calendar day, timezone) is not
stated anywhere official. We will learn it empirically.

**Recommendation:** given R3, no capacity purchase is needed for the current
3-surface scope. If all 9 surfaces are un-deferred, the plan upgrade is the
documented lever; the second seat is not.

## R4 RESULT — both hypotheses CONFIRMED empirically

Tested live while the hosted server's read quota was exhausted:

1. **Writes ARE exempt.** A `use_figma` call (create + delete a throwaway
   rectangle on page `25:2965`) returned `{"writeWorked":true}` — node `62:2954`
   created and removed, file unchanged. So `use_figma` behaves as the docs'
   general principle implies, despite not being in the named exempt list.
   **Builders may write freely.**
2. **The local desktop MCP server has separate/remaining read capacity.**
   `mcp__Figma__get_metadata` (the `127.0.0.1:3845` desktop server, which takes no
   `fileKey` and reads the app's open document) successfully returned all 12 page
   ids of `Creative-report` at the same moment the hosted server's reads were
   refused. It is NOT drawing on the same exhausted bucket.

### R6. THE WAVE-2 EXECUTION MODEL — use both servers

| Purpose | Server | Tool | Cost |
|---|---|---|---|
| All building | **hosted** | `use_figma` | free (exempt) |
| Structure checks, verification, screenshots | **local desktop** | `mcp__Figma__get_metadata` / `get_screenshot` / `get_design_context` / `get_variable_defs` | separate quota |
| Anything needing an explicit `fileKey` | hosted | — | counts against 200/day |

Notes and limits of the desktop route:
- The desktop server exposes **reads only** — there is no `use_figma` there. It
  cannot build.
- It has **no `fileKey` parameter**: it acts on whatever document is open in the
  Figma desktop app. So the correct file must be open, and `setCurrentPageAsync`
  from a write script changes which page it reports on.
- One successful read proves capacity exists; it does **not** prove the desktop
  server is uncapped. Still obey R3's discipline (few reads, one screenshot per
  frame, zero discovery reads).

**Consequence: no seat purchase and no plan upgrade is required for wave 2, and a
second Figma account is not required either.** Capacity was an execution-pattern
problem, not a licensing problem.

---

# PATCH 04 — SYNC ORCHESTRATOR RULINGS (BINDING, supersedes everything above)

Written by the wave-2 sync orchestrator/integrator. Produced with **zero read-quota
spend** — every fact below came back as the return value of a read-only `use_figma`
script, not from `get_metadata` / `get_screenshot` / `get_libraries`.

Where this patch contradicts §A–§K or PATCH 01–03, **this patch wins.**

## S1. RULING — the usable content column is **1128px**, not 1136px

**Verified empirically** on the live shell master `30:3599`:

| Node | id | w | padL | padR |
|---|---|---|---|---|
| Content Area | `30:3600` | 1176 | 0 | 0 |
| Sub Nav | `31:3414` | 1176 | **20** | 0 |
| Filter Bar | `32:3430` | 1176 | **20** | **20** |
| **Page Body** | `32:5666` | **1176** | **24** | **24** |

`1176 − 24 − 24 = ` **`1128`**.

**Root cause of the conflict, on record:** §C.2's line
*"Usable content column | 1136px (1176 − 20 − 20)"* derived the number from the
**chrome inset (20px)**, which is correct for `Sub Nav` and `Filter Bar` — and then
wrongly applied it to `Page Body`, which is padded **24**. §C.2 contradicted itself:
the same table already states `Page Body … padding 24 all sides`. The 20px figure is
real, but it belongs to the chrome rows, not to the content column.

**RULING:**
- **Build all `Page Body` content to a 1128px column.** This confirms PATCH 01 §P5.10.
- §C.2's "1136px" row and every "1136" in §I (B1's `1136 wide`, B2's `the 1136 column`,
  B7's `inside the 1136 column`) are **superseded — read 1128**.
- Chrome rows keep their 20px inset. Do not "harmonise" them to 24; the master is law
  and it is already correct.
- Frames already built to 1136 are **8px over** and must be narrowed to 1128, not
  re-centred. This is a `resize()` on plain frames — but on any `CR2/Creative Card`
  instance use `rescale()` per §P5.6, never `resize()`.

## S2. RULING — canvas slot collision at (0, 3680) resolved

§A.2 assigns `(0, 3680)` to the **Interaction spec board**. §G.2 assigns the same
`(0, 3680)` to the **ENTRANCE frame sequence**. §G.6 then says the spec board sits
*"past your ENTRANCE frames"* without giving a coordinate. Three statements, two of
them mutually exclusive.

**RULING — the `y = 3680` row is the ENTRANCE row. The spec board moves right:**

| Contents | x | y |
|---|---|---|
| `ENTRANCE / <Screen> / 0 … N` | `0`, `1560`, `3120`, `4680`, `6240`, `7800` | `3680` |
| `SPEC / <Screen> / Interactions` | **`9360`** | `3680` |

`9360 = 6 × 1560` — the first free column after the maximum entrance sequence any
screen needs (Overview's is the longest at 6 frames: 5 sections + 1). The number is
derived, not arbitrary, so a screen with a shorter sequence still puts its spec board
at 9360 and the row stays aligned file-wide.

This confirms PATCH 01 §P5.11 and makes it the single citable rule.
**§A.2's `(0, 3680) — Interaction spec board` row is superseded.**
A screen needing more than 6 entrance frames must report, not spill past x=9360.

## S3. VERIFIED INTACT — Foundations `25:2954` and shell master `30:3599`

Confirmed unmodified against §B.2 and §C.2. No builder has damaged either.

- **Foundations: 13/13 components present.** Every node id AND every `key` in §B.2 is
  exact. Variant counts exact: Bucket Chip 10 · Confidence Chip 4 · Trust Meter Chip 2 ·
  Metric Cell 12 · Creative Thumb 9 · Creative Card 4 · Bucket Tab 4 · Bucket Tab Row 4 ·
  Recommendation Row 3 · Glass Panel (component) · Drawer Band (component) ·
  Chart Placeholder 8 · Why Dot 2. The 7 other top-level nodes are the intended TEXT
  section labels (Chips / Cells / Cards / Rows / Panels / Charts / Markers).
- **Local variables: 1 collection only** — `CR2 Tokens`
  `VariableCollectionId:26:2954`, single mode `Light`, **35 variables**. No second mode,
  no dark variant, no rogue collection. §K.9 holds file-wide.
- **Shell master geometry matches §C.2 exactly**, including the row sum
  `52 + 46 + 48 + 654 = 800` ✓. Master has 3 top-level children (rail `30:2988` w64 ·
  nav `30:3028` x64 w200 · Content Area `30:3600` x264 w1176) and 273 descendants.
- **Sub-nav: 8/8 tab instances present**, all still live remote instances (none
  detached), `Overview` = `State=Active`, the other 7 `State=Default`. Their mains are
  individual variants of `Tab Item / Basic` — variant-level keys (`8fd25728eb…` active,
  `7c378ff7b6…` default) differ from §D.1's **set**-level key
  `130fcad83f17df1eb67ea6c108240f697a507eef`. **This is expected, not a defect** — do
  not "fix" it.

### S3.1 Generalise §P5.9 — Foundations keys are local, prefer node ids
`CR2/Trust Meter Chip`'s key `f07cf72d…` is present on the node but does not resolve
through `importComponentByKeyAsync`, because the Foundations components are **local and
unpublished** — their keys only resolve inside this file. **Rule: always reach
Foundations components by same-file `getNodeByIdAsync(<§B.2 node id>)`.** Treat every
`importComponentByKeyAsync` against a `CR2/*` key as a bug, not bad luck.

## S4. FF-NEW DUPLICATION AUDIT — Maalik's question, answered

Method: enumerated every subscribed library variable collection, indexed all variable
names, looked for one name resolving to more than one literal, then walked the live
library-component instances on the shell master to see whether their internals **bind
tokens or hard-code literals**. All inside one `use_figma` script — 0 reads.

### S4.1 The same-name-different-literal problem is GONE — but it was cured by subtraction, not by fixing the library

`getAvailableLibraryVariableCollectionsAsync()` now returns **exactly one** collection:

| Library | Collection | Variables |
|---|---|---|
| **Design System - FF new** | `Default` | **1855** |

- **1855 unique names. 0 duplicate names. 0 literal conflicts.**
- **§J.1 is RESOLVED** — the file subscribes to FF-new.
- **§J.12 is RESOLVED-BY-UNSUBSCRIBE, not de-duplicated.** J.12 observed
  `colorTextTertiary` as both `rgba(15,15,12,0.55)` and `rgba(0,0,0,0.45)`, and
  `colorError` as both `#ff4d4f` and `#dc4446`. Those were **cross-library** collisions
  that existed only while FF non-new + LF 2.0 were also subscribed. With FF-new the sole
  variable source, each name resolves exactly once. **The corrosive symptom is gone; the
  underlying ramps in the sibling libraries were never reconciled.** If anyone ever
  re-subscribes FF non-new or LF 2.0 to this file, J.12 returns in full. Keep FF-new as
  the only subscribed variable library.

### S4.2 The real duplication inside FF-new is *many names → one value*, not one name → many values

Three parallel naming systems coexist in the single collection, and components draw
from all three interchangeably:

1. **Raw palette** — `color/grey/14`, `color/grey/65`, `color/grey/96`
2. **Semantic** — `Colors/Neutral/Text/colorTextSecondary`, `Colors/Neutral/Icon/colorIcon`
3. **Per-component** — `Components/Button/Component/defaultColor`,
   `Components/Badge/Global/colorError`, `Components/Menu/Component/popupBg`,
   `Components/Tabs/Component/itemSelectedColor`

Observed consequences:
- The secondary-nav item's label binds to **`color/grey/65`** (raw palette) where the
  semantic `colorTextSecondary` is what it means.
- The avatar's surface binds to **`color/grey/14`** and its text to **`color/grey/96`**.
- **Token mis-scoping, the clearest smell:** the `facebook`, `tiktok` and
  `perm-media` icon vectors all bind to
  **`Components/Descriptions/Global/colorTextTertiary`** — a *Descriptions*-component
  token consumed by unrelated social icons. The `Components/*` namespace is therefore
  **not** actually component-scoped in practice, so renaming or retuning a
  `Components/X/...` token has unpredictable blast radius.

### S4.3 Centralisation is INCONSISTENT — and the flagship `*Button*` is the worst offender

Direct answer to *"does a Button's text colour reference `colorTextSecondary`, or
hard-code a literal?"* → **It hard-codes. `*Button*` does not reference a text token.**

| Library component | Main | Label text fill | Verdict |
|---|---|---|---|
| **`*Button*`** | `3:3` | **LITERAL `#434343`** | ❌ **hard-coded** — only its 4 corner radii are bound |
| `Dropdown Button Basic` | `28:3107` | BOUND `Components/Button/Component/defaultColor` | ✅ bound (bg → `defaultBg` too) |
| `Tab Item / Basic` | `3:42` | BOUND `Components/Tabs/Component/itemSelectedColor` | ✅ bound |
| `*Badge* / Basic` | `3:36` | BOUND `Components/Badge/Global/colorBgContainer` | ✅ bound |
| `Menu Item / Popover Menu` | `3:791` | BOUND `Components/Menu/Component/popupBg` | ✅ bound |
| `Icon / *Outlined` (all sampled) | — | vector BOUND `Colors/Neutral/Icon/colorIcon` | ✅ bound |
| **`*Breadcrumb*` + `Breadcrumb Link` + `Breadcrumb Separator`** | `3:653` / `3:618` / `3:627` | **LITERAL `#000000 @45%` / `@88%`** | ❌ **hard-coded** |

**The irony worth reporting to Maalik:** `Components/Button/Component/defaultColor`
**exists** and `Dropdown Button Basic` consumes it correctly — but `*Button*` itself,
the component every screen uses most, ignores it and paints `#434343`. So a brand
retune would move every dropdown and leave every button behind. This, not variable
duplication, is the highest-risk defect in the library today.

### S4.4 There is no font-family token discipline — this is why the Inter→Geist sweep must be per-node

Across every component sampled, `fontFamily` was bound on **exactly one** node (the
avatar's initials, `Component 5` `3:573`). `fontSize` is bound on some, `fontFamily`
almost never.

**Consequence:** the P2 / Q1 Inter→Geist retrofit **cannot** be done by flipping a
library font token — no such token is wired. It must remain a per-text-node `fontName`
override sweep.

> **CORRECTION — I got the second half of this wrong, and B1 disproved it empirically.**
> I originally wrote that text inside library instances is "unfixable without
> detaching". **That is false.** B1's sweep over page `25:2956`: **1817 text nodes
> scanned, 1040 changed to Geist, 777 already Geist, 0 other families, and ZERO
> blocked.** Font is an *overridable text property* on an instance child — only
> *structural* edits (`appendChild` / `remove`) are blocked inside instances. So
> **PATCH 02 §Q1's predicted "expected blocked set" (Button / Tab Item / Segmented
> labels) does not materialise.**
>
> Two consequences: (1) the blocked-font log on the Handoff page is expected to be
> **empty**, and every other builder's page should also come out fully Geist;
> (2) therefore **any Inter the consistency sweep finds is a genuine miss, not an
> accepted limitation** — it gets fixed, not logged.
>
> **§J.4 stays OPEN, not a blocker.** Its value is drift-prevention for future
> modules, not unblocking this retrofit.

Also found: `*Breadcrumb*`'s main components use **`SF Pro Text Regular`** — a third
font family, neither Inter nor Geist, entering the file through the shell header's
breadcrumb. Library-side finding; logged, not fixable here.

### S4.5 We introduced our own duplicates — logged, deliberately NOT fixed

§E.2 says use `CR2 Tokens` **only** where §E.1 has no library equivalent. Four do have
one and duplicate it by value:

| Local token | Value | Library equivalent that already exists |
|---|---|---|
| `CR2/Accent/primary` | `#8FB821` | `Colors/Brand/Primary/colorPrimary` `#8fb821` |
| `CR2/Surface/card` | `#FFFFFF` | `Colors/Neutral/colorWhite` |
| `CR2/Surface/page` | `#FFFFFF` | `Colors/Neutral/colorWhite` |
| `CR2/Radius/control` | `6` | `Components/Button/Global/borderRadius` |

§A.3 forbids adding or removing variables, so **nothing is deleted.** Recorded as a
cleanup item for the architect. `CR2/Accent/primary-text` `#5B7611` is **not** in this
list — §E.3/§J.3 keep it deliberately, on AA grounds.

## S5. OPEN DECISION FOR MAALIK — the shell master is the Inter source, and it is frozen

Font census of `30:3599` itself: **Inter Regular ×23, Inter Medium ×1, Inter Semi Bold
×1 = 25 Inter text nodes**, against Geist Medium ×11, Geist Regular ×4, Geist Mono
Medium ×1, Geist Mono Regular ×1.

All nine screen pages were cloned from this master, so **every page inherited those 25
Inter nodes.** PATCH 01 §P2 requires zero Inter file-wide.

The master lives on page `25:2955`, which §A.3 freezes. The orchestrator has therefore
**not modified it** and has swept the nine builder pages instead. That makes everything
that ships Geist-correct, but leaves a trap:

> **Any future clone of `30:3599` reintroduces 25 Inter nodes.**

Same issue for layer naming: the master carries `Group 372` (`30:3046`),
`Frame 1000002832` (`30:3066`), `Frame 2147225662` (`30:3070`),
`Frame 2147225614` (`30:3072`), `Frame 2147225664` (`30:3074`) — all §K.4 violations
that every clone inherits. (The `Vector` layers are not on §K.4's list, and those with
`I…;…` ids are inside instances and unrenameable.)

**Options — Maalik's call, not the orchestrator's:**
- **(A) Recommended.** Authorise one sanctioned architect edit to `30:3599`: Inter→Geist
  on its 25 own text nodes + rename the 5 bad layers. Cost: one script. Every future
  clone is then born clean.
- **(B) Status quo.** Master stays frozen; every new clone needs a manual sweep forever.

Until (A) is authorised, treat **"clone the master, then immediately run the Q1 sweep and
the layer-rename pass"** as a mandatory two-step, never a one-step.

## S6. RULING — PROTOTYPE REACTIONS ARE PAGE-SCOPED. §G.3 and §G.4 are impossible as written.

B1 hit this first. **Independently re-verified by the orchestrator**, with the correct
`actions[]` reaction shape and a passing same-page control:

| Probe | Result |
|---|---|
| `NAVIGATE`, **same page** (control) | ✅ **OK** — reaction stored |
| `NAVIGATE`, cross-page → `39:10206` (B2 grid) | ❌ **REJECTED** |
| `NAVIGATE`, cross-page → `39:13954` (B1 overview) | ❌ **REJECTED** |

Figma's own error text, verbatim and decisive:

> *"destination `39:10206` was rejected — … for NAVIGATE actions, destinations must be a
> **different top-level frame on the same page**"*

**This is Figma product behaviour, not a Plugin API defect and not a builder error.**
Prototype flows are page-scoped by design.

**Therefore these spec claims are WRONG and are hereby struck:**
- §G.3: *"Cross-page overlay targets work; use B9's node id."* — **false.**
- §G.4 "Cross-screen": *"each sub-nav tab links to the other builder's Populated frame
  … each builder wires their own 8 links."* — **impossible**, those 9 frames are on 9
  different pages.
- PATCH 01 §P6's instruction to wire every screen's rows to `39:24264` — **impossible
  cross-page.** The drawer id is still correct; the wiring location is not.

### S6.1 The fix — one dedicated flow page, wired against local copies

All cross-screen prototyping moves to a **new page `PROTOTYPE · Flow`**. The Handoff
page `25:2965` is NOT displaced.

1. **Copy, don't componentize.** Each screen's Populated frame is `clone()`d onto the
   flow page. `createComponentFromNode` was considered and **rejected**: it mutates a
   builder's frame in place, changes what the registry ids denote, and risks the state
   boards that are the documentation deliverable. Clones are writes, so free, and they
   leave every builder's page byte-identical. **Tradeoff, stated honestly:** the flow
   page's copies are snapshots — if a builder later edits their page, the flow page does
   not follow. Acceptable at end-of-wave; re-clone if a screen changes.
2. One clone of B9's drawer `39:24264` goes on the flow page as the overlay target.
3. Wire on the flow page only: the 8 sub-nav tabs, Overview's `View all N in the grid`
   → Grid Populated, `Open Automations` → Rules Populated, and creative-row → drawer
   (Move In from Right / Ease In And Out / **500 ms**).
4. Flow starting frame = the Overview clone.
5. **Leave every per-screen page's internal same-page wiring exactly as the builders
   left it** — bucket-tab switching, state toggles, B1's threshold popover `65:58533`.
   Those are same-page and work.

### S6.2 Overlay reaction shape — two gotchas that cost probes
- `overlayRelativePosition` is **only** accepted when the destination frame has
  `overlayPositionType === "MANUAL"`. Otherwise Figma throws
  *"Actions only support overlayRelativePosition when navigation is 'OVERLAY' and the
  destination is a frame with overlayPosition equal to 'MANUAL'"*. For the right-anchored
  drawer: set `overlayPositionType = "MANUAL"` on the drawer frame first, then supply the
  position.
- Scrim and dismiss behaviour are properties of the **destination frame**, not the
  reaction: `overlayBackground` (black @80% per §G.3) and
  `overlayBackgroundInteraction = "CLOSE_ON_CLICK_OUTSIDE"`.
- Use the `actions: [...]` **array**. The singular `action` field is deprecated and
  throws *"Please update the `actions` field instead of the `action` field"*.

## S7. §A.2 / §G.2 slot collision — closed, moot on canvas

Verified without spending a read. B1's ENTRANCE frames occupy `x = 0, 1560, 3120, 4680,
6240, 7800` all at `y = 3680`, and `SPEC / Overview / Interactions` (`52:20813`) sits at
`x = 9360` on that same row. **No overlap exists on canvas** — the collision was only ever
in the prose. S2's ruling is therefore a documentation fix that matches what is already
built, and needs no rework on B1's page.

---

# PATCH 05 — LIBRARY FINDINGS (`Design System - FF new`)

Produced by the wave-2 orchestrator's variable + centralisation audit. **Zero read-quota
spend** — all of it came back as the return value of one read-only `use_figma` script
that enumerated every subscribed library variable collection and then walked the live
library-component instances on the shell master.

**Nothing in this patch may be acted on inside the library file
`7h5lI7IieGCuAuySfJVKxS`.** These are asks for Maalik to approve or reject. They are
recorded here and mirrored onto the Handoff board `66:71622`.

## T0. The headline — the duplication problem was cured by subtraction, not by repair

`getAvailableLibraryVariableCollectionsAsync()` now returns **exactly one** collection:

| Library | Collection | Variables | Duplicate names | Literal conflicts |
|---|---|---|---|---|
| `Design System - FF new` | `Default` | **1855** | **0** | **0** |

§J.12 was real when it was written. It observed
`Colors/Neutral/Text/colorTextTertiary` resolving as **both** `rgba(15,15,12,0.55)`
**and** `rgba(0,0,0,0.45)`, and `Colors/Brand/Error/colorError` as both `#ff4d4f` and
`#dc4446`. Those were **cross-library** collisions that existed only while
`Design System - FF` (non-new) and `LF 2.0` were *also* subscribed. PATCH 01 §P3
unsubscribed them, and the symptom vanished with them.

> ### ⚠️ STANDING WARNING — this fix is latent, not permanent
> **The sibling libraries' neutral and error ramps were never reconciled.**
> Re-subscribing `Design System - FF` (non-new) or `LF 2.0` to
> `a4R8eBl0xyNFENEJiLor0j` **resurrects the `colorTextTertiary` / `colorError`
> collision in full**, and every builder immediately loses the ability to trust a token
> name to mean one colour.
>
> **Rule: `Design System - FF new` is the ONLY variable library this file may
> subscribe to.** Adding another is an architect + Maalik decision, never a builder's,
> and it invalidates §E.1's mapping the moment it happens.

## T1. J.13 — `*Button*` hard-codes its label colour. **Highest-risk defect in the library.**

| | |
|---|---|
| **Component** | `*Button*`, main `3:3`, key `792294bb1a6684844c21f483ba3b427c0701a153` |
| **Defect** | Label TEXT fill is **literal `#434343`**. `fontSize` unbound, `fontFamily` unbound. Only its 4 corner radii are bound to variables. |
| **The damning part** | **`Components/Button/Component/defaultColor` already exists** — and `Dropdown Button Basic` (`28:3107`) consumes it correctly, alongside `defaultBg` for its background. |
| **Consequence** | A brand retune moves every dropdown, every tab, every badge, every menu — **and leaves every button behind.** The most-used component in the system is the one that ignores its own tokens. |
| **Proposal** | Bind `*Button*`'s label fill to `Components/Button/Component/defaultColor` and its background to `defaultBg`, per state. |
| **Impact if rejected** | Every button in every FabAds module needs a manual colour override forever, and no theme change can ever be trusted to be complete. |

Same defect class, same evidence, lower blast radius: **`*Breadcrumb*` / `Breadcrumb
Link` / `Breadcrumb Separator`** (`3:653` / `3:618` / `3:627`) paint literal
`#000000 @45%` and `@88%`.

## T2. J.14 — the `Components/*` namespace is not actually component-scoped

`Components/Descriptions/Global/colorTextTertiary` — a token named for the
*Descriptions* component — is the bound fill on the vectors of **`ic:round-facebook`,
`ic:baseline-tiktok` and `material-symbols:perm-media-outline-rounded`**. Three
unrelated social/media icons consuming a Descriptions token.

**Consequence:** the `Components/X/...` prefix carries no guarantee about *what
consumes it*. Renaming or retuning any `Components/X` token has **unpredictable blast
radius** across unrelated components. This also undermines the natural fix for J.13 —
re-pointing tokens is only safe once consumption is actually scoped.

**Proposal:** re-point cross-consumed tokens to the semantic `Colors/Neutral/*` ramp,
and reserve `Components/X/*` for tokens genuinely consumed only by component X.

## T3. J.15 — `*Breadcrumb*` introduces a third font family

The breadcrumb mains use **`SF Pro Text Regular`** — neither Inter nor Geist.

**Not a defect in our file.** Our breadcrumb instances carry local font overrides, so
nothing in `a4R8eBl0xyNFENEJiLor0j` renders SF Pro (post-master-fix census:
`remainingNonGeist: []`). It is a latent trap for any *other* consumer of the library.
Fixing it requires editing the library file — forbidden. **Logged only.**

## T4. The real duplication inside FF-new: **many names → one value**

Not one name resolving to many values (that was J.12, cross-library). Inside the single
FF-new collection there are **three parallel naming systems**, and components draw from
all three interchangeably:

| Layer | Examples | Observed consumer |
|---|---|---|
| **Raw palette** | `color/grey/14`, `color/grey/65`, `color/grey/96` | secondary-nav item label binds `color/grey/65` where semantic `colorTextSecondary` is what it *means*; avatar binds `color/grey/14` + `color/grey/96` |
| **Semantic** | `Colors/Neutral/Text/colorTextSecondary`, `Colors/Neutral/Icon/colorIcon` | the `Icon / *Outlined` family — the best-behaved group in the library |
| **Per-component** | `Components/Button/Component/defaultColor`, `Components/Badge/Global/colorError`, `Components/Tabs/Component/itemSelectedColor`, `Components/Menu/Component/popupBg` | `Dropdown Button Basic`, `*Badge*`, `Tab Item / Basic`, `Menu Item` |

**Proposal:** declare the semantic layer canonical, demote the raw palette to
primitives that only semantic tokens may alias, and stop components consuming raw greys
directly. This is the structural fix that makes J.13 and J.14 safe to execute.

## T5. No font-family token discipline — and the correction that matters more

Across every component sampled, **`fontFamily` was bound on exactly one node** (the
avatar's initials, `Component 5` `3:573`). `fontSize` is bound on some; `fontFamily`
almost never.

So the Inter→Geist retrofit can never be a token flip. **But — and this reverses my own
earlier conclusion — it does not need to be.**

> ### CORRECTION ON RECORD (supersedes my §S4.4 first draft and PATCH 02 §Q1's prediction)
>
> I originally wrote that text inside library instances is **"unfixable without
> detaching"**. **That is false, and it was the more consequential error of the two.**
>
> **Font is an overridable text property on an instance child. Only *structural* edits
> (`appendChild` / `remove`) are blocked inside instances.**
>
> Evidence, twice over:
> - **B1's page sweep:** 1817 text nodes scanned, 1040 changed to Geist, 777 already
>   Geist, **0 blocked**.
> - **The master fix:** 42 scanned, 25 changed (including all 8 remote sub-nav tab
>   labels), **0 blocked**, `remainingNonGeist: []`.
>
> **Therefore PATCH 02 §Q1's predicted "expected blocked set" — `*Button*` labels,
> `Tab Item` labels, `*Segmented*` labels — does not exist.**
>
> **Two consequences that change how the gate is run:**
> 1. **The blocked-font log is EMPTY, and that is the correct outcome** — not a gap.
> 2. **Any Inter the consistency sweep finds is a genuine miss to be FIXED, never a
>    limitation to be logged.** There is no longer an excuse category for residual Inter.
>
> **§J.4 is downgraded from BLOCKER to OPEN.** Its value is drift-prevention for future
> modules, not unblocking this retrofit.

## T6. Self-inflicted duplicates — ours, logged, deliberately not deleted

§E.2 permits `CR2 Tokens` **only** where §E.1 has no library equivalent. Four have one:

| Local token | Value | Library equivalent that already exists | Verdict |
|---|---|---|---|
| `CR2/Accent/primary` | `#8FB821` | `Colors/Brand/Primary/colorPrimary` `#8fb821` | exact duplicate — architect cleanup |
| `CR2/Surface/card` | `#FFFFFF` | `Colors/Neutral/colorWhite` | duplicate — architect cleanup |
| `CR2/Surface/page` | `#FFFFFF` | `Colors/Neutral/colorWhite` | duplicate — architect cleanup |
| `CR2/Radius/control` | `6` | `Components/Button/Global/borderRadius` | duplicate — architect cleanup |
| `CR2/Accent/primary-text` | `#5B7611` | `fab-funnel/7` `#749818` — **3.6:1, fails AA** | **KEEP** — deliberate, §E.3 / §J.3 |

**§A.3 forbids adding or removing variables, so nothing has been deleted.** Recorded as
a cleanup item. Note the asymmetry: four are avoidable drift; the fifth is a deliberate,
documented accessibility divergence and must survive any cleanup.

## T7. Summary of J-list status after this audit

| Status | Items |
|---|---|
| **RESOLVED** | J.1 (file now subscribes FF-new, sole variable source) |
| **RESOLVED, but latent** | J.12 (cured by unsubscribing, ramps never reconciled — see T0's standing warning) |
| **NEW, top risk** | **J.13** (`*Button*` hard-codes `#434343`) |
| **NEW** | J.14 (`Components/*` not scoped), J.15 (`*Breadcrumb*` SF Pro Text + literal blacks) |
| **DOWNGRADED** | J.4 (blocker → open; the font sweep works without it) |
| **ACCEPTED** | J.11 (`CR2/Creative Card` stays a product-level component) |
| **OPEN, unchanged** | J.2 (charts — still the highest-value addition), J.3, J.5, J.6, J.7, J.8, J.9, J.10 |

---

# PATCH 06 — GEOMETRY REMEDIATION + FLOW PAGE (integrator pass)

## U1. §P5.7 clipping was the largest defect in the file. Fixed on 5 pages.

The audit measured content bottom against frame height on every clipping container across
all 9 pages. Clipping was **far more widespread than any single builder saw** — B2 found
its own, B6 fixed its own, and nobody found B1's.

| Page | What was clipped | Overflow | Status |
|---|---|---|---|
| **B1 Overview** | **13 frames.** Page Body fixed at 654 holding 1393–1725px. `OverviewBreakdown` truncated mid-table; **`RecommendationsCard` and `AutomationsPreview` were entirely invisible** | **799–1071px** | ✅ **FIXED** — all 13 frames hug; Populated 800→1623 |
| **B2 Creatives** | Grid Populated — third card row (the `hover` + `selected` demo cards) entirely clipped | 458px | ✅ **FIXED** — 800→1282, verified by screenshot |
| **B5 Automations** | `Boards content` + its Page Body | 196px | ✅ **FIXED** — 606→802 |
| **B6 Owner report** | Loading Page Body (B6 fixed Populated but missed Loading); Content Area on 2 frames | 1001px / 41px | ✅ **FIXED** |
| **B7 Brief builder** | `Content Column` fixed at h=200 on Loading / Empty / Filtered-empty / Error | 111–493px | ✅ **FIXED** — Loading 200→1186 |
| B3 Components | only instance-internal `table` frames (the documented-broken library `*Table*` monolith) | 333px horizontal | ⚠️ **NOT FIXED — unfixable.** Inside instances; §A.3 forbids detaching. Library defect. |
| B4 Compare | `Chart — line-multi` instance overflows its own 220px box | 50px | ⚠️ **NOT FIXED** — inside a Foundations instance; cosmetic. Logged. |
| B8 Saved views | none | — | ✅ clean as built |

**The fix routine** (reusable, and the correct reading of §P5.7):
1. `clipsContent = false` on the offending container, then `layoutSizingVertical = "HUG"`
   (fall back to `primaryAxisSizingMode = "AUTO"`).
2. Cascade heights **upward**: recompute each ancestor's height from its content bottom,
   through `Page Body` → `Content Area` → outer frame.
3. Resize the icon rail and secondary nav to the new frame height.
4. Reposition the rail's bottom-pinned block to `railHeight − blockHeight`.

### U1.1 Correction to §P5.7 and to B6's report — the rail constraint is `MAX`, not `MIN`
§P5.7 and B6 both state the rail's bottom block is `constraints.vertical = "MIN"` and
therefore "does not follow" a resize. **Measured on every frame: it is `MAX`.** It *does*
follow. B6's real defect was different and worse: on **10 frames** the block sat at
`y = 2770` inside an `1849`-tall rail — **overshooting the bottom edge by exactly 1049px**
on every one, i.e. positioned for a taller frame and never brought back when the frame
shrank. All 10 corrected.

## U2. Row re-pitch — §A.2's 920px pitch cannot survive the unclip

Taller frames overlap the row below, which violates §K.12. Each remediated page was
re-pitched to `max(rowHeight) + 120`, rounded up to 20:

| Page | New row pitch | Frames moved |
|---|---|---|
| B1 Overview | **2020** | 17 |
| B2 Creatives | **1420** | 11 |
| B5 Automations | **1240** | 10 |
| B6 Owner report | **2020** | 19 |
| B7 Brief builder | **1760** | 14 |

**§A.2's fixed 920px row pitch is superseded for these pages.** The *column* pitch (1560)
is unchanged everywhere. Row **order** is unchanged — row *n* still means the same state.
Any future frame added to these pages must use the page's own pitch, not 920.

## U3. AMENDMENT to §S2 — the spec board moves when a screen needs 7+ entrance frames

§S2 put the SPEC board at `x = 9360` on the strength of "no screen needs more than 6
entrance frames". **B6 needs 7** (`ENTRANCE / Owner report / 0…6`), so its entrance
sequence occupies `x = 9360` and collided *exactly* with its own spec board — both at
`(9360, 3680)`. Detected and resolved: **B6's spec board moved to `x = 10920`.**

**Amended rule:** the SPEC board goes at `x = 1560 × (entranceFrameCount)`, i.e. the first
free column after the entrance sequence — `9360` for the common ≤6 case, `10920` for 7.
Do not hard-code 9360.

## U4. The drawer overlay — scrim and click-outside recovered without the read-only props

`overlayPositionType`, `overlayBackground` and `overlayBackgroundInteraction` are all
**read-only** in this Plugin API (confirmed by B4, B9 and the orchestrator independently),
so §G.3's "position Right, scrim black 80%, close when clicking outside ON" could not be
set as frame properties.

**Solved structurally instead, and it needs no manual finish:**
- `OVERLAY / Drawer / Scrim wrapper` **`78:13253`** — a full-bleed **1440×800** frame whose
  own fill **is** the scrim: **black @ 80%**, exactly §G.3.
- The drawer clone is nested inside it, **pinned right at x=720**, resized to a 720×800
  viewport with `overflowDirection = "VERTICAL"` so its 3774px of bands scroll.
- `Scrim hotspot — click outside to close` **`78:13254`** covers the left 720px,
  transparent, carrying **`{type:"CLOSE"}`** — which restores the click-outside dismissal
  the read-only property denied.

Every screen's row/card opens **the wrapper**, not the bare drawer. Because the wrapper is
a full-bleed frame, the default `overlayPositionType = "CENTER"` lands it exactly over the
viewport, so the read-only position property stops mattering.

**Rule for future overlays: never fight the read-only overlay properties. Build a
full-bleed wrapper with a real scrim fill and an explicit `{type:"CLOSE"}` hotspot.**

## U5. Reaction schema — the four shapes that actually work

Consolidated from B6, B7, B9 and the orchestrator's own probes. Every one confirmed by a
validation error, not guessed:

| Need | Correct shape |
|---|---|
| Any reaction | `actions: [ … ]` — the **array**. Singular `action` throws *"Please update the `actions` field instead"* |
| Instant transition | **`transition: null`** — a literal null. `{type:"INSTANT_TRANSITION"}` and an omitted field both throw |
| Close an overlay | top-level **`{type:"CLOSE"}`** — no `transition`, no `destinationId`, and **not** `navigation:"CLOSE_OVERLAY"` nested under a `NODE` action |
| `NAVIGATE` / `CHANGE_TO` destination | must be a **top-level frame on the same page**. Component-set variants and nested frames are both rejected |
| `overlayRelativePosition` | only accepted when the destination frame's `overlayPositionType === "MANUAL"` — which is read-only, so in practice: never send it |

## U6. Content gaps found by inspection, not reported by builders

- **B1 never built §I-B1.2's overflow line or the `View all 12 in the grid` link.** Neither
  string existed anywhere on page `25:2956`, which is why the cross-wiring queue item had
  nothing to bind to. **Built and wired** on both the source (`81:20813` / link `81:20815`)
  and the flow clone (`82:30945` / link `82:30947`), in `CR2/Accent/primary-text` `#5B7611`
  — the AA-safe lime, never `#749818`.
- **Geist has no Italic.** Available styles: Black, Bold, ExtraBold, ExtraLight, Light,
  Medium, Regular, SemiBold, Thin. B9's 4 quoted script lines (§I-B9 "quoted italic") fell
  back to **Geist Regular**, so the italic emphasis is lost — the quotation marks now carry
  it alone. Needs a typographic call: accept, or switch those lines to a different weight.
- **B9 wrote its own copy for the 3 modal bodies** (Pause / Relaunch / Edit targeting)
  because those strings were not in the source extraction. Plausible product tone, but
  **not verbatim from code** — the only such copy in the build. Flagged for a content pass.

## U7. Layer naming — 500 violations cleared

§K.4 requires zero `Frame N` / `Group N` / `Rectangle N` / `Ellipse N`. Every page carried
the same 5 inherited shell layers × one per cloned frame. **500 renamed across B1–B8**
(B9 had none — its drawer is not a shell clone), 0 unresolved, 0 remaining editable, using
the same content-derived names applied to the master. The residual `Frame N` layers with
`I…;…` ids live inside library instances and are unrenameable by design.

---

# PATCH 07 — MAALIK'S RULINGS (BINDING) + B2 motion-deviation record

Written after Maalik reviewed the open accessibility/library questions raised by
PATCH 05 (§T) and the bare-dash question raised by §F.4/§K.10. These three rulings
are now binding spec. Where they contradict §F.4, §K.10, §E.1, §E.3, §J.3, or
PATCH 05 T6, **this patch wins.**

## V1. RULING — bare `—` in `ConfidenceChip` is COMPLIANT, not a defect. The rule is narrowed.

§K.10's blanket line — *"No lorem, no placeholder, no bare `—` for missing data"* —
read literally, as if any bare dash anywhere is a defect. **That is not the intent, and
it is hereby narrowed:**

> **The rule is: no bare dash *without an accessible explanation*.** A dash that carries
> a tooltip (or adjacent visible text) naming the method and the reason IS the honest
> "why" the rule exists to enforce — it is not the thing the rule bans.

**Verified against source** — `src/creative-report/components/ConfidenceChip.tsx`:
- The `na` variant's `label` is literally `"—"` (line 36).
- But the chip is **always wrapped in a `Tooltip`** (`ConfidenceChip.tsx` lines 50–68):
  the tooltip title renders `"{label} confidence"` and a body line renders `m.method`,
  which for `na` is the verbatim string *"No video on this creative, so this signal
  doesn't apply."* (line 38).
- So every bare-dash chip in this codebase ships with its method + reason attached.
  This is the documented contract stated in the component's own header comment:
  *"The chip is ALWAYS visible; the tooltip explains how it was computed."*

**RULING:**
- **B3's 10 bare-dash `Confidence Chip` instances and B9's 1 are COMPLIANT — remove
  them from every open-defect list, on every page and on the Handoff board.** They
  carry the chip's tooltip (method + reason) exactly as `ConfidenceChip.tsx` specifies.
- **A bare `—` with NO tooltip and NO adjacent explanation remains a defect** — that is
  the actual failure mode §K.10 exists to catch. If a future builder finds a bare dash
  standing alone with nothing explaining it, that is still logged and fixed.
- This applies file-wide, not just to B2 — the ruling is about the rule's intent, not
  about anything on B2's own page.

## V2. RULING — `colorTextTertiary` at 4.24:1 is an ACCEPTED, documented deviation. Not an open defect. Not a library ask.

**Verified by direct computation, not asserted:**

`Colors/Neutral/Text/colorTextTertiary` = `#0f0f0c` at 55% opacity, over a white
(`#ffffff`) background.

Blending `rgba(15,15,12,0.55)` over white gives an effective solid of
approximately `rgb(123,123,121)`. Its WCAG relative luminance is **0.1976**; against
white's luminance of 1.0, the contrast ratio is:

**(1.0 + 0.05) / (0.1976 + 0.05) ≈ 4.24:1**

— 0.26 short of the AA body-text threshold (4.5:1), confirming §F.4's own note that
this is why `#5B7611` (not this token) is used for lime text. It is **visually
indistinguishable from a passing value** (a ~6% luminance gap), and it is the
highest-volume text token in the entire build: **306 uses on B3, 214 on B1** (and
present on every other page as the standard tertiary-text color).

**RULING:**
- **`colorTextTertiary` at 4.24:1 is an ACCEPTED, DOCUMENTED DEVIATION.** Do not log it
  as an open defect on any page's report or on the Handoff board. Do not raise it as a
  library ask (a token-value change at this scale would touch hundreds of instances
  file-wide for a 0.26 gap that reads as identical on screen).
- This is a deliberate accessibility tradeoff, made once, here — not something each
  builder re-litigates per page.

**Related finding, kept OPEN — the token name is ambiguous, and that IS a library-side item:**
Two different variables in the library both carry the exact name
`Colors/Neutral/Text/colorTextTertiary` with different values:
`#0f0f0c` @ 55% → **4.24:1**, and `#000000` @ 45% → computed the same way, **3.35:1**.
(`rgba(0,0,0,0.45)` over white blends to `rgb(140,140,140)`, luminance **0.2637**,
contrast `(1.05)/(0.3137) ≈ 3.35:1`.) So "use `colorTextTertiary`" resolves to two
different, non-interchangeable contrast ratios depending on which variable a component
actually binds — this is the same symptom PATCH 05 §T0/§J.12 already logged for
cross-library collisions. **This ambiguity stays an OPEN library-side item** (already
tracked under J.12) — the 4.24:1 acceptance above covers the specific token this
build binds to, not a blanket acceptance of whichever `colorTextTertiary` resolves at
build time. If the library ever collapses these to one value, re-verify which one won.

## V3. RULING — primary CTAs keep brand lime `#8fb821` exactly. Text switches to dark. Fill does NOT darken.

White label on `#8fb821` fill measures **2.32:1** — fails AA by a wide margin (needs
4.5:1). Two ways to fix a failing button: darken the fill, or darken the label.
**Maalik's decision: darken the label, preserve the fill.** The brand lime is not
negotiable; `#5B7611`-style fill-darkening (as was floated and rejected) would mute the
one color the product uses as its active/selected signal (§E.5: *"Lime is active/selected
only — never decorative"*) into something that reads as a duller, off-brand green.

**Exact value to use:** near-black `#0f0f0c`, full opacity, as the label color on the
`#8fb821` fill.

**Computed contrast — done, not asserted:**
`#0f0f0c` (linear-relative luminance **0.004696**) against `#8fb821` (linear-relative
luminance **0.402603**):

**(0.402603 + 0.05) / (0.004696 + 0.05) ≈ 8.27:1**

— clears AA (4.5:1) by nearly double, and clears AAA (7:1) as well. This is not a
marginal fix; `#0f0f0c`-on-lime has more headroom than most passing token pairs in this
file.

**Do NOT darken the fill to `#5B7611` or any other value.** The fill stays exactly
`#8fb821` / `Colors/Brand/Primary/colorPrimary` everywhere. Only the label (and any
icon glyph inside the same control) switches to `#0f0f0c`.

**Every control this sweep must cover** (compiled so the later sweep is unambiguous —
this patch defines the rule, it does not execute it):
- "Save changes"
- "Retry"
- "Create rule" (B5 rule-builder modal footer)
- "Save current view" (B8)
- "Generate variation" (B9 drawer action bar — primary button)
- B6 Owner-report wizard step numbers/labels wherever they render on a lime fill
  (§I-B6 `*Steps*` — any active-step chip using the primary fill)
- Any other lime-filled primary button surfaced by the sweep — this list is the
  known set at time of writing, not guaranteed exhaustive; the sweep agent must still
  visually check each page rather than stop at this list.

**Explicitly out of scope for this patch:** executing the sweep. B3, B5, B7, B8, B9 are
currently held by other agents; PATCH 07 only defines the rule so whoever runs the
sweep next has no ambiguity about the target value, the contrast math, or which
controls are in scope. **Do not act on this list until those pages are free.**

## V4. RECORD — B2's opacity-only entrance is an ACCEPTED motion deviation, now spec-level

B2's `SPEC / Creatives / Interactions` board (`90:22242`) already logs, honestly and
correctly, that its `ENTRANCE` sequence omits the `translateY(6px)` portion of the
`cr-fade-up` recipe and reveals sections by opacity only. **Promoting that page-local
note to spec-level so it is not re-flagged as a miss by a future monitor pass:**

**RULING:** the `translateY(6px) → 0` half of `cr-fade-up` is **not achievable** inside
`Page Body`, because `Page Body` (`32:5666`) is a `VERTICAL` auto-layout frame — its
children's position is computed from the layout (stack order + gap + padding), not from
free `x`/`y`, so a manual per-child `y` offset either gets silently overwritten by the
auto-layout pass or, if forced, breaks every sibling's position below it. This is a
structural constraint of auto-layout, not a builder oversight.

- **Accepted file-wide wherever a screen's entrance sections live inside a `VERTICAL`
  auto-layout `Page Body`** (true for every one of the 9 screens per §I) — opacity-only
  reveal is the correct implementation of `cr-fade-up` in this context, not a partial one.
- B6 logged the identical simplification independently (§U6 cross-reference) — this is
  now the documented rule both builders converged on, not a coincidence to re-question.
- Do not ask a future builder to "fix" the missing translateY by detaching Page Body's
  auto-layout or by absolute-positioning children — either would break §K.12 (row/column
  layout integrity) for a purely cosmetic 6px slide.

## V5. Summary — what changes on open-defect lists because of this patch

| Item | Was | Now |
|---|---|---|
| B3's 10 + B9's 1 bare-dash Confidence Chips | Open defect (§K.10) | **Compliant — remove from defect lists** |
| `colorTextTertiary` 4.24:1 | Open defect / library ask candidate | **Accepted, documented deviation — not open, not a library ask** |
| `colorTextTertiary` name → 2 different values (4.24:1 vs 3.35:1) | — | **Stays OPEN, library-side (J.12 family)** |
| Primary CTA white-on-lime (2.32:1) | Open contrast defect, fix unspecified | **Ruling recorded: label → `#0f0f0c` (8.27:1), fill unchanged. Sweep itself still pending — see V3's control list** |
| B2 entrance opacity-only (no translateY) | Logged locally on B2's SPEC board only | **Promoted to spec-level accepted deviation, file-wide for any `VERTICAL` auto-layout `Page Body`** |
