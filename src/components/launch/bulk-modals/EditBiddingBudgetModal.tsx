import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  totalCount: number;
  onSave: (data: any, applyToAll: boolean) => void;
}

export function EditBiddingBudgetModal({ open, onOpenChange, selectedCount, totalCount, onSave }: Props) {
  const [budgetPeriod, setBudgetPeriod] = useState("daily");
  const [budgetValue, setBudgetValue] = useState("");
  const [bidStrategy, setBidStrategy] = useState("lowest_cost");
  const [bidAmount, setBidAmount] = useState("");

  const handleSave = (applyToAll: boolean) => {
    const data: Record<string, any> = {};
    if (budgetPeriod) data.budget_period = budgetPeriod;
    if (budgetValue) data.budget_value = Number(budgetValue);
    if (bidStrategy) data.bid_strategy = bidStrategy;
    if (bidAmount) data.bid_amount = Number(bidAmount);
    onSave(data, applyToAll);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Bidding & Budget</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm">Budget Type</Label>
              <Select value={budgetPeriod} onValueChange={setBudgetPeriod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="lifetime">Total / Lifetime</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Budget Amount</Label>
              <Input
                type="number" value={budgetValue}
                onChange={(e) => setBudgetValue(e.target.value)}
                placeholder="0.00"
                autoComplete="off" data-1p-ignore data-lpignore="true"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-sm">Bid Strategy</Label>
              <Select value={bidStrategy} onValueChange={setBidStrategy}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="lowest_cost">Lowest Cost</SelectItem>
                  <SelectItem value="cost_cap">Cost Cap</SelectItem>
                  <SelectItem value="bid_cap">Bid Cap</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Bid Amount</Label>
              <Input
                type="number" value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder="0.00"
                autoComplete="off" data-1p-ignore data-lpignore="true"
              />
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="outline" onClick={() => handleSave(false)}>Save to selected ({selectedCount})</Button>
          <Button onClick={() => handleSave(true)}>Save to all ({totalCount})</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
