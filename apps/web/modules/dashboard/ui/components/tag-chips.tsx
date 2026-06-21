"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@workspace/backend/_generated/api";
import { Id } from "@workspace/backend/_generated/dataModel";
import { useOrganization } from "@clerk/nextjs";
import { cn } from "@workspace/ui/lib/utils";
import { toast } from "sonner";

const TAG_COLORS = [
  "#6366f1", // indigo
  "#f59e0b", // amber
  "#10b981", // emerald
  "#ef4444", // red
  "#8b5cf6", // violet
  "#3b82f6", // blue
  "#f97316", // orange
  "#14b8a6", // teal
];

function getTagColor(tag: string): string {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length]!;
}

interface TagChipsProps {
  conversationId: Id<"conversations">;
}

export const TagChips = ({ conversationId }: TagChipsProps) => {
  const { organization } = useOrganization();
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const tags = useQuery(api.private.conversationTags.listTagsForConversation, {
    conversationId,
  });

  const orgTags = useQuery(
    api.private.conversationTags.listTagsForOrg,
    organization?.id ? { organizationId: organization.id } : "skip",
  );

  const addTag = useMutation(api.private.conversationTags.addTag);
  const removeTag = useMutation(api.private.conversationTags.removeTag);

  const existingTagNames = new Set((tags ?? []).map((t) => t.tag.toLowerCase()));

  const suggestions = (orgTags ?? []).filter(
    (t) =>
      t.toLowerCase().includes(inputValue.toLowerCase()) &&
      !existingTagNames.has(t.toLowerCase())
  );

  const handleAdd = async (tagName: string) => {
    const trimmed = tagName.trim();
    if (!trimmed || existingTagNames.has(trimmed.toLowerCase())) return;

    setInputValue("");
    setShowSuggestions(false);

    try {
      await addTag({ conversationId, tag: trimmed });
    } catch (err) {
      toast.error("Failed to add tag");
      console.error(err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd(inputValue);
    } else if (e.key === "Escape") {
      setInputValue("");
      setShowSuggestions(false);
    }
  };

  const handleRemove = async (tagId: Id<"conversationTags">) => {
    try {
      await removeTag({ tagId });
    } catch (err) {
      toast.error("Failed to remove tag");
      console.error(err);
    }
  };

  return (
    <div className="space-y-2">
      {/* Existing tags */}
      <div className="flex flex-wrap gap-1.5">
        {(tags ?? []).map((tag) => {
          const color = tag.color ?? getTagColor(tag.tag);
          return (
            <span
              key={tag._id}
              className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-sm group"
              style={{
                color,
                border: `1px solid ${color}40`,
                backgroundColor: `${color}15`,
              }}
            >
              {tag.tag}
              <button
                className="opacity-0 group-hover:opacity-100 transition-opacity ml-0.5 hover:text-red-400"
                onClick={() => handleRemove(tag._id)}
                title="Remove tag"
              >
                <span className="material-symbols-outlined text-[12px]">close</span>
              </button>
            </span>
          );
        })}

        {/* Input */}
        <div className="relative">
          <input
            ref={inputRef}
            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border border-dashed border-outline-variant bg-transparent text-on-surface-variant placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary w-24"
            placeholder="+ Add tag"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setShowSuggestions(e.target.value.length > 0);
            }}
            onFocus={() => setShowSuggestions(inputValue.length > 0)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            onKeyDown={handleKeyDown}
          />

          {/* Suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-surface-container-high border border-outline-variant shadow-lg min-w-[120px] max-h-40 overflow-y-auto">
              {suggestions.map((s) => (
                <button
                  key={s}
                  className="w-full text-left px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-on-surface hover:bg-surface-container-highest hover:text-primary transition-colors"
                  onMouseDown={() => handleAdd(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
