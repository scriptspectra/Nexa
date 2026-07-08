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
import {
  GlobeIcon,
  MapIcon,
  NetworkIcon,
  RefreshCwIcon,
  ClockIcon,
  ChevronDownIcon,
} from "lucide-react";

interface CrawlDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJobCreated?: () => void;
}

type CrawlMode = "single" | "sitemap" | "recursive";

const RECRAWL_OPTIONS = [
  { label: "No auto re-crawl", value: undefined },
  { label: "Every 6 hours", value: 6 },
  { label: "Every 12 hours", value: 12 },
  { label: "Every 24 hours", value: 24 },
  { label: "Every 7 days", value: 168 },
  { label: "Every 30 days", value: 720 },
];

const MODES: { id: CrawlMode; label: string; description: string; icon: React.ReactNode }[] = [
  {
    id: "single",
    label: "Single Page",
    description: "Scrape one URL and add it to the knowledge base",
    icon: <GlobeIcon className="size-4" />,
  },
  {
    id: "sitemap",
    label: "Sitemap",
    description: "Parse sitemap.xml and crawl all discovered pages",
    icon: <MapIcon className="size-4" />,
  },
  {
    id: "recursive",
    label: "Recursive Crawl",
    description: "Start from a root URL and follow internal links",
    icon: <NetworkIcon className="size-4" />,
  },
];

export const CrawlDialog = ({ open, onOpenChange, onJobCreated }: CrawlDialogProps) => {
  const createCrawlJob = useAction(api.private.crawl.createCrawlJob);

  const [isCrawling, setIsCrawling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    rootUrl: "",
    mode: "sitemap" as CrawlMode,
    maxDepth: 3,
    maxPages: 50,
    recrawlIntervalHours: undefined as number | undefined,
    showRecrawlDropdown: false,
  });

  const selectedRecrawl = RECRAWL_OPTIONS.find((o) => o.value === form.recrawlIntervalHours);

  const handleSubmit = async () => {
    if (!form.rootUrl.trim()) return;
    setIsCrawling(true);
    setError(null);
    try {
      await createCrawlJob({
        rootUrl: form.rootUrl.trim(),
        mode: form.mode,
        maxDepth: form.mode === "recursive" ? form.maxDepth : undefined,
        maxPages: form.mode !== "single" ? form.maxPages : undefined,
        recrawlIntervalHours: form.recrawlIntervalHours,
      });
      onJobCreated?.();
      handleClose();
    } catch (err: any) {
      setError(err?.message ?? "Failed to start crawl. Please try again.");
    } finally {
      setIsCrawling(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setForm({
      rootUrl: "",
      mode: "sitemap",
      maxDepth: 3,
      maxPages: 50,
      recrawlIntervalHours: undefined,
      showRecrawlDropdown: false,
    });
    setError(null);
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-2xl bg-zinc-950 border border-white/10 text-white rounded-2xl p-0 overflow-hidden">
        {/* Header gradient strip */}
        <div className="bg-gradient-to-r from-violet-600/20 via-indigo-600/10 to-transparent px-6 pt-6 pb-5 border-b border-white/5">
          <DialogHeader>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="p-1.5 rounded-lg bg-violet-500/20 border border-violet-500/30">
                <NetworkIcon className="size-4 text-violet-400" />
              </div>
              <DialogTitle className="text-lg font-bold text-white">New Web Crawl</DialogTitle>
            </div>
            <DialogDescription className="text-zinc-400 text-sm leading-relaxed">
              Automatically crawl websites and add their content to your AI knowledge base.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Root URL */}
          <div className="space-y-2">
            <Label className="text-zinc-300 font-semibold text-sm" htmlFor="crawl-url">
              Root URL <span className="text-rose-400">*</span>
            </Label>
            <Input
              id="crawl-url"
              placeholder="https://example.com/sitemap.xml"
              value={form.rootUrl}
              onChange={(e) => setForm((p) => ({ ...p, rootUrl: e.target.value }))}
              className="bg-zinc-900 border-white/10 text-white placeholder-zinc-600 focus:border-violet-500/50 rounded-xl h-10"
            />
            <p className="text-[11px] text-zinc-500">
              For sitemap mode, paste the sitemap.xml URL. For recursive mode, paste the root page URL.
            </p>
          </div>

          {/* Crawl Mode */}
          <div className="space-y-2.5">
            <Label className="text-zinc-300 font-semibold text-sm">Crawl Mode</Label>
            <div className="grid grid-cols-3 gap-2.5">
              {MODES.map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, mode: mode.id }))}
                  className={`flex flex-col items-start gap-2 p-3.5 rounded-xl border text-left transition-all duration-200 ${
                    form.mode === mode.id
                      ? "border-violet-500/60 bg-violet-500/10 shadow-[0_0_12px_rgba(139,92,246,0.15)]"
                      : "border-white/5 bg-zinc-900/40 hover:border-white/10 hover:bg-zinc-900/60"
                  }`}
                >
                  <div
                    className={`p-1.5 rounded-lg border ${
                      form.mode === mode.id
                        ? "bg-violet-500/20 border-violet-500/30 text-violet-400"
                        : "bg-zinc-800 border-white/5 text-zinc-400"
                    }`}
                  >
                    {mode.icon}
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${form.mode === mode.id ? "text-violet-300" : "text-zinc-200"}`}>
                      {mode.label}
                    </p>
                    <p className="text-[10px] text-zinc-500 mt-0.5 leading-relaxed">{mode.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Recursive-only options */}
          {form.mode !== "single" && (
            <div className={`grid gap-4 ${form.mode === "recursive" ? "grid-cols-2" : "grid-cols-1"}`}>
              {form.mode === "recursive" && (
                <div className="space-y-2">
                  <Label className="text-zinc-300 font-semibold text-sm" htmlFor="max-depth">
                    Max Depth
                    <span className="ml-2 text-xs text-zinc-500 font-normal">(1–10)</span>
                  </Label>
                  <Input
                    id="max-depth"
                    type="number"
                    min={1}
                    max={10}
                    value={form.maxDepth}
                    onChange={(e) => setForm((p) => ({ ...p, maxDepth: Math.max(1, Math.min(10, Number(e.target.value))) }))}
                    className="bg-zinc-900 border-white/10 text-white focus:border-violet-500/50 rounded-xl h-10"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-zinc-300 font-semibold text-sm" htmlFor="max-pages">
                  Max Pages
                  <span className="ml-2 text-xs text-zinc-500 font-normal">(up to 500)</span>
                </Label>
                <Input
                  id="max-pages"
                  type="number"
                  min={1}
                  max={500}
                  value={form.maxPages}
                  onChange={(e) => setForm((p) => ({ ...p, maxPages: Math.max(1, Math.min(500, Number(e.target.value))) }))}
                  className="bg-zinc-900 border-white/10 text-white focus:border-violet-500/50 rounded-xl h-10"
                />
              </div>
            </div>
          )}

          {/* Auto re-crawl schedule */}
          <div className="space-y-2">
            <Label className="text-zinc-300 font-semibold text-sm flex items-center gap-1.5">
              <RefreshCwIcon className="size-3.5 text-zinc-400" />
              Auto Re-crawl Schedule
            </Label>
            <div className="relative">
              <button
                type="button"
                id="recrawl-schedule"
                onClick={() => setForm((p) => ({ ...p, showRecrawlDropdown: !p.showRecrawlDropdown }))}
                className="w-full flex items-center justify-between bg-zinc-900 border border-white/10 hover:border-white/20 text-white rounded-xl h-10 px-3 text-sm transition-all"
              >
                <span className="flex items-center gap-2 text-sm">
                  <ClockIcon className="size-4 text-zinc-400" />
                  {selectedRecrawl?.label ?? "No auto re-crawl"}
                </span>
                <ChevronDownIcon
                  className={`size-4 text-zinc-400 transition-transform ${form.showRecrawlDropdown ? "rotate-180" : ""}`}
                />
              </button>
              {form.showRecrawlDropdown && (
                <div className="absolute top-full mt-1.5 left-0 right-0 bg-zinc-900 border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50">
                  {RECRAWL_OPTIONS.map((opt) => (
                    <button
                      type="button"
                      key={opt.label}
                      onClick={() => {
                        setForm((p) => ({
                          ...p,
                          recrawlIntervalHours: opt.value,
                          showRecrawlDropdown: false,
                        }));
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-white/5 ${
                        form.recrawlIntervalHours === opt.value ? "text-violet-400 font-semibold" : "text-zinc-300"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {form.recrawlIntervalHours && (
              <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                <span className="size-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                Pages will be automatically refreshed every {selectedRecrawl?.label?.toLowerCase().replace("every ", "")}
              </p>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 px-4 py-3 text-sm text-rose-400">
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="px-6 pb-6 flex gap-2 justify-end">
          <Button
            disabled={isCrawling}
            onClick={handleClose}
            variant="outline"
            className="border-white/10 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-xl"
          >
            Cancel
          </Button>
          <Button
            disabled={!form.rootUrl.trim() || isCrawling}
            onClick={handleSubmit}
            className="bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl px-5 transition-all duration-200 shadow-lg shadow-violet-500/20"
          >
            {isCrawling ? (
              <>
                <RefreshCwIcon className="size-4 mr-2 animate-spin" />
                Crawling...
              </>
            ) : (
              <>
                <NetworkIcon className="size-4 mr-2" />
                Start Crawl
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
