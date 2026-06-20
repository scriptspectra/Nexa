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
import { usePaginatedQuery } from "convex/react";
import { ListIcon, ArrowRightIcon, ArrowUpIcon, CheckIcon, CornerUpLeftIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConversationStatusIcon } from "@workspace/ui/components/conversation-status-icon";
import { useAtomValue, useSetAtom } from "jotai/react";
import { statusFilterAtom } from "../../atoms";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { useState } from "react";

export const ConversationsPanel = () => {
  const pathname = usePathname();
  const { user } = useUser();

  const statusFilter = useAtomValue(statusFilterAtom);
  const setStatusFilter = useSetAtom(statusFilterAtom);
  const [queueFilter, setQueueFilter] = useState<"all" | "me">("all");

  const conversations = usePaginatedQuery(
    api.private.conversations.getMany,
    {
      status: 
        statusFilter === "all"
          ? undefined
          : statusFilter,
      assignedToUserId: queueFilter === "me" && user ? user.id : undefined,
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

  const filteredResults = (conversations.results || []).filter(conv => {
    if (!searchQuery) return true;
    const lowerQuery = searchQuery.toLowerCase();
    const nameMatch = conv.contactSession.name?.toLowerCase().includes(lowerQuery);
    const msgMatch = conv.lastMessage?.text?.toLowerCase().includes(lowerQuery);
    return nameMatch || msgMatch;
  });

  return (
    <div className="flex h-full w-full flex-col bg-background text-foreground overflow-hidden">
      <div className="flex flex-col gap-2 p-sm border-b border-outline-variant">
        <div className="flex bg-surface-container-low border border-outline-variant p-1 gap-1">
          <button 
            className={`flex-1 text-[11px] font-bold uppercase tracking-wider py-1 ${queueFilter === "all" ? "bg-white text-black" : "text-on-surface-variant hover:text-white"}`}
            onClick={() => setQueueFilter("all")}
          >
            All Tickets
          </button>
          <button 
            className={`flex-1 text-[11px] font-bold uppercase tracking-wider py-1 ${queueFilter === "me" ? "bg-white text-black" : "text-on-surface-variant hover:text-white"}`}
            onClick={() => setQueueFilter("me")}
          >
            My Queue
          </button>
        </div>
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
        <div className="relative w-full">
          <Select
            defaultValue="all"
            onValueChange={(value) => setStatusFilter(
              value as "unresolved" | "escalated" | "resolved" | "all"
            )}
            value={statusFilter}
          >
            <SelectTrigger
              className="w-full bg-background border border-outline-variant text-label-sm font-label-sm h-9 focus:border-primary focus:ring-0 rounded-none text-on-surface"
            >
              <SelectValue placeholder="Filter conversations" />
            </SelectTrigger>
            <SelectContent className="bg-surface-container-high border border-outline-variant text-on-surface z-50">
              <SelectItem value="all" className="hover:bg-surface-container-highest cursor-pointer focus:bg-surface-container-highest focus:text-primary">
                <div className="flex items-center gap-2">
                  <ListIcon className="size-4" />
                  <span>All Conversations</span>
                </div>
              </SelectItem>
              <SelectItem value="unresolved" className="hover:bg-surface-container-highest cursor-pointer focus:bg-surface-container-highest focus:text-primary">
                <div className="flex items-center gap-2">
                  <ArrowRightIcon className="size-4" />
                  <span>Unresolved</span>
                </div>
              </SelectItem>
              <SelectItem value="escalated" className="hover:bg-surface-container-highest cursor-pointer focus:bg-surface-container-highest focus:text-primary">
                <div className="flex items-center gap-2">
                  <ArrowUpIcon className="size-4" />
                  <span>Escalated</span>
                </div>
              </SelectItem>
              <SelectItem value="resolved" className="hover:bg-surface-container-highest cursor-pointer focus:bg-surface-container-highest focus:text-primary">
                <div className="flex items-center gap-2">
                  <CheckIcon className="size-4" />
                  <span>Resolved</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
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
                      <span className="shrink-0 text-label-sm font-label-sm text-on-surface-variant">
                        {formatDistanceToNow(conversation._creationTime)}
                      </span>
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