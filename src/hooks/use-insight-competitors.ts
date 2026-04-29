import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/hooks/use-workspace";
import { toast } from "sonner";

export function useInsightCompetitors() {
  const wsId = useWorkspace();
  const qc = useQueryClient();

  const competitors = useQuery({
    queryKey: ["insight-competitors", wsId],
    enabled: !!wsId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("insight_competitors")
        .select("*")
        .eq("workspace_id", wsId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addCompetitor = useMutation({
    mutationFn: async (values: { name: string; competitor_type: string; identifier: string; country?: string; language?: string; description?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !wsId) throw new Error("Not authenticated");
      const { error } = await supabase.from("insight_competitors").insert({
        workspace_id: wsId,
        created_by: user.id,
        ...values,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["insight-competitors", wsId] }),
  });

  const deleteCompetitor = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("insight_competitors").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["insight-competitors", wsId] }),
  });

  // Quick-add brand from ad card
  const addBrandToCompetitors = useMutation({
    mutationFn: async (values: { name: string; identifier: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !wsId) throw new Error("Not authenticated");
      // Check for duplicates
      const { data: existing } = await supabase
        .from("insight_competitors")
        .select("id")
        .eq("workspace_id", wsId)
        .eq("name", values.name)
        .limit(1);
      if (existing && existing.length > 0) {
        throw new Error("ALREADY_TRACKED");
      }
      const { error } = await supabase.from("insight_competitors").insert({
        workspace_id: wsId,
        created_by: user.id,
        name: values.name,
        identifier: values.identifier,
        competitor_type: "brand",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["insight-competitors", wsId] });
      toast.success("Brand added to Competitors");
    },
    onError: (err: Error) => {
      if (err.message === "ALREADY_TRACKED") {
        toast.info("Brand already tracked in Competitors");
      } else {
        toast.error("Failed to add brand");
      }
    },
  });

  // Quick-add page from ad card
  const addPageToCompetitors = useMutation({
    mutationFn: async (values: { name: string; pageId: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !wsId) throw new Error("Not authenticated");
      // Check for duplicates
      const { data: existing } = await supabase
        .from("insight_competitors")
        .select("id")
        .eq("workspace_id", wsId)
        .eq("identifier", values.pageId)
        .limit(1);
      if (existing && existing.length > 0) {
        throw new Error("ALREADY_TRACKED");
      }
      const { error } = await supabase.from("insight_competitors").insert({
        workspace_id: wsId,
        created_by: user.id,
        name: values.name,
        identifier: values.pageId,
        competitor_type: "page",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["insight-competitors", wsId] });
      toast.success("Page added to Competitors");
    },
    onError: (err: Error) => {
      if (err.message === "ALREADY_TRACKED") {
        toast.info("Page already tracked in Competitors");
      } else {
        toast.error("Failed to add page");
      }
    },
  });

  return { competitors: competitors.data ?? [], isLoading: competitors.isLoading, addCompetitor, deleteCompetitor, addBrandToCompetitors, addPageToCompetitors };
}

export function useCompetitorDomains(competitorId: string | undefined) {
  const wsId = useWorkspace();
  const qc = useQueryClient();

  const domains = useQuery({
    queryKey: ["insight-domains", competitorId],
    enabled: !!competitorId && !!wsId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("insight_domains")
        .select("*")
        .eq("competitor_id", competitorId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addDomain = useMutation({
    mutationFn: async (values: { name: string; url: string; country?: string; language?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !wsId || !competitorId) throw new Error("Not authenticated");
      const { error } = await supabase.from("insight_domains").insert({
        workspace_id: wsId,
        competitor_id: competitorId,
        created_by: user.id,
        ...values,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["insight-domains", competitorId] }),
  });

  const deleteDomain = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("insight_domains").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["insight-domains", competitorId] }),
  });

  return { domains: domains.data ?? [], isLoading: domains.isLoading, addDomain, deleteDomain };
}

export function useCompetitorPages(competitorId: string | undefined) {
  const wsId = useWorkspace();
  const qc = useQueryClient();

  const pages = useQuery({
    queryKey: ["insight-pages", competitorId],
    enabled: !!competitorId && !!wsId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("insight_pages")
        .select("*")
        .eq("competitor_id", competitorId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addPage = useMutation({
    mutationFn: async (values: { name: string; page_id: string; description?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !wsId || !competitorId) throw new Error("Not authenticated");
      const { error } = await supabase.from("insight_pages").insert({
        workspace_id: wsId,
        competitor_id: competitorId,
        created_by: user.id,
        ...values,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["insight-pages", competitorId] }),
  });

  return { pages: pages.data ?? [], isLoading: pages.isLoading, addPage };
}

export function useCompetitorKeywords(competitorId: string | undefined) {
  const wsId = useWorkspace();
  const qc = useQueryClient();

  const keywords = useQuery({
    queryKey: ["insight-keywords", competitorId],
    enabled: !!competitorId && !!wsId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("insight_keywords")
        .select("*")
        .eq("competitor_id", competitorId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addKeyword = useMutation({
    mutationFn: async (values: { keyword: string; description?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !wsId || !competitorId) throw new Error("Not authenticated");
      const { error } = await supabase.from("insight_keywords").insert({
        workspace_id: wsId,
        competitor_id: competitorId,
        created_by: user.id,
        ...values,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["insight-keywords", competitorId] }),
  });

  return { keywords: keywords.data ?? [], isLoading: keywords.isLoading, addKeyword };
}

// Domain/page count hooks for dashboard
export function useCompetitorCounts(competitorIds: string[]) {
  const wsId = useWorkspace();

  const domainCounts = useQuery({
    queryKey: ["insight-domain-counts", wsId, competitorIds],
    enabled: !!wsId && competitorIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("insight_domains")
        .select("competitor_id")
        .eq("workspace_id", wsId!)
        .in("competitor_id", competitorIds);
      if (error) throw error;
      const counts: Record<string, number> = {};
      data?.forEach(d => { counts[d.competitor_id] = (counts[d.competitor_id] || 0) + 1; });
      return counts;
    },
  });

  const pageCounts = useQuery({
    queryKey: ["insight-page-counts", wsId, competitorIds],
    enabled: !!wsId && competitorIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("insight_pages")
        .select("competitor_id")
        .eq("workspace_id", wsId!)
        .in("competitor_id", competitorIds);
      if (error) throw error;
      const counts: Record<string, number> = {};
      data?.forEach(p => { counts[p.competitor_id] = (counts[p.competitor_id] || 0) + 1; });
      return counts;
    },
  });

  return {
    domainCounts: domainCounts.data ?? {},
    pageCounts: pageCounts.data ?? {},
    totalDomains: Object.values(domainCounts.data ?? {}).reduce((a, b) => a + b, 0),
    totalPages: Object.values(pageCounts.data ?? {}).reduce((a, b) => a + b, 0),
  };
}
