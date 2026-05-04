import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useClientContext } from "@/contexts/ClientContext";
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
  Settings, Plug, Users, UserPlus, LayoutGrid, Check,
} from "lucide-react";
import {
  useFabAdsNavVariant,
  VARIANT_CYCLE,
  VARIANT_META,
  type FabAdsNavVariant,
} from "@/components/sidebar/useFabAdsNavVariant";

/**
 * UserMenu — profile dropdown (nav iter-4, 2026-05-01).
 *
 * Flat structure — NO sub-menus. Group separators only.
 * Absorbs: Settings, Integration, Team, Clients, Help, Theme, Sign out.
 * Removed: Copilot toggle (→ Tools module), Activity Log (→ NotificationBell).
 */
export function UserMenu({ compact = false }: { compact?: boolean }) {
  const navigate = useNavigate();
  const { user, role, signOut } = useAuth();
  const { activeClient, clients, setActiveClient } = useClientContext();
  const { setTheme, resolvedTheme } = useTheme();

  if (!user) return null;

  const initials = user.email?.slice(0, 2).toUpperCase() ?? "U";
  const isDark = resolvedTheme === "dark";

  // Nav variant picker (moved into profile pop-over per Maalik A-10.12).
  const { variant: currentVariant, setVariant } = useFabAdsNavVariant();

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
              {activeClient && (
                <p className="text-[10px] text-muted-foreground truncate">{activeClient.name}</p>
              )}
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

        {/* Client switcher (only if multiple clients) */}
        {clients.length > 1 && (
          <>
            <DropdownMenuSeparator />
            {clients.map((c) => (
              <DropdownMenuItem
                key={c.id}
                onClick={() => setActiveClient(c.id)}
                className={activeClient?.id === c.id ? "font-medium" : ""}
              >
                <Building2 className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                <span className="truncate">{c.name}</span>
              </DropdownMenuItem>
            ))}
          </>
        )}

        {/* Account & system settings */}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/settings")}>
          <Settings className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/integrations")}>
          <Plug className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
          Integration
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate("/ums")}>
          <Users className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
          Team
        </DropdownMenuItem>
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

        {/* Nav variant picker (A-10.12: moved from rail chevron into the
            profile pop-over per Maalik — "keep it inside the pop-over"). */}
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-[9px] font-mono uppercase tracking-wider text-muted-foreground py-1">
          <span className="flex items-center gap-1.5">
            <LayoutGrid className="h-3 w-3" />
            Nav variant
          </span>
        </DropdownMenuLabel>
        {VARIANT_CYCLE.map((key) => {
          const meta = VARIANT_META[key];
          const isActive = currentVariant === key;
          return (
            <DropdownMenuItem
              key={key}
              onClick={() => setVariant(key as FabAdsNavVariant)}
              className={isActive ? "font-medium" : ""}
            >
              <span className="mr-2 inline-flex h-3.5 w-3.5 items-center justify-center text-[9px] font-mono text-muted-foreground">
                {meta.index}
              </span>
              <span className="flex-1 truncate text-xs">{meta.label}</span>
              {isActive && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
            </DropdownMenuItem>
          );
        })}

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
