"use client";

import { useSubscription } from "@/modules/billing/hooks/use-subscription";
import { PremiumFeatureOverlay } from "@/modules/billing/ui/components/premium-feature-overlay";
import { SlaSettingsView } from "@/modules/settings/ui/views/sla-settings-view";

export default function SlaSettingsPage() {
  const { tier, isLoading } = useSubscription();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground text-sm">Loading subscription...</p>
      </div>
    );
  }

  if (!tier?.features?.canUseSlas) {
    return (
      <PremiumFeatureOverlay>
        <SlaSettingsView />
      </PremiumFeatureOverlay>
    );
  }

  return <SlaSettingsView />;
}
