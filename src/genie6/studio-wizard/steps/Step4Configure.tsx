import type {
  ActiveColumnInput,
  StudioV4Form,
} from "@/genie6/v4-shared/types";
import { StepShell } from "../components/StepShell";
import { ScratchConfigure } from "./scratch/ScratchConfigure";
import { IterateConfigure } from "./iterate/IterateConfigure";

/**
 * Step 4 — Configure.
 *
 * Branches on `form.path`. Scratch shows the trigger-row form that hands
 * heavy pickers to the right column; Iterate shows the upload + preserve
 * + intensity layout. Final step — wizard footer becomes a PromptBar.
 */

export interface Step4ConfigureProps {
  form: StudioV4Form;
  update: <K extends keyof StudioV4Form>(key: K, value: StudioV4Form[K]) => void;
  setActiveColumnInput: (next: ActiveColumnInput) => void;
}

export function Step4Configure({
  form,
  update,
  setActiveColumnInput,
}: Step4ConfigureProps) {
  return (
    <StepShell>
      {form.path === "iterate" ? (
        <IterateConfigure form={form} update={update} />
      ) : (
        <ScratchConfigure
          form={form}
          update={update}
          setActiveColumnInput={setActiveColumnInput}
        />
      )}
    </StepShell>
  );
}
