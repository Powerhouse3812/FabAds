import { useState, type FormEvent } from "react";
import { Eye, EyeOff, Info } from "lucide-react";

import { AuthNav } from "@/pages/Auth";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function SetNewPasswordView({ nav }: { nav: AuthNav }) {
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Visual-only validation hint per Figma caption ("Both password must be
  // same.") — only flags a mismatch once the reviewer has typed something
  // into both fields, so it doesn't shout red on first render.
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    nav.openModal("reset-success");
  };

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} noValidate className="flex w-full flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold text-foreground">Set new password</h1>
          <p className="text-sm text-foreground">Your new password must be different from previous used password</p>
        </div>

        <div className="flex w-full flex-col gap-4">
          <div className="flex flex-col items-start gap-1">
            <Label htmlFor="reset-code">Email Verification Code</Label>
            <div className="relative w-full">
              <Input
                id="reset-code"
                name="code"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="pr-10"
              />
              <Info className="absolute inset-y-0 right-3 my-auto h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </div>
            <p className="text-sm text-muted-foreground">Enter the 6-digit code sent to jo*****@example.com</p>
          </div>

          <div className="flex flex-col items-start gap-1">
            <Label htmlFor="new-password">New Password</Label>
            <div className="relative w-full">
              <Input
                id="new-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="fab-focus absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
              </button>
            </div>
            <p className="text-sm text-muted-foreground">Must be 8 characters, 1 numeric and 1 special character</p>
          </div>

          <div className="flex flex-col items-start gap-1">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <div className="relative w-full">
              <Input
                id="confirm-password"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                aria-invalid={passwordsMismatch || undefined}
                className={cn("pr-10", passwordsMismatch && "border-destructive focus-visible:ring-destructive")}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                className="fab-focus absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-[18px] w-[18px]" />
                ) : (
                  <Eye className="h-[18px] w-[18px]" />
                )}
              </button>
            </div>
            <p className={cn("text-sm text-muted-foreground", passwordsMismatch && "text-error-text")}>
              Both password must be same.
            </p>
          </div>
        </div>

        <Button type="submit" className="h-10 w-full rounded-lg">
          Set password
        </Button>
      </form>
    </AuthLayout>
  );
}
