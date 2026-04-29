import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DUMMY_CATALOGUES, DUMMY_PRODUCT_SETS } from "@/lib/catalogue-dummy-data";
import { DUMMY_ACCOUNT_CATALOGUES, CATALOGUE_DYNAMIC_TAGS, CATALOGUE_CTA_OPTIONS } from "./autopilot-dummy-data";
import type { AccountState, AccountCatalogueConfig } from "./AutoPilotAccountsTab";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  /** Pre-selected accounts from the table checkboxes */
  accounts: AccountState[];
  onApply: (accountIds: string[], config: AccountCatalogueConfig) => void;
}

export function BulkCatalogueAssignModal({ open, onOpenChange, accounts, onApply }: Props) {
  const [catalogueId, setCatalogueId] = useState("");
  const [productSetId, setProductSetId] = useState("");
  const [primaryText, setPrimaryText] = useState("");
  const [headline, setHeadline] = useState("");
  const [cta, setCta] = useState("Shop now");
  const [focusedField, setFocusedField] = useState<"primaryText" | "headline" | null>(null);

  // Filter to only catalogues accessible by ALL selected accounts
  const sharedCatalogueIds = accounts.length > 0
    ? DUMMY_CATALOGUES.filter((c) =>
        accounts.every((a) => (DUMMY_ACCOUNT_CATALOGUES[a.id] || []).includes(c.id))
      ).map((c) => c.id)
    : [];

  const availableCatalogues = DUMMY_CATALOGUES.filter((c) => sharedCatalogueIds.includes(c.id));
  const productSets = catalogueId ? (DUMMY_PRODUCT_SETS[catalogueId] || []) : [];

  // Accounts that don't have access to the selected catalogue
  const ineligibleAccounts = catalogueId
    ? accounts.filter((a) => !(DUMMY_ACCOUNT_CATALOGUES[a.id] || []).includes(catalogueId))
    : [];
  const eligibleAccounts = catalogueId
    ? accounts.filter((a) => (DUMMY_ACCOUNT_CATALOGUES[a.id] || []).includes(catalogueId))
    : accounts;

  const insertTag = (tag: string) => {
    if (focusedField === "primaryText") setPrimaryText((prev) => prev + tag);
    else if (focusedField === "headline") setHeadline((prev) => prev + tag);
  };

  const handleApply = () => {
    if (eligibleAccounts.length === 0 || !catalogueId) return;
    onApply(eligibleAccounts.map((a) => a.id), { catalogueId, productSetId, primaryText, headline, cta });
    onOpenChange(false);
    setCatalogueId("");
    setProductSetId("");
    setPrimaryText("");
    setHeadline("");
    setCta("Shop now");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Assign Catalogue</DialogTitle>
          <DialogDescription>
            Assign catalogue settings to {accounts.length} selected account{accounts.length !== 1 ? "s" : ""}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Selected accounts summary */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Selected Accounts</Label>
            <div className="flex flex-wrap gap-1">
              {accounts.map((a) => (
                <Badge key={a.id} variant="secondary" className="text-xs">
                  {a.name}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Catalogue Selection */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium">Catalogue</Label>
            {availableCatalogues.length === 0 && accounts.length > 0 ? (
              <p className="text-xs text-muted-foreground">No catalogue is shared across all selected accounts. Try selecting fewer accounts.</p>
            ) : (
              <Select value={catalogueId || "__none__"} onValueChange={(v) => { setCatalogueId(v === "__none__" ? "" : v); setProductSetId(""); }}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select catalogue" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Select catalogue…</SelectItem>
                  {availableCatalogues.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {ineligibleAccounts.length > 0 && catalogueId && (
              <p className="text-xs text-destructive">
                {ineligibleAccounts.map((a) => a.name).join(", ")} {ineligibleAccounts.length === 1 ? "doesn't" : "don't"} have access and will be skipped.
              </p>
            )}
          </div>

          {/* Product Set */}
          {catalogueId && (
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Product Set</Label>
              <Select value={productSetId || "__all__"} onValueChange={(v) => setProductSetId(v === "__all__" ? "" : v)}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All products" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All products</SelectItem>
                  {productSets.filter((ps) => ps.name !== "All products").map((ps) => (
                    <SelectItem key={ps.id} value={ps.id}>{ps.name} ({ps.items} items)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Separator />

          {/* Ad Copy */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Ad Copy Defaults</Label>

            <div className="space-y-1.5">
              <Label className="text-xs">Primary Text</Label>
              <Input
                className="h-8 text-xs"
                placeholder="e.g. Shop {{product.name}} at {{product.price}}"
                value={primaryText}
                onChange={(e) => setPrimaryText(e.target.value)}
                onFocus={() => setFocusedField("primaryText")}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Headline</Label>
              <Input
                className="h-8 text-xs"
                placeholder="e.g. {{product.name}} — Limited Offer"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                onFocus={() => setFocusedField("headline")}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">CTA</Label>
              <Select value={cta} onValueChange={setCta}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATALOGUE_CTA_OPTIONS.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dynamic Tags */}
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">Insert dynamic tag into focused field:</Label>
              <div className="flex gap-1 flex-wrap">
                {CATALOGUE_DYNAMIC_TAGS.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="text-[10px] cursor-pointer hover:bg-muted"
                    onClick={() => insertTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={handleApply} disabled={eligibleAccounts.length === 0 || !catalogueId}>
            Apply to {eligibleAccounts.length} account{eligibleAccounts.length !== 1 ? "s" : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
