import { useState, useMemo } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Settings2, Loader2, ChevronLeft, ChevronRight, Zap, Info, X } from "lucide-react";
import { getHealthBadge, type HealthConfig, type HealthSnapshot } from "@/hooks/use-account-health";
import type { FbAdAccount } from "@/hooks/use-fb-connection";
import type { RRMAccountSetting, RRMCampaignUrl, RRMGlobalSettings } from "@/hooks/use-rrm-settings";

const modeLabels: Record<string, string> = {
  off: "OFF",
  monitor: "Monitor",
  auto_maintain: "Auto",
};

const modeBadgeVariant: Record<string, "default" | "destructive" | "secondary" | "outline"> = {
  off: "secondary",
  monitor: "outline",
  auto_maintain: "default",
};

const sourceLabels: Record<string, string> = {
  global: "Global",
  offer: "Offer",
  account: "Account",
};

interface Props {
  accounts: FbAdAccount[];
  snapshotMap: Record<string, HealthSnapshot>;
  configMap: Record<string, HealthConfig>;
  rrmSettingsMap: Record<string, RRMAccountSetting>;
  globalSettings: RRMGlobalSettings | null;
  offers: RRMCampaignUrl[];
  loading: boolean;
  onToggle: (accountId: string, field: "dilution_enabled" | "replacement_enabled", enabled: boolean) => void;
  onRunDilution: (accountId: string) => void;
  onConfigure: (accountId: string) => void;
  dilutionLoadingId: string | null;
}

const PAGE_SIZE = 20;

export function RRMAccountsTable({
  accounts,
  snapshotMap,
  configMap,
  rrmSettingsMap,
  globalSettings,
  offers,
  loading,
  onToggle,
  onRunDilution,
  onConfigure,
  dilutionLoadingId,
}: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    if (!search.trim()) return accounts;
    const q = search.toLowerCase();
    return accounts.filter(
      (a) => a.name.toLowerCase().includes(q) || a.fb_account_id.toLowerCase().includes(q)
    );
  }, [accounts, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const toggleAll = (checked: boolean) => {
    if (checked) setSelected(new Set(paged.map((a) => a.id)));
    else setSelected(new Set());
  };

  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const handleBulkToggle = (field: "dilution_enabled" | "replacement_enabled", enabled: boolean) => {
    [...selected].forEach((id) => onToggle(id, field, enabled));
    setSelected(new Set());
  };

  const getEffectiveThreshold = (accountId: string, field: "warning" | "rejection") => {
    const setting = rrmSettingsMap[accountId];
    const overrideField = field === "warning" ? "warning_threshold_override" : "rejection_threshold_override";
    const override = setting?.[overrideField];
    if (override !== null && override !== undefined) {
      return { value: override, inherited: false };
    }
    // Check config
    const config = configMap[accountId];
    if (config) {
      const cfgField = field === "warning" ? "warning_threshold" : "rejection_threshold";
      return { value: config[cfgField], inherited: false };
    }
    // Fall back to global
    const globalField = field === "warning" ? "warning_threshold" : "rejection_threshold";
    const globalVal = globalSettings?.[globalField] ?? (field === "warning" ? 0.8 : 1.0);
    return { value: globalVal, inherited: true };
  };

  const getEffectiveSource = (accountId: string) => {
    const setting = rrmSettingsMap[accountId];
    if (setting?.dilution_links_source) return { value: setting.dilution_links_source, inherited: false };
    return { value: globalSettings?.dilution_links_source ?? "global", inherited: true };
  };

  return (
    <Card>
      {/* ─── Adaptive Toolbar ─── */}
      <CardHeader className="relative h-[68px] p-0 overflow-hidden">
        {/* Default state: title + search — slides left on selection */}
        <div className={`absolute inset-0 flex items-center justify-between px-6 transition-all duration-200 ease-out${selected.size > 0 ? " opacity-0 -translate-x-4 pointer-events-none" : ""}`}>
          <CardTitle className="text-base">Ad Accounts</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search accounts..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="pl-9"
            />
          </div>
        </div>
        {/* Selection state: bulk actions — slides in from right */}
        <div className={`absolute inset-0 flex items-center gap-2 px-6 transition-all duration-200 ease-out${selected.size === 0 ? " opacity-0 translate-x-4 pointer-events-none" : ""}`}>
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => setSelected(new Set())}>
            <X className="h-3.5 w-3.5" />
          </Button>
          <span className="text-xs font-medium text-foreground shrink-0">{selected.size} selected</span>
          <div className="flex-1" />
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleBulkToggle("dilution_enabled", true)}>
            <Zap className="h-3 w-3 mr-1" /> Enable Dilution
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleBulkToggle("dilution_enabled", false)}>
            Disable Dilution
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleBulkToggle("replacement_enabled", true)}>
            Enable Replace
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleBulkToggle("replacement_enabled", false)}>
            Disable Replace
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading...
          </div>
        ) : accounts.length === 0 ? (
          <p className="text-sm text-muted-foreground">No ad accounts found.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={selected.size === paged.length && paged.length > 0}
                        onCheckedChange={(c) => toggleAll(!!c)}
                      />
                    </TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead className="w-20">Health</TableHead>
                    <TableHead className="w-20">Ratio</TableHead>
                    <TableHead className="w-28">Thresholds</TableHead>
                    <TableHead className="w-20">Dilution</TableHead>
                    <TableHead className="w-20">Replace</TableHead>
                    <TableHead className="w-20">Mode</TableHead>
                    <TableHead className="w-20">Source</TableHead>
                    <TableHead className="w-20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map((acc) => {
                    const snapshot = snapshotMap[acc.id];
                    const config = configMap[acc.id];
                    const setting = rrmSettingsMap[acc.id];
                    const badge = getHealthBadge(snapshot);
                    const ratio = snapshot?.rejection_ratio ?? null;
                    const mode = config?.guardrail_mode || "off";
                    const warnT = getEffectiveThreshold(acc.id, "warning");
                    const rejT = getEffectiveThreshold(acc.id, "rejection");
                    const source = getEffectiveSource(acc.id);

                    return (
                      <TableRow key={acc.id}>
                        <TableCell>
                          <Checkbox
                            checked={selected.has(acc.id)}
                            onCheckedChange={() => toggleOne(acc.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{acc.name}</p>
                            <p className="text-xs text-muted-foreground">{acc.fb_account_id}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={badge.variant} className="text-xs">{badge.label}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className={`text-sm font-medium ${ratio !== null && rejT.value > 0 && ratio >= rejT.value ? "text-destructive" : ""}`}>
                            {ratio !== null ? `${ratio}%` : "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <TooltipProvider>
                            <div className="text-xs space-y-0.5">
                              <div className="flex items-center gap-1">
                                <span className="text-muted-foreground">W:</span>
                                <span>{warnT.value}%</span>
                                {warnT.inherited && (
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Info className="h-3 w-3 text-muted-foreground" />
                                    </TooltipTrigger>
                                    <TooltipContent>Inherited from global</TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-muted-foreground">R:</span>
                                <span>{rejT.value}%</span>
                                {rejT.inherited && (
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Info className="h-3 w-3 text-muted-foreground" />
                                    </TooltipTrigger>
                                    <TooltipContent>Inherited from global</TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                            </div>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={setting?.dilution_enabled ?? false}
                            onCheckedChange={(c) => onToggle(acc.id, "dilution_enabled", c)}
                          />
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={setting?.replacement_enabled ?? false}
                            onCheckedChange={(c) => onToggle(acc.id, "replacement_enabled", c)}
                          />
                        </TableCell>
                        <TableCell>
                          <Badge variant={modeBadgeVariant[mode] ?? "secondary"} className="text-xs">
                            {modeLabels[mode] ?? mode}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span className="text-xs">{sourceLabels[source.value] ?? source.value}</span>
                            {source.inherited && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Info className="h-3 w-3 text-muted-foreground" />
                                  </TooltipTrigger>
                                  <TooltipContent>Inherited from global</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => onConfigure(acc.id)}
                              title="Configure"
                            >
                              <Settings2 className="h-4 w-4" />
                            </Button>
                            {mode === "auto_maintain" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => onRunDilution(acc.id)}
                                disabled={dilutionLoadingId === acc.id}
                                title="Run Dilution"
                              >
                                {dilutionLoadingId === acc.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Zap className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-muted-foreground">
                  {filtered.length} accounts · Page {page + 1} of {totalPages}
                </p>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" disabled={page === 0} onClick={() => setPage(page - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
