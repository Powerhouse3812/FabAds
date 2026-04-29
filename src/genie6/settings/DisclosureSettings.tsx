import { Link } from "react-router-dom";
import { ChevronLeft, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DISCLOSURE_LABELS,
  useDisclosurePref,
  type DisclosurePref,
} from "../lib/disclosurePref";

/**
 * Disclosure preference settings (Track 4.10 — C2PA stamp).
 *
 * Lets the user pick when "AI-generated" disclosure stamp appears on outputs / exports.
 * Three modes per spec (Handoff_Note §15):
 *   always    — every export carries the stamp
 *   regulated — stamp only when region detected as regulated (EU / CA / India default)
 *   never     — user accepts liability
 *
 * Phase D: actual C2PA metadata embedding on file export. For now, drives a visible
 * chip on output cards + a stamp badge on download confirmations.
 */
const OPTIONS: Array<{
  value: DisclosurePref;
  description: string;
}> = [
  {
    value: "always",
    description:
      "Every download / export includes the AI-generated disclosure stamp. Maximum compliance — recommended for ad agencies handling regulated verticals.",
  },
  {
    value: "regulated",
    description:
      "Stamp appears when generating for regulated regions (EU, Canada, India default). Other regions stay clean. The safe default for most teams.",
  },
  {
    value: "never",
    description:
      "No disclosure stamp. You accept liability for not declaring AI-generated content. Use only when your jurisdiction does not require it.",
  },
];

export function DisclosureSettings() {
  const { pref, setPref } = useDisclosurePref();

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <Link
        to="/iq/genie6/settings"
        className="mb-4 inline-flex items-center gap-1 font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary hover:text-g6-text"
      >
        <ChevronLeft className="h-3 w-3" /> Settings
      </Link>

      <header className="mb-6 flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-g6-card bg-g6-primary-bg">
          <ShieldCheck className="h-5 w-5 text-g6-primary" />
        </div>
        <div>
          <h1 className="font-g6-sans text-g6-h2 font-bold text-g6-text">
            AI disclosure
          </h1>
          <p className="mt-1 text-g6-base text-g6-text-secondary">
            When should the "AI-generated" stamp appear on outputs and exports?
          </p>
        </div>
      </header>

      <ul className="space-y-2">
        {OPTIONS.map((opt) => {
          const active = pref === opt.value;
          return (
            <li key={opt.value}>
              <button
                type="button"
                onClick={() => setPref(opt.value)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-g6-card border bg-g6-bg-container p-4 text-left transition-all",
                  active
                    ? "border-g6-primary shadow-g6-md"
                    : "border-g6-border-secondary hover:border-g6-border"
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                    active
                      ? "border-g6-primary bg-g6-primary"
                      : "border-g6-border bg-g6-bg-base"
                  )}
                >
                  {active && (
                    <span className="block h-1.5 w-1.5 rounded-full bg-g6-text-on-accent" />
                  )}
                </span>
                <div className="flex-1 space-y-1">
                  <p className="text-g6-base font-semibold text-g6-text">
                    {DISCLOSURE_LABELS[opt.value]}
                  </p>
                  <p className="text-g6-sm text-g6-text-secondary leading-relaxed">
                    {opt.description}
                  </p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      <section className="mt-8 rounded-g6-base border border-g6-border-secondary bg-g6-bg-container p-4">
        <p className="font-g6-mono text-g6-xs uppercase tracking-wider text-g6-text-tertiary">
          About the stamp
        </p>
        <p className="mt-2 text-g6-sm text-g6-text-secondary leading-relaxed">
          Genie 6 follows{" "}
          <a
            href="https://c2pa.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-g6-primary underline-offset-2 hover:underline"
          >
            C2PA
          </a>
          's content provenance standard. Stamped exports carry tamper-evident metadata
          (creator, AI model, generation date) so downstream platforms can verify.
        </p>
      </section>
    </div>
  );
}
