import { useState, type Dispatch, type FormEvent, type SetStateAction } from "react";
import { Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { isValidPassword, type SignupFormData } from "./types";

/**
 * Step 1 — Set Profile (Figma node 9431:54690). Full name, invite-locked
 * email, phone with country code, and password + confirm. Pure UI: "Next"
 * runs a client-side check and blocks navigation with inline errors instead
 * of calling any API.
 */
export function Step1Profile({
  data,
  setData,
  onNext,
}: {
  data: SignupFormData;
  setData: Dispatch<SetStateAction<SignupFormData>>;
  onNext: () => void;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const fullNameError = submitted && data.fullName.trim().length === 0 ? "Full name is required" : null;
  const phoneError = submitted && data.phone.trim().length < 7 ? "Enter a valid phone number" : null;
  const passwordError =
    submitted && !isValidPassword(data.password)
      ? "Must be 8 characters, 1 numeric and 1 special character"
      : null;
  const confirmError =
    submitted && data.confirmPassword !== data.password ? "Both password must match" : null;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (!fullNameError && !phoneError && !passwordError && !confirmError && data.fullName.trim() && data.phone.trim()) {
      onNext();
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex w-full flex-col gap-4">
      <div className="flex flex-col items-start gap-2">
        <Label htmlFor="signup-fullname">Full Name</Label>
        <Input
          id="signup-fullname"
          name="fullName"
          placeholder="Enter name"
          value={data.fullName}
          onChange={(e) => setData((d) => ({ ...d, fullName: e.target.value }))}
          aria-invalid={!!fullNameError}
          className={cn(fullNameError && "border-destructive focus-visible:ring-destructive")}
        />
        {fullNameError && <p className="text-sm text-error-text">{fullNameError}</p>}
      </div>

      <div className="flex flex-col items-start gap-2">
        <Label htmlFor="signup-email">Email</Label>
        <Input id="signup-email" name="email" type="email" value={data.email} disabled readOnly />
      </div>

      <div className="flex flex-col items-start gap-2">
        <Label htmlFor="signup-phone">Phone Number</Label>
        <div className="flex w-full">
          <Select value={data.countryCode} onValueChange={(v) => setData((d) => ({ ...d, countryCode: v }))}>
            <SelectTrigger className="w-[84px] shrink-0 rounded-r-none border-r-0 bg-muted/40 px-3" aria-label="Country code">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="+91">+91</SelectItem>
            </SelectContent>
          </Select>
          <Input
            id="signup-phone"
            name="phone"
            type="tel"
            inputMode="tel"
            placeholder="Input"
            value={data.phone}
            onChange={(e) => setData((d) => ({ ...d, phone: e.target.value }))}
            aria-invalid={!!phoneError}
            className={cn("rounded-l-none", phoneError && "border-destructive focus-visible:ring-destructive")}
          />
        </div>
        {phoneError && <p className="text-sm text-error-text">{phoneError}</p>}
      </div>

      <div className="flex flex-col items-start gap-2">
        <Label htmlFor="signup-password">Set Password</Label>
        <div className="relative w-full">
          <Input
            id="signup-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Password"
            value={data.password}
            onChange={(e) => setData((d) => ({ ...d, password: e.target.value }))}
            aria-invalid={!!passwordError}
            className={cn("pr-10", passwordError && "border-destructive focus-visible:ring-destructive")}
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
        <p className={cn("text-sm", passwordError ? "text-error-text" : "text-muted-foreground")}>
          Must be 8 characters, 1 numeric and 1 special character
        </p>
      </div>

      <div className="flex flex-col items-start gap-2">
        <Label htmlFor="signup-confirm-password">Confirm Password</Label>
        <div className="relative w-full">
          <Input
            id="signup-confirm-password"
            name="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Password"
            value={data.confirmPassword}
            onChange={(e) => setData((d) => ({ ...d, confirmPassword: e.target.value }))}
            aria-invalid={!!confirmError}
            className={cn("pr-10", confirmError && "border-destructive focus-visible:ring-destructive")}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((v) => !v)}
            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            className="fab-focus absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
          >
            {showConfirmPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
          </button>
        </div>
        <p className={cn("text-sm", confirmError ? "text-error-text" : "text-muted-foreground")}>
          Both password must match
        </p>
      </div>

      <Button type="submit" className="h-10 w-full rounded-lg">
        Next
      </Button>
    </form>
  );
}
