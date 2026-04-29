import { Badge } from "@/components/ui/badge";

interface ShellPageProps {
  title: string;
  description: string;
  comingSoon?: boolean;
}

export default function ShellPage({ title, description, comingSoon }: ShellPageProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <h1 className="text-3xl font-bold text-foreground">{title}</h1>
      <p className="text-muted-foreground max-w-md">{description}</p>
      {comingSoon && (
        <Badge variant="secondary" className="text-sm">Coming Soon</Badge>
      )}
    </div>
  );
}
