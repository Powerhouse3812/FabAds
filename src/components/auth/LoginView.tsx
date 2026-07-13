import { useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import { Eye, EyeOff, XCircle, X } from "lucide-react";

import { AuthNav } from "@/pages/Auth";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { isValidEmail } from "@/components/auth/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

/**
 * GoogleIcon — inline brand mark for the "Sign in with Google" button
 * (Figma node 10294:45568). No asset export needed; this is the standard
 * 4-colour Google "G" glyph, reproduced as a static SVG.
 */
function GoogleIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden="true">
      <path
        d="M19.6 10.23c0-.68-.06-1.33-.17-1.96H10v3.71h5.38a4.6 4.6 0 0 1-2 3.02v2.5h3.23c1.89-1.74 2.99-4.3 2.99-7.27Z"
        fill="#4285F4"
      />
      <path
        d="M10 20c2.7 0 4.96-.89 6.61-2.42l-3.23-2.5c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H1.06v2.59A9.99 9.99 0 0 0 10 20Z"
        fill="#34A853"
      />
      <path
        d="M4.41 11.92A6.02 6.02 0 0 1 4.09 10c0-.67.11-1.32.32-1.92V5.49H1.06A9.99 9.99 0 0 0 0 10c0 1.61.39 3.14 1.06 4.51l3.35-2.59Z"
        fill="#FBBC05"
      />
      <path
        d="M10 3.96c1.47 0 2.79.51 3.83 1.5l2.87-2.87A9.53 9.53 0 0 0 10 0 9.99 9.99 0 0 0 1.06 5.49l3.35 2.59C5.2 5.72 7.4 3.96 10 3.96Z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function LoginView({ nav }: { nav: AuthNav }) {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [showError, setShowError] = useState(searchParams.get("state") === "error");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedEmail = email.trim();
    let nextEmailError: string | null = null;
    let nextPasswordError: string | null = null;

    if (!trimmedEmail) {
      nextEmailError = "Email is required";
    } else if (!isValidEmail(trimmedEmail)) {
      nextEmailError = "Enter a valid email address";
    }

    if (!password) {
      nextPasswordError = "Password is required";
    }

    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);

    if (nextEmailError || nextPasswordError) {
      // A field itself is invalid — that's a distinct problem from a
      // rejected credential pair, so don't show the "invalid credentials"
      // banner on top of it.
      setShowError(false);
      return;
    }

    // No backend — this is a pure-UI demo. Once both fields are individually
    // well-formed, submitting always surfaces the Figma error variant
    // (9431:56090) since there's nothing to authenticate against yet.
    setShowError(true);
  };

  const emailDescribedBy =
    [showError && "login-error", emailError && "login-email-error"].filter(Boolean).join(" ") || undefined;
  const passwordDescribedBy =
    [showError && "login-error", passwordError && "login-password-error"].filter(Boolean).join(" ") || undefined;

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} noValidate className="flex w-full flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-1 text-center">
          <div className="flex items-center gap-2">
            <span aria-hidden="true" className="text-2xl">
              👋
            </span>
            <h1 className="text-2xl font-bold text-foreground">Welcome to Fab-Funnel</h1>
          </div>
          <p className="text-sm text-foreground">sign in to your account to continue</p>
        </div>

        <div className="flex w-full flex-col gap-4">
          {showError && (
            <div
              id="login-error"
              role="alert"
              className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2"
            >
              <XCircle className="h-4 w-4 shrink-0 text-error-text" />
              <p className="flex-1 text-sm text-foreground">Invalid email id or password.</p>
              <button
                type="button"
                onClick={() => setShowError(false)}
                aria-label="Dismiss error"
                className="fab-focus rounded-sm text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          <div className="flex flex-col items-start gap-2">
            <Label htmlFor="login-email">Email</Label>
            <Input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="tulikagoswami@techagency.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError) setEmailError(null);
              }}
              aria-invalid={emailError || showError ? true : undefined}
              aria-describedby={emailDescribedBy}
              className={cn(emailError && "border-destructive")}
            />
            {emailError && (
              <p id="login-email-error" className="text-sm text-error-text">
                {emailError}
              </p>
            )}
          </div>

          <div className="flex flex-col items-start gap-2">
            <Label htmlFor="login-password">Password</Label>
            <div className="relative w-full">
              <Input
                id="login-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError) setPasswordError(null);
                }}
                aria-invalid={passwordError || showError ? true : undefined}
                aria-describedby={passwordDescribedBy}
                className={cn("pr-10", passwordError && "border-destructive")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="fab-focus absolute inset-y-0 right-0 flex h-full w-10 items-center justify-center text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
              </button>
            </div>
            {passwordError && (
              <p id="login-password-error" className="text-sm text-error-text">
                {passwordError}
              </p>
            )}
          </div>
        </div>

        <div className="flex w-full flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="login-remember"
                checked={rememberMe}
                onCheckedChange={(v) => setRememberMe(v === true)}
              />
              <Label htmlFor="login-remember" className="cursor-pointer font-normal text-foreground">
                Keep me logged in
              </Label>
            </div>
            <button
              type="button"
              onClick={() => nav.goTo("forgot")}
              className="fab-focus rounded-sm text-sm font-medium text-primary-text hover:underline"
            >
              Forgot password?
            </button>
          </div>

          <Button type="submit" className="h-10 w-full rounded-lg">
            Sign in
          </Button>

          <div className="flex items-center gap-4 py-1">
            <div className="h-px flex-1 bg-border" />
            <span className="text-sm text-muted-foreground">Or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => toast({ title: "Google sign-in coming soon" })}
            className="h-10 w-full gap-2 rounded-lg"
          >
            <GoogleIcon />
            Sign in with Google
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <button
            type="button"
            onClick={() => nav.goTo("signup")}
            className="fab-focus rounded-sm font-medium text-primary-text hover:underline"
          >
            Sign up
          </button>
        </p>
      </form>
    </AuthLayout>
  );
}
