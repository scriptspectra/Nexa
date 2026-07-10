"use client";

import { useOrganization } from "@clerk/nextjs";
import { useQuery, useAction } from "convex/react";
import { api } from "@workspace/backend/_generated/api";
import { Button } from "@workspace/ui/components/button";
import { CheckIcon, PlusIcon, MessageCircleIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";

export const IntegrationConnectFlow = ({
  provider,
  title,
  description,
  icon: Icon,
}: {
  provider: "meta" | "slack" | "teams";
  title: string;
  description: string;
  icon: any;
}) => {
  const { organization } = useOrganization();
  const searchParams = useSearchParams();

  // Query integration status — skip query when org is not available
  const integration = useQuery(
    (api as any).private.integrations.getIntegrationStatus,
    organization?.id
      ? { organizationId: organization.id, provider }
      : "skip",
  );

  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveredResources, setDiscoveredResources] = useState<any[]>([]);

  const handleConnect = useCallback(() => {
    if (!organization?.id) {
      toast.error("Please select an organization first.");
      return;
    }
    // Redirect to backend OAuth login
    window.location.href = `/api/integrations/${provider}/login?orgId=${organization.id}`;
  }, [organization?.id, provider]);

  const handleDiscover = useCallback(async () => {
    if (!organization?.id) return;
    setIsDiscovering(true);
    try {
      // Use fetch to call a hypothetical discovery endpoint
      // For now, this is a placeholder — actual discovery requires the Meta access token on the backend
      toast.info("Resource discovery is not yet configured for this provider.");
    } catch (e: any) {
      toast.error(`Discovery failed: ${e.message}`);
    } finally {
      setIsDiscovering(false);
    }
  }, [organization?.id, provider]);

  // Check if we just returned from OAuth
  useEffect(() => {
    if (searchParams.get(provider) === "success" && integration?.status === "connected") {
      handleDiscover();

      // Clean up URL
      const url = new URL(window.location.href);
      url.searchParams.delete(provider);
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams, integration?.status, provider, handleDiscover]);

  const isConnected = integration && integration.status !== "disconnected";

  return (
    <div className="rounded-2xl border border-white/5 bg-zinc-950/40 p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center flex-shrink-0">
            <Icon className="size-6 text-blue-400" />
          </div>
          <div>
            <h4 className="text-white font-bold text-base">{title}</h4>
            <p className="text-zinc-500 text-sm mt-0.5">{description}</p>
          </div>
        </div>

        {!isConnected && (
          <Button
            onClick={handleConnect}
            className="flex-shrink-0 h-9 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-all"
          >
            <PlusIcon className="size-3.5 mr-1.5" />
            Connect
          </Button>
        )}
        {isConnected && integration.status === "healthy" && (
          <span className="flex-shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckIcon className="size-3" />
            Connected
          </span>
        )}
      </div>

      {isDiscovering && (
        <div className="p-4 border border-dashed border-white/10 rounded-xl flex items-center justify-center gap-2 text-zinc-400 text-sm">
          <Loader2Icon className="size-4 animate-spin" />
          Discovering resources...
        </div>
      )}

      {discoveredResources.length > 0 && (
        <div className="space-y-2 mt-4 border-t border-white/5 pt-4">
          <h5 className="text-sm font-semibold text-white">Discovered Resources</h5>
          <div className="space-y-2">
            {discoveredResources.map((res, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <MessageCircleIcon className="size-4 text-zinc-400" />
                  <div>
                    <p className="text-sm font-medium text-white">{res.name}</p>
                    <p className="text-xs text-zinc-500">{res.resourceType}</p>
                  </div>
                </div>
                <Button size="sm" variant="secondary" className="h-7 text-xs">
                  Enable
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
