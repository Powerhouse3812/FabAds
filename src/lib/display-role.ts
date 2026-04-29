export function displayRole(role: string): string {
  return role === "owner" || role === "admin" ? "Admin" : "Member";
}
