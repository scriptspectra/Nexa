import { UserIdentity } from "convex/server";
import { ConvexError } from "convex/values";

export function getOrgIdFromIdentity(identity: UserIdentity | null): string | null {
  if (!identity) {
    return null;
  }

  const orgId =
    identity.orgId ??
    (identity as { org_id?: string }).org_id;

  return typeof orgId === "string" ? orgId : null;
}

export function requireMatchingOrganizationId(
  identity: UserIdentity | null,
  organizationId: string,
): string {
  if (!identity) {
    throw new ConvexError("Unauthorized");
  }

  const orgId = getOrgIdFromIdentity(identity);

  if (!orgId || orgId !== organizationId) {
    throw new ConvexError("Organization not found");
  }

  return orgId;
}

/**
 * Returns the Clerk org role from the JWT identity.
 * Clerk JWT stores it as `org_role` (e.g. "org:admin", "org:member").
 */
export function getOrgRoleFromIdentity(identity: UserIdentity | null): string | null {
  if (!identity) return null;
  const role =
    (identity as any).orgRole ??
    (identity as any).org_role ??
    null;
  return typeof role === "string" ? role : null;
}

/**
 * Throws ConvexError("Forbidden") unless the authenticated user is an org admin.
 * Use this to guard admin-only mutations (macros, tags management, etc.)
 */
export function requireOrgAdmin(identity: UserIdentity | null): void {
  const role = getOrgRoleFromIdentity(identity);
  if (!role || !role.includes("admin")) {
    throw new ConvexError({
      code: "FORBIDDEN",
      message: "This action requires an organization admin role.",
    });
  }
}

/**
 * Require authenticated identity for the given org, return the orgId.
 * Throws if unauthenticated or org mismatch.
 */
export function requireOrgIdentity(identity: UserIdentity | null): string {
  if (!identity) {
    throw new ConvexError({ code: "UNAUTHORIZED", message: "Not authenticated" });
  }
  const orgId = getOrgIdFromIdentity(identity);
  if (!orgId) {
    throw new ConvexError({ code: "UNAUTHORIZED", message: "No organization context" });
  }
  return orgId;
}
