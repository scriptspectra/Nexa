"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@workspace/backend/_generated/api";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@workspace/ui/components/dialog";
import { Button } from "@workspace/ui/components/button";
import {
  ShoppingBagIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ExternalLinkIcon,
  LoaderIcon,
} from "lucide-react";

interface ShopifyConnectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type Step = "form" | "connecting" | "syncing" | "success";

export const ShopifyConnectDialog = ({
  open,
  onOpenChange,
  onSuccess,
}: ShopifyConnectDialogProps) => {
  const [step, setStep] = useState<Step>("form");
  const [shopDomain, setShopDomain] = useState("");
  const [adminApiKey, setAdminApiKey] = useState("");
  const [shopName, setShopName] = useState("");
  const [error, setError] = useState("");

  const connectShopify = useAction(api.private.shopify.connectShopify);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const domain = shopDomain.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
    if (!domain || !adminApiKey.trim()) {
      setError("Both fields are required.");
      return;
    }

    setStep("connecting");

    try {
      const result = await connectShopify({
        shopDomain: domain,
        adminApiKey: adminApiKey.trim(),
      });

      setShopName(result.shopName);
      setStep("syncing");

      // Brief pause to show the syncing state before transitioning
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setStep("success");
    } catch (err: any) {
      const message = err?.data?.message || err?.message || "Failed to connect Shopify store.";
      setError(message);
      setStep("form");
      toast.error(message);
    }
  };

  const handleClose = () => {
    if (step === "success") {
      onSuccess();
    }
    onOpenChange(false);
    // Reset state after dialog closes
    setTimeout(() => {
      setStep("form");
      setShopDomain("");
      setAdminApiKey("");
      setError("");
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg border border-white/10 bg-zinc-950 text-white rounded-2xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <ShoppingBagIcon className="size-5 text-emerald-400" />
            Connect Shopify Store
          </DialogTitle>
          <DialogDescription className="text-zinc-400 text-sm">
            Your product catalog will be synced to the AI knowledge base in real-time.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2">
          {/* Step: Form */}
          {step === "form" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Shop Domain
                  </label>
                  <input
                    type="text"
                    placeholder="your-store.myshopify.com"
                    value={shopDomain}
                    onChange={(e) => setShopDomain(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
                    autoComplete="off"
                    spellCheck={false}
                  />
                  <p className="text-xs text-zinc-600 mt-1">
                    e.g. <span className="text-zinc-400 font-mono">my-shop.myshopify.com</span>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Admin API Access Token
                  </label>
                  <input
                    type="password"
                    placeholder="shpat_xxxxxxxxxxxxxxxxxxxx"
                    value={adminApiKey}
                    onChange={(e) => setAdminApiKey(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-colors font-mono"
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-2">
                <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
                  How to get your Admin API token
                </h5>
                <ol className="text-zinc-500 text-xs leading-relaxed space-y-1 list-decimal list-inside">
                  <li>Go to your Shopify Admin → <strong className="text-zinc-400">Apps</strong></li>
                  <li>Click <strong className="text-zinc-400">App and sales channel settings</strong></li>
                  <li>Click <strong className="text-zinc-400">Develop apps</strong> → Create an app</li>
                  <li>Under <strong className="text-zinc-400">Admin API scopes</strong>, enable <code className="text-emerald-500/80 font-mono">read_products</code> and <code className="text-emerald-500/80 font-mono">read_inventory</code></li>
                  <li>Install the app and copy the <strong className="text-zinc-400">Admin API access token</strong></li>
                </ol>
                <a
                  href="https://help.shopify.com/en/manual/apps/app-types/custom-apps"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[10px] text-emerald-500 hover:text-emerald-400 mt-1 font-bold tracking-wider uppercase"
                >
                  Shopify docs <ExternalLinkIcon className="size-3" />
                </a>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all"
              >
                Connect & Sync Products
                <ArrowRightIcon className="size-4 ml-2" />
              </Button>
            </form>
          )}

          {/* Step: Connecting */}
          {step === "connecting" && (
            <div className="flex flex-col items-center justify-center py-10 gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <LoaderIcon className="size-5 text-emerald-400 animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-white font-semibold">Verifying credentials...</p>
                <p className="text-zinc-500 text-sm mt-1">Connecting to your Shopify store</p>
              </div>
            </div>
          )}

          {/* Step: Syncing */}
          {step === "syncing" && (
            <div className="flex flex-col items-center justify-center py-10 gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <LoaderIcon className="size-5 text-emerald-400 animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-white font-semibold">Connected to {shopName}!</p>
                <p className="text-zinc-500 text-sm mt-1">Starting product sync in the background...</p>
              </div>
            </div>
          )}

          {/* Step: Success */}
          {step === "success" && (
            <div className="flex flex-col items-center justify-center py-10 gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <CheckCircleIcon className="size-6 text-emerald-400" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-white font-semibold text-lg">Shopify Connected!</p>
                <p className="text-zinc-400 text-sm">
                  <strong className="text-zinc-200">{shopName}</strong> is now syncing products.
                </p>
                <p className="text-zinc-600 text-xs mt-2">
                  Products will appear in your knowledge base shortly. Real-time updates are active.
                </p>
              </div>
              <Button
                onClick={handleClose}
                className="mt-2 bg-white text-black hover:bg-zinc-100 font-bold rounded-xl px-6 h-10"
              >
                Done
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
