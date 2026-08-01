export type ResourceKey = "members" | "teams" | "clients" | "roles";

export type ResourcePermission = {
  actions: string[];
  scope?: "all" | "own";
};

export type PermissionSet = Partial<Record<ResourceKey, ResourcePermission>>;

const RESOURCE_ORDER: ResourceKey[] = ["members", "teams", "clients", "roles"];

const RESOURCE_LABELS: Record<ResourceKey, string> = {
  members: "members",
  teams: "teams",
  clients: "clients",
  roles: "roles",
};

const ACTION_LABELS: Record<string, string> = {
  view: "view",
  edit: "edit",
  create: "create",
  delete: "delete",
  assign: "assign",
};

export function can(
  permissions: PermissionSet | null | undefined,
  resource: ResourceKey,
  action: string,
): boolean {
  if (!permissions) return false;
  return permissions[resource]?.actions.includes(action) ?? false;
}

export function isScopedToOwn(
  permissions: PermissionSet | null | undefined,
  resource: ResourceKey,
): boolean {
  return permissions?.[resource]?.scope === "own";
}

function joinActions(actions: string[]): string {
  const labels = actions.map((action) => ACTION_LABELS[action] ?? action);
  if (labels.length === 0) return "";
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return `${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`;
}

export function describePermissions(
  permissions: PermissionSet | null | undefined,
): string[] {
  if (!permissions) return [];

  const lines: string[] = [];

  for (const resource of RESOURCE_ORDER) {
    const entry = permissions[resource];
    const actions = entry?.actions ?? [];
    const label = RESOURCE_LABELS[resource];

    if (actions.length === 0) {
      lines.push(`No access to ${label}`);
      continue;
    }

    const scopeSuffix = entry?.scope === "own" ? ` (own ${resource === "teams" ? "team" : resource} only)` : "";
    lines.push(`Can ${joinActions(actions)} ${label}${scopeSuffix}`);
  }

  return lines;
}
