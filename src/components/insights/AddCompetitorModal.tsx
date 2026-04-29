import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useInsightCompetitors } from "@/hooks/use-insight-competitors";
import { toast } from "sonner";

interface Props { open: boolean; onClose: () => void }

export function AddCompetitorModal({ open, onClose }: Props) {
  const [name, setName] = useState("");
  const [type, setType] = useState("domain");
  const [identifier, setIdentifier] = useState("");
  const [country, setCountry] = useState("");
  const [language, setLanguage] = useState("");
  const [description, setDescription] = useState("");
  const { addCompetitor } = useInsightCompetitors();

  const handleAdd = () => {
    addCompetitor.mutate(
      { name, competitor_type: type, identifier, country: country || undefined, language: language || undefined, description: description || undefined },
      { onSuccess: () => { toast.success("Competitor added"); resetAndClose(); }, onError: () => toast.error("Failed to add") },
    );
  };

  const resetAndClose = () => { setName(""); setIdentifier(""); setCountry(""); setLanguage(""); setDescription(""); onClose(); };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && resetAndClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Add Competitor</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Brand or page name" /></div>
          <div>
            <Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
              <SelectItem value="domain">Domain</SelectItem>
                <SelectItem value="page">Page</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Identifier *</Label><Input value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="URL or Page ID" /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Country</Label><Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Optional" /></div>
            <div><Label>Language</Label><Input value={language} onChange={(e) => setLanguage(e.target.value)} placeholder="Optional" /></div>
          </div>
          <div><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" rows={2} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={resetAndClose}>Cancel</Button>
          <Button onClick={handleAdd} disabled={!name.trim() || !identifier.trim() || addCompetitor.isPending}>
            {addCompetitor.isPending ? "Adding..." : "Add Competitor"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
