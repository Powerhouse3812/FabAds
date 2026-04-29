export type ActionType = "suggestion" | "assisted" | "direct" | "controlled";

export interface CopilotAction {
  id: string;
  type: ActionType;
  label: string;
  description: string;
  action_type: string;
  params: Record<string, any>;
  status: "pending" | "executing" | "success" | "error";
  result?: any;
}

export function createAction(
  label: string,
  description: string,
  actionType: string,
  params: Record<string, any>,
  type: ActionType = "assisted"
): CopilotAction {
  return {
    id: crypto.randomUUID(),
    type,
    label,
    description,
    action_type: actionType,
    params,
    status: "pending",
  };
}
