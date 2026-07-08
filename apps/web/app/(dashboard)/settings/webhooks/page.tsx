"use client";

import { useSubscription } from "@/modules/billing/hooks/use-subscription";
import { PremiumFeatureOverlay } from "@/modules/billing/ui/components/premium-feature-overlay";
import { WebhooksView } from "@/modules/settings/ui/views/webhooks-view";

export default function WebhooksPage() {
  const { tier, isLoading } = useSubscription();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground text-sm">Loading subscription...</p>
      </div>
    );
  }

  if (!tier?.features?.canUseApi) {
    return (
      <PremiumFeatureOverlay>
        <WebhooksView />
      </PremiumFeatureOverlay>
    );
  }

  return <WebhooksView />;
}
