"use client";

import { useOrganization } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@workspace/backend/_generated/api";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@workspace/ui/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover";

interface Step {
  key: "connectedShopify" | "uploadedFile" | "customizedWidget" | "embeddedWidget" | "invitedTeamMember";
  label: string;
  description: string;
  href: string;
  icon: string;
}

const STEPS: Step[] = [
  {
    key: "uploadedFile",
    label: "Upload a knowledge file",
    description: "Give your AI agent business context",
    href: "/files",
    icon: "upload_file",
  },
  {
    key: "customizedWidget",
    label: "Customize your widget",
    description: "Choose colors, greeting, suggestions",
    href: "/customization",
    icon: "palette",
  },
  {
    key: "connectedShopify",
    label: "Connect Shopify",
    description: "Sync product catalog for order lookups",
    href: "/integrations",
    icon: "store",
  },
  {
    key: "embeddedWidget",
    label: "Embed your widget",
    description: "Install the chat widget on your site",
    href: "/customization",
    icon: "code",
  },
  {
    key: "invitedTeamMember",
    label: "Invite a team member",
    description: "Bring support agents to Zephyra",
    href: "/billing",
    icon: "group_add",
  },
];

export const OnboardingChecklist = () => {
  const { organization } = useOrganization();
  const router = useRouter();

  const progress = useQuery(
    api.private.onboarding.get,
    organization?.id ? { organizationId: organization.id } : "skip",
  );

  const upsertProgress = useMutation(api.private.onboarding.upsert);

  const [isDismissing, setIsDismissing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  if (!organization?.id || progress === undefined) return null;

  // If all done or dismissed, hide
  const allDone =
    progress !== null &&
    STEPS.every((s) => progress[s.key]);

  if (progress?.dismissed || allDone) return null;

  const completedCount = progress
    ? STEPS.filter((s) => progress[s.key]).length
    : 0;

  const pct = Math.round((completedCount / STEPS.length) * 100);

  const handleDismiss = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDismissing(true);
    try {
      await upsertProgress({
        organizationId: organization.id,
        dismissed: true,
      });
      setIsOpen(false);
    } finally {
      setIsDismissing(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20 transition-all text-xs font-medium cursor-pointer">
          <span className="material-symbols-outlined text-[16px] animate-pulse">rocket_launch</span>
          <span>Setup Checklist ({completedCount}/{STEPS.length})</span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 bg-surface-container border-outline-variant text-on-surface z-50">
        {/* Header */}
        <div className="flex flex-col gap-2 p-4 border-b border-outline-variant bg-surface-container-high">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[18px]">rocket_launch</span>
              <span className="text-sm font-bold text-white uppercase tracking-wider">
                Get Started
              </span>
            </div>
            <button
              className="text-on-surface-variant hover:text-white transition-colors text-[10px] font-bold uppercase tracking-wider cursor-pointer"
              onClick={handleDismiss}
              disabled={isDismissing}
            >
              {isDismissing ? "..." : "Dismiss"}
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-surface-container-low overflow-hidden rounded-full">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs text-on-surface-variant font-mono whitespace-nowrap">
              {pct}%
            </span>
          </div>
        </div>

        {/* Steps */}
        <div className="divide-y divide-outline-variant max-h-[320px] overflow-y-auto">
          {STEPS.map((step) => {
            const done = progress?.[step.key] ?? false;
            return (
              <button
                key={step.key}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors text-xs",
                  done
                    ? "opacity-50 cursor-default bg-surface-container-low"
                    : "hover:bg-surface-container-high cursor-pointer"
                )}
                onClick={() => {
                  if (!done) {
                    router.push(step.href);
                    setIsOpen(false);
                  }
                }}
                disabled={done}
              >
                {/* Check / Icon */}
                <div
                  className={cn(
                    "w-6 h-6 flex items-center justify-center border rounded flex-shrink-0",
                    done
                      ? "border-green-500 bg-green-500/10"
                      : "border-outline-variant bg-surface-container-low"
                  )}
                >
                  {done ? (
                    <span className="material-symbols-outlined text-green-400 text-[12px]">check</span>
                  ) : (
                    <span className="material-symbols-outlined text-on-surface-variant text-[12px]">
                      {step.icon}
                    </span>
                  )}
                </div>

                {/* Labels */}
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "font-bold",
                      done ? "line-through text-on-surface-variant" : "text-white"
                    )}
                  >
                    {step.label}
                  </p>
                  <p className="text-[10px] text-on-surface-variant truncate">
                    {step.description}
                  </p>
                </div>

                {/* Arrow */}
                {!done && (
                  <span className="material-symbols-outlined text-on-surface-variant text-[14px] flex-shrink-0">
                    arrow_forward
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};
