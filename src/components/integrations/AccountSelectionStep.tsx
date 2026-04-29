import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { fbAccountStatusMap } from "@/lib/fb-status-map";

export interface SimulatedBM {
  fb_business_id: string;
  name: string;
  adAccounts: SimulatedAdAccount[];
}

export interface SimulatedAdAccount {
  fb_account_id: string;
  name: string;
  currency: string;
  account_status: number;
}

interface AccountSelectionStepProps {
  businessManagers: SimulatedBM[];
  onImport: (selectedIds: string[]) => void;
  onCancel: () => void;
  importing: boolean;
}

export default function AccountSelectionStep({
  businessManagers,
  onImport,
  onCancel,
  importing,
}: AccountSelectionStepProps) {
  const allAccounts = businessManagers.flatMap((bm) =>
    bm.adAccounts.map((acc) => ({ ...acc, bmName: bm.name }))
  );
  const allIds = allAccounts.map((a) => a.fb_account_id);
  const totalCount = allIds.length;

  const [selected, setSelected] = useState<Set<string>>(() => new Set(allIds));

  const allSelected = selected.size === totalCount && totalCount > 0;
  const someSelected = selected.size > 0 && !allSelected;

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(allIds));
  };

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedCount = selected.size;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 pb-3">
        <h3 className="text-base font-semibold text-foreground">Select Ad Accounts to Import</h3>
        <p className="text-sm text-muted-foreground">
          Selected {selectedCount} of {totalCount} account{totalCount !== 1 ? "s" : ""}. You can change this later.
        </p>
      </div>

      {/* Scrollable table */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto border rounded-md">
        <Table className="min-w-[540px]">
          <TableHeader className="sticky top-0 z-10 bg-background">
            <TableRow>
              <TableHead className="w-10">
                <Checkbox
                  checked={allSelected ? true : someSelected ? "indeterminate" : false}
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              <TableHead className="min-w-[140px]">Account Name</TableHead>
              <TableHead className="min-w-[120px]">Account ID</TableHead>
              <TableHead className="w-20">Currency</TableHead>
              <TableHead className="w-24">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {businessManagers.map((bm) => (
              <React.Fragment key={`bm-${bm.fb_business_id}`}>
                <TableRow className="bg-muted/30">
                  <TableCell colSpan={5} className="py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {bm.name}
                  </TableCell>
                </TableRow>
                {bm.adAccounts.map((acc) => (
                  <TableRow key={acc.fb_account_id}>
                    <TableCell>
                      <Checkbox
                        checked={selected.has(acc.fb_account_id)}
                        onCheckedChange={() => toggle(acc.fb_account_id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium break-words">{acc.name}</TableCell>
                    <TableCell className="text-muted-foreground text-xs font-mono">{acc.fb_account_id}</TableCell>
                    <TableCell>{acc.currency}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="whitespace-nowrap">
                        {fbAccountStatusMap[acc.account_status] || `Status ${acc.account_status}`}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Footer */}
      <div className="shrink-0 flex justify-end gap-2 pt-4 border-t mt-4">
        <Button variant="outline" onClick={onCancel} disabled={importing}>
          Cancel
        </Button>
        <Button
          onClick={() => onImport(Array.from(selected))}
          disabled={selectedCount === 0 || importing}
        >
          {importing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Importing {selectedCount} account{selectedCount !== 1 ? "s" : ""}…
            </>
          ) : (
            `Import ${selectedCount} Selected`
          )}
        </Button>
      </div>
    </div>
  );
}
