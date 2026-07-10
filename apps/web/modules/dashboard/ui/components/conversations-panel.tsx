"use client";

import { useInfiniteScroll } from "@workspace/ui/hooks/use-infinite-scroll";
import { InfiniteScrollTrigger } from "@workspace/ui/components/infinite-scroll-trigger";
import { useUser } from "@clerk/nextjs";
import { formatDistanceToNow } from "date-fns";
import { getCountryFlagUrl, getCountryFromTimezone } from "@/lib/country-utils";
import { api } from "@workspace/backend/_generated/api";
import { DicebearAvatar } from "@workspace/ui/components/dicebear-avatar";
import { ScrollArea } from "@workspace/ui/components/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { cn } from "@workspace/ui/lib/utils";
import { usePaginatedQuery, useQuery } from "convex/react";
import { ListIcon, ArrowRightIcon, ArrowUpIcon, CheckIcon, CornerUpLeftIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConversationStatusIcon } from "@workspace/ui/components/conversation-status-icon";
import { useAtomValue, useSetAtom } from "jotai/react";
import { statusFilterAtom } from "../../atoms";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@workspace/ui/components/popover";
import { useOrganization } from "@clerk/nextjs";

export const ConversationsPanel = () => {
  const pathname = usePathname();
  const { user } = useUser();
  const { organization } = useOrganization();

  const statusFilter = useAtomValue(statusFilterAtom);
  const setStatusFilter = useSetAtom(statusFilterAtom);
  const [queueFilter, setQueueFilter] = useState<"all" | "me">("all");
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  const orgTags = useQuery(
    api.private.conversationTags.listTagsForOrg,
    organization?.id ? { organizationId: organization.id } : "skip"
  );

  const conversations = usePaginatedQuery(
    api.private.conversations.getMany,
    {
      status: 
        statusFilter === "all"
          ? undefined
          : statusFilter,
      assignedToUserId: queueFilter === "me" && user ? user.id : undefined,
      tag: tagFilter || undefined,
    },
    {
      initialNumItems: 10,
    },
  );

  const [searchQuery, setSearchQuery] = useState("");

  const {
    topElementRef,
    handleLoadMore,
    canLoadMore,
    isLoadingMore,
    isLoadingFirstPage,
  } = useInfiniteScroll({
    status: conversations.status,
    loadMore: conversations.loadMore,
    loadSize: 10,
  });

  const filteredResults = (conversations.results || []).filter((conv: any) => {
    if (!searchQuery) return true;
    const lowerQuery = searchQuery.toLowerCase();
    const nameMatch = conv.contactSession.name?.toLowerCase().includes(lowerQuery);
    const msgMatch = conv.lastMessage?.text?.toLowerCase().includes(lowerQuery);
    return nameMatch || msgMatch;
  });

  return (
    <div className="flex h-full w-full flex-col bg-background text-foreground overflow-hidden">
      <div className="flex flex-col gap-2 p-sm border-b border-outline-variant">
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
          <input 
            className="w-full bg-background border border-outline-variant py-1.5 pl-9 pr-3 text-label-sm font-label-sm focus:outline-none focus:border-primary rounded-none text-on-surface" 
            placeholder="Search chats..." 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
          {/* Status Chip */}
          <Popover>
            <PopoverTrigger asChild>
              <button className={cn(
                "flex items-center gap-1 shrink-0 text-[11px] font-bold uppercase tracking-wider px-2 py-1 border rounded-full transition-colors",
                statusFilter !== "all" 
                  ? "border-primary bg-primary/10 text-primary" 
                  : "border-outline-variant text-on-surface-variant hover:border-on-surface-variant"
              )}>
                Status: {statusFilter === "all" ? "All" : statusFilter}
                <span className="material-symbols-outlined text-[14px]">arrow_drop_down</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-40 p-1 bg-surface-container-high border-outline-variant text-on-surface" align="start">
              <div className="flex flex-col">
                {["all", "unresolved", "escalated", "resolved"].map(s => (
                  <button 
                    key={s} 
                    className={cn(
                      "text-left px-2 py-1.5 text-label-sm hover:bg-surface-container-highest",
                      statusFilter === s && "text-primary"
                    )}
                    onClick={() => setStatusFilter(s as any)}
                  >
                    {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          {/* Assigned Chip */}
          <button 
            className={cn(
              "flex items-center gap-1 shrink-0 text-[11px] font-bold uppercase tracking-wider px-2 py-1 border rounded-full transition-colors",
              queueFilter === "me" 
                ? "border-primary bg-primary/10 text-primary" 
                : "border-outline-variant text-on-surface-variant hover:border-on-surface-variant"
            )}
            onClick={() => setQueueFilter(queueFilter === "me" ? "all" : "me")}
          >
            Assigned: {queueFilter === "me" ? "Me" : "All"}
          </button>

          {/* Tag Chip */}
          <Popover>
            <PopoverTrigger asChild>
              <button className={cn(
                "flex items-center gap-1 shrink-0 text-[11px] font-bold uppercase tracking-wider px-2 py-1 border rounded-full transition-colors",
                tagFilter 
                  ? "border-primary bg-primary/10 text-primary" 
                  : "border-outline-variant text-on-surface-variant hover:border-on-surface-variant"
              )}>
                Tag: {tagFilter || "Any"}
                <span className="material-symbols-outlined text-[14px]">arrow_drop_down</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-1 bg-surface-container-high border-outline-variant text-on-surface" align="start">
              <div className="flex flex-col max-h-48 overflow-y-auto custom-scrollbar">
                <button 
                  className={cn(
                    "text-left px-2 py-1.5 text-label-sm hover:bg-surface-container-highest",
                    !tagFilter && "text-primary font-bold"
                  )}
                  onClick={() => setTagFilter(null)}
                >
                  Any Tag
                </button>
                {(orgTags ?? []).map((t: string) => (
                  <button 
                    key={t} 
                    className={cn(
                      "text-left px-2 py-1.5 text-label-sm hover:bg-surface-container-highest",
                      tagFilter === t && "text-primary font-bold"
                    )}
                    onClick={() => setTagFilter(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      {isLoadingFirstPage ? (
        <SkeletonConversations />
      ) : (
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="flex w-full flex-col">
            {filteredResults.map((conversation) => {
              const isLastMessageFromOperator =
                conversation.lastMessage?.message?.role !== "user";

              const country = getCountryFromTimezone(
                conversation.contactSession.metadata?.timezone
              );

              const countryFlagUrl = country?.code
                ? getCountryFlagUrl(country.code)
                : undefined;

              const isActive = pathname === `/conversations/${conversation._id}`;

              return (
                <Link
                  key={conversation._id}
                  className={cn(
                    "relative flex cursor-pointer items-start gap-3 border-b border-outline-variant p-sm py-sm text-sm leading-tight transition-colors",
                    isActive
                      ? "bg-surface-container-high text-primary"
                      : "text-on-surface hover:bg-surface-container-low hover:text-primary"
                  )}
                  href={`/conversations/${conversation._id}`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary" />
                  )}

                  <DicebearAvatar
                    seed={conversation.contactSession._id}
                    badgeImageUrl={countryFlagUrl}
                    size={36}
                    className="shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex w-full items-center justify-between gap-2 mb-1">
                      <span className="truncate text-label-md font-label-md font-bold text-primary">
                        {conversation.contactSession.name}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        {conversation.slaStatus === "breached" && (
                          <span className="text-[9px] font-bold tracking-wider uppercase bg-error/10 text-error px-1.5 py-0.5 rounded-sm">
                            SLA Breach
                          </span>
                        )}
                        <span className="text-label-sm font-label-sm text-on-surface-variant">
                          {formatDistanceToNow(conversation._creationTime)}
                        </span>
                      </div>
                    </div>
                    {conversation.assignedToName && (
                      <div className="flex items-center gap-1 mb-1 text-[10px] text-on-surface-variant">
                        <span className="material-symbols-outlined text-[12px]">person</span>
                        <span>Assigned to {conversation.assignedToName}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex w-0 grow items-center gap-1">
                        {isLastMessageFromOperator && (
                          <CornerUpLeftIcon className="size-3 shrink-0 text-on-surface-variant" />
                        )}
                        <span
                          className={cn(
                            "line-clamp-1 text-body-sm font-body-sm text-on-surface-variant",
                            !isLastMessageFromOperator && "font-bold text-on-surface"
                          )}
                        >
                          {conversation.lastMessage?.text}
                        </span>
                      </div>
                      <ConversationStatusIcon status={conversation.status} />
                    </div>
                  </div>
                </Link>
              )
            })}
            {filteredResults.length === 0 && (
              <div className="p-4 text-center text-on-surface-variant text-label-sm">
                No conversations found.
              </div>
            )}
            <InfiniteScrollTrigger
              canLoadMore={canLoadMore}
              isLoadingMore={isLoadingMore}
              onLoadMore={handleLoadMore}
              ref={topElementRef}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export const SkeletonConversations = () => {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto">
      <div className="relative flex w-full min-w-0 flex-col p-2">
        <div className="w-full space-y-2">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              className="flex items-start gap-3 rounded-lg p-4"
              key={index}
            >
              <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
              <div className="min-w-0 flex-1">
                <div className="flex w-full items-center gap-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="ml-auto h-3 w-12 shrink-0" />
                </div>
                <div className="mt-2">
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}