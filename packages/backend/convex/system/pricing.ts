import { QueryCtx, MutationCtx, ActionCtx } from "../_generated/server";
import { Doc } from "../_generated/dataModel";

export type TierId = "FREE" | "STARTER" | "GROWTH" | "PRO";

export interface TierConfig {
  id: TierId;
  name: string;
  maxSeats: number;
  aiLimit: number; // Responses per month
  features: {
    canUseVoiceAi: boolean;
    canUseShopify: boolean;
    canUseSlas: boolean;
    canUseApi: boolean;
    canRemoveWatermark: boolean;
  };
}

export const TIERS: Record<TierId, TierConfig> = {
  FREE: {
    id: "FREE",
    name: "Free",
    maxSeats: 1,
    aiLimit: 50,
    features: {
      canUseVoiceAi: false,
      canUseShopify: false,
      canUseSlas: false,
      canUseApi: false,
      canRemoveWatermark: false,
    }
  },
  STARTER: {
    id: "STARTER",
    name: "Starter",
    maxSeats: 2,
    aiLimit: 500,
    features: {
      canUseVoiceAi: false,
      canUseShopify: false,
      canUseSlas: false,
      canUseApi: false,
      canRemoveWatermark: false,
    }
  },
  GROWTH: {
    id: "GROWTH",
    name: "Growth",
    maxSeats: 5,
    aiLimit: 5000,
    features: {
      canUseVoiceAi: false,
      canUseShopify: true,
      canUseSlas: false,
      canUseApi: false,
      canRemoveWatermark: true,
    }
  },
  PRO: {
    id: "PRO",
    name: "Pro",
    maxSeats: 999999, // unlimited
    aiLimit: 9999999, // unlimited
    features: {
      canUseVoiceAi: true,
      canUseShopify: true,
      canUseSlas: true,
      canUseApi: true,
      canRemoveWatermark: true,
    }
  }
};

/**
 * Returns the tier configuration based on a subscription document.
 * Includes backward compatibility for existing subscriptions (maps to PRO).
 */
export function getTierFromSubscription(subscription: Doc<"subscriptions"> | null): TierConfig {
  if (!subscription || (subscription.status !== "active" && subscription.status !== "on_trial")) {
    return TIERS.FREE;
  }

  const variantName = subscription.variantName?.toLowerCase() || "";

  // Mapping logic - can be adjusted based on actual Lemon Squeezy variant names
  if (variantName.includes("starter")) {
    return TIERS.STARTER;
  }
  if (variantName.includes("growth")) {
    return TIERS.GROWTH;
  }
  if (variantName.includes("pro") || variantName.includes("enterprise")) {
    return TIERS.PRO;
  }

  // Backward compatibility: If they are active but we don't recognize the variant, assume PRO
  return TIERS.PRO;
}

/**
 * Gets the current organization's tier by querying the database.
 */
export async function getTier(ctx: QueryCtx | MutationCtx, organizationId: string): Promise<TierConfig> {
  const subscription = await ctx.db
    .query("subscriptions")
    .withIndex("by_organization_id", (q) => q.eq("organizationId", organizationId))
    .unique();

  return getTierFromSubscription(subscription);
}

/**
 * Convenience function to check if the org has a specific feature.
 */
export async function hasFeature(ctx: QueryCtx | MutationCtx, organizationId: string, feature: keyof TierConfig["features"]): Promise<boolean> {
  const tier = await getTier(ctx, organizationId);
  return tier.features[feature];
}
