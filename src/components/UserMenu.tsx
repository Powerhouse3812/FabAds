import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useClientContext } from "@/contexts/ClientContext";
import { usePlan } from "@/contexts/PlanContext";
import { useTheme } from "next-themes";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LogOut, Sun, Moon, HelpCircle, Building2, ChevronsUpDown,
  Settings, Plug, Users, UserPlus, Check, Sparkles, Receipt,
} from "lucide-react";

/**
 * UserMenu — profile dropdown.
 *
 * Flat structure — NO sub-menus. Group separators only.
 * Absorbs: Settings, Integration, Team, Clients, Help, Theme, Sign out.
 *
 * History:
 *   iter-4 (2026-05-01) — created with flat structure.
 *   A-10.12 — added V1-V7 nav variant picker (per "keep it inside the pop-over").
 *   A-10.13 — picker REMOVED. V1-V6 variants dropped from the codebase entirely;
 *             V7 (ClickUp Strict) is now the only shell, so a picker is meaningless.
 *   A-10.14 — Active-client selector now ALWAYS visible just below the profile
 *             section (per Maalik: "user kisi client ke andar hoga"). Was gated
 *             on clients.length > 1; ungated. Dummy fallback added so an empty
 *             Supabase response still shows one client by default.
 */

/**
 * Dummy fallback used when ClientContext returns an empty list (e.g. demo mode
 * with no Supabase data). The active-client selector should never look empty —
 * the user always operates inside SOME client context.
 */
const DUMMY_CLIENT = { id: "demo-client", name: "Idea Clan" } as const;

export function UserMenu({ compact = false }: { compact?: boolean }) {
  const navigate = useNavigate();
  const { user, role, signOut } = useAuth();
  const { activeClient, clients, setActiveClient } = useClientContext();
  const { setTheme, resolvedTheme } = useTheme();
  const { plan } = usePlan();
  // On AI plan, hide Integration + Team (UMS) — per Maalik they don't
  // belong in the AI-focused surface. They're upsell territory; the
  // PRO badges on Reports / Launch / Automation in the rail already
  // hint at the Full plan's existence, so we keep this menu lean.
  const isAiPlan = plan === "ai";

  if (!user) return null;

  const initials = user.email?.slice(0, 2).toUpperCase() ?? "U";
  const isDark = resolvedTheme === "dark";

  // Always render at least one client in the selector. If the real list is
  // empty (demo mode / no Supabase clients), fall through to the dummy. The
  // "active" determination falls through the same way.
  const displayClients = clients.length > 0 ? clients : [DUMMY_CLIENT];
  const displayActiveId = activeClient?.id ?? displayClients[0].id;
  const displayActive = displayClients.find((c) => c.id === displayActiveId) ?? displayClients[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring px-2 py-1.5 hover:bg-sidebar-accent/40 w-full transition-colors"
      >
        <Avatar className="h-7 w-7 shrink-0">
          <AvatarFallback className="text-xs">{initials}</AvatarFallback>
        </Avatar>
        {!compact && (
          <>
            <div className="min-w-0 flex-1 text-left">
              <p className="text-xs font-medium truncate">{user.email?.split("@")[0]}</p>
              <p className="text-[10px] text-muted-foreground truncate">{displayActive.name}</p>
            </div>
            <ChevronsUpDown className="h-3 w-3 text-muted-foreground shrink-0" />
          </>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" side="top" className="w-56">
        {/* Identity */}
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-0.5">
            <p className="text-xs font-semibold truncate">{user.email}</p>
            <p className="text-[10px] text-muted-foreground capitalize">{role}</p>
          </div>
        </DropdownMenuLabel>

        {/* Active-client selector — always visible (A-10.14).
            User always operates inside a client context. If multiple clients
            exist they all list here with a Check on the active one. If only
            one (or zero — falls through to dummy) the row still shows so the
            "active client" surface is never absent. */}
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground py-1">
          <span className="flex items-center gap-1.5">
            <Building2 className="h-3 w-3" />
            Active client
          </span>
        </DropdownMenuLabel>
        {displayClients.map((c) => {
          const isActive = displayActiveId === c.id;
          return (
            <DropdownMenuItem
              key={c.id}
              onClick={() => setActiveClient(c.id)}
              className={isActive ? "font-medium" : ""}
            >
              <Building2 className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
              <span className="flex-1 truncate text-xs">{c.name}</span>
              {isActive && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
            </DropdownMenuItem>
          );
        })}

        {/* Account & system settings */}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/settings")}>
          <Settings className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/insights-v2/feed?onboarding=true")}>
          <Sparkles className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
          Onboarding
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/plans-v2")}>
          <Receipt className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
          Plans
        </DropdownMenuItem>
        {!isAiPlan && (
          <DropdownMenuItem onClick={() => navigate("/integrations")}>
            <Plug className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
            Integration
          </DropdownMenuItem>
        )}
        {!isAiPlan && (
          <DropdownMenuItem onClick={() => navigate("/ums")}>
            <Users className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
            Team
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onClick={() => navigate("/settings/clients")}>
          <UserPlus className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
          Clients
        </DropdownMenuItem>

        {/* Preferences */}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => window.open("https://fabads.com/help", "_blank")}
        >
          <HelpCircle className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
          Help &amp; Support
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme(isDark ? "light" : "dark")}>
          {isDark
            ? <Sun className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
            : <Moon className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
          }
          {isDark ? "Light mode" : "Dark mode"}
          <span className="ml-auto text-[10px] text-muted-foreground">⌘⇧D</span>
        </DropdownMenuItem>

        {/* Danger */}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={signOut}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-3.5 w-3.5" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
