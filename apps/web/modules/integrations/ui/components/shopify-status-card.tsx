"use client";

import { useAction, useQuery } from "convex/react";
import { api } from "@workspace/backend/_generated/api";
import { toast } from "sonner";
import { useState } from "react";
import { Button } from "@workspace/ui/components/button";
import {
  CheckCircleIcon,
  RefreshCwIcon,
  Trash2Icon,
  PackageIcon,
  ClockIcon,
  AlertCircleIcon,
  LoaderIcon,
  ZapIcon,
} from "lucide-react";

interface ShopifyStatusCardProps {
  onDisconnected: () => void;
}

export const ShopifyStatusCard = ({ onDisconnected }: ShopifyStatusCardProps) => {
  const status = useQuery(api.private.shopify.getShopifyStatus);
  const triggerResync = useAction(api.private.shopify.triggerResync);
  const disconnectShopify = useAction(api.private.shopify.disconnectShopify);

  const [isSyncing, setIsSyncing] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  const handleResync = async () => {
    setIsSyncing(true);
    try {
      await triggerResync({});
      toast.success("Re-sync started! Products will update shortly.");
    } catch {
      toast.error("Failed to start re-sync. Please try again.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirmDisconnect) {
      setConfirmDisconnect(true);
      return;
    }

    setIsDisconnecting(true);
    try {
      await disconnectShopify({});
      toast.success("Shopify disconnected. All synced products removed from knowledge base.");
      onDisconnected();
    } catch {
      toast.error("Failed to disconnect Shopify. Please try again.");
    } finally {
      setIsDisconnecting(false);
      setConfirmDisconnect(false);
    }
  };

  if (!status?.connected || !status.syncLog) {
    return null;
  }

  const syncLog = status.syncLog;
  const isSyncRunning = syncLog.status === "running" || isSyncing;
  const hasError = syncLog.status === "error";

  const lastSyncedText = syncLog.lastSyncedAt
    ? new Date(syncLog.lastSyncedAt).toLocaleString()
    : "Never";

  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
            <CheckCircleIcon className="size-4 text-emerald-400" />
          </div>
          <div>
            <h4 className="text-white font-bold text-sm">Shopify Connected</h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-400 text-xs">Real-time sync active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sync Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-black/30 border border-white/5 p-3 space-y-1">
          <div className="flex items-center gap-1.5 text-zinc-500">
            <PackageIcon className="size-3" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Products Synced</span>
          </div>
          <p className="text-xl font-bold text-white">
            {isSyncRunning ? (
              <span className="flex items-center gap-1.5 text-base">
                <LoaderIcon className="size-3.5 animate-spin text-emerald-400" />
                <span className="text-emerald-400">Syncing...</span>
              </span>
            ) : hasError ? (
              <span className="text-red-400 text-sm">Error</span>
            ) : (
              syncLog.syncedProducts ?? "—"
            )}
          </p>
          {syncLog.totalProducts && !isSyncRunning && (
            <p className="text-zinc-600 text-xs">of {syncLog.totalProducts} total</p>
          )}
          {isSyncRunning && syncLog.totalProducts && (
            <p className="text-zinc-600 text-xs">
              {syncLog.syncedProducts ?? 0} / {syncLog.totalProducts}
            </p>
          )}
        </div>

        <div className="rounded-xl bg-black/30 border border-white/5 p-3 space-y-1">
          <div className="flex items-center gap-1.5 text-zinc-500">
            <ClockIcon className="size-3" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Last Synced</span>
          </div>
          <p className="text-xs font-semibold text-zinc-300 mt-1 leading-relaxed">
            {isSyncRunning ? (
              <span className="text-emerald-400">In progress...</span>
            ) : (
              lastSyncedText
            )}
          </p>
        </div>
      </div>

      {/* Error state */}
      {hasError && syncLog.errorMessage && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 flex items-start gap-2">
          <AlertCircleIcon className="size-4 text-red-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-red-400">Sync failed</p>
            <p className="text-xs text-red-400/70 mt-0.5">{syncLog.errorMessage}</p>
          </div>
        </div>
      )}

      {/* Realtime badge */}
      <div className="flex items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3">
        <ZapIcon className="size-3.5 text-amber-400 flex-shrink-0" />
        <p className="text-xs text-zinc-400 leading-relaxed">
          Webhooks registered — inventory updates instantly when products change or orders are placed in your store.
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button
          onClick={handleResync}
          disabled={isSyncRunning || isDisconnecting}
          variant="outline"
          className="flex-1 h-9 rounded-xl border-white/10 text-zinc-300 hover:text-white hover:border-white/20 text-xs font-bold"
        >
          {isSyncRunning ? (
            <>
              <LoaderIcon className="size-3.5 animate-spin mr-1.5" />
              Syncing...
            </>
          ) : (
            <>
              <RefreshCwIcon className="size-3.5 mr-1.5" />
              Re-sync Now
            </>
          )}
        </Button>

        <Button
          onClick={handleDisconnect}
          disabled={isDisconnecting || isSyncRunning}
          variant="ghost"
          className={`h-9 rounded-xl text-xs font-bold transition-all ${
            confirmDisconnect
              ? "text-red-400 hover:text-red-300 border border-red-500/30 bg-red-500/5 hover:bg-red-500/10 px-4"
              : "text-zinc-500 hover:text-zinc-300 px-3"
          }`}
        >
          {isDisconnecting ? (
            <LoaderIcon className="size-3.5 animate-spin" />
          ) : (
            <>
              <Trash2Icon className="size-3.5 mr-1.5" />
              {confirmDisconnect ? "Confirm Disconnect" : "Disconnect"}
            </>
          )}
        </Button>

        {confirmDisconnect && !isDisconnecting && (
          <Button
            onClick={() => setConfirmDisconnect(false)}
            variant="ghost"
            className="h-9 px-3 rounded-xl text-xs text-zinc-500 hover:text-zinc-300"
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
};
