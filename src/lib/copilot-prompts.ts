// Module-specific quick action definitions
export type CopilotModule =
  | "creative_library"
  | "insights"
  | "launch"
  | "reports"
  | "dashboard"
  | "rrm"
  | "campaign_urls"
  | "settings"
  | "default";

export interface QuickAction {
  label: string;
  prompt: string;
  icon?: string;
}

export const MODULE_QUICK_ACTIONS: Record<CopilotModule, QuickAction[]> = {
  creative_library: [
    { label: "Analyze creatives", prompt: "Analyze my creatives performance and suggest improvements" },
    { label: "Generate copy", prompt: "Write compelling primary text, headline, and description for a Facebook ad" },
    { label: "Suggest A/B tests", prompt: "Suggest A/B test ideas based on my current creatives" },
  ],
  insights: [
    { label: "Summarize", prompt: "Summarize the key trends and patterns from the competitor ads I'm looking at" },
    { label: "Ad angles", prompt: "Extract the main hooks and angles used in these competitor ads" },
    { label: "Create concepts", prompt: "Based on industry trends, suggest 3 creative ad concepts I could test" },
  ],
  launch: [
    { label: "Fill missing", prompt: "Help me fill in the missing fields for this launch" },
    { label: "Generate copy", prompt: "Generate ad copy for all my ads in this launch" },
    { label: "Validate", prompt: "Review my launch setup and flag any issues or missing fields" },
    { label: "Fix errors", prompt: "Help me fix the validation errors in my current launch" },
  ],
  reports: [
    { label: "What changed?", prompt: "Analyze my recent performance data and explain what changed" },
    { label: "Scale recommendations", prompt: "Which campaigns should I scale up based on performance?" },
    { label: "Stop recommendations", prompt: "Which campaigns or ads should I stop based on poor performance?" },
  ],
  dashboard: [
    { label: "Daily summary", prompt: "Give me a daily performance summary across all my accounts" },
    { label: "Action items", prompt: "What are the top action items I should focus on today?" },
    { label: "Anomalies", prompt: "Detect any anomalies or unusual changes in my recent metrics" },
  ],
  rrm: [
    { label: "Explain status", prompt: "Explain the current health status of my ad accounts" },
    { label: "Suggest actions", prompt: "What actions should I take to improve my account health?" },
  ],
  campaign_urls: [
    { label: "Optimize structure", prompt: "Suggest optimal campaign structure for my campaign URLs" },
    { label: "Generate copy", prompt: "Generate ad copy variations for my campaign URL ads" },
  ],
  settings: [],
  default: [
    { label: "Daily summary", prompt: "Give me a daily performance summary" },
    { label: "Generate copy", prompt: "Help me write Facebook ad copy" },
    { label: "Action items", prompt: "What should I focus on today based on my accounts?" },
  ],
};

export function deriveModuleFromPath(pathname: string): CopilotModule {
  if (pathname.startsWith("/iq/creative-library")) return "creative_library";
  if (pathname.startsWith("/iq/genie")) return "creative_library";
  if (pathname.startsWith("/insights")) return "insights";
  if (pathname.startsWith("/launch")) return "launch";
  if (pathname.startsWith("/reports")) return "reports";
  if (pathname.startsWith("/dashboard")) return "dashboard";
  if (pathname.startsWith("/rrm")) return "rrm";
  if (pathname.startsWith("/launch/campaign-urls") || pathname.startsWith("/offers")) return "campaign_urls";
  if (pathname.startsWith("/ums") || pathname.startsWith("/settings") || pathname.startsWith("/integrations")) return "settings";
  return "default";
}
