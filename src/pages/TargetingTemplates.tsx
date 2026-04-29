import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Pencil, Loader2, Search, SlidersHorizontal } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import {
  useTargetingTemplates,
  useCreateTargetingTemplate,
  useUpdateTargetingTemplate,
  useDeleteTargetingTemplate,
} from "@/hooks/use-targeting-templates";
import { STEP2_DEFAULTS } from "@/lib/step2-defaults";
import type { CampaignFormData, AdsetFormData, AdsFormData } from "@/lib/step2-defaults";
import { TargetingFormFields } from "@/components/launch/TargetingFormFields";
import { validateTargetingFields, scrollToFirstError } from "@/lib/template-validation";
import { format } from "date-fns";
import { FieldError } from "@/components/launch/FieldError";

interface DrawerState {
  id?: string;
  name: string;
  campaign: CampaignFormData;
  adset: AdsetFormData;
  ads: AdsFormData;
}

function deepMergeDefaults<T extends Record<string, any>>(data: Partial<T>, defaults: T): T {
  const result = { ...defaults };
  for (const key of Object.keys(defaults)) {
    if (data[key] !== undefined && data[key] !== null) {
      if (typeof defaults[key] === "object" && !Array.isArray(defaults[key]) && defaults[key] !== null) {
        result[key as keyof T] = deepMergeDefaults(data[key], defaults[key]) as any;
      } else {
        result[key as keyof T] = data[key] as any;
      }
    }
  }
  return result;
}

export default function TargetingTemplates() {
  const { data: templates = [], isLoading } = useTargetingTemplates();
  const createMutation = useCreateTargetingTemplate();
  const updateMutation = useUpdateTargetingTemplate();
  const deleteMutation = useDeleteTargetingTemplate();

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [drawer, setDrawer] = useState<DrawerState | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [nameError, setNameError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTemplates = templates.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const openCreate = () => {
    setFieldErrors({});
    setNameError("");
    setDrawer({
      name: "",
      campaign: { ...STEP2_DEFAULTS.campaign },
      adset: { ...STEP2_DEFAULTS.adset, targeting: { ...STEP2_DEFAULTS.adset.targeting }, placements: { ...STEP2_DEFAULTS.adset.placements } },
      ads: { ...STEP2_DEFAULTS.ads },
    });
  };

  const openEdit = (tpl: any) => {
    setFieldErrors({});
    setNameError("");
    const payload = (tpl.template_payload || {}) as Record<string, any>;
    setDrawer({
      id: tpl.id,
      name: tpl.name,
      campaign: deepMergeDefaults(payload.campaign || {}, STEP2_DEFAULTS.campaign),
      adset: deepMergeDefaults(payload.adset || {}, { ...STEP2_DEFAULTS.adset, targeting: { ...STEP2_DEFAULTS.adset.targeting }, placements: { ...STEP2_DEFAULTS.adset.placements } }),
      ads: deepMergeDefaults(payload.ads || {}, STEP2_DEFAULTS.ads),
    });
  };

  const handleSave = async () => {
    if (!drawer) return;

    // Validate name
    if (!drawer.name.trim()) {
      setNameError("Template name is required");
      return;
    }
    setNameError("");

    // Validate fields
    const validation = validateTargetingFields({
      campaign: drawer.campaign,
      adset: drawer.adset,
      ads: drawer.ads,
    });

    if (!validation.valid) {
      setFieldErrors(validation.fieldErrors);
      scrollToFirstError(validation.fieldErrors);
      return;
    }
    setFieldErrors({});

    const payload = {
      version: 1,
      campaign: drawer.campaign,
      adset: drawer.adset,
      ads: drawer.ads,
    };

    try {
      if (drawer.id) {
        await updateMutation.mutateAsync({ id: drawer.id, name: drawer.name.trim(), payload });
        toast({ title: "Template updated" });
      } else {
        await createMutation.mutateAsync({ name: drawer.name.trim(), payload });
        toast({ title: "Template created" });
      }
      setDrawer(null);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync(deleteId);
      toast({ title: "Template deleted" });
      setDeleteId(null);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon"><SlidersHorizontal className="h-4 w-4" /></Button>
        <Button className="ml-auto" onClick={openCreate}><Plus className="h-4 w-4 mr-2" />New Template</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Loading...</TableCell></TableRow>
              )}
              {!isLoading && templates.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No templates yet.</TableCell></TableRow>
              )}
              {filteredTemplates.map((tpl) => (
                <TableRow key={tpl.id}>
                  <TableCell className="font-medium">{tpl.name}</TableCell>
                  <TableCell><Badge variant="secondary">Facebook</Badge></TableCell>
                  <TableCell className="text-muted-foreground text-sm">{format(new Date(tpl.created_at), "MMM d, yyyy")}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(tpl)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setDeleteId(tpl.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Template Settings Drawer */}
      <Sheet open={!!drawer} onOpenChange={(o) => !o && setDrawer(null)}>
        <SheetContent side="right" className="sm:max-w-2xl w-full p-0 flex flex-col">
          <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
            <SheetTitle>{drawer?.id ? "Edit Template" : "New Template"}</SheetTitle>
            <SheetDescription>Configure the full targeting settings for this template.</SheetDescription>
          </SheetHeader>

          <ScrollArea className="flex-1 px-6 py-4">
            {drawer && (
              <div className="space-y-6 pb-6">
                {/* Template Name */}
                <div className="space-y-1.5" data-field="template-name" id="template-name">
                  <Label className="text-xs">Template Name <span className="text-destructive">*</span></Label>
                  <Input
                    value={drawer.name}
                    onChange={(e) => setDrawer((prev) => prev ? { ...prev, name: e.target.value } : null)}
                    placeholder="e.g. High-value audiences"
                    className={nameError ? "border-destructive" : ""}
                  />
                  <FieldError error={nameError} />
                </div>

                {/* Shared targeting form */}
                <TargetingFormFields
                  campaignData={drawer.campaign}
                  adsetData={drawer.adset}
                  adsData={drawer.ads}
                  onCampaignChange={(fields) => setDrawer((prev) => prev ? { ...prev, campaign: { ...prev.campaign, ...fields } } : null)}
                  onAdsetChange={(fields) => setDrawer((prev) => {
                    if (!prev) return null;
                    const newAdset = { ...prev.adset, ...fields };
                    // Deep merge targeting and placements
                    if (fields.targeting) newAdset.targeting = { ...prev.adset.targeting, ...(fields.targeting as any) };
                    if (fields.placements) newAdset.placements = { ...prev.adset.placements, ...(fields.placements as any) };
                    return { ...prev, adset: newAdset };
                  })}
                  onAdsChange={(fields) => setDrawer((prev) => prev ? { ...prev, ads: { ...prev.ads, ...fields } } : null)}
                  fieldErrors={fieldErrors}
                />
              </div>
            )}
          </ScrollArea>

          <SheetFooter className="px-6 py-4 border-t border-border">
            <div className="flex gap-2 w-full justify-end">
              <Button variant="ghost" onClick={() => setDrawer(null)}>Cancel</Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. Launches using this template will not be affected.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
