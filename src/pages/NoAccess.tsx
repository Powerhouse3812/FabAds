import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import { ShieldX, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export default function NoAccess() {
  const { session, role, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [retrying, setRetrying] = useState(true);

  // Re-check workspace membership with retries — handles race condition
  // where trigger hasn't committed yet when we first land here
  useEffect(() => {
    if (!session?.user?.id || role) {
      setRetrying(false);
      return;
    }

    let cancelled = false;
    const check = async () => {
      for (let i = 0; i < 8; i++) {
        if (cancelled) return;
        await new Promise((r) => setTimeout(r, 1500));
        const { data } = await supabase
          .from("workspace_users")
          .select("role")
          .eq("user_id", session.user.id)
          .limit(1)
          .single();
        if (data?.role) {
          // Role found — reload to let AuthContext pick it up
          window.location.href = "/dashboard";
          return;
        }
      }
      if (!cancelled) setRetrying(false);
    };
    check();
    return () => { cancelled = true; };
  }, [session?.user?.id, role]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  // If role is now available, redirect to app
  if (role) {
    return <Navigate to="/reports" replace />;
  }

  // Still retrying
  if (retrying) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Setting up your workspace...</p>
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <ShieldX className="h-12 w-12 text-muted-foreground" />
          </div>
          <CardTitle>No Access to Workspace</CardTitle>
          <CardDescription>
            You're signed in, but your account isn't linked to this workspace yet. Contact your workspace admin to request access.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={handleSignOut}>
            Sign Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
