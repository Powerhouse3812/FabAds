import { SubModeChipRow } from "@/genie6/v4-shared/components/SubModeChipRow";
import { SUB_MODE_PROFILES, type SubMode } from "@/genie6/v4-shared/types";
import { StepShell } from "../components/StepShell";

/**
 * Step 1 — Pick a sub-mode.
 *
 * One question per screen. The chip row drives the rest of the wizard
 * (some sub-modes lock the path, some lock the output). Description of
 * the active chip echoes below as plain English so the user has a
 * one-liner of what they're committing to.
 */

export interface Step1SubModeProps {
  value: SubMode;
  onChange: (next: SubMode) => void;
}

export function Step1SubMode({ value, onChange }: Step1SubModeProps) {
  const profile = SUB_MODE_PROFILES[value];
  return (
    <StepShell>
      <div className="space-y-6">
        <header className="space-y-1.5">
          <h1 className="text-xl font-semibold text-foreground">
            What are you generating?
          </h1>
          <p className="text-sm text-muted-foreground">
            Pick the kind of asset you want. We&apos;ll only ask for the
            inputs that matter for it.
          </p>
        </header>

        <SubModeChipRow value={value} onChange={onChange} />

        <div className="rounded-lg border border-border bg-card/40 px-3 py-2.5">
          <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
            {profile.label}
          </p>
          <p className="mt-1 text-sm text-foreground">{profile.description}</p>
        </div>
      </div>
    </StepShell>
  );
}
