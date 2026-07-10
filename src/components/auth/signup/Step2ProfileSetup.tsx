import { useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { Eye, EyeOff } from "lucide-react";

import signupLogo from "@/assets/auth/signup-plan-logo.svg";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SignupPlanStepper } from "@/components/auth/signup/SignupPlanStepper";
import { COUNTRY_CODES, isValidPassword, type ProfileMode, type SignupFormData } from "@/components/auth/signup/types";

interface Step2ProfileSetupProps {
  data: SignupFormData;
  setData: Dispatch<SetStateAction<SignupFormData>>;
  onBack: () => void;
  onComplete: () => void;
}

/**
 * Step2ProfileSetup — "Profile setup" screen. Individual tab per Figma
 * 10421:45965, Agency tab per Figma 10506:50469 — identical layout, only
 * the first two fields swap (Full Name/Email ↔ Agency name/Admin email).
 */
export function Step2ProfileSetup({ data, setData, onBack, onComplete }: Step2ProfileSetupProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touchedPassword, setTouchedPassword] = useState(false);
  const [touchedConfirm, setTouchedConfirm] = useState(false);

  const passwordInvalid = touchedPassword && data.password.length > 0 && !isValidPassword(data.password);
  const confirmMismatch =
    touchedConfirm && data.confirmPassword.length > 0 && data.confirmPassword !== data.password;

  const hasPlan = Boolean(data.selectedPlan);
  // Figma caption is literally "Please select a plan to continu[e]" on the
  // disabled state (10421:45965 footer) — the brief calls that a mock of
  // "no plan chosen" and asks for a real label once one is: "Create
  // account" is used here since Step 2 is the final step of signup.
  const ctaLabel = hasPlan ? "Create account" : "Please select a plan to continue";

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <img src={signupLogo} alt="FabAds" className="h-[26px] w-auto" />

      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-xl font-bold text-foreground">You're one step away from smarter marketing</h1>
        <p className="text-sm text-muted-foreground">
          Unlock automation, Integration, Launch, etc — all in one powerful platform
        </p>
      </div>

      <SignupPlanStepper current={2} />

      <Tabs
        value={data.profileMode}
        onValueChange={(v) => setData((prev) => ({ ...prev, profileMode: v as ProfileMode }))}
      >
        <TabsList className="h-8">
          <TabsTrigger value="individual" className="px-3 py-1 text-sm">
            Individual
          </TabsTrigger>
          <TabsTrigger value="agency" className="px-3 py-1 text-sm">
            Agency
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex w-full flex-col gap-4">
        {data.profileMode === "individual" ? (
          <>
            <Field label="Full Name" htmlFor="signup-full-name">
              <Input
                id="signup-full-name"
                placeholder="Enter name"
                autoComplete="name"
                value={data.fullName}
                onChange={(e) => setData((prev) => ({ ...prev, fullName: e.target.value }))}
              />
            </Field>
            <Field label="Email" htmlFor="signup-email">
              <Input
                id="signup-email"
                type="email"
                autoComplete="email"
                placeholder="Zarkmukerberg@techagency.com"
                value={data.email}
                onChange={(e) => setData((prev) => ({ ...prev, email: e.target.value }))}
              />
            </Field>
          </>
        ) : (
          <>
            <Field label="Agency name" htmlFor="signup-agency-name">
              <Input
                id="signup-agency-name"
                placeholder="Enter name"
                value={data.agencyName}
                onChange={(e) => setData((prev) => ({ ...prev, agencyName: e.target.value }))}
              />
            </Field>
            <Field label="Admin email" htmlFor="signup-admin-email">
              <Input
                id="signup-admin-email"
                type="email"
                autoComplete="email"
                placeholder="Admin@techagency.com"
                value={data.adminEmail}
                onChange={(e) => setData((prev) => ({ ...prev, adminEmail: e.target.value }))}
              />
            </Field>
          </>
        )}

        <Field label="Phone Number" htmlFor="signup-phone">
          <div className="flex gap-2">
            <Select
              value={data.countryCode}
              onValueChange={(v) => setData((prev) => ({ ...prev, countryCode: v }))}
            >
              <SelectTrigger className="w-[92px] shrink-0" aria-label="Country code">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COUNTRY_CODES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.flag} {c.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              id="signup-phone"
              type="tel"
              autoComplete="tel-national"
              placeholder="(20) 123-4567"
              value={data.phone}
              onChange={(e) => setData((prev) => ({ ...prev, phone: e.target.value }))}
              className="flex-1"
            />
          </div>
        </Field>

        <div className="flex flex-col items-start gap-2">
          <Label htmlFor="signup-password">Set Password</Label>
          <div className="relative w-full">
            <Input
              id="signup-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Password"
              value={data.password}
              onChange={(e) => setData((prev) => ({ ...prev, password: e.target.value }))}
              onBlur={() => setTouchedPassword(true)}
              aria-invalid={passwordInvalid || undefined}
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
          <p className={cn("text-sm", passwordInvalid ? "text-error-text" : "text-muted-foreground")}>
            Must be 8 characters, 1 numeric and 1 special character
          </p>
        </div>

        <div className="flex flex-col items-start gap-2">
          <Label htmlFor="signup-confirm-password">Confirm Password</Label>
          <div className="relative w-full">
            <Input
              id="signup-confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Password"
              value={data.confirmPassword}
              onChange={(e) => setData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
              onBlur={() => setTouchedConfirm(true)}
              aria-invalid={confirmMismatch || undefined}
              className="pr-10"
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
          {confirmMismatch && <p className="text-sm text-error-text">Passwords must match</p>}
        </div>
      </div>

      <div className="flex w-full items-center gap-2">
        <Button type="button" variant="outline" onClick={onBack} className="h-10 flex-1 rounded-lg">
          Back to plans
        </Button>
        <Button type="button" onClick={onComplete} disabled={!hasPlan} className="h-10 flex-[2] rounded-lg">
          {ctaLabel}
        </Button>
      </div>
    </div>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}
