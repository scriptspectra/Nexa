"use client";

import { useSubscription } from "@/modules/billing/hooks/use-subscription";
import { PremiumFeatureOverlay } from "@/modules/billing/ui/components/premium-feature-overlay";
import { ChannelsView } from "@/modules/integrations/ui/views/channels-view";

const Page = () => {
  const { tier, isLoading } = useSubscription();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground text-sm font-medium tracking-wide">Loading subscription...</p>
      </div>
    );
  }

  // Reuse the premium tier check if needed
  if (!tier?.features?.canUseShopify) {
    return (
      <PremiumFeatureOverlay>
        <ChannelsView />
      </PremiumFeatureOverlay>
    );
  }

  return <ChannelsView />;
};

export default Page;
