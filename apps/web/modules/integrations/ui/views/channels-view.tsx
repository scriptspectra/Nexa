"use client";

import { useOrganization } from "@clerk/nextjs";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@workspace/backend/_generated/api";
import { Button } from "@workspace/ui/components/button";
import { 
  CheckIcon, 
  PlusIcon, 
  MessageCircleIcon, 
  Loader2Icon, 
  SparklesIcon, 
  HelpCircleIcon, 
  ExternalLinkIcon,
  LayersIcon,
  TwitterIcon,
  LinkedinIcon,
  FolderSyncIcon,
  SlackIcon,
  TerminalIcon,
  PowerIcon,
  CheckCircle2Icon
} from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";

export const ChannelsView = () => {
  const { organization } = useOrganization();
  const searchParams = useSearchParams();

  // Queries & Mutations
  const integration = useQuery(
    api.private.integrations.getIntegrationStatus,
    organization?.id
      ? { organizationId: organization.id, provider: "meta" }
      : "skip"
  );

  const enabledResources = useQuery(
    api.private.integrations.getIntegrationResources,
    organization?.id ? { organizationId: organization.id } : "skip"
  );

  const discoverResourcesAction = useAction(api.integrations.meta.actions.discoverMetaResourcesPublic);
  const enableResourceMutation = useMutation(api.private.integrations.enableIntegrationResource);
  const disableResourceMutation = useMutation(api.private.integrations.disableIntegrationResource);
  const subscribeWebhooksAction = useAction(api.integrations.meta.actions.subscribeResourceWebhooks);

  // States
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveredResources, setDiscoveredResources] = useState<any[]>([]);
  const [loadingResources, setLoadingResources] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState("");

  const handleConnect = () => {
    if (!organization?.id) {
      toast.error("Please select an organization first.");
      return;
    }
    const clientOrigin = window.location.origin;
    window.location.href = `${process.env.NEXT_PUBLIC_CONVEX_URL?.replace("wss://", "https://").replace("ws://", "http://")}/api/integrations/meta/login?orgId=${organization.id}&clientOrigin=${encodeURIComponent(clientOrigin)}`;
  };

  const handleDiscover = useCallback(async () => {
    if (!organization?.id) return;
    setIsDiscovering(true);
    try {
      const resources = await discoverResourcesAction({ organizationId: organization.id });
      setDiscoveredResources(resources);
      toast.success(`Discovered ${resources.length} Meta resources.`);
    } catch (e: any) {
      toast.error(`Discovery failed: ${e.message}`);
    } finally {
      setIsDiscovering(false);
    }
  }, [organization?.id, discoverResourcesAction]);

  // Check if we just returned from OAuth
  useEffect(() => {
    if (searchParams.get("meta") === "success" && integration?.status === "connected") {
      handleDiscover();

      // Clean up URL
      const url = new URL(window.location.href);
      url.searchParams.delete("meta");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams, integration?.status, handleDiscover]);

  const handleToggleResource = async (res: any) => {
    if (!organization?.id || !integration?._id) return;

    const key = res.externalResourceId;
    setLoadingResources(prev => ({ ...prev, [key]: true }));

    const isEnabled = enabledResources?.some(
      (r) => r.externalResourceId === res.externalResourceId && r.status === "active"
    );

    try {
      if (isEnabled) {
        // Disable
        const resourceRecord = enabledResources?.find(
          (r) => r.externalResourceId === res.externalResourceId
        );
        if (resourceRecord) {
          await disableResourceMutation({ resourceId: resourceRecord._id });
          toast.success(`Disabled ${res.name}`);
        }
      } else {
        // Enable
        const dbResourceId = await enableResourceMutation({
          organizationId: organization.id,
          integrationId: integration._id,
          provider: "meta",
          resourceType: res.resourceType,
          externalResourceId: res.externalResourceId,
          name: res.name,
          capabilities: res.capabilities,
          raw: res.raw,
        });

        // Register Webhooks
        await subscribeWebhooksAction({ resourceId: dbResourceId });
        toast.success(`Enabled and subscribed webhooks for ${res.name}`);
      }
    } catch (e: any) {
      toast.error(`Operation failed: ${e.message}`);
    } finally {
      setLoadingResources(prev => ({ ...prev, [key]: false }));
    }
  };

  const isMetaConnected = integration && integration.status !== "disconnected";
  const activeMetaCount = enabledResources?.filter(r => r.provider === "meta" && r.status === "active").length || 0;

  return (
    <div className="flex-1 bg-[#111317] text-[#e2e2e8] min-h-screen">
      <div className="max-w-[1280px] mx-auto p-6 md:p-12 space-y-8">
        
        {/* Header Section */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#2d3139]">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white font-headline-lg">
              Messaging Channels
            </h1>
            <p className="text-[#c3c6d7] text-sm md:text-base max-w-2xl font-body-lg">
              Connect your social channels to funnel messages into the Zephyra inbox and manage all customer interactions in one unified workspace.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center bg-[#0c0e12] border border-[#434655] rounded-full px-4 py-1.5 w-72">
              <input
                type="text"
                placeholder="Search channels..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none focus:outline-none focus:ring-0 text-sm text-white placeholder-[#8d90a0] w-full p-0"
              />
            </div>
            {isMetaConnected && (
              <Button
                onClick={handleDiscover}
                disabled={isDiscovering}
                className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white px-4 py-2 rounded-lg font-bold text-sm scale-95 active:scale-90 transition-all flex items-center gap-2"
              >
                {isDiscovering ? <Loader2Icon className="size-4 animate-spin" /> : <FolderSyncIcon className="size-4" />}
                Discover Resources
              </Button>
            )}
          </div>
        </section>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Meta Card */}
          <div className="bg-[#1e2024] border border-[#434655] rounded-xl p-6 hover:border-[#b4c5ff]/50 transition-all flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 bg-blue-600/10 rounded-lg flex items-center justify-center border border-blue-600/20">
                  <MessageCircleIcon className="text-blue-500 size-7" />
                </div>
                
                {isMetaConnected ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2Icon className="size-3" />
                    Connected
                  </span>
                ) : (
                  <Button
                    onClick={handleConnect}
                    className="bg-[#2563eb] hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg font-bold text-xs transition-all transform active:scale-95"
                  >
                    Connect
                  </Button>
                )}
              </div>

              <div>
                <h3 className="text-lg font-bold text-white mb-2">Meta</h3>
                <p className="text-[#c3c6d7] text-xs leading-relaxed mb-4">
                  Consolidate Facebook Pages, Instagram DM, and Messenger conversations.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <span className="bg-[#0c0e12] border border-[#434655] px-2 py-0.5 rounded text-[10px] uppercase font-semibold text-[#c3c6d7]">
                    Facebook Pages
                  </span>
                  <span className="bg-[#0c0e12] border border-[#434655] px-2 py-0.5 rounded text-[10px] uppercase font-semibold text-[#c3c6d7]">
                    Instagram DMs
                  </span>
                  <span className="bg-[#0c0e12] border border-[#434655] px-2 py-0.5 rounded text-[10px] uppercase font-semibold text-[#c3c6d7]">
                    Messenger
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* X / Twitter Card */}
          <div className="bg-[#1e2024] border border-[#434655] rounded-xl p-6 hover:border-[#b4c5ff]/50 transition-all flex flex-col justify-between group opacity-75 hover:opacity-100">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center border border-white/10">
                  <TwitterIcon className="text-white size-7" />
                </div>
                <Button
                  onClick={() => toast.info("Twitter integration is coming soon!")}
                  className="bg-[#333539] hover:bg-[#282a2e] text-[#c3c6d7] px-4 py-1.5 rounded-lg font-bold text-xs transition-all"
                >
                  Connect
                </Button>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white mb-2">X / Twitter</h3>
                <p className="text-[#c3c6d7] text-xs leading-relaxed mb-4">
                  Monitor mentions and direct messages from your Twitter professional account.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <span className="bg-[#0c0e12] border border-[#434655] px-2 py-0.5 rounded text-[10px] uppercase font-semibold text-[#c3c6d7]">
                    Mentions
                  </span>
                  <span className="bg-[#0c0e12] border border-[#434655] px-2 py-0.5 rounded text-[10px] uppercase font-semibold text-[#c3c6d7]">
                    Direct Messages
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* LinkedIn Card */}
          <div className="bg-[#1e2024] border border-[#434655] rounded-xl p-6 hover:border-[#b4c5ff]/50 transition-all flex flex-col justify-between group opacity-75 hover:opacity-100">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 bg-[#0077b5]/10 rounded-lg flex items-center justify-center border border-[#0077b5]/20">
                  <LinkedinIcon className="text-[#0077b5] size-7" />
                </div>
                <Button
                  onClick={() => toast.info("LinkedIn integration is coming soon!")}
                  className="bg-[#333539] hover:bg-[#282a2e] text-[#c3c6d7] px-4 py-1.5 rounded-lg font-bold text-xs transition-all"
                >
                  Connect
                </Button>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white mb-2">LinkedIn</h3>
                <p className="text-[#c3c6d7] text-xs leading-relaxed mb-4">
                  Engage with prospects and respond to company page inquiries in real-time.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <span className="bg-[#0c0e12] border border-[#434655] px-2 py-0.5 rounded text-[10px] uppercase font-semibold text-[#c3c6d7]">
                    Company Page
                  </span>
                  <span className="bg-[#0c0e12] border border-[#434655] px-2 py-0.5 rounded text-[10px] uppercase font-semibold text-[#c3c6d7]">
                    InMail
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Automated Flows Featured Section */}
          <div className="lg:col-span-3 bg-[#1e2024] border border-[#434655] rounded-xl overflow-hidden group">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="p-8 lg:p-12 flex flex-col justify-center space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00a572]/10 border border-[#00a572]/20 text-[#4edea3] w-fit">
                  <SparklesIcon className="size-3.5" />
                  <span className="text-[10px] uppercase font-bold tracking-wider font-label-caps">Advanced Feature</span>
                </div>
                <h2 className="text-2xl font-bold text-white font-headline-lg">Automated Flows</h2>
                <p className="text-[#c3c6d7] text-sm leading-relaxed max-w-md font-body-lg">
                  Design intelligent routing and auto-response sequences that trigger based on channel-specific metadata and keywords.
                </p>
                <a 
                  onClick={() => toast.info("Automations builder is coming soon!")}
                  className="inline-flex items-center gap-2 text-[#b4c5ff] font-bold cursor-pointer hover:gap-4 transition-all"
                >
                  Explore Automations →
                </a>
              </div>
              <div className="h-48 lg:h-auto bg-[#1a1c20] border-l border-[#434655] relative overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 flex items-center justify-center opacity-40">
                  <div className="grid grid-cols-3 gap-4 w-full h-full p-8">
                    <div className="border border-[#434655] rounded-lg bg-[#282a2e] flex flex-col p-4 animate-pulse">
                      <div className="w-8 h-8 rounded-full bg-[#2563eb] mb-3"></div>
                      <div className="h-2 w-full bg-[#434655] rounded mb-2"></div>
                      <div className="h-2 w-2/3 bg-[#434655] rounded"></div>
                    </div>
                    <div className="border border-blue-500 rounded-lg bg-blue-500/5 flex flex-col p-4 mt-8">
                      <div className="w-8 h-8 rounded-full bg-[#00a572] mb-3"></div>
                      <div className="h-2 w-full bg-[#4edea3] rounded mb-2"></div>
                      <div className="h-2 w-1/2 bg-[#4edea3]/50 rounded"></div>
                    </div>
                    <div className="border border-[#434655] rounded-lg bg-[#282a2e] flex flex-col p-4">
                      <div className="w-8 h-8 rounded-full bg-orange-500/20 mb-3"></div>
                      <div className="h-2 w-full bg-[#434655] rounded mb-2"></div>
                      <div className="h-2 w-3/4 bg-[#434655] rounded"></div>
                    </div>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#1e2024] to-transparent"></div>
              </div>
            </div>
          </div>

          {/* WhatsApp Card */}
          <div className="bg-[#1e2024] border border-[#434655] rounded-xl p-6 hover:border-[#b4c5ff]/50 transition-all flex flex-col justify-between group opacity-75 hover:opacity-100">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center border border-emerald-500/20">
                  <CheckIcon className="text-emerald-400 size-7" />
                </div>
                <Button
                  onClick={() => toast.info("WhatsApp Business integration is coming soon!")}
                  className="bg-[#333539] hover:bg-[#282a2e] text-[#c3c6d7] px-4 py-1.5 rounded-lg font-bold text-xs transition-all"
                >
                  Connect
                </Button>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white mb-2">WhatsApp Business</h3>
                <p className="text-[#c3c6d7] text-xs leading-relaxed mb-4">
                  Enable global reach with official WhatsApp Business API integration.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <span className="bg-[#0c0e12] border border-[#434655] px-2 py-0.5 rounded text-[10px] uppercase font-semibold text-[#c3c6d7]">
                    Enterprise API
                  </span>
                  <span className="bg-[#0c0e12] border border-[#434655] px-2 py-0.5 rounded text-[10px] uppercase font-semibold text-[#c3c6d7]">
                    Broadcasts
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Custom Webhooks Card */}
          <div className="bg-[#1e2024] border border-[#434655] rounded-xl p-6 hover:border-[#b4c5ff]/50 transition-all flex flex-col justify-between group opacity-75 hover:opacity-100">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 bg-zinc-500/10 rounded-lg flex items-center justify-center border border-[#434655]">
                  <TerminalIcon className="text-[#c3c6d7] size-7" />
                </div>
                <Button
                  onClick={() => toast.info("Webhook configurations are coming soon!")}
                  className="bg-[#333539] hover:bg-[#282a2e] text-[#c3c6d7] px-4 py-1.5 rounded-lg font-bold text-xs transition-all"
                >
                  Configure
                </Button>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white mb-2">Custom Webhooks</h3>
                <p className="text-[#c3c6d7] text-xs leading-relaxed mb-4">
                  Integrate proprietary systems or niche social apps via standard HTTP webhooks.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <span className="bg-[#0c0e12] border border-[#434655] px-2 py-0.5 rounded text-[10px] uppercase font-semibold text-[#c3c6d7]">
                    JSON Payload
                  </span>
                  <span className="bg-[#0c0e12] border border-[#434655] px-2 py-0.5 rounded text-[10px] uppercase font-semibold text-[#c3c6d7]">
                    Real-time
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Slack Card */}
          <div className="bg-[#1e2024] border border-[#434655] rounded-xl p-6 hover:border-[#b4c5ff]/50 transition-all flex flex-col justify-between group opacity-75 hover:opacity-100">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 bg-[#ecb22e]/10 rounded-lg flex items-center justify-center border border-[#ecb22e]/20">
                  <SlackIcon className="text-[#ecb22e] size-7" />
                </div>
                <Button
                  onClick={() => toast.info("Slack Workspace integration is coming soon!")}
                  className="bg-[#333539] hover:bg-[#282a2e] text-[#c3c6d7] px-4 py-1.5 rounded-lg font-bold text-xs transition-all"
                >
                  Connect
                </Button>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white mb-2">Slack Workspace</h3>
                <p className="text-[#c3c6d7] text-xs leading-relaxed mb-4">
                  Sync internal discussions or external Slack Connect channels for support.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <span className="bg-[#0c0e12] border border-[#434655] px-2 py-0.5 rounded text-[10px] uppercase font-semibold text-[#c3c6d7]">
                    Channels
                  </span>
                  <span className="bg-[#0c0e12] border border-[#434655] px-2 py-0.5 rounded text-[10px] uppercase font-semibold text-[#c3c6d7]">
                    Sync DMs
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Resources Discovery Drawer/Section */}
        {isMetaConnected && (discoveredResources.length > 0 || isDiscovering) && (
          <section className="bg-[#1e2024] border border-[#434655] rounded-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#2d3139] pb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Discovered Meta Resources</h3>
                <p className="text-xs text-[#c3c6d7]">Enable specific Instagram accounts or Facebook Pages to hook up webhooks.</p>
              </div>
              <span className="text-[10px] bg-[#0c0e12] border border-[#434655] px-2 py-1 rounded text-white font-bold">
                {discoveredResources.length} Found
              </span>
            </div>

            {isDiscovering ? (
              <div className="p-8 border border-dashed border-[#434655] rounded-xl flex items-center justify-center gap-2 text-[#c3c6d7] text-sm">
                <Loader2Icon className="size-4 animate-spin text-blue-500" />
                Querying Graph API for assets...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {discoveredResources.map((res) => {
                  const isEnabled = enabledResources?.some(
                    (r) => r.externalResourceId === res.externalResourceId && r.status === "active"
                  );
                  const isLoading = loadingResources[res.externalResourceId];

                  return (
                    <div
                      key={res.externalResourceId}
                      className="flex items-center justify-between p-4 rounded-lg border border-[#434655] bg-[#1a1c20] hover:bg-[#1e2024] transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                          <MessageCircleIcon className="text-blue-500 size-5" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{res.name}</p>
                          <p className="text-[10px] uppercase font-bold text-[#8d90a0]">{res.resourceType.replace("_", " ")}</p>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        disabled={isLoading}
                        onClick={() => handleToggleResource(res)}
                        className={`h-8 px-4 text-xs font-bold rounded-lg transition-all ${
                          isEnabled
                            ? "bg-red-950/40 text-red-400 border border-red-500/20 hover:bg-red-900/20"
                            : "bg-[#2563eb] hover:bg-blue-500 text-white"
                        }`}
                      >
                        {isLoading ? (
                          <Loader2Icon className="size-3 animate-spin" />
                        ) : isEnabled ? (
                          "Disable"
                        ) : (
                          "Enable"
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* Footer Hint */}
        <section className="pt-6 border-t border-[#2d3139] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <span className="text-[#c3c6d7] text-sm">Configure environment variables and local webhook tunnels in your console settings.</span>
          </div>
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1e2024] border border-[#434655]">
              <div className="w-2 h-2 rounded-full bg-[#4edea3]"></div>
              <span className="text-sm font-bold text-white">{activeMetaCount} Active</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1e2024] border border-[#434655]">
              <div className="w-2 h-2 rounded-full bg-[#8d90a0]"></div>
              <span className="text-sm font-bold text-[#c3c6d7]">1 Connected Integration</span>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};
