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
