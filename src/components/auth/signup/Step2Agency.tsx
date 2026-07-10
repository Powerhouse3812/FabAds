import { type Dispatch, type FormEvent, type SetStateAction, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { SignupFormData } from "./types";

/**
 * Step 2 — Assemble Agency (Figma node 9431:55379). Agency name (required)
 * + an optional "About your Agency" textarea, then Previous / Next.
 */
export function Step2Agency({
  data,
  setData,
  onNext,
  onBack,
}: {
  data: SignupFormData;
  setData: Dispatch<SetStateAction<SignupFormData>>;
  onNext: () => void;
  onBack: () => void;
}) {
  const [submitted, setSubmitted] = useState(false);
  const agencyNameError = submitted && data.agencyName.trim().length === 0 ? "Agency name is required" : null;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (data.agencyName.trim()) {
      onNext();
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex w-full flex-col gap-4">
      <div className="flex flex-col items-start gap-2">
        <Label htmlFor="signup-agency-name">Agency Name</Label>
        <Input
          id="signup-agency-name"
          name="agencyName"
          placeholder="Input"
          value={data.agencyName}
          onChange={(e) => setData((d) => ({ ...d, agencyName: e.target.value }))}
          aria-invalid={!!agencyNameError}
          className={cn(agencyNameError && "border-destructive focus-visible:ring-destructive")}
        />
        {agencyNameError && <p className="text-sm text-error-text">{agencyNameError}</p>}
      </div>

      <div className="flex flex-col items-start gap-2">
        <div className="flex items-center gap-1">
          <Label htmlFor="signup-agency-about">About your Agency</Label>
          <span className="text-sm text-muted-foreground">(optional)</span>
        </div>
        <Textarea
          id="signup-agency-about"
          name="agencyAbout"
          placeholder="Textarea"
          rows={3}
          value={data.agencyAbout}
          onChange={(e) => setData((d) => ({ ...d, agencyAbout: e.target.value }))}
        />
      </div>

      <div className="flex w-full gap-4">
        <Button type="button" variant="outline" onClick={onBack} className="h-10 flex-1 rounded-lg">
          Previous
        </Button>
        <Button type="submit" className="h-10 flex-1 rounded-lg">
          Next
        </Button>
      </div>
    </form>
  );
}
