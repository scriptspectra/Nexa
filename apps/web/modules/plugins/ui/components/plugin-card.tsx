import { ArrowLeftRightIcon, type LucideIcon, PlugIcon } from "lucide-react";
import Image from "next/image";
import { Button } from "@workspace/ui/components/button";

export interface Feature {
  icon: LucideIcon,
  label: string;
  description: string;
};

interface PluginCardProps {
  isDisabled?: boolean;
  serviceName: string;
  serviceImage: string;
  features: Feature[];
  onSubmit: () => void;
};

export const PluginCard = ({
  isDisabled,
  serviceName,
  serviceImage,
  features,
  onSubmit,
}: PluginCardProps) => {
  return (
    <div className="relative overflow-hidden w-full rounded-2xl border border-white/5 bg-zinc-950/40 backdrop-blur-xl p-8 shadow-2xl">
      {/* Background ambient glow */}
      <div className="absolute -left-10 -top-10 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      {/* Integration connection flow UI */}
      <div className="mb-8 flex items-center justify-center gap-6 py-6 bg-zinc-900/20 rounded-2xl border border-white/[0.02] relative z-10">
        <div className="flex size-16 items-center justify-center bg-white/[0.02] rounded-xl border border-white/5 shadow-inner">
          <Image
            alt={serviceName}
            className="rounded-lg object-contain"
            height={40}
            width={40}
            src={serviceImage}
          />
        </div>

        <div className="relative flex items-center justify-center w-16">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent animate-pulse" />
          </div>
          <div className="relative z-10 flex size-8 items-center justify-center rounded-full bg-zinc-900 border border-white/10 text-amber-500 shadow-md">
            <ArrowLeftRightIcon className="size-4 animate-pulse text-amber-400" />
          </div>
        </div>

        <div className="flex size-16 items-center justify-center bg-white/[0.02] rounded-xl border border-white/5 shadow-inner">
          <Image
            alt="Platform"
            className="object-contain"
            height={40}
            width={40}
            src="/logo.svg"
          />
        </div>
      </div>

      <div className="mb-6 text-center relative z-10">
        <h3 className="text-xl font-bold text-white tracking-tight">Connect your {serviceName} account</h3>
        <p className="text-sm text-zinc-400 mt-1 max-w-sm mx-auto leading-relaxed">
          Link {serviceName} API credentials to enable high-fidelity AI voice agents and phone call routing.
        </p>
      </div>

      {/* Features List */}
      <div className="mb-8 space-y-3.5 bg-zinc-900/10 p-5 rounded-2xl border border-white/[0.02] relative z-10">
        <div className="space-y-4">
          {features.map((feature) => (
            <div className="flex items-start gap-3.5" key={feature.label}>
              <div className="flex size-8.5 items-center justify-center rounded-lg bg-white/[0.02] border border-white/5 text-zinc-400 shrink-0">
                <feature.icon className="size-4.5" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-sm text-zinc-200">{feature.label}</div>
                <div className="text-zinc-500 text-xs mt-0.5 leading-relaxed">{feature.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center relative z-10">
        <Button
          className="w-full bg-white hover:bg-zinc-200 text-black font-semibold rounded-xl h-11 transition-all duration-300 shadow-md shadow-white/5 active:scale-[0.98] flex items-center justify-center gap-2 border border-white/10"
          disabled={isDisabled}
          onClick={onSubmit}
          variant="default"
        >
          <PlugIcon className="size-4" />
          Connect Plugin
        </Button>
      </div>
    </div>
  );
};

