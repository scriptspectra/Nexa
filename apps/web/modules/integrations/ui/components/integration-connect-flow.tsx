"use client";

import { useOrganization } from "@clerk/nextjs";
import { Button } from "@workspace/ui/components/button";
import { CheckIcon, PlusIcon, MessageCircleIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

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
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = () => {
    if (!organization?.id) {
      toast.error("Please select an organization first.");
      return;
    }
    setIsConnecting(true);
    // Redirect to backend OAuth login
    window.location.href = `/api/integrations/${provider}/login?orgId=${organization.id}`;
  };

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

        <Button
          onClick={handleConnect}
          disabled={isConnecting}
          className="flex-shrink-0 h-9 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-all"
        >
          {isConnecting ? (
            <>
              <Loader2Icon className="size-3.5 mr-1.5 animate-spin" />
              Connecting…
            </>
          ) : (
            <>
              <PlusIcon className="size-3.5 mr-1.5" />
              Connect
            </>
          )}
        </Button>
      </div>

      {/* Feature tags */}
      <div className="flex flex-wrap gap-2">
        {provider === "meta" && (
          <>
            {["Facebook Pages", "Instagram DMs", "WhatsApp Business", "Messenger"].map((feature) => (
              <span key={feature} className="px-2.5 py-1 rounded-md text-[10px] font-semibold bg-white/[0.03] border border-white/5 text-zinc-500">
                {feature}
              </span>
            ))}
          </>
        )}
        {provider === "slack" && (
          <>
            {["Workspaces", "Channels", "Direct Messages"].map((feature) => (
              <span key={feature} className="px-2.5 py-1 rounded-md text-[10px] font-semibold bg-white/[0.03] border border-white/5 text-zinc-500">
                {feature}
              </span>
            ))}
          </>
        )}
      </div>
    </div>
  );
};
