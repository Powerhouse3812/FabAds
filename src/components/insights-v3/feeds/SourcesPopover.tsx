/** What feeds My Feeds, as a popover. The trigger is whatever the caller passes (the sources pill, the toolbar gear). */
import type { ReactNode } from "react";
import type { UserPrefs } from "@/lib/insights-v3/selectors";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SourcesList } from "@/components/insights-v3/discover/MyFeedsIdentity";

export function SourcesPopover({ prefs, children, align = "start" }: { prefs: UserPrefs; children: ReactNode; align?: "start" | "end" }) {
  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align={align} className="w-[340px] p-3">
        <SourcesList prefs={prefs} />
      </PopoverContent>
    </Popover>
  );
}
