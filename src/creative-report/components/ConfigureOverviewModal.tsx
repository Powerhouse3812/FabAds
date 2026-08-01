/**
 * ConfigureOverviewModal — replaces the retired ReportWizard (Maalik: "we can
 * keep configure the overview tab option instead"). Toggles which sections
 * Overview renders — bucket tabs, breakdown, recommendations, automations
 * preview, testing velocity — backed by the overviewConfig.ts store.
 *
 * Unlike the old export wizard, this ACTUALLY changes what's on screen: it
 * flips the same switches Overview.tsx reads to gate each section. The last
 * remaining visible section can't be switched off (overviewConfig's
 * setSection guards it) — Overview must never go fully blank with no control
 * left to bring a section back, so that switch renders disabled with an
 * explanatory label instead of silently no-opping.
 */
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { OVERVIEW_SECTIONS, setSection, useOverviewConfig } from "@/creative-report/lib/overviewConfig";

export interface ConfigureOverviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConfigureOverviewModal({ open, onOpenChange }: ConfigureOverviewModalProps) {
  const config = useOverviewConfig();
  const visibleCount = OVERVIEW_SECTIONS.filter((s) => config[s.key]).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configure overview</DialogTitle>
          <DialogDescription>
            Choose which sections show on the morning triage screen. Changes apply immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          {OVERVIEW_SECTIONS.map((section) => {
            const isLastOn = config[section.key] && visibleCount === 1;
            return (
              <div
                key={section.key}
                className="flex items-center justify-between gap-4 rounded-lg border border-border p-3"
              >
                <Label
                  htmlFor={`overview-section-${section.key}`}
                  className="text-[13px] font-medium text-foreground"
                >
                  {section.label}
                  {isLastOn && (
                    <span className="mt-0.5 block text-[11px] font-normal text-muted-foreground">
                      At least one section must stay visible.
                    </span>
                  )}
                </Label>
                <Switch
                  id={`overview-section-${section.key}`}
                  checked={config[section.key]}
                  disabled={isLastOn}
                  onCheckedChange={(checked) => setSection(section.key, checked)}
                />
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
