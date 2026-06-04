import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { MoreHorizontal, Eye, Copy, BarChart3, Trash2, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import type { LaunchWithCounts } from "@/hooks/use-launch";

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  draft: "secondary",
  in_progress: "outline",
  success: "default",
  failed: "destructive",
};

const STRATEGY_LABEL: Record<string, string> = {
  fill_first: "Fill First",
  equal: "Equal",
  duplicate: "Duplicate",
};

// Resolve the launch strategy from the column (post-migration) OR the
// launch_config.distribution JSON Step 1 writes (always present). "—" when
// neither carries one (non-distributed launch).
function resolveStrategy(launch: LaunchWithCounts): string | null {
  const col = launch.launch_strategy;
  if (col && STRATEGY_LABEL[col]) return col;
  const fromConfig = (launch.launch_config as any)?.distribution?.strategy;
  return fromConfig && STRATEGY_LABEL[fromConfig] ? fromConfig : null;
}

interface Props {
  launches: LaunchWithCounts[];
  onViewDetails: (launch: LaunchWithCounts) => void;
  onRelaunch: (launchId: string) => void;
  onDelete: (launchId: string) => void;
  onRename: (launchId: string, name: string) => void;
}

export function LaunchHistoryTable({ launches, onViewDetails, onRelaunch, onDelete, onRename }: Props) {
  const navigate = useNavigate();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleNameBlur = (launch: LaunchWithCounts) => {
    if (editingName && editingName !== launch.name) {
      onRename(launch.id, editingName);
    }
    setEditingId(null);
  };

  const handleRowClick = (launch: LaunchWithCounts) => {
    if (launch.status === "draft" && editingId !== launch.id) {
      navigate(`/launch/${launch.id}`);
    }
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Launch Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Strategy</TableHead>
            <TableHead>Platform</TableHead>
            <TableHead className="text-center">Campaigns</TableHead>
            <TableHead className="text-center">Adsets</TableHead>
            <TableHead className="text-center">Ads</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead>Created By</TableHead>
            <TableHead>Last Modified By</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {launches.map((launch) => (
            <TableRow
              key={launch.id}
              className={launch.status === "draft" ? "cursor-pointer hover:bg-muted/50" : ""}
              onClick={() => handleRowClick(launch)}
            >
              <TableCell className="font-medium">
                {editingId === launch.id ? (
                  <Input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={() => handleNameBlur(launch)}
                    onKeyDown={(e) => e.key === "Enter" && handleNameBlur(launch)}
                    autoFocus
                    className="h-7 text-sm w-48"
                    onClick={(e) => e.stopPropagation()}
                    autoComplete="off" data-1p-ignore data-lpignore="true"
                  />
                ) : (
                  <span
                    className={launch.status === "draft" ? "hover:underline" : ""}
                    onDoubleClick={(e) => {
                      if (launch.status === "draft") {
                        e.stopPropagation();
                        setEditingId(launch.id);
                        setEditingName(launch.name);
                      }
                    }}
                  >
                    {launch.name}
                  </span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Badge variant={(launch.launch_config as any)?.mode === "catalogue" ? "default" : "outline"}>
                    {(launch.launch_config as any)?.mode === "catalogue" ? "Catalogue" : "Standard"}
                  </Badge>
                  {(launch.launch_config as any)?.source === "creative_library_adgroup_launch" && (
                    <Badge variant="secondary" className="text-[9px]">From CL</Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {(() => {
                  const strat = resolveStrategy(launch);
                  return strat ? (
                    <Badge variant="outline">{STRATEGY_LABEL[strat]}</Badge>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  );
                })()}
              </TableCell>
              <TableCell>
                <Badge variant="outline">Facebook</Badge>
              </TableCell>
              <TableCell>
                <Badge variant={statusVariant[launch.status] || "secondary"}>
                  {launch.status.replace("_", " ")}
                </Badge>
              </TableCell>
              <TableCell className="text-center">{launch.campaign_count}</TableCell>
              <TableCell className="text-center">{launch.adset_count}</TableCell>
              <TableCell className="text-center">{launch.ad_count}</TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {format(new Date(launch.created_at), "MMM d, yyyy")}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {format(new Date(launch.updated_at), "MMM d, yyyy")}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {(launch as any).created_by_email || "—"}
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {(launch as any).last_modified_by_email || "—"}
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {launch.status === "draft" ? (
                      <>
                        <DropdownMenuItem onClick={() => navigate(`/launch/${launch.id}`)}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onViewDetails(launch)}>
                          <Eye className="mr-2 h-4 w-4" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => setDeleteId(launch.id)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <>
                        <DropdownMenuItem onClick={() => onViewDetails(launch)}>
                          <Eye className="mr-2 h-4 w-4" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onRelaunch(launch.id)}>
                          <Copy className="mr-2 h-4 w-4" /> Relaunch
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/reports/fb?launch=${launch.id}`)}>
                          <BarChart3 className="mr-2 h-4 w-4" /> Go to Report
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Draft Launch?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this draft launch and all its campaigns, ad sets, and ads. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteId) { onDelete(deleteId); setDeleteId(null); } }}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
