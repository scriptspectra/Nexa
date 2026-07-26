"use client";

import { useOrganization } from "@clerk/nextjs";
import { Button } from "@workspace/ui/components/button";
import { toast } from "sonner";
import { useState } from "react";

/* ─── Icon components ──────────────────────────────────────── */
const FacebookIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
  </svg>
);

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

/* ─── Channel config ────────────────────────────────────────── */
const CHANNELS = [
  {
    id: "facebook",
    name: "Facebook",
    tagline: "Pages & Messenger",
    description:
      "Connect your Facebook Page to receive and reply to all Page messages and Messenger conversations directly inside your inbox.",
    tags: ["Facebook Pages", "Messenger", "Comments"],
    icon: FacebookIcon,
    gradient: "from-[#1877F2] to-[#0C5FCD]",
    iconColor: "text-white",
    iconBg: "bg-gradient-to-br from-[#1877F2] to-[#0C5FCD]",
    borderHover: "hover:border-[#1877F2]/60",
    glowColor: "shadow-[#1877F2]/10",
    provider: "meta",
  },
  {
    id: "instagram",
    name: "Instagram",
    tagline: "Direct Messages",
    description:
      "Handle Instagram DMs from customers, influencers, and followers — all routed to your team without switching apps.",
    tags: ["Direct Messages", "Story Replies", "Business API"],
    icon: InstagramIcon,
    gradient: "from-[#E1306C] via-[#833AB4] to-[#F77737]",
    iconColor: "text-white",
    iconBg: "bg-gradient-to-br from-[#E1306C] via-[#833AB4] to-[#F77737]",
    borderHover: "hover:border-[#E1306C]/60",
    glowColor: "shadow-[#833AB4]/10",
    provider: "meta",
  },
  {
    id: "whatsapp",
    name: "WhatsApp Business",
    tagline: "Enterprise API",
    description:
      "Connect WhatsApp Business API to reach customers where they are — support, proactive notifications, and broadcasts at scale.",
    tags: ["Business API", "Broadcasts", "Templates"],
    icon: WhatsAppIcon,
    gradient: "from-[#25D366] to-[#128C4E]",
    iconColor: "text-white",
    iconBg: "bg-gradient-to-br from-[#25D366] to-[#128C4E]",
    borderHover: "hover:border-[#25D366]/60",
    glowColor: "shadow-[#25D366]/10",
    provider: "meta",
  },
];

/* ─── Main component ────────────────────────────────────────── */
export const ChannelsView = () => {
  const { organization } = useOrganization();
  const [connecting, setConnecting] = useState<string | null>(null);

  const handleConnect = (channel: (typeof CHANNELS)[number]) => {
    if (channel.id === "whatsapp") {
      toast.info("WhatsApp Business API integration is coming soon!");
      return;
    }
    if (!organization?.id) {
      toast.error("Please select an organization first.");
      return;
    }
    setConnecting(channel.id);
    const clientOrigin = window.location.origin;
    const convexUrl = (process.env.NEXT_PUBLIC_CONVEX_URL ?? "")
      .replace("wss://", "https://")
      .replace("ws://", "http://")
      .replace(".convex.cloud", ".convex.site");
    window.location.href = `${convexUrl}/api/integrations/meta/login?orgId=${organization.id}&clientOrigin=${encodeURIComponent(clientOrigin)}`;
  };

  return (
    <div className="flex flex-col min-h-screen w-full overflow-y-auto bg-[#0f1013] text-[#e2e2e8]">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-10">

        {/* ── Header ── */}
        <header className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[#6b7280] mb-2">
                Integrations
              </p>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                Messaging Channels
              </h1>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1c1e24] border border-[#2d3139] self-start sm:self-auto">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm font-semibold text-[#c3c6d7]">3 Available</span>
            </div>
          </div>
          <p className="text-[#8d90a0] text-sm sm:text-base leading-relaxed max-w-2xl">
            Connect your messaging platforms to consolidate all customer conversations into a single, unified inbox.
          </p>
        </header>

        {/* ── Divider ── */}
        <div className="border-t border-[#23262d]" />

        {/* ── Channel cards ── */}
        <section className="grid grid-cols-1 gap-5">
          {CHANNELS.map((channel) => {
            const Icon = channel.icon;
            const isLoading = connecting === channel.id;

            return (
              <div
                key={channel.id}
                className={`
                  relative group bg-[#16181e] border border-[#2d3139] rounded-2xl
                  overflow-hidden transition-all duration-300
                  ${channel.borderHover}
                  hover:shadow-xl hover:shadow-black/30
                `}
              >
                {/* Subtle gradient top bar */}
                <div className={`h-0.5 w-full bg-gradient-to-r ${channel.gradient} opacity-60 group-hover:opacity-100 transition-opacity`} />

                <div className="p-6 sm:p-8">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-5">

                    {/* Icon */}
                    <div className={`w-14 h-14 rounded-xl ${channel.iconBg} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                      <Icon className={`w-7 h-7 ${channel.iconColor}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-3">
                        <div>
                          <h2 className="text-lg sm:text-xl font-bold text-white leading-tight">
                            {channel.name}
                          </h2>
                          <p className="text-xs font-semibold text-[#6b7280] uppercase tracking-wider mt-0.5">
                            {channel.tagline}
                          </p>
                        </div>

                        <Button
                          onClick={() => handleConnect(channel)}
                          disabled={isLoading}
                          className={`
                            inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm
                            bg-gradient-to-r ${channel.gradient} text-white border-0
                            hover:opacity-90 active:scale-95 transition-all duration-200
                            disabled:opacity-60 disabled:cursor-not-allowed
                            shadow-md hover:shadow-lg
                            self-start sm:self-auto flex-shrink-0
                          `}
                        >
                          {isLoading ? (
                            <>
                              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                              </svg>
                              Connecting…
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                              </svg>
                              Connect
                            </>
                          )}
                        </Button>
                      </div>

                      <p className="text-[#8d90a0] text-sm leading-relaxed mb-4">
                        {channel.description}
                      </p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2">
                        {channel.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2.5 py-1 rounded-lg bg-[#1c1e24] border border-[#2d3139] text-[10px] uppercase font-bold tracking-wider text-[#6b7280]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* ── Info footer ── */}
        <footer className="border-t border-[#23262d] pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-[#6b7280] text-xs sm:text-sm leading-relaxed">
              Facebook and Instagram use the same Meta OAuth flow.
              <br className="hidden sm:block" />
              Make sure <code className="bg-[#1c1e24] px-1.5 py-0.5 rounded text-[#b4c5ff] text-xs">META_APP_ID</code> and <code className="bg-[#1c1e24] px-1.5 py-0.5 rounded text-[#b4c5ff] text-xs">META_APP_SECRET</code> are set in your Convex dashboard.
            </p>
            <a
              href="https://developers.facebook.com/apps"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-[#b4c5ff] hover:text-white transition-colors flex items-center gap-1.5 self-start sm:self-auto flex-shrink-0"
            >
              Meta Developer Console →
            </a>
          </div>
        </footer>

      </div>
    </div>
  );
};
