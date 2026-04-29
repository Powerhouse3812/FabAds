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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Settings2, Loader2, ChevronLeft, ChevronRight, FolderOpen, Target } from "lucide-react";
import type { FbAdAccount } from "@/hooks/use-fb-connection";
import type { RRMAccountSetting, RRMCampaignUrl } from "@/hooks/use-rrm-settings";

interface Props {
  accounts: FbAdAccount[];
  settings: RRMAccountSetting[];
  offers: RRMCampaignUrl[];
  loading: boolean;
  onToggle: (accountId: string, field: "dilution_enabled" | "replacement_enabled", enabled: boolean) => void;
  onAssignOffer: (accountId: string, field: "dilution_campaign_url_id" | "replacement_campaign_url_id", cuId: string | null) => void;
  onBulkAssign: (accountIds: string[], offerId: string, fields: { dilution: boolean; replacement: boolean }) => void;
  onConfigureAccount: (accountId: string) => void;
}

const PAGE_SIZE = 20;

function OfferDetail({ offerId, offers }: { offerId: string | null | undefined; offers: RRMCampaignUrl[] }) {
  if (!offerId) return null;
  const offer = offers.find((o) => o.id === offerId);
  if (!offer) return null;

  const folderNames = offer.folders.map((f) => f.name).join(", ");
  const targeting = offer.targeting_template_name;

  if (!folderNames && !targeting) return null;

  return (
    <div className="mt-1 space-y-0.5">
      {folderNames && (
        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
          <FolderOpen className="h-3 w-3 shrink-0" />
          <span className="truncate max-w-[140px]">{folderNames}</span>
        </p>
      )}
      {targeting && (
        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
          <Target className="h-3 w-3 shrink-0" />
          <span className="truncate max-w-[140px]">{targeting}</span>
        </p>
      )}
    </div>
  );
}

export function RRMBulkTable({
  accounts,
  settings,
  offers,
  loading,
  onToggle,
  onAssignOffer,
  onBulkAssign,
  onConfigureAccount,
}: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkOfferId, setBulkOfferId] = useState("");
  const [bulkTarget, setBulkTarget] = useState<"both" | "dilution" | "replacement">("both");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const settingsMap = useMemo(
    () => Object.fromEntries(settings.map((s) => [s.fb_ad_account_id, s])),
    [settings]
  );

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
    if (checked) {
      setSelected(new Set(paged.map((a) => a.id)));
    } else {
      setSelected(new Set());
    }
  };

  const toggleOne = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const handleBulkApply = () => {
    if (selected.size === 0 || !bulkOfferId) return;
    onBulkAssign(Array.from(selected), bulkOfferId, {
      dilution: bulkTarget === "both" || bulkTarget === "dilution",
      replacement: bulkTarget === "both" || bulkTarget === "replacement",
    });
    setSelected(new Set());
    setBulkOfferId("");
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
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
      </CardHeader>
      <CardContent className="space-y-4">
        {selected.size > 0 && (
          <div className="flex items-center gap-3 p-3 rounded-md bg-muted flex-wrap">
            <Badge variant="secondary">{selected.size} selected</Badge>
            <Select value={bulkOfferId} onValueChange={setBulkOfferId}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Assign offer..." />
              </SelectTrigger>
              <SelectContent>
                {offers.map((o) => (
                  <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={bulkTarget} onValueChange={(v) => setBulkTarget(v as any)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="both">Both</SelectItem>
                <SelectItem value="dilution">Dilution only</SelectItem>
                <SelectItem value="replacement">Replacement only</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" onClick={handleBulkApply} disabled={!bulkOfferId}>
              Apply & Enable
            </Button>
          </div>
        )}

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
                    <TableHead>Dilution Offer</TableHead>
                    <TableHead className="w-20">Dilution</TableHead>
                    <TableHead>Replacement Offer</TableHead>
                    <TableHead className="w-20">Replace</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paged.map((acc) => {
                    const s = settingsMap[acc.id];
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
                          <Select
                            value={s?.dilution_campaign_url_id ?? ""}
                            onValueChange={(v) => onAssignOffer(acc.id, "dilution_campaign_url_id", v || null)}
                          >
                            <SelectTrigger className="w-[160px]">
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              {offers.map((o) => (
                                <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <OfferDetail offerId={s?.dilution_campaign_url_id} offers={offers} />
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={s?.dilution_enabled ?? false}
                            onCheckedChange={(c) => onToggle(acc.id, "dilution_enabled", c)}
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={s?.replacement_campaign_url_id ?? ""}
                            onValueChange={(v) => onAssignOffer(acc.id, "replacement_campaign_url_id", v || null)}
                          >
                            <SelectTrigger className="w-[160px]">
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              {offers.map((o) => (
                                <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <OfferDetail offerId={s?.replacement_campaign_url_id} offers={offers} />
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={s?.replacement_enabled ?? false}
                            onCheckedChange={(c) => onToggle(acc.id, "replacement_enabled", c)}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onConfigureAccount(acc.id)}
                            title="Per-account settings"
                          >
                            <Settings2 className="h-4 w-4" />
                          </Button>
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
