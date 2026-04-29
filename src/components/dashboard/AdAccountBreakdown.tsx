import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { topAdAccounts } from "@/lib/dashboard-selectors";

interface AdAccountBreakdownProps {
  dateSeed: number;
}

export function AdAccountBreakdown({ dateSeed }: AdAccountBreakdownProps) {
  const accounts = topAdAccounts(dateSeed, 5);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Ad Account Performance</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Account</TableHead>
              <TableHead className="text-xs text-right">Spend</TableHead>
              <TableHead className="text-xs text-right">CPA</TableHead>
              <TableHead className="text-xs text-right">CPC</TableHead>
              <TableHead className="text-xs text-right">CTR</TableHead>
              <TableHead className="text-xs text-right">Conv.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {accounts.map((a) => (
              <TableRow key={a.name}>
                <TableCell className="text-sm font-medium">{a.name}</TableCell>
                <TableCell className="text-sm text-right">${a.spend.toLocaleString()}</TableCell>
                <TableCell className="text-sm text-right">${a.cpa.toFixed(2)}</TableCell>
                <TableCell className="text-sm text-right">${a.cpc.toFixed(2)}</TableCell>
                <TableCell className="text-sm text-right">{a.ctr}%</TableCell>
                <TableCell className="text-sm text-right">{a.conversions}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="px-3 py-2 border-t border-border">
          <Link
            to="/reports/performance/ad-accounts"
            className="text-xs font-medium text-foreground hover:underline inline-flex items-center gap-1"
          >
            View all accounts <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
