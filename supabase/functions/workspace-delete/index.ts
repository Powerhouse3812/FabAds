import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const {
      data: { user: caller },
      error: authError,
    } = await anonClient.auth.getUser();
    if (authError || !caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const workspaceName = body?.workspace_name;
    if (!workspaceName || typeof workspaceName !== "string") {
      return new Response(
        JSON.stringify({ error: "Missing workspace_name confirmation" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get caller's workspace + role
    const { data: callerMembership } = await admin
      .from("workspace_users")
      .select("workspace_id, role")
      .eq("user_id", caller.id)
      .limit(1)
      .single();

    if (!callerMembership) {
      return new Response(JSON.stringify({ error: "No workspace found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { workspace_id } = callerMembership;
    const callerIsAdmin =
      callerMembership.role === "owner" || callerMembership.role === "admin";

    if (!callerIsAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify workspace name matches
    const { data: workspace } = await admin
      .from("workspaces")
      .select("name")
      .eq("id", workspace_id)
      .single();

    if (!workspace || workspace.name !== workspaceName) {
      return new Response(
        JSON.stringify({ error: "Workspace name does not match" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Collect all user_ids
    const { data: wsUsers } = await admin
      .from("workspace_users")
      .select("user_id")
      .eq("workspace_id", workspace_id);

    const userIds = (wsUsers ?? []).map((u) => u.user_id);

    // 1. Delete storage files under workspace prefix (batch)
    try {
      const { data: files } = await admin.storage
        .from("launch-media")
        .list(workspace_id, { limit: 1000 });

      if (files && files.length > 0) {
        const filePaths = files.map((f) => `${workspace_id}/${f.name}`);
        // Batch in chunks of 100
        for (let i = 0; i < filePaths.length; i += 100) {
          const chunk = filePaths.slice(i, i + 100);
          await admin.storage.from("launch-media").remove(chunk);
        }
      }
    } catch (storageErr) {
      console.error("Storage deletion error (continuing):", storageErr);
    }

    // 2. Delete launch data
    await admin.from("launch_ads").delete().eq("workspace_id", workspace_id);
    await admin.from("launch_adsets").delete().eq("workspace_id", workspace_id);
    await admin
      .from("launch_campaigns")
      .delete()
      .eq("workspace_id", workspace_id);
    await admin
      .from("launch_ad_accounts")
      .delete()
      .eq("workspace_id", workspace_id);
    await admin.from("launches").delete().eq("workspace_id", workspace_id);

    // 3. Delete FB data
    // First get fb_connection_ids for token deletion
    const { data: fbConns } = await admin
      .from("fb_connections")
      .select("id")
      .eq("workspace_id", workspace_id);

    if (fbConns && fbConns.length > 0) {
      const connIds = fbConns.map((c) => c.id);
      await admin.from("fb_tokens").delete().in("fb_connection_id", connIds);
    }

    await admin
      .from("fb_ad_accounts")
      .delete()
      .eq("workspace_id", workspace_id);
    await admin
      .from("fb_business_managers")
      .delete()
      .eq("workspace_id", workspace_id);
    await admin
      .from("fb_connections")
      .delete()
      .eq("workspace_id", workspace_id);

    // 4. Delete team invites and activity logs
    await admin.from("team_invites").delete().eq("workspace_id", workspace_id);
    await admin.from("activity_logs").delete().eq("workspace_id", workspace_id);

    // 5. Delete workspace_users
    await admin
      .from("workspace_users")
      .delete()
      .eq("workspace_id", workspace_id);

    // 6. Delete workspace
    await admin.from("workspaces").delete().eq("id", workspace_id);

    // 7. Delete profiles for all users
    if (userIds.length > 0) {
      await admin.from("profiles").delete().in("id", userIds);
    }

    // 8. FINAL STEP: Delete auth users
    for (const userId of userIds) {
      try {
        await admin.auth.admin.deleteUser(userId);
      } catch (err) {
        console.error(`Failed to delete auth user ${userId}:`, err);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("workspace-delete error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
