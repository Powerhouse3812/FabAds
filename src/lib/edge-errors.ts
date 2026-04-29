/**
 * Maps edge function error codes/messages to user-friendly strings.
 */
const errorMap: Record<string, string> = {
  "Missing authorization": "Your session has expired. Please sign in again.",
  Unauthorized: "Your session has expired. Please sign in again.",
  Forbidden: "You don't have permission to perform this action.",
  "No workspace found": "No workspace found for your account.",
  "No workspace membership found": "No workspace membership found for your account.",
  SOLE_USER: "You are the only user. Please delete the workspace instead.",
  PROMOTE_REQUIRED: "You are the last admin. Select a member to promote before deleting your account.",
  "Invalid promote_user_id": "The selected member is not valid for promotion.",
  "Target user not in workspace": "This user is no longer in the workspace.",
  "Cannot remove the last admin": "Cannot remove the last admin from the workspace.",
  "Workspace name does not match": "The workspace name you entered doesn't match. Please try again.",
  "Missing workspace_name confirmation": "Please type the workspace name to confirm deletion.",
  "Failed to delete account": "Something went wrong while deleting the account. Please try again.",
  "Failed to delete user account": "Something went wrong while removing the member. Please try again.",
  "Internal server error": "Something went wrong. Please try again later.",
  "Missing user_id": "An internal error occurred. Please try again.",
};

export function friendlyError(raw: string | undefined | null): string {
  if (!raw) return "Something went wrong. Please try again.";
  return errorMap[raw] ?? raw;
}
