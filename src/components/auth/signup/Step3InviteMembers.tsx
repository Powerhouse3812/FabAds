import { type Dispatch, type FormEvent, type KeyboardEvent, type SetStateAction, useState } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ROLE_OPTIONS, isValidEmail, type SignupFormData } from "./types";

/**
 * Step 3 — Invite Members (Figma node 9431:56064). Figma models this as a
 * single multi-email "select" field (type an address, it becomes a
 * removable chip) plus ONE role dropdown applied to every invite, not
 * per-row email+role pairs — so that's what this reproduces. Both fields
 * are optional; only the Terms checkbox is required to enable "Sign up".
 *
 * Pure UI — clicking "Sign up" hands off to the existing first-login
 * onboarding wizard (see SignupWizard's onComplete), it does not create
 * any invites or accounts anywhere.
 */
export function Step3InviteMembers({
  data,
  setData,
  onComplete,
  onBack,
}: {
  data: SignupFormData;
  setData: Dispatch<SetStateAction<SignupFormData>>;
  onComplete: () => void;
  onBack: () => void;
}) {
  const [emailDraft, setEmailDraft] = useState("");
  const [emailDraftError, setEmailDraftError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const addEmailChip = () => {
    const value = emailDraft.trim().replace(/,$/, "");
    if (!value) return;
    if (!isValidEmail(value)) {
      setEmailDraftError("Enter a valid email address");
      return;
    }
    if (data.inviteEmails.includes(value)) {
      setEmailDraftError("That email is already added");
      return;
    }
    setData((d) => ({ ...d, inviteEmails: [...d.inviteEmails, value] }));
    setEmailDraft("");
    setEmailDraftError(null);
  };

  const removeEmailChip = (email: string) => {
    setData((d) => ({ ...d, inviteEmails: d.inviteEmails.filter((e) => e !== email) }));
  };

  const handleEmailKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addEmailChip();
    } else if (event.key === "Backspace" && emailDraft.length === 0 && data.inviteEmails.length > 0) {
      removeEmailChip(data.inviteEmails[data.inviteEmails.length - 1]);
    }
  };

  const termsError = submitted && !data.agreeTerms ? "You must agree to the Terms and Conditions to continue" : null;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (data.agreeTerms) {
      onComplete();
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex w-full flex-col gap-4">
      <div className="flex flex-col items-start gap-2">
        <div className="flex items-center gap-1">
          <Label htmlFor="signup-invite-emails">Member’s email</Label>
          <span className="text-sm text-muted-foreground">(optional)</span>
        </div>
        <div
          className={cn(
            "flex w-full flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background",
          )}
        >
          {data.inviteEmails.map((email) => (
            <span
              key={email}
              className="flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-sm text-foreground"
            >
              {email}
              <button
                type="button"
                onClick={() => removeEmailChip(email)}
                aria-label={`Remove ${email}`}
                className="fab-focus rounded-sm text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <input
            id="signup-invite-emails"
            type="email"
            value={emailDraft}
            onChange={(e) => {
              setEmailDraft(e.target.value);
              setEmailDraftError(null);
            }}
            onKeyDown={handleEmailKeyDown}
            onBlur={addEmailChip}
            placeholder={data.inviteEmails.length === 0 ? "name@agency.com" : ""}
            className="min-w-[140px] flex-1 border-0 bg-transparent p-0.5 text-base outline-none placeholder:text-muted-foreground md:text-sm"
          />
        </div>
        {emailDraftError ? (
          <p className="text-sm text-error-text">{emailDraftError}</p>
        ) : (
          <p className="text-sm text-muted-foreground">Press Enter or comma to add an address</p>
        )}
      </div>

      <div className="flex flex-col items-start gap-2">
        <div className="flex items-center gap-1">
          <Label htmlFor="signup-invite-role">Assign role</Label>
          <span className="text-sm text-muted-foreground">(optional)</span>
        </div>
        <Select value={data.inviteRole} onValueChange={(v) => setData((d) => ({ ...d, inviteRole: v }))}>
          <SelectTrigger id="signup-invite-role">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLE_OPTIONS.map((role) => (
              <SelectItem key={role.value} value={role.value}>
                {role.isDefault ? `${role.label} (default)` : role.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex items-center gap-2">
            <Checkbox
              id="signup-terms"
              checked={data.agreeTerms}
              onCheckedChange={(v) => setData((d) => ({ ...d, agreeTerms: v === true }))}
              aria-invalid={!!termsError}
              className={cn(termsError && "border-destructive")}
            />
            <Label htmlFor="signup-terms" className="cursor-pointer font-normal text-foreground">
              I have read and agree to the
            </Label>
          </div>
          <button
            type="button"
            onClick={(e) => e.preventDefault()}
            className="fab-focus rounded-sm text-sm font-medium text-primary-text hover:underline"
          >
            Terms and Conditions
          </button>
        </div>
        {termsError && <p className="text-sm text-error-text">{termsError}</p>}
      </div>

      <div className="flex w-full gap-4">
        <Button type="button" variant="outline" onClick={onBack} className="h-10 flex-1 rounded-lg">
          Previous
        </Button>
        <Button type="submit" className="h-10 flex-1 rounded-lg">
          Sign up
        </Button>
      </div>
    </form>
  );
}
