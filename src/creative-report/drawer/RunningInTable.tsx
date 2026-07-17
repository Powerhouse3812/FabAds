/**
 * RunningInTable — "Where it's running" → Compare (handoff §5.2).
 * One row per surviving AdInstance; the messy human campaign/adset names are
 * shown in full via title tooltip — they're a feature, not noise to hide.
 */
import { GitCompareArrows } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { ACCOUNT_BY_ID } from "@/data/accounts";
import { PLATFORM_LABELS, STATUS_LABELS } from "@/creative-report/lib/paramSchema";
import { fmtCompactCurrency, truncate, CAMPAIGN_MAX } from "@/creative-report/lib/format";
import type { AdInstance } from "@/data/model";
import type { CreativeRollup } from "@/creative-report/lib/selectors";

const ACCOUNT_MAX = 20;

function instanceSpend(inst: AdInstance): number {
  return inst.daily.reduce((s, r) => s + r.spend, 0);
}

export function RunningInTable({
  rollup,
  onCompareContexts,
}: {
  rollup: CreativeRollup;
  onCompareContexts: () => void;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">Where it's running</span>
        <Button variant="ghost" size="sm" onClick={onCompareContexts} className="gap-1.5">
          <GitCompareArrows className="h-4 w-4" />
          Compare contexts
        </Button>
      </div>

      {rollup.isCrossPlatform && (
        <p className="text-xs text-muted-foreground">
          Runs on {rollup.platforms.length} platforms / {rollup.accountIds.length} accounts — numbers below are
          per context.
        </p>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Platform</TableHead>
            <TableHead>Account</TableHead>
            <TableHead>Campaign</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Spend</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rollup.instances.map((inst) => {
            const accountName = ACCOUNT_BY_ID[inst.accountId]?.name ?? inst.accountId;
            const account = truncate(accountName, ACCOUNT_MAX);
            const campaign = truncate(inst.campaignName, CAMPAIGN_MAX);
            const statusVariant =
              inst.status === "active" ? "default" : inst.status === "paused" ? "secondary" : "outline";
            return (
              <TableRow key={inst.id}>
                <TableCell>{PLATFORM_LABELS[inst.platform]}</TableCell>
                <TableCell title={account.truncated ? accountName : undefined}>{account.text}</TableCell>
                <TableCell title={campaign.truncated ? inst.campaignName : undefined}>
                  {campaign.text}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={statusVariant}
                    className={cn(inst.status === "archived" && "text-muted-foreground")}
                  >
                    {STATUS_LABELS[inst.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {fmtCompactCurrency(instanceSpend(inst))}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
