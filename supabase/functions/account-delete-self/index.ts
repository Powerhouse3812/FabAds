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

    // Anon client to get caller identity
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

    // Service role client for privileged operations
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get caller's workspace membership
    const { data: membership } = await admin
      .from("workspace_users")
      .select("workspace_id, role")
      .eq("user_id", caller.id)
      .limit(1)
      .single();

    if (!membership) {
      return new Response(JSON.stringify({ error: "No workspace membership found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { workspace_id, role } = membership;
    const isAdmin = role === "owner" || role === "admin";

    // Parse optional body
    let promoteUserId: string | null = null;
    try {
      const body = await req.json();
      promoteUserId = body?.promote_user_id ?? null;
    } catch {
      // No body is fine for members
    }

    if (isAdmin) {
      // Count other admins/owners
      const { data: allMembers } = await admin
        .from("workspace_users")
        .select("user_id, role")
        .eq("workspace_id", workspace_id);

      const otherAdmins = (allMembers ?? []).filter(
        (m) => m.user_id !== caller.id && (m.role === "owner" || m.role === "admin")
      );
      const otherMembers = (allMembers ?? []).filter(
        (m) => m.user_id !== caller.id
      );

      if (otherMembers.length === 0) {
        return new Response(
          JSON.stringify({
            error: "SOLE_USER",
            message: "You are the only user. Delete the workspace instead.",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      if (otherAdmins.length === 0) {
        // Last admin — need promotion
        if (!promoteUserId) {
          const promotable = otherMembers.map((m) => m.user_id);
          return new Response(
            JSON.stringify({
              error: "PROMOTE_REQUIRED",
              message: "You are the last admin. Select a member to promote.",
              promotable_user_ids: promotable,
            }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Validate promote target is in workspace
        const validTarget = otherMembers.find((m) => m.user_id === promoteUserId);
        if (!validTarget) {
          return new Response(
            JSON.stringify({ error: "Invalid promote_user_id" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // Promote
        await admin
          .from("workspace_users")
          .update({ role: "admin" })
          .eq("user_id", promoteUserId)
          .eq("workspace_id", workspace_id);

        // Get promoted user email for log
        const { data: promotedProfile } = await admin
          .from("profiles")
          .select("email")
          .eq("id", promoteUserId)
          .single();

        await admin.from("activity_logs").insert({
          workspace_id,
          user_id: caller.id,
          action: "member_promoted",
          target_email: promotedProfile?.email ?? "",
          metadata: { new_role: "admin" },
        });
      }
    }

    // Get caller profile for log
    const { data: callerProfile } = await admin
      .from("profiles")
      .select("email")
      .eq("id", caller.id)
      .single();

    // Write activity log BEFORE deletion
    await admin.from("activity_logs").insert({
      workspace_id,
      user_id: caller.id,
      action: "user_self_deleted",
      target_email: callerProfile?.email ?? "",
      metadata: {},
    });

    // Delete workspace_users
    await admin
      .from("workspace_users")
      .delete()
      .eq("user_id", caller.id)
      .eq("workspace_id", workspace_id);

    // Delete profile
    await admin.from("profiles").delete().eq("id", caller.id);

    // Delete auth user (FINAL STEP)
    const { error: deleteError } = await admin.auth.admin.deleteUser(caller.id);
    if (deleteError) {
      console.error("Failed to delete auth user:", deleteError);
      return new Response(
        JSON.stringify({ error: "Failed to delete account" }),
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
    console.error("account-delete-self error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
