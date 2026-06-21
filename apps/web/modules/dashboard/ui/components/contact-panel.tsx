"use client";

import Bowser from "bowser";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";
import { getCountryFlagUrl, getCountryFromTimezone } from "@/lib/country-utils";
import { api } from "@workspace/backend/_generated/api";
import { Id } from "@workspace/backend/_generated/dataModel";
import { Button } from "@workspace/ui/components/button";
import { DicebearAvatar } from "@workspace/ui/components/dicebear-avatar";
import { useQuery } from "convex/react";
import { ClockIcon, GlobeIcon, MailIcon, MonitorIcon, TagIcon } from "lucide-react";
import Link from "next/link";
import { TagChips } from "./tag-chips";
import { EmailReplyDialog } from "./email-reply-dialog";
import { useParams } from "next/navigation";
import { useMemo } from "react";

type InfoItem = {
  label: string;
  value: string | React.ReactNode;
  className?: string;
};

type InfoSection = {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  items: InfoItem[];
};

export const ContactPanel = () => {
  const params = useParams();
  const conversationId = params.conversationId as (Id<"conversations"> | null);

  const contactSession = useQuery(api.private.contactSessions.getOneByConversationId, 
    conversationId ? {
      conversationId,
    } : "skip",
  );

  const parseUserAgent = useMemo(() => {
    return (userAgent?: string) => {
      if (!userAgent) {
        return { browser: "Unknown", os: "Unknown", device: "Unknown" };
      }

      const browser = Bowser.getParser(userAgent);
      const result = browser.getResult();

      return {
        browser: result.browser.name || "Unknown",
        browserVersion: result.browser.version || "",
        os: result.os.name || "Unknown",
        osVersion: result.os.version || "",
        device: result.platform.type || "desktop",
        deviceVendor: result.platform.vendor || "",
        deviceModel: result.platform.model || "",
      };
    };
  }, []);

  const userAgentInfo = useMemo(() => 
    parseUserAgent(contactSession?.metadata?.userAgent), 
  [contactSession?.metadata?.userAgent, parseUserAgent]);

  const countryInfo = useMemo(() => {
    return getCountryFromTimezone(contactSession?.metadata?.timezone);
  }, [contactSession?.metadata?.timezone]);

  const accordionSections = useMemo<InfoSection[]>(() => {
    if (!contactSession?.metadata) {
      return [];
    }

    return [
      {
        id: "device-info",
        icon: MonitorIcon,
        title: "Device Information",
        items: [
          {
            label: "Browser",
            value:
              userAgentInfo.browser + 
                (userAgentInfo.browserVersion
                  ? ` ${userAgentInfo.browserVersion}`
                  : ""
                ),
          },
          {
            label: "OS",
            value:
              userAgentInfo.os +
                (userAgentInfo.osVersion ? ` ${userAgentInfo.osVersion}` : ""),
          },
          {
            label: "Device",
            value:
              userAgentInfo.device +
                (
                  userAgentInfo.deviceModel
                    ? ` - ${userAgentInfo.deviceModel}`
                    : ""
                ),
              className: "capitalize"
          },
          {
            label: "Screen",
            value: contactSession.metadata.screenResolution,
          },
          {
            label: "Viewport",
            value: contactSession.metadata.viewportSize,
          },
          {
            label: "Cookies",
            value: contactSession.metadata.cookieEnabled ? "Enabled" : "Disabled"
          },
        ],
      },
      {
        id: "location-info",
        icon: GlobeIcon,
        title: "Location & Language",
        items: [
          ...(countryInfo
            ? [
              {
                label: "Country",
                value: (
                  <span>
                    {countryInfo.name}
                  </span>
                )
              }
            ]
            : []
          ),
          {
            label: "Language",
            value: contactSession.metadata.language,
          },
          {
            label: "Timezone",
            value: contactSession.metadata.timezone,
          },
          {
            label: "UTC Offset",
            value: contactSession.metadata.timezoneOffset,
          }
        ]
      },
      {
        id: "session-details",
        title: "Session Details",
        icon: ClockIcon,
        items: [
          {
            label: "Session Started",
            value: new Date(
              contactSession._creationTime
            ).toLocaleString(),
          }
        ],
      }
    ];
  }, [contactSession, userAgentInfo, countryInfo]);

  if (contactSession === undefined || contactSession === null) {
    return null;
  }

  return (
    <div className="flex h-full w-full flex-col bg-surface-container-lowest text-foreground overflow-y-auto custom-scrollbar">
      {/* Profile Section */}
      <div className="p-lg text-center border-b border-outline-variant">
        <div className="w-20 h-20 rounded-full bg-surface-container-high border border-outline-variant mx-auto mb-sm overflow-hidden">
          <DicebearAvatar
            badgeImageUrl={
              countryInfo?.code
                ? getCountryFlagUrl(countryInfo.code)
                : undefined
            }
            seed={contactSession._id}
            size={80}
          />
        </div>
        <h3 className="text-body-lg font-bold text-primary">{contactSession.name}</h3>
        <p className="text-label-sm font-label-sm text-on-surface-variant mb-4">{contactSession.email}</p>
        {conversationId && contactSession.email && (
          <EmailReplyDialog conversationId={conversationId} contactEmail={contactSession.email} />
        )}
      </div>

      <div className="flex-1">
        {contactSession.metadata && (
          <Accordion
            className="w-full rounded-none"
            collapsible
            type="single"
          >
            {accordionSections.map((section) => (
              <AccordionItem
                className="rounded-none border-b border-outline-variant"
                key={section.id}
                value={section.id}
              >
                <AccordionTrigger
                  className="flex w-full flex-1 items-start justify-between gap-4 rounded-none bg-surface-container px-sm py-sm text-left text-label-md font-label-md uppercase tracking-wider text-primary outline-none transition-all hover:no-underline hover:bg-surface-container-low"
                >
                  <div className="flex items-center gap-4">
                    <section.icon className="size-4 shrink-0" />
                    <span>{section.title}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-sm py-sm">
                  <div className="space-y-3">
                    {section.items.map((item) => (
                      <div className="flex justify-between" key={`${section.id}-${item.label}`}>
                        <span className="text-label-sm font-label-sm text-on-surface-variant">
                          {item.label}
                        </span>
                        <span className={`text-label-sm font-label-sm text-primary ${item.className ?? ""}`}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
            {conversationId && (
              <AccordionItem
                className="rounded-none border-b border-outline-variant"
                value="tags"
              >
                <AccordionTrigger
                  className="flex w-full flex-1 items-start justify-between gap-4 rounded-none bg-surface-container px-sm py-sm text-left text-label-md font-label-md uppercase tracking-wider text-primary outline-none transition-all hover:no-underline hover:bg-surface-container-low"
                >
                  <div className="flex items-center gap-4">
                    <TagIcon className="size-4 shrink-0" />
                    <span>Tags</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-sm py-sm">
                  <TagChips conversationId={conversationId} />
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>
        )}
      </div>
    </div>
  );
};
