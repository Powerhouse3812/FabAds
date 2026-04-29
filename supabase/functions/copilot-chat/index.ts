import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/* ── Module-specific system prompts ── */
const MODULE_PROMPTS: Record<string, string> = {
  creative_library: `You are Co-pilot, an AI assistant for FabAds — a Facebook ad management platform.
The user is currently in the Creative Library module. You can help with:
- Generating ad copy (primary text, headlines, descriptions)
- Suggesting creative variations
- Analyzing ad creatives
- Recommending CTAs and hooks
- Generating images for ads (ask the user to describe what they want)
When generating ad copy, always provide multiple options. Format copy suggestions clearly with labels like "Primary Text:", "Headline:", "Description:".`,

  insights: `You are Co-pilot, an AI assistant for FabAds.
The user is in the Industry Insights module. You can help with:
- Summarizing competitor ad strategies
- Extracting hooks and angles from competitor ads
- Generating ad concepts inspired by industry trends
- Recommending creative directions based on what's working in their industry`,

  launch: `You are Co-pilot, an AI assistant for FabAds.
The user is in the Launch module. You can help with:
- Suggesting campaign structures (Campaign:Adset:Ad ratios)
- Generating ad copy for launch
- Validating launch setup
- Recommending targeting strategies
- Filling in missing fields with smart defaults`,

  reports: `You are Co-pilot, an AI assistant for FabAds.
The user is in the Reports module. You can help with:
- Explaining performance metrics and trends
- Identifying anomalies and changes
- Recommending scaling or stopping actions
- Summarizing campaign performance`,

  dashboard: `You are Co-pilot, an AI assistant for FabAds.
The user is on the Dashboard. You can help with:
- Providing daily performance summaries
- Identifying action items
- Detecting anomalies across accounts
- Recommending optimization actions`,

  rrm: `You are Co-pilot, an AI assistant for FabAds.
The user is in the RRM (Rejection Rate Manager) module. You can help with:
- Explaining account health status
- Recommending actions to reduce rejection rates
- Suggesting dilution/replacement strategies`,

  default: `You are Co-pilot, an AI assistant for FabAds — a Facebook ad management platform.
You help users with campaign management, creative generation, performance analysis, and optimization.
Be concise, actionable, and specific. When generating ad copy, provide multiple options.
You can also generate images when asked — describe what you'd create and offer to generate it.`,
};

function buildSystemPrompt(context: any): string {
  const module = context?.module || "default";
  const base = MODULE_PROMPTS[module] || MODULE_PROMPTS.default;

  const parts = [base];

  if (context?.selectedItems?.length) {
    parts.push(`\nThe user has ${context.selectedItems.length} item(s) selected in their current view.`);
  }
  if (context?.filters) {
    parts.push(`\nActive filters: ${JSON.stringify(context.filters)}`);
  }

  parts.push(`\nIMPORTANT RULES:
- Be concise and actionable
- When generating ad copy, provide 3-5 variations
- Format responses with markdown for readability
- If the user asks to generate an image, tell them you'll generate it and describe what you'll create
- Never make up performance data — only analyze data the user provides
- When suggesting actions, be specific about what to change and why`);

  return parts.join("\n");
}

serve(async (req) => {
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

    // Verify user via Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { messages, context, conversation_id, generate_image, settings: genSettings } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Image generation mode
    if (generate_image) {
      // Messages may contain multimodal content (text + image_url) for editing/variations
      const imgModel = genSettings?.model && genSettings.model !== "auto"
        ? genSettings.model
        : "google/gemini-3.1-flash-image-preview";

      const imgResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: imgModel,
          messages,
          modalities: ["image", "text"],
        }),
      });

      if (!imgResponse.ok) {
        const status = imgResponse.status;
        if (status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (status === 402) {
          return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        const t = await imgResponse.text();
        console.error("Image gen error:", status, t);
        return new Response(JSON.stringify({ error: "Image generation failed" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const imgData = await imgResponse.json();
      return new Response(JSON.stringify(imgData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Text chat with streaming
    const systemPrompt = buildSystemPrompt(context);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("copilot-chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
