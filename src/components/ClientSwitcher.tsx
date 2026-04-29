import { Check, ChevronsUpDown, Building2 } from "lucide-react";
import { useClientContext } from "@/contexts/ClientContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export function ClientSwitcher() {
  const { activeClientId, activeClient, clients, setActiveClient } = useClientContext();

  // Hide switcher if no clients exist yet
  if (clients.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 max-w-[200px]">
          {activeClient ? (
            <>
              <Avatar className="h-5 w-5">
                {activeClient.logo_url && <AvatarImage src={activeClient.logo_url} />}
                <AvatarFallback className="text-[10px]">
                  {activeClient.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="truncate text-xs font-medium">{activeClient.name}</span>
            </>
          ) : (
            <>
              <Building2 className="h-4 w-4" />
              <span className="text-xs font-medium">Select Client</span>
            </>
          )}
          <ChevronsUpDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Switch Client</span>
          <Badge variant="secondary" className="text-[10px]">{clients.length}</Badge>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {clients.map((c) => (
          <DropdownMenuItem key={c.id} onClick={() => setActiveClient(c.id)} className="gap-2">
            <Avatar className="h-5 w-5">
              {c.logo_url && <AvatarImage src={c.logo_url} />}
              <AvatarFallback className="text-[10px]">
                {c.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0">
              <span className="truncate text-sm">{c.name}</span>
              {c.industry && <span className="text-[10px] text-muted-foreground truncate">{c.industry}</span>}
            </div>
            {activeClientId === c.id && <Check className="h-3.5 w-3.5 ml-auto flex-shrink-0" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
