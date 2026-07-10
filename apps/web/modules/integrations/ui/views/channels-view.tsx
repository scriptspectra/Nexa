"use client";

import { useOrganization } from "@clerk/nextjs";
import { Button } from "@workspace/ui/components/button";
import { 
  MessageCircleIcon, 
  SparklesIcon, 
  TerminalIcon,
  LinkedinIcon,
  TwitterIcon,
  SlackIcon,
  PlusIcon,
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export const ChannelsView = () => {
  const { organization } = useOrganization();
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = (provider: string) => {
    if (provider !== "meta") {
      toast.info(`${provider} integration is coming soon!`);
      return;
    }
    if (!organization?.id) {
      toast.error("Please select an organization first.");
      return;
    }
    setIsConnecting(true);
    const clientOrigin = window.location.origin;
    const convexUrl = (process.env.NEXT_PUBLIC_CONVEX_URL ?? "")
      .replace("wss://", "https://")
      .replace("ws://", "http://");
    window.location.href = `${convexUrl}/api/integrations/meta/login?orgId=${organization.id}&clientOrigin=${encodeURIComponent(clientOrigin)}`;
  };

  return (
    <div className="flex-1 bg-[#111317] text-[#e2e2e8] min-h-screen">
      <div className="max-w-[1280px] mx-auto p-6 md:p-12 space-y-8">

        {/* Header */}
        <section className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#2d3139]">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-white">
              Messaging Channels
            </h1>
            <p className="text-[#c3c6d7] text-sm md:text-base max-w-2xl">
              Connect your social channels to funnel messages into the Zephyra inbox and manage all customer interactions in one unified workspace.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1e2024] border border-[#434655]">
              <div className="w-2 h-2 rounded-full bg-[#8d90a0]" />
              <span className="text-sm font-bold text-[#c3c6d7]">5 Available</span>
            </div>
          </div>
        </section>

        {/* Channel Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Meta Card */}
          <div className="bg-[#1e2024] border border-[#434655] rounded-xl p-6 hover:border-[#b4c5ff]/50 transition-all hover:-translate-y-1 duration-300 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 bg-blue-600/10 rounded-lg flex items-center justify-center border border-blue-600/20">
                  <MessageCircleIcon className="text-blue-500 size-6" />
                </div>
                <Button
                  onClick={() => handleConnect("meta")}
                  disabled={isConnecting}
                  className="bg-[#2563eb] hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg font-bold text-xs transition-all transform active:scale-95"
                >
                  <PlusIcon className="size-3.5 mr-1" />
                  Connect
                </Button>
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-1.5">Meta</h3>
                <p className="text-[#c3c6d7] text-xs leading-relaxed mb-4">
                  Consolidate Facebook Pages, Instagram DM, and Messenger conversations.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {["Facebook Pages", "Instagram DMs", "Messenger"].map((tag) => (
                    <span key={tag} className="bg-[#0c0e12] border border-[#434655] px-2 py-0.5 rounded text-[10px] uppercase font-semibold text-[#c3c6d7]">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* X / Twitter Card */}
          <div className="bg-[#1e2024] border border-[#434655] rounded-xl p-6 hover:border-[#b4c5ff]/50 transition-all hover:-translate-y-1 duration-300 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center border border-white/10">
                  <TwitterIcon className="text-white size-6" />
                </div>
                <Button
                  onClick={() => handleConnect("twitter")}
                  className="bg-[#333539] hover:bg-[#282a2e] text-[#c3c6d7] px-4 py-1.5 rounded-lg font-bold text-xs transition-all"
                >
                  Connect
                </Button>
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-1.5">X / Twitter</h3>
                <p className="text-[#c3c6d7] text-xs leading-relaxed mb-4">
                  Monitor mentions and direct messages from your Twitter professional account.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {["Mentions", "Direct Messages"].map((tag) => (
                    <span key={tag} className="bg-[#0c0e12] border border-[#434655] px-2 py-0.5 rounded text-[10px] uppercase font-semibold text-[#c3c6d7]">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* LinkedIn Card */}
          <div className="bg-[#1e2024] border border-[#434655] rounded-xl p-6 hover:border-[#b4c5ff]/50 transition-all hover:-translate-y-1 duration-300 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 bg-[#0077b5]/10 rounded-lg flex items-center justify-center border border-[#0077b5]/20">
                  <LinkedinIcon className="text-[#0077b5] size-6" />
                </div>
                <Button
                  onClick={() => handleConnect("linkedin")}
                  className="bg-[#333539] hover:bg-[#282a2e] text-[#c3c6d7] px-4 py-1.5 rounded-lg font-bold text-xs transition-all"
                >
                  Connect
                </Button>
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-1.5">LinkedIn</h3>
                <p className="text-[#c3c6d7] text-xs leading-relaxed mb-4">
                  Engage with prospects and respond to company page inquiries in real-time.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {["Company Page", "InMail"].map((tag) => (
                    <span key={tag} className="bg-[#0c0e12] border border-[#434655] px-2 py-0.5 rounded text-[10px] uppercase font-semibold text-[#c3c6d7]">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Automated Flows Featured Banner */}
          <div className="lg:col-span-3 bg-[#1e2024] border border-[#434655] rounded-xl overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="p-8 lg:p-12 flex flex-col justify-center space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00a572]/10 border border-[#00a572]/20 text-[#4edea3] w-fit">
                  <SparklesIcon className="size-3.5" />
                  <span className="text-[10px] uppercase font-bold tracking-wider">Advanced Feature</span>
                </div>
                <h2 className="text-2xl font-bold text-white">Automated Flows</h2>
                <p className="text-[#c3c6d7] text-sm leading-relaxed max-w-md">
                  Design intelligent routing and auto-response sequences that trigger based on channel-specific metadata and keywords.
                </p>
                <button
                  onClick={() => toast.info("Automations builder is coming soon!")}
                  className="inline-flex items-center gap-2 text-[#b4c5ff] font-bold cursor-pointer hover:gap-4 transition-all text-sm"
                >
                  Explore Automations →
                </button>
              </div>
              <div className="h-48 lg:h-auto bg-[#1a1c20] border-l border-[#434655] relative overflow-hidden flex items-center justify-center">
                <div className="absolute inset-0 grid grid-cols-3 gap-4 p-8 opacity-30">
                  <div className="border border-[#434655] rounded-lg bg-[#282a2e] flex flex-col p-4 animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-blue-600 mb-3" />
                    <div className="h-2 w-full bg-[#434655] rounded mb-2" />
                    <div className="h-2 w-2/3 bg-[#434655] rounded" />
                  </div>
                  <div className="border border-blue-500 rounded-lg bg-blue-500/5 flex flex-col p-4 mt-8">
                    <div className="w-8 h-8 rounded-full bg-[#00a572] mb-3" />
                    <div className="h-2 w-full bg-[#4edea3] rounded mb-2" />
                    <div className="h-2 w-1/2 bg-[#4edea3]/50 rounded" />
                  </div>
                  <div className="border border-[#434655] rounded-lg bg-[#282a2e] flex flex-col p-4">
                    <div className="w-8 h-8 rounded-full bg-orange-500/20 mb-3" />
                    <div className="h-2 w-full bg-[#434655] rounded mb-2" />
                    <div className="h-2 w-3/4 bg-[#434655] rounded" />
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#1e2024] to-transparent" />
              </div>
            </div>
          </div>

          {/* WhatsApp Card */}
          <div className="bg-[#1e2024] border border-[#434655] rounded-xl p-6 hover:border-[#b4c5ff]/50 transition-all hover:-translate-y-1 duration-300 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center border border-emerald-500/20">
                  <MessageCircleIcon className="text-emerald-400 size-6" />
                </div>
                <Button
                  onClick={() => handleConnect("whatsapp")}
                  className="bg-[#333539] hover:bg-[#282a2e] text-[#c3c6d7] px-4 py-1.5 rounded-lg font-bold text-xs transition-all"
                >
                  Connect
                </Button>
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-1.5">WhatsApp Business</h3>
                <p className="text-[#c3c6d7] text-xs leading-relaxed mb-4">
                  Enable global reach with official WhatsApp Business API integration.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {["Enterprise API", "Broadcasts"].map((tag) => (
                    <span key={tag} className="bg-[#0c0e12] border border-[#434655] px-2 py-0.5 rounded text-[10px] uppercase font-semibold text-[#c3c6d7]">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Custom Webhooks Card */}
          <div className="bg-[#1e2024] border border-[#434655] rounded-xl p-6 hover:border-[#b4c5ff]/50 transition-all hover:-translate-y-1 duration-300 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 bg-zinc-500/10 rounded-lg flex items-center justify-center border border-[#434655]">
                  <TerminalIcon className="text-[#c3c6d7] size-6" />
                </div>
                <Button
                  onClick={() => toast.info("Webhook configurations are coming soon!")}
                  className="bg-[#333539] hover:bg-[#282a2e] text-[#c3c6d7] px-4 py-1.5 rounded-lg font-bold text-xs transition-all"
                >
                  Configure
                </Button>
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-1.5">Custom Webhooks</h3>
                <p className="text-[#c3c6d7] text-xs leading-relaxed mb-4">
                  Integrate proprietary systems or niche social apps via standard HTTP webhooks.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {["JSON Payload", "Real-time"].map((tag) => (
                    <span key={tag} className="bg-[#0c0e12] border border-[#434655] px-2 py-0.5 rounded text-[10px] uppercase font-semibold text-[#c3c6d7]">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Slack Card */}
          <div className="bg-[#1e2024] border border-[#434655] rounded-xl p-6 hover:border-[#b4c5ff]/50 transition-all hover:-translate-y-1 duration-300 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 bg-[#ecb22e]/10 rounded-lg flex items-center justify-center border border-[#ecb22e]/20">
                  <SlackIcon className="text-[#ecb22e] size-6" />
                </div>
                <Button
                  onClick={() => handleConnect("slack")}
                  className="bg-[#333539] hover:bg-[#282a2e] text-[#c3c6d7] px-4 py-1.5 rounded-lg font-bold text-xs transition-all"
                >
                  Connect
                </Button>
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-1.5">Slack Workspace</h3>
                <p className="text-[#c3c6d7] text-xs leading-relaxed mb-4">
                  Sync internal discussions or external Slack Connect channels for support.
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {["Channels", "Sync DMs"].map((tag) => (
                    <span key={tag} className="bg-[#0c0e12] border border-[#434655] px-2 py-0.5 rounded text-[10px] uppercase font-semibold text-[#c3c6d7]">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <section className="pt-6 border-t border-[#2d3139] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <p className="text-[#c3c6d7] text-sm">
            Configure your Meta App credentials in the Convex dashboard before connecting.
          </p>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1e2024] border border-[#434655]">
            <div className="w-2 h-2 rounded-full bg-[#8d90a0]" />
            <span className="text-sm font-bold text-[#c3c6d7]">0 Connected</span>
          </div>
        </section>

      </div>
    </div>
  );
};
