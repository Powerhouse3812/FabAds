import { useState, type FormEvent } from "react";

import { AuthNav } from "@/pages/Auth";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordView({ nav }: { nav: AuthNav }) {
  const [email, setEmail] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // No backend — chains straight into the "set new password" screen so
    // the full flow stays previewable end to end.
    nav.goTo("reset");
  };

  return (
    <AuthLayout>
      <form onSubmit={handleSubmit} noValidate className="flex w-full flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold text-foreground">Forgot your password ?</h1>
          <p className="text-sm text-foreground">
            Enter the email associated with your account and we&apos;ll send an email with instructions to reset your
            password
          </p>
        </div>

        <div className="flex w-full flex-col gap-2">
          <Label htmlFor="forgot-email">Email</Label>
          <Input
            id="forgot-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="flex w-full flex-col gap-3">
          <Button type="submit" className="h-10 w-full rounded-lg">
            Send link
          </Button>

          <button
            type="button"
            onClick={() => nav.goTo("login")}
            className="fab-focus rounded-sm text-sm font-medium text-primary-text hover:underline"
          >
            Back to login
          </button>
        </div>
      </form>
    </AuthLayout>
  );
}
