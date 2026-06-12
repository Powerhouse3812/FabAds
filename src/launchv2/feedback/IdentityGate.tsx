/**
 * IdentityGate — wraps the launchv2 area and ensures we know who the tester is.
 *
 * Flow (Maalik's pick — link + popup, name+email required):
 *   • If the link carries name+email (?tester=&email=) or identity is already
 *     stored → no popup, just persist/continue.
 *   • Otherwise → a required (non-dismissable) popup asking name + email, with
 *     the name pre-filled if the link had ?tester=.
 *
 * The popup never appears on the admin dashboard route.
 */

import { useEffect, useRef, useState } from "react";
import { Sparkles, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { isValidEmail, resolveIdentity, setIdentity } from "./identity";

export default function IdentityGate({ children }: { children: React.ReactNode }) {
  const [showGate, setShowGate] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [touchedEmail, setTouchedEmail] = useState(false);
  const [saving, setSaving] = useState(false);
  const resolvedOnce = useRef(false);

  useEffect(() => {
    if (resolvedOnce.current) return;
    resolvedOnce.current = true;

    const { complete, identity, prefill } = resolveIdentity();
    if (complete && identity) {
      // Identity from the link — persist once (roster + local cache). Stored
      // identity is already cached, so this is a cheap no-op refresh.
      void setIdentity(identity.name, identity.email, identity.source);
      return;
    }
    setName(prefill.name);
    setEmail(prefill.email);
    setShowGate(true);
  }, []);

  const emailOk = isValidEmail(email);
  const canSubmit = name.trim().length > 0 && emailOk && !saving;

  const submit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    await setIdentity(name, email, "popup");
    setSaving(false);
    setShowGate(false);
  };

  return (
    <>
      {children}

      {showGate && (
        <div
          data-feedback-widget="true"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            {/* Illustration */}
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>

            <h2 className="text-lg font-semibold text-foreground">
              Pehle ek baar — tum kaun ho?
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Taaki tumhara feedback sahi banda se map ho. Sirf ek baar poochhenge.
            </p>

            <div className="mt-5 space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Naam</label>
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && canSubmit && submit()}
                  placeholder="Full name"
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => setTouchedEmail(true)}
                  onKeyDown={(e) => e.key === "Enter" && canSubmit && submit()}
                  placeholder="name@company.com"
                  className={cn(
                    "h-10 w-full rounded-lg border bg-background px-3 text-sm text-foreground outline-none transition-colors focus:ring-2",
                    touchedEmail && !emailOk
                      ? "border-destructive focus:border-destructive focus:ring-destructive/30"
                      : "border-border focus:border-primary focus:ring-primary/30",
                  )}
                />
                {touchedEmail && !emailOk && (
                  <p className="text-[11px] text-destructive">Sahi email daalo.</p>
                )}
              </div>
            </div>

            <button
              type="button"
              disabled={!canSubmit}
              onClick={submit}
              className={cn(
                "mt-6 flex h-10 w-full items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors",
                canSubmit
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "cursor-not-allowed bg-muted text-muted-foreground",
              )}
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Ek sec…
                </>
              ) : (
                <>
                  Chalo shuru karein <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <p className="mt-3 text-center text-[11px] text-muted-foreground/70">
              Ye sirf internal testing ke liye hai.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
