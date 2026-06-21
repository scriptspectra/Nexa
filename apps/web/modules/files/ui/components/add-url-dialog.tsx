"use client";

import { useAction } from "convex/react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Button } from "@workspace/ui/components/button";
import { api } from "@workspace/backend/_generated/api";

interface AddUrlDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUrlAdded?: () => void;
}

export const AddUrlDialog = ({
  open,
  onOpenChange,
  onUrlAdded,
}: AddUrlDialogProps) => {
  const scrapeUrl = useAction(api.private.files.scrapeUrl);

  const [isScraping, setIsScraping] = useState(false);
  const [form, setForm] = useState({
    url: "",
    category: "",
  });

  const handleAddUrl = async () => {
    if (!form.url.trim()) return;

    setIsScraping(true);
    try {
      await scrapeUrl({
        url: form.url.trim(),
        category: form.category.trim() || undefined,
      });

      onUrlAdded?.();
      handleCancel();
    } catch (error) {
      console.error(error);
    } finally {
      setIsScraping(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    setForm({
      url: "",
      category: "",
    });
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add URL</DialogTitle>
          <DialogDescription>
            Scrape a webpage and add its content to your AI knowledge base.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">Webpage URL *</Label>
            <Input
              id="url"
              placeholder="https://example.com/docs"
              value={form.url}
              onChange={(e) => setForm((prev) => ({ ...prev, url: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category (optional)</Label>
            <Input
              id="category"
              placeholder="e.g., Documentation, Help Center"
              value={form.category}
              onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
            />
          </div>
        </div>

        <DialogFooter>
          <Button disabled={isScraping} onClick={handleCancel} variant="outline">
            Cancel
          </Button>
          <Button disabled={!form.url.trim() || isScraping} onClick={handleAddUrl}>
            {isScraping ? "Scraping..." : "Add URL"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
