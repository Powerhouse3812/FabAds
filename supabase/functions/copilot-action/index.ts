import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Auth check with anon client
    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await anonClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Service role client for mutations
    const supabase = createClient(supabaseUrl, serviceKey);

    const { action_type, params, workspace_id } = await req.json();

    if (!action_type || !workspace_id) {
      return new Response(JSON.stringify({ error: "action_type and workspace_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user is workspace member
    const { data: membership } = await supabase
      .from("workspace_users")
      .select("id")
      .eq("user_id", user.id)
      .eq("workspace_id", workspace_id)
      .single();

    if (!membership) {
      return new Response(JSON.stringify({ error: "Not a workspace member" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let result: any = { success: true };

    switch (action_type) {
      case "save_generated_image": {
        // Save a base64 image to creative-assets bucket
        const { base64_data, file_name } = params;
        if (!base64_data || !file_name) {
          return new Response(JSON.stringify({ error: "base64_data and file_name required" }), {
            status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const base64Clean = base64_data.replace(/^data:image\/\w+;base64,/, "");
        const bytes = Uint8Array.from(atob(base64Clean), (c) => c.charCodeAt(0));
        const ext = file_name.split(".").pop() || "png";
        const contentType = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : "image/png";
        const storagePath = `${workspace_id}/copilot/${crypto.randomUUID()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("creative-assets")
          .upload(storagePath, bytes, { contentType });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          return new Response(JSON.stringify({ error: "Failed to save image" }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { data: urlData } = supabase.storage
          .from("creative-assets")
          .getPublicUrl(storagePath);

        // Insert into creative_assets table
        const { data: asset, error: assetError } = await supabase
          .from("creative_assets")
          .insert({
            workspace_id,
            file_name,
            file_type: contentType.startsWith("image/") ? "image" : "video",
            storage_path: storagePath,
            url: urlData.publicUrl,
            uploaded_by: user.id,
          })
          .select()
          .single();

        if (assetError) {
          console.error("Asset insert error:", assetError);
        }

        result = { success: true, url: urlData.publicUrl, asset_id: asset?.id };
        break;
      }

      case "generate_ad_copy": {
        // Use AI to generate ad copy variations
        const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
        if (!LOVABLE_API_KEY) {
          return new Response(JSON.stringify({ error: "AI not configured" }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { prompt, count = 3 } = params;
        const copyResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              {
                role: "system",
                content: `You are an expert Facebook ad copywriter. Generate exactly ${count} variations. Return JSON.`,
              },
              { role: "user", content: prompt },
            ],
            tools: [{
              type: "function",
              function: {
                name: "return_ad_copy",
                description: "Return generated ad copy variations",
                parameters: {
                  type: "object",
                  properties: {
                    variations: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          primary_text: { type: "string" },
                          headline: { type: "string" },
                          description: { type: "string" },
                          cta: { type: "string" },
                        },
                        required: ["primary_text", "headline"],
                      },
                    },
                  },
                  required: ["variations"],
                },
              },
            }],
            tool_choice: { type: "function", function: { name: "return_ad_copy" } },
          }),
        });

        if (!copyResponse.ok) {
          const t = await copyResponse.text();
          console.error("Copy gen error:", t);
          result = { success: false, error: "Failed to generate copy" };
        } else {
          const copyData = await copyResponse.json();
          const toolCall = copyData.choices?.[0]?.message?.tool_calls?.[0];
          if (toolCall) {
            result = { success: true, data: JSON.parse(toolCall.function.arguments) };
          } else {
            result = { success: true, data: { variations: [] } };
          }
        }
        break;
      }

      default:
        result = { success: false, error: `Unknown action: ${action_type}` };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("copilot-action error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
