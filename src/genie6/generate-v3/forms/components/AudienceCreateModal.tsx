import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Audience, Gender } from "@/genie6/generate-v3/mocks/audiences";

/**
 * AudienceCreateModal — manual audience creation dialog (A-11.21).
 *
 * Spec from Maalik:
 *   "user can create audience manually in a modal, by giving inputs,
 *    language, gender, age and geo location, and a brief of that
 *    audience but optional."
 *
 * On save → caller appends to the form's `customAudiences` array and
 * auto-selects the new audience.
 */

export interface AudienceCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (audience: Audience) => void;
}

const GENDER_OPTS: { value: Gender | "any"; label: string }[] = [
  { value: "any", label: "Any" },
  { value: "f", label: "Women" },
  { value: "m", label: "Men" },
  { value: "x", label: "Non-binary" },
];

const GEO_OPTS = ["IN", "US", "UK", "AE", "AU", "CA", "SG"];

export function AudienceCreateModal({
  open,
  onOpenChange,
  onSave,
}: AudienceCreateModalProps) {
  const [name, setName] = useState("");
  const [language, setLanguage] = useState("English");
  const [gender, setGender] = useState<Gender | "any">("any");
  const [ageMin, setAgeMin] = useState(25);
  const [ageMax, setAgeMax] = useState(40);
  const [geo, setGeo] = useState("IN");
  const [brief, setBrief] = useState("");

  // Reset on close
  useEffect(() => {
    if (!open) {
      setName("");
      setLanguage("English");
      setGender("any");
      setAgeMin(25);
      setAgeMax(40);
      setGeo("IN");
      setBrief("");
    }
  }, [open]);

  const canSave = name.trim().length >= 2 && ageMax >= ageMin;

  const handleSave = () => {
    if (!canSave) return;
    const audience: Audience = {
      id: `aud-custom-${Date.now()}`,
      name: name.trim(),
      geo,
      ageMin,
      ageMax,
      gender,
      tags: [],
      brief: brief.trim() || undefined,
      language,
      system: false,
    };
    onSave(audience);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create custom audience</DialogTitle>
          <DialogDescription>
            Used only for this generation. Saved to your library.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Field label="Name" required>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Tier-2 health-led mums"
              className="block h-9 w-full rounded-md border border-border bg-background px-2.5 text-xs text-foreground focus:border-primary/40 focus:outline-none"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Language">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="block h-9 w-full rounded-md border border-border bg-background px-2.5 text-xs text-foreground focus:border-primary/40 focus:outline-none"
              >
                {[
                  "English",
                  "Hindi",
                  "Hindi · English",
                  "Tamil",
                  "Telugu",
                  "Marathi",
                ].map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Geo">
              <select
                value={geo}
                onChange={(e) => setGeo(e.target.value)}
                className="block h-9 w-full rounded-md border border-border bg-background px-2.5 text-xs text-foreground focus:border-primary/40 focus:outline-none"
              >
                {GEO_OPTS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Gender">
            <div className="flex flex-wrap gap-1">
              {GENDER_OPTS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setGender(opt.value)}
                  aria-pressed={gender === opt.value}
                  className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] transition-colors",
                    gender === opt.value
                      ? "bg-primary text-primary-foreground font-medium"
                      : "border border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Age range">
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={13}
                max={ageMax}
                value={ageMin}
                onChange={(e) =>
                  setAgeMin(Math.max(13, Math.min(99, Number(e.target.value) || 13)))
                }
                className="block h-9 w-20 rounded-md border border-border bg-background px-2.5 text-xs text-foreground focus:border-primary/40 focus:outline-none"
                aria-label="Minimum age"
              />
              <span className="text-xs text-muted-foreground">to</span>
              <input
                type="number"
                min={ageMin}
                max={99}
                value={ageMax}
                onChange={(e) =>
                  setAgeMax(Math.max(ageMin, Math.min(99, Number(e.target.value) || 99)))
                }
                className="block h-9 w-20 rounded-md border border-border bg-background px-2.5 text-xs text-foreground focus:border-primary/40 focus:outline-none"
                aria-label="Maximum age"
              />
            </div>
          </Field>

          <Field label="Brief" sub="optional">
            <textarea
              rows={3}
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="What is true about this audience that should bias the ad?"
              className="block w-full resize-none rounded-md border border-border bg-background px-2.5 py-2 text-xs text-foreground focus:border-primary/40 focus:outline-none"
            />
          </Field>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            Save audience
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  sub,
  required,
  children,
}: {
  label: string;
  sub?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="flex items-center gap-1 text-[11px] font-medium text-foreground">
        {label}
        {required && (
          <span className="text-destructive" aria-label="required">
            ·
          </span>
        )}
        {sub && (
          <span className="text-[10px] font-normal text-muted-foreground">
            · {sub}
          </span>
        )}
      </span>
      {children}
    </label>
  );
}
