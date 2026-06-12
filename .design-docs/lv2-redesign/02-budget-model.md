# Budget model — correction

## Meta's actual model (not what I assumed)
Budget lives at **Campaign (CBO)** or **Ad set (ABO)** level. **Not per ad account.** Ad account is just the container + billing entity.

When user selects 2 ad accounts in Step 2:
- Each ad account gets its OWN campaign created from this launch
- Each campaign has its own budget (same input value, applied per account)
- Total workspace spend = budget × number of accounts

## UI implications
**Step 2 Campaign section shows ONE budget input:**
```
Daily budget          [ $200       ]      ← per campaign
                      
Mode: Campaign (CBO)  ●         ○  Ad set (ABO)
```

**When 2+ accounts selected, projected total appears:**
```
Daily budget          [ $200       ]
                      
Running in 2 ad accounts → $400/day total workspace spend
(2 campaigns × $200)
```

When ABO selected, mention applies per ad set per account:
```
Daily ad-set budget   [ $50        ]
                      
2 ad accounts × 3 ad sets each = 6 ad sets × $50 = $300/day total
```

## What this kills
- Per-account budget split UI (Equal / Custom / Weighted) — **deleted**
- "Total daily budget" + sliders per account — **deleted**
- The whole multi-account-share concept

## What stays
- Account health inline card per selected account (spend today, pages, pixel)
- Currency hint when an account's native currency ≠ workspace currency ($ default)
- Per-account different campaign-level overrides — POSSIBLE future, but not v2.0

## Open
- If user wants different budgets per account in v2.1, do they create separate launches? Or do we add per-account override toggle in Advanced?
- Should the "$200 → $400 total" projection be a chip near the input, or a small line below?
