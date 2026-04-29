import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const RequestSchema = z.object({
  workspace_id: z.string().uuid(),
});

// ── Dilution Math ──────────────────────────────────────────────────────

interface SnapshotData {
  id: string;
  fb_ad_account_id: string;
  rejected_ads: number | null;
  approved_ads: number | null;
  total_ads: number | null;
  rejection_ratio: number | null;
  health_state: string;
}

interface HealthConfigData {
  guardrail_mode: string;
  rejection_threshold: number;
  warning_threshold: number;
}

interface DilutionPlan {
  should_trigger: boolean;
  reason: string;
  ads_to_launch: number;
  cap_used: number;
  structure: { campaigns: number; adsets: number };
  trigger_type: string | null;
  lifetime_launched_ads: number;
}

/**
 * Deterministic dummy lifetime_launched_ads from account UUID.
 * Uses first 8 hex chars as seed → range 20–250.
 */
function getDemoLifetimeLaunched(accountId: string): number {
  const seed = parseInt(accountId.replace(/-/g, "").slice(0, 8), 16);
  return 20 + (seed % 231); // 20..250
}

function getDilutionPlan(
  current: SnapshotData,
  previous: SnapshotData | null,
  config: HealthConfigData | null,
  lifetimeLaunchedAds: number
): DilutionPlan {
  const noTrigger = (reason: string): DilutionPlan => ({
    should_trigger: false,
    reason,
    ads_to_launch: 0,
    cap_used: 0,
    structure: { campaigns: 1, adsets: 1 },
    trigger_type: null,
    lifetime_launched_ads: lifetimeLaunchedAds,
  });

  // Guard: automation must be enabled
  if (!config || config.guardrail_mode !== "auto_maintain") {
    return noTrigger("automation_not_enabled");
  }

  // Guard: no fake math – real numbers required
  if (current.rejected_ads === null || current.rejection_ratio === null) {
    return noTrigger("no_real_metrics");
  }

  const cap = lifetimeLaunchedAds < 150 ? 10 : 50;

  let triggerType: string | null = null;
  let deltaMissing = 0;

  // Check 1: rejected increased since last snapshot
  if (previous && previous.rejected_ads !== null) {
    const rejectedIncrease = current.rejected_ads - previous.rejected_ads;
    if (rejectedIncrease > 0) {
      triggerType = "rejected_increase";
      deltaMissing = rejectedIncrease;
    }
  }

  // Check 2: ratio crossed threshold
  if (!triggerType && current.rejection_ratio >= config.rejection_threshold) {
    triggerType = "ratio_crossed";
  }

  // Check 3: ads went missing (total decreased)
  if (
    !triggerType &&
    previous &&
    previous.total_ads !== null &&
    current.total_ads !== null
  ) {
    const totalDrop = previous.total_ads - current.total_ads;
    if (totalDrop > 0) {
      triggerType = "ad_missing";
      deltaMissing = totalDrop;
    }
  }

  if (!triggerType) {
    return noTrigger("no_trigger_condition_met");
  }

  // Compute ads_to_launch
  let adsToLaunch: number;
  if (deltaMissing > 0) {
    adsToLaunch = Math.min(cap, deltaMissing * 2);
  } else {
    // threshold crossed but no measurable delta → conservative full cap
    adsToLaunch = cap;
  }

  return {
    should_trigger: true,
    reason: `dilution_triggered:${triggerType}`,
    ads_to_launch: adsToLaunch,
    cap_used: cap,
    structure: { campaigns: 1, adsets: 1 },
    trigger_type: triggerType,
    lifetime_launched_ads: lifetimeLaunchedAds,
  };
}

// ── Edge Function ──────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = user.id;

    const rawBody = await req.json();
    const parsed = RequestSchema.safeParse(rawBody);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: "Invalid input" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { workspace_id } = parsed.data;

    const svc = createClient(supabaseUrl, serviceKey);

    // Verify owner/admin
    const { data: isAdmin } = await svc.rpc("is_workspace_owner_or_admin", {
      _user_id: userId,
      _workspace_id: workspace_id,
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get connection
    const { data: connection, error: connError } = await svc
      .from("fb_connections")
      .select("id, status")
      .eq("workspace_id", workspace_id)
      .single();

    if (connError || !connection) {
      return new Response(
        JSON.stringify({ error: "No Facebook connection found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (connection.status !== "connected") {
      return new Response(
        JSON.stringify({
          error: "Facebook is disconnected. Reconnect first.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get ad accounts + BMs for this workspace
    const { data: adAccounts } = await svc
      .from("fb_ad_accounts")
      .select("id")
      .eq("workspace_id", workspace_id);

    const { data: bms } = await svc
      .from("fb_business_managers")
      .select("id")
      .eq("workspace_id", workspace_id);

    const now = new Date().toISOString();
    const dilutionResults: Array<{
      account_id: string;
      plan: DilutionPlan;
    }> = [];

    // ── Per-account: snapshot + dilution ─────────────────────────────

    for (const acc of adAccounts || []) {
      // Insert health snapshot (honest, no fake counts)
      const { data: newSnapshot } = await svc
        .from("account_health_snapshots")
        .insert({
          workspace_id,
          fb_ad_account_id: acc.id,
          sync_status: "ok",
          approved_ads: null,
          rejected_ads: null,
          total_ads: null,
          rejection_ratio: null,
          health_state: "unknown",
          last_synced_at: now,
        })
        .select("id, fb_ad_account_id, rejected_ads, approved_ads, total_ads, rejection_ratio, health_state")
        .single();

      if (!newSnapshot) continue;

      // Fetch previous snapshot (second-latest)
      const { data: prevSnapshots } = await svc
        .from("account_health_snapshots")
        .select("id, fb_ad_account_id, rejected_ads, approved_ads, total_ads, rejection_ratio, health_state")
        .eq("fb_ad_account_id", acc.id)
        .neq("id", newSnapshot.id)
        .order("snapshot_at", { ascending: false })
        .limit(1);

      const prevSnapshot: SnapshotData | null =
        prevSnapshots && prevSnapshots.length > 0 ? prevSnapshots[0] : null;

      // Fetch guardrail config
      const { data: config } = await svc
        .from("account_health_config")
        .select("guardrail_mode, rejection_threshold, warning_threshold")
        .eq("workspace_id", workspace_id)
        .eq("fb_ad_account_id", acc.id)
        .single();

      // Compute dilution plan
      const lifetimeLaunched = getDemoLifetimeLaunched(acc.id);
      const plan = getDilutionPlan(
        newSnapshot as SnapshotData,
        prevSnapshot,
        config as HealthConfigData | null,
        lifetimeLaunched
      );

      dilutionResults.push({ account_id: acc.id, plan });

      // ── Write events + activity logs if triggered ───────────────

      if (plan.should_trigger) {
        const eventMeta = {
          mode: "dilution",
          trigger: plan.trigger_type,
          ads_to_launch: plan.ads_to_launch,
          cap: plan.cap_used,
          lifetime_launched_ads: plan.lifetime_launched_ads,
          lifetime_launched_ads_source: "demo",
          structure: plan.structure,
          offer_id: null,
          folder_id: null,
          selection_strategy: "latest",
          tag_template:
            "AUTO:DILUTION | OFFER:{offer_name} | FOLDER:{folder_name}",
        };

        // Insert dilution_planned event
        const { data: plannedEvent } = await svc
          .from("account_health_events")
          .insert({
            workspace_id,
            fb_ad_account_id: acc.id,
            event_type: "dilution_planned",
            metadata: eventMeta,
          })
          .select("id")
          .single();

        // Insert auto_launch_stub_created event
        const { data: stubEvent } = await svc
          .from("account_health_events")
          .insert({
            workspace_id,
            fb_ad_account_id: acc.id,
            event_type: "auto_launch_stub_created",
            metadata: { ...eventMeta, action_status: "pending" },
          })
          .select("id")
          .single();

        // Activity log: auto_maintain_triggered
        await svc.from("activity_logs").insert({
          workspace_id,
          user_id: userId,
          action: "auto_maintain_triggered",
          target_email: "",
          metadata: {
            fb_ad_account_id: acc.id,
            account_health_snapshot_id: newSnapshot.id,
            event_id: plannedEvent?.id ?? null,
            ads_to_launch: plan.ads_to_launch,
            cap: plan.cap_used,
            trigger: plan.trigger_type,
          },
        });

        // Activity log: dilution_plan_created
        await svc.from("activity_logs").insert({
          workspace_id,
          user_id: userId,
          action: "dilution_plan_created",
          target_email: "",
          metadata: {
            fb_ad_account_id: acc.id,
            account_health_snapshot_id: newSnapshot.id,
            event_id: plannedEvent?.id ?? null,
            ads_to_launch: plan.ads_to_launch,
            cap: plan.cap_used,
            trigger: plan.trigger_type,
            structure: plan.structure,
          },
        });

        // Activity log: auto_action_stub_created
        if (stubEvent) {
          await svc.from("activity_logs").insert({
            workspace_id,
            user_id: userId,
            action: "auto_action_stub_created",
            target_email: "",
            metadata: {
              fb_ad_account_id: acc.id,
              account_health_snapshot_id: newSnapshot.id,
              event_id: stubEvent.id,
              ads_to_launch: plan.ads_to_launch,
              cap: plan.cap_used,
              trigger: plan.trigger_type,
              action_status: "pending",
            },
          });
        }
      }
    }

    // Update last_synced_at on the connection
    await svc
      .from("fb_connections")
      .update({ last_synced_at: now })
      .eq("id", connection.id);

    // Log sync activity
    await svc.from("activity_logs").insert({
      workspace_id,
      user_id: userId,
      action: "fb_synced",
      target_email: "",
      metadata: {
        business_managers: bms?.length ?? 0,
        ad_accounts: adAccounts?.length ?? 0,
        dilution_triggered_count: dilutionResults.filter(
          (r) => r.plan.should_trigger
        ).length,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        business_managers: bms?.length ?? 0,
        ad_accounts: adAccounts?.length ?? 0,
        dilution_results: dilutionResults.map((r) => ({
          account_id: r.account_id,
          should_trigger: r.plan.should_trigger,
          reason: r.plan.reason,
          ads_to_launch: r.plan.ads_to_launch,
          cap_used: r.plan.cap_used,
        })),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("fb-sync error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
