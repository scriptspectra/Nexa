import { useQuery } from "convex/react";
import { api } from "@workspace/backend/_generated/api";
import { useOrganization } from "@clerk/nextjs";

export const useSubscription = () => {
  const { organization, isLoaded: isOrgLoaded } = useOrganization();

  const subscription = useQuery(
    api.public.subscriptions.getSubscription,
    organization?.id ? { organizationId: organization.id } : "skip"
  );

  return {
    isPro: subscription?.status === "active",
    isLoading: !isOrgLoaded || subscription === undefined,
  };
};
