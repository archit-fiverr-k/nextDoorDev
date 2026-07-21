"use client";

import React, { useState, useTransition } from "react";
import { createCRMNoteAction, updateCRMNoteAction, deleteCRMNoteAction } from "@/actions/crm";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Edit2,
  Trash2,
  Calendar,
  X,
  Check,
  FileText,
  Lock,
  MessageSquare,
  Tag,
} from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface NoteItem {
  id: string;
  note: string;
  type: string;
  tags: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface PatientNotesManagerProps {
  pharmacyId: string;
  customerId: string;
  notes: NoteItem[];
}

export function PatientNotesManager({ pharmacyId, customerId, notes }: PatientNotesManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Form states
  const [newNote, setNewNote] = useState("");
  const [noteType, setNoteType] = useState<"CLINICAL" | "INTERNAL">("CLINICAL");
  const [noteTags, setNoteTags] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Filter notes in feed
  const [notesFeedFilter, setNotesFeedFilter] = useState<"all" | "CLINICAL" | "INTERNAL">("all");

  // Edit states
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [editingType, setEditingType] = useState<"CLINICAL" | "INTERNAL">("CLINICAL");
  const [editingTags, setEditingTags] = useState("");

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setError(null);
    startTransition(async () => {
      const res = await createCRMNoteAction(pharmacyId, customerId, newNote, noteType, noteTags);
      if (!res.success) {
        setError(res.error || "Failed to add note");
      } else {
        setNewNote("");
        setNoteTags("");
        router.refresh();
      }
    });
  };

  const handleStartEdit = (note: NoteItem) => {
    setEditingNoteId(note.id);
    setEditingContent(note.note);
    setEditingType(note.type as "CLINICAL" | "INTERNAL");
    setEditingTags(note.tags || "");
  };

  const handleSaveEdit = (id: string) => {
    if (!editingContent.trim()) return;

    setError(null);
    startTransition(async () => {
      const res = await updateCRMNoteAction(id, editingContent, editingType, editingTags);
      if (!res.success) {
        setError(res.error || "Failed to update note");
      } else {
        setEditingNoteId(null);
        router.refresh();
      }
    });
  };

  const handleDeleteNote = (id: string) => {
    if (!confirm("Are you sure you want to delete this log?")) return;

    startTransition(async () => {
      const res = await deleteCRMNoteAction(id);
      if (!res.success) {
        alert(res.error || "Failed to delete note");
      } else {
        router.refresh();
      }
    });
  };

  const filteredNotes = notes.filter((n) => {
    if (notesFeedFilter === "all") return true;
    return n.type === notesFeedFilter;
  });

  return (
    <div className="select-text space-y-4 text-slate-800">
      {/* Add note form */}
      <form
        onSubmit={handleAddNote}
        className="border-slate-150 space-y-3 rounded-2xl border bg-white p-4 shadow-sm"
      >
        {error && <p className="text-xs font-bold text-rose-600">{error}</p>}

        <div className="select-none space-y-2">
          {/* Note Type Radio Selector tabs */}
          <div className="flex space-x-2 text-[10px] font-extrabold">
            <button
              type="button"
              onClick={() => setNoteType("CLINICAL")}
              className={cn(
                "flex cursor-pointer items-center space-x-1 rounded-lg border px-2.5 py-1 transition-all",
                noteType === "CLINICAL"
                  ? "border-blue-200 bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
              )}
            >
              <FileText className="h-3 w-3" />
              <span>Clinical Record (Visible to Clinicians)</span>
            </button>
            <button
              type="button"
              onClick={() => setNoteType("INTERNAL")}
              className={cn(
                "flex cursor-pointer items-center space-x-1 rounded-lg border px-2.5 py-1 transition-all",
                noteType === "INTERNAL"
                  ? "border-amber-250 bg-amber-50 text-amber-700"
                  : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
              )}
            >
              <Lock className="h-3 w-3" />
              <span>Internal Memo (Staff Notes)</span>
            </button>
          </div>
        </div>

        <textarea
          rows={2}
          placeholder={
            noteType === "CLINICAL"
              ? "Record diagnosis, prescription updates, treatment outcomes..."
              : "Record private office details, billing logs, follow-up calls..."
          }
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          disabled={isPending}
          className="focus:ring-blue-550 w-full resize-none rounded-xl border border-slate-200 bg-white p-3 text-xs font-semibold focus:border-blue-500 focus:outline-none"
        />

        <div className="flex select-none items-center justify-between gap-3">
          {/* Tags selector input */}
          <div className="relative w-full max-w-xs">
            <Tag className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Add note tags (comma separated)..."
              value={noteTags}
              onChange={(e) => setNoteTags(e.target.value)}
              className="focus:border-blue-550 h-8 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-[10px] font-semibold focus:outline-none"
            />
          </div>

          <Button type="submit" isLoading={isPending} size="sm" className="h-8 shrink-0">
            <Plus className="mr-1 h-4 w-4" />
            Save Log
          </Button>
        </div>
      </form>

      {/* Feed Filters */}
      <div className="text-slate-550 flex w-fit select-none rounded-xl border border-slate-200/80 bg-slate-50 p-1 text-[10px] font-extrabold">
        <button
          onClick={() => setNotesFeedFilter("all")}
          className={cn(
            "cursor-pointer rounded-lg px-2.5 py-1 transition-all",
            notesFeedFilter === "all" ? "bg-white text-slate-900 shadow-sm" : "hover:text-slate-900"
          )}
        >
          All Notes ({notes.length})
        </button>
        <button
          onClick={() => setNotesFeedFilter("CLINICAL")}
          className={cn(
            "cursor-pointer rounded-lg px-2.5 py-1 transition-all",
            notesFeedFilter === "CLINICAL"
              ? "bg-white text-slate-900 shadow-sm"
              : "hover:text-slate-900"
          )}
        >
          Clinical Records Only
        </button>
        <button
          onClick={() => setNotesFeedFilter("INTERNAL")}
          className={cn(
            "cursor-pointer rounded-lg px-2.5 py-1 transition-all",
            notesFeedFilter === "INTERNAL"
              ? "bg-white text-slate-900 shadow-sm"
              : "hover:text-slate-900"
          )}
        >
          Internal Memos Only
        </button>
      </div>

      {/* List notes */}
      <div className="space-y-3">
        {filteredNotes.length === 0 ? (
          <div className="py-8 text-center text-xs italic text-slate-400">
            No notes match filter criteria.
          </div>
        ) : (
          filteredNotes.map((note) => {
            const isEditing = editingNoteId === note.id;
            const isClinical = note.type === "CLINICAL";

            return (
              <div
                key={note.id}
                className={cn(
                  "space-y-3 rounded-2xl border bg-white p-4 shadow-sm",
                  isClinical ? "border-blue-100" : "border-amber-100"
                )}
              >
                <div className="text-slate-450 flex select-none items-center justify-between text-[10px] font-bold">
                  <span className="flex items-center">
                    <Calendar className="mr-1 h-3.5 w-3.5" />
                    {format(new Date(note.createdAt), "MMM d, yyyy @ h:mm a")}
                    <span
                      className={cn(
                        "ml-2 rounded px-1.5 py-0.5 text-[8px] font-extrabold uppercase leading-none",
                        isClinical ? "text-blue-750 bg-blue-50" : "bg-amber-50 text-amber-700"
                      )}
                    >
                      {note.type}
                    </span>
                  </span>

                  <div className="flex items-center space-x-2">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => handleSaveEdit(note.id)}
                          className="cursor-pointer text-emerald-600 hover:text-emerald-700"
                          title="Save changes"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setEditingNoteId(null)}
                          className="hover:text-slate-655 cursor-pointer text-slate-400"
                          title="Cancel edit"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleStartEdit(note)}
                          className="cursor-pointer text-slate-400 hover:text-slate-700"
                          title="Edit note"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="cursor-pointer text-rose-500 hover:text-rose-700"
                          title="Delete note"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <div className="space-y-2">
                    <div className="flex select-none space-x-2 text-[9px] font-extrabold">
                      <button
                        type="button"
                        onClick={() => setEditingType("CLINICAL")}
                        className={cn(
                          "cursor-pointer rounded border px-2 py-0.5",
                          editingType === "CLINICAL"
                            ? "border-blue-200 bg-blue-50 text-blue-700"
                            : "border-slate-200 bg-white"
                        )}
                      >
                        Clinical
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingType("INTERNAL")}
                        className={cn(
                          "cursor-pointer rounded border px-2 py-0.5",
                          editingType === "INTERNAL"
                            ? "border-amber-200 bg-amber-50 text-amber-700"
                            : "border-slate-200 bg-white"
                        )}
                      >
                        Internal
                      </button>
                    </div>

                    <textarea
                      rows={2}
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-semibold focus:border-blue-500 focus:outline-none"
                    />

                    <input
                      type="text"
                      placeholder="Note tags (comma separated)..."
                      value={editingTags}
                      onChange={(e) => setEditingTags(e.target.value)}
                      className="h-8 w-full rounded-lg border border-slate-200 px-2.5 text-[10px] font-semibold focus:outline-none"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="whitespace-pre-wrap text-xs font-semibold leading-relaxed text-slate-700 dark:text-zinc-300">
                      {note.note}
                    </p>

                    {note.tags && (
                      <div className="flex select-none flex-wrap gap-1">
                        {note.tags.split(",").map((t) => (
                          <span
                            key={t}
                            className="text-slate-550 border-slate-150/40 rounded border bg-slate-50 px-1.5 py-0.5 text-[8px] font-extrabold uppercase"
                          >
                            {t.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
