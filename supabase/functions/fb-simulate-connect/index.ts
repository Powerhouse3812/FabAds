import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const AdAccountSchema = z.object({
  fb_account_id: z.string(),
  name: z.string(),
  currency: z.string(),
  account_status: z.number(),
});

const BMSchema = z.object({
  fb_business_id: z.string(),
  name: z.string(),
  adAccounts: z.array(AdAccountSchema),
});

const DryRunRequestSchema = z.object({
  workspace_id: z.string().uuid(),
  dry_run: z.literal(true),
});

const ImportRequestSchema = z.object({
  workspace_id: z.string().uuid(),
  dry_run: z.optional(z.literal(false)),
  selected_ad_account_ids: z.array(z.string()).min(1),
  business_managers_data: z.array(BMSchema),
});

// ---------------------------------------------------------------------------
// Data generators
// ---------------------------------------------------------------------------

function randomFbId(): string {
  return Array.from({ length: 16 }, () => Math.floor(Math.random() * 10)).join("");
}

function generateSimulatedData() {
  const fbUserId = randomFbId();
  const fbUserName = "Alex Johnson";
  const currencies = ["USD", "EUR", "GBP", "INR", "AUD", "CAD", "SGD", "AED"];
  const statuses = [1, 1, 1, 1, 2, 3, 7, 9];
  const bmNames = ["Starter Labs Inc.", "PixelWave Media", "Crescent Digital Agency"];
  const accountPrefixes = [
    "US - Performance", "EU - Brand Awareness", "APAC - Retargeting", "Global - Lead Gen",
    "IN - App Install", "UK - Conversions", "ME - Traffic", "CA - Video Views",
  ];

  let idx = 0;
  const businessManagers = bmNames.map((bmName) => {
    const count = 2 + Math.floor(Math.random() * 3);
    const adAccounts = [];
    for (let i = 0; i < count; i++) {
      adAccounts.push({
        fb_account_id: "act_" + randomFbId(),
        name: `${accountPrefixes[idx % accountPrefixes.length]} | ${bmName.split(" ")[0]}`,
        currency: currencies[idx % currencies.length],
        account_status: statuses[idx % statuses.length],
      });
      idx++;
    }
    return { fb_business_id: randomFbId(), name: bmName, adAccounts };
  });

  return { fbUserId, fbUserName, businessManagers };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function authenticateUser(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error } = await userClient.auth.getUser();
  return error || !user ? null : user;
}

async function verifyAdmin(svc: any, userId: string, workspaceId: string) {
  const { data } = await svc.rpc("is_workspace_owner_or_admin", {
    _user_id: userId,
    _workspace_id: workspaceId,
  });
  return !!data;
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const user = await authenticateUser(req);
    if (!user) return jsonResponse({ error: "Unauthorized" }, 401);

    const rawBody = await req.json();

    // --- DRY RUN MODE ---
    const dryRunParsed = DryRunRequestSchema.safeParse(rawBody);
    if (dryRunParsed.success) {
      const { workspace_id } = dryRunParsed.data;
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const svc = createClient(supabaseUrl, serviceKey);

      if (!(await verifyAdmin(svc, user.id, workspace_id))) {
        return jsonResponse({ error: "Forbidden" }, 403);
      }

      // Check not already connected
      const { data: existing } = await svc
        .from("fb_connections")
        .select("id, status")
        .eq("workspace_id", workspace_id)
        .maybeSingle();
      if (existing?.status === "connected") {
        return jsonResponse({ error: "Facebook is already connected" }, 409);
      }

      const sim = generateSimulatedData();
      return jsonResponse({
        success: true,
        fb_user_name: sim.fbUserName,
        business_managers_data: sim.businessManagers,
      });
    }

    // --- IMPORT MODE ---
    const importParsed = ImportRequestSchema.safeParse(rawBody);
    if (!importParsed.success) {
      return jsonResponse({ error: "Invalid input", details: importParsed.error.flatten() }, 400);
    }

    const { workspace_id, selected_ad_account_ids, business_managers_data } = importParsed.data;
    const selectedSet = new Set(selected_ad_account_ids);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const svc = createClient(supabaseUrl, serviceKey);

    if (!(await verifyAdmin(svc, user.id, workspace_id))) {
      return jsonResponse({ error: "Forbidden" }, 403);
    }

    const { data: existing } = await svc
      .from("fb_connections")
      .select("id, status")
      .eq("workspace_id", workspace_id)
      .maybeSingle();
    if (existing?.status === "connected") {
      return jsonResponse({ error: "Facebook is already connected" }, 409);
    }

    const fbUserId = randomFbId();
    const fbUserName = "Alex Johnson";

    // Upsert connection
    let connectionId: string;
    if (existing) {
      const { data: updated, error: updErr } = await svc
        .from("fb_connections")
        .update({
          status: "connected",
          fb_user_id: fbUserId,
          fb_user_name: fbUserName,
          connected_by: user.id,
          connected_at: new Date().toISOString(),
          last_synced_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select("id")
        .single();
      if (updErr) throw updErr;
      connectionId = updated!.id;
    } else {
      const { data: created, error: crErr } = await svc
        .from("fb_connections")
        .insert({
          workspace_id,
          fb_user_id: fbUserId,
          fb_user_name: fbUserName,
          connected_by: user.id,
          status: "connected",
          last_synced_at: new Date().toISOString(),
        })
        .select("id")
        .single();
      if (crErr) throw crErr;
      connectionId = created!.id;
    }

    // Token
    await svc.from("fb_tokens").upsert(
      {
        fb_connection_id: connectionId,
        access_token: "SIMULATED_TOKEN_" + randomFbId(),
        token_expires_at: new Date(Date.now() + 60 * 86400 * 1000).toISOString(),
      },
      { onConflict: "fb_connection_id" }
    );

    // Insert only BMs that have selected accounts, and only selected accounts
    let totalAdAccounts = 0;
    for (const bm of business_managers_data) {
      const selectedAccounts = bm.adAccounts.filter((a) => selectedSet.has(a.fb_account_id));
      if (selectedAccounts.length === 0) continue;

      const { data: bmRow, error: bmErr } = await svc
        .from("fb_business_managers")
        .upsert(
          {
            workspace_id,
            fb_connection_id: connectionId,
            fb_business_id: bm.fb_business_id,
            name: bm.name,
          },
          { onConflict: "fb_connection_id,fb_business_id", ignoreDuplicates: false }
        )
        .select("id")
        .single();
      if (bmErr) throw bmErr;

      for (const acc of selectedAccounts) {
        await svc.from("fb_ad_accounts").upsert(
          {
            workspace_id,
            fb_connection_id: connectionId,
            fb_business_manager_id: bmRow!.id,
            fb_account_id: acc.fb_account_id,
            name: acc.name,
            currency: acc.currency,
            account_status: acc.account_status,
          },
          { onConflict: "fb_connection_id,fb_account_id", ignoreDuplicates: false }
        );
        totalAdAccounts++;
      }
    }

    // Activity log
    await svc.from("activity_logs").insert({
      workspace_id,
      user_id: user.id,
      action: "fb_connected",
      target_email: "",
      metadata: {
        simulated: true,
        fb_user_name: fbUserName,
        business_managers: business_managers_data.length,
        ad_accounts: totalAdAccounts,
      },
    });

    return jsonResponse({
      success: true,
      fb_user_name: fbUserName,
      business_managers: business_managers_data.length,
      ad_accounts: totalAdAccounts,
    });
  } catch (err) {
    console.error("fb-simulate-connect error:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
