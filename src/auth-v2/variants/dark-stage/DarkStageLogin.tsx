import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  PauseCircle,
  ArrowRightLeft,
  CheckCircle2,
  FileText,
  ShieldCheck,
  Repeat2,
  UserPlus,
  type LucideIcon,
} from "lucide-react";

import type { SelectablePlanId, BillingCycle } from "@/components/auth/signup/plans";
import { AUTH_V2_LOGIN_COPY } from "@/auth-v2/shared/copy";
import heroLogo from "@/assets/auth/hero-logo.svg";
import HeroBento from "@/auth-v2/variants/dark-stage/heroes/HeroBento";
import HeroPhotoStats from "@/auth-v2/variants/dark-stage/heroes/HeroPhotoStats";
import HeroGradientArt from "@/auth-v2/variants/dark-stage/heroes/HeroGradientArt";
import HeroRadarCards from "@/auth-v2/variants/dark-stage/heroes/HeroRadarCards";
import HeroProductPeek from "@/auth-v2/variants/dark-stage/heroes/HeroProductPeek";

/**
 * Hero-panel sub-variants — 5 directions built from Maalik's reference
 * moodboard (2026-07-15) plus the original circuit-hub. Dev-only picker
 * (bottom-left pill) persisted via localStorage, mirrors the A/B
 * VariantToggle pattern. Right/form side never changes.
 */
type DarkStageHero = "hub" | "bento" | "photo" | "art" | "radar" | "peek";
const HERO_KEY = "fabads-darkstage-hero";
const HERO_OPTIONS: { key: DarkStageHero; label: string }[] = [
  { key: "hub", label: "Hub" },
  { key: "bento", label: "Bento" },
  { key: "photo", label: "Photo" },
  { key: "art", label: "Art" },
  { key: "radar", label: "Radar" },
  { key: "peek", label: "Peek" },
];

function readHero(): DarkStageHero {
  if (typeof window === "undefined") return "hub";
  const v = window.localStorage.getItem(HERO_KEY);
  return HERO_OPTIONS.some((o) => o.key === v) ? (v as DarkStageHero) : "hub";
}

export interface AuthV2CommonProps {
  view: "login" | "signup";
  onViewChange: (next: "login" | "signup") => void;
  accountType: "individual" | "agency";
  onAccountTypeChange: (next: "individual" | "agency") => void;
  planId: SelectablePlanId;
  billing: BillingCycle;
}

const COPY = AUTH_V2_LOGIN_COPY;

const INPUT_BASE =
  "w-full rounded-[28px] border border-border bg-card px-10 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary-text focus:shadow-[0_0_0_3px_hsl(var(--primary)/0.18)]";

/** Small overlapping avatar-initials stack for the brag stat, tone pattern
 *  lifted verbatim from Concept05IridescentAI.tsx's AVATARS (lime-family +
 *  neutral, calm human-trust signal — not the holographic identity). */
const AVATARS = [
  { initials: "RA", className: "bg-primary text-primary-foreground" },
  { initials: "MK", className: "bg-primary/45 text-foreground" },
  { initials: "SJ", className: "bg-muted-foreground/30 text-foreground" },
];

/** "Live activity" feed data for the hero panel's empty middle area —
 *  replaces the old circuit-hub-and-satellites illustration (2026-07-15,
 *  client feedback: hub read as "boringest" concept, no real content) with
 *  a vertical timeline of real FabAds events: AutoPilot decisions, budget
 *  moves, creative generation, alerts, reporting. FEED_BASE seeds the
 *  initial 5 rows (oldest at the bottom, all inside "the last hour").
 *  FEED_ROTATION is a small pool of additional canned events that take
 *  turns prepending to the top of the feed every ~6s (see the rotation
 *  effect in the component below) — each entrant pushes the oldest row out
 *  the bottom, both ends cross-fading via keyed mount/unmount so the feed
 *  reads as continuously live rather than a static list. `tone` drives both
 *  the line-dot color and the icon-chip tint: "auto" = lime (automated /
 *  positive), "info" = neutral (purely informational, e.g. a report being
 *  ready). */
type FeedTone = "auto" | "info";

interface FeedEvent {
  Icon: LucideIcon;
  tone: FeedTone;
  text: JSX.Element;
}

/** Bolds the one key term (campaign name, dollar figure, etc.) inside a
 *  feed row's description — a plain-text emphasis, not a design-token
 *  color swap, so it stays legible against either tone's icon chip. */
function FeedTerm({ children }: { children: string }) {
  return <span className="font-semibold text-foreground">{children}</span>;
}

const FEED_BASE: FeedEvent[] = [
  {
    Icon: PauseCircle,
    tone: "auto",
    text: (
      <>
        AutoPilot paused <FeedTerm>Reels_creator_pack</FeedTerm> — CPA rose 22%
      </>
    ),
  },
  {
    Icon: ArrowRightLeft,
    tone: "auto",
    text: (
      <>
        Budget rebalanced: <FeedTerm>+$120</FeedTerm> to Q3_UGC_hooks_v2
      </>
    ),
  },
  {
    Icon: Sparkles,
    tone: "auto",
    text: (
      <>
        New creative variant generated for <FeedTerm>Search_brand_defense</FeedTerm>
      </>
    ),
  },
  {
    Icon: CheckCircle2,
    tone: "auto",
    text: (
      <>
        ROAS alert cleared on <FeedTerm>festive_15s</FeedTerm> — back above 2.5x
      </>
    ),
  },
  {
    Icon: FileText,
    tone: "info",
    text: (
      <>
        Weekly report ready for <FeedTerm>4 ad accounts</FeedTerm>
      </>
    ),
  },
];

const FEED_BASE_TIMES = ["2m ago", "14m ago", "31m ago", "47m ago", "58m ago"];

const FEED_ROTATION: FeedEvent[] = [
  {
    Icon: ShieldCheck,
    tone: "auto",
    text: (
      <>
        Budget guard blocked overspend on <FeedTerm>search_generic</FeedTerm>
      </>
    ),
  },
  {
    Icon: Repeat2,
    tone: "auto",
    text: (
      <>
        Bid strategy switched to Target ROAS for <FeedTerm>festive_15s</FeedTerm>
      </>
    ),
  },
  {
    Icon: UserPlus,
    tone: "info",
    text: <>New high-intent audience segment discovered</>,
  },
];

interface FeedRow extends FeedEvent {
  uid: string;
  time: string;
}

function buildInitialFeedRows(): FeedRow[] {
  return FEED_BASE.map((event, i) => ({
    ...event,
    uid: `feed-base-${i}`,
    time: FEED_BASE_TIMES[i],
  }));
}

/** Splits `full` around the first occurrence of `word` so the heading
 *  string (sourced from shared copy) can still carry the signature
 *  half-highlight behind one word without a hardcoded duplicate string.
 *  Mirrors splitAtWord/Highlight in Concept10NatureSplit.tsx. */
function splitAtWord(full: string, word: string): [string, string, string] {
  const idx = full.indexOf(word);
  if (idx === -1) return [full, "", ""];
  return [full.slice(0, idx), word, full.slice(idx + word.length)];
}

function Highlight({ children }: { children: string }) {
  return (
    <span className="relative z-0 inline-block px-0.5">
      <span
        className="darkstage-highlight-mark absolute inset-y-1 left-0 -z-10 w-full rounded-[6px] bg-primary/70"
        aria-hidden="true"
      />
      <span className="relative z-10">{children}</span>
    </span>
  );
}

/** Signature cursor-driven 3D tilt for the glass card — mirrors the
 *  technique in Concept01Spotlight.tsx (mousemove within the card's
 *  bounding rect → rotateX/rotateY, resets flat on mouseLeave) — but adds
 *  the "Dark Stage" client-requested twist: the card rests very slightly
 *  tilted at idle and permanently straightens for the session as soon as
 *  the user focuses/types into any input (hasInteracted), blending with
 *  the live mouse-tilt via a slower spring-like transition. */
function useCardTilt() {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [hasInteracted, setHasInteracted] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const MAX_DEG = 6;
    setTilt({ x: -(py - 0.5) * 2 * MAX_DEG, y: (px - 0.5) * 2 * MAX_DEG });
  };
  const handleMouseLeave = () => setTilt({ x: 0, y: 0 });
  const markInteracted = () => setHasInteracted(true);

  const idleTilt = hasInteracted ? 0 : -1.5;
  const style: CSSProperties = {
    transform: `perspective(1000px) rotate(${idleTilt}deg) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
    transition: hasInteracted
      ? "transform 380ms cubic-bezier(0.22,1,0.36,1)"
      : "transform 200ms ease-out",
  };

  return { cardRef, style, handleMouseMove, handleMouseLeave, markInteracted };
}

export default function DarkStageLogin(props: AuthV2CommonProps): JSX.Element {
  const { onViewChange } = props;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [hero, setHero] = useState<DarkStageHero>(readHero);
  const pickHero = (next: DarkStageHero) => {
    setHero(next);
    if (typeof window !== "undefined") window.localStorage.setItem(HERO_KEY, next);
  };

  const { cardRef, style: tiltStyle, handleMouseMove, handleMouseLeave, markInteracted } =
    useCardTilt();

  // cursor-tracking warm glow — rAF-lerped, writes --mx/--my directly onto
  // the ref so mousemove never triggers a React re-render (mirrors
  // Concept01Spotlight.tsx's glowLayerRef technique exactly).
  const glowLayerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    let raf = 0;
    let curX = 50;
    let curY = 50;
    let targetX = 50;
    let targetY = 50;
    const onMove = (e: globalThis.MouseEvent) => {
      const nx = e.clientX / window.innerWidth;
      const ny = e.clientY / window.innerHeight;
      targetX = 50 + (nx - 0.5) * 14;
      targetY = 50 + (ny - 0.5) * 10;
    };
    const tick = () => {
      curX += (targetX - curX) * 0.06;
      curY += (targetY - curY) * 0.06;
      const el = glowLayerRef.current;
      if (el) {
        el.style.setProperty("--mx", `${curX}%`);
        el.style.setProperty("--my", `${curY}%`);
      }
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener("mousemove", onMove);
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  // "Live activity" feed — only meaningful while the hub hero is showing.
  // Mirrors HeroRadarCards.tsx's exitingId/settleTimeout pattern: a new row
  // prepends, the oldest row is flagged "exiting" and cross-fades out, and
  // only after its exit animation finishes is it actually dropped from
  // state — so the DOM node genuinely unmounts rather than just swapping
  // text.
  const [feedRows, setFeedRows] = useState<FeedRow[]>(buildInitialFeedRows);
  const [exitingFeedUid, setExitingFeedUid] = useState<string | null>(null);
  const feedRowsRef = useRef(feedRows);
  useEffect(() => {
    feedRowsRef.current = feedRows;
  }, [feedRows]);
  const feedCycleRef = useRef(0);

  useEffect(() => {
    if (hero !== "hub") return;
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let settleTimeout: number | undefined;
    const interval = window.setInterval(() => {
      if (document.hidden) return;
      const nextEvent = FEED_ROTATION[feedCycleRef.current % FEED_ROTATION.length];
      feedCycleRef.current += 1;
      const current = feedRowsRef.current;
      const oldest = current[current.length - 1];
      const newRow: FeedRow = {
        ...nextEvent,
        uid: `feed-${Date.now()}-${feedCycleRef.current}`,
        time: "Just now",
      };

      setExitingFeedUid(oldest.uid);
      setFeedRows([newRow, ...current]);
      settleTimeout = window.setTimeout(() => {
        setFeedRows((prev) => prev.filter((row) => row.uid !== oldest.uid));
        setExitingFeedUid(null);
      }, 480);
    }, 6000);

    return () => {
      window.clearInterval(interval);
      if (settleTimeout !== undefined) window.clearTimeout(settleTimeout);
    };
  }, [hero]);

  const [headLead, headMark, headTail] = splitAtWord(COPY.heading, "Fab-Funnel");

  return (
    // "dark" forced regardless of app theme — Dark Stage's identity is a
    // fixed dark scene, not the light/dark app setting.
    <div className="dark relative flex min-h-[100dvh] w-full overflow-hidden bg-background">
      <style>{`
        @keyframes darkstage-rise {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .darkstage-rise { animation: darkstage-rise 0.4s ease-out both; }

        @media (prefers-reduced-motion: no-preference) {
          @keyframes darkstage-glow-pulse {
            0%, 100% { opacity: 0.85; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.06); }
          }
          .darkstage-glow-pulse { animation: darkstage-glow-pulse 6s ease-in-out infinite; }

          @keyframes darkstage-ripple {
            0% { transform: scale(0.6); opacity: 0.45; }
            100% { transform: scale(1.9); opacity: 0; }
          }
          .darkstage-ripple { animation: darkstage-ripple 4.6s ease-out infinite; }

          @keyframes darkstage-dotgrid-breathe {
            0%, 100% { opacity: 0.15; }
            50% { opacity: 0.32; }
          }
          .darkstage-dotgrid-breathe { animation: darkstage-dotgrid-breathe 8.5s ease-in-out infinite; }

          @keyframes darkstage-line-fade-a {
            0%, 100% { opacity: 0.06; }
            50% { opacity: 0.22; }
          }
          @keyframes darkstage-line-fade-b {
            0%, 100% { opacity: 0.04; }
            50% { opacity: 0.16; }
          }
          .darkstage-line-a { animation: darkstage-line-fade-a 10s ease-in-out infinite; }
          .darkstage-line-b { animation: darkstage-line-fade-b 10s ease-in-out infinite; animation-delay: -5s; }

          @keyframes darkstage-highlight-paint {
            0% { transform: rotate(-1.5deg) scaleX(0); }
            100% { transform: rotate(-1.5deg) scaleX(1); }
          }
          .darkstage-highlight-mark {
            transform-origin: left center;
            animation: darkstage-highlight-paint 0.55s ease-out forwards;
            animation-delay: 200ms;
          }

          @keyframes darkstage-feed-row-in {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .darkstage-feed-row-in {
            animation: darkstage-feed-row-in 450ms cubic-bezier(0.22,1,0.36,1) both;
          }

          @keyframes darkstage-feed-row-out {
            from { opacity: 1; transform: translateY(0); }
            to { opacity: 0; transform: translateY(8px); }
          }
          .darkstage-feed-row-out {
            animation: darkstage-feed-row-out 450ms ease-in forwards;
          }

          @keyframes darkstage-feed-dot-pulse {
            0%, 100% { opacity: 0.25; transform: scale(1); }
            50% { opacity: 0.9; transform: scale(1.3); }
          }
          .darkstage-feed-dot-pulse {
            animation: darkstage-feed-dot-pulse 1.4s ease-in-out infinite;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .darkstage-highlight-mark { transform: rotate(-1.5deg) scaleX(1); }
          .darkstage-feed-row-in,
          .darkstage-feed-row-out {
            animation: none;
            opacity: 1;
            transform: none;
          }
          .darkstage-feed-dot-pulse { animation: none; opacity: 0.5; transform: none; }
        }
      `}</style>

      {/* Ambient full-bleed layer — behind everything, spans the whole
          viewport so the cursor glow/rings/grid read behind the card too. */}
      <div className="pointer-events-none absolute inset-0 z-0">
        {/* base depth gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,hsl(var(--card))_0%,hsl(var(--background))_100%)]" />

        {/* breathing dot-grid texture */}
        <div
          className="darkstage-dotgrid-breathe absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle, hsl(var(--foreground)/0.35) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        {/* faint abstract line paths — depth, staggered slow fade */}
        <svg
          className="darkstage-line-a absolute left-[8%] top-[12%] h-[46%] w-[46%]"
          viewBox="0 0 300 300"
          fill="none"
        >
          <path
            d="M10 250 C 80 180, 120 220, 160 140 S 260 60, 290 20"
            stroke="hsl(var(--primary))"
            strokeWidth="1.5"
          />
        </svg>
        <svg
          className="darkstage-line-b absolute bottom-[10%] right-[6%] h-[40%] w-[40%]"
          viewBox="0 0 300 300"
          fill="none"
        >
          <path
            d="M290 40 C 220 90, 200 40, 150 100 S 60 210, 10 260"
            stroke="hsl(var(--primary))"
            strokeWidth="1.5"
          />
        </svg>

        {/* cursor-tracking warm glow, lerped toward the cursor */}
        <div ref={glowLayerRef} style={{ "--mx": "50%", "--my": "50%" } as CSSProperties}>
          <div className="absolute left-1/2 top-[10%] h-[70%] w-[70%] -translate-x-1/2">
            <div className="darkstage-glow-pulse h-full w-full rounded-full bg-[radial-gradient(circle_at_var(--mx)_var(--my),rgba(255,222,170,0.22)_0%,hsl(var(--primary)/0.14)_35%,rgba(255,205,140,0)_70%)] blur-2xl" />
          </div>
          <div className="absolute left-1/2 top-[24%] h-[38%] w-[38%] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_var(--mx)_var(--my),rgba(255,244,220,0.28)_0%,rgba(255,244,220,0)_70%)] blur-xl" />

          {/* sonar / ripple rings, staggered */}
          {[0, 1.5, 3].map((delay, i) => (
            <div
              key={i}
              className="darkstage-ripple absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/40"
              style={{ animationDelay: `${delay}s` }}
            />
          ))}
        </div>

        {/* vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,rgba(0,0,0,0)_45%,rgba(0,0,0,0.6)_100%)]" />
      </div>

      {/* HERO side — hidden below lg. Renders one of 6 swappable hero
          sub-variants; "hub" is the original in-file layout, the other 5
          are self-contained components from ./heroes/. */}
      <div className="relative z-10 hidden w-1/2 lg:block">
        {hero === "bento" && <HeroBento />}
        {hero === "photo" && <HeroPhotoStats />}
        {hero === "art" && <HeroGradientArt />}
        {hero === "radar" && <HeroRadarCards />}
        {hero === "peek" && <HeroProductPeek />}
        {hero === "hub" && (
        <div className="flex h-full flex-col justify-between px-10 pt-10 pb-16">
        <img
          src={heroLogo}
          alt=""
          aria-hidden="true"
          className="darkstage-rise h-5 w-auto opacity-40"
          style={{ animationDelay: "0ms" }}
        />

        {/* "Live activity" feed — replaces the old circuit-hub illustration
            with a vertical timeline of real FabAds events. Eyebrow + 2-line
            headline set the scene; the feed below does the storytelling
            (see FEED_BASE / FEED_ROTATION + the rotation effect above). */}
        <div className="darkstage-rise flex flex-1 flex-col overflow-hidden" style={{ animationDelay: "120ms" }}>
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
            Live Activity
          </span>
          <h2 className="mt-2 text-2xl font-bold leading-snug tracking-tight text-foreground">
            FabAds never stops working.
            <br />
            <span className="text-muted-foreground">Here's what happened in the last hour.</span>
          </h2>

          {/* timeline — decorative shell is pointer-events-none, rows
              re-enable pointer-events individually for the hover state. */}
          <div className="pointer-events-none relative mt-6 flex-1 overflow-hidden">
            <div className="relative h-full pl-8">
              <div className="absolute inset-y-0 left-[15px] w-px bg-white/10" aria-hidden="true" />

              <ul className="flex flex-col">
                {feedRows.map((row, i) => (
                  <li
                    key={row.uid}
                    className={
                      "pointer-events-auto relative flex items-start gap-3 rounded-lg px-2.5 py-2.5 transition-colors duration-200 hover:bg-white/[0.03] " +
                      (row.uid === exitingFeedUid ? "darkstage-feed-row-out" : "darkstage-feed-row-in")
                    }
                    style={{ animationDelay: row.uid === exitingFeedUid ? undefined : `${i * 60}ms` }}
                  >
                    {/* node on the timeline */}
                    <span
                      className={
                        "absolute -left-5 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full ring-4 ring-background " +
                        (row.tone === "auto" ? "bg-primary" : "bg-white/30")
                      }
                      aria-hidden="true"
                    />

                    {/* icon chip, tinted by category */}
                    <span
                      className={
                        "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full " +
                        (row.tone === "auto" ? "bg-primary/15 text-primary" : "bg-white/[0.08] text-white/60")
                      }
                    >
                      <row.Icon className="h-3.5 w-3.5" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] leading-snug text-foreground/85">{row.text}</p>
                      <span className="mt-1 block text-[11px] tabular-nums text-muted-foreground/70">
                        {row.time}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>

              {/* "more is coming" indicator — the feed never "ends" */}
              <div className="relative flex items-center gap-1.5 py-2 pl-[42px]" aria-hidden="true">
                <span className="darkstage-feed-dot-pulse h-1 w-1 rounded-full bg-white/30" style={{ animationDelay: "0ms" }} />
                <span className="darkstage-feed-dot-pulse h-1 w-1 rounded-full bg-white/30" style={{ animationDelay: "220ms" }} />
                <span className="darkstage-feed-dot-pulse h-1 w-1 rounded-full bg-white/30" style={{ animationDelay: "440ms" }} />
              </div>
            </div>
          </div>
        </div>

        {/* brag stat — copy pattern lifted from Concept05IridescentAI.tsx */}
        <div
          className="darkstage-rise flex items-center gap-3 rounded-2xl border border-white/10 bg-card/60 p-4 backdrop-blur-xl"
          style={{ animationDelay: "260ms" }}
        >
          <div className="flex -space-x-2.5">
            {AVATARS.map((a, i) => (
              <div
                key={a.initials}
                style={{ zIndex: AVATARS.length - i }}
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 border-background text-[10px] font-semibold ${a.className}`}
              >
                {a.initials}
              </div>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">4,500+</span> marketers already in
          </p>
        </div>
        </div>
        )}

        {/* dev-only hero sub-variant picker — mirrors VariantToggle's pill
            (which sits bottom-right); this one anchors bottom-left inside
            the hero panel so the two never collide. */}
        <div className="absolute bottom-4 left-4 z-[999] flex gap-1 rounded-xl border border-white/10 bg-black/80 p-1.5 shadow-lg backdrop-blur">
          {HERO_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              title={`Hero: ${opt.label}`}
              onClick={() => pickHero(opt.key)}
              className={
                "rounded-md px-2 py-1 text-[11px] font-medium transition-colors " +
                (hero === opt.key
                  ? "bg-white text-black"
                  : "text-gray-400 hover:bg-white/10 hover:text-white")
              }
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* FORM side */}
      <div className="relative z-10 flex w-full items-center justify-center px-6 py-10 lg:w-1/2">
        {/* Split the entrance fade/rise (CSS animation, fill-mode:both) from
            the live cursor-tilt (inline transform) onto two nested elements
            — sharing one element let the held keyframe's `transform:
            translateY(0)` permanently override the inline tilt transform
            forever after the 0.4s entrance finished, so the signature tilt
            never actually rendered. */}
        <div className="darkstage-rise w-full max-w-sm">
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={tiltStyle}
          className="relative rounded-2xl border border-border bg-card p-8 shadow-[0_8px_40px_rgba(0,0,0,0.5)] backdrop-blur-2xl"
        >
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              <span aria-hidden="true">{COPY.headingEmoji}</span> {headLead}
              {headMark && <Highlight>{headMark}</Highlight>}
              {headTail}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">{COPY.subheading}</p>
          </div>

          <form onSubmit={(e) => e.preventDefault()} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="darkstage-email" className="text-xs font-medium text-muted-foreground">
                {COPY.emailLabel}
              </label>
              <div className="group relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary-text" />
                <input
                  id="darkstage-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    markInteracted();
                  }}
                  onFocus={markInteracted}
                  placeholder={COPY.emailPlaceholder}
                  className={INPUT_BASE}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="darkstage-password" className="text-xs font-medium text-muted-foreground">
                {COPY.passwordLabel}
              </label>
              <div className="group relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-primary-text" />
                <input
                  id="darkstage-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    markInteracted();
                  }}
                  onFocus={markInteracted}
                  placeholder={COPY.passwordPlaceholder}
                  className={INPUT_BASE}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-border bg-card accent-primary"
                />
                {COPY.rememberLabel}
              </label>
              <button
                type="button"
                onClick={(e) => e.preventDefault()}
                className="text-xs text-muted-foreground underline-offset-2 transition hover:text-foreground hover:underline"
              >
                {COPY.forgotLabel}
              </button>
            </div>

            <button
              type="submit"
              className="mt-2 w-full rounded-full bg-primary py-2.5 text-sm font-bold text-primary-foreground shadow-[0_4px_20px_hsl(var(--primary)/0.25)] transition hover:bg-primary/90"
            >
              {COPY.submitLabel}
            </button>

            <div className="my-2 flex items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                {COPY.dividerLabel}
              </span>
              <div className="h-px flex-1 bg-border" />
            </div>

            <button
              type="button"
              className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card py-2.5 text-sm font-medium text-foreground transition hover:bg-muted"
            >
              <svg viewBox="0 0 48 48" className="h-4 w-4" aria-hidden="true">
                <path
                  fill="#FFC107"
                  d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.5 29.6 4.5 24 4.5 12.7 4.5 3.5 13.7 3.5 25S12.7 45.5 24 45.5 44.5 36.3 44.5 25c0-1.5-.2-3-.9-4.5z"
                />
                <path
                  fill="#FF3D00"
                  d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.5 29.6 4.5 24 4.5c-7.7 0-14.3 4.4-17.7 10.2z"
                />
                <path
                  fill="#4CAF50"
                  d="M24 45.5c5.5 0 10.4-1.9 14.1-5.1l-6.5-5.5c-2 1.4-4.6 2.1-7.6 2.1-5.3 0-9.7-3.4-11.3-8l-6.6 5.1C9.6 40.9 16.2 45.5 24 45.5z"
                />
                <path
                  fill="#1976D2"
                  d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.5 5.5C41.4 36 44.5 31 44.5 25c0-1.5-.2-3-.9-4.5z"
                />
              </svg>
              {COPY.googleLabel}
            </button>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              {COPY.signupPromptLabel}{" "}
              <button
                type="button"
                onClick={() => onViewChange("signup")}
                className="font-medium text-foreground underline-offset-2 hover:underline"
              >
                {COPY.signupLinkLabel}
              </button>
            </p>
          </form>
        </div>
        </div>
      </div>
    </div>
  );
}
