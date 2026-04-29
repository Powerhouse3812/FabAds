import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

interface FakeLoginStepProps {
  onLogin: () => void;
}

export default function FakeLoginStep({ onLogin }: FakeLoginStepProps) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => onLogin(), 1500);
  };

  return (
    <div className="flex flex-col">
      {/* Facebook-style header */}
      <div className="bg-[hsl(220,46%,48%)] px-6 py-4 rounded-t-lg -mx-6 -mt-6">
        <h2 className="text-lg font-bold text-[hsl(0,0%,100%)]">Facebook</h2>
        <p className="text-sm text-[hsl(220,30%,85%)]">Log in to continue to FabAds</p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Email or Phone</label>
          <Input
            value="alex.johnson@example.com"
            readOnly
            className="bg-muted"
            tabIndex={-1}
            autoComplete="off"
            data-1p-ignore
            data-lpignore="true"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Password</label>
          <Input
            type="text"
            value="••••••••"
            readOnly
            className="bg-muted"
            tabIndex={-1}
            autoComplete="new-password"
            data-1p-ignore
            data-lpignore="true"
            style={{ WebkitTextSecurity: "disc" } as React.CSSProperties}
          />
        </div>
        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-[hsl(220,46%,48%)] hover:bg-[hsl(220,46%,40%)] text-[hsl(0,0%,100%)]"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Logging in...
            </>
          ) : (
            "Log In"
          )}
        </Button>
        <p className="text-xs text-center text-muted-foreground">
          This is a simulated login. No real credentials are used.
        </p>
      </form>
    </div>
  );
}
