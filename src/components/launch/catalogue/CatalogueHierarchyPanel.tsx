import { useMemo, useCallback, useState } from "react";
import { Trash2, Search, Plus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useFbConnection } from "@/hooks/use-fb-connection";
import { toast } from "@/hooks/use-toast";
import type { LaunchFull } from "@/hooks/use-launch-data";

export type EntityType = "account" | "campaign" | "adset" | "ad";
export interface SelectedEntity { type: EntityType; id: string }

interface Props {
  launchData: LaunchFull;
  selectedEntity: SelectedEntity | null;
  onSelect: (entity: SelectedEntity) => void;
  checkedIds: Set<string>;
  checkedType: EntityType | null;
  onCheckToggle: (type: EntityType, id: string) => void;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
}

const DUMMY_ACCOUNT_NAMES = [
  "Ad-account_name_example_0",
  "Ad-account_name_example_1",
  "Ad-account_name_example_2",
  "Ad-account_name_example_3",
  "Ad-account_name_example_4",
];

export function CatalogueHierarchyPanel({
  launchData,
  selectedEntity,
  onSelect,
  checkedIds,
  checkedType,
  onCheckToggle,
}: Props) {
  const { adAccounts: fbAccounts, businessManagers } = useFbConnection();
  const accounts = launchData.ad_accounts;
  const [search, setSearch] = useState("");
  const [emptySlots, setEmptySlots] = useState<{ slotId: string; selectedAccountId: string | null }[]>([]);

  const isCheckDisabled = useCallback((type: EntityType) => {
    return checkedType !== null && checkedType !== type;
  }, [checkedType]);

  const isActive = (type: EntityType, id: string) =>
    selectedEntity?.type === type && selectedEntity?.id === id;

  const getFbAccountInfo = (fbAdAccountId: string, index: number) => {
    const fbAcc = fbAccounts.find((a) => a.id === fbAdAccountId);
    if (!fbAcc) return { name: DUMMY_ACCOUNT_NAMES[index] || `Ad-account_name_example_${index}`, bmName: "BM_Name_example" };
    const bm = fbAcc.fb_business_manager_id
      ? businessManagers.find((b) => b.id === fbAcc.fb_business_manager_id)
      : null;
    return { name: fbAcc.name, bmName: bm?.name || "BM_Name_example" };
  };

  const filteredAccounts = useMemo(() => {
    if (!search.trim()) return accounts;
    const q = search.toLowerCase();
    return accounts.filter((acc, i) => {
      const info = getFbAccountInfo(acc.fb_ad_account_id, i);
      return info.name.toLowerCase().includes(q) || info.bmName.toLowerCase().includes(q);
    });
  }, [accounts, search, fbAccounts, businessManagers]);

  const handleAddSlot = () => {
    setEmptySlots((prev) => [...prev, { slotId: crypto.randomUUID(), selectedAccountId: null }]);
  };

  const handleRemoveSlot = (slotId: string) => {
    setEmptySlots((prev) => prev.filter((s) => s.slotId !== slotId));
  };

  const handleSlotSelect = (slotId: string, accountId: string) => {
    toast({ title: "Account added", description: "Ad account has been added." });
    setEmptySlots((prev) => prev.map((s) => s.slotId === slotId ? { ...s, selectedAccountId: accountId } : s));
  };

  return (
    <div className="flex flex-col h-full bg-muted/20">
      {/* Header — matching FolderListPanel */}
      <div className="px-3 pt-3 pb-2 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground">Ad Accounts</span>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search accounts…"
            className="pl-7 h-7 text-xs"
          />
        </div>
      </div>

      {/* Account list */}
      <ScrollArea className="flex-1">
        <div className="px-2 pb-2 space-y-0.5">
          {filteredAccounts.map((acc, index) => {
            const accActive = isActive("account", acc.id);
            const accChecked = checkedIds.has(acc.id);
            const accDisabled = isCheckDisabled("account");
            const info = getFbAccountInfo(acc.fb_ad_account_id, index);

            return (
              <div
                key={acc.id}
                className={cn(
                  "flex items-center gap-2 px-2 py-1.5 cursor-pointer rounded-md transition-colors",
                  accActive ? "bg-accent text-accent-foreground" : "hover:bg-muted hover:text-foreground",
                )}
                onClick={() => onSelect({ type: "account", id: acc.id })}
              >
                <Checkbox
                  checked={accActive || accChecked}
                  disabled={accDisabled}
                  onCheckedChange={() => onCheckToggle("account", acc.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="h-4 w-4 shrink-0"
                />

                <div className="flex-1 min-w-0">
                  <p className={cn("text-xs truncate", accActive && "font-medium")}>
                    {info.name}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">{info.bmName}</p>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={(e) => { e.stopPropagation(); }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            );
          })}

          {/* Empty / newly-added placeholder rows */}
          {emptySlots.map((slot) => {
            const selectedFb = slot.selectedAccountId
              ? fbAccounts.find((a) => a.id === slot.selectedAccountId)
              : null;
            const selectedBm = selectedFb?.fb_business_manager_id
              ? businessManagers.find((b) => b.id === selectedFb.fb_business_manager_id)
              : null;

            return (
              <div
                key={slot.slotId}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md"
              >
                <Checkbox checked={false} disabled className="h-4 w-4 shrink-0" />

                {slot.selectedAccountId && selectedFb ? (
                  <div className="flex-1 min-w-0">
                    <p className="text-xs truncate">{selectedFb.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {selectedBm?.name || "BM_Name_example"}
                    </p>
                  </div>
                ) : (
                  <div className="flex-1 min-w-0">
                    <Select onValueChange={(val) => handleSlotSelect(slot.slotId, val)}>
                      <SelectTrigger className="h-7 text-xs border-dashed">
                        <SelectValue placeholder="Select ad account" />
                      </SelectTrigger>
                      <SelectContent>
                        {fbAccounts.map((acc) => (
                          <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => handleRemoveSlot(slot.slotId)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            );
          })}

          {/* Add new ad account button */}
          <button
            type="button"
            onClick={handleAddSlot}
            className="flex items-center gap-2 px-2 py-1.5 w-full rounded-md text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add new ad account</span>
          </button>
        </div>
      </ScrollArea>
    </div>
  );
}
