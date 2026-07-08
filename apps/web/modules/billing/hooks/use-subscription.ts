import { useQuery } from "convex/react";
import { api } from "@workspace/backend/_generated/api";
import { useOrganization } from "@clerk/nextjs";

export const useSubscription = () => {
  const { organization, isLoaded: isOrgLoaded } = useOrganization();

  const data = useQuery(
    api.public.subscriptions.getSubscription,
    organization?.id ? { organizationId: organization.id } : "skip"
  );

  return {
    subscription: data?.subscription,
    tier: data?.tier,
    // Keep isPro for backward compatibility temporarily where not yet refactored
    isPro: data?.tier?.id === "PRO",
    isLoading: !isOrgLoaded || data === undefined,
  };
};
