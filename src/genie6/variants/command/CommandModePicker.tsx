import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, ArrowUpRight, Activity, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { modeConfigs } from "../../generate/modeConfigs";
import { MicroMotif } from "../../components/MicroMotif";
import { HeroPromptInput } from "../../components/HeroPromptInput";
import type { ModeId } from "../../types/output";

/**
 * Command variant — Mode picker (Generate index).
 *
 * Ops dashboard mental model: compact hero prompt up top, mode picker as
 * dense table with usage stats per mode, right rail with recent generations.
 * Mercury banking / Linear vibe.
 */

// Mock per-mode usage stats — would come from analytics in real life.
const MODE_STATS: Record<ModeId, { lastUsed: string; gens: number; avgCtr: string }> = {
  "brand-ad":     { lastUsed: "2h ago",  gens: 184, avgCtr: "3.21%" },
  "product-ad":   { lastUsed: "8m ago",  gens: 412, avgCtr: "4.73%" },
  "affiliate-ad": { lastUsed: "1d ago",  gens: 96,  avgCtr: "2.88%" },
  "ugc-video":    { lastUsed: "5h ago",  gens: 142, avgCtr: "5.18%" },
  "forge":        { lastUsed: "3h ago",  gens: 68,  avgCtr: "3.92%" },
  "image-to-ad":  { lastUsed: "1d ago",  gens: 52,  avgCtr: "2.64%" },
};

export function CommandModePicker() {
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState("");

  const goMode = (mode: ModeId) => navigate(`/iq/genie6/generate/${mode}`);
  const handlePromptSubmit = () => {
    if (!prompt.trim()) return;
    navigate("/iq/genie6/generate/product-ad");
  };

  return (
    <div className="grid h-full grid-cols-[1fr_300px] gap-3 p-3">
      {/* MAIN */}
      <main className="flex flex-col overflow-hidden rounded-g6-base border border-g6-border bg-g6-bg-container">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-g6-border-secondary bg-g6-bg-base px-5 py-3">
          <div>
            <p className="font-g6-mono text-g6-xs uppercase tracking-[0.18em] text-g6-text-tertiary">
              new generation · operator
            </p>
            <h1 className="text-g6-h4 font-bold text-g6-text">What do you want to make?</h1>
          </div>
          <div className="flex items-center gap-2 font-g6-mono text-g6-xs text-g6-text-tertiary uppercase tracking-wider">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-g6-success" />
            {modeConfigs.length} modes · ready
          </div>
        </header>

        {/* Compact prompt input */}
        <div className="border-b border-g6-border-secondary bg-g6-bg-base px-5 py-4">
          <HeroPromptInput
            value={prompt}
            onChange={setPrompt}
            onSubmit={handlePromptSubmit}
            placeholder="paste a URL or describe the generation — AI auto-categorizes"
          />
        </div>

        {/* Mode picker as table */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-g6-base font-semibold text-g6-text">Or pick a mode directly</h2>
              <span className="font-g6-mono text-g6-xs text-g6-text-tertiary">last 30 days · per mode</span>
            </div>

            <div className="rounded-g6-base border border-g6-border-secondary overflow-hidden">
              <table className="w-full text-g6-sm">
                <thead className="bg-g6-bg-base">
                  <tr className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">
                    <th className="px-3 py-2 text-left font-normal">Mode</th>
                    <th className="px-3 py-2 text-left font-normal">Description</th>
                    <th className="px-3 py-2 text-right font-normal">Gens</th>
                    <th className="px-3 py-2 text-right font-normal">Avg CTR</th>
                    <th className="px-3 py-2 text-right font-normal">Last used</th>
                    <th className="w-10 px-2 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-g6-border-secondary">
                  {modeConfigs.map((cfg) => {
                    const stats = MODE_STATS[cfg.id];
                    return (
                      <tr
                        key={cfg.id}
                        onClick={() => goMode(cfg.id)}
                        className="group cursor-pointer hover:bg-g6-bg-spotlight transition-colors"
                      >
                        <td className="px-3 py-3 flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-g6-base bg-g6-bg-spotlight group-hover:bg-g6-primary-bg transition-colors">
                            <MicroMotif mode={cfg.id} size={18} />
                          </div>
                          <span className="font-medium text-g6-text">{cfg.label}</span>
                        </td>
                        <td className="px-3 py-3 text-g6-text-secondary text-g6-xs max-w-md truncate">
                          {cfg.description}
                        </td>
                        <td className="px-3 py-3 text-right font-g6-mono tabular-nums text-g6-text">{stats.gens}</td>
                        <td className="px-3 py-3 text-right font-g6-mono tabular-nums text-g6-text">{stats.avgCtr}</td>
                        <td className="px-3 py-3 text-right font-g6-mono text-g6-xs text-g6-text-tertiary">{stats.lastUsed}</td>
                        <td className="px-2 py-3"><ArrowUpRight className="h-3.5 w-3.5 text-g6-text-tertiary group-hover:text-g6-primary" /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* RIGHT rail — recent activity */}
      <aside className="flex flex-col overflow-hidden rounded-g6-base border border-g6-border bg-g6-bg-container">
        <header className="flex items-center justify-between border-b border-g6-border-secondary bg-g6-bg-base px-4 py-3">
          <div className="flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-g6-primary" />
            <p className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">
              Recent prompts
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/iq/genie6/library")}
            className="text-g6-xs text-g6-text-tertiary hover:text-g6-text"
          >
            All →
          </button>
        </header>
        <ul className="flex-1 divide-y divide-g6-border-secondary overflow-y-auto">
          {[
            { text: "12 product ads for Mamaearth Onion Shampoo", mode: "Product Ad", ago: "2h" },
            { text: "UGC video script with Priya for Boat Airdopes", mode: "UGC Video", ago: "5h" },
            { text: "Forge 10 variants from my best winner", mode: "Variants", ago: "1d" },
            { text: "Festival edit for Sleepyhead", mode: "Brand Ad", ago: "1d" },
            { text: "Comparison adcopy: Noise vs Boat", mode: "Affiliate Ad", ago: "2d" },
          ].map((p, i) => (
            <li key={i} className="px-4 py-3 hover:bg-g6-bg-spotlight cursor-pointer transition-colors" onClick={() => setPrompt(p.text)}>
              <p className="text-g6-sm text-g6-text leading-snug line-clamp-2">{p.text}</p>
              <div className="flex items-center justify-between mt-1">
                <span className="font-g6-mono text-g6-xs text-g6-text-tertiary uppercase tracking-wider">{p.mode}</span>
                <span className="font-g6-mono text-g6-xs text-g6-text-tertiary">{p.ago} ago</span>
              </div>
            </li>
          ))}
        </ul>
        <footer className="border-t border-g6-border-secondary bg-g6-bg-base px-4 py-3">
          <button
            type="button"
            onClick={() => navigate("/iq/genie6/library")}
            className="inline-flex items-center gap-1.5 text-g6-xs text-g6-text-secondary hover:text-g6-text"
          >
            <Plus className="h-3 w-3" />
            View all generations
          </button>
        </footer>
      </aside>
    </div>
  );
}
