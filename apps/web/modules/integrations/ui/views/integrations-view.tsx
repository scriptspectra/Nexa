"use client";

import { useOrganization } from "@clerk/nextjs";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Separator } from "@workspace/ui/components/separator";
import { CopyIcon, HelpCircleIcon, ExternalLinkIcon } from "lucide-react";
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
import { createScript } from "../../utils";

export const IntegrationsView = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSnippet, setSelectedSnippet] = useState("");
  const { organization } = useOrganization();

  const handleIntegrationClick = (integrationId: IntegrationId) => {
    if (!organization) {
      toast.error("Organization ID not found");
      return;
    }

    const snippet = createScript(integrationId, organization.id);
    setSelectedSnippet(snippet);
    setDialogOpen(true);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(organization?.id ?? "");
      toast.success("Copied to clipboard");
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
      
      <div className="flex min-h-screen flex-col p-6 md:p-12">
        <div className="mx-auto w-full max-w-4xl space-y-12">
          
          {/* Header */}
          <header className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-foreground">Setup & Integrations</h1>
            <p className="text-lg text-muted-foreground">
              Configure your development environment and choose the integration that's right for your tech stack.
            </p>
          </header>

          {/* Organization ID Section */}
          <div className="bg-background/70 backdrop-blur-xl border border-border shadow-sm rounded-xl p-8 dark:shadow-[0_0_20px_rgba(245,158,11,0.05)] transition-all">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <h3 className="text-2xl font-semibold text-foreground">Organization ID</h3>
                <p className="text-base text-muted-foreground">Use this unique identifier to authenticate your client requests.</p>
              </div>
              <div className="flex items-center gap-2 bg-muted/50 p-2 rounded-lg border border-border flex-1 md:max-w-md">
                <code className="text-base text-primary/80 overflow-hidden text-ellipsis whitespace-nowrap px-3 flex-1 font-mono">
                  {organization?.id ?? "No organization selected"}
                </code>
                <Button 
                  onClick={handleCopy} 
                  className="gap-2 bg-primary/10 text-primary hover:bg-primary/20 transition-all font-semibold uppercase tracking-widest text-xs" 
                  variant="ghost"
                >
                  <CopyIcon className="w-4 h-4" />
                  COPY
                </Button>
              </div>
            </div>
          </div>

          {/* Integrations Grid */}
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-semibold text-foreground">Integrations</h3>
              <span className="text-muted-foreground text-base">{INTEGRATIONS.length} Available</span>
            </div>
            <p className="text-base text-muted-foreground">
              Add the following code segments to your website or application to enable the Nexa AI chatbox instantly.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {INTEGRATIONS.map((integration) => (
                <div 
                  key={integration.id}
                  onClick={() => handleIntegrationClick(integration.id)}
                  className="bg-background/70 backdrop-blur-xl border border-border rounded-xl p-8 flex flex-col items-center text-center group cursor-pointer hover:border-primary/30 transition-all dark:hover:bg-accent/50"
                >
                  <div className="w-16 h-16 mb-6 flex items-center justify-center bg-accent/50 rounded-lg border border-border group-hover:scale-110 transition-transform duration-300">
                    <Image
                      alt={integration.title}
                      height={32}
                      src={integration.icon}
                      width={32}
                      className="opacity-80"
                    />
                  </div>
                  <h4 className="text-xl font-semibold text-foreground mb-1">{integration.title}</h4>
                  <p className="text-sm text-muted-foreground">Integration Setup</p>
                </div>
              ))}
            </div>
          </div>

          {/* Need Help Card */}
          <div className="bg-background/70 backdrop-blur-xl rounded-xl p-8 flex flex-col md:flex-row items-center justify-between border-dashed border-border gap-6">
            <div className="flex items-center gap-6">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <HelpCircleIcon className="text-primary w-6 h-6" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-foreground">Need help getting started?</h4>
                <p className="text-base text-muted-foreground">Explore our comprehensive guides and developer tutorials.</p>
              </div>
            </div>
            <a href="#" className="text-primary text-xs font-semibold tracking-widest uppercase hover:underline transition-all flex items-center gap-2 whitespace-nowrap">
              DOCUMENTATION
              <ExternalLinkIcon className="w-4 h-4" />
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
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Integrate with your website</DialogTitle>
          <DialogDescription>
            Follow these steps to add the chatbox to your website
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <div className="rounded-md bg-accent p-2 text-sm">
              1. Copy the following code
            </div>
            <div className="group relative">
              <pre className="max-h-[300px] overflow-x-auto overflow-y-auto whitespace-pre-wrap break-all rounded-md bg-foreground p-2 font-mono text-secondary text-sm">
                {snippet}
              </pre>
              <Button
                className="absolute top-4 right-6 size-6 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={handleCopy}
                size="icon"
                variant="secondary"
              >
                <CopyIcon className="size-3" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="rounded-md bg-accent p-2 text-sm">
              2. Add the code in your page
            </div>
            <p className="text-muted-foreground text-sm">
              Paste the chatbox code above in your page. You can add it in the HTML head section.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
