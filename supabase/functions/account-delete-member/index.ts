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
    const targetUserId = body?.user_id;
    if (!targetUserId || typeof targetUserId !== "string") {
      return new Response(JSON.stringify({ error: "Missing user_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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

    // Verify target is in same workspace
    const { data: targetMembership } = await admin
      .from("workspace_users")
      .select("role")
      .eq("user_id", targetUserId)
      .eq("workspace_id", workspace_id)
      .single();

    if (!targetMembership) {
      return new Response(
        JSON.stringify({ error: "Target user not in workspace" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Block if target is last admin/owner
    const targetIsAdmin =
      targetMembership.role === "owner" || targetMembership.role === "admin";
    if (targetIsAdmin) {
      const { data: allAdmins } = await admin
        .from("workspace_users")
        .select("user_id")
        .eq("workspace_id", workspace_id)
        .in("role", ["owner", "admin"]);

      if ((allAdmins ?? []).length <= 1) {
        return new Response(
          JSON.stringify({ error: "Cannot remove the last admin" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Get target profile for log
    const { data: targetProfile } = await admin
      .from("profiles")
      .select("email")
      .eq("id", targetUserId)
      .single();

    // Write activity log BEFORE deletion
    await admin.from("activity_logs").insert({
      workspace_id,
      user_id: caller.id,
      action: "user_removed_by_admin",
      target_email: targetProfile?.email ?? "",
      metadata: {},
    });

    // Delete workspace_users
    await admin
      .from("workspace_users")
      .delete()
      .eq("user_id", targetUserId)
      .eq("workspace_id", workspace_id);

    // Delete profile
    await admin.from("profiles").delete().eq("id", targetUserId);

    // Delete auth user (FINAL STEP)
    const { error: deleteError } = await admin.auth.admin.deleteUser(
      targetUserId
    );
    if (deleteError) {
      console.error("Failed to delete auth user:", deleteError);
      return new Response(
        JSON.stringify({ error: "Failed to delete user account" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("account-delete-member error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
