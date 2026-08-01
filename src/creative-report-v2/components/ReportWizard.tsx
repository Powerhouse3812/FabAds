/**
 * ReportWizard — lightweight 3-step configure-and-"export" dialog for the
 * Owner Report (P5 "Rollups & loop"). Step 1 picks brands, step 2 picks
 * sections, step 3 previews + "exports".
 *
 * Scope note: this configures an export SNAPSHOT — it never filters what's
 * currently rendered on OwnerReport behind it (that would need deeper state
 * plumbing the prototype doesn't have yet). There's also no real PDF/CSV
 * pipeline here — Export just shows a toast, honestly labelled "simulated",
 * never implying a file was actually produced (design-system honesty rule,
 * same pattern as the Pause/Launch confirm flows elsewhere in this module).
 */
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { WhyDot } from "@/creative-report-v2/components/WhyDot";
import { useCreativeData } from "@/creative-report-v2/hooks/useCreativeData";
import { useReportParams } from "@/creative-report-v2/hooks/useReportParams";
import { brandRollups } from "@/creative-report-v2/lib/selectors";
import { fmtDateRange, pluralize } from "@/creative-report-v2/lib/format";

type SectionKey = "kpis" | "byBrand" | "byAccount" | "velocity";

const SECTION_OPTIONS: { key: SectionKey; label: string }[] = [
  { key: "kpis", label: "KPIs" },
  { key: "byBrand", label: "By brand" },
  { key: "byAccount", label: "By account" },
  { key: "velocity", label: "Testing velocity" },
];

const STEP_LABELS = ["Brands", "Sections", "Preview & export"];

export interface ReportWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReportWizard({ open, onOpenChange }: ReportWizardProps) {
  const data = useCreativeData();
  const { filters } = useReportParams();
  const { toast } = useToast();

  const brands = data.status === "ready" ? brandRollups(data.rollups) : [];

  const [step, setStep] = useState(1);
  const [brandIds, setBrandIds] = useState<string[]>([]);
  const [sections, setSections] = useState<SectionKey[]>(
    SECTION_OPTIONS.map((s) => s.key),
  );

  // Fresh defaults every time the dialog opens — all brands + all sections
  // checked, never a stale selection from a previous open.
  useEffect(() => {
    if (!open) return;
    setStep(1);
    setBrandIds(brands.map((b) => b.brandId));
    setSections(SECTION_OPTIONS.map((s) => s.key));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function toggleBrand(id: string) {
    setBrandIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }
  function toggleSection(key: SectionKey) {
    setSections((prev) => (prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]));
  }

  function handleExport() {
    toast({
      title: "Report exported (simulated)",
      description:
        "This prototype doesn't generate a real PDF/CSV or send an email — no file was produced.",
    });
    onOpenChange(false);
  }

  const selectedBrandNames = brands
    .filter((b) => brandIds.includes(b.brandId))
    .map((b) => b.brandName);
  const selectedSectionLabels = SECTION_OPTIONS.filter((s) => sections.includes(s.key)).map(
    (s) => s.label,
  );
  const canExport = selectedSectionLabels.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configure report</DialogTitle>
          <DialogDescription>
            Step {step} of 3 — {STEP_LABELS[step - 1]}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Date range</p>
                <p className="text-xs text-muted-foreground">
                  {fmtDateRange(filters.from, filters.to)} — change dates from the main filter bar,
                  not here.
                </p>
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-foreground">Brands to include</p>
                {brands.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No brand-linked creatives in the current view.
                  </p>
                ) : (
                  <div className="max-h-[220px] space-y-2 overflow-y-auto">
                    {brands.map((b) => (
                      <label
                        key={b.brandId}
                        className="flex items-center gap-2 text-[13px] text-foreground"
                      >
                        <Checkbox
                          checked={brandIds.includes(b.brandId)}
                          onCheckedChange={() => toggleBrand(b.brandId)}
                        />
                        {b.brandName}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-1.5">
              <p className="text-sm font-medium text-foreground">Sections to export</p>
              <div className="flex flex-col gap-2">
                {SECTION_OPTIONS.map((opt) => (
                  <label
                    key={opt.key}
                    className="flex items-center gap-2 text-[13px] text-foreground"
                  >
                    <Checkbox
                      checked={sections.includes(opt.key)}
                      onCheckedChange={() => toggleSection(opt.key)}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
              {!canExport && (
                <p className="text-[11px] text-destructive">Pick at least one section.</p>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <div className="rounded-lg border border-border bg-muted/40 p-3 text-[13px]">
                <p className="text-foreground">
                  <span className="font-medium">{pluralize(selectedBrandNames.length, "brand")}</span>:{" "}
                  {selectedBrandNames.length > 0 ? selectedBrandNames.join(", ") : "none selected"}
                </p>
                <p className="mt-1.5 text-foreground">
                  <span className="font-medium">Sections:</span>{" "}
                  {selectedSectionLabels.length > 0 ? selectedSectionLabels.join(", ") : "none selected"}
                </p>
                <p className="mt-1.5 text-foreground">
                  <span className="font-medium">Date range:</span> {fmtDateRange(filters.from, filters.to)}
                </p>
              </div>
              <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <WhyDot id="owner.export" />
                This configures what gets exported — it doesn&apos;t change what&apos;s shown on the
                report screen behind it.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="sm:justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1"
            onClick={() => (step === 1 ? onOpenChange(false) : setStep((s) => s - 1))}
          >
            {step > 1 && <ChevronLeft className="h-3.5 w-3.5" />}
            {step === 1 ? "Cancel" : "Back"}
          </Button>
          {step < 3 ? (
            <Button size="sm" className="gap-1" onClick={() => setStep((s) => s + 1)}>
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button size="sm" onClick={handleExport} disabled={!canExport}>
              Export
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
