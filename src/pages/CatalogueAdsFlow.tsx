import { useState, useCallback, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { CatalogueHierarchyPanel, type SelectedEntity, type EntityType } from "@/components/launch/catalogue/CatalogueHierarchyPanel";
import { CatalogueConfigPanel } from "@/components/launch/catalogue/CatalogueConfigPanel";
import { CataloguePreviewPanel, type CataloguePreviewData } from "@/components/launch/catalogue/CataloguePreviewPanel";
import { DUMMY_ACCOUNT_DEFAULTS } from "@/lib/catalogue-dummy-data";
import { useCatalogueAutosave } from "@/hooks/use-catalogue-autosave";
import { useCreateCatalogueLaunch } from "@/hooks/use-catalogue-launch";
import { useFbConnection } from "@/hooks/use-fb-connection";
import { validateCatalogueLaunch } from "@/lib/catalogue-validation";
import { toast } from "@/hooks/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import type { LaunchFull } from "@/hooks/use-launch-data";

interface Props {
  launchData: LaunchFull | null;
}

/* ─── Facebook icon badge ─── */
function FacebookBadge() {
  return (
    <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-[#1877F2] text-background text-[10px] font-bold leading-none shrink-0">
      f
    </span>
  );
}

/* ─── Setup Dialog (shown when launchData is null = new catalogue launch) ─── */
function CatalogueSetupDialog({ onCreated }: { onCreated: (id: string) => void }) {
  const [name, setName] = useState("Catalogue Launch");
  const { adAccounts, businessManagers } = useFbConnection();
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set());
  const createMutation = useCreateCatalogueLaunch();

  const toggleAccount = (id: string) => {
    setSelectedAccounts((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      toast({ title: "Please enter a launch name", variant: "destructive" });
      return;
    }
    if (selectedAccounts.size === 0) {
      toast({ title: "Select at least one ad account", variant: "destructive" });
      return;
    }
    try {
      const result = await createMutation.mutateAsync({
        name: name.trim(),
        adAccountIds: Array.from(selectedAccounts),
        setupConfigs: {},
        strategy: { campaigns: 1, adsets: 1, ads: 1 },
      });
      onCreated(result.id);
    } catch {
      toast({ title: "Failed to create catalogue launch", variant: "destructive" });
    }
  };

  const getBmName = (bmId: string | null) => {
    if (!bmId) return "";
    return businessManagers.find((bm) => bm.id === bmId)?.name || "";
  };

  return (
    <Dialog open>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New Catalogue Ads Launch</DialogTitle>
          <DialogDescription>Enter a name and select the ad accounts to use.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-sm">Launch Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="My Catalogue Launch" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Ad Accounts</Label>
            {adAccounts.length === 0 ? (
              <p className="text-xs text-muted-foreground">No ad accounts found. Connect Facebook first.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {adAccounts.map((acc) => (
                  <div
                    key={acc.id}
                    className="flex items-center gap-2 p-2 rounded-md border border-border hover:bg-muted/50 cursor-pointer"
                    onClick={() => toggleAccount(acc.id)}
                  >
                    <Checkbox checked={selectedAccounts.has(acc.id)} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{acc.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {getBmName(acc.fb_business_manager_id) || acc.fb_account_id}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Link to="/launch">
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button onClick={handleCreate} disabled={createMutation.isPending}>
            {createMutation.isPending ? "Creating..." : "Create Launch"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Main 3-Column Layout ─── */
export default function CatalogueAdsFlow({ launchData }: Props) {
  const navigate = useNavigate();

  // If no launchData, show setup dialog
  if (!launchData) {
    return (
      <CatalogueSetupDialog
        onCreated={(id) => navigate(`/launch/${id}`, { replace: true })}
      />
    );
  }

  return <CatalogueAdsMain launchData={launchData} />;
}

function CatalogueAdsMain({ launchData }: { launchData: LaunchFull }) {
  const { debouncedSave, saveUiState, flushAll } = useCatalogueAutosave(launchData.id);

  // UI state from DB or defaults
  const savedUi = (launchData.launch_config as any)?.ui_state?.catalogue_ads || {};

  const [selectedEntity, setSelectedEntity] = useState<SelectedEntity | null>(
    savedUi.selected_entity || null
  );
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    new Set(Object.keys(savedUi.expanded || {}).filter((k) => savedUi.expanded[k]))
  );
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [checkedType, setCheckedType] = useState<EntityType | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Auto-select first account if nothing selected
  useEffect(() => {
    if (!selectedEntity && launchData.ad_accounts.length > 0) {
      const first = launchData.ad_accounts[0];
      setSelectedEntity({ type: "account", id: first.id });
      setExpandedIds((prev) => new Set([...prev, first.id]));
    }
  }, [launchData.ad_accounts, selectedEntity]);

  const handleSelect = useCallback((entity: SelectedEntity) => {
    setSelectedEntity(entity);
    saveUiState({
      selected_entity: entity,
      expanded: Object.fromEntries(Array.from(expandedIds).map((id) => [id, true])),
    });
  }, [expandedIds, saveUiState]);

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      saveUiState({
        selected_entity: selectedEntity,
        expanded: Object.fromEntries(Array.from(next).map((i) => [i, true])),
      });
      return next;
    });
  }, [selectedEntity, saveUiState]);

  const handleCheckToggle = useCallback((type: EntityType, id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        if (next.size === 0) setCheckedType(null);
      } else {
        next.add(id);
        setCheckedType(type);
      }
      return next;
    });
  }, []);

  const handleClearSelection = useCallback(() => {
    setCheckedIds(new Set());
    setCheckedType(null);
  }, []);

  const handleFieldChange = useCallback((entityType: string, entityId: string, field: string, value: any) => {
    debouncedSave(entityType as any, entityId, { [field]: value });
  }, [debouncedSave]);

  const handleBulkAction = useCallback((action: string) => {
    toast({ title: `Bulk ${action} — coming soon`, description: `${checkedIds.size} items selected` });
  }, [checkedIds]);

  // Build preview data from selected account's config
  const previewData = useMemo((): CataloguePreviewData | null => {
    // Find the relevant account based on selection
    let account = launchData.ad_accounts[0]; // default to first
    if (selectedEntity) {
      if (selectedEntity.type === "account") {
        account = launchData.ad_accounts.find((a) => a.id === selectedEntity.id) || account;
      }
    }
    if (!account) return null;

    const cfg = (account.setup_config || DUMMY_ACCOUNT_DEFAULTS) as Record<string, any>;
    const catDefaults = cfg.catalogue_ads_defaults || DUMMY_ACCOUNT_DEFAULTS.catalogue_ads_defaults;
    const pageName = cfg.page === "page-1" ? "My Business Page" : cfg.page === "page-2" ? "Brand Page" : "Your Page";

    return {
      primary_text: catDefaults.primary_text,
      headline: catDefaults.headline,
      description: catDefaults.description,
      cta: catDefaults.cta,
      destination_url: cfg.display_link || cfg.website_url,
      catalogue_id: catDefaults.catalogue_id,
      product_set_id: catDefaults.product_set_id,
      page_name: pageName,
    };
  }, [selectedEntity, launchData.ad_accounts]);

  const handleLaunch = useCallback(() => {
    flushAll();
    const result = validateCatalogueLaunch(
      launchData.ad_accounts,
      launchData.campaigns,
      launchData.adsets,
      launchData.ads,
    );
    if (!result.valid) {
      const errMap: Record<string, string> = {};
      result.errors.forEach((e) => { errMap[e.field] = e.message; });
      setFieldErrors(errMap);
      const first = result.errors[0];
      if (first) {
        setSelectedEntity({ type: first.entityType as EntityType, id: first.entityId });
      }
      toast({ title: "Please fix validation errors before launching", variant: "destructive" });
      return;
    }
    setFieldErrors({});
    toast({ title: `Launching ${launchData.ads.length} Catalogue Ads...` });
  }, [flushAll, launchData]);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Breadcrumb Header */}
      <div className="flex items-center gap-2 pb-3">
        <Link to="/launch" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          Launch
        </Link>
        <span className="text-sm text-muted-foreground">/</span>
        <span className="text-sm font-semibold text-foreground">Launch Catalogue Ads</span>
        <FacebookBadge />
      </div>

      {/* 3-Column Layout */}
      <ResizablePanelGroup direction="horizontal" className="flex-1 rounded-lg border border-border min-h-0">
        {/* Left: Hierarchy */}
        <ResizablePanel defaultSize={22} minSize={18} maxSize={30}>
          <CatalogueHierarchyPanel
            launchData={launchData}
            selectedEntity={selectedEntity}
            onSelect={handleSelect}
            checkedIds={checkedIds}
            checkedType={checkedType}
            onCheckToggle={handleCheckToggle}
            expandedIds={expandedIds}
            onToggleExpand={handleToggleExpand}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Center: Config Form */}
        <ResizablePanel defaultSize={50} minSize={35}>
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-hidden">
              <CatalogueConfigPanel
                launchData={launchData}
                selectedEntity={selectedEntity}
                checkedType={checkedType}
                checkedCount={checkedIds.size}
                onFieldChange={handleFieldChange}
                onBulkAction={handleBulkAction}
                onClearSelection={handleClearSelection}
                fieldErrors={fieldErrors}
              />
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Right: Preview */}
        <ResizablePanel defaultSize={28} minSize={20} maxSize={35}>
          <CataloguePreviewPanel previewData={previewData} />
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Sticky Footer */}
      <div className="flex items-center justify-center gap-3 py-3">
        <Link to="/launch">
          <Button variant="outline" size="sm">Cancel</Button>
        </Link>
        <Button size="sm" className="bg-primary text-primary-foreground" onClick={handleLaunch}>
          <Rocket className="h-4 w-4 mr-1.5" />
          Launch {launchData.ads.length} Catalogue Ads
        </Button>
      </div>
    </div>
  );
}
