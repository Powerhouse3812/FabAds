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
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LogOut, Sun, Moon, HelpCircle, MessageSquare, Activity, Building2,
  ChevronsUpDown,
} from "lucide-react";
import { useCopilot } from "@/contexts/CopilotContext";

/**
 * UserMenu — universal profile dropdown.
 *
 * After iter-3 IA restructure, this dropdown absorbs everything that used to
 * live as separate icons in the topbar:
 *   - Theme toggle (was sun/moon icon)
 *   - Help (was HelpIcon)
 *   - Copilot trigger (was the brain icon)
 *   - Client switcher (was ClientSwitcher)
 *   - Activity log (was a sidebar item, now linked from here)
 *   - Sign out (always was here)
 *
 * The trigger is the user avatar; rendered in the sidebar bottom block.
 */
export function UserMenu({ compact = false }: { compact?: boolean }) {
  const navigate = useNavigate();
  const { user, role, signOut } = useAuth();
  const { activeClient, clients, setActiveClient } = useClientContext();
  const { setTheme, resolvedTheme } = useTheme();
  const copilot = useCopilot();

  if (!user) return null;

  const initials = user.email?.slice(0, 2).toUpperCase() ?? "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring px-2 py-1.5 hover:bg-sidebar-accent/50 w-full"
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

      <DropdownMenuContent align="end" side="top" className="w-64">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{user.email}</p>
            <p className="text-xs text-muted-foreground capitalize">{role}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Client switcher (was a separate topbar component) */}
        {clients.length > 1 && (
          <>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Building2 className="mr-2 h-4 w-4" />
                <span className="flex-1">Switch client</span>
                {activeClient && (
                  <span className="ml-2 text-xs text-muted-foreground truncate max-w-[100px]">
                    {activeClient.name}
                  </span>
                )}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {clients.map((c) => (
                  <DropdownMenuItem key={c.id} onClick={() => setActiveClient(c.id)}>
                    {c.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Theme toggle */}
        <DropdownMenuItem onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
          {resolvedTheme === "dark" ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
          {resolvedTheme === "dark" ? "Light mode" : "Dark mode"}
          <span className="ml-auto text-xs text-muted-foreground">⌘⇧D</span>
        </DropdownMenuItem>

        {/* Activity log */}
        <DropdownMenuItem onClick={() => navigate("/activity-logs")}>
          <Activity className="mr-2 h-4 w-4" />
          Activity log
        </DropdownMenuItem>

        {/* Copilot trigger */}
        <DropdownMenuItem onClick={() => copilot.toggle()}>
          <MessageSquare className="mr-2 h-4 w-4" />
          {copilot.isOpen ? "Close copilot" : "Open copilot"}
        </DropdownMenuItem>

        {/* Help */}
        <DropdownMenuItem onClick={() => window.open("https://fabads.com/help", "_blank")}>
          <HelpCircle className="mr-2 h-4 w-4" />
          Help &amp; documentation
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
