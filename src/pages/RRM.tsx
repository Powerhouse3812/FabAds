import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2, Database } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/hooks/use-workspace";
import { useFbConnection } from "@/hooks/use-fb-connection";
import { useAccountHealthConfigs, useLatestHealthSnapshots } from "@/hooks/use-account-health";
import { useRRMAccountSettings, useRRMGlobalSettings, useRRMCampaignUrls, useUpsertRRMSetting } from "@/hooks/use-rrm-settings";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { RRMOverviewCards } from "@/components/rrm/RRMOverviewCards";
import { RRMAccountsTable } from "@/components/rrm/RRMAccountsTable";
import { RRMTrendChart } from "@/components/rrm/RRMTrendChart";
import { RRMEventLog } from "@/components/rrm/RRMEventLog";
import { RRMConfigDrawer } from "@/components/rrm/RRMConfigDrawer";
import { RRMPagesTab } from "@/components/rrm/RRMPagesTab";
import { RRMToolsTab } from "@/components/rrm/RRMToolsTab";
import { usePlan } from "@/contexts/PlanContext";
import { UpsellEmptyState } from "@/components/upsell/UpsellEmptyState";

export default function RRM() {
  const { plan } = usePlan();
  // AI plan: RRM is the Growth flagship feature. Page-takeover upsell
  // with the 1:1:250 recovery framing — it's the term Maalik uses across
  // sales decks, so users see consistent language across surfaces.
  if (plan === "ai") {
    return (
      <UpsellEmptyState
        featureName="Recovery & Retention Manager"
        valueProp="Recover 1:1:250 retention patterns automatically."
        targetTier="growth"
        bullets={[
          "Auto-detect ad fatigue + spend dilution",
          "Per-account health scores with rollback triggers",
          "Multi-account view in one drill-down",
        ]}
      />
    );
  }

  const { role } = useAuth();
  const workspaceId = useWorkspace();
  const { adAccounts, dataLoading } = useFbConnection();
  const { data: healthConfigs } = useAccountHealthConfigs(workspaceId);
  const { data: healthSnapshots } = useLatestHealthSnapshots(workspaceId);
  const { data: rrmAccountSettings } = useRRMAccountSettings(workspaceId);
  const { data: globalSettings } = useRRMGlobalSettings(workspaceId);
  const { data: rrmOffers } = useRRMCampaignUrls(workspaceId);
  const upsertSetting = useUpsertRRMSetting();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [dilutionLoadingId, setDilutionLoadingId] = useState<string | null>(null);
  const [configAccountId, setConfigAccountId] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  const isAdmin = role === "owner" || role === "admin";
  const configs = healthConfigs ?? [];
  const snapshots = healthSnapshots ?? [];
  const configMap = Object.fromEntries(configs.map((c) => [c.fb_ad_account_id, c]));
  const snapshotMap = Object.fromEntries(snapshots.map((s) => [s.fb_ad_account_id, s]));
  const rrmSettings = rrmAccountSettings ?? [];
  const rrmSettingsMap = Object.fromEntries(rrmSettings.map((s) => [s.fb_ad_account_id, s]));
  const offerList = rrmOffers ?? [];
  const configAccount = adAccounts.find((a) => a.id === configAccountId);

  // Dummy data for accounts without real data
  const trendSeries = [
    [0.35, 0.42, 0.50, 0.58, 0.65, 0.72, 0.78],
    [0.20, 0.18, 0.22, 0.19, 0.21, 0.20, 0.18],
    [0.75, 0.82, 0.88, 0.95, 1.02, 1.08, 1.15],
    [0.60, 0.55, 0.48, 0.42, 0.38, 0.32, 0.28],
  ];
  const dummySnapshots: Record<number, Partial<any>> = {
    0: { rejection_ratio: 0.78, approved_ads: 933, rejected_ads: 7, total_ads: 940, health_state: "safe" },
    1: { rejection_ratio: 0.18, approved_ads: 1098, rejected_ads: 2, total_ads: 1100, health_state: "safe" },
    2: { rejection_ratio: 1.15, approved_ads: 811, rejected_ads: 9, total_ads: 820, health_state: "risk" },
    3: { rejection_ratio: 0.28, approved_ads: 1047, rejected_ads: 3, total_ads: 1050, health_state: "safe" },
  };
  const dummyConfigs: Record<number, Partial<any>> = {
    0: { guardrail_mode: "auto_maintain", warning_threshold: 0.70, rejection_threshold: 1.00 },
    1: { guardrail_mode: "monitor", warning_threshold: 0.80, rejection_threshold: 1.00 },
    2: { guardrail_mode: "auto_maintain", warning_threshold: 0.80, rejection_threshold: 1.00 },
    3: { guardrail_mode: "auto_maintain", warning_threshold: 0.80, rejection_threshold: 1.00 },
  };
  const effectiveSnapshotMap: Record<string, any> = { ...snapshotMap };
  const effectiveConfigMap: Record<string, any> = { ...configMap };
  adAccounts.forEach((acc, idx) => {
    if (!effectiveSnapshotMap[acc.id]) {
      effectiveSnapshotMap[acc.id] = { fb_ad_account_id: acc.id, ...dummySnapshots[idx] };
    }
    if (!effectiveConfigMap[acc.id]) {
      effectiveConfigMap[acc.id] = { fb_ad_account_id: acc.id, ...dummyConfigs[idx] };
    }
  });

  const avgThreshold =
    configs.length > 0
      ? configs.reduce((s, c) => s + c.rejection_threshold, 0) / configs.length
      : 1.0;

  const handleRunDilution = async (accountId: string) => {
    if (!workspaceId || !isAdmin) return;
    setDilutionLoadingId(accountId);
    try {
      const { data, error } = await supabase.functions.invoke("dilution-check", {
        body: { workspace_id: workspaceId, fb_ad_account_id: accountId, source: "manual" },
      });
      if (error) throw error;

      const r = data?.results?.[0];
      if (!r) {
        toast({ title: "No accounts processed" });
      } else if (r.status === "planned") {
        toast({
          title: "Dilution planned",
          description: `${r.ads_to_launch} ads planned from "${r.folder_name}"`,
        });
      } else {
        toast({
          title: "Dilution skipped",
          description: r.reason || "No action needed",
        });
      }

      qc.invalidateQueries({ queryKey: ["health-events"] });
      qc.invalidateQueries({ queryKey: ["health-snapshots-latest"] });
    } catch (err: any) {
      toast({ title: "Dilution failed", description: err.message, variant: "destructive" });
    } finally {
      setDilutionLoadingId(null);
    }
  };

  const handleToggle = (accountId: string, field: "dilution_enabled" | "replacement_enabled", enabled: boolean) => {
    if (!workspaceId) return;
    upsertSetting.mutate({
      workspace_id: workspaceId,
      fb_ad_account_id: accountId,
      [field]: enabled,
    });
  };

  const handleSeedDemoData = async () => {
    if (!workspaceId) return;
    setSeeding(true);
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;

      let accounts = adAccounts;
      if (accounts.length === 0) {
        const { data: conn } = await (supabase as any)
          .from("fb_connections_safe")
          .select("id")
          .eq("workspace_id", workspaceId)
          .maybeSingle();

        let connectionId = conn?.id;
        if (!connectionId) {
          const { data: newConn, error: connErr } = await (supabase as any)
            .from("fb_connections")
            .insert({
              workspace_id: workspaceId,
              connected_by: userId,
              fb_user_id: "demo_user_001",
              fb_user_name: "Demo User",
              status: "connected",
            })
            .select("id")
            .single();
          if (connErr) throw connErr;
          connectionId = newConn.id;
        }

        const dummyAccounts = [
          { name: "Brand US — Main", fb_account_id: "act_100001", currency: "USD" },
          { name: "Brand EU — Scale", fb_account_id: "act_100002", currency: "EUR" },
          { name: "Brand UK — Test", fb_account_id: "act_100003", currency: "GBP" },
          { name: "Brand APAC — Growth", fb_account_id: "act_100004", currency: "USD" },
        ];

        const { data: inserted, error: accErr } = await supabase
          .from("fb_ad_accounts")
          .insert(
            dummyAccounts.map((a) => ({
              name: a.name,
              fb_account_id: a.fb_account_id,
              currency: a.currency,
              workspace_id: workspaceId,
              fb_connection_id: connectionId,
              account_status: 1,
            }))
          )
          .select("id, fb_account_id, name");
        if (accErr) throw accErr;
        accounts = (inserted as any) ?? [];
      }

      const now = new Date();
      const snapshotRows: any[] = [];
      const trendRatios = [
        [0.35, 0.42, 0.50, 0.58, 0.65, 0.72, 0.78],
        [0.20, 0.18, 0.22, 0.19, 0.21, 0.20, 0.18],
        [0.75, 0.82, 0.88, 0.95, 1.02, 1.08, 1.15],
        [0.60, 0.55, 0.48, 0.42, 0.38, 0.32, 0.28],
      ];
      const baseTotals = [950, 1100, 820, 1050];

      accounts.forEach((acc: any, idx: number) => {
        const ratios = trendRatios[idx] ?? trendRatios[0];
        const baseTotal = baseTotals[idx] ?? 900;
        ratios.forEach((ratio, dayIdx) => {
          const date = new Date(now);
          date.setDate(date.getDate() - (6 - dayIdx));
          const total = baseTotal + Math.floor(Math.random() * 50) - 25;
          const rejected = Math.round((ratio / 100) * total);
          const approved = total - rejected;
          snapshotRows.push({
            workspace_id: workspaceId,
            fb_ad_account_id: acc.id,
            sync_status: "synced",
            approved_ads: approved,
            rejected_ads: rejected,
            total_ads: total,
            rejection_ratio: ratio,
            health_state: ratio >= 1.0 ? "risk" : "safe",
            snapshot_at: date.toISOString(),
            last_synced_at: date.toISOString(),
          });
        });
      });

      const { error: snapErr } = await (supabase as any)
        .from("account_health_snapshots")
        .insert(snapshotRows);
      if (snapErr) throw snapErr;

      const configDefs = [
        { mode: "auto_maintain", warning: 0.70, threshold: 1.00 },
        { mode: "monitor", warning: 0.80, threshold: 1.00 },
        { mode: "auto_maintain", warning: 0.80, threshold: 1.00 },
        { mode: "auto_maintain", warning: 0.80, threshold: 1.00 },
      ];
      const configRows = accounts.map((acc: any, idx: number) => ({
        workspace_id: workspaceId,
        fb_ad_account_id: acc.id,
        guardrail_mode: configDefs[idx].mode,
        rejection_threshold: configDefs[idx].threshold,
        warning_threshold: configDefs[idx].warning,
      }));
      const { error: cfgErr } = await (supabase as any)
        .from("account_health_config")
        .upsert(configRows, { onConflict: "workspace_id,fb_ad_account_id" });
      if (cfgErr) throw cfgErr;

      const eventDefs: { accIdx: number; type: string; hoursAgo: number; meta: any }[] = [
        { accIdx: 0, type: "dilution_triggered", hoursAgo: 60, meta: { source: "scheduled", rejection_ratio: 0.65, threshold: 1.0, total_ads: 950, rejected_ads: 6 } },
        { accIdx: 0, type: "dilution_planned", hoursAgo: 59, meta: { ads_to_launch: 250, folder_name: "Evergreen Images", offer_name: "Dilution — Safe Creatives", status: "pending" } },
        { accIdx: 0, type: "auto_launch_stub_created", hoursAgo: 58, meta: { campaign_name: "RRM Dilution — Brand US", budget: 1.0, ads_count: 250, source: "scheduled" } },
        { accIdx: 1, type: "dilution_triggered", hoursAgo: 48, meta: { source: "scheduled", rejection_ratio: 0.20, threshold: 1.0, total_ads: 1100, rejected_ads: 2 } },
        { accIdx: 1, type: "dilution_skipped", hoursAgo: 47, meta: { reason_code: "below_threshold", skip_reason: "Ratio 0.20% is well below warning threshold 0.80%", rejection_ratio: 0.20, source: "scheduled" } },
        { accIdx: 1, type: "dilution_triggered", hoursAgo: 24, meta: { source: "scheduled", rejection_ratio: 0.18, threshold: 1.0, total_ads: 1100, rejected_ads: 2 } },
        { accIdx: 1, type: "dilution_skipped", hoursAgo: 23, meta: { reason_code: "below_threshold", skip_reason: "Ratio 0.18% still below threshold", rejection_ratio: 0.18, source: "scheduled" } },
        { accIdx: 2, type: "dilution_triggered", hoursAgo: 72, meta: { source: "manual", actor_id: userId, rejection_ratio: 0.88, threshold: 1.0, total_ads: 820, rejected_ads: 7, reason_code: "manual_request" } },
        { accIdx: 2, type: "dilution_planned", hoursAgo: 71, meta: { ads_to_launch: 250, folder_name: "Evergreen Images", offer_name: "Dilution — Safe Creatives", status: "pending", source: "manual" } },
        { accIdx: 2, type: "cap_applied", hoursAgo: 70, meta: { cap: 250, lifetime_ads: 580, requested_count: 250, reason_code: "within_cap", source: "scheduled" } },
        { accIdx: 2, type: "replacement_triggered", hoursAgo: 36, meta: { source: "scheduled", rejection_ratio: 1.08, threshold: 1.0, total_ads: 820, rejected_ads: 9, reason_code: "threshold_exceeded" } },
        { accIdx: 2, type: "replacement_planned", hoursAgo: 35, meta: { ads_to_launch: 250, folder_name: "Backup Video Creatives", offer_name: "Replacement — Backup Ads", status: "pending", source: "scheduled" } },
        { accIdx: 3, type: "dilution_triggered", hoursAgo: 50, meta: { source: "scheduled", rejection_ratio: 0.42, threshold: 1.0, total_ads: 1050, rejected_ads: 4 } },
        { accIdx: 3, type: "dilution_skipped", hoursAgo: 12, meta: { reason_code: "ratio_improving", skip_reason: "Ratio improving (0.28%), dilution not needed", rejection_ratio: 0.28, source: "scheduled" } },
        { accIdx: 3, type: "settings_changed", hoursAgo: 6, meta: { source: "manual", actor_id: userId, reason_code: "settings_update", changes: "dilution_enabled: false → true" } },
        { accIdx: 0, type: "manual_trigger", hoursAgo: 2, meta: { source: "manual", actor_id: userId, reason_code: "manual_request", rejection_ratio: 0.78 } },
      ];
      const eventRows = eventDefs.map((e) => {
        const ts = new Date(now);
        ts.setHours(ts.getHours() - e.hoursAgo);
        return {
          workspace_id: workspaceId,
          fb_ad_account_id: (accounts as any[])[e.accIdx].id,
          event_type: e.type,
          metadata: e.meta,
          created_at: ts.toISOString(),
        };
      });
      const { error: evtErr } = await (supabase as any)
        .from("account_health_events")
        .insert(eventRows);
      if (evtErr) throw evtErr;

      const templateDefs = [
        {
          name: "Broad — US 18-65",
          template_payload: {
            geo_locations: { countries: ["US"] },
            age_min: 18, age_max: 65,
            targeting_optimization: "none",
            publisher_platforms: ["facebook", "instagram"],
          },
        },
        {
          name: "Interest — Health & Fitness",
          template_payload: {
            geo_locations: { countries: ["US", "GB", "CA"] },
            age_min: 21, age_max: 55,
            flexible_spec: [{ interests: [{ id: "6003139266461", name: "Health & wellness" }] }],
            publisher_platforms: ["facebook", "instagram", "audience_network"],
          },
        },
      ];
      const { data: templates, error: tplErr } = await (supabase as any)
        .from("targeting_templates")
        .insert(
          templateDefs.map((t) => ({
            workspace_id: workspaceId,
            created_by: userId,
            name: t.name,
            template_payload: t.template_payload,
          }))
        )
        .select("id, name");
      if (tplErr) throw tplErr;

      const offerDefs = [
        {
          name: "Dilution — Safe Creatives",
          type: "rrm_dilution",
          folder: "Evergreen Images",
          templateIdx: 0,
          ads: [
            { name: "Evergreen — Lifestyle 1", headline: "Live Your Best Life", primary_text: "Discover products.", destination_url: "https://example.com/shop" },
            { name: "Evergreen — Testimonial", headline: "See What Others Say", primary_text: "Join 50,000+ happy customers.", destination_url: "https://example.com/reviews" },
            { name: "Evergreen — Value Prop", headline: "Quality You Can Trust", primary_text: "Premium ingredients.", destination_url: "https://example.com/quality" },
            { name: "Evergreen — Seasonal", headline: "Fresh Picks This Season", primary_text: "Our newest collection.", destination_url: "https://example.com/new" },
            { name: "Evergreen — Social Proof", headline: "Trending Now", primary_text: "Over 1M units sold.", destination_url: "https://example.com/trending" },
          ],
        },
        {
          name: "Replacement — Backup Ads",
          type: "rrm_replacement",
          folder: "Backup Video Creatives",
          templateIdx: 1,
          ads: [
            { name: "Backup — Brand Story", headline: "Our Story", primary_text: "From a small garage to a global brand.", destination_url: "https://example.com/about" },
            { name: "Backup — How It Works", headline: "Simple as 1-2-3", primary_text: "Order online, delivered to your door.", destination_url: "https://example.com/how" },
            { name: "Backup — Comparison", headline: "Why Choose Us?", primary_text: "We outperform the competition.", destination_url: "https://example.com/compare" },
            { name: "Backup — FAQ", headline: "Got Questions?", primary_text: "Everything you need to know.", destination_url: "https://example.com/faq" },
            { name: "Backup — Urgency", headline: "Don't Wait", primary_text: "Free shipping this week only.", destination_url: "https://example.com/promo" },
          ],
        },
      ];

      const createdOfferIds: string[] = [];
      for (const od of offerDefs) {
        const { data: offer, error: offerErr } = await (supabase as any)
          .from("offers")
          .insert({
            workspace_id: workspaceId,
            name: od.name,
            offer_type: od.type,
            created_by: userId,
            status: "active",
            targeting_template_id: templates[od.templateIdx]?.id ?? null,
          })
          .select("id")
          .single();
        if (offerErr) throw offerErr;
        createdOfferIds.push(offer.id);

        const { error: folderErr } = await (supabase as any)
          .from("offer_folders")
          .insert({ workspace_id: workspaceId, offer_id: offer.id, name: od.folder });
        if (folderErr) throw folderErr;

        const { error: adsErr } = await (supabase as any)
          .from("offer_ads")
          .insert(
            od.ads.map((ad, idx) => ({
              offer_id: offer.id,
              workspace_id: workspaceId,
              name: ad.name,
              headline: ad.headline,
              primary_text: ad.primary_text,
              destination_url: ad.destination_url,
              cta: "Learn More",
              sort_order: idx,
            }))
          );
        if (adsErr) throw adsErr;
      }

      const dilutionOfferId = createdOfferIds[0];
      const replacementOfferId = createdOfferIds[1];

      const accountSettingDefs = [
        { accIdx: 0, dilution_enabled: true, dilution_offer_id: dilutionOfferId, replacement_enabled: true, replacement_offer_id: replacementOfferId, auto_launch_override: true, auto_launch_enabled: true, ad_name_append: "[RRM-US]", selected_page_ids: ["page_us_001", "page_us_002"] },
        { accIdx: 1, dilution_enabled: true, dilution_offer_id: dilutionOfferId, replacement_enabled: false, replacement_offer_id: null, auto_launch_override: false, auto_launch_enabled: false, ad_name_append: null, selected_page_ids: ["page_eu_001"] },
        { accIdx: 2, dilution_enabled: true, dilution_offer_id: dilutionOfferId, replacement_enabled: true, replacement_offer_id: replacementOfferId, auto_launch_override: true, auto_launch_enabled: true, ad_name_append: "[RRM-UK]", selected_page_ids: ["page_uk_001", "page_uk_002"] },
        { accIdx: 3, dilution_enabled: false, dilution_offer_id: null, replacement_enabled: false, replacement_offer_id: null, auto_launch_override: false, auto_launch_enabled: false, ad_name_append: null, selected_page_ids: [] },
      ];
      const rrmSettingRows = accountSettingDefs.map((s) => ({
        workspace_id: workspaceId,
        fb_ad_account_id: (accounts as any[])[s.accIdx].id,
        dilution_enabled: s.dilution_enabled,
        dilution_offer_id: s.dilution_offer_id,
        replacement_enabled: s.replacement_enabled,
        replacement_offer_id: s.replacement_offer_id,
        auto_launch_override: s.auto_launch_override,
        auto_launch_enabled: s.auto_launch_enabled,
        ad_name_append: s.ad_name_append,
        selected_page_ids: s.selected_page_ids,
      }));
      const { error: rrmErr } = await (supabase as any)
        .from("rrm_account_settings")
        .upsert(rrmSettingRows, { onConflict: "workspace_id,fb_ad_account_id" });
      if (rrmErr) throw rrmErr;

      const { error: globalErr } = await (supabase as any)
        .from("rrm_global_settings")
        .upsert(
          {
            workspace_id: workspaceId,
            auto_launch_enabled: true,
            auto_launch_delay_minutes: 15,
            ad_name_append: "[RRM]",
            default_dilution_offer_id: dilutionOfferId,
            default_replacement_offer_id: replacementOfferId,
          },
          { onConflict: "workspace_id" }
        );
      if (globalErr) throw globalErr;

      toast({ title: "Demo data seeded successfully" });
      qc.invalidateQueries();
    } catch (err: any) {
      toast({ title: "Failed to seed data", description: err.message, variant: "destructive" });
    } finally {
      setSeeding(false);
    }
  };

  const showSeedButton = !dataLoading;
  const hasExistingData = snapshots.length > 0;

  return (
    <div className="space-y-6">

      {showSeedButton && (
        <Button variant="outline" onClick={handleSeedDemoData} disabled={seeding}>
          {seeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
          {hasExistingData ? "Re-seed Demo Data" : "Seed Demo Data"}
        </Button>
      )}

      <RRMOverviewCards snapshots={Object.values(effectiveSnapshotMap)} configs={Object.values(effectiveConfigMap)} />

      <Tabs defaultValue="accounts">
        <TabsList>
          <TabsTrigger value="accounts">Ad Accounts</TabsTrigger>
          <TabsTrigger value="trend">Trend</TabsTrigger>
          <TabsTrigger value="pages">Pages</TabsTrigger>
          <TabsTrigger value="tools">Tools</TabsTrigger>
          <TabsTrigger value="events">Action Log</TabsTrigger>
        </TabsList>

        <TabsContent value="accounts" className="space-y-4">
          <RRMAccountsTable
            accounts={adAccounts}
            snapshotMap={effectiveSnapshotMap}
            configMap={effectiveConfigMap}
            rrmSettingsMap={rrmSettingsMap}
            globalSettings={globalSettings ?? null}
            offers={offerList}
            loading={dataLoading}
            onToggle={handleToggle}
            onRunDilution={handleRunDilution}
            onConfigure={setConfigAccountId}
            dilutionLoadingId={dilutionLoadingId}
          />
        </TabsContent>

        <TabsContent value="trend">
          <RRMTrendChart workspaceId={workspaceId} avgThreshold={avgThreshold} />
        </TabsContent>

        <TabsContent value="pages">
          <RRMPagesTab />
        </TabsContent>

        <TabsContent value="tools">
          <RRMToolsTab />
        </TabsContent>

        <TabsContent value="events">
          <RRMEventLog workspaceId={workspaceId} />
        </TabsContent>
      </Tabs>

      {configAccountId && (
        <RRMConfigDrawer
          open={!!configAccountId}
          onOpenChange={(open) => { if (!open) setConfigAccountId(null); }}
          accountId={configAccountId}
          accountName={configAccount?.name ?? "Account"}
          workspaceId={workspaceId ?? ""}
          config={effectiveConfigMap[configAccountId] ?? null}
          accountSetting={rrmSettingsMap[configAccountId] ?? null}
          offers={offerList.map((o) => ({ id: o.id, name: o.name }))}
          globalSettings={globalSettings ?? null}
        />
      )}
    </div>
  );
}
