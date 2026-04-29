import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { ArrowUpRight, ChevronRight, Building2, Globe, Upload, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { brands, categories, avatars, voices } from "../mocks";
import { DotGridPattern } from "../components/DotGridPattern";

const SECTIONS = [
  {
    to: "/iq/genie6/settings/brands",
    label: "Brand Settings",
    description: "Profiles · fonts + colors + voice + USPs · compliance per brand × category · competitors",
    countLabel: "brands",
    getCount: () => brands.length,
  },
  {
    to: "/iq/genie6/settings/categories",
    label: "Category Settings",
    description: "Knowledge bases · reference URLs · winner creatives · feedback log · similar categories",
    countLabel: "categories",
    getCount: () => categories.length,
  },
  {
    to: "/iq/genie6/settings/avatars",
    label: "Avatar Library",
    description: "Personas for UGC Video mode. Indian + global demographics seeded.",
    countLabel: "avatars",
    getCount: () => avatars.length,
  },
  {
    to: "/iq/genie6/settings/voices",
    label: "Voice Library",
    description: "Voice samples per language. Match to avatar + audience for UGC.",
    countLabel: "voices",
    getCount: () => voices.length,
  },
  {
    to: "/iq/genie6/settings/templates",
    label: "Templates",
    description: "Visual layouts saved from winning ads. Apply on future generations.",
    countLabel: "templates",
    getCount: () => 0,
  },
  {
    to: "/iq/genie6/settings/disclosure",
    label: "AI disclosure",
    description: "When the AI-generated stamp appears on exports — Always · Regulated regions · Never (C2PA standard).",
    countLabel: "",
    getCount: () => 0,
  },
] as const;

export function SettingsHub() {
  const [searchParams] = useSearchParams();
  if (searchParams.get("empty") === "1") return <SettingsZeroData />;

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <header className="mb-8">
        <p className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">
          settings
        </p>
        <h1 className="mt-1 font-g6-sans text-g6-h2 font-bold text-g6-text">
          Profiles & libraries
        </h1>
        <p className="mt-1 text-g6-base text-g6-text-secondary">
          Brand identity, category knowledge bases, avatar + voice libraries, layout templates.
        </p>
      </header>

      <ul className="space-y-2">
        {SECTIONS.map((s) => (
          <li key={s.to}>
            <Link
              to={s.to}
              className="group flex items-center gap-4 rounded-g6-card border border-g6-border-secondary bg-g6-bg-container p-4 transition-colors hover:border-g6-primary-border hover:bg-g6-primary-bg"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-g6-sans text-g6-lg font-semibold text-g6-text">
                    {s.label}
                  </h2>
                  <span className="font-g6-mono text-g6-xs text-g6-text-tertiary">
                    {s.getCount()} {s.countLabel}
                  </span>
                </div>
                <p className="mt-1 text-g6-sm text-g6-text-secondary">{s.description}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-g6-text-tertiary transition-transform group-hover:translate-x-0.5 group-hover:text-g6-text" />
            </Link>
          </li>
        ))}
        <li>
          <a
            href="/dashboard"
            className="group flex items-center gap-4 rounded-g6-card border border-g6-border-secondary bg-g6-bg-base p-4 transition-colors hover:bg-g6-bg-container"
          >
            <div className="flex-1">
              <h2 className="font-g6-sans text-g6-lg font-semibold text-g6-text">Account · Plan · Billing</h2>
              <p className="mt-1 text-g6-sm text-g6-text-secondary">Managed in FabAds settings.</p>
            </div>
            <ArrowUpRight className="h-4 w-4 text-g6-text-tertiary group-hover:text-g6-text" />
          </a>
        </li>
      </ul>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Zero-data state (Track 4.9)
   ───────────────────────────────────────────────────────── */
function SettingsZeroData() {
  const navigate = useNavigate();
  return (
    <div className="relative flex min-h-full flex-col">
      <DotGridPattern />
      <div className="relative z-10 mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-16">
        <header className="space-y-2 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-g6-2xl bg-g6-primary-bg">
            <Building2 className="h-7 w-7 text-g6-primary" />
          </div>
          <h1 className="font-g6-sans text-g6-h1 font-black tracking-[-0.025em] text-g6-text">
            No brands configured
          </h1>
          <p className="text-g6-base text-g6-text-secondary max-w-md mx-auto">
            Add a brand to start generating ads tailored to its voice, products, and audience.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { Icon: Globe, label: "Fetch by URL", sub: "Paste your brand site", featured: true },
            { Icon: Upload, label: "Upload CSV", sub: "Bulk import brands" },
            { Icon: Building2, label: "Manual entry", sub: "Form-led" },
            { Icon: Sparkles, label: "Try a demo", sub: "Mamaearth pre-loaded" },
          ].map((it) => (
            <button
              key={it.label}
              type="button"
              onClick={() => navigate("/iq/genie6/settings/brands")}
              className={cn(
                "g6-lift flex flex-col items-start gap-2 rounded-g6-xl border bg-g6-bg-container p-4 text-left",
                it.featured ? "border-g6-primary-border shadow-g6-md" : "border-g6-border-secondary"
              )}
            >
              <it.Icon className="h-4 w-4 text-g6-text-secondary" />
              <span className="text-g6-base font-bold text-g6-text">{it.label}</span>
              <span className="text-g6-xs text-g6-text-tertiary">{it.sub}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
