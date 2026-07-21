"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateCustomerTagsAction } from "@/actions/crm";
import { Button } from "@/components/ui/button";
import { Tags, Save, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PatientTagsEditorProps {
  customerId: string;
  initialTags: string;
}

export function PatientTagsEditor({ customerId, initialTags }: PatientTagsEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const [tagsInput, setTagsInput] = useState(initialTags);
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    setError(null);
    startTransition(async () => {
      const res = await updateCustomerTagsAction(customerId, tagsInput);
      if (res.success) {
        setIsEditing(false);
        router.refresh();
      } else {
        setError(res.error || "Failed to update tags");
      }
    });
  };

  if (isEditing) {
    return (
      <div className="flex select-none flex-col space-y-1 duration-100 animate-in fade-in">
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="e.g. Diabetics, High Risk, Adult"
            className="focus:ring-blue-550 h-8 w-60 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold focus:border-blue-500 focus:outline-none"
            disabled={isPending}
          />
          <button
            onClick={handleSave}
            disabled={isPending}
            className="cursor-pointer rounded-lg p-1.5 text-emerald-600 hover:bg-slate-100"
            title="Save tags"
          >
            <Check className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              setIsEditing(false);
              setTagsInput(initialTags);
            }}
            className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
            title="Cancel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {error && <span className="text-[10px] font-bold text-rose-600">{error}</span>}
      </div>
    );
  }

  return (
    <div className="flex select-none items-center space-x-2">
      {initialTags ? (
        <div className="flex flex-wrap gap-1">
          {initialTags.split(",").map((t) => (
            <span
              key={t}
              className="text-blue-750 rounded border border-blue-100 bg-blue-50/60 px-2 py-0.5 text-[9px] font-extrabold uppercase"
            >
              {t.trim()}
            </span>
          ))}
        </div>
      ) : (
        <span className="text-[10px] font-medium italic text-slate-400">
          No patient tags assigned
        </span>
      )}
      <button
        onClick={() => setIsEditing(true)}
        className="inline-flex cursor-pointer items-center justify-center rounded-lg p-1.5 text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900"
        title="Edit patient tags"
      >
        <Tags className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
