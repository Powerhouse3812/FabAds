import { useRolesSnapshot, type Role } from "@/components/ums/ums-store";

export type { Role };

export function useRoles() {
  const roles = useRolesSnapshot();
  const systemRoles = roles.filter((r) => r.isSystem);
  const customRoles = roles.filter((r) => !r.isSystem);
  return { roles, systemRoles, customRoles, loading: false, refetch: () => {} };
}
