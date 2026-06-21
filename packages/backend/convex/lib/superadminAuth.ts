import { ConvexError } from "convex/values";
import { v } from "convex/values";
import { QueryCtx, MutationCtx } from "./_generated/server";

/**
 * Ensure the current request is made by a user whose publicMetadata.role is "superadmin".
 * Throws a ConvexError if the user is not authenticated or does not have the role.
 */
export async function requireSuperadmin(
  ctx: QueryCtx | MutationCtx
): Promise<void> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new ConvexError({ code: "UNAUTHORIZED", message: "Not signed in" });
  }
  const role = (identity.publicMetadata ?? {})?.role;
  if (role !== "superadmin") {
    throw new ConvexError({ code: "FORBIDDEN", message: "Superadmin role required" });
  }
}
