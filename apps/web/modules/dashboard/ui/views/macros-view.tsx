"use client";

import { useOrganization } from "@clerk/nextjs";
import { useMutation, usePaginatedQuery } from "convex/react";
import { api } from "@workspace/backend/_generated/api";
import { Id } from "@workspace/backend/_generated/dataModel";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@workspace/ui/lib/utils";

export const MacrosView = () => {
  const { organization } = useOrganization();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<Id<"macros"> | null>(null);

  const macros = usePaginatedQuery(
    api.private.macros.list,
    organization?.id ? { organizationId: organization.id } : "skip",
    { initialNumItems: 20 },
  );

  const createMacro = useMutation(api.private.macros.create);
  const updateMacro = useMutation(api.private.macros.update);
  const deleteMacro = useMutation(api.private.macros.remove);

  if (!organization?.id) {
    return (
      <div className="flex-1 flex items-center justify-center text-on-surface-variant">
        Select an organization to manage macros.
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-xl custom-scrollbar bg-black">
      <div className="max-w-4xl mx-auto space-y-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-xl">
          <div>
            <h1 className="text-headline-lg font-bold text-white mb-xs">Macros</h1>
            <p className="text-body-sm text-on-surface-variant">
              Canned responses your team can insert with a single click (or <kbd className="border border-outline-variant px-1 text-[10px]">/</kbd> shortcut).
            </p>
          </div>
          <button
            className="bg-white text-black px-md py-xs text-label-sm font-bold uppercase tracking-widest hover:bg-neutral-200 transition-colors"
            onClick={() => setIsCreating(true)}
          >
            + New Macro
          </button>
        </div>

        {/* Create form */}
        {isCreating && (
          <MacroForm
            onSave={async (data) => {
              try {
                await createMacro({ ...data, organizationId: organization.id });
                toast.success("Macro created");
                setIsCreating(false);
              } catch {
                toast.error("Failed to create macro");
              }
            }}
            onCancel={() => setIsCreating(false)}
          />
        )}

        {/* List */}
        {macros.status === "LoadingFirstPage" ? (
          <div className="text-on-surface-variant text-label-sm">Loading macros...</div>
        ) : macros.results.length === 0 && !isCreating ? (
          <div className="bg-[#111] border border-outline-variant p-xl text-center">
            <span className="material-symbols-outlined text-[48px] text-on-surface-variant mb-4 block">quick_reference</span>
            <p className="text-body-md text-white font-bold mb-xs">No macros yet</p>
            <p className="text-label-sm text-on-surface-variant">
              Create canned responses your team can use to reply faster.
            </p>
          </div>
        ) : (
          <div className="space-y-sm">
            {macros.results.map((macro) =>
              editingId === macro._id ? (
                <MacroForm
                  key={macro._id}
                  initial={macro}
                  onSave={async (data) => {
                    try {
                      await updateMacro({ macroId: macro._id, ...data });
                      toast.success("Macro updated");
                      setEditingId(null);
                    } catch {
                      toast.error("Failed to update macro");
                    }
                  }}
                  onCancel={() => setEditingId(null)}
                />
              ) : (
                <MacroCard
                  key={macro._id}
                  macro={macro}
                  onEdit={() => setEditingId(macro._id)}
                  onDelete={async () => {
                    try {
                      await deleteMacro({ macroId: macro._id });
                      toast.success("Macro deleted");
                    } catch {
                      toast.error("Failed to delete macro");
                    }
                  }}
                />
              )
            )}
            {macros.status === "CanLoadMore" && (
              <button
                className="w-full py-sm text-label-sm text-on-surface-variant border border-outline-variant hover:border-primary hover:text-primary transition-colors"
                onClick={() => macros.loadMore(10)}
              >
                Load more
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

interface MacroFormData {
  title: string;
  content: string;
  shortcut?: string;
  isShared: boolean;
}

function MacroForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: { title: string; content: string; shortcut?: string; isShared: boolean };
  onSave: (data: MacroFormData) => Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [shortcut, setShortcut] = useState(initial?.shortcut ?? "");
  const [isShared, setIsShared] = useState(initial?.isShared ?? true);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    try {
      await onSave({ title, content, shortcut: shortcut || undefined, isShared });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[#111] border border-primary/50 p-md space-y-md"
    >
      <div className="grid grid-cols-2 gap-md">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
            Title *
          </label>
          <input
            className="w-full bg-surface-container-low border border-outline-variant px-sm py-xs text-label-sm text-white focus:outline-none focus:border-primary"
            placeholder="e.g. Shipping delay response"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
            Shortcut (optional)
          </label>
          <input
            className="w-full bg-surface-container-low border border-outline-variant px-sm py-xs text-label-sm text-white focus:outline-none focus:border-primary font-mono"
            placeholder="e.g. /shipping"
            value={shortcut}
            onChange={(e) => setShortcut(e.target.value.startsWith("/") ? e.target.value : e.target.value ? `/${e.target.value}` : "")}
          />
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">
          Content *
        </label>
        <textarea
          className="w-full bg-surface-container-low border border-outline-variant px-sm py-xs text-label-sm text-white focus:outline-none focus:border-primary min-h-[120px] resize-y"
          placeholder="Type the canned response text..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <div
            className={cn(
              "w-8 h-4 rounded-full transition-colors relative",
              isShared ? "bg-primary" : "bg-surface-container-highest"
            )}
            onClick={() => setIsShared((v) => !v)}
          >
            <div
              className={cn(
                "absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform",
                isShared ? "translate-x-4" : "translate-x-0.5"
              )}
            />
          </div>
          <span className="text-label-sm text-on-surface-variant">
            {isShared ? "Shared with team" : "Private"}
          </span>
        </label>

        <div className="flex gap-sm">
          <button
            type="button"
            className="px-md py-xs text-label-sm text-on-surface-variant border border-outline-variant hover:border-primary hover:text-primary transition-colors"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-md py-xs text-label-sm font-bold bg-white text-black hover:bg-neutral-200 transition-colors disabled:opacity-50"
            disabled={saving || !title.trim() || !content.trim()}
          >
            {saving ? "Saving..." : initial ? "Update" : "Create"}
          </button>
        </div>
      </div>
    </form>
  );
}

function MacroCard({
  macro,
  onEdit,
  onDelete,
}: {
  macro: { _id: Id<"macros">; title: string; content: string; shortcut?: string; isShared: boolean };
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="bg-[#111] border border-outline-variant p-md group hover:border-primary/40 transition-colors">
      <div className="flex items-start justify-between gap-4 mb-sm">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-body-sm font-bold text-white truncate">{macro.title}</span>
          {macro.shortcut && (
            <code className="text-[10px] border border-outline-variant px-1 text-on-surface-variant font-mono">
              {macro.shortcut}
            </code>
          )}
          <span
            className={cn(
              "text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 border",
              macro.isShared
                ? "text-primary border-primary/40 bg-primary/10"
                : "text-on-surface-variant border-outline-variant"
            )}
          >
            {macro.isShared ? "Shared" : "Private"}
          </span>
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            className="text-on-surface-variant hover:text-primary transition-colors"
            onClick={onEdit}
            title="Edit macro"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
          </button>
          <button
            className="text-on-surface-variant hover:text-red-400 transition-colors"
            onClick={onDelete}
            title="Delete macro"
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
          </button>
        </div>
      </div>
      <p className="text-label-sm text-on-surface-variant line-clamp-3 whitespace-pre-wrap">
        {macro.content}
      </p>
    </div>
  );
}
