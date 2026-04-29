import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";

interface FetchingAccountsStepProps {
  onFetched: (data: any) => void;
  fetchAccounts: () => Promise<any>;
}

export default function FetchingAccountsStep({ onFetched, fetchAccounts }: FetchingAccountsStepProps) {
  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        const data = await fetchAccounts();
        onFetched(data);
      } catch (err) {
        console.error("Failed to fetch accounts:", err);
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-6 py-4">
      <div className="flex items-center gap-3">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <div>
          <h3 className="text-base font-semibold text-foreground">Fetching your ad accounts...</h3>
          <p className="text-sm text-muted-foreground">Please wait while we retrieve your Business Managers and Ad Accounts.</p>
        </div>
      </div>
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
