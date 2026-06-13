"use client";

import { useSubscription } from "@/modules/billing/hooks/use-subscription";
import { PremiumFeatureOverlay } from "@/modules/billing/ui/components/premium-feature-overlay";
import { IntegrationsView } from "@/modules/integrations/ui/views/integrations-view";

const Page = () => {
  const { isPro, isLoading } = useSubscription();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground text-sm font-medium tracking-wide">Loading subscription...</p>
      </div>
    );
  }

  if (!isPro) {
    return (
      <PremiumFeatureOverlay>
        <IntegrationsView />
      </PremiumFeatureOverlay>
    );
  }

  return <IntegrationsView />;
};

export default Page;