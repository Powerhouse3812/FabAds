import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get auth user from JWT
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { launch_id } = await req.json();
    if (!launch_id) {
      return new Response(JSON.stringify({ error: "launch_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Fetch launch and verify workspace membership
    const { data: launch, error: launchErr } = await supabase.from("launches").select("*").eq("id", launch_id).single();
    if (launchErr || !launch) {
      return new Response(JSON.stringify({ error: "Launch not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: membership } = await supabase.rpc("is_workspace_member", { _user_id: user.id, _workspace_id: launch.workspace_id });
    if (!membership) {
      return new Response(JSON.stringify({ error: "Access denied" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Set in_progress
    await supabase.from("launches").update({ status: "executing" }).eq("id", launch_id);

    // Simulate processing
    await new Promise((r) => setTimeout(r, 2000 + Math.random() * 1000));

    // Check if name contains "fail" for error simulation
    const shouldFail = launch.name.toLowerCase().includes("fail");

    if (shouldFail) {
      await supabase.from("launches").update({ status: "failed" }).eq("id", launch_id);
      await supabase.from("activity_logs").insert({
        workspace_id: launch.workspace_id,
        user_id: user.id,
        action: "launch_failed",
        target_email: user.email || "",
        metadata: { launch_id, launch_name: launch.name },
      });
      return new Response(JSON.stringify({ status: "failed", launch_id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Success
    const launchConfig = launch.launch_config || {};
    await supabase.from("launches").update({
      status: "success",
      launch_config: { ...launchConfig, launched_at: new Date().toISOString() },
    }).eq("id", launch_id);

    await supabase.from("activity_logs").insert({
      workspace_id: launch.workspace_id,
      user_id: user.id,
      action: "launch_executed",
      target_email: user.email || "",
      metadata: { launch_id, launch_name: launch.name },
    });

    return new Response(JSON.stringify({ status: "success", launch_id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
