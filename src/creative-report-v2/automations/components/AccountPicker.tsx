/**
 * AccountPicker — checkbox list of ad accounts for the "sync to Meta ad
 * account library" automation action. Used by both the rule builder and the
 * bulk action bar, so it stays presentational: no store reads, all state
 * lives in the caller via `selected`/`onChange`.
 *
 * Meta accounts only (Maalik's decision) — `metaAccounts()` from
 * `sync/syncModel.ts` filters to the 3 of 5 mock accounts on `platform ===
 * "meta"`. The 2 non-Meta accounts still render, disabled, with a "Soon"
 * tag, so the limitation is visible rather than mysteriously absent.
 */
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { AD_ACCOUNTS } from "@/data/accounts";
import { metaAccounts } from "@/creative-report-v2/automations/sync/syncModel";
import { pluralize } from "@/creative-report-v2/lib/format";

interface AccountPickerProps {
  selected: string[];
  onChange: (ids: string[]) => void;
  /** Optional. accountId → creativeIds in the current selection already synced there. */
  alreadyByAccount?: Record<string, string[]>;
  /**
   * Optional, additive beyond the base spec. When the caller knows the full
   * size of the current creative selection (the bulk action bar does; the
   * rule builder generally doesn't), pass it to get the exact "X of Y
   * already here" phrasing. Without it, this only states the one real
   * number it has (`alreadyByAccount[id].length`) rather than guess a
   * denominator it can't verify.
   */
  totalSelected?: number;
}

export function AccountPicker({ selected, onChange, alreadyByAccount, totalSelected }: AccountPickerProps) {
  const meta = metaAccounts();
  const soon = AD_ACCOUNTS.filter((account) => account.platform !== "meta");

  const toggle = (accountId: string) => {
    if (selected.includes(accountId)) {
      onChange(selected.filter((id) => id !== accountId));
    } else {
      onChange([...selected, accountId]);
    }
  };

  return (
    <div className="space-y-1">
      {meta.map((account) => {
        const already = alreadyByAccount?.[account.id] ?? [];
        return (
          <label
            key={account.id}
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-foreground hover:bg-accent"
          >
            <Checkbox
              checked={selected.includes(account.id)}
              onCheckedChange={() => toggle(account.id)}
            />
            <span className="min-w-0 flex-1 truncate">{account.name}</span>
            {already.length > 0 && (
              <span className="shrink-0 text-[12px] text-muted-foreground">
                {totalSelected !== undefined
                  ? `${already.length} of ${totalSelected} already here — will be skipped`
                  : `${pluralize(already.length, "creative")} already here — will be skipped`}
              </span>
            )}
          </label>
        );
      })}

      {soon.length > 0 && (
        <div className="mt-2 space-y-1 border-t border-border pt-2">
          {soon.map((account) => (
            <div
              key={account.id}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] text-muted-foreground"
            >
              <Checkbox checked={false} disabled aria-label={`${account.name} (coming soon)`} />
              <span className="min-w-0 flex-1 truncate">{account.name}</span>
              <Badge variant="outline" className="h-4 shrink-0 px-1.5 py-0 text-[10px] font-medium">
                Soon
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
