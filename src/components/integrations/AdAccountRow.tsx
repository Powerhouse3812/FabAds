import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { fbAccountStatusMap as statusMap } from "@/lib/fb-status-map";
import { getHealthBadge } from "@/hooks/use-account-health";
import type { HealthConfig, HealthSnapshot } from "@/hooks/use-account-health";
import type { FbAdAccount } from "@/hooks/use-fb-connection";

interface Props {
  account: FbAdAccount;
  snapshot?: HealthSnapshot | null;
  config?: HealthConfig | null;
  onClick?: () => void;
}

const modeLabels: Record<string, string> = {
  off: "OFF",
  monitor: "Monitor",
  auto_maintain: "Auto",
};

export default function AdAccountRow({ account, snapshot, config, onClick }: Props) {
  const badge = getHealthBadge(snapshot);
  const modeLabel = modeLabels[config?.guardrail_mode || "off"] || "OFF";

  return (
    <TableRow className="cursor-pointer hover:bg-muted/50" onClick={onClick}>
      <TableCell className="font-medium">{account.name}</TableCell>
      <TableCell className="text-muted-foreground">{account.fb_account_id}</TableCell>
      <TableCell>{account.currency || "—"}</TableCell>
      <TableCell>
        <Badge variant="secondary">
          {account.account_status != null
            ? statusMap[account.account_status] || `Status ${account.account_status}`
            : "Unknown"}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant={badge.variant}>{badge.label}</Badge>
      </TableCell>
      <TableCell>
        <Badge variant="outline">{modeLabel}</Badge>
      </TableCell>
    </TableRow>
  );
}
