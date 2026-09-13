import type { GenieApp } from "../appTypes";

/**
 * The app's zero-data state (§8 anatomy, `GenieApp.zeroState`) — "nothing has
 * run here yet, here's what this app does". It stays ON THE PAGE rather than
 * moving into the results drawer: a drawer that has to be opened to explain
 * what an empty app is for is a worse first-run than a page that just says it.
 * Once anything HAS run, the page swaps this for the "View results" affordance
 * and the outputs themselves live in the drawer.
 */
export function AppZeroState({ app }: { app: GenieApp }) {
  const z = app.zeroState;
  if (!z) return null;
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed border-border px-6 py-10 text-center">
      <h2 className="text-[15px] font-bold text-foreground">{z.title}</h2>
      <p className="max-w-sm text-[13px] text-muted-foreground">{z.line}</p>
      <ol className="flex w-full max-w-sm flex-col gap-2 text-left">
        {z.steps.map((step, i) => (
          <li key={i} className="flex items-start gap-2.5 text-[13px] text-foreground">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-[10.5px] font-bold text-primary-text">
              {i + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
