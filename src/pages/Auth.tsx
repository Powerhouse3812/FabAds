import { useCallback } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { ArrowLeft, Sparkles, LayoutTemplate } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { LoginView } from "@/components/auth/LoginView";
import { ForgotPasswordView } from "@/components/auth/ForgotPasswordView";
import { SetNewPasswordView } from "@/components/auth/SetNewPasswordView";
import { ResetSuccessModal } from "@/components/auth/ResetSuccessModal";
import { SignupWizard } from "@/components/auth/SignupWizard";
import { SignupLinkExpired } from "@/components/auth/SignupLinkExpired";
import { TwoFactorModal } from "@/components/auth/TwoFactorModal";
import { useLandingPath, DESKTOP_HOME_PATH } from "@/components/shell/LandingRedirect";

/**
 * Auth — pure-UI rebuild of the login / signup / password flows from the
 * Onboard-UMS Figma ("Login & Signup/ONboarding" section, node 9431:53324).
 *
 * Every state is URL-driven so each Figma frame is deep-linkable for review
 * (same "show=" philosophy as the rest of the app):
 *
 *   /auth                      → login            (Figma 9431:53325)
 *   /auth?view=forgot          → forgot password  (9431:53497)
 *   /auth?view=reset           → set new password (9431:53619)
 *   /auth?view=signup&step=1-2 → signup wizard    (plan-first redesign,
 *                                Figma 10990:44968 → 10421:45965/10506:50469)
 *   /auth?view=expired         → link expired     (9431:53859)
 *   /auth?modal=2fa            → 2FA setup modal  (9431:56264)
 *   /auth?modal=reset-success  → reset success    (9431:53749)
 *
 * NO backend calls here — submits only navigate between views (UMS + Supabase
 * wiring comes later). The demo auto-login in AuthContext is untouched; since
 * a session therefore always exists, this page must NOT redirect to /dashboard
 * (the old behavior) — instead it shows a "Back to dashboard" chip so
 * reviewers coming from the nav rail can return to the app.
 */

export type AuthView = "login" | "forgot" | "reset" | "signup" | "expired";
export type AuthModal = "2fa" | "reset-success";
/** Signup is the 2-step plan-first flow: 1 = Plan selection, 2 = Profile setup. */
export type SignupStep = 1 | 2;

export interface AuthNav {
  view: AuthView;
  step: SignupStep;
  modal: AuthModal | null;
  goTo: (view: AuthView, opts?: { step?: SignupStep }) => void;
  openModal: (modal: AuthModal) => void;
  closeModal: () => void;
}

function parseView(raw: string | null): AuthView {
  const views: AuthView[] = ["login", "forgot", "reset", "signup", "expired"];
  return views.includes(raw as AuthView) ? (raw as AuthView) : "login";
}

function parseStep(raw: string | null): SignupStep {
  return Number(raw) === 2 ? 2 : 1;
}

function parseModal(raw: string | null): AuthModal | null {
  return raw === "2fa" || raw === "reset-success" ? raw : null;
}

export default function Auth() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const view = parseView(searchParams.get("view"));
  const step = parseStep(searchParams.get("step"));
  const modal = parseModal(searchParams.get("modal"));

  const goTo = useCallback(
    (nextView: AuthView, opts?: { step?: SignupStep }) => {
      const next = new URLSearchParams();
      if (nextView !== "login") next.set("view", nextView);
      if (nextView === "signup" && opts?.step && opts.step > 1) {
        next.set("step", String(opts.step));
      }
      setSearchParams(next);
    },
    [setSearchParams],
  );

  const openModal = useCallback(
    (m: AuthModal) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set("modal", m);
        return next;
      });
    },
    [setSearchParams],
  );

  const closeModal = useCallback(() => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.delete("modal");
      return next;
    });
  }, [setSearchParams]);

  const nav: AuthNav = { view, step, modal, goTo, openModal, closeModal };

  // Where "back to the app" goes. Hardcoded /dashboard before, which is a
  // blocked route on mobile now — the escape hatch handed a phone reviewer a
  // "Best on desktop" gate instead of the app.
  const landingPath = useLandingPath();

  return (
    <div className="relative min-h-screen bg-background">
      {/* Reviewer escape hatch — only shown when a session exists (always true
          while the demo auto-login is active). Positioned above the screens
          so it never collides with the Figma layouts. */}
      {session && (
        <button
          type="button"
          onClick={() => navigate(landingPath)}
          className="fixed left-4 top-4 z-50 flex items-center gap-1.5 rounded-full border border-border bg-card/90 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {landingPath === DESKTOP_HOME_PATH ? "Back to dashboard" : "Back to my feeds"}
        </button>
      )}

      {view === "login" && <LoginView nav={nav} />}
      {view === "forgot" && <ForgotPasswordView nav={nav} />}
      {view === "reset" && <SetNewPasswordView nav={nav} />}
      {view === "signup" && <SignupWizard nav={nav} />}
      {view === "expired" && <SignupLinkExpired nav={nav} />}

      {modal === "2fa" && <TwoFactorModal nav={nav} />}
      {modal === "reset-success" && <ResetSuccessModal nav={nav} />}

      <ConceptsLink />
      <StatePicker nav={nav} />
    </div>
  );
}

/**
 * ConceptsLink — review-only chip group (bottom-left, mirrors StatePicker's
 * bottom-right placement) linking out to the separate exploration tracks.
 * Doesn't affect this page's own flow — just a fast way in from the live
 * screens. Two destinations so far:
 *   - /auth-concepts  → the original 10-direction visual exploration
 *   - /auth-v2        → the 2 locked finals (Dark Stage / Living Split)
 *     synthesized from client feedback on those 10 directions
 */
function ConceptsLink() {
  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-1.5 rounded-full border border-border bg-card/90 p-1 shadow-sm backdrop-blur">
      <Link
        to="/auth-concepts/11-liquid-glass"
        className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <Sparkles className="h-3.5 w-3.5" />
        10 concepts
      </Link>
      <Link
        to="/auth-v2"
        className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <LayoutTemplate className="h-3.5 w-3.5" />
        2 finals
      </Link>
    </div>
  );
}

/**
 * StatePicker — review-only floating chip (bottom-right) that jumps between
 * every screen state in the module, mirroring the Figma frames 1:1. Lets
 * design review walk all 9 states without hand-editing the URL. Remove (or
 * gate) when the flows get wired for real.
 */
const PICKER_STATES: { label: string; view: AuthView; step?: SignupStep; modal?: AuthModal }[] = [
  // Login + Profile pulled to the front — current critique focus.
  { label: "Login", view: "login" },
  { label: "Profile", view: "signup", step: 2 },
  { label: "2FA", view: "login", modal: "2fa" },
  { label: "Forgot", view: "forgot" },
  { label: "Reset", view: "reset" },
  { label: "Reset ✓", view: "reset", modal: "reset-success" },
  { label: "Plans", view: "signup", step: 1 },
  { label: "Expired", view: "expired" },
];

function StatePicker({ nav }: { nav: AuthNav }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex max-w-[260px] flex-wrap justify-end gap-1 rounded-xl border border-border bg-card/90 p-1.5 shadow-md backdrop-blur">
      {PICKER_STATES.map((s) => {
        const active =
          nav.view === s.view &&
          (s.view !== "signup" || nav.step === (s.step ?? 1)) &&
          nav.modal === (s.modal ?? null);
        return (
          <button
            key={s.label}
            type="button"
            onClick={() => {
              nav.goTo(s.view, { step: s.step });
              if (s.modal) nav.openModal(s.modal);
            }}
            className={
              "rounded-md px-2 py-1 text-[11px] font-medium transition-colors " +
              (active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground")
            }
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}
