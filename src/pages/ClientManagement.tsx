import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/hooks/use-workspace";
import { useClients, Client } from "@/hooks/use-clients";
import { CreateClientModal } from "@/components/clients/CreateClientModal";
import { ClientDetailDrawer } from "@/components/clients/ClientDetailDrawer";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, DollarSign, TrendingUp, BarChart3, Layers } from "lucide-react";

/* Deterministic dummy KPIs seeded from client name */
function clientKpis(name: string) {
  let seed = 0;
  for (let i = 0; i < name.length; i++) seed += name.charCodeAt(i);
  const spend = 1000 + (seed * 137) % 9000;
  const roas = 1.2 + ((seed * 53) % 40) / 10;
  const ads = 10 + (seed * 7) % 90;
  const campaigns = 2 + (seed * 3) % 8;
  return { spend, roas, ads, campaigns };
}

export default function ClientManagement() {
  const { role } = useAuth();
  const workspaceId = useWorkspace();
  const { clients, clientUsers, loading, refetch } = useClients();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const canManage = role === "owner" || role === "admin";
  const isAdmin = role === "owner" || role === "admin";

  const getUserCount = (clientId: string) =>
    clientUsers.filter((cu) => cu.client_id === clientId).length;

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Aggregate KPIs across all clients for admin overview
  const totalKpis = clients.reduce(
    (acc, c) => {
      const k = clientKpis(c.name);
      acc.spend += k.spend;
      acc.ads += k.ads;
      acc.campaigns += k.campaigns;
      return acc;
    },
    { spend: 0, ads: 0, campaigns: 0 }
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Clients</h1>
          <p className="text-sm text-muted-foreground">Manage the brands and clients you work with.</p>
        </div>
        {canManage && workspaceId && (
          <CreateClientModal workspaceId={workspaceId} onCreated={refetch} />
        )}
      </div>

      {/* Admin overview KPI cards */}
      {isAdmin && clients.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground">Total Clients</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><p className="text-2xl font-bold">{clients.length}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground">Total Spend</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><p className="text-2xl font-bold">${totalKpis.spend.toLocaleString()}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground">Total Ads</CardTitle>
              <Layers className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><p className="text-2xl font-bold">{totalKpis.ads}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-medium text-muted-foreground">Campaigns</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent><p className="text-2xl font-bold">{totalKpis.campaigns}</p></CardContent>
          </Card>
        </div>
      )}

      {clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
          <Building2 className="h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">No clients added yet.</p>
          <p className="text-xs text-muted-foreground">Add your first client to start organizing by brand.</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Spend</TableHead>
                <TableHead>ROAS</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Added</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((c) => {
                const kpis = clientKpis(c.name);
                return (
                  <TableRow
                    key={c.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => {
                      setSelectedClient(c);
                      setDrawerOpen(true);
                    }}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          {c.logo_url && <AvatarImage src={c.logo_url} />}
                          <AvatarFallback className="text-[10px]">{c.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{c.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{c.industry ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{getUserCount(c.id)}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">${kpis.spend.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={kpis.roas >= 2 ? "default" : "secondary"}>{kpis.roas.toFixed(1)}x</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={c.status === "active" ? "default" : "outline"} className="capitalize">
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(c.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <ClientDetailDrawer
        client={selectedClient}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onUpdated={refetch}
      />
    </div>
  );
}
