"use client";

import { useInfiniteScroll } from "@workspace/ui/hooks/use-infinite-scroll";
import { InfiniteScrollTrigger } from "@workspace/ui/components/infinite-scroll-trigger";
import { toUIMessages, useThreadMessages } from "@convex-dev/agent/react";
import { useOrganization } from "@clerk/nextjs";
import { api } from "@workspace/backend/_generated/api";
import { Id } from "@workspace/backend/_generated/dataModel";
import { Button } from "@workspace/ui/components/button";
import { useAction, useMutation, useQuery } from "convex/react";
import { MoreHorizontalIcon, Wand2Icon, UserIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import {
  AIConversation,
  AIConversationContent,
  AIConversationScrollButton,
} from "@workspace/ui/components/ai/conversation";
import {
  AIInput,
  AIInputButton,
  AIInputSubmit,
  AIInputTextarea,
  AIInputToolbar,
  AIInputTools,
} from "@workspace/ui/components/ai/input";
import {
  AIMessage,
  AIMessageContent,
} from "@workspace/ui/components/ai/message";
import { AIResponse } from "@workspace/ui/components/ai/response";
import { Form, FormField } from "@workspace/ui/components/form";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DicebearAvatar } from "@workspace/ui/components/dicebear-avatar";
import { ConversationStatusButton } from "../components/conversation-status-button";
import { useState } from "react";
import { cn } from "@workspace/ui/lib/utils";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { toast } from "sonner";
import { TagChips } from "../components/tag-chips";
import { useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@workspace/ui/components/dialog";
import { Textarea } from "@workspace/ui/components/textarea";
import { Input } from "@workspace/ui/components/input";

const formSchema = z.object({
  message: z.string().min(1, "Message is required"),
});

export const ConversationIdView = ({
  conversationId,
}: {
  conversationId: Id<"conversations">,
}) => {
  const conversation = useQuery(api.private.conversations.getOne, {
    conversationId,
  });

  const { organization } = useOrganization();
  const macros = useQuery(
    api.private.macros.listAll,
    organization?.id ? { organizationId: organization.id } : "skip"
  );

  const messages = useThreadMessages(
    api.private.messages.getMany,
    conversation?.threadId ? { threadId: conversation.threadId } : "skip",
    { initialNumItems: 10, }
  );

  const {
    topElementRef,
    handleLoadMore,
    canLoadMore,
    isLoadingMore,
  } = useInfiniteScroll({
    status: messages.status,
    loadMore: messages.loadMore,
    loadSize: 10,
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      message: "",
    },
  });

  const [isEnhancing, setIsEnhancing] = useState(false);
  const enhanceResponse = useAction(api.private.messages.enhanceResponse);
  const handleEnhanceResponse = async () => {
    setIsEnhancing(true);
    const currentValue = form.getValues("message");

    try {
      const response = await enhanceResponse({ prompt: currentValue });

      form.setValue("message", response);
    } catch (error) {
      toast.error("Something went wrong");
      console.error(error);
    } finally {
      setIsEnhancing(false);
    }
  }

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const fetchSuggestions = useAction(api.private.messages.getSuggestions);

  const handleGetSuggestions = async () => {
    if (!conversation?.threadId) return;
    setIsLoadingSuggestions(true);
    try {
      const result = await fetchSuggestions({ threadId: conversation.threadId });
      setSuggestions(result);
    } catch (error) {
      toast.error("Failed to get suggestions");
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // Macro popover logic
  const [showMacroPopover, setShowMacroPopover] = useState(false);
  const [macroFilter, setMacroFilter] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const messageValue = form.watch("message");

  useEffect(() => {
    const match = messageValue.match(/(?:^|\s)\/([a-zA-Z0-9_-]*)$/);
    if (match) {
      setMacroFilter(match[1].toLowerCase());
      setShowMacroPopover(true);
    } else {
      setShowMacroPopover(false);
    }
  }, [messageValue]);

  const filteredMacros = (macros ?? []).filter((m) =>
    m.title.toLowerCase().includes(macroFilter) ||
    m.shortcut?.toLowerCase().includes(macroFilter)
  );

  const insertMacro = (content: string) => {
    const current = form.getValues("message");
    const replaced = current.replace(/(?:^|\s)\/[a-zA-Z0-9_-]*$/, (match) => {
      const space = match.startsWith(" ") ? " " : "";
      return space + content;
    });
    form.setValue("message", replaced);
    setShowMacroPopover(false);
    inputRef.current?.focus();
  };

  const createMessage = useMutation(api.private.messages.create);
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await createMessage({
        conversationId,
        prompt: values.message,
      });

      form.reset();
    } catch (error) {
      console.error(error);
    }
  };

  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const updateConversationStatus = useMutation(api.private.conversations.updateStatus);
  const handleToggleStatus = async () => {
    if (!conversation) {
      return;
    }

    setIsUpdatingStatus(true);

    let newStatus: "unresolved" | "resolved" | "escalated";

    // Cycle through states: unresolved -> escalated -> resolved -> unresolved
    if (conversation.status === "unresolved") {
      newStatus = "escalated";
    } else if (conversation.status === "escalated") {
      newStatus = "resolved"
    } else {
      newStatus = "unresolved"
    }

    try {
      await updateConversationStatus({
        conversationId,
        status: newStatus,
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const { memberships } = useOrganization({
    memberships: {
      keepPreviousData: true,
    },
  });

  const assignConversation = useMutation(api.private.conversations.assign);
  const handleAssign = async (userId: string) => {
    if (!conversation) return;
    
    let assignedToUserId: string | undefined = userId;
    let assignedToName: string | undefined = undefined;
    
    if (userId === "unassigned") {
      assignedToUserId = undefined;
    } else {
      const member = memberships?.data?.find(m => m.publicUserData.userId === userId);
      assignedToName = member ? `${member.publicUserData.firstName} ${member.publicUserData.lastName}`.trim() : "Operator";
    }

    try {
      await assignConversation({
        conversationId: conversation._id,
        assignedToUserId,
        assignedToName,
      });
      toast.success(assignedToUserId ? `Assigned to ${assignedToName}` : "Unassigned");
    } catch (error) {
      toast.error("Failed to assign conversation");
      console.error(error);
    }
  };

  if (conversation === undefined || messages.status === "LoadingFirstPage") {
    return <ConversationIdViewLoading />
  }

  return (
    <div className="flex h-full w-full">
      {/* Central Chat Area */}
      <section className="flex-1 flex flex-col relative bg-background border-r border-outline-variant">
      <header className="h-16 flex items-center justify-between px-lg border-b border-outline-variant">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-surface-container-highest border border-outline-variant flex items-center justify-center text-primary font-bold text-label-sm">
            <span className="text-[11px] font-bold">{conversation?.contactSession?.name?.[0]?.toUpperCase() ?? "?"}</span>
          </div>
          <div>
            <h2 className="text-body-md font-bold text-primary">{conversation?.contactSession?.name ?? "Loading..."}</h2>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {!!conversation && (
            <div className="w-48">
              <Select
                value={conversation.assignedToUserId ?? "unassigned"}
                onValueChange={handleAssign}
              >
                <SelectTrigger className="h-8 bg-surface-container-low border-outline-variant text-xs">
                  <SelectValue placeholder="Assign to..." />
                </SelectTrigger>
                <SelectContent className="bg-surface-container-high border-outline-variant">
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {memberships?.data?.map((membership) => (
                    <SelectItem 
                      key={membership.publicUserData.userId} 
                      value={membership.publicUserData.userId || ""}
                    >
                      {membership.publicUserData.firstName} {membership.publicUserData.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {!!conversation && (
            <ConversationStatusButton
              onClick={handleToggleStatus}
              status={conversation.status}
              disabled={isUpdatingStatus}
            />
          )}
          <Button size="sm" variant="ghost" className="text-on-surface-variant hover:text-primary">
            <MoreHorizontalIcon />
          </Button>
        </div>
      </header>
      <AIConversation className="flex-1 overflow-hidden">
        <AIConversationContent>
          <InfiniteScrollTrigger
            canLoadMore={canLoadMore}
            isLoadingMore={isLoadingMore}
            onLoadMore={handleLoadMore}
            ref={topElementRef}
          />
          {toUIMessages(messages.results ?? [])?.map((message) => (
            <AIMessage
            // In reverse, because we are watching from "assistant" prespective
              from={message.role === "user" ? "assistant" : "user"}
              key={message.id}
            >
              <AIMessageContent>
                <AIResponse>
                  {message.content}
                </AIResponse>
              </AIMessageContent>
              {message.role === "user" && (
                <DicebearAvatar
                  seed={conversation?.contactSessionId ?? "user"}
                  size={32}
                />
              )}
            </AIMessage>
          ))}
        </AIConversationContent>
        <AIConversationScrollButton />
      </AIConversation>
      
      <div className="p-lg border-t border-outline-variant bg-surface-dim relative">
        
        {/* AI Suggestions */}
        {conversation?.status !== "resolved" && (
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleGetSuggestions}
              disabled={isLoadingSuggestions}
              className="h-7 text-[11px] bg-primary/10 border-primary/20 text-primary hover:bg-primary/20"
            >
              <Wand2Icon className="w-3 h-3 mr-1.5" />
              {isLoadingSuggestions ? "Generating..." : "Suggest replies"}
            </Button>
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => form.setValue("message", s)}
                className="text-[11px] border border-outline-variant rounded-full px-3 py-1 text-on-surface-variant hover:text-primary hover:border-primary transition-colors max-w-xs truncate"
                title={s}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Macro Popover */}
        {showMacroPopover && filteredMacros.length > 0 && (
          <div className="absolute bottom-full left-lg mb-2 w-80 max-h-60 overflow-y-auto bg-surface-container-high border border-outline-variant shadow-xl rounded-md z-50">
            <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant border-b border-outline-variant bg-surface-container-highest">
              Insert Macro
            </div>
            <ul className="py-1">
              {filteredMacros.map((macro) => (
                <li key={macro._id}>
                  <button
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-surface-container-highest transition-colors flex flex-col gap-1"
                    onClick={() => insertMacro(macro.content)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-label-sm font-bold text-white truncate">{macro.title}</span>
                      {macro.shortcut && (
                        <span className="text-[10px] font-mono text-primary bg-primary/10 px-1 py-0.5 rounded">
                          {macro.shortcut}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-on-surface-variant line-clamp-1">{macro.content}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Form {...form}>
          <AIInput onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              disabled={conversation?.status === "resolved"}
              name="message"
              render={({ field }) => (
                  <AIInputTextarea
                  ref={inputRef}
                  disabled={
                    conversation?.status === "resolved" ||
                    form.formState.isSubmitting ||
                    isEnhancing
                  }
                  onChange={field.onChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      form.handleSubmit(onSubmit)();
                    }
                  }}
                  placeholder={
                    conversation?.status === "resolved"
                      ? "This conversation has been resolved"
                      : "Type your response as an operator..."
                  }
                  value={field.value}
                />
              )}
            />
            <AIInputToolbar>
              <AIInputTools>
                <AIInputButton
                  onClick={handleEnhanceResponse}
                  disabled={
                    conversation?.status === "resolved" || 
                    isEnhancing || 
                    !form.formState.isValid
                  }
                >
                  <Wand2Icon />
                  {isEnhancing ? "Enhancing..." : "Enhance"}
                </AIInputButton>
              </AIInputTools>
              <AIInputSubmit
                disabled={
                  conversation?.status === "resolved" ||
                  !form.formState.isValid ||
                  form.formState.isSubmitting ||
                  isEnhancing
                }
                status="ready"
                type="submit"
              />
            </AIInputToolbar>
          </AIInput>
        </Form>
      </div>
      </section>

      {/* Right Detail Pane */}
      {conversation && (
        <ContactDetailsPane
          contactSession={conversation.contactSession}
          conversation={conversation}
        />
      )}
    </div>
  );
};

function ContactDetailsPane({ contactSession, conversation }: { contactSession: any, conversation: any }) {
  const meta = contactSession.metadata || {};

  return (
    <section className="w-80 flex-shrink-0 flex flex-col bg-surface-container-lowest overflow-y-auto custom-scrollbar">
      {/* Profile Section */}
      <div className="p-lg text-center border-b border-outline-variant">
        <div className="mb-sm flex justify-center">
          <DicebearAvatar seed={contactSession._id} size={80} />
        </div>
        <h3 className="text-body-lg font-bold text-primary">{contactSession.name}</h3>
        <p className="text-label-sm text-on-surface-variant mb-4">{contactSession.email}</p>
        {contactSession.email && (
          <EmailReplyDialog conversationId={conversation._id} contactEmail={contactSession.email} />
        )}
      </div>

      {/* Collapsible Sections */}
      <div className="flex-1">
        {/* Device Info */}
        <details className="group border-b border-outline-variant" open>
          <summary className="flex justify-between items-center p-sm cursor-pointer hover:bg-surface-container-low transition-colors list-none">
            <span className="text-label-md font-label-md uppercase tracking-wider text-primary">Device Information</span>
            <span className="material-symbols-outlined transition-transform group-open:rotate-180" data-icon="expand_more">expand_more</span>
          </summary>
          <div className="px-sm pb-sm space-y-3">
            <div className="flex justify-between">
              <span className="text-label-sm text-on-surface-variant">OS/Browser</span>
              <span className="text-label-sm text-primary max-w-[140px] truncate" title={meta.userAgent}>
                {meta.userAgent ? (meta.userAgent.split(" ")[0] || "Unknown") : "Unknown"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-label-sm text-on-surface-variant">Platform</span>
              <span className="text-label-sm text-primary">{meta.platform || "Unknown"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-label-sm text-on-surface-variant">Screen</span>
              <span className="text-label-sm text-primary">{meta.screenResolution || "Unknown"}</span>
            </div>
          </div>
        </details>

        {/* Location & Language */}
        <details className="group border-b border-outline-variant" open>
          <summary className="flex justify-between items-center p-sm cursor-pointer hover:bg-surface-container-low transition-colors list-none">
            <span className="text-label-md font-label-md uppercase tracking-wider text-primary">Location &amp; Language</span>
            <span className="material-symbols-outlined transition-transform group-open:rotate-180" data-icon="expand_more">expand_more</span>
          </summary>
          <div className="px-sm pb-sm space-y-3">
            <div className="flex justify-between">
              <span className="text-label-sm text-on-surface-variant">Language</span>
              <span className="text-label-sm text-primary">{meta.language || "Unknown"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-label-sm text-on-surface-variant">Timezone</span>
              <span className="text-label-sm text-primary truncate max-w-[140px]" title={meta.timezone}>
                {meta.timezone || "Unknown"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-label-sm text-on-surface-variant">Offset</span>
              <span className="text-label-sm text-primary">
                {meta.timezoneOffset != null ? `UTC ${meta.timezoneOffset > 0 ? "-" : "+"}${Math.abs(meta.timezoneOffset / 60)}h` : "Unknown"}
              </span>
            </div>
          </div>
        </details>

        {/* Tags */}
        <details className="group border-b border-outline-variant" open>
          <summary className="flex justify-between items-center p-sm cursor-pointer hover:bg-surface-container-low transition-colors list-none">
            <span className="text-label-md font-label-md uppercase tracking-wider text-primary">Tags</span>
            <span className="material-symbols-outlined transition-transform group-open:rotate-180" data-icon="expand_more">expand_more</span>
          </summary>
          <div className="px-sm pb-sm">
            <TagChips conversationId={conversation._id} />
          </div>
        </details>

        {/* Session Details */}
        <details className="group border-b border-outline-variant" open>
          <summary className="flex justify-between items-center p-sm cursor-pointer hover:bg-surface-container-low transition-colors list-none">
            <span className="text-label-md font-label-md uppercase tracking-wider text-primary">Session Details</span>
            <span className="material-symbols-outlined transition-transform group-open:rotate-180" data-icon="expand_more">expand_more</span>
          </summary>
          <div className="px-sm pb-sm space-y-3">
            <div className="flex justify-between">
              <span className="text-label-sm text-on-surface-variant">Started At</span>
              <span className="text-label-sm text-primary">
                {new Date(conversation._creationTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-label-sm text-on-surface-variant">Expires At</span>
              <span className="text-label-sm text-primary">
                {new Date(contactSession.expiresAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </details>
      </div>
    </section>
  );
}

function EmailReplyDialog({ conversationId, contactEmail }: { conversationId: Id<"conversations">, contactEmail: string }) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("Re: Your Support Request");
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const sendEmailReply = useAction(api.private.conversations.sendEmailReply);

  const handleSend = async () => {
    setIsSending(true);
    try {
      await sendEmailReply({
        conversationId,
        subject,
        textBody: body,
      });
      toast.success("Email sent successfully!");
      setOpen(false);
      setBody("");
    } catch (err: any) {
      toast.error(`Failed to send email: ${err.message}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="w-full border border-outline-variant bg-background py-2 text-label-sm font-label-sm font-bold uppercase tracking-widest hover:border-primary transition-colors flex items-center justify-center gap-2 text-on-surface">
          <span className="material-symbols-outlined text-[16px]" data-icon="mail">mail</span>
          Send Email
        </button>
      </DialogTrigger>
      <DialogContent className="bg-surface-container border-outline-variant text-on-surface sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send Email Reply</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-label-sm text-on-surface-variant">To</label>
            <Input disabled value={contactEmail} className="bg-surface border-outline-variant" />
          </div>
          <div className="space-y-2">
            <label className="text-label-sm text-on-surface-variant">Subject</label>
            <Input 
              value={subject} 
              onChange={(e) => setSubject(e.target.value)} 
              className="bg-surface border-outline-variant" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-label-sm text-on-surface-variant">Message</label>
            <Textarea 
              value={body} 
              onChange={(e) => setBody(e.target.value)} 
              rows={6}
              className="bg-surface border-outline-variant resize-none" 
              placeholder="Type your email reply here..."
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)} disabled={isSending}>Cancel</Button>
          <Button onClick={handleSend} disabled={isSending || !body.trim()}>
            {isSending ? "Sending..." : "Send Email"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export const ConversationIdViewLoading = () => {
  return (
    <div className="flex h-full flex-col bg-muted">
      <header className="flex items-center justify-between border-b bg-background p-2.5">
        <Button disabled size="sm" variant="ghost">
          <MoreHorizontalIcon />
        </Button>
      </header>
      <AIConversation className="max-h-[calc(100vh-180px)]">
        <AIConversationContent>
          {Array.from({ length: 8 }, (_, index) => {
            const isUser = index % 2 === 0;
            const widths = ["w-48", "w-60", "w-72"];
            const width = widths[index % widths.length];

            return (
              <div
                className={cn(
                  "group flex w-full items-end justify-end gap-2 py-2 [&>div]:max-w-[80%]",
                  isUser ? "is-user" : "is-assistant flex-row-reverse"
                )}
                key={index}
              >
                <Skeleton className={`h-9 ${width} rounded-lg bg-neutral-200`} />
                <Skeleton className="size-8 rounded-full bg-neutral-200" />
              </div>
            );
          })}
        </AIConversationContent>
      </AIConversation>

      <div className="p-2">
        <AIInput>
          <AIInputTextarea
            disabled
            placeholder="Type your response as an operator..."
          />
          <AIInputToolbar>
            <AIInputTools />
            <AIInputSubmit disabled status="ready" />
          </AIInputToolbar>
        </AIInput>
      </div>
    </div>
  );
};
