import React, { type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InsightsV2ErrorBoundaryProps {
  surfaceLabel: string;
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class InsightsV2ErrorBoundary extends React.Component<InsightsV2ErrorBoundaryProps, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("InsightsV2 boundary", error, info);
  }

  reset = () => this.setState({ hasError: false, error: undefined });

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <div className="text-center max-w-md">
            <h3 className="text-sm font-medium text-foreground">
              Couldn't load the {this.props.surfaceLabel}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Something went wrong while rendering this page. Try again — your filters are preserved.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={this.reset}>
            Try again
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}

export { InsightsV2ErrorBoundary };
