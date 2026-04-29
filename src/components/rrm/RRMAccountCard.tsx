import { Settings, Loader2, Zap, FolderOpen, Crosshair } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { getHealthBadge, type HealthConfig, type HealthSnapshot } from "@/hooks/use-account-health";
import type { FbAdAccount } from "@/hooks/use-fb-connection";
import type { RRMAccountSetting, RRMCampaignUrl } from "@/hooks/use-rrm-settings";

const modeLabels: Record<string, string> = {
  off: "OFF",
  monitor: "Monitor",
  auto_maintain: "Auto-Maintain",
};

interface Props {
  account: FbAdAccount;
  snapshot: HealthSnapshot | null;
  config: HealthConfig | null;
  onRunDilution: (accountId: string) => void;
  onConfigure: (accountId: string) => void;
  dilutionLoading: boolean;
  accountSetting?: RRMAccountSetting | null;
  offers?: RRMCampaignUrl[];
  trendData?: { ratio: number }[];
}

function OfferInfo({ label, enabled, offerId, offers }: { label: string; enabled: boolean; offerId: string | null; offers: RRMCampaignUrl[] }) {
  const offer = offerId ? offers.find((o) => o.id === offerId) : null;

  return (
    <div className="space-y-0.5">
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <Badge variant={enabled ? "default" : "secondary"} className="text-[10px] px-1.5 py-0">
          {enabled ? "ON" : "OFF"}
        </Badge>
      </div>
      {offer ? (
        <div className="pl-1 space-y-0.5">
          <p className="text-xs text-foreground truncate">{offer.name}</p>
          {offer.folders.length > 0 && (
            <p className="text-[10px] text-muted-foreground flex items-center gap-1 truncate">
              <FolderOpen className="h-2.5 w-2.5 shrink-0" />
              {offer.folders.map((f) => f.name).join(", ")}
            </p>
          )}
          {offer.targeting_template_name && (
            <p className="text-[10px] text-muted-foreground flex items-center gap-1 truncate">
              <Crosshair className="h-2.5 w-2.5 shrink-0" />
              {offer.targeting_template_name}
            </p>
          )}
        </div>
      ) : (
        <p className="text-[10px] text-muted-foreground pl-1">No offer assigned</p>
      )}
    </div>
  );
}

export function RRMAccountCard({
  account,
  snapshot,
  config,
  onRunDilution,
  onConfigure,
  dilutionLoading,
  accountSetting,
  offers,
  trendData,
}: Props) {
  const badge = getHealthBadge(snapshot);
  const hasData = snapshot && snapshot.rejection_ratio !== null;
  const ratio = snapshot?.rejection_ratio ?? 0;
  const threshold = config?.rejection_threshold ?? 1.0;
  const warningThreshold = config?.warning_threshold ?? 0.8;
  const mode = config?.guardrail_mode || "off";

  const progressValue = threshold > 0 ? Math.min((ratio / threshold) * 100, 100) : 0;

  const offerList = offers ?? [];
  const hasSetting = !!accountSetting;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-semibold text-foreground">{account.name}</p>
            <p className="text-xs text-muted-foreground">{account.fb_account_id}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {modeLabels[mode]}
            </Badge>
            <Badge variant={badge.variant}>{badge.label}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasData ? (
          <>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Rejection Ratio</span>
                <span className="font-medium">{ratio}%</span>
              </div>
              <Progress value={progressValue} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Warning: {warningThreshold}%</span>
                <span>Threshold: {threshold}%</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xs text-muted-foreground">Approved</p>
                <p className="text-sm font-semibold">{snapshot!.approved_ads ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Rejected</p>
                <p className="text-sm font-semibold">{snapshot!.rejected_ads ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-sm font-semibold">{snapshot!.total_ads ?? "—"}</p>
              </div>
            </div>

            {threshold > 0 && (
              <p className="text-xs text-muted-foreground">
                {Math.max(0, threshold - ratio).toFixed(2)}% capacity remaining before threshold
              </p>
            )}

            {/* Mini Sparkline */}
            {trendData && trendData.length > 1 && (
              <div className="pt-1">
                <p className="text-[10px] text-muted-foreground mb-1">7-Day Trend</p>
                <ResponsiveContainer width="100%" height={40}>
                  <LineChart data={trendData}>
                    <Line
                      type="monotone"
                      dataKey="ratio"
                      stroke={ratio >= threshold ? "hsl(var(--destructive))" : "hsl(var(--primary))"}
                      strokeWidth={1.5}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            No health data available. Sync to create initial snapshots.
          </p>
        )}

        {/* Dilution & Replacement Status */}
        {offerList.length > 0 && (
          <>
            <Separator />
            <div className="grid grid-cols-2 gap-3">
              <OfferInfo
                label="Dilution"
                enabled={accountSetting?.dilution_enabled ?? false}
                offerId={accountSetting?.dilution_campaign_url_id ?? null}
                offers={offerList}
              />
              <OfferInfo
                label="Replacement"
                enabled={accountSetting?.replacement_enabled ?? false}
                offerId={accountSetting?.replacement_campaign_url_id ?? null}
                offers={offerList}
              />
            </div>
          </>
        )}

        <div className="flex items-center gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={() => onConfigure(account.id)}>
            <Settings className="h-3 w-3" />
            Configure
          </Button>
          {mode === "auto_maintain" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onRunDilution(account.id)}
              disabled={dilutionLoading}
            >
              {dilutionLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Zap className="h-3 w-3" />
              )}
              Run Dilution
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
