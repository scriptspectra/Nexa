"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@workspace/backend/_generated/api";
import { Id } from "@workspace/backend/_generated/dataModel";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@workspace/ui/components/dialog";
import { Textarea } from "@workspace/ui/components/textarea";
import { Input } from "@workspace/ui/components/input";
import { Button } from "@workspace/ui/components/button";

export function EmailReplyDialog({ conversationId, contactEmail }: { conversationId: Id<"conversations">, contactEmail: string }) {
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
      <DialogContent className="bg-surface-container border-outline-variant text-on-surface max-w-xl">
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
