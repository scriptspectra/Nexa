"use client";

import { useOrganization } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@workspace/backend/_generated/api";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@workspace/ui/lib/utils";

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
    description: "Give your AI agent context about your business",
    href: "/files",
    icon: "upload_file",
  },
  {
    key: "customizedWidget",
    label: "Customize your widget",
    description: "Choose colors, greeting message, and suggestions",
    href: "/customization",
    icon: "palette",
  },
  {
    key: "connectedShopify",
    label: "Connect Shopify",
    description: "Sync product catalog for AI order lookups",
    href: "/integrations",
    icon: "store",
  },
  {
    key: "embeddedWidget",
    label: "Embed your widget",
    description: "Install the chat widget on your website",
    href: "/customization",
    icon: "code",
  },
  {
    key: "invitedTeamMember",
    label: "Invite a team member",
    description: "Bring your support agents into Zephyra",
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

  const handleDismiss = async () => {
    setIsDismissing(true);
    try {
      await upsertProgress({
        organizationId: organization.id,
        dismissed: true,
      });
    } finally {
      setIsDismissing(false);
    }
  };

  return (
    <div className="border border-outline-variant bg-[#111] mb-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-md py-sm border-b border-outline-variant">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary text-[20px]">rocket_launch</span>
          <div>
            <p className="text-label-md font-bold text-white uppercase tracking-widest">
              Get Started
            </p>
            <p className="text-[11px] text-on-surface-variant">
              {completedCount} of {STEPS.length} steps complete
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Progress bar */}
          <div className="w-32 h-1 bg-surface-container-low overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <button
            className="text-on-surface-variant hover:text-white transition-colors text-[11px] font-bold uppercase tracking-wider"
            onClick={handleDismiss}
            disabled={isDismissing}
          >
            {isDismissing ? "..." : "Dismiss"}
          </button>
        </div>
      </div>

      {/* Steps */}
      <div className="divide-y divide-outline-variant">
        {STEPS.map((step) => {
          const done = progress?.[step.key] ?? false;
          return (
            <button
              key={step.key}
              className={cn(
                "w-full flex items-center gap-4 px-md py-sm text-left transition-colors",
                done
                  ? "opacity-50 cursor-default"
                  : "hover:bg-surface-container-low cursor-pointer"
              )}
              onClick={() => {
                if (!done) router.push(step.href);
              }}
              disabled={done}
            >
              {/* Check / Icon */}
              <div
                className={cn(
                  "w-8 h-8 flex items-center justify-center border flex-shrink-0",
                  done
                    ? "border-green-500 bg-green-500/10"
                    : "border-outline-variant bg-surface-container-low"
                )}
              >
                {done ? (
                  <span className="material-symbols-outlined text-green-400 text-[16px]">check</span>
                ) : (
                  <span className="material-symbols-outlined text-on-surface-variant text-[16px]">
                    {step.icon}
                  </span>
                )}
              </div>

              {/* Labels */}
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-label-md font-bold",
                    done ? "line-through text-on-surface-variant" : "text-white"
                  )}
                >
                  {step.label}
                </p>
                <p className="text-[11px] text-on-surface-variant truncate">
                  {step.description}
                </p>
              </div>

              {/* Arrow */}
              {!done && (
                <span className="material-symbols-outlined text-on-surface-variant text-[16px] flex-shrink-0">
                  arrow_forward
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
