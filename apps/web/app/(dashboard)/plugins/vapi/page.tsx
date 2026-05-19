"use client";

import { useSubscription } from "@/modules/billing/hooks/use-subscription";
import { PremiumFeatureOverlay } from "@/modules/billing/ui/components/premium-feature-overlay";
import { VapiView } from "@/modules/plugins/ui/views/vapi-view";

const Page = () => {
  const { isPro, isLoading } = useSubscription();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground text-sm">Loading subscription...</p>
      </div>
    );
  }

  if (!isPro) {
    return (
      <PremiumFeatureOverlay>
        <VapiView />
      </PremiumFeatureOverlay>
    );
  }

  return <VapiView />;
};

export default Page;
