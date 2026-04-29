import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { topUsers } from "@/lib/dashboard-selectors";

interface UserLeaderboardProps {
  dateSeed: number;
}

export function UserLeaderboard({ dateSeed }: UserLeaderboardProps) {
  const users = topUsers(dateSeed, 8);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">User Leaderboard — Top 8</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs w-8 py-2 px-3 uppercase tracking-wider font-medium">#</TableHead>
              <TableHead className="text-xs py-2 px-3 uppercase tracking-wider font-medium">User</TableHead>
              <TableHead className="text-xs text-right py-2 px-3 uppercase tracking-wider font-medium">Spend</TableHead>
              <TableHead className="text-xs text-right py-2 px-3 uppercase tracking-wider font-medium">Revenue</TableHead>
              <TableHead className="text-xs text-right py-2 px-3 uppercase tracking-wider font-medium">ROAS</TableHead>
              <TableHead className="text-xs text-right py-2 px-3 uppercase tracking-wider font-medium">Margin</TableHead>
              <TableHead className="text-xs text-right py-2 px-3 uppercase tracking-wider font-medium">Active</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u, i) => (
              <TableRow key={u.name} className="hover:bg-muted/50">
                <TableCell className="text-sm text-muted-foreground py-2 px-3">{i + 1}</TableCell>
                <TableCell className="text-sm font-medium py-2 px-3">{u.name}</TableCell>
                <TableCell className="text-sm text-right py-2 px-3">${u.spend.toLocaleString()}</TableCell>
                <TableCell className="text-sm text-right py-2 px-3">${u.revenue.toLocaleString()}</TableCell>
                <TableCell className="text-sm text-right py-2 px-3">{u.roas.toFixed(2)}</TableCell>
                <TableCell className="text-sm text-right py-2 px-3">${u.margin.toLocaleString()}</TableCell>
                <TableCell className="text-sm text-right py-2 px-3">{u.activeCampaigns}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
