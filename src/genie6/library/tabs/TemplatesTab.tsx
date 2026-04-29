import { EmptyState } from "../../components/EmptyState";

export function TemplatesTab() {
  // Phase A4 mocks don't seed templates yet — real templates land with the Edit drawer in Phase B.
  return (
    <EmptyState
      title="No templates yet"
      description="Save the visual layout of a winning ad as a Template. Apply it to future generations to keep composition consistent across products."
    />
  );
}
