"use client";

import { useState } from "react";
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
  ExternalLinkIcon,
} from "lucide-react";

interface ShopifyConnectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ShopifyConnectDialog = ({
  open,
  onOpenChange,
}: ShopifyConnectDialogProps) => {
  const [shopDomain, setShopDomain] = useState("");
  const [error, setError] = useState("");

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const domain = shopDomain.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
    if (!domain) {
      setError("Enter your Shopify store domain to continue.");
      return;
    }

    const installUrl = `/api/shopify/install?shop=${encodeURIComponent(domain)}`;
    window.location.href = installUrl;
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setShopDomain("");
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
            You&apos;ll be redirected to Shopify to approve access. No manual API tokens required.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleConnect} className="mt-2 space-y-4">
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

          {error && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 space-y-2">
            <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-300">
              What happens next
            </h5>
            <ol className="text-zinc-500 text-xs leading-relaxed space-y-1 list-decimal list-inside">
              <li>We redirect you to Shopify&apos;s secure OAuth consent screen</li>
              <li>Shopify returns an access token to our backend</li>
              <li>We validate the connection, register webhooks, and sync products</li>
            </ol>
            <a
              href="https://shopify.dev/docs/apps/build/authentication-authorization/access-token-types/offline-access-tokens"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] text-emerald-500 hover:text-emerald-400 mt-1 font-bold tracking-wider uppercase"
            >
              Shopify OAuth docs <ExternalLinkIcon className="size-3" />
            </a>
          </div>

          <Button
            type="submit"
            className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all"
          >
            Connect Shopify
            <ArrowRightIcon className="size-4 ml-2" />
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
