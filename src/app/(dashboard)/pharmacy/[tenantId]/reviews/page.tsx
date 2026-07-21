"use client";

import React, { useState } from "react";
import {
  Star,
  MessageSquare,
  Send,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Filter,
  Share2,
  ExternalLink,
  ThumbsUp,
} from "lucide-react";

interface ReviewsPageProps {
  params: {
    tenantId: string;
  };
}

export default function ReviewsPage({ params }: ReviewsPageProps) {
  const [activeFilter, setActiveFilter] = useState<"all" | "google" | "platform">("all");
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [submittedReplies, setSubmittedReplies] = useState<{ [key: string]: string }>({});

  const mockReviews = [
    {
      id: "rev-1",
      patient: "Emily Watson",
      source: "Google Reviews",
      rating: 5,
      date: "2 days ago",
      service: "Yellow Fever & Travel Vaccination",
      comment:
        "Outstanding experience at NextDoorClinic! Dr. Rivera explained all travel advisories thoroughly and the vaccination was fast and painless. Highly recommended!",
      status: "APPROVED",
    },
    {
      id: "rev-2",
      patient: "James Sterling",
      source: "NextDoorClinic Platform",
      rating: 5,
      date: "1 week ago",
      service: "Ear Wax Removal (Microsuction)",
      comment:
        "Nurse Vance was super gentle and professional. Relief was instantaneous after microsuction. Clean clinic and zero waiting time.",
      status: "APPROVED",
    },
    {
      id: "rev-3",
      patient: "Michael O'Connor",
      source: "Google Reviews",
      rating: 4,
      date: "2 weeks ago",
      service: "Blood Glucose & Lipid Screening",
      comment:
        "Very efficient service. Results delivered to my email within 30 minutes. Parking outside was slightly busy.",
      status: "APPROVED",
    },
  ];

  const handleReplySubmit = (id: string) => {
    if (replyText[id]) {
      setSubmittedReplies((prev) => ({ ...prev, [id]: replyText[id] }));
      setReplyText((prev) => ({ ...prev, [id]: "" }));
    }
  };

  return (
    <div className="select-text space-y-6">
      {/* Header & Stats Banner */}
      <div className="space-y-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Patient Reviews & Reputation Management
            </h1>
            <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
              Monitor customer feedback from Google Reviews and NextDoorClinic platform, respond to
              patients, and request reviews.
            </p>
          </div>

          <button
            onClick={() =>
              alert(
                "Automated SMS & Email review request sent to 14 patients who completed visits today."
              )
            }
            className="flex items-center space-x-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white transition-opacity hover:opacity-90 dark:bg-slate-100 dark:text-slate-950"
          >
            <Send className="h-4 w-4" />
            <span>Send Review Request SMS/Email</span>
          </button>
        </div>

        {/* Analytics cards grid */}
        <div className="grid grid-cols-1 gap-4 border-t border-slate-100 pt-2 dark:border-zinc-900 sm:grid-cols-3">
          <div className="flex items-center justify-between rounded-xl border border-amber-200/60 bg-amber-50/50 p-4 dark:border-amber-900/40 dark:bg-amber-950/20">
            <div>
              <span className="text-[10px] font-extrabold uppercase text-amber-800 dark:text-amber-400">
                Average Rating
              </span>
              <div className="mt-1 flex items-baseline space-x-2">
                <span className="text-2xl font-extrabold text-amber-900 dark:text-amber-200">
                  4.9
                </span>
                <div className="flex text-amber-500">{"★".repeat(5)}</div>
              </div>
              <span className="text-[10px] text-amber-700 dark:text-amber-400">
                Based on 148 verified patient reviews
              </span>
            </div>
            <Star className="h-8 w-8 text-amber-400 opacity-80" />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-200/60 bg-slate-50 p-4 dark:border-zinc-800/40 dark:bg-zinc-900/40">
            <div>
              <span className="text-[10px] font-extrabold uppercase text-slate-500">
                Total Reviews
              </span>
              <p className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-slate-50">148</p>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                +18 this month
              </span>
            </div>
            <MessageSquare className="h-8 w-8 text-slate-400 opacity-80" />
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-200/60 bg-slate-50 p-4 dark:border-zinc-800/40 dark:bg-zinc-900/40">
            <div>
              <span className="text-[10px] font-extrabold uppercase text-slate-500">
                Response Rate
              </span>
              <p className="mt-1 text-2xl font-extrabold text-slate-900 dark:text-slate-50">
                96.4%
              </p>
              <span className="text-[10px] text-slate-500">Avg response time: 2 hours</span>
            </div>
            <ThumbsUp className="h-8 w-8 text-slate-400 opacity-80" />
          </div>
        </div>
      </div>

      {/* Reviews feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex space-x-2 text-xs font-semibold">
            {(["all", "google", "platform"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`rounded-xl px-3 py-1.5 capitalize transition-all ${
                  activeFilter === filter
                    ? "bg-slate-900 font-bold text-white shadow-sm dark:bg-slate-100 dark:text-slate-950"
                    : "border border-slate-200 bg-white text-slate-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
                }`}
              >
                {filter === "all"
                  ? "All Reviews"
                  : filter === "google"
                    ? "Google Reviews"
                    : "Platform Reviews"}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {mockReviews.map((rev) => (
            <div
              key={rev.id}
              className="space-y-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-zinc-800/80 dark:bg-zinc-950"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/60 bg-slate-100 text-sm font-bold text-slate-800 dark:border-zinc-800/60 dark:bg-zinc-900 dark:text-zinc-200">
                    {rev.patient[0]}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-50">
                      {rev.patient}
                    </h4>
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500">
                      {rev.service} • {rev.date}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="rounded-md border border-slate-200/60 bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:border-zinc-800/60 dark:bg-zinc-900 dark:text-zinc-300">
                    {rev.source}
                  </span>
                  <div className="flex text-xs text-amber-400">{"★".repeat(rev.rating)}</div>
                </div>
              </div>

              <p className="text-xs font-medium leading-relaxed text-slate-700 dark:text-zinc-300">
                &quot;{rev.comment}&quot;
              </p>

              {/* Reply Section */}
              <div className="space-y-3 border-t border-slate-100 pt-3 dark:border-zinc-900">
                {submittedReplies[rev.id] ? (
                  <div className="space-y-1 rounded-xl border border-slate-200/60 bg-slate-50 p-3 dark:border-zinc-800/40 dark:bg-zinc-900/60">
                    <span className="block text-[10px] font-bold text-teal-700 dark:text-teal-400">
                      Pharmacy Response (Official)
                    </span>
                    <p className="text-xs text-slate-800 dark:text-zinc-200">
                      {submittedReplies[rev.id]}
                    </p>
                  </div>
                ) : (
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Write an official response to patient..."
                      value={replyText[rev.id] || ""}
                      onChange={(e) => setReplyText({ ...replyText, [rev.id]: e.target.value })}
                      className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-teal-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-slate-100"
                    />
                    <button
                      onClick={() => handleReplySubmit(rev.id)}
                      className="flex items-center space-x-1 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white dark:bg-slate-100 dark:text-slate-950"
                    >
                      <Send className="h-3 w-3" />
                      <span>Reply</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
