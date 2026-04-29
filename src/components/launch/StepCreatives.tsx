import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LaunchPreviewModal } from "./LaunchPreviewModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Loader2 } from "lucide-react";
import { StepCreativesToolbar } from "./StepCreativesToolbar";
import { AdAccountsTab } from "./AdAccountsTab";
import { CampaignsTableTab } from "./CampaignsTableTab";
import { AdGroupsTableTab } from "./AdGroupsTableTab";
import { AdsTableTab } from "./AdsTableTab";
import { AdBulkEditToolbar } from "./AdBulkEditToolbar";
import { AdGroupBulkToolbar } from "./AdGroupBulkToolbar";
import { useWorkspaceTexts } from "@/hooks/use-workspace-texts";
import { useBulkUpdateAds, useUpdateLaunchStep, useBulkUpdateAdsets, useDuplicateAd, useDeleteAd, useAddAd } from "@/hooks/use-launch-mutations";
import { validateStep3, scrollToFirstError } from "@/lib/launch-validation";
import { toast } from "@/hooks/use-toast";
import type { LaunchFull } from "@/hooks/use-launch-data";

interface StepCreativesProps {
  launchData: LaunchFull;
  onBack: () => void;
}

export function StepCreatives({ launchData, onBack }: StepCreativesProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("ads");
  const [search, setSearch] = useState("");
  const [selectedAds, setSelectedAds] = useState<Set<string>>(new Set());
  const [selectedAdGroups, setSelectedAdGroups] = useState<Set<string>>(new Set());
  const [showLaunchPreview, setShowLaunchPreview] = useState(false);

  const { data: workspaceTexts } = useWorkspaceTexts();
  const bulkUpdate = useBulkUpdateAds();
  const bulkUpdateAdsets = useBulkUpdateAdsets();
  const dupAd = useDuplicateAd();
  const delAd = useDeleteAd();
  const addAd = useAddAd();
  const updateStep = useUpdateLaunchStep();

  const accountCount = launchData.ad_accounts.length;

  const handleBulkApply = (fields: Record<string, any>) => {
    bulkUpdate.mutate({ ids: Array.from(selectedAds), launchId: launchData.id, fields });
    setSelectedAds(new Set());
  };

  const handleProceed = async () => {
    const validation = validateStep3(launchData.ads);
    if (!validation.valid) {
      scrollToFirstError(validation.fieldErrors);
      toast({ title: "Please complete required ad fields", variant: "destructive" });
      return;
    }

    try {
      await updateStep.mutateAsync({ launchId: launchData.id, step: 3 });
      toast({ title: "Creatives validated" });
      setShowLaunchPreview(true);
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <StepCreativesToolbar launchData={launchData} search={search} onSearchChange={setSearch} />

      {/* Bulk toolbars */}
      {activeTab === "ads" && selectedAds.size > 0 && (
        <AdBulkEditToolbar
          selectedCount={selectedAds.size}
          ads={launchData.ads.filter(a => selectedAds.has(a.id))}
          onApply={handleBulkApply}
          onDuplicate={(adId) => dupAd.mutate({ adId, launchId: launchData.id })}
          onDelete={(adId) => delAd.mutate({ id: adId, launchId: launchData.id })}
          onClear={() => setSelectedAds(new Set())}
          applying={bulkUpdate.isPending}
        />
      )}
      {activeTab === "adgroups" && selectedAdGroups.size > 0 && (
        <AdGroupBulkToolbar
          selectedCount={selectedAdGroups.size}
          totalCount={launchData.adsets.length}
          onClear={() => setSelectedAdGroups(new Set())}
          onBulkUpdate={(data, applyToAll) => {
            const ids = applyToAll
              ? launchData.adsets.map(a => a.id)
              : Array.from(selectedAdGroups);
            bulkUpdateAdsets.mutate({ ids, launchId: launchData.id, fields: data });
          }}
        />
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start border-b border-border bg-transparent p-0 rounded-none h-auto">
          <TabsTrigger value="accounts" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 pb-2">
            Ad accounts <span className="ml-1 text-xs text-muted-foreground">({accountCount} selected)</span>
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 pb-2">
            Campaigns <span className="ml-1 text-xs text-muted-foreground">for {accountCount} ad accounts</span>
          </TabsTrigger>
          <TabsTrigger value="adgroups" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 pb-2">
            Ad groups <span className="ml-1 text-xs text-muted-foreground">for {accountCount} ad accounts</span>
          </TabsTrigger>
          <TabsTrigger value="ads" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 pb-2">
            Ads <span className="ml-1 text-xs text-muted-foreground">for {accountCount} ad accounts</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="mt-4">
          <AdAccountsTab launchData={launchData} />
        </TabsContent>

        <TabsContent value="campaigns" className="mt-4">
          <CampaignsTableTab launchData={launchData} />
        </TabsContent>

        <TabsContent value="adgroups" className="mt-4">
          <AdGroupsTableTab launchData={launchData} selectedAdGroups={selectedAdGroups} onSelectionChange={setSelectedAdGroups} />
        </TabsContent>

        <TabsContent value="ads" className="mt-4">
          <AdsTableTab
            launchData={launchData}
            search={search}
            selectedAds={selectedAds}
            onSelectionChange={setSelectedAds}
            workspaceTexts={workspaceTexts}
          />
        </TabsContent>
      </Tabs>

      {/* Navigation */}
      <div className="flex justify-between pt-4 border-t border-border">
        <Button variant="outline" onClick={() => navigate("/launch")}>
          Cancel
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />Previous
          </Button>
          <Button onClick={handleProceed} disabled={updateStep.isPending}>
            {updateStep.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {updateStep.isPending ? "Validating..." : "Proceed"}
          </Button>
        </div>
      </div>

      {/* Launch Preview Modal */}
      <LaunchPreviewModal
        open={showLaunchPreview}
        onClose={() => setShowLaunchPreview(false)}
        launchData={launchData}
      />
    </div>
  );
}
