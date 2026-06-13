"use client";

import { useOrganization } from "@clerk/nextjs";
import { Button } from "@workspace/ui/components/button";
import { CopyIcon, HelpCircleIcon, ExternalLinkIcon, CheckIcon, TerminalIcon } from "lucide-react";
import { toast } from "sonner";
import { IntegrationId, INTEGRATIONS } from "../../constants";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { useState } from "react";
import { createScript, getConvexDeploymentUrl, getDynamicWidgetUrl, isProductionHost } from "../../utils";

export const IntegrationsView = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSnippet, setSelectedSnippet] = useState("");
  const { organization } = useOrganization();
  const [copiedId, setCopiedId] = useState(false);
  const widgetUrl = getDynamicWidgetUrl();
  const convexUrl = getConvexDeploymentUrl();
  const onProductionHost = isProductionHost();

  const handleIntegrationClick = (integrationId: IntegrationId) => {
    if (!organization) {
      toast.error("Organization ID not found. Please select or create an organization first.");
      return;
    }

    const snippet = createScript(integrationId, organization.id);
    setSelectedSnippet(snippet);
    setDialogOpen(true);
  };

  const handleCopy = async () => {
    if (!organization?.id) return;
    try {
      await navigator.clipboard.writeText(organization.id);
      setCopiedId(true);
      toast.success("Organization ID copied to clipboard");
      setTimeout(() => setCopiedId(false), 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  return (
    <>
      <IntegrationsDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        snippet={selectedSnippet}
      />

      <div className="flex min-h-screen flex-col bg-black p-6 md:p-12 overflow-y-auto">
        <div className="mx-auto w-full max-w-4xl space-y-12">

          {/* Header */}
          <header className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-primary/10 text-primary border border-primary/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Active Environments
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
              Setup & Integrations
            </h1>
            <p className="text-base md:text-lg text-zinc-400 max-w-2xl leading-relaxed">
              Connect your applications and website to the Zephyra AI chatbox widget. Copy your credentials below or select a platform to get started.
            </p>
          </header>

          {onProductionHost && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-300">
                Production setup checklist
              </h3>
              <p className="text-sm text-zinc-300 leading-relaxed">
                Copy the embed snippet from this page while you are on your live domain.
                Do not reuse a snippet copied from localhost — it points chats to the wrong backend.
              </p>
              <div className="grid gap-2 text-xs font-mono text-zinc-300">
                <p>
                  <span className="text-zinc-500">Widget URL:</span> {widgetUrl}
                </p>
                <p>
                  <span className="text-zinc-500">Convex URL:</span>{" "}
                  {convexUrl || "Missing NEXT_PUBLIC_CONVEX_URL in Vercel"}
                </p>
                <p>
                  <span className="text-zinc-500">Organization ID:</span>{" "}
                  {organization?.id ?? "No organization selected"}
                </p>
              </div>
            </div>
          )}

          {/* Organization ID Section */}
          <div className="relative overflow-hidden bg-zinc-950/40 border border-white/5 shadow-2xl rounded-2xl p-8 backdrop-blur-xl">
            {/* Soft background glow */}
            <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white tracking-tight">Organization Identifier</h3>
                <p className="text-sm text-zinc-400 max-w-md">Use this unique identifier to configure client requests and authenticate widgets.</p>
              </div>
              <div className="flex items-center gap-2 bg-zinc-900/60 p-2.5 rounded-xl border border-white/5 flex-1 md:max-w-md backdrop-blur-md">
                <code className="text-sm text-zinc-300 overflow-hidden text-ellipsis whitespace-nowrap px-3 flex-1 font-mono tracking-tight">
                  {organization?.id ?? "No organization selected"}
                </code>
                <Button
                  onClick={handleCopy}
                  className="gap-2 bg-white/5 text-zinc-200 hover:bg-white/10 transition-all font-semibold uppercase tracking-wider text-[10px] px-3.5 h-8 rounded-lg border border-white/5"
                  variant="ghost"
                  disabled={!organization?.id}
                >
                  {copiedId ? (
                    <CheckIcon className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <CopyIcon className="w-3.5 h-3.5" />
                  )}
                  {copiedId ? "COPIED" : "COPY"}
                </Button>
              </div>
            </div>
          </div>

          {/* Integrations Grid */}
          <div className="space-y-8">
            <div className="flex items-end justify-between border-b border-white/5 pb-4">
              <div>
                <h3 className="text-2xl font-bold text-white tracking-tight">Platforms & Frameworks</h3>
                <p className="text-sm text-zinc-400 mt-1">Select your stack to get the tailored installation snippet.</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-zinc-900 border border-white/5 text-zinc-400">
                {INTEGRATIONS.length} SDKs Available
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {INTEGRATIONS.map((integration) => (
                <div
                  key={integration.id}
                  onClick={() => handleIntegrationClick(integration.id)}
                  className="relative group bg-zinc-950/40 border border-white/5 rounded-2xl p-8 flex flex-col items-center text-center cursor-pointer transition-all duration-300 hover:border-amber-500/30 hover:bg-zinc-950/80 hover:shadow-[0_0_30px_rgba(245,158,11,0.03)]"
                >
                  {/* Subtle top border hover highlight */}
                  <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-500/0 to-transparent group-hover:via-amber-500/40 transition-all duration-500" />

                  <div className="w-16 h-16 mb-6 flex items-center justify-center bg-white/[0.02] rounded-xl border border-white/5 group-hover:scale-105 group-hover:bg-amber-500/5 group-hover:border-amber-500/20 transition-all duration-300">
                    <Image
                      alt={integration.title}
                      height={36}
                      src={integration.icon}
                      width={36}
                      className="opacity-75 group-hover:opacity-100 transition-opacity duration-300"
                    />
                  </div>
                  <h4 className="text-lg font-bold text-zinc-200 mb-1 group-hover:text-white transition-colors">
                    {integration.title}
                  </h4>
                  <p className="text-xs text-zinc-500">Get widget script</p>
                  
                  {/* Hover indicator link */}
                  <div className="mt-4 flex items-center gap-1 text-[10px] font-bold tracking-widest text-amber-500/0 group-hover:text-amber-500 transition-all duration-300">
                    INTEGRATE <span className="translate-x-[-4px] group-hover:translate-x-0 transition-transform">→</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Need Help Card */}
          <div className="bg-zinc-950/20 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between border border-dashed border-zinc-800 gap-6 hover:bg-zinc-950/40 transition-all duration-300">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0 text-amber-400">
                <HelpCircleIcon className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-zinc-200">Need help getting started?</h4>
                <p className="text-sm text-zinc-400">Explore our comprehensive guides, API docs, and developer tutorials.</p>
              </div>
            </div>
            <a 
              href="#" 
              className="text-amber-400 hover:text-amber-300 text-xs font-bold tracking-widest uppercase transition-colors flex items-center gap-1.5 whitespace-nowrap border border-amber-500/20 px-4 py-2.5 rounded-xl bg-amber-500/5"
            >
              DOCUMENTATION
              <ExternalLinkIcon className="w-3.5 h-3.5" />
            </a>
          </div>

        </div>
      </div>
    </>
  );
};

export const IntegrationsDialog = ({
  open,
  onOpenChange,
  snippet,
}: {
  open: boolean;
  onOpenChange: (value: boolean) => void;
  snippet: string;
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      toast.success("Snippet copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy code");
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-w-xl border border-white/10 bg-zinc-950 text-white rounded-2xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <TerminalIcon className="size-5 text-amber-400" />
            Integrate with your website
          </DialogTitle>
          <DialogDescription className="text-zinc-400 text-sm">
            Add the chatbox script to your project's HTML head or root container.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">HTML Snippet</span>
              <Button
                className="size-8 rounded-lg border border-white/10 bg-zinc-900/50 hover:bg-zinc-900 text-zinc-300 transition-all"
                onClick={handleCopy}
                size="icon"
                variant="ghost"
              >
                {copied ? (
                  <CheckIcon className="size-4 text-emerald-400" />
                ) : (
                  <CopyIcon className="size-4" />
                )}
              </Button>
            </div>
            
            <div className="relative rounded-xl overflow-hidden border border-white/5 bg-black/60 p-4">
              <pre className="max-h-[250px] overflow-auto whitespace-pre-wrap break-all font-mono text-zinc-300 text-xs leading-relaxed select-all">
                {snippet}
              </pre>
            </div>
          </div>

          <div className="rounded-xl border border-white/5 bg-white/[0.01] p-4 space-y-2.5">
            <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-300">Quick Guide</h5>
            <p className="text-zinc-400 text-xs leading-relaxed">
              1. Copy the HTML snippet from your live dashboard domain, not localhost. <br />
              2. Paste it just before the closing <code className="font-mono text-amber-500/80">&lt;/head&gt;</code> tag on your website or dashboard layout file. <br />
              3. Make sure your widget deployment uses the same <code className="font-mono text-amber-500/80">NEXT_PUBLIC_CONVEX_URL</code> as the dashboard.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

