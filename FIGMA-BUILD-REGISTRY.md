# FIGMA-BUILD-REGISTRY — the live shared state for wave 2

**Every builder MUST append to its own row block here as its LAST action**, before
reporting. The sync orchestrator reads this file to do cross-screen wiring. If your
ids are missing, your screen will not get wired to anything.

Append only to YOUR section. Never edit another builder's section. Never reformat
the file.

## Known-good shared facts (do not re-discover — zero reads)

- File: `a4R8eBl0xyNFENEJiLor0j`
- **Drawer overlay root: `39:24264`** (`OVERLAY / Drawer / Populated`, page `25:2964`)
- Shell master: `30:3599`
- Foundations page: `25:2954` · Handoff page: `25:2965`
- Library (only one subscribed for our use): **Design System - FF new**,
  `lk-d0db22f96aa104f4b76d850fbacce5d06f3866b8cf065e1faa6878f87f56beb2b10d66320382109b7daeae0c2a09bc71f7c17a4d710bd8233221ba86bee350b5`
- Foundations keys: Creative Card `98ae5ba5dbc1c10a622da4ee037377ddf774bada` ·
  Metric Cell `6325d00da59ce0357d4271bc4e7b614e444f80e9` ·
  Bucket Chip `ca6baf9c47439d1b8d2fed4e3295cd29d32f09a8` ·
  Chart Placeholder `f5240a954d967c15a6464008a02206b1579dd2f2` ·
  Glass Panel `a453a95ece51d1eb666d41d12f1915195c21e283`
- Table atoms: Header Item `4b11dbcaf97f43b58cf9cafb3855fe1eea873107` ·
  Cell `2a1fe912edf5c011af9343dc901673e83fc4fbc7`

## Per-builder blocks

### B1 · Overview · page 25:2956 — COMPLETE (wave 1)
- Populated `39:13954` · Loading `46:4192` · Empty `47:5138` · Filtered-empty `47:6223`
- Error `48:7036` · Partial `49:7985` · Long-content `49:9122`
- Bucket states: Winners `50:10000` · Scaling `50:11301` · Fatiguing `39:13954` · New `50:12632` · Losers `50:13882`
- ENTRANCE `51:23478`→`51:29388` · SPEC board `52:20813`
- OUTSTANDING: Inter→Geist sweep; row→drawer targets unset

### B2 · Creatives · page 25:2957
- Grid Populated `39:10206` (done) · Table Populated `39:11281` (shell only)
- (append your new ids here)

### B3 · Components · page 25:2958
- Populated shell `39:40650` (Page Body empty)
- (append)

### B4 · Compare · page 25:2959
- Populated `39:3029` · Line `39:26882` · Bar `39:27023` · Loading `39:36683`
- Empty `39:33368` · Filtered-empty `39:33499` · Error `39:39567`
- LOCAL/Compare/Column `39:24278` (parked at 4000,4000 — needs relocating)
- (append)

### B5 · Automations · page 25:2960
- Rules Populated `39:8048` · Boards Populated `39:30169` · Digest `39:37989` (body empty)
- OUTSTANDING: H1 + Rules|Boards|Digest segmented strip missing on `39:8048` and `39:30169`
- (append)

### B6 · Owner report · page 25:2961
- Populated `39:9123` (header + KPIs + trend + by-brand table)
- OUTSTANDING: Page Body `39:9246` is h=654 clipsContent — content already clipped
- (append)

### B7 · Brief builder · page 25:2962
- Populated `39:19846` (back link + header only)
- (append)

### B8 · Saved views · page 25:2963
- Populated `39:20980` · header `39:31284` · save card `39:31287`
- LOCAL/Saved Views/View Row set `39:37979` (parked at -6000,-7000 — needs relocating)
- (append)

### B9 · Drawer · page 25:2964
- **Root `39:24264`** · header `39:24265` · AdPreviewMock `39:39527`
- (append)

## Cross-screen wiring queue (sync orchestrator owns this)
- [ ] Every creative row/card on B1,B2,B4,B5 → Open Overlay `39:24264`, Move In from Right, Ease In And Out, 500ms
- [ ] 8 sub-nav tabs → each screen's Populated frame (needs all 9 ids above)
- [ ] Overview "View all N in grid" → B2 Grid Populated
- [ ] Overview "Open Automations" → B5 Rules Populated
- [ ] Re-point any FF-non-new component keys → FF-new equivalents
- [ ] Page Body unclip fix wherever content > 654px
- [ ] Handoff page `25:2965`: J-list, substitution log, blocked-font log, motion spec
