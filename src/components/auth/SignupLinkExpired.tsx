import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import signupLinkExpiredIllustration from "@/assets/auth/signup-link-expired-illustration.png";
import { AuthNav } from "@/pages/Auth";

/**
 * SignupLinkExpired — Figma "Signup link expired" (node 9431:53859). Unlike
 * the wizard steps, this frame is NOT the split-screen AuthLayout shell —
 * it's a single centered full-page state, so it renders on its own here.
 *
 * Pure UI: "Request another link" is visual only (no email/backend call);
 * it just surfaces a toast so reviewers get feedback on the click.
 */
export function SignupLinkExpired({ nav }: { nav: AuthNav }) {
  const { toast } = useToast();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 py-16 text-center">
      <img
        src={signupLinkExpiredIllustration}
        alt=""
        aria-hidden="true"
        className="h-auto w-full max-w-[355px]"
      />

      <div className="flex max-w-[700px] flex-col items-center gap-3">
        <h1 className="text-2xl font-bold text-foreground">Sign-up link expired</h1>
        <p className="text-sm text-muted-foreground">
          Hi, it seems that your Fab-Funnel link has expired due to inactivity. Our Fab-Funnel login links expire
          every 24 hours and can only be used once. Please reach out to our admin to request a new link.
        </p>
      </div>

      <Button
        type="button"
        className="h-10 rounded-lg px-6"
        onClick={() => toast({ title: "Link resent", description: "Check your inbox for a fresh sign-up link." })}
      >
        Request another link
      </Button>

      <button
        type="button"
        onClick={() => nav.goTo("login")}
        className="fab-focus rounded-sm text-sm font-medium text-primary-text hover:underline"
      >
        Back to login
      </button>
    </div>
  );
}
