"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@workspace/backend/_generated/api";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@workspace/ui/components/dialog";
import { toast } from "sonner";
import { Id } from "@workspace/backend/_generated/dataModel";

export const ApiKeysView = () => {
  const apiKeys = useQuery(api.system.apiKeys.list);
  const createKey = useMutation(api.system.apiKeys.create);
  const revokeKey = useMutation(api.system.apiKeys.remove);

  const [isCreating, setIsCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      const result = await createKey({ name: newKeyName || "Unnamed Key" });
      setGeneratedKey(result.rawKey);
    } catch (error: any) {
      toast.error(`Failed to create API key: ${error.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCloseDialog = () => {
    setShowCreateDialog(false);
    setNewKeyName("");
    setGeneratedKey(null);
  };

  const handleRevoke = async (id: Id<"apiKeys">) => {
    if (!confirm("Are you sure you want to revoke this API key? This action cannot be undone.")) return;
    try {
      await revokeKey({ id });
      toast.success("API key revoked");
    } catch (error: any) {
      toast.error(`Failed to revoke key: ${error.message}`);
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-primary">API Keys</h2>
          <p className="text-sm text-on-surface-variant">Manage API keys for integrating Zephyra with your own systems.</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={(open) => {
          if (!open) handleCloseDialog();
          else setShowCreateDialog(true);
        }}>
          <DialogTrigger asChild>
            <Button>Create New Key</Button>
          </DialogTrigger>
          <DialogContent className="bg-surface-container border-outline-variant text-on-surface sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create API Key</DialogTitle>
            </DialogHeader>
            {!generatedKey ? (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm text-on-surface-variant">Key Name</label>
                  <Input 
                    value={newKeyName} 
                    onChange={(e) => setNewKeyName(e.target.value)} 
                    placeholder="e.g. Zapier Integration"
                    className="bg-surface border-outline-variant" 
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={handleCloseDialog}>Cancel</Button>
                  <Button onClick={handleCreate} disabled={isCreating || !newKeyName.trim()}>
                    {isCreating ? "Creating..." : "Create Key"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 py-4">
                <div className="bg-primary/10 border border-primary text-primary p-4 rounded text-sm">
                  <p className="font-bold mb-2">Save your API key now</p>
                  <p>This is the only time you will be able to see it. If you lose it, you will need to generate a new one.</p>
                </div>
                <div className="relative">
                  <Input 
                    value={generatedKey} 
                    readOnly 
                    className="bg-surface border-outline-variant font-mono text-sm pr-20" 
                  />
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="absolute right-1 top-1 h-8"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedKey);
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

      <div className="border border-outline-variant rounded bg-surface-container-low overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-container-highest text-on-surface-variant">
            <tr>
              <th className="p-4 font-semibold uppercase text-xs tracking-wider">Name</th>
              <th className="p-4 font-semibold uppercase text-xs tracking-wider">Prefix</th>
              <th className="p-4 font-semibold uppercase text-xs tracking-wider">Created</th>
              <th className="p-4 font-semibold uppercase text-xs tracking-wider">Last Used</th>
              <th className="p-4 font-semibold uppercase text-xs tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {apiKeys === undefined ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-on-surface-variant">Loading...</td>
              </tr>
            ) : apiKeys.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-on-surface-variant">
                  No API keys created yet.
                </td>
              </tr>
            ) : (
              apiKeys.map((key) => (
                <tr key={key._id} className="hover:bg-surface-container-highest/50 transition-colors">
                  <td className="p-4 font-medium text-on-surface">{key.name}</td>
                  <td className="p-4 font-mono text-on-surface-variant">{key.keyPrefix}...</td>
                  <td className="p-4 text-on-surface-variant">
                    {new Date(key.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-on-surface-variant">
                    {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : "Never"}
                  </td>
                  <td className="p-4 text-right">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-error hover:text-error hover:bg-error/10"
                      onClick={() => handleRevoke(key._id)}
                    >
                      Revoke
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
