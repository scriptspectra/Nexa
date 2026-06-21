"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@workspace/backend/_generated/api";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@workspace/ui/components/dialog";
import { toast } from "sonner";
import { Id } from "@workspace/backend/_generated/dataModel";
import { Checkbox } from "@workspace/ui/components/checkbox";

const AVAILABLE_EVENTS = [
  { id: "conversation.created", label: "Conversation Created", description: "Triggered when a new conversation starts." },
  { id: "conversation.updated", label: "Conversation Updated", description: "Triggered when conversation status or assignment changes." },
  { id: "message.created", label: "Message Created", description: "Triggered when a new message is sent." },
];

export const WebhooksView = () => {
  const webhooks = useQuery(api.private.webhooks.list);
  const createWebhook = useMutation(api.private.webhooks.create);
  const removeWebhook = useMutation(api.private.webhooks.remove);

  const [isCreating, setIsCreating] = useState(false);
  const [url, setUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>(["conversation.created"]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [generatedSecret, setGeneratedSecret] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      toast.error("URL must start with http:// or https://");
      return;
    }
    if (selectedEvents.length === 0) {
      toast.error("Please select at least one event topic");
      return;
    }

    setIsCreating(true);
    try {
      const result = await createWebhook({
        url,
        events: selectedEvents,
      });
      setGeneratedSecret(result.secret);
      toast.success("Webhook endpoint registered!");
    } catch (error: any) {
      toast.error(`Failed to register webhook: ${error.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCloseDialog = () => {
    setShowCreateDialog(false);
    setUrl("");
    setSelectedEvents(["conversation.created"]);
    setGeneratedSecret(null);
  };

  const handleToggleEvent = (eventId: string) => {
    setSelectedEvents((prev) =>
      prev.includes(eventId) ? prev.filter((id) => id !== eventId) : [...prev, eventId]
    );
  };

  const handleRemove = async (id: Id<"webhookEndpoints">) => {
    if (!confirm("Are you sure you want to delete this webhook endpoint?")) return;
    try {
      await removeWebhook({ id });
      toast.success("Webhook endpoint removed");
    } catch (error: any) {
      toast.error(`Failed to delete webhook: ${error.message}`);
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-primary">Webhooks</h2>
          <p className="text-sm text-on-surface-variant">Configure HTTP endpoints to receive real-time updates from Zephyra.</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={(open) => {
          if (!open) handleCloseDialog();
          else setShowCreateDialog(true);
        }}>
          <DialogTrigger asChild>
            <Button>Add Endpoint</Button>
          </DialogTrigger>
          <DialogContent className="bg-surface-container border-outline-variant text-on-surface w-full min-w-[480px] max-w-xl">
            <DialogHeader>
              <DialogTitle>Register Webhook Endpoint</DialogTitle>
            </DialogHeader>
            {!generatedSecret ? (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-on-surface">Endpoint URL</label>
                  <Input 
                    value={url} 
                    onChange={(e) => setUrl(e.target.value)} 
                    placeholder="https://yourdomain.com/webhooks/zephyra"
                    className="bg-surface border-outline-variant" 
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-sm font-medium text-on-surface">Event Subscriptions</label>
                  <div className="space-y-3">
                    {AVAILABLE_EVENTS.map((event) => (
                      <div key={event.id} className="flex items-start space-x-3">
                        <Checkbox
                          id={`event-${event.id}`}
                          checked={selectedEvents.includes(event.id)}
                          onCheckedChange={() => handleToggleEvent(event.id)}
                          className="border-outline-variant mt-0.5"
                        />
                        <div className="grid gap-0.5 leading-none">
                          <label htmlFor={`event-${event.id}`} className="text-sm font-medium text-on-surface cursor-pointer">
                            {event.label}
                          </label>
                          <p className="text-xs text-on-surface-variant">{event.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="ghost" onClick={handleCloseDialog}>Cancel</Button>
                  <Button onClick={handleCreate} disabled={isCreating || !url.trim()}>
                    {isCreating ? "Adding..." : "Add Endpoint"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                <div className="bg-primary/10 border border-primary text-primary p-4 rounded text-sm">
                  <p className="font-bold mb-2">Endpoint registered successfully!</p>
                  <p>Here is your signing secret to verify webhook payloads. Save it now, as you won't be able to see it again.</p>
                </div>
                <div className="relative">
                  <Input 
                    value={generatedSecret} 
                    readOnly 
                    className="bg-surface border-outline-variant font-mono text-sm pr-20" 
                  />
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="absolute right-1 top-1 h-8"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedSecret);
                      toast.success("Copied to clipboard!");
                    }}
                  >
                    Copy
                  </Button>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleCloseDialog}>Done</Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="border border-outline-variant rounded bg-surface-container-low overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-sm min-w-[600px]">
          <thead className="bg-surface-container-highest text-on-surface-variant">
            <tr>
              <th className="p-4 font-semibold uppercase text-xs tracking-wider">URL</th>
              <th className="p-4 font-semibold uppercase text-xs tracking-wider">Subscribed Events</th>
              <th className="p-4 font-semibold uppercase text-xs tracking-wider">Status</th>
              <th className="p-4 font-semibold uppercase text-xs tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {webhooks === undefined ? (
              <tr>
                <td colSpan={4} className="p-4 text-center text-on-surface-variant">Loading...</td>
              </tr>
            ) : webhooks.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-8 text-center text-on-surface-variant">
                  No webhook endpoints registered yet.
                </td>
              </tr>
            ) : (
              webhooks.map((wh) => (
                <tr key={wh._id} className="hover:bg-surface-container-highest/50 transition-colors">
                  <td className="p-4 font-medium text-on-surface truncate max-w-xs">{wh.url}</td>
                  <td className="p-4 text-on-surface-variant">
                    <div className="flex flex-wrap gap-1">
                      {wh.events.map((ev) => (
                        <span key={ev} className="text-[10px] bg-surface-container-highest border border-outline-variant text-on-surface px-1.5 py-0.5 rounded font-mono">
                          {ev}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      wh.enabled ? "bg-green-500/10 text-green-400" : "bg-error/10 text-error"
                    }`}>
                      {wh.enabled ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-error hover:text-error hover:bg-error/10"
                      onClick={() => handleRemove(wh._id)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
