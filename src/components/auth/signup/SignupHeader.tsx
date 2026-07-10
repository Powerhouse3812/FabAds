/**
 * SignupHeader — "👋 Welcome to Fab-Funnel" + "Start Your Onboard Journey!"
 * block shared by all 3 wizard steps (Figma node 9431:54691 and its
 * equivalents in steps 2/3 — identical copy across all three frames).
 */
export function SignupHeader() {
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <div className="flex items-center gap-2">
        <span aria-hidden="true" className="text-2xl">
          👋
        </span>
        <h1 className="text-2xl font-bold text-foreground">Welcome to Fab-Funnel</h1>
      </div>
      <p className="text-sm text-foreground">Start Your Onboard Journey!</p>
    </div>
  );
}
