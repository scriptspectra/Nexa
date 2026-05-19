import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalAction } from "../_generated/server";
import { upsertSecret } from "../lib/secrets";

export const upsert = internalAction({
  args: {
    organizationId: v.string(),
    service: v.union(v.literal("vapi")),
    value: v.any(),
  },
  handler: async (ctx, args) => {
    const secretName = `tenant/${args.organizationId}/${args.service}`;

    console.log("DEBUG: Attempting to save secret to AWS:", secretName);
    console.log("DEBUG: AWS Region:", process.env.AWS_REGION);

    try {
      await upsertSecret(secretName, args.value);
      console.log("DEBUG: AWS Save Successful!");
    } catch (error) {
      console.error("DEBUG: AWS SAVE FAILED!", error);
      throw error;
    }

    await ctx.runMutation(internal.system.plugins.upsert, {
      service: args.service,
      secretName,
      organizationId: args.organizationId,
    });

    return { status: "success" };
  },
});
