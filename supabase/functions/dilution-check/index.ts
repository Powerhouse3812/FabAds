import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;
    const userEmail = user.email || "";

    // Parse body
    const body = await req.json();
    const workspaceId = body.workspace_id as string;
    const targetAccountId = body.fb_ad_account_id as string | undefined;
    const source = (body.source as string) || "manual";

    if (!workspaceId) {
      return new Response(
        JSON.stringify({ error: "workspace_id required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!targetAccountId) {
      return new Response(
        JSON.stringify({ error: "fb_ad_account_id required for manual trigger" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const db = createClient(supabaseUrl, serviceRoleKey);

    // Verify user is owner/admin in workspace
    const { data: membership } = await db
      .from("workspace_users")
      .select("role")
      .eq("user_id", userId)
      .eq("workspace_id", workspaceId)
      .single();

    if (!membership || !["owner", "admin"].includes(membership.role)) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: configs } = await db
      .from("account_health_config")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("fb_ad_account_id", targetAccountId)
      .eq("guardrail_mode", "auto_maintain");

    if (!configs || configs.length === 0) {
      return new Response(
        JSON.stringify({ results: [], message: "Account not in auto_maintain mode" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await processSingleAccount(db, {
      accountId: targetAccountId,
      workspaceId,
      userId,
      userEmail,
      source,
    });

    return new Response(JSON.stringify({ results: [result] }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("dilution-check error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function processSingleAccount(
  db: any,
  ctx: {
    accountId: string;
    workspaceId: string;
    userId: string;
    userEmail: string;
    source: string;
  }
) {
  const { accountId, workspaceId, userId, userEmail, source } = ctx;
  const createdEvents: string[] = [];

  const insertEvent = async (eventType: string, metadata: Record<string, any>) => {
    const { data, error } = await db.from("account_health_events").insert({
      event_type: eventType,
      fb_ad_account_id: accountId,
      workspace_id: workspaceId,
      metadata,
    }).select("id").single();
    if (error) {
      console.error(`Failed to insert event ${eventType}:`, error);
      throw error;
    }
    createdEvents.push(eventType);
    return data?.id;
  };

  const insertLog = async (action: string, metadata: Record<string, any>) => {
    const { error } = await db.from("activity_logs").insert({
      action,
      workspace_id: workspaceId,
      user_id: userId,
      target_email: userEmail,
      metadata,
    });
    if (error) console.error(`Failed to insert log ${action}:`, error);
  };

  try {
    // 1. Get latest snapshot
    const { data: snapshots } = await db
      .from("account_health_snapshots")
      .select("*")
      .eq("fb_ad_account_id", accountId)
      .order("snapshot_at", { ascending: false })
      .limit(1);

    const snapshot = snapshots?.[0];

    if (!snapshot) {
      await insertEvent("dilution_skipped", { fb_ad_account_id: accountId, skip_reason: "no_snapshot", source });
      await insertLog("dilution_skipped", { fb_ad_account_id: accountId, skip_reason: "no_snapshot", source });
      return { account_id: accountId, status: "skipped", reason: "no_snapshot" };
    }

    const rejectedAds = snapshot.rejected_ads ?? 0;
    if (!rejectedAds || rejectedAds <= 0) {
      await insertEvent("dilution_skipped", { fb_ad_account_id: accountId, skip_reason: "no_rejected_ads", source });
      await insertLog("dilution_skipped", { fb_ad_account_id: accountId, skip_reason: "no_rejected_ads", source });
      return { account_id: accountId, status: "skipped", reason: "no_rejected_ads" };
    }

    // 3. Check cooldown (60 min)
    const cooldownCutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recentPlans } = await db
      .from("account_health_events")
      .select("id")
      .eq("fb_ad_account_id", accountId)
      .eq("event_type", "dilution_planned")
      .gte("created_at", cooldownCutoff)
      .limit(1);

    if (recentPlans && recentPlans.length > 0) {
      await insertEvent("dilution_skipped", { fb_ad_account_id: accountId, skip_reason: "cooldown_active", source });
      await insertLog("dilution_skipped", { fb_ad_account_id: accountId, skip_reason: "cooldown_active", source });
      return { account_id: accountId, status: "skipped", reason: "cooldown_active" };
    }

    // 4. Calculate lifetime_ads
    const { data: stubEvents } = await db
      .from("account_health_events")
      .select("metadata")
      .eq("fb_ad_account_id", accountId)
      .eq("event_type", "auto_launch_stub_created");

    let lifetimeAds = 0;
    for (const ev of stubEvents || []) {
      const m = ev.metadata as any;
      lifetimeAds += parseInt(m?.ads_to_launch || "0", 10);
    }

    const deltaMissing = rejectedAds;
    const requestedCount = deltaMissing * 2;
    const cap = lifetimeAds < 150 ? 10 : 50;
    const adsToLaunch = Math.min(cap, requestedCount);
    const capRule = lifetimeAds < 150 ? "lifetime_ads < 150" : "lifetime_ads >= 150";

    if (adsToLaunch <= 0) {
      await insertEvent("dilution_skipped", { fb_ad_account_id: accountId, skip_reason: "ads_to_launch_zero", source });
      await insertLog("dilution_skipped", { fb_ad_account_id: accountId, skip_reason: "ads_to_launch_zero", source });
      return { account_id: accountId, status: "skipped", reason: "ads_to_launch_zero" };
    }

    // 9. Select Campaign URL (previously Offer)
    const { data: linkedOffers } = await db
      .from("campaign_url_ad_accounts")
      .select("campaign_url_id")
      .eq("fb_ad_account_id", accountId)
      .eq("workspace_id", workspaceId);

    if (!linkedOffers || linkedOffers.length === 0) {
      await insertEvent("dilution_skipped", { fb_ad_account_id: accountId, skip_reason: "no_active_offer", source });
      await insertLog("dilution_skipped", { fb_ad_account_id: accountId, skip_reason: "no_active_offer", source });
      return { account_id: accountId, status: "skipped", reason: "no_active_offer" };
    }

    const offerIds = linkedOffers.map((l: any) => l.campaign_url_id);
    const { data: activeOffers } = await db
      .from("campaign_urls")
      .select("id, name")
      .in("id", offerIds)
      .eq("status", "active")
      .order("updated_at", { ascending: false })
      .order("id", { ascending: true })
      .limit(1);

    if (!activeOffers || activeOffers.length === 0) {
      await insertEvent("dilution_skipped", { fb_ad_account_id: accountId, skip_reason: "no_active_offer", source });
      await insertLog("dilution_skipped", { fb_ad_account_id: accountId, skip_reason: "no_active_offer", source });
      return { account_id: accountId, status: "skipped", reason: "no_active_offer" };
    }

    const chosenOffer = activeOffers[0];

    // 10. Select Folder
    const { data: offerFolders } = await db
      .from("campaign_url_folders")
      .select("id, name")
      .eq("campaign_url_id", chosenOffer.id)
      .order("updated_at", { ascending: false });

    if (!offerFolders || offerFolders.length === 0) {
      await insertEvent("dilution_skipped", { fb_ad_account_id: accountId, skip_reason: "no_folder", source });
      await insertLog("dilution_skipped", { fb_ad_account_id: accountId, skip_reason: "no_folder", source });
      return { account_id: accountId, status: "skipped", reason: "no_folder" };
    }

    const folderIds = offerFolders.map((f: any) => f.id);
    const { data: folderItems } = await db
      .from("campaign_url_folder_items")
      .select("folder_id")
      .in("folder_id", folderIds)
      .eq("item_type", "media");

    const folderCounts: Record<string, number> = {};
    for (const item of folderItems || []) {
      folderCounts[item.folder_id] = (folderCounts[item.folder_id] || 0) + 1;
    }

    const sortedFolders = [...offerFolders].sort(
      (a: any, b: any) => (folderCounts[b.id] || 0) - (folderCounts[a.id] || 0)
    );
    const chosenFolder = sortedFolders[0];

    // 11. Build 7-day exclusion set
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: recentStubs } = await db
      .from("account_health_events")
      .select("metadata")
      .eq("fb_ad_account_id", accountId)
      .eq("event_type", "auto_launch_stub_created")
      .gte("created_at", sevenDaysAgo);

    const exclusionSet = new Set<string>();
    for (const ev of recentStubs || []) {
      const ids = (ev.metadata as any)?.asset_ids;
      if (Array.isArray(ids)) {
        for (const id of ids) exclusionSet.add(id);
      }
    }

    // 12. Select assets
    const { data: folderAssetLinks } = await db
      .from("campaign_url_folder_items")
      .select("asset_id")
      .eq("folder_id", chosenFolder.id)
      .eq("item_type", "media")
      .not("asset_id", "is", null);

    const allAssetIds = (folderAssetLinks || []).map((l: any) => l.asset_id);
    let candidateAssetIds = allAssetIds.filter((id: string) => !exclusionSet.has(id));

    let exclusionOverridden = false;
    if (candidateAssetIds.length === 0 && allAssetIds.length > 0) {
      candidateAssetIds = allAssetIds;
      exclusionOverridden = true;
    }

    let selectedAssetIds: string[] = [];
    if (candidateAssetIds.length > 0) {
      const { data: candidateAssets } = await db
        .from("creative_assets")
        .select("id")
        .in("id", candidateAssetIds)
        .order("created_at", { ascending: false })
        .limit(adsToLaunch);
      selectedAssetIds = (candidateAssets || []).map((a: any) => a.id);
    }

    const finalAdsToLaunch = selectedAssetIds.length;

    if (finalAdsToLaunch === 0) {
      await insertEvent("dilution_skipped", { fb_ad_account_id: accountId, skip_reason: "no_assets_available", source });
      await insertLog("dilution_skipped", { fb_ad_account_id: accountId, skip_reason: "no_assets_available", source });
      return { account_id: accountId, status: "skipped", reason: "no_assets_available" };
    }

    // 13. Create events
    await insertEvent("dilution_triggered", { rejected_ads: rejectedAds, source });

    const plannedId = await insertEvent("dilution_planned", {
      fb_ad_account_id: accountId,
      rejected_ads: rejectedAds,
      requested_count: requestedCount,
      ads_to_launch: finalAdsToLaunch,
      cap,
      cap_rule: capRule,
      lifetime_ads: lifetimeAds,
      campaign_url_id: chosenOffer.id,
      campaign_url_name: chosenOffer.name,
      folder_id: chosenFolder.id,
      folder_name: chosenFolder.name,
      asset_ids: selectedAssetIds,
      tags: [],
      structure: "1C:1AS",
      source,
      ...(exclusionOverridden ? { exclusion_overridden: true } : {}),
    });

    const tags = [
      "Auto:Dilution",
      `CampaignURL:${chosenOffer.id}`,
      `Folder:${chosenFolder.id}`,
      `Run:${plannedId}`,
    ];

    await db
      .from("account_health_events")
      .update({
        metadata: {
          fb_ad_account_id: accountId,
          rejected_ads: rejectedAds,
          requested_count: requestedCount,
          ads_to_launch: finalAdsToLaunch,
          cap,
          cap_rule: capRule,
          lifetime_ads: lifetimeAds,
          campaign_url_id: chosenOffer.id,
          campaign_url_name: chosenOffer.name,
          folder_id: chosenFolder.id,
          folder_name: chosenFolder.name,
          asset_ids: selectedAssetIds,
          tags,
          structure: "1C:1AS",
          source,
          ...(exclusionOverridden ? { exclusion_overridden: true } : {}),
        },
      })
      .eq("id", plannedId);

    await insertEvent("cap_applied", {
      lifetime_ads: lifetimeAds,
      cap,
      requested_count: requestedCount,
      ads_to_launch: finalAdsToLaunch,
    });

    await insertEvent("auto_launch_stub_created", {
      fb_ad_account_id: accountId,
      ads_to_launch: finalAdsToLaunch,
      asset_ids: selectedAssetIds,
      tags,
      structure: "1C:1AS",
      status: "pending",
    });

    await insertLog("auto_maintain_triggered", {
      fb_ad_account_id: accountId,
      reason: "rejected_ads > 0",
      rejected_ads: rejectedAds,
      requested_count: requestedCount,
      ads_to_launch: finalAdsToLaunch,
      cap,
      lifetime_ads: lifetimeAds,
      campaign_url_id: chosenOffer.id,
      folder_id: chosenFolder.id,
      source,
    });

    return {
      account_id: accountId,
      status: "planned",
      ads_to_launch: finalAdsToLaunch,
      campaign_url_name: chosenOffer.name,
      folder_name: chosenFolder.name,
      asset_count: selectedAssetIds.length,
    };
  } catch (err: any) {
    console.error(`Partial failure for account ${accountId}:`, err);
    try {
      await db.from("account_health_events").insert({
        event_type: "dilution_skipped",
        fb_ad_account_id: accountId,
        workspace_id: workspaceId,
        metadata: {
          fb_ad_account_id: accountId,
          skip_reason: "partial_failure",
          step_failed: err.message || "unknown",
          partial_events_created: createdEvents,
          source,
        },
      });
      await db.from("activity_logs").insert({
        action: "dilution_skipped",
        workspace_id: workspaceId,
        user_id: userId,
        target_email: userEmail,
        metadata: {
          fb_ad_account_id: accountId,
          skip_reason: "partial_failure",
          step_failed: err.message || "unknown",
          partial_events_created: createdEvents,
          source,
        },
      });
    } catch (logErr) {
      console.error("Failed to log partial failure:", logErr);
    }
    return { account_id: accountId, status: "skipped", reason: "partial_failure" };
  }
}
